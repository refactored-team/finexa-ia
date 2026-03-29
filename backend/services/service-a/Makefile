.PHONY: run build tidy test sqlc

ENV_FILE ?= .env.dev

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
