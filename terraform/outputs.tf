output "vercel_project_id" {
  description = "Vercel project ID"
  value       = module.vercel.project_id
}

output "vercel_project_url" {
  description = "Vercel project URL"
  value       = module.vercel.project_url
}

output "supabase_project_id" {
  description = "Supabase project ID"
  value       = var.supabase_project_ref
}

output "database_url" {
  description = "Database connection URL (pooler)"
  value       = "postgresql://postgres.${var.supabase_project_ref}:${var.database_password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=30"
  sensitive   = true
}
