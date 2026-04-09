package auth

import (
	"fmt"
	"strings"

	keyfunc "github.com/MicahParks/keyfunc/v3"

	"finexa-ia/ms-transactions/internal/config"
)

// Deps agrupa configuración y JWKS para validar JWT de Cognito.
type Deps struct {
	App   *config.App
	Keyfn keyfunc.Keyfunc // nil si no hay pool/region (solo modo dev con sub fijo)
}

// NewDeps construye dependencias de auth. JWKS solo si Cognito pool y región están definidos.
func NewDeps(app *config.App) (*Deps, error) {
	if app == nil {
		return nil, fmt.Errorf("auth: nil app config")
	}
	d := &Deps{App: app}
	if app.CognitoUserPoolID == "" || app.CognitoRegion == "" {
		return d, nil
	}
	jwksURL := fmt.Sprintf(
		"https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json",
		strings.TrimSpace(app.CognitoRegion),
		strings.TrimSpace(app.CognitoUserPoolID),
	)
	kf, err := keyfunc.NewDefault([]string{jwksURL})
	if err != nil {
		return nil, fmt.Errorf("auth: jwks %w", err)
	}
	d.Keyfn = kf
	return d, nil
}

// Close reserva para futuro cierre explícito del almacén JWKS (keyfunc/jwkset no expone Close uniforme).
func (d *Deps) Close() {}
