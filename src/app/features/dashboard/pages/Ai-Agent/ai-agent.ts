import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { PhaseTwoApi } from '../../phase-two/phase-two-api.service';
import { ChatMessage, ChatSession } from '../../phase-two/phase-two.models';

@Component({
  selector: 'app-ai-agent',
  imports: [FormsModule],
  templateUrl: './ai-agent.html',
})
export class AiAgent {
  private readonly api = inject(PhaseTwoApi);
  private readonly destroyRef = inject(DestroyRef);

  public readonly sessions = signal<ChatSession[]>([]);
  public readonly selectedSession = signal<ChatSession | null>(null);
  public readonly messages = signal<ChatMessage[]>([]);
  public readonly loading = signal(true);
  public readonly sending = signal(false);
  public readonly error = signal<string | null>(null);
  public messageInput = '';

  public readonly suggestions = [
    'لخّص لي حالة كل خطط التصدير وأهم المخاطر الحالية',
    'ما المهام المتأخرة التي تحتاج تدخلي اليوم؟',
    'قارن تكاليف الخطط وحدد أعلى بنود الإنفاق',
    'ما الذي يجب مراجعته قبل تجهيز الشحنة القادمة؟',
  ];

  public constructor() {
    this.loadSessions();
  }

  public createSession(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.api.createFarmSession()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (session) => {
          this.sessions.update((sessions) => [session, ...sessions]);
          this.selectedSession.set(session);
          this.messages.set([]);
        },
        error: () => this.error.set('تعذر إنشاء محادثة جديدة.'),
      });
  }

  public selectSession(session: ChatSession): void {
    if (this.selectedSession()?.id === session.id) return;
    this.selectedSession.set(session);
    this.loadMessages(session.id);
  }

  public useSuggestion(suggestion: string): void {
    this.messageInput = suggestion;
  }

  public async send(): Promise<void> {
    const content = this.messageInput.trim();
    const session = this.selectedSession();
    if (!content || !session || this.sending()) return;

    this.messageInput = '';
    this.sending.set(true);
    this.error.set(null);
    const userId = -Date.now();
    const assistantId = userId - 1;
    this.messages.update((messages) => [
      ...messages,
      { id: userId, role: 'المستخدم', content, status: 'مكتمل', createdAt: new Date().toISOString() },
      { id: assistantId, role: 'المساعد', content: '', status: 'جارٍ الإرسال', createdAt: new Date().toISOString() },
    ]);

    try {
      await this.api.streamFarmMessage(session.id, content, (event) => {
        this.messages.update((messages) => messages.map((message) => {
          if (message.id !== assistantId) return message;
          return {
            ...message,
            id: event.messageId ?? message.id,
            content: event.event === 'delta'
              ? message.content + (event.delta ?? '')
              : (event.content ?? message.content),
            status: event.status,
          };
        }));
      });
      this.loadMessages(session.id);
      this.loadSessions(false);
    } catch {
      this.error.set('تعذر إكمال رد المستشار. أعد المحاولة بعد لحظات.');
      this.messages.update((messages) => messages.map((message) =>
        message.id === assistantId
          ? { ...message, content: 'تعذر إنشاء الرد حاليًا.', status: 'فشل' }
          : message));
    } finally {
      this.sending.set(false);
    }
  }

  public formatSessionDate(value: string | null): string {
    if (!value) return 'محادثة جديدة';
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(value));
  }

  private loadSessions(showLoading = true): void {
    if (showLoading) this.loading.set(true);
    this.api.farmSessions()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (sessions) => {
          this.sessions.set(sessions);
          if (!this.selectedSession()) {
            if (sessions[0]) {
              this.selectedSession.set(sessions[0]);
              this.loadMessages(sessions[0].id);
            } else {
              this.createSession();
            }
          }
        },
        error: () => this.error.set('تعذر تحميل محادثات المزرعة.'),
      });
  }

  private loadMessages(sessionId: number): void {
    this.loading.set(true);
    this.api.farmMessages(sessionId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => this.messages.set(page.items),
        error: () => this.error.set('تعذر تحميل سجل المحادثة.'),
      });
  }
}
