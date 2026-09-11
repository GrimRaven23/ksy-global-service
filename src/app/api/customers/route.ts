import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { apiServerError } from "@/lib/api-response";
import { customerSchema } from "@/lib/validation";
import { createAuditEvent } from "@/lib/services/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { canAccessCustomer } from "@/lib/authorization";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "customers.read")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      if (!await canAccessCustomer(user, id)) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      const customer = await prisma.customer.findUnique({ where: { id } });
      if (!customer) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
      return NextResponse.json(customer);
    }

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(customers);
  } catch (error) {
    return apiServerError(error, "GET /api/customers");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "customers.create")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: parsed.data.name,
        contactName: parsed.data.contactName ?? null,
        address: parsed.data.address ?? null,
        city: parsed.data.city ?? null,
        phone: parsed.data.phone ?? null,
        email: parsed.data.email ?? null,
        notes: parsed.data.notes ?? null,
      },
    });

    await createAuditEvent({
      action: "CUSTOMER_CREATED",
      entityType: "customer",
      entityId: customer.id,
      userId: user.id,
      details: { name: customer.name },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return apiServerError(error, "POST /api/customers");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "customers.update")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    if (!await canAccessCustomer(user, id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });

    const body = await request.json();
    const parsed = customerSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.contactName !== undefined) updateData.contactName = parsed.data.contactName;
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
    if (parsed.data.city !== undefined) updateData.city = parsed.data.city;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const updated = await prisma.customer.update({ where: { id }, data: updateData });

    await createAuditEvent({
      action: "CUSTOMER_UPDATED",
      entityType: "customer",
      entityId: id,
      userId: user.id,
      details: { changes: updateData },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiServerError(error, "PUT /api/customers");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!hasPermission(user.role, "customers.delete")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    if (!await canAccessCustomer(user, id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const existing = await prisma.customer.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!existing) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });

    const linkedDocs = await prisma.document.count({ where: { customerId: id } });
    const linkedBl = await prisma.deliveryNote.count({ where: { customerId: id } });
    if (linkedDocs > 0 || linkedBl > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer un client lié à des documents existants" },
        { status: 409 }
      );
    }

    await prisma.customer.delete({ where: { id } });

    await createAuditEvent({
      action: "CUSTOMER_DELETED",
      entityType: "customer",
      entityId: id,
      userId: user.id,
      details: { name: existing.name },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiServerError(error, "DELETE /api/customers");
  }
}
