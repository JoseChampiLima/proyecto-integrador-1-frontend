// RUTA src\app\core\interfaces\actualizar-perfil-request.interface.ts

export interface ActualizarPerfilRequest {
  nombres: string;
  apellidos: string;
  telefono: string;
  claveActual?: string;
  nuevaClave?: string;
}