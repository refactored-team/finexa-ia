output "db_instance_identifier" {
  description = "RDS instance identifier (CloudWatch DBInstanceIdentifier)."
  value       = aws_db_instance.this.identifier
}

output "address" {
  description = "Hostname of the writer endpoint (use in database_url)."
  value       = aws_db_instance.this.address
}

output "port" {
  description = "PostgreSQL port."
  value       = aws_db_instance.this.port
}

output "database_name" {
  description = "Initial database name."
  value       = aws_db_instance.this.db_name
}

output "master_username" {
  description = "Master username."
  value       = aws_db_instance.this.username
  sensitive   = true
}

output "master_user_secret_arn" {
  description = "Secrets Manager ARN for the master user when manage_master_user_password is true."
  value       = try(aws_db_instance.this.master_user_secret[0].secret_arn, null)
  sensitive   = true
}

output "db_subnet_group_name" {
  description = "DB subnet group name."
  value       = aws_db_subnet_group.this.name
}

output "security_group_id" {
  description = "Security group attached to the instance."
  value       = aws_security_group.this.id
}
