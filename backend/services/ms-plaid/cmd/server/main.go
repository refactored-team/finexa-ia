// Microservicio Plaid: salud y CRUD de ítems por user_id (identidad vía API gateway).
//
//	@title			ms-plaid API
//	@version		1.0.0
//	@description	Microservicio Plaid. La identidad del usuario debe validarse en el API gateway; aquí se usa userId en la ruta.
//	@BasePath		/
//	@schemes		http https
package main

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"github.com/swaggo/http-swagger"
	"go.uber.org/fx"

	_ "finexa-ia/ms-plaid/docs"

	"finexa-ia/ms-plaid/internal/config"
	"finexa-ia/ms-plaid/internal/handlers"
	"finexa-ia/ms-plaid/internal/repository"
	"finexa-ia/ms-plaid/internal/services"
	pkgdb "finexa-ia/ms-plaid/pkg/db"
)

func main() {
	fx.New(
		fx.Provide(
			config.Load,
			provideDB,
			repository.NewPlaidItemRepository,
			services.NewPlaidItemService,
			handlers.NewHealthHandler,
			handlers.NewPlaidItemHandler,
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
	plaid *handlers.PlaidItemHandler,
) {
	// Swagger UI + swagger.json (generado con `make swag`; ver docs/docs.go).
	e.GET("/swagger/*", echo.WrapHandler(httpSwagger.WrapHandler))
	e.GET("/docs", func(c *echo.Context) error {
		return c.Redirect(302, "/swagger/index.html")
	})
	health.Register(e)
	plaid.Register(e)
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
