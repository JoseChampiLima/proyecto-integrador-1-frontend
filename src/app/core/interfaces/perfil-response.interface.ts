// RUTA src\app\core\interfaces\perfil-response.interface.ts

// Respuesta de GET /usuarios/perfil
export interface PerfilResponse {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  dni: string;
  telefono: string;
}

// Respuesta de PUT /usuarios/{id}/perfil
export interface ActualizarPerfilResponse {
  mensaje: string;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
}