.PHONY: run build tidy test sqlc swag

ENV_FILE ?= .env.dev

# ── Swagger (swag) ─────────────────────────────────────────────────────────────
# Regenera docs/docs.go, swagger.json y swagger.yaml desde comentarios en main/handlers.
# Tras cambiar rutas o comentarios `// @...`, ejecuta `make swag` y commitea `docs/`.
swag:
	go run github.com/swaggo/swag/cmd/swag@v1.16.6 init -g cmd/server/main.go -o docs --parseInternal --parseDependency

# ── Local dev ──────────────────────────────────────────────────────────────────
run:
	@set -a && . ./$(ENV_FILE) && set +a && go run ./cmd/server

build:
	mkdir -p bin
	go build -o bin/server ./cmd/server

tidy:
	go mod tidy

test:
	go test ./...

# ── sqlc ───────────────────────────────────────────────────────────────────────
# Requires sqlc: go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
sqlc:
	sqlc generate
