import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, switchMap } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { DashboardTask, ExportPlan, ExportPlanDashboard } from '@core/api/api.models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard-view.html',
})
export class Dashboard {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);

  public readonly plans = signal<ExportPlan[]>([]);
  public readonly selectedPlanId = signal<number | null>(null);
  public readonly data = signal<ExportPlanDashboard | null>(null);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly updatingTaskId = signal<number | null>(null);

  public constructor() {
    this.api.exportPlans().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        const selected = plans.find((plan) => plan.planningStatus === 'Succeeded') ?? plans[0];
        if (selected) this.selectPlan(selected.id);
        else this.loading.set(false);
      },
      error: () => { this.error.set('تعذر تحميل خطط التصدير.'); this.loading.set(false); },
    });
  }

  public selectPlan(id: number): void {
    this.selectedPlanId.set(id);
    this.loading.set(true);
    this.error.set(null);
    this.api.dashboard(id).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: (data) => this.data.set(data), error: () => this.error.set('تعذر تحميل لوحة الخطة.') });
  }

  public toggleTask(task: DashboardTask): void {
    this.updatingTaskId.set(task.id);
    const completed = task.status === 'Completed';
    const body = completed
      ? { status: 'Pending' }
      : { status: 'Completed', actualDate: new Date().toISOString().slice(0, 10) };
    this.api.updateTask(task.id, body).pipe(
      switchMap(() => this.api.dashboard(this.selectedPlanId()!)),
      finalize(() => this.updatingTaskId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: (data) => this.data.set(data), error: () => this.error.set('تعذر تحديث المهمة.') });
  }
}
