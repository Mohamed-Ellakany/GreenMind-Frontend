import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@features/auth/services/AuthService';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).createUrlTree(['/auth/login']);
};

export const roleGuard = (role: 'Admin' | 'SuperAdmin' | 'FarmOwner'): CanActivateFn => () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) return inject(Router).createUrlTree(['/auth/login']);
  return auth.hasRole(role) || inject(Router).createUrlTree([auth.homeUrl()]);
};
