package apiresult

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v5"
)

// HTTPErrorHandler returns an Echo handler that serializes errors as ErrResult.
// When exposeInternal is false, 500 responses use a generic message; other statuses keep Echo's message when set.
func HTTPErrorHandler(exposeInternal bool) echo.HTTPErrorHandler {
	return func(c *echo.Context, err error) {
		if r, _ := echo.UnwrapResponse(c.Response()); r != nil && r.Committed {
			return
		}

		code := http.StatusInternalServerError
		var sc echo.HTTPStatusCoder
		if errors.As(err, &sc) {
			if tmp := sc.StatusCode(); tmp != 0 {
				code = tmp
			}
		}

		msg := http.StatusText(code)
		if he, ok := err.(*echo.HTTPError); ok && he.Message != "" {
			msg = he.Message
		}

		errCode := defaultCodeForStatus(code)
		if code == http.StatusInternalServerError && !exposeInternal {
			msg = http.StatusText(http.StatusInternalServerError)
		}

		var details map[string]any
		if exposeInternal && err != nil {
			if he, ok := err.(*echo.HTTPError); ok {
				if wrapped := he.Unwrap(); wrapped != nil {
					details = map[string]any{"cause": wrapped.Error()}
				}
			} else {
				details = map[string]any{"cause": err.Error()}
			}
		}

		var sendErr error
		if c.Request().Method == http.MethodHead {
			sendErr = c.NoContent(code)
		} else {
			sendErr = RespondError(c, code, errCode, msg, details)
		}
		if sendErr != nil {
			c.Logger().Error("apiresult HTTPErrorHandler failed to send response", "error", sendErr)
		}
	}
}

func defaultCodeForStatus(status int) string {
	switch status {
	case http.StatusBadRequest:
		return CodeValidationError
	case http.StatusUnauthorized:
		return CodeUnauthorized
	case http.StatusForbidden:
		return CodeForbidden
	case http.StatusNotFound:
		return CodeNotFound
	case http.StatusMethodNotAllowed:
		return CodeMethodNotAllowed
	case http.StatusConflict:
		return CodeConflict
	case http.StatusTooManyRequests:
		return CodeTooManyRequests
	case http.StatusBadGateway:
		return CodeBadGateway
	case http.StatusServiceUnavailable:
		return CodeServiceUnavailable
	default:
		return CodeInternalError
	}
}
