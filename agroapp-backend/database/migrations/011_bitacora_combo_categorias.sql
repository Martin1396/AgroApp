-- Categorías dinámicas para combos (Follaje, Flor, y más)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/011_bitacora_combo_categorias.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `bitacora_combo_categorias` (
  `id`         CHAR(36)     NOT NULL,
  `nombre`     VARCHAR(80)  NOT NULL,
  `orden`      SMALLINT     NOT NULL DEFAULT 1,
  `activo`     TINYINT(1)   NOT NULL DEFAULT 1,
  `creado_en`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_combo_cat_orden` (`activo`, `orden`, `nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bitacora_combo_categorias` (`id`, `nombre`, `orden`)
SELECT UUID(), 'Follaje', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `bitacora_combo_categorias` WHERE `nombre` = 'Follaje' AND `activo` = 1);

INSERT INTO `bitacora_combo_categorias` (`id`, `nombre`, `orden`)
SELECT UUID(), 'Flor', 2
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `bitacora_combo_categorias` WHERE `nombre` = 'Flor' AND `activo` = 1);

SET @col_cat_id = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_combos'
    AND COLUMN_NAME = 'categoria_id'
);

SET @sql = IF(@col_cat_id = 0,
  'ALTER TABLE `bitacora_combos` ADD COLUMN `categoria_id` CHAR(36) NULL AFTER `descripcion`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `bitacora_combos` b
INNER JOIN `bitacora_combo_categorias` cat ON cat.nombre = 'Flor' AND cat.activo = 1
SET b.categoria_id = cat.id
WHERE b.categoria_id IS NULL
  AND (b.categoria = 'follaje' OR b.categoria IS NULL);

UPDATE `bitacora_combos` b
INNER JOIN `bitacora_combo_categorias` cat ON cat.nombre = 'Follaje' AND cat.activo = 1
SET b.categoria_id = cat.id
WHERE b.categoria_id IS NULL
  AND b.categoria = 'flor';

UPDATE `bitacora_combos` b
INNER JOIN `bitacora_combo_categorias` cat ON cat.nombre = 'Follaje' AND cat.activo = 1
SET b.categoria_id = cat.id
WHERE b.categoria_id IS NULL;

SET @fk = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_combos'
    AND CONSTRAINT_NAME = 'fk_combo_categoria'
);

SET @sql2 = IF(@fk = 0,
  'ALTER TABLE `bitacora_combos`
     ADD CONSTRAINT `fk_combo_categoria`
     FOREIGN KEY (`categoria_id`) REFERENCES `bitacora_combo_categorias` (`id`)
     ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
