export interface Usuario {
  idUsuario?: number;
  idRol: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  correo: string;
  clave: string;
  fechaRegistro: Date;
  estado: boolean;
}
