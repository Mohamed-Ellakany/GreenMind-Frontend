import { Component, DestroyRef, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, catchError, finalize, forkJoin, of, switchMap, timer } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDetails } from '@core/api/api.models';
import { PlantGrowthLoader } from '@shared/components/plant-growth-loader/plant-growth-loader';
import { DatePickerDirective, NumericInputDirective } from '@shared/components/platform-form-controls';
import { PhaseTwoApi } from './phase-two-api.service';
import { DiagnosisDetail, DiagnosisImage, DiagnosisMessage, TaskProposal } from './phase-two.models';

@Component({
  selector: 'app-diagnosis-chat-page',
  imports: [FormsModule, RouterLink, PlantGrowthLoader, DatePickerDirective, NumericInputDirective],
  templateUrl: './diagnosis-chat-page.html',
  styleUrls: ['./plan-page.shared.css', './diagnosis-chat-page.css'],
})
export class DiagnosisChatPage {
  private readonly api = inject(PhaseTwoApi);
  private readonly coreApi = inject(GreenmindApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('messagesViewport') private messagesViewport?: ElementRef<HTMLElement>;

  public readonly planId = Number(this.route.snapshot.paramMap.get('id'));
  public readonly diagnosisId = Number(this.route.snapshot.paramMap.get('diagnosisId'));
  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly diagnosis = signal<DiagnosisDetail | null>(null);
  public readonly imageUrls = signal<Record<number, string>>({});
  public readonly loading = signal(true);
  public readonly sending = signal(false);
  public readonly finalizing = signal(false);
  public readonly treatmentLoading = signal(false);
  public readonly proposalLoading = signal(false);
  public readonly proposal = signal<TaskProposal | null>(null);
  public readonly pendingMessage = signal<DiagnosisMessage | null>(null);
  public readonly error = signal<string | null>(null);
  public readonly success = signal<string | null>(null);
  public message = '';
  public selectedImages: File[] = [];

  public readonly isOpen = computed(() => ['مسودة', 'جاهز للتشخيص'].includes(this.diagnosis()?.summary.status ?? ''));
  public readonly isProcessing = computed(() => ['قيد الانتظار', 'جاري التحليل'].includes(this.diagnosis()?.summary.status ?? ''));
  public readonly isCompleted = computed(() => this.diagnosis()?.summary.status === 'مكتمل');
  public readonly isFailed = computed(() => this.diagnosis()?.summary.status === 'فشل');
  public readonly isCancelled = computed(() => this.diagnosis()?.summary.status === 'ملغي');
  public readonly canSend = computed(() => this.isOpen() && !this.sending());
  public readonly monitoringOnly = computed(() => {
    const item = this.diagnosis()?.summary;
    return !!item && (item.finalizedWithOverride || !item.knowledgeVerified || (item.confidencePercentage ?? 0) < 60);
  });

  private pollingSubscription: Subscription | null = null;

  public constructor() {
    this.destroyRef.onDestroy(() => {
      this.stopPolling();
      Object.values(this.imageUrls()).forEach((url) => URL.revokeObjectURL(url));
    });
    if (![this.planId, this.diagnosisId].every((value) => Number.isInteger(value) && value > 0)) {
      this.loading.set(false);
      this.error.set('رابط جلسة التشخيص غير صالح.');
      return;
    }
    this.load();
  }

  public isUser(message: DiagnosisMessage): boolean { return message.role === 'المستخدم'; }
  public imageUrl(image: DiagnosisImage): string | null { return this.imageUrls()[image.id] ?? null; }
  public formatDate(value: string): string { return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); }

  public chooseImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const incoming = Array.from(input.files ?? []);
    const allowed = incoming.filter((file) => ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 10 * 1024 * 1024);
    if (allowed.length !== incoming.length) this.error.set('يُسمح بصور JPEG أو PNG حتى 10 ميجابايت للصورة.');
    this.selectedImages = [...this.selectedImages, ...allowed].slice(0, 5);
    input.value = '';
  }

  public removeSelected(index: number): void { this.selectedImages.splice(index, 1); }

  public onMessageKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    this.send();
  }

  public send(): void {
    const content = this.message.trim();
    if ((!content && !this.selectedImages.length) || !this.canSend()) return;
    const files = [...this.selectedImages];
    const pending = this.createPendingMessage(content, files);
    this.pendingMessage.set(pending);
    this.message = '';
    this.selectedImages = [];
    this.sending.set(true);
    this.error.set(null);
    this.scrollToEnd();
    this.api.sendDiagnosisMessage(this.planId, this.diagnosisId, content, files).pipe(
      finalize(() => this.sending.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (turn) => {
        this.diagnosis.update((current) => current ? ({
          ...current,
          readiness: turn.readiness,
          facts: turn.facts,
          summary: { ...current.summary, status: turn.readiness.isReady ? 'جاهز للتشخيص' : 'مسودة', imageCount: current.summary.imageCount + files.length },
          messages: [...current.messages, turn.userMessage, turn.assistantMessage],
        }) : current);
        this.clearPendingMessage();
        this.loadImages(turn.userMessage.images);
        this.scrollToEnd();
      },
      error: (error) => {
        this.clearPendingMessage();
        this.message = content;
        this.selectedImages = files;
        this.error.set(error?.error?.error?.message ?? 'تعذر إرسال الرسالة.');
      },
    });
  }

  public finalizeDiagnosis(): void {
    const ready = this.diagnosis()?.readiness.isReady ?? false;
    const force = !ready;
    if (force && !confirm('لا تزال هناك معلومات ناقصة. سيصدر تشخيص منخفض الاعتمادية، وستقتصر الخطة على المتابعة غير الكيميائية. هل تريد الاستمرار؟')) return;
    this.finalizing.set(true);
    this.error.set(null);
    this.api.finalizeDiagnosis(this.planId, this.diagnosisId, force).pipe(
      finalize(() => this.finalizing.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (detail) => { this.setDetail(detail); this.success.set('أُغلقت المحادثة وبدأ تحليل كل البيانات والصور.'); },
      error: (error) => this.error.set(error?.error?.error?.message ?? 'تعذر بدء التشخيص.'),
    });
  }

  public cancelDiagnosis(): void {
    if (!confirm('سيتم أرشفة الجلسة للقراءة فقط. هل تريد إلغاءها؟')) return;
    this.api.cancelDiagnosis(this.planId, this.diagnosisId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (detail) => this.setDetail(detail),
      error: (error) => this.error.set(error?.error?.error?.message ?? 'تعذر إلغاء الجلسة.'),
    });
  }

  public retry(): void {
    this.finalizing.set(true);
    this.api.retryDiagnosis(this.planId, this.diagnosisId).pipe(
      finalize(() => this.finalizing.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (detail) => this.setDetail(detail),
      error: (error) => this.error.set(error?.error?.error?.message ?? 'تعذرت إعادة التشخيص.'),
    });
  }

  public openTreatment(): void {
    const existing = this.diagnosis()?.treatmentProposalId;
    this.treatmentLoading.set(true);
    const request = existing
      ? this.api.proposal(existing)
      : this.api.createTreatmentProposal(this.planId, this.diagnosisId);
    request.pipe(finalize(() => this.treatmentLoading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (proposal) => this.proposal.set(structuredClone(proposal)),
      error: (error) => this.error.set(error?.error?.error?.message ?? 'تعذر تجهيز الخطة العلاجية.'),
    });
  }

  public saveProposal(): void {
    const proposal = this.proposal();
    if (!proposal || this.proposalLoading()) return;
    this.proposalLoading.set(true);
    this.api.updateProposal(proposal.id, proposal).pipe(
      finalize(() => this.proposalLoading.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (updated) => { this.proposal.set(structuredClone(updated)); this.success.set('تم حفظ تعديلات المعاينة.'); },
      error: (error) => this.error.set(error?.error?.error?.message ?? 'تعذر حفظ تعديلات الخطة.'),
    });
  }

  public applyProposal(): void {
    const proposal = this.proposal();
    if (!proposal || this.proposalLoading()) return;
    this.proposalLoading.set(true);
    this.api.updateProposal(proposal.id, proposal).pipe(
      switchMap((updated) => this.api.applyProposal(updated.id)),
      finalize(() => this.proposalLoading.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (updated) => { this.proposal.set(updated); this.success.set('تم تطبيق مهام الخطة المعتمدة بنجاح.'); },
      error: (error) => this.error.set(error?.error?.error?.message ?? 'تعذر تطبيق الخطة العلاجية.'),
    });
  }

  public rejectProposal(): void {
    const proposal = this.proposal();
    if (!proposal || this.proposalLoading()) return;
    this.proposalLoading.set(true);
    this.api.rejectProposal(proposal.id).pipe(
      finalize(() => this.proposalLoading.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (updated) => this.proposal.set(updated),
      error: (error) => this.error.set(error?.error?.error?.message ?? 'تعذر رفض الاقتراح.'),
    });
  }

  private load(): void {
    forkJoin({ plan: this.coreApi.exportPlan(this.planId), diagnosis: this.api.diagnosis(this.planId, this.diagnosisId) }).pipe(
      finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ plan, diagnosis }) => { this.plan.set(plan); this.setDetail(diagnosis); },
      error: () => this.error.set('تعذر تحميل جلسة التشخيص.'),
    });
  }

  private syncPolling(): void {
    const shouldPoll = typeof document !== 'undefined' && !document.hidden && this.isProcessing();
    if (!shouldPoll) {
      this.stopPolling();
      return;
    }
    if (this.pollingSubscription && !this.pollingSubscription.closed) return;

    this.pollingSubscription = timer(5000, 5000).pipe(
      switchMap(() => this.api.diagnosis(this.planId, this.diagnosisId).pipe(
        catchError(() => of(null)),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (detail) => {
        if (detail && (this.isProcessing() || detail.summary.status !== this.diagnosis()?.summary.status)) {
          this.setDetail(detail);
        }
      },
      error: () => this.stopPolling(),
    });
  }

  private stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  private setDetail(detail: DiagnosisDetail): void {
    this.diagnosis.set(detail);
    this.loadImages(detail.messages.flatMap((message) => message.images));
    this.scrollToEnd('auto');
    this.syncPolling();
  }

  private loadImages(images: DiagnosisImage[]): void {
    for (const image of images) {
      if (this.imageUrls()[image.id]) continue;
      this.api.diagnosisImage(this.planId, this.diagnosisId, image.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (blob) => {
          this.imageUrls.update((current) => ({ ...current, [image.id]: URL.createObjectURL(blob) }));
          this.scrollToEnd('auto');
        },
      });
    }
  }

  private createPendingMessage(content: string, files: File[]): DiagnosisMessage {
    const messageId = -Date.now();
    const images = files.map((file, index) => ({
      id: messageId - index - 1,
      messageId,
      originalFileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }));
    const previews = Object.fromEntries(images.map((image, index) => [image.id, URL.createObjectURL(files[index])]));
    this.imageUrls.update((current) => ({ ...current, ...previews }));
    return {
      id: messageId,
      role: 'المستخدم',
      content,
      status: 'مكتمل',
      createdAt: new Date().toISOString(),
      images,
    };
  }

  private clearPendingMessage(): void {
    const pending = this.pendingMessage();
    if (!pending) return;
    this.imageUrls.update((current) => {
      const next = { ...current };
      for (const image of pending.images) {
        const url = next[image.id];
        if (url) URL.revokeObjectURL(url);
        delete next[image.id];
      }
      return next;
    });
    this.pendingMessage.set(null);
  }

  private scrollToEnd(behavior: ScrollBehavior = 'smooth'): void {
    const scroll = () => {
      const viewport = this.messagesViewport?.nativeElement;
      if (!viewport) return;
      if (typeof viewport.scrollTo === 'function') {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      } else {
        viewport.scrollTop = viewport.scrollHeight;
      }
    };
    queueMicrotask(() => {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(scroll);
      else setTimeout(scroll);
    });
  }
}
