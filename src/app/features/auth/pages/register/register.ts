import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, email as emailValidator, form, minLength, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@features/auth/services/AuthService';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);

  protected readonly auth = this.authService;
  protected readonly submitted = signal(false);

  protected readonly registerModel = signal({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    farmName: '',
    terms: false,
  });

  protected readonly registerForm = form(this.registerModel, (path) => {
    required(path.fullName, { message: 'أدخل اسماً كاملاً لا يقل عن 3 أحرف.' });
    minLength(path.fullName, 3, { message: 'أدخل اسماً كاملاً لا يقل عن 3 أحرف.' });

    required(path.email, { message: 'أدخل بريداً إلكترونياً صحيحاً.' });
    emailValidator(path.email, { message: 'أدخل بريداً إلكترونياً صحيحاً.' });

    required(path.password, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' });
    minLength(path.password, 8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' });

    required(path.confirmPassword, { message: 'تأكيد كلمة المرور مطلوبة.' });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() === valueOf(path.password)
        ? undefined
        : { kind: 'passwordMismatch', message: 'كلمتا المرور غير متطابقتين.' },
    );

    required(path.farmName, { message: 'أدخل اسم المزرعة.' });
    minLength(path.farmName, 2, { message: 'اسم المزرعة قصير جداً.' });

    validate(path.terms, ({ value }) =>
      value() ? undefined : { kind: 'termsRequired', message: 'يجب الموافقة على الشروط والأحكام.' },
    );
  });

  protected async onSubmit(): Promise<void> {
    console.log('Submitting register form...');

    await submit(this.registerForm, async () => {
      try {
        console.log('Submitting register form...222');
        const { confirmPassword, terms, ...payload } = this.registerModel();
        await firstValueFrom(this.authService.register(payload));
        this.submitted.set(true);
      } catch {
        // authService.error() already surfaces the message in the template.
      }
    });
  }
}
