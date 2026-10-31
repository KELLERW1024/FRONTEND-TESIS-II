import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const redirigirLogin = () => {
    authService.clearSession();
    router.navigate(['/login']);
  };

  // Si expiró por tiempo antes de salir la petición
  if (authService.isTokenExpired()) {
    redirigirLogin();
    return throwError(() => new Error('Sesión expirada'));
  }

  // 2. Adjuntar token si existe
  const token = authService.token;
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // 3. Si el backend responde 401
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        redirigirLogin();
      }
      return throwError(() => error);
    })
  );
};