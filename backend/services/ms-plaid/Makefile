.PHONY: run build tidy test sqlc swag migrate-up

ENV_FILE ?= .env.dev

# ── Swagger (swag) ─────────────────────────────────────────────────────────────
# Regenera docs/docs.go, swagger.json y swagger.yaml desde comentarios en main/handlers.
# En CI: tras cambiar rutas o comentarios `// @...`, ejecuta `make swag` y commitea `docs/`.
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

# ── Postgres (local docker-compose from backend/) ────────────────────────────────
# Migrations use dbmate-style sections (-- migrate:up / -- migrate:down). Feeding the
# raw file to psql would run both and undo the schema; this target applies only :up.
# Prerequisite: docker compose -f ../../docker-compose.yml up -d postgres
migrate-up:
	@for f in $$(ls migrations/*.sql | sort); do \
		echo "Applying $$f"; \
		awk '/^-- migrate:up/{p=1;next}/^-- migrate:down/{p=0}p' "$$f" | \
		docker compose -f ../../docker-compose.yml exec -T postgres psql -U finexa -d finexa -v ON_ERROR_STOP=1 || exit 1; \
	done
