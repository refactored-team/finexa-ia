package auth

import "github.com/golang-jwt/jwt/v5"

// cognitoClaims soporta id token (token_use=id, aud) y access token (token_use=access, client_id).
type cognitoClaims struct {
	jwt.RegisteredClaims
	TokenUse string `json:"token_use"`
	ClientID string `json:"client_id"`
}
