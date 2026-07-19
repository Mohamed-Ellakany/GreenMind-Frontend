import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, filter, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { ExportPlanApiService } from '../../../core/services/export-plan-api.service';
import { GrowthStageBadgeComponent } from '../../../shared/components/growth-stage-badge.component';
import { TaskStatusBadgeComponent } from '../../../shared/components/task-status-badge.component';
import {
  ExportPlan,
  ExportPlanDashboard,
} from '../../../shared/models/export-plan.model';

@Component({
  selector: 'app-plan-dashboard',
  imports: [RouterLink, GrowthStageBadgeComponent, TaskStatusBadgeComponent],
  templateUrl: './plan-dashboard.component.html',
  styleUrl: './plan-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanDashboardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly exportPlanApiService = inject(ExportPlanApiService);

  readonly plan = signal<ExportPlan | null>(null);
  readonly dashboard = signal<ExportPlanDashboard | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  constructor() {
    this.route.parent!.paramMap
      .pipe(
        map((params) => params.get('exportPlanId')),
        filter((exportPlanId): exportPlanId is string => exportPlanId !== null),
        distinctUntilChanged(),
        tap(() => this.clearDashboardState()),
        switchMap((exportPlanId) =>
          forkJoin({
            plan: this.exportPlanApiService.getById(exportPlanId),
            dashboard: this.exportPlanApiService
              .getDashboard(exportPlanId)
              .pipe(catchError(() => of(null))),
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ plan, dashboard }) => {
          this.plan.set(plan);
          this.dashboard.set(dashboard);
          this.hasError.set(dashboard === null);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(
      new Date(value),
    );
  }

  private clearDashboardState(): void {
    this.plan.set(null);
    this.dashboard.set(null);
    this.hasError.set(false);
    this.isLoading.set(true);
  }
}
