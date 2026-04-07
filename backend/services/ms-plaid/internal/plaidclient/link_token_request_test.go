package plaidclient_test

import (
	"testing"

	"finexa-ia/ms-plaid/internal/config"
	"finexa-ia/ms-plaid/internal/plaidclient"
)

func TestBuildLinkTokenCreateRequest_defaults(t *testing.T) {
	cfg := &config.App{
		PlaidClientID: "id",
		PlaidSecret:   "sec",
	}
	req, err := plaidclient.BuildLinkTokenCreateRequest(cfg, 7, plaidclient.LinkTokenOverrides{})
	if err != nil {
		t.Fatal(err)
	}
	if req.GetClientName() == "" || req.GetLanguage() == "" {
		t.Fatalf("missing defaults: %+v", req)
	}
	if req.GetUser().ClientUserId != "7" {
		t.Fatalf("client_user_id: got %q", req.GetUser().ClientUserId)
	}
}

func TestBuildLinkTokenCreateRequest_invalidCountry(t *testing.T) {
	cfg := &config.App{
		PlaidCountryCodes: "XX",
	}
	_, err := plaidclient.BuildLinkTokenCreateRequest(cfg, 1, plaidclient.LinkTokenOverrides{})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestBuildLinkTokenCreateRequest_invalidProduct(t *testing.T) {
	cfg := &config.App{
		PlaidProducts: "not_a_real_product",
	}
	_, err := plaidclient.BuildLinkTokenCreateRequest(cfg, 1, plaidclient.LinkTokenOverrides{})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestBuildLinkTokenCreateRequest_linkCustomizationName(t *testing.T) {
	cfg := &config.App{
		PlaidClientID:              "id",
		PlaidSecret:                "sec",
		PlaidLinkCustomizationName: "my_finexa_link",
	}
	req, err := plaidclient.BuildLinkTokenCreateRequest(cfg, 1, plaidclient.LinkTokenOverrides{})
	if err != nil {
		t.Fatal(err)
	}
	if req.GetLinkCustomizationName() != "my_finexa_link" {
		t.Fatalf("link_customization_name: got %q", req.GetLinkCustomizationName())
	}
}
