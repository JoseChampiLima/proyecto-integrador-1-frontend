// RUTA src\app\features\admin\pages\sedes\sede-form\sede-form.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TipoEspacioService } from '../../../../../core/services/tipo-espacio.service';
import { TipoEspacio } from '../../../../../core/models/tipo-espacio.model';

@Component({
  selector: 'app-tipo-espacio-form',
  standalone: true,
  imports: [ReactiveFormsModule,],
  templateUrl: './tipo-espacio-form.component.html',
  styleUrl: './tipo-espacio-form.component.css'
})
export class TipoEspacioFormComponent implements OnInit {
  tiposEspacioForm: FormGroup;
  modoEdicion = signal(false);
  idTipoEspacio: number | null = null;
  
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private tipoEspacioService: TipoEspacioService
  ) {
    this.tiposEspacioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      estado: [true]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idTipoEspacio = Number(idParam);
      // En edición la clave es opcional (solo si el admin quiere resetearla)
      this.cargarTipoEspacio(this.idTipoEspacio);
    } else {
      // En creación sí es obligatoria
      this.tiposEspacioForm.get('clave')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.tiposEspacioForm.get('clave')?.updateValueAndValidity();
    }
  }

  cargarTipoEspacio(id: number): void {
    this.isLoading.set(true);
    this.tipoEspacioService.buscarPorId(id).subscribe({
      next: (tipoEspacio) => {
        this.tiposEspacioForm.patchValue({
          nombre: tipoEspacio.nombre,
          descripcion: tipoEspacio.descripcion,
          estado: tipoEspacio.estado
        });
      },
      error: (err) => {
        console.error('Error al cargar tipo de espacio:', err);
        this.errorMessage.set('No se pudo cargar el tipo de espacio.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  onSubmit(): void {
    if (this.tiposEspacioForm.invalid) {
      this.tiposEspacioForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { nombre, descripcion, estado } = this.tiposEspacioForm.value;

    const tipoEspacio: TipoEspacio = {
      nombre,
      descripcion,
      estado
    };

    const peticion = this.modoEdicion() && this.idTipoEspacio
      ? this.tipoEspacioService.actualizar(this.idTipoEspacio, tipoEspacio)
      : this.tipoEspacioService.guardar(tipoEspacio);

    peticion.subscribe({
      next: () => this.router.navigate(['/admin/tipos-espacio']),
      error: (err) => {
        console.error('Error al guardar tipo de espacio:', err);
        this.errorMessage.set('No se pudo guardar el tipo de espacio. Verifique los datos.');
        this.isSaving.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/tipos-espacio']);
  }
}