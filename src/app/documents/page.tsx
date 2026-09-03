"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDate, fmtNum } from "@/lib/utils";

interface Doc {
  id: string;
  num: string;
  type: string;
  date: string;
  total: number;
  status: string;
  saleMode?: string;
  clientName?: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PROFORMA" | "DEFINITIVE" | "BL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/documents?type=PROFORMA").then((r) => r.json()),
      fetch("/api/documents?type=DEFINITIVE").then((r) => r.json()),
      fetch("/api/delivery").then((r) => r.json()),
    ])
      .then(([pf, df, bl]) => {
        const pfDocs = (Array.isArray(pf) ? pf : []).map((d: any) => ({
          id: d.id, num: d.num, type: "PROFORMA", date: d.date,
          total: d.total, status: d.status, createdAt: d.createdAt,
          clientName: d.customerName || d.customer?.name,
        }));
        const dfDocs = (Array.isArray(df) ? df : []).map((d: any) => ({
          id: d.id, num: d.num, type: "DEFINITIVE", date: d.date,
          total: d.total, status: d.status, saleMode: d.saleMode, createdAt: d.createdAt,
          clientName: d.customerName || d.customer?.name,
        }));
        const blDocs = (Array.isArray(bl) ? bl : []).map((d: any) => ({
          id: d.id, num: d.num, type: "BL", date: d.date,
          total: 0, status: d.status, createdAt: d.createdAt,
          clientName: d.customerName || d.customer?.name,
        }));
        const all = [...pfDocs, ...dfDocs, ...blDocs]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDocs(all);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? docs : docs.filter((d) => d.type === filter);

  const typeLabel = (t: string) => {
    if (t === "PROFORMA") return "Pro Forma";
    if (t === "DEFINITIVE") return "Définitive";
    return "Bon de Livraison";
  };

  const typeColor = (t: string) => {
    if (t === "PROFORMA") return "bg-navy/10 text-navy";
    if (t === "DEFINITIVE") return "bg-blue-100 text-blue-700";
    return "bg-gold/20 text-navy";
  };

  const statusLabel = (s: string) => {
    if (s === "DRAFT") return "Brouillon";
    if (s === "FINALIZED") return "Finalisé";
    if (s === "CANCELLED") return "Annulé";
    return s;
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm("Supprimer ce document ? Cette action est irréversible.")) return;
    const endpoint = type === "BL" ? "/api/delivery" : "/api/documents";
    const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleOpen = (doc: Doc) => {
    if (doc.type === "PROFORMA") router.push(`/proforma?id=${doc.id}`);
    else if (doc.type === "DEFINITIVE") router.push(`/definitive?id=${doc.id}`);
    else router.push(`/bl?id=${doc.id}`);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-5 pb-10">
      <nav className="flex items-center justify-between flex-wrap gap-2 py-3 border-b-2 border-navy mb-5 sticky top-0 bg-bg z-50">
        <button onClick={() => router.push("/")} className="bg-transparent border-none text-navy text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded hover:bg-navy/5">
          &#8592; Retour
        </button>
        <span className="text-[15px] font-bold text-navy">Tous les documents</span>
        <div />
      </nav>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["ALL", "PROFORMA", "DEFINITIVE", "BL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-xs font-semibold border transition-colors ${
              filter === f
                ? "bg-navy text-white border-navy"
                : "bg-white text-navy border-bdr hover:border-navy"
            }`}
          >
            {f === "ALL" ? "Tous" : typeLabel(f)}
          </button>
        ))}
        <span className="ml-auto text-xs text-txt2 self-center">{filtered.length} document(s)</span>
      </div>

      {loading ? (
        <div className="text-center py-10 text-txt2">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-txt2">Aucun document trouvé.</div>
      ) : (
        <div className="bg-white border border-bdr rounded-[10px] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-navy text-white text-[10px] uppercase tracking-wide">
                <th className="text-left py-3 px-4">N°</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-center py-3 px-4">Statut</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-bdr/50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy">{doc.num}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${typeColor(doc.type)}`}>
                      {typeLabel(doc.type)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-txt2">{fmtDate(doc.date)}</td>
                  <td className="py-3 px-4 text-txt2">{doc.clientName || "—"}</td>
                  <td className="py-3 px-4 text-right font-bold text-navy">
                    {doc.total ? fmtNum(doc.total) + " F" : "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] text-txt2">{statusLabel(doc.status)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpen(doc)}
                      className="text-navy hover:underline mr-3 font-semibold"
                    >
                      Ouvrir
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.type)}
                      className="text-red hover:underline font-semibold"
                    >
                      Supprimer
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
