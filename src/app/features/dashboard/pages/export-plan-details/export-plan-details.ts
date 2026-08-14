import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, forkJoin, of, switchMap, takeWhile, timer } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { PhaseTwoApi } from '@features/dashboard/phase-two/phase-two-api.service';
import { CostDashboard, DiseaseReport } from '@features/dashboard/phase-two/phase-two.models';
import { ExportPlanOperationalSummary } from './export-plan-operational-summary';
import { PlantGrowthLoader } from '@shared/components/plant-growth-loader/plant-growth-loader';
import {
  taskPriorityLabel,
  taskStatusLabel as localizedTaskStatusLabel,
  taskTypeLabel,
} from '@shared/utils/task-labels';
import {
  DatePickerDirective,
  NumericInputDirective,
} from '@shared/components/platform-form-controls';
import {
  CreateTaskRequest,
  DashboardTask,
  DashboardWeather,
  ExportPlanDashboard,
  ExportPlanDetails,
  ExportPlanFarmDataUpdateRequest,
  FarmTask,
  SoilMeasurement,
  SoilMeasurementRequest,
  TaskType,
} from '@core/api/api.models';

type InsightTone = 'good' | 'warning' | 'danger' | 'neutral';

type SoilFormModel = {
  measurementDate: string;
  ph: number | null;
  ec: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  moisture: number | null;
  notes: string | null;
};

interface PlanInsight {
  tone: InsightTone;
  title: string;
  detail: string;
}

