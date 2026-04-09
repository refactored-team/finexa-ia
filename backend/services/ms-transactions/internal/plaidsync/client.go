package plaidsync

import (
	"context"
	"fmt"
	"strings"

	"github.com/plaid/plaid-go/v41/plaid"

	"finexa-ia/ms-transactions/internal/config"
)

type SyncResult struct {
	Transactions []plaid.Transaction
	Pages        int
}

type Client struct {
	api *plaid.APIClient
}

func New(cfg *config.App) *Client {
	if cfg == nil || !cfg.PlaidConfigured() {
		return &Client{}
	}
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
	return &Client{api: plaid.NewAPIClient(configuration)}
}

func (c *Client) Configured() bool {
	return c != nil && c.api != nil
}

func (c *Client) SyncAll(ctx context.Context, accessToken string) (SyncResult, error) {
	if !c.Configured() {
		return SyncResult{}, fmt.Errorf("plaid client not configured")
	}
	cursor := ""
	out := SyncResult{}
	for {
		req := plaid.NewTransactionsSyncRequest(accessToken)
		if cursor != "" {
			req.SetCursor(cursor)
		}
		resp, _, err := c.api.PlaidApi.TransactionsSync(ctx).TransactionsSyncRequest(*req).Execute()
		if err != nil {
			return SyncResult{}, err
		}
		out.Pages++
		out.Transactions = append(out.Transactions, resp.GetAdded()...)
		cursor = resp.GetNextCursor()
		if !resp.GetHasMore() {
			break
		}
	}
	return out, nil
}
