import { Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { MasterDataItem, RegulatoryImportResult } from '@core/api/api.models';

@Component({
  selector: 'app-regulatory-data',
  imports: [FormsModule],
  templateUrl: './regulatory-data.html',
})
export class RegulatoryData {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastrService);

  @ViewChild('activeFileInput') private activeFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('mrlFileInput') private mrlFileInput?: ElementRef<HTMLInputElement>;

  public readonly regions = signal<MasterDataItem[]>([]);
  public readonly products = signal<MasterDataItem[]>([]);
  public readonly loadingOptions = signal(true);
  public readonly pageError = signal<string | null>(null);
  public readonly activeFile = signal<File | null>(null);
  public readonly mrlFile = signal<File | null>(null);
  public readonly activeUploading = signal(false);
  public readonly mrlUploading = signal(false);
  public readonly activeResult = signal<RegulatoryImportResult | null>(null);
  public readonly mrlResult = signal<RegulatoryImportResult | null>(null);

  public activeRegionName = '';
  public mrlRegionName = '';
  public productType = '';

  public constructor() {
    this.loadOptions();
  }

  public selectActiveFile(event: Event): void {
    this.activeFile.set(this.readXlsxFile(event));
  }

  public selectMrlFile(event: Event): void {
    this.mrlFile.set(this.readXlsxFile(event));
  }

  public uploadActiveSubstances(): void {
    const file = this.activeFile();
    if (!file || !this.activeRegionName) return;

    if (!globalThis.confirm(`سيتم استبدال بيانات المواد الفعالة الحالية لمنطقة "${this.activeRegionName}". هل تريد المتابعة؟`)) {
      return;
    }

    this.activeUploading.set(true);
    this.activeResult.set(null);
    this.api.uploadActiveSubstances(this.activeRegionName, file).pipe(
      finalize(() => this.activeUploading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (result) => {
        this.activeResult.set(result);
        this.activeFile.set(null);
        if (this.activeFileInput) this.activeFileInput.nativeElement.value = '';
        this.toast.success(result.message);
      },
      error: (error) => this.showUploadError(error, 'تعذر استيراد ملف المواد الفعالة.'),
    });
  }

  public uploadMrls(): void {
    const file = this.mrlFile();
    if (!file || !this.mrlRegionName || !this.productType) return;

    if (!globalThis.confirm(`سيتم استبدال بيانات الحدود القصوى الحالية للمنتج "${this.productType}" في منطقة "${this.mrlRegionName}". هل تريد المتابعة؟`)) {
      return;
    }

    this.mrlUploading.set(true);
    this.mrlResult.set(null);
    this.api.uploadProductMrls(this.mrlRegionName, this.productType, file).pipe(
      finalize(() => this.mrlUploading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (result) => {
        this.mrlResult.set(result);
        this.mrlFile.set(null);
        if (this.mrlFileInput) this.mrlFileInput.nativeElement.value = '';
        this.toast.success(result.message);
      },
      error: (error) => this.showUploadError(error, 'تعذر استيراد ملف الحدود القصوى للمتبقيات.'),
    });
  }

  private loadOptions(): void {
    forkJoin({
      regions: this.api.destinations(true),
      products: this.api.crops(true),
    }).pipe(
      finalize(() => this.loadingOptions.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ regions, products }) => {
        this.regions.set(regions.filter((item) => item.isActive && !item.isDeleted));
        this.products.set(products.filter((item) => item.isActive && !item.isDeleted));
        this.pageError.set(null);
      },
      error: () => this.pageError.set('تعذر تحميل قائمة المناطق والمنتجات.'),
    });
  }

  private readXlsxFile(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !file.name.toLowerCase().endsWith('.xlsx')) {
      input.value = '';
      this.toast.error('يسمح برفع ملفات Excel بامتداد .xlsx فقط.');
      return null;
    }

    return file;
  }

  private showUploadError(error: any, fallback: string): void {
    const message = error?.error?.error?.message ?? fallback;
    this.toast.error(message);
  }
}
