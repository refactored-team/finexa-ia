output "terraform_state_bucket_id" {
  description = "S3 bucket ID used for Terraform remote state"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_bucket_arn" {
  description = "S3 bucket ARN for Terraform remote state"
  value       = aws_s3_bucket.terraform_state.arn
}

output "terraform_locks_table_name" {
  description = "DynamoDB table name for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "terraform_locks_table_arn" {
  description = "DynamoDB table ARN for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.arn
}

output "aws_account_id" {
  description = "AWS account ID where bootstrap resources were created"
  value       = data.aws_caller_identity.current.account_id
}
