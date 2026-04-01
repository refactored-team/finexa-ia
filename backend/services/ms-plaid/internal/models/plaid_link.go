package models

import "time"

// CreateLinkTokenBody optional JSON overrides for POST .../plaid/link-token.
type CreateLinkTokenBody struct {
	RedirectURI *string `json:"redirect_uri,omitempty"`
	WebhookURL  *string `json:"webhook_url,omitempty"`
}

// LinkTokenResponse is returned to the mobile/web client to initialize Plaid Link.
type LinkTokenResponse struct {
	LinkToken  string    `json:"link_token"`
	Expiration time.Time `json:"expiration"`
	RequestID  string    `json:"request_id"`
}

// PlaidAPIErrorInfo is a safe subset of a Plaid error for JSON responses.
type PlaidAPIErrorInfo struct {
	ErrorType    string `json:"error_type,omitempty"`
	ErrorCode    string `json:"error_code,omitempty"`
	ErrorMessage string `json:"error_message,omitempty"`
}

// LinkTokenErrorResponse is used when link-token creation fails.
type LinkTokenErrorResponse struct {
	Message string             `json:"message"`
	Plaid   *PlaidAPIErrorInfo `json:"plaid,omitempty"`
}
