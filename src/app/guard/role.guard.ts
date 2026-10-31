import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no está autenticado o el token expiró
  if (authService.isTokenExpired()) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  // Lista de roles permitidos pasada en data: { roles: [1] }
  const expectedRoles: number[] = route.data['roles'] || [];
  const userRoleId = authService.getRoleId();

  if (userRoleId !== null && expectedRoles.includes(userRoleId)) {
    return true;
  }

  // Si no tiene permiso, lo redirige al dashboard
  router.navigate(['/dashboard']);
  return false;
};