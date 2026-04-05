output "repository_name" {
  description = "ECR repository name."
  value       = aws_ecr_repository.this.name
}

output "repository_arn" {
  description = "Full ARN of the ECR repository."
  value       = aws_ecr_repository.this.arn
}

output "repository_url" {
  description = "Registry URL to use in docker push/pull (account.dkr.region.amazonaws.com/repo)."
  value       = aws_ecr_repository.this.repository_url
}

output "registry_id" {
  description = "AWS account ID of the registry hosting this repository."
  value       = aws_ecr_repository.this.registry_id
}
