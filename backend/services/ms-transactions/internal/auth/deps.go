package auth

import (
	"fmt"

	"finexa-ia/ms-transactions/internal/config"
)

// Deps agrupa configuración para resolver identidad de usuario.
type Deps struct {
	App   *config.App
}

// NewDeps construye dependencias de auth.
// La validación de JWT se delega a API Gateway.
func NewDeps(app *config.App) (*Deps, error) {
	if app == nil {
		return nil, fmt.Errorf("auth: nil app config")
	}
	return &Deps{App: app}, nil
}

// Close reservado para dependencias futuras.
func (d *Deps) Close() {}
