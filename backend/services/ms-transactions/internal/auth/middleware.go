package auth

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v5"

	"finexa-ia/apiresult"
	"finexa-ia/ms-transactions/internal/repository"
)

// AuthUserIDKey es la clave en echo.Context para el users.id interno (tras resolver Cognito).
const AuthUserIDKey = "authUserID"

// Middleware exige identidad resuelta a users.id vía JWT Cognito o MS_TRANSACTIONS_DEV_COGNITO_SUB.
// No usar el modo dev en producción.
func (d *Deps) Middleware(db *sql.DB) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			if d == nil || d.App == nil {
				return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, "auth not initialized", nil)
			}
			ctx, cancel := context.WithTimeout(c.Request().Context(), 10*time.Second)
			defer cancel()

			var sub string
			if s := strings.TrimSpace(d.App.DevCognitoSub); s != "" {
				sub = s
			} else {
				s, err := ParseBearerCognitoSub(ctx, d.App, d.Keyfn, c.Request().Header.Get("Authorization"))
				if errors.Is(err, ErrAuthNotConfigured) {
					return apiresult.RespondError(c, http.StatusServiceUnavailable, apiresult.CodeServiceUnavailable, err.Error(), nil)
				}
				if errors.Is(err, ErrMissingAuthorization) {
					return apiresult.RespondError(c, http.StatusUnauthorized, apiresult.CodeUnauthorized, err.Error(), nil)
				}
				if err != nil {
					return apiresult.RespondError(c, http.StatusUnauthorized, apiresult.CodeUnauthorized, ErrInvalidToken.Error(), nil)
				}
				sub = s
			}

			uid, err := repository.GetInternalUserIDByCognitoSub(ctx, db, sub)
			if errors.Is(err, sql.ErrNoRows) {
				return apiresult.RespondError(c, http.StatusNotFound, apiresult.CodeNotFound, "user not provisioned", map[string]any{"cognito_sub": sub})
			}
			if err != nil {
				return apiresult.RespondError(c, http.StatusInternalServerError, apiresult.CodeInternalError, http.StatusText(http.StatusInternalServerError), nil)
			}

			c.Set(AuthUserIDKey, uid)
			return next(c)
		}
	}
}
