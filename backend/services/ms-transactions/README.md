# ms-transactions

Microservicio de transacciones y snapshots financieros por usuario (`userId` en path).

## Qué cubre este servicio

- Listado y detalle de transacciones (`public.transactions`).
- Lecturas agregadas por usuario en esquema `finexa_tx`:
  - `transaction_analysis`
  - `insights`
  - `resilience_factors`
  - `cash_flow`
  - `pulse`
- Endpoint de diagnóstico para validar conexión hacia `ai-pipeline`/Bedrock.

## Base URL y salud

- Endpoints de salud (sin auth):
  - `GET /`
  - `GET /ready`
  - `GET /health` (incluye check de DB)
- Endpoints funcionales:
  - prefijo: `GET|POST /v1/users/:userId/transactions/...`

## Autenticación y scoping

La validación de identidad debe hacerse en API Gateway (authorizer).  
Este servicio aplica scoping por `userId` en la ruta.

- El cliente debe enviar `userId` en path.
- El backend aísla queries por ese `userId`.

## Catálogo de endpoints

| Método | Ruta | Qué muestra | Query/Path params | Códigos comunes |
|---|---|---|---|---|
| `GET` | `/v1/users/:userId/transactions` | Lista paginada de transacciones del usuario | `userId` (path), `limit`, `offset`, `from` (RFC3339), `to` (RFC3339), `category` | `200`, `400`, `500` |
| `GET` | `/v1/users/:userId/transactions/:id` | Detalle por ID interno | `userId`, `id` (path) | `200`, `400`, `404`, `500` |
| `GET` | `/v1/users/:userId/transactions/by-transaction-id/:transaction_id` | Detalle por transaction_id externo | `userId`, `transaction_id` (path) | `200`, `400`, `404`, `500` |
| `GET` | `/v1/users/:userId/transactions/analysis/latest` | Último análisis agregado del usuario | `userId` (path) | `200`, `400`, `404`, `500` |
| `GET` | `/v1/users/:userId/transactions/insights` | Lista paginada de insights | `userId` (path), `limit`, `offset` | `200`, `400`, `500` |
| `GET` | `/v1/users/:userId/transactions/resilience-factors` | Factores de resiliencia del usuario | `userId` (path) | `200`, `400`, `500` |
| `GET` | `/v1/users/:userId/transactions/cash-flow/latest` | Último snapshot de cash flow | `userId` (path) | `200`, `400`, `404`, `500` |
| `GET` | `/v1/users/:userId/transactions/pulse/latest` | Último snapshot de pulse diario | `userId` (path) | `200`, `400`, `404`, `500` |
| `POST` | `/v1/users/:userId/transactions/test-bedrock` | Prueba de conectividad con `ai-pipeline` | `userId` (path) | `200`, `400`, `502`, `500` |
| `POST` | `/v1/users/:userId/transactions/sync-and-analyze` | Plaid sync + análisis IA + persistencia | `userId` (path) + body opcional | `200`, `400`, `404`, `500`, `502`, `503` |

## Endpoint -> pantallas sugeridas en app móvil

- **Pantalla Movimientos**
  - `GET /v1/users/:userId/transactions`
  - Uso: feed de transacciones, filtros por fecha/categoría, paginación.

- **Pantalla Detalle de movimiento**
  - `GET /v1/users/:userId/transactions/:id`
  - Alternativa por ID externo: `GET /v1/users/:userId/transactions/by-transaction-id/:transaction_id`

- **Home financiera / Resumen**
  - `GET /v1/users/:userId/transactions/analysis/latest`
  - `GET /v1/users/:userId/transactions/pulse/latest`
  - Uso: score/riesgo + estado diario en widgets iniciales.

- **Pantalla Insights**
  - `GET /v1/users/:userId/transactions/insights`
  - Uso: recomendaciones y oportunidades ordenadas por recencia.

- **Pantalla Resiliencia**
  - `GET /v1/users/:userId/transactions/resilience-factors`
  - Uso: explicación por factores (peso, score raw, score ponderado).

- **Pantalla Cash Flow**
  - `GET /v1/users/:userId/transactions/cash-flow/latest`
  - Uso: liquidez proyectada, gastos recurrentes y alertas impulsivas.

- **QA / Soporte técnico**
  - `POST /v1/users/:userId/transactions/test-bedrock`
  - Uso: check rápido de integración IA (no para UX principal de usuario final).

## Ejemplos rápidos (cURL)

Asume:
- `API_BASE=https://<api-id>.execute-api.<region>.amazonaws.com`
- `USER_ID=<id_interno_usuario>`

### 1) Lista de transacciones con filtros

```bash
curl -G "$API_BASE/v1/users/$USER_ID/transactions" \
  --data-urlencode "limit=20" \
  --data-urlencode "offset=0" \
  --data-urlencode "from=2026-04-01T00:00:00Z" \
  --data-urlencode "to=2026-04-30T23:59:59Z" \
  --data-urlencode "category=food"
```

### 2) Último análisis agregado

```bash
curl "$API_BASE/v1/users/$USER_ID/transactions/analysis/latest"
```

### 3) Último pulse

```bash
curl "$API_BASE/v1/users/$USER_ID/transactions/pulse/latest"
```

### 4) Test de Bedrock (vía ai-pipeline)

```bash
curl -X POST "$API_BASE/v1/users/$USER_ID/transactions/test-bedrock"
```

## Notas de integración frontend

- Paginación:
  - usar `limit` (1..200) y `offset >= 0`.
- Fechas:
  - `from`/`to` deben venir en RFC3339.
  - respuestas de timestamps vienen en RFC3339 UTC (`...Z`).
- Estados vacíos:
  - endpoints `latest` pueden devolver `404` cuando no hay datos; tratar como estado vacío en UI (sin crash).
- Soft delete:
  - listado/lecturas excluyen borradas lógicas por defecto (`deleted_at IS NULL`).

## Referencias de código

- Rutas y lógica: [`internal/handlers/transactions.go`](internal/handlers/transactions.go)
- Health: [`internal/handlers/health.go`](internal/handlers/health.go)
- Modelo de respuesta de transacción: [`internal/models/transaction.go`](internal/models/transaction.go)
- Wiring de rutas: [`cmd/server/main.go`](cmd/server/main.go)

## Checklist manual E2E (sync-and-analyze)

1. Usuario autenticado existe en `users`.
2. Usuario tiene `plaid_items.access_token` activo (`deleted_at IS NULL`).
3. `ms-transactions` tiene `PLAID_CLIENT_ID`, `PLAID_SECRET`/`SANDBOX_SECRET`, `PLAID_ENV`.
4. `AI_PIPELINE_BASE_URL` apunta a `ai-pipeline` disponible.
5. Ejecutar:
   - `POST /v1/users/:userId/transactions/sync-and-analyze`
6. Verificar persistencia:
   - `public.transactions` (upserts por `transaction_id`)
   - `finexa_tx.transaction_analysis`
   - `finexa_tx.insights`
   - `finexa_tx.resilience_factors`
   - `finexa_tx.cash_flow`
   - `finexa_tx.pulse`
   - `finexa_tx.pipeline_runs`
