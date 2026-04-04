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

module "aurora_postgres" {
  source = "../../modules/aurora-postgresql-serverless"
  count  = var.enable_aurora_postgres ? 1 : 0

  project     = var.project
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids

  allowed_security_group_ids = var.aurora_allowed_security_group_ids
  allowed_cidr_blocks        = var.aurora_allowed_cidr_blocks

  database_name           = var.aurora_database_name
  master_username         = var.aurora_master_username
  engine_version          = var.aurora_engine_version
  serverless_min_capacity = var.aurora_serverless_min_capacity
  serverless_max_capacity = var.aurora_serverless_max_capacity
  backup_retention_period = var.aurora_backup_retention_period
  skip_final_snapshot     = var.aurora_skip_final_snapshot
  deletion_protection     = var.aurora_deletion_protection
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

  vpc_subnet_ids         = var.lambda_attach_to_vpc ? module.vpc.private_subnet_ids : []
  vpc_security_group_ids = var.lambda_attach_to_vpc ? var.lambda_vpc_security_group_ids : []
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

  enable_aurora_alarms      = var.enable_aurora_cloudwatch_alarms && length(module.aurora_postgres) > 0
  aurora_cluster_identifier = length(module.aurora_postgres) > 0 ? module.aurora_postgres[0].cluster_identifier : null
}
