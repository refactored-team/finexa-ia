package services_test

import (
	"context"
	"testing"
	"time"

	"github.com/plaid/plaid-go/v41/plaid"

	"finexa-ia/ms-plaid/internal/config"
	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/repository/sqlcgen"
	"finexa-ia/ms-plaid/internal/services"
)

type mockPlaidLinker struct {
	resp plaid.LinkTokenCreateResponse
	err  error
}

func (m *mockPlaidLinker) CreateLinkToken(_ context.Context, _ plaid.LinkTokenCreateRequest) (plaid.LinkTokenCreateResponse, error) {
	return m.resp, m.err
}

type mockLinkRepo struct {
	exists    bool
	existsErr error
	insertErr error
}

func (m *mockLinkRepo) UserExists(_ context.Context, _ int64) (bool, error) {
	return m.exists, m.existsErr
}

func (m *mockLinkRepo) InsertLinkSession(_ context.Context, arg sqlcgen.InsertPlaidLinkSessionParams) (sqlcgen.PlaidLinkSession, error) {
	if m.insertErr != nil {
		return sqlcgen.PlaidLinkSession{}, m.insertErr
	}
	return sqlcgen.PlaidLinkSession{
		ID:               1,
		UserID:           arg.UserID,
		ExpiresAt:        arg.ExpiresAt,
		PlaidRequestID:   arg.PlaidRequestID,
		PlaidEnvironment: arg.PlaidEnvironment,
		CreatedAt:        time.Now().UTC(),
	}, nil
}

func TestPlaidLinkService_CreateLinkToken_invalidUser(t *testing.T) {
	cfg := &config.App{PlaidClientID: "x", PlaidSecret: "y"}
	svc := services.NewPlaidLinkServiceWithDeps(cfg, &mockPlaidLinker{}, &mockLinkRepo{exists: true})
	_, err := svc.CreateLinkToken(context.Background(), 0, models.CreateLinkTokenBody{})
	if err != services.ErrInvalidUserID {
		t.Fatalf("got %v want ErrInvalidUserID", err)
	}
}

func TestPlaidLinkService_CreateLinkToken_notConfigured(t *testing.T) {
	cfg := &config.App{}
	svc := services.NewPlaidLinkServiceWithDeps(cfg, &mockPlaidLinker{}, &mockLinkRepo{exists: true})
	_, err := svc.CreateLinkToken(context.Background(), 1, models.CreateLinkTokenBody{})
	if err != services.ErrPlaidNotConfigured {
		t.Fatalf("got %v want ErrPlaidNotConfigured", err)
	}
}

func TestPlaidLinkService_CreateLinkToken_userNotFound(t *testing.T) {
	cfg := &config.App{PlaidClientID: "x", PlaidSecret: "y"}
	svc := services.NewPlaidLinkServiceWithDeps(cfg, &mockPlaidLinker{}, &mockLinkRepo{exists: false})
	_, err := svc.CreateLinkToken(context.Background(), 99, models.CreateLinkTokenBody{})
	if err != services.ErrUserNotFound {
		t.Fatalf("got %v want ErrUserNotFound", err)
	}
}

func TestPlaidLinkService_CreateLinkToken_success(t *testing.T) {
	exp := time.Date(2026, 1, 2, 15, 0, 0, 0, time.UTC)
	cfg := &config.App{
		PlaidClientID:     "id",
		PlaidSecret:       "sec",
		PlaidEnv:          "sandbox",
		PlaidClientName:   "TestApp",
		PlaidLanguage:     "en",
		PlaidCountryCodes: "US",
		PlaidProducts:     "transactions",
	}
	linker := &mockPlaidLinker{
		resp: *plaid.NewLinkTokenCreateResponse("link-sandbox-abc", exp, "req-1"),
	}
	svc := services.NewPlaidLinkServiceWithDeps(cfg, linker, &mockLinkRepo{exists: true})
	out, err := svc.CreateLinkToken(context.Background(), 42, models.CreateLinkTokenBody{})
	if err != nil {
		t.Fatal(err)
	}
	if out.LinkToken != "link-sandbox-abc" || out.RequestID != "req-1" || !out.Expiration.Equal(exp) {
		t.Fatalf("unexpected response: %+v", out)
	}
}
