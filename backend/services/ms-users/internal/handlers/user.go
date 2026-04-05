package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"

	"finexa-ia/apiresult"
	"finexa-ia/ms-users/internal/models"
	"finexa-ia/ms-users/internal/services"
)

// Referencias para que swag resuelva models.* en comentarios // @Success / @Param.
var _ = []any{
	models.UserOKResult{},
	models.UserListOKResult{},
	models.CreateUserRequest{},
	models.UpdateUserRequest{},
}

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
	g.PUT("/:id", h.update)
	g.DELETE("/:id", h.delete)
}

// list devuelve todos los usuarios ordenados por id.
//
//	@Summary		Listar usuarios
//	@Description	Lista registros de la tabla users
//	@Tags			users
//	@Produce		json
//	@Success		200	{object}	models.UserListOKResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/users [get]
func (h *UserHandler) list(c *echo.Context) error {
	users, err := h.svc.ListUsers(c.Request().Context())
	if err != nil {
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, users)
}

// getByID obtiene un usuario por id.
//
//	@Summary		Obtener usuario
//	@Tags			users
//	@Produce		json
//	@Param			id	path		int	true	"ID de usuario"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/users/{id} [get]
func (h *UserHandler) getByID(c *echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}
	user, err := h.svc.GetUser(c.Request().Context(), id)
	if err != nil {
		if errors.Is(err, services.ErrInvalidUserID) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
		if errors.Is(err, services.ErrUserNotFound) {
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		}
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, user)
}

// create inserta un usuario (name, email único).
//
//	@Summary		Crear usuario
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			body	body		models.CreateUserRequest	true	"Cuerpo"
//	@Success		201	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/users [post]
func (h *UserHandler) create(c *echo.Context) error {
	var in services.CreateUserInput
	if err := c.Bind(&in); err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid request body", nil)
	}
	user, err := h.svc.CreateUser(c.Request().Context(), in)
	if err != nil {
		if errors.Is(err, services.ErrInvalidUserInput) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusCreated, user)
}

// update actualiza nombre y email de un usuario.
//
//	@Summary		Actualizar usuario
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int							true	"ID de usuario"
//	@Param			body	body		models.UpdateUserRequest	true	"Cuerpo"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/users/{id} [put]
func (h *UserHandler) update(c *echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}

	var in services.UpdateUserInput
	if err := c.Bind(&in); err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid request body", nil)
	}

	user, err := h.svc.UpdateUser(c.Request().Context(), id, in)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidUserID), errors.Is(err, services.ErrInvalidUserInput):
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		case errors.Is(err, services.ErrUserNotFound):
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		default:
			return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
		}
	}
	return apiresult.RespondOK(c, http.StatusOK, user)
}

// delete elimina un usuario y devuelve el registro borrado.
//
//	@Summary		Eliminar usuario
//	@Tags			users
//	@Produce		json
//	@Param			id	path		int	true	"ID de usuario"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/users/{id} [delete]
func (h *UserHandler) delete(c *echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}

	user, err := h.svc.DeleteUser(c.Request().Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidUserID):
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		case errors.Is(err, services.ErrUserNotFound):
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		default:
			return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
		}
	}
	return apiresult.RespondOK(c, http.StatusOK, user)
}
