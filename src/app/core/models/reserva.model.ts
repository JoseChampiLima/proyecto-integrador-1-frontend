import { EspacioDeportivo } from "./espacio-deportivo.model";
import { EstadoReserva } from "./estado-reserva.model";
import { Usuario } from "./usuario.model";

export interface Reserva {
  idReserva?: number;
  usuario?: Usuario;
  espacio: EspacioDeportivo;
  estadoReserva: EstadoReserva;
  fechaReserva?: Date;
  horaInicio: string;
  horaFin: string;
  precioTotal: number;
  fechaRegistro?: Date;
  observacion: string;
}