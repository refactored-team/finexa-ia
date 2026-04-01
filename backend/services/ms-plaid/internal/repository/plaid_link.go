package repository

import (
	"context"
	"database/sql"

	"finexa-ia/ms-plaid/internal/repository/sqlcgen"
)

type PlaidLinkRepository struct {
	q *sqlcgen.Queries
}

func NewPlaidLinkRepository(db *sql.DB) *PlaidLinkRepository {
	return &PlaidLinkRepository{q: sqlcgen.New(db)}
}

func (r *PlaidLinkRepository) UserExists(ctx context.Context, userID int64) (bool, error) {
	return r.q.UserExists(ctx, userID)
}

func (r *PlaidLinkRepository) InsertLinkSession(ctx context.Context, arg sqlcgen.InsertPlaidLinkSessionParams) (sqlcgen.PlaidLinkSession, error) {
	return r.q.InsertPlaidLinkSession(ctx, arg)
}
