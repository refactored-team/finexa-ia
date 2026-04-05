variable "user_pool_name" {
  description = "Cognito user pool name."
  type        = string
}

variable "client_name" {
  description = "App client name within the user pool."
  type        = string
}

variable "domain_prefix" {
  description = "Globally unique prefix for the Cognito hosted domain (auth.{region}.amazoncognito.com)."
  type        = string
}

variable "reply_to_email_address" {
  description = "Reply-to address for Cognito emails (COGNITO_DEFAULT sending)."
  type        = string
}

variable "callback_urls" {
  description = "OAuth callback URLs for the app client."
  type        = list(string)
}

variable "logout_urls" {
  description = "OAuth sign-out URLs (optional)."
  type        = list(string)
  default     = []
}

variable "sns_caller_arn" {
  description = "IAM role ARN Cognito uses to publish SMS via SNS (required if phone_number is a sign-in alias)."
  type        = string
}

variable "sns_external_id" {
  description = "External ID for the SMS role trust relationship."
  type        = string
}

variable "aws_region" {
  description = "AWS region (SNS region for SMS configuration)."
  type        = string
}
