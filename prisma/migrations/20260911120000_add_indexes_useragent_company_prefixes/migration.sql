-- AlterTable: Add userAgent to AuditEvent, add prefix/footer columns to CompanySettings
ALTER TABLE "audit_events" ADD COLUMN "user_agent" TEXT;

ALTER TABLE "company_settings" ADD COLUMN "proforma_prefix" TEXT NOT NULL DEFAULT 'PF-';
ALTER TABLE "company_settings" ADD COLUMN "definitive_prefix" TEXT NOT NULL DEFAULT 'FAC-';
ALTER TABLE "company_settings" ADD COLUMN "bl_prefix" TEXT NOT NULL DEFAULT 'BL-';
ALTER TABLE "company_settings" ADD COLUMN "document_footer" TEXT;

-- CreateIndex: Composite indexes for common query patterns
CREATE INDEX "documents_company_id_status_created_at_idx" ON "documents"("company_id", "status", "created_at" DESC);

CREATE INDEX "delivery_notes_status_created_at_idx" ON "delivery_notes"("status", "created_at" DESC);

CREATE INDEX "audit_events_entity_type_entity_id_created_at_idx" ON "audit_events"("entity_type", "entity_id", "created_at" DESC);

CREATE INDEX "audit_events_user_id_created_at_idx" ON "audit_events"("user_id", "created_at" DESC);

CREATE INDEX "users_role_idx" ON "users"("role");

CREATE INDEX "users_status_idx" ON "users"("status");
