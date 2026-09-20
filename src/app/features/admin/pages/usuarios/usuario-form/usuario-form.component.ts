// RUTA src\app\features\admin\pages\usuarios\usuario-form\usuario-form.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../../../../core/services/usuario.service';
import { RolService } from '../../../../../core/services/rol.service';
import { Usuario } from '../../../../../core/models/usuario.model';
import { Rol } from "../../../../../core/models/rol.model";
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css'
})
export class UsuarioFormComponent implements OnInit {
  usuarioForm: FormGroup;
  roles = signal<Rol[]>([]);
  modoEdicion = signal(false);
  idUsuario: number | null = null;

  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private rolService: RolService
  ) {
    this.usuarioForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      // En creación la clave es obligatoria; en edición se deja vacía = "no cambiar"
      clave: [''],
      idRol: [null, Validators.required],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.rolService.listar().subscribe({
      next: (roles) => this.roles.set(roles),
      error: (err) => console.error('Error al cargar roles:', err)
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idUsuario = Number(idParam);
      // En edición la clave es opcional (solo si el admin quiere resetearla)
      this.cargarUsuario(this.idUsuario);
    } else {
      // En creación sí es obligatoria
      this.usuarioForm.get('clave')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.usuarioForm.get('clave')?.updateValueAndValidity();
    }
  }

  cargarUsuario(id: number): void {
    this.isLoading.set(true);
    this.usuarioService.buscarPorId(id).subscribe({
      next: (usuario) => {
        this.usuarioForm.patchValue({
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          dni: usuario.dni,
          telefono: usuario.telefono,
          correo: usuario.correo,
          idRol: usuario.rol.idRol,
          estado: usuario.estado
        });
      },
      error: (err) => {
        console.error('Error al cargar usuario:', err);
        this.errorMessage.set('No se pudo cargar el usuario.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { nombres, apellidos, dni, telefono, correo, clave, idRol, estado } = this.usuarioForm.value;

    const usuario: Usuario = {
      nombres,
      apellidos,
      dni,
      telefono,
      correo,
      clave, // si estás editando y lo dejaste vacío, revisa que tu backend ignore claves vacías
      estado,
      rol: { idRol }
    };

    const peticion = this.modoEdicion() && this.idUsuario
      ? this.usuarioService.actualizar(this.idUsuario, usuario)
      : this.usuarioService.guardar(usuario);

    peticion.subscribe({
      next: () => this.router.navigate(['/admin/usuarios']),
      error: (err) => {
        console.error('Error al guardar usuario:', err);
        this.errorMessage.set('No se pudo guardar el usuario. Verifique los datos.');
      },
      complete: () => this.isSaving.set(false)
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/usuarios']);
  }
}