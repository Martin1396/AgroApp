-- Escala de nombre/logo + color principal por defecto (Turpial Dorado)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/002_empresa_config_defaults.sql

SET NAMES utf8mb4;

ALTER TABLE `empresa_config`
  ADD COLUMN `escala_nombre` TINYINT UNSIGNED NOT NULL DEFAULT 100
    AFTER `color_nombre_secundario`;

ALTER TABLE `empresa_config`
  ADD COLUMN `escala_logo` TINYINT UNSIGNED NOT NULL DEFAULT 100
    AFTER `escala_nombre`;

ALTER TABLE `empresa_config`
  MODIFY COLUMN `color_nombre_principal` CHAR(7) NOT NULL DEFAULT '#1a1a1a';

UPDATE `empresa_config`
SET
  `nombre_principal` = 'AGRO',
  `nombre_secundario` = 'APP',
  `color_nombre_principal` = '#1a1a1a',
  `color_nombre_secundario` = '#d4a843',
  `eslogan` = 'GESTIÓN AGRÍCOLA INTELIGENTE',
  `logo_principal` = COALESCE(NULLIF(TRIM(`logo_principal`), ''), '/logo-turpial.png'),
  `logo_sidebar` = COALESCE(NULLIF(TRIM(`logo_sidebar`), ''), '/logo-turpial-sidebar.png'),
  `escala_nombre` = COALESCE(`escala_nombre`, 100),
  `escala_logo` = COALESCE(`escala_logo`, 100),
  `color_verde_oscuro` = '#1a3d2e',
  `color_verde_medio` = '#2d5a45',
  `color_verde_claro` = '#3d7a5c',
  `color_dorado` = '#d4a843',
  `color_dorado_claro` = '#e8c468',
  `color_dorado_oscuro` = '#b8922f',
  `color_fondo_crema` = '#f5f0e6',
  `color_fondo_superior` = '#f8f6f0',
  `color_fondo_tarjetas` = '#fafaf8',
  `color_texto_principal` = '#1a2e24',
  `color_texto_secundario` = '#6b7c72',
  `color_bordes` = '#d8e0da'
WHERE `id` = 1;
