import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminDestinationApiService } from '../../../../core/services/admin-destination-api.service';
import { Destination } from '../../../../shared/models/destination.model';

@Component({
  selector: 'app-destination-list',
  imports: [ReactiveFormsModule],
  templateUrl: './destination-list.component.html',
  styleUrl: './destination-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationListComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminDestinationApiService = inject(AdminDestinationApiService);

  readonly destinations = signal<Destination[]>([]);
  readonly selectedDestination = signal<Destination | null>(null);
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
    this.adminDestinationApiService.listAll().subscribe({
      next: (destinations) => {
        this.destinations.set(destinations);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.selectedDestination.set(null);
    this.formError.set(null);
    this.form.reset({ name: '', description: '' });
    this.isFormOpen.set(true);
  }

  openEditForm(destination: Destination): void {
    this.selectedDestination.set(destination);
    this.formError.set(null);
    this.form.reset({ name: destination.name, description: destination.description });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.selectedDestination.set(null);
    this.isFormOpen.set(false);
    this.formError.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedDestination = this.selectedDestination();
    const request = selectedDestination
      ? this.adminDestinationApiService.update(selectedDestination.id, this.form.getRawValue())
      : this.adminDestinationApiService.create(this.form.getRawValue());

    this.isSaving.set(true);
    request.subscribe({
      next: (destination) => {
        this.destinations.update((destinations) => [
          ...destinations.filter((item) => item.id !== destination.id),
          destination,
        ]);
        this.isSaving.set(false);
        this.closeForm();
      },
      error: () => {
        this.isSaving.set(false);
        this.formError.set('تعذر حفظ وجهة التصدير. يرجى المحاولة مرة أخرى.');
      },
    });
  }

  deactivate(destination: Destination): void {
    if (this.pendingDeactivateId() === destination.id) {
      return;
    }

    this.pendingDeactivateId.set(destination.id);
    this.adminDestinationApiService.deactivate(destination.id).subscribe({
      next: (updatedDestination) => {
        this.destinations.update((destinations) =>
          destinations.map((item) =>
            item.id === updatedDestination.id ? updatedDestination : item,
          ),
        );
        this.pendingDeactivateId.set(null);
      },
      error: () => {
        this.pendingDeactivateId.set(null);
        this.formError.set('تعذر إيقاف وجهة التصدير. يرجى المحاولة مرة أخرى.');
      },
    });
  }
}
