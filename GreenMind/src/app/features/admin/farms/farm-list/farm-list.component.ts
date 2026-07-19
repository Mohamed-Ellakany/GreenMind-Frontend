import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AdminFarmApiService } from '../../../../core/services/admin-farm-api.service';
import { Farm } from '../../../../shared/models/farm.model';

type FarmAction = 'approve' | 'activate' | 'deactivate';

@Component({
  selector: 'app-admin-farm-list',
  templateUrl: './farm-list.component.html',
  styleUrl: './farm-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmListComponent implements OnInit {
  private readonly adminFarmApiService = inject(AdminFarmApiService);
  private readonly router = inject(Router);

  readonly farms = signal<Farm[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly toastMessage = signal<string | null>(null);
  readonly pendingFarmId = signal<string | null>(null);

  ngOnInit(): void {
    this.adminFarmApiService.listFarms().subscribe({
      next: (farms) => {
        this.farms.set(farms);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  openFarm(farmId: string): void {
    void this.router.navigate(['/admin/farms', farmId]);
  }

  performAction(event: Event, farm: Farm, action: FarmAction): void {
    event.stopPropagation();
    if (this.pendingFarmId() === farm.id) {
      return;
    }

    this.toastMessage.set(null);
    this.pendingFarmId.set(farm.id);

    const request =
      action === 'approve'
        ? this.adminFarmApiService.approveFarm(farm.id)
        : action === 'activate'
          ? this.adminFarmApiService.activateFarm(farm.id)
          : this.adminFarmApiService.deactivateFarm(farm.id);

    request.subscribe({
      next: (updatedFarm) => {
        this.farms.update((farms) =>
          farms.map((currentFarm) =>
            currentFarm.id === updatedFarm.id ? updatedFarm : currentFarm,
          ),
        );
        this.pendingFarmId.set(null);
      },
      error: (error: unknown) => {
        this.pendingFarmId.set(null);
        this.toastMessage.set(this.getActionErrorMessage(error));
      },
    });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(
      new Date(value),
    );
  }

  private getActionErrorMessage(error: unknown): string {
    return error instanceof HttpErrorResponse && error.status === 409
      ? 'لا يمكن تنفيذ هذا الإجراء لأن حالة المزرعة تغيّرت.'
      : 'تعذر تنفيذ الإجراء. يرجى المحاولة مرة أخرى.';
  }
}
