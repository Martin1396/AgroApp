-- =============================================================================
-- TURPIAL DORADO / AGROAPP — Script completo para XAMPP (phpMyAdmin)
-- =============================================================================
-- Compatible: MySQL 5.7+ / MariaDB 10.3+ (XAMPP)
--
-- CÓMO IMPORTAR EN XAMPP:
--   1. Abre XAMPP → Start Apache y MySQL
--   2. Ve a http://localhost/phpmyadmin
--   3. Pestaña "Importar" → Elegir archivo → este .sql → Continuar
--      (O pestaña SQL → pegar todo y ejecutar)
--
-- El script crea la base `turpial_dorado`, las 9 tablas, llaves primarias,
-- llaves foráneas y 5 vistas.
-- =============================================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. BASE DE DATOS
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `turpial_dorado`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `turpial_dorado`;

-- -----------------------------------------------------------------------------
-- 2. LIMPIEZA (permite volver a importar sin error)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS `v_inventario_stock`;
DROP VIEW IF EXISTS `v_ventas_historial`;
DROP VIEW IF EXISTS `v_ventas_activas`;
DROP VIEW IF EXISTS `v_producciones_historial`;
DROP VIEW IF EXISTS `v_producciones_activas`;

DROP TABLE IF EXISTS `inventario_movimientos`;
DROP TABLE IF EXISTS `inventario_productos`;
DROP TABLE IF EXISTS `venta_variedades`;
DROP TABLE IF EXISTS `ventas`;
DROP TABLE IF EXISTS `produccion_cortes`;
DROP TABLE IF EXISTS `producciones`;
DROP TABLE IF EXISTS `sesiones`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `empresa_config`;

