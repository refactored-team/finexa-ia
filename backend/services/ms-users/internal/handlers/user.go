package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v5"

	"finexa-ia/apiresult"
	"finexa-ia/ms-users/internal/config"
	"finexa-ia/ms-users/internal/models"
	"finexa-ia/ms-users/internal/services"
)

const internalTokenHeader = "X-MS-Users-Internal-Token"

// Referencias para que swag resuelva models.* en comentarios // @Success / @Param.
var _ = []any{
	models.UserOKResult{},
	models.UserListOKResult{},
	models.UserListPageOKResult{},
	models.UpsertUserRequest{},
	models.UpdateUserRequest{},
	models.PatchUserEmailRequest{},
}

type UserHandler struct {
	svc *services.UserService
	cfg *config.App
}

func NewUserHandler(svc *services.UserService, cfg *config.App) *UserHandler {
	return &UserHandler{svc: svc, cfg: cfg}
}

func (h *UserHandler) Register(e *echo.Echo) {
	g := e.Group("/v1/users")
	g.GET("", h.list)
	g.GET("/all", h.listAll)
	g.GET("/by-email", h.getByEmail)
	g.GET("/by-cognito", h.getByCognitoSub)
	g.POST("", h.upsert)
	g.POST("/:id/restore", h.restoreByID)
	g.DELETE("/:id/hard", h.hardDeleteByID)
	g.PATCH("/:id", h.patchEmailByID)
	g.PUT("/:id", h.updateByID)
	g.DELETE("/:id", h.deleteByID)
	g.GET("/:id", h.getByID)
}

func (h *UserHandler) requireInternal(c *echo.Context) bool {
	want := strings.TrimSpace(h.cfg.InternalToken)
	if want == "" {
		_ = apiresult.RespondError(c, http.StatusForbidden, apiresult.CodeForbidden, "internal operations are not configured (MS_USERS_INTERNAL_TOKEN)", nil)
		return false
	}
	got := strings.TrimSpace(c.Request().Header.Get(internalTokenHeader))
	if got != want {
		_ = apiresult.RespondError(c, http.StatusForbidden, apiresult.CodeForbidden, "invalid internal token", nil)
		return false
	}
	return true
}

// list devuelve usuarios con paginación y filtros opcionales.
//
//	@Summary		Listar usuarios
//	@Description	Paginación: limit (default 50, max 200), offset. Filtros: email (exacto, case-insensitive), created_from, created_to (RFC3339). include_deleted=true requiere token interno.
//	@Tags			users
//	@Produce		json
//	@Param			limit			query		int		false	"Límite (default 50, max 200)"
//	@Param			offset			query		int		false	"Offset"
//	@Param			email			query		string	false	"Filtrar por email exacto (case-insensitive)"
//	@Param			created_from	query		string	false	"Inicio rango created_at (RFC3339)"
//	@Param			created_to		query		string	false	"Fin rango created_at (RFC3339)"
//	@Param			include_deleted	query		bool	false	"Incluir soft-deleted (requiere X-MS-Users-Internal-Token)"
//	@Success		200	{object}	models.UserListPageOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		403	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users [get]
func (h *UserHandler) list(c *echo.Context) error {
	includeDeleted := strings.EqualFold(c.QueryParam("include_deleted"), "true")
	if includeDeleted && !h.requireInternal(c) {
		return nil
	}

	limit, _ := strconv.Atoi(strings.TrimSpace(c.QueryParam("limit")))
	offset, _ := strconv.Atoi(strings.TrimSpace(c.QueryParam("offset")))

	var createdFrom, createdTo *time.Time
	if s := strings.TrimSpace(c.QueryParam("created_from")); s != "" {
		t, err := time.Parse(time.RFC3339, s)
		if err != nil {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid created_from (use RFC3339)", nil)
		}
		createdFrom = &t
	}
	if s := strings.TrimSpace(c.QueryParam("created_to")); s != "" {
		t, err := time.Parse(time.RFC3339, s)
		if err != nil {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid created_to (use RFC3339)", nil)
		}
		createdTo = &t
	}

	page, err := h.svc.List(c.Request().Context(), services.ListUsersQuery{
		Limit:          limit,
		Offset:         offset,
		IncludeDeleted: includeDeleted,
		FilterEmail:    strings.TrimSpace(c.QueryParam("email")),
		CreatedFrom:    createdFrom,
		CreatedTo:      createdTo,
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidListParams), errors.Is(err, services.ErrInvalidTimeRange):
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		default:
			return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
		}
	}
	return apiresult.RespondOK(c, http.StatusOK, page)
}

// listAll devuelve todos los usuarios activos (sin paginación).
//
//	@Summary		Listar todos los usuarios activos
//	@Description	Misma forma que antes: { ok, data: []User }. Solo filas con deleted_at IS NULL.
//	@Tags			users
//	@Produce		json
//	@Success		200	{object}	models.UserListOKResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/all [get]
func (h *UserHandler) listAll(c *echo.Context) error {
	users, err := h.svc.ListAll(c.Request().Context())
	if err != nil {
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, users)
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
//	@Failure		409	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users [post]
func (h *UserHandler) upsert(c *echo.Context) error {
	var in models.UpsertUserRequest
	if err := c.Bind(&in); err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid request body", nil)
	}
	user, err := h.svc.Upsert(c.Request().Context(), in)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidUserInput):
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		case errors.Is(err, services.ErrConflict):
			return apiresult.RespondError(c, http.StatusConflict, apiresult.CodeConflict, err.Error(), nil)
		default:
			return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
		}
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

