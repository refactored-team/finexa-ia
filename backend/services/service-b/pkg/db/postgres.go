package db

import (
	"database/sql"
	"fmt"

	_ "github.com/jackc/pgx/v5/stdlib"

	"finexa-ia/service-b/internal/config"
)

// New opens a Postgres connection pool using the pgx stdlib driver.
// The caller is responsible for closing the pool (done via fx lifecycle in main).
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
