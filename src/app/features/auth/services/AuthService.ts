import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { AuthResponse } from '../models/auth-response';
import { LoginRequest } from '../models/login-request';
import { RegisterRequest } from '../models/register-request';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `https://localhost:7132/api/Auth`;
  private readonly tokenKey = 'greenmind_access_token';

  public readonly loading = signal(false);
  public readonly error = signal<string | null>(null);

  public login(payload: LoginRequest): Observable<AuthResponse> {
    return this.request(this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload));
  }

  public register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.request(this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload));
  }

  public logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigateByUrl('/auth/login');
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private request(source: Observable<AuthResponse>): Observable<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);

    return source.pipe(
      tap((response) => localStorage.setItem(this.tokenKey, response.token)),
      catchError((err: HttpErrorResponse) => {
        const message = err.error?.message ?? 'حدث خطأ غير متوقع. حاول مرة أخرى.';
        this.error.set(message);
        return throwError(() => err);
      }),
      finalize(() => this.loading.set(false)),
    );
  }
}
