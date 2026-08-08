import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { PhaseTwoApi } from '../../phase-two/phase-two-api.service';
import { ChatMessage, ChatSession } from '../../phase-two/phase-two.models';
import { markdownToHtml } from '../../../../shared/utils/markdown-to-html';

@Component({
  selector: 'app-ai-agent',
  imports: [FormsModule],
  templateUrl: './ai-agent.html',
  styleUrl: './ai-agent.css',
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
  private readonly messagesViewport = viewChild<ElementRef<HTMLElement>>('messagesViewport');
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
          this.scrollToLatest();
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
    const userId = -Date.now();
    const assistantId = userId - 1;
    this.messages.update((messages) => [
      ...messages,
      { id: userId, role: 'المستخدم', content, status: 'مكتمل', createdAt: new Date().toISOString() },
      { id: assistantId, role: 'المساعد', content: '', status: 'جارٍ الإرسال', createdAt: new Date().toISOString() },
    ]);
    this.scrollToLatest();

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
        this.scrollToLatest();
      }, images);
      this.loadMessages(session.id);
      this.loadSessions(false);
    } catch {
      this.error.set('تعذر إكمال رد عم خضر. أعد المحاولة بعد لحظات.');
      this.messages.update((messages) => messages.map((message) =>
        message.id === assistantId
          ? { ...message, content: 'تعذر إنشاء الرد حاليًا.', status: 'فشل' }
          : message));
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
  public toggleVoice(): void { const Speech = (globalThis as any).SpeechRecognition ?? (globalThis as any).webkitSpeechRecognition; if (!Speech) { this.error.set('المتصفح لا يدعم الإدخال الصوتي.'); return; } if (this.recording()) { this.recognition?.stop(); return; } this.recognition = new Speech(); this.recognition.lang = 'ar-EG'; this.recognition.continuous = false; this.recognition.onresult = (event: any) => { this.messageInput = `${this.messageInput} ${event.results[0][0].transcript}`.trim(); }; this.recognition.onend = () => this.recording.set(false); this.recording.set(true); this.recognition.start(); }
  private toBase64(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = reject; reader.readAsDataURL(file); }); }

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
              // The `next` handler runs before `finalize`, so loading is still true
              // here. Release it before creating the initial session; otherwise
              // createSession's guard leaves the composer disabled indefinitely.
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
          this.scrollToLatest();
        },
        error: () => this.error.set('تعذر تحميل سجل المحادثة.'),
      });
  }

  private scrollToLatest(): void {
    queueMicrotask(() => {
      const viewport = this.messagesViewport()?.nativeElement;
      if (!viewport) return;
      if (typeof viewport.scrollTo === 'function') {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      } else {
        // JSDOM and older embedded browsers do not implement Element.scrollTo.
        viewport.scrollTop = viewport.scrollHeight;
      }
    });
  }
}
