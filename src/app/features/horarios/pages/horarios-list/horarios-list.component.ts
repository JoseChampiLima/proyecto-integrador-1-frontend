import { Component, OnInit, signal, computed } from '@angular/core';
import { Horario } from '../../../../core/models/horario.mode';
import { EspacioDeportivo } from '../../../../core/models/espacio-deportivo.model';
import { HorarioService } from '../../../../core/services/horario.service';
import { EspacioDeportivoService } from '../../../../core/services/espacio-deportivo.service';




@Component({
  selector: 'app-horarios-list',
  imports: [],
  templateUrl: './horarios-list.component.html',
  styleUrl: './horarios-list.component.css',
})
export class HorariosListComponent {
   horarios = signal<Horario[]>([]);
  espacios = signal<EspacioDeportivo[]>([]);

  filtro = signal('');
  filtroDia = signal('');

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor(
    private horarioService: HorarioService,
    private espacioService: EspacioDeportivoService
  ) {}

  ngOnInit(): void {

    this.cargarHorarios();
    this.cargarEspacios();

  }

  cargarHorarios(): void {

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.horarioService.listar().subscribe({

      next: (horarios) => {

        console.log('HORARIOS BACKEND:', horarios);

        this.horarios.set(horarios);

      },

      error: (err) => {

        console.error(
          'Error al listar horarios:',
          err
        );

        this.errorMessage.set(
          'No se pudo cargar la lista de horarios.'
        );

      },

      complete: () => {

        this.isLoading.set(false);

      }

    });

  }

  cargarEspacios(): void {

    this.espacioService.listar().subscribe({

      next: (espacios) => {

        this.espacios.set(espacios);

      },

      error: (err) => {

        console.error(
          'Error al cargar espacios:',
          err
        );

      }

    });

  }

  nombreEspacio(idEspacio: number): string {

    const espacio = this.espacios()
      .find(e => e.idEspacio === idEspacio);

    return espacio?.nombre ?? 'Sin espacio';

  }

  // ==========================================
// FILTRAR HORARIOS
// ==========================================

horariosFiltrados(): Horario[] {

  const texto = this.filtro()
    .trim()
    .toLowerCase();

  const dia = this.filtroDia();

  return this.horarios().filter(horario => {

    const nombreEspacio =
      this.nombreEspacio(horario.idEspacio)
        .toLowerCase();

    const coincideEspacio =
      !texto ||
      nombreEspacio.includes(texto);

    const coincideDia =
      !dia ||
      horario.diaSemana === dia;

    return coincideEspacio && coincideDia;
  });
}


// ==========================================
// ACTUALIZAR BUSCADOR
// ==========================================

actualizarFiltro(event: Event): void {

  const input =
    event.target as HTMLInputElement;

  this.filtro.set(input.value);
}


// ==========================================
// ACTUALIZAR FILTRO DÍA
// ==========================================

actualizarFiltroDia(event: Event): void {

  const select =
    event.target as HTMLSelectElement;

  this.filtroDia.set(select.value);
}


// ==========================================
// FORMATEAR DÍA
// ==========================================

formatearDia(dia: string): string {

  const dias: Record<string, string> = {
    LUNES: 'Lunes',
    MARTES: 'Martes',
    MIERCOLES: 'Miércoles',
    JUEVES: 'Jueves',
    VIERNES: 'Viernes',
    SABADO: 'Sábado',
    DOMINGO: 'Domingo'
  };

  return dias[dia] ?? dia;
}


// ==========================================
// FORMATEAR HORA
// ==========================================

formatearHora(hora: string): string {

  if (!hora) {
    return '';
  }

  return hora.substring(0, 5);
}


// ==========================================
// NUEVO HORARIO
// ==========================================

nuevoHorario(): void {

  console.log('Nuevo horario');

}


// ==========================================
// EDITAR HORARIO
// ==========================================

editarHorario(horario: Horario): void {

  console.log(
    'Editar horario:',
    horario
  );

}


// ==========================================
// ELIMINAR HORARIO
// ==========================================

eliminarHorario(horario: Horario): void {

  if (!horario.idHorario) {
    return;
  }

  const confirmar = confirm(
    '¿Está seguro de eliminar este horario?'
  );

  if (!confirmar) {
    return;
  }

  this.horarioService
    .eliminar(horario.idHorario)
    .subscribe({

      next: () => {

        console.log(
          'Horario eliminado correctamente'
        );

        // Recargar listado
        this.cargarHorarios();
      },

      error: (error) => {

        console.error(
          'Error al eliminar horario:',
          error
        );

      }

    });
}
}
