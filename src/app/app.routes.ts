import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { LoginComponent } from './features/authentication/login/login.component';
import { authGuard } from './guard/auth.guard';
import { LandingPageComponent } from './features/landing/landing-page/landing-page.component';


export const routes: Routes = [
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
        path: 'conversations',
        loadChildren: () =>
          import('./features/conversation/conversation.routes').then( (m) => m.ConversationRoutes ),
      },
      {
        path: 'coupons',
        loadChildren: () =>
          import('./features/coupons/coupons.routes').then( (m) => m.CouponsRoutes ),
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./features/payment/payments.routes').then( (m) => m.PaymentsRoutes ),
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
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }, 


  /* { path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
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
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },*/
];
