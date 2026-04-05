terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Values come from backend.hcl (see backend.hcl.example) after bootstrap apply.
  backend "s3" {}
}
