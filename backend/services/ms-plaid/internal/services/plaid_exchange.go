package services

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/plaid/plaid-go/v41/plaid"

	"finexa-ia/ms-plaid/internal/config"
	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/plaidclient"
	"finexa-ia/ms-plaid/internal/repository"
)

var ErrEmptyPublicToken = errors.New("public_token is required")

// ItemPublicTokenExchanger calls Plaid POST /item/public_token/exchange (mocked in tests).
type ItemPublicTokenExchanger interface {
	ItemPublicTokenExchange(ctx context.Context, publicToken string) (plaid.ItemPublicTokenExchangeResponse, error)
}

// PlaidItemWriter persists plaid_items after exchange (*repository.PlaidItemRepository).
type PlaidItemWriter interface {
	UpsertForUser(ctx context.Context, userID int64, in models.CreatePlaidItemRequest) (models.PlaidItemResponse, error)
}

type apiItemExchanger struct {
	api *plaid.APIClient
}

func (a *apiItemExchanger) ItemPublicTokenExchange(ctx context.Context, publicToken string) (plaid.ItemPublicTokenExchangeResponse, error) {
	req := plaid.NewItemPublicTokenExchangeRequest(strings.TrimSpace(publicToken))
	resp, _, err := a.api.PlaidApi.ItemPublicTokenExchange(ctx).ItemPublicTokenExchangeRequest(*req).Execute()
	return resp, err
}

// PlaidExchangeService exchanges Link public_token for access_token and persists the Item (no access_token in API response).
type PlaidExchangeService struct {
	cfg      *config.App
	exch     ItemPublicTokenExchanger
	linkRepo PlaidLinkSessionRepo
	items    PlaidItemWriter
}

func NewPlaidExchangeService(cfg *config.App, db *sql.DB) *PlaidExchangeService {
	linkRepo := repository.NewPlaidLinkRepository(db)
	items := repository.NewPlaidItemRepository(db)
	if cfg == nil || !cfg.PlaidConfigured() {
		return &PlaidExchangeService{cfg: cfg, exch: nil, linkRepo: linkRepo, items: items}
	}
	return &PlaidExchangeService{
		cfg:      cfg,
		exch:     &apiItemExchanger{api: plaidclient.NewAPIClient(cfg)},
		linkRepo: linkRepo,
		items:    items,
	}
}

// NewPlaidExchangeServiceWithDeps is used in tests.
func NewPlaidExchangeServiceWithDeps(cfg *config.App, exch ItemPublicTokenExchanger, linkRepo PlaidLinkSessionRepo, items PlaidItemWriter) *PlaidExchangeService {
	return &PlaidExchangeService{cfg: cfg, exch: exch, linkRepo: linkRepo, items: items}
}

// ExchangeForUser validates the user, calls Plaid, upserts plaid_items (stores access_token server-side only).
func (s *PlaidExchangeService) ExchangeForUser(ctx context.Context, userID int64, publicToken string) (models.ExchangePublicTokenResult, error) {
	var zero models.ExchangePublicTokenResult
	if userID <= 0 {
		return zero, ErrInvalidUserID
	}
	if strings.TrimSpace(publicToken) == "" {
		return zero, ErrEmptyPublicToken
	}
	if s.cfg == nil || !s.cfg.PlaidConfigured() || s.exch == nil {
		return zero, ErrPlaidNotConfigured
	}
	ok, err := s.linkRepo.UserExists(ctx, userID)
	if err != nil {
		return zero, err
	}
	if !ok {
		return zero, ErrUserNotFound
	}
	resp, err := s.exch.ItemPublicTokenExchange(ctx, publicToken)
	if err != nil {
		return zero, err
	}
	plaidItemID := resp.GetItemId()
	item, err := s.items.UpsertForUser(ctx, userID, models.CreatePlaidItemRequest{
		PublicToken: strings.TrimSpace(publicToken),
		AccessToken: resp.GetAccessToken(),
		ItemID:      &plaidItemID,
	})
	if err != nil {
		return zero, err
	}
	return models.ExchangePublicTokenResult{
		RequestID: resp.GetRequestId(),
		Item:      item,
	}, nil
}
