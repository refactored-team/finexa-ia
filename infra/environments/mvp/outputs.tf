output "vpc_id" {
  description = "Shared VPC ID (use for ECS, Lambda, RDS, etc.)."
  value       = module.vpc.vpc_id
}

output "vpc_private_subnet_ids" {
  description = "Private subnets for workloads and databases."
  value       = module.vpc.private_subnet_ids
}

output "vpc_public_subnet_ids" {
  description = "Public subnets (ALB, NAT)."
  value       = module.vpc.public_subnet_ids
}

output "vpc_nat_gateway_id" {
  description = "NAT Gateway ID if vpc_enable_nat_gateway is true."
  value       = module.vpc.nat_gateway_id
}

output "http_api_endpoint" {
  description = "Invoke URL for API Gateway HTTP API (stage $default)."
  value       = length(module.http_api) > 0 ? module.http_api[0].api_endpoint : null
}

output "http_api_lambda_function_names" {
  description = "Lambda function names per service key."
  value       = length(module.http_api) > 0 ? module.http_api[0].lambda_function_names : null
}

output "cloudwatch_alarm_sns_topic_arn" {
  description = "SNS topic for CloudWatch alarms (null if monitoring disabled or no HTTP API)."
  value       = length(module.cloudwatch_http_api) > 0 ? module.cloudwatch_http_api[0].sns_topic_arn : null
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name (null if disabled or no HTTP API)."
  value       = length(module.cloudwatch_http_api) > 0 ? module.cloudwatch_http_api[0].dashboard_name : null
}

output "microservices_secret_arn" {
  description = "Shared Secrets Manager ARN for all microservice Lambdas (JSON). Null if enable_app_secrets is false."
  value       = length(module.app_secrets) > 0 ? module.app_secrets[0].microservices_secret_arn : null
}

output "ecr_repository_urls" {
  description = "Docker registry URLs per service (docker push/pull)."
  value       = { for k, m in module.ecr : k => m.repository_url }
}

output "ecr_repository_arns" {
  description = "ECR repository ARNs per service."
  value       = { for k, m in module.ecr : k => m.repository_arn }
}

output "ecr_repository_names" {
  description = "ECR repository names per service."
  value       = { for k, m in module.ecr : k => m.repository_name }
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID. Map to app EXPO_PUBLIC_COGNITO_USER_POOL_ID after apply."
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito app client ID (public client). Map to app EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID."
  value       = module.cognito.client_id
}

output "cognito_issuer_url" {
  description = "OIDC issuer URL for the user pool."
  value       = module.cognito.issuer_url
}

output "cognito_hosted_ui_base_url" {
  description = "Cognito hosted domain base URL."
  value       = module.cognito.hosted_ui_base_url
}

output "rds_instance_address" {
  description = "RDS PostgreSQL hostname (null if enable_rds_postgres is false)."
  value       = length(module.rds_postgres) > 0 ? module.rds_postgres[0].address : null
}

output "rds_instance_port" {
  description = "PostgreSQL port for RDS."
  value       = length(module.rds_postgres) > 0 ? module.rds_postgres[0].port : null
}

output "rds_master_user_secret_arn" {
  description = "Secrets Manager ARN for RDS master credentials (retrieve password from here)."
  value       = length(module.rds_postgres) > 0 ? module.rds_postgres[0].master_user_secret_arn : null
  sensitive   = true
}

output "rds_security_group_id" {
  description = "Security group attached to RDS PostgreSQL."
  value       = length(module.rds_postgres) > 0 ? module.rds_postgres[0].security_group_id : null
}

output "rds_db_instance_identifier" {
  description = "RDS instance identifier (CloudWatch DBInstanceIdentifier)."
  value       = length(module.rds_postgres) > 0 ? module.rds_postgres[0].db_instance_identifier : null
}
