import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, email as emailValidator, form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@features/auth/services/AuthService';

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly auth = this.authService;
  protected readonly submitted = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly passwordVisible = signal(false);

  protected readonly loginModel = signal({
    email: '',
    password: '',
    rememberMe: false,
  });

  protected readonly loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'البريد الإلكتروني مطلوب.' });
    emailValidator(path.email, { message: 'أدخل بريداً إلكترونياً صحيحاً.' });

    required(path.password, { message: 'كلمة المرور مطلوبة.' });
  });

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    // Signal Forms does not install the FormsModule submit directive, so a
    // plain `(submit)` listener must cancel the browser's native GET request.
    event.preventDefault();
    this.submitAttempted.set(true);

    if (this.loginForm().invalid()) {
      this.focusFirstInvalidField();
      return;
    }

    await submit(this.loginForm, async () => {
      try {
        await firstValueFrom(this.authService.login(this.loginModel()));
      } catch {
        this.focusFormError();
        return;
      }

      const destination = this.authService.homeUrl();
      this.submitted.set(true);

      try {
        const navigated = await this.router.navigateByUrl(destination, { replaceUrl: true });

        // A guard or a stale lazy-loaded route can cancel navigation without
        // throwing. Reloading from the authenticated URL gives the router a
        // clean initial navigation and prevents the success screen from
        // remaining indefinitely on /auth/login.
        if (!navigated || this.router.url.startsWith('/auth/')) {
          globalThis.location.replace(destination);
        }
      } catch {
        globalThis.location.replace(destination);
      }
    });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  private focusFirstInvalidField(): void {
    const fieldId = this.loginForm.email().invalid() ? 'login-email' : 'login-password';
    queueMicrotask(() => globalThis.document?.getElementById(fieldId)?.focus());
  }

  private focusFormError(): void {
    queueMicrotask(() => globalThis.document?.getElementById('login-form-error')?.focus());
  }
}
