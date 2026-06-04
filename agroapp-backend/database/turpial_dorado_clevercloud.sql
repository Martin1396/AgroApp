-- =============================================================================
-- TURPIAL DORADO / AGROAPP — Script para CLEVER CLOUD (MySQL add-on)
-- =============================================================================
-- Compatible: Clever Cloud MySQL 8.0 / 8.4 (Percona Server)
--
-- IMPORTANTE:
--   En Clever Cloud la base de datos YA está creada por el add-on.
--   NO uses CREATE DATABASE ni USE — importa este script directamente
--   en la base que te asigna Clever Cloud.
--
-- PASOS EN CLEVER CLOUD:
--   1. Console → Add-ons → Create → MySQL
--   2. Vincula el add-on a tu aplicación (Environment variables)
--   3. Abre phpMyAdmin desde el panel del add-on
--   4. Importa este archivo .sql
--
-- VARIABLES DE ENTORNO (automáticas al vincular el add-on):
--   MYSQL_ADDON_HOST
--   MYSQL_ADDON_PORT
--   MYSQL_ADDON_DB
--   MYSQL_ADDON_USER
--   MYSQL_ADDON_PASSWORD
--   MYSQL_ADDON_URI          ← cadena completa de conexión
--   MYSQL_ADDON_VERSION
--
-- IMPORTAR POR TERMINAL (desde tu PC):
--   mysql --host=MYSQL_ADDON_HOST --port=MYSQL_ADDON_PORT \
--     --user=MYSQL_ADDON_USER --password=MYSQL_ADDON_PASSWORD \
--     MYSQL_ADDON_DB < turpial_dorado_clevercloud.sql
--
-- O con la URI:
--   mysql "MYSQL_ADDON_URI" < turpial_dorado_clevercloud.sql
--
-- =============================================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- LIMPIEZA (solo primera instalación o re-deploy completo)
-- ATENCIÓN: esto borra todos los datos existentes en estas tablas.
-- Comenta esta sección si ya tienes datos en producción.
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
-- TABLAS (orden: padres primero, hijos después)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USUARIOS — PK: cedula
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
-- SESIONES — PK: id | FK → usuarios(cedula)
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
-- EMPRESA_CONFIG — PK: id (solo 1 fila)
-- -----------------------------------------------------------------------------
CREATE TABLE `empresa_config` (
  `id`                     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `nombre_principal`       VARCHAR(80)  NOT NULL DEFAULT 'TURPIAL',
  `nombre_secundario`      VARCHAR(80)  NOT NULL DEFAULT 'DORADO',
  `color_nombre_principal` CHAR(7)      NOT NULL DEFAULT '#1a1a1a',
  `color_nombre_secundario` CHAR(7)     NOT NULL DEFAULT '#d4a843',
  `escala_nombre`          TINYINT UNSIGNED NOT NULL DEFAULT 100,
  `escala_logo`            TINYINT UNSIGNED NOT NULL DEFAULT 100,
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
-- PRODUCCIONES — PK: id
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
-- PRODUCCION_CORTES — PK: id | FK → producciones(id)
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
-- VENTAS — PK: id | FK → producciones(id) opcional
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
-- VENTA_VARIEDADES — PK: id | FK → ventas(id)
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
-- INVENTARIO_PRODUCTOS — PK: id | FK → usuarios(cedula) opcional
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
-- INVENTARIO_MOVIMIENTOS — PK: id
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
-- VISTAS
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
-- DATOS INICIALES
-- =============================================================================

INSERT INTO `empresa_config` (
  `id`,
  `nombre_principal`,
  `nombre_secundario`,
  `color_nombre_principal`,
  `color_nombre_secundario`,
  `escala_nombre`,
  `escala_logo`,
  `eslogan`,
  `logo_principal`,
  `logo_sidebar`,
  `color_verde_oscuro`,
  `color_verde_medio`,
  `color_verde_claro`,
  `color_dorado`,
  `color_dorado_claro`,
  `color_dorado_oscuro`,
  `color_fondo_crema`,
  `color_fondo_superior`,
  `color_fondo_tarjetas`,
  `color_texto_principal`,
  `color_texto_secundario`,
  `color_bordes`
) VALUES (
  1,
  'TURPIAL',
  'DORADO',
  '#1a1a1a',
  '#d4a843',
  100,
  100,
  'GESTIÓN AGRÍCOLA INTELIGENTE',
  '/logo-turpial.png',
  '/logo-turpial-sidebar.png',
  '#1a3d2e',
  '#2d5a45',
  '#3d7a5c',
  '#d4a843',
  '#e8c468',
  '#b8922f',
  '#f5f0e6',
  '#f8f6f0',
  '#fafaf8',
  '#1a2e24',
  '#6b7c72',
  '#d8e0da'
) ON DUPLICATE KEY UPDATE `id` = `id`;

INSERT INTO `usuarios` (
  `cedula`, `nombre`, `apellido`, `password_hash`, `rol`, `activo`
) VALUES (
  '9999999999',
  'Administrador',
  'Turpial',
  '$2b$10$iM2WNSzjch0GG1QJgRdDbOV.v1Dn5m1YatTHm5Mk8fKUVeXRNEETK',
  'administrador',
  1
) ON DUPLICATE KEY UPDATE `cedula` = `cedula`;

-- -----------------------------------------------------------------------------
-- USUARIOS DE PRUEBA (contraseñas: 1234 / admin123)
-- -----------------------------------------------------------------------------
INSERT INTO `usuarios` (`cedula`, `nombre`, `apellido`, `password_hash`, `rol`, `activo`) VALUES
('1111111111', 'Usuario', 'Prueba', '$2b$10$rAHF5gOPGzaaeO0YEUb1pO4gb0AYYjVckWwSvtRAiqiJx.6B4JA5a', 'trabajador', 1),
('2222222222', 'Admin', 'Prueba',  '$2b$10$iM2WNSzjch0GG1QJgRdDbOV.v1Dn5m1YatTHm5Mk8fKUVeXRNEETK', 'administrador', 1)
ON DUPLICATE KEY UPDATE `cedula` = VALUES(`cedula`);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- RESUMEN DE RELACIONES (LLAVES FORÁNEAS)
-- =============================================================================
--
--  sesiones.usuario_cedula               → usuarios.cedula              (CASCADE)
--  produccion_cortes.produccion_id       → producciones.id              (CASCADE)
--  ventas.produccion_id                  → producciones.id              (SET NULL)
--  venta_variedades.venta_id             → ventas.id                    (CASCADE)
--  inventario_productos.creado_por_cedula → usuarios.cedula             (SET NULL)
--  inventario_movimientos.producto_id    → inventario_productos.id      (RESTRICT)
--  inventario_movimientos.usuario_cedula → usuarios.cedula              (SET NULL)
--
-- CONEXIÓN DESDE TU BACKEND (ejemplo Node.js):
--   host:     process.env.MYSQL_ADDON_HOST
--   port:     process.env.MYSQL_ADDON_PORT
--   database: process.env.MYSQL_ADDON_DB
--   user:     process.env.MYSQL_ADDON_USER
--   password: process.env.MYSQL_ADDON_PASSWORD
--
-- =============================================================================
