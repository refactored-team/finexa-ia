-- name: UpsertPlaidItemForUser :one
INSERT INTO plaid_items (user_id, public_token, access_token, item_id, institution_id, institution_name)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id) WHERE (deleted_at IS NULL) DO UPDATE SET
    public_token = EXCLUDED.public_token,
    access_token = EXCLUDED.access_token,
    item_id = EXCLUDED.item_id,
    institution_id = EXCLUDED.institution_id,
    institution_name = EXCLUDED.institution_name,
    updated_at = now()
RETURNING id, user_id, public_token, item_id, institution_id, institution_name, created_at, updated_at, deleted_at;

-- name: HasActivePlaidItemForUser :one
SELECT EXISTS(
    SELECT 1 FROM plaid_items WHERE user_id = $1 AND deleted_at IS NULL
) AS linked;

-- name: GetPlaidItemByUserID :one
SELECT id, user_id, public_token, item_id, institution_id, institution_name, created_at, updated_at, deleted_at
FROM plaid_items
WHERE user_id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: SoftDeletePlaidItemForUser :execrows
UPDATE plaid_items
SET deleted_at = now()
WHERE user_id = $1 AND deleted_at IS NULL;
