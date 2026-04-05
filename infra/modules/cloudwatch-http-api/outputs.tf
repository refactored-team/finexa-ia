output "sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications (add subscriptions for Slack, etc.)."
  value       = aws_sns_topic.alarms.arn
}

output "sns_topic_name" {
  description = "SNS topic name."
  value       = aws_sns_topic.alarms.name
}

output "dashboard_name" {
  description = "CloudWatch dashboard name (if enable_dashboard is true)."
  value       = var.enable_dashboard ? aws_cloudwatch_dashboard.http_api[0].dashboard_name : null
}
