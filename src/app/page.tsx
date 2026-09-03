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
  createdAt: string;
  clientName?: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Home() {
  const router = useRouter();
  const [recentDocs, setRecentDocs] = useState<Doc[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/documents").then((r) => r.json()).catch(() => []),
      fetch("/api/delivery").then((r) => r.json()).catch(() => []),
    ])
      .then(([me, docs, bl]) => {
        if (me.user) setUser(me.user);
        const docsArr = (Array.isArray(docs) ? docs : []).map((d: any) => ({
          id: d.id, num: d.num, type: d.type, date: d.date,
          total: d.total, status: d.status, createdAt: d.createdAt,
          clientName: d.customerName || d.customer?.name,
        }));
        const blArr = (Array.isArray(bl) ? bl : []).map((d: any) => ({
          id: d.id, num: d.num, type: "BL", date: d.date,
          total: 0, status: d.status, createdAt: d.createdAt,
          clientName: d.customerName || d.customer?.name,
        }));
        const all = [...docsArr, ...blArr]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8);
        setRecentDocs(all);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

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

  return (
    <main className="max-w-[1440px] mx-auto px-5 pb-10">
      {/* Header */}
      <header className="flex items-center justify-between py-4 border-b-2 border-navy mb-8">
        <div className="flex items-center gap-4">
          <img src="/images/logo.jpeg" alt="KSY" className="h-12 w-auto" />
          <div>
            <h1 className="text-lg font-bold text-navy">KSY GLOBAL SERVICE</h1>
            <p className="text-[10px] text-txt2 uppercase tracking-wide">KNOWLEDGE &bull; SERVICE &bull; YIELD</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right">
              <div className="text-xs font-semibold text-navy">{user.name}</div>
              <div className="text-[10px] text-txt2">{user.role}</div>
            </div>
          )}
          <button onClick={handleLogout} className="bg-transparent border border-bdr text-txt2 px-3 py-1.5 rounded text-xs cursor-pointer hover:bg-red-50 hover:text-red hover:border-red-200 transition-colors">
            Déconnexion
          </button>
        </div>
      </header>

      {/* Document creation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => router.push("/proforma")}
          className="group bg-white border border-bdr rounded-xl p-5 text-left cursor-pointer hover:border-navy hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-navy group-hover:text-white transition-colors">
            <span className="text-lg">&#128196;</span>
          </div>
          <h3 className="text-sm font-bold text-navy mb-1">Facture Pro Forma</h3>
          <p className="text-[11px] text-txt2">Cr&eacute;er une facture proforma</p>
        </button>

        <button
          onClick={() => router.push("/definitive")}
          className="group bg-white border border-bdr rounded-xl p-5 text-left cursor-pointer hover:border-navy hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <span className="text-lg">&#128196;</span>
          </div>
          <h3 className="text-sm font-bold text-navy mb-1">Facture D&eacute;finitive</h3>
          <p className="text-[11px] text-txt2">Cr&eacute;er une facture d&eacute;finitive</p>
        </button>

        <button
          onClick={() => router.push("/bl")}
          className="group bg-white border border-bdr rounded-xl p-5 text-left cursor-pointer hover:border-navy hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gold group-hover:text-navy transition-colors">
            <span className="text-lg">&#128666;</span>
          </div>
          <h3 className="text-sm font-bold text-navy mb-1">Bon de Livraison</h3>
          <p className="text-[11px] text-txt2">Cr&eacute;er un bon de livraison</p>
        </button>
      </div>

      {/* Quick links */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => router.push("/documents")} className="bg-white text-navy border border-bdr px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:border-navy transition-colors">
          Tous les documents
        </button>
        <button onClick={() => router.push("/audit")} className="bg-white text-navy border border-bdr px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:border-navy transition-colors">
          Journal d&apos;audit
        </button>
        <button onClick={() => router.push("/settings")} className="bg-white text-navy border border-bdr px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:border-navy transition-colors">
          Param&egrave;tres
        </button>
      </div>

      {/* Recent documents */}
      <div className="bg-white border border-bdr rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-bdr bg-navy/5">
          <h2 className="text-xs font-bold text-navy uppercase tracking-wide">Documents r&eacute;cents</h2>
        </div>
        {loading ? (
          <div className="text-center py-8 text-txt2 text-xs">Chargement...</div>
        ) : recentDocs.length === 0 ? (
          <div className="text-center py-8 text-txt2 text-xs">Aucun document. Cr&eacute;ez votre premier document !</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-txt2 uppercase tracking-wide border-b border-bdr/50">
                <th className="text-left py-2 px-4">N&deg;</th>
                <th className="text-left py-2 px-4">Type</th>
                <th className="text-left py-2 px-4">Date</th>
                <th className="text-left py-2 px-4">Client</th>
                <th className="text-right py-2 px-4">Total</th>
                <th className="text-center py-2 px-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-bdr/50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                  if (doc.type === "PROFORMA") router.push(`/proforma?id=${doc.id}`);
                  else if (doc.type === "DEFINITIVE") router.push(`/definitive?id=${doc.id}`);
                  else router.push(`/bl?id=${doc.id}`);
                }}>
                  <td className="py-2.5 px-4 font-bold text-navy">{doc.num}</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${typeColor(doc.type)}`}>
                      {typeLabel(doc.type)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-txt2">{fmtDate(doc.date)}</td>
                  <td className="py-2.5 px-4 text-txt2">{doc.clientName || "—"}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-navy">
                    {doc.total ? fmtNum(doc.total) + " F" : "—"}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="text-[10px] text-txt2">
                      {doc.status === "DRAFT" ? "Brouillon" : doc.status === "FINALIZED" ? "Finalisé" : doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
