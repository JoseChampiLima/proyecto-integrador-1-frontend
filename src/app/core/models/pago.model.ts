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

export const ESTADO_PAGO_PENDIENTE = 'PENDIENTE'; // registrado por el cliente, falta que el admin lo valide
export const ESTADO_PAGO_APROBADO= 'APROBADO';       // validado por el admin
export const ESTADO_PAGO_ANULADO = 'ANULADO';     // anulado por el admin