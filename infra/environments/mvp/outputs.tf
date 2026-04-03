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
