// RUTA src\app\features\admin\pages\sedes\sedes-list\sedes-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SedeService } from '../../../../../core/services/sede.service';
import { Sede } from '../../../../../core/models/sede.model';

@Component({
  selector: 'app-sedes-list',
  standalone: true,
  imports: [],
  templateUrl: './sedes-list.component.html',
  styleUrl: './sedes-list.component.css'
})
export class SedesListComponent implements OnInit {
  sedes = signal<Sede[]>([]);
  filtro = signal('');
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Sede seleccionada para el modal de confirmación de borrado (null = modal cerrado)
  sedeAEliminar = signal<Sede | null>(null);
  eliminando = signal(false);

  sedesFiltradas = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    if (!termino) return this.sedes();

    return this.sedes().filter(s =>
      s.nombre.toLowerCase().includes(termino)
    );
  });

  constructor(
    private sedeService: SedeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarSedes();
  }

  cargarSedes(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.sedeService.listar().subscribe({
      next: (sedes) => this.sedes.set(sedes),
      error: (err) => {
        console.error('Error al listar sedes:', err);
        this.errorMessage.set('No se pudo cargar la lista de sedes.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  irACrear(): void {
    this.router.navigate(['/admin/sedes/nuevo']);
  }

  irAEditar(sede: Sede): void {
    this.router.navigate(['/admin/sedes', sede.idSede, 'editar']);
  }

  pedirConfirmacionEliminar(sede: Sede): void {
    this.sedeAEliminar.set(sede);
  }

  cancelarEliminar(): void {
    this.sedeAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const sede = this.sedeAEliminar();
    if (!sede?.idSede) return;

    this.eliminando.set(true);

    this.sedeService.eliminar(sede.idSede).subscribe({
      next: () => {
        this.sedes.update(lista => lista.filter(s => s.idSede !== sede.idSede));
        this.sedeAEliminar.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar sede:', err);
        this.errorMessage.set('No se pudo eliminar la sede.');
      },
      complete: () => this.eliminando.set(false)
    });
  }
}