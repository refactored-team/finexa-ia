package services_test

import (
	"context"
	"testing"
	"time"

	"github.com/plaid/plaid-go/v41/plaid"

	"finexa-ia/ms-plaid/internal/config"
	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/services"
)

type mockItemExchanger struct {
	resp plaid.ItemPublicTokenExchangeResponse
	err  error
}

func (m *mockItemExchanger) ItemPublicTokenExchange(_ context.Context, _ string) (plaid.ItemPublicTokenExchangeResponse, error) {
	return m.resp, m.err
}

type mockPlaidItemWriter struct {
	last models.CreatePlaidItemRequest
	err  error
}

func (m *mockPlaidItemWriter) UpsertForUser(_ context.Context, userID int64, in models.CreatePlaidItemRequest) (models.PlaidItemResponse, error) {
	m.last = in
	if m.err != nil {
		return models.PlaidItemResponse{}, m.err
	}
	now := time.Now().UTC()
	return models.PlaidItemResponse{
		ID:          99,
		UserID:      userID,
		PublicToken: in.PublicToken,
		PlaidItemID: in.ItemID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func TestPlaidExchangeService_ExchangeForUser_invalidUser(t *testing.T) {
	cfg := &config.App{PlaidClientID: "x", PlaidSecret: "y"}
	svc := services.NewPlaidExchangeServiceWithDeps(cfg, &mockItemExchanger{}, &mockLinkRepo{exists: true}, &mockPlaidItemWriter{})
	_, err := svc.ExchangeForUser(context.Background(), 0, "tok")
	if err != services.ErrInvalidUserID {
		t.Fatalf("got %v want ErrInvalidUserID", err)
	}
}

func TestPlaidExchangeService_ExchangeForUser_emptyToken(t *testing.T) {
	cfg := &config.App{PlaidClientID: "x", PlaidSecret: "y"}
	svc := services.NewPlaidExchangeServiceWithDeps(cfg, &mockItemExchanger{}, &mockLinkRepo{exists: true}, &mockPlaidItemWriter{})
	_, err := svc.ExchangeForUser(context.Background(), 1, "  ")
	if err != services.ErrEmptyPublicToken {
		t.Fatalf("got %v want ErrEmptyPublicToken", err)
	}
}

func TestPlaidExchangeService_ExchangeForUser_notConfigured(t *testing.T) {
	cfg := &config.App{}
	svc := services.NewPlaidExchangeServiceWithDeps(cfg, &mockItemExchanger{}, &mockLinkRepo{exists: true}, &mockPlaidItemWriter{})
	_, err := svc.ExchangeForUser(context.Background(), 1, "tok")
	if err != services.ErrPlaidNotConfigured {
		t.Fatalf("got %v want ErrPlaidNotConfigured", err)
	}
}

func TestPlaidExchangeService_ExchangeForUser_userNotFound(t *testing.T) {
	cfg := &config.App{PlaidClientID: "x", PlaidSecret: "y"}
	svc := services.NewPlaidExchangeServiceWithDeps(cfg, &mockItemExchanger{}, &mockLinkRepo{exists: false}, &mockPlaidItemWriter{})
	_, err := svc.ExchangeForUser(context.Background(), 1, "tok")
	if err != services.ErrUserNotFound {
		t.Fatalf("got %v want ErrUserNotFound", err)
	}
}

func TestPlaidExchangeService_ExchangeForUser_success(t *testing.T) {
	cfg := &config.App{PlaidClientID: "x", PlaidSecret: "y"}
	ex := &mockItemExchanger{resp: *plaid.NewItemPublicTokenExchangeResponse("access-secret", "M-plaid-item", "req-plaid")}
	items := &mockPlaidItemWriter{}
	svc := services.NewPlaidExchangeServiceWithDeps(cfg, ex, &mockLinkRepo{exists: true}, items)
	out, err := svc.ExchangeForUser(context.Background(), 42, " public-sandbox-xyz ")
	if err != nil {
		t.Fatal(err)
	}
	if out.RequestID != "req-plaid" {
		t.Fatalf("request_id: got %q", out.RequestID)
	}
	if items.last.PublicToken != "public-sandbox-xyz" || items.last.AccessToken != "access-secret" {
		t.Fatalf("upsert payload: %+v", items.last)
	}
	if items.last.ItemID == nil || *items.last.ItemID != "M-plaid-item" {
		t.Fatalf("item_id: %+v", items.last.ItemID)
	}
	if out.Item.UserID != 42 || out.Item.ID != 99 {
		t.Fatalf("response item: %+v", out.Item)
	}
	if out.Item.PlaidItemID == nil || *out.Item.PlaidItemID != "M-plaid-item" {
		t.Fatalf("PlaidItemID: %+v", out.Item.PlaidItemID)
	}
}
