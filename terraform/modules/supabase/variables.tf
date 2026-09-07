variable "project_ref" {
  type = string
}

variable "database_password" {
  type      = string
  sensitive = true
}
