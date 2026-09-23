// RUTA src\app\features\admin\pages\sedes\sede-form\sede-form.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../../../../core/services/usuario.service';
import { RolService } from '../../../../../core/services/rol.service';
import { Usuario } from '../../../../../core/models/usuario.model';
import { Rol } from "../../../../../core/models/rol.model";
import { SedeService } from '../../../../../core/services/sede.service';
import { Sede } from '../../../../../core/models/sede.model';
import { SoloNumerosDirective } from '../../../../../shared/directives/solo-numeros.directive';

@Component({
  selector: 'app-sede-form',
  standalone: true,
  imports: [ReactiveFormsModule, SoloNumerosDirective],
  templateUrl: './sede-form.component.html',
  styleUrl: './sede-form.component.css'
})
export class SedeFormComponent implements OnInit {
  sedeForm: FormGroup;
  roles = signal<Rol[]>([]);
  modoEdicion = signal(false);
  idSede: number | null = null;
  
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private sedeService: SedeService,
    private rolService: RolService
  ) {
    this.sedeForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(2)]],
      direccion: ['', [Validators.required, Validators.minLength(2)]],
      distrito: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
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
      this.idSede = Number(idParam);
      // En edición la clave es opcional (solo si el admin quiere resetearla)
      this.cargarSede(this.idSede);
    } else {
      // En creación sí es obligatoria
      this.sedeForm.get('clave')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.sedeForm.get('clave')?.updateValueAndValidity();
    }
  }

  cargarSede(id: number): void {
    this.isLoading.set(true);
    this.sedeService.buscarPorId(id).subscribe({
      next: (sede) => {
        this.sedeForm.patchValue({
          nombre: sede.nombre,
          descripcion: sede.descripcion,
          direccion: sede.direccion,
          distrito: sede.distrito,
          telefono: sede.telefono,
          estado: sede.estado
        });
      },
      error: (err) => {
        console.error('Error al cargar sede:', err);
        this.errorMessage.set('No se pudo cargar la sede.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  onSubmit(): void {
    if (this.sedeForm.invalid) {
      this.sedeForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { nombre, descripcion, direccion, distrito, telefono, clave, idRol, estado } = this.sedeForm.value;

    const sede: Sede = {
      nombre,
      descripcion,
      direccion,
      distrito,
      telefono,
      estado
    };

    const peticion = this.modoEdicion() && this.idSede
      ? this.sedeService.actualizar(this.idSede, sede)
      : this.sedeService.guardar(sede);

    peticion.subscribe({
      next: () => this.router.navigate(['/admin/sedes']),
      error: (err) => {
        console.error('Error al guardar sede:', err);
        this.errorMessage.set('No se pudo guardar la sede. Verifique los datos.');
      },
      complete: () => this.isSaving.set(false)
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/sedes']);
  }
}