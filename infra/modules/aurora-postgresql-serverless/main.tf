locals {
  name = "${var.project}-${var.environment}-aurora"
}

check "postgres_ingress" {
  assert {
    condition     = length(var.allowed_security_group_ids) > 0 || length(var.allowed_cidr_blocks) > 0
    error_message = "Set at least one of allowed_security_group_ids or allowed_cidr_blocks so PostgreSQL is reachable."
  }
}

resource "aws_db_subnet_group" "this" {
  name       = local.name
  subnet_ids = var.subnet_ids

  tags = {
    Name = local.name
  }

  lifecycle {
    precondition {
      condition     = length(var.subnet_ids) >= 2
      error_message = "Aurora needs at least two subnets (two AZs)."
    }
  }
}

resource "aws_security_group" "this" {
  name_prefix = "${local.name}-"
  vpc_id      = var.vpc_id
  description = "PostgreSQL Aurora Serverless v2 (${local.name})"

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

resource "aws_rds_cluster" "this" {
  cluster_identifier = local.name
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = var.engine_version

  database_name   = var.database_name
  master_username = var.master_username

  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]

  serverlessv2_scaling_configuration {
    min_capacity = var.serverless_min_capacity
    max_capacity = var.serverless_max_capacity
  }

  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${local.name}-final"

  storage_encrypted       = true
  backup_retention_period = var.backup_retention_period

  preferred_backup_window      = "07:00-09:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  deletion_protection = var.deletion_protection

  copy_tags_to_snapshot = true

  tags = {
    Name = local.name
  }
}

resource "aws_rds_cluster_instance" "writer" {
  identifier         = "${local.name}-writer"
  cluster_identifier = aws_rds_cluster.this.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.this.engine
  engine_version     = aws_rds_cluster.this.engine_version
}
