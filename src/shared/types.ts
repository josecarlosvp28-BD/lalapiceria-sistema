export type Rol = "admin" | "vendedor" | "taller_grabado";

export type Categoria =
  | "lapicero"
  | "pluma_fuente"
  | "roller"
  | "portaminas"
  | "accesorio"
  | "estuche";

export type EstadoProducto = "activo" | "descontinuado" | "agotado";
export type TipoMovimiento = "entrada" | "salida" | "ajuste" | "merma";
export type TipoCliente = "retail" | "mayorista" | "corporativo";
export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "yape_plin";
export type EstadoGrabado = "recibido" | "en_proceso" | "control_calidad" | "listo" | "entregado";

export interface Usuario {
  id: number;
  nombre: string;
  email: string | null;
  rol: Rol;
  activo: number;
  created_at: string;
  updated_at: string;
}

export interface Producto {
  id: number;
  sku: string;
  marca: string;
  modelo: string;
  categoria: Categoria;
  variante_color: string | null;
  variante_acabado: string | null;
  variante_punta: "fina" | "media" | "gruesa" | null;
  costo_centavos: number;
  precio_centavos: number;
  proveedor_id: number | null;
  stock_actual: number;
  stock_minimo: number;
  ubicacion: "vitrina" | "almacen" | null;
  estado: EstadoProducto;
  origen: "local" | "online";
  external_woo_id: string | null;
  created_at: string;
  updated_at: string;
}

export type NuevoProducto = Omit<
  Producto,
  "id" | "stock_actual" | "created_at" | "updated_at" | "origen" | "external_woo_id"
>;

export interface InventarioMovimiento {
  id: number;
  producto_id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  referencia_tipo: string | null;
  referencia_id: number | null;
  usuario_id: number | null;
  created_at: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  dni_ruc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  tipo_cliente: TipoCliente;
  marca_favorita: string | null;
  presupuesto_rango: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type NuevoCliente = Omit<Cliente, "id" | "created_at" | "updated_at">;

export interface VentaItem {
  producto_id: number;
  cantidad: number;
  precio_unitario_centavos: number;
  descuento_centavos: number;
}

export interface VentaPago {
  metodo: MetodoPago;
  monto_centavos: number;
}

export interface NuevaVenta {
  cliente_id: number | null;
  usuario_id: number | null;
  items: VentaItem[];
  descuento_centavos: number;
  descuento_motivo: string | null;
  pagos: VentaPago[];
}

export interface Venta {
  id: number;
  cliente_id: number | null;
  usuario_id: number | null;
  fecha: string;
  subtotal_centavos: number;
  descuento_centavos: number;
  descuento_motivo: string | null;
  total_centavos: number;
  estado: "completada" | "anulada";
  canal: "local" | "online";
  created_at: string;
  updated_at: string;
}

export interface OrdenGrabado {
  id: number;
  cliente_id: number;
  producto_id: number;
  venta_id: number | null;
  texto_grabado: string;
  tipo_fuente: string | null;
  posicion: string | null;
  imagen_referencia_path: string | null;
  fecha_recepcion: string;
  fecha_entrega_estimada: string | null;
  fecha_entrega_real: string | null;
  estado: EstadoGrabado;
  responsable_id: number | null;
  costo_adicional_centavos: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
}
