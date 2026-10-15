// RUTA src\app\features\admin\pages\mantenimientos\mantenimiento-form\mantenimiento-form.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MantenimientoService } from '../../../../../core/services/mantenimiento.service';
import { EspacioDeportivoService } from '../../../../../core/services/espacio-deportivo.service';
import { Mantenimiento, ESTADOS_MANTENIMIENTO } from '../../../../../core/models/mantenimiento.model';
import { EspacioDeportivo } from '../../../../../core/models/espacio-deportivo.model';

@Component({
  selector: 'app-mantenimiento-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './mantenimiento-form.component.html',
  styleUrl: './mantenimiento-form.component.css'
})
export class MantenimientoFormComponent implements OnInit {
  mantenimientoForm: FormGroup;
  espacios = signal<EspacioDeportivo[]>([]);
  estados = ESTADOS_MANTENIMIENTO;
  modoEdicion = signal(false);
  idMantenimiento: number | null = null;

  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private mantenimientoService: MantenimientoService,
    private espacioService: EspacioDeportivoService
  ) {
    this.mantenimientoForm = this.fb.group(
      {
        idEspacio: [null, Validators.required],
        fechaInicio: ['', Validators.required],
        fechaFin: ['', Validators.required],
        horaInicio: ['', Validators.required],
        horaFin: ['', Validators.required],
        motivo: ['', Validators.maxLength(250)],
        estado: ['PROGRAMADO']
      },
      { validators: this.validarRango }
    );
  }

  ngOnInit(): void {
    this.espacioService.listar().subscribe({
      next: (espacios) => this.espacios.set(espacios),
      error: (err) => console.error('Error al cargar espacios:', err)
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idMantenimiento = Number(idParam);
      this.cargarMantenimiento(this.idMantenimiento);
    }
  }

  cargarMantenimiento(id: number): void {
    this.isLoading.set(true);
    this.mantenimientoService.buscarPorId(id).subscribe({
      next: (m) => {
        this.mantenimientoForm.patchValue({
          idEspacio: m.espacio?.idEspacio ?? null,
          fechaInicio: m.fechaInicio,
          fechaFin: m.fechaFin,
          // <input type="time"> trabaja con HH:mm, el backend devuelve HH:mm:ss
          horaInicio: m.horaInicio?.slice(0, 5),
          horaFin: m.horaFin?.slice(0, 5),
          motivo: m.motivo ?? '',
          estado: m.estado ?? 'PROGRAMADO'
        });
      },
      error: (err) => {
        console.error('Error al cargar mantenimiento:', err);
        this.errorMessage.set('No se pudo cargar el mantenimiento.');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  // Fechas y horas ISO (yyyy-MM-dd / HH:mm) se comparan bien como texto
  private validarRango(grupo: AbstractControl): ValidationErrors | null {
    const fechaInicio = grupo.get('fechaInicio')?.value;
    const fechaFin = grupo.get('fechaFin')?.value;
    const horaInicio = grupo.get('horaInicio')?.value;
    const horaFin = grupo.get('horaFin')?.value;

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      return { rangoFechas: true };
    }
    if (fechaInicio && fechaFin && fechaInicio === fechaFin && horaInicio && horaFin && horaFin <= horaInicio) {
      return { rangoHoras: true };
    }
    return null;
  }

  etiquetaEstado(estado: string): string {
    const texto = estado.replace(/_/g, ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  onSubmit(): void {
    if (this.mantenimientoForm.invalid) {
      this.mantenimientoForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { idEspacio, fechaInicio, fechaFin, horaInicio, horaFin, motivo, estado } = this.mantenimientoForm.value;

    const mantenimiento: Mantenimiento = {
      // El backend solo necesita el id para resolver la relación con el espacio
      espacio: { idEspacio } as EspacioDeportivo,
      fechaInicio,
      fechaFin,
      horaInicio,
      horaFin,
      motivo,
      estado
    };

    const peticion = this.modoEdicion() && this.idMantenimiento
      ? this.mantenimientoService.actualizar(this.idMantenimiento, mantenimiento)
      : this.mantenimientoService.guardar(mantenimiento);

    peticion.subscribe({
      next: () => this.router.navigate(['/admin/mantenimientos']),
      error: (err) => {
        console.error('Error al guardar mantenimiento:', err);
        this.errorMessage.set('No se pudo guardar el mantenimiento. Verifique los datos.');
        this.isSaving.set(false);
      },
      complete: () => this.isSaving.set(false)
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/mantenimientos']);
  }
}