output "user_pool_id" {
  description = "Cognito user pool ID."
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  description = "Cognito user pool ARN."
  value       = aws_cognito_user_pool.this.arn
}

output "issuer_url" {
  description = "OIDC issuer URL for this user pool."
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}

output "domain" {
  description = "Hosted UI domain prefix."
  value       = aws_cognito_user_pool_domain.this.domain
}

output "client_id" {
  description = "App client ID (public client)."
  value       = aws_cognito_user_pool_client.this.id
}

output "hosted_ui_base_url" {
  description = "Base URL for the Cognito hosted domain (OAuth redirects)."
  value       = "https://${aws_cognito_user_pool_domain.this.domain}.auth.${var.aws_region}.amazoncognito.com"
}
