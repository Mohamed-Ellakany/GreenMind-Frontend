import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDetails } from '@core/api/api.models';
import { PlantGrowthLoader } from '@shared/components/plant-growth-loader/plant-growth-loader';
import { PhaseTwoApi } from './phase-two-api.service';
import { ChatHistoryPage, ChatMessage, ChatSession, TaskProposal } from './phase-two.models';

@Component({
  selector: 'app-agricultural-advisor-page',
  imports: [FormsModule, RouterLink, PlantGrowthLoader],
  templateUrl: './agricultural-advisor-page.html',
  styleUrls: ['./plan-page.shared.css', './agricultural-advisor-page.css'],
})
export class AgriculturalAdvisorPage {
  private readonly api = inject(PhaseTwoApi);
  private readonly coreApi = inject(GreenmindApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  public readonly planId = Number(this.route.snapshot.paramMap.get('id'));
  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly chatSession = signal<ChatSession | null>(null);
  public readonly chatMessages = signal<ChatMessage[]>([]);
  public readonly chatSending = signal(false);
  public readonly selectedProposal = signal<TaskProposal | null>(null);
  public readonly proposalLoading = signal(false);
  private readonly messagesViewport = viewChild<ElementRef<HTMLElement>>('messagesViewport');
  private readonly composerInput = viewChild<ElementRef<HTMLTextAreaElement>>('composerInput');
  public chatInput = this.route.snapshot.queryParamMap.get('prompt') === 'disease'
    ? 'راجع معي آخر حالة صحية للمحصول، وما الإجراء الأكثر أولوية الآن؟'
    : '';
  public selectedImages: File[] = [];
  public readonly recording = signal(false);
  private recognition: any;

  public readonly suggestions = [
    'هل المادة الفعالة للمبيد معتمدة؟ وما حد MRL للمحصول؟',
    'لخّص لي أهم المخاطر الحالية في الخطة',
    'ما المهام المتأخرة التي تحتاج تدخلي؟',
  ];

  public constructor() {
    if (!Number.isInteger(this.planId) || this.planId <= 0) {
      this.loading.set(false);
      this.error.set('معرّف خطة التصدير غير صالح.');
      return;
    }
    this.load();
  }

  public async sendChat(): Promise<void> {
    const content = this.chatInput.trim();
    const session = this.chatSession();
    if ((!content && !this.selectedImages.length) || !session || this.chatSending()) return;
    const images = await Promise.all(this.selectedImages.map(async (file) => ({ fileName: file.name, contentType: file.type, dataBase64: await this.toBase64(file) })));
    this.selectedImages = [];
    this.chatInput = '';
    this.chatSending.set(true);
    this.error.set(null);
    const temporaryUserId = -Date.now();
    const temporaryAssistantId = temporaryUserId - 1;
    this.chatMessages.update((messages) => [...messages,
      { id: temporaryUserId, role: 'المستخدم', content, status: 'مكتمل', createdAt: new Date().toISOString() },
      { id: temporaryAssistantId, role: 'المساعد', content: '', status: 'جارٍ الإرسال', createdAt: new Date().toISOString() },
    ]);
    this.scrollToLatest();
    try {
      await this.api.streamMessage(this.planId, session.id, content, (event) => {
        this.chatMessages.update((messages) => messages.map((message) => message.id !== temporaryAssistantId ? message : ({
          ...message,
          id: event.messageId ?? message.id,
          content: event.event === 'delta' ? message.content + (event.delta ?? '') : (event.content ?? message.content),
          status: event.status,
          taskChangeProposalId: event.taskChangeProposalId ?? message.taskChangeProposalId,
        })));
        this.scrollToLatest();
      }, images);
      this.refreshMessages();
    } catch {
      this.error.set('تعذر إكمال رد عم خضر. يمكنك إعادة المحاولة.');
      this.chatMessages.update((messages) => messages.map((message) => message.id === temporaryAssistantId
        ? { ...message, status: 'فشل', content: 'تعذر إنشاء الرد حاليًا.' }
        : message));
    } finally {
      this.chatSending.set(false);
    }
  }

  public selectImages(event: Event): void { this.selectedImages = Array.from((event.target as HTMLInputElement).files ?? []).filter(file => file.type.startsWith('image/')).slice(0, 4); }
  public toggleVoice(): void { const Speech = (globalThis as any).SpeechRecognition ?? (globalThis as any).webkitSpeechRecognition; if (!Speech) { this.error.set('المتصفح لا يدعم الإدخال الصوتي.'); return; } if (this.recording()) { this.recognition?.stop(); return; } this.recognition = new Speech(); this.recognition.lang = 'ar-EG'; this.recognition.continuous = false; this.recognition.onresult = (event: any) => { this.chatInput = `${this.chatInput} ${event.results[0][0].transcript}`.trim(); }; this.recognition.onend = () => this.recording.set(false); this.recording.set(true); this.recognition.start(); }
  private toBase64(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = reject; reader.readAsDataURL(file); }); }

  public onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    void this.sendChat();
  }

  public useSuggestion(suggestion: string): void {
    this.chatInput = suggestion;
    queueMicrotask(() => this.composerInput()?.nativeElement.focus());
  }

  public isUserMessage(message: ChatMessage): boolean {
    return message.role === 'المستخدم';
  }

  public formatMessageContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .replace(/^\s*<\s+(?=[⚠✅❌])/gm, '')
      .replace(/^\s*---+\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  public formatMessageTime(value: string): string {
    return new Intl.DateTimeFormat('ar-EG', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  public openProposal(proposalId: number): void {
    this.proposalLoading.set(true);
    this.api.proposal(proposalId).pipe(finalize(() => this.proposalLoading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (proposal) => this.selectedProposal.set(proposal),
      error: () => this.error.set('تعذر تحميل اقتراح تعديل المهام.'),
    });
  }

  public reviewProposal(action: 'apply' | 'reject'): void {
    const proposal = this.selectedProposal();
    if (!proposal || this.proposalLoading()) return;
    this.proposalLoading.set(true);
    const request = action === 'apply' ? this.api.applyProposal(proposal.id) : this.api.rejectProposal(proposal.id);
    request.pipe(finalize(() => this.proposalLoading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => this.selectedProposal.set(updated),
      error: (error) => this.error.set(error.error?.error?.message ?? 'تعذر مراجعة الاقتراح.'),
    });
  }

  private load(): void {
    forkJoin({ plan: this.coreApi.exportPlan(this.planId), sessions: this.api.sessions(this.planId) }).pipe(
      switchMap(({ plan, sessions }) => (sessions[0] ? of(sessions[0]) : this.api.createSession(this.planId)).pipe(map((session) => ({ plan, session })))),
      switchMap(({ plan, session }) => this.latestMessages(session.id).pipe(map((page) => ({ plan, session, messages: page.items })))),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ plan, session, messages }) => {
        this.plan.set(plan);
        this.chatSession.set(session);
        this.chatMessages.set(messages);
        this.scrollToLatest('auto');
      },
      error: () => this.error.set('تعذر تحميل محادثة الخطة.'),
    });
  }

  private refreshMessages(): void {
    const session = this.chatSession();
    if (!session) return;
    this.latestMessages(session.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.chatMessages.set(page.items);
        this.scrollToLatest();
      },
    });
  }

  private latestMessages(sessionId: number): Observable<ChatHistoryPage> {
    return this.api.messages(this.planId, sessionId).pipe(
      switchMap((firstPage) => {
        const lastPageNumber = Math.max(1, Math.ceil(firstPage.totalCount / firstPage.pageSize));
        return lastPageNumber > firstPage.pageNumber
          ? this.api.messages(this.planId, sessionId, lastPageNumber)
          : of(firstPage);
      }),
    );
  }

  private scrollToLatest(behavior: ScrollBehavior = 'smooth'): void {
    queueMicrotask(() => {
      const viewport = this.messagesViewport()?.nativeElement;
      if (!viewport) return;
      if (typeof viewport.scrollTo === 'function') {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      } else {
        viewport.scrollTop = viewport.scrollHeight;
      }
    });
  }
}
