import { Component, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { HorarioService } from '../../../../core/services/horario.service';
import { EspacioDeportivoService } from '../../../../core/services/espacio-deportivo.service';

import { EspacioDeportivo } from '../../../../core/models/espacio-deportivo.model';
import { HorarioRequest } from '../../../../core/interfaces/horario-request.interface';

@Component({
  selector: 'app-horario-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './horario-form.component.html',
  styleUrl: './horario-form.component.css'
})
export class HorarioFormComponent implements OnInit {

  horarioForm: FormGroup;

  espacios = signal<EspacioDeportivo[]>([]);

  modoEdicion = signal(false);

  idHorario: number | null = null;

  isLoading = signal(false);
  isSaving = signal(false);

  errorMessage = signal<string | null>(null);

  diasSemana = [
    { value: 'LUNES', label: 'Lunes' },
    { value: 'MARTES', label: 'Martes' },
    { value: 'MIERCOLES', label: 'Miércoles' },
    { value: 'JUEVES', label: 'Jueves' },
    { value: 'VIERNES', label: 'Viernes' },
    { value: 'SABADO', label: 'Sábado' },
    { value: 'DOMINGO', label: 'Domingo' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private horarioService: HorarioService,
    private espacioService: EspacioDeportivoService
  ) {

    this.horarioForm = this.fb.group({

      idEspacio: [
        '',
        Validators.required
      ],

      diaSemana: [
        '',
        Validators.required
      ],

      horaInicio: [
        '',
        Validators.required
      ],

      horaFin: [
        '',
        Validators.required
      ],

      estado: [true]

    });

  }


  ngOnInit(): void {

    // Cargar espacios deportivos
    this.cargarEspacios();

    // Revisar si estamos editando
    const idParam =
      this.route.snapshot.paramMap.get('id');

    if (idParam) {

      this.modoEdicion.set(true);

      this.idHorario =
        Number(idParam);

      this.cargarHorario(
        this.idHorario
      );

    }

  }


  // =====================================================
  // CARGAR ESPACIOS
  // =====================================================

  cargarEspacios(): void {

    this.espacioService
      .listar()
      .subscribe({

        next: (espacios) => {

          this.espacios.set(
            espacios
          );

        },

        error: (err) => {

          console.error(
            'Error al cargar espacios:',
            err
          );

          this.errorMessage.set(
            'No se pudieron cargar los espacios deportivos.'
          );

        }

      });

  }


  // =====================================================
  // CARGAR HORARIO PARA EDITAR
  // =====================================================

  cargarHorario(id: number): void {

    this.isLoading.set(true);

    this.horarioService
      .buscarPorId(id)
      .subscribe({

        next: (horario) => {

          this.horarioForm.patchValue({

            idEspacio:
              horario.idEspacio,

            diaSemana:
              horario.diaSemana,

            horaInicio:
              this.formatearHoraInput(
                horario.horaInicio
              ),

            horaFin:
              this.formatearHoraInput(
                horario.horaFin
              ),

            estado:
              horario.estado

          });

        },

        error: (err) => {

          console.error(
            'Error al cargar horario:',
            err
          );

          this.errorMessage.set(
            'No se pudo cargar el horario.'
          );

          this.isLoading.set(false);

        },

        complete: () => {

          this.isLoading.set(false);

        }

      });

  }


  // =====================================================
  // REGISTRAR / ACTUALIZAR
  // =====================================================

  onSubmit(): void {

    // Validar formulario
    if (this.horarioForm.invalid) {

      this.horarioForm.markAllAsTouched();

      return;

    }


    const horaInicio =
      this.horarioForm.value.horaInicio;

    const horaFin =
      this.horarioForm.value.horaFin;


    // Validar rango de horas
    if (horaInicio >= horaFin) {

      this.errorMessage.set(
        'La hora de inicio debe ser menor que la hora de fin.'
      );

      return;

    }


    this.isSaving.set(true);
    this.errorMessage.set(null);


    // ==========================================
    // REQUEST QUE ESPERA SPRING BOOT
    // ==========================================

    const horarioRequest: HorarioRequest = {

      diaSemana:
        this.horarioForm.value.diaSemana,

      horaInicio:
        this.normalizarHora(
          horaInicio
        ),

      horaFin:
        this.normalizarHora(
          horaFin
        ),

      estado:
        this.horarioForm.value.estado,

      espacio: {

        idEspacio:
          Number(
            this.horarioForm.value.idEspacio
          )

      }

    };


    console.log(
      'Horario enviado:',
      horarioRequest
    );


    // ==========================================
    // DETERMINAR SI ES POST O PUT
    // ==========================================

    const peticion =

      this.modoEdicion() &&
      this.idHorario !== null

        // EDITAR
        ? this.horarioService.actualizar(
            this.idHorario,
            horarioRequest
          )

        // REGISTRAR
        : this.horarioService.guardar(
            horarioRequest
          );


    // ==========================================
    // EJECUTAR PETICIÓN
    // ==========================================

    peticion.subscribe({

      next: () => {

        this.router.navigate([
          '/admin/horarios'
        ]);

      },

      error: (err) => {

        console.error(
          'Error al guardar horario:',
          err
        );

        this.errorMessage.set(

          this.modoEdicion()

            ? 'No se pudo actualizar el horario. Verifique los datos.'

            : 'No se pudo registrar el horario. Verifique los datos.'

        );

        this.isSaving.set(false);

      },

      complete: () => {

        this.isSaving.set(false);

      }

    });

  }


  // =====================================================
  // CANCELAR
  // =====================================================

  cancelar(): void {

    this.router.navigate([
      '/admin/horarios'
    ]);

  }


  // =====================================================
  // NORMALIZAR HORA PARA SPRING BOOT
  // =====================================================

  private normalizarHora(
    hora: string
  ): string {

    if (!hora) {
      return '';
    }

    // 08:00 → 08:00:00
    return hora.length === 5
      ? `${hora}:00`
      : hora;

  }


  // =====================================================
  // FORMATEAR HORA PARA INPUT TYPE="TIME"
  // =====================================================

  private formatearHoraInput(
    hora: string
  ): string {

    if (!hora) {
      return '';
    }

    // 08:00:00 → 08:00
    return hora.substring(
      0,
      5
    );

  }

}