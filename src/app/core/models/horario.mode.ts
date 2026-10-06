export interface Horario {
  idHorario?: number;
  idEspacio: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  estado?: boolean;
}