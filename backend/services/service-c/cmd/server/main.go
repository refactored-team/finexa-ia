package main

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"go.uber.org/fx"

	"finexa-ia/service-c/internal/config"
	"finexa-ia/service-c/internal/handlers"
	"finexa-ia/service-c/internal/repository"
	"finexa-ia/service-c/internal/services"
	pkgdb "finexa-ia/service-c/pkg/db"
)

func main() {
	fx.New(
		fx.Provide(
			config.Load,
			provideDB,
			repository.NewUserRepository,
			services.NewUserService,
			handlers.NewHealthHandler,
			handlers.NewUserHandler,
			newEcho,
		),
		fx.Invoke(registerRoutes),
		fx.Invoke(startServer),
	).Run()
}

func newEcho() *echo.Echo {
	e := echo.New()
	e.Use(middleware.RequestLogger())
	e.Use(middleware.Recover())
	return e
}

// provideDB opens the DB pool and registers a shutdown hook to close it cleanly.
func provideDB(lc fx.Lifecycle, cfg *config.App) (*sql.DB, error) {
	db, err := pkgdb.New(cfg)
	if err != nil {
		return nil, err
	}
	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			return db.Close()
		},
	})
	return db, nil
}

func registerRoutes(
	e *echo.Echo,
	health *handlers.HealthHandler,
	user *handlers.UserHandler,
) {
	health.Register(e)
	user.Register(e)
}

func startServer(lc fx.Lifecycle, e *echo.Echo, cfg *config.App) {
	sc := echo.StartConfig{
		Address:    fmt.Sprintf(":%s", cfg.HTTPPort),
		HideBanner: true,
	}
	var cancel context.CancelFunc
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			serverCtx, c := context.WithCancel(context.Background())
			cancel = c
			go func() {
				if err := sc.Start(serverCtx, e); err != nil {
					e.Logger.Error("server stopped", "error", err)
				}
			}()
			return nil
		},
		OnStop: func(ctx context.Context) error {
			if cancel != nil {
				cancel()
			}
			return nil
		},
	})
}
