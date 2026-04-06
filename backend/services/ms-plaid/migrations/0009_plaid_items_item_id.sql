-- migrate:up
-- Columna Plaid Item.item_id (distinta de public_token). Idempotente si ya existía.
ALTER TABLE plaid_items ADD COLUMN IF NOT EXISTS item_id text;

-- migrate:down
ALTER TABLE plaid_items DROP COLUMN IF EXISTS item_id;
