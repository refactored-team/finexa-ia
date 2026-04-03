package apiresult

// ErrorPayload is the `error` object inside a failed Result envelope.
type ErrorPayload struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
}

// ErrResult is the JSON body for failed responses (`ok: false`).
type ErrResult struct {
	OK    bool         `json:"ok"`
	Error ErrorPayload `json:"error"`
}

// okEnvelope is the JSON shape for successful responses.
type okEnvelope[T any] struct {
	OK   bool `json:"ok"`
	Data T    `json:"data"`
}
