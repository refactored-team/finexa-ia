package plaidclient

import (
	"strings"

	"github.com/plaid/plaid-go/v41/plaid"

	"finexa-ia/ms-plaid/internal/config"
)

// NewAPIClient builds a Plaid API client from application config.
func NewAPIClient(cfg *config.App) *plaid.APIClient {
	configuration := plaid.NewConfiguration()
	configuration.AddDefaultHeader("PLAID-CLIENT-ID", strings.TrimSpace(cfg.PlaidClientID))
	configuration.AddDefaultHeader("PLAID-SECRET", strings.TrimSpace(cfg.PlaidSecret))

	switch strings.TrimSpace(strings.ToLower(cfg.PlaidEnv)) {
	case "", "sandbox":
		configuration.UseEnvironment(plaid.Sandbox)
	case "production":
		configuration.UseEnvironment(plaid.Production)
	case "development":
		configuration.UseEnvironment(plaid.Environment("https://development.plaid.com"))
	default:
		configuration.UseEnvironment(plaid.Environment(cfg.PlaidEnv))
	}

	return plaid.NewAPIClient(configuration)
}
