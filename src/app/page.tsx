"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Receipt, Truck, LogOut, BarChart3, Clock, Activity, User } from "lucide-react";
import { Card, Badge, Button, Avatar, Skeleton, EmptyState, SectionTitle } from "@/components/ui";
import { typeLabel, typeColor, statusLabel, statusColor, relativeTime } from "@/lib/document-helpers";
import { fmtNum } from "@/lib/utils";

interface Doc {
  id: string;
  num: string;
  type: string;
  date: string;
  total: number;
  status: string;
  createdAt: string;
  customerName?: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Stats {
  totalDocuments: number;
  totalRevenue: number;
  documentsThisMonth: number;
  totalDeliveryNotes: number;
}

interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user?: { name: string } | null;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function Home() {
  const router = useRouter();
  const [recentDocs, setRecentDocs] = useState<Doc[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ totalDocuments: 0, totalRevenue: 0, documentsThisMonth: 0, totalDeliveryNotes: 0 });
  const [activity, setActivity] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/dashboard/stats").then((r) => r.json()).catch(() => ({ totalDocuments: 0, totalRevenue: 0, documentsThisMonth: 0, totalDeliveryNotes: 0 })),
      fetch("/api/documents").then((r) => r.json()).catch(() => []),
      fetch("/api/delivery").then((r) => r.json()).catch(() => []),
      fetch("/api/audit?limit=5").then((r) => r.json()).catch(() => ({ events: [] })),
    ])
      .then(([me, st, docs, bl, audit]) => {
        if (!me.user) {
          router.push("/login");
          return;
        }
        setUser(me.user);
        setStats(st);
        const docsArr = (Array.isArray(docs) ? docs : []).map((d: Record<string, unknown>) => ({
          id: String(d.id), num: String(d.num), type: String(d.type), date: String(d.date),
          total: Number(d.total), status: String(d.status), createdAt: String(d.createdAt),
          customerName: String(d.customerName || ""),
        }));
        const blArr = (Array.isArray(bl) ? bl : []).map((d: Record<string, unknown>) => ({
          id: String(d.id), num: String(d.num), type: "BL", date: String(d.date),
          total: 0, status: String(d.status), createdAt: String(d.createdAt),
          customerName: String(d.customerName || ""),
        }));
        const all = [...docsArr, ...blArr]
          .sort((a: Doc, b: Doc) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8);
        setRecentDocs(all);
        setActivity(audit.events || []);
        setLoading(false);
      })
      .catch(() => { router.push("/login"); });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const quickActions = [
    { label: "Nouvelle Pro Forma", desc: "Créer une facture pro forma", icon: FileText, href: "/proforma", color: "bg-navy/5 text-navy" },
    { label: "Nouvelle Définitive", desc: "Créer une facture définitive", icon: Receipt, href: "/definitive", color: "bg-blue-50 text-blue-600" },
    { label: "Nouveau Bon de Livraison", desc: "Créer un bon de livraison", icon: Truck, href: "/bl", color: "bg-gold/10 text-gold" },
  ];

  if (loading) {
    return (
      <div className="no-print">
        <header className="bg-white border-b-2 border-navy px-5 py-3">
          <Skeleton className="h-8 w-48" />
        </header>
        <main className="max-w-6xl mx-auto px-5 py-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[10px]" />)}
          </div>
          <Skeleton className="h-40 rounded-[10px]" />
        </main>
      </div>
    );
  }

  return (
    <div className="no-print">
      <header className="bg-white border-b-2 border-navy px-5 py-3 flex items-center justify-between">
        <div className="flex items-center-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center">
            <span className="text-gold-lt font-bold text-sm">KSY</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-navy">KSY GLOBAL SERVICE</h1>
            <p className="text-[10px] text-txt2">KNOWLEDGE • SERVICE • YIELD</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/account")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="Mon compte">
                <User className="w-4 h-4 text-navy" />
              </button>
              <Avatar name={user.name} size="sm" />
              <div className="text-right">
                <p className="text-xs font-semibold text-navy">{greeting()}, {user.name.split(" ")[0]}</p>
                <p className="text-[10px] text-txt2">{user.role}</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Documents", value: stats.totalDocuments, icon: FileText, color: "text-navy" },
            { label: "Revenus (FCFA)", value: fmtNum(stats.totalRevenue), icon: BarChart3, color: "text-green-600" },
            { label: "Ce mois", value: stats.documentsThisMonth, icon: Clock, color: "text-blue-600" },
            { label: "Bons de livraison", value: stats.totalDeliveryNotes, icon: Truck, color: "text-gold" },
          ].map((s) => (
            <Card key={s.label} hover shadow className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-navy">{s.value}</p>
                <p className="text-[10px] text-txt2 uppercase tracking-wide">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-xs font-bold text-navy uppercase tracking-wide mb-3">Créer un document</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((a) => (
              <button
                key={a.href}
                onClick={() => router.push(a.href)}
                className="bg-white border border-bdr rounded-[10px] p-5 text-left hover:border-navy/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-xl ${a.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <a.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-navy mb-1">{a.label}</h3>
                <p className="text-[11px] text-txt2">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Card>
              <SectionTitle>Documents récents</SectionTitle>
              {recentDocs.length === 0 ? (
                <EmptyState icon={<FileText className="w-10 h-10" />} message="Aucun document. Créez votre premier document !" action="Créer un document" onAction={() => router.push("/proforma")} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-bdr">
                        <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Num</th>
                        <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Type</th>
                        <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Client</th>
                        <th className="text-right text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Total</th>
                        <th className="text-left text-[10px] font-semibold text-txt2 uppercase tracking-wide pb-2">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDocs.map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-bdr/50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push(d.type === "BL" ? `/bl?id=${d.id}` : `/${d.type === "PROFORMA" ? "proforma" : "definitive"}?id=${d.id}`)}
                        >
                          <td className="py-2 text-xs font-semibold text-navy">{d.num}</td>
                          <td className="py-2"><Badge color={typeColor(d.type)}>{typeLabel(d.type)}</Badge></td>
                          <td className="py-2 text-xs text-txt2">{d.customerName || "—"}</td>
                          <td className="py-2 text-xs text-right font-semibold">{d.total > 0 ? `${fmtNum(d.total)} FCFA` : "—"}</td>
                          <td className="py-2"><Badge color={statusColor(d.status)}>{statusLabel(d.status)}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          <Card>
            <SectionTitle icon={<Activity className="w-3 h-3" />}>Activité récente</SectionTitle>
            {activity.length === 0 ? (
              <p className="text-xs text-txt2 text-center py-6">Aucune activité</p>
            ) : (
              <div className="space-y-3">
                {activity.map((e) => (
                  <div key={e.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-navy/30 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-txt">{e.action.replace(/_/g, " ").toLowerCase()}</p>
                      <p className="text-[10px] text-txt2">{relativeTime(e.createdAt)}{e.user ? ` • ${e.user.name}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex gap-2">
          {[
            { label: "Tous les documents", href: "/documents" },
            { label: "Journal d'audit", href: "/audit" },
            { label: "Paramètres", href: "/settings" },
          ].map((l) => (
            <button
              key={l.href}
              onClick={() => router.push(l.href)}
              className="px-3 py-1.5 text-[11px] font-semibold text-navy bg-white border border-bdr rounded-full hover:border-navy transition-colors cursor-pointer"
            >
              {l.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
