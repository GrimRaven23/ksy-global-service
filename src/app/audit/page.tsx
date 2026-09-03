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
}

const ACTION_LABELS: Record<string, string> = {
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
};

const ACTION_COLORS: Record<string, string> = {
  COMPANY_SETTINGS_UPDATED: "bg-blue-100 text-blue-700",
  DOCUMENT_CREATED: "bg-green-100 text-green-700",
  DOCUMENT_UPDATED: "bg-yellow-100 text-yellow-700",
  DOCUMENT_PRINTED: "bg-purple-100 text-purple-700",
  DOCUMENT_FINALIZED: "bg-green-100 text-green-700",
  DOCUMENT_DELETED: "bg-red-100 text-red-700",
  DELIVERY_NOTE_CREATED: "bg-green-100 text-green-700",
  DELIVERY_NOTE_UPDATED: "bg-yellow-100 text-yellow-700",
  DELIVERY_NOTE_PRINTED: "bg-purple-100 text-purple-700",
  DELIVERY_NOTE_DELETED: "bg-red-100 text-red-700",
};

export default function AuditPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/audit?limit=200")
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? events : events.filter((e) => e.entityType === filter);

  return (
    <main className="max-w-[1440px] mx-auto px-5 pb-10">
      <nav className="flex items-center justify-between flex-wrap gap-2 py-3 border-b-2 border-navy mb-5 sticky top-0 bg-bg z-50">
        <button onClick={() => router.push("/")} className="bg-transparent border-none text-navy text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded hover:bg-navy/5">
          &#8592; Retour
        </button>
        <span className="text-[15px] font-bold text-navy">Journal d&apos;audit</span>
        <div />
      </nav>

      <div className="flex gap-2 mb-5 flex-wrap">
        {["ALL", "COMPANY_SETTINGS", "PROFORMA", "DEFINITIVE", "DELIVERY_NOTE"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-xs font-semibold border transition-colors ${
              filter === f
                ? "bg-navy text-white border-navy"
                : "bg-white text-navy border-bdr hover:border-navy"
            }`}
          >
            {f === "ALL" ? "Tous" : f === "COMPANY_SETTINGS" ? "Paramètres" : f === "DELIVERY_NOTE" ? "BL" : f}
          </button>
        ))}
        <span className="ml-auto text-xs text-txt2 self-center">{filtered.length} événement(s)</span>
      </div>

      {loading ? (
        <div className="text-center py-10 text-txt2">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-txt2">Aucun événement trouvé.</div>
      ) : (
        <div className="bg-white border border-bdr rounded-[10px] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-navy text-white text-[10px] uppercase tracking-wide">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Action</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">N° document</th>
                <th className="text-left py-3 px-4">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} className="border-b border-bdr/50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-txt2 whitespace-nowrap">{fmtDate(event.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${ACTION_COLORS[event.action] || "bg-gray-100 text-gray-700"}`}>
                      {ACTION_LABELS[event.action] || event.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-txt2">{event.entityType}</td>
                  <td className="py-3 px-4 font-bold text-navy">{event.entityNum || "—"}</td>
                  <td className="py-3 px-4 text-txt2">
                    {event.details ? JSON.stringify(event.details) : "—"}
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
