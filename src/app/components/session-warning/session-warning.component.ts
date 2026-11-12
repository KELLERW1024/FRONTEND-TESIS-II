import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef
} from '@angular/material/snack-bar';

// Aviso de "sesión por expirar". Lo abre SessionTimeoutService 5 minutos antes del vencimiento.
@Component({
  selector: 'app-session-warning',
  imports: [MatButtonModule, MatIconModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
  template: `
    <span matSnackBarLabel class="flex items-center gap-2">
      <mat-icon>schedule</mat-icon>
      Tu sesión está por expirar.
    </span>
    <span matSnackBarActions>
      <button mat-button matSnackBarAction (click)="extend()">Extender sesión</button>
    </span>
  `,
})
export class SessionWarningComponent {
  private snackBarRef = inject(MatSnackBarRef<SessionWarningComponent>);

  // SessionTimeoutService escucha esta acción y renueva el token
  extend(): void {
    this.snackBarRef.dismissWithAction();
  }
}
