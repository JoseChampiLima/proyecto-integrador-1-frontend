// RUTA src\app\features\admin\pages\sedes\sedes-list\sedes-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TipoEspacio } from '../../../../../core/models/tipo-espacio.model';
import { TipoEspacioService } from '../../../../../core/services/tipo-espacio.service';

@Component({
  selector: 'app-tipo-espacio-list',
  standalone: true,
  imports: [],
  templateUrl: './tipos-espacio-list.component.html',
  styleUrl: './tipos-espacio-list.component.css'
})
export class TiposEspacioListComponent implements OnInit {
  tipos = signal<TipoEspacio[]>([]);
  filtro = signal('');
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Tipo seleccionado para el modal de confirmación de borrado (null = modal cerrado)
  tipoAEliminar = signal<TipoEspacio | null>(null);
  eliminando = signal(false);

  tiposFiltrados = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    if (!termino) return this.tipos();

    return this.tipos().filter(t =>
      t.nombre.toLowerCase().includes(termino)
    );
  });

  constructor(
    private tipoEspacioService: TipoEspacioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
  }

  cargarTipos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.tipoEspacioService.listar().subscribe({
      next: (tipos) => this.tipos.set(tipos),
      error: (err) => {
        console.error('Error al listar tipos de espacio:', err);
        this.errorMessage.set('No se pudo cargar la lista de tipos de espacio.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  irACrear(): void {
    this.router.navigate(['/admin/tipos-espacio/nuevo']);
  }

  irAEditar(tipo: TipoEspacio): void {
    this.router.navigate(['/admin/tipos-espacio', tipo.idTipoEspacio, 'editar']);
  } 

  pedirConfirmacionEliminar(tipo: TipoEspacio): void {
    this.tipoAEliminar.set(tipo);
  }

  cancelarEliminar(): void {
    this.tipoAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const tipo = this.tipoAEliminar();
    if (!tipo?.idTipoEspacio) return;

    this.eliminando.set(true);

    this.tipoEspacioService.eliminar(tipo.idTipoEspacio).subscribe({
      next: () => {
        this.tipos.update(lista => lista.filter(e => e.idTipoEspacio !== tipo.idTipoEspacio));
        this.tipoAEliminar.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar tipo de espacio:', err);
        this.errorMessage.set('No se pudo eliminar el tipo de espacio.');
      },
      complete: () => this.eliminando.set(false)
    });
  }
}