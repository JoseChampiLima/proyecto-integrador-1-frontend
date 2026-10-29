// RUTA src\app\features\public\pages\nosotros\nosotros.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SedeService } from '../../../../core/services/sede.service';
import { TipoEspacioService } from '../../../../core/services/tipo-espacio.service';
import { Sede } from '../../../../core/models/sede.model';
import { TipoEspacio } from '../../../../core/models/tipo-espacio.model';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './nosotros.component.html',
  styleUrl: './nosotros.component.css'
})
export class NosotrosComponent implements OnInit {
  sedes = signal<Sede[]>([]);
  tipos = signal<TipoEspacio[]>([]);

  valores = ['Responsabilidad', 'Respeto', 'Honestidad y Transparencia', 'Participación'];

  // Años cumplidos desde la fundación (27 de junio de 1884)
  anios = this.calcularAnios();

  constructor(
    private sedeService: SedeService,
    private tipoEspacioService: TipoEspacioService
  ) {}

  ngOnInit(): void {
    // Si fallan, las secciones simplemente no se muestran
    this.sedeService.listarActivas().subscribe({
      next: (sedes) => this.sedes.set(sedes),
      error: (err) => console.error('Error al cargar sedes:', err)
    });

    this.tipoEspacioService.listarActivos().subscribe({
      next: (tipos) => this.tipos.set(tipos),
      error: (err) => console.error('Error al cargar tipos de espacio:', err)
    });
  }

  private calcularAnios(): number {
    const hoy = new Date();
    const aniversarioEsteAnio = new Date(hoy.getFullYear(), 5, 27); // mes 5 = junio
    return hoy.getFullYear() - 1884 - (hoy < aniversarioEsteAnio ? 1 : 0);
  }
}