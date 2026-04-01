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
	ErrInvalidParams           = errors.New("invalid parameters")
	ErrInvalidPlaidItemPayload = errors.New("plaid_item_id and access_token are required")
)

type PlaidItemService struct {
	repo *repository.PlaidItemRepository
}

func NewPlaidItemService(repo *repository.PlaidItemRepository) *PlaidItemService {
	return &PlaidItemService{repo: repo}
}

func (s *PlaidItemService) ListByUser(ctx context.Context, userID int64) ([]models.PlaidItemResponse, error) {
	if userID <= 0 {
		return nil, ErrInvalidUserID
	}
	return s.repo.ListByUserID(ctx, userID)
}

func (s *PlaidItemService) Get(ctx context.Context, userID int64, plaidItemID string) (models.PlaidItemResponse, error) {
	if userID <= 0 || strings.TrimSpace(plaidItemID) == "" {
		return models.PlaidItemResponse{}, ErrInvalidParams
	}
	item, err := s.repo.GetByPlaidItemID(ctx, userID, plaidItemID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.PlaidItemResponse{}, err
		}
		return models.PlaidItemResponse{}, err
	}
	return item, nil
}

func (s *PlaidItemService) Create(ctx context.Context, userID int64, in models.CreatePlaidItemRequest) (models.PlaidItemResponse, error) {
	if userID <= 0 {
		return models.PlaidItemResponse{}, ErrInvalidUserID
	}
	if strings.TrimSpace(in.PlaidItemID) == "" || strings.TrimSpace(in.AccessToken) == "" {
		return models.PlaidItemResponse{}, ErrInvalidPlaidItemPayload
	}
	return s.repo.Create(ctx, userID, in)
}

func (s *PlaidItemService) Delete(ctx context.Context, userID int64, plaidItemID string) error {
	if userID <= 0 || strings.TrimSpace(plaidItemID) == "" {
		return ErrInvalidParams
	}
	n, err := s.repo.SoftDelete(ctx, userID, plaidItemID)
	if err != nil {
		return err
	}
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}
