export interface HorarioRequest {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  estado: boolean;

  espacio: {
    idEspacio: number;
  };
}