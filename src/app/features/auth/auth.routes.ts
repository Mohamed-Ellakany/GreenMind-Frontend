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
    title: 'تسجيل الدخول | جرين مايند',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    title: 'إنشاء حساب | جرين مايند',
    loadComponent: () =>
      import('./pages/register/register').then(m => m.Register)
  },
  {
    path: 'activation-pending',
    title: 'تفعيل الحساب | جرين مايند',
    loadComponent: () =>
      import('./pages/pending-approval/pending-approval').then(m => m.PendingApproval)
  },
  {
    path: 'pending-approval',
    redirectTo: 'activation-pending',
    pathMatch: 'full'
  },
  {
    path: 'activate-account',
    title: 'تفعيل الحساب | جرين مايند',
    loadComponent: () =>
      import('./pages/activate-account/activate-account').then(m => m.ActivateAccount)
  },
  { path: 'forgot-password', title: 'استعادة كلمة المرور | جرين مايند', loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password', title: 'إعادة تعيين كلمة المرور | جرين مايند', loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword) },
  {
    path: 'accept-invitation',
    title: 'قبول دعوة الإدارة | جرين مايند',
    loadComponent: () => import('./pages/accept-invitation/accept-invitation').then(m => m.AcceptInvitation)
  },
];
