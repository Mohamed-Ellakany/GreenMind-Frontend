import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { MasterDataItem } from '@core/api/api.models';

@Component({ selector: 'app-destinations', imports: [FormsModule], templateUrl: './destinations.html' })
export class Destinations {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastrService);

  public readonly items = signal<MasterDataItem[]>([]);
  public readonly error = signal<string | null>(null);
  public readonly deletedView = signal(false);
  public readonly modalOpen = signal(false);
  public readonly saving = signal(false);
  public readonly actionLoadingId = signal<number | null>(null);
  public readonly visibleItems = computed(() =>
    this.items().filter((item) => this.deletedView() ? item.isDeleted : !item.isDeleted),
  );

  public name = '';
  public description = '';
  public editingId: number | null = null;

  public constructor() {
    this.load();
  }

  public modalTitle(): string {
    return this.editingId ? 'تعديل وجهة التصدير' : 'إضافة وجهة تصدير';
  }

  public load(): void {
    this.api.destinations(true, this.deletedView())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.error.set(null);
        },
        error: () => this.error.set('تعذر تحميل الوجهات.'),
      });
  }

  public showDeleted(value: boolean): void {
    this.deletedView.set(value);
    this.load();
  }

  public openCreate(): void {
    this.editingId = null;
    this.name = '';
    this.description = '';
    this.modalOpen.set(true);
  }

  public edit(item: MasterDataItem): void {
    this.editingId = item.id;
    this.name = item.name;
    this.description = item.description ?? '';
    this.modalOpen.set(true);
  }

  public closeModal(): void {
    if (this.saving()) return;
    this.resetModal();
  }

  public save(): void {
    const request = { name: this.name.trim(), description: this.description.trim() || null };
    if (!request.name) return;

    const source = this.editingId
      ? this.api.updateDestination(this.editingId, request)
      : this.api.createDestination(request);

    this.saving.set(true);
    source.pipe(
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'تم تحديث الوجهة.' : 'تمت إضافة الوجهة.');
        this.resetModal();
        this.load();
      },
      error: (e) => {
        const message = e.error?.error?.message ?? 'تعذر حفظ الوجهة.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  public toggle(item: MasterDataItem): void {
    this.actionLoadingId.set(item.id);
    this.api.setDestinationStatus(item.id, !item.isActive).pipe(
      finalize(() => this.actionLoadingId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.toast.success(item.isActive ? 'تم تعطيل الوجهة.' : 'تم تفعيل الوجهة.');
        this.load();
      },
      error: () => {
        this.error.set('تعذر تغيير الحالة.');
        this.toast.error('تعذر تغيير حالة الوجهة.');
      },
    });
  }

  public delete(item: MasterDataItem): void {
    if (!globalThis.confirm(`هل تريد حذف "${item.name}"؟ يمكن استعادتها لاحقاً.`)) return;

    this.actionLoadingId.set(item.id);
    this.api.deleteDestination(item.id).pipe(
      finalize(() => this.actionLoadingId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.toast.success('تم حذف الوجهة.');
        this.load();
      },
      error: () => {
        this.error.set('تعذر حذف الوجهة.');
        this.toast.error('تعذر حذف الوجهة.');
      },
    });
  }

  public restore(item: MasterDataItem): void {
    this.actionLoadingId.set(item.id);
    this.api.restoreDestination(item.id).pipe(
      finalize(() => this.actionLoadingId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.toast.success('تمت استعادة الوجهة.');
        this.load();
      },
      error: (e) => {
        const message = e.error?.error?.message ?? 'تعذر استعادة الوجهة.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  private resetModal(): void {
    this.modalOpen.set(false);
    this.editingId = null;
    this.name = '';
    this.description = '';
  }
}
