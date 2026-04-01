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

// list returns non-deleted Plaid items for the user.
//
//	@Summary		Listar ítems Plaid
//	@Description	Lista ítems activos (sin access_token en respuesta)
//	@Tags			plaid-items
//	@Param			userId	path		int	true	"ID interno de usuario (FK)"
//	@Produce		json
//	@Success		200	{array}		models.PlaidItemResponse
//	@Failure		400	{object}	models.ErrorResponse
//	@Failure		500	{object}	models.ErrorResponse
//	@Router			/v1/users/{userId}/plaid-items [get]
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

// create stores a new Plaid item (access_token solo en request).
//
//	@Summary		Registrar ítem Plaid
//	@Tags			plaid-items
//	@Accept			json
//	@Produce		json
//	@Param			userId	path		int								true	"ID interno de usuario (FK)"
//	@Param			body	body		models.CreatePlaidItemRequest	true	"Cuerpo"
//	@Success		201	{object}	models.PlaidItemResponse
//	@Failure		400	{object}	models.ErrorResponse
//	@Failure		500	{object}	models.ErrorResponse
//	@Router			/v1/users/{userId}/plaid-items [post]
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

// getByID returns one Plaid item by Plaid item id for the user.
//
//	@Summary		Obtener ítem Plaid
//	@Tags			plaid-items
//	@Produce		json
//	@Param			userId			path		int		true	"ID interno de usuario (FK)"
//	@Param			plaidItemId		path		string	true	"plaid_item_id de Plaid"
//	@Success		200	{object}	models.PlaidItemResponse
//	@Failure		400	{object}	models.ErrorResponse
//	@Failure		404	{object}	models.ErrorResponse
//	@Failure		500	{object}	models.ErrorResponse
//	@Router			/v1/users/{userId}/plaid-items/{plaidItemId} [get]
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

// delete soft-deletes a Plaid item.
//
//	@Summary		Baja lógica de ítem Plaid
//	@Tags			plaid-items
//	@Param			userId			path	int		true	"ID interno de usuario (FK)"
//	@Param			plaidItemId		path	string	true	"plaid_item_id de Plaid"
//	@Success		204	"No content"
//	@Failure		400	{object}	models.ErrorResponse
//	@Failure		404	{object}	models.ErrorResponse
//	@Failure		500	{object}	models.ErrorResponse
//	@Router			/v1/users/{userId}/plaid-items/{plaidItemId} [delete]
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
