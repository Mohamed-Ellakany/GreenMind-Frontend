import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs';

import { SoilMeasurementApiService } from '../../../core/services/soil-measurement-api.service';
import {
  CreateSoilMeasurementRequest,
  SoilMeasurement,
} from '../../../shared/models/soil-measurement.model';
import { rangeValidator } from '../../../shared/validators/numeric-range.validator';

@Component({
  selector: 'app-soil-measurements',
  imports: [ReactiveFormsModule],
  templateUrl: './soil-measurements.component.html',
  styleUrl: './soil-measurements.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoilMeasurementsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly soilMeasurementApiService = inject(SoilMeasurementApiService);

  readonly measurements = signal<SoilMeasurement[]>([]);
  readonly selectedMeasurement = signal<SoilMeasurement | null>(null);
  readonly pendingDelete = signal<SoilMeasurement | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly hasError = signal(false);
  readonly formError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly isFormOpen = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    measurementDate: ['', Validators.required],
    ph: [0, [Validators.required, rangeValidator(0, 14)]],
    ec: [0, [Validators.required, rangeValidator(0, Number.MAX_VALUE)]],
    nitrogen: [0, [Validators.required, rangeValidator(0, Number.MAX_VALUE)]],
    phosphorus: [0, [Validators.required, rangeValidator(0, Number.MAX_VALUE)]],
    potassium: [0, [Validators.required, rangeValidator(0, Number.MAX_VALUE)]],
    moisture: [0, [Validators.required, rangeValidator(0, Number.MAX_VALUE)]],
    notes: [''],
  });

  constructor() {
    this.route.parent!.paramMap
      .pipe(
        map((params) => params.get('exportPlanId')),
        filter((exportPlanId): exportPlanId is string => exportPlanId !== null),
        distinctUntilChanged(),
        tap(() => this.clearPlanState()),
        switchMap((exportPlanId) => this.soilMeasurementApiService.list(exportPlanId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (measurements) => {
          this.setMeasurements(measurements);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  openCreateForm(): void {
    this.selectedMeasurement.set(null);
    this.formError.set(null);
    this.form.reset({
      measurementDate: this.today(),
      ph: 0,
      ec: 0,
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      moisture: 0,
      notes: '',
    });
    this.isFormOpen.set(true);
  }

  openEditForm(measurement: SoilMeasurement): void {
    this.selectedMeasurement.set(measurement);
    this.formError.set(null);
    this.form.reset({
      measurementDate: measurement.measurementDate.slice(0, 10),
      ph: measurement.ph,
      ec: measurement.ec,
      nitrogen: measurement.nitrogen,
      phosphorus: measurement.phosphorus,
      potassium: measurement.potassium,
      moisture: measurement.moisture,
      notes: measurement.notes ?? '',
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedMeasurement.set(null);
    this.formError.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const exportPlanId = this.getExportPlanId();
    if (!exportPlanId) {
      return;
    }

    const payload = this.toRequest();
    const selectedMeasurement = this.selectedMeasurement();
    const request = selectedMeasurement
      ? this.soilMeasurementApiService.update(exportPlanId, selectedMeasurement.id, payload)
      : this.soilMeasurementApiService.create(exportPlanId, payload);

    this.isSaving.set(true);
    this.formError.set(null);
    request.subscribe({
      next: (measurement) => {
        this.setMeasurements([
          ...this.measurements().filter((item) => item.id !== measurement.id),
          measurement,
        ]);
        this.isSaving.set(false);
        this.closeForm();
      },
      error: () => {
        this.isSaving.set(false);
        this.formError.set('تعذر حفظ قياس التربة. يرجى المحاولة مرة أخرى.');
      },
    });
  }

  openDeleteModal(measurement: SoilMeasurement): void {
    this.pendingDelete.set(measurement);
    this.deleteError.set(null);
  }

  closeDeleteModal(): void {
    this.pendingDelete.set(null);
    this.deleteError.set(null);
  }

  confirmDelete(): void {
    const measurement = this.pendingDelete();
    const exportPlanId = this.getExportPlanId();
    if (!measurement || !exportPlanId) {
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set(null);
    this.soilMeasurementApiService.delete(exportPlanId, measurement.id).subscribe({
      next: () => {
        this.measurements.update((measurements) =>
          measurements.filter((item) => item.id !== measurement.id),
        );
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: () => {
        this.isDeleting.set(false);
        this.deleteError.set('تعذر حذف قياس التربة. يرجى المحاولة مرة أخرى.');
      },
    });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(
      new Date(value),
    );
  }

  private clearPlanState(): void {
    this.measurements.set([]);
    this.selectedMeasurement.set(null);
    this.pendingDelete.set(null);
    this.isFormOpen.set(false);
    this.hasError.set(false);
    this.isLoading.set(true);
  }

  private getExportPlanId(): string | null {
    return this.route.parent!.snapshot.paramMap.get('exportPlanId');
  }

  private toRequest(): CreateSoilMeasurementRequest {
    const value = this.form.getRawValue();
    return { ...value, notes: value.notes || null };
  }

  private setMeasurements(measurements: SoilMeasurement[]): void {
    this.measurements.set(
      [...measurements].sort(
        (first, second) =>
          new Date(second.measurementDate).getTime() -
          new Date(first.measurementDate).getTime(),
      ),
    );
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
