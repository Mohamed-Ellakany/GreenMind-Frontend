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
      { path: 'support', loadComponent: () => import('@features/admin-dashboard/support/admin-support').then((m) => m.AdminSupport) },
      { path: 'team', loadComponent: () => import('@features/admin-dashboard/team/admin-team').then((m) => m.AdminTeam) },
      { path: 'settings', loadComponent: () => import('@features/admin-dashboard/settings/admin-settings').then((m) => m.AdminSettings) },
      { path: '', pathMatch: 'full', redirectTo: 'control-panel' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard, roleGuard('FarmOwner')],
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: 'dashboard', loadComponent: () => import('@features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'export-plans/:id/phase-two', loadComponent: () => import('@features/dashboard/phase-two/phase-two-legacy-redirect').then((m) => m.PhaseTwoLegacyRedirect) },
      { path: 'export-plans/:id/overview', title: 'لوحة متابعة الخطة | جرين مايند', loadComponent: () => import('@features/dashboard/pages/export-plan-details/export-plan-details').then((m) => m.ExportPlanDetailsPage) },
      { path: 'export-plans/:id/agricultural-advisor', title: 'مستشار الخطة الذكي | جرين مايند', loadComponent: () => import('@features/dashboard/phase-two/agricultural-advisor-page').then((m) => m.AgriculturalAdvisorPage) },
      { path: 'export-plans/:id/crop-health', title: 'تشخيص ومتابعة المحصول | جرين مايند', loadComponent: () => import('@features/dashboard/phase-two/crop-health-page').then((m) => m.CropHealthPage) },
      { path: 'export-plans/:id/crop-health/diagnoses/:diagnosisId', title: 'جلسة تشخيص المحصول | جرين مايند', loadComponent: () => import('@features/dashboard/phase-two/diagnosis-chat-page').then((m) => m.DiagnosisChatPage) },
      { path: 'export-plans/:id/budget-expenses', title: 'الميزانية وسجل المصروفات | جرين مايند', loadComponent: () => import('@features/dashboard/phase-two/budget-expenses-page').then((m) => m.BudgetExpensesPage) },
      { path: 'export-plans/:id', pathMatch: 'full', redirectTo: 'export-plans/:id/overview' },
      { path: 'export-plans', loadComponent: () => import('@features/dashboard/pages/export-plan/export-plans').then((m) => m.ExportPlans) },
      { path: 'activities', loadComponent: () => import('@features/dashboard/pages/dashboard/activities/activities').then((m) => m.Activities) },
      { path: 'ai-agent', loadComponent: () => import('@features/dashboard/pages/Ai-Agent/ai-agent').then((m) => m.AiAgent) },
      { path: 'market-comparison', loadComponent: () => import('@features/dashboard/pages/market-comparison/market-comparison').then((m) => m.MarketComparison) },
      { path: 'account-settings', loadComponent: () => import('@features/dashboard/pages/account-settings/account-settings').then((m) => m.AccountSettings) },
      { path: 'support', loadComponent: () => import('@features/dashboard/pages/support/support-page').then((m) => m.SupportPage) },
      { path: 'statistics', loadComponent: () => import('@features/dashboard/pages/statistics/statistics').then((m) => m.Statistics) },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
