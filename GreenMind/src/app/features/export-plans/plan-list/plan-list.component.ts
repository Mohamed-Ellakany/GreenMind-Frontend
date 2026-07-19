import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { CropApiService } from '../../../core/services/crop-api.service';
import { DestinationApiService } from '../../../core/services/destination-api.service';
import { ExportPlanApiService } from '../../../core/services/export-plan-api.service';
import { ExportPlanStatusBadgeComponent } from '../../../shared/components/export-plan-status-badge.component';
import { Crop } from '../../../shared/models/crop.model';
import { Destination } from '../../../shared/models/destination.model';
import { ExportPlan } from '../../../shared/models/export-plan.model';

@Component({
  selector: 'app-plan-list',
  imports: [RouterLink, ExportPlanStatusBadgeComponent],
  templateUrl: './plan-list.component.html',
  styleUrl: './plan-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanListComponent implements OnInit {
  private readonly cropApiService = inject(CropApiService);
  private readonly destinationApiService = inject(DestinationApiService);
  private readonly exportPlanApiService = inject(ExportPlanApiService);
  private readonly router = inject(Router);

  readonly plans = signal<ExportPlan[]>([]);
  readonly crops = signal<Crop[]>([]);
  readonly destinations = signal<Destination[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    forkJoin({
      plans: this.exportPlanApiService.list(),
      crops: this.cropApiService.listActiveCrops(),
      destinations: this.destinationApiService.listActiveDestinations(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ plans, crops, destinations }) => {
          this.plans.set(plans);
          this.crops.set(crops);
          this.destinations.set(destinations);
        },
        error: () => this.hasError.set(true),
      });
  }

  openPlan(exportPlanId: string): void {
    void this.router.navigate(['/export-plans', exportPlanId]);
  }

  getCropName(cropId: string): string {
    return this.crops().find((crop) => crop.id === cropId)?.name ?? 'غير متاح';
  }

  getDestinationName(destinationId: string): string {
    return (
      this.destinations().find((destination) => destination.id === destinationId)
        ?.name ?? 'غير متاح'
    );
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(
      new Date(value),
    );
  }
}
