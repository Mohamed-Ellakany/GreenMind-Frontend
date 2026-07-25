import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    // Redirects /auth to /auth/login by default
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    title: 'Login | GreenMind',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    title: 'Register | GreenMind',
    loadComponent: () =>
      import('./pages/register/register').then(m => m.Register)
  },
//   {
//     path: 'forgot-password',
//     title: 'Forgot Password | GreenMind',
//     loadComponent: () =>
//       import('./pages/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
//   }
];