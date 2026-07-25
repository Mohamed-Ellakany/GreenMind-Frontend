import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly formBuilder = new FormBuilder();

  public readonly submitted = signal(false);
  public readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  public hasError(controlName: 'email' | 'password', error: string): boolean {
    const control = this.loginForm.controls[controlName];
    return control.touched && control.hasError(error);
  }

  public submit(): void {
    this.submitted.set(true);
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) return;

    // Authentication API will be connected here. Keep the valid submission state local for now.
    this.loginForm.disable();
  }
}
