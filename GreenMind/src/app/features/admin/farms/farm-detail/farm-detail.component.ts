import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs';

import { AdminFarmApiService } from '../../../../core/services/admin-farm-api.service';
import { Farm } from '../../../../shared/models/farm.model';

type FarmAction = 'approve' | 'activate' | 'deactivate';

@Component({
  selector: 'app-admin-farm-detail',
  imports: [RouterLink],
  templateUrl: './farm-detail.component.html',
  styleUrl: './farm-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminFarmApiService = inject(AdminFarmApiService);

  readonly farm = signal<Farm | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly toastMessage = signal<string | null>(null);
  readonly isActing = signal(false);

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('farmId')),
        filter((farmId): farmId is string => farmId !== null),
        distinctUntilChanged(),
        switchMap((farmId) => this.adminFarmApiService.getFarm(farmId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (farm) => {
          this.farm.set(farm);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  performAction(action: FarmAction): void {
    const farm = this.farm();
    if (!farm) {
      return;
    }

    if (this.isActing()) {
      return;
    }

    this.toastMessage.set(null);
    this.isActing.set(true);
    const request =
      action === 'approve'
        ? this.adminFarmApiService.approveFarm(farm.id)
        : action === 'activate'
          ? this.adminFarmApiService.activateFarm(farm.id)
          : this.adminFarmApiService.deactivateFarm(farm.id);

    request.subscribe({
      next: (updatedFarm) => {
        this.farm.set(updatedFarm);
        this.isActing.set(false);
      },
      error: (error: unknown) => {
        this.isActing.set(false);
        this.toastMessage.set(this.getActionErrorMessage(error));
      },
    });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'long' }).format(
      new Date(value),
    );
  }

  private getActionErrorMessage(error: unknown): string {
    return error instanceof HttpErrorResponse && error.status === 409
      ? 'لا يمكن تنفيذ هذا الإجراء لأن حالة المزرعة تغيّرت.'
      : 'تعذر تنفيذ الإجراء. يرجى المحاولة مرة أخرى.';
  }
}