@Component({
  selector: 'app-export-plan-details',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ExportPlanOperationalSummary,
    PlantGrowthLoader,
    DatePickerDirective,
    NumericInputDirective,
  ],
  templateUrl: './export-plan-details.html',
  styleUrl: './export-plan-details.css',
})
export class ExportPlanDetailsPage {
  private readonly api = inject(GreenmindApi);
  private readonly phaseApi = inject(PhaseTwoApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly soilDialog = viewChild<ElementRef<HTMLDialogElement>>('soilDialog');
  private readonly taskDialog = viewChild<ElementRef<HTMLDialogElement>>('taskDialog');
  private readonly postponeTaskDialog =
    viewChild<ElementRef<HTMLDialogElement>>('postponeTaskDialog');
  private readonly todayTasksDialog =
    viewChild<ElementRef<HTMLDialogElement>>('todayTasksDialog');
  private readonly farmDataDialog =
    viewChild<ElementRef<HTMLDialogElement>>('farmDataDialog');
  private readonly today = this.localIsoDate(new Date());
  private planId = 0;
  private soilFormTrigger: HTMLElement | null = null;
  private taskFormTrigger: HTMLElement | null = null;
  private postponeTaskFormTrigger: HTMLElement | null = null;
  private todayTasksTrigger: HTMLElement | null = null;
  private farmDataFormTrigger: HTMLElement | null = null;

  public readonly plan = signal<ExportPlanDetails | null>(null);
  public readonly dashboard = signal<ExportPlanDashboard | null>(null);
  public readonly soilMeasurements = signal<SoilMeasurement[]>([]);
  public readonly costSummary = signal<CostDashboard | null>(null);
  public readonly diseaseReports = signal<DiseaseReport[]>([]);
  public readonly operationalSummaryLoading = signal(true);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly updatingTaskId = signal<number | null>(null);
  public readonly planTasks = signal<FarmTask[]>([]);
  public readonly taskTypes = signal<TaskType[]>([]);
  public readonly taskDrawerOpen = signal(false);
  public readonly todayTasksModalOpen = signal(false);
  public readonly taskStatusFilter = signal('all');
  public readonly taskPriorityFilter = signal('all');
  public readonly taskFormOpen = signal(false);
  public readonly taskTypesLoading = signal(false);
  public readonly taskSaving = signal(false);
  public readonly taskCreateError = signal<string | null>(null);
  public readonly taskSuccess = signal<string | null>(null);
  public readonly taskStatusOptions: FarmTask['status'][] = [
    'Pending',
    'InProgress',
    'Completed',
    'Postponed',
    'Skipped',
    'Cancelled',
  ];
  public readonly postponeTask = signal<DashboardTask | null>(null);
  public readonly postponeTaskFormOpen = signal(false);
  public readonly postponeTaskError = signal<string | null>(null);
  public readonly soilHistoryLoading = signal(false);
  public readonly soilHistoryLoaded = signal(false);
  public readonly soilHistoryError = signal<string | null>(null);
  public readonly soilFormOpen = signal(false);
  public readonly soilSaving = signal(false);
  public readonly soilError = signal<string | null>(null);
  public readonly soilSuccess = signal<string | null>(null);
  public readonly farmDataModalOpen = signal(false);
  public readonly farmDataSaving = signal(false);
  public readonly farmDataError = signal<string | null>(null);
  public readonly farmDataSuccess = signal<string | null>(null);
  public readonly startingTasks = signal(false);

  public readonly farmTypeOptions = [
    { value: 'أرض مفتوحة', label: 'أرض مفتوحة' },
    { value: 'صوب زراعية', label: 'صوب زراعية' },
    { value: 'زراعة مائية', label: 'زراعة مائية' },
    { value: 'أخرى', label: 'أخرى' },
  ] as const;

  public readonly soilTypeOptions = [
    { value: 'رملية', label: 'رملية' },
    { value: 'طينية', label: 'طينية' },
    { value: 'طميية', label: 'طميية' },
    { value: 'رملية طميية', label: 'رملية طميية' },
    { value: 'أخرى', label: 'أخرى' },
    { value: 'غير معروف', label: 'غير معروف' },
  ] as const;

  public readonly irrigationSystemOptions = [
    { value: 'تنقيط', label: 'تنقيط' },
    { value: 'رش', label: 'رش' },
    { value: 'ري سطحي', label: 'ري سطحي' },
    { value: 'زراعة مائية', label: 'زراعة مائية' },
    { value: 'أخرى', label: 'أخرى' },
    { value: 'غير محدد', label: 'غير محدد' },
  ] as const;

  public readonly fertigationOptions = [
    { value: 'نعم', label: 'نعم' },
    { value: 'لا', label: 'لا' },
    { value: 'غير محدد', label: 'غير محدد' },
  ] as const;

  public soilForm: SoilFormModel = this.emptySoilForm();
  public taskForm: CreateTaskRequest = this.emptyTaskForm();
  public farmDataForm: ExportPlanFarmDataUpdateRequest = this.emptyFarmDataForm();
  public postponeTaskDate = '';

  public readonly latestSoil = computed(() => this.dashboard()?.latestSoilMeasurement ?? null);

  public readonly planHealth = computed(() => {
    const soil = this.latestSoil();
    if (!soil) {
      return {
        label: 'غير مؤكدة',
        detail: 'أضف أول قراءة لاتخاذ قرار موثوق',
        tone: 'neutral' as InsightTone,
        score: 0,
        passed: 0,
      };
    }

    const checks = [
      soil.ph >= 5.5 && soil.ph <= 7.5,
      soil.moisture >= 45 && soil.moisture <= 85,
      soil.ec <= 3,
    ];
    const passed = checks.filter(Boolean).length;
    const score = Math.round((passed / checks.length) * 100);
    if (passed === 3)
      return {
        label: 'ممتازة',
        detail: 'المؤشرات الأساسية مستقرة',
        tone: 'good' as InsightTone,
        score,
        passed,
      };
    if (passed === 2)
      return {
        label: 'تحتاج متابعة',
        detail: 'هناك مؤشر واحد خارج النطاق',
        tone: 'warning' as InsightTone,
        score,
        passed,
      };
    return {
      label: 'تحتاج تدخلاً',
      detail: 'عدة مؤشرات خارج النطاق الآمن',
      tone: 'danger' as InsightTone,
      score,
      passed,
    };
  });

  public readonly actionTasks = computed(() => {
    const data = this.dashboard();
    if (!data) return [];
    const tasks = [
      ...(data.overdueTasks ?? []),
      ...data.upcomingTasks.filter((task) => task.plannedDate === this.today),
    ];
    return [...new Map(tasks.map((task) => [task.id, task])).values()].sort(
      (first, second) =>
        this.taskUrgency(second) - this.taskUrgency(first) ||
        first.plannedDate.localeCompare(second.plannedDate),
    );
  });

  public readonly nextTasks = computed(() => {
    const data = this.dashboard();
    if (!data) return [];
    return data.upcomingTasks.filter((task) => task.plannedDate > this.today).slice(0, 3);
  });

  public readonly filteredPlanTasks = computed(() =>
    this.planTasks().filter(
      (task) =>
        (this.taskStatusFilter() === 'all' || task.status === this.taskStatusFilter()) &&
        (this.taskPriorityFilter() === 'all' || task.priority === this.taskPriorityFilter()),
    ),
  );

  public readonly heroInsights = computed<PlanInsight[]>(() => {
    const data = this.dashboard();
    const plan = this.plan();
    if (!data || !plan) return [];

    const insights: PlanInsight[] = [];
    const overdueTasks = data.overdueTasks ?? [];
    if (plan.planningStatus === 'Failed') {
      insights.push({
        tone: 'danger',
        title: 'تعذر تحديث الخطة الذكية',
        detail: 'راجع مساحة العمل لإعادة المحاولة',
      });
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
      insights.push({
        tone: 'good',
        title: 'لا توجد مهام حرجة اليوم',
        detail: 'الخطة تسير دون إجراء عاجل',
      });
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
    this.destroyRef.onDestroy(() => this.document.body.classList.remove('gm-dialog-open'));
    this.planId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.planId) || this.planId <= 0) {
      this.loading.set(false);
      this.error.set('معرّف خطة التصدير غير صالح.');
      return;
    }
    this.load();
    this.loadTaskTypes();
    this.loadOperationalSummaries();
  }

  public readonly completionPercentage = computed(() => {
    const summary = this.dashboard()?.taskSummary;
    const percentage = summary?.total ? Math.round((summary.completed / summary.total) * 100) : 0;
    return Math.max(0, Math.min(100, percentage));
  });

  public weatherLabel(weather: DashboardWeather): string {
    if (weather.precipitationMm >= 1) return 'أمطار متوقعة';
    if (weather.tempMaxC >= 35) return 'حار';
    if (weather.tempMaxC <= 18) return 'مائل للبرودة';
    return 'طقس معتدل';
  }

  public weatherIcon(weather: DashboardWeather): string {
    return weather.precipitationMm >= 1 ? '🌧️' : weather.tempMaxC >= 35 ? '☀️' : '🌤️';
  }

  public heroCropImage(crop: string): string {
    const normalized = crop.trim().toLocaleLowerCase('ar');
    return normalized.includes('فراول') || normalized.includes('strawberry')
      ? '/landing-page/strawberry-macro.jpg'
      : '/landing-page/hero-farm.jpg';
  }

  public openTodayTasksModal(): void {
    this.todayTasksTrigger =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
    this.todayTasksModalOpen.set(true);
    this.updateBodyDialogClass();
    globalThis.setTimeout(() => this.showTodayTasksDialog());
  }

  public closeTodayTasksModal(): void {
    this.dismissTodayTasksModal();
  }

  public cancelTodayTasksModal(event: Event): void {
    event.preventDefault();
    this.closeTodayTasksModal();
  }

  public openTaskFormFromTodayModal(): void {
    this.dismissTodayTasksModal();
    this.openTaskForm();
  }

  public openAllTasksFromTodayModal(): void {
    this.dismissTodayTasksModal();
    this.taskDrawerOpen.set(true);
  }

  public markTaskComplete(task: DashboardTask): void {
    if (task.status === 'Completed' || this.updatingTaskId()) return;
    this.persistTaskStatus(task, {
      status: 'Completed',
      actualDate: this.today,
    });
  }

  public openSoilForm(): void {
    this.soilFormTrigger =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
    this.soilForm = this.emptySoilForm();
    this.soilError.set(null);
    this.soilSuccess.set(null);
    this.soilFormOpen.set(true);
    this.updateBodyDialogClass();
    globalThis.setTimeout(() => this.showSoilDialog());
  }

  public openTaskForm(): void {
    this.taskFormTrigger =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
    this.taskForm = this.emptyTaskForm();
    this.taskCreateError.set(null);
    this.taskSuccess.set(null);
    this.taskFormOpen.set(true);
    this.updateBodyDialogClass();
    if (!this.taskTypes().length && !this.taskTypesLoading()) this.loadTaskTypes();
    globalThis.setTimeout(() => this.showTaskDialog());
  }

  public closeTaskForm(): void {
    if (!this.taskSaving()) this.dismissTaskForm();
  }

  public cancelTaskForm(event: Event): void {
    event.preventDefault();
    this.closeTaskForm();
  }

  public saveNewTask(): void {
    const form = this.taskForm;
    if (!form.title.trim() || !form.taskTypeId || !form.plannedDate) {
      this.taskCreateError.set('أكمل نوع المهمة والعنوان والتاريخ أولاً.');
      return;
    }
    if (!Number.isFinite(form.quantity) || form.quantity <= 0 || !form.unit.trim()) {
      this.taskCreateError.set('أدخل كمية أكبر من صفر ووحدة قياس صحيحة.');
      return;
    }
    if (form.status === 'Completed' && !form.actualDate) {
      this.taskCreateError.set('أدخل تاريخ التنفيذ للمهمة المكتملة.');
      return;
    }

    const payload: CreateTaskRequest = {
      ...form,
      exportPlanId: this.planId,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      unit: form.unit.trim(),
      notes: form.notes?.trim() || null,
      actualDate: form.status === 'Completed' ? form.actualDate : null,
    };
    this.taskSaving.set(true);
    this.taskCreateError.set(null);
    this.api
      .createTask(payload)
      .pipe(
        finalize(() => this.taskSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.dismissTaskForm();
          this.taskSuccess.set('تمت إضافة المهمة إلى خطة التصدير الحالية.');
          this.refreshTaskData();
        },
        error: (error) =>
          this.taskCreateError.set(
            error.error?.error?.message ?? 'تعذر إنشاء المهمة. حاول مرة أخرى.',
          ),
      });
  }

