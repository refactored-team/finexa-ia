module "vpc" {
  source = "../../modules/vpc"

  project            = var.project
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  az_count           = var.vpc_az_count
  enable_nat_gateway = var.vpc_enable_nat_gateway
}

module "ecr" {
  source   = "../../modules/ecr"
  for_each = var.ecr_services

  project               = var.project
  environment           = var.environment
  service_name          = each.key
  image_retention_count = var.ecr_image_retention_count
}

module "cognito" {
  source = "../../modules/cognito"

  user_pool_name         = var.cognito_user_pool_name
  client_name            = var.cognito_client_name
  domain_prefix          = var.cognito_domain_prefix
  reply_to_email_address = var.cognito_reply_to_email
  callback_urls          = var.cognito_callback_urls
  logout_urls            = var.cognito_logout_urls
  sns_caller_arn         = var.cognito_sns_caller_arn
  sns_external_id        = var.cognito_sns_external_id
  aws_region             = var.aws_region
}

module "app_secrets" {
  source = "../../modules/app-secrets"
  count  = var.enable_app_secrets ? 1 : 0

  project     = var.project
  environment = var.environment

  microservices_initial_json = var.app_secrets_microservices_initial_json
}

# RDS: si cambias rds_publicly_accessible o subredes con instancia ya existente, AWS a menudo rechaza el cambio.
# Entonces: snapshot en consola → destroy selectivo (ver comentario al final de este archivo) → terraform apply.
module "rds_postgres" {
  source = "../../modules/rds-postgresql"
  count  = var.enable_rds_postgres ? 1 : 0

  project     = var.project
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = var.rds_publicly_accessible ? module.vpc.public_subnet_ids : module.vpc.private_subnet_ids

  publicly_accessible = var.rds_publicly_accessible

  allowed_security_group_ids = var.postgres_allowed_security_group_ids
  allowed_cidr_blocks        = local.postgres_ingress_cidr_blocks

  database_name           = var.rds_database_name
  master_username         = var.rds_master_username
  engine_version          = var.rds_engine_version
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
  skip_final_snapshot     = var.rds_skip_final_snapshot
  deletion_protection     = var.rds_deletion_protection
}

# Lambda ENIs need a security group when using VPC. If none is passed, create one (egress only; Postgres allows VPC CIDR).
resource "aws_security_group" "lambda_vpc" {
  count = var.lambda_attach_to_vpc && length(var.lambda_vpc_security_group_ids) == 0 ? 1 : 0

  name_prefix = "${var.project}-${var.environment}-lambda-"
  vpc_id      = module.vpc.vpc_id
  description = "Lambda in private subnets (default when lambda_vpc_security_group_ids is empty)"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-${var.environment}-lambda-vpc"
  }
}

module "http_api" {
  source = "../../modules/http-api-lambdas"
  count  = var.enable_http_api && length(local.http_lambda_services) > 0 ? 1 : 0

  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  cognito_issuer_url = module.cognito.issuer_url
  cognito_client_id  = module.cognito.client_id
  services           = local.http_lambda_services

  vpc_subnet_ids = var.lambda_attach_to_vpc ? module.vpc.private_subnet_ids : []
  vpc_security_group_ids = var.lambda_attach_to_vpc ? (
    length(var.lambda_vpc_security_group_ids) > 0 ? var.lambda_vpc_security_group_ids : [aws_security_group.lambda_vpc[0].id]
  ) : []
}

# IAM for Lambdas to read the shared secret (kept in root module so Terraform LS resolves module.http_api inputs).
data "aws_iam_policy_document" "lambda_microservices_secret" {
  count = length(module.app_secrets) > 0 && length(module.http_api) > 0 ? 1 : 0

  statement {
    sid    = "ReadSharedMicroservicesSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [module.app_secrets[0].microservices_secret_arn]
  }
}

resource "aws_iam_role_policy" "lambda_microservices_secret_read" {
  count  = length(module.app_secrets) > 0 && length(module.http_api) > 0 ? 1 : 0
  name   = "microservices-secret-read"
  role   = module.http_api[0].lambda_execution_role_name
  policy = data.aws_iam_policy_document.lambda_microservices_secret[0].json
}

# IAM for ai-pipeline model calls (Bedrock + SageMaker runtime endpoint).
data "aws_iam_policy_document" "lambda_ai_model_invoke" {
  count = length(module.http_api) > 0 ? 1 : 0

  statement {
    sid    = "InvokeBedrockModels"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "InvokeSageMakerEndpoints"
    effect = "Allow"
    actions = [
      "sagemaker:InvokeEndpoint",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "lambda_ai_model_invoke" {
  count  = length(module.http_api) > 0 ? 1 : 0
  name   = "ai-model-invoke"
  role   = module.http_api[0].lambda_execution_role_name
  policy = data.aws_iam_policy_document.lambda_ai_model_invoke[0].json
}

module "cloudwatch_http_api" {
  source = "../../modules/cloudwatch-http-api"
  count  = var.enable_cloudwatch_alarms && length(module.http_api) > 0 ? 1 : 0

  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  api_id                   = module.http_api[0].api_id
  lambda_function_names    = module.http_api[0].lambda_function_names
  alarm_notification_email = var.cloudwatch_alarm_email
  enable_dashboard         = var.enable_cloudwatch_dashboard

  enable_rds_cpu_alarm       = var.enable_rds_cloudwatch_alarms && length(module.rds_postgres) > 0
  rds_db_instance_identifier = length(module.rds_postgres) > 0 ? module.rds_postgres[0].db_instance_identifier : null
}

# ── RDS: recrear desde cero (p. ej. fallo al pasar a público) ─────────────────
# 1) Snapshot manual en la consola RDS.
# 2) terraform destroy -target='module.rds_postgres[0].aws_db_instance.this'
# 3) terraform destroy -target='module.rds_postgres[0].aws_db_subnet_group.this'
# 4) RDS → Subnet groups: borrar huérfanos finexa-*-rds-pg* si siguen ahí.
# 5) terraform apply
