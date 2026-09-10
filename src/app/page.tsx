"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Receipt, Truck, BarChart3, Clock, Activity, ArrowRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, Badge, Skeleton, EmptyState, SectionTitle } from "@/components/ui";
import { typeLabel, typeColor, statusLabel, statusColor, relativeTime } from "@/lib/document-helpers";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/types";
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
      fetch("/api/dashboard").then((r) => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([me, dash]) => {
        if (!me.user) { router.push("/login"); return; }
        setUser(me.user);
        if (dash) {
          setStats(dash.stats);
          const docsArr = (Array.isArray(dash.recentDocs) ? dash.recentDocs : []).map((d: Record<string, unknown>) => ({
            id: String(d.id), num: String(d.num), type: String(d.type), date: String(d.date),
            total: Number(d.total), status: String(d.status), createdAt: String(d.createdAt),
            customerName: String(d.customerName || ""),
          }));
          const blArr = (Array.isArray(dash.recentDeliveries) ? dash.recentDeliveries : []).map((d: Record<string, unknown>) => ({
            id: String(d.id), num: String(d.num), type: "BL", date: String(d.date),
            total: 0, status: String(d.status), createdAt: String(d.createdAt),
            customerName: String(d.customerName || ""),
          }));
          const all = [...docsArr, ...blArr]
            .sort((a: Doc, b: Doc) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8);
          setRecentDocs(all);
          setActivity(dash.recentActivity || []);
        }
        setLoading(false);
      })
      .catch(() => { router.push("/login"); });
  }, [router]);

  const userPerms: Permission[] = user ? ROLE_PERMISSIONS[user.role] || [] : [];
  const can = (p: Permission) => userPerms.includes(p);

  const quickActions = [
    ...(can("proforma.create") ? [{ label: "Pro Forma", desc: "Facture pro forma", icon: FileText, href: "/proforma", color: "bg-navy/5 text-navy border-navy/10 hover:border-navy/25" }] : []),
    ...(can("proforma.create") ? [{ label: "Définitive", desc: "Facture définitive", icon: Receipt, href: "/definitive", color: "bg-blue-bg text-blue border-blue/15 hover:border-blue/30" }] : []),
    ...(can("delivery.create") ? [{ label: "Bon de Livraison", desc: "Bon de livraison", icon: Truck, href: "/bl", color: "bg-gold-bg text-gold border-gold/15 hover:border-gold/30" }] : []),
  ];

  return (
    <AppShell>
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 py-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-32 sm:h-40 rounded-xl" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
          {/* Welcome */}
          <div className="bg-gradient-to-r from-navy to-navy-l rounded-xl p-5 sm:p-6 text-white">
            <h1 className="text-lg sm:text-xl font-bold mb-1">
              {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir"}, {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-sm text-white/70">Voici un aperçu de votre activité</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Documents", value: stats.totalDocuments, icon: FileText, color: "text-navy", bg: "bg-navy/5 dark:bg-navy/10" },
              { label: "Revenus (FCFA)", value: fmtNum(stats.totalRevenue), icon: BarChart3, color: "text-green", bg: "bg-green-bg dark:bg-green/10" },
              { label: "Ce mois", value: stats.documentsThisMonth, icon: Clock, color: "text-blue", bg: "bg-blue-bg dark:bg-blue/10" },
              { label: "Livraisons", value: stats.totalDeliveryNotes, icon: Truck, color: "text-gold", bg: "bg-gold-bg dark:bg-gold/10" },
            ].map((s) => (
              <Card key={s.label} hover shadow className="flex items-center gap-3">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl font-bold text-navy dark:text-white truncate">{s.value}</p>
                  <p className="text-[10px] sm:text-[11px] text-txt3 uppercase tracking-wide truncate">{s.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div>
              <h2 className="text-[11px] sm:text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-3">Créer un document</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {quickActions.map((a) => (
                  <button
                    key={a.href}
                    onClick={() => router.push(a.href)}
                    className={`bg-white dark:bg-surface border rounded-xl p-4 sm:p-5 text-left hover:shadow-card-hover transition-all duration-200 cursor-pointer group ${a.color}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-navy/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <a.icon className="w-5 h-5 text-navy" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-txt3 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-sm font-bold text-navy dark:text-white mb-0.5">{a.label}</h3>
                    <p className="text-[11px] sm:text-xs text-txt3">{a.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card>
                <SectionTitle>Documents récents</SectionTitle>
                {recentDocs.length === 0 ? (
                  <EmptyState icon={<FileText className="w-10 h-10" />} message="Aucun document. Créez votre premier document !" action="Créer un document" onAction={() => router.push("/proforma")} />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="border-b border-bdr/60">
                            <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt3 uppercase tracking-wide pb-2.5">Num</th>
                            <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt3 uppercase tracking-wide pb-2.5">Type</th>
                            <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt3 uppercase tracking-wide pb-2.5 hidden md:table-cell">Client</th>
                            <th scope="col" className="text-right text-[10px] sm:text-[11px] font-semibold text-txt3 uppercase tracking-wide pb-2.5">Total</th>
                            <th scope="col" className="text-left text-[10px] sm:text-[11px] font-semibold text-txt3 uppercase tracking-wide pb-2.5">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentDocs.map((d) => (
                            <tr
                              key={d.id}
                              className="border-b border-bdr/30 last:border-0 table-row-hover cursor-pointer"
                              onClick={() => router.push(d.type === "BL" ? `/bl?id=${d.id}` : `/${d.type === "PROFORMA" ? "proforma" : "definitive"}?id=${d.id}`)}
                            >
                              <td className="py-2.5 text-xs sm:text-sm font-semibold text-navy">{d.num}</td>
                              <td className="py-2.5"><Badge color={typeColor(d.type)}>{typeLabel(d.type)}</Badge></td>
                              <td className="py-2.5 text-xs text-txt2 hidden md:table-cell">{d.customerName || "—"}</td>
                              <td className="py-2.5 text-xs sm:text-sm text-right font-semibold">{d.total > 0 ? `${fmtNum(d.total)} FCFA` : "—"}</td>
                              <td className="py-2.5"><Badge color={statusColor(d.status)}>{statusLabel(d.status)}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile card list */}
                    <div className="sm:hidden space-y-2">
                      {recentDocs.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => router.push(d.type === "BL" ? `/bl?id=${d.id}` : `/${d.type === "PROFORMA" ? "proforma" : "definitive"}?id=${d.id}`)}
                          className="w-full text-left border border-bdr/40 rounded-lg p-3 hover:border-navy/15 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-navy">{d.num}</span>
                            <span className="text-xs font-bold text-navy">{d.total > 0 ? `${fmtNum(d.total)} FCFA` : "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge color={typeColor(d.type)}>{typeLabel(d.type)}</Badge>
                            <Badge color={statusColor(d.status)}>{statusLabel(d.status)}</Badge>
                            {d.customerName && <span className="text-[10px] text-txt3 truncate ml-1">{d.customerName}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>

            <Card>
              <SectionTitle icon={<Activity className="w-3 h-3" />}>Activité récente</SectionTitle>
              {activity.length === 0 ? (
                <p className="text-xs text-txt3 text-center py-8">Aucune activité</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((e) => (
                    <div key={e.id} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-navy/20 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs text-txt truncate">{e.action.replace(/_/g, " ").toLowerCase()}</p>
                        <p className="text-[10px] text-txt3">{relativeTime(e.createdAt)}{e.user ? ` • ${e.user.name}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
