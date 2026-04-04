output "api_id" {
  description = "HTTP API id."
  value       = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  description = "Base URL for clients (stage $default)."
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "lambda_function_names" {
  description = "Lambda function name per service key."
  value       = { for k, f in aws_lambda_function.service : k => f.function_name }
}

output "lambda_function_arns" {
  description = "Lambda ARNs per service key."
  value       = { for k, f in aws_lambda_function.service : k => f.arn }
}
