import { Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { RagIngestionResult } from '@core/api/api.models';

type KnowledgeSourceType = 'quality' | 'regulation' | 'annex';

@Component({
  selector: 'app-knowledge-base',
  imports: [FormsModule],
  templateUrl: './knowledge-base.html',
  styleUrl: './knowledge-base.css',
})
export class KnowledgeBase {
  private static readonly maximumFileSize = 25 * 1024 * 1024;
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastrService);

  @ViewChild('pdfInput') private pdfInput?: ElementRef<HTMLInputElement>;

  public readonly sourceType = signal<KnowledgeSourceType>('quality');
  public readonly selectedFile = signal<File | null>(null);
  public readonly dragging = signal(false);
  public readonly uploading = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly result = signal<RagIngestionResult | null>(null);

  public sourceName = '';
  public crop = '';
  public annexLabelHint = '';
  public cropKeywordsCsv = '';

  public selectType(type: KnowledgeSourceType): void {
    if (this.uploading()) return;
    this.sourceType.set(type);
    this.error.set(null);
    this.result.set(null);
  }

  public selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);
  }

  public dragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.uploading()) this.dragging.set(true);
  }

  public dragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  public dropFile(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (!this.uploading()) this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  public removeFile(): void {
    if (this.uploading()) return;
    this.selectedFile.set(null);
    if (this.pdfInput) this.pdfInput.nativeElement.value = '';
  }

  public canSubmit(): boolean {
    if (!this.selectedFile() || !this.sourceName.trim() || this.uploading()) return false;
    if (this.sourceType() === 'quality') return !!this.crop.trim();
    if (this.sourceType() === 'annex') {
      return !!this.annexLabelHint.trim() && !!this.cropKeywordsCsv.trim();
    }
    return true;
  }

  public upload(): void {
    const file = this.selectedFile();
    if (!file || !this.canSubmit()) return;

    let request: Observable<RagIngestionResult>;
    switch (this.sourceType()) {
      case 'quality':
        request = this.api.ingestQualityStandard(file, this.crop.trim(), this.sourceName.trim());
        break;
      case 'annex':
        request = this.api.ingestEuRegulationAnnex(
          file,
          this.sourceName.trim(),
          this.annexLabelHint.trim(),
          this.cropKeywordsCsv.trim(),
        );
        break;
      default:
        request = this.api.ingestEuRegulationBody(file, this.sourceName.trim());
    }

    this.uploading.set(true);
    this.error.set(null);
    this.result.set(null);
    request.pipe(
      finalize(() => this.uploading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (result) => {
        this.result.set(result);
        this.toast.success(`تمت فهرسة ${result.chunksIngested} مقطع معرفي بنجاح.`);
        this.selectedFile.set(null);
        if (this.pdfInput) this.pdfInput.nativeElement.value = '';
      },
      error: (error) => {
        const message = error?.error?.error?.message
          ?? error?.error?.message
          ?? (typeof error?.error === 'string' ? error.error : null)
          ?? 'تعذر فهرسة المستند. راجع الملف والبيانات ثم حاول مرة أخرى.';
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  public fileSize(file: File): string {
    const megabytes = file.size / (1024 * 1024);
    return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 1 }).format(megabytes)} م.ب`;
  }

  private setFile(file: File | null): void {
    this.error.set(null);
    this.result.set(null);
    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      this.error.set('يُسمح برفع ملفات PDF فقط.');
      this.removeFile();
      return;
    }

    if (file.size > KnowledgeBase.maximumFileSize) {
      this.error.set('حجم الملف أكبر من الحد الأقصى المسموح وهو 25 ميجابايت.');
      this.removeFile();
      return;
    }

    this.selectedFile.set(file);
  }
}
