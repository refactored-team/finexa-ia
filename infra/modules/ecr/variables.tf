variable "project" {
  description = "Project name prefix for resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)."
  type        = string
}

variable "service_name" {
  description = "Logical service or image name segment (e.g. backend, api)."
  type        = string
}

variable "image_retention_count" {
  description = "Maximum number of images to keep in the repository; older images are expired by the lifecycle policy."
  type        = number
  default     = 10
}
