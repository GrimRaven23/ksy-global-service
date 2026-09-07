output "project_id" {
  description = "Vercel project ID"
  value       = vercel_project.ksy.id
}

output "project_url" {
  description = "Vercel project URL"
  value       = vercel_project.ksy.vercel_authentication
}
