// RUTA src\app\features\cliente\pages\inicio-cliente\inicio-cliente.component.ts

import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { UsuarioService } from '../../../../core/services/usuario.service';
import { ReservaService } from '../../../../core/services/reserva.service';
import { EspacioDeportivoService } from '../../../../core/services/espacio-deportivo.service';
import { Reserva } from '../../../../core/models/reserva.model';
import { EspacioDeportivo } from '../../../../core/models/espacio-deportivo.model';

@Component({
  selector: 'app-inicio-cliente',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {

  nombre = signal('');
  reservas = signal<Reserva[]>([]);
  espacios = signal<EspacioDeportivo[]>([]);

  cargando = signal(true);
  error = signal('');

  saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  // Reservas vigentes: pendientes o confirmadas que aún no terminaron
  reservasVigentes = computed(() => {
    const ahora = new Date();

    return this.reservas()
      .filter(r => {
        const estado = this.estadoDe(r);
        return (estado === 'PENDIENTE' || estado === 'CONFIRMADA')
          && this.fechaHora(r, r.horaFin) >= ahora;
      })
      .sort((a, b) =>
        this.fechaHora(a, a.horaInicio).getTime() - this.fechaHora(b, b.horaInicio).getTime()
      );
  });

  proxima = computed(() => {
    const reserva = this.reservasVigentes()[0];
    if (!reserva) return null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [y, m, d] = this.fechaIso(reserva).split('-').map(Number);
    const dias = Math.round((new Date(y, m - 1, d).getTime() - hoy.getTime()) / 86400000);

    const etiqueta = dias <= 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`;
    return { reserva, etiqueta };
  });

  pendientes = computed(() =>
    this.reservas().filter(r => this.estadoDe(r) === 'PENDIENTE').length
  );

  realizadas = computed(() =>
    this.reservas().filter(r => this.estadoDe(r) === 'FINALIZADA').length
  );

  constructor(
    private usuarioService: UsuarioService,
    private reservaService: ReservaService,
    private espacioService: EspacioDeportivoService
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
    this.cargarEspacios();
  }

  private cargarReservas(): void {
    this.usuarioService.obtenerMiPerfil().pipe(
      switchMap(perfil => {
        this.nombre.set((perfil.nombres ?? '').trim().split(' ')[0]);
        return this.reservaService.listarPorUsuario(perfil.idUsuario);
      })
    ).subscribe({
      next: (reservas) => {
        this.reservas.set(reservas);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el inicio:', err);
        this.error.set('No pudimos cargar tus reservas. Intenta nuevamente.');
        this.cargando.set(false);
      }
    });
  }

  // Sección secundaria: si falla, simplemente no se muestra
  private cargarEspacios(): void {
    this.espacioService.listar().subscribe({
      next: (lista) => this.espacios.set(
        lista.filter(e => e.estado === 'DISPONIBLE').slice(0, 3)
      ),
      error: (err) => console.error('Error al cargar espacios:', err)
    });
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE': return 'estado-pendiente';
      case 'CONFIRMADA': return 'estado-confirmada';
      default: return 'estado-default';
    }
  }

  // --- Helpers ---

  private estadoDe(r: Reserva): string {
    return r.estadoReserva?.nombre?.toUpperCase() ?? '';
  }

  private fechaIso(r: Reserva): string {
    return String(r.fechaReserva ?? '').substring(0, 10);
  }

  private fechaHora(r: Reserva, hora: string): Date {
    return new Date(`${this.fechaIso(r)}T${hora}`);
  }
}