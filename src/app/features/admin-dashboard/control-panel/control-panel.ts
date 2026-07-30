import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { FarmAccount, PlatformStatistics } from '@core/api/api.models';

@Component({ selector: 'app-control-panel', templateUrl: './control-panel.html' })
export class ControlPanel {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastrService);

  public readonly stats = signal<PlatformStatistics | null>(null);
  public readonly pending = signal<FarmAccount[]>([]);
  public readonly statsLoading = signal(true);
  public readonly pendingLoading = signal(true);
  public readonly approvingId = signal<number | null>(null);
  public readonly error = signal<string | null>(null);

  public constructor() {
    this.load();
  }

  public load(): void {
    this.error.set(null);
    this.statsLoading.set(true);
    this.pendingLoading.set(true);
    this.api.statistics().pipe(
      finalize(() => this.statsLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.error.set('تعذر تحميل إحصائيات المنصة.'),
    });
    this.api.farms('Pending').pipe(
      finalize(() => this.pendingLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => this.pending.set(data.items),
      error: () => this.error.set('تعذر تحميل طلبات الموافقة.'),
    });
  }

  public approve(id: number): void {
    this.approvingId.set(id);
    this.api.approveFarm(id).pipe(
      finalize(() => this.approvingId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.toast.success('تمت الموافقة على الحساب وتفعيله.');
        this.load();
      },
      error: () => {
        this.error.set('تعذرت الموافقة على المزرعة.');
        this.toast.error('تعذرت الموافقة على المزرعة.');
      },
    });
  }
}
