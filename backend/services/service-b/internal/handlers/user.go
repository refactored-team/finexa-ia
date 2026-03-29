package handlers

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"

	"finexa-ia/service-b/internal/services"
)

type UserHandler struct {
	svc *services.UserService
}

func NewUserHandler(svc *services.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) Register(e *echo.Echo) {
	g := e.Group("/users")
	g.GET("", h.list)
	g.GET("/:id", h.getByID)
	g.POST("", h.create)
}

func (h *UserHandler) list(c *echo.Context) error {
	users, err := h.svc.ListUsers(c.Request().Context())
	if err != nil {
		return echo.ErrInternalServerError
	}
	return c.JSON(http.StatusOK, users)
}

func (h *UserHandler) getByID(c *echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return echo.ErrBadRequest
	}
	user, err := h.svc.GetUser(c.Request().Context(), id)
	if err != nil {
		return echo.ErrNotFound
	}
	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) create(c *echo.Context) error {
	var in services.CreateUserInput
	if err := c.Bind(&in); err != nil {
		return echo.ErrBadRequest
	}
	user, err := h.svc.CreateUser(c.Request().Context(), in)
	if err != nil {
		return echo.ErrInternalServerError
	}
	return c.JSON(http.StatusCreated, user)
}
