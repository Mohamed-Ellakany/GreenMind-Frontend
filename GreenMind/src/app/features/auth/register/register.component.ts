import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly isSubmitting = signal(false);
  readonly pendingApproval = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    farmName: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.authService
      .register(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.pendingApproval.set(true),
        error: (error: unknown) => this.errorMessage.set(this.getErrorMessage(error)),
      });
  }

  private getErrorMessage(error: unknown): string {
    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    return 'تعذر إرسال طلب التسجيل. يرجى المحاولة مرة أخرى.';
  }
}
