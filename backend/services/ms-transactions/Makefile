.PHONY: run build tidy test swag migrate-up migrate-up-remote migrate-up-remote-file migrate-down-remote migrate-help

ENV_FILE ?= .env.dev
ENV_FILE_REMOTE ?= .env.prod

swag:
	go run github.com/swaggo/swag/cmd/swag@v1.16.6 init -g cmd/server/main.go -o docs --parseInternal --parseDependency

run:
	@set -a && . ./$(ENV_FILE) && set +a && go run ./cmd/server

build:
	mkdir -p bin
	go build -o bin/server ./cmd/server

tidy:
	go mod tidy

test:
	go test ./...

# Orden en BD nueva: ms-users → ms-transactions (FK users) → ms-plaid (si aplica).
migrate-up:
	@for f in $$(ls migrations/*.sql | sort); do \
		echo "Applying $$f"; \
		awk '/^-- migrate:up/{p=1;next}/^-- migrate:down/{p=0}p' "$$f" | \
		docker compose -f ../../docker-compose.yml exec -T postgres psql -U finexa -d finexa -v ON_ERROR_STOP=1 || exit 1; \
	done

migrate-up-remote:
	@command -v psql >/dev/null 2>&1 || { echo "Falta psql."; exit 1; }
	@test -f "$(ENV_FILE_REMOTE)" || { echo "No existe $(ENV_FILE_REMOTE)"; exit 1; }
	@set -a && . ./$(ENV_FILE_REMOTE) && set +a && \
	if [ -z "$$DATABASE_URL" ]; then echo "DATABASE_URL vacío"; exit 1; fi && \
	masked=$$(echo "$$DATABASE_URL" | sed 's/:[^:@]*@/:****@/'); echo "Conexión (enmascarada): $$masked" && \
	for f in $$(ls migrations/*.sql | sort); do \
		echo "Applying $$f"; \
		awk '/^-- migrate:up/{p=1;next}/^-- migrate:down/{p=0}p' "$$f" | \
		psql "$$DATABASE_URL" -v ON_ERROR_STOP=1 || exit 1; \
	done
	@echo "OK: migraciones aplicadas ($(ENV_FILE_REMOTE))"

migrate-up-remote-file:
	@command -v psql >/dev/null 2>&1 || { echo "Falta psql."; exit 1; }
	@test -f "$(ENV_FILE_REMOTE)" || { echo "No existe $(ENV_FILE_REMOTE)"; exit 1; }
	@test -n "$(FILE)" || { echo "Uso: make migrate-up-remote-file FILE=migrations/0001_transactions.sql"; exit 1; }
	@test -f "$(FILE)" || { echo "No existe $(FILE)"; exit 1; }
	@set -a && . ./$(ENV_FILE_REMOTE) && set +a && \
	if [ -z "$$DATABASE_URL" ]; then echo "DATABASE_URL vacío"; exit 1; fi && \
	echo "Applying $(FILE) (:up only)" && \
	awk '/^-- migrate:up/{p=1;next}/^-- migrate:down/{p=0}p' "$(FILE)" | \
	psql "$$DATABASE_URL" -v ON_ERROR_STOP=1 && \
	echo "OK: $(FILE)"

migrate-down-remote:
	@command -v psql >/dev/null 2>&1 || { echo "Falta psql."; exit 1; }
	@test -f "$(ENV_FILE_REMOTE)" || { echo "No existe $(ENV_FILE_REMOTE)"; exit 1; }
	@echo "⚠ migrate:down inverso en 5s…" && sleep 5
	@set -a && . ./$(ENV_FILE_REMOTE) && set +a && \
	for f in $$(ls migrations/*.sql | sort -r); do \
		awk '/^-- migrate:down/{p=1;next}p' "$$f" | psql "$$DATABASE_URL" -v ON_ERROR_STOP=1 || exit 1; \
	done

migrate-help:
	@echo "Local:   make migrate-up"
	@echo "Remoto:  make migrate-up-remote | make migrate-up-remote-file FILE=migrations/0001_transactions.sql"
