import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ExportPlanStatus } from '../models/export-plan.model';

@Component({
  selector: 'app-export-plan-status-badge',
  template: '<span [class]="\'badge \' + badgeClass()">{{ label() }}</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPlanStatusBadgeComponent {
  readonly status = input.required<ExportPlanStatus>();

  readonly label = computed(() => {
    switch (this.status()) {
      case 'Draft':
        return 'مسودة';
      case 'Active':
        return 'نشطة';
      case 'Completed':
        return 'مكتملة';
      case 'Cancelled':
        return 'ملغاة';
    }
  });

  readonly badgeClass = computed(() => {
    switch (this.status()) {
      case 'Draft':
        return 'bg-secondary';
      case 'Active':
        return 'bg-primary';
      case 'Completed':
        return 'bg-success';
      case 'Cancelled':
        return 'bg-danger';
    }
  });
}
