-- users: definido y migrado por ms-users (misma BD compartida).

CREATE TABLE plaid_items_audit (
    id             bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    public_token   text,
    action         text,
    changed_at     timestamptz
);

CREATE TABLE plaid_items (
    id                bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id           bigint NOT NULL REFERENCES users (id),
    public_token      text NOT NULL,
    access_token      text NOT NULL,
    institution_id    text,
    institution_name  text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz
);

CREATE UNIQUE INDEX idx_plaid_items_one_active_per_user
    ON plaid_items (user_id)
    WHERE deleted_at IS NULL;

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
