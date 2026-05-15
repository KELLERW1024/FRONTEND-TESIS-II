import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-login',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule ],
  templateUrl: './login.component.html', 
})
export class LoginComponent {


  loginForm!: FormGroup;
  errorMessage: string = '';
  
  constructor(private router: Router, private authService: AuthService, private fb: FormBuilder ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['kwilliamdesarollo@outlook.com', [Validators.required, Validators.email]],
      password: ['12345678', [Validators.required]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() { 

    if (this.loginForm.invalid) return;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res : any) => {
        if( res && res.access_token ){
          this.errorMessage = '';
          this.router.navigate(['/dashboard']);
        }else {
          this.errorMessage = 'Login fallido: respuesta inválida';
        }
        
      },
      error: (err) => {
        this.errorMessage = 'Correo o contraseña incorrectos';
      },
    });
  }

}
