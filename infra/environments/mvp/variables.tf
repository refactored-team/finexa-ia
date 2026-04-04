variable "project" {
  description = "Project name — must match bootstrap (S3 bucket / lock table prefix)."
  type        = string
  default     = "finexa-infra"
}

variable "environment" {
  description = "Deployment phase in resource names and tags (e.g. mvp, staging, prod)."
  type        = string
  default     = "mvp"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "ecr_services" {
  description = "Service keys become ECR repo name suffix: {project}-{environment}-{service}."
  type        = set(string)
  default     = ["ms-plaid"]
}

variable "ecr_image_retention_count" {
  description = "Images to keep per ECR repository (lifecycle policy)."
  type        = number
  default     = 5
}

variable "cognito_user_pool_name" {
  description = "Cognito user pool name."
  type        = string
  default     = "finexa-ia-user-pool"
}

variable "cognito_client_name" {
  description = "Cognito app client name."
  type        = string
  default     = "Finexa-ia-app"
}

variable "cognito_domain_prefix" {
  description = "Globally unique hosted domain prefix (must be unique per region/account)."
  type        = string
  default     = "us-east-1pv1vprdgp"
}

variable "cognito_reply_to_email" {
  description = "Reply-to address for Cognito emails."
  type        = string
  default     = "esalinasga@gmail.com"
}

variable "cognito_callback_urls" {
  description = "OAuth callback URLs for the app client."
  type        = list(string)
  default     = ["https://d84l1y8p4kdic.cloudfront.net"]
}

variable "cognito_logout_urls" {
  description = "OAuth sign-out URLs (optional)."
  type        = list(string)
  default     = []
}

variable "cognito_sns_caller_arn" {
  description = "IAM role ARN for Cognito SMS (SNS)."
  type        = string
  default     = "arn:aws:iam::277361136835:role/service-role/CognitoIdpSNSServiceRole"
}

variable "cognito_sns_external_id" {
  description = "External ID for the Cognito SMS role trust policy."
  type        = string
  default     = "5fb1777f-89c6-4bac-b831-eab731b35b25"
}

# Aurora PostgreSQL Serverless v2 — set enable_aurora_postgres = true and provide VPC + private subnets.

variable "enable_aurora_postgres" {
  description = "Create Aurora PostgreSQL Serverless v2 cluster (requires VPC and subnets)."
  type        = bool
  default     = false
}

variable "aurora_vpc_id" {
  description = "VPC ID for Aurora (private subnets only recommended)."
  type        = string
  default     = ""
}

variable "aurora_subnet_ids" {
  description = "Private subnet IDs for the DB subnet group (≥2 AZs)."
  type        = list(string)
  default     = []
}

variable "aurora_allowed_security_group_ids" {
  description = "Security groups allowed to reach PostgreSQL:5432 (e.g. ECS service SG)."
  type        = list(string)
  default     = []
}

variable "aurora_allowed_cidr_blocks" {
  description = "Optional CIDRs allowed on 5432 (e.g. office/VPN); prefer SGs in production."
  type        = list(string)
  default     = []
}

variable "aurora_database_name" {
  description = "Initial database name."
  type        = string
  default     = "app"
}

variable "aurora_master_username" {
  description = "Master user (password stored in Secrets Manager)."
  type        = string
  default     = "postgres"
}

variable "aurora_engine_version" {
  description = "Aurora PostgreSQL engine version."
  type        = string
  default     = "15.8"
}

variable "aurora_serverless_min_capacity" {
  description = "Serverless v2 min ACU (minimum 0.5)."
  type        = number
  default     = 0.5
}

variable "aurora_serverless_max_capacity" {
  description = "Serverless v2 max ACU."
  type        = number
  default     = 16
}

variable "aurora_backup_retention_period" {
  description = "Backup retention days."
  type        = number
  default     = 7
}

variable "aurora_skip_final_snapshot" {
  description = "Skip final snapshot on destroy (MVP/dev)."
  type        = bool
  default     = true
}

variable "aurora_deletion_protection" {
  description = "Protect cluster from accidental deletion."
  type        = bool
  default     = false
}
