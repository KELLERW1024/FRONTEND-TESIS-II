import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  // Pasos: 1 = Email, 2 = Código OTP, 3 = Nueva contraseña
  step: 1 | 2 | 3 = 1;

  loading = false;
  errorMessage = '';
  successMessage = '';

  // Visibilidad de contraseñas
  hidePassword = true;
  hideConfirmPassword = true;

  // Temporizador para reenvío de código
  resendCountdown = 0;
  countdownTimer: any;

  // Formularios para cada paso
  emailForm!: FormGroup;
  codeForm!: FormGroup;
  passwordForm!: FormGroup;

  userEmail = '';
  verifiedCode = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  passwordsMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  startCountdown(seconds: number = 80) {
    this.resendCountdown = seconds;
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
      } else {
        clearInterval(this.countdownTimer);
      }
    }, 1000);
  }

  // --- PASO 1: Solicitar código al correo ---
  onRequestCode() {
    if (this.emailForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.userEmail = this.emailForm.value.email.trim();

    this.authService.sendResetCode(this.userEmail).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.step = 2;
          this.successMessage = 'Código enviado correctamente a tu correo.';
          this.startCountdown(80);
        } else {
          this.errorMessage = res.message || 'No se pudo enviar el correo.';
          if (res.wait_seconds) {
            this.startCountdown(res.wait_seconds);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al comunicarse con el servidor.';
      }
    });
  }

  // --- PASO 2: Validar el código de 6 dígitos ---
  onVerifyCode() {
    if (this.codeForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const code = this.codeForm.value.code.trim();

    this.authService.verifyResetCode(this.userEmail, code).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.verifiedCode = code;
        this.step = 3;
        this.successMessage = 'Código verificado con éxito. Ingresa tu nueva contraseña.';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'El código es inválido o ha expirado.';
      }
    });
  }

  // Reenviar código desde el paso 2
  onResendCode() {
    if (this.resendCountdown > 0 || this.loading) return;
    this.onRequestCode();
  }

  // --- PASO 3: Guardar nueva contraseña ---
  onResetPassword() {
    if (this.passwordForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      email: this.userEmail,
      code: this.verifiedCode,
      password: this.passwordForm.value.password
    };

    this.authService.resetPasswordWithCode(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.code === 200) {
          this.successMessage = '¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...';
          setTimeout(() => {
            this.router.navigate(['/authentication/login']);
          }, 2000);
        } else {
          this.errorMessage = res.message || 'No se pudo actualizar la contraseña.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al actualizar la contraseña.';
      }
    });
  }
}