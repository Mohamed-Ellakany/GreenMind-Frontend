import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { FarmAccount } from '@core/api/api.models';

@Component({ selector: 'app-accounts', templateUrl: './accounts.html' })
export class Accounts {
  private readonly api = inject(GreenmindApi); private readonly destroyRef = inject(DestroyRef);
  public readonly farms = signal<FarmAccount[]>([]); public readonly error = signal<string | null>(null);
  public constructor() { this.load(); }
  public load(): void { this.api.farms().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (result) => this.farms.set(result.items), error: () => this.error.set('تعذر تحميل حسابات المزارع.') }); }
  public approve(id: number): void { this.api.approveFarm(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.load(), error: (e) => this.error.set(e.error?.error?.message ?? 'تعذرت الموافقة على المزرعة.') }); }
  public toggle(farm: FarmAccount): void { this.api.setFarmStatus(farm.id, !farm.isActive).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.load(), error: () => this.error.set('تعذر تغيير حالة الحساب.') }); }
}