  public closeSoilForm(): void {
    if (!this.soilSaving()) this.dismissSoilForm();
  }

  public cancelSoilForm(event: Event): void {
    event.preventDefault();
    this.closeSoilForm();
  }

  public onSoilDetailsToggle(event: Event): void {
    if ((event.currentTarget as HTMLDetailsElement).open) this.loadSoilHistory();
  }

  public saveSoilReading(): void {
    if (!this.validSoilReading()) {
      this.soilError.set(
        'أدخل كل نتائج القياس: الحموضة من 0 إلى 14، والرطوبة من 0 إلى 100، وباقي القيم غير سالبة.',
      );
      return;
    }

    this.soilSaving.set(true);
    this.soilError.set(null);
    const payload: SoilMeasurementRequest = {
      measurementDate: this.soilForm.measurementDate,
      ph: this.soilForm.ph!,
      ec: this.soilForm.ec!,
      nitrogen: this.soilForm.nitrogen!,
      phosphorus: this.soilForm.phosphorus!,
      potassium: this.soilForm.potassium!,
      moisture: this.soilForm.moisture!,
      notes: this.soilForm.notes?.trim() || null,
    };
    this.api
      .createSoilMeasurement(this.planId, payload)
      .pipe(
        finalize(() => this.soilSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (reading) => {
          if (this.soilHistoryLoaded())
            this.soilMeasurements.update((items) => [reading, ...items]);
          this.dismissSoilForm();
          this.soilSuccess.set('تم حفظ قراءة التربة وتحديث حالة الخطة.');
          this.refreshDashboard();
        },
        error: (error) =>
          this.soilError.set(
            error.error?.error?.message ?? 'تعذر حفظ قراءة التربة. حاول مرة أخرى.',
          ),
      });
  }

