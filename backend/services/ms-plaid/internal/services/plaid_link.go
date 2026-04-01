package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/plaid/plaid-go/v41/plaid"

	"finexa-ia/ms-plaid/internal/config"
	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/plaidclient"
	"finexa-ia/ms-plaid/internal/repository"
	"finexa-ia/ms-plaid/internal/repository/sqlcgen"
)

var (
	ErrPlaidNotConfigured = errors.New("plaid is not configured")
	ErrUserNotFound       = errors.New("user not found")
	ErrPlaidRequest       = errors.New("plaid request validation failed")
)

// PlaidLinker calls Plaid /link/token/create (mocked in tests).
type PlaidLinker interface {
	CreateLinkToken(ctx context.Context, req plaid.LinkTokenCreateRequest) (plaid.LinkTokenCreateResponse, error)
}

// PlaidLinkSessionRepo loads users and persists link-session metadata.
type PlaidLinkSessionRepo interface {
	UserExists(ctx context.Context, userID int64) (bool, error)
	InsertLinkSession(ctx context.Context, arg sqlcgen.InsertPlaidLinkSessionParams) (sqlcgen.PlaidLinkSession, error)
}

type apiPlaidLinker struct {
	api *plaid.APIClient
}

func (a *apiPlaidLinker) CreateLinkToken(ctx context.Context, req plaid.LinkTokenCreateRequest) (plaid.LinkTokenCreateResponse, error) {
	resp, _, err := a.api.PlaidApi.LinkTokenCreate(ctx).LinkTokenCreateRequest(req).Execute()
	return resp, err
}

type PlaidLinkService struct {
	cfg  *config.App
	link PlaidLinker
	repo PlaidLinkSessionRepo
}

func NewPlaidLinkService(cfg *config.App, db *sql.DB) *PlaidLinkService {
	repo := repository.NewPlaidLinkRepository(db)
	if cfg == nil || !cfg.PlaidConfigured() {
		return &PlaidLinkService{cfg: cfg, link: nil, repo: repo}
	}
	return &PlaidLinkService{
		cfg:  cfg,
		link: &apiPlaidLinker{api: plaidclient.NewAPIClient(cfg)},
		repo: repo,
	}
}

// NewPlaidLinkServiceWithDeps is used in tests to inject mocks.
func NewPlaidLinkServiceWithDeps(cfg *config.App, link PlaidLinker, repo PlaidLinkSessionRepo) *PlaidLinkService {
	return &PlaidLinkService{cfg: cfg, link: link, repo: repo}
}

func (s *PlaidLinkService) CreateLinkToken(ctx context.Context, userID int64, body models.CreateLinkTokenBody) (models.LinkTokenResponse, error) {
	if userID <= 0 {
		return models.LinkTokenResponse{}, ErrInvalidUserID
	}
	if s.cfg == nil || !s.cfg.PlaidConfigured() || s.link == nil {
		return models.LinkTokenResponse{}, ErrPlaidNotConfigured
	}

	ok, err := s.repo.UserExists(ctx, userID)
	if err != nil {
		return models.LinkTokenResponse{}, err
	}
	if !ok {
		return models.LinkTokenResponse{}, ErrUserNotFound
	}

	req, err := plaidclient.BuildLinkTokenCreateRequest(s.cfg, userID, plaidclient.LinkTokenOverrides{
		RedirectURI: body.RedirectURI,
		WebhookURL:  body.WebhookURL,
	})
	if err != nil {
		return models.LinkTokenResponse{}, fmt.Errorf("%w: %v", ErrPlaidRequest, err)
	}

	resp, err := s.link.CreateLinkToken(ctx, *req)
	if err != nil {
		return models.LinkTokenResponse{}, err
	}

	envLabel := strings.TrimSpace(strings.ToLower(s.cfg.PlaidEnv))
	if envLabel == "" {
		envLabel = "sandbox"
	}

	productsCSV := strings.TrimSpace(s.cfg.PlaidProducts)
	if productsCSV == "" {
		productsCSV = "transactions"
	}

	_, err = s.repo.InsertLinkSession(ctx, sqlcgen.InsertPlaidLinkSessionParams{
		UserID:           userID,
		ExpiresAt:        resp.GetExpiration(),
		PlaidRequestID:   resp.GetRequestId(),
		PlaidEnvironment: envLabel,
		InitialProducts:  sql.NullString{String: productsCSV, Valid: true},
	})
	if err != nil {
		return models.LinkTokenResponse{}, err
	}

	return models.LinkTokenResponse{
		LinkToken:  resp.GetLinkToken(),
		Expiration: resp.GetExpiration(),
		RequestID:  resp.GetRequestId(),
	}, nil
}

// MapPlaidError extracts PlaidError from plaid-go errors when possible.
func MapPlaidError(err error) (models.PlaidAPIErrorInfo, bool) {
	if err == nil {
		return models.PlaidAPIErrorInfo{}, false
	}
	pe, e := plaid.ToPlaidError(err)
	if e != nil {
		return models.PlaidAPIErrorInfo{}, false
	}
	return models.PlaidAPIErrorInfo{
		ErrorType:    string(pe.GetErrorType()),
		ErrorCode:    pe.GetErrorCode(),
		ErrorMessage: pe.GetErrorMessage(),
	}, true
}
