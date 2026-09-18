import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { LoginRequest } from '../../../../core/interfaces/login-request.interface';

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
}
