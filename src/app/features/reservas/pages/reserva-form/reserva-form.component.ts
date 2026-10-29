

import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EspacioDeportivoService } from '../../../../core/services/espacio-deportivo.service';
import { HorarioService } from '../../../../core/services/horario.service';
import { ReservaService } from '../../../../core/services/reserva.service';
import { UsuarioService } from '../../../../core/services/usuario.service';

import { EspacioDeportivo } from '../../../../core/models/espacio-deportivo.model';
import { Horario } from '../../../../core/models/horario.model';
import { Reserva } from '../../../../core/models/reserva.model';

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reserva-form.component.html',
  styleUrl: './reserva-form.component.css'
})
export class ReservaFormComponent implements OnInit {

  espacio = signal<EspacioDeportivo | null>(null);
  horarios = signal<Horario[]>([]);
  idUsuario = signal<number | null>(null);

  cargando = signal(true);
  procesando = signal(false);
  mensajeError = signal('');
  mensajeExito = signal('');

  fecha = '';
  horaInicio = '';
  horaFin = '';
  observacion = '';

  fechaMinima = new Date().toLocaleDateString('en-CA');

  private dias = [
    'DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES',
    'JUEVES', 'VIERNES', 'SABADO'
  ];

  horariosDelDia = computed(() => {
    const fecha = this.fecha;
    if (!fecha) return [];

    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaLocal = new Date(anio, mes - 1, dia);
    const nombreDia = this.dias[fechaLocal.getDay()];

    return this.horarios().filter(h =>
      h.diaSemana.toUpperCase() === nombreDia &&
      h.estado === true
    );
  });

  duracionHoras = computed(() => {
    if (!this.horaInicio || !this.horaFin) return 0;

    const [hi, mi] = this.horaInicio.split(':').map(Number);
    const [hf, mf] = this.horaFin.split(':').map(Number);

    return Math.max(0, ((hf * 60 + mf) - (hi * 60 + mi)) / 60);
  });

  precioTotal = computed(() =>
    (this.espacio()?.precioHora ?? 0) * this.duracionHoras()
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private espacioService: EspacioDeportivoService,
    private horarioService: HorarioService,
    private reservaService: ReservaService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    const idEspacio = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(idEspacio) || idEspacio <= 0) {
      this.mensajeError.set('El espacio seleccionado no es válido.');
      this.cargando.set(false);
      return;
    }

    forkJoin({
      espacio: this.espacioService.buscarPorId(idEspacio),
      horarios: this.horarioService.listarPorEspacio(idEspacio),
      perfil: this.usuarioService.obtenerMiPerfil()
    }).subscribe({
      next: ({ espacio, horarios, perfil }) => {
        this.espacio.set(espacio);
        this.horarios.set(horarios);
        this.idUsuario.set(perfil.idUsuario);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar reserva:', error);
        this.mensajeError.set(
          'No se pudo cargar la información de la reserva.'
        );
        this.cargando.set(false);
      }
    });
  }

  // Se ejecuta al cambiar la fecha o las horas.
  actualizarFormulario(): void {
    this.mensajeError.set('');
    this.mensajeExito.set('');
  }

  // Validar que el horario esté dentro del horario de atención.
  horarioValido(): boolean {
    if (!this.fecha || !this.horaInicio || !this.horaFin) {
      return false;
    }

    if (this.fecha < this.fechaMinima) {
      return false;
    }

    if (this.horaFin <= this.horaInicio) {
      return false;
    }

    const [anio, mes, dia] = this.fecha.split('-').map(Number);
    const nombreDia = this.dias[
      new Date(anio, mes - 1, dia).getDay()
    ];

    return this.horarios().some(h =>
      h.estado === true &&
      h.diaSemana.toUpperCase() === nombreDia &&
      this.horaInicio >= h.horaInicio.substring(0, 5) &&
      this.horaFin <= h.horaFin.substring(0, 5)
    );
  }

  confirmarReserva(): void {
    const espacio = this.espacio();
    const idUsuario = this.idUsuario();

    if (!espacio?.idEspacio || !idUsuario) {
      this.mensajeError.set('Faltan datos para realizar la reserva.');
      return;
    }

    if (espacio.estado !== 'DISPONIBLE') {
      this.mensajeError.set('Este espacio no está disponible.');
      return;
    }

    if (!this.horarioValido()) {
      this.mensajeError.set(
        'Selecciona una fecha y un horario válido para esta cancha.'
      );
      return;
    }

    this.procesando.set(true);
    this.mensajeError.set('');

    this.reservaService.verificarDisponibilidad(
      espacio.idEspacio,
      this.fecha,
      this.horaInicio,
      this.horaFin
    ).subscribe({
      next: (disponible) => {
        if (!disponible) {
          this.mensajeError.set(
            'El horario seleccionado ya está reservado, está en mantenimiento o no está disponible.'
          );
          this.procesando.set(false);
          return;
        }

        this.guardarReserva(espacio, idUsuario);
      },
      error: (error) => {
        console.error(error);
        this.mensajeError.set(
          'No se pudo verificar la disponibilidad.'
        );
        this.procesando.set(false);
      }
    });
  }

  private guardarReserva(
    espacio: EspacioDeportivo,
    idUsuario: number
  ): void {

    // El backend resuelve el usuario, el estado y el precio
    // a partir de los identificadores y datos recibidos.
    const nuevaReserva = {
      usuario: { idUsuario },
      espacio: { idEspacio: espacio.idEspacio },
      fechaReserva: this.fecha,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      observacion: this.observacion.trim()
    } as unknown as Reserva;

    this.reservaService.guardar(nuevaReserva).subscribe({
      next: (reservaGuardada) => {
  this.procesando.set(false);

  this.mensajeExito.set(
    '¡Reserva realizada exitosamente! Serás redirigido a Espacios Deportivos.'
  );

  console.log('Reserva guardada:', reservaGuardada);

  setTimeout(() => {
    this.router.navigate(['/espacios']);
  }, 2000);
},
      error: (error) => {
        console.error('Error al registrar reserva:', error);

        const mensajeBackend = error.error?.message
          || error.error?.mensaje
          || (typeof error.error === 'string' ? error.error : null);

        this.mensajeError.set(
          mensajeBackend || 'No se pudo registrar la reserva.'
        );
        this.procesando.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/espacios']);
  }
  get duracionCalculada(): number {
  if (!this.horaInicio || !this.horaFin) return 0;

  const [hi, mi] = this.horaInicio.split(':').map(Number);
  const [hf, mf] = this.horaFin.split(':').map(Number);

  return Math.max(0, ((hf * 60 + mf) - (hi * 60 + mi)) / 60);
}

get totalCalculado(): number {
  return (this.espacio()?.precioHora ?? 0) * this.duracionCalculada;
}
}

