variable "project" {
  type        = string
  description = "Name prefix for resources."
}

variable "environment" {
  type        = string
  description = "Environment name (e.g. mvp)."
}

variable "aws_region" {
  type        = string
  description = "AWS region (dashboard widgets)."
}

variable "api_id" {
  type        = string
  description = "API Gateway HTTP API id (ApiId dimension)."
}

variable "api_stage" {
  type        = string
  description = "API Gateway stage name (Stage dimension)."
  default     = "$default"
}

variable "lambda_function_names" {
  type        = map(string)
  description = "Service key to Lambda function name (FunctionName dimension)."
}

variable "alarm_notification_email" {
  type        = string
  description = "Optional email for SNS subscription (must confirm in AWS console)."
  default     = ""
}

variable "alarm_period_seconds" {
  type        = number
  description = "Standard resolution period (300 = 5 min; lower = more evaluations/cost)."
  default     = 300
}

variable "evaluation_periods" {
  type        = number
  description = "Consecutive periods that must breach before ALARM."
  default     = 2
}

variable "datapoints_to_alarm" {
  type        = number
  description = "Breaching datapoints within evaluation window."
  default     = 2
}

variable "api_gateway_5xx_threshold" {
  type        = number
  description = "Sum of 5xx per period above this triggers alarm."
  default     = 0
}

variable "enable_rds_cpu_alarm" {
  type        = bool
  description = "Create RDS instance CPU alarm (requires rds_db_instance_identifier)."
  default     = false
}

variable "rds_db_instance_identifier" {
  type        = string
  description = "RDS DBInstanceIdentifier for CloudWatch metrics."
  default     = null
  nullable    = true
}

variable "rds_cpu_threshold_percent" {
  type        = number
  description = "Average CPUUtilization above this (0-100) triggers RDS alarm."
  default     = 85
}

variable "enable_dashboard" {
  type        = bool
  description = "Create a CloudWatch dashboard for API Gateway + Lambdas."
  default     = true
}
