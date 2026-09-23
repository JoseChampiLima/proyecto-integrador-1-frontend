// RUTA src\app\shared\components\editar-perfil-modal\editar-perfil-modal.component.ts

import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ActualizarPerfilRequest } from '../../../core/interfaces/actualizar-perfil-request.interface';
import { SoloNumerosDirective } from '../../directives/solo-numeros.directive';

@Component({
  selector: 'app-editar-perfil-modal',
  standalone: true,
  imports: [ReactiveFormsModule, SoloNumerosDirective],
  templateUrl: './editar-perfil-modal.component.html',
  styleUrl: './editar-perfil-modal.component.css'
})
export class EditarPerfilModalComponent implements OnInit {
  @Output() cerrado = new EventEmitter<void>();

  perfilForm: FormGroup;

  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Solo lectura, se muestran pero no se pueden editar desde el perfil
  dni = signal('');
  correo = signal('');

  private idUsuario: number | null = null;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {
    this.perfilForm = this.fb.group(
      {
        nombres: ['', [Validators.required, Validators.minLength(2)]],
        apellidos: ['', [Validators.required, Validators.minLength(2)]],
        telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
        cambiarClave: [false],
        claveActual: [''],
        nuevaClave: [''],
        confirmarClave: ['']
      },
      { validators: this.validarCoincidenciaClave }
    );

    // Solo exigimos los campos de contraseña cuando el usuario activa el switch
    this.perfilForm.get('cambiarClave')?.valueChanges.subscribe((activo: boolean) => {
      const claveActual = this.perfilForm.get('claveActual');
      const nuevaClave = this.perfilForm.get('nuevaClave');
      const confirmarClave = this.perfilForm.get('confirmarClave');

      if (activo) {
        claveActual?.setValidators([Validators.required]);
        nuevaClave?.setValidators([Validators.required, Validators.minLength(6)]);
        confirmarClave?.setValidators([Validators.required]);
      } else {
        claveActual?.clearValidators();
        nuevaClave?.clearValidators();
        confirmarClave?.clearValidators();
        claveActual?.setValue('');
        nuevaClave?.setValue('');
        confirmarClave?.setValue('');
      }
      claveActual?.updateValueAndValidity();
      nuevaClave?.updateValueAndValidity();
      confirmarClave?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.cargarPerfil();
  }

  private cargarPerfil(): void {
    this.isLoading.set(true);
    this.usuarioService.obtenerMiPerfil().subscribe({
      next: (perfil) => {
        this.idUsuario = perfil.idUsuario;
        this.dni.set(perfil.dni);
        this.correo.set(perfil.correo);
        this.perfilForm.patchValue({
          nombres: perfil.nombres,
          apellidos: perfil.apellidos,
          telefono: perfil.telefono
        });
      },
      error: (err) => {
        console.error('Error al cargar el perfil:', err);
        this.errorMessage.set('No se pudieron cargar tus datos.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  private validarCoincidenciaClave(grupo: AbstractControl): ValidationErrors | null {
    const activo = grupo.get('cambiarClave')?.value;
    if (!activo) return null;

    const nuevaClave = grupo.get('nuevaClave')?.value;
    const confirmarClave = grupo.get('confirmarClave')?.value;

    return nuevaClave && confirmarClave && nuevaClave !== confirmarClave
      ? { claveNoCoincide: true }
      : null;
  }

  onSubmit(): void {
    if (this.perfilForm.invalid || !this.idUsuario) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { nombres, apellidos, telefono, cambiarClave, claveActual, nuevaClave } = this.perfilForm.value;

    const request: ActualizarPerfilRequest = {
      nombres,
      apellidos,
      telefono,
      ...(cambiarClave ? { claveActual, nuevaClave } : {})
    };

    this.usuarioService.actualizarPerfil(this.idUsuario, request).subscribe({
      next: () => {
        this.successMessage.set('Perfil actualizado correctamente.');
        setTimeout(() => this.cerrado.emit(), 900);
      },
      error: (err) => {
        console.error('Error al actualizar el perfil:', err);
        const mensaje = err?.error?.mensaje ?? 'No se pudo actualizar el perfil. Verifica los datos.';
        this.errorMessage.set(mensaje);
        this.isSaving.set(false);
      },
      complete: () => this.isSaving.set(false)
    });
  }

  cerrar(): void {
    this.cerrado.emit();
  }
}