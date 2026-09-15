# Auditoría de migración: Node.js/TypeScript → PHP 8.2 + MySQL

Sistema: La Lapicería — Sistema de Gestión
Fecha de auditoría: 2026-09-15
Estado actual: aplicación web Node.js/TypeScript (Express + React), recién migrada
desde una app de escritorio Electron. Aún no desplegada en producción — no hay
datos reales de producción que migrar (ver Q6).

## 1. Endpoints / rutas del backend actual

El backend NO usa rutas REST individuales por recurso. Usa un patrón RPC:
todas las operaciones de negocio pasan por un único endpoint, con un "canal"
que identifica la operación.

| Método | Ruta | Propósito |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión (email + password) |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuario de la sesión actual (o null) |
| POST | `/api/rpc` | Despacha a uno de los 51 canales de negocio (ver abajo) |
| GET | `/api/cotizaciones/:id/pdf` | Descarga el PDF de una cotización |
| GET | `*` (fallback) | Sirve el frontend estático (SPA) |

### Canales RPC (todos bajo `POST /api/rpc`, body `{ channel, args }`)

Productos: `productos:listar`, `productos:obtener`, `productos:crear`,
`productos:actualizar`, `productos:stockBajo`

Inventario: `inventario:registrarMovimiento`, `inventario:historial`

Clientes: `clientes:listar`, `clientes:obtener`, `clientes:crear`,
`clientes:actualizar`, `clientes:historialCompras`, `clientes:paraSeguimiento`,
`clientes:porMarcaComprada`, `clientes:proximosCumpleanos`

Ventas: `ventas:crear`, `ventas:anular`, `ventas:listar`, `ventas:detalle`,
`ventas:reporteMasVendidos`, `ventas:reportePorPeriodo`, `ventas:reportePorMarca`,
`ventas:reportePorCategoria`, `ventas:reporteMargen`, `ventas:resumenComparativo`

Grabados: `grabados:listar`, `grabados:obtener`, `grabados:crear`,
`grabados:cambiarEstado`, `grabados:listasParaEntrega`, `grabados:historialCliente`

Cotizaciones: `cotizaciones:listar`, `cotizaciones:obtener`, `cotizaciones:crear`,
`cotizaciones:cambiarEstado`

Garantías: `garantias:listar`, `garantias:crear`, `garantias:cambiarEstado`

Caja: `caja:actual`, `caja:montoEsperado`, `caja:abrir`, `caja:cerrar`, `caja:historial`

Dashboard: `dashboard:resumenGeneral`, `dashboard:rotacionInventario`,
`dashboard:clientesNuevosVsRecurrentes`, `dashboard:ingresosPorCanal`

Usuarios: `usuarios:listar`, `usuarios:crear`, `usuarios:cambiarEstado`

Sistema: `sistema:backup`

**Nota de diseño para la migración:** este patrón RPC-sobre-un-solo-endpoint
fue una elección pragmática para Electron (mapeaba 1:1 a los canales de IPC).
No es el patrón usado en BunClose/Bunsale. Recomiendo que el backend PHP
exponga rutas REST reales por recurso (`GET /api/productos`, `POST /api/ventas`,
etc.) siguiendo la convención de los proyectos de referencia, y que el frontend
se actualice para llamarlas directamente — es un cambio mecánico (reemplazar
`api.productos.listar()` internamente) sin tocar ninguna página. Confirmar
antes de Fase 1 si prefieres mantener el patrón RPC por simplicidad, o pasar
a REST por consistencia con el resto del portafolio.

## 2. Esquema de base de datos actual (SQLite, vía better-sqlite3)

Fuente de verdad: `src/db/schema.ts`. 15 tablas, todos los montos en
**centavos** (enteros, nunca floats) para evitar errores de redondeo:

1. **usuarios** — id, nombre, email (único), rol (admin/vendedor/taller_grabado),
   pin_hash (hash bcrypt de la contraseña), activo, created_at, updated_at
2. **proveedores** — id, nombre, contacto, telefono, email, direccion, timestamps
3. **productos** — id, sku (único), marca, modelo, categoria, variante_color,
   variante_acabado, variante_punta, costo_centavos, precio_centavos,
   proveedor_id (FK), stock_actual, stock_minimo, ubicacion, estado, origen
   (local/online — reservado para una futura sincronización con WooCommerce),
   external_woo_id (reservado, sin uso aún), timestamps
