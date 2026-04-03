-- migrate:up
CREATE TABLE plaid_items_audit (
    id             bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    plaid_item_id  text,
    action         text,
    changed_at     timestamptz
);

-- migrate:down
DROP TABLE IF EXISTS plaid_items_audit;
