package db

import (
	"database/sql"
	"fmt"

	_ "github.com/jackc/pgx/v5/stdlib"

	"finexa-ia/ms-transactions/internal/config"
)

func New(cfg *config.App) (*sql.DB, error) {
	pool, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := pool.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}
	return pool, nil
}
