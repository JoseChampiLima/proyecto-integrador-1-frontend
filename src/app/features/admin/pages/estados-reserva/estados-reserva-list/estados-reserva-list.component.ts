// RUTA src\app\features\admin\pages\sedes\sedes-list\sedes-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { EstadoReserva } from '../../../../../core/models/estado-reserva.model';
import { EstadoReservaService } from '../../../../../core/services/estado-reserva.service';

@Component({
  selector: 'app-estado-reserva-list',
  standalone: true,
  imports: [],
  templateUrl: './estados-reserva-list.component.html',
  styleUrl: './estados-reserva-list.component.css'
})
export class EstadosReservaListComponent implements OnInit {
  estados = signal<EstadoReserva[]>([]);
  filtro = signal('');
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Estado seleccionado para el modal de confirmación de borrado (null = modal cerrado)
  estadoAEliminar = signal<EstadoReserva | null>(null);
  eliminando = signal(false);

  estadosFiltrados = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    if (!termino) return this.estados();

    return this.estados().filter(e =>
      e.nombre.toLowerCase().includes(termino)
    );
  });

  constructor(
    private estadoReservaService: EstadoReservaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEstados();
  }

  cargarEstados(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.estadoReservaService.listar().subscribe({
      next: (estados) => this.estados.set(estados),
      error: (err) => {
        console.error('Error al listar estados de reserva:', err);
        this.errorMessage.set('No se pudo cargar la lista de estados de reserva.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  irACrear(): void {
    this.router.navigate(['/admin/estados-reserva/nuevo']);
  }

  irAEditar(estado: EstadoReserva): void {
    this.router.navigate(['/admin/estados-reserva', estado.idEstadoReserva, 'editar']);
  } 

  pedirConfirmacionEliminar(estado: EstadoReserva): void {
    this.estadoAEliminar.set(estado);
  }

  cancelarEliminar(): void {
    this.estadoAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const estado = this.estadoAEliminar();
    if (!estado?.idEstadoReserva) return;

    this.eliminando.set(true);

    this.estadoReservaService.eliminar(estado.idEstadoReserva).subscribe({
      next: () => {
        this.estados.update(lista => lista.filter(e => e.idEstadoReserva !== estado.idEstadoReserva));
        this.estadoAEliminar.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar estado de reserva:', err);
        this.errorMessage.set('No se pudo eliminar el estado de reserva.');
      },
      complete: () => this.eliminando.set(false)
    });
  }
}