-- Método de uso por producto (fertilizantes, fungicidas, etc.)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/007_inventario_metodo_uso.sql

SET NAMES utf8mb4;

ALTER TABLE `inventario_productos`
  ADD COLUMN `metodo_uso` TEXT NULL
  AFTER `descripcion`;
