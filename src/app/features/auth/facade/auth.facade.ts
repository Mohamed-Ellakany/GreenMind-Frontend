import { inject, Injectable, signal } from '@angular/core';

import { finalize } from 'rxjs';

import { RegisterRequest } from '../models/register-request';
import { AuthService } from '../services/AuthService';

@Injectable()
export class AuthFacade {

  private readonly authService = inject(AuthService);

  readonly loading = signal(false);

  readonly success = signal(false);

  readonly error = signal<string | null>(null);

  register(model: RegisterRequest) {

    this.loading.set(true);

    this.error.set(null);

    return this.authService
      .register(model)
      .pipe(
        finalize(() => this.loading.set(false))
      );

  }

}
