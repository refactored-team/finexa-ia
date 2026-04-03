-- migrate:up
CREATE OR REPLACE FUNCTION update_users_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

CREATE OR REPLACE FUNCTION update_plaid_items_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plaid_items_updated_at_trigger
    BEFORE UPDATE ON plaid_items
    FOR EACH ROW
    EXECUTE FUNCTION update_plaid_items_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS update_plaid_items_updated_at_trigger ON plaid_items;
DROP FUNCTION IF EXISTS update_plaid_items_updated_at();

DROP TRIGGER IF EXISTS update_users_updated_at_trigger ON users;
DROP FUNCTION IF EXISTS update_users_updated_at();
