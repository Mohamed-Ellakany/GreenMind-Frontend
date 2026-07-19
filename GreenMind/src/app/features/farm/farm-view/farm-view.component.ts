import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { FarmApiService } from '../../../core/services/farm-api.service';
import { Farm } from '../../../shared/models/farm.model';

@Component({
  selector: 'app-farm-view',
  templateUrl: './farm-view.component.html',
  styleUrl: './farm-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmViewComponent implements OnInit {
  private readonly farmApiService = inject(FarmApiService);

  readonly farm = signal<Farm | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.farmApiService
      .getMyFarm()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (farm) => this.farm.set(farm),
        error: () => this.hasError.set(true),
      });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'long' }).format(
      new Date(value),
    );
  }
}
