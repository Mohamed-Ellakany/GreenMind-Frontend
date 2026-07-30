import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { FarmTask } from '@core/api/api.models';

@Component({
  selector: 'app-activities',
  imports: [FormsModule],
  templateUrl: './activities.html',
  styleUrl: './activities.css',
})
export class Activities {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  public readonly tasks = signal<FarmTask[]>([]);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public status = '';

  public constructor() { this.load(); }

  public load(): void {
    this.error.set(null);
    this.loading.set(true);
    this.api.tasks(this.status ? `status=${this.status}&pageSize=100` : 'pageSize=100').pipe(
      finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: (tasks) => this.tasks.set(tasks), error: () => this.error.set('تعذر تحميل المهام.') });
  }

  public complete(task: FarmTask): void {
    this.error.set(null);
    this.api.updateTask(task.id, { status: 'Completed', actualDate: new Date().toISOString().slice(0, 10) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.load(), error: () => this.error.set('تعذر تحديث المهمة.') });
  }

  public statusLabel(status: string): string {
    return ({ Pending: 'قيد الانتظار', InProgress: 'قيد التنفيذ', Completed: 'مكتملة', Cancelled: 'ملغاة' } as Record<string, string>)[status] ?? status;
  }

  public priorityLabel(priority: string): string {
    return ({ Low: 'منخفضة', Medium: 'متوسطة', High: 'عالية', Critical: 'حرجة' } as Record<string, string>)[priority] ?? priority;
  }
}
