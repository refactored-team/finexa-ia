package apiresult

import (
	"os"
	"strings"
)

// ExposeInternalError reports whether raw error text may appear in API JSON.
// Set ENV to dev, development, or local to enable; otherwise internal errors stay generic.
func ExposeInternalError() bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("ENV"))) {
	case "dev", "development", "local":
		return true
	default:
		return false
	}
}
