"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLES = ["OWNER", "IT_ADMIN", "ADMIN", "SALES", "ASSISTANT", "DELIVERY", "VIEWER"];

const roleLabel = (r: string) => {
  const labels: Record<string, string> = {
    OWNER: "Propriétaire",
    IT_ADMIN: "Admin IT",
    ADMIN: "Administrateur",
    SALES: "Ventes",
    ASSISTANT: "Assistant",
    DELIVERY: "Livraison",
    VIEWER: "Observateur",
  };
  return labels[r] || r;
};

const roleColor = (r: string) => {
  if (r === "OWNER") return "bg-gold/20 text-navy";
  if (r === "IT_ADMIN") return "bg-purple-100 text-purple-700";
  if (r === "ADMIN") return "bg-blue-100 text-blue-700";
  if (r === "SALES") return "bg-green-100 text-green-700";
  if (r === "DELIVERY") return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-700";
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SALES" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setUsers((prev) => [data, ...prev]);
        setForm({ name: "", email: "", password: "", role: "SALES" });
        setShowForm(false);
      } else {
        alert(data.error || "Erreur lors de la création");
      }
    } catch {
      alert("Erreur réseau");
    }
    setSaving(false);
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    if (!confirm(`${newStatus === "DISABLED" ? "Désactiver" : "Activer"} cet utilisateur ?`)) return;

    const res = await fetch(`/api/users?id=${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-5 pb-10">
      <nav className="flex items-center justify-between flex-wrap gap-2 py-3 border-b-2 border-navy mb-5 sticky top-0 bg-bg z-50">
        <button onClick={() => router.push("/")} className="bg-transparent border-none text-navy text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded hover:bg-navy/5">
          &#8592; Retour
        </button>
        <span className="text-[15px] font-bold text-navy">Gestion des utilisateurs</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy-l"
        >
          {showForm ? "Annuler" : "+ Nouvel utilisateur"}
        </button>
      </nav>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-bdr rounded-xl p-5 mb-5">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wide mb-3">Créer un utilisateur</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-0.5">Nom</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="w-full px-2.5 py-2 border border-bdr rounded text-xs focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-0.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                className="w-full px-2.5 py-2 border border-bdr rounded text-xs focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-0.5">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={8}
                className="w-full px-2.5 py-2 border border-bdr rounded text-xs focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-0.5">Rôle</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full px-2.5 py-2 border border-bdr rounded text-xs"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{roleLabel(r)}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-navy text-white border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy-l disabled:opacity-50"
              >
                {saving ? "Création..." : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <div className="text-center py-10 text-txt2">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-txt2">Aucun utilisateur.</div>
      ) : (
        <div className="bg-white border border-bdr rounded-[10px] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-navy text-white text-[10px] uppercase tracking-wide">
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Rôle</th>
                <th className="text-center py-3 px-4">Statut</th>
                <th className="text-left py-3 px-4">Dernière connexion</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-bdr/50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-navy">{u.name}</td>
                  <td className="py-3 px-4 text-txt2">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${roleColor(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.status === "ACTIVE" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-txt2 text-[10px]">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`text-[10px] font-semibold ${u.status === "ACTIVE" ? "text-red hover:underline" : "text-green-700 hover:underline"}`}
                    >
                      {u.status === "ACTIVE" ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
