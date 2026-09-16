export interface Mantenimiento {
  idMantenimiento?: number;
  idEspacio: number;
  fechaInicio: Date;
  fechaFin: Date;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado?: string;
}