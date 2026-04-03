-- migrate:up
-- At most one non-deleted Plaid connection per user (enforced for API + upsert).
CREATE UNIQUE INDEX idx_plaid_items_one_active_per_user
    ON plaid_items (user_id)
    WHERE deleted_at IS NULL;

-- migrate:down
DROP INDEX IF EXISTS idx_plaid_items_one_active_per_user;
