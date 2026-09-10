"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, Badge, Button, Avatar, SearchInput, Field, Select, SectionTitle, SkeletonTable, EmptyState, PageHeader } from "@/components/ui";
import { roleLabel, roleColor, relativeTime } from "@/lib/document-helpers";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { csrfFetch } from "@/lib/csrf";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SALES" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    Promise.all([
      csrfFetch("/api/auth/me").then((r) => r.json()),
      csrfFetch("/api/users").then((r) => r.json()),
    ]).then(([me, data]) => {
      if (!me.user) { router.push("/login"); return; }
      setCurrentUser(me.user);
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => { router.push("/login"); });
  }, [router]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, roleFilter, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await csrfFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setUsers((prev) => [data, ...prev]);
        setForm({ name: "", email: "", password: "", role: "SALES" });
        setShowForm(false);
        toast.success("Utilisateur créé");
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (currentUser && user.id === currentUser.id) {
      toast.warning("Vous ne pouvez pas désactiver votre propre compte");
      return;
    }
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const action = newStatus === "DISABLED" ? "désactiver" : "activer";
    const ok = await confirm(`Voulez-vous ${action} ${user.name} ?`);
    if (!ok) return;

    const res = await csrfFetch(`/api/users?id=${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
      toast.success(`Utilisateur ${action === "désactiver" ? "désactivé" : "activé"}`);
    } else {
      toast.error("Erreur lors de la modification");
    }
  };

  return (
    <AppShell>
      <PageHeader title="Gestion des utilisateurs" backHref="/">
        <Badge color="bg-navy/10 text-navy dark:bg-navy/20 dark:text-white">{users.length}</Badge>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Annuler</span></> : <><UserPlus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Nouvel utilisateur</span></>}
        </Button>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-4">
        {showForm && (
          <Card>
            <SectionTitle icon={<UserPlus className="w-3 h-3" />}>Nouvel utilisateur</SectionTitle>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Nom" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} required />
                <Field label="Email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} type="email" required />
                <Field label="Mot de passe" value={form.password} onChange={(v) => setForm((p) => ({ ...p, password: v }))} type="password" required helpText="Minimum 8 caractères" />
                <Select label="Rôle" value={form.role} onChange={(v) => setForm((p) => ({ ...p, role: v }))} options={[
                  { value: "OWNER", label: "Propriétaire" },
                  { value: "IT_ADMIN", label: "Admin IT" },
                  { value: "ADMIN", label: "Administrateur" },
                  { value: "ACCOUNTANT", label: "Comptable" },
                  { value: "SALES", label: "Vente" },
                  { value: "ASSISTANT", label: "Assistant" },
                  { value: "PROJECT_MANAGER", label: "Chef de Projet" },
                  { value: "DELIVERY", label: "Livreur" },
                  { value: "WAREHOUSE", label: "Magasinier" },
                  { value: "COMPLIANCE", label: "Conformité" },
                  { value: "VIEWER", label: "Lecteur" },
                ]} />
              </div>
              <div className="mt-3">
                <Button type="submit" variant="primary" size="sm" loading={saving}>Créer</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom ou email..." />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["ALL", "OWNER", "IT_ADMIN", "ADMIN", "ACCOUNTANT", "SALES", "ASSISTANT", "PROJECT_MANAGER", "DELIVERY", "WAREHOUSE", "COMPLIANCE", "VIEWER"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer min-h-[32px] ${
                roleFilter === r ? "bg-navy text-white border-navy" : "bg-white text-navy border-bdr hover:border-navy/30 dark:bg-surface dark:text-white"
              }`}
            >
              {r === "ALL" ? "Tous" : roleLabel(r)}
            </button>
          ))}
        </div>

        {loading ? (
          <Card><SkeletonTable rows={6} /></Card>
        ) : (
          <Card>
            {filtered.length === 0 ? (
              <EmptyState icon={<Users className="w-10 h-10" />} message="Aucun utilisateur trouvé." />
            ) : (
              <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-bdr">
                      <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 dark:text-white/50 uppercase tracking-wide pb-2">Utilisateur</th>
                      <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 dark:text-white/50 uppercase tracking-wide pb-2">Rôle</th>
                      <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 dark:text-white/50 uppercase tracking-wide pb-2">Statut</th>
                      <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 dark:text-white/50 uppercase tracking-wide pb-2 hidden sm:table-cell">Dernière connexion</th>
                      <th scope="col" className="text-right text-[10px] sm:text-[11px] font-semibold text-txt2 dark:text-white/50 uppercase tracking-wide pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-b border-bdr/50 last:border-0 hover:bg-navy/[0.04] dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => router.push(`/users/${u.id}`)}>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={u.name} size="sm" />
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-navy dark:text-white">{u.name}</p>
                              <p className="text-[10px] sm:text-[11px] text-txt2 dark:text-white/60">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5"><Badge color={roleColor(u.role)}>{roleLabel(u.role)}</Badge></td>
                        <td className="py-2.5">
                          <Badge color={u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}>
                            {u.status === "ACTIVE" ? "Actif" : "Désactivé"}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-xs text-txt2 dark:text-white/60 hidden sm:table-cell">
                          {u.lastLoginAt ? relativeTime(u.lastLoginAt) : "Jamais"}
                        </td>
                        <td className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant={u.status === "ACTIVE" ? "danger" : "secondary"}
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                            disabled={currentUser?.id === u.id}
                          >
                            {u.status === "ACTIVE" ? "Désactiver" : "Activer"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
