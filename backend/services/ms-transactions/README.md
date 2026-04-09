# ms-transactions

Microservicio de transacciones y snapshots financieros del usuario autenticado.

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
  - prefijo: `GET|POST /v1/transactions/...`

## Autenticación y scoping

Todos los endpoints bajo `/v1/transactions` usan middleware de autenticación y filtran por usuario autenticado.

- El frontend **no** debe enviar `user_id`.
- El backend toma el usuario desde el token y aplica aislamiento por usuario en queries.

## Catálogo de endpoints

| Método | Ruta | Qué muestra | Query/Path params | Códigos comunes |
|---|---|---|---|---|
| `GET` | `/v1/transactions` | Lista paginada de transacciones del usuario | `limit`, `offset`, `from` (RFC3339), `to` (RFC3339), `category` | `200`, `400`, `401`, `500` |
| `GET` | `/v1/transactions/:id` | Detalle por ID interno | `id` (path) | `200`, `400`, `401`, `404`, `500` |
| `GET` | `/v1/transactions/by-transaction-id/:transaction_id` | Detalle por transaction_id externo | `transaction_id` (path) | `200`, `400`, `401`, `404`, `500` |
| `GET` | `/v1/transactions/analysis/latest` | Último análisis agregado del usuario | - | `200`, `401`, `404`, `500` |
| `GET` | `/v1/transactions/insights` | Lista paginada de insights | `limit`, `offset` | `200`, `400`, `401`, `500` |
| `GET` | `/v1/transactions/resilience-factors` | Factores de resiliencia del usuario | - | `200`, `401`, `500` |
| `GET` | `/v1/transactions/cash-flow/latest` | Último snapshot de cash flow | - | `200`, `401`, `404`, `500` |
| `GET` | `/v1/transactions/pulse/latest` | Último snapshot de pulse diario | - | `200`, `401`, `404`, `500` |
| `POST` | `/v1/transactions/test-bedrock` | Prueba de conectividad con `ai-pipeline` | - | `200`, `401`, `502`, `500` |

## Endpoint -> pantallas sugeridas en app móvil

- **Pantalla Movimientos**
  - `GET /v1/transactions`
  - Uso: feed de transacciones, filtros por fecha/categoría, paginación.

- **Pantalla Detalle de movimiento**
  - `GET /v1/transactions/:id`
  - Alternativa por ID externo: `GET /v1/transactions/by-transaction-id/:transaction_id`

- **Home financiera / Resumen**
  - `GET /v1/transactions/analysis/latest`
  - `GET /v1/transactions/pulse/latest`
  - Uso: score/riesgo + estado diario en widgets iniciales.

- **Pantalla Insights**
  - `GET /v1/transactions/insights`
  - Uso: recomendaciones y oportunidades ordenadas por recencia.

- **Pantalla Resiliencia**
  - `GET /v1/transactions/resilience-factors`
  - Uso: explicación por factores (peso, score raw, score ponderado).

- **Pantalla Cash Flow**
  - `GET /v1/transactions/cash-flow/latest`
  - Uso: liquidez proyectada, gastos recurrentes y alertas impulsivas.

- **QA / Soporte técnico**
  - `POST /v1/transactions/test-bedrock`
  - Uso: check rápido de integración IA (no para UX principal de usuario final).

## Ejemplos rápidos (cURL)

Asume:
- `API_BASE=https://<api-id>.execute-api.<region>.amazonaws.com`
- `TOKEN=<id_token_o_access_token_valido>`

### 1) Lista de transacciones con filtros

```bash
curl -G "$API_BASE/v1/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "limit=20" \
  --data-urlencode "offset=0" \
  --data-urlencode "from=2026-04-01T00:00:00Z" \
  --data-urlencode "to=2026-04-30T23:59:59Z" \
  --data-urlencode "category=food"
```

### 2) Último análisis agregado

```bash
curl "$API_BASE/v1/transactions/analysis/latest" \
  -H "Authorization: Bearer $TOKEN"
```

### 3) Último pulse

```bash
curl "$API_BASE/v1/transactions/pulse/latest" \
  -H "Authorization: Bearer $TOKEN"
```

### 4) Test de Bedrock (vía ai-pipeline)

```bash
curl -X POST "$API_BASE/v1/transactions/test-bedrock" \
  -H "Authorization: Bearer $TOKEN"
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
