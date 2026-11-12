import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';
import { SessionWarningComponent } from 'src/app/components/session-warning/session-warning.component';

/**
 * Avisa 5 minutos antes de que venza la sesión y permite extenderla 2 horas más
 * (la duración la define el backend en AuthController::refresh).
 * Si el usuario no la extiende, al vencer lo lleva al login.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {

  // Segundos antes del vencimiento en que aparece el aviso (5 minutos)
  private readonly WARNING_SECONDS = 5 * 60;

  // Cada cuánto se revisa el tiempo restante del token
  private readonly CHECK_INTERVAL_MS = 30 * 1000;

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private zone = inject(NgZone);

  private warningRef: MatSnackBarRef<SessionWarningComponent> | null = null;
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.zone.runOutsideAngular(() => {
      setInterval(() => this.zone.run(() => this.check()), this.CHECK_INTERVAL_MS);

      // Otra pestaña extendió la sesión o la cerró: actualizar el aviso en esta
      window.addEventListener('storage', event => {
        if (event.key === 'token') {
          this.zone.run(() => this.check());
        }
      });

      // Los navegadores frenan los temporizadores en pestañas ocultas: revisar al volver
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.zone.run(() => this.check());
        }
      });
    });

    this.check();
  }

  private check(): void {
    // Sin sesión iniciada no hay nada que avisar
    if (!this.authService.token) {
      this.closeWarning();
      return;
    }

    const secondsLeft = this.authService.tokenSecondsLeft();

    if (secondsLeft <= 0) {
      this.closeWarning();
      this.authService.clearSession();
      this.router.navigate(['/login']);
      return;
    }

    if (secondsLeft <= this.WARNING_SECONDS) {
      this.openWarning();
    } else {
      this.closeWarning();
    }
  }

  private openWarning(): void {
    if (this.warningRef) {
      return;
    }

    this.warningRef = this.snackBar.openFromComponent(SessionWarningComponent, {
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });

    this.warningRef.onAction().subscribe(() => this.extendSession());
    this.warningRef.afterDismissed().subscribe(() => this.warningRef = null);
  }

  private closeWarning(): void {
    this.warningRef?.dismiss();
  }

  private extendSession(): void {
    // Si falla (por ejemplo, el token venció justo antes del clic),
    // check() vuelve a mostrar el aviso o lleva al login según el tiempo restante
    this.authService.refreshToken().subscribe({
      next: () => this.check(),
      error: () => this.check()
    });
  }
}
