import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { TaskApiService, TaskFilters } from '../../../core/services/task-api.service';
import { TaskPriorityBadgeComponent } from '../../../shared/components/task-priority-badge.component';
import { TaskStatusBadgeComponent } from '../../../shared/components/task-status-badge.component';
import { Task, TaskPriority, TaskStatus } from '../../../shared/models/task.model';

interface TaskTypeOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-tasks',
  imports: [ReactiveFormsModule, TaskStatusBadgeComponent, TaskPriorityBadgeComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly taskApiService = inject(TaskApiService);

  readonly filterForm = this.formBuilder.nonNullable.group({
    status: [''],
    priority: [''],
    taskTypeId: [''],
    from: [''],
    to: [''],
  });
  readonly updateForm = this.formBuilder.nonNullable.group({
    status: ['Pending' as TaskStatus, Validators.required],
    actualDate: [''],
    notes: [''],
  });
  readonly tasks = signal<Task[]>([]);
  readonly taskTypes = signal<TaskTypeOption[]>([]);
  readonly selectedTask = signal<Task | null>(null);
  readonly isLoading = signal(true);
  readonly isUpdating = signal(false);
  readonly hasError = signal(false);
  readonly updateError = signal<string | null>(null);
  readonly expandedTaskIds = signal<Set<string>>(new Set());

  constructor() {
    const planId$ = this.route.parent!.paramMap.pipe(
      map((params) => params.get('exportPlanId')),
      filter((exportPlanId): exportPlanId is string => exportPlanId !== null),
      distinctUntilChanged(),
      tap(() => this.clearPlanState()),
    );
    const filters$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.getRawValue()),
    );

    combineLatest([planId$, filters$])
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.hasError.set(false);
        }),
        switchMap(([exportPlanId, filters]) =>
          this.taskApiService.list(exportPlanId, this.toFilters(filters)).pipe(
            catchError(() => {
              this.hasError.set(true);
              return of([]);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tasks) => {
        this.tasks.set(tasks);
        this.addTaskTypes(tasks);
        this.isLoading.set(false);
      });
  }

  openStatusUpdate(task: Task): void {
    this.selectedTask.set(task);
    this.updateError.set(null);
    this.updateForm.reset({
      status: task.status,
      actualDate: task.actualDate ?? '',
      notes: task.notes ?? '',
    });
    this.updateActualDateValidation();
  }

  closeStatusUpdate(): void {
    this.selectedTask.set(null);
    this.updateError.set(null);
  }

  onStatusChange(): void {
    this.updateActualDateValidation();
  }

  submitStatusUpdate(): void {
    const task = this.selectedTask();

    this.updateActualDateValidation();
    if (!task || this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const value = this.updateForm.getRawValue();
    this.isUpdating.set(true);
    this.updateError.set(null);

    this.taskApiService
      .updateStatus(task.exportPlanId, task.id, {
        status: value.status,
        actualDate: value.actualDate || undefined,
        notes: value.notes || undefined,
      })
      .subscribe({
        next: (updatedTask) => {
          this.tasks.update((tasks) =>
            tasks.map((currentTask) =>
              currentTask.id === updatedTask.id ? updatedTask : currentTask,
            ),
          );
          this.isUpdating.set(false);
          this.closeStatusUpdate();
        },
        error: () => {
          this.isUpdating.set(false);
          this.updateError.set('تعذر تحديث حالة المهمة. يرجى المحاولة مرة أخرى.');
        },
      });
  }

  toggleNotes(taskId: string): void {
    this.expandedTaskIds.update((expandedTaskIds) => {
      const next = new Set(expandedTaskIds);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  }

  isNotesExpanded(taskId: string): boolean {
    return this.expandedTaskIds().has(taskId);
  }

  hasLongNotes(notes: string | null): boolean {
    return (notes?.length ?? 0) > 120;
  }

  displayNotes(task: Task): string {
    if (!task.notes) {
      return '—';
    }

    return this.isNotesExpanded(task.id) || !this.hasLongNotes(task.notes)
      ? task.notes
      : `${task.notes.slice(0, 120)}…`;
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }

    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(
      new Date(value),
    );
  }

  private clearPlanState(): void {
    this.tasks.set([]);
    this.taskTypes.set([]);
    this.selectedTask.set(null);
    this.expandedTaskIds.set(new Set());
    this.filterForm.reset({
      status: '',
      priority: '',
      taskTypeId: '',
      from: '',
      to: '',
    });
  }

  private toFilters(filters: Partial<{
    status: string;
    priority: string;
    taskTypeId: string;
    from: string;
    to: string;
  }>): TaskFilters {
    return {
      ...(filters.status ? { status: filters.status as TaskStatus } : {}),
      ...(filters.priority ? { priority: filters.priority as TaskPriority } : {}),
      ...(filters.taskTypeId ? { taskTypeId: filters.taskTypeId } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
    };
  }

  private updateActualDateValidation(): void {
    const actualDateControl = this.updateForm.controls.actualDate;

    if (this.updateForm.controls.status.value === 'Completed') {
      actualDateControl.setValidators(Validators.required);
      if (!actualDateControl.value) {
        actualDateControl.setValue(new Date().toISOString().slice(0, 10));
      }
    } else {
      actualDateControl.clearValidators();
    }

    actualDateControl.updateValueAndValidity({ emitEvent: false });
  }

  private addTaskTypes(tasks: Task[]): void {
    this.taskTypes.update((taskTypes) => {
      const next = [...taskTypes];

      for (const task of tasks) {
        if (!next.some((taskType) => taskType.id === task.taskTypeId)) {
          next.push({ id: task.taskTypeId, name: task.taskTypeName });
        }
      }

      return next;
    });
  }
}