  public changeTaskStatus(task: DashboardTask, event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    const status = select.value as FarmTask['status'];
    select.value = task.status;
    if (status === task.status || this.updatingTaskId()) return;

    if (status === 'Postponed') {
      this.openPostponeTaskForm(task, select);
      return;
    }

    this.persistTaskStatus(task, {
      status,
      ...(status === 'Completed' ? { actualDate: this.today } : {}),
    });
  }

  public closePostponeTaskForm(): void {
    if (!this.updatingTaskId()) this.dismissPostponeTaskForm();
  }

  public cancelPostponeTaskForm(event: Event): void {
    event.preventDefault();
    this.closePostponeTaskForm();
  }

  public saveTaskPostponement(): void {
    const task = this.postponeTask();
    if (!task) return;
    if (!this.postponeTaskDate || this.postponeTaskDate <= task.plannedDate) {
      this.postponeTaskError.set('اختر موعداً جديداً بعد الموعد الحالي للمهمة.');
      return;
    }

    this.postponeTaskError.set(null);
    this.persistTaskStatus(
      task,
      { status: 'Postponed', plannedDate: this.postponeTaskDate },
      () => this.dismissPostponeTaskForm(),
      () => this.postponeTaskError.set('تعذر تأجيل المهمة. حاول مرة أخرى.'),
    );
  }

