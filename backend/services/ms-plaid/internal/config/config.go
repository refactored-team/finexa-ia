package config

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type App struct {
	DatabaseURL string `json:"database_url"`
	HTTPPort    string `json:"http_port"`
}

// Load resolves configuration from AWS Secrets Manager when AWS_SECRET_ID is set,
// otherwise falls back to environment variables (CONFIG_SOURCE=env or no secret ID).
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
	return &App{DatabaseURL: dbURL, HTTPPort: port}, nil
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
	return &app, nil
}
