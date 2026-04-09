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

// MVP: credenciales vía PLAID_CLIENT_ID + SANDBOX_SECRET o PLAID_SECRET (env) o
// plaid_client_id + (plaid_secret o sandbox_secret) en JSON de Secrets Manager.
// Entorno Plaid: PLAID_ENV (p. ej. sandbox, production) o plaid_env en el JSON; si ambos
// faltan, el default es sandbox. En production usa el secret de production del dashboard, no el de sandbox.
var (
	mvpPlaidEnv                    = "sandbox"
	mvpPlaidClientName             = "Finexa IA"
	mvpPlaidLanguage               = "en" // debe coincidir con el idioma de la Link customization en Plaid (p. ej. production_component en English)
	// Debe coincidir con la Link customization. Solo incluir ES (u otros) si Plaid te dio acceso a ese país
	// para tus productos; si no, INVALID_FIELD. Default US; override: PLAID_COUNTRY_CODES o plaid_country_codes.
	mvpPlaidCountryCodes = "US"
	mvpPlaidProducts               = "transactions"
	mvpPlaidTransactionsDays int32 = 90
	// mvpPlaidLinkCustomizationName: nombre en Dashboard → Link → Link customization (Data Transparency en esa customization).
	mvpPlaidLinkCustomizationName = "production_component"
)

type App struct {
	DatabaseURL string `json:"database_url"`
	HTTPPort    string `json:"http_port"`
	// HTTPPathPrefix strips this prefix from incoming paths (e.g. /ms-plaid behind API Gateway).
	HTTPPathPrefix string `json:"http_path_prefix,omitempty"`

	PlaidClientID string `json:"plaid_client_id,omitempty"`
	PlaidSecret   string `json:"plaid_secret,omitempty"`
	// SandboxSecret: alias en JSON si no usas la clave plaid_secret (mismo valor que el Sandbox secret del dashboard).
	SandboxSecret                  string `json:"sandbox_secret,omitempty"`
	PlaidEnv                       string `json:"plaid_env,omitempty"`
	PlaidClientName                string `json:"plaid_client_name,omitempty"`
	PlaidLanguage                  string `json:"plaid_language,omitempty"`
	PlaidCountryCodes              string `json:"plaid_country_codes,omitempty"`
	PlaidProducts                  string `json:"plaid_products,omitempty"`
	PlaidWebhook                   string `json:"plaid_webhook_url,omitempty"`
	PlaidRedirect                  string `json:"plaid_redirect_uri,omitempty"`
	PlaidTransactionsDaysRequested *int32 `json:"plaid_transactions_days_requested,omitempty"`
	// PlaidLinkCustomizationName: nombre exacto en el Dashboard (API: link_customization_name).
	// Si está vacío tras cargar config, applyPlaidMVPDefaults usa production_component.
	PlaidLinkCustomizationName string `json:"link_customization_name,omitempty"`
	// MSTransactionsBaseURL — base HTTP de ms-transactions (sin barra final). Vacío = no se dispara sync-and-analyze tras exchange.
	MSTransactionsBaseURL string `json:"ms_transactions_base_url,omitempty"`
}

// Load elige el origen de la configuración:
//
//	Desarrollo local (.env.dev + make run): CONFIG_SOURCE=env → solo variables de
//	entorno (DATABASE_URL, HTTP_PORT, PLAID_CLIENT_ID, SANDBOX_SECRET o PLAID_SECRET,
//	PLAID_ENV, PLAID_LANGUAGE, PLAID_COUNTRY_CODES y PLAID_LINK_CUSTOMIZATION_NAME opcionales).
//	PLAID_LANGUAGE y PLAID_COUNTRY_CODES deben coincidir con la Link customization (idioma y países).
//	Se ignora AWS_SECRET_ID aunque exista en el shell (evita mezclar credenciales AWS con .env).
//
//	AWS / producción: sin CONFIG_SOURCE=env (o sin definir CONFIG_SOURCE) y con
//	AWS_SECRET_ID → JSON desde Secrets Manager (database_url, http_port,
//	plaid_client_id, plaid_secret, plaid_env, link_customization_name, …). PLAID_ENV y
//	PLAID_LINK_CUSTOMIZATION_NAME en la Lambda sobrescriben el JSON si están definidos.
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

// plaidSecretFromEnv: header PLAID-SECRET de la API; en sandbox el dashboard lo llama "Sandbox secret".
// Acepta PLAID_SECRET o, si vacío, SANDBOX_SECRET (nombre que muchos equipos usan en .env).
func plaidSecretFromEnv() string {
	if s := strings.TrimSpace(os.Getenv("PLAID_SECRET")); s != "" {
		return s
	}
	return strings.TrimSpace(os.Getenv("SANDBOX_SECRET"))
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
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_ENV")); v != "" {
		app.PlaidEnv = v
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_LINK_CUSTOMIZATION_NAME")); v != "" {
		app.PlaidLinkCustomizationName = v
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_LANGUAGE")); v != "" {
		app.PlaidLanguage = v
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_COUNTRY_CODES")); v != "" {
		app.PlaidCountryCodes = v
	}
	if v := strings.TrimSpace(os.Getenv("MS_TRANSACTIONS_BASE_URL")); v != "" {
		app.MSTransactionsBaseURL = v
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
	if strings.TrimSpace(app.PlaidSecret) == "" {
		app.PlaidSecret = strings.TrimSpace(app.SandboxSecret)
	}
	app.SandboxSecret = ""
	if app.HTTPPort == "" {
		app.HTTPPort = "8080"
	}
	// Lambda (Terraform) sets HTTP_PORT and HTTP_PATH_PREFIX on the function; they must win over JSON
	// so the process listens on the same port as AWS_LWA_PORT (8080) and strips /ms-plaid for API Gateway.
	if p := strings.TrimSpace(os.Getenv("HTTP_PORT")); p != "" {
		app.HTTPPort = p
	}
	if p := strings.TrimSpace(os.Getenv("HTTP_PATH_PREFIX")); p != "" {
		app.HTTPPathPrefix = p
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_ENV")); v != "" {
		app.PlaidEnv = v
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_LINK_CUSTOMIZATION_NAME")); v != "" {
		app.PlaidLinkCustomizationName = v
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_LANGUAGE")); v != "" {
		app.PlaidLanguage = v
	}
	if v := strings.TrimSpace(os.Getenv("PLAID_COUNTRY_CODES")); v != "" {
		app.PlaidCountryCodes = v
	}
	if v := strings.TrimSpace(os.Getenv("MS_TRANSACTIONS_BASE_URL")); v != "" {
		app.MSTransactionsBaseURL = v
	}
	applyPlaidMVPDefaults(&app)
	return &app, nil
}

// applyPlaidMVPDefaults fija en código valores MVP cuando faltan (nombre del cliente, idioma, etc.).
// PlaidEnv solo se rellena con sandbox si sigue vacío (tras JSON y/o PLAID_ENV).
func applyPlaidMVPDefaults(a *App) {
	if a == nil {
		return
	}
	if strings.TrimSpace(a.PlaidEnv) == "" {
		a.PlaidEnv = mvpPlaidEnv
	}
	if strings.TrimSpace(a.PlaidClientName) == "" {
		a.PlaidClientName = mvpPlaidClientName
	}
	if strings.TrimSpace(a.PlaidLanguage) == "" {
		a.PlaidLanguage = mvpPlaidLanguage
	}
	if strings.TrimSpace(a.PlaidCountryCodes) == "" {
		a.PlaidCountryCodes = mvpPlaidCountryCodes
	}
	if strings.TrimSpace(a.PlaidProducts) == "" {
		a.PlaidProducts = mvpPlaidProducts
	}
	if strings.TrimSpace(a.PlaidLinkCustomizationName) == "" {
		a.PlaidLinkCustomizationName = mvpPlaidLinkCustomizationName
	}
	a.PlaidWebhook = ""
	a.PlaidRedirect = ""
	if a.PlaidTransactionsDaysRequested == nil {
		d := mvpPlaidTransactionsDays
		a.PlaidTransactionsDaysRequested = &d
	}
}

// PlaidConfigured is true when credentials are present for Link token creation.
func (a *App) PlaidConfigured() bool {
	return a != nil && strings.TrimSpace(a.PlaidClientID) != "" && strings.TrimSpace(a.PlaidSecret) != ""
}

// ResolveMSTransactionsBaseURL devuelve la base URL de ms-transactions sin barra final.
func (a *App) ResolveMSTransactionsBaseURL() string {
	if a == nil {
		return ""
	}
	return strings.TrimRight(strings.TrimSpace(a.MSTransactionsBaseURL), "/")
}
