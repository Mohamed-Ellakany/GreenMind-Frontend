import { Component, inject, signal } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { RouterLink } from '@angular/router';
import { AuthFacade } from '@features/auth/facade/auth.facade';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  providers: [
    AuthFacade
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  private readonly fb = inject(FormBuilder);

  readonly facade = inject(AuthFacade);

  readonly submitted = signal(false);

  readonly registerForm = this.fb.nonNullable.group({

    fullName: [
      '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^01[0-9]{9}$/)
      ]
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8)
      ]
    ],

    confirmPassword: [
      '',
      Validators.required
    ],

    terms: [
      false,
      Validators.requiredTrue
    ]

  });

  hasError(control: keyof typeof this.registerForm.controls, error: string) {

    const c = this.registerForm.controls[control];

    return c.touched && c.hasError(error);

  }

  submit() {

    this.submitted.set(true);

    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {

      return;

    }

    if (
      this.registerForm.value.password !==
      this.registerForm.value.confirmPassword
    ) {

      return;

    }

    this.facade.register({

      fullName: this.registerForm.value.fullName!,

      email: this.registerForm.value.email!,

      phone: this.registerForm.value.phone!,

      password: this.registerForm.value.password!

    }).subscribe({

      next: () => {

        this.facade.success.set(true);

      },

      error: err => {

        this.facade.error.set(
          err.error?.message ??
          'حدث خطأ أثناء إنشاء الحساب'
        );

      }

    });

  }

}
