import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-growth-stage-badge',
  template: '<span class="badge bg-info text-dark">مرحلة النمو: {{ growthStage() }}</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrowthStageBadgeComponent {
  readonly growthStage = input.required<string>();
}
