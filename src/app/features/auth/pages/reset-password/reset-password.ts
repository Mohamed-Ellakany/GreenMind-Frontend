import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/AuthService';
import {
  getPasswordStrength,
  meetsPasswordPolicy,
  PASSWORD_POLICY_MESSAGE,
  passwordRequirements,
} from '../../utils/password-policy';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly email = this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected password = '';
  protected confirmPassword = '';
  protected readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\p{L}\p{N}]).{8,}$/u;
  protected readonly loading = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly invalidLink = signal(!this.email || !this.token);
  protected readonly submitAttempted = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);

  protected passwordChecks() {
    return passwordRequirements(this.password);
  }

  protected passwordStrength() {
    return getPasswordStrength(this.password);
  }

  protected passwordsMismatch(): boolean {
    return !!this.confirmPassword && this.confirmPassword !== this.password;
  }

  protected passwordsMatch(): boolean {
    return !!this.password && !!this.confirmPassword && this.password === this.confirmPassword;
  }

  protected async submit(form: NgForm): Promise<void> {
    this.submitAttempted.set(true);
    this.error.set(null);
    if (this.invalidLink()) return;

    if (form.invalid || !meetsPasswordPolicy(this.password) || this.passwordsMismatch()) {
      const fieldId = !meetsPasswordPolicy(this.password)
        ? 'reset-password'
        : 'reset-confirm-password';
      this.focus(fieldId);
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(
        this.auth.resetPassword({
          email: this.email,
          token: this.token,
          newPassword: this.password,
        }),
      );
      this.success.set(true);
      this.password = '';
      this.confirmPassword = '';
      this.focus('reset-success');
    } catch (error) {
      const message = this.auth.messageFromError(
        error,
        'تعذر تغيير كلمة المرور. اطلب رابطاً جديداً وحاول مرة أخرى.',
      );
      if (message.includes('الرابط غير صالح') || message.includes('انتهت صلاحيته')) {
        this.invalidLink.set(true);
        this.focus('reset-invalid-link');
      } else {
        this.error.set(message || PASSWORD_POLICY_MESSAGE);
        this.focus('reset-error');
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((visible) => !visible);
  }

  private focus(id: string): void {
    queueMicrotask(() => globalThis.document?.getElementById(id)?.focus());
  }
}
