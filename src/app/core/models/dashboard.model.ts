// RUTA src\app\core\models\dashboard.model.ts

export interface ReservaEstado {
  estado: string;
  cantidad: number;
}

export interface ReservaEspacio {
  espacio: string;
  cantidad: number;
}

export interface Dashboard {
  totalReservas: number;
  totalIngresos: number;
  totalClientes: number;
  totalEspacios: number;
  reservasPorEstado: ReservaEstado[];
  reservasPorEspacio: ReservaEspacio[];
}