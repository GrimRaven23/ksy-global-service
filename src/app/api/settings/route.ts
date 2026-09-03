import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { companySettingsSchema } from "@/lib/validation";
import { getCompany, updateCompany } from "@/lib/services/company";
import { createAuditEvent } from "@/lib/services/audit";

export async function GET() {
  try {
    const company = await getCompany();
    return NextResponse.json(company);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
