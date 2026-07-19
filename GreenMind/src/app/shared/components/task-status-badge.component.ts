import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TaskStatus } from '../models/task.model';

@Component({
  selector: 'app-task-status-badge',
  template: '<span [class]="\'badge \' + badgeClass()">{{ label() }}</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskStatusBadgeComponent {
  readonly status = input.required<TaskStatus>();

  readonly label = computed(() => {
    switch (this.status()) {
      case 'Pending':
        return 'قيد الانتظار';
      case 'InProgress':
        return 'قيد التنفيذ';
      case 'Completed':
        return 'مكتملة';
      case 'Skipped':
        return 'تم تخطيها';
    }
  });

  readonly badgeClass = computed(() => {
    switch (this.status()) {
      case 'Pending':
        return 'bg-secondary';
      case 'InProgress':
        return 'bg-primary';
      case 'Completed':
        return 'bg-success';
      case 'Skipped':
        return 'bg-dark';
    }
  });
}
