import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '@core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('@features/Home/home').then((m) => m.Home),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('@features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'admin-dashboard',
    canActivate: [authGuard, roleGuard('Admin')],
    loadComponent: () => import('@features/admin-dashboard/layout/admin-dashboard-layout').then((m) => m.AdminDashboardLayout),
    children: [
      { path: 'control-panel', loadComponent: () => import('@features/admin-dashboard/control-panel/control-panel').then((m) => m.ControlPanel) },
      { path: 'accounts', loadComponent: () => import('@features/admin-dashboard/accounts/accounts').then((m) => m.Accounts) },
      { path: 'destinations', loadComponent: () => import('@features/admin-dashboard/destinations/destinations').then((m) => m.Destinations) },
      { path: 'products', loadComponent: () => import('@features/admin-dashboard/products/products').then((m) => m.Products) },
      { path: 'regulatory-data', loadComponent: () => import('@features/admin-dashboard/regulatory-data/regulatory-data').then((m) => m.RegulatoryData) },
      { path: 'knowledge-base', loadComponent: () => import('@features/admin-dashboard/knowledge-base/knowledge-base').then((m) => m.KnowledgeBase) },
      { path: '', pathMatch: 'full', redirectTo: 'control-panel' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard, roleGuard('FarmOwner')],
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: 'dashboard', loadComponent: () => import('@features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'export-plans/:id/phase-two', loadComponent: () => import('@features/dashboard/phase-two/phase-two-workspace').then((m) => m.PhaseTwoWorkspace) },
      { path: 'export-plans/:id', loadComponent: () => import('@features/dashboard/pages/export-plan-details/export-plan-details').then((m) => m.ExportPlanDetailsPage) },
      { path: 'export-plans', loadComponent: () => import('@features/dashboard/pages/export-plan/export-plans').then((m) => m.ExportPlans) },
      { path: 'activities', loadComponent: () => import('@features/dashboard/pages/dashboard/activities/activities').then((m) => m.Activities) },
      { path: 'ai-agent', loadComponent: () => import('@features/dashboard/pages/Ai-Agent/ai-agent').then((m) => m.AiAgent) },
      { path: 'market-comparison', loadComponent: () => import('@features/dashboard/pages/market-comparison/market-comparison').then((m) => m.MarketComparison) },
      { path: 'account-settings', loadComponent: () => import('@features/dashboard/pages/account-settings/account-settings').then((m) => m.AccountSettings) },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
