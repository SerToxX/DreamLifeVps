// ── Tipos compartidos entre frontend y backend ──

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export type VentaEstado =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'EN_PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type VentaCanal = 'ONLINE' | 'TIENDA' | 'EVENTO';

export type AlertaColor = 'VERDE' | 'AMARILLO' | 'ROJO';

export type UbicacionTipo =
  | 'taller'
  | 'almacen'
  | 'tienda'
  | 'evento'
  | 'online';

export interface UserPayload {
  id: number;
  correo: string;
  rol: 'admin' | 'worker' | 'customer';
  type: 'usuario' | 'cliente';
}
