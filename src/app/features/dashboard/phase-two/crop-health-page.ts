import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDetails } from '@core/api/api.models';
import { PlantGrowthLoader } from '@shared/components/plant-growth-loader/plant-growth-loader';
import { PhaseTwoApi } from './phase-two-api.service';
import { DiagnosisSummary } from './phase-two.models';

@Component({
  selector: 'app-crop-health-page',
  imports: [RouterLink, PlantGrowthLoader],
  templateUrl: './crop-health-page.html',
  styleUrls: ['./plan-page.shared.css', './crop-health-page.css'],
})
export class CropHealthPage {
  private readonly api = inject(PhaseTwoApi);
  private readonly coreApi = inject(GreenmindApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  public readonly planId = Number(this.route.snapshot.paramMap.get('id'));
  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly diagnoses = signal<DiagnosisSummary[]>([]);
  public readonly loading = signal(true);
  public readonly creating = signal(false);
  public readonly error = signal<string | null>(null);

  public readonly drafts = computed(() => this.diagnoses().filter((item) => ['مسودة', 'جاهز للتشخيص'].includes(item.status)).length);
  public readonly completed = computed(() => this.diagnoses().filter((item) => item.status === 'مكتمل').length);
  public readonly attention = computed(() => this.diagnoses().filter((item) => ['قيد الانتظار', 'جاري التحليل', 'فشل'].includes(item.status)).length);
  public readonly latest = computed(() => this.diagnoses().find((item) => item.status === 'مكتمل') ?? null);
  public readonly supportsSmartDiagnosis = computed(() => this.plan()?.crop?.toLowerCase() === 'strawberry');

  public constructor() {
    if (!Number.isInteger(this.planId) || this.planId <= 0) {
      this.loading.set(false);
      this.error.set('معرّف خطة التصدير غير صالح.');
      return;
    }
    this.load();
  }

  public createDiagnosis(): void {
    if (this.creating() || !this.supportsSmartDiagnosis()) return;
    this.creating.set(true);
    this.error.set(null);
    this.api.createDiagnosis(this.planId).pipe(
      finalize(() => this.creating.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (diagnosis) => void this.router.navigate([
        '/export-plans', this.planId, 'crop-health', 'diagnoses', diagnosis.summary.id,
      ]),
      error: (error) => this.error.set(error?.error?.error?.message ?? 'تعذر بدء جلسة تشخيص جديدة.'),
    });
  }

  public open(diagnosis: DiagnosisSummary): void {
    void this.router.navigate(['/export-plans', this.planId, 'crop-health', 'diagnoses', diagnosis.id]);
  }

  public formatDate(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG', { dateStyle: 'medium' });
  }

  public statusTone(status: string): string {
    if (status === 'مكتمل') return 'good';
    if (status === 'فشل') return 'danger';
    if (status === 'ملغي') return 'muted';
    return 'warning';
  }

  private load(): void {
    forkJoin({ plan: this.coreApi.exportPlan(this.planId), diagnoses: this.api.diagnoses(this.planId) }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ plan, diagnoses }) => {
        this.plan.set(plan);
        this.diagnoses.set(diagnoses);
        this.startPolling();
      },
      error: () => this.error.set('تعذر تحميل سجل صحة المحصول.'),
    });
  }

  private startPolling(): void {
    timer(5000, 5000).pipe(
      switchMap(() => this.api.diagnoses(this.planId)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: (items) => this.diagnoses.set(items) });
  }
}
