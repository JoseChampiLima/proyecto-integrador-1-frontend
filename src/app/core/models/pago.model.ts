export interface Pago {
  idPago?: number;
  idReserva: number;
  idMetodoPago: number;
  monto: number;
  fechaPago?: Date;
  nroOperacion: string;
  estado: string;
}