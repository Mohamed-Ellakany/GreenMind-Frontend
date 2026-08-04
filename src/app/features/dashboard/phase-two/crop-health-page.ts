import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDetails } from '@core/api/api.models';
import { PlantGrowthLoader } from '@shared/components/plant-growth-loader/plant-growth-loader';
import { PhaseTwoApi } from './phase-two-api.service';
import { DiseaseReport } from './phase-two.models';

@Component({
  selector: 'app-crop-health-page',
  imports: [FormsModule, RouterLink, PlantGrowthLoader],
  templateUrl: './crop-health-page.html',
  styleUrls: ['./plan-page.shared.css', './crop-health-page.css'],
})
export class CropHealthPage {
  private readonly api = inject(PhaseTwoApi);
  private readonly coreApi = inject(GreenmindApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  public readonly planId = Number(this.route.snapshot.paramMap.get('id'));
  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly reports = signal<DiseaseReport[]>([]);
  public readonly imageUrls = signal<Record<number, string>>({});
  public readonly loading = signal(true);
  public readonly submitting = signal(false);
  public readonly retryingId = signal<number | null>(null);
  public readonly error = signal<string | null>(null);
  public readonly success = signal<string | null>(null);
  public observationDate = new Date().toISOString().slice(0, 10);
  public affectedArea = '';
  public notes = '';
  public images: File[] = [];

  public readonly latest = computed(() => this.reports()[0] ?? null);
  public readonly currentStatus = computed(() => this.latest()?.status ?? 'لا توجد فحوصات');
  public readonly currentDisease = computed(() => this.latest()?.suspectedDisease ?? 'ابدأ بأول تحليل للمحصول');
  public readonly latestArea = computed(() => this.latest()?.affectedArea ?? 'لم تُحدد منطقة بعد');
  public readonly latestDate = computed(() => this.latest() ? this.formatDate(this.latest()!.observationDate) : '—');
  public readonly currentStatusNeedsAttention = computed(() => Boolean(this.latest() && this.latest()!.status !== 'مكتمل'));
  public readonly openCases = computed(() => this.reports().filter((item) => item.status !== 'مكتمل').length);
  public readonly imageCount = computed(() => this.reports().reduce((total, report) => total + report.images.length, 0));
  public readonly averageConfidence = computed(() => {
    const values = this.reports().map((item) => item.confidencePercentage).filter((value): value is number => value !== null);
    return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : null;
  });

  public constructor() {
    this.destroyRef.onDestroy(() => Object.values(this.imageUrls()).forEach((url) => URL.revokeObjectURL(url)));
    if (!Number.isInteger(this.planId) || this.planId <= 0) {
      this.loading.set(false);
      this.error.set('معرّف خطة التصدير غير صالح.');
      return;
    }
    this.loadInitial();
  }

  public chooseImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []).slice(0, 5);
    const tooLarge = selected.some((file) => file.size > 10 * 1024 * 1024);
    if (tooLarge || selected.reduce((total, file) => total + file.size, 0) > 30 * 1024 * 1024) {
      this.error.set('الحد الأقصى 10 ميجابايت للصورة و30 ميجابايت للطلب.');
      input.value = '';
      this.images = [];
      return;
    }
    this.images = selected;
  }

  public submit(): void {
    if (!this.images.length || this.submitting()) {
      this.error.set('اختر صورة واحدة على الأقل للمحصول.');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api.submitDisease(this.planId, this.observationDate, this.affectedArea, this.notes, this.images).pipe(
      finalize(() => this.submitting.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (report) => {
        this.reports.update((items) => [report, ...items]);
        this.loadImages([report]);
        this.images = [];
        this.affectedArea = '';
        this.notes = '';
        this.success.set('تم رفع الصور وإرسالها للتحليل. ستتحدث النتيجة تلقائيًا.');
      },
      error: (error) => this.error.set(error.error?.error?.message ?? 'تعذر إرسال الصور للتحليل.'),
    });
  }

  public retry(reportId: number): void {
    this.retryingId.set(reportId);
    this.api.retryDisease(this.planId, reportId).pipe(
      finalize(() => this.retryingId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (updated) => this.reports.update((items) => items.map((item) => item.id === updated.id ? updated : item)),
      error: (error) => this.error.set(error.error?.error?.message ?? 'تعذرت إعادة التحليل.'),
    });
  }

  public imageUrl(imageId: number): string | null { return this.imageUrls()[imageId] ?? null; }
  public formatDate(value: string): string { return new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', { dateStyle: 'medium' }); }

  private loadInitial(): void {
    forkJoin({ plan: this.coreApi.exportPlan(this.planId), reports: this.api.diseaseReports(this.planId) }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ plan, reports }) => {
        this.plan.set(plan);
        this.reports.set(reports.items);
        this.loadImages(reports.items);
        this.startPolling();
      },
      error: () => this.error.set('تعذر تحميل سجل صحة المحصول.'),
    });
  }

  private startPolling(): void {
    timer(5000, 5000).pipe(
      switchMap(() => this.api.diseaseReports(this.planId)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (page) => { this.reports.set(page.items); this.loadImages(page.items); },
    });
  }

  private loadImages(reports: DiseaseReport[]): void {
    const existing = this.imageUrls();
    for (const report of reports) {
      for (const image of report.images) {
        if (existing[image.id]) continue;
        this.api.diseaseImage(this.planId, report.id, image.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (blob) => this.imageUrls.update((current) => ({ ...current, [image.id]: URL.createObjectURL(blob) })),
        });
      }
    }
  }
}
