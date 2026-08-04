import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDetails } from '@core/api/api.models';
import { PlantGrowthLoader } from '@shared/components/plant-growth-loader/plant-growth-loader';
import { PhaseTwoApi } from './phase-two-api.service';
import { ChatMessage, ChatSession, TaskProposal } from './phase-two.models';

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
  public chatInput = this.route.snapshot.queryParamMap.get('prompt') === 'disease'
    ? 'راجع معي آخر حالة صحية للمحصول، وما الإجراء الأكثر أولوية الآن؟'
    : '';

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
    if (!content || !session || this.chatSending()) return;
    this.chatInput = '';
    this.chatSending.set(true);
    this.error.set(null);
    const temporaryUserId = -Date.now();
    const temporaryAssistantId = temporaryUserId - 1;
    this.chatMessages.update((messages) => [...messages,
      { id: temporaryUserId, role: 'المستخدم', content, status: 'مكتمل', createdAt: new Date().toISOString() },
      { id: temporaryAssistantId, role: 'المساعد', content: '', status: 'جارٍ الإرسال', createdAt: new Date().toISOString() },
    ]);
    try {
      await this.api.streamMessage(this.planId, session.id, content, (event) => {
        this.chatMessages.update((messages) => messages.map((message) => message.id !== temporaryAssistantId ? message : ({
          ...message,
          id: event.messageId ?? message.id,
          content: event.event === 'delta' ? message.content + (event.delta ?? '') : (event.content ?? message.content),
          status: event.status,
          taskChangeProposalId: event.taskChangeProposalId ?? message.taskChangeProposalId,
        })));
      });
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
      switchMap(({ plan, session }) => this.api.messages(this.planId, session.id).pipe(map((page) => ({ plan, session, messages: page.items })))),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ plan, session, messages }) => { this.plan.set(plan); this.chatSession.set(session); this.chatMessages.set(messages); },
      error: () => this.error.set('تعذر تحميل محادثة الخطة.'),
    });
  }

  private refreshMessages(): void {
    const session = this.chatSession();
    if (!session) return;
    this.api.messages(this.planId, session.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => this.chatMessages.set(page.items),
    });
  }
}
