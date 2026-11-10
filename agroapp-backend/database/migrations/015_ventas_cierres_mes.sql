-- Cierres de mes de ventas (día 28, totales COP/USD con TRM)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/015_ventas_cierres_mes.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `ventas_cierres_mes` (
  `id`             CHAR(36)       NOT NULL,
  `anio`           SMALLINT UNSIGNED NOT NULL,
  `mes`            TINYINT UNSIGNED NOT NULL COMMENT '1-12',
  `periodo_inicio` DATETIME       NOT NULL,
  `periodo_fin`    DATETIME       NOT NULL,
  `trm`            DECIMAL(14, 4) NOT NULL,
  `total_cop`      DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `total_usd`      DECIMAL(16, 4) NOT NULL DEFAULT 0.00,
  `cantidad_ventas` INT UNSIGNED  NOT NULL DEFAULT 0,
  `detalle_json`   JSON           NULL,
  `cerrado_en`     DATETIME       NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cierre_anio_mes` (`anio`, `mes`),
  KEY `idx_cierres_fecha` (`cerrado_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
