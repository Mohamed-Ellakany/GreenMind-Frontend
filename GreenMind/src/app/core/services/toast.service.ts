import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'danger' | 'warning' | 'success';

export interface AppToast {
  id: number;
  message: string;
  variant: ToastVariant;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly fallbackMessage = 'حدث خطأ غير متوقع، حاول مرة أخرى';
  private nextId = 0;

  readonly toasts = signal<AppToast[]>([]);

  showError(message?: string): void {
    this.show(message?.trim() || this.fallbackMessage, 'danger');
  }

  showHttpError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.showError();
      return;
    }

    if (error.status === 0) {
      this.showError('تعذر الاتصال بالخادم، حاول مرة أخرى');
      return;
    }

    const responseBody = error.error as { message?: unknown } | null;
    const message =
      typeof responseBody?.message === 'string'
        ? responseBody.message
        : undefined;

    this.showError(message);
  }

  dismiss(id: number): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(message: string, variant: ToastVariant): void {
    const id = ++this.nextId;
    this.toasts.update((toasts) => [...toasts, { id, message, variant }]);
    window.setTimeout(() => this.dismiss(id), 5000);
  }
}
