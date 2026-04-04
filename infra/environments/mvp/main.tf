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
