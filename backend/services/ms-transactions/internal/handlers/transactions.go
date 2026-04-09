package handlers

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v5"

	"finexa-ia/apiresult"
	"finexa-ia/ms-transactions/internal/auth"
	"finexa-ia/ms-transactions/internal/config"
	"finexa-ia/ms-transactions/internal/models"
)

const (
	defaultListLimit = 50
	maxListLimit     = 200
)

type TransactionsHandler struct {
	db   *sql.DB
	cfg  *config.App
	auth *auth.Deps
}

func NewTransactionsHandler(db *sql.DB, cfg *config.App, authDeps *auth.Deps) *TransactionsHandler {
	return &TransactionsHandler{db: db, cfg: cfg, auth: authDeps}
}

func (h *TransactionsHandler) Register(e *echo.Echo) {
	g := e.Group("/v1/transactions")
	g.Use(h.auth.Middleware(h.db))
	g.GET("", h.list)
	g.GET("/:id", h.getByID)
	g.GET("/by-transaction-id/:transaction_id", h.getByTransactionID)
	g.POST("/test-bedrock", h.testBedrock)
}

// list returns paginated transactions for the authenticated user only.
//
//	@Summary		Listar transacciones del usuario autenticado
//	@Description	Listado paginado por usuario autenticado. Soporta filtros por rango de fecha y categoría. Excluye borradas lógicas por defecto.
//	@Tags			transactions
//	@Produce		json
//	@Param			limit		query		int		false	"Tamaño de página (default 50, max 200)"
//	@Param			offset		query		int		false	"Offset paginación (default 0)"
//	@Param			from		query		string	false	"RFC3339 inicio (posted_at >= from)"
//	@Param			to			query		string	false	"RFC3339 fin (posted_at <= to)"
//	@Param			category	query		string	false	"Filtro por categoría"
//	@Success		200			{object}	apiresult.okEnvelope[[]models.TransactionListItem]
//	@Failure		400			{object}	apiresult.ErrResult
//	@Failure		401			{object}	apiresult.ErrResult
//	@Failure		500			{object}	apiresult.ErrResult
//	@Router			/v1/transactions [get]
func (h *TransactionsHandler) list(c *echo.Context) error {
	uid, ok := authUserID(c)
	if !ok {
		return apiresult.RespondError(c, http.StatusUnauthorized, apiresult.CodeUnauthorized, "missing authenticated user", nil)
	}

	limit := defaultListLimit
	offset := 0
	if raw := strings.TrimSpace(c.QueryParam("limit")); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n <= 0 || n > maxListLimit {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "limit must be between 1 and 200", nil)
		}
		limit = n
	}
	if raw := strings.TrimSpace(c.QueryParam("offset")); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 0 {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "offset must be >= 0", nil)
		}
		offset = n
	}

	var from *time.Time
	if raw := strings.TrimSpace(c.QueryParam("from")); raw != "" {
		t, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "from must be RFC3339", nil)
		}
		from = &t
	}
	var to *time.Time
	if raw := strings.TrimSpace(c.QueryParam("to")); raw != "" {
		t, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "to must be RFC3339", nil)
		}
		to = &t
	}
	if from != nil && to != nil && from.After(*to) {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "from must be <= to", nil)
	}
	category := strings.TrimSpace(c.QueryParam("category"))

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	q := `SELECT id, transaction_id, amount_cents, currency, COALESCE(description, ''), posted_at, category, deleted_at
FROM transactions
WHERE user_id = $1
  AND deleted_at IS NULL
  AND ($2::timestamptz IS NULL OR posted_at >= $2::timestamptz)
  AND ($3::timestamptz IS NULL OR posted_at <= $3::timestamptz)
  AND ($4::text IS NULL OR $4::text = '' OR category = $4::text)
ORDER BY posted_at DESC, id DESC
LIMIT $5 OFFSET $6`
	rows, err := h.db.QueryContext(ctx, q, uid, from, to, category, limit, offset)
	if err != nil {
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "query failed", nil)
	}
	defer rows.Close()

	out := make([]models.TransactionListItem, 0, limit)
	for rows.Next() {
		var (
			it            models.TransactionListItem
			posted        time.Time
			transactionID sql.NullString
			cat           sql.NullString
			deletedAt     sql.NullTime
		)
		if err := rows.Scan(
			&it.ID,
			&transactionID,
			&it.AmountCents,
			&it.Currency,
			&it.Description,
			&posted,
			&cat,
			&deletedAt,
		); err != nil {
			return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "scan failed", nil)
		}
		it.PostedAt = posted.UTC().Format(time.RFC3339Nano)
		if transactionID.Valid {
			v := transactionID.String
			it.TransactionID = &v
		}
		if cat.Valid {
			v := cat.String
			it.Category = &v
		}
		if deletedAt.Valid {
			v := deletedAt.Time.UTC().Format(time.RFC3339Nano)
			it.DeletedAt = &v
		}
		out = append(out, it)
	}
	if err := rows.Err(); err != nil {
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "rows error", nil)
	}

	return apiresult.RespondOK(c, http.StatusOK, out)
}

