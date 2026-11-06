import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { PagoService } from '../../../../core/services/pago.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Pago, ESTADO_PAGO_ANULADO } from '../../../../core/models/pago.model';

@Component({
  selector: 'app-mis-pagos',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './mis-pagos.component.html',
  styleUrl: './mis-pagos.component.css'
})
export class MisPagosComponent implements OnInit {
  pagos = signal<Pago[]>([]);
  cargando = signal(true);
  error = signal('');

  filtroEstado = signal('');

  // Opciones del filtro: salen de los propios pagos del cliente
  estados = computed(() =>
    [...new Set(this.pagos().map(p => p.estado).filter((e): e is string => !!e))].sort()
  );

  totalAbonado = computed(() =>
    this.pagos()
      .filter(p => p.estado !== ESTADO_PAGO_ANULADO)
      .reduce((suma, p) => suma + (p.monto ?? 0), 0)
  );

  // Los más recientes primero
  pagosFiltrados = computed(() => {
    const estado = this.filtroEstado();

    return this.pagos()
      .filter(p => !estado || p.estado === estado)
      .sort((a, b) => String(b.fechaPago ?? '').localeCompare(String(a.fechaPago ?? '')));
  });

  constructor(
    private pagoService: PagoService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.cargando.set(true);
    this.error.set('');

    this.usuarioService.obtenerMiPerfil().pipe(
      switchMap(perfil =>
        this.pagoService.listarPorUsuario(perfil.idUsuario).pipe(
          // El backend responde 404 cuando el usuario aún no tiene pagos: no es un error para el cliente
          catchError((err: HttpErrorResponse) =>
            err.status === 404 ? of([] as Pago[]) : throwError(() => err)
          )
        )
      )
    ).subscribe({
      next: (pagos) => {
        this.pagos.set(pagos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los pagos:', err);
        this.error.set('No se pudieron cargar tus pagos.');
        this.cargando.set(false);
      }
    });
  }

  etiquetaEstado(estado?: string): string {
    if (!estado) return '—';
    const texto = estado.replace(/_/g, ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  claseEstado(estado?: string): string {
    switch (estado) {
      case ESTADO_PAGO_ANULADO: return 'mp-badge-anulado';
      case 'PENDIENTE': return 'mp-badge-pendiente';
      default: return '';
    }
  }
}