import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import {
  DashboardTask,
  ExportPlanDashboard,
  ExportPlanDetails,
  SoilMeasurement,
  SoilMeasurementRequest,
} from '@core/api/api.models';

@Component({
  selector: 'app-export-plan-details',
  imports: [FormsModule, RouterLink],
  templateUrl: './export-plan-details.html',
  styleUrl: './export-plan-details.css',
})
export class ExportPlanDetailsPage {
  private readonly api = inject(GreenmindApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private planId = 0;

  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly dashboard = signal<ExportPlanDashboard | null>(null);
  public readonly soilMeasurements = signal<SoilMeasurement[]>([]);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly soilFormOpen = signal(false);
  public readonly soilSaving = signal(false);
  public readonly soilError = signal<string | null>(null);
  public readonly soilSuccess = signal<string | null>(null);

  public soilForm: SoilMeasurementRequest = this.emptySoilForm();

  public readonly journeyTasks = computed(() => {
    const data = this.dashboard();
    if (!data) return [];
    return [...data.completedTasks, ...data.upcomingTasks]
      .sort((first, second) => first.plannedDate.localeCompare(second.plannedDate))
      .slice(0, 8);
  });

  public readonly latestSoil = computed(() => this.soilMeasurements()[0] ?? null);

  public readonly planHealth = computed(() => {
    const soil = this.latestSoil();
    if (!soil) return { label: 'بانتظار قراءة', detail: 'أضف أول قراءة للتربة', tone: 'neutral' };
    const phHealthy = soil.ph >= 5.5 && soil.ph <= 7.5;
    const moistureHealthy = soil.moisture >= 45 && soil.moisture <= 85;
    const ecHealthy = soil.ec <= 3;
    const score = [phHealthy, moistureHealthy, ecHealthy].filter(Boolean).length;
    if (score === 3) return { label: 'ممتازة', detail: 'المؤشرات الأساسية مستقرة', tone: 'good' };
    if (score === 2) return { label: 'جيدة', detail: 'يوجد مؤشر يحتاج متابعة', tone: 'warning' };
    return { label: 'تحتاج متابعة', detail: 'راجع قراءات التربة الحالية', tone: 'danger' };
  });

  public constructor() {
    this.planId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.planId) || this.planId <= 0) {
      this.loading.set(false);
      this.error.set('معرّف خطة التصدير غير صالح.');
      return;
    }
    this.load();
  }

  public openSoilForm(): void {
    this.soilForm = this.emptySoilForm();
    this.soilError.set(null);
    this.soilSuccess.set(null);
    this.soilFormOpen.set(true);
  }

  public closeSoilForm(): void {
    if (!this.soilSaving()) this.soilFormOpen.set(false);
  }

  public saveSoilReading(): void {
    if (!this.validSoilReading()) {
      this.soilError.set('راجع القيم: الحموضة من 0 إلى 14، وباقي القراءات يجب ألا تكون سالبة.');
      return;
    }

    this.soilSaving.set(true);
    this.soilError.set(null);
    this.api.createSoilMeasurement(this.planId, {
      ...this.soilForm,
      notes: this.soilForm.notes?.trim() || null,
    }).pipe(
      finalize(() => this.soilSaving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (reading) => {
        this.soilMeasurements.update((items) => [reading, ...items]);
        this.soilFormOpen.set(false);
        this.soilSuccess.set('تم حفظ قراءة التربة وإضافتها إلى سجل الخطة.');
        this.refreshDashboard();
      },
      error: (error) => this.soilError.set(error.error?.error?.message ?? 'تعذر حفظ قراءة التربة. حاول مرة أخرى.'),
    });
  }

  public statusLabel(status: string): string {
    return ({ Planning: 'قيد التخطيط', InProgress: 'قيد التنفيذ', ReadyForExport: 'جاهزة للتصدير', Completed: 'مكتملة', Draft: 'مسودة', Cancelled: 'ملغاة' } as Record<string, string>)[status] ?? status;
  }

  public taskStatusLabel(status: string): string {
    return ({ Pending: 'قادمة', InProgress: 'جارية', Completed: 'مكتملة', Cancelled: 'ملغاة' } as Record<string, string>)[status] ?? status;
  }

  public priorityLabel(priority: string): string {
    return ({ Low: 'منخفضة', Medium: 'متوسطة', High: 'عالية', Critical: 'حرجة' } as Record<string, string>)[priority] ?? priority;
  }

  public isTaskComplete(task: DashboardTask): boolean {
    return task.status === 'Completed';
  }

  public formatDate(value: string): string {
    if (!value) return '—';
    return new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  public daysUntil(value: string): number {
    const target = new Date(`${value}T00:00:00`).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((target - today.getTime()) / 86_400_000));
  }

  public metricWidth(value: number, maximum: number): number {
    return Math.max(4, Math.min(100, value / maximum * 100));
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      plan: this.api.exportPlan(this.planId),
      dashboard: this.api.dashboard(this.planId),
      soil: this.api.soilMeasurements(this.planId),
    }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ plan, dashboard, soil }) => {
        this.plan.set(plan);
        this.dashboard.set(dashboard);
        this.soilMeasurements.set([...soil].sort((first, second) => second.measurementDate.localeCompare(first.measurementDate)));
      },
      error: () => this.error.set('تعذر تحميل تفاصيل خطة التصدير. تأكد من أن الخطة ما زالت متاحة.'),
    });
  }

  private refreshDashboard(): void {
    this.api.dashboard(this.planId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dashboard) => this.dashboard.set(dashboard),
    });
  }

  private validSoilReading(): boolean {
    const form = this.soilForm;
    return Boolean(form.measurementDate)
      && form.ph >= 0 && form.ph <= 14
      && [form.ec, form.nitrogen, form.phosphorus, form.potassium, form.moisture]
        .every((value) => Number.isFinite(value) && value >= 0);
  }

  private emptySoilForm(): SoilMeasurementRequest {
    return {
      measurementDate: new Date().toISOString().slice(0, 10),
      ph: 6.5,
      ec: 1.2,
      nitrogen: 25,
      phosphorus: 15,
      potassium: 35,
      moisture: 65,
      notes: null,
    };
  }
}
