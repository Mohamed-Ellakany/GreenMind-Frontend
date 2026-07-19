import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: ({ user }) => void this.router.navigateByUrl(this.getDestination(user.role)),
        error: (error: unknown) => this.errorMessage.set(this.getErrorMessage(error)),
      });
  }

  private getDestination(role: UserRole): string {
    return role === 'PlatformAdmin' ? '/admin/farms' : '/export-plans';
  }

  private getErrorMessage(error: unknown): string {
    // TODO: confirm actual errorCode values with backend team
    const errorCode =
      error instanceof HttpErrorResponse && typeof error.error?.errorCode === 'string'
        ? error.error.errorCode
        : null;

    if (['USER_INACTIVE', 'ACCOUNT_INACTIVE', 'USER_NOT_ACTIVE'].includes(errorCode ?? '')) {
      return 'حسابك بانتظار الموافقة';
    }

    return 'بيانات الدخول غير صحيحة';
  }
}
