-- =============================================================================
-- AGROAPP — Aplicar relaciones (llaves foráneas)
-- =============================================================================
-- Usar en Clever Cloud si las tablas existen pero SIN foreign keys.
-- Requiere MySQL 8.0.19+ (DROP FOREIGN KEY IF EXISTS).
--
--   mysql "MYSQL_ADDON_URI" < aplicar_relaciones.sql
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- sesiones → usuarios
ALTER TABLE `sesiones` DROP FOREIGN KEY IF EXISTS `fk_sesiones_usuario`;
ALTER TABLE `sesiones`
  ADD CONSTRAINT `fk_sesiones_usuario`
    FOREIGN KEY (`usuario_cedula`) REFERENCES `usuarios` (`cedula`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- produccion_cortes → producciones
ALTER TABLE `produccion_cortes` DROP FOREIGN KEY IF EXISTS `fk_cortes_produccion`;
ALTER TABLE `produccion_cortes`
  ADD CONSTRAINT `fk_cortes_produccion`
    FOREIGN KEY (`produccion_id`) REFERENCES `producciones` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ventas → producciones (opcional)
ALTER TABLE `ventas` DROP FOREIGN KEY IF EXISTS `fk_ventas_produccion`;
ALTER TABLE `ventas`
  ADD CONSTRAINT `fk_ventas_produccion`
    FOREIGN KEY (`produccion_id`) REFERENCES `producciones` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- venta_variedades → ventas
ALTER TABLE `venta_variedades` DROP FOREIGN KEY IF EXISTS `fk_variedades_venta`;
ALTER TABLE `venta_variedades`
  ADD CONSTRAINT `fk_variedades_venta`
    FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- inventario_productos → usuarios (creador opcional)
ALTER TABLE `inventario_productos` DROP FOREIGN KEY IF EXISTS `fk_inventario_creador`;
ALTER TABLE `inventario_productos`
  ADD CONSTRAINT `fk_inventario_creador`
    FOREIGN KEY (`creado_por_cedula`) REFERENCES `usuarios` (`cedula`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- inventario_movimientos → inventario_productos
ALTER TABLE `inventario_movimientos` DROP FOREIGN KEY IF EXISTS `fk_movimientos_producto`;
ALTER TABLE `inventario_movimientos`
  ADD CONSTRAINT `fk_movimientos_producto`
    FOREIGN KEY (`producto_id`) REFERENCES `inventario_productos` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- inventario_movimientos → usuarios
ALTER TABLE `inventario_movimientos` DROP FOREIGN KEY IF EXISTS `fk_movimientos_usuario`;
ALTER TABLE `inventario_movimientos`
  ADD CONSTRAINT `fk_movimientos_usuario`
    FOREIGN KEY (`usuario_cedula`) REFERENCES `usuarios` (`cedula`)
    ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar relaciones creadas:
-- SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
-- FROM information_schema.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
-- ORDER BY TABLE_NAME;
