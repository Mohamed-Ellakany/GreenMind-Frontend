import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { finalize } from 'rxjs';
import { toLocalIsoDate } from '@shared/utils/local-date';

@Component({ selector: 'app-statistics', imports: [FormsModule], templateUrl: './statistics.html' })
export class Statistics {
  private readonly api = inject(GreenmindApi);
  public format: 'pdf' | 'xlsx' | 'csv' = 'pdf';
  public from = '';
  public to = '';
  public spending = true;
  public plans = true;
  public tasks = true;
  public readonly busy = signal(false);
  public readonly error = signal<string | null>(null);

  public download(): void {
    this.error.set(null);
    const sections = [this.plans && 'plans', this.tasks && 'tasks', this.spending && 'spending'].filter(Boolean).join(',');
    if (!sections) {
      this.error.set('اختر قسماً واحداً على الأقل لإضافته إلى التقرير.');
      return;
    }
    if (this.from && this.to && this.from > this.to) {
      this.error.set('يجب أن يكون تاريخ البداية قبل تاريخ النهاية.');
      return;
    }

    this.busy.set(true);
    this.api.downloadReport({
      format: this.format,
      sections,
      ...(this.from ? { from: this.from } : {}),
      ...(this.to ? { to: this.to } : {}),
    }).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `greenmind-report-${this.from || 'all'}-${this.to || toLocalIsoDate()}.${this.format}`;
        link.hidden = true;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => this.error.set('تعذر إنشاء التقرير الآن. راجع الفترة المختارة وحاول مرة أخرى.'),
    });
  }

  public selectedSectionCount(): number {
    return [this.spending, this.plans, this.tasks].filter(Boolean).length;
  }

  public clearDates(): void {
    this.from = '';
    this.to = '';
    this.error.set(null);
  }
}
