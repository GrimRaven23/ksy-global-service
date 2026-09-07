resource "vercel_project" "ksy" {
  name      = var.project_name
  framework = "nextjs"

  git_repository {
    type = "github"
    repo = var.github_repo
  }

  build_command    = "npx prisma generate && npx next build"
  install_command  = "npm install"
  output_directory = ".next"

  root_directory = ""

  environment = [
    {
      key    = "DATABASE_URL"
      value  = var.database_url
      target = ["production", "preview"]
    },
    {
      key    = "SESSION_SECRET"
      value  = var.session_secret
      target = ["production", "preview"]
    },
    {
      key    = "NODE_ENV"
      value  = var.node_env
      target = ["production", "preview"]
    },
  ]

  serverless_function_zero_config_fail_build = true
}

resource "vercel_project_deployment_retention" "ksy" {
  project_id           = vercel_project.ksy.id
  retention_days       = 30
  should_delete_branch = true
}

resource "vercel_project_domain" "ksy" {
  count    = var.domain_name != "" ? 1 : 0
  project_id = vercel_project.ksy.id
  domain     = var.domain_name
}
