-- migrate:up
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(btrim(email)))
WHERE email IS NOT NULL AND btrim(email) <> '';

-- migrate:down
DROP INDEX IF EXISTS idx_users_email_lower;
