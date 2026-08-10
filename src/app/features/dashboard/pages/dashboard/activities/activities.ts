import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { CreateTaskRequest, ExportPlan, FarmTask, ScheduleRevision, TaskType } from '@core/api/api.models';
import { toLocalIsoDate } from '@shared/utils/local-date';
import { taskPriorityLabel, taskStatusLabel, taskTypeLabel } from '@shared/utils/task-labels';

type TaskStatus = FarmTask['status'];
type TaskGroupKey = 'overdue' | 'today' | 'upcoming' | 'postponed' | 'finished';
type TaskGroups = Record<TaskGroupKey, FarmTask[]>;

@Component({
  selector: 'app-activities',
  imports: [FormsModule, DatePipe],
  templateUrl: './activities.html',
  styleUrl: './activities.css',
})
export class Activities {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  public readonly tasks = signal<FarmTask[]>([]);
  public readonly plans = signal<ExportPlan[]>([]);
  public readonly taskTypes = signal<TaskType[]>([]);
  public readonly loading = signal(true);
  public readonly saving = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly detailOpen = signal(false);
  public readonly createOpen = signal(false);
  public readonly activeTask = signal<FarmTask | null>(null);
  public readonly revision = signal<ScheduleRevision | null>(null);
  public readonly revisionOpen = signal(false);
  public search = '';
  public status = '';
  public priority = '';
  public origin = '';
  public planFilter = '';
  public editStatus: TaskStatus = 'Pending';
  public editPlannedDate = '';
  public editActualDate = '';
  public editNotes = '';
  public form: CreateTaskRequest = this.emptyForm();

  public readonly visibleTasks = computed(() => {
    const query = this.search.trim().toLocaleLowerCase();
    return this.tasks().filter(task =>
      (!this.status || task.status === this.status) &&
      (!this.priority || task.priority === this.priority) &&
      (!this.origin || task.origin === this.origin) &&
      (!this.planFilter || String(task.exportPlanId) === this.planFilter) &&
      (!query || `${task.title} ${task.description ?? ''} ${task.taskTypeName}`.toLocaleLowerCase().includes(query))
    );
  });

  public readonly groupedTasks = computed(() => {
    const today = toLocalIsoDate();
    const groups: TaskGroups = { overdue: [], today: [], upcoming: [], postponed: [], finished: [] };
    for (const task of this.visibleTasks()) {
      if (task.status === 'Completed' || task.status === 'Skipped' || task.status === 'Cancelled') groups.finished.push(task);
      else if (task.status === 'Postponed') groups.postponed.push(task);
      else if (task.plannedDate < today) groups.overdue.push(task);
      else if (task.plannedDate === today) groups.today.push(task);
      else groups.upcoming.push(task);
    }
    return groups;
  });

  public constructor() {
    forkJoin({ plans: this.api.exportPlans(), types: this.api.taskTypes() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: ({ plans, types }) => { this.plans.set(plans); this.taskTypes.set(types); this.form = this.emptyForm(plans[0]?.id, types[0]?.id); this.load(); },
        error: () => { this.error.set('تعذر تحميل بيانات المهام.'); this.loading.set(false); },
      });
  }

