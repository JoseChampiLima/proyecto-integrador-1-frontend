// RUTA src\app\features\admin\pages\espacios\espacios-list\espacios-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { EspacioDeportivoService } from '../../../../../core/services/espacio-deportivo.service';
import { SedeService } from '../../../../../core/services/sede.service';
import { TipoEspacioService } from '../../../../../core/services/tipo-espacio.service';
import { EspacioDeportivo } from '../../../../../core/models/espacio-deportivo.model';
import { Sede } from '../../../../../core/models/sede.model';
import { TipoEspacio } from '../../../../../core/models/tipo-espacio.model';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-espacios-list',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './espacios-list.component.html',
  styleUrl: './espacios-list.component.css'
})
export class EspaciosListComponent implements OnInit {
  espacios = signal<EspacioDeportivo[]>([]);
  sedes = signal<Sede[]>([]);
  tipos = signal<TipoEspacio[]>([]);

  filtro = signal('');
  filtroSede = signal('');
  filtroTipo = signal('');

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Espacio seleccionado para el modal de confirmación de borrado (null = modal cerrado)
  espacioAEliminar = signal<EspacioDeportivo | null>(null);
  eliminando = signal(false);

  // Raíz del backend sin el sufijo /api, para armar la URL de las fotos servidas como recurso estático
  private urlServidor = environment.urlBackend.replace(/\/api\/?$/, '');

  espaciosFiltrados = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    const sedeId = this.filtroSede();
    const tipoId = this.filtroTipo();

    return this.espacios().filter(e => {
      const coincideTexto =
        !termino ||
        e.nombre.toLowerCase().includes(termino) ||
        e.descripcion.toLowerCase().includes(termino);

      const coincideSede = !sedeId || String(e.sede?.idSede) === sedeId;
      const coincideTipo = !tipoId || String(e.tipoEspacio?.idTipoEspacio) === tipoId;

      return coincideTexto && coincideSede && coincideTipo;
    });
  });

  constructor(
    private espacioService: EspacioDeportivoService,
    private sedeService: SedeService,
    private tipoEspacioService: TipoEspacioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEspacios();

    this.sedeService.listarActivas().subscribe({
      next: (sedes) => this.sedes.set(sedes),
      error: (err) => console.error('Error al cargar sedes:', err)
    });

    this.tipoEspacioService.listarActivos().subscribe({
      next: (tipos) => this.tipos.set(tipos),
      error: (err) => console.error('Error al cargar tipos de espacio:', err)
    });
  }

  cargarEspacios(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.espacioService.listar().subscribe({
      next: (espacios) => this.espacios.set(espacios),
      error: (err) => {
        console.error('Error al listar espacios:', err);
        this.errorMessage.set('No se pudo cargar la lista de espacios.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  urlFoto(foto: string): string {
    return `${this.urlServidor}${foto}`;
  }

  irACrear(): void {
    this.router.navigate(['/admin/espacios/nuevo']);
  }

  irAEditar(espacio: EspacioDeportivo): void {
    this.router.navigate(['/admin/espacios', espacio.idEspacio, 'editar']);
  }

  pedirConfirmacionEliminar(espacio: EspacioDeportivo): void {
    this.espacioAEliminar.set(espacio);
  }

  cancelarEliminar(): void {
    this.espacioAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const espacio = this.espacioAEliminar();
    if (!espacio?.idEspacio) return;

    this.eliminando.set(true);

    this.espacioService.eliminar(espacio.idEspacio).subscribe({
      next: () => {
        this.espacios.update(lista => lista.filter(e => e.idEspacio !== espacio.idEspacio));
        this.espacioAEliminar.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar espacio:', err);
        this.errorMessage.set('No se pudo eliminar el espacio.');
      },
      complete: () => this.eliminando.set(false)
    });
  }
}