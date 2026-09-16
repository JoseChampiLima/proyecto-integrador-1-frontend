export interface Horario {
  idHorario?: number;
  idEspacio: number;
  diaSemana: string;
  horaInicio: Date;
  horaFin: Date;
  estado?: boolean;
}