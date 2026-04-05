package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"

	"finexa-ia/ms-users/internal/models"
)

type HealthHandler struct {
	db *sql.DB
}

func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) Register(e *echo.Echo) {
	e.GET("/", h.ready)
	e.GET("/ready", h.ready)
	e.GET("/health", h.check)
}

func (h *HealthHandler) ready(c *echo.Context) error {
	return c.JSON(http.StatusOK, models.HealthResponse{
		Status:   "ok",
		Database: "not_checked",
	})
}

// check verifica conectividad con Postgres (Ping).
//
//	@Summary		Health check
//	@Description	Comprueba que el proceso responde y que la base de datos acepta conexión
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	models.HealthResponse
//	@Failure		503	{object}	models.HealthResponse
//	@Router			/health [get]
func (h *HealthHandler) check(c *echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), 2*time.Second)
	defer cancel()

	if err := h.db.PingContext(ctx); err != nil {
		return c.JSON(http.StatusServiceUnavailable, models.HealthResponse{
			Status:   "unhealthy",
			Database: "unavailable",
		})
	}
	return c.JSON(http.StatusOK, models.HealthResponse{
		Status:   "ok",
		Database: "ok",
	})
}
