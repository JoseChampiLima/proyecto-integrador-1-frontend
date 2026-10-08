// RUTA src\app\features\admin\pages\sedes\sede-form\sede-form.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EstadoReservaService } from '../../../../../core/services/estado-reserva.service';
import { EstadoReserva } from '../../../../../core/models/estado-reserva.model';

@Component({
  selector: 'app-estado-reserva-form',
  standalone: true,
  imports: [ReactiveFormsModule,],
  templateUrl: './estado-reserva-form.component.html',
  styleUrl: './estado-reserva-form.component.css'
})
export class EstadoReservaFormComponent implements OnInit {
  estadosReservaForm: FormGroup;
  modoEdicion = signal(false);
  idEstadoReserva: number | null = null;
  
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private estadoReservaService: EstadoReservaService
  ) {
    this.estadosReservaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      estado: [true]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idEstadoReserva = Number(idParam);
      // En edición la clave es opcional (solo si el admin quiere resetearla)
      this.cargarEstadoReserva(this.idEstadoReserva);
    } else {
      // En creación sí es obligatoria
      this.estadosReservaForm.get('clave')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.estadosReservaForm.get('clave')?.updateValueAndValidity();
    }
  }

  cargarEstadoReserva(id: number): void {
    this.isLoading.set(true);
    this.estadoReservaService.buscarPorId(id).subscribe({
      next: (estadoReserva) => {
        this.estadosReservaForm.patchValue({
          nombre: estadoReserva.nombre,
          descripcion: estadoReserva.descripcion,
          estado: estadoReserva.estado
        });
      },
      error: (err) => {
        console.error('Error al cargar estado de reserva:', err);
        this.errorMessage.set('No se pudo cargar el estado de reserva.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  onSubmit(): void {
    if (this.estadosReservaForm.invalid) {
      this.estadosReservaForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { nombre, descripcion, estado } = this.estadosReservaForm.value;

    const estadoReserva: EstadoReserva = {
      nombre,
      descripcion,
      estado
    };

    const peticion = this.modoEdicion() && this.idEstadoReserva
      ? this.estadoReservaService.actualizar(this.idEstadoReserva, estadoReserva)
      : this.estadoReservaService.guardar(estadoReserva);

    peticion.subscribe({
      next: () => this.router.navigate(['/admin/estados-reserva']),
      error: (err) => {
        console.error('Error al guardar estado de reserva:', err);
        this.errorMessage.set('No se pudo guardar el estado de reserva. Verifique los datos.');
      },
      complete: () => this.isSaving.set(false)
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/estados-reserva']);
  }
}