import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuthStorageService } from '../auth/auth-storage.service';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../models/auth.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(AuthStorageService);

  private readonly currentToken = signal<string | null>(null);
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(
    () => this.currentUser() !== null && this.currentToken() !== null,
  );

  get token(): string | null {
    return this.storage.getToken();
  }

  register(payload: RegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiBaseUrl}/auth/register`,
      payload,
    );
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    // TODO: confirm actual errorCode values with backend team before mapping login errors in the UI.
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((response) => this.setAuthState(response.token, response.user)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => {
        this.clearAuthState();
        void this.router.navigateByUrl('/auth/login');
      }),
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http
      .get<User>(`${environment.apiBaseUrl}/auth/me`)
      .pipe(tap((user) => this.setCurrentUser(user)));
  }

  rehydrate(): Observable<User | null> {
    const token = this.token;

    if (!token) {
      this.clearAuthState();
      return of(null);
    }

    this.currentToken.set(token);
    return this.getCurrentUser().pipe(
      catchError(() => {
        this.clearAuthState();
        return of(null);
      }),
    );
  }

  clearAuthState(): void {
    this.storage.clear();
    this.currentToken.set(null);
    this.currentUser.set(null);
  }

  private setAuthState(token: string, user: User): void {
    this.storage.setToken(token);
    this.currentToken.set(token);
    this.setCurrentUser(user);
  }

  private setCurrentUser(user: User): void {
    this.storage.setUser(user);
    this.currentUser.set(user);
  }
}
