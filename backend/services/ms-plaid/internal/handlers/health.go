package handlers

import (
	"net/http"

	"github.com/labstack/echo/v5"

	"finexa-ia/ms-plaid/internal/models"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler { return &HealthHandler{} }

func (h *HealthHandler) Register(e *echo.Echo) {
	e.GET("/health", h.check)
}

// check liveness.
//
//	@Summary		Health check
//	@Description	Servicio operativo
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	models.HealthResponse
//	@Router			/health [get]
func (h *HealthHandler) check(c *echo.Context) error {
	return c.JSON(http.StatusOK, models.HealthResponse{Status: "ok"})
}
