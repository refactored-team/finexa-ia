package apiresult

import (
	"github.com/labstack/echo/v5"
)

// RespondOK writes { "ok": true, "data": data } with the given HTTP status.
func RespondOK[T any](c *echo.Context, status int, data T) error {
	return c.JSON(status, okEnvelope[T]{OK: true, Data: data})
}

// RespondError writes { "ok": false, "error": { code, message, details? } }.
func RespondError(c *echo.Context, status int, code, message string, details map[string]any) error {
	return c.JSON(status, ErrResult{
		OK: false,
		Error: ErrorPayload{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}
