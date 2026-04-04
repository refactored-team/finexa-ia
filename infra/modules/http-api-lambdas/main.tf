data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.project}-${var.environment}-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attached for all Lambdas so depends_on stays static; unused when Lambda has no vpc_config.
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "lambda_secrets" {
  count = var.microservices_secret_arn != null ? 1 : 0

  statement {
    sid    = "ReadSharedMicroservicesSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [var.microservices_secret_arn]
  }
}

resource "aws_iam_role_policy" "lambda_secrets" {
  count  = var.microservices_secret_arn != null ? 1 : 0
  name   = "microservices-secret-read"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_secrets[0].json
}

resource "aws_apigatewayv2_api" "this" {
  name          = "${var.project}-${var.environment}-http"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers  = ["*"]
    allow_methods  = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_origins  = ["*"]
    expose_headers = ["*"]
    max_age        = 3600
  }
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project}-${var.environment}-cognito-jwt"

  jwt_configuration {
    audience = [var.cognito_client_id]
    issuer   = var.cognito_issuer_url
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_function" "service" {
  for_each = var.services

  function_name = "${var.project}-${var.environment}-${each.key}"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${each.value.repository_url}:${each.value.image_tag}"
  architectures = ["x86_64"]
  timeout       = each.value.timeout
  memory_size   = each.value.memory_size

  environment {
    variables = merge(
      {
        HTTP_PORT        = "8080"
        HTTP_PATH_PREFIX = each.value.route_path_prefix
      },
      var.microservices_secret_arn != null ? { MICROSERVICES_SECRET_ARN = var.microservices_secret_arn } : {},
      each.value.environment_variables
    )
  }

  dynamic "vpc_config" {
    for_each = length(var.vpc_subnet_ids) > 0 ? [1] : []
    content {
      subnet_ids         = var.vpc_subnet_ids
      security_group_ids = var.vpc_security_group_ids
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
  ]
}

resource "aws_apigatewayv2_integration" "lambda" {
  for_each = var.services

  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.service[each.key].arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "health_public" {
  for_each = var.services

  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET ${trimsuffix(each.value.route_path_prefix, "/")}/health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "proxy_jwt" {
  for_each = var.services

  api_id    = aws_apigatewayv2_api.this.id
  route_key = "ANY ${trimsuffix(each.value.route_path_prefix, "/")}/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "apigw" {
  for_each = var.services

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.service[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
