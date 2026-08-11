import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { AdminUserDetails } from '@core/api/api.models';
import { DatePickerDirective } from '@shared/components/platform-form-controls';

@Component({
  selector: 'app-account-details',
  imports: [CommonModule, FormsModule, RouterLink, DatePickerDirective],
  templateUrl: './account-details.html',
})
export class AccountDetails {
  private readonly api = inject(GreenmindApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastrService);
  private readonly userId = this.route.snapshot.paramMap.get('userId') ?? '';
  public readonly details = signal<AdminUserDetails | null>(null);
  public readonly loading = signal(true);
  public readonly accessLoading = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly from = signal('');
  public readonly to = signal('');
  public readonly page = signal(1);
  public readonly chartDays = computed(() => this.details()?.aiUsage.dailyUsage.slice(-31) ?? []);
  public readonly maxDailyTokens = computed(() => Math.max(1, ...this.chartDays().map((item) => item.totalTokens)));

  public constructor() { this.load(); }

  public load(page = this.page()): void {
    if (!this.userId) { this.error.set('معرّف المستخدم غير صالح.'); this.loading.set(false); return; }
    this.loading.set(true); this.error.set(null); this.page.set(page);
    this.api.adminUserDetails(this.userId, { from: this.from() || undefined, to: this.to() || undefined, pageNumber: page, pageSize: 20 })
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (details) => this.details.set(details), error: () => this.error.set('تعذر تحميل تفاصيل المستخدم.') });
  }

  public resetFilters(): void { this.from.set(''); this.to.set(''); this.load(1); }
  public toggleAiAccess(): void {
    const details = this.details(); if (!details || this.accessLoading()) return;
    const suspend = !details.user.isAiAccessSuspended;
    this.accessLoading.set(true);
    this.api.setUserAiAccess(this.userId, suspend)
      .pipe(finalize(() => this.accessLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.toast.success(suspend ? 'تم إيقاف وصول المستخدم إلى الذكاء الاصطناعي.' : 'تم تفعيل وصول المستخدم إلى الذكاء الاصطناعي.'); this.load(); },
        error: () => this.toast.error('تعذر تغيير صلاحية الذكاء الاصطناعي.'),
      });
  }
  public dailyWidth(tokens: number): number { return Math.max(4, (tokens / this.maxDailyTokens()) * 100); }
  public featureLabel(feature: string): string {
    const labels: Record<string, string> = { FarmChat:'محادثة المزرعة', ExportPlanChat:'محادثة خطة التصدير', ChatImageAnalysis:'تحليل صور المحادثة', ExportScheduleAnalysis:'تحليل مواعيد التصدير', ExportPlanTaskGeneration:'توليد مهام الخطة', DiseaseConversation:'محادثة التشخيص', DiseaseConversationRepair:'تصحيح رد التشخيص', DiseaseImageAnalysis:'تحليل صور المرض', DiseaseImageAnalysisRetry:'إعادة تحليل صور المرض', TaskChangeProposal:'اقتراح تعديل المهام' };
    return labels[feature] ?? feature;
  }
}
