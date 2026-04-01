-- migrate:up
CREATE TABLE plaid_link_sessions (
    id                 bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id            bigint NOT NULL REFERENCES users (id),
    expires_at         timestamptz NOT NULL,
    plaid_request_id   text NOT NULL,
    plaid_environment  text NOT NULL,
    initial_products   text,
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plaid_link_sessions_user_id ON plaid_link_sessions (user_id);
CREATE INDEX idx_plaid_link_sessions_created_at ON plaid_link_sessions (created_at DESC);

-- migrate:down
DROP INDEX IF EXISTS idx_plaid_link_sessions_created_at;
DROP INDEX IF EXISTS idx_plaid_link_sessions_user_id;
DROP TABLE IF EXISTS plaid_link_sessions;
