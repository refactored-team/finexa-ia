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

# VPC — shared by RDS, ECS/Fargate, Lambda in VPC, etc.

variable "vpc_cidr" {
  description = "CIDR for the VPC (subnets are derived from this block)."
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_az_count" {
  description = "Number of AZs (≥2 for RDS subnet groups). Public and private subnets are created per AZ."
  type        = number
  default     = 2
}

variable "vpc_enable_nat_gateway" {
  description = "NAT Gateway for private subnet egress (needed for ECS/Lambda outbound to the internet)."
  type        = bool
  default     = true
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

variable "enable_rds_postgres" {
  description = "RDS PostgreSQL single instance in the VPC (Free Tier friendly: db.t4g.micro). Uses postgres_allowed_* for SG/CIDR ingress on :5432."
  type        = bool
  default     = true
}

variable "postgres_allowed_security_group_ids" {
  description = "Security groups allowed to reach PostgreSQL:5432 on RDS (e.g. Lambda VPC SG, ECS service SG)."
  type        = list(string)
  default     = []
}

variable "postgres_allowed_cidr_blocks" {
  description = "Optional CIDRs allowed on RDS :5432 (e.g. office/VPN); prefer SGs in production."
  type        = list(string)
  default     = []
}

# RDS PostgreSQL — module.vpc private subnets.

variable "rds_instance_class" {
  description = "RDS instance class (db.t4g.micro or db.t3.micro for Free Tier)."
  type        = string
  default     = "db.t4g.micro"
}

variable "rds_engine_version" {
  description = "RDS PostgreSQL engine_version (major.minor; region-specific)."
  type        = string
  default     = "16.4"
}

variable "rds_allocated_storage" {
  description = "Allocated storage in GiB (gp3)."
  type        = number
  default     = 20
}

variable "rds_database_name" {
  description = "Initial database name (RDS PostgreSQL allows only letters, digits, underscore)."
  type        = string
  default     = "finexa_ia_db"
}

variable "rds_master_username" {
  description = "Master user (password stored in Secrets Manager)."
  type        = string
  default     = "finexa"
}

variable "rds_backup_retention_period" {
  description = "Automated backup retention in days (Free Tier often caps at 1)."
  type        = number
  default     = 1
}

variable "rds_skip_final_snapshot" {
  description = "Skip final snapshot on destroy (MVP/dev)."
  type        = bool
  default     = true
}

variable "rds_deletion_protection" {
  description = "Protect instance from accidental deletion."
  type        = bool
  default     = false
}

# CloudWatch — API Gateway + Lambda (+ optional RDS CPU); SNS email alerts.

variable "enable_cloudwatch_alarms" {
  description = "Create CloudWatch alarms and SNS topic when HTTP API exists."
  type        = bool
  default     = true
}

variable "cloudwatch_alarm_email" {
  description = "Email for SNS subscription (confirm in AWS after apply). Empty = topic without email."
  type        = string
  default     = "esalinasga@gmail.com"
  sensitive   = true
}

variable "enable_cloudwatch_dashboard" {
  description = "Create CloudWatch dashboard for HTTP API and Lambda metrics."
  type        = bool
  default     = true
}

variable "enable_rds_cloudwatch_alarms" {
  description = "Add RDS CPU alarm when RDS PostgreSQL instance exists (requires enable_rds_postgres)."
  type        = bool
  default     = false
}

# Secrets Manager — shared JSON for all Lambdas/microservices.

variable "enable_app_secrets" {
  description = "Create Secrets Manager secret shared by all microservice Lambdas."
  type        = bool
  default     = true
}

variable "app_secrets_microservices_initial_json" {
  description = "Initial JSON string for the microservices secret; after apply edit in AWS Console (Terraform ignores value changes)."
  type        = string
  default     = "{}"
}
