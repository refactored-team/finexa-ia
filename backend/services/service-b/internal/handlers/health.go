package handlers

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler { return &HealthHandler{} }

func (h *HealthHandler) Register(e *echo.Echo) {
	e.GET("/health", h.check)
}

func (h *HealthHandler) check(c *echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
