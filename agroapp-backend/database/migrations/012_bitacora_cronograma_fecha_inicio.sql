-- Fecha de inicio del cronograma semanal (rotación de rondas)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/012_bitacora_cronograma_fecha_inicio.sql

SET NAMES utf8mb4;

SET @col_fecha_inicio = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_combo_cronograma'
    AND COLUMN_NAME = 'fecha_inicio'
);

SET @sql = IF(@col_fecha_inicio = 0,
  'ALTER TABLE `bitacora_combo_cronograma`
     ADD COLUMN `fecha_inicio` DATE NULL COMMENT ''Primera semana de rotación'' AFTER `dias_semana`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `bitacora_combo_cronograma`
SET `fecha_inicio` = DATE(`actualizado_en`)
WHERE `fecha_inicio` IS NULL;
