.PHONY: compose-up compose-down sqlc-all build-all tidy-all test-all \
	lambda-deploy lambda-deploy-ci lambda-build-all lambda-ecr-login lambda-build-push-update

SERVICES := ms-plaid ms-transactions ms-users

# svc:Dockerfile relativo a backend/ — misma matriz que .github/workflows/backend-lambda.yml
# (no usar | en el separador: /bin/sh interpreta | como tubería en el for.)
LAMBDA_MATRIX := \
	ms-plaid:services/ms-plaid/Dockerfile.lambda \
	ms-transactions:services/ms-transactions/Dockerfile.lambda \
	ms-users:services/ms-users/Dockerfile.lambda

# ── Lambda (ECR + update-function-code) — alineado con .github/workflows/backend-lambda.yml ──
AWS_REGION       ?= us-east-1
LAMBDA_PROJECT   ?= finexa-infra
LAMBDA_ENV       ?= mvp
# Tag inmutable (por defecto HEAD); override: make lambda-deploy TAG_SHA=abc123
TAG_SHA          ?= $(shell git rev-parse HEAD 2>/dev/null || echo manual)

# Un solo comando: build imágenes Lambda, push a ECR y actualiza cada función.
lambda-deploy: lambda-build-push-update

# Igual que CI: tests Go y luego deploy.
lambda-deploy-ci: test-all lambda-build-push-update

lambda-ecr-login:
	@command -v aws >/dev/null 2>&1 || { echo "Falta aws CLI."; exit 1; }
	@aws sts get-caller-identity >/dev/null 2>&1 || { echo "Configurá credenciales AWS (aws configure o variables de entorno)."; exit 1; }
	@ACCOUNT=$$(aws sts get-caller-identity --query Account --output text) && \
	REGISTRY="$${ACCOUNT}.dkr.ecr.$(AWS_REGION).amazonaws.com" && \
	aws ecr get-login-password --region $(AWS_REGION) | \
	docker login --username AWS --password-stdin "$$REGISTRY"

# Build + push + update (usa TAG_SHA, AWS_REGION, LAMBDA_PROJECT, LAMBDA_ENV).
lambda-build-push-update: lambda-ecr-login
	@set -e; \
	ACCOUNT=$$(aws sts get-caller-identity --query Account --output text); \
	REGISTRY="$${ACCOUNT}.dkr.ecr.$(AWS_REGION).amazonaws.com"; \
	for item in $(LAMBDA_MATRIX); do \
	  svc="$${item%%:*}"; \
	  DF="$${item#*:}"; \
	  REPO="$(LAMBDA_PROJECT)-$(LAMBDA_ENV)-$$svc"; \
	  LAMBDA_NAME="$(LAMBDA_PROJECT)-$(LAMBDA_ENV)-$$svc"; \
	  echo "▶ build + push + Lambda: $$svc ($$REPO)"; \
	  docker build --platform linux/amd64 --provenance=false --sbom=false \
	    --build-arg "GIT_SHA=$(TAG_SHA)" \
	    -f "$$DF" \
	    -t "$$REGISTRY/$$REPO:$(TAG_SHA)" \
	    -t "$$REGISTRY/$$REPO:latest" \
	    .; \
	  docker push "$$REGISTRY/$$REPO:$(TAG_SHA)"; \
	  docker push "$$REGISTRY/$$REPO:latest"; \
	  aws lambda update-function-code \
	    --region $(AWS_REGION) \
	    --function-name "$$LAMBDA_NAME" \
	    --image-uri "$$REGISTRY/$$REPO:$(TAG_SHA)"; \
	  aws lambda wait function-updated-v2 --region $(AWS_REGION) --function-name "$$LAMBDA_NAME"; \
	done; \
	echo "OK: Lambdas actualizadas ($(LAMBDA_PROJECT)-$(LAMBDA_ENV)-*) tag $(TAG_SHA)"

# Solo build local (sin AWS): valida Dockerfiles.
lambda-build-all:
	@for item in $(LAMBDA_MATRIX); do \
	  svc="$${item%%:*}"; \
	  DF="$${item#*:}"; \
	  echo "▶ docker build $$svc"; \
	  docker build --platform linux/amd64 --provenance=false --sbom=false \
	    --build-arg "GIT_SHA=$(TAG_SHA)" \
	    -f "$$DF" \
	    -t lambda-local:$$svc \
	    . || exit 1; \
	done

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
