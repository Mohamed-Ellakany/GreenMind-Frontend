import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GreenmindApi } from '@core/api/greenmind-api.service';

@Component({ selector: 'app-statistics', imports: [FormsModule], templateUrl: './statistics.html' })
export class Statistics {
  private readonly api = inject(GreenmindApi);
  public format = 'pdf'; public from = ''; public to = ''; public spending = true; public plans = true; public tasks = true; public readonly busy = signal(false);
  public download(): void {
    const sections = [this.plans && 'plans', this.tasks && 'tasks', this.spending && 'spending'].filter(Boolean).join(',');
    this.busy.set(true);
    this.api.downloadReport({ format: this.format, sections, ...(this.from ? { from: this.from } : {}), ...(this.to ? { to: this.to } : {}) }).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `greenmind-report.${this.format}`; link.click(); URL.revokeObjectURL(url); this.busy.set(false); }, error: () => this.busy.set(false),
    });
  }
}
