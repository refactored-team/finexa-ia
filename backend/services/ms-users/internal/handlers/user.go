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
	models.UpsertUserRequest{},
}

type UserHandler struct {
	svc *services.UserService
}

func NewUserHandler(svc *services.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) Register(e *echo.Echo) {
	g := e.Group("/v1/users")
	g.POST("", h.upsert)
	g.GET("/by-cognito", h.getByCognitoSub)
	g.GET("/:id", h.getByID)
}

// upsert crea o actualiza un usuario por cognito_sub (reactiva si estaba soft-deleted).
//
//	@Summary		Registrar o actualizar usuario
//	@Description	Upsert por cognito_sub; email opcional
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			body	body		models.UpsertUserRequest	true	"Cuerpo"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users [post]
func (h *UserHandler) upsert(c *echo.Context) error {
	var in models.UpsertUserRequest
	if err := c.Bind(&in); err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid request body", nil)
	}
	user, err := h.svc.Upsert(c.Request().Context(), in)
	if err != nil {
		if errors.Is(err, services.ErrInvalidUserInput) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, user)
}

// getByID obtiene un usuario activo por id interno.
//
//	@Summary		Obtener usuario por id
//	@Tags			users
//	@Produce		json
//	@Param			id	path		int	true	"ID interno"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{id} [get]
func (h *UserHandler) getByID(c *echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}
	user, err := h.svc.GetByID(c.Request().Context(), id)
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

// getByCognitoSub obtiene un usuario activo por cognito_sub (query: cognito_sub).
//
//	@Summary		Obtener usuario por Cognito sub
//	@Tags			users
//	@Produce		json
//	@Param			cognito_sub	query		string	true	"Sub del JWT Cognito"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/by-cognito [get]
func (h *UserHandler) getByCognitoSub(c *echo.Context) error {
	sub := c.QueryParam("cognito_sub")
	user, err := h.svc.GetByCognitoSub(c.Request().Context(), sub)
	if err != nil {
		if errors.Is(err, services.ErrCognitoSubMissing) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
		if errors.Is(err, services.ErrUserNotFound) {
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		}
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, user)
}
