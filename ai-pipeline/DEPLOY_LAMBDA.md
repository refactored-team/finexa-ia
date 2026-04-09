# Desplegar ai-pipeline en AWS Lambda (estado actual)

Guía operativa para el despliegue HTTP de `ai-pipeline` en el stack MVP.

## Estado implementado

- Imagen Lambda: [`Dockerfile.lambda`](Dockerfile.lambda) (AWS Lambda Web Adapter + Uvicorn en `8080`).
- Health checks: `GET /health` y `GET /ready` en [`api/routes/system.py`](api/routes/system.py).
- Infra Terraform: servicio `ai-pipeline` en ECR + Lambda + rutas API Gateway (`/ai-pipeline/*`).
- CI/CD: workflow [`.github/workflows/backend-lambda.yml`](../.github/workflows/backend-lambda.yml) incluye `ai-pipeline` en matrix de build/deploy.

## Endpoints de validación

- Health público: `GET /ai-pipeline/health`
- Readiness: `GET /ai-pipeline/ready`
- Prueba Bedrock: `POST /ai-pipeline/test-bedrock`

## Build local de imagen

```bash
docker build --platform linux/amd64 --provenance=false --sbom=false \
  -f ai-pipeline/Dockerfile.lambda \
  -t ai-pipeline:lambda-<tag> \
  ai-pipeline
```

## Push a ECR + update Lambda

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO=finexa-infra-mvp-ai-pipeline
TAG=<tag>
IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:$TAG"

aws ecr get-login-password --region "$AWS_REGION" \
| docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

docker tag ai-pipeline:lambda-$TAG "$IMAGE_URI"
docker tag ai-pipeline:lambda-$TAG "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:latest"
docker push "$IMAGE_URI"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:latest"

aws lambda update-function-code \
  --region "$AWS_REGION" \
  --function-name finexa-infra-mvp-ai-pipeline \
  --image-uri "$IMAGE_URI"

aws lambda wait function-updated-v2 \
  --region "$AWS_REGION" \
  --function-name finexa-infra-mvp-ai-pipeline
```

## Terraform (primera vez o cambios de infra)

```bash
cd infra/environments/mvp
terraform init -backend-config=backend.hcl
terraform apply
```

Notas:
- No definir `AWS_REGION` en `lambda_http_services.environment_variables` (clave reservada por Lambda).
- `ai-pipeline` requiere permisos IAM para `bedrock:InvokeModel*` y `sagemaker:InvokeEndpoint`.

## SQS vs HTTP

- `adapters/lambda_handler.py` (SQS) sigue disponible para procesamiento asíncrono.
- El despliegue de este documento es para API HTTP (`/ai-pipeline/*`) detrás de API Gateway.
