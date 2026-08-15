import { Component, DestroyRef, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { PhaseTwoApi } from '../../phase-two/phase-two-api.service';
import { ChatMessage, ChatSession } from '../../phase-two/phase-two.models';
import { markdownToHtml } from '../../../../shared/utils/markdown-to-html';
import { UserBudgetStatus } from '../../../../core/api/api.models';

@Component({
  selector: 'app-ai-agent',
  imports: [FormsModule],
  templateUrl: './ai-agent.html',
  styleUrls: ['./ai-agent.css', './ai-agent-chat.css', './ai-agent-responsive.css'],
})
export class AiAgent implements OnInit {
  private readonly api = inject(PhaseTwoApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messagesViewport = viewChild<ElementRef<HTMLElement>>('messagesViewport');

  public readonly sessions = signal<ChatSession[]>([]);
  public readonly selectedSession = signal<ChatSession | null>(null);
  public readonly messages = signal<ChatMessage[]>([]);
  public readonly loading = signal(true);
  public readonly sending = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly historyCollapsed = signal(false);
  public readonly budgetStatus = signal<UserBudgetStatus | null>(null);

  public readonly limitRequestSubmitted = signal(false);
  public readonly submittingLimitRequest = signal(false);
  public limitContactName = '';
  public limitContactPhone = '';

  public messageInput = '';
  public selectedImages: File[] = [];
  public readonly recording = signal(false);
  private recognition: any;

  public readonly suggestions = [
    'هل المادة الفعالة لهذا المبيد معتمدة للتصدير؟ وما الـ MRL للمحصول؟',
    'لخّص لي حالة خطط التصدير وأهم المخاطر الحالية',
    'ما المهام المتأخرة التي تحتاج تدخلي اليوم؟',
    'ما الذي يجب مراجعته قبل تجهيز الشحنة القادمة؟',
  ];

  public ngOnInit(): void {
    this.loadSessions();
    this.loadBudgetStatus();
  }

  public loadBudgetStatus(): void {
    this.api.budgetStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => this.budgetStatus.set(status),
        error: () => {},
      });
  }

  public submitLimitRequest(): void {
    if (this.submittingLimitRequest() || !this.limitContactName.trim() || !this.limitContactPhone.trim()) return;
    this.submittingLimitRequest.set(true);
    this.api.submitLimitRequest(this.limitContactName.trim(), this.limitContactPhone.trim())
      .pipe(
        finalize(() => this.submittingLimitRequest.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.limitRequestSubmitted.set(true),
        error: () => this.error.set('تعذر إرسال طلب الكوتا. يرجى المحاولة لاحقاً.'),
      });
  }

  public createSession(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
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
          this.scrollToNewestMessageStart();
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

  public toggleHistory(): void {
    this.historyCollapsed.update((collapsed) => !collapsed);
  }

  public displaySessionTitle(title: string | null | undefined): string {
    if (!title || title === 'مستشار المزرعة' || title === 'Farm advisor') return 'محادثة مع عم خضر';
    return title;
  }

  public isUserMessage(message: ChatMessage): boolean {
    return message.role === 'المستخدم';
  }

  public renderAssistantMessage(content: string): string {
    return markdownToHtml(content);
  }

  public onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    void this.send();
  }

  public async send(): Promise<void> {
    const content = this.messageInput.trim();
    const session = this.selectedSession();
    if ((!content && !this.selectedImages.length) || !session || this.sending()) return;
    const questionTitle = content && !this.messages().some((message) => this.isUserMessage(message))
      ? this.buildQuestionTitle(content)
      : null;
    const selectedImageFiles = [...this.selectedImages];
    let images: Array<{ fileName: string; contentType: string; dataBase64: string }>;
    try {
      images = await Promise.all(this.selectedImages.map(async (file) => ({
        fileName: file.name,
        contentType: file.type,
        dataBase64: await this.toBase64(file),
      })));
    } catch {
      this.error.set('تعذر قراءة الصورة المرفقة. يرجى اختيار صورة أخرى.');
      return;
    }
    this.selectedImages = [];

    this.messageInput = '';
    this.sending.set(true);
    this.error.set(null);
    if (questionTitle) this.updateSessionTitle(session.id, questionTitle);
    const userId = -Date.now();
    const assistantId = userId - 1;
    this.messages.update((messages) => [
      ...messages,
      { id: userId, role: 'المستخدم', content, status: 'مكتمل', createdAt: new Date().toISOString() },
      { id: assistantId, role: 'المساعد', content: '', status: 'جارٍ الإرسال', createdAt: new Date().toISOString() },
    ]);
    this.scrollToNewestMessageStart();

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
        this.scrollToNewestMessageStart();
      }, images);
      this.loadMessages(session.id);
      this.loadSessions(false);
    } catch {
      this.messageInput = content;
      this.selectedImages = selectedImageFiles;
      this.error.set('تعذر الاتصال بعم خضر بعد عدة محاولات. رسالتك محفوظة وجاهزة لإعادة الإرسال.');
      this.messages.update((messages) => messages.filter((message) =>
        message.id !== userId && message.id !== assistantId));
      if (questionTitle) this.loadSessions(false);
    } finally {
      this.sending.set(false);
    }
  }

  public selectImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    const maximumImageBytes = 10 * 1024 * 1024;
    const selected = Array.from(input.files ?? []);
    const incoming = selected.filter((file) => allowedTypes.has(file.type) && file.size <= maximumImageBytes);
    if (incoming.length !== selected.length) {
      this.error.set('الصور المدعومة هي JPG وPNG وGIF وWebP، وبحد أقصى 10 ميجابايت للصورة.');
    }
    this.selectedImages = [...this.selectedImages, ...incoming]
      .filter((file, index, items) => items.findIndex((candidate) => candidate.name === file.name && candidate.size === file.size) === index)
      .slice(0, 4);
    input.value = '';
  }

  public removeImage(index: number): void {
    this.selectedImages = this.selectedImages.filter((_, imageIndex) => imageIndex !== index);
  }

  public toggleVoice(): void {
    const Speech = (globalThis as any).SpeechRecognition ?? (globalThis as any).webkitSpeechRecognition;
    if (!Speech) {
      this.error.set('المتصفح لا يدعم الإدخال الصوتي.');
      return;
    }
    if (this.recording()) {
      this.recognition?.stop();
      return;
    }
    this.recognition = new Speech();
    this.recognition.lang = 'ar-EG';
    this.recognition.continuous = false;
    this.recognition.onresult = (event: any) => {
      this.messageInput = `${this.messageInput} ${event.results[0][0].transcript}`.trim();
    };
    this.recognition.onend = () => this.recording.set(false);
    this.recording.set(true);
    this.recognition.start();
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
              this.loading.set(false);
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
        next: (page) => {
          this.messages.set(page.items);
          this.scrollToNewestMessageStart();
        },
        error: () => this.error.set('تعذر تحميل سجل المحادثة.'),
      });
  }

  private scrollToNewestMessageStart(): void {
    const scroll = () => {
      const viewport = this.messagesViewport()?.nativeElement;
      if (!viewport) return;
      const newestMessage = viewport.querySelector<HTMLElement>('.message-row:last-child');
      if (!newestMessage) {
        viewport.scrollTop = 0;
        return;
      }

      const viewportTop = viewport.getBoundingClientRect().top;
      const messageTop = newestMessage.getBoundingClientRect().top;
      viewport.scrollTop += messageTop - viewportTop;
    };

    queueMicrotask(() => {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(scroll);
      else setTimeout(scroll);
    });
  }

  private buildQuestionTitle(content: string): string {
    return content.replace(/\s+/g, ' ').trim().slice(0, 200);
  }

  private updateSessionTitle(sessionId: number, title: string): void {
    this.sessions.update((sessions) => sessions.map((session) =>
      session.id === sessionId ? { ...session, title } : session));
    this.selectedSession.update((session) =>
      session?.id === sessionId ? { ...session, title } : session);
  }
}
