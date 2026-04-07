-- name: UpsertUserByCognitoSub :one
INSERT INTO users (cognito_sub, email)
VALUES ($1, $2)
ON CONFLICT (cognito_sub) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    deleted_at = NULL,
    updated_at = now()
RETURNING id, cognito_sub, email, created_at, updated_at, deleted_at;

-- name: GetUserByID :one
SELECT id, cognito_sub, email, created_at, updated_at, deleted_at
FROM users
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByCognitoSub :one
SELECT id, cognito_sub, email, created_at, updated_at, deleted_at
FROM users
WHERE cognito_sub = $1 AND deleted_at IS NULL;

-- name: ListUsers :many
SELECT id, cognito_sub, email, created_at, updated_at, deleted_at
FROM users
WHERE deleted_at IS NULL
ORDER BY id;

-- name: UpdateUserByID :one
UPDATE users
SET
    cognito_sub = $1,
    email = $2,
    updated_at = now()
WHERE id = $3
  AND deleted_at IS NULL
RETURNING id, cognito_sub, email, created_at, updated_at, deleted_at;

-- name: DeleteUserByID :one
UPDATE users
SET
    deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING id, cognito_sub, email, created_at, updated_at, deleted_at;
