// RUTA src\app\features\espacios\pages\espacios-list\espacios-list.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { SedeService } from '../../../../core/services/sede.service';
import { Sede } from '../../../../core/models/sede.model';

@Component({
  selector: 'app-sedes-list',
  standalone: true,
  imports: [],
  templateUrl: './sedes-list.component.html',
  styleUrl: './sedes-list.component.css'
})
export class SedesListComponent implements OnInit {
  sedes = signal<Sede[]>([]);

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor(
    private sedeService: SedeService
  ) {}

  ngOnInit(): void {
    this.cargarSedes();
  }

  cargarSedes(): void {
    this.sedeService.listarActivas().subscribe({
      next: (sedes) => this.sedes.set(sedes),
      error: (err) => console.error('Error al cargar sedes:', err),
      complete: () => this.isLoading.set(false)
    });
  }

  esDisponible(estado: string): boolean {
    return estado === 'true';
  }
}