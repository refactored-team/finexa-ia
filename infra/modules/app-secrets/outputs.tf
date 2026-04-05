output "microservices_secret_arn" {
  description = "ARN of the shared microservices secret (JSON)."
  value       = aws_secretsmanager_secret.microservices.arn
}

output "microservices_secret_name" {
  description = "Secrets Manager name for the microservices secret."
  value       = aws_secretsmanager_secret.microservices.name
}
