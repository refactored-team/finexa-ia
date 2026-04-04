# HTTP API + Lambda (contenedor ECR)

## Despliegue (MVP)

1. **Build** de la imagen Lambda (contexto `backend/`):

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

## VPC y Aurora

Activa `lambda_attach_to_vpc = true` y rellena `lambda_vpc_security_group_ids` con un SG cuyo egress permita PostgreSQL hacia el SG de Aurora; añade ese SG a `aurora_allowed_security_group_ids` en Aurora.
