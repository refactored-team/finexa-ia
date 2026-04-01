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

func (r *PlaidItemRepository) UpsertForUser(ctx context.Context, userID int64, in models.CreatePlaidItemRequest) (models.PlaidItemResponse, error) {
	row, err := r.q.UpsertPlaidItemForUser(ctx, sqlcgen.UpsertPlaidItemForUserParams{
		UserID:          userID,
		PlaidItemID:     in.PlaidItemID,
		AccessToken:     in.AccessToken,
		InstitutionID:   stringToNull(in.InstitutionID),
		InstitutionName: stringToNull(in.InstitutionName),
	})
	if err != nil {
		return models.PlaidItemResponse{}, err
	}
	return rowToResponseUpsert(row), nil
}

func (r *PlaidItemRepository) GetByUserID(ctx context.Context, userID int64) (models.PlaidItemResponse, error) {
	row, err := r.q.GetPlaidItemByUserID(ctx, userID)
	if err != nil {
		return models.PlaidItemResponse{}, err
	}
	return rowToResponseGet(row), nil
}

func (r *PlaidItemRepository) SoftDeleteForUser(ctx context.Context, userID int64) (int64, error) {
	return r.q.SoftDeletePlaidItemForUser(ctx, userID)
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

func rowToResponseUpsert(row sqlcgen.UpsertPlaidItemForUserRow) models.PlaidItemResponse {
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

func rowToResponseGet(row sqlcgen.GetPlaidItemByUserIDRow) models.PlaidItemResponse {
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
