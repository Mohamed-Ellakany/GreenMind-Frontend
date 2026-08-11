import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, finalize, map, of, switchMap } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { DashboardTask, DashboardWeather, ExportPlan, ExportPlanDashboard } from '@core/api/api.models';
import { AuthService } from '@features/auth/services/AuthService';
import { toLocalIsoDate } from '@shared/utils/local-date';
import { taskPriorityLabel, taskTypeLabel } from '@shared/utils/task-labels';

interface DashboardLoadResult {
  requestId: number;
  data: ExportPlanDashboard | null;
  error: string | null;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './dashboard-view.html',
})
export class Dashboard {
  private readonly api = inject(GreenmindApi);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly planSelections = new Subject<{ id: number; requestId: number }>();
  private dashboardRequestId = 0;

  public readonly plans = signal<ExportPlan[]>([]);
  public readonly selectedPlanId = signal<number | null>(null);
  public readonly data = signal<ExportPlanDashboard | null>(null);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly updatingTaskId = signal<number | null>(null);
  public readonly taskFeedback = signal<string | null>(null);
  public readonly ownerName = computed(() => this.auth.accountProfile()?.fullName?.trim() || 'صاحب المزرعة');
  public readonly completionPercentage = computed(() => {
    const summary = this.data()?.taskSummary;
    const percentage = summary?.total ? Math.round(summary.completed / summary.total * 100) : 0;
    return Math.max(0, Math.min(100, percentage));
  });
  public readonly todayIsoDate = toLocalIsoDate();
  public readonly todayLabel = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  public readonly greeting = new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';

  public constructor() {
    this.planSelections.pipe(
      switchMap(({ id, requestId }) => this.api.dashboard(id).pipe(
        map((data): DashboardLoadResult => ({ requestId, data, error: null })),
        catchError(() => of<DashboardLoadResult>({
          requestId,
          data: null,
          error: 'تعذر تحميل لوحة الخطة.',
        })),
        finalize(() => {
          if (this.dashboardRequestId === requestId) this.loading.set(false);
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      if (result.requestId !== this.dashboardRequestId) return;
      this.data.set(result.data);
      this.error.set(result.error);
    });

    this.loadPlans();
  }

  public selectPlan(id: number): void {
    if (!Number.isInteger(id) || id <= 0) return;
    const requestId = ++this.dashboardRequestId;
    this.selectedPlanId.set(id);
    this.data.set(null);
    this.loading.set(true);
    this.error.set(null);
    this.taskFeedback.set(null);
    this.planSelections.next({ id, requestId });
  }

  public retry(): void {
    const selectedPlanId = this.selectedPlanId();
    if (selectedPlanId) this.selectPlan(selectedPlanId);
    else this.loadPlans();
  }

  private loadPlans(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.exportPlans().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.selectedPlanId.set(null);
        this.data.set(null);
        this.loading.set(false);
      },
      error: () => { this.error.set('تعذر تحميل خطط التصدير.'); this.loading.set(false); },
    });
  }

  public updateTaskStatus(task: DashboardTask, status: 'Completed' | 'Skipped'): void {
    if (this.updatingTaskId()) return;
    const selectedPlanId = this.selectedPlanId();
    if (!selectedPlanId) return;
    this.updatingTaskId.set(task.id);
    this.taskFeedback.set(null);
    const body = status === 'Completed'
      ? { status, actualDate: toLocalIsoDate() }
      : { status, actualDate: undefined };
    this.api.updateTask(task.id, body).pipe(
      finalize(() => this.updatingTaskId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        if (this.selectedPlanId() === selectedPlanId) this.selectPlan(selectedPlanId);
        this.taskFeedback.set(status === 'Completed'
          ? 'تم تسجيل تنفيذ المهمة، وسنستخدم هذه المعلومة لتحسين المهام القادمة.'
          : 'تم تسجيل تخطي المهمة، وسنراعي هذا القرار عند إعداد المهام القادمة.');
      },
      error: () => this.error.set('تعذر تحديث المهمة.'),
    });
  }

  public taskTypeLabel(value: string): string {
    return taskTypeLabel(value);
  }

  public priorityLabel(value: string): string {
    return taskPriorityLabel(value);
  }

  public weatherLabel(weather: DashboardWeather): string {
    if (weather.precipitationMm >= 1) return 'أمطار متوقعة';
    if (weather.tempMaxC >= 35) return 'حار';
    if (weather.tempMaxC <= 18) return 'مائل للبرودة';
    return 'طقس معتدل';
  }

  public weatherIcon(weather: DashboardWeather): string {
    return weather.precipitationMm >= 1 ? '🌧️' : weather.tempMaxC >= 35 ? '☀️' : '🌤️';
  }
}
