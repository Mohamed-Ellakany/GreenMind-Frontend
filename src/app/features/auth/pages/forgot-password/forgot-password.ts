import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/AuthService';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);

  protected email = '';
  protected readonly loading = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitAttempted = signal(false);

  protected async submit(form: NgForm): Promise<void> {
    this.submitAttempted.set(true);
    this.error.set(null);
    this.email = this.email.trim();

    if (form.invalid || !this.email) {
      this.focus('forgot-email');
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(this.auth.forgotPassword(this.email));
      this.success.set(true);
      this.focus('forgot-success');
    } catch (error) {
      this.error.set(
        this.auth.messageFromError(
          error,
          'تعذر إرسال رابط الاستعادة الآن. حاول مرة أخرى بعد قليل.',
        ),
      );
      this.focus('forgot-error');
    } finally {
      this.loading.set(false);
    }
  }

  private focus(id: string): void {
    queueMicrotask(() => globalThis.document?.getElementById(id)?.focus());
  }
}
