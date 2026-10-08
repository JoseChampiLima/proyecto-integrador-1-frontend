// RUTA src\app\features\admin\pages\sedes\sede-form\sede-form.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MetodoPagoService } from '../../../../../core/services/metodo-pago.service';
import { MetodoPago } from '../../../../../core/models/metodo-pago.model';

@Component({
  selector: 'app-metodo-pago-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './metodo-pago-form.component.html',
  styleUrl: './metodo-pago-form.component.css'
})
export class MetodoPagoFormComponent implements OnInit {
  metodoForm: FormGroup;
  modoEdicion = signal(false);
  idMetodoPago: number | null = null;
  
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private metodoPagoService: MetodoPagoService
  ) {
    this.metodoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      estado: [true]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idMetodoPago = Number(idParam);
      // En edición la clave es opcional (solo si el admin quiere resetearla)
      this.cargarMetodoPago(this.idMetodoPago);
    } else {
      // En creación sí es obligatoria
      this.metodoForm.get('clave')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.metodoForm.get('clave')?.updateValueAndValidity();
    }
  }

  cargarMetodoPago(id: number): void {
    this.isLoading.set(true);
    this.metodoPagoService.buscarPorId(id).subscribe({
      next: (metodoPago) => {
        this.metodoForm.patchValue({
          nombre: metodoPago.nombre,
          estado: metodoPago.estado
        });
      },
      error: (err) => {
        console.error('Error al cargar metodo de pago:', err);
        this.errorMessage.set('No se pudo cargar el metodo de pago.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  onSubmit(): void {
    if (this.metodoForm.invalid) {
      this.metodoForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { nombre, estado } = this.metodoForm.value;

    const metodoPago: MetodoPago = {
      nombre,
      estado
    };

    const peticion = this.modoEdicion() && this.idMetodoPago
      ? this.metodoPagoService.actualizar(this.idMetodoPago, metodoPago)
      : this.metodoPagoService.guardar(metodoPago);

    peticion.subscribe({
      next: () => this.router.navigate(['/admin/metodos-pago']),
      error: (err) => {
        console.error('Error al guardar metodo de pago:', err);
        this.errorMessage.set('No se pudo guardar el metodo de pago. Verifique los datos.');
      },
      complete: () => this.isSaving.set(false)
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/metodos-pago']);
  }
}