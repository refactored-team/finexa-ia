-- migrate:up
CREATE TABLE transactions (
    id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id       bigint NOT NULL REFERENCES users (id),
    external_id   text,
    amount_cents  bigint NOT NULL,
    currency      text NOT NULL DEFAULT 'USD',
    description   text,
    posted_at     timestamptz NOT NULL DEFAULT now(),
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON transactions USING btree (user_id);
CREATE UNIQUE INDEX idx_transactions_user_external ON transactions (user_id, external_id) WHERE external_id IS NOT NULL;

-- migrate:down
DROP INDEX IF EXISTS idx_transactions_user_external;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP TABLE IF EXISTS transactions;
