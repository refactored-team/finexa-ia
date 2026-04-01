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
