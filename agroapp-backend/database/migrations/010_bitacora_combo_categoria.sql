-- Categoría de combo: flor | follaje
-- mysql "$MYSQL_ADDON_URI" < database/migrations/010_bitacora_combo_categoria.sql

SET NAMES utf8mb4;

SET @col = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_combos'
    AND COLUMN_NAME = 'categoria'
);

SET @sql = IF(@col = 0,
  "ALTER TABLE `bitacora_combos`
     ADD COLUMN `categoria` ENUM('flor','follaje') NOT NULL DEFAULT 'follaje'
     COMMENT 'flor=con floración; follaje=crecimiento hasta flor'
     AFTER `descripcion`",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
