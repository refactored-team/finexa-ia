-- name: CreatePlaidItem :one
INSERT INTO plaid_items (user_id, plaid_item_id, access_token, institution_id, institution_name)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, user_id, plaid_item_id, institution_id, institution_name, created_at, updated_at, deleted_at;

-- name: ListPlaidItemsByUserID :many
SELECT id, user_id, plaid_item_id, institution_id, institution_name, created_at, updated_at, deleted_at
FROM plaid_items
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY id;

-- name: GetPlaidItemByPlaidItemIDForUser :one
SELECT id, user_id, plaid_item_id, institution_id, institution_name, created_at, updated_at, deleted_at
FROM plaid_items
WHERE user_id = $1 AND plaid_item_id = $2 AND deleted_at IS NULL
LIMIT 1;

-- name: SoftDeletePlaidItem :execrows
UPDATE plaid_items
SET deleted_at = now()
WHERE user_id = $1 AND plaid_item_id = $2 AND deleted_at IS NULL;
