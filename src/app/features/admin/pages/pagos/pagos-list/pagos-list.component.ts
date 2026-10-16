// RUTA src\app\features\admin\pages\pagos\pagos-list\pagos-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PagoService } from '../../../../../core/services/pago.service';
import { Pago, ESTADO_PAGO_ANULADO } from '../../../../../core/models/pago.model';

@Component({
  selector: 'app-pagos-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './pagos-list.component.html',
  styleUrl: './pagos-list.component.css'
})
export class PagosListComponent implements OnInit {
  pagos = signal<Pago[]>([]);

  filtro = signal('');
  filtroMetodo = signal('');
  filtroEstado = signal('');

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  pagoAAnular = signal<Pago | null>(null);
  anulando = signal(false);

  // Opciones de los filtros: salen de los propios pagos cargados
  metodos = computed(() => this.valoresUnicos(this.pagos().map(p => p.metodoPago?.nombre)));
  estados = computed(() => this.valoresUnicos(this.pagos().map(p => p.estado)));

  pagosFiltrados = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    const metodo = this.filtroMetodo();
    const estado = this.filtroEstado();

    return this.pagos().filter(p => {
      const cliente = `${p.reserva?.usuario?.nombres ?? ''} ${p.reserva?.usuario?.apellidos ?? ''}`.toLowerCase();

      const coincideTexto =
        !termino ||
        (p.nroOperacion ?? '').toLowerCase().includes(termino) ||
        cliente.includes(termino) ||
        (p.reserva?.espacio?.nombre ?? '').toLowerCase().includes(termino) ||
        String(p.reserva?.idReserva ?? '').includes(termino.replace('#', ''));

      const coincideMetodo = !metodo || p.metodoPago?.nombre === metodo;
      const coincideEstado = !estado || p.estado === estado;

      return coincideTexto && coincideMetodo && coincideEstado;
    });
  });

  constructor(private pagoService: PagoService) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.pagoService.listar().subscribe({
      next: (pagos) => this.pagos.set(pagos),
      error: (err) => {
        console.error('Error al listar pagos:', err);
        this.errorMessage.set('No se pudo cargar la lista de pagos.');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  private valoresUnicos(valores: (string | undefined)[]): string[] {
    return [...new Set(valores.filter((v): v is string => !!v))].sort();
  }

  estaAnulado(pago: Pago): boolean {
    return pago.estado === ESTADO_PAGO_ANULADO;
  }

  etiquetaEstado(estado?: string): string {
    if (!estado) return '—';
    const texto = estado.replace(/_/g, ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  claseEstado(estado?: string): string {
    switch (estado) {
      case ESTADO_PAGO_ANULADO: return 'badge-inactivo';
      case 'PENDIENTE': return 'badge-aviso';
      default: return '';
    }
  }

  pedirConfirmacionAnular(pago: Pago): void {
    this.pagoAAnular.set(pago);
  }

  cancelarAnular(): void {
    this.pagoAAnular.set(null);
  }

  confirmarAnular(): void {
    const pago = this.pagoAAnular();
    if (!pago?.idPago) return;

    this.anulando.set(true);

    // Se reenvía el pago completo con el estado cambiado (el backend solo expone PUT genérico)
    this.pagoService.actualizar(pago.idPago, { ...pago, estado: ESTADO_PAGO_ANULADO }).subscribe({
      next: (actualizado) => {
        this.pagos.update(lista => lista.map(p => (p.idPago === actualizado.idPago ? actualizado : p)));
        this.pagoAAnular.set(null);
      },
      error: (err) => {
        console.error('Error al anular pago:', err);
        this.errorMessage.set('No se pudo anular el pago.');
        this.pagoAAnular.set(null);
        this.anulando.set(false);
      },
      complete: () => this.anulando.set(false)
    });
  }
}