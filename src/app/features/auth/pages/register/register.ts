import { Component, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';

const passwordsMatch: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  public readonly submitted = signal(false);
  public readonly registerForm;

  constructor(private readonly formBuilder: FormBuilder) {
    this.registerForm = this.formBuilder.nonNullable.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        terms: [false, Validators.requiredTrue],
      },
      { validators: passwordsMatch },
    );
  }

  public hasError(controlName: keyof typeof this.registerForm.controls, error: string): boolean {
    const control = this.registerForm.controls[controlName];
    return control.touched && control.hasError(error);
  }

  public submit(): void {
    this.submitted.set(true);
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) return;

    // The authentication API is not connected yet. This confirms the valid form submission locally.
    this.registerForm.disable();
  }
}
