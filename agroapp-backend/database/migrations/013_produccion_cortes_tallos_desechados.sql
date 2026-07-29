-- Tallos desechados por corte (descarte vs flores útiles)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/013_produccion_cortes_tallos_desechados.sql

SET NAMES utf8mb4;

SET @col_tallos = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'produccion_cortes'
    AND COLUMN_NAME = 'tallos_desechados'
);

SET @sql = IF(@col_tallos = 0,
  'ALTER TABLE `produccion_cortes`
     ADD COLUMN `tallos_desechados` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT ''Tallos eliminados/desechados'' AFTER `cantidad`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
