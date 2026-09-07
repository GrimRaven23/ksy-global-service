terraform {
  required_version = ">= 1.5.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }

  cloud {
    organization = "ksy-global"

    workspaces {
      name = "ksy-global-service"
    }
  }
}

variable "vercel_api_token" {
  type        = string
  sensitive   = true
  description = "Vercel API token"
}

variable "vercel_team_id" {
  type        = string
  description = "Vercel team ID"
}

variable "supabase_access_token" {
  type        = string
  sensitive   = true
  description = "Supabase personal access token"
}

variable "supabase_project_ref" {
  type        = string
  description = "Supabase project reference ID"
}

variable "database_password" {
  type        = string
  sensitive   = true
  description = "PostgreSQL database password"
}

variable "session_secret" {
  type        = string
  sensitive   = true
  description = "Session HMAC signing secret"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment"
}

variable "domain_name" {
  type        = string
  default     = ""
  description = "Custom domain name (optional)"
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

provider "supabase" {
  access_token = var.supabase_access_token
}

module "vercel" {
  source = "./modules/vercel"

  team_id       = var.vercel_team_id
  environment   = var.environment
  database_url  = "postgresql://postgres.${var.supabase_project_ref}:${var.database_password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=30"
  session_secret = var.session_secret
  domain_name   = var.domain_name
}

module "supabase" {
  source = "./modules/supabase"

  project_ref      = var.supabase_project_ref
  database_password = var.database_password
}
