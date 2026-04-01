package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"

	"finexa-ia/ms-plaid/internal/models"
	"finexa-ia/ms-plaid/internal/services"
)

// PlaidItemHandler exposes Plaid item CRUD scoped by user_id path param.
// Caller identity should be enforced at the API gateway / mesh; this service trusts userId in the URL.
type PlaidItemHandler struct {
	svc *services.PlaidItemService
}

func NewPlaidItemHandler(svc *services.PlaidItemService) *PlaidItemHandler {
	return &PlaidItemHandler{svc: svc}
}

func (h *PlaidItemHandler) Register(e *echo.Echo) {
	g := e.Group("/v1/users/:userId/plaid-items")
	g.GET("", h.list)
	g.POST("", h.create)
	g.GET("/:plaidItemId", h.getByID)
	g.DELETE("/:plaidItemId", h.delete)
}

func (h *PlaidItemHandler) parseUserID(c *echo.Context) (int64, error) {
	return strconv.ParseInt(c.Param("userId"), 10, 64)
}

func (h *PlaidItemHandler) list(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return echo.ErrBadRequest
	}
	items, err := h.svc.ListByUser(c.Request().Context(), userID)
	if err != nil {
		if errors.Is(err, services.ErrInvalidUserID) {
			return echo.ErrBadRequest
		}
		return echo.ErrInternalServerError
	}
	return c.JSON(http.StatusOK, items)
}

func (h *PlaidItemHandler) create(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return echo.ErrBadRequest
	}
	var in models.CreatePlaidItemRequest
	if err := c.Bind(&in); err != nil {
		return echo.ErrBadRequest
	}
	item, err := h.svc.Create(c.Request().Context(), userID, in)
	if err != nil {
		if errors.Is(err, services.ErrInvalidPlaidItemPayload) || errors.Is(err, services.ErrInvalidUserID) {
			return echo.ErrBadRequest
		}
		return echo.ErrInternalServerError
	}
	return c.JSON(http.StatusCreated, item)
}

func (h *PlaidItemHandler) getByID(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return echo.ErrBadRequest
	}
	plaidItemID := c.Param("plaidItemId")
	item, err := h.svc.Get(c.Request().Context(), userID, plaidItemID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.ErrNotFound
		}
		if errors.Is(err, services.ErrInvalidParams) {
			return echo.ErrBadRequest
		}
		return echo.ErrInternalServerError
	}
	return c.JSON(http.StatusOK, item)
}

func (h *PlaidItemHandler) delete(c *echo.Context) error {
	userID, err := h.parseUserID(c)
	if err != nil || userID <= 0 {
		return echo.ErrBadRequest
	}
	plaidItemID := c.Param("plaidItemId")
	if err := h.svc.Delete(c.Request().Context(), userID, plaidItemID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.ErrNotFound
		}
		if errors.Is(err, services.ErrInvalidParams) {
			return echo.ErrBadRequest
		}
		return echo.ErrInternalServerError
	}
	return c.NoContent(http.StatusNoContent)
}
