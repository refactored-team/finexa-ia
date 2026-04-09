# ms-users

API de usuarios internos (`cognito_sub`, `email` opcional). La tabla `users` es **canónica** y se comparte con **ms-plaid** vía la misma `DATABASE_URL` (FK en `plaid_items`, etc.).

## Migraciones

- **BD nueva (local o RDS):** aplicar **ms-users** antes que las migraciones de ms-plaid que referencian `users` (p. ej. antes de `0003_plaid_items`).
- **RDS que ya tiene `users` creada por ms-plaid:** no reejecutes `migrate-up-remote` completo de ms-plaid si cambiaste `0001` a no-op; para ms-users, si la tabla ya existe idéntica, `0001_users.sql` fallará: usá solo lo que falte o `CREATE TABLE IF NOT EXISTS` manual según tu caso.
- **Un solo archivo remoto:** `make migrate-up-remote-file FILE=migrations/0001_users.sql`

## Lambda

Mismo patrón que ms-plaid: Lambda Web Adapter, `REMOVE_BASE_PATH=/ms-users`, `/ready` para readiness.

## Contexto de plataforma

- `ms-users` comparte API Gateway con `ms-plaid`, `ms-transactions` y `ai-pipeline` (prefijo `/ai-pipeline`).
- La tabla `users` sigue siendo canónica para relaciones por `user_id` en el resto de servicios.
