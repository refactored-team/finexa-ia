// Microservicio de transacciones; API /v1/transactions. Misma BD que ms-users/ms-plaid (FK a users).
//
//	@title			ms-transactions API
//	@version		1.0.0
//	@description	Movimientos financieros por usuario interno
//	@BasePath		/
//	@schemes		http https
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net"
	"os"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	httpSwagger "github.com/swaggo/http-swagger"
	"go.uber.org/fx"

	"finexa-ia/apiresult"

	_ "finexa-ia/ms-transactions/docs"

	"finexa-ia/ms-transactions/internal/config"
	"finexa-ia/ms-transactions/internal/handlers"
	pkgdb "finexa-ia/ms-transactions/pkg/db"
)

func main() {
	fx.New(
		fx.Provide(
			config.Load,
			provideDB,
			handlers.NewHealthHandler,
			handlers.NewTransactionsHandler,
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
	tx *handlers.TransactionsHandler,
) {
	if p := cfg.HTTPPathPrefix; p != "" {
		e.Use(apiresult.HTTPPathPrefixMiddleware(p))
	}
	e.GET("/swagger/*", echo.WrapHandler(httpSwagger.WrapHandler))
	e.GET("/docs", func(c *echo.Context) error {
		return c.Redirect(302, "/swagger/index.html")
	})
	health.Register(e)
	tx.Register(e)
}

func waitForTCPListen(ctx context.Context, addr string) error {
	d := net.Dialer{Timeout: 150 * time.Millisecond}
	for {
		if err := ctx.Err(); err != nil {
			return err
		}
		c, err := d.DialContext(ctx, "tcp", addr)
		if err == nil {
			c.Close()
			return nil
		}
		time.Sleep(25 * time.Millisecond)
	}
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
			waitCtx, waitCancel := context.WithTimeout(ctx, 10*time.Second)
			defer waitCancel()
			addr := net.JoinHostPort("127.0.0.1", cfg.HTTPPort)
			if err := waitForTCPListen(waitCtx, addr); err != nil {
				cancel()
				return fmt.Errorf("echo did not listen on %s: %w", addr, err)
			}
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
