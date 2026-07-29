-- Rondas rotativas dentro de cada combo (semana 1, 2, 3…)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/009_bitacora_combo_rondas.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `bitacora_combo_rondas` (
  `id`        CHAR(36)     NOT NULL,
  `combo_id`  CHAR(36)     NOT NULL,
  `orden`     SMALLINT     NOT NULL DEFAULT 1,
  `nombre`    VARCHAR(80)  NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_combo_rondas_combo` (`combo_id`, `orden`),
  CONSTRAINT `fk_combo_rondas_combo`
    FOREIGN KEY (`combo_id`) REFERENCES `bitacora_combos` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrar productos existentes a una ronda por combo
INSERT INTO `bitacora_combo_rondas` (`id`, `combo_id`, `orden`, `nombre`)
SELECT UUID(), c.id, 1, 'Ronda 1'
FROM `bitacora_combos` c
WHERE c.activo = 1
  AND EXISTS (SELECT 1 FROM `bitacora_combo_productos` p WHERE p.combo_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM `bitacora_combo_rondas` r WHERE r.combo_id = c.id);

-- Agregar ronda_id a productos (si la columna no existe aún)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_combo_productos'
    AND COLUMN_NAME = 'ronda_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `bitacora_combo_productos` ADD COLUMN `ronda_id` CHAR(36) NULL AFTER `combo_id`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `bitacora_combo_productos` p
INNER JOIN `bitacora_combo_rondas` r ON r.combo_id = p.combo_id AND r.orden = 1
SET p.ronda_id = r.id
WHERE p.ronda_id IS NULL;

-- Combos sin productos: crear ronda vacía por defecto
INSERT INTO `bitacora_combo_rondas` (`id`, `combo_id`, `orden`, `nombre`)
SELECT UUID(), c.id, 1, 'Ronda 1'
FROM `bitacora_combos` c
WHERE c.activo = 1
  AND NOT EXISTS (SELECT 1 FROM `bitacora_combo_rondas` r WHERE r.combo_id = c.id);

-- ronda_actual en combos (índice 0-based de la ronda que toca)
SET @col_ronda_actual = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_combos'
    AND COLUMN_NAME = 'ronda_actual'
);
SET @sql2 = IF(@col_ronda_actual = 0,
  'ALTER TABLE `bitacora_combos` ADD COLUMN `ronda_actual` SMALLINT NOT NULL DEFAULT 0 AFTER `descripcion`',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- ronda_indice en completados
SET @col_ronda_indice = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_combo_completados'
    AND COLUMN_NAME = 'ronda_indice'
);
SET @sql3 = IF(@col_ronda_indice = 0,
  'ALTER TABLE `bitacora_combo_completados` ADD COLUMN `ronda_indice` SMALLINT NULL AFTER `fecha`',
  'SELECT 1'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- FK productos → rondas (mantener combo_id por compatibilidad hasta limpieza futura)
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_combo_productos'
    AND CONSTRAINT_NAME = 'fk_combo_productos_ronda'
);
SET @sql4 = IF(@fk_exists = 0,
  'ALTER TABLE `bitacora_combo_productos`
     ADD CONSTRAINT `fk_combo_productos_ronda`
     FOREIGN KEY (`ronda_id`) REFERENCES `bitacora_combo_rondas` (`id`)
     ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;
