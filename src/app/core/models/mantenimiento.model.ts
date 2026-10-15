import { EspacioDeportivo } from "./espacio-deportivo.model";

export interface Mantenimiento {
  idMantenimiento?: number;
  espacio: EspacioDeportivo;
  fechaInicio: Date;
  fechaFin: Date;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado?: string;
}

export const ESTADOS_MANTENIMIENTO = ['PROGRAMADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO'];