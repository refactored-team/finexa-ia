package services

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/repository"
)

var (
	ErrInvalidUserID           = errors.New("invalid user id")
	ErrInvalidPlaidItemPayload = errors.New("plaid_item_id and access_token are required")
)

type PlaidItemService struct {
	repo *repository.PlaidItemRepository
}

func NewPlaidItemService(repo *repository.PlaidItemRepository) *PlaidItemService {
	return &PlaidItemService{repo: repo}
}

// GetForUser returns the single active Plaid connection for the user, if any.
func (s *PlaidItemService) GetForUser(ctx context.Context, userID int64) (models.PlaidItemResponse, error) {
	if userID <= 0 {
		return models.PlaidItemResponse{}, ErrInvalidUserID
	}
	item, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.PlaidItemResponse{}, err
		}
		return models.PlaidItemResponse{}, err
	}
	return item, nil
}

// UpsertForUser creates or replaces the user’s only Plaid connection (at most one active row).
func (s *PlaidItemService) UpsertForUser(ctx context.Context, userID int64, in models.CreatePlaidItemRequest) (models.PlaidItemResponse, error) {
	if userID <= 0 {
		return models.PlaidItemResponse{}, ErrInvalidUserID
	}
	if strings.TrimSpace(in.PlaidItemID) == "" || strings.TrimSpace(in.AccessToken) == "" {
		return models.PlaidItemResponse{}, ErrInvalidPlaidItemPayload
	}
	return s.repo.UpsertForUser(ctx, userID, in)
}

// DeleteForUser soft-deletes the user’s active Plaid connection.
func (s *PlaidItemService) DeleteForUser(ctx context.Context, userID int64) error {
	if userID <= 0 {
		return ErrInvalidUserID
	}
	n, err := s.repo.SoftDeleteForUser(ctx, userID)
	if err != nil {
		return err
	}
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}
