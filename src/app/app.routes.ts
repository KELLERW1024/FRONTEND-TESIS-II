import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { LoginComponent } from './features/authentication/login/login.component';
import { authGuard } from './guard/auth.guard';
import { roleGuard } from './guard/role.guard';
import { LandingPageComponent } from './features/landing/landing-page/landing-page.component';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: 'authentication',
    loadChildren: () =>
      import('./features/authentication/authentication.routes')
        .then(m => m.AUTH_ROUTES)
  },
  {
    path: 'landing',
    component: LandingPageComponent
  },
  {
    path: 'login',
    component: LoginComponent
  }, 

  {
    path: '',
    component: FullComponent,
    canActivate: [authGuard],
    children: [
      
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: [1] },
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'payment/:packageId',
        loadComponent: () =>
          import('./features/payment/payment.component').then((m) => m.PaymentComponent),
      },
      {
        path: 'diagnostic',
        loadComponent: () =>
          import('./features/diagnostic/diagnostic.component').then((m) => m.DiagnosticComponent),
      },
      {
        path: 'packages',
        canActivate: [roleGuard],
        data: { roles: [1] },
        loadComponent: () =>
          import('./features/packages/view-packages/view-packages.component').then((m) => m.ViewPackagesComponent),
      },
      {
        path: 'plans',
        canActivate: [roleGuard],
        data: { roles: [1] },
        loadComponent: () =>
          import('./features/plans/plan/plan.component').then((m) => m.PlansComponent),
      },
      {
        path: 'conversations',
        loadChildren: () =>
          import('./features/conversation/conversation.routes').then( (m) => m.ConversationRoutes ),
      },
      {
        path: 'coupons',
        canActivate: [roleGuard],
        data: { roles: [1] },
        loadChildren: () =>
          import('./features/coupons/coupons.routes').then( (m) => m.CouponsRoutes ),
      },
      {
        path: 'payments',
        canActivate: [roleGuard],
        data: { roles: [1] },
        loadChildren: () =>
          import('./features/payment/payments.routes').then( (m) => m.PaymentsRoutes ),
      },
      {
        path: 'token-usage',
        canActivate: [roleGuard],
        data: { roles: [1] },
        loadComponent: () =>
          import('./features/token-usage/token-usage.component').then((m) => m.TokenUsageComponent),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('./pages/extra/extra.routes').then((m) => m.ExtraRoutes),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }, 
];
