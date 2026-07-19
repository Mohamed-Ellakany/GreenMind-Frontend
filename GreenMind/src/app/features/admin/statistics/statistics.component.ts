import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import {
  AdminStatistics,
  AdminStatisticsApiService,
} from '../../../core/services/admin-statistics-api.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsComponent implements OnInit {
  private readonly adminStatisticsApiService = inject(AdminStatisticsApiService);

  readonly statistics = signal<AdminStatistics | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.adminStatisticsApiService.getStatistics().subscribe({
      next: (statistics) => {
        this.statistics.set(statistics);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}
