import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { LoginRequest } from '../../../../core/interfaces/login-request.interface';
import { ForgotRequest } from '../../../../core/interfaces/forgot-request.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  mostrarRecuperacion = signal(false);
  correoRecuperacion = signal('');
  errorRecuperacion = signal('');
  mensajeRecuperacion = signal('');
  enviandoRecuperacion = signal(false);
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private servicio: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(val => !val);
  }

  abrirRecuperacion(): void {

    this.errorRecuperacion.set('');
    this.mensajeRecuperacion.set('');
  
    // Si el usuario ya escribió su correo en el login,
    // lo colocamos automáticamente en el modal.
    const correoLogin =
      this.loginForm.get('email')?.value || '';
  
    this.correoRecuperacion.set(correoLogin);
  
    this.mostrarRecuperacion.set(true);
  }

  cerrarRecuperacion(): void {

    this.mostrarRecuperacion.set(false);
  
    this.errorRecuperacion.set('');
    this.mensajeRecuperacion.set('');
  }

  actualizarCorreoRecuperacion(event: Event): void {

    const input = event.target as HTMLInputElement;
  
    this.correoRecuperacion.set(input.value);
  }

  

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Mock API call to authenticate
    setTimeout(() => {
      const { email, password } = this.loginForm.value;

      const loginRequest: LoginRequest = { correo: email, clave: password };

      this.servicio.login(loginRequest).subscribe({
        next: (response) => {
          // Handle successful login, e.g., store token, navigate to dashboard
          console.log('Login successful:', response);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          // Handle login error
          console.error('Login failed:', error);
          this.errorMessage.set('Invalid email or password.');
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
    }, 1500);
  }
  enviarRecuperacion(): void {

    const correo = this.correoRecuperacion().trim();
  
    this.errorRecuperacion.set('');
    this.mensajeRecuperacion.set('');
  
    // Validar vacío
    if (!correo) {
      this.errorRecuperacion.set(
        'Ingrese su correo electrónico.'
      );
      return;
    }
  
    // Validar formato
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!formatoCorreo.test(correo)) {
      this.errorRecuperacion.set(
        'Ingrese un correo electrónico válido.'
      );
      return;
    }
  
    // Preparar request
    const request: ForgotRequest = {
      correo: correo
    };
  
    this.enviandoRecuperacion.set(true);
  
    // Consumir API
    this.servicio.forgot(request).subscribe({
  
      next: (response) => {
  
        this.enviandoRecuperacion.set(false);
  
        this.mensajeRecuperacion.set(
          response.mensaje
        );
  
        console.log(
          'Recuperación enviada:',
          response
        );
      },
  
      error: (error) => {
  
        this.enviandoRecuperacion.set(false);
  
        console.error(
          'Error al recuperar contraseña:',
          error
        );
  
        if (error.status === 404) {
  
          this.errorRecuperacion.set(
            'No existe un usuario registrado con ese correo.'
          );
  
        } else {
  
          this.errorRecuperacion.set(
            'No se pudo enviar el correo. Intente nuevamente.'
          );
  
        }
      }
  
    });
  }


}
