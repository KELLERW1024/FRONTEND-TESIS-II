import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
;

export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isTokenExpired()) {

    authService.logout();

    router.navigate(['/login']);

    return false;
  }

  return true;
};