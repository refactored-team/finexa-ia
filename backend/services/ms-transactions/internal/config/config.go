package config

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type App struct {
	DatabaseURL    string `json:"database_url"`
	HTTPPort       string `json:"http_port"`
	HTTPPathPrefix string `json:"http_path_prefix,omitempty"`

	// Cognito JWT (API Gateway / app móvil). Opcional en dev si usas MS_TRANSACTIONS_DEV_COGNITO_SUB.
	CognitoRegion      string `json:"cognito_region,omitempty"`
	CognitoUserPoolID  string `json:"cognito_user_pool_id,omitempty"`
	CognitoAppClientID string `json:"cognito_app_client_id,omitempty"`

	// AI_PIPELINE_BASE_URL — base del FastAPI ai-pipeline (sin barra final).
	AIPipelineBaseURL string `json:"ai_pipeline_base_url,omitempty"`
	PlaidClientID     string `json:"plaid_client_id,omitempty"`
	PlaidSecret       string `json:"plaid_secret,omitempty"`
	PlaidEnv          string `json:"plaid_env,omitempty"`

	// DevCognitoSub — solo env MS_TRANSACTIONS_DEV_COGNITO_SUB (nunca desde secret en prod).
	DevCognitoSub string `json:"-"`
}

func Load() (*App, error) {
	secretID := os.Getenv("AWS_SECRET_ID")
	if secretID == "" || os.Getenv("CONFIG_SOURCE") == "env" {
		return fromEnv()
	}
	return fromSecretsManager(secretID)
}

func fromEnv() (*App, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required (set CONFIG_SOURCE=env and provide DATABASE_URL)")
	}
	port := os.Getenv("HTTP_PORT")
	if port == "" {
		port = "8080"
	}
	app := &App{
		DatabaseURL:    dbURL,
		HTTPPort:       port,
		HTTPPathPrefix: strings.TrimSpace(os.Getenv("HTTP_PATH_PREFIX")),
		PlaidClientID:  strings.TrimSpace(os.Getenv("PLAID_CLIENT_ID")),
		PlaidSecret:    plaidSecretFromEnv(),
		PlaidEnv:       strings.TrimSpace(os.Getenv("PLAID_ENV")),
	}
	overlayAuthFromEnv(app)
	return app, nil
}

func fromSecretsManager(secretID string) (*App, error) {
	ctx := context.Background()

	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("aws config: %w", err)
	}

	client := secretsmanager.NewFromConfig(cfg)
	out, err := client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(secretID),
	})
	if err != nil {
		return nil, fmt.Errorf("get secret %q: %w", secretID, err)
	}

	var app App
	if err := json.Unmarshal([]byte(aws.ToString(out.SecretString)), &app); err != nil {
		return nil, fmt.Errorf("parse secret json: %w", err)
	}
	if app.HTTPPort == "" {
		app.HTTPPort = "8080"
	}
	overlayAuthFromEnv(&app)
	return &app, nil
}

func overlayAuthFromEnv(a *App) {
	if v := strings.TrimSpace(os.Getenv("COGNITO_REGION")); v != "" {
		a.CognitoRegion = v
	}
	if v := strings.TrimSpace(os.Getenv("COGNITO_USER_POOL_ID")); v != "" {
		a.CognitoUserPoolID = v
	}
	if v := strings.TrimSpace(os.Getenv("COGNITO_APP_CLIENT_ID")); v != "" {
		a.CognitoAppClientID = v
	}
	if v := strings.TrimSpace(os.Getenv("MS_TRANSACTIONS_DEV_COGNITO_SUB")); v != "" {
		a.DevCognitoSub = v
	}
	if v := strings.TrimSpace(os.Getenv("AI_PIPELINE_BASE_URL")); v != "" {
		a.AIPipelineBaseURL = v
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_CLIENT_ID")); v != "" {
		a.PlaidClientID = v
	}
	if v := strings.TrimSpace(plaidSecretFromEnv()); v != "" {
		a.PlaidSecret = v
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_ENV")); v != "" {
		a.PlaidEnv = v
	}
}

// ResolveAIPipelineBaseURL devuelve la base URL del ai-pipeline sin barra final.
func (a *App) ResolveAIPipelineBaseURL() string {
	if a == nil {
		return "http://localhost:8000"
	}
	u := strings.TrimSpace(a.AIPipelineBaseURL)
	if u == "" {
		return "http://localhost:8000"
	}
	return strings.TrimRight(u, "/")
}

func plaidSecretFromEnv() string {
	if s := strings.TrimSpace(os.Getenv("PLAID_SECRET")); s != "" {
		return s
	}
	return strings.TrimSpace(os.Getenv("SANDBOX_SECRET"))
}

func (a *App) PlaidConfigured() bool {
	return a != nil && strings.TrimSpace(a.PlaidClientID) != "" && strings.TrimSpace(a.PlaidSecret) != ""
}
