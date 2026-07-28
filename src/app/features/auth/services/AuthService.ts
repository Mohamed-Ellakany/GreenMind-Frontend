import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { ApiResponse } from '@core/api/api.models';
import { AuthResponse } from '../models/auth-response';
import { LoginRequest } from '../models/login-request';
import { RegisterRequest } from '../models/register-request';
import { RegisterResponse } from '../models/register-response';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = '/api/Auth';
  private readonly tokenKey = 'greenmind_access_token';

  public readonly loading = signal(false);
  public readonly error = signal<string | null>(null);

  public login(payload: LoginRequest): Observable<AuthResponse> {
    const source = this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, payload).pipe(
      map((response) => response.data),
    );
    return this.request(source);
  }

  public register(payload: RegisterRequest): Observable<RegisterResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.baseUrl}/register`, payload).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  public logout(): void {
    localStorage.removeItem(this.tokenKey);
    void this.router.navigateByUrl('/auth/login');
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public isAuthenticated(): boolean {
    const payload = this.tokenPayload();
    const expiry = payload?.['exp'];
    return !!payload && (typeof expiry !== 'number' || expiry * 1000 > Date.now());
  }

  public hasRole(role: 'Admin' | 'FarmOwner'): boolean {
    const payload = this.tokenPayload();
    const value = payload?.['role'] ?? payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return Array.isArray(value) ? value.includes(role) : value === role;
  }

  public homeUrl(): string {
    return this.hasRole('Admin') ? '/admin-dashboard' : '/dashboard';
  }

  private request(source: Observable<AuthResponse>): Observable<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);
    return source.pipe(
      tap((response) => localStorage.setItem(this.tokenKey, response.token)),
      catchError((error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  private errorMessage(error: HttpErrorResponse): string {
    return error.error?.error?.message
      ?? error.error?.message
      ?? 'حدث خطأ غير متوقع. حاول مرة أخرى.';
  }

  private tokenPayload(): Record<string, string | string[] | number> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const encoded = token.split('.')[1];
      if (!encoded) return null;
      const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        Array.from(atob(normalized))
          .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
      );
      return JSON.parse(json) as Record<string, string | string[] | number>;
    } catch {
      return null;
    }
  }
}