4. **compras** — id, proveedor_id (FK), numero_documento, fecha, total_centavos, timestamps
5. **compras_detalle** — id, compra_id (FK), producto_id (FK), cantidad,
   costo_unitario_centavos, created_at
6. **inventario_movimientos** — id, producto_id (FK), tipo (entrada/salida/
   ajuste/merma), cantidad, motivo, referencia_tipo, referencia_id, usuario_id
   (FK), created_at — **es el único mecanismo permitido para cambiar stock**;
   la lógica de negocio nunca escribe `stock_actual` directamente sin crear
   antes un registro aquí (ver `inventario.ts::registrarMovimiento`)
7. **clientes** — id, nombre, dni_ruc, telefono, email, direccion,
   fecha_nacimiento, tipo_cliente (retail/mayorista/corporativo),
   marca_favorita, presupuesto_rango, notas, timestamps
8. **ventas** — id, cliente_id (FK nullable), usuario_id (FK nullable), fecha,
   subtotal_centavos, descuento_centavos, descuento_motivo, total_centavos,
   estado (completada/anulada), canal (local/online), timestamps
9. **ventas_detalle** — id, venta_id (FK), producto_id (FK), cantidad,
   precio_unitario_centavos, descuento_centavos, subtotal_centavos
10. **ventas_pagos** — id, venta_id (FK), metodo (efectivo/tarjeta/
    transferencia/yape_plin), monto_centavos, created_at — soporta pagos
    mixtos (una venta puede tener varias filas aquí)
11. **ordenes_grabado** — id, cliente_id (FK), producto_id (FK), venta_id (FK
    nullable), texto_grabado, tipo_fuente, posicion, imagen_referencia_path
    (campo reservado — **la subida de archivos NO está implementada**, ver
    sección 6), fechas de recepción/entrega estimada/entrega real, estado
    (recibido→en_proceso→control_calidad→listo→entregado), responsable_id
    (FK), costo_adicional_centavos, notas, timestamps
12. **garantias** — id, cliente_id (FK), producto_id (FK nullable), venta_id
    (FK nullable), marca, falla, fecha_ingreso, fecha_entrega, estado
    (en_revision/en_reparacion/listo/entregado/no_procede), notas, timestamps
13. **cotizaciones_corporativas** — id, cliente_id (FK), descripcion, estado
    (cotizacion→aprobacion→produccion→entrega), total_centavos,
    fecha_creacion, fecha_entrega_estimada, notas, timestamps
14. **cotizaciones_detalle** — id, cotizacion_id (FK), producto_id (FK),
    cantidad, precio_unitario_centavos
15. **caja_diaria** — id, fecha, usuario_apertura_id (FK), monto_apertura_centavos,
    usuario_cierre_id (FK), monto_cierre_esperado_centavos,
    monto_cierre_real_centavos, diferencia_centavos, estado (abierta/cerrada),
    notas, timestamps

Todas las relaciones usan claves foráneas con `ON DELETE RESTRICT` o
`ON DELETE SET NULL` explícitos (nunca CASCADE en tablas históricas como
ventas/productos, para no perder trazabilidad). Esto debe preservarse
exactamente en el DDL de MySQL.

## 3. Autenticación

- Basada en **sesiones de servidor** (`express-session`), cookie httpOnly,
  `sameSite=lax`, 30 días de duración.
- Contraseñas con **bcrypt** (`bcryptjs`, costo 10).
- Sin OAuth, sin JWT. Login simple por email + contraseña contra la tabla
  `usuarios`.
- Un usuario admin se auto-crea la primera vez que arranca el servidor si la
  tabla `usuarios` está vacía (credenciales impresas en el log del servidor).
- **No hay control de acceso por rol todavía** — cualquier usuario autenticado
  (admin/vendedor/taller_grabado) puede llamar cualquier canal. Es una
  limitación conocida del sistema actual, no algo que la migración deba
  "arreglar" silenciosamente — se mantiene igual salvo que el usuario pida
  lo contrario.

## 4. Tareas en segundo plano / programadas

