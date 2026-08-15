import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlan, FarmTask } from '@core/api/api.models';
import { PhaseTwoApi } from '@features/dashboard/phase-two/phase-two-api.service';
import { AuthService } from '@features/auth/services/AuthService';
import { ProductTourService } from '@core/tour/product-tour.service';
import { toLocalIsoDate } from '@shared/utils/local-date';
import { taskPriorityLabel, taskTypeLabel } from '@shared/utils/task-labels';

type SoilSnapshot = {
  measurementDate?: string;
  ph: number;
  ec: number;
  moisture: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  notes?: string | null;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './dashboard-view.html',
})
export class Dashboard {
  public readonly tour = inject(ProductTourService);
  private readonly api = inject(GreenmindApi);
  private readonly phaseApi = inject(PhaseTwoApi);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly plans = signal<ExportPlan[]>([]);
  public readonly allTasks = signal<FarmTask[]>([]);
  public readonly latestSoil = signal<SoilSnapshot | null>(null);
  public readonly totalFarmExpenses = signal<number>(0);
  public readonly totalFarmPlannedBudget = signal<number>(0);

  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly updatingTaskId = signal<number | null>(null);
  public readonly taskFeedback = signal<string | null>(null);

  public readonly ownerName = computed(() => this.auth.accountProfile()?.fullName?.trim() || 'صاحب المزرعة');
  public readonly farmName = computed(() => this.auth.accountProfile()?.farmName || 'المزرعة');

  public readonly todayIsoDate = toLocalIsoDate();
  public readonly todayLabel = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  public readonly greeting = new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';

  public readonly planMap = computed(() => {
    const map = new Map<number, ExportPlan>();
    for (const plan of this.plans()) {
      map.set(plan.id, plan);
    }
    return map;
  });

  // Farm-Wide Aggregations
  public readonly totalPlansCount = computed(() => this.plans().length);
  public readonly activePlans = computed(() =>
    this.plans().filter((p) => p.status !== 'Completed' && p.status !== 'Cancelled')
  );
  public readonly activePlansCount = computed(() => this.activePlans().length);

  public readonly totalTasksCount = computed(() => this.allTasks().length);
  public readonly completedTasksCount = computed(() =>
    this.allTasks().filter((t) => t.status === 'Completed').length
  );
  public readonly pendingTasksCount = computed(() =>
    this.allTasks().filter((t) => t.status === 'Pending' || t.status === 'InProgress' || t.status === 'Postponed').length
  );
  public readonly overdueTasksCount = computed(() =>
    this.allTasks().filter((t) =>
      (t.status === 'Pending' || t.status === 'InProgress') && t.plannedDate < this.todayIsoDate
    ).length
  );

  public readonly farmCompletionPercentage = computed(() => {
    const total = this.totalTasksCount();
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round((this.completedTasksCount() / total) * 100)));
  });

  public readonly nearestExportPlan = computed(() => {
    const active = this.activePlans().filter((p) => p.expectedExportDate);
    if (!active.length) return null;
    const sorted = [...active].sort((a, b) =>
      a.expectedExportDate.localeCompare(b.expectedExportDate)
    );
    const upcoming = sorted.find((p) => p.expectedExportDate >= this.todayIsoDate);
    return upcoming || sorted[0];
  });

  public readonly upcomingFarmTasks = computed(() => {
    const pending = this.allTasks().filter((t) => t.status !== 'Completed' && t.status !== 'Skipped' && t.status !== 'Cancelled');
    return [...pending]
      .sort((a, b) => {
        const aOverdue = a.plannedDate < this.todayIsoDate ? 1 : 0;
        const bOverdue = b.plannedDate < this.todayIsoDate ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue; // overdue first
        return a.plannedDate.localeCompare(b.plannedDate);
      })
      .slice(0, 7);
  });

  public constructor() {
    this.loadFarmDashboard();
  }

  public loadFarmDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      plans: this.api.exportPlans().pipe(catchError(() => of([]))),
      tasks: this.api.tasks('pageSize=100').pipe(catchError(() => of([]))),
      costComparison: this.phaseApi.farmCostComparison().pipe(catchError(() => of([]))),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ plans, tasks, costComparison }) => {
        this.plans.set(plans);
        this.allTasks.set(tasks);

        const totalExpenses = (costComparison || []).reduce(
          (sum, item) => sum + (Number(item.totalExpenses) || 0),
          0,
        );
        const totalPlanned = (costComparison || []).reduce(
          (sum, item) => sum + (Number(item.plannedBudget) || 0),
          0,
        );
        this.totalFarmExpenses.set(totalExpenses);
        this.totalFarmPlannedBudget.set(totalPlanned);

        if (plans.length > 0) {
          this.api.dashboard(plans[0].id).pipe(
            catchError(() => of(null)),
            takeUntilDestroyed(this.destroyRef),
          ).subscribe((dash) => {
            if (dash) {
              this.latestSoil.set(dash.latestSoilMeasurement || null);
            }
            this.loading.set(false);
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set('تعذر تحميل بيانات المزرعة الشاملة.');
        this.loading.set(false);
      },
    });
  }

  public updateTaskStatus(task: FarmTask, status: 'Completed' | 'Skipped'): void {
    if (this.updatingTaskId()) return;
    this.updatingTaskId.set(task.id);
    this.taskFeedback.set(null);

    const body = status === 'Completed'
      ? { status, actualDate: this.todayIsoDate }
      : { status, actualDate: undefined };

    this.api.updateTask(task.id, body).pipe(
      finalize(() => this.updatingTaskId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.allTasks.update((tasks) =>
          tasks.map((t) => (t.id === task.id ? { ...t, status } : t))
        );
        this.taskFeedback.set(
          status === 'Completed'
            ? `تم تسجيل تنفيذ مهمة «${task.title}» بنجاح.`
            : `تم تسجيل تخطي مهمة «${task.title}».`
        );
      },
      error: () => this.error.set('تعذر تحديث حالة المهمة.'),
    });
  }

  public daysUntil(dateString?: string | null): number {
    if (!dateString) return 0;
    const target = new Date(`${dateString}T00:00:00`).getTime();
    const today = new Date(`${this.todayIsoDate}T00:00:00`).getTime();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  public taskTypeLabel(value?: string | null): string {
    return taskTypeLabel(value || '');
  }

  public priorityLabel(value: string): string {
    return taskPriorityLabel(value);
  }

  public planStatusLabel(status: string): string {
    switch (status) {
      case 'Executing':
      case 'Planned':
        return 'نشطة ومخططة';
      case 'Draft':
        return 'مسودة';
      case 'Completed':
        return 'مكتملة';
      case 'Cancelled':
        return 'ملغاة';
      default:
        return 'نشطة';
    }
  }
}
