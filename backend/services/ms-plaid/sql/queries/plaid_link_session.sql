-- name: InsertPlaidLinkSession :one
INSERT INTO plaid_link_sessions (user_id, expires_at, plaid_request_id, plaid_environment, initial_products)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, user_id, expires_at, plaid_request_id, plaid_environment, initial_products, created_at;
