-- migrate:up
DROP TRIGGER IF EXISTS plaid_item_changes ON plaid_items;
DROP FUNCTION IF EXISTS log_plaid_item_changes();

ALTER TABLE plaid_items RENAME COLUMN plaid_item_id TO public_token;
ALTER TABLE plaid_items_audit RENAME COLUMN plaid_item_id TO public_token;

CREATE OR REPLACE FUNCTION log_plaid_item_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO plaid_items_audit (public_token, action, changed_at)
        VALUES (OLD.public_token, TG_OP, now());
        RETURN OLD;
    ELSE
        INSERT INTO plaid_items_audit (public_token, action, changed_at)
        VALUES (NEW.public_token, TG_OP, now());
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plaid_item_changes
    AFTER INSERT OR UPDATE OR DELETE ON plaid_items
    FOR EACH ROW
    EXECUTE FUNCTION log_plaid_item_changes();

-- migrate:down
DROP TRIGGER IF EXISTS plaid_item_changes ON plaid_items;
DROP FUNCTION IF EXISTS log_plaid_item_changes();

ALTER TABLE plaid_items RENAME COLUMN public_token TO plaid_item_id;
ALTER TABLE plaid_items_audit RENAME COLUMN public_token TO plaid_item_id;

CREATE OR REPLACE FUNCTION log_plaid_item_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO plaid_items_audit (plaid_item_id, action, changed_at)
        VALUES (OLD.plaid_item_id, TG_OP, now());
        RETURN OLD;
    ELSE
        INSERT INTO plaid_items_audit (plaid_item_id, action, changed_at)
        VALUES (NEW.plaid_item_id, TG_OP, now());
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plaid_item_changes
    AFTER INSERT OR UPDATE OR DELETE ON plaid_items
    FOR EACH ROW
    EXECUTE FUNCTION log_plaid_item_changes();
