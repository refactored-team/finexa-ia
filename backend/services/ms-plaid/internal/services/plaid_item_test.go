package services_test

import (
	"context"
	"testing"

	"finexa-ia/ms-plaid/internal/services"
)

func TestPlaidItemService_LinkStatusForUser_invalidUser(t *testing.T) {
	// nil repo would panic; only invalid userID is tested without DB.
	svc := services.NewPlaidItemService(nil)
	_, err := svc.LinkStatusForUser(context.Background(), 0)
	if err != services.ErrInvalidUserID {
		t.Fatalf("got %v want ErrInvalidUserID", err)
	}
}
