-- migrate:up
-- La tabla users la crea el servicio ms-users (migración 0001_users.sql).
-- No-op: en BD nueva, ejecutá migraciones ms-users antes que ms-plaid (hasta antes de 0003).
-- En BD que ya aplicó este archivo con CREATE TABLE, no reejecutes migrate:up completo sobre el mismo archivo modificado.
SELECT 1;

-- migrate:down
-- No borrar users aquí: es tabla compartida con ms-users.
SELECT 1;
