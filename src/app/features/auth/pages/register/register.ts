import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormField,
  email as emailValidator,
  form,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@features/auth/services/AuthService';
import { FormsModule } from '@angular/forms';
import {
  meetsPasswordPolicy,
  PASSWORD_POLICY_MESSAGE,
  passwordRequirements,
} from '../../utils/password-policy';

@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly auth = this.authService;
  protected readonly submitted = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);

  protected readonly registerModel = signal({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    farmName: '',
    terms: false,
  });

  protected readonly passwordChecks = computed(() =>
    passwordRequirements(this.registerModel().password),
  );

  protected readonly registerForm = form(this.registerModel, (path) => {
    required(path.fullName, { message: 'أدخل اسماً كاملاً لا يقل عن 3 أحرف.' });
    minLength(path.fullName, 3, { message: 'أدخل اسماً كاملاً لا يقل عن 3 أحرف.' });

    required(path.email, { message: 'أدخل بريداً إلكترونياً صحيحاً.' });
    emailValidator(path.email, { message: 'أدخل بريداً إلكترونياً صحيحاً.' });

    required(path.password, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' });
    minLength(path.password, 8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' });
    validate(path.password, ({ value }) =>
      !value() || meetsPasswordPolicy(value())
        ? undefined
        : { kind: 'passwordPolicy', message: PASSWORD_POLICY_MESSAGE },
    );

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
    this.submitAttempted.set(true);
    if (this.registerForm().invalid()) {
      this.focusFirstInvalidField();
      return;
    }

    await submit(this.registerForm, async () => {
      try {
        const { confirmPassword, terms, ...payload } = this.registerModel();
        await firstValueFrom(this.authService.register(payload));
        this.submitted.set(true);
        await this.router.navigateByUrl('/auth/pending-approval', { replaceUrl: true });
      } catch {
        // authService.error() already surfaces the message in the template.
        queueMicrotask(() => globalThis.document?.getElementById('register-form-error')?.focus());
      }
    });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((visible) => !visible);
  }

  private focusFirstInvalidField(): void {
    const fields: Array<[boolean, string]> = [
      [this.registerForm.fullName().invalid(), 'register-full-name'],
      [this.registerForm.farmName().invalid(), 'register-farm-name'],
      [this.registerForm.email().invalid(), 'register-email'],
      [this.registerForm.password().invalid(), 'register-password'],
      [this.registerForm.confirmPassword().invalid(), 'register-confirm-password'],
      [this.registerForm.terms().invalid(), 'register-terms'],
    ];
    const fieldId = fields.find(([invalid]) => invalid)?.[1];
    if (fieldId) queueMicrotask(() => globalThis.document?.getElementById(fieldId)?.focus());
  }
}
