variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "cognito_issuer_url" {
  description = "OIDC issuer URL (same as Cognito, e.g. https://cognito-idp.region.amazonaws.com/poolId)."
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito app client ID used as JWT audience."
  type        = string
}

variable "services" {
  description = "One Lambda + routes per key; keys must match ECR repos."
  type = map(object({
    repository_url        = string
    image_tag             = string
    route_path_prefix     = string
    memory_size           = optional(number, 512)
    timeout               = optional(number, 60)
    environment_variables = optional(map(string), {})
  }))
}

variable "vpc_subnet_ids" {
  description = "Private subnets for Lambda (required to reach RDS/Postgres in VPC)."
  type        = list(string)
  default     = []
}

variable "vpc_security_group_ids" {
  description = "Security groups for Lambda ENIs."
  type        = list(string)
  default     = []
}
