"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDate } from "@/lib/utils";

interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityNum: string | null;
  details: any;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

export default function AuditPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/audit?limit=${limit}&offset=${page * limit}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  const filtered = filter === "ALL" ? events : events.filter((e) => e.entityType === filter);

  const actionLabel = (a: string) => {
    const labels: Record<string, string> = {
      LOGIN_SUCCESS: "Connexion réussie",
      LOGIN_FAILURE: "Échec de connexion",
      USER_CREATED: "Utilisateur créé",
      USER_DISABLED: "Utilisateur désactivé",
      ROLE_CHANGED: "Rôle modifié",
      COMPANY_SETTINGS_UPDATED: "Paramètres modifiés",
      DOCUMENT_CREATED: "Document créé",
      DOCUMENT_UPDATED: "Document modifié",
      DOCUMENT_PRINTED: "Document imprimé",
      DOCUMENT_FINALIZED: "Document finalisé",
      DOCUMENT_DELETED: "Document supprimé",
      DELIVERY_NOTE_CREATED: "BL créé",
      DELIVERY_NOTE_UPDATED: "BL modifié",
      DELIVERY_NOTE_PRINTED: "BL imprimé",
      DELIVERY_NOTE_DELETED: "BL supprimé",
      CUSTOMER_CREATED: "Client créé",
      CUSTOMER_UPDATED: "Client modifié",
    };
    return labels[a] || a;
  };

  const actionColor = (a: string) => {
    if (a.includes("LOGIN_FAILURE") || a.includes("DELETED") || a.includes("DISABLED")) return "bg-red-50 text-red-700";
    if (a.includes("CREATED")) return "bg-green-50 text-green-700";
    if (a.includes("UPDATED") || a.includes("CHANGED")) return "bg-blue-50 text-blue-700";
    if (a.includes("PRINTED")) return "bg-purple-50 text-purple-700";
    return "bg-gray-50 text-gray-700";
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <main className="max-w-[1440px] mx-auto px-5 pb-10">
      <nav className="flex items-center justify-between flex-wrap gap-2 py-3 border-b-2 border-navy mb-5 sticky top-0 bg-bg z-50">
        <button onClick={() => router.push("/")} className="bg-transparent border-none text-navy text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded hover:bg-navy/5">
          &#8592; Retour
        </button>
        <span className="text-[15px] font-bold text-navy">Journal d&apos;audit</span>
        <span className="text-xs text-txt2">{total} &eacute;v&eacute;nement(s)</span>
      </nav>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["ALL", "auth", "document", "delivery_note", "company", "user"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors ${
              filter === f
                ? "bg-navy text-white border-navy"
                : "bg-white text-navy border-bdr hover:border-navy"
            }`}
          >
            {f === "ALL" ? "Tous" : f === "auth" ? "Authentification" : f === "document" ? "Documents" : f === "delivery_note" ? "Livraisons" : f === "company" ? "Entreprise" : "Utilisateurs"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-txt2">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-txt2">Aucun &eacute;v&eacute;nement.</div>
      ) : (
        <div className="bg-white border border-bdr rounded-[10px] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-navy text-white text-[10px] uppercase tracking-wide">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Action</th>
                <th className="text-left py-3 px-4">Entit&eacute;</th>
                <th className="text-left py-3 px-4">Utilisateur</th>
                <th className="text-left py-3 px-4">D&eacute;tails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} className="border-b border-bdr/50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-4 text-txt2 whitespace-nowrap">{fmtDate(event.createdAt)}</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${actionColor(event.action)}`}>
                      {actionLabel(event.action)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-navy font-semibold">{event.entityType}</span>
                    {event.entityNum && <span className="text-txt2 ml-1">({event.entityNum})</span>}
                  </td>
                  <td className="py-2.5 px-4 text-txt2">
                    {event.user?.name || "—"}
                  </td>
                  <td className="py-2.5 px-4 text-txt2 text-[10px]">
                    {event.details ? JSON.stringify(event.details).slice(0, 100) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="bg-white text-navy border border-bdr px-3 py-1.5 rounded text-xs font-semibold cursor-pointer hover:border-navy disabled:opacity-50"
          >
            Pr&eacute;c&eacute;dent
          </button>
          <span className="text-xs text-txt2">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="bg-white text-navy border border-bdr px-3 py-1.5 rounded text-xs font-semibold cursor-pointer hover:border-navy disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </main>
  );
}
