-- migrate:up
CREATE TABLE users (
    id           bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cognito_sub  text NOT NULL UNIQUE,
    email        text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

CREATE INDEX idx_users_cognito_sub ON users USING btree (cognito_sub);

-- migrate:down
DROP INDEX IF EXISTS idx_users_cognito_sub;
DROP TABLE IF EXISTS users;
