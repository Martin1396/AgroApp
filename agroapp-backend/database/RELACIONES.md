# Relaciones de base de datos — AgroApp / Turpial Dorado

Esquema MySQL 8 (Clever Cloud). Las llaves foráneas ya están en `turpial_dorado_clevercloud.sql`. Si importaste tablas sin FK, usa `aplicar_relaciones.sql`.

## Diagrama entidad-relación

```mermaid
erDiagram
    usuarios ||--o{ sesiones : "tiene"
    usuarios ||--o{ inventario_productos : "crea"
    usuarios ||--o{ inventario_movimientos : "registra"

    producciones ||--o{ produccion_cortes : "incluye"
    producciones ||--o{ ventas : "vincula"

    ventas ||--|{ venta_variedades : "detalla"

    inventario_productos ||--o{ inventario_movimientos : "movimientos"

    empresa_config {
        tinyint id PK "singleton = 1"
    }

    usuarios {
        varchar cedula PK
        varchar nombre
        varchar apellido
        varchar password_hash
        enum rol
    }

    sesiones {
        char id PK
        varchar usuario_cedula FK
        varchar token_hash
        datetime expira_en
    }

    producciones {
        char id PK
        int secuencia UK
        char codigo UK
        int desde_cama
        int hasta_cama
    }

    produccion_cortes {
        char id PK
        char produccion_id FK
        int secuencia
        int cantidad
    }

    ventas {
        char id PK
        int secuencia UK
        char produccion_id FK "opcional"
        decimal precio_venta
    }

    venta_variedades {
        char id PK
        char venta_id FK
        int orden
        varchar nombre
    }

    inventario_productos {
        char id PK
        varchar codigo UK
        varchar creado_por_cedula FK "opcional"
    }

    inventario_movimientos {
        char id PK
        char producto_id FK
        varchar usuario_cedula FK "opcional"
        enum tipo
    }
```

## Tabla de relaciones (FK)

| Tabla hija | Columna | Tabla padre | Columna padre | Cardinalidad | ON DELETE | ON UPDATE |
|------------|---------|-------------|---------------|--------------|-----------|-----------|
| `sesiones` | `usuario_cedula` | `usuarios` | `cedula` | N → 1 | CASCADE | CASCADE |
| `produccion_cortes` | `produccion_id` | `producciones` | `id` | N → 1 | CASCADE | CASCADE |
| `ventas` | `produccion_id` | `producciones` | `id` | 0..N → 1 | SET NULL | CASCADE |
| `venta_variedades` | `venta_id` | `ventas` | `id` | N → 1 | CASCADE | CASCADE |
| `inventario_productos` | `creado_por_cedula` | `usuarios` | `cedula` | 0..N → 1 | SET NULL | CASCADE |
| `inventario_movimientos` | `producto_id` | `inventario_productos` | `id` | N → 1 | RESTRICT | CASCADE |
| `inventario_movimientos` | `usuario_cedula` | `usuarios` | `cedula` | 0..N → 1 | SET NULL | CASCADE |

## Tablas sin relación FK

| Tabla | Motivo |
|-------|--------|
| `empresa_config` | Configuración global (1 fila, `id = 1`). No referencia otras tablas. |
| `producciones` | Entidad raíz del módulo producción. |

## Vistas (dependen de tablas)

| Vista | Origen |
|-------|--------|
| `v_producciones_activas` | `producciones` WHERE `finalizada = 0` |
| `v_producciones_historial` | `producciones` WHERE `finalizada = 1` |
| `v_ventas_activas` | `ventas` WHERE `pago_confirmado = 0` |
| `v_ventas_historial` | `ventas` WHERE `pago_confirmado = 1` |
| `v_inventario_stock` | `inventario_productos` ordenado por categoría |

## Módulos del proyecto ↔ tablas

| Módulo frontend | Tablas |
|-----------------|--------|
| Auth / Perfil | `usuarios`, `sesiones` |
| Empresa / branding | `empresa_config` |
| Producción | `producciones`, `produccion_cortes` |
| Ventas | `ventas`, `venta_variedades` |
| Inventario | `inventario_productos`, `inventario_movimientos` |

## Archivos

- `turpial_dorado_clevercloud.sql` — esquema completo + datos iniciales
- `aplicar_relaciones.sql` — solo llaves foráneas (re-aplicar en Clever Cloud)
- `agroapp_er.svg` — diagrama visual (generar con `python generate_er_diagram.py`)
