// RUTA src\app\features\admin\pages\reservas\reservas-list\reservas-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ReservaService } from '../../../../../core/services/reserva.service';
import { PagoService } from '../../../../../core/services/pago.service';
import { EstadoReservaService } from '../../../../../core/services/estado-reserva.service';
import { Reserva } from '../../../../../core/models/reserva.model';
import { Pago, ESTADO_PAGO_ANULADO } from '../../../../../core/models/pago.model';

// Estados de la tabla estado_reserva (PENDIENTE, CONFIRMADA, CANCELADA, FINALIZADA)
const ESTADOS_CANCELABLES = ['PENDIENTE', 'CONFIRMADA'];

@Component({
  selector: 'app-reservas-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './reservas-list.component.html',
  styleUrl: './reservas-list.component.css'
})
export class ReservasListComponent implements OnInit {
  reservas = signal<Reserva[]>([]);

  filtro = signal('');
  filtroEstado = signal('');
  filtroFecha = signal('');

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Detalle (con los pagos de la reserva, que se cargan al abrirlo)
  reservaDetalle = signal<Reserva | null>(null);
  pagosDetalle = signal<Pago[]>([]);
  cargandoPagos = signal(false);
  errorPagos = signal(false);

  // Cancelación
  reservaACancelar = signal<Reserva | null>(null);
  cancelando = signal(false);

  // Opciones del filtro: vienen de la tabla estado_reserva, no de las reservas cargadas
  estados = signal<string[]>([]);

  totalPagado = computed(() =>
    this.pagosDetalle()
      .filter(p => p.estado !== ESTADO_PAGO_ANULADO)
      .reduce((suma, p) => suma + (p.monto ?? 0), 0)
  );

  // Las más recientes primero
  reservasFiltradas = computed(() => {
    const termino = this.filtro().trim().toLowerCase().replace('#', '');
    const estado = this.filtroEstado();
    const fecha = this.filtroFecha();

    return this.reservas()
      .filter(r => {
        const cliente = `${r.usuario?.nombres ?? ''} ${r.usuario?.apellidos ?? ''}`.toLowerCase();

        const coincideTexto =
          !termino ||
          cliente.includes(termino) ||
          (r.usuario?.dni ?? '').includes(termino) ||
          (r.espacio?.nombre ?? '').toLowerCase().includes(termino) ||
          String(r.idReserva ?? '').includes(termino);

        const coincideEstado = !estado || r.estadoReserva?.nombre === estado;
        const coincideFecha = !fecha || this.fechaISO(r.fechaReserva) === fecha;

        return coincideTexto && coincideEstado && coincideFecha;
      })
      .sort((a, b) =>
        (this.fechaISO(b.fechaReserva) + b.horaInicio).localeCompare(
          this.fechaISO(a.fechaReserva) + a.horaInicio
        )
      );
  });

  constructor(
    private reservaService: ReservaService,
    private pagoService: PagoService,
    private estadoReservaService: EstadoReservaService
  ) {}

  ngOnInit(): void {
    this.cargarReservas();

    this.estadoReservaService.listar().subscribe({
      next: (estados) => this.estados.set(estados.map(e => e.nombre)),
      error: (err) => console.error('Error al cargar estados de reserva:', err)
    });
  }

  cargarReservas(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reservaService.listar().subscribe({
      next: (reservas) => this.reservas.set(reservas),
      error: (err) => {
        console.error('Error al listar reservas:', err);
        this.errorMessage.set('No se pudo cargar la lista de reservas.');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  // El backend manda LocalDate como "yyyy-MM-dd" (texto) aunque el modelo la tipe como Date.
  // Se normaliza a "yyyy-MM-dd" para poder comparar con el <input type="date"> y ordenar.
  private fechaISO(valor?: Date | string): string {
    if (!valor) return '';
    if (typeof valor === 'string') return valor.slice(0, 10);

    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const dia = String(valor.getDate()).padStart(2, '0');
    return `${valor.getFullYear()}-${mes}-${dia}`;
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
      case 'PENDIENTE': return 'badge-aviso';
      case 'CANCELADA': return 'badge-inactivo';
      case 'FINALIZADA': return 'badge-neutro';
      default: return ''; // CONFIRMADA
    }
  }

  claseEstadoPago(estado?: string): string {
    switch (estado) {
      case ESTADO_PAGO_ANULADO: return 'badge-inactivo';
      case 'PENDIENTE': return 'badge-aviso';
      default: return '';
    }
  }

  esCancelable(reserva: Reserva): boolean {
    return ESTADOS_CANCELABLES.includes(reserva.estadoReserva?.nombre);
  }

  // --- Detalle ---

  verDetalle(reserva: Reserva): void {
    this.reservaDetalle.set(reserva);
    this.pagosDetalle.set([]);
    this.errorPagos.set(false);

    if (!reserva.idReserva) return;

    this.cargandoPagos.set(true);
    this.pagoService.listarPorReserva(reserva.idReserva).subscribe({
      next: (pagos) => this.pagosDetalle.set(pagos),
      error: (err) => {
        console.error('Error al cargar pagos de la reserva:', err);
        this.errorPagos.set(true);
        this.cargandoPagos.set(false);
      },
      complete: () => this.cargandoPagos.set(false)
    });
  }

  cerrarDetalle(): void {
    this.reservaDetalle.set(null);
  }

  // --- Cancelación ---

  pedirConfirmacionCancelar(reserva: Reserva): void {
    this.reservaDetalle.set(null); // evita apilar dos modales
    this.reservaACancelar.set(reserva);
  }

  descartarCancelacion(): void {
    this.reservaACancelar.set(null);
  }

  confirmarCancelacion(): void {
    const reserva = this.reservaACancelar();
    if (!reserva?.idReserva) return;

    this.cancelando.set(true);
    this.errorMessage.set(null);

    this.reservaService.cancelar(reserva.idReserva).subscribe({
      next: (actualizada) => {
        this.reservas.update(lista =>
          lista.map(r => (r.idReserva === actualizada.idReserva ? actualizada : r))
        );
        this.reservaACancelar.set(null);
      },
      error: (err) => {
        console.error('Error al cancelar reserva:', err);
        this.errorMessage.set(err?.error?.mensaje ?? 'No se pudo cancelar la reserva.');
        this.reservaACancelar.set(null);
        this.cancelando.set(false);
      },
      complete: () => this.cancelando.set(false)
    });
  }
}