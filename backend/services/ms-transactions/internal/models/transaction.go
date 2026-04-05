package models

// TransactionListItem is a row returned by GET /v1/transactions (MVP).
type TransactionListItem struct {
	ID          int64  `json:"id"`
	UserID      int64  `json:"user_id"`
	AmountCents int64  `json:"amount_cents"`
	Currency    string `json:"currency"`
	Description string `json:"description,omitempty"`
	PostedAt    string `json:"posted_at"`
}
