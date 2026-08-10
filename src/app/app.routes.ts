import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '@core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'جرين مايند | زراعة أذكى، تصدير أقوى',
    loadComponent: () => import('@features/Home/home').then((m) => m.Home),
  },
  {
    path: 'legal/terms',
    title: 'شروط الاستخدام | جرين مايند',
    data: { kind: 'terms' },
    loadComponent: () => import('@features/legal/legal-page').then((m) => m.LegalPage),
  },
  {
    path: 'legal/privacy',
    title: 'سياسة الخصوصية | جرين مايند',
    data: { kind: 'privacy' },
    loadComponent: () => import('@features/legal/legal-page').then((m) => m.LegalPage),
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
      { path: 'control-panel', title: 'لوحة إدارة المنصة | جرين مايند', loadComponent: () => import('@features/admin-dashboard/control-panel/control-panel').then((m) => m.ControlPanel) },
      { path: 'accounts', title: 'حسابات المزارع | جرين مايند', loadComponent: () => import('@features/admin-dashboard/accounts/accounts').then((m) => m.Accounts) },
      { path: 'destinations', title: 'وجهات التصدير | جرين مايند', loadComponent: () => import('@features/admin-dashboard/destinations/destinations').then((m) => m.Destinations) },
      { path: 'products', title: 'إدارة المحاصيل | جرين مايند', loadComponent: () => import('@features/admin-dashboard/products/products').then((m) => m.Products) },
      { path: 'regulatory-data', title: 'البيانات التنظيمية | جرين مايند', loadComponent: () => import('@features/admin-dashboard/regulatory-data/regulatory-data').then((m) => m.RegulatoryData) },
      { path: 'knowledge-base', title: 'قاعدة المعرفة | جرين مايند', loadComponent: () => import('@features/admin-dashboard/knowledge-base/knowledge-base').then((m) => m.KnowledgeBase) },
      { path: 'support', title: 'رسائل الدعم | جرين مايند', loadComponent: () => import('@features/admin-dashboard/support/admin-support').then((m) => m.AdminSupport) },
      { path: 'team', title: 'فريق الإدارة | جرين مايند', loadComponent: () => import('@features/admin-dashboard/team/admin-team').then((m) => m.AdminTeam) },
      { path: 'settings', title: 'إعدادات الإدارة | جرين مايند', loadComponent: () => import('@features/admin-dashboard/settings/admin-settings').then((m) => m.AdminSettings) },
      { path: '', pathMatch: 'full', redirectTo: 'control-panel' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard, roleGuard('FarmOwner')],
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: 'dashboard', title: 'لوحة التحكم | جرين مايند', loadComponent: () => import('@features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'export-plans/:id/phase-two', loadComponent: () => import('@features/dashboard/phase-two/phase-two-legacy-redirect').then((m) => m.PhaseTwoLegacyRedirect) },
      { path: 'export-plans/:id/overview', title: 'لوحة متابعة الخطة | جرين مايند', loadComponent: () => import('@features/dashboard/pages/export-plan-details/export-plan-details').then((m) => m.ExportPlanDetailsPage) },
      { path: 'export-plans/:id/agricultural-advisor', title: 'مستشار الخطة الذكي | جرين مايند', loadComponent: () => import('@features/dashboard/phase-two/agricultural-advisor-page').then((m) => m.AgriculturalAdvisorPage) },
      { path: 'export-plans/:id/crop-health', title: 'تشخيص ومتابعة المحصول | جرين مايند', loadComponent: () => import('@features/dashboard/phase-two/crop-health-page').then((m) => m.CropHealthPage) },
      { path: 'export-plans/:id/crop-health/diagnoses/:diagnosisId', title: 'جلسة تشخيص المحصول | جرين مايند', loadComponent: () => import('@features/dashboard/phase-two/diagnosis-chat-page').then((m) => m.DiagnosisChatPage) },
      { path: 'export-plans/:id/budget-expenses', title: 'الميزانية وسجل المصروفات | جرين مايند', loadComponent: () => import('@features/dashboard/phase-two/budget-expenses-page').then((m) => m.BudgetExpensesPage) },
      { path: 'export-plans/:id', pathMatch: 'full', redirectTo: 'export-plans/:id/overview' },
      { path: 'export-plans', title: 'خطط التصدير | جرين مايند', loadComponent: () => import('@features/dashboard/pages/export-plan/export-plans').then((m) => m.ExportPlans) },
      { path: 'activities', title: 'المهام والأنشطة | جرين مايند', loadComponent: () => import('@features/dashboard/pages/dashboard/activities/activities').then((m) => m.Activities) },
      { path: 'ai-agent', title: 'المستشار الذكي | جرين مايند', loadComponent: () => import('@features/dashboard/pages/Ai-Agent/ai-agent').then((m) => m.AiAgent) },
      { path: 'market-comparison', title: 'مقارنة أسواق التصدير | جرين مايند', loadComponent: () => import('@features/dashboard/pages/market-comparison/market-comparison').then((m) => m.MarketComparison) },
      { path: 'account-settings', title: 'إعدادات الحساب | جرين مايند', loadComponent: () => import('@features/dashboard/pages/account-settings/account-settings').then((m) => m.AccountSettings) },
      { path: 'support', title: 'مركز المساعدة | جرين مايند', loadComponent: () => import('@features/dashboard/pages/support/support-page').then((m) => m.SupportPage) },
      { path: 'statistics', title: 'الإحصائيات والتقارير | جرين مايند', loadComponent: () => import('@features/dashboard/pages/statistics/statistics').then((m) => m.Statistics) },
    ],
  },
  {
    path: '**',
    title: 'الصفحة غير موجودة | جرين مايند',
    loadComponent: () => import('@features/not-found/not-found').then((m) => m.NotFound),
  },
];
