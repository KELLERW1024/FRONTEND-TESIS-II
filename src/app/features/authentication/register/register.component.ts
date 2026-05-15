import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-register',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {

  registerForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['Outlook',[ Validators.required, Validators.maxLength(50), Validators.minLength(2)] ],
      last_name: ['out', [Validators.required, Validators.maxLength(50), Validators.minLength(2)]],
      email: ['kwilliamdesarollo@outlook.com', [Validators.required, Validators.email]],
      password: ['12345678', [Validators.required,  Validators.maxLength(50), Validators.minLength(6)] ],
      password_confirmation: ['12345678', Validators.required],
      role_id: ['2']
    }, {
      validators: this.passwordsMatchValidator
    });
  }

  passwordsMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid){
      this.registerForm.markAllAsTouched();
      return;
    } 

    this.authService.register(this.registerForm.value).subscribe({
      next: (res : any) => {

        if( res.email_exists  ){
            this.errorMessage = 'El email ya está registrado'; 
            setTimeout(() => {
              return
            }, 1500);

        }
        else if( res ){           
          this.errorMessage = '';
          this.successMessage = 'Registro exitoso, redirigiendo...';

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);

        }else {
          this.errorMessage = 'No se pudo realizar el registro intente más tarde';
          console.log('Registro fallido: respuesta inválida')
        }
        
      },
      error: (err) => {

        if (err.error?.errors) {
          this.errorMessage = Object.values(err.error.errors).flat().join(' ');
        } else {
          this.errorMessage = 'No se pudo realizar el registro, intente más tarde';
        }
        console.error('Registro fallido:', err);

      },
    });
  }

}
