

import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { ReservaService } from '../../../../core/services/reserva.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Reserva } from '../../../../core/models/reserva.model';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './mis-reservas.component.html',
  styleUrl: './mis-reservas.component.css'
})
export class MisReservasComponent implements OnInit {

  reservas = signal<Reserva[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string>('');

  filtro = signal<string>('TODAS');

  // Reserva seleccionada para el modal
  reservaSeleccionada = signal<Reserva | null>(null);

  // Filtrar las reservas por estado
  reservasFiltradas = computed(() => {

    const filtroActual = this.filtro();

    return this.reservas()
      .filter(reserva => {
        if (filtroActual === 'TODAS') {
          return true;
        }

        return reserva.estadoReserva?.nombre
          ?.toUpperCase() === filtroActual;
      })
      .sort((a, b) => {
        const fechaA = String(a.fechaReserva ?? '');
        const fechaB = String(b.fechaReserva ?? '');

        return fechaB.localeCompare(fechaA);
      });
  });

  constructor(
    private reservaService: ReservaService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarMisReservas();
  }

  // Obtener reservas del cliente autenticado
  cargarMisReservas(): void {

    this.cargando.set(true);
    this.error.set('');

    this.usuarioService.obtenerMiPerfil().subscribe({

      next: (perfil) => {

        this.reservaService
          .listarPorUsuario(perfil.idUsuario)
          .subscribe({

            next: (reservas) => {
              this.reservas.set(reservas);
              this.cargando.set(false);
            },

            error: (err) => {
              console.error('Error al cargar reservas:', err);
              this.error.set(
                'No se pudieron cargar tus reservas.'
              );
              this.cargando.set(false);
            }
          });
      },

      error: (err) => {
        console.error('Error al obtener perfil:', err);
        this.error.set(
          'No se pudo identificar al usuario.'
        );
        this.cargando.set(false);
      }
    });
  }

  // Cambiar filtro
  cambiarFiltro(filtro: string): void {
    this.filtro.set(filtro);
  }

  // Abrir detalle de una reserva
  verDetalle(reserva: Reserva): void {
    this.reservaSeleccionada.set(reserva);
  }

  // Cerrar detalle
  cerrarDetalle(): void {
    this.reservaSeleccionada.set(null);
  }

  // Obtener clase CSS según el estado
  obtenerClaseEstado(estado: string): string {

    switch (estado?.toUpperCase()) {

      case 'PENDIENTE':
        return 'estado-pendiente';

      case 'CONFIRMADA':
        return 'estado-confirmada';

      case 'CANCELADA':
        return 'estado-cancelada';

      case 'FINALIZADA':
        return 'estado-finalizada';

      default:
        return 'estado-default';
    }
  }

}
