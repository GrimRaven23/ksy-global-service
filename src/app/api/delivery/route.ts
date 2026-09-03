import { NextRequest, NextResponse } from "next/server";
import {
  createDeliveryNote,
  listDeliveryNotes,
  getDeliveryNote,
  updateDeliveryNote,
  deleteDeliveryNote,
} from "@/lib/services/delivery";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const note = await getDeliveryNote(id);
      if (!note) return NextResponse.json({ error: "Bon non trouvé" }, { status: 404 });
      return NextResponse.json(note);
    }

    const notes = await listDeliveryNotes();
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const note = await createDeliveryNote(body);
    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ce numéro existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const body = await req.json();
    const note = await updateDeliveryNote(id, body);
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    await deleteDeliveryNote(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
