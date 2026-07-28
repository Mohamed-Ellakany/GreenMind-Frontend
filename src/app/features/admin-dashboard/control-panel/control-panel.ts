import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { FarmAccount, PlatformStatistics } from '@core/api/api.models';

@Component({ selector: 'app-control-panel', templateUrl: './control-panel.html' })
export class ControlPanel {
  private readonly api = inject(GreenmindApi); private readonly destroyRef = inject(DestroyRef);
  public readonly stats = signal<PlatformStatistics | null>(null); public readonly pending = signal<FarmAccount[]>([]); public readonly error = signal<string | null>(null);
  public constructor() { this.load(); }
  public load(): void { this.api.statistics().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (data) => this.stats.set(data), error: () => this.error.set('تعذر تحميل الإحصائيات.') }); this.api.farms('Pending').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (data) => this.pending.set(data.items), error: () => this.error.set('تعذر تحميل طلبات الموافقة.') }); }
  public approve(id: number): void { this.api.approveFarm(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.load(), error: () => this.error.set('تعذرت الموافقة على المزرعة.') }); }
}
