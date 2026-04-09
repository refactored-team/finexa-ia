package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"

	keyfunc "github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"

	"finexa-ia/ms-transactions/internal/config"
)

var (
	ErrMissingAuthorization = errors.New("missing bearer token")
	ErrInvalidToken         = errors.New("invalid or expired token")
	ErrAuthNotConfigured    = errors.New("cognito jwt validation is not configured")
)

// ParseBearerCognitoSub valida un JWT de Cognito y devuelve el claim sub (sin modo dev).
func ParseBearerCognitoSub(ctx context.Context, app *config.App, kf keyfunc.Keyfunc, authorizationHeader string) (string, error) {
	if kf == nil {
		return "", ErrAuthNotConfigured
	}
	if app == nil || app.CognitoUserPoolID == "" || app.CognitoRegion == "" {
		return "", ErrAuthNotConfigured
	}
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

	expectedIss := fmt.Sprintf(
		"https://cognito-idp.%s.amazonaws.com/%s",
		strings.TrimSpace(app.CognitoRegion),
		strings.TrimSpace(app.CognitoUserPoolID),
	)
	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{"RS256"}),
		jwt.WithIssuer(expectedIss),
	)
	claims := &cognitoClaims{}
	_, err := parser.ParseWithClaims(tokenStr, claims, kf.KeyfuncCtx(ctx))
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}
	if claims.Subject == "" {
		return "", ErrInvalidToken
	}

	clientID := strings.TrimSpace(app.CognitoAppClientID)
	if clientID != "" {
		switch strings.TrimSpace(claims.TokenUse) {
		case "access":
			if strings.TrimSpace(claims.ClientID) != clientID {
				return "", ErrInvalidToken
			}
		case "id":
			if len(claims.Audience) == 0 || !claimStringsContains(claims.Audience, clientID) {
				return "", ErrInvalidToken
			}
		default:
			// Algunos tokens pueden omitir token_use; exigir al menos aud o client_id coherente.
			if claims.ClientID != "" && claims.ClientID != clientID {
				return "", ErrInvalidToken
			}
			if len(claims.Audience) > 0 && !claimStringsContains(claims.Audience, clientID) {
				return "", ErrInvalidToken
			}
		}
	}

	return claims.Subject, nil
}

func claimStringsContains(aud jwt.ClaimStrings, want string) bool {
	for _, a := range aud {
		if a == want {
			return true
		}
	}
	return false
}
