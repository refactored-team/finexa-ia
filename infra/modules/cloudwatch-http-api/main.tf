locals {
  name          = "${var.project}-${var.environment}"
  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
}

resource "aws_sns_topic" "alarms" {
  name = "${local.name}-alerts"

  tags = {
    Name        = "${local.name}-alerts"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email" {
  count     = trimspace(var.alarm_notification_email) != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = trimspace(var.alarm_notification_email)
}

# HTTP API v2: namespace AWS/ApiGateway, dimensions ApiId + Stage
resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name          = "${local.name}-apigw-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.evaluation_periods
  datapoints_to_alarm = var.datapoints_to_alarm
  threshold           = var.api_gateway_5xx_threshold
  treat_missing_data  = "notBreaching"

  metric_name = "5xx"
  namespace   = "AWS/ApiGateway"
  period      = var.alarm_period_seconds
  statistic   = "Sum"

  dimensions = {
    ApiId = var.api_id
    Stage = var.api_stage
  }

  alarm_description = "HTTP API returned 5xx (integration or server errors)."
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = var.lambda_function_names

  alarm_name          = "${local.name}-lambda-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.evaluation_periods
  datapoints_to_alarm = var.datapoints_to_alarm
  threshold           = 0
  treat_missing_data  = "notBreaching"

  metric_name = "Errors"
  namespace   = "AWS/Lambda"
  period      = var.alarm_period_seconds
  statistic   = "Sum"

  dimensions = {
    FunctionName = each.value
  }

  alarm_description = "Lambda function errors (Sum > 0)."
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = var.lambda_function_names

  alarm_name          = "${local.name}-lambda-${each.key}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.evaluation_periods
  datapoints_to_alarm = var.datapoints_to_alarm
  threshold           = 0
  treat_missing_data  = "notBreaching"

  metric_name = "Throttles"
  namespace   = "AWS/Lambda"
  period      = var.alarm_period_seconds
  statistic   = "Sum"

  dimensions = {
    FunctionName = each.value
  }

  alarm_description = "Lambda throttled (concurrency or account limits)."
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  count = var.enable_rds_cpu_alarm && var.rds_db_instance_identifier != null ? 1 : 0

  alarm_name          = "${local.name}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.evaluation_periods
  datapoints_to_alarm = var.datapoints_to_alarm
  threshold           = var.rds_cpu_threshold_percent
  treat_missing_data  = "notBreaching"

  metric_name = "CPUUtilization"
  namespace   = "AWS/RDS"
  period      = var.alarm_period_seconds
  statistic   = "Average"

  dimensions = {
    DBInstanceIdentifier = var.rds_db_instance_identifier
  }

  alarm_description = "RDS instance average CPU above threshold."
  alarm_actions     = local.alarm_actions
  ok_actions        = local.ok_actions
}

resource "aws_cloudwatch_dashboard" "http_api" {
  count          = var.enable_dashboard ? 1 : 0
  dashboard_name = "${local.name}-http-api"

  dashboard_body = jsonencode({
    widgets = concat(
      [
        {
          type   = "metric"
          x      = 0
          y      = 0
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/ApiGateway", "5xx", "ApiId", var.api_id, "Stage", var.api_stage],
              [".", "4xx", ".", ".", ".", "."],
              [".", "Count", ".", ".", ".", "."],
            ]
            view    = "timeSeries"
            stacked = false
            region  = var.aws_region
            title   = "API Gateway (HTTP API)"
            period  = var.alarm_period_seconds
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 0
          width  = 12
          height = 6
          properties = {
            metrics = concat(
              [["AWS/ApiGateway", "Latency", "ApiId", var.api_id, "Stage", var.api_stage]],
              [["AWS/ApiGateway", "IntegrationLatency", "ApiId", var.api_id, "Stage", var.api_stage]],
            )
            view    = "timeSeries"
            stacked = false
            region  = var.aws_region
            title   = "API Gateway latency"
            period  = var.alarm_period_seconds
          }
        },
      ],
      [
        for idx, entry in sort(keys(var.lambda_function_names)) : {
          type   = "metric"
          x      = (idx % 2) * 12
          y      = 6 + floor(idx / 2) * 6
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/Lambda", "Errors", "FunctionName", var.lambda_function_names[entry]],
              [".", "Throttles", ".", "."],
              [".", "Duration", ".", "."],
              [".", "ConcurrentExecutions", ".", "."],
            ]
            view    = "timeSeries"
            stacked = false
            region  = var.aws_region
            title   = "Lambda ${entry}"
            period  = var.alarm_period_seconds
          }
        }
      ]
    )
  })
}
