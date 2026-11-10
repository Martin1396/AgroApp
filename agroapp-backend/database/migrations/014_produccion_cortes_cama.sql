-- Cama asociada a cada corte (una producción tiene rango de camas; cada cama registra sus cortes)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/014_produccion_cortes_cama.sql

SET NAMES utf8mb4;

SET @col_cama = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'produccion_cortes'
    AND COLUMN_NAME = 'cama'
);

SET @sql = IF(@col_cama = 0,
  'ALTER TABLE `produccion_cortes`
     ADD COLUMN `cama` INT UNSIGNED NULL COMMENT ''Número de cama del corte'' AFTER `tallos_desechados`,
     ADD KEY `idx_cortes_cama` (`produccion_id`, `cama`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
