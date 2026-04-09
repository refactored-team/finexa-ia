# Desplegar ai-pipeline en AWS Lambda (HTTP API + CI/CD)

Este documento alinea **ai-pipeline** (Python / FastAPI) con el patrón que ya usa el monorepo en **infra** (`infra/`) y **CI** (`.github/workflows/backend-lambda.yml`) para los microservicios Go.

---

## 1. Qué expone hoy el proyecto Python

| Modo | Dónde | Rol |
|------|--------|-----|
| **HTTP (FastAPI)** | [`Dockerfile`](Dockerfile) → `uvicorn pipeline.main:app` puerto **8000** | API REST local / contenedor; es lo que la app móvil o otros servicios llamarían como “API de IA”. |
| **Lambda (SQS)** | [`adapters/lambda_handler.py`](adapters/lambda_handler.py) | Procesa mensajes **SQS** (batch, `batchItemFailures`). **No** es el mismo contrato que API Gateway HTTP. |

La infra Terraform actual ([`infra/modules/http-api-lambdas`](../infra/modules/http-api-lambdas)) crea **API Gateway HTTP v2 → Lambda (imagen en ECR)** con prefijo de ruta por servicio. Los Go usan **AWS Lambda Web Adapter** para traducir peticiones HTTP al proceso que escucha en `8080`.

**Conclusión:** para “la misma API FastAPI” detrás del API Gateway del MVP, hace falta una **imagen Lambda HTTP** (adapter + uvicorn), no reutilizar tal cual el handler SQS.

---

## 2. Qué usa el stack Lambda del repo (referencia)

- **ECR**: un repo por clave en `ecr_services` → nombre `{project}-{environment}-{service}` (ej. `finexa-infra-mvp-ms-transactions`).
- **Lambda**: contenedor `package_type = Image`, `image_uri` = ECR + tag.
- **API Gateway**: ruta por servicio con `route_path_prefix` (ej. `/ms-transactions`); el adapter puede quitar el prefijo antes de llegar al proceso (`REMOVE_BASE_PATH`).
- **Auth**: authorizer JWT Cognito en API Gateway (las Lambdas reciben ya el contexto si está configurado en rutas protegidas).
- **VPC (opcional)**: si la Lambda debe hablar con **RDS**, `lambda_attach_to_vpc` + security groups; para **Bedrock / SageMaker** suele bastar salida a internet (NAT en subnets privadas) o endpoints VPC.

Detalle: [`infra/modules/http-api-lambdas/README.md`](../infra/modules/http-api-lambdas/README.md), [`infra/README.md`](../infra/README.md).

---

## 3. Requisitos para ai-pipeline como cuarto servicio HTTP en Lambda

### 3.1 Imagen Docker (Lambda + FastAPI)

- Añadir un **`Dockerfile.lambda`** (patrón análogo a [`backend/services/ms-transactions/Dockerfile.lambda`](../backend/services/ms-transactions/Dockerfile.lambda)):
  - Base con **AWS Lambda Web Adapter** (`public.ecr.aws/awsguru/aws-lambda-adapter`) o imagen oficial Python + adapter en `/opt/extensions`.
  - Arrancar **uvicorn** sobre `pipeline.main:app` en **`PORT=8080`** (el módulo HTTP de Lambda del repo usa `HTTP_PORT=8080`).
  - Variables típicas del adapter: `AWS_LWA_PORT=8080`, `REMOVE_BASE_PATH=/ai-pipeline` (o el prefijo que defináis en Terraform), `READINESS_CHECK_PATH` si exponéis `/ready` o `/health`.
- Ajustar **contexto de build**: hoy el CI de backend hace `docker build` con `working-directory: backend`. **ai-pipeline** está en la raíz del repo; el workflow tendrá que usar **contexto** `ai-pipeline/` o raíz del repo con `-f ai-pipeline/Dockerfile.lambda`.
- **Plataforma**: `linux/amd64` (coincide con `architectures = ["x86_64"]` en Terraform).

### 3.2 Terraform (`infra/environments/mvp`)

