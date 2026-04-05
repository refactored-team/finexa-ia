package models

import "time"

// PlaidItemResponse is returned by HTTP handlers (no access_token).
type PlaidItemResponse struct {
	ID              int64      `json:"id"`
	UserID          int64      `json:"user_id"`
	PublicToken     string     `json:"public_token"`
	InstitutionID   *string    `json:"institution_id,omitempty"`
	InstitutionName *string    `json:"institution_name,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// CreatePlaidItemRequest is the JSON body for POST /plaid-item (includes secret token for storage only).
type CreatePlaidItemRequest struct {
	PublicToken     string  `json:"public_token"`
	AccessToken     string  `json:"access_token"`
	InstitutionID   *string `json:"institution_id,omitempty"`
	InstitutionName *string `json:"institution_name,omitempty"`
}
