import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (component) => component.RegisterComponent,
      ),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (component) => component.LoginComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/default-redirect/default-redirect.component').then(
        (component) => component.DefaultRedirectComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['PlatformAdmin'])],
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then(
        (component) => component.AdminLayoutComponent,
      ),
    children: [
      {
        path: 'farms',
        loadComponent: () =>
          import('./features/admin/farms/farm-list/farm-list.component').then(
            (component) => component.FarmListComponent,
          ),
      },
      {
        path: 'farms/:farmId',
        loadComponent: () =>
          import('./features/admin/farms/farm-detail/farm-detail.component').then(
            (component) => component.FarmDetailComponent,
          ),
      },
      {
        path: 'crops',
        loadComponent: () =>
          import('./features/admin/crops/crop-list/crop-list.component').then(
            (component) => component.CropListComponent,
          ),
      },
      {
        path: 'destinations',
        loadComponent: () =>
          import('./features/admin/destinations/destination-list/destination-list.component').then(
            (component) => component.DestinationListComponent,
          ),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./features/admin/statistics/statistics.component').then(
            (component) => component.StatisticsComponent,
          ),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard, roleGuard(['FarmOwner'])],
    loadComponent: () =>
      import('./layout/farm-owner-layout/farm-owner-layout.component').then(
        (component) => component.FarmOwnerLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'export-plans',
      },
      {
        path: 'farm',
        canActivate: [authGuard, roleGuard(['FarmOwner'])],
        loadComponent: () =>
          import('./features/farm/farm-view/farm-view.component').then(
            (component) => component.FarmViewComponent,
          ),
      },
      {
        path: 'export-plans',
        loadComponent: () =>
          import('./features/export-plans/plan-list/plan-list.component').then(
            (component) => component.PlanListComponent,
          ),
      },
      {
        path: 'export-plans/new',
        loadComponent: () =>
          import('./features/export-plans/plan-create/plan-create.component').then(
            (component) => component.PlanCreateComponent,
          ),
      },
      {
        path: 'export-plans/:exportPlanId',
        canActivate: [authGuard, roleGuard(['FarmOwner'])],
        loadComponent: () =>
          import('./features/export-plans/plan-workspace/plan-workspace.component').then(
            (component) => component.PlanWorkspaceComponent,
          ),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'dashboard',
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/export-plans/plan-dashboard/plan-dashboard.component').then(
                (component) => component.PlanDashboardComponent,
              ),
          },
          {
            path: 'tasks',
            loadComponent: () =>
              import('./features/export-plans/tasks/tasks.component').then(
                (component) => component.TasksComponent,
              ),
          },
          {
            path: 'soil-measurements',
            loadComponent: () =>
              import('./features/export-plans/soil-measurements/soil-measurements.component').then(
                (component) => component.SoilMeasurementsComponent,
              ),
          },
        ],
      },
    ],
  },
];
