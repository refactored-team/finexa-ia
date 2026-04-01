-- name: GetUserByID :one
SELECT id, name, email, created_at
FROM users
WHERE id = $1
LIMIT 1;

-- name: ListUsers :many
SELECT id, name, email, created_at
FROM users
ORDER BY id;

-- name: CreateUser :one
INSERT INTO users (name, email)
VALUES ($1, $2)
RETURNING id, name, email, created_at;
