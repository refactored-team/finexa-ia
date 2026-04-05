// Microservicio de usuarios: CRUD sobre la tabla users.
//
//	@title			ms-users API
//	@version		1.0.0
//	@description	API REST de usuarios (Postgres). Documentación OpenAPI vía Swagger UI en /swagger.
//	@BasePath		/
//	@schemes		http https
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"os"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	httpSwagger "github.com/swaggo/http-swagger"
	"go.uber.org/fx"

	"finexa-ia/apiresult"

	_ "finexa-ia/ms-users/docs"

	"finexa-ia/ms-users/internal/config"
	"finexa-ia/ms-users/internal/handlers"
	"finexa-ia/ms-users/internal/repository"
	"finexa-ia/ms-users/internal/services"
	pkgdb "finexa-ia/ms-users/pkg/db"
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
	log := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	e := echo.NewWithConfig(echo.Config{Logger: log})
	e.Use(middleware.RequestLogger())
	e.Use(middleware.Recover())
	e.HTTPErrorHandler = apiresult.HTTPErrorHandler(apiresult.ExposeInternalError())
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
	cfg *config.App,
	health *handlers.HealthHandler,
	user *handlers.UserHandler,
) {
	// Swagger UI + swagger.json (generado con `make swag`; ver docs/docs.go).
	e.GET("/swagger/*", echo.WrapHandler(httpSwagger.WrapHandler))
	e.GET("/docs", func(c *echo.Context) error {
		return c.Redirect(302, "/swagger/index.html")
	})

	if p := cfg.HTTPPathPrefix; p != "" {
		e.Use(apiresult.HTTPPathPrefixMiddleware(p))
	}
	health.Register(e)
	user.Register(e)
}

func startServer(lc fx.Lifecycle, e *echo.Echo, cfg *config.App) {
	sc := echo.StartConfig{
		Address:    fmt.Sprintf(":%s", cfg.HTTPPort),
		HideBanner: false,
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
