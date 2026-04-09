# Backend Finexa IA

Guía técnica corta del backend del monorepo.

## Estructura

- `services/ms-users`: identidad interna y tabla canónica `users`.
- `services/ms-plaid`: integración Plaid y vinculación de cuentas.
- `services/ms-transactions`: dominio de movimientos y endpoints de transacciones.
- `pkg/apiresult`: respuestas HTTP y manejo de errores compartido.
- `docker-compose.yml`: PostgreSQL local y servicios auxiliares de desarrollo.
- `Makefile`: tareas comunes (`test-all`, `run`, utilidades por servicio).

## Desarrollo local rápido

```bash
cd backend
docker compose up -d
make test-all
```

Para correr un servicio en local:

```bash
cd backend
make run SVC=ms-transactions
```

## Orden de migraciones (BD compartida)

En base nueva, aplicar en este orden:

1. `ms-users`
2. `ms-transactions`
3. `ms-plaid`

Razón: `transactions` y `plaid_*` referencian `users`.

## Despliegue Lambda (MVP)

- Runtime: API Gateway HTTP + Lambdas en contenedor (ECR).
- Naming: `{project}-{environment}-{service}`.
- CI/CD: ver [`.github/workflows/backend-lambda.yml`](../.github/workflows/backend-lambda.yml).
- Infra y rutas: ver [`infra/README.md`](../infra/README.md) y [`infra/modules/http-api-lambdas/README.md`](../infra/modules/http-api-lambdas/README.md).

## Documentación por servicio

- [ms-users](services/ms-users/README.md)
- `ms-plaid` y `ms-transactions`: revisar sus carpetas `migrations/`, `docs/` y `Makefile`.
