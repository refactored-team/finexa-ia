package apiresult

// Stable machine-oriented error codes shared across microservices.
const (
	CodeValidationError     = "VALIDATION_ERROR"
	CodeNotFound            = "NOT_FOUND"
	CodeUnauthorized        = "UNAUTHORIZED"
	CodeForbidden           = "FORBIDDEN"
	CodeConflict            = "CONFLICT"
	CodeInternalError       = "INTERNAL_ERROR"
	CodeServiceUnavailable  = "SERVICE_UNAVAILABLE"
	CodeBadGateway          = "BAD_GATEWAY"
	CodeMethodNotAllowed    = "METHOD_NOT_ALLOWED"
	CodeTooManyRequests     = "TOO_MANY_REQUESTS"

	CodePlaidNotConfigured = "PLAID_NOT_CONFIGURED"
	CodePlaidUpstreamError = "PLAID_UPSTREAM_ERROR"
)
