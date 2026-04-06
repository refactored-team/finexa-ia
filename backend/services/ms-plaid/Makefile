.PHONY: run build tidy test sqlc swag migrate-up migrate-up-remote migrate-up-remote-file migrate-down-remote migrate-help

ENV_FILE ?= .env.dev
# Para RDS / BD publicada: `make migrate-up-remote` (lee DATABASE_URL de este archivo).
ENV_FILE_REMOTE ?= .env.prod

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

# ── Postgres remoto (RDS u otra URL) ─────────────────────────────────────────────
# Requiere `psql` en PATH (macOS: brew install libpq && brew link --force libpq).
# Usa DATABASE_URL desde ENV_FILE_REMOTE (por defecto .env.prod).
#
#   make migrate-up-remote
#   make migrate-up-remote ENV_FILE_REMOTE=.env.staging
#
# migrate-down-remote aplica los bloques -- migrate:down en orden INVERSO (peligroso en prod).
migrate-up-remote:
	@command -v psql >/dev/null 2>&1 || { echo "Falta psql. Ej: brew install libpq && brew link --force libpq"; exit 1; }
	@test -f "$(ENV_FILE_REMOTE)" || { echo "No existe $(ENV_FILE_REMOTE). Copiá .env.prod.example → .env.prod"; exit 1; }
	@set -a && . ./$(ENV_FILE_REMOTE) && set +a && \
	if [ -z "$$DATABASE_URL" ]; then echo "DATABASE_URL vacío en $(ENV_FILE_REMOTE)"; exit 1; fi && \
	masked=$$(echo "$$DATABASE_URL" | sed 's/:[^:@]*@/:****@/'); echo "Conexión (enmascarada): $$masked" && \
	for f in $$(ls migrations/*.sql | sort); do \
		echo "Applying $$f"; \
		awk '/^-- migrate:up/{p=1;next}/^-- migrate:down/{p=0}p' "$$f" | \
		psql "$$DATABASE_URL" -v ON_ERROR_STOP=1 || exit 1; \
	done
	@echo "OK: migraciones :up aplicadas contra la BD de $(ENV_FILE_REMOTE)"

# Aplica solo un archivo (útil en RDS que ya tiene el resto de migraciones).
#   make migrate-up-remote-file FILE=migrations/0009_plaid_items_item_id.sql ENV_FILE_REMOTE=.env.mvp
migrate-up-remote-file:
	@command -v psql >/dev/null 2>&1 || { echo "Falta psql. Ej: brew install libpq && brew link --force libpq"; exit 1; }
	@test -f "$(ENV_FILE_REMOTE)" || { echo "No existe $(ENV_FILE_REMOTE)"; exit 1; }
	@test -n "$(FILE)" || { echo "Uso: make migrate-up-remote-file FILE=migrations/0009_plaid_items_item_id.sql [ENV_FILE_REMOTE=.env.mvp]"; exit 1; }
	@test -f "$(FILE)" || { echo "No existe $(FILE)"; exit 1; }
	@set -a && . ./$(ENV_FILE_REMOTE) && set +a && \
	if [ -z "$$DATABASE_URL" ]; then echo "DATABASE_URL vacío en $(ENV_FILE_REMOTE)"; exit 1; fi && \
	echo "Applying $(FILE) → $$(echo $$DATABASE_URL | sed 's/:[^:@]*@/:****@/')" && \
	awk '/^-- migrate:up/{p=1;next}/^-- migrate:down/{p=0}p' "$(FILE)" | \
	psql "$$DATABASE_URL" -v ON_ERROR_STOP=1
	@echo "OK: $(FILE) aplicado"

migrate-down-remote:
	@command -v psql >/dev/null 2>&1 || { echo "Falta psql. Ej: brew install libpq && brew link --force libpq"; exit 1; }
	@test -f "$(ENV_FILE_REMOTE)" || { echo "No existe $(ENV_FILE_REMOTE)"; exit 1; }
	@echo "⚠  Esto ejecuta migrate:down en orden INVERSO. Ctrl+C en 5s para cancelar..." && sleep 5
	@set -a && . ./$(ENV_FILE_REMOTE) && set +a && \
	if [ -z "$$DATABASE_URL" ]; then echo "DATABASE_URL vacío en $(ENV_FILE_REMOTE)"; exit 1; fi && \
	for f in $$(ls migrations/*.sql | sort -r); do \
		echo "Reverting $$f"; \
		awk '/^-- migrate:down/{p=1;next}p' "$$f" | \
		psql "$$DATABASE_URL" -v ON_ERROR_STOP=1 || exit 1; \
	done
	@echo "OK: bloques :down aplicados (orden inverso)"

migrate-help:
	@echo "Migraciones locales (Docker):  make migrate-up"
	@echo "Migraciones RDS / remoto:     make migrate-up-remote   [ENV_FILE_REMOTE=.env.prod]"
	@echo "Un solo archivo remoto:       make migrate-up-remote-file FILE=migrations/0009_plaid_items_item_id.sql ENV_FILE_REMOTE=.env.mvp"
	@echo "Revertir remoto (cuidado):    make migrate-down-remote"
