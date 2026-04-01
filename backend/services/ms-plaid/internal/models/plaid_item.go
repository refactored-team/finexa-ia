package models

import "time"

// PlaidItemResponse is returned by HTTP handlers (no access_token).
type PlaidItemResponse struct {
	ID              int64      `json:"id"`
	UserID          int64      `json:"user_id"`
	PlaidItemID     string     `json:"plaid_item_id"`
	InstitutionID   *string    `json:"institution_id,omitempty"`
	InstitutionName *string    `json:"institution_name,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// CreatePlaidItemRequest is the JSON body for POST (includes secret token for storage only).
type CreatePlaidItemRequest struct {
	PlaidItemID     string  `json:"plaid_item_id"`
	AccessToken     string  `json:"access_token"`
	InstitutionID   *string `json:"institution_id,omitempty"`
	InstitutionName *string `json:"institution_name,omitempty"`
}
