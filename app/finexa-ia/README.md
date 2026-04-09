# App móvil — Finexa IA (Expo / React Native)

Cliente móvil del monorepo. Consume APIs en AWS (API Gateway + Lambdas) con autenticación Cognito.

## Requisitos

- Node.js + npm
- Expo CLI (vía `npx expo`)
- Variables `EXPO_PUBLIC_*` configuradas para tu entorno

## Ejecutar en local

```bash
cd app/finexa-ia
npm install
npx expo start
```

## Variables de entorno recomendadas

Configura en `.env` (o tu mecanismo de env local) las públicas que use la app, por ejemplo:

- `EXPO_PUBLIC_API_BASE_URL` (ej. `https://<api-id>.execute-api.us-east-1.amazonaws.com`)
- `EXPO_PUBLIC_COGNITO_USER_POOL_ID`
- `EXPO_PUBLIC_COGNITO_CLIENT_ID`
- `EXPO_PUBLIC_AWS_REGION`

## Rutas backend relevantes

Sobre `EXPO_PUBLIC_API_BASE_URL`:

- `/ms-users/*`
- `/ms-plaid/*`
- `/ms-transactions/*`
- `/ai-pipeline/*` (incluye health en `/ai-pipeline/health`)

## Auth (alto nivel)

- Login/registro con Cognito desde la app.
- Requests protegidas al API con `Authorization: Bearer <id_token>`.
- Endpoints `.../health` son útiles para smoke tests sin sesión.

## Referencias

- Infra y outputs: [`../../infra/README.md`](../../infra/README.md)
- Arquitectura general: [`../../README.md`](../../README.md)
