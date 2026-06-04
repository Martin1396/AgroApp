-- =============================================================================
-- TURPIAL DORADO — SOLO TABLAS (para Clever Cloud / phpMyAdmin)
-- Abre este archivo en Cursor y cópialo tabla por tabla en phpMyAdmin → SQL
-- Orden: crear en este mismo orden (1 → 9)
-- =============================================================================

-- 1. USUARIOS
CREATE TABLE `usuarios` (
  `cedula`         VARCHAR(20)  NOT NULL,
  `nombre`         VARCHAR(100) NOT NULL,
  `apellido`       VARCHAR(100) NOT NULL,
  `password_hash`  VARCHAR(255) NOT NULL,
  `rol`            ENUM('administrador', 'trabajador') NOT NULL DEFAULT 'trabajador',
  `activo`         TINYINT(1)   NOT NULL DEFAULT 1,
  `creado_en`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cedula`),
  KEY `idx_usuarios_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SESIONES
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

-- 3. EMPRESA_CONFIG
CREATE TABLE `empresa_config` (
  `id`                      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `nombre_principal`        VARCHAR(80)  NOT NULL DEFAULT 'TURPIAL',
  `nombre_secundario`       VARCHAR(80)  NOT NULL DEFAULT 'DORADO',
  `color_nombre_principal`  CHAR(7)      NOT NULL DEFAULT '#1a2e24',
  `color_nombre_secundario` CHAR(7)      NOT NULL DEFAULT '#d4a843',
  `eslogan`                 VARCHAR(160) NOT NULL DEFAULT 'GESTIÓN AGRÍCOLA INTELIGENTE',
  `logo_principal`          MEDIUMTEXT   NULL,
  `logo_sidebar`            MEDIUMTEXT   NULL,
  `color_verde_oscuro`      CHAR(7)      NOT NULL DEFAULT '#1a3d2e',
  `color_verde_medio`       CHAR(7)      NOT NULL DEFAULT '#2d5a45',
  `color_verde_claro`       CHAR(7)      NOT NULL DEFAULT '#3d7a5c',
  `color_dorado`            CHAR(7)      NOT NULL DEFAULT '#d4a843',
  `color_dorado_claro`      CHAR(7)      NOT NULL DEFAULT '#e8c468',
  `color_dorado_oscuro`     CHAR(7)      NOT NULL DEFAULT '#b8922f',
  `color_fondo_crema`       CHAR(7)      NOT NULL DEFAULT '#f5f0e6',
  `color_fondo_superior`    CHAR(7)      NOT NULL DEFAULT '#f8f6f0',
  `color_fondo_tarjetas`    CHAR(7)      NOT NULL DEFAULT '#fafaf8',
  `color_texto_principal`   CHAR(7)      NOT NULL DEFAULT '#1a2e24',
  `color_texto_secundario`  CHAR(7)      NOT NULL DEFAULT '#6b7c72',
  `color_bordes`            CHAR(7)      NOT NULL DEFAULT '#d8e0da',
  `actualizado_en`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PRODUCCIONES
CREATE TABLE `producciones` (
  `id`                 CHAR(36)     NOT NULL,
  `secuencia`          INT UNSIGNED NOT NULL,
  `codigo`             CHAR(5)      NOT NULL,
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

-- 5. PRODUCCION_CORTES
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

-- 6. VENTAS
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

-- 7. VENTA_VARIEDADES
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

-- 8. INVENTARIO_PRODUCTOS
CREATE TABLE `inventario_productos` (
  `id`                CHAR(36)     NOT NULL,
  `codigo`            VARCHAR(10)  NOT NULL,
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

-- 9. INVENTARIO_MOVIMIENTOS
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
