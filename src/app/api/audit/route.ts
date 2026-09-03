import { NextRequest, NextResponse } from "next/server";
import { listAuditEvents } from "@/lib/services/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const events = await listAuditEvents(limit);
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
