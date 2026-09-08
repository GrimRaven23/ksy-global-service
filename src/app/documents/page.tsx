"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import { Card, Badge, SearchInput, Skeleton, SkeletonTable, EmptyState } from "@/components/ui";
import { typeLabel, typeColor, statusLabel, statusColor, relativeTime } from "@/lib/document-helpers";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { fmtNum } from "@/lib/utils";

interface Doc {
  id: string;
  num: string;
  type: string;
  date: string;
  total: number;
  status: string;
  customerName?: string;
  createdAt: string;
  deliveryNotes?: { id: string; num: string }[];
  saleMode?: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PROFORMA" | "DEFINITIVE" | "BL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "FINALIZED" | "CANCELLED">("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/documents?type=PROFORMA").then((r) => r.json()),
      fetch("/api/documents?type=DEFINITIVE").then((r) => r.json()),
      fetch("/api/delivery").then((r) => r.json()),
    ])
      .then(([me, pf, df, bl]) => {
        if (!me.user) { router.push("/login"); return; }
        const pfDocs = (Array.isArray(pf) ? pf : []).map((d: Record<string, unknown>) => ({
          id: String(d.id), num: String(d.num), type: "PROFORMA", date: String(d.date),
          total: Number(d.total), status: String(d.status), createdAt: String(d.createdAt),
          customerName: String(d.customerName || ""),
          deliveryNotes: Array.isArray(d.deliveryNotes) ? d.deliveryNotes as { id: string; num: string }[] : [],
          saleMode: String(d.saleMode || "DIRECTE"),
        }));
        const dfDocs = (Array.isArray(df) ? df : []).map((d: Record<string, unknown>) => ({
          id: String(d.id), num: String(d.num), type: "DEFINITIVE", date: String(d.date),
          total: Number(d.total), status: String(d.status), createdAt: String(d.createdAt),
          customerName: String(d.customerName || ""),
          deliveryNotes: Array.isArray(d.deliveryNotes) ? d.deliveryNotes as { id: string; num: string }[] : [],
          saleMode: String(d.saleMode || "DIRECTE"),
        }));
        const blDocs = (Array.isArray(bl) ? bl : []).map((d: Record<string, unknown>) => ({
          id: String(d.id), num: String(d.num), type: "BL", date: String(d.date),
          total: 0, status: String(d.status), createdAt: String(d.createdAt),
          customerName: String(d.customerName || ""),
        }));
        const all = [...pfDocs, ...dfDocs, ...blDocs]
          .sort((a: Doc, b: Doc) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDocs(all);
        setLoading(false);
      })
      .catch(() => { router.push("/login"); });
  }, [router]);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (typeFilter !== "ALL" && d.type !== typeFilter) return false;
      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.num.toLowerCase().includes(q) && !(d.customerName || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [docs, typeFilter, statusFilter, search]);

  const handleDelete = async (id: string, type: string) => {
    const ok = await confirm("Supprimer ce document ? Cette action est irréversible.");
    if (!ok) return;
    const endpoint = type === "BL" ? "/api/delivery" : "/api/documents";
    const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document supprimé");
    } else {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openDoc = (d: Doc) => {
    if (d.type === "BL") router.push(`/bl?id=${d.id}`);
    else router.push(`/${d.type === "PROFORMA" ? "proforma" : "definitive"}?id=${d.id}`);
  };

  const handleCreateBL = async (doc: Doc) => {
    const ok = await confirm(`Créer un Bon de Livraison pour ${doc.num} ?`);
    if (!ok) return;
    const res = await fetch("/api/documents/create-bl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: doc.id }),
    });
    if (res.ok) {
      const bl = await res.json();
      toast.success("Bon de livraison créé");
      router.push(`/bl?id=${bl.id}`);
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de la création du BL");
    }
  };

  if (loading) {
    return (
      <div className="no-print">
        <header className="bg-white border-b-2 border-navy px-5 py-3 flex items-center gap-3">
          <Skeleton className="h-6 w-32" />
        </header>
        <main className="max-w-6xl mx-auto px-5 py-6"><SkeletonTable rows={8} /></main>
      </div>
    );
  }

  return (
    <div className="no-print">
      <header className="bg-white border-b-2 border-navy px-5 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-navy" />
        </button>
        <h1 className="text-sm font-bold text-navy">Tous les documents</h1>
        <Badge color="bg-navy/10 text-navy">{docs.length}</Badge>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par numéro ou client..." />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-semibold text-txt2 uppercase tracking-wide self-center mr-1">Type:</span>
          {(["ALL", "PROFORMA", "DEFINITIVE", "BL"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                typeFilter === t ? "bg-navy text-white border-navy" : "bg-white text-navy border-bdr hover:border-navy/30"
              }`}
            >
              {t === "ALL" ? "Tous" : typeLabel(t)}
            </button>
          ))}
          <span className="w-px h-5 bg-bdr mx-1 self-center" />
          <span className="text-[10px] font-semibold text-txt2 uppercase tracking-wide self-center mr-1">Statut:</span>
          {(["ALL", "DRAFT", "FINALIZED", "CANCELLED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                statusFilter === s ? "bg-navy text-white border-navy" : "bg-white text-navy border-bdr hover:border-navy/30"
              }`}
            >
              {s === "ALL" ? "Tous" : statusLabel(s)}
            </button>
          ))}
        </div>

        <Card>
          {filtered.length === 0 ? (
            <EmptyState icon={<FileText className="w-10 h-10" />} message="Aucun document trouvé." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bdr">
                    <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Num</th>
                    <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Type</th>
                    <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Date</th>
                    <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Client</th>
                    <th className="text-right text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Total</th>
                    <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Statut</th>
                    <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Livraison</th>
                    <th className="text-right text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-b border-bdr/50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-2 text-xs font-semibold text-navy cursor-pointer" onClick={() => openDoc(d)}>{d.num}</td>
                      <td className="py-2"><Badge color={typeColor(d.type)}>{typeLabel(d.type)}</Badge></td>
                      <td className="py-2 text-xs text-txt2">{relativeTime(d.createdAt)}</td>
                      <td className="py-2 text-xs text-txt2">{d.customerName || "—"}</td>
                      <td className="py-2 text-xs text-right font-semibold">{d.total > 0 ? `${fmtNum(d.total)} FCFA` : "—"}</td>
                      <td className="py-2"><Badge color={statusColor(d.status)}>{statusLabel(d.status)}</Badge></td>
                      <td className="py-2 text-[11px]">
                        {d.deliveryNotes && d.deliveryNotes.length > 0 ? (
                          <button onClick={() => router.push(`/bl?id=${d.deliveryNotes![0].id}`)} className="text-navy font-semibold hover:underline cursor-pointer">
                            {d.deliveryNotes![0].num}
                          </button>
                        ) : d.type === "DEFINITIVE" && d.saleMode === "LIVRAISON" ? (
                          <button onClick={() => handleCreateBL(d)} className="text-gold font-semibold hover:underline cursor-pointer text-[11px]">
                            + Créer BL
                          </button>
                        ) : (
                          <span className="text-txt2">—</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openDoc(d)} className="text-[11px] text-navy font-semibold hover:underline cursor-pointer">Ouvrir</button>
                          <button onClick={() => handleDelete(d.id, d.type)} className="p-1 text-red/60 hover:text-red transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
