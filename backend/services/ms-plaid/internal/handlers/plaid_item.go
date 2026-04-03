package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"

	"finexa-ia/apiresult"
	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/services"
)

// PlaidItemHandler exposes the single Plaid connection per user (path userId).
// Caller identity should be enforced at the API gateway; this service trusts userId in the URL.
type PlaidItemHandler struct {
	svc *services.PlaidItemService
}

func NewPlaidItemHandler(svc *services.PlaidItemService) *PlaidItemHandler {
	return &PlaidItemHandler{svc: svc}
}

func (h *PlaidItemHandler) Register(e *echo.Echo) {
	g := e.Group("/v1/users/:userId/plaid-item")
	g.GET("", h.get)
	g.POST("", h.upsert)
	g.DELETE("", h.delete)
}

func (h *PlaidItemHandler) parseUserID(c *echo.Context) (int64, error) {
	return strconv.ParseInt(c.Param("userId"), 10, 64)
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

// upsert registers or replaces the user’s Plaid connection (one active row per user).
//
//	@Summary		Registrar o actualizar conexión Plaid
//	@Tags			plaid-item
//	@Accept			json
//	@Produce		json
//	@Param			userId	path		int								true	"ID interno de usuario (FK)"
//	@Param			body	body		models.CreatePlaidItemRequest	true	"Cuerpo"
//	@Success		200	{object}	models.PlaidItemOKResult
//	@Failure		400	{object}	apiresult.ErrResult
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
	item, err := h.svc.UpsertForUser(c.Request().Context(), userID, in)
	if err != nil {
		if errors.Is(err, services.ErrInvalidPlaidItemPayload) || errors.Is(err, services.ErrInvalidUserID) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
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
