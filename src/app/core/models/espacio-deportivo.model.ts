export interface EspacioDeportivo {
  idEspacio?: number;
  idSede: number;
  idTipoEspacio: number;
  foto?: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioHora: number;
  estado?: string;
}
