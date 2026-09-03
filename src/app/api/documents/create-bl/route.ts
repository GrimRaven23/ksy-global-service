import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "@/lib/services/documents";
import { createDeliveryNote } from "@/lib/services/delivery";

export async function POST(req: NextRequest) {
  try {
    const { documentId } = await req.json();
    if (!documentId) {
      return NextResponse.json({ error: "documentId requis" }, { status: 400 });
    }

    const doc = await getDocument(documentId);
    if (!doc) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    const bl = await createDeliveryNote({
      ref: doc.num,
      customerId: doc.customerId || undefined,
      documentId: doc.id,
      items: doc.items.map((item) => ({
        designation: item.designation,
        quantity: item.quantity,
        observation: "",
      })),
    });

    return NextResponse.json(bl, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
