-- =============================================================================
-- Turpial Dorado — Esquema de base de datos relacional
-- =============================================================================
-- La aplicación React actual persiste datos en localStorage del navegador.
-- Este script modela la misma información en SQL (MySQL 8 / MariaDB 10.5+).
--
-- Ejecutar:
--   CREATE DATABASE turpial_dorado CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE turpial_dorado;
--   SOURCE turpial_dorado.sql;
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Usuarios y autenticación
-- -----------------------------------------------------------------------------

CREATE TABLE usuarios (
  cedula            VARCHAR(20)  NOT NULL,
  nombre            VARCHAR(100) NOT NULL,
  apellido          VARCHAR(100) NOT NULL,
  password_hash     VARCHAR(255) NOT NULL COMMENT 'En la app actual se guarda texto plano; en SQL usar bcrypt/argon2',
  rol               ENUM('administrador', 'trabajador') NOT NULL DEFAULT 'trabajador',
  activo            TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (cedula),
  KEY idx_usuarios_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sesiones (
  id                CHAR(36)     NOT NULL,
  usuario_cedula    VARCHAR(20)  NOT NULL,
  token_hash        VARCHAR(255) NOT NULL,
  expira_en         DATETIME(3)  NOT NULL,
  creado_en         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_sesiones_usuario (usuario_cedula),
  KEY idx_sesiones_expira (expira_en),
  CONSTRAINT fk_sesiones_usuario
    FOREIGN KEY (usuario_cedula) REFERENCES usuarios (cedula)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Configuración de la empresa (turpial_empresa)
-- -----------------------------------------------------------------------------

CREATE TABLE empresa_config (
  id                    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  nombre_principal      VARCHAR(80)  NOT NULL DEFAULT 'TURPIAL',
  nombre_secundario     VARCHAR(80)  NOT NULL DEFAULT 'DORADO',
  color_nombre_principal CHAR(7)     NOT NULL DEFAULT '#1a3d2e',
  color_nombre_secundario CHAR(7)    NOT NULL DEFAULT '#d4a843',
  eslogan               VARCHAR(160) NOT NULL DEFAULT 'GESTIÓN AGRÍCOLA INTELIGENTE',
  logo_principal        MEDIUMTEXT   NULL COMMENT 'URL o data URL base64',
  logo_sidebar          MEDIUMTEXT   NULL COMMENT 'URL o data URL base64',
  color_verde_oscuro    CHAR(7)      NOT NULL DEFAULT '#1a3d2e',
  color_verde_medio     CHAR(7)      NOT NULL DEFAULT '#2d5a45',
  color_verde_claro     CHAR(7)      NOT NULL DEFAULT '#3d7a5c',
  color_dorado          CHAR(7)      NOT NULL DEFAULT '#d4a843',
  color_dorado_claro    CHAR(7)      NOT NULL DEFAULT '#e8c468',
  color_dorado_oscuro   CHAR(7)      NOT NULL DEFAULT '#b8922f',
  color_fondo_crema     CHAR(7)      NOT NULL DEFAULT '#f5f0e6',
  color_fondo_superior  CHAR(7)      NOT NULL DEFAULT '#f8f6f0',
  color_fondo_tarjetas  CHAR(7)      NOT NULL DEFAULT '#fafaf8',
  color_texto_principal CHAR(7)      NOT NULL DEFAULT '#1a2e24',
  color_texto_secundario CHAR(7)     NOT NULL DEFAULT '#6b7c72',
  color_bordes          CHAR(7)      NOT NULL DEFAULT '#d8e0da',
  actualizado_en        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT chk_empresa_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Producción (turpial_producciones + cortes anidados)
-- -----------------------------------------------------------------------------

CREATE TABLE producciones (
  id                  CHAR(36)     NOT NULL,
  secuencia           INT UNSIGNED NOT NULL,
  codigo              CHAR(5)      NOT NULL COMMENT 'Ej: 00001',
  desde_cama          INT UNSIGNED NOT NULL,
  hasta_cama          INT UNSIGNED NOT NULL,
  cantidad_plantas    INT UNSIGNED NULL,
  finalizada          TINYINT(1)   NOT NULL DEFAULT 0,
  creado_en           DATETIME(3)  NOT NULL,
  fecha_finalizacion  DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_producciones_secuencia (secuencia),
  UNIQUE KEY uq_producciones_codigo (codigo),
  KEY idx_producciones_activas (finalizada, creado_en),
  KEY idx_producciones_camas (desde_cama, hasta_cama),
  CONSTRAINT chk_produccion_camas CHECK (desde_cama <= hasta_cama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE produccion_cortes (
  id                  CHAR(36)     NOT NULL,
  produccion_id       CHAR(36)     NOT NULL,
  secuencia           INT UNSIGNED NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  fecha               DATETIME(3)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_corte_secuencia (produccion_id, secuencia),
  KEY idx_cortes_produccion (produccion_id),
  CONSTRAINT fk_cortes_produccion
    FOREIGN KEY (produccion_id) REFERENCES producciones (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_corte_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Ventas (turpial_ventas + variedades anidadas)
-- -----------------------------------------------------------------------------

CREATE TABLE ventas (
  id                      CHAR(36)     NOT NULL,
  secuencia               INT UNSIGNED NOT NULL,
  cliente                 VARCHAR(200) NOT NULL,
  tipo_flor               ENUM('exportacion', 'nacional') NULL,
  moneda                  ENUM('cop', 'usd') NOT NULL DEFAULT 'cop',
  precio_venta            DECIMAL(14, 2) NOT NULL DEFAULT 0,
  produccion_id           CHAR(36)     NULL,
  produccion_etiqueta     VARCHAR(120) NULL COMMENT 'Etiqueta mostrada en UI, ej: Producción 00001',
  comprobante_pago        MEDIUMTEXT   NULL COMMENT 'PDF/imagen en base64 o ruta de archivo',
  comprobante_nombre      VARCHAR(255) NULL,
  pago_confirmado         TINYINT(1)   NOT NULL DEFAULT 0,
  creado_en               DATETIME(3)  NOT NULL,
  fecha_pago_confirmado   DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ventas_secuencia (secuencia),
  KEY idx_ventas_activas (pago_confirmado, secuencia),
  KEY idx_ventas_produccion (produccion_id),
  CONSTRAINT fk_ventas_produccion
    FOREIGN KEY (produccion_id) REFERENCES producciones (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE venta_variedades (
  id                  CHAR(36)     NOT NULL,
  venta_id            CHAR(36)     NOT NULL,
  orden               INT UNSIGNED NOT NULL,
  nombre              VARCHAR(120) NOT NULL,
  tallos              INT UNSIGNED NOT NULL,
  precio_por_unidad   DECIMAL(14, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variedad_orden (venta_id, orden),
  KEY idx_variedades_venta (venta_id),
  CONSTRAINT fk_variedades_venta
    FOREIGN KEY (venta_id) REFERENCES ventas (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_variedad_tallos CHECK (tallos > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Inventario (turpial_inventario_productos + turpial_inventario_movimientos)
-- -----------------------------------------------------------------------------

CREATE TABLE inventario_productos (
  id                  CHAR(36)     NOT NULL,
  codigo              VARCHAR(10)  NOT NULL COMMENT 'Q1, A2, H3 por categoría',
  nombre              VARCHAR(200) NOT NULL,
  categoria           ENUM('quimico', 'abono', 'herramienta') NOT NULL,
  unidad              VARCHAR(40)  NOT NULL DEFAULT 'unidad',
  stock               INT UNSIGNED NOT NULL DEFAULT 0,
  descripcion         TEXT         NULL,
  creado_en           DATETIME(3)  NOT NULL,
  creado_por_cedula   VARCHAR(20)  NULL,
  creado_por_nombre   VARCHAR(200) NULL,
  creado_por_rol      ENUM('administrador', 'trabajador') NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventario_codigo (codigo),
  KEY idx_inventario_categoria (categoria, codigo),
  KEY idx_inventario_creador (creado_por_cedula),
  CONSTRAINT fk_inventario_creador
    FOREIGN KEY (creado_por_cedula) REFERENCES usuarios (cedula)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventario_movimientos (
  id                  CHAR(36)     NOT NULL,
  tipo                ENUM('ingreso', 'salida') NOT NULL,
  producto_id         CHAR(36)     NOT NULL,
  producto_codigo     VARCHAR(10)  NOT NULL COMMENT 'Snapshot al momento del movimiento',
  producto_nombre     VARCHAR(200) NOT NULL,
  categoria           ENUM('quimico', 'abono', 'herramienta') NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  unidad              VARCHAR(40)  NOT NULL,
  stock_resultante    INT UNSIGNED NOT NULL,
  nota                VARCHAR(500) NULL,
  fecha               DATETIME(3)  NOT NULL,
  usuario_cedula      VARCHAR(20)  NULL,
  usuario_nombre      VARCHAR(200) NULL,
  usuario_rol         ENUM('administrador', 'trabajador') NULL,
  PRIMARY KEY (id),
  KEY idx_movimientos_tipo_fecha (tipo, fecha DESC),
  KEY idx_movimientos_producto (producto_id),
  KEY idx_movimientos_usuario (usuario_cedula),
  CONSTRAINT fk_movimientos_producto
    FOREIGN KEY (producto_id) REFERENCES inventario_productos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_movimientos_usuario
    FOREIGN KEY (usuario_cedula) REFERENCES usuarios (cedula)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_movimiento_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Vistas útiles (equivalentes a la lógica de la app)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_producciones_activas AS
SELECT *
FROM producciones
WHERE finalizada = 0
ORDER BY creado_en DESC;

CREATE OR REPLACE VIEW v_producciones_historial AS
SELECT *
FROM producciones
WHERE finalizada = 1
ORDER BY fecha_finalizacion DESC;

CREATE OR REPLACE VIEW v_ventas_activas AS
SELECT *
FROM ventas
WHERE pago_confirmado = 0
ORDER BY secuencia DESC;

CREATE OR REPLACE VIEW v_ventas_historial AS
SELECT *
FROM ventas
WHERE pago_confirmado = 1
ORDER BY fecha_pago_confirmado DESC;

CREATE OR REPLACE VIEW v_inventario_stock AS
SELECT
  p.*,
  CASE p.categoria
    WHEN 'quimico' THEN 1
    WHEN 'abono' THEN 2
    WHEN 'herramienta' THEN 3
  END AS orden_categoria
FROM inventario_productos p
ORDER BY orden_categoria, p.codigo;

-- -----------------------------------------------------------------------------
-- Datos iniciales
-- -----------------------------------------------------------------------------

INSERT INTO empresa_config (id) VALUES (1)
ON DUPLICATE KEY UPDATE id = id;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Mapeo localStorage → tablas SQL
-- =============================================================================
-- turpial_usuarios              → usuarios
-- turpial_session               → sesiones (o JWT en backend)
-- turpial_empresa               → empresa_config
-- turpial_producciones          → producciones + produccion_cortes
-- turpial_ventas                → ventas + venta_variedades
-- turpial_inventario_productos  → inventario_productos
-- turpial_inventario_movimientos→ inventario_movimientos
-- turpial_recordar_sesion       → preferencia del cliente (cookie/local)
-- turpial_cedula                → preferencia del cliente (cookie/local)
-- =============================================================================
