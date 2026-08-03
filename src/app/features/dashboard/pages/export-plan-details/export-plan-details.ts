import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import {
  DashboardTask,
  ExportPlanDashboard,
  ExportPlanDetails,
  SoilMeasurement,
  SoilMeasurementRequest,
} from '@core/api/api.models';

type InsightTone = 'good' | 'warning' | 'danger' | 'neutral';

interface PlanInsight {
  tone: InsightTone;
  title: string;
  detail: string;
}

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
  private readonly today = this.localIsoDate(new Date());
  private planId = 0;

  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly dashboard = signal<ExportPlanDashboard | null>(null);
  public readonly soilMeasurements = signal<SoilMeasurement[]>([]);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly updatingTaskId = signal<number | null>(null);
  public readonly soilHistoryLoading = signal(false);
  public readonly soilHistoryLoaded = signal(false);
  public readonly soilHistoryError = signal<string | null>(null);
  public readonly soilFormOpen = signal(false);
  public readonly soilSaving = signal(false);
  public readonly soilError = signal<string | null>(null);
  public readonly soilSuccess = signal<string | null>(null);

  public soilForm: SoilMeasurementRequest = this.emptySoilForm();

  public readonly latestSoil = computed(() => this.dashboard()?.latestSoilMeasurement ?? null);

  public readonly planHealth = computed(() => {
    const soil = this.latestSoil();
    if (!soil) {
      return { label: 'غير مؤكدة', detail: 'أضف أول قراءة لاتخاذ قرار موثوق', tone: 'neutral' as InsightTone, score: 0, passed: 0 };
    }

    const checks = [soil.ph >= 5.5 && soil.ph <= 7.5, soil.moisture >= 45 && soil.moisture <= 85, soil.ec <= 3];
    const passed = checks.filter(Boolean).length;
    const score = Math.round(passed / checks.length * 100);
    if (passed === 3) return { label: 'ممتازة', detail: 'المؤشرات الأساسية مستقرة', tone: 'good' as InsightTone, score, passed };
    if (passed === 2) return { label: 'تحتاج متابعة', detail: 'هناك مؤشر واحد خارج النطاق', tone: 'warning' as InsightTone, score, passed };
    return { label: 'تحتاج تدخلاً', detail: 'عدة مؤشرات خارج النطاق الآمن', tone: 'danger' as InsightTone, score, passed };
  });

  public readonly actionTasks = computed(() => {
    const data = this.dashboard();
    if (!data) return [];
    const tasks = [...(data.overdueTasks ?? []), ...data.upcomingTasks.filter((task) => task.plannedDate === this.today)];
    return [...new Map(tasks.map((task) => [task.id, task])).values()]
      .sort((first, second) => this.taskUrgency(second) - this.taskUrgency(first) || first.plannedDate.localeCompare(second.plannedDate));
  });

  public readonly nextTasks = computed(() => {
    const data = this.dashboard();
    if (!data) return [];
    return data.upcomingTasks.filter((task) => task.plannedDate > this.today).slice(0, 3);
  });

  public readonly heroInsights = computed<PlanInsight[]>(() => {
    const data = this.dashboard();
    const plan = this.plan();
    if (!data || !plan) return [];

    const insights: PlanInsight[] = [];
    const overdueTasks = data.overdueTasks ?? [];
    if (plan.planningStatus === 'Failed') {
      insights.push({ tone: 'danger', title: 'تعذر تحديث الخطة الذكية', detail: 'راجع مساحة العمل لإعادة المحاولة' });
    }

    if (overdueTasks.length) {
      insights.push({
        tone: 'danger',
        title: `${overdueTasks.length} ${overdueTasks.length === 1 ? 'مهمة متأخرة' : 'مهام متأخرة'}`,
        detail: `ابدأ بـ «${overdueTasks[0].title}»`,
      });
    } else if (this.actionTasks().length) {
      insights.push({
        tone: 'warning',
        title: `${this.actionTasks().length} ${this.actionTasks().length === 1 ? 'مهمة لليوم' : 'مهام لليوم'}`,
        detail: 'أنجزها للحفاظ على مسار الخطة',
      });
    } else {
      insights.push({ tone: 'good', title: 'لا توجد مهام حرجة اليوم', detail: 'الخطة تسير دون إجراء عاجل' });
    }

    const health = this.planHealth();
    if (health.tone !== 'good') {
      insights.push({
        tone: health.tone,
        title: `صحة التربة: ${health.label}`,
        detail: health.detail,
      });
    }

    return insights.slice(0, 3);
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

  public onSoilDetailsToggle(event: Event): void {
    if ((event.currentTarget as HTMLDetailsElement).open) this.loadSoilHistory();
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
        if (this.soilHistoryLoaded()) this.soilMeasurements.update((items) => [reading, ...items]);
        this.soilFormOpen.set(false);
        this.soilSuccess.set('تم حفظ قراءة التربة وتحديث حالة الخطة.');
        this.refreshDashboard();
      },
      error: (error) => this.soilError.set(error.error?.error?.message ?? 'تعذر حفظ قراءة التربة. حاول مرة أخرى.'),
    });
  }

  public toggleTask(task: DashboardTask): void {
    if (this.updatingTaskId()) return;
    this.updatingTaskId.set(task.id);
    this.error.set(null);
    this.api.updateTask(task.id, { status: 'Completed', actualDate: this.today }).pipe(
      switchMap(() => this.api.dashboard(this.planId)),
      finalize(() => this.updatingTaskId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (dashboard) => this.dashboard.set(dashboard),
      error: () => this.error.set('تعذر تحديث المهمة. حاول مرة أخرى.'),
    });
  }

  public statusLabel(status: string): string {
    return ({ Planning: 'قيد التخطيط', InProgress: 'قيد التنفيذ', ReadyForExport: 'جاهزة للتصدير', Completed: 'مكتملة', Draft: 'مسودة', Cancelled: 'ملغاة' } as Record<string, string>)[status] ?? status;
  }

  public statusMessage(status: string): string {
    return ({
      Planning: 'يجري إعداد خطوات الموسم',
      InProgress: 'الخطة نشطة وتحتاج متابعة يومية',
      ReadyForExport: 'المحصول جاهز للانتقال إلى التصدير',
      Completed: 'اكتملت الخطة بنجاح',
      Draft: 'أكمل البيانات لبدء التنفيذ',
      Cancelled: 'تم إيقاف العمل على هذه الخطة',
    } as Record<string, string>)[status] ?? 'تابع المؤشرات والمهام القادمة';
  }

  public taskStatusLabel(task: DashboardTask): string {
    if (this.isOverdue(task)) return 'متأخرة';
    return task.status === 'InProgress' ? 'جارية' : 'اليوم';
  }

  public priorityLabel(priority: string): string {
    return ({ Low: 'منخفضة', Medium: 'متوسطة', High: 'عالية', Critical: 'حرجة' } as Record<string, string>)[priority] ?? priority;
  }

  public isOverdue(task: DashboardTask): boolean {
    return task.plannedDate < this.today && task.status !== 'Completed';
  }

  public formatDate(value: string): string {
    if (!value) return '—';
    return new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  public compactDate(value: string): string {
    if (!value) return '—';
    return new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  }

  public daysUntil(value: string): number {
    const target = new Date(`${value}T00:00:00`).getTime();
    const today = new Date(`${this.today}T00:00:00`).getTime();
    return Math.max(0, Math.ceil((target - today) / 86_400_000));
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      plan: this.api.exportPlan(this.planId),
      dashboard: this.api.dashboard(this.planId),
    }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ plan, dashboard }) => {
        this.plan.set(plan);
        this.dashboard.set(dashboard);
      },
      error: () => this.error.set('تعذر تحميل تفاصيل خطة التصدير. تأكد من أن الخطة ما زالت متاحة.'),
    });
  }

  private refreshDashboard(): void {
    this.api.dashboard(this.planId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dashboard) => this.dashboard.set(dashboard),
    });
  }

  private loadSoilHistory(): void {
    if (this.soilHistoryLoaded() || this.soilHistoryLoading()) return;
    this.soilHistoryLoading.set(true);
    this.soilHistoryError.set(null);
    this.api.soilMeasurements(this.planId).pipe(
      finalize(() => this.soilHistoryLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (soil) => {
        this.soilMeasurements.set([...soil].sort((first, second) => second.measurementDate.localeCompare(first.measurementDate)));
        this.soilHistoryLoaded.set(true);
      },
      error: () => this.soilHistoryError.set('تعذر تحميل سجل قراءات التربة.'),
    });
  }

  private taskUrgency(task: DashboardTask): number {
    const priority = ({ Low: 1, Medium: 2, High: 3, Critical: 4 } as Record<string, number>)[task.priority] ?? 0;
    return (this.isOverdue(task) ? 10 : 0) + priority;
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
      measurementDate: this.today,
      ph: 6.5,
      ec: 1.2,
      nitrogen: 25,
      phosphorus: 15,
      potassium: 35,
      moisture: 65,
      notes: null,
    };
  }

  private localIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
