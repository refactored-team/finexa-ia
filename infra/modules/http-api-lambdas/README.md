# HTTP API + Lambda (contenedor ECR)

## Despliegue (MVP)

1. **Build** de la imagen Lambda (contexto `backend/`; el Dockerfile no usa `go.work` del monorepo, solo `ms-plaid` + `pkg/apiresult`):

   ```bash
   cd backend
   docker build --platform linux/amd64 -f services/ms-plaid/Dockerfile.lambda -t ms-plaid:lambda .
   ```

2. **Login** a ECR y **push** (sustituye cuenta, región y repo; el nombre del repo lo da `terraform output ecr_repository_names` o la convención `{project}-{environment}-ms-plaid`):

   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
   docker tag ms-plaid:lambda <account>.dkr.ecr.us-east-1.amazonaws.com/<repo>:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/<repo>:latest
   ```

3. **Terraform** (tras el push, o con un tag que ya exista en ECR):

   ```bash
   cd infra/environments/mvp
   terraform apply
   ```

   La Lambda usa `image_tag` (por defecto `latest` en `lambda_http_services`). En producción usa tags inmutables (digest o git sha).

4. **Probar**: `GET https://<api-id>.execute-api.<region>.amazonaws.com/ms-plaid/health` (público). Rutas bajo el mismo prefijo con `Authorization: Bearer <id_token>`.

## VPC y RDS

Activa `lambda_attach_to_vpc = true` y rellena `lambda_vpc_security_group_ids` con un SG cuyo egress permita PostgreSQL hacia el SG de RDS; añade ese SG a `postgres_allowed_security_group_ids` en el root MVP (o deja vacío y usa el CIDR de la VPC por defecto).

## CI/CD (GitHub Actions)

El workflow [`.github/workflows/backend-lambda.yml`](../../../.github/workflows/backend-lambda.yml) en la raíz del repo:

- En **PR** y **push** (solo cambios bajo `backend/` o ese workflow): ejecuta `make test-all` y, en PR, un `docker build` de validación por fila del matrix.
- En **push a `main`**: primero corre `make test-all`. El job de deploy usa el entorno **`aws-lambda-deploy`**: hasta que un revisor apruebe en la UI de Actions, **no** se ejecuta build/push a ECR ni `update-function-code`. Configuración: **Settings → Environments → aws-lambda-deploy → Required reviewers** (añadí al menos una persona o equipo). Si el entorno no tiene revisores requeridos, GitHub no pausa el deploy.

**Repositorio GitHub**

- **Secrets (usuario IAM, configuración actual del workflow)**: `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` del usuario o de un usuario de deploy dedicado. Opcional: `AWS_SESSION_TOKEN` si las credenciales son temporales. **No** guardes la secret access key en *Variables* del repo (no son confidenciales por defecto para quien tenga acceso de lectura). Podés mover estos secrets al entorno `aws-lambda-deploy` (Environment secrets) para que solo el job de deploy los vea.
- **Alternativa recomendada a largo plazo**: OIDC con secret `AWS_DEPLOY_ROLE_ARN` y `role-to-assume` en `configure-aws-credentials` (sin claves de larga duración en GitHub).
- **Variables de entorno del workflow** (en el YAML; o podés moverlas a *Variables* del repo si querés cambiarlas sin editar el archivo): `AWS_REGION` (`us-east-1`), `LAMBDA_PROJECT` (`finexa-infra`), `LAMBDA_ENV` (`mvp`). Deben coincidir con `project`, `environment` y región de Terraform para que el nombre del repo ECR sea `{LAMBDA_PROJECT}-{LAMBDA_ENV}-{service}` y la Lambda `{LAMBDA_PROJECT}-{LAMBDA_ENV}-{service}`.

**IAM (usuario o rol que use el workflow)**

- **OIDC**: proveedor `token.actions.githubusercontent.com`, trust del rol acotado al repo y rama; adjuntá la política de permisos siguiente.
- **Usuario IAM**: misma política en el usuario (o en un grupo al que pertenezca). Mejor un usuario solo para CI/CD, no tu usuario personal.

Permisos mínimos (acotá ARNs cuando puedas):

- **ECR**: `ecr:GetAuthorizationToken` en `*`; en el repo `arn:aws:ecr:REGION:ACCOUNT:repository/PROJECT-ENV-*` permisos de push (`BatchCheckLayerAvailability`, `CompleteLayerUpload`, `InitiateLayerUpload`, `PutImage`, `UploadLayerPart`, `BatchGetImage`, `GetDownloadUrlForLayer`) — o una política administrada tipo power user restringida al recurso.
- **Lambda**: `lambda:UpdateFunctionCode` y `lambda:GetFunction` en `arn:aws:lambda:REGION:ACCOUNT:function:PROJECT-ENV-*`.

**Añadir un microservicio**

Cuando des de alta el servicio en `ecr_services` y `lambda_http_services`, añade una fila al `matrix.include` del workflow (`service` + `dockerfile` relativo a `backend/`), igual que `ms-plaid`.
