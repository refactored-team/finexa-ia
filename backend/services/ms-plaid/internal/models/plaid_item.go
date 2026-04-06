package models

import "time"

// PlaidItemResponse is returned by HTTP handlers (no access_token).
type PlaidItemResponse struct {
	ID              int64     `json:"id"`
	UserID          int64     `json:"user_id"`
	PublicToken     string    `json:"public_token"`
	PlaidItemID     *string   `json:"item_id,omitempty"` // Plaid Item.item_id (webhooks)
	InstitutionID   *string   `json:"institution_id,omitempty"`
	InstitutionName *string   `json:"institution_name,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// CreatePlaidItemRequest is the JSON body for POST /plaid-item.
// Omit access_token to let the server call Plaid exchange; include both for legacy direct upsert.
type CreatePlaidItemRequest struct {
	PublicToken     string  `json:"public_token"`
	AccessToken     string  `json:"access_token,omitempty"`
	ItemID          *string `json:"item_id,omitempty"` // Plaid item_id (optional on legacy upsert)
	InstitutionID   *string `json:"institution_id,omitempty"`
	InstitutionName *string `json:"institution_name,omitempty"`
}

// ExchangePublicTokenBody is the JSON body for POST .../plaid-item/exchange.
type ExchangePublicTokenBody struct {
	PublicToken string `json:"public_token"`
}
