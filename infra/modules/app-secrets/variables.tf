variable "project" {
  type        = string
  description = "Resource name prefix."
}

variable "environment" {
  type        = string
  description = "Environment (e.g. mvp)."
}

variable "microservices_initial_json" {
  type        = string
  description = "Initial JSON for the shared microservices secret; edit in AWS Console after apply (Terraform ignores further string changes)."
  default     = "{}"
}
