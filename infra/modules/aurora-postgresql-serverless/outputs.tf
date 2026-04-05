output "cluster_identifier" {
  description = "Aurora cluster identifier."
  value       = aws_rds_cluster.this.cluster_identifier
}

output "cluster_arn" {
  description = "Aurora cluster ARN."
  value       = aws_rds_cluster.this.arn
}

output "cluster_endpoint" {
  description = "Writer endpoint hostname (use for writes and single-node apps)."
  value       = aws_rds_cluster.this.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint (use for read scaling when readers exist)."
  value       = aws_rds_cluster.this.reader_endpoint
}

output "cluster_port" {
  description = "PostgreSQL port."
  value       = aws_rds_cluster.this.port
}

output "database_name" {
  description = "Initial database name."
  value       = aws_rds_cluster.this.database_name
}

output "master_username" {
  description = "Master username."
  value       = aws_rds_cluster.this.master_username
  sensitive   = true
}

output "master_user_secret_arn" {
  description = "Secrets Manager ARN for the master user (when manage_master_user_password is used)."
  value       = try(aws_rds_cluster.this.master_user_secret[0].secret_arn, null)
}

output "db_subnet_group_name" {
  description = "DB subnet group name."
  value       = aws_db_subnet_group.this.name
}

output "security_group_id" {
  description = "Security group attached to the cluster."
  value       = aws_security_group.this.id
}
