// RUTA src\app\features\espacios\pages\espacios-list\espacios-list.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { SedeService } from '../../../../core/services/sede.service';
import { EspacioDeportivoService } from '../../../../core/services/espacio-deportivo.service';
import { Sede } from '../../../../core/models/sede.model';
import { EspacioDeportivo } from '../../../../core/models/espacio-deportivo.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-espacios-list',
  standalone: true,
  imports: [],
  templateUrl: './espacios-list.component.html',
  styleUrl: './espacios-list.component.css'
})
export class EspaciosListComponent implements OnInit {
  sedes = signal<Sede[]>([]);
  espacios = signal<EspacioDeportivo[]>([]);
  sedeSeleccionada = signal<number | undefined | null>(null); // null = "Todas las sedes"

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor(
    private sedeService: SedeService,
    private espacioService: EspacioDeportivoService
  ) {}

  ngOnInit(): void {
    this.cargarSedes();
    this.cargarEspacios();
  }

  cargarSedes(): void {
    this.sedeService.listarActivas().subscribe({
      next: (sedes) => this.sedes.set(sedes),
      error: (err) => console.error('Error al cargar sedes:', err)
    });
  }

  cargarEspacios(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const idSede = this.sedeSeleccionada();
    const peticion = idSede
      ? this.espacioService.listarPorSede(idSede)
      : this.espacioService.listar();

    peticion.subscribe({
      next: (espacios) => this.espacios.set(espacios),
      error: (err) => {
        console.error('Error al cargar espacios:', err);
        this.errorMessage.set('No se pudieron cargar los espacios.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  filtrarPorSede(idSede: number| null | undefined): void {
    this.sedeSeleccionada.set(idSede);
    this.cargarEspacios();
  }

  esDisponible(estado: string): boolean {
    return estado === 'DISPONIBLE';
  }

  /**
   * Construye la URL completa de la foto.
   * Asume que tu backend sirve /uploads como recurso estático en la raíz
   * (fuera del prefijo /api). Si tu urlBackend ya NO incluye "/api", quita el .replace().
   */
  getFotoUrl(foto: string | null | undefined): string {
    if (!foto) return 'assets/images/espacio-placeholder.jpg';
    const baseUrl = environment.urlBackend.replace(/\/api\/?$/, '');
    return `${baseUrl}${foto}`;
  }
}