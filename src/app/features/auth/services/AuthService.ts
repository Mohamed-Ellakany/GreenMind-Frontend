import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { ApiResponse } from '@core/api/api.models';
import { AuthResponse } from '../models/auth-response';
import { LoginRequest } from '../models/login-request';
import { RegisterRequest } from '../models/register-request';
import { RegisterResponse } from '../models/register-response';

export interface AccountProfile {
  fullName: string;
  email: string | null;
  farmName: string | null;
  farmId: number | null;
  isActive: boolean;
  isFarmApproved: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = '/api/Auth';
  private readonly tokenKey = 'greenmind_access_token';

  public readonly loading = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly errorCode = signal<string | null>(null);
  public readonly accountProfile = signal<AccountProfile | null>(null);

  public login(payload: LoginRequest): Observable<AuthResponse> {
    const source = this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, payload).pipe(
      map((response) => response.data),
    );
    return this.request(source);
  }

  public register(payload: RegisterRequest): Observable<RegisterResponse> {
    this.loading.set(true);
    this.error.set(null);
    this.errorCode.set(null);
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.baseUrl}/register`, payload).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error));
        this.errorCode.set(this.extractErrorCode(error));
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  public logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.accountProfile.set(null);
    void this.router.navigateByUrl('/auth/login');
  }

  public profile(): Observable<AccountProfile> {
    return this.http.get<ApiResponse<AccountProfile>>(`${this.baseUrl}/me`).pipe(
      map((response) => response.data),
      tap((profile) => this.accountProfile.set(profile)),
    );
  }

  public updateProfile(payload: { fullName: string; email: string }): Observable<AccountProfile> {
    return this.http.put<ApiResponse<AccountProfile>>(`${this.baseUrl}/me/profile`, payload).pipe(
      map((response) => response.data),
      tap((profile) => this.accountProfile.set(profile)),
    );
  }

  public changePassword(payload: { currentPassword: string; newPassword: string }): Observable<void> {
    return this.http.put<ApiResponse<void> | null>(`${this.baseUrl}/me/password`, payload).pipe(
      map(() => undefined),
    );
  }

  public loadProfile(): void {
    if (!this.isAuthenticated()) return;
    this.profile().subscribe({ error: () => this.accountProfile.set(this.profileFromToken()) });
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public isAuthenticated(): boolean {
    const payload = this.tokenPayload();
    const expiry = payload?.['exp'];
    return !!payload && (typeof expiry !== 'number' || expiry * 1000 > Date.now());
  }

  public hasRole(role: 'Admin' | 'SuperAdmin' | 'FarmOwner'): boolean {
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
    this.errorCode.set(null);
    return source.pipe(
      tap((response) => localStorage.setItem(this.tokenKey, response.token)),
      tap(() => this.loadProfile()),
      catchError((error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error));
        this.errorCode.set(this.extractErrorCode(error));
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

  private extractErrorCode(error: HttpErrorResponse): string | null {
    return error.error?.error?.code ?? null;
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

  private profileFromToken(): AccountProfile | null {
    const payload = this.tokenPayload();
    if (!payload) return null;
    const name = payload['fullName']
      ?? payload['name']
      ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
    const email = payload['email'];
    const farmId = payload['farmId'];
    const farmName = payload['farmName'];
    return {
      fullName: typeof name === 'string' && name.trim() ? name : 'مالك المزرعة',
      email: typeof email === 'string' ? email : null,
      farmName: typeof farmName === 'string' && farmName.trim() ? farmName : null,
      farmId: typeof farmId === 'string' ? Number(farmId) : null,
      isActive: true,
      isFarmApproved: null,
    };
  }
}