// getByEmail obtiene un usuario activo por email (query: email).
//
//	@Summary		Obtener usuario por email
//	@Tags			users
//	@Produce		json
//	@Param			email	query		string	true	"Email"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/by-email [get]
func (h *UserHandler) getByEmail(c *echo.Context) error {
	user, err := h.svc.GetByEmail(c.Request().Context(), c.QueryParam("email"))
	if err != nil {
		if errors.Is(err, services.ErrEmailQueryMissing) {
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		}
		if errors.Is(err, services.ErrUserNotFound) {
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		}
		return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
	}
	return apiresult.RespondOK(c, http.StatusOK, user)
}

// updateByID actualiza cognito_sub/email por id interno.
//
//	@Summary		Actualizar usuario por id
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int							true	"ID interno"
//	@Param			body	body		models.UpdateUserRequest	true	"Cuerpo"
//	@Success		200		{object}	models.UserOKResult
//	@Failure		400		{object}	apiresult.ErrResult
//	@Failure		404		{object}	apiresult.ErrResult
//	@Failure		409		{object}	apiresult.ErrResult
//	@Failure		500		{object}	apiresult.ErrResult
//	@Router			/v1/users/{id} [put]
func (h *UserHandler) updateByID(c *echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}

	var in models.UpdateUserRequest
	if err := c.Bind(&in); err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid request body", nil)
	}
	user, err := h.svc.UpdateByID(c.Request().Context(), id, in)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidUserID), errors.Is(err, services.ErrInvalidUserInput):
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		case errors.Is(err, services.ErrUserNotFound):
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		case errors.Is(err, services.ErrConflict):
			return apiresult.RespondError(c, http.StatusConflict, apiresult.CodeConflict, err.Error(), nil)
		default:
			return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
		}
	}
	return apiresult.RespondOK(c, http.StatusOK, user)
}

// patchEmailByID actualiza solo el email.
//
//	@Summary		Actualizar email (PATCH)
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int								true	"ID interno"
//	@Param			body	body		models.PatchUserEmailRequest	true	"Cuerpo (email null para borrar)"
//	@Success		200		{object}	models.UserOKResult
//	@Failure		400		{object}	apiresult.ErrResult
//	@Failure		404		{object}	apiresult.ErrResult
//	@Failure		409		{object}	apiresult.ErrResult
//	@Failure		500		{object}	apiresult.ErrResult
//	@Router			/v1/users/{id} [patch]
func (h *UserHandler) patchEmailByID(c *echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}

	var in models.PatchUserEmailRequest
	if err := c.Bind(&in); err != nil {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid request body", nil)
	}
	user, err := h.svc.PatchEmailByID(c.Request().Context(), id, in)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidUserID):
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		case errors.Is(err, services.ErrUserNotFound):
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		case errors.Is(err, services.ErrConflict):
			return apiresult.RespondError(c, http.StatusConflict, apiresult.CodeConflict, err.Error(), nil)
		default:
			return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
		}
	}
	return apiresult.RespondOK(c, http.StatusOK, user)
}

// deleteByID da de baja lógica al usuario por id interno.
//
//	@Summary		Eliminar usuario por id
//	@Tags			users
//	@Produce		json
//	@Param			id	path		int	true	"ID interno"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{id} [delete]
func (h *UserHandler) deleteByID(c *echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}

	user, err := h.svc.DeleteByID(c.Request().Context(), id)
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

// restoreByID revierte soft-delete. Requiere token interno.
//
//	@Summary		Restaurar usuario (soft-delete)
//	@Tags			users
//	@Produce		json
//	@Param			id	path		int	true	"ID interno"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		403	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		409	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{id}/restore [post]
func (h *UserHandler) restoreByID(c *echo.Context) error {
	if !h.requireInternal(c) {
		return nil
	}
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}
	user, err := h.svc.RestoreByID(c.Request().Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidUserID):
			return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, err.Error(), nil)
		case errors.Is(err, services.ErrUserNotFound):
			return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, http.StatusText(http.StatusNotFound), nil)
		case errors.Is(err, services.ErrConflict):
			return apiresult.RespondError(c, http.StatusConflict, apiresult.CodeConflict, err.Error(), nil)
		default:
			return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
		}
	}
	return apiresult.RespondOK(c, http.StatusOK, user)
}

// hardDeleteByID elimina la fila en base de datos. Requiere token interno.
//
//	@Summary		Eliminar usuario permanentemente
//	@Tags			users
//	@Produce		json
//	@Param			id	path		int	true	"ID interno"
//	@Success		200	{object}	models.UserOKResult
//	@Failure		400	{object}	apiresult.ErrResult
//	@Failure		403	{object}	apiresult.ErrResult
//	@Failure		404	{object}	apiresult.ErrResult
//	@Failure		500	{object}	apiresult.ErrResult
//	@Router			/v1/users/{id}/hard [delete]
func (h *UserHandler) hardDeleteByID(c *echo.Context) error {
	if !h.requireInternal(c) {
		return nil
	}
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return apiresult.RespondError(c, http.StatusBadRequest, apiresult.CodeValidationError, "invalid user id", nil)
	}
	user, err := h.svc.HardDeleteByID(c.Request().Context(), id)
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
