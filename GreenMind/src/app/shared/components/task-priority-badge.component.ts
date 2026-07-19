import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TaskPriority } from '../models/task.model';

@Component({
  selector: 'app-task-priority-badge',
  template:
    '<span [class]="\'badge \' + badgeClass()"><span aria-hidden="true">{{ icon() }}</span> {{ label() }}</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskPriorityBadgeComponent {
  readonly priority = input.required<TaskPriority>();

  readonly label = computed(() => {
    switch (this.priority()) {
      case 'Low':
        return 'منخفضة';
      case 'Medium':
        return 'متوسطة';
      case 'High':
        return 'عالية';
      case 'Critical':
        return 'حرجة';
    }
  });

  readonly icon = computed(() => {
    switch (this.priority()) {
      case 'Low':
        return '↓';
      case 'Medium':
        return '•';
      case 'High':
        return '↑';
      case 'Critical':
        return '!';
    }
  });

  readonly badgeClass = computed(() => {
    switch (this.priority()) {
      case 'Low':
        return 'bg-secondary';
      case 'Medium':
        return 'bg-primary';
      case 'High':
        return 'bg-warning text-dark';
      case 'Critical':
        return 'bg-danger';
    }
  });
}
