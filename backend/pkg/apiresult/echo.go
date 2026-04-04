package apiresult

import (
	"strings"

	"github.com/labstack/echo/v5"
)

// HTTPPathPrefixMiddleware strips a gateway path prefix (e.g. /ms-plaid) so app routes stay /health, /v1/...
func HTTPPathPrefixMiddleware(prefix string) echo.MiddlewareFunc {
	p := strings.TrimSuffix(strings.TrimSpace(prefix), "/")
	if p == "" {
		return func(next echo.HandlerFunc) echo.HandlerFunc { return next }
	}
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			path := c.Request().URL.Path
			if path == p || strings.HasPrefix(path, p+"/") {
				c.Request().URL.Path = strings.TrimPrefix(path, p)
				if c.Request().URL.Path == "" {
					c.Request().URL.Path = "/"
				}
			}
			return next(c)
		}
	}
}

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
