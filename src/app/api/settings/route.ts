import { NextRequest, NextResponse } from "next/server";
import { getCompany, updateCompany } from "@/lib/services/company";
import { createAuditEvent } from "@/lib/services/audit";

export async function GET() {
  try {
    const company = await getCompany();
    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const company = await updateCompany(body);

    await createAuditEvent({
      action: "COMPANY_SETTINGS_UPDATED",
      entityType: "COMPANY_SETTINGS",
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
