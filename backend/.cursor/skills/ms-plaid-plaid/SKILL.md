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

## Origen de configuración

- **Local**: en `.env.dev` define `CONFIG_SOURCE=env`, `DATABASE_URL`, `PLAID_CLIENT_ID` y `SANDBOX_SECRET` (el “Sandbox secret” del dashboard; opcionalmente `PLAID_SECRET` si prefieres ese nombre). Opcional: `PLAID_ENV` (`sandbox`, `production`, …). `make run` carga el archivo.
- **AWS**: quita `CONFIG_SOURCE=env` en el task/container y define `AWS_SECRET_ID` con el JSON (`database_url`, `http_port`, `plaid_client_id`, `plaid_secret` o `sandbox_secret`, `plaid_env` opcional). Si la Lambda define `PLAID_ENV`, sobrescribe `plaid_env` del JSON (útil para alternar sin editar el secreto; también se puede fijar vía `environment_variables` de `lambda_http_services` en Terraform).

## Configuración Plaid (MVP)

- **Credenciales**: env local `PLAID_CLIENT_ID` + `SANDBOX_SECRET` (o `PLAID_SECRET`). En Secrets Manager: `plaid_client_id` y `plaid_secret` o `sandbox_secret`.
- **Entorno API Plaid** (`sandbox` vs `production`): variable `PLAID_ENV` o clave `plaid_env` en el JSON. Si ambos faltan, el default es `sandbox` (`applyPlaidMVPDefaults` en `internal/config/config.go`). En production el secret del dashboard debe ser el de **production**, no el de sandbox.
- **Resto del Link** (idioma, países, productos, días de transacciones, sin webhook/redirect por defecto): constantes `mvpPlaid*` en `internal/config/config.go` → `applyPlaidMVPDefaults`.

Sin client id y secret (vía `SANDBOX_SECRET` o `PLAID_SECRET`), el link-token responde **503**.

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
