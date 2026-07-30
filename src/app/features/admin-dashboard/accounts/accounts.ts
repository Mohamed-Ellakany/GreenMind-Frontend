import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { FarmAccount } from '@core/api/api.models';

@Component({ selector: 'app-accounts', templateUrl: './accounts.html' })
export class Accounts {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastrService);
  public readonly farms = signal<FarmAccount[]>([]);
  public readonly loading = signal(true);
  public readonly actionLoadingId = signal<number | null>(null);
  public readonly error = signal<string | null>(null);
  public readonly approvedCount = computed(() => this.farms().filter((farm) => farm.isApproved).length);
  public readonly activeCount = computed(() => this.farms().filter((farm) => farm.isActive).length);

  public constructor() { this.load(); }

  public load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.farms().pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => this.farms.set(result.items),
      error: () => this.error.set('تعذر تحميل حسابات المزارع.'),
    });
  }

  public approve(id: number): void {
    this.actionLoadingId.set(id);
    this.api.approveFarm(id).pipe(finalize(() => this.actionLoadingId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.toast.success('تمت الموافقة على الحساب.'); this.load(); },
      error: (error) => { const message = error?.error?.error?.message ?? 'تعذرت الموافقة على المزرعة.'; this.error.set(message); this.toast.error(message); },
    });
  }

  public toggle(farm: FarmAccount): void {
    this.actionLoadingId.set(farm.id);
    this.api.setFarmStatus(farm.id, !farm.isActive).pipe(finalize(() => this.actionLoadingId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.toast.success(farm.isActive ? 'تم إيقاف الحساب.' : 'تم تفعيل الحساب.'); this.load(); },
      error: () => { this.error.set('تعذر تغيير حالة الحساب.'); this.toast.error('تعذر تغيير حالة الحساب.'); },
    });
  }
}
