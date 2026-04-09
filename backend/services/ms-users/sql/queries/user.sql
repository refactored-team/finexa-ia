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

-- name: GetUserByEmail :one
SELECT id, cognito_sub, email, created_at, updated_at, deleted_at
FROM users
WHERE deleted_at IS NULL
  AND email IS NOT NULL
  AND btrim(email) <> ''
  AND lower(btrim(email)) = lower(btrim($1))
LIMIT 1;

-- name: ListAllActiveUsers :many
SELECT id, cognito_sub, email, created_at, updated_at, deleted_at
FROM users
WHERE deleted_at IS NULL
ORDER BY id;

-- name: ListUsersFiltered :many
SELECT id, cognito_sub, email, created_at, updated_at, deleted_at
FROM users
WHERE
  (($1::boolean IS TRUE) OR deleted_at IS NULL)
  AND ($2::text IS NULL OR $2::text = '' OR (
    email IS NOT NULL
    AND btrim(email) <> ''
    AND lower(btrim(email)) = lower(btrim($2::text))
  ))
  AND ($3::timestamptz IS NULL OR created_at >= $3)
  AND ($4::timestamptz IS NULL OR created_at <= $4)
ORDER BY id
LIMIT $5 OFFSET $6;

-- name: CountUsersFiltered :one
SELECT count(*)::bigint
FROM users
WHERE
  (($1::boolean IS TRUE) OR deleted_at IS NULL)
  AND ($2::text IS NULL OR $2::text = '' OR (
    email IS NOT NULL
    AND btrim(email) <> ''
    AND lower(btrim(email)) = lower(btrim($2::text))
  ))
  AND ($3::timestamptz IS NULL OR created_at >= $3)
  AND ($4::timestamptz IS NULL OR created_at <= $4);

-- name: UpdateUserByID :one
UPDATE users
SET
    cognito_sub = $1,
    email = $2,
    updated_at = now()
WHERE id = $3
  AND deleted_at IS NULL
RETURNING id, cognito_sub, email, created_at, updated_at, deleted_at;

-- name: PatchUserEmailByID :one
UPDATE users
SET
    email = $1,
    updated_at = now()
WHERE id = $2
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

-- name: RestoreUserByID :one
UPDATE users
SET
    deleted_at = NULL,
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NOT NULL
RETURNING id, cognito_sub, email, created_at, updated_at, deleted_at;

-- name: HardDeleteUserByID :one
DELETE FROM users
WHERE id = $1
RETURNING id, cognito_sub, email, created_at, updated_at, deleted_at;
