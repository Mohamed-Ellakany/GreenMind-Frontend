import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faChartPie,
  faCoins,
  faComments,
  faLeaf,
  faSeedling,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-plan-context-navigation',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive],
  templateUrl: './plan-context-navigation.html',
  styleUrl: './plan-context-navigation.css',
})
export class PlanContextNavigation {
  public readonly planId = input.required<number>();
  public readonly planName = input('خطة التصدير');
  public readonly crop = input('');
  public readonly destination = input('');
  public readonly navigated = output<void>();

  protected readonly icons = {
    back: faArrowRight,
    overview: faChartPie,
    advisor: faComments,
    health: faLeaf,
    costs: faCoins,
    plan: faSeedling,
  };
}