  private persistTaskStatus(
    task: DashboardTask,
    body: { status: FarmTask['status']; plannedDate?: string; actualDate?: string },
    onSuccess?: () => void,
    onError?: () => void,
  ): void {
    if (this.updatingTaskId()) return;
    this.updatingTaskId.set(task.id);
    this.error.set(null);
    this.api
      .updateTask(task.id, body)
      .pipe(
        switchMap(() =>
          forkJoin({
            dashboard: this.api.dashboard(this.planId),
            tasks: this.api.planTasks(this.planId),
          }),
        ),
        finalize(() => this.updatingTaskId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ dashboard, tasks }) => {
          this.dashboard.set(dashboard);
          this.planTasks.set(tasks);
          onSuccess?.();
        },
        error: () => {
          if (onError) onError();
          else this.error.set('تعذر تحديث المهمة. حاول مرة أخرى.');
        },
      });
  }

  public statusLabel(status: string): string {
    return (
      (
        {
          Planning: 'قيد التخطيط',
          InProgress: 'قيد التنفيذ',
          ReadyForExport: 'جاهزة للتصدير',
          Completed: 'مكتملة',
          Draft: 'مسودة',
          Cancelled: 'ملغاة',
        } as Record<string, string>
      )[status] ?? status
    );
  }

  public statusMessage(status: string): string {
    return (
      (
        {
          Planning: 'يجري إعداد خطوات الموسم',
          InProgress: 'الخطة نشطة وتحتاج متابعة يومية',
          ReadyForExport: 'المحصول جاهز للانتقال إلى التصدير',
          Completed: 'اكتملت الخطة بنجاح',
          Draft: 'أكمل البيانات لبدء التنفيذ',
          Cancelled: 'تم إيقاف العمل على هذه الخطة',
        } as Record<string, string>
      )[status] ?? 'تابع المؤشرات والمهام القادمة'
    );
  }

  public taskStatusLabel(task: DashboardTask): string {
    return localizedTaskStatusLabel(task.status);
  }

  public farmTaskStatusLabel(status: FarmTask['status']): string {
    return localizedTaskStatusLabel(status);
  }

  public priorityLabel(priority: string): string {
    return taskPriorityLabel(priority);
  }

  public taskTypeLabel(value: string): string {
    return taskTypeLabel(value);
  }

  public isOverdue(task: DashboardTask): boolean {
    return (
      task.plannedDate < this.today &&
      ['Pending', 'InProgress', 'Postponed'].includes(task.status)
    );
  }

  public formatDate(value: string): string {
    if (!value) return '—';
    return new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  public compactDate(value: string): string {
    if (!value) return '—';
    return new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
    });
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
      tasks: this.api.planTasks(this.planId),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ plan, dashboard, tasks }) => {
          this.plan.set(plan);
          this.dashboard.set(dashboard);
          this.planTasks.set(tasks);
        },
        error: () =>
          this.error.set('تعذر تحميل تفاصيل خطة التصدير. تأكد من أن الخطة ما زالت متاحة.'),
      });
  }

  private refreshDashboard(): void {
    this.api
      .dashboard(this.planId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dashboard) => this.dashboard.set(dashboard),
      });
  }

  private loadOperationalSummaries(): void {
    this.operationalSummaryLoading.set(true);
    forkJoin({
      costs: this.phaseApi.costDashboard(this.planId).pipe(catchError(() => of(null))),
      diseases: this.phaseApi.diseaseReports(this.planId, 1).pipe(catchError(() => of(null))),
    })
      .pipe(
        finalize(() => this.operationalSummaryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ costs, diseases }) => {
        this.costSummary.set(costs);
        this.diseaseReports.set(diseases?.items ?? []);
      });
  }

  private loadSoilHistory(): void {
    if (this.soilHistoryLoaded() || this.soilHistoryLoading()) return;
    this.soilHistoryLoading.set(true);
    this.soilHistoryError.set(null);
    this.api
      .soilMeasurements(this.planId)
      .pipe(
        finalize(() => this.soilHistoryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (soil) => {
          this.soilMeasurements.set(
            [...soil].sort((first, second) =>
              second.measurementDate.localeCompare(first.measurementDate),
            ),
          );
          this.soilHistoryLoaded.set(true);
        },
        error: () => this.soilHistoryError.set('تعذر تحميل سجل قراءات التربة.'),
      });
  }

  private taskUrgency(task: DashboardTask): number {
    const priority =
      ({ Low: 1, Medium: 2, High: 3, Critical: 4 } as Record<string, number>)[task.priority] ?? 0;
    return (this.isOverdue(task) ? 10 : 0) + priority;
  }

  private validSoilReading(): boolean {
    const form = this.soilForm;
    const values = [
      form.ph,
      form.ec,
      form.nitrogen,
      form.phosphorus,
      form.potassium,
      form.moisture,
    ];
    return (
      Boolean(form.measurementDate) &&
      values.every((value) => typeof value === 'number' && Number.isFinite(value)) &&
      form.ph! >= 0 &&
      form.ph! <= 14 &&
      form.moisture! >= 0 &&
      form.moisture! <= 100 &&
      [form.ec!, form.nitrogen!, form.phosphorus!, form.potassium!].every((value) => value >= 0)
    );
  }

  private refreshTaskData(): void {
    forkJoin({
      dashboard: this.api.dashboard(this.planId),
      tasks: this.api.planTasks(this.planId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ dashboard, tasks }) => {
          this.dashboard.set(dashboard);
          this.planTasks.set(tasks);
        },
        error: () =>
          this.error.set('تمت إضافة المهمة، لكن تعذر تحديث بيانات الخطة. حدّث الصفحة لعرضها.'),
      });
  }

  private loadTaskTypes(): void {
    this.taskTypesLoading.set(true);
    this.api
      .taskTypes()
      .pipe(
        finalize(() => this.taskTypesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (types) => {
          this.taskTypes.set(types);
          if (!this.taskForm.taskTypeId) this.taskForm.taskTypeId = types[0]?.id ?? 0;
        },
        error: () =>
          this.taskCreateError.set('تعذر تحميل أنواع المهام. حاول فتح النموذج مرة أخرى.'),
      });
  }

  private openPostponeTaskForm(task: DashboardTask, trigger: HTMLElement): void {
    this.postponeTaskFormTrigger = trigger;
    this.postponeTask.set(task);
    this.postponeTaskDate =
      task.plannedDate < this.today ? this.today : this.addDays(task.plannedDate, 1);
    this.postponeTaskError.set(null);
    this.postponeTaskFormOpen.set(true);
    this.updateBodyDialogClass();
    globalThis.setTimeout(() => this.showPostponeTaskDialog());
  }

  public isFormSoilAnalysisCompleted(): boolean {
    const f = this.farmDataForm;
    return f.soilPh != null && f.soilPh >= 0 && f.soilPh <= 14 &&
      f.soilEc != null && f.soilEc >= 0 &&
      f.soilNitrogen != null && f.soilNitrogen >= 0 &&
      f.soilPhosphorus != null && f.soilPhosphorus >= 0 &&
      f.soilPotassium != null && f.soilPotassium >= 0 &&
      f.soilOrganicMatter != null && f.soilOrganicMatter >= 0;
  }

  public isFormWaterAnalysisCompleted(): boolean {
    const f = this.farmDataForm;
    return f.waterPh != null && f.waterPh >= 0 && f.waterPh <= 14 &&
      f.waterEc != null && f.waterEc >= 0 &&
      f.waterSalinity != null && f.waterSalinity >= 0 &&
      f.waterSodium != null && f.waterSodium >= 0 &&
      f.waterChloride != null && f.waterChloride >= 0 &&
      f.waterBicarbonate != null && f.waterBicarbonate >= 0 &&
      f.waterCalcium != null && f.waterCalcium >= 0 &&
      f.waterMagnesium != null && f.waterMagnesium >= 0 &&
      f.waterSar != null && f.waterSar >= 0;
  }

  public isFormFarmDataReady(): boolean {
    return !!this.farmDataForm.farmType && !!this.farmDataForm.soilType && !!this.farmDataForm.irrigationSystem &&
      this.isFormSoilAnalysisCompleted() && this.isFormWaterAnalysisCompleted();
  }

  public farmDataChecklist(plan: ExportPlanDetails): { label: string; completed: boolean }[] {
    return [
      { label: 'نوع المزرعة', completed: !!(plan.farmType || plan.farmData?.farmType) },
      { label: 'نوع التربة', completed: !!(plan.soilType || plan.farmData?.soilType) },
      { label: 'تحليل التربة (6 مؤشرات)', completed: !!(plan.soilAnalysis?.isCompleted ?? plan.isSoilAnalysisCompleted) },
      { label: 'تحليل مياه الري (9 مؤشرات)', completed: !!(plan.waterAnalysis?.isCompleted ?? plan.isWaterAnalysisCompleted) },
      { label: 'نظام الري', completed: !!(plan.irrigationSystem || plan.farmData?.irrigationSystem) },
    ];
  }

  public farmDataChecklistProgress(plan: ExportPlanDetails): number {
    const items = this.farmDataChecklist(plan);
    const completed = items.filter((i) => i.completed).length;
    return Math.round((completed / items.length) * 100);
  }

  public farmDataChecklistCount(plan: ExportPlanDetails): number {
    return this.farmDataChecklist(plan).filter((i) => i.completed).length;
  }

  public openFarmDataModal(): void {
    const current = this.plan();
    this.farmDataFormTrigger = this.document.activeElement instanceof HTMLElement
      ? this.document.activeElement
      : null;
    this.farmDataForm = {
      farmType: current?.farmType ?? current?.farmData?.farmType ?? '',
      soilType: current?.soilType ?? current?.farmData?.soilType ?? '',
      irrigationSystem: current?.irrigationSystem ?? current?.farmData?.irrigationSystem ?? '',
      fertigation: current?.fertigation ?? current?.farmData?.fertigation ?? '',
      soilPh: current?.soilAnalysis?.ph ?? current?.soilPh ?? current?.farmData?.soilPh ?? null,
      soilEc: current?.soilAnalysis?.ec ?? current?.soilEc ?? current?.farmData?.soilEc ?? null,
      soilNitrogen: current?.soilAnalysis?.nitrogen ?? current?.soilNitrogen ?? current?.farmData?.soilNitrogen ?? null,
      soilPhosphorus: current?.soilAnalysis?.phosphorus ?? current?.soilPhosphorus ?? current?.farmData?.soilPhosphorus ?? null,
      soilPotassium: current?.soilAnalysis?.potassium ?? current?.soilPotassium ?? current?.farmData?.soilPotassium ?? null,
      soilOrganicMatter: current?.soilAnalysis?.organicMatter ?? current?.soilOrganicMatter ?? current?.farmData?.soilOrganicMatter ?? null,
      waterPh: current?.waterAnalysis?.ph ?? current?.waterPh ?? current?.farmData?.waterPh ?? null,
      waterEc: current?.waterAnalysis?.ec ?? current?.waterEc ?? current?.farmData?.waterEc ?? null,
      waterSalinity: current?.waterAnalysis?.salinity ?? current?.waterSalinity ?? current?.farmData?.waterSalinity ?? null,
      waterSodium: current?.waterAnalysis?.sodium ?? current?.waterSodium ?? current?.farmData?.waterSodium ?? null,
      waterChloride: current?.waterAnalysis?.chloride ?? current?.waterChloride ?? current?.farmData?.waterChloride ?? null,
      waterBicarbonate: current?.waterAnalysis?.bicarbonate ?? current?.waterBicarbonate ?? current?.farmData?.waterBicarbonate ?? null,
      waterCalcium: current?.waterAnalysis?.calcium ?? current?.waterCalcium ?? current?.farmData?.waterCalcium ?? null,
      waterMagnesium: current?.waterAnalysis?.magnesium ?? current?.waterMagnesium ?? current?.farmData?.waterMagnesium ?? null,
      waterSar: current?.waterAnalysis?.sar ?? current?.waterSar ?? current?.farmData?.waterSar ?? null,
    };
    this.farmDataError.set(null);
    this.farmDataSuccess.set(null);
    this.farmDataModalOpen.set(true);
    this.updateBodyDialogClass();
    globalThis.setTimeout(() => this.showFarmDataDialog());
  }

  public closeFarmDataModal(): void {
    if (!this.farmDataSaving()) {
      this.dismissFarmDataForm();
    }
  }

  public handleFarmDataBackdropClick(event: MouseEvent): void {
    if (event.target === this.farmDataDialog()?.nativeElement) {
      this.closeFarmDataModal();
    }
  }

  public handlePostponeTaskBackdropClick(event: MouseEvent): void {
    if (event.target === this.postponeTaskDialog()?.nativeElement) {
      this.closePostponeTaskForm();
    }
  }

  public handleTaskBackdropClick(event: MouseEvent): void {
    if (event.target === this.taskDialog()?.nativeElement) {
      this.closeTaskForm();
    }
  }

  public handleSoilBackdropClick(event: MouseEvent): void {
    if (event.target === this.soilDialog()?.nativeElement) {
      this.closeSoilForm();
    }
  }

  public handleTodayTasksBackdropClick(event: MouseEvent): void {
    if (event.target === this.todayTasksDialog()?.nativeElement) {
      this.closeTodayTasksModal();
    }
  }

  public saveFarmData(): void {
    if (this.farmDataForm.soilPh != null && (this.farmDataForm.soilPh < 0 || this.farmDataForm.soilPh > 14)) {
      this.farmDataError.set('درجة حموضة التربة (pH) يجب أن تكون بين 0 و 14.');
      return;
    }
    if (this.farmDataForm.waterPh != null && (this.farmDataForm.waterPh < 0 || this.farmDataForm.waterPh > 14)) {
      this.farmDataError.set('درجة حموضة المياه (pH) يجب أن تكون بين 0 و 14.');
      return;
    }
    this.farmDataSaving.set(true);
    this.farmDataError.set(null);
    this.api.updateFarmData(this.planId, this.farmDataForm).pipe(
      finalize(() => this.farmDataSaving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (updatedPlan) => {
        this.plan.set(updatedPlan);
        this.dismissFarmDataForm();
        this.farmDataSuccess.set('تم حفظ وتحديث بيانات المزرعة والتحاليل بنجاح.');
      },
      error: (err) => {
        this.farmDataError.set(err.error?.error?.message ?? 'تعذر حفظ بيانات المزرعة.');
      },
    });
  }

  public startTasks(): void {
    if (this.startingTasks()) return;
    this.startingTasks.set(true);
    this.error.set(null);
    this.api.startTasks(this.planId).pipe(
      finalize(() => this.startingTasks.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (updatedPlan) => {
        this.plan.set(updatedPlan);
        this.farmDataSuccess.set('تم تفعيل خطة المهام الزراعية، جارٍ الآن التوليد بالذكاء الاصطناعي.');
        this.pollPlanning(this.planId);
      },
      error: (err) => {
        this.error.set(err.error?.error?.message ?? 'تعذر بدء توليد المهام.');
      },
    });
  }

  private pollPlanning(planId: number): void {
    timer(0, 2000).pipe(
      switchMap(() => this.api.planningStatus(planId).pipe(catchError(() => EMPTY))),
      takeWhile((status) => status.status === 'Pending' || status.status === 'InProgress', true),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((status) => {
      if (status.status === 'Succeeded' || status.status === 'Failed') {
        this.load();
      }
    });
  }

  private showFarmDataDialog(): void {
    const dialog = this.farmDataDialog()?.nativeElement;
    if (!dialog?.isConnected) return;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
  }

  private dismissFarmDataForm(): void {
    const dialog = this.farmDataDialog()?.nativeElement;
    if (dialog?.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
    this.farmDataModalOpen.set(false);
    this.updateBodyDialogClass();
    const trigger = this.farmDataFormTrigger;
    this.farmDataFormTrigger = null;
    globalThis.setTimeout(() => trigger?.focus());
  }

  private emptyFarmDataForm(): ExportPlanFarmDataUpdateRequest {
    return {
      farmType: '',
      soilType: '',
      irrigationSystem: '',
      fertigation: '',
      soilPh: null,
      soilEc: null,
      soilNitrogen: null,
      soilPhosphorus: null,
      soilPotassium: null,
      soilOrganicMatter: null,
      waterPh: null,
      waterEc: null,
      waterSalinity: null,
      waterSodium: null,
      waterChloride: null,
      waterBicarbonate: null,
      waterCalcium: null,
      waterMagnesium: null,
      waterSar: null,
    };
  }

  private showTodayTasksDialog(): void {
    const dialog = this.todayTasksDialog()?.nativeElement;
    if (!dialog?.isConnected) return;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
  }

  private dismissTodayTasksModal(): void {
    const dialog = this.todayTasksDialog()?.nativeElement;
    if (dialog?.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
    this.todayTasksModalOpen.set(false);
    this.updateBodyDialogClass();
    const trigger = this.todayTasksTrigger;
    this.todayTasksTrigger = null;
    globalThis.setTimeout(() => trigger?.focus());
  }

  private showSoilDialog(): void {
    const dialog = this.soilDialog()?.nativeElement;
    if (!dialog?.isConnected) return;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    this.document.getElementById('soil-measurement-date')?.focus();
  }

  private showTaskDialog(): void {
    const dialog = this.taskDialog()?.nativeElement;
    if (!dialog?.isConnected) return;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    this.document.getElementById('unplanned-task-title')?.focus();
  }

  private showPostponeTaskDialog(): void {
    const dialog = this.postponeTaskDialog()?.nativeElement;
    if (!dialog?.isConnected) return;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    this.document.getElementById('postpone-task-date')?.focus();
  }

  private dismissTaskForm(): void {
    const dialog = this.taskDialog()?.nativeElement;
    if (dialog?.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
    this.taskFormOpen.set(false);
    this.updateBodyDialogClass();
    const trigger = this.taskFormTrigger;
    this.taskFormTrigger = null;
    globalThis.setTimeout(() => trigger?.focus());
  }

  private dismissPostponeTaskForm(): void {
    const dialog = this.postponeTaskDialog()?.nativeElement;
    if (dialog?.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
    this.postponeTaskFormOpen.set(false);
    this.postponeTask.set(null);
    this.postponeTaskError.set(null);
    this.updateBodyDialogClass();
    const trigger = this.postponeTaskFormTrigger;
    this.postponeTaskFormTrigger = null;
    globalThis.setTimeout(() => trigger?.focus());
  }

  private dismissSoilForm(): void {
    const dialog = this.soilDialog()?.nativeElement;
    if (dialog?.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
    this.soilFormOpen.set(false);
    this.updateBodyDialogClass();
    const trigger = this.soilFormTrigger;
    this.soilFormTrigger = null;
    globalThis.setTimeout(() => trigger?.focus());
  }

  private updateBodyDialogClass(): void {
    if (
      this.todayTasksModalOpen() ||
      this.taskFormOpen() ||
      this.soilFormOpen() ||
      this.postponeTaskFormOpen() ||
      this.farmDataModalOpen()
    ) {
      this.document.body.classList.add('gm-dialog-open');
    } else {
      this.document.body.classList.remove('gm-dialog-open');
    }
  }

  private emptySoilForm(): SoilFormModel {
    return {
      measurementDate: this.today,
      ph: null,
      ec: null,
      nitrogen: null,
      phosphorus: null,
      potassium: null,
      moisture: null,
      notes: null,
    };
  }

  private emptyTaskForm(): CreateTaskRequest {
    return {
      exportPlanId: this.planId,
      taskTypeId: this.taskTypes?.()[0]?.id ?? 0,
      title: '',
      description: null,
      quantity: 1,
      unit: 'وحدة',
      plannedDate: this.today,
      actualDate: null,
      status: 'Pending',
      priority: 'Medium',
      notes: null,
    };
  }

  private localIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private addDays(value: string, days: number): string {
    const date = new Date(`${value}T00:00:00`);
    date.setDate(date.getDate() + days);
    return this.localIsoDate(date);
  }
}
