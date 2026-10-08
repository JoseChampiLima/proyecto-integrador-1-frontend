// RUTA src\app\features\admin\pages\sedes\sedes-list\sedes-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MetodoPago } from '../../../../../core/models/metodo-pago.model';
import { MetodoPagoService } from '../../../../../core/services/metodo-pago.service';

@Component({
  selector: 'app-metodo-pago-list',
  standalone: true,
  imports: [],
  templateUrl: './metodo-pago-list.component.html',
  styleUrl: './metodo-pago-list.component.css'
})
export class MetodoPagoListComponent implements OnInit {
  metodos = signal<MetodoPago[]>([]);
  filtro = signal('');
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Sede seleccionada para el modal de confirmación de borrado (null = modal cerrado)
  metodoAEliminar = signal<MetodoPago | null>(null);
  eliminando = signal(false);

  metodosFiltrados = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    if (!termino) return this.metodos();

    return this.metodos().filter(m =>
      m.nombre.toLowerCase().includes(termino)
    );
  });

  constructor(
    private metodoPagoService: MetodoPagoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarMetodos();
  }

  cargarMetodos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.metodoPagoService.listar().subscribe({
      next: (metodos) => this.metodos.set(metodos),
      error: (err) => {
        console.error('Error al listar métodos de pago:', err);
        this.errorMessage.set('No se pudo cargar la lista de métodos de pago.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  irACrear(): void {
    this.router.navigate(['/admin/metodos-pago/nuevo']);
  }

  irAEditar(metodo: MetodoPago): void {
    this.router.navigate(['/admin/metodos-pago', metodo.idMetodoPago, 'editar']);
  } 

  pedirConfirmacionEliminar(metodo: MetodoPago  ): void {
    this.metodoAEliminar.set(metodo);
  }

  cancelarEliminar(): void {
    this.metodoAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const metodo = this.metodoAEliminar();
    if (!metodo?.idMetodoPago) return;

    this.eliminando.set(true);

    this.metodoPagoService.eliminar(metodo.idMetodoPago).subscribe({
      next: () => {
        this.metodos.update(lista => lista.filter(m => m.idMetodoPago !== metodo.idMetodoPago));
        this.metodoAEliminar.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar método de pago:', err);
        this.errorMessage.set('No se pudo eliminar el método de pago.');
      },
      complete: () => this.eliminando.set(false)
    });
  }
}