import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, email as emailValidator, form, minLength, required, submit } from '@angular/forms/signals';
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

  protected readonly loginModel = signal({
    email: '',
    password: '',
    rememberMe: false,
  });

  protected readonly loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'البريد الإلكتروني مطلوب.' });
    emailValidator(path.email, { message: 'أدخل بريداً إلكترونياً صحيحاً.' });

    required(path.password, { message: 'كلمة المرور مطلوبة.' });
    minLength(path.password, 8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' });
  });

  protected async onSubmit(): Promise<void> {
    await submit(this.loginForm, async () => {
      try {
        await firstValueFrom(this.authService.login(this.loginModel()));
        this.submitted.set(true);
        this.router.navigateByUrl('/dashboard');
      } catch {
        // authService.error() already surfaces the message in the template.
      }
    });
  }
}
