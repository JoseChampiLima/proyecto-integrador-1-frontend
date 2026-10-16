import { MetodoPago } from "./metodo-pago.model";
import { Reserva } from "./reserva.model";

export interface Pago {
  idPago?: number;
  reserva: Reserva;
  metodoPago: MetodoPago;
  monto: number;
  fechaPago?: Date;
  nroOperacion: string;
  estado: string;
}

export const ESTADO_PAGO_ANULADO = 'ANULADO';