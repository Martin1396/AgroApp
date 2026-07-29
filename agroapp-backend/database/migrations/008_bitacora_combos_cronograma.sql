-- Combos de bitácora + cronograma + completados
-- mysql "$MYSQL_ADDON_URI" < database/migrations/008_bitacora_combos_cronograma.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `bitacora_combos` (
  `id`                    CHAR(36)     NOT NULL,
  `nombre`                VARCHAR(120) NOT NULL,
  `descripcion`           TEXT         NULL,
  `activo`                TINYINT(1)   NOT NULL DEFAULT 1,
  `creado_en`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `creado_por_cedula`     VARCHAR(20)  NULL,
  `creado_por_nombre`     VARCHAR(160) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bitacora_combos_activo` (`activo`, `nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bitacora_combo_productos` (
  `id`        CHAR(36)     NOT NULL,
  `combo_id`  CHAR(36)     NOT NULL,
  `orden`     SMALLINT     NOT NULL DEFAULT 1,
  `nombre`    VARCHAR(120) NOT NULL,
  `proposito` VARCHAR(255) NOT NULL DEFAULT '',
  `dosis`     VARCHAR(80)  NULL,
  PRIMARY KEY (`id`),
  KEY `idx_combo_productos_combo` (`combo_id`),
  CONSTRAINT `fk_combo_productos_combo`
    FOREIGN KEY (`combo_id`) REFERENCES `bitacora_combos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bitacora_combo_cronograma` (
  `id`           CHAR(36)     NOT NULL,
  `combo_id`     CHAR(36)     NOT NULL,
  `dias_semana`  JSON         NOT NULL COMMENT 'Array 0-6 (Dom-Sáb, JS getDay)',
  `activo`       TINYINT(1)   NOT NULL DEFAULT 1,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cronograma_combo` (`combo_id`),
  CONSTRAINT `fk_cronograma_combo`
    FOREIGN KEY (`combo_id`) REFERENCES `bitacora_combos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bitacora_combo_completados` (
  `id`                CHAR(36)  NOT NULL,
  `combo_id`          CHAR(36)  NOT NULL,
  `fecha`             DATE      NOT NULL,
  `completado_en`     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_cedula`    VARCHAR(20)  NULL,
  `usuario_nombre`    VARCHAR(160) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_combo_completado_fecha` (`combo_id`, `fecha`),
  KEY `idx_combo_completado_fecha` (`fecha`),
  CONSTRAINT `fk_combo_completado_combo`
    FOREIGN KEY (`combo_id`) REFERENCES `bitacora_combos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
