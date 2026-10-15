// RUTA src\app\features\admin\pages\mantenimientos\mantenimientos-list\mantenimientos-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MantenimientoService } from '../../../../../core/services/mantenimiento.service';
import { EspacioDeportivoService } from '../../../../../core/services/espacio-deportivo.service';
import { Mantenimiento, ESTADOS_MANTENIMIENTO } from '../../../../../core/models/mantenimiento.model';
import { EspacioDeportivo } from '../../../../../core/models/espacio-deportivo.model';

@Component({
  selector: 'app-mantenimientos-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './mantenimientos-list.component.html',
  styleUrl: './mantenimientos-list.component.css'
})
export class MantenimientosListComponent implements OnInit {
  mantenimientos = signal<Mantenimiento[]>([]);
  espacios = signal<EspacioDeportivo[]>([]);
  estados = ESTADOS_MANTENIMIENTO;

  filtro = signal('');
  filtroEspacio = signal('');
  filtroEstado = signal('');

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  mantenimientoAEliminar = signal<Mantenimiento | null>(null);
  eliminando = signal(false);

  mantenimientosFiltrados = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    const espacioId = this.filtroEspacio();
    const estado = this.filtroEstado();

    return this.mantenimientos().filter(m => {
      const coincideTexto =
        !termino ||
        (m.espacio?.nombre ?? '').toLowerCase().includes(termino) ||
        (m.motivo ?? '').toLowerCase().includes(termino);

      const coincideEspacio = !espacioId || String(m.espacio?.idEspacio) === espacioId;
      const coincideEstado = !estado || m.estado === estado;

      return coincideTexto && coincideEspacio && coincideEstado;
    });
  });

  constructor(
    private mantenimientoService: MantenimientoService,
    private espacioService: EspacioDeportivoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarMantenimientos();

    this.espacioService.listar().subscribe({
      next: (espacios) => this.espacios.set(espacios),
      error: (err) => console.error('Error al cargar espacios:', err)
    });
  }

  cargarMantenimientos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.mantenimientoService.listar().subscribe({
      next: (lista) => this.mantenimientos.set(lista),
      error: (err) => {
        console.error('Error al listar mantenimientos:', err);
        this.errorMessage.set('No se pudo cargar la lista de mantenimientos.');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  hora(valor?: string): string {
    return valor ? valor.slice(0, 5) : '—';
  }

  etiquetaEstado(estado?: string): string {
    if (!estado) return '—';
    const texto = estado.replace(/_/g, ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  claseEstado(estado?: string): string {
    switch (estado) {
      case 'PROGRAMADO': return 'badge-aviso';
      case 'FINALIZADO': return 'badge-neutro';
      case 'CANCELADO': return 'badge-inactivo';
      default: return '';
    }
  }

  irACrear(): void {
    this.router.navigate(['/admin/mantenimientos/nuevo']);
  }

  irAEditar(m: Mantenimiento): void {
    this.router.navigate(['/admin/mantenimientos', m.idMantenimiento, 'editar']);
  }

  pedirConfirmacionEliminar(m: Mantenimiento): void {
    this.mantenimientoAEliminar.set(m);
  }

  cancelarEliminar(): void {
    this.mantenimientoAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const m = this.mantenimientoAEliminar();
    if (!m?.idMantenimiento) return;

    this.eliminando.set(true);

    this.mantenimientoService.eliminar(m.idMantenimiento).subscribe({
      next: () => {
        this.mantenimientos.update(lista => lista.filter(x => x.idMantenimiento !== m.idMantenimiento));
        this.mantenimientoAEliminar.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar mantenimiento:', err);
        this.errorMessage.set('No se pudo eliminar el mantenimiento.');
        this.eliminando.set(false);
      },
      complete: () => this.eliminando.set(false)
    });
  }
}