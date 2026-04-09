package handlers

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v5"

	"finexa-ia/apiresult"
	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/services"
	"finexa-ia/ms-plaid/internal/transactionssync"
)

// PlaidItemHandler exposes the single Plaid connection per user (path userId).
// Caller identity should be enforced at the API gateway; this service trusts userId in the URL.
type PlaidItemHandler struct {
	svc      *services.PlaidItemService
	exchange *services.PlaidExchangeService
	sync     transactionssync.Client
}

func NewPlaidItemHandler(svc *services.PlaidItemService, exchange *services.PlaidExchangeService, sync transactionssync.Client) *PlaidItemHandler {
	return &PlaidItemHandler{svc: svc, exchange: exchange, sync: sync}
}

// scheduleSyncAnalyzeAfterExchange dispara en background ms-transactions sync-and-analyze (Plaid + IA).
func (h *PlaidItemHandler) scheduleSyncAnalyzeAfterExchange(userID int64) {
	if !h.sync.Enabled() {
		return
	}
	uid := userID
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 95*time.Second)
		defer cancel()
		if err := h.sync.TriggerSyncAnalyze(ctx, uid); err != nil {
			slog.Error("post-exchange sync-and-analyze failed", "user_id", uid, "error", err)
			return
		}
		slog.Info("post-exchange sync-and-analyze completed", "user_id", uid)
	}()
}

func (h *PlaidItemHandler) Register(e *echo.Echo) {
	g := e.Group("/v1/users/:userId/plaid-item")
	g.GET("/status", h.linkStatus)
	g.GET("", h.get)
	g.POST("/exchange", h.exchangePublicToken)
	g.POST("", h.upsert)
	g.DELETE("", h.delete)
}

func (h *PlaidItemHandler) parseUserID(c *echo.Context) (int64, error) {
	return strconv.ParseInt(c.Param("userId"), 10, 64)
}

// linkStatus returns whether the user has an active Plaid connection (for onboarding / gating UI).
//
//	@Summary		Estado de vinculación Plaid
//	@Description	Indica si existe un plaid_item activo (deleted_at IS NULL). Siempre 200 con linked true/false.
//	@Tags			plaid-item
//	@Param			userId	path	int	true	"ID interno de usuario (FK)"
//	@Produce		json
//	@Success		200	{object}	models.PlaidLinkStatusOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{userId}/plaid-item/status [get]
func (h *PlaidItemHandler) linkStatus(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}
	linked, err := h.svc.LinkStatusForUser(c.Request().Context(), userID)
	if err != nil {
		if errors.Is(err, services.ErrInvalidUserID) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, models.PlaidLinkStatusData{Linked: linked})
}

// get returns the user’s active Plaid connection, if any.
//
//	@Summary		Obtener conexión Plaid
//	@Description	Como máximo una conexión activa por usuario (sin access_token en respuesta)
//	@Tags			plaid-item
//	@Param			userId	path		int	true	"ID interno de usuario (FK)"
//	@Produce		json
//	@Success		200	{object}	models.PlaidItemOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{userId}/plaid-item [get]
func (h *PlaidItemHandler) get(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}
	item, err := h.svc.GetForUser(c.Request().Context(), userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		}
		if errors.Is(err, services.ErrInvalidUserID) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, item)
}

// exchangePublicToken calls Plaid /item/public_token/exchange and persists access_token server-side.
//
//	@Summary		Intercambiar public_token por Item
//	@Description	Envía el public_token de Link a Plaid, guarda access_token e item_id en BD; no devuelve access_token.
//	@Tags			plaid-item
//	@Accept			json
//	@Produce		json
//	@Param			userId	path		int								true	"ID interno de usuario (FK)"
//	@Param			body	body		models.ExchangePublicTokenBody	true	"public_token de Link onSuccess"
//	@Success		200	{object}	models.ExchangePublicTokenOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		503	{object}	apiresult.ErrResult
//	@Failure		502	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{userId}/plaid-item/exchange [post]
func (h *PlaidItemHandler) exchangePublicToken(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}
	var body models.ExchangePublicTokenBody
	if err := c.Bind(&body); err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid request body", nil)
	}
	out, err := h.exchange.ExchangeForUser(c.Request().Context(), userID, body.PublicToken)
	if err != nil {
		return h.mapExchangeError(c, err)
	}
	h.scheduleSyncAnalyzeAfterExchange(userID)
	return apiresult.RespondOK(c, http.StatusOK, out)
}

func (h *PlaidItemHandler) mapExchangeError(c *echo.Context, err error) error {
	switch {
	case errors.Is(err, services.ErrInvalidUserID):
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
	case errors.Is(err, services.ErrEmptyPublicToken):
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
	case errors.Is(err, services.ErrPlaidNotConfigured):
		return apiresult.RespondError(c, http.StatusServiceUnavailable, apiresult.CodePlaidNotConfigured, "plaid is not configured", nil)
	case errors.Is(err, services.ErrUserNotFound):
		return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, err.Error(), nil)
	default:
		if info, ok := services.MapPlaidError(err); ok {
			return apiresult.RespondError(c, http.StatusBadGateway, apiresult.CodePlaidUpstreamError, "plaid API error", map[string]any{
				"plaid": map[string]any{
					"error_type":    info.ErrorType,
					"error_code":    info.ErrorCode,
					"error_message": info.ErrorMessage,
				},
			})
		}
		c.Logger().Error("plaid-item exchange: unmapped error", "error", err)
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "internal error", nil)
	}
}

// upsert registers or replaces the user’s Plaid connection (one active row per user).
// If access_token is omitted or empty, the server calls Plaid item/public_token/exchange (same as POST .../exchange).
//
//	@Summary		Registrar o actualizar conexión Plaid
//	@Description	Solo public_token: intercambia en Plaid y persiste; 200 = mismo shape que POST .../exchange (data.request_id + data.item). Con public_token y access_token: upsert legacy; 200 = PlaidItemOKResult (data es el item sin request_id).
//	@Tags			plaid-item
//	@Accept			json
//	@Produce		json
//	@Param			userId	path		int								true	"ID interno de usuario (FK)"
//	@Param			body	body		models.CreatePlaidItemRequest	true	"Cuerpo"
//	@Success		200	{object}	models.ExchangePublicTokenOKResult	"Flujo Link (solo public_token); legacy ver descripción"
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		503	{object}	apiresult.ErrResult
//	@Failure		502	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{userId}/plaid-item [post]
func (h *PlaidItemHandler) upsert(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}
	var in models.CreatePlaidItemRequest
	if err := c.Bind(&in); err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid request body", nil)
	}
	if strings.TrimSpace(in.AccessToken) == "" && strings.TrimSpace(in.PublicToken) != "" {
		out, errEx := h.exchange.ExchangeForUser(c.Request().Context(), userID, in.PublicToken)
		if errEx != nil {
			return h.mapExchangeError(c, errEx)
		}
		h.scheduleSyncAnalyzeAfterExchange(userID)
		return apiresult.RespondOK(c, http.StatusOK, out)
	}
	item, err := h.svc.UpsertForUser(c.Request().Context(), userID, in)
	if err != nil {
		if errors.Is(err, services.ErrInvalidPlaidItemPayload) || errors.Is(err, services.ErrInvalidUserID) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
		c.Logger().Error("plaid-item upsert failed", "error", err, "user_id", userID)
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, item)
}

// delete soft-deletes the user’s active Plaid connection.
//
//	@Summary		Desconectar Plaid (baja lógica)
//	@Tags			plaid-item
//	@Param			userId	path	int	true	"ID interno de usuario (FK)"
//	@Produce		json
//	@Success		200	{object}	models.PlaidItemDeleteOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{userId}/plaid-item [delete]
func (h *PlaidItemHandler) delete(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}
	if err := h.svc.DeleteForUser(c.Request().Context(), userID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		}
		if errors.Is(err, services.ErrInvalidUserID) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, models.PlaidItemDeleteData{Deleted: true})
}