// getByID returns one transaction by internal ID for the authenticated user only.
//
//	@Summary		Detalle por id interno
//	@Description	Obtiene una transacción por id interno, aislada por usuario autenticado y excluyendo borradas lógicas.
//	@Tags			transactions
//	@Produce		json
//	@Param			id	path		int	true	"ID interno"
//	@Success		200	{object}	apiresult.okEnvelope[models.TransactionListItem]
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		401	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/transactions/{id} [get]
func (h *TransactionsHandler) getByID(c *echo.Context) error {
	uid, ok := authUserID(c)
	if !ok {
		return apiresult.RespondError(c, http.StatusUnauthorized, apiresult.CodeUnauthorized, "missing authenticated user", nil)
	}
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid id", nil)
	}
	it, err := h.selectOne(c.Request().Context(), uid, `id = $2`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, "transaction not found", nil)
	}
	if err != nil {
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "query failed", nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, it)
}

// getByTransactionID returns one transaction by external transaction_id for the authenticated user only.
//
//	@Summary		Detalle por transaction_id
//	@Description	Obtiene una transacción por transaction_id, aislada por usuario autenticado y excluyendo borradas lógicas.
//	@Tags			transactions
//	@Produce		json
//	@Param			transaction_id	path		string	true	"transaction_id externo"
//	@Success		200				{object}	apiresult.okEnvelope[models.TransactionListItem]
//	@Failure		400				{object}	apiresult.ErrResult
//	@Failure		401				{object}	apiresult.ErrResult
//	@Failure		404				{object}	apiresult.ErrResult
//	@Failure		500				{object}	apiresult.ErrResult
//	@Router			/v1/transactions/by-transaction-id/{transaction_id} [get]
func (h *TransactionsHandler) getByTransactionID(c *echo.Context) error {
	uid, ok := authUserID(c)
	if !ok {
		return apiresult.RespondError(c, http.StatusUnauthorized, apiresult.CodeUnauthorized, "missing authenticated user", nil)
	}
	txID := strings.TrimSpace(c.Param("transaction_id"))
	if txID == "" {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "transaction_id is required", nil)
	}
	it, err := h.selectOne(c.Request().Context(), uid, `transaction_id = $2`, txID)
	if errors.Is(err, sql.ErrNoRows) {
		return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, "transaction not found", nil)
	}
	if err != nil {
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "query failed", nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, it)
}

func (h *TransactionsHandler) selectOne(parent context.Context, userID int64, whereCond string, value any) (models.TransactionListItem, error) {
	ctx, cancel := context.WithTimeout(parent, 5*time.Second)
	defer cancel()

	q := fmt.Sprintf(`SELECT id, transaction_id, amount_cents, currency, COALESCE(description, ''), posted_at, category, deleted_at
FROM transactions
WHERE user_id = $1
  AND %s
  AND deleted_at IS NULL
LIMIT 1`, whereCond)
	var (
		it            models.TransactionListItem
		posted        time.Time
		transactionID sql.NullString
		cat           sql.NullString
		deletedAt     sql.NullTime
	)
	err := h.db.QueryRowContext(ctx, q, userID, value).Scan(
		&it.ID,
		&transactionID,
		&it.AmountCents,
		&it.Currency,
		&it.Description,
		&posted,
		&cat,
		&deletedAt,
	)
	if err != nil {
		return models.TransactionListItem{}, err
	}
	it.PostedAt = posted.UTC().Format(time.RFC3339Nano)
	if transactionID.Valid {
		v := transactionID.String
		it.TransactionID = &v
	}
	if cat.Valid {
		v := cat.String
		it.Category = &v
	}
	if deletedAt.Valid {
		v := deletedAt.Time.UTC().Format(time.RFC3339Nano)
		it.DeletedAt = &v
	}
	return it, nil
}

// testBedrock is a simple endpoint to test communication with the python ai-pipeline.
//
//	@Summary		Probar IA (Bedrock)
//	@Description	Hace una llamada simple al ai-pipeline (FastAPI) para probar Bedrock
//	@Tags			ai
//	@Produce		json
//	@Success		200	{object}	map[string]interface{}
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/transactions/test-bedrock [post]
func (h *TransactionsHandler) testBedrock(c *echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), 15*time.Second)
	defer cancel()

	base := h.cfg.ResolveAIPipelineBaseURL()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/test-bedrock", base), nil)
	if err != nil {
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "failed to create request", nil)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return apiresult.RespondError(c, http.StatusBadGateway, apiresult.CodeBadGateway, "failed to call ai-pipeline", map[string]any{"cause": err.Error()})
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return apiresult.RespondError(c, http.StatusBadGateway, apiresult.CodeBadGateway, "ai-pipeline returned non-200 status", map[string]any{"status": resp.StatusCode})
	}

	return c.Stream(http.StatusOK, "application/json", resp.Body)
}

func authUserID(c *echo.Context) (int64, bool) {
	v := c.Get(auth.AuthUserIDKey)
	id, ok := v.(int64)
	return id, ok
}
