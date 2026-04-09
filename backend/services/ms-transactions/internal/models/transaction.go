package models

// TransactionListItem representa una transacción del usuario autenticado.
type TransactionListItem struct {
	ID            int64   `json:"id"`
	TransactionID *string `json:"transaction_id,omitempty"`
	AmountCents   int64   `json:"amount_cents"`
	Currency      string  `json:"currency"`
	Description   string  `json:"description,omitempty"`
	PostedAt      string  `json:"posted_at"`
	Category      *string `json:"category,omitempty"`
	DeletedAt     *string `json:"deleted_at,omitempty"`
}
