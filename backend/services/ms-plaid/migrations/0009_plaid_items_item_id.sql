-- migrate:up
ALTER TABLE plaid_items ADD COLUMN item_id text;

-- migrate:down
ALTER TABLE plaid_items DROP COLUMN IF EXISTS item_id;