- Incluir la clave del servicio en **`ecr_services`** (ej. `"ai-pipeline"`).
- Añadir entrada en **`lambda_http_services`** con:
  - `route_path_prefix = "/ai-pipeline"` (o el prefijo acordado).
  - `memory_size` / `timeout` acordes a **Bedrock** (suele subirse respecto a 512 MB / 60 s; p. ej. 1024 MB y 120 s como punto de partida).
  - `environment_variables` para regiones y flags (`BEDROCK_REGION`, `SAGEMAKER_*`, etc.), o leerlos del secreto compartido si los centralizáis.

El `check` en [`locals.tf`](../infra/environments/mvp/locals.tf) exige que **toda** clave de `lambda_http_services` exista en `ecr_services`.

### 3.3 IAM de la Lambda (Bedrock / SageMaker)

El rol de ejecución compartido de las Lambdas HTTP solo tiene políticas básicas (+ VPC). Para ai-pipeline hace falta **adjuntar** (en Terraform o política inline) permisos mínimos, por ejemplo:

- `bedrock:InvokeModel` / `bedrock:InvokeModelWithResponseStream` en los ARNs de modelo que uséis (o restricción por cuenta/región según política de la cuenta).
- `sagemaker:InvokeEndpoint` en el endpoint de resiliencia (si aplica).

Sin esto, la Lambda fallará al llamar a boto3 aunque la imagen sea correcta.

### 3.4 Variables de entorno y secretos

- Revisar [`core/config.py`](core/config.py): credenciales en Lambda deben venir del **rol IAM** (recomendado), no de access keys en env.
- Si usáis el secreto compartido `MICROSERVICES_SECRET_ARN` (inyectado por Terraform cuando `enable_app_secrets` es true), documentar qué claves JSON espera ai-pipeline.

### 3.5 CI/CD (GitHub Actions)

El workflow [`backend-lambda.yml`](../.github/workflows/backend-lambda.yml):

- Solo dispara cambios bajo **`backend/**`**; **no** incluye `ai-pipeline/` a menos que ampliéis `paths` o añadáis un job/workflow dedicado.
- El **matrix** de build/deploy solo lista `ms-plaid`, `ms-users`, `ms-transactions`.
- El **build context** es el directorio **`backend/`**; para ai-pipeline hay que:
  - Añadir una fila al matrix con `dockerfile: ai-pipeline/Dockerfile.lambda` y `working-directory: .` (raíz del repo), **o**
  - Crear `.github/workflows/ai-pipeline-lambda.yml` que haga login ECR, build/push y `aws lambda update-function-code` con el mismo patrón.

Mantener el entorno **`aws-lambda-deploy`** con aprobación manual si es la política del equipo.

---

## 4. SQS vs HTTP (no mezclar sin diseño)

- **HTTP (API Gateway)**: cliente móvil / otros servicios llaman rutas REST; encaja con el módulo `http-api-lambdas`.
- **SQS**: procesamiento asíncrono por mensajes; el handler actual ya existe pero **no** está cableado en Terraform en este plan; requeriría otra Lambda (o el mismo nombre con otro trigger) + cola + permisos.

Decidid qué caso cubre el MVP (HTTP, SQS o ambos con dos funciones).

---

## 5. Checklist resumido

| Ítem | Acción |
|------|--------|
| Imagen Lambda HTTP | `Dockerfile.lambda` + uvicorn en 8080 + Lambda Web Adapter + prefijo |
| Terraform | `ecr_services` + `lambda_http_services["ai-pipeline"]` + memoria/timeout + env |
| IAM | Política Bedrock (+ SageMaker si aplica) al rol de Lambda |
| CI | Ampliar paths y matrix o workflow separado; contexto Docker desde raíz o `ai-pipeline/` |
| Primera vez | `terraform apply` → crear repo ECR → push imagen → Lambda apunta al tag |

---

## 6. Referencias rápidas en el repo

- Módulo API + Lambda: [`infra/modules/http-api-lambdas`](../infra/modules/http-api-lambdas)
- Variables MVP (`ecr_services`, `lambda_http_services`): [`infra/environments/mvp/locals.tf`](../infra/environments/mvp/locals.tf), [`variables.tf`](../infra/environments/mvp/variables.tf)
- Ejemplo Dockerfile Lambda (Go + adapter): [`backend/services/ms-transactions/Dockerfile.lambda`](../backend/services/ms-transactions/Dockerfile.lambda)
- Workflow deploy: [`.github/workflows/backend-lambda.yml`](../.github/workflows/backend-lambda.yml)
