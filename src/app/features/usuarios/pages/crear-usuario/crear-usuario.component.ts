import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Usuario } from '../../../../core/models/usuario.model';

// Rol por defecto para todo usuario creado desde este formulario (ej: Cliente)
const ID_ROL_POR_DEFECTO = 2;

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './crear-usuario.component.html',
  styleUrl: './crear-usuario.component.css'
})
export class CrearUsuarioComponent {
  usuarioForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService
  ) {
    this.usuarioForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(val => !val);
  }

  onSubmit() {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { nombres, apellidos, dni, telefono, correo, clave } = this.usuarioForm.value;

    // El rol siempre se asigna por defecto (idRol: 2), no viene de un input del usuario
    const nuevoUsuario: Usuario = {
      nombres,
      apellidos,
      dni,
      telefono,
      correo,
      clave,
      estado: true,
      rol: {
          idRol: ID_ROL_POR_DEFECTO,
          nombre: '',
          descripcion: '',
          estado: false
      }
    };

    this.usuarioService.guardar(nuevoUsuario).subscribe({
      next: (usuarioCreado) => {
        console.log('Usuario creado:', usuarioCreado);
        this.successMessage.set('Usuario registrado correctamente.');
        this.usuarioForm.reset();
        // Redirige al login tras un breve momento, o cambia por la ruta que prefieras
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        this.errorMessage.set('No se pudo registrar el usuario. Verifique los datos e intente nuevamente.');
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}