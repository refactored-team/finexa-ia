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
