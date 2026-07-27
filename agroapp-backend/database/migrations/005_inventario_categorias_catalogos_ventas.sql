-- Categorías de inventario ampliadas + catálogos de ventas
-- mysql "$MYSQL_ADDON_URI" < database/migrations/005_inventario_categorias_catalogos_ventas.sql

-- Ampliar ENUM (incluye quimico temporalmente para migrar datos viejos)
ALTER TABLE `inventario_productos`
  MODIFY COLUMN `categoria` ENUM(
    'quimico',
    'fungicida',
    'insecticida',
    'abono',
    'herbicida',
    'herramienta',
    'material'
  ) NOT NULL;

ALTER TABLE `inventario_movimientos`
  MODIFY COLUMN `categoria` ENUM(
    'quimico',
    'fungicida',
    'insecticida',
    'abono',
    'herbicida',
    'herramienta',
    'material'
  ) NOT NULL;

UPDATE `inventario_productos` SET `categoria` = 'fungicida' WHERE `categoria` = 'quimico';
UPDATE `inventario_movimientos` SET `categoria` = 'fungicida' WHERE `categoria` = 'quimico';

ALTER TABLE `inventario_productos`
  MODIFY COLUMN `categoria` ENUM(
    'fungicida',
    'insecticida',
    'abono',
    'herbicida',
    'herramienta',
    'material'
  ) NOT NULL;

ALTER TABLE `inventario_movimientos`
  MODIFY COLUMN `categoria` ENUM(
    'fungicida',
    'insecticida',
    'abono',
    'herbicida',
    'herramienta',
    'material'
  ) NOT NULL;

CREATE TABLE IF NOT EXISTS `comercializadoras` (
  `id`        CHAR(36)     NOT NULL,
  `nombre`    VARCHAR(200) NOT NULL,
  `activo`    TINYINT(1)   NOT NULL DEFAULT 1,
  `creado_en` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_comercializadoras_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `variedades_catalogo` (
  `id`        CHAR(36)     NOT NULL,
  `nombre`    VARCHAR(120) NOT NULL,
  `activo`    TINYINT(1)   NOT NULL DEFAULT 1,
  `creado_en` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_variedades_catalogo_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `empresa_config`
  ADD COLUMN `tasa_cambio_usd` DECIMAL(12, 2) NOT NULL DEFAULT 4000.00
  AFTER `color_bordes`;

UPDATE `empresa_config` SET `tasa_cambio_usd` = 4000.00 WHERE `tasa_cambio_usd` IS NULL OR `tasa_cambio_usd` = 0;
