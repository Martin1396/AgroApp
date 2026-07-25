-- Bitácora de labores del cultivo (registro histórico de aplicaciones y trabajos)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/004_bitacora_labores.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `bitacora_registros` (
  `id`                    CHAR(36)     NOT NULL,
  `secuencia`             INT UNSIGNED NOT NULL,
  `codigo`                VARCHAR(12)  NOT NULL,
  `fecha`                 DATE         NOT NULL,
  `tipo_labor`            VARCHAR(40)  NOT NULL,
  `ubicacion`             VARCHAR(120) NOT NULL DEFAULT '',
  `proposito`             TEXT         NOT NULL,
  `observaciones`         TEXT         NULL,
  `registrado_por_cedula` VARCHAR(20)  NULL,
  `registrado_por_nombre` VARCHAR(160) NULL,
  `creado_en`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bitacora_codigo` (`codigo`),
  KEY `idx_bitacora_fecha` (`fecha`),
  KEY `idx_bitacora_tipo` (`tipo_labor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bitacora_productos` (
  `id`          CHAR(36)     NOT NULL,
  `registro_id` CHAR(36)     NOT NULL,
  `orden`       SMALLINT     NOT NULL DEFAULT 1,
  `nombre`      VARCHAR(120) NOT NULL,
  `dosis`       VARCHAR(80)  NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_bitacora_prod_registro` (`registro_id`),
  CONSTRAINT `fk_bitacora_productos_registro`
    FOREIGN KEY (`registro_id`) REFERENCES `bitacora_registros` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
