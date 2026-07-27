-- Categoría fertilizante + orden de inventario
-- mysql "$MYSQL_ADDON_URI" < database/migrations/006_fertilizante_categoria.sql

SET NAMES utf8mb4;

ALTER TABLE `inventario_productos`
  MODIFY COLUMN `categoria` ENUM(
    'fertilizante',
    'fungicida',
    'insecticida',
    'abono',
    'herbicida',
    'herramienta',
    'material'
  ) NOT NULL;

ALTER TABLE `inventario_movimientos`
  MODIFY COLUMN `categoria` ENUM(
    'fertilizante',
    'fungicida',
    'insecticida',
    'abono',
    'herbicida',
    'herramienta',
    'material'
  ) NOT NULL;
