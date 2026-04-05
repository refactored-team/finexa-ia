# Shared JSON secret for all backend Lambdas/microservices.
# Values after first apply: edit in AWS Console (lifecycle ignore_changes on secret_string).

locals {
  name_prefix = "${var.project}/${var.environment}"
}

resource "aws_secretsmanager_secret" "microservices" {
  name                    = "${local.name_prefix}/microservices"
  description             = "Shared key-value JSON for all backend microservices (Lambdas)."
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project}-${var.environment}-microservices"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "microservices" {
  secret_id     = aws_secretsmanager_secret.microservices.id
  secret_string = var.microservices_initial_json

  lifecycle {
    ignore_changes = [secret_string]
  }
}
