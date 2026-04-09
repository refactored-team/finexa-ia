package repository

import (
	"context"
	"database/sql"
	"strings"
)

// GetInternalUserIDByCognitoSub devuelve users.id para un usuario activo (no borrado lógico).
func GetInternalUserIDByCognitoSub(ctx context.Context, db *sql.DB, cognitoSub string) (int64, error) {
	sub := strings.TrimSpace(cognitoSub)
	if sub == "" {
		return 0, sql.ErrNoRows
	}
	const q = `SELECT id FROM users WHERE cognito_sub = $1 AND deleted_at IS NULL`
	var id int64
	err := db.QueryRowContext(ctx, q, sub).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}