- **Un solo job**: respaldo automático de la base de datos cada 6 horas
  (`setInterval` en `src/server/index.ts`), más un respaldo adicional en
  cada cierre de la app (heredado de la versión Electron, ya no aplica tal
  cual en un servidor siempre encendido).
- **Esto NO es compatible tal cual con hosting compartido de Hostinger**,
  que no mantiene procesos Node/PHP corriendo indefinidamente. Debe
  rediseñarse como un **cron job de Hostinger** (hPanel → Advanced → Cron
  Jobs) que llame a un script PHP de respaldo cada cierto tiempo — ver Q3.

## 5. WebSockets / conexiones persistentes

**Ninguna.** Toda la comunicación es petición/respuesta HTTP normal. No hay
nada que rediseñar en este punto — el sistema ya es 100% compatible con el
modelo de hosting compartido en este aspecto.

## 6. Almacenamiento de archivos / subida de archivos

**No implementado todavía.** El esquema reserva el campo
`ordenes_grabado.imagen_referencia_path` para adjuntar una imagen de
referencia al grabado personalizado, pero la funcionalidad de subida nunca
se construyó (quedó fuera del alcance de las fases completadas hasta ahora).
Si se requiere para la migración, hay que definir dónde vivirán esos
archivos en Hostinger (típicamente una carpeta dentro de `public_html`,
fuera de la raíz servible o con `.htaccess` restrictivo).

## 7. Generación de PDF, email, APIs de terceros

- **PDF**: cotizaciones corporativas se exportan a PDF con `pdfkit` (librería
  Node pura, sin dependencias del sistema). Debe reemplazarse por una
  librería PHP nativa (Dompdf, TCPDF o similar).
- **Email**: **no implementado**. El sistema no envía correos en ningún
  flujo actual.
- **WhatsApp**: no es una integración de servidor — el botón "Avisar por
  WhatsApp" simplemente abre `wa.me/<numero>?text=<mensaje>` en una pestaña
  nueva del navegador del lado del cliente. No requiere backend ni
  credenciales de ninguna API de WhatsApp.
- **Pagos**: **el sistema no procesa pagos**. El módulo de Caja/Ventas
  únicamente *registra* qué método de pago usó el cliente (efectivo,
  tarjeta, transferencia, Yape/Plin) para efectos de conciliación de caja —
  no hay ninguna pasarela de pago (Izipay, Stripe, etc.) integrada ni
  cobro de tarjetas en línea. Ver Q5: no aplica, no hay nada que conectar
  a Izipay ni a `checkout.bundigital.com`.
- **Otras APIs externas**: ninguna.

## 8. Variables de entorno / secretos requeridos actualmente

| Variable | Uso | Obligatoria |
|---|---|---|
| `SESSION_SECRET` | Firma la cookie de sesión | Sí, en producción |
| `PORT` | Puerto del servidor Express | No (default 4000) |
| `DATA_DIR` | Carpeta donde vive el archivo SQLite y los respaldos | No (default `./data`) |
| `NODE_ENV` | `production` activa cookies `secure` y exige `SESSION_SECRET` | No |

No hay claves de API de terceros que migrar (no hay Resend, no hay Izipay,
no hay ninguna credencial externa en el sistema actual).

## 9. Resumen de lo que SÍ debe rediseñarse (no es "portar 1:1")

| Elemento | Estado actual | Qué requiere en PHP/Hostinger |
|---|---|---|
| Base de datos | SQLite (archivo local) | MySQL — ver Q1 |
| Respaldo automático | `setInterval` cada 6h, proceso siempre vivo | Cron job de Hostinger — ver Q3 |
| Generación de PDF | `pdfkit` (Node) | Dompdf/TCPDF (PHP) |
| Autenticación | `express-session` (sesión en memoria/servidor Node) | Sesiones PHP nativas (`session_start()`) o tabla de sesiones en MySQL |
| Contraseñas | `bcryptjs` | `password_hash()` / `password_verify()` (PHP nativo, mismo algoritmo bcrypt) |
| Patrón de API | RPC sobre un único endpoint | Recomendado: REST por recurso (confirmar) |

Todo lo demás (las 15 tablas, sus relaciones, la lógica de negocio de cada
módulo, y el frontend React completo) se traslada sin cambios de
comportamiento — solo cambia el lenguaje en el que está escrito el backend.
