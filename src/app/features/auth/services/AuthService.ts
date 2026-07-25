import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { RegisterRequest } from '../models/register-request';
import { AuthResponse } from '../models/auth-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly api = 'https://localhost:5001/api/auth';

  register(model: RegisterRequest): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.api}/register`,
      model
    );

  }

}
