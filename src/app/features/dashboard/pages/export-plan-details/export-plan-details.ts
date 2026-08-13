import { DOCUMENT } from '@angular/common';
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
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
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
  ExportPlanDashboard,
  ExportPlanDetails,
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
  private readonly today = this.localIsoDate(new Date());
  private planId = 0;
  private soilFormTrigger: HTMLElement | null = null;
  private taskFormTrigger: HTMLElement | null = null;
  private postponeTaskFormTrigger: HTMLElement | null = null;
  private todayTasksTrigger: HTMLElement | null = null;

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

  public soilForm: SoilFormModel = this.emptySoilForm();
  public taskForm: CreateTaskRequest = this.emptyTaskForm();
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
      this.postponeTaskFormOpen()
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
