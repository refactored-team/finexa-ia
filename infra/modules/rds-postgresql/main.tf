locals {
  name = "${var.project}-${var.environment}-rds-pg"
}

check "postgres_ingress" {
  assert {
    condition     = length(var.allowed_security_group_ids) > 0 || length(var.allowed_cidr_blocks) > 0
    error_message = "Set at least one of allowed_security_group_ids or allowed_cidr_blocks so PostgreSQL is reachable."
  }
}

# Cambiar subredes/público en una instancia ya creada suele fallar (ModifyDBSubnetGroup / Move).
# Para pasar de privada→pública: snapshot manual, destroy de la instancia (+ subnet groups huérfanos en consola si quedan), apply de nuevo.
resource "aws_db_subnet_group" "this" {
  name       = local.name
  subnet_ids = var.subnet_ids

  tags = {
    Name = local.name
  }

  lifecycle {
    precondition {
      condition     = length(var.subnet_ids) >= 2
      error_message = "RDS needs at least two subnets (two AZs)."
    }
  }
}

resource "aws_security_group" "this" {
  name_prefix = "${local.name}-"
  vpc_id      = var.vpc_id
  description = "PostgreSQL RDS (${local.name})"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.allowed_security_group_ids
    content {
      from_port       = 5432
      to_port         = 5432
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = var.allowed_cidr_blocks
    content {
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${local.name}-sg"
  }
}

resource "aws_db_instance" "this" {
  identifier     = local.name
  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.database_name
  username = var.master_username

  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]

  publicly_accessible = var.publicly_accessible
  multi_az            = false

  backup_retention_period   = var.backup_retention_period
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${local.name}-final"

  deletion_protection = var.deletion_protection

  performance_insights_enabled = false

  copy_tags_to_snapshot = true

  tags = {
    Name = local.name
  }
}
