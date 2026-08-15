import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { AiLimitRequestItem } from '@core/api/api.models';

@Component({
  selector: 'app-ai-limit-requests',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-limit-requests.html',
})
export class AiLimitRequests {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastrService);

  public readonly requests = signal<AiLimitRequestItem[]>([]);
  public readonly loading = signal(true);
  public readonly actionLoading = signal<number | null>(null);
  public readonly error = signal<string | null>(null);
  public readonly pendingOnly = signal(true);

  // Resolution form state keyed by requestId
  public readonly grantAmounts: Record<number, number> = {};
  public readonly adminNotes: Record<number, string> = {};

  public constructor() {
    this.load();
  }

  public load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.adminAiLimitRequests(this.pendingOnly())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => {
          this.requests.set(items);
          items.forEach((item) => {
            if (!(item.id in this.grantAmounts)) {
              this.grantAmounts[item.id] = 0.50; // default additional quota grant e.g. $0.50
            }
          });
        },
        error: () => this.error.set('تعذر تحميل طلبات زيادة كوتا الذكاء الاصطناعي.'),
      });
  }

  public togglePendingFilter(pendingOnly: boolean): void {
    if (this.pendingOnly() === pendingOnly) return;
    this.pendingOnly.set(pendingOnly);
    this.load();
  }

  public approve(request: AiLimitRequestItem): void {
    const additionalAmount = this.grantAmounts[request.id] ?? 0.50;
    if (additionalAmount <= 0) {
      this.toast.error('يرجى تحديد كوتا إضافية أكبر من 0');
      return;
    }
    this.resolve(request.id, true, additionalAmount, this.adminNotes[request.id]);
  }

  public reject(request: AiLimitRequestItem): void {
    this.resolve(request.id, false, undefined, this.adminNotes[request.id]);
  }

  private resolve(requestId: number, approved: boolean, newLimitUsd?: number, adminNote?: string): void {
    this.actionLoading.set(requestId);
    this.api.resolveAiLimitRequest(requestId, { approved, newLimitUsd, adminNote })
      .pipe(
        finalize(() => this.actionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toast.success(approved ? 'تم قبول الطلب وإضافة الكوتا بنجاح.' : 'تم رفض الطلب.');
          this.load();
        },
        error: () => this.toast.error('تعذر معالجة الطلب.'),
      });
  }

  public formatDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }
}
