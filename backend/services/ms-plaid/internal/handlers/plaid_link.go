package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"

	"finexa-ia/apiresult"
	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/services"
)

// PlaidLinkHandler creates Plaid Link tokens for a user.
type PlaidLinkHandler struct {
	svc *services.PlaidLinkService
}

func NewPlaidLinkHandler(svc *services.PlaidLinkService) *PlaidLinkHandler {
	return &PlaidLinkHandler{svc: svc}
}

func (h *PlaidLinkHandler) Register(e *echo.Echo) {
	g := e.Group("/v1/users/:userId/plaid")
	g.POST("/link-token", h.createLinkToken)
}

func (h *PlaidLinkHandler) parseUserID(c *echo.Context) (int64, error) {
	return strconv.ParseInt(c.Param("userId"), 10, 64)
}

// createLinkToken calls Plaid /link/token/create and records session metadata.
//
//	@Summary		Crear link token Plaid
//	@Description	Inicializa una sesión Link: llama a Plaid y persiste metadatos (sin guardar el link_token).
//	@Tags			plaid-link
//	@Accept			json
//	@Produce		json
//	@Param			userId	path		int									true	"ID interno de usuario (FK)"
//	@Param			body	body		models.CreateLinkTokenBody	false	"Overrides opcionales (webhook, redirect)"
//	@Success		200	{object}	models.LinkTokenOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		503	{object}	apiresult.ErrResult
//	@Failure		502	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{userId}/plaid/link-token [post]
func (h *PlaidLinkHandler) createLinkToken(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}

	var body models.CreateLinkTokenBody
	_ = c.Bind(&body)

	out, err := h.svc.CreateLinkToken(c.Request().Context(), userID, body)
	if err != nil {
		return h.mapError(c, err)
	}
	return apiresult.RespondOK(c, http.StatusOK, out)
}

func (h *PlaidLinkHandler) mapError(c *echo.Context, err error) error {
	switch {
	case errors.Is(err, services.ErrInvalidUserID):
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
	case errors.Is(err, services.ErrPlaidNotConfigured):
		return apiresult.RespondError(c, http.StatusServiceUnavailable, apiresult.CodePlaidNotConfigured, "plaid is not configured", nil)
	case errors.Is(err, services.ErrUserNotFound):
		return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, err.Error(), nil)
	case errors.Is(err, services.ErrPlaidRequest):
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
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
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "internal error", nil)
	}
}
