variable "project" {
  description = "Name prefix for tags and resource names."
  type        = string
}

variable "environment" {
  description = "Environment segment (e.g. mvp, prod)."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC (e.g. 10.0.0.0/16)."
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones (minimum 2 for multi-AZ subnet groups e.g. RDS)."
  type        = number
  default     = 2

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 6
    error_message = "az_count must be between 2 and 6."
  }
}

variable "enable_nat_gateway" {
  description = "Create a NAT Gateway so private subnets can reach the internet (updates, APIs). Adds monthly cost."
  type        = bool
  default     = true
}
