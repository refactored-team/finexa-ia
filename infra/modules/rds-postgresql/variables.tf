variable "project" {
  description = "Project name prefix for resource identifiers."
  type        = string
}

variable "environment" {
  description = "Environment segment (e.g. mvp, prod)."
  type        = string
}

variable "vpc_id" {
  description = "VPC where the RDS instance and security group are created."
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for the DB subnet group (at least two AZs)."
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security groups allowed to connect to PostgreSQL on port 5432."
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed on 5432 (e.g. whole VPC for MVP)."
  type        = list(string)
  default     = []
}

variable "database_name" {
  description = "Initial database name."
  type        = string
}

variable "master_username" {
  description = "Master username (password managed in Secrets Manager)."
  type        = string
}

variable "engine_version" {
  description = "RDS PostgreSQL engine version (major.minor, region-specific)."
  type        = string
}

variable "instance_class" {
  description = "Instance class (e.g. db.t4g.micro for Free Tier)."
  type        = string
}

variable "allocated_storage" {
  description = "Allocated storage in GiB (gp3)."
  type        = number
}

variable "backup_retention_period" {
  description = "Automated backup retention in days."
  type        = number
}

variable "skip_final_snapshot" {
  description = "If true, no final snapshot on destroy (typical for dev/MVP)."
  type        = bool
}

variable "deletion_protection" {
  description = "Enable deletion protection on the instance."
  type        = bool
}
