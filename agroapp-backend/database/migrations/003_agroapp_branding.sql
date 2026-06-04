-- Marca AgroApp en empresa_config (pestaña y nombre en la app)
-- mysql "$MYSQL_ADDON_URI" < database/migrations/003_agroapp_branding.sql

SET NAMES utf8mb4;

UPDATE `empresa_config`
SET
  `nombre_principal` = 'AGRO',
  `nombre_secundario` = 'APP',
  `eslogan` = 'GESTIÓN AGRÍCOLA INTELIGENTE'
WHERE `id` = 1;
