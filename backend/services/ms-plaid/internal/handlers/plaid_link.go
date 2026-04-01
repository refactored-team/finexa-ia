package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"

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
//	@Success		200	{object}	models.LinkTokenResponse
//	@Failure		400	{object}	models.LinkTokenErrorResponse
//	@Failure		404	{object}	models.LinkTokenErrorResponse
//	@Failure		503	{object}	models.LinkTokenErrorResponse
//	@Failure		502	{object}	models.LinkTokenErrorResponse
//	@Failure		500	{object}	models.LinkTokenErrorResponse
//	@Router			/v1/users/{userId}/plaid/link-token [post]
func (h *PlaidLinkHandler) createLinkToken(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return c.JSON(http.StatusBadRequest, models.LinkTokenErrorResponse{Message: "invalid user id"})
	}

	var body models.CreateLinkTokenBody
	_ = c.Bind(&body)

	out, err := h.svc.CreateLinkToken(c.Request().Context(), userID, body)
	if err != nil {
		return h.mapError(c, err)
	}
	return c.JSON(http.StatusOK, out)
}

func (h *PlaidLinkHandler) mapError(c *echo.Context, err error) error {
	switch {
	case errors.Is(err, services.ErrInvalidUserID):
		return c.JSON(http.StatusBadRequest, models.LinkTokenErrorResponse{Message: err.Error()})
	case errors.Is(err, services.ErrPlaidNotConfigured):
		return c.JSON(http.StatusServiceUnavailable, models.LinkTokenErrorResponse{Message: "plaid is not configured"})
	case errors.Is(err, services.ErrUserNotFound):
		return c.JSON(http.StatusNotFound, models.LinkTokenErrorResponse{Message: err.Error()})
	case errors.Is(err, services.ErrPlaidRequest):
		return c.JSON(http.StatusBadRequest, models.LinkTokenErrorResponse{Message: err.Error()})
	default:
		if info, ok := services.MapPlaidError(err); ok {
			cloned := info
			return c.JSON(http.StatusBadGateway, models.LinkTokenErrorResponse{
				Message: "plaid API error",
				Plaid:   &cloned,
			})
		}
		return c.JSON(http.StatusInternalServerError, models.LinkTokenErrorResponse{Message: "internal error"})
	}
}
