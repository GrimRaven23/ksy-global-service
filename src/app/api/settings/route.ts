import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";
import { companySettingsSchema } from "@/lib/validation";
import { getCompany, updateCompany } from "@/lib/services/company";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { createAuditEvent } from "@/lib/services/audit";

const SENSITIVE_FIELDS = ["bank", "bkName", "iban", "swift", "compte", "rccm", "ninea", "ifu"];

function stripSensitive(data: Record<string, unknown>) {
  const stripped = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (field in stripped) {
      stripped[field] = "********";
    }
  }
  return stripped;
}

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    if (!hasPermission(user.role, "company.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const company = await getCompany();
    const hasSensitive = hasPermission(user.role, "company.read_sensitive");
    return NextResponse.json(hasSensitive ? company : stripSensitive(company as Record<string, unknown>));
  } catch (error) {
    return apiServerError(error, "GET /api/settings");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(user.role, "company.update")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = companySettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await updateCompany(parsed.data);

    await createAuditEvent({
      action: "COMPANY_SETTINGS_UPDATED",
      entityType: "company",
      userId: user.id,
      details: { fields: Object.keys(parsed.data) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiServerError(error, "PUT /api/settings");
  }
}
