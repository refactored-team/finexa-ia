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
  description = "Cognito user pool ID."
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito app client ID."
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
