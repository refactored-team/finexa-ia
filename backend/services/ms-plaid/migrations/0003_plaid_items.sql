-- migrate:up
CREATE TABLE plaid_items (
    id                bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id           bigint NOT NULL REFERENCES users (id),
    plaid_item_id     text NOT NULL,
    access_token      text NOT NULL,
    institution_id    text,
    institution_name  text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz
);

CREATE INDEX idx_plaid_items_user_id ON plaid_items USING btree (user_id);

-- migrate:down
DROP INDEX IF EXISTS idx_plaid_items_user_id;
DROP TABLE IF EXISTS plaid_items;
