-- Tabla canónica de usuarios (identidad Cognito). Compartida con ms-plaid vía misma DATABASE_URL (FK en plaid_*).
CREATE TABLE users (
    id           bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cognito_sub  text NOT NULL UNIQUE,
    email        text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

CREATE INDEX idx_users_cognito_sub ON users USING btree (cognito_sub);

CREATE INDEX idx_users_email_lower ON users (lower(btrim(email)))
WHERE email IS NOT NULL AND btrim(email) <> '';
