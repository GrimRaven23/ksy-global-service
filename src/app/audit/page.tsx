"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ChevronDown, ChevronRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, Badge, SearchInput, Pagination, Avatar, SkeletonTable, EmptyState, PageHeader, FilterPills } from "@/components/ui";
import { relativeTime } from "@/lib/document-helpers";

interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  entityNum?: string | null;
  details?: Record<string, unknown>;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

const actionColors: Record<string, string> = {
  LOGIN_SUCCESS: "bg-green-100 text-green-700",
  LOGIN_FAILURE: "bg-red-100 text-red-600",
  USER_CREATED: "bg-blue-100 text-blue-700",
  USER_DISABLED: "bg-red-100 text-red-600",
  USER_UPDATED: "bg-blue-100 text-blue-700",
  ROLE_CHANGED: "bg-purple-100 text-purple-700",
  DOCUMENT_CREATED: "bg-green-100 text-green-700",
  DOCUMENT_UPDATED: "bg-blue-100 text-blue-700",
  DOCUMENT_FINALIZED: "bg-navy/10 text-navy dark:bg-navy/20 dark:text-white",
  DOCUMENT_DELETED: "bg-red-100 text-red-600",
  DELIVERY_NOTE_CREATED: "bg-green-100 text-green-700",
  DELIVERY_NOTE_UPDATED: "bg-blue-100 text-blue-700",
  DELIVERY_NOTE_DELETED: "bg-red-100 text-red-600",
  COMPANY_SETTINGS_UPDATED: "bg-amber-100 text-amber-700",
};

const actionLabels: Record<string, string> = {
  LOGIN_SUCCESS: "Connexion réussie",
  LOGIN_FAILURE: "Échec de connexion",
  USER_CREATED: "Utilisateur créé",
  USER_DISABLED: "Utilisateur désactivé",
  USER_UPDATED: "Utilisateur modifié",
  ROLE_CHANGED: "Rôle modifié",
  COMPANY_SETTINGS_UPDATED: "Paramètres modifiés",
  DOCUMENT_CREATED: "Document créé",
  DOCUMENT_UPDATED: "Document modifié",
  DOCUMENT_FINALIZED: "Document finalisé",
  DOCUMENT_DELETED: "Document supprimé",
  DELIVERY_NOTE_CREATED: "BL créé",
  DELIVERY_NOTE_UPDATED: "BL modifié",
  DELIVERY_NOTE_DELETED: "BL supprimé",
};

export default function AuditPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (entityType) params.set("entityType", entityType);

    fetch(`/api/audit?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, entityType]);

  const filtered = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const label = actionLabels[e.action] || e.action;
    return label.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || (e.user?.name || "").toLowerCase().includes(q);
  });

  return (
    <AppShell>
      <PageHeader title="Journal d'audit" backHref="/">
        <Badge color="bg-navy/10 text-navy dark:bg-navy/20 dark:text-white">{total}</Badge>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une action..." />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{ value: "", label: "Tous" }, { value: "auth", label: "Authentification" }, { value: "document", label: "Documents" }, { value: "delivery_note", label: "Livraisons" }, { value: "company", label: "Entreprise" }, { value: "user", label: "Utilisateurs" }].map((et) => (
            <button
              key={et.value}
              onClick={() => { setEntityType(et.value); setPage(0); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer min-h-[32px] ${
                entityType === et.value ? "bg-navy text-white border-navy" : "bg-white text-navy border-bdr hover:border-navy/30 dark:bg-surface dark:text-white"
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>

        <Card>
          {loading ? (
            <SkeletonTable rows={10} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Activity className="w-10 h-10" />} message="Aucun événement trouvé." />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-bdr">
                    <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2 w-8"></th>
                    <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2">Date</th>
                    <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2">Action</th>
                    <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2 hidden sm:table-cell">Entité</th>
                    <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2 hidden md:table-cell">Utilisateur</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <>
                      <tr
                        key={e.id}
                        className="border-b border-bdr/50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                      >
                        <td className="py-2.5 text-txt2">
                          {expanded === e.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </td>
                        <td className="py-2.5 text-xs text-txt2 whitespace-nowrap">{relativeTime(e.createdAt)}</td>
                        <td className="py-2.5">
                          <Badge color={actionColors[e.action] || "bg-gray-100 text-gray-600"}>
                            {actionLabels[e.action] || e.action.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-[9px] text-txt2 block sm:hidden mt-0.5">{e.entityType}{e.entityNum ? ` • ${e.entityNum}` : ""}</span>
                        </td>
                        <td className="py-2.5 text-xs text-txt2 hidden sm:table-cell">
                          {e.entityType}{e.entityNum ? ` • ${e.entityNum}` : ""}
                        </td>
                        <td className="py-2.5 hidden md:table-cell">
                          {e.user ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={e.user.name} size="sm" />
                              <span className="text-xs text-txt2">{e.user.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-txt2/50">—</span>
                          )}
                        </td>
                      </tr>
                      {expanded === e.id && (
                        <tr key={`${e.id}-detail`}>
                          <td colSpan={5} className="px-4 py-3 bg-gray-50/50">
                            <pre className="text-[10px] text-txt2 font-mono whitespace-pre-wrap break-words">
                              {JSON.stringify(e.details || {}, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
