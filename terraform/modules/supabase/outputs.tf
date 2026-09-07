output "project_ref" {
  description = "Supabase project reference"
  value       = var.project_ref
}

output "pooler_host" {
  description = "Supabase pooler host"
  value       = "aws-0-eu-central-1.pooler.supabase.com"
}

output "direct_host" {
  description = "Supabase direct connection host"
  value       = "db.${var.project_ref}.supabase.co"
}