-- =============================================================================
-- 3. TABLAS (orden: padres primero, hijos después)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 USUARIOS — PK: cedula
-- -----------------------------------------------------------------------------
CREATE TABLE `usuarios` (
  `cedula`         VARCHAR(20)  NOT NULL,
  `nombre`         VARCHAR(100) NOT NULL,
  `apellido`       VARCHAR(100) NOT NULL,
  `password_hash`  VARCHAR(255) NOT NULL COMMENT 'Usar bcrypt/argon2 en producción',
  `rol`            ENUM('administrador', 'trabajador') NOT NULL DEFAULT 'trabajador',
  `activo`         TINYINT(1)   NOT NULL DEFAULT 1,
  `creado_en`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cedula`),
  KEY `idx_usuarios_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3.2 SESIONES — PK: id | FK → usuarios(cedula)
-- -----------------------------------------------------------------------------
CREATE TABLE `sesiones` (
  `id`             CHAR(36)     NOT NULL,
  `usuario_cedula` VARCHAR(20)  NOT NULL,
  `token_hash`     VARCHAR(255) NOT NULL,
  `expira_en`      DATETIME     NOT NULL,
  `creado_en`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sesiones_usuario` (`usuario_cedula`),
  KEY `idx_sesiones_expira` (`expira_en`),
  CONSTRAINT `fk_sesiones_usuario`
    FOREIGN KEY (`usuario_cedula`) REFERENCES `usuarios` (`cedula`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3.3 EMPRESA_CONFIG — PK: id (solo 1 fila permitida)
-- -----------------------------------------------------------------------------
CREATE TABLE `empresa_config` (
  `id`                     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `nombre_principal`       VARCHAR(80)  NOT NULL DEFAULT 'TURPIAL',
  `nombre_secundario`      VARCHAR(80)  NOT NULL DEFAULT 'DORADO',
  `color_nombre_principal` CHAR(7)      NOT NULL DEFAULT '#1a2e24',
  `color_nombre_secundario` CHAR(7)     NOT NULL DEFAULT '#d4a843',
  `eslogan`                VARCHAR(160) NOT NULL DEFAULT 'GESTIÓN AGRÍCOLA INTELIGENTE',
  `logo_principal`         MEDIUMTEXT   NULL,
  `logo_sidebar`           MEDIUMTEXT   NULL,
  `color_verde_oscuro`     CHAR(7)      NOT NULL DEFAULT '#1a3d2e',
  `color_verde_medio`      CHAR(7)      NOT NULL DEFAULT '#2d5a45',
  `color_verde_claro`      CHAR(7)      NOT NULL DEFAULT '#3d7a5c',
  `color_dorado`           CHAR(7)      NOT NULL DEFAULT '#d4a843',
  `color_dorado_claro`     CHAR(7)      NOT NULL DEFAULT '#e8c468',
  `color_dorado_oscuro`    CHAR(7)      NOT NULL DEFAULT '#b8922f',
  `color_fondo_crema`      CHAR(7)      NOT NULL DEFAULT '#f5f0e6',
  `color_fondo_superior`   CHAR(7)      NOT NULL DEFAULT '#f8f6f0',
  `color_fondo_tarjetas`   CHAR(7)      NOT NULL DEFAULT '#fafaf8',
  `color_texto_principal`  CHAR(7)      NOT NULL DEFAULT '#1a2e24',
  `color_texto_secundario` CHAR(7)      NOT NULL DEFAULT '#6b7c72',
  `color_bordes`           CHAR(7)      NOT NULL DEFAULT '#d8e0da',
  `actualizado_en`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3.4 PRODUCCIONES — PK: id
-- -----------------------------------------------------------------------------
CREATE TABLE `producciones` (
  `id`                 CHAR(36)     NOT NULL,
  `secuencia`          INT UNSIGNED NOT NULL,
  `codigo`             CHAR(5)      NOT NULL COMMENT 'Ej: 00001',
  `desde_cama`         INT UNSIGNED NOT NULL,
  `hasta_cama`         INT UNSIGNED NOT NULL,
  `cantidad_plantas`   INT UNSIGNED NULL,
  `finalizada`         TINYINT(1)   NOT NULL DEFAULT 0,
  `creado_en`          DATETIME     NOT NULL,
  `fecha_finalizacion` DATETIME     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_producciones_secuencia` (`secuencia`),
  UNIQUE KEY `uq_producciones_codigo` (`codigo`),
  KEY `idx_producciones_activas` (`finalizada`, `creado_en`),
  KEY `idx_producciones_camas` (`desde_cama`, `hasta_cama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3.5 PRODUCCION_CORTES — PK: id | FK → producciones(id)
-- -----------------------------------------------------------------------------
CREATE TABLE `produccion_cortes` (
  `id`            CHAR(36)     NOT NULL,
  `produccion_id` CHAR(36)     NOT NULL,
  `secuencia`     INT UNSIGNED NOT NULL,
  `cantidad`      INT UNSIGNED NOT NULL,
  `fecha`         DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_corte_secuencia` (`produccion_id`, `secuencia`),
  KEY `idx_cortes_produccion` (`produccion_id`),
  CONSTRAINT `fk_cortes_produccion`
    FOREIGN KEY (`produccion_id`) REFERENCES `producciones` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3.6 VENTAS — PK: id | FK → producciones(id) opcional
-- -----------------------------------------------------------------------------
CREATE TABLE `ventas` (
  `id`                    CHAR(36)     NOT NULL,
  `secuencia`             INT UNSIGNED NOT NULL,
  `cliente`               VARCHAR(200) NOT NULL,
  `tipo_flor`             ENUM('exportacion', 'nacional') NULL,
  `moneda`                ENUM('cop', 'usd') NOT NULL DEFAULT 'cop',
  `precio_venta`          DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `produccion_id`         CHAR(36)     NULL,
  `produccion_etiqueta`   VARCHAR(120) NULL,
  `comprobante_pago`      MEDIUMTEXT   NULL,
  `comprobante_nombre`    VARCHAR(255) NULL,
  `pago_confirmado`       TINYINT(1)   NOT NULL DEFAULT 0,
  `creado_en`             DATETIME     NOT NULL,
  `fecha_pago_confirmado` DATETIME     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ventas_secuencia` (`secuencia`),
  KEY `idx_ventas_activas` (`pago_confirmado`, `secuencia`),
  KEY `idx_ventas_produccion` (`produccion_id`),
  CONSTRAINT `fk_ventas_produccion`
    FOREIGN KEY (`produccion_id`) REFERENCES `producciones` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3.7 VENTA_VARIEDADES — PK: id | FK → ventas(id)
-- -----------------------------------------------------------------------------
CREATE TABLE `venta_variedades` (
  `id`                CHAR(36)     NOT NULL,
  `venta_id`          CHAR(36)     NOT NULL,
  `orden`             INT UNSIGNED NOT NULL,
  `nombre`            VARCHAR(120) NOT NULL,
  `tallos`            INT UNSIGNED NOT NULL,
  `precio_por_unidad` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_variedad_orden` (`venta_id`, `orden`),
  KEY `idx_variedades_venta` (`venta_id`),
  CONSTRAINT `fk_variedades_venta`
    FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3.8 INVENTARIO_PRODUCTOS — PK: id | FK → usuarios(cedula) opcional
-- -----------------------------------------------------------------------------
CREATE TABLE `inventario_productos` (
  `id`                CHAR(36)     NOT NULL,
  `codigo`            VARCHAR(10)  NOT NULL COMMENT 'Q1 químico, A1 abono, H1 herramienta',
  `nombre`            VARCHAR(200) NOT NULL,
  `categoria`         ENUM('quimico', 'abono', 'herramienta') NOT NULL,
  `unidad`            VARCHAR(40)  NOT NULL DEFAULT 'unidad',
  `stock`             INT UNSIGNED NOT NULL DEFAULT 0,
  `descripcion`       TEXT         NULL,
  `creado_en`         DATETIME     NOT NULL,
  `creado_por_cedula` VARCHAR(20)  NULL,
  `creado_por_nombre` VARCHAR(200) NULL,
  `creado_por_rol`    ENUM('administrador', 'trabajador') NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventario_codigo` (`codigo`),
  KEY `idx_inventario_categoria` (`categoria`, `codigo`),
  KEY `idx_inventario_creador` (`creado_por_cedula`),
  CONSTRAINT `fk_inventario_creador`
    FOREIGN KEY (`creado_por_cedula`) REFERENCES `usuarios` (`cedula`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3.9 INVENTARIO_MOVIMIENTOS — PK: id
--     FK → inventario_productos(id)
--     FK → usuarios(cedula) opcional
-- -----------------------------------------------------------------------------
CREATE TABLE `inventario_movimientos` (
  `id`               CHAR(36)     NOT NULL,
  `tipo`             ENUM('ingreso', 'salida') NOT NULL,
  `producto_id`      CHAR(36)     NOT NULL,
  `producto_codigo`  VARCHAR(10)  NOT NULL,
  `producto_nombre`  VARCHAR(200) NOT NULL,
  `categoria`        ENUM('quimico', 'abono', 'herramienta') NOT NULL,
  `cantidad`         INT UNSIGNED NOT NULL,
  `unidad`           VARCHAR(40)  NOT NULL,
  `stock_resultante` INT UNSIGNED NOT NULL,
  `nota`             VARCHAR(500) NULL,
  `fecha`            DATETIME     NOT NULL,
  `usuario_cedula`   VARCHAR(20)  NULL,
  `usuario_nombre`   VARCHAR(200) NULL,
  `usuario_rol`      ENUM('administrador', 'trabajador') NULL,
  PRIMARY KEY (`id`),
  KEY `idx_movimientos_tipo_fecha` (`tipo`, `fecha`),
  KEY `idx_movimientos_producto` (`producto_id`),
  KEY `idx_movimientos_usuario` (`usuario_cedula`),
  CONSTRAINT `fk_movimientos_producto`
    FOREIGN KEY (`producto_id`) REFERENCES `inventario_productos` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_movimientos_usuario`
    FOREIGN KEY (`usuario_cedula`) REFERENCES `usuarios` (`cedula`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. VISTAS
-- =============================================================================

CREATE VIEW `v_producciones_activas` AS
SELECT * FROM `producciones`
WHERE `finalizada` = 0
ORDER BY `creado_en` DESC;

CREATE VIEW `v_producciones_historial` AS
SELECT * FROM `producciones`
WHERE `finalizada` = 1
ORDER BY `fecha_finalizacion` DESC;

CREATE VIEW `v_ventas_activas` AS
SELECT * FROM `ventas`
WHERE `pago_confirmado` = 0
ORDER BY `secuencia` DESC;

CREATE VIEW `v_ventas_historial` AS
SELECT * FROM `ventas`
WHERE `pago_confirmado` = 1
ORDER BY `fecha_pago_confirmado` DESC;

CREATE VIEW `v_inventario_stock` AS
SELECT
  p.*,
  CASE p.`categoria`
    WHEN 'quimico' THEN 1
    WHEN 'abono' THEN 2
    WHEN 'herramienta' THEN 3
  END AS `orden_categoria`
FROM `inventario_productos` p
ORDER BY `orden_categoria`, p.`codigo`;

-- =============================================================================
-- 5. DATOS INICIALES
-- =============================================================================

INSERT INTO `empresa_config` (`id`) VALUES (1);

-- Usuario administrador de ejemplo (opcional — quitar si no lo necesitas)
-- Contraseña en la app actual: la que registres; aquí solo ejemplo de estructura
INSERT INTO `usuarios` (
  `cedula`, `nombre`, `apellido`, `password_hash`, `rol`, `activo`
) VALUES (
  '1036401824',
  'Administrador',
  'Turpial',
  'CAMBIAR_POR_HASH_SEGURO',
  'administrador',
  1
) ON DUPLICATE KEY UPDATE `cedula` = `cedula`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- RESUMEN DE RELACIONES (LLAVES FORÁNEAS)
-- =============================================================================
--
--  sesiones.usuario_cedula          → usuarios.cedula           (CASCADE)
--  produccion_cortes.produccion_id  → producciones.id           (CASCADE)
--  ventas.produccion_id             → producciones.id           (SET NULL)
--  venta_variedades.venta_id        → ventas.id                 (CASCADE)
--  inventario_productos.creado_por_cedula → usuarios.cedula     (SET NULL)
--  inventario_movimientos.producto_id     → inventario_productos.id (RESTRICT)
--  inventario_movimientos.usuario_cedula  → usuarios.cedula     (SET NULL)
--
-- =============================================================================
