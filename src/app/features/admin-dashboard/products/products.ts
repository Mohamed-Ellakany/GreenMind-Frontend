import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { MasterDataItem } from '@core/api/api.models';

@Component({ selector: 'app-products', imports: [FormsModule], templateUrl: './products.html' })
export class Products {
  private readonly api = inject(GreenmindApi); private readonly destroyRef = inject(DestroyRef);
  public readonly items = signal<MasterDataItem[]>([]); public readonly error = signal<string | null>(null);
  public name = ''; public description = ''; public editingId: number | null = null;
  public constructor() { this.load(); }
  public load(): void { this.api.crops(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (items) => this.items.set(items), error: () => this.error.set('تعذر تحميل المحاصيل.') }); }
  public edit(item: MasterDataItem): void { this.editingId = item.id; this.name = item.name; this.description = item.description ?? ''; }
  public cancel(): void { this.editingId = null; this.name = ''; this.description = ''; }
  public save(): void { const request = { name: this.name.trim(), description: this.description.trim() || null }; const source = this.editingId ? this.api.updateCrop(this.editingId, request) : this.api.createCrop(request); source.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.cancel(); this.load(); }, error: (e) => this.error.set(e.error?.error?.message ?? 'تعذر حفظ المحصول.') }); }
  public toggle(item: MasterDataItem): void { this.api.setCropStatus(item.id, !item.isActive).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.load(), error: () => this.error.set('تعذر تغيير الحالة.') }); }
}
