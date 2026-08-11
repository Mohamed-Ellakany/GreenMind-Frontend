import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { AdminAiUsageOverview } from '@core/api/api.models';
import { DatePickerDirective } from '@shared/components/platform-form-controls';

@Component({
  selector: 'app-ai-usage',
  imports: [CommonModule, FormsModule, RouterLink, DatePickerDirective],
  templateUrl: './ai-usage.html',
})
export class AiUsage {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  public readonly data = signal<AdminAiUsageOverview | null>(null);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly from = signal('');
  public readonly to = signal('');
  public readonly page = signal(1);
  public readonly chartDays = computed(() => this.data()?.dailyUsage.slice(-31) ?? []);
  public readonly maxDailyTokens = computed(() => Math.max(1, ...this.chartDays().map((item) => item.totalTokens)));

  public constructor() { this.load(); }

  public load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);
    this.api.adminAiUsage({ from: this.from() || undefined, to: this.to() || undefined, pageNumber: page, pageSize: 20 })
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.error.set('تعذر تحميل بيانات استخدام الذكاء الاصطناعي.'),
      });
  }

  public resetFilters(): void { this.from.set(''); this.to.set(''); this.load(1); }
  public dailyWidth(tokens: number): number { return Math.max(4, (tokens / this.maxDailyTokens()) * 100); }
  public featureLabel(feature: string): string {
    const labels: Record<string, string> = {
      FarmChat: 'محادثة المزرعة', ExportPlanChat: 'محادثة خطة التصدير', ChatImageAnalysis: 'تحليل صور المحادثة',
      ExportScheduleAnalysis: 'تحليل مواعيد التصدير', ExportPlanTaskGeneration: 'توليد مهام الخطة',
      DiseaseConversation: 'محادثة التشخيص', DiseaseConversationRepair: 'تصحيح رد التشخيص',
      DiseaseImageAnalysis: 'تحليل صور المرض', DiseaseImageAnalysisRetry: 'إعادة تحليل صور المرض',
      TaskChangeProposal: 'اقتراح تعديل المهام', Unspecified: 'غير محدد',
    };
    return labels[feature] ?? feature;
  }
}
