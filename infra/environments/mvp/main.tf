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

module "aurora_postgres" {
  source = "../../modules/aurora-postgresql-serverless"
  count  = var.enable_aurora_postgres ? 1 : 0

  project     = var.project
  environment = var.environment
  vpc_id      = var.aurora_vpc_id
  subnet_ids  = var.aurora_subnet_ids

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
