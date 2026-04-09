package auth

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrMissingAuthorization = errors.New("missing bearer token")
	ErrInvalidToken         = errors.New("invalid or expired token")
)

// ParseBearerCognitoSub extrae el claim sub desde el bearer token sin validar firma.
// La validación del JWT se delega a API Gateway authorizer.
func ParseBearerCognitoSub(authorizationHeader string) (string, error) {
	raw := strings.TrimSpace(authorizationHeader)
	if raw == "" {
		return "", ErrMissingAuthorization
	}
	const prefix = "Bearer "
	if len(raw) <= len(prefix) || !strings.EqualFold(raw[:len(prefix)], prefix) {
		return "", ErrMissingAuthorization
	}
	tokenStr := strings.TrimSpace(raw[len(prefix):])
	if tokenStr == "" {
		return "", ErrMissingAuthorization
	}

	parser := jwt.NewParser(jwt.WithoutClaimsValidation())
	claims := &cognitoClaims{}
	_, _, err := parser.ParseUnverified(tokenStr, claims)
	if err != nil {
		return "", ErrInvalidToken
	}
	if claims.Subject == "" {
		// fallback por si jwt lib no mapea Subject por tipo de token
		parts := strings.Split(tokenStr, ".")
		if len(parts) != 3 {
			return "", ErrInvalidToken
		}
		payload, err := base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			return "", ErrInvalidToken
		}
		var rawClaims map[string]any
		if err := json.Unmarshal(payload, &rawClaims); err != nil {
			return "", ErrInvalidToken
		}
		sub, _ := rawClaims["sub"].(string)
		if strings.TrimSpace(sub) == "" {
			return "", ErrInvalidToken
		}
		return strings.TrimSpace(sub), nil
	}

	return claims.Subject, nil
}
