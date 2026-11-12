import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionTimeoutService } from './core/services/session-timeout.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'TailwindAdmin Angular Admin Tempplate';

  constructor() {
    // Aviso de "sesión por expirar" con opción de extenderla
    inject(SessionTimeoutService).start();
  }
}
