import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CostDashboard, DiseaseReport } from '@features/dashboard/phase-two/phase-two.models';

type SummaryTone = 'good' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-export-plan-operational-summary',
  imports: [RouterLink],
  templateUrl: './export-plan-operational-summary.html',
  styleUrl: './export-plan-operational-summary.css',
})
export class ExportPlanOperationalSummary {
  public readonly planId = input.required<number>();
  public readonly loading = input(false);
  public readonly costs = input<CostDashboard | null>(null);
  public readonly reports = input<DiseaseReport[]>([]);

  public readonly diseaseSummary = computed(() => {
    const report = this.reports()[0];
    if (!report) return { label: 'لا توجد فحوصات بعد', detail: 'ارفع صورة عند ظهور أي أعراض', tone: 'neutral' as SummaryTone };
    if (report.status === 'Waiting' || report.status === 'Analyzing') {
      return { label: 'التحليل جارٍ', detail: `فحص بتاريخ ${this.compactDate(report.observationDate)}`, tone: 'warning' as SummaryTone };
    }
    if (report.status === 'Failed') {
      return { label: 'تعذر إكمال التحليل', detail: 'أعد المحاولة من سجل صحة المحصول', tone: 'danger' as SummaryTone };
    }
    const tone: SummaryTone = report.severity === 'Critical' || report.severity === 'High'
      ? 'danger'
      : report.severity === 'Medium' ? 'warning' : 'good';
    return {
      label: report.suspectedDisease || 'لا توجد إصابة واضحة',
      detail: report.confidencePercentage === null
        ? `آخر فحص ${this.compactDate(report.observationDate)}`
        : `ثقة التحليل ${report.confidencePercentage}% · شدة ${this.severityLabel(report.severity)}`,
      tone,
    };
  });

  public formatMoney(value: number | null): string {
    if (value === null) return 'غير محددة';
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value);
  }

  private compactDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  }

  private severityLabel(severity: string | null): string {
    if (!severity) return 'غير محددة';
    return ({ Low: 'منخفضة', Medium: 'متوسطة', High: 'عالية', Critical: 'حرجة' } as Record<string, string>)[severity] ?? severity;
  }
}
