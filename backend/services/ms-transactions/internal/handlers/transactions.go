package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v5"

	"finexa-ia/ms-transactions/internal/models"
)

type TransactionsHandler struct {
	db *sql.DB
}

func NewTransactionsHandler(db *sql.DB) *TransactionsHandler {
	return &TransactionsHandler{db: db}
}

func (h *TransactionsHandler) Register(e *echo.Echo) {
	g := e.Group("/v1/transactions")
	g.GET("", h.list)
}

// list returns recent transactions, optionally filtered by user_id.
//
//	@Summary		Listar transacciones
//	@Description	Lista transacciones (MVP); query user_id opcional
//	@Tags			transactions
//	@Produce		json
//	@Param			user_id	query	int	false	"Filtrar por usuario interno"
//	@Success		200	{array}	models.TransactionListItem
//	@Failure		400	{string}	string	"user_id inválido"
//	@Failure		500	{string}	string
//	@Router			/v1/transactions [get]
func (h *TransactionsHandler) list(c *echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	q := `SELECT id, user_id, amount_cents, currency, COALESCE(description, ''), posted_at
FROM transactions ORDER BY posted_at DESC LIMIT 100`
	args := []any{}

	if raw := c.QueryParam("user_id"); raw != "" {
		uid, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid user_id"})
		}
		q = `SELECT id, user_id, amount_cents, currency, COALESCE(description, ''), posted_at
FROM transactions WHERE user_id = $1 ORDER BY posted_at DESC LIMIT 100`
		args = append(args, uid)
	}

	rows, err := h.db.QueryContext(ctx, q, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query failed"})
	}
	defer rows.Close()

	var out []models.TransactionListItem
	for rows.Next() {
		var it models.TransactionListItem
		var posted time.Time
		if err := rows.Scan(&it.ID, &it.UserID, &it.AmountCents, &it.Currency, &it.Description, &posted); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "scan failed"})
		}
		it.PostedAt = posted.UTC().Format(time.RFC3339Nano)
		out = append(out, it)
	}
	if err := rows.Err(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "rows error"})
	}
	if out == nil {
		out = []models.TransactionListItem{}
	}
	return c.JSON(http.StatusOK, out)
}
