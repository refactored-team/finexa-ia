---
name: ms-plaid Plaid integration
description: Microservicio ms-plaid — Link token, variables PLAID_*, flujo hacia items y enlaces a documentación Plaid. Usar al cambiar integración Plaid, endpoints o configuración.
---

# ms-plaid y Plaid

## Cliente Go (plaid-go)

- Módulo: **`github.com/plaid/plaid-go/v41`** (versión fijada en `services/ms-plaid/go.mod`; alinear con el [README de instalación](https://github.com/plaid/plaid-go?tab=readme-ov-file#installation)).
- Actualizar: `cd services/ms-plaid && go get github.com/plaid/plaid-go/v41@latest && go mod tidy`.
- La librería sigue la API Plaid **2020-09-14**; tras un major de `plaid-go`, revisar el constructor de `LinkTokenCreateRequest` y enums (`CountryCode`, `Products`) por posibles cambios generados desde OpenAPI.

## Ubicación del código

- Servicio: `services/ms-plaid/`
- Handler Link: `internal/handlers/plaid_link.go` — `POST /v1/users/{userId}/plaid/link-token`
- Items (tras exchange): `internal/handlers/plaid_item.go` — `/v1/users/{userId}/plaid-item`
- Cliente Plaid y request: `internal/plaidclient/`
- Sesiones en BD: tabla `plaid_link_sessions` (migración `migrations/0007_plaid_link_sessions.sql`)

## Flujo end-to-end

1. La app llama a **POST** `/v1/users/{userId}/plaid/link-token` (identidad del usuario debe validarse en el API gateway; aquí se confía en `userId` de la ruta).
2. El backend llama a Plaid [**`/link/token/create`**](https://plaid.com/docs/api/link/#linktokencreate) y devuelve `link_token`, `expiration`, `request_id`.
3. Se inserta una fila en `plaid_link_sessions` con `expires_at`, `plaid_request_id`, `plaid_environment`, `initial_products`. **No** se persiste el `link_token`.
4. El cliente abre Plaid Link con ese token; al terminar recibe un `public_token`.
5. Paso siguiente (otro endpoint o el actual POST `plaid-item`): intercambiar con Plaid [**`/item/public_token/exchange`**](https://plaid.com/docs/api/items/#itempublic_tokenexchange) y guardar `item_id` + `access_token` en `plaid_items` (ya soportado por el POST existente de `plaid-item`).

## Configuración Plaid (MVP)

- **Credenciales** (`plaid_client_id`, `plaid_secret`): env local (`PLAID_CLIENT_ID`, `PLAID_SECRET`) o JSON en Secrets Manager junto con `database_url` / `http_port`.
- **Resto del Link** (entorno sandbox, idioma, países, productos, días de transacciones, sin webhook/redirect por defecto): constantes en `internal/config/config.go` → `applyPlaidMVPDefaults`. Para cambiar el MVP, edita ahí las variables `mvpPlaid*`.

Sin `PLAID_CLIENT_ID` / `PLAID_SECRET`, el endpoint de link-token responde **503**.

El body opcional del POST `link-token` sigue pudiendo enviar `webhook_url` y `redirect_uri` por petición.

## Body opcional del link-token

`CreateLinkTokenBody`: `redirect_uri`, `webhook_url` — sustituyen a la config para esa petición.

## Regenerar artefactos

- OpenAPI / Swagger: desde `services/ms-plaid`, `make swag`
- Código SQL: `make sqlc` (tras cambiar `sql/queries/` o `sql/schema.sql`)

## Documentación Plaid útil

- [Link — Create Link Token](https://plaid.com/docs/api/link/#linktokencreate)
- [Items — public_token/exchange](https://plaid.com/docs/api/items/#itempublic_tokenexchange)
- [Productos por país](https://plaid.com/global/)

## Notas de cumplimiento / buenas prácticas

- `client_user_id` debe ser un ID interno estable (en este MS: el `userId` numérico como string), **no** email ni teléfono.
- Registrar `redirect_uri` y webhooks en el [dashboard de Plaid](https://dashboard.plaid.com/).
- Algunos flujos nuevos pueden requerir `user_id` de `/user/create` en lugar del objeto `user`; revisar el contrato de vuestra cuenta si Plaid lo exige.

## Pruebas

- `go test ./...` en `services/ms-plaid`
- Tests del servicio de link: `internal/services/plaid_link_test.go` (mock del cliente Plaid y del repo)
