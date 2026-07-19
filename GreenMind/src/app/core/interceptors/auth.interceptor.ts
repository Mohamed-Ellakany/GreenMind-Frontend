import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const token = authService.token;
  const authenticatedRequest = token
    ? request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.clearAuthState();
        toastService.showError('انتهت جلسة الدخول، يرجى تسجيل الدخول مرة أخرى');
        void router.navigateByUrl('/auth/login');
      } else if (error instanceof HttpErrorResponse && error.status === 403) {
        toastService.showError('ليس لديك صلاحية للوصول إلى هذا المورد');
      } else {
        toastService.showHttpError(error);
      }

      return throwError(() => error);
    }),
  );
};
