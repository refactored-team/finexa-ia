package repository

import (
	"context"
	"database/sql"

	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/repository/sqlcgen"
)

type PlaidItemRepository struct {
	q *sqlcgen.Queries
}

func NewPlaidItemRepository(db *sql.DB) *PlaidItemRepository {
	return &PlaidItemRepository{q: sqlcgen.New(db)}
}

func (r *PlaidItemRepository) Create(ctx context.Context, userID int64, in models.CreatePlaidItemRequest) (models.PlaidItemResponse, error) {
	row, err := r.q.CreatePlaidItem(ctx, sqlcgen.CreatePlaidItemParams{
		UserID:          userID,
		PlaidItemID:     in.PlaidItemID,
		AccessToken:     in.AccessToken,
		InstitutionID:   stringToNull(in.InstitutionID),
		InstitutionName: stringToNull(in.InstitutionName),
	})
	if err != nil {
		return models.PlaidItemResponse{}, err
	}
	return rowToResponseCreate(row), nil
}

func (r *PlaidItemRepository) ListByUserID(ctx context.Context, userID int64) ([]models.PlaidItemResponse, error) {
	rows, err := r.q.ListPlaidItemsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]models.PlaidItemResponse, len(rows))
	for i, row := range rows {
		out[i] = rowToResponseList(row)
	}
	return out, nil
}

func (r *PlaidItemRepository) GetByPlaidItemID(ctx context.Context, userID int64, plaidItemID string) (models.PlaidItemResponse, error) {
	row, err := r.q.GetPlaidItemByPlaidItemIDForUser(ctx, sqlcgen.GetPlaidItemByPlaidItemIDForUserParams{
		UserID:      userID,
		PlaidItemID: plaidItemID,
	})
	if err != nil {
		return models.PlaidItemResponse{}, err
	}
	return rowToResponseGet(row), nil
}

func (r *PlaidItemRepository) SoftDelete(ctx context.Context, userID int64, plaidItemID string) (int64, error) {
	return r.q.SoftDeletePlaidItem(ctx, sqlcgen.SoftDeletePlaidItemParams{
		UserID:      userID,
		PlaidItemID: plaidItemID,
	})
}

func stringToNull(p *string) sql.NullString {
	if p == nil || *p == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: *p, Valid: true}
}

func nullStringPtr(ns sql.NullString) *string {
	if !ns.Valid {
		return nil
	}
	s := ns.String
	return &s
}

func rowToResponseCreate(row sqlcgen.CreatePlaidItemRow) models.PlaidItemResponse {
	return models.PlaidItemResponse{
		ID:              row.ID,
		UserID:          row.UserID,
		PlaidItemID:     row.PlaidItemID,
		InstitutionID:   nullStringPtr(row.InstitutionID),
		InstitutionName: nullStringPtr(row.InstitutionName),
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
}

func rowToResponseList(row sqlcgen.ListPlaidItemsByUserIDRow) models.PlaidItemResponse {
	return models.PlaidItemResponse{
		ID:              row.ID,
		UserID:          row.UserID,
		PlaidItemID:     row.PlaidItemID,
		InstitutionID:   nullStringPtr(row.InstitutionID),
		InstitutionName: nullStringPtr(row.InstitutionName),
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
}

func rowToResponseGet(row sqlcgen.GetPlaidItemByPlaidItemIDForUserRow) models.PlaidItemResponse {
	return models.PlaidItemResponse{
		ID:              row.ID,
		UserID:          row.UserID,
		PlaidItemID:     row.PlaidItemID,
		InstitutionID:   nullStringPtr(row.InstitutionID),
		InstitutionName: nullStringPtr(row.InstitutionName),
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
}
