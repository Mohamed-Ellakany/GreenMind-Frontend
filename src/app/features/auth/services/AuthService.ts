import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { ApiClient } from '@core/api/api-client.service';
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
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'greenmind_access_token';

  public readonly loading = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly errorCode = signal<string | null>(null);
  public readonly accountProfile = signal<AccountProfile | null>(null);

  public login(payload: LoginRequest): Observable<AuthResponse> {
    const { rememberMe, ...credentials } = payload;
    const source = this.api.post<AuthResponse>('/api/Auth/login', credentials);
    return this.request(source, rememberMe);
  }

  public register(payload: RegisterRequest): Observable<RegisterResponse> {
    this.loading.set(true);
    this.error.set(null);
    this.errorCode.set(null);
    return this.api.post<RegisterResponse>('/api/Auth/register', payload).pipe(
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
    return this.api.get<AccountProfile>('/api/Auth/me').pipe(
      tap((profile) => this.accountProfile.set(profile)),
    );
  }

  public updateProfile(payload: { fullName: string; email: string }): Observable<AccountProfile> {
    return this.api.put<AccountProfile>('/api/Auth/me/profile', payload).pipe(
      tap((profile) => this.accountProfile.set(profile)),
    );
  }

  public updateFarm(payload: { farmName: string }): Observable<AccountProfile> {
    return this.api.put<AccountProfile>('/api/Auth/me/farm', payload).pipe(
      tap((profile) => this.accountProfile.set(profile)),
    );
  }

  public changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Observable<void> {
    return this.api.put<void>('/api/Auth/me/password', payload);
  }

  public forgotPassword(email: string): Observable<void> {
    return this.api.post<void>('/api/Auth/forgot-password', { email });
  }

  public resetPassword(payload: {
    email: string;
    token: string;
    newPassword: string;
  }): Observable<void> {
    return this.api.post<void>('/api/Auth/reset-password', payload);
  }

  public activateAccount(payload: { email: string; token: string }): Observable<void> {
    return this.api.post<void>('/api/Auth/activate-account', payload);
  }

  public resendActivation(payload: { email: string }): Observable<void> {
    return this.api.post<void>('/api/Auth/resend-activation', payload);
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
    if (!(error instanceof HttpErrorResponse)) {
      if (typeof error === 'string' && error.trim()) {
        return this.localizeError(error.trim(), undefined, fallback);
      }
      return fallback;
    }

    if (error.status === 0) {
      return 'تعذر الاتصال بالخدمة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
    }

    const code = this.extractErrorCode(error);
    if (code === 'account_inactive') {
      return 'الحساب غير مفعّل بعد. يرجى الضغط على رابط التفعيل المرسل إلى بريدك الإلكتروني.';
    }
    if (code === 'account_pending_approval') {
      return 'حسابك قيد المراجعة والاعتماد من قبل إدارة النظام.';
    }

    const messages = this.collectErrorMessages(error.error);
    if (messages.length > 0) {
      const localized = messages.map((message) =>
        this.localizeError(message, error.status, fallback),
      );
      const filtered = [...new Set(localized.filter((msg) => !!msg.trim()))];
      if (filtered.length > 0) {
        return filtered.join(' ');
      }
    }

    if (error.status === 401) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    if (error.status === 403) {
      return 'ليس لديك الصلاحية لتنفيذ هذا الإجراء.';
    }
    if (error.status === 404) {
      return 'البيانات أو الصفحة المطلوبة غير متوفرة.';
    }
    if (error.status === 409) {
      return 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.';
    }
    if (error.status === 429) {
      return 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قليلاً ثم المحاولة مجدداً.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم أثناء معالجة الطلب. يرجى المحاولة مرة أخرى لاحقاً.';
    }

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
    const code = error.error?.error?.code ?? error.error?.code ?? null;
    if (typeof code === 'string' && code.trim()) return code.trim();
    if (typeof error.error === 'string') {
      const lower = error.error.toLowerCase();
      if (
        lower.includes('account_inactive') ||
        lower.includes('not activated') ||
        lower.includes('not active')
      ) {
        return 'account_inactive';
      }
      if (
        lower.includes('account_pending_approval') ||
        lower.includes('pending approval') ||
        lower.includes('pending_approval')
      ) {
        return 'account_pending_approval';
      }
    }
    return null;
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
    if (typeof payload === 'string') return payload.trim() ? [payload.trim()] : [];
    if (Array.isArray(payload)) return payload.flatMap((item) => this.collectErrorMessages(item));
    if (!payload || typeof payload !== 'object') return [];

    const value = payload as Record<string, unknown>;
    for (const key of ['message', 'Message', 'description', 'Description']) {
      if (typeof value[key] === 'string' && (value[key] as string).trim()) {
        return [(value[key] as string).trim()];
      }
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

  private localizeError(
    message: string,
    statusCode?: number,
    fallback = 'حدث خطأ غير متوقع. حاول مرة أخرى.',
  ): string {
    const normalized = message.trim().toLowerCase();

    // 1. Credentials / Unauthorized
    if (
      normalized === 'unauthorized' ||
      normalized.includes('unauthorized') ||
      normalized.includes('authentication is required') ||
      normalized.includes('invalid credentials') ||
      normalized.includes('invalid email or password') ||
      normalized.includes('invalid username or password') ||
      normalized.includes('bad credentials') ||
      normalized.includes('wrong password') ||
      normalized.includes('incorrect password') ||
      normalized.includes('password is incorrect') ||
      normalized.includes('user not found') ||
      normalized.includes('invalid user')
    ) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }

    // 2. Account inactive or pending
    if (
      normalized.includes('not activated') ||
      normalized.includes('user account is not active') ||
      normalized.includes('account is not active') ||
      normalized.includes('waiting for admin approval') ||
      normalized.includes('account_inactive')
    ) {
      return 'الحساب غير مفعّل بعد. يرجى الضغط على رابط التفعيل المرسل إلى بريدك الإلكتروني.';
    }
    if (
      normalized.includes('pending approval') ||
      normalized.includes('account_pending_approval')
    ) {
      return 'حسابك قيد المراجعة والاعتماد من قبل إدارة النظام.';
    }

    // 3. Email duplicates
    if (
      normalized.includes('email already in use') ||
      normalized.includes('duplicate email') ||
      normalized.includes('duplicate username') ||
      normalized.includes('duplicateemail') ||
      normalized.includes('duplicateusername') ||
      normalized.includes('already taken') ||
      normalized.includes('is already taken') ||
      normalized.includes('already registered')
    ) {
      return 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.';
    }

    // 4. Password policy & mismatch
    if (
      normalized.includes('invalid old password') ||
      normalized.includes('current password is incorrect') ||
      normalized.includes('wrong current password') ||
      normalized.includes('passwordmismatch')
    ) {
      return 'كلمة المرور الحالية غير صحيحة.';
    }
    if (
      normalized.includes('passwords must') ||
      normalized.includes('password requires') ||
      normalized.includes('password is too short') ||
      normalized.includes('passwordtooshort') ||
      normalized.includes('passwordrequires')
    ) {
      return 'كلمة المرور لا تستوفي متطلبات الأمان (يجب أن تتكون من 8 أحرف على الأقل، وتحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص).';
    }

    // 5. Tokens / Reset / Invites / Activation
    if (
      normalized.includes('invalid reset') ||
      normalized.includes('invalid token') ||
      normalized.includes('token expired') ||
      normalized.includes('token is invalid') ||
      normalized.includes('reset password token is invalid')
    ) {
      return 'الرابط غير صالح أو انتهت صلاحيته.';
    }
    if (
      normalized.includes('invitation is invalid') ||
      normalized.includes('invitation is no longer') ||
      normalized.includes('invitation expired') ||
      normalized.includes('invitation not found')
    ) {
      return 'رابط الدعوة غير صالح أو انتهت صلاحيته.';
    }
    if (
      normalized.includes('activation token is invalid') ||
      normalized.includes('invalid activation')
    ) {
      return 'رابط التفعيل غير صالح أو انتهت صلاحيته.';
    }
    if (
      normalized.includes('already activated') ||
      normalized.includes('already active')
    ) {
      return 'الحساب مفعّل بالفعل. يمكنك تسجيل الدخول مباشرة.';
    }

    // 6. Permissions / Forbidden
    if (
      normalized.includes('forbidden') ||
      normalized.includes('not allowed') ||
      normalized.includes('access denied') ||
      normalized.includes('you are not allowed')
    ) {
      return 'ليس لديك الصلاحية لتنفيذ هذا الإجراء.';
    }

    // 7. Not Found
    if (
      normalized.includes('not found') ||
      normalized.includes('resource was not found')
    ) {
      return 'البيانات أو الصفحة المطلوبة غير متوفرة.';
    }

    // 8. Rate Limiting
    if (
      normalized.includes('too many requests') ||
      normalized.includes('rate limit')
    ) {
      return 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قليلاً ثم المحاولة مجدداً.';
    }

    // 9. Validation
    if (
      normalized.includes('validation failed') ||
      normalized.includes('bad request') ||
      normalized.includes('one or more validation errors occurred')
    ) {
      return 'يرجى التحقق من صحة البيانات المدخلة والمحاولة مرة أخرى.';
    }

    // 10. Server / Unexpected
    if (
      normalized.includes('unexpected error') ||
      normalized.includes('could not be completed') ||
      normalized.includes('internal server error')
    ) {
      return 'حدث خطأ في الخادم أثناء معالجة الطلب. يرجى المحاولة مرة أخرى لاحقاً.';
    }

    // 11. Untranslated English technical messages fallback
    if (/[a-zA-Z]/.test(message)) {
      if (statusCode === 401) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      if (statusCode === 403) return 'ليس لديك الصلاحية لتنفيذ هذا الإجراء.';
      if (statusCode === 404) return 'البيانات أو الصفحة المطلوبة غير متوفرة.';
      if (statusCode === 409) return 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.';
      if (statusCode === 400) return 'يرجى التحقق من صحة البيانات المدخلة والمحاولة مرة أخرى.';
      if (statusCode && statusCode >= 500)
        return 'حدث خطأ في الخادم أثناء معالجة الطلب. يرجى المحاولة مرة أخرى لاحقاً.';
      return fallback;
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