  public load(): void {
    this.error.set(null);
    this.loading.set(true);
    this.api.tasks('pageSize=200').pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: tasks => this.tasks.set(tasks), error: () => this.error.set('تعذر تحميل المهام.') });
  }

  public openTask(task: FarmTask): void {
    this.api.task(task.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: loaded => { this.activeTask.set(loaded); this.editStatus = loaded.status; this.editPlannedDate = loaded.plannedDate; this.editActualDate = loaded.actualDate ?? ''; this.editNotes = loaded.notes ?? ''; this.detailOpen.set(true); },
      error: () => this.error.set('تعذر تحميل تفاصيل المهمة.')
    });
  }

  public saveTaskUpdate(): void {
    const task = this.activeTask();
    if (!task) return;
    if (this.editStatus === 'Postponed' && this.editPlannedDate <= task.plannedDate) { this.error.set('اختر تاريخاً لاحقاً عند تأجيل المهمة.'); return; }
    if (this.editStatus === 'Completed' && !this.editActualDate) { this.error.set('أدخل تاريخ التنفيذ عند إكمال المهمة.'); return; }
    this.saving.set(true); this.error.set(null);
    this.api.updateTask(task.id, { status: this.editStatus, plannedDate: this.editPlannedDate, actualDate: this.editActualDate || undefined, notes: this.editNotes })
      .pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.detailOpen.set(false); this.load(); this.checkRevision(task.exportPlanId); }, error: () => this.error.set('تعذر حفظ تحديث المهمة.') });
  }

  public openCreateTask(): void { this.form = this.emptyForm(this.plans()[0]?.id, this.taskTypes()[0]?.id); this.createOpen.set(true); }

  public saveNewTask(): void {
    if (!this.form.title.trim() || !this.form.exportPlanId || !this.form.taskTypeId || !this.form.plannedDate) { this.error.set('أكمل الخطة، النوع، العنوان، والتاريخ أولاً.'); return; }
    if (this.form.status === 'Completed' && !this.form.actualDate) { this.error.set('أدخل تاريخ التنفيذ للمهمة المكتملة.'); return; }
    this.saving.set(true); this.error.set(null);
    this.api.createTask({ ...this.form, title: this.form.title.trim(), description: this.form.description?.trim() || null, notes: this.form.notes?.trim() || null })
      .pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: created => { this.createOpen.set(false); this.load(); this.checkRevision(created.exportPlanId); }, error: () => this.error.set('تعذر إنشاء المهمة.') });
  }

  public statusLabel(status: string): string { return taskStatusLabel(status); }
  public priorityLabel(priority: string): string { return taskPriorityLabel(priority); }
  public taskTypeLabel(value: string): string { return taskTypeLabel(value); }
  public originLabel(origin: string): string { return origin === 'UserAdded' ? 'أضافها المستخدم' : origin === 'AIReplanned' ? 'عدّلها الذكاء الاصطناعي' : 'مخططة بالذكاء الاصطناعي'; }
  public groupCount(group: TaskGroupKey): number { return this.groupedTasks()[group].length; }
  public tasksForGroup(group: string): FarmTask[] { return this.groupedTasks()[group as TaskGroupKey] ?? []; }
  public revisionLabel(operation: string): string { return operation === 'Added' ? 'أضيفت' : operation === 'Moved' ? 'أعيدت جدولتها' : 'أُلغيت'; }
  public retryRevision(): void {
    const revision = this.revision();
    if (!revision) return;
    this.api.retryScheduleRevision(revision.exportPlanId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: queued => { this.revision.set(queued); this.revisionOpen.set(true); this.pollRevision(queued.exportPlanId); },
      error: () => this.error.set('تعذرت إعادة محاولة تحديث الجدول.')
    });
  }

  private checkRevision(exportPlanId: number): void {
    this.api.scheduleRevision(exportPlanId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: revision => { this.revision.set(revision); this.revisionOpen.set(true); if (revision.status === 'Pending' || revision.status === 'InProgress') this.pollRevision(exportPlanId); },
      error: () => { /* Task saving remains successful if revision feedback is unavailable. */ }
    });
  }

  private pollRevision(exportPlanId: number): void {
    window.setTimeout(() => {
      const revision = this.revision();
      if (!revision || revision.exportPlanId !== exportPlanId || (revision.status !== 'Pending' && revision.status !== 'InProgress')) return;
      this.checkRevision(exportPlanId);
    }, 3500);
  }

  private emptyForm(exportPlanId = 0, taskTypeId = 0): CreateTaskRequest {
    return { exportPlanId, taskTypeId, title: '', description: null, quantity: 1, unit: 'وحدة', plannedDate: toLocalIsoDate(), actualDate: null, status: 'Pending', priority: 'Medium', notes: null };
  }
}
