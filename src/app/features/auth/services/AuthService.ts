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
    const { rememberMe, ...credentials } = payload;
    const source = this.http
      .post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, credentials)
      .pipe(map((response) => response.data));
    return this.request(source, rememberMe);
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
    this.clearToken();
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

  public updateFarm(payload: { farmName: string }): Observable<AccountProfile> {
    return this.http.put<ApiResponse<AccountProfile>>(`${this.baseUrl}/me/farm`, payload).pipe(
      map((response) => response.data),
      tap((profile) => this.accountProfile.set(profile)),
    );
  }

  public changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Observable<void> {
    return this.http
      .put<ApiResponse<void> | null>(`${this.baseUrl}/me/password`, payload)
      .pipe(map(() => undefined));
  }

  public forgotPassword(email: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/forgot-password`, { email })
      .pipe(map(() => undefined));
  }

  public resetPassword(payload: {
    email: string;
    token: string;
    newPassword: string;
  }): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/reset-password`, payload)
      .pipe(map(() => undefined));
  }

  public activateAccount(payload: { email: string; token: string }): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/activate-account`, payload)
      .pipe(map(() => undefined));
  }

  public resendActivation(payload: { email: string }): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/resend-activation`, payload)
      .pipe(map(() => undefined));
  }

  public loadProfile(): void {
    if (!this.isAuthenticated()) return;
    this.profile().subscribe({ error: () => this.accountProfile.set(this.profileFromToken()) });
  }

  public getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey) ?? localStorage.getItem(this.tokenKey);
  }

  public isAuthenticated(): boolean {
    const payload = this.tokenPayload();
    const expiry = payload?.['exp'];
    const authenticated = !!payload && (typeof expiry !== 'number' || expiry * 1000 > Date.now());
    if (!authenticated && this.getToken()) this.clearToken();
    return authenticated;
  }

  public hasRole(role: 'Admin' | 'SuperAdmin' | 'FarmOwner'): boolean {
    const payload = this.tokenPayload();
    const value =
      payload?.['role'] ??
      payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return Array.isArray(value) ? value.includes(role) : value === role;
  }

  public homeUrl(): string {
    return this.hasRole('Admin') ? '/admin-dashboard' : '/dashboard';
  }

  public messageFromError(error: unknown, fallback = 'حدث خطأ غير متوقع. حاول مرة أخرى.'): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (error.status === 0) return 'تعذر الاتصال بالخدمة. تحقق من اتصالك وحاول مرة أخرى.';

    const messages = this.collectErrorMessages(error.error);
    if (messages.length > 0) {
      return [...new Set(messages.map((message) => this.localizeError(message)))].join(' ');
    }
    if (error.status === 401) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    if (error.status === 409) return 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.';
    return fallback;
  }

  private request(source: Observable<AuthResponse>, rememberMe: boolean): Observable<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);
    this.errorCode.set(null);
    return source.pipe(
      tap((response) => this.persistToken(response.token, rememberMe)),
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
    return this.messageFromError(error);
  }

  private extractErrorCode(error: HttpErrorResponse): string | null {
    return error.error?.error?.code ?? null;
  }

  private persistToken(token: string, rememberMe: boolean): void {
    this.clearToken();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.tokenKey, token);
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenKey);
  }

  private collectErrorMessages(payload: unknown): string[] {
    if (typeof payload === 'string') return payload.trim() ? [payload] : [];
    if (Array.isArray(payload)) return payload.flatMap((item) => this.collectErrorMessages(item));
    if (!payload || typeof payload !== 'object') return [];

    const value = payload as Record<string, unknown>;
    for (const key of ['message', 'Message', 'description', 'Description']) {
      if (typeof value[key] === 'string' && value[key].trim()) return [value[key].trim()];
    }

    for (const key of ['errors', 'Errors', 'details', 'Details']) {
      const messages = this.collectErrorMessages(value[key]);
      if (messages.length > 0) return messages;
    }

    if (value['error']) {
      const messages = this.collectErrorMessages(value['error']);
      if (messages.length > 0) return messages;
    }

    return Object.values(value).flatMap((item) => this.collectErrorMessages(item));
  }

  private localizeError(message: string): string {
    const normalized = message.toLowerCase();
    if (normalized.includes('email already in use')) {
      return 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.';
    }
    if (
      normalized.includes('passwords must') ||
      normalized.includes('password requires') ||
      normalized.includes('password is too short')
    ) {
      return 'كلمة المرور لا تستوفي متطلبات الأمان الموضحة.';
    }
    if (normalized.includes('invalid reset') || normalized.includes('invalid token')) {
      return 'الرابط غير صالح أو انتهت صلاحيته.';
    }
    if (
      normalized.includes('invitation is invalid') ||
      normalized.includes('invitation is no longer')
    ) {
      return 'رابط الدعوة غير صالح أو انتهت صلاحيته.';
    }
    if (
      normalized.includes('not activated') ||
      normalized.includes('user account is not active') ||
      normalized.includes('account is not active') ||
      normalized.includes('waiting for admin approval')
    ) {
      return 'الحساب غير مفعّل بعد. يرجى الضغط على رابط التفعيل المرسل إلى بريدك الإلكتروني.';
    }
    if (
      normalized.includes('activation token is invalid') ||
      normalized.includes('invalid activation')
    ) {
      return 'رابط التفعيل غير صالح أو انتهت صلاحيته.';
    }
    return message;
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
    const name =
      payload['fullName'] ??
      payload['name'] ??
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
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
