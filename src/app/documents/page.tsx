"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, Badge, SearchInput, SkeletonTable, EmptyState, PageHeader, FilterPills } from "@/components/ui";
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
  convertedFrom?: { id: string; num: string; type: string } | null;
  conversions?: { id: string; num: string; type: string }[];
}

export default function DocumentsPage() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PROFORMA" | "DEFINITIVE" | "BL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "EMISE" | "FINALIZED" | "CONVERTED" | "CANCELLED">("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/documents?type=PROFORMA").then((r) => r.json()),
      fetch("/api/documents?type=DEFINITIVE").then((r) => r.json()),
      fetch("/api/delivery").then((r) => r.json()),
    ])
      .then(([me, pf, df, bl]) => {
        if (!me.user) { router.push("/login"); return; }
        const pfArr = pf?.items || (Array.isArray(pf) ? pf : []);
        const dfArr = df?.items || (Array.isArray(df) ? df : []);
        const blArr = bl?.items || (Array.isArray(bl) ? bl : []);
        const pfDocs = pfArr.map((d: Record<string, unknown>) => ({
          id: String(d.id), num: String(d.num), type: "PROFORMA", date: String(d.date),
          total: Number(d.total), status: String(d.status), createdAt: String(d.createdAt),
          customerName: String(d.customerName || ""),
          deliveryNotes: Array.isArray(d.deliveryNotes) ? d.deliveryNotes as { id: string; num: string }[] : [],
          saleMode: String(d.saleMode || "DIRECTE"),
          convertedFrom: d.convertedFrom || null,
          conversions: Array.isArray(d.conversions) ? d.conversions as { id: string; num: string; type: string }[] : [],
        }));
        const dfDocs = dfArr.map((d: Record<string, unknown>) => ({
          id: String(d.id), num: String(d.num), type: "DEFINITIVE", date: String(d.date),
          total: Number(d.total), status: String(d.status), createdAt: String(d.createdAt),
          customerName: String(d.customerName || ""),
          deliveryNotes: Array.isArray(d.deliveryNotes) ? d.deliveryNotes as { id: string; num: string }[] : [],
          saleMode: String(d.saleMode || "DIRECTE"),
          convertedFrom: d.convertedFrom || null,
          conversions: Array.isArray(d.conversions) ? d.conversions as { id: string; num: string; type: string }[] : [],
        }));
        const blDocs = blArr.map((d: Record<string, unknown>) => ({
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

  return (
    <AppShell>
      <PageHeader title="Tous les documents" backHref="/">
        <Badge color="bg-navy/10 text-navy">{docs.length}</Badge>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par numéro ou client..." />
          </div>
        </div>

        <FilterPills
          groups={[
            {
              label: "Type",
              options: [
                { value: "ALL", label: "Tous" },
                { value: "PROFORMA", label: typeLabel("PROFORMA") },
                { value: "DEFINITIVE", label: typeLabel("DEFINITIVE") },
                { value: "BL", label: "BL" },
              ],
              selected: typeFilter,
              onChange: (v) => setTypeFilter(v as typeof typeFilter),
            },
            {
              label: "Statut",
              options: [
                { value: "ALL", label: "Tous" },
                { value: "DRAFT", label: statusLabel("DRAFT") },
                { value: "EMISE", label: statusLabel("EMISE") },
                { value: "FINALIZED", label: statusLabel("FINALIZED") },
                { value: "CONVERTED", label: statusLabel("CONVERTED") },
                { value: "CANCELLED", label: statusLabel("CANCELLED") },
              ],
              selected: statusFilter,
              onChange: (v) => setStatusFilter(v as typeof statusFilter),
            },
          ]}
        />

        {loading ? (
          <Card><SkeletonTable rows={8} /></Card>
        ) : (
          <Card>
            {filtered.length === 0 ? (
              <EmptyState icon={<FileText className="w-10 h-10" />} message="Aucun document trouvé." />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-bdr">
                        <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2">Num</th>
                        <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2">Type</th>
                        <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2 hidden md:table-cell">Date</th>
                        <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2 hidden md:table-cell">Client</th>
                        <th scope="col" className="text-right text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2">Total</th>
                        <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2">Statut</th>
                        <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2 hidden lg:table-cell">Livraison</th>
                        <th scope="col" className="text-right text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide pb-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((d) => (
                        <tr key={d.id} className="border-b border-bdr/50 last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 text-xs sm:text-sm font-semibold text-navy cursor-pointer" onClick={() => openDoc(d)}>{d.num}</td>
                          <td className="py-2.5"><Badge color={typeColor(d.type)}>{typeLabel(d.type)}</Badge></td>
                          <td className="py-2.5 text-xs text-txt2 hidden md:table-cell">{relativeTime(d.createdAt)}</td>
                          <td className="py-2.5 text-xs text-txt2 hidden md:table-cell">{d.customerName || "—"}</td>
                          <td className="py-2.5 text-xs sm:text-sm text-right font-semibold">{d.total > 0 ? `${fmtNum(d.total)} FCFA` : "—"}</td>
                          <td className="py-2.5">
                            <Badge color={statusColor(d.status)}>{statusLabel(d.status)}</Badge>
                            {d.convertedFrom && (
                              <span className="text-[9px] text-purple-600 block mt-0.5">de {d.convertedFrom.num}</span>
                            )}
                            {d.conversions && d.conversions.length > 0 && (
                              <span className="text-[9px] text-purple-600 block mt-0.5">→ {d.conversions[0].num}</span>
                            )}
                          </td>
                          <td className="py-2.5 text-[11px] hidden lg:table-cell">
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
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openDoc(d)} className="text-[11px] sm:text-xs text-navy font-semibold hover:underline cursor-pointer">Ouvrir</button>
                              <button onClick={() => handleDelete(d.id, d.type)} className="p-2 text-red/60 hover:text-red transition-colors cursor-pointer rounded-lg hover:bg-red/5" aria-label="Supprimer ce document">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="sm:hidden space-y-2">
                  {filtered.map((d) => (
                    <div
                      key={d.id}
                      className="border border-bdr/50 rounded-lg p-3 hover:border-navy/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <button onClick={() => openDoc(d)} className="text-xs font-bold text-navy hover:underline cursor-pointer text-left">{d.num}</button>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge color={typeColor(d.type)}>{typeLabel(d.type)}</Badge>
                            <Badge color={statusColor(d.status)}>{statusLabel(d.status)}</Badge>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(d.id, d.type)} className="p-1.5 text-red/60 hover:text-red transition-colors cursor-pointer rounded-lg hover:bg-red/5 shrink-0" aria-label="Supprimer ce document">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {d.customerName && (
                        <p className="text-[11px] text-txt2 mb-1 truncate">{d.customerName}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-txt2">{relativeTime(d.createdAt)}</span>
                        <span className="text-xs font-bold text-navy">{d.total > 0 ? `${fmtNum(d.total)} FCFA` : "—"}</span>
                      </div>
                      {d.convertedFrom && (
                        <p className="text-[9px] text-purple-600 mt-1">de {d.convertedFrom.num}</p>
                      )}
                      {d.conversions && d.conversions.length > 0 && (
                        <p className="text-[9px] text-purple-600 mt-1">→ {d.conversions[0].num}</p>
                      )}
                      {d.type === "DEFINITIVE" && d.saleMode === "LIVRAISON" && !d.deliveryNotes?.length && (
                        <button onClick={() => handleCreateBL(d)} className="text-[11px] text-gold font-semibold hover:underline cursor-pointer mt-1">
                          + Créer BL
                        </button>
                      )}
                      {d.deliveryNotes && d.deliveryNotes.length > 0 && (
                        <button onClick={() => router.push(`/bl?id=${d.deliveryNotes![0].id}`)} className="text-[11px] text-navy font-semibold hover:underline cursor-pointer mt-1">
                          BL: {d.deliveryNotes[0].num}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
