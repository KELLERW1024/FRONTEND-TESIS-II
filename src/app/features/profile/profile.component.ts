import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  messageSuccess = '';
  messageError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      current_password: [''],
      new_password: [''],
      new_password_confirmation: ['']
    });
  }

  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 2) {
      return `${name[0]}***@${domain}`;
    }
    const visibleChars = 3;
    const masked = name.slice(0, visibleChars) + '*'.repeat(Math.max(name.length - visibleChars, 3));
    return `${masked}@${domain}`;
  }

  loadProfile(): void {
    // 1. Carga inmediata desde el almacenamiento local
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.profileForm.patchValue({
          name: user.name || '',
          last_name: user.last_name || '',
          email: this.maskEmail(user.email || '')
        });
      } catch (e) {
        console.error('Error al leer usuario de almacenamiento', e);
      }
    }

    // 2. Consulta al backend para sincronizar
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (res: any) => {
        this.loading = false;
        const user = res?.user || res;
        if (user) {
          this.profileForm.patchValue({
            name: user.name || '',
            last_name: user.last_name || '',
            email: this.maskEmail(user.email || '')
          });
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.messageSuccess = '';
    this.messageError = '';
    this.loading = true;

    const rawData = this.profileForm.getRawValue();
    const payload: any = {
      name: rawData.name,
      last_name: rawData.last_name
    };

    if (rawData.new_password) {
      payload.current_password = rawData.current_password;
      payload.new_password = rawData.new_password;
      payload.new_password_confirmation = rawData.new_password_confirmation;
    }

    this.authService.updateProfile(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.messageSuccess = res.message || 'Datos actualizados con éxito';
        
        // Actualizar datos locales
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.name = rawData.name;
        currentUser.last_name = rawData.last_name;
        localStorage.setItem('user', JSON.stringify(currentUser));

        this.profileForm.patchValue({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
      },
      error: (err: any) => {
        this.loading = false;
        this.messageError = err.error?.message || 'Error al actualizar el perfil';
      }
    });
  }
}