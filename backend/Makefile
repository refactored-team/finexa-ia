.PHONY: compose-up compose-down sqlc-all build-all tidy-all test-all

SERVICES := ms-plaid ms-transactions ms-users

# ── Docker Compose ─────────────────────────────────────────────────────────────
compose-up:
	docker compose up -d

compose-down:
	docker compose down

compose-logs:
	docker compose logs -f

# ── Aggregate targets (runs for every service) ─────────────────────────────────
sqlc-all:
	@for svc in $(SERVICES); do \
	  echo "▶ sqlc generate $$svc"; \
	  $(MAKE) -C services/$$svc sqlc; \
	done

tidy-all:
	@for svc in $(SERVICES); do \
	  echo "▶ go mod tidy $$svc"; \
	  $(MAKE) -C services/$$svc tidy; \
	done

build-all:
	@for svc in $(SERVICES); do \
	  echo "▶ build $$svc"; \
	  $(MAKE) -C services/$$svc build; \
	done

test-all:
	@for svc in $(SERVICES); do \
	  echo "▶ test $$svc"; \
	  $(MAKE) -C services/$$svc test; \
	done

# ── Quick local run (choose which service via SVC=ms-plaid) ───────────────────
run:
	$(MAKE) -C services/$(SVC) run
