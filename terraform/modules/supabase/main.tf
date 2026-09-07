resource "supabase_settings" "ksy" {
  project_ref = var.project_ref

  api = {
    db_schema       = "public"
    max_rows        = 1000
    db_extra_search_path = "public"
  }

  auth = {
    site_url = "https://ksy-global-service.vercel.app"
  }

  db = {
    statement_timeout = 300
    max_connections   = 100
  }
}
