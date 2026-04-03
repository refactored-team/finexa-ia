module "ecr" {
  source   = "../../modules/ecr"
  for_each = var.ecr_services

  project               = var.project
  environment           = var.environment
  service_name          = each.key
  image_retention_count = var.ecr_image_retention_count
}
