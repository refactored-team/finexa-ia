package models

// HealthResponse is the JSON body for GET /health (used by Swagger).
type HealthResponse struct {
	Status   string `json:"status" example:"ok"`
	Database string `json:"database,omitempty" example:"ok"` // "ok" when Postgres Ping works
}

