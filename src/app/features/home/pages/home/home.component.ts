import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SedeService } from '../../../../core/services/sede.service';
import { EspacioDeportivoService } from '../../../../core/services/espacio-deportivo.service';
import { Sede } from '../../../../core/models/sede.model';
import { EspacioDeportivo } from '../../../../core/models/espacio-deportivo.model';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, FormsModule, NgClass, DecimalPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  sedes = signal<Sede[]>([]);
  featuredEspacios = signal<EspacioDeportivo[]>([]);

  // Search parameters (signals)
  selectedSedeId = signal<string>('');
  selectedTipo = signal<string>('');

  constructor(
    private sedeService: SedeService,
    private espacioService: EspacioDeportivoService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load active venues
    this.sedeService.listarActivas().subscribe({
      next: (data) => this.sedes.set(data),
      error: (err) => console.error('Error loading sedes', err)
    });

    // Load available spaces and show the top 3 featured ones
    this.espacioService.listar().subscribe({
      next: (data) => {
        const available = data.filter(e => e.estado === 'DISPONIBLE').slice(0, 3);
        // If not enough available, just take any 3
        this.featuredEspacios.set(available.length > 0 ? available : data.slice(0, 3));
      },
      error: (err) => console.error('Error loading spaces', err)
    });
  }

  onSearch() {
    const queryParams: any = {};
    if (this.selectedSedeId()) {
      queryParams.sedeId = this.selectedSedeId();
    }
    if (this.selectedTipo()) {
      queryParams.tipo = this.selectedTipo();
    }

    // Navigates to spaces page
    this.router.navigate(['/espacios'], { queryParams });
  }
}
