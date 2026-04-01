CREATE TABLE users (
    id           bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cognito_sub  text NOT NULL UNIQUE,
    email        text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

CREATE TABLE plaid_items_audit (
    id             bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    plaid_item_id  text,
    action         text,
    changed_at     timestamptz
);

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

CREATE UNIQUE INDEX idx_plaid_items_one_active_per_user
    ON plaid_items (user_id)
    WHERE deleted_at IS NULL;
