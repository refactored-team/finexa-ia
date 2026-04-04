variable "enable_http_api" {
  description = "Create API Gateway HTTP API and Lambda functions per lambda_http_services."
  type        = bool
  default     = true
}

variable "lambda_http_services" {
  description = "Per-microservice route prefix and sizing; keys must match ecr_services. Push images to ECR before apply."
  type = map(object({
    route_path_prefix     = string
    image_tag             = optional(string)
    memory_size           = optional(number)
    timeout               = optional(number)
    environment_variables = optional(map(string))
  }))
  default = {
    "ms-plaid" = {
      route_path_prefix = "/ms-plaid"
    }
  }
}

variable "lambda_attach_to_vpc" {
  description = "Place Lambdas in VPC private subnets (needed to reach Aurora). If true and lambda_vpc_security_group_ids is empty, a dedicated SG is created."
  type        = bool
  default     = true
}

variable "lambda_vpc_security_group_ids" {
  description = "Security groups for Lambda when lambda_attach_to_vpc is true (e.g. SG allowed on Aurora 5432)."
  type        = list(string)
  default     = []
}

locals {
  # When Aurora is enabled and no explicit ingress is set, allow the whole VPC CIDR to reach Postgres:5432 (MVP).
  aurora_ingress_cidr_blocks = (
    length(var.aurora_allowed_security_group_ids) > 0 || length(var.aurora_allowed_cidr_blocks) > 0
    ? var.aurora_allowed_cidr_blocks
    : [var.vpc_cidr]
  )

  # HTTP API + Lambda: merge ECR URLs with per-service route/memory; keys must exist in ecr_services.
  http_lambda_services = {
    for k, v in var.lambda_http_services : k => {
      repository_url    = module.ecr[k].repository_url
      image_tag         = coalesce(try(v.image_tag, null), "latest")
      route_path_prefix = v.route_path_prefix
      memory_size       = coalesce(try(v.memory_size, null), 512)
      timeout           = coalesce(try(v.timeout, null), 30)
      environment_variables = merge(
        coalesce(try(v.environment_variables, null), {}),
        length(module.app_secrets) > 0 ? {
          MICROSERVICES_SECRET_ARN = module.app_secrets[0].microservices_secret_arn
          AWS_SECRET_ID            = module.app_secrets[0].microservices_secret_arn
        } : {},
      )
    } if contains(var.ecr_services, k)
  }
}

check "lambda_ecr_keys" {
  assert {
    condition     = alltrue([for k in keys(var.lambda_http_services) : contains(var.ecr_services, k)])
    error_message = "Every key in lambda_http_services must be listed in ecr_services."
  }
}

