// Package transactionssync dispara ms-transactions POST .../sync-and-analyze tras vincular Plaid.
package transactionssync

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client llama al pipeline Plaid + IA en ms-transactions. Si la base URL está vacía, no hace nada.
type Client struct {
	base   string
	client *http.Client
}

// New construye el cliente. baseURL es la raíz de ms-transactions (sin barra final), p. ej. http://localhost:8081
func New(baseURL string) Client {
	b := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	return Client{
		base: b,
		client: &http.Client{
			Timeout: 95 * time.Second,
		},
	}
}

// Enabled indica si hay URL configurada.
func (c Client) Enabled() bool {
	return c.base != ""
}

// TriggerSyncAnalyze ejecuta POST /v1/users/{userId}/transactions/sync-and-analyze.
func (c Client) TriggerSyncAnalyze(ctx context.Context, userID int64) error {
	if !c.Enabled() {
		return nil
	}
	if userID <= 0 {
		return fmt.Errorf("invalid user id")
	}
	url := fmt.Sprintf("%s/v1/users/%d/transactions/sync-and-analyze", c.base, userID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader([]byte("{}")))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("sync-and-analyze request: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("sync-and-analyze status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	return nil
}
