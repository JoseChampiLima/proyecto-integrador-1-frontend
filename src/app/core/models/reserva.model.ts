export interface Reserva {
  idReserva?: number;
  idUsuario?: number;
  idEspacio: number;
  idEstadoReserva: number;
  fechaReserva?: Date;
  horaInicio: string;
  horaFin: string;
  precioTotal: number;
  fechaRegistro?: Date;
  observacion: string;
}