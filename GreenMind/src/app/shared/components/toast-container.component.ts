import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-container position-fixed top-0 p-3" style="right: 1rem; left: auto; z-index: 1080;" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast show border-0 text-bg-{{ toast.variant }} shadow-sm" role="alert">
          <div class="d-flex align-items-center">
            <div class="toast-body">{{ toast.message }}</div>
            <button
              class="btn-close btn-close-white ms-2 me-2"
              type="button"
              aria-label="إغلاق التنبيه"
              (click)="toastService.dismiss(toast.id)"
            ></button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
