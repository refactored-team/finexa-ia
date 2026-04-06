package models

// LinkTokenOKResult is the success envelope for POST .../plaid/link-token (OpenAPI).
type LinkTokenOKResult struct {
	OK   bool              `json:"ok"`
	Data LinkTokenResponse `json:"data"`
}

// PlaidItemOKResult is the success envelope for GET/POST .../plaid-item.
type PlaidItemOKResult struct {
	OK   bool              `json:"ok"`
	Data PlaidItemResponse `json:"data"`
}

// PlaidItemDeleteData is the payload for a successful DELETE .../plaid-item.
type PlaidItemDeleteData struct {
	Deleted bool `json:"deleted"`
}

// PlaidItemDeleteOKResult is the success envelope for DELETE .../plaid-item.
type PlaidItemDeleteOKResult struct {
	OK   bool                `json:"ok"`
	Data PlaidItemDeleteData `json:"data"`
}

// ExchangePublicTokenResult is the payload for POST .../plaid-item/exchange (no access_token).
type ExchangePublicTokenResult struct {
	RequestID string            `json:"request_id"`
	Item      PlaidItemResponse `json:"item"`
}

// ExchangePublicTokenOKResult is the success envelope for POST .../plaid-item/exchange.
type ExchangePublicTokenOKResult struct {
	OK   bool                      `json:"ok"`
	Data ExchangePublicTokenResult `json:"data"`
}
