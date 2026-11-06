import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReservaService } from '../../../../core/services/reserva.service';
import { PagoService } from '../../../../core/services/pago.service';
import { MetodoPagoService } from '../../../../core/services/metodo-pago.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Reserva } from '../../../../core/models/reserva.model';
import { MetodoPago } from '../../../../core/models/metodo-pago.model';
import {
  Pago, ESTADO_PAGO_ANULADO, ESTADO_PAGO_APROBADO, ESTADO_PAGO_PENDIENTE
} from '../../../../core/models/pago.model';

@Component({
  selector: 'app-pagar-reserva',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './pagar-reserva.component.html',
  styleUrl: './pagar-reserva.component.css'
})
export class PagarReservaComponent implements OnInit {
  reserva = signal<Reserva | null>(null);
  metodos = signal<MetodoPago[]>([]);
  pagoExistente = signal<Pago | null>(null); // pago vigente (no anulado) de esta reserva

  cargando = signal(true);
  procesando = signal(false);
  errorCarga = signal('');
  errorEnvio = signal('');
  pagoRegistrado = signal(false);

  pagoForm: FormGroup;

  // Motivo por el que esta reserva no se puede pagar (cadena vacía = sí se puede)
  bloqueo = computed(() => {
    const reserva = this.reserva();
    const pago = this.pagoExistente();
    if (!reserva) return '';

    if (pago?.estado === ESTADO_PAGO_APROBADO) {
      return 'Esta reserva ya está pagada.';
    }
    if (pago) {
      return 'Ya registraste un pago para esta reserva. Un administrador lo está revisando.';
    }
    if (reserva.estadoReserva?.nombre !== 'PENDIENTE') {
      return 'Solo se pueden pagar reservas pendientes.';
    }
    return '';
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private reservaService: ReservaService,
    private pagoService: PagoService,
    private metodoPagoService: MetodoPagoService,
    private usuarioService: UsuarioService
  ) {
    this.pagoForm = this.fb.group({
      idMetodoPago: [null, Validators.required],
      // Sin pasarela: el cliente paga por fuera (Yape, transferencia...) y registra aquí su comprobante
      nroOperacion: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    const idReserva = Number(this.route.snapshot.paramMap.get('idReserva'));

    if (!Number.isInteger(idReserva) || idReserva <= 0) {
      this.errorCarga.set('La reserva indicada no es válida.');
      this.cargando.set(false);
      return;
    }

    forkJoin({
      reserva: this.reservaService.buscarPorId(idReserva),
      pagos: this.pagoService.listarPorReserva(idReserva),
      metodos: this.metodoPagoService.listarActivos(),
      perfil: this.usuarioService.obtenerMiPerfil()
    }).subscribe({
      next: ({ reserva, pagos, metodos, perfil }) => {
        // Comprobación de comodidad; la verificación real de propiedad debe hacerla el backend
        if (reserva.usuario?.idUsuario !== perfil.idUsuario) {
          this.errorCarga.set('Esta reserva no te pertenece.');
        } else {
          this.reserva.set(reserva);
          this.metodos.set(metodos);
          this.pagoExistente.set(pagos.find(p => p.estado !== ESTADO_PAGO_ANULADO) ?? null);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar la reserva para pagar:', err);
        this.errorCarga.set('No se pudo cargar la reserva.');
        this.cargando.set(false);
      }
    });
  }

  hora(valor?: string): string {
    return valor ? valor.slice(0, 5) : '—';
  }

  onSubmit(): void {
    const reserva = this.reserva();

    if (this.pagoForm.invalid || !reserva?.idReserva) {
      this.pagoForm.markAllAsTouched();
      return;
    }

    this.procesando.set(true);
    this.errorEnvio.set('');

    const { idMetodoPago, nroOperacion } = this.pagoForm.value;

    // El monto sale de la reserva; el backend debe recalcularlo y no confiar en este valor
    const pago = {
      reserva: { idReserva: reserva.idReserva },
      metodoPago: { idMetodoPago },
      monto: reserva.precioTotal,
      nroOperacion: String(nroOperacion).trim(),
      estado: ESTADO_PAGO_PENDIENTE
    } as unknown as Pago;

    this.pagoService.guardar(pago).subscribe({
      next: () => {
        this.pagoRegistrado.set(true);
        this.procesando.set(false);
      },
      error: (err) => {
        console.error('Error al registrar el pago:', err);
        this.errorEnvio.set(
          err?.error?.mensaje ?? err?.error?.message ??
          'No se pudo registrar el pago. Verifica que el N° de operación no se haya usado antes.'
        );
        this.procesando.set(false);
      }
    });
  }
}