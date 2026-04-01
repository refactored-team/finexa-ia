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

// MVP: parámetros de Link fijos en código (sandbox / pruebas). Solo credenciales
// vienen de env o Secrets Manager (plaid_client_id, plaid_secret).
var (
	mvpPlaidEnv                     = "sandbox"
	mvpPlaidClientName              = "Finexa"
	mvpPlaidLanguage                = "es"
	mvpPlaidCountryCodes            = "US"
	mvpPlaidProducts                = "transactions"
	mvpPlaidTransactionsDays int32 = 90
)

type App struct {
	DatabaseURL string `json:"database_url"`
	HTTPPort    string `json:"http_port"`

	PlaidClientID   string `json:"plaid_client_id,omitempty"`
	PlaidSecret     string `json:"plaid_secret,omitempty"`
	PlaidEnv        string `json:"plaid_env,omitempty"`
	PlaidClientName string `json:"plaid_client_name,omitempty"`
	PlaidLanguage   string `json:"plaid_language,omitempty"`
	PlaidCountryCodes string `json:"plaid_country_codes,omitempty"`
	PlaidProducts     string `json:"plaid_products,omitempty"`
	PlaidWebhook      string `json:"plaid_webhook_url,omitempty"`
	PlaidRedirect     string `json:"plaid_redirect_uri,omitempty"`
	PlaidTransactionsDaysRequested *int32 `json:"plaid_transactions_days_requested,omitempty"`
}

// Load elige el origen de la configuración:
//
//	Desarrollo local (.env.dev + make run): CONFIG_SOURCE=env → solo variables de
//	entorno (DATABASE_URL, HTTP_PORT, PLAID_CLIENT_ID, PLAID_SECRET, …). Se ignora
//	AWS_SECRET_ID aunque exista en el shell (evita mezclar credenciales AWS con .env).
//
//	AWS / producción: sin CONFIG_SOURCE=env (o sin definir CONFIG_SOURCE) y con
//	AWS_SECRET_ID → JSON desde Secrets Manager (database_url, http_port,
//	plaid_client_id, plaid_secret, …).
//
//	Sin AWS_SECRET_ID y sin forzar env: mismo comportamiento que env (útil en CI).
func Load() (*App, error) {
	secretID := strings.TrimSpace(os.Getenv("AWS_SECRET_ID"))
	forceEnv := strings.EqualFold(strings.TrimSpace(os.Getenv("CONFIG_SOURCE")), "env")
	if forceEnv || secretID == "" {
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
		DatabaseURL:   dbURL,
		HTTPPort:      port,
		PlaidClientID: os.Getenv("PLAID_CLIENT_ID"),
		PlaidSecret:   os.Getenv("PLAID_SECRET"),
	}
	applyPlaidMVPDefaults(app)
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
	applyPlaidMVPDefaults(&app)
	return &app, nil
}

// applyPlaidMVPDefaults fija en código todo lo que no es secreto (Link sandbox).
func applyPlaidMVPDefaults(a *App) {
	if a == nil {
		return
	}
	a.PlaidEnv = mvpPlaidEnv
	a.PlaidClientName = mvpPlaidClientName
	a.PlaidLanguage = mvpPlaidLanguage
	a.PlaidCountryCodes = mvpPlaidCountryCodes
	a.PlaidProducts = mvpPlaidProducts
	a.PlaidWebhook = ""
	a.PlaidRedirect = ""
	d := mvpPlaidTransactionsDays
	a.PlaidTransactionsDaysRequested = &d
}

// PlaidConfigured is true when credentials are present for Link token creation.
func (a *App) PlaidConfigured() bool {
	return a != nil && strings.TrimSpace(a.PlaidClientID) != "" && strings.TrimSpace(a.PlaidSecret) != ""
}
