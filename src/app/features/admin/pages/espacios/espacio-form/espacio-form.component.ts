// RUTA src\app\features\admin\pages\espacios\espacio-form\espacio-form.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EspacioDeportivoService } from '../../../../../core/services/espacio-deportivo.service';
import { SedeService } from '../../../../../core/services/sede.service';
import { TipoEspacioService } from '../../../../../core/services/tipo-espacio.service';
import { EspacioDeportivo } from '../../../../../core/models/espacio-deportivo.model';
import { Sede } from '../../../../../core/models/sede.model';
import { TipoEspacio } from '../../../../../core/models/tipo-espacio.model';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-espacio-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './espacio-form.component.html',
  styleUrl: './espacio-form.component.css'
})
export class EspacioFormComponent implements OnInit {
  espacioForm: FormGroup;
  sedes = signal<Sede[]>([]);
  tipos = signal<TipoEspacio[]>([]);
  modoEdicion = signal(false);
  idEspacio: number | null = null;

  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  // Foto
  previsualizacion = signal<string | null>(null);
  archivoSeleccionado = signal<File | null>(null);
  subiendoFoto = signal(false);

  private urlServidor = environment.urlBackend.replace(/\/api\/?$/, '');

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private espacioService: EspacioDeportivoService,
    private sedeService: SedeService,
    private tipoEspacioService: TipoEspacioService
  ) {
    this.espacioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      idSede: [null, Validators.required],
      idTipoEspacio: [null, Validators.required],
      capacidad: [null, [Validators.required, Validators.min(1)]],
      precioHora: [null, [Validators.required, Validators.min(0)]],
      estadoActivo: [true]
    });
  }

  ngOnInit(): void {
    this.sedeService.listarActivas().subscribe({
      next: (sedes) => this.sedes.set(sedes),
      error: (err) => console.error('Error al cargar sedes:', err)
    });

    this.tipoEspacioService.listarActivos().subscribe({
      next: (tipos) => this.tipos.set(tipos),
      error: (err) => console.error('Error al cargar tipos de espacio:', err)
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion.set(true);
      this.idEspacio = Number(idParam);
      this.cargarEspacio(this.idEspacio);
    }
  }

  cargarEspacio(id: number): void {
    this.isLoading.set(true);
    this.espacioService.buscarPorId(id).subscribe({
      next: (espacio) => {
        this.espacioForm.patchValue({
          nombre: espacio.nombre,
          descripcion: espacio.descripcion,
          idSede: espacio.sede?.idSede ?? null,
          idTipoEspacio: espacio.tipoEspacio?.idTipoEspacio ?? null,
          capacidad: espacio.capacidad,
          precioHora: espacio.precioHora,
          estadoActivo: espacio.estado !== 'INACTIVO'
        });

        if (espacio.foto) {
          this.previsualizacion.set(`${this.urlServidor}${espacio.foto}`);
        }
      },
      error: (err) => {
        console.error('Error al cargar espacio:', err);
        this.errorMessage.set('No se pudo cargar el espacio.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.archivoSeleccionado.set(archivo);

    if (archivo) {
      const lector = new FileReader();
      lector.onload = () => this.previsualizacion.set(lector.result as string);
      lector.readAsDataURL(archivo);
    }
  }

  eliminarFoto(): void {
    if (!this.idEspacio) {
      // Aún no se ha guardado el espacio, solo se limpia la previsualización local
      this.previsualizacion.set(null);
      this.archivoSeleccionado.set(null);
      return;
    }

    this.subiendoFoto.set(true);
    this.espacioService.eliminarFoto(this.idEspacio).subscribe({
      next: () => {
        this.previsualizacion.set(null);
        this.archivoSeleccionado.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar la foto:', err);
        this.errorMessage.set('No se pudo eliminar la foto.');
      },
      complete: () => this.subiendoFoto.set(false)
    });
  }

  private subirFotoSiCorresponde(id: number): void {
    const archivo = this.archivoSeleccionado();
    if (!archivo) {
      this.router.navigate(['/admin/espacios']);
      return;
    }

    this.subiendoFoto.set(true);
    this.espacioService.subirFoto(id, archivo).subscribe({
      next: () => this.router.navigate(['/admin/espacios']),
      error: (err) => {
        console.error('Error al subir la foto:', err);
        this.errorMessage.set('El espacio se guardó, pero no se pudo subir la foto.');
      },
      complete: () => this.subiendoFoto.set(false)
    });
  }

  onSubmit(): void {
    if (this.espacioForm.invalid) {
      this.espacioForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { nombre, descripcion, idSede, idTipoEspacio, capacidad, precioHora, estadoActivo } = this.espacioForm.value;

    const espacio: EspacioDeportivo = {
      nombre,
      descripcion,
      // El backend solo necesita el id para resolver la relación con Sede/TipoEspacio
      sede: { idSede } as Sede,
      tipoEspacio: { idTipoEspacio } as TipoEspacio,
      capacidad,
      precioHora,
      estado: estadoActivo ? 'ACTIVO' : 'INACTIVO'
    };

    const peticion = this.modoEdicion() && this.idEspacio
      ? this.espacioService.actualizar(this.idEspacio, espacio)
      : this.espacioService.guardar(espacio);

    peticion.subscribe({
      next: (espacioGuardado) => {
        const id = this.idEspacio ?? espacioGuardado.idEspacio;
        if (id) {
          this.subirFotoSiCorresponde(id);
        } else {
          this.router.navigate(['/admin/espacios']);
        }
      },
      error: (err) => {
        console.error('Error al guardar espacio:', err);
        this.errorMessage.set('No se pudo guardar el espacio. Verifique los datos.');
      },
      complete: () => this.isSaving.set(false)
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/espacios']);
  }
}