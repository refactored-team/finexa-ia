variable "project" {
  description = "Name prefix for resource identifiers."
  type        = string
}

variable "environment" {
  description = "Environment segment (e.g. mvp, prod)."
  type        = string
}

variable "vpc_id" {
  description = "VPC where the Aurora cluster and security group are created."
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for the DB subnet group (at least two AZs)."
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security groups allowed to connect to PostgreSQL on port 5432 (e.g. ECS tasks, Lambda)."
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect on 5432 (e.g. VPN or bastion); prefer SGs in production."
  type        = list(string)
  default     = []
}

variable "database_name" {
  description = "Initial database name."
  type        = string
  default     = "app"
}

variable "master_username" {
  description = "Master DB username (password is managed in Secrets Manager)."
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version (must support Serverless v2)."
  type        = string
  default     = "15.8"
}

variable "serverless_min_capacity" {
  description = "Minimum Aurora Capacity Units (ACU) for Serverless v2 (minimum 0.5)."
  type        = number
  default     = 0.5
}

variable "serverless_max_capacity" {
  description = "Maximum ACU for Serverless v2."
  type        = number
  default     = 16
}

variable "backup_retention_period" {
  description = "Backup retention in days."
  type        = number
  default     = 7
}

variable "skip_final_snapshot" {
  description = "If true, no final snapshot on destroy (typical for dev/MVP)."
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection on the cluster."
  type        = bool
  default     = false
}
