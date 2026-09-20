import { Sede } from "./sede.model";
import { TipoEspacio } from "./tipo-espacio.model";

export interface EspacioDeportivo {
  idEspacio?: number;
  sede: Sede;
  tipoEspacio: TipoEspacio;
  foto?: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioHora: number;
  estado?: string;
}
