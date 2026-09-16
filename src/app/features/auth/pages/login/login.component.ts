import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
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
    private router: Router
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

      // Let's accept any credentials for demo but display success/error simulation
      if (email === 'admin@lawtennis.pe' && password === '123456') {
        this.isLoading.set(false);
        this.errorMessage.set(null);
        alert('¡Inicio de sesión exitoso! Ingresando a la plataforma...');
      } else {
        this.errorMessage.set('Credenciales inválidas.');
        this.isLoading.set(false);
      }
    }, 1500);
  }
}
