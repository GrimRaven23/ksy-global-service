"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Pencil, Trash2, Phone, Mail, MapPin, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, SearchInput, SkeletonTable, EmptyState, PageHeader, Button, Field, ErrorState, Avatar } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/types";
import { csrfFetch } from "@/lib/csrf";

interface Customer {
  id: string;
  name: string;
  contactName?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
}

const blankForm = { name: "", contactName: "", address: "", city: "", phone: "", email: "", notes: "" };

export default function CustomersPage() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const can = (p: Permission) => perms.includes(p);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      csrfFetch("/api/auth/me").then((r) => r.json()),
      csrfFetch("/api/customers").then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Erreur ${r.status}`)))),
    ])
      .then(([me, list]) => {
        if (!me.user) { router.push("/login"); return; }
        setPerms(ROLE_PERMISSIONS[me.user.role] || []);
        setCustomers(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => {
        setLoadError("Impossible de charger les clients. Vérifiez votre connexion puis réessayez.");
        setLoading(false);
      });
  };

  useEffect(load, [router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name || "",
      contactName: c.contactName || "",
      address: c.address || "",
      city: c.city || "",
      phone: c.phone || "",
      email: c.email || "",
      notes: c.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Le nom du client est requis."); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      contactName: form.contactName.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    };
    try {
      const res = editing
        ? await csrfFetch(`/api/customers?id=${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await csrfFetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Impossible d'enregistrer le client.");
        return;
      }
      const saved = await res.json();
      if (editing) setCustomers((prev) => prev.map((c) => (c.id === editing.id ? saved : c)));
      else setCustomers((prev) => [saved, ...prev]);
      setDialogOpen(false);
      toast.success(editing ? "Client mis à jour." : "Client créé.");
    } catch {
      toast.error("Impossible d'enregistrer le client. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    const ok = await confirm(`Supprimer le client « ${c.name} » ? Les clients liés à des documents ne peuvent pas être supprimés.`);
    if (!ok) return;
    const res = await csrfFetch(`/api/customers?id=${c.id}`, { method: "DELETE" });
    if (res.ok) {
      setCustomers((prev) => prev.filter((x) => x.id !== c.id));
      toast.success("Client supprimé.");
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Impossible de supprimer ce client.");
    }
  };

  return (
    <AppShell>
      <PageHeader title="Clients" backHref="/">
        <span className="text-[11px] font-bold bg-navy/10 text-navy dark:bg-white/10 dark:text-white px-2.5 py-1 rounded-full">{customers.length}</span>
        {can("customers.create") && (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> Nouveau client
          </Button>
        )}
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom, téléphone, email, ville..." />

        {loading ? (
          <Card><SkeletonTable rows={6} /></Card>
        ) : loadError ? (
          <ErrorState
            title="Clients indisponibles"
            step="Chargement des clients"
            cause={loadError}
            action="Vérifiez votre connexion puis réessayez."
            onRetry={load}
          />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="w-10 h-10" />}
              message={search ? "Aucun client ne correspond à cette recherche." : "Aucun client enregistré. Créez votre premier client pour accélérer la facturation."}
              action={can("customers.create") && !search ? "Créer un client" : undefined}
              onAction={can("customers.create") && !search ? openCreate : undefined}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c) => (
              <Card key={c.id} hover className="!p-4">
                <div className="flex items-start gap-3 mb-2">
                  <Avatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-navy dark:text-white truncate">{c.name}</h2>
                    {c.contactName && <p className="text-[11px] text-txt3 truncate">Contact : {c.contactName}</p>}
                  </div>
                </div>
                <div className="space-y-1 text-xs text-txt2 mb-3">
                  {c.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-txt3" aria-hidden="true" /> {c.phone}</p>}
                  {c.email && <p className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-txt3 shrink-0" aria-hidden="true" /> <span className="truncate">{c.email}</span></p>}
                  {(c.address || c.city) && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-txt3 shrink-0" aria-hidden="true" /> <span className="truncate">{[c.address, c.city].filter(Boolean).join(", ")}</span></p>}
                </div>
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-bdr/50">
                  {can("customers.update") && (
                    <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-navy dark:text-white hover:bg-navy/5 dark:hover:bg-white/10 cursor-pointer" aria-label={`Modifier ${c.name}`}>
                      <Pencil className="w-3.5 h-3.5" /> Modifier
                    </button>
                  )}
                  {can("customers.delete") && (
                    <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg text-red/60 hover:text-red hover:bg-red/5 cursor-pointer" aria-label={`Supprimer ${c.name}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={editing ? "Modifier le client" : "Nouveau client"}>
          <button aria-label="Fermer" onClick={() => setDialogOpen(false)} className="absolute inset-0 bg-navy/50 backdrop-blur-[2px] cursor-pointer" />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-surface rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-navy dark:text-white">{editing ? "Modifier le client" : "Nouveau client"}</h2>
              <button onClick={() => setDialogOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer" aria-label="Fermer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
              <div className="sm:col-span-2"><Field label="Nom / Société" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nom du client" required /></div>
              <Field label="Personne de contact" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} placeholder="Nom du contact" />
              <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+221 77 000 00 00" />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="client@example.com" />
              <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Dakar" />
              <div className="sm:col-span-2"><Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Adresse complète" /></div>
              <div className="sm:col-span-2"><Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Notes internes" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>{editing ? "Enregistrer" : "Créer"}</Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
