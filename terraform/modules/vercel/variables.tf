variable "team_id" {
  type = string
}

variable "project_name" {
  type    = string
  default = "ksy-global-service"
}

variable "github_repo" {
  type    = string
  default = "GrimRaven23/ksy-global-service"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "session_secret" {
  type      = string
  sensitive = true
}

variable "node_env" {
  type    = string
  default = "production"
}

variable "domain_name" {
  type    = string
  default = ""
}
