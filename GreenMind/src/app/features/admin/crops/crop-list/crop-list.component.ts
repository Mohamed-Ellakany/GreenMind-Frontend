import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminCropApiService } from '../../../../core/services/admin-crop-api.service';
import { Crop } from '../../../../shared/models/crop.model';

@Component({
  selector: 'app-crop-list',
  imports: [ReactiveFormsModule],
  templateUrl: './crop-list.component.html',
  styleUrl: './crop-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropListComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminCropApiService = inject(AdminCropApiService);

  readonly crops = signal<Crop[]>([]);
  readonly selectedCrop = signal<Crop | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly pendingDeactivateId = signal<string | null>(null);
  readonly hasError = signal(false);
  readonly formError = signal<string | null>(null);
  readonly isFormOpen = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
  });

  ngOnInit(): void {
    this.adminCropApiService.listAll().subscribe({
      next: (crops) => {
        this.crops.set(crops);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.selectedCrop.set(null);
    this.formError.set(null);
    this.form.reset({ name: '', description: '' });
    this.isFormOpen.set(true);
  }

  openEditForm(crop: Crop): void {
    this.selectedCrop.set(crop);
    this.formError.set(null);
    this.form.reset({ name: crop.name, description: crop.description });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.selectedCrop.set(null);
    this.isFormOpen.set(false);
    this.formError.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedCrop = this.selectedCrop();
    const request = selectedCrop
      ? this.adminCropApiService.update(selectedCrop.id, this.form.getRawValue())
      : this.adminCropApiService.create(this.form.getRawValue());

    this.isSaving.set(true);
    request.subscribe({
      next: (crop) => {
        this.crops.update((crops) => [
          ...crops.filter((item) => item.id !== crop.id),
          crop,
        ]);
        this.isSaving.set(false);
        this.closeForm();
      },
      error: () => {
        this.isSaving.set(false);
        this.formError.set('تعذر حفظ المحصول. يرجى المحاولة مرة أخرى.');
      },
    });
  }

  deactivate(crop: Crop): void {
    if (this.pendingDeactivateId() === crop.id) {
      return;
    }

    this.pendingDeactivateId.set(crop.id);
    this.adminCropApiService.deactivate(crop.id).subscribe({
      next: (updatedCrop) => {
        this.crops.update((crops) =>
          crops.map((item) => (item.id === updatedCrop.id ? updatedCrop : item)),
        );
        this.pendingDeactivateId.set(null);
      },
      error: () => {
        this.pendingDeactivateId.set(null);
        this.formError.set('تعذر إيقاف المحصول. يرجى المحاولة مرة أخرى.');
      },
    });
  }
}
