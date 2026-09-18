import { Rol } from "./rol.model";

export interface Usuario {
  idUsuario?: number;
  rol: Rol;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  correo: string;
  clave: string;
  fechaRegistro?: Date;
  estado: boolean;
}
