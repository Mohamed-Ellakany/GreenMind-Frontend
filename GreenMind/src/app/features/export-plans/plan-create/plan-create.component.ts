import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { CropApiService } from '../../../core/services/crop-api.service';
import { DestinationApiService } from '../../../core/services/destination-api.service';
import { ExportPlanApiService } from '../../../core/services/export-plan-api.service';
import { Crop } from '../../../shared/models/crop.model';
import { Destination } from '../../../shared/models/destination.model';
import { CreateExportPlanRequest } from '../../../shared/models/export-plan.model';
import { dateAfterValidator } from '../../../shared/validators/date-range.validator';
import { rangeValidator } from '../../../shared/validators/numeric-range.validator';

@Component({
  selector: 'app-plan-create',
  imports: [ReactiveFormsModule],
  templateUrl: './plan-create.component.html',
  styleUrl: './plan-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCreateComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cropApiService = inject(CropApiService);
  private readonly destinationApiService = inject(DestinationApiService);
  private readonly exportPlanApiService = inject(ExportPlanApiService);
  private readonly router = inject(Router);

  readonly crops = signal<Crop[]>([]);
  readonly destinations = signal<Destination[]>([]);
  readonly isLoadingOptions = signal(true);
  readonly isSubmitting = signal(false);
  readonly loadError = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group(
    {
      name: ['', Validators.required],
      cropId: ['', Validators.required],
      destinationId: ['', Validators.required],
      governorate: ['', Validators.required],
      city: ['', Validators.required],
      latitude: [0, [Validators.required, rangeValidator(-90, 90)]],
      longitude: [0, [Validators.required, rangeValidator(-180, 180)]],
      areaInFeddan: [0, [Validators.required, rangeValidator(Number.EPSILON, Number.MAX_VALUE)]],
      plantingDate: ['', Validators.required],
      expectedHarvestDate: ['', Validators.required],
      expectedExportDate: ['', Validators.required],
      notes: [''],
    },
    {
      validators: [
        dateAfterValidator('plantingDate', 'expectedHarvestDate'),
        dateAfterValidator('expectedHarvestDate', 'expectedExportDate'),
      ],
    },
  );

  ngOnInit(): void {
    forkJoin({
      crops: this.cropApiService.listActiveCrops(),
      destinations: this.destinationApiService.listActiveDestinations(),
    })
      .pipe(finalize(() => this.isLoadingOptions.set(false)))
      .subscribe({
        next: ({ crops, destinations }) => {
          this.crops.set(crops);
          this.destinations.set(destinations);
        },
        error: () => this.loadError.set(true),
      });
  }

  submit(): void {
    if (this.form.invalid || this.isLoadingOptions()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitError.set(null);
    this.isSubmitting.set(true);

    this.exportPlanApiService
      .create(this.toRequest())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (plan) => void this.router.navigate(['/export-plans', plan.id]),
        error: (error: unknown) => {
          const savedPlanId = this.getSavedPlanId(error);

          if (savedPlanId) {
            void this.router.navigate(['/export-plans', savedPlanId]);
            return;
          }

          this.submitError.set('تعذر حفظ خطة التصدير. يرجى المحاولة مرة أخرى.');
        },
      });
  }

  private toRequest(): CreateExportPlanRequest {
    const value = this.form.getRawValue();

    return {
      ...value,
      notes: value.notes || null,
    };
  }

  private getSavedPlanId(error: unknown): string | null {
    // TODO: confirm the partial-planning-failure response shape with backend team.
    if (!(error instanceof HttpErrorResponse) || !error.error || typeof error.error !== 'object') {
      return null;
    }

    const payload = error.error as Record<string, unknown>;
    const exportPlan = payload['exportPlan'] as Record<string, unknown> | undefined;
    const plan = payload['plan'] as Record<string, unknown> | undefined;
    const candidate = payload['exportPlanId'] ?? exportPlan?.['id'] ?? plan?.['id'];

    return typeof candidate === 'string' ? candidate : null;
  }
}
