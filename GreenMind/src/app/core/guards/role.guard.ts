// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';

// import { UserRole } from '../models/user.model';
// import { AuthService } from '../services/auth.service';

// export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => () => {
//   const authService = inject(AuthService);
//   const router = inject(Router);
//   const user = authService.currentUser();

//   return user && allowedRoles.includes(user.role)
//     ? true
//     : router.createUrlTree(['/auth/login']);
// };

import { CanActivateFn } from '@angular/router';

export function roleGuard(roles: string[]): CanActivateFn {
  return () => true;
}