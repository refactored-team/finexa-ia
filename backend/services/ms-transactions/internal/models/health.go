package models

type HealthResponse struct {
	Status   string `json:"status" example:"ok"`
	Database string `json:"database,omitempty" example:"ok"`
}
