"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Receipt, Truck, BarChart3, Clock, ArrowRight, AlertTriangle,
  Building2, HeartPulse, Inbox, CircleDollarSign,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, StatusBadge, Skeleton, EmptyState, Alert, KsyDivider, ErrorState } from "@/components/ui";
import { typeLabel, relativeTime } from "@/lib/document-helpers";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/types";
import { fmtNum } from "@/lib/utils";
import { csrfFetch } from "@/lib/csrf";

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

function docHref(d: Doc): string {
  if (d.type === "BL") return `/bl?id=${d.id}`;
  return `/${d.type === "PROFORMA" ? "proforma" : "definitive"}?id=${d.id}`;
}

export default function Home() {
  const router = useRouter();
  const [recentDocs, setRecentDocs] = useState<Doc[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ totalDocuments: 0, totalRevenue: 0, documentsThisMonth: 0, totalDeliveryNotes: 0 });
  const [activity, setActivity] = useState<AuditEvent[]>([]);
  const [companyOk, setCompanyOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadRef, setLoadRef] = useState<string | undefined>(undefined);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      csrfFetch("/api/auth/me").then((r) => r.json()),
      csrfFetch("/api/dashboard").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      csrfFetch("/api/settings").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([me, dash, company]) => {
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
          setRecentDocs(
            [...docsArr, ...blArr]
              .sort((a: Doc, b: Doc) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 8)
          );
          setActivity(dash.recentActivity || []);
        }
        if (company) setCompanyOk(Boolean(company.name && (company.phone || company.email)));
        setLoading(false);
      })
      .catch((e: unknown) => {
        const ref = e instanceof Error ? undefined : undefined;
        setLoadError("Impossible de charger le tableau de bord.");
        setLoadRef(ref);
        setLoading(false);
      });
  };

  useEffect(load, [router]);

  const userPerms: Permission[] = user ? ROLE_PERMISSIONS[user.role] || [] : [];
  const can = (p: Permission) => userPerms.includes(p);
  const isTech = can("system.manage");

  const quickActions = [
    ...(can("proforma.create") ? [{ label: "Facture Pro Forma", desc: "Devis formalisé à convertir", icon: FileText, href: "/proforma" }] : []),
    ...(can("documents.create") ? [{ label: "Facture Définitive", desc: "Vente directe ou livraison", icon: Receipt, href: "/definitive" }] : []),
    ...(can("delivery.create") ? [{ label: "Bon de Livraison", desc: "Suivi de livraison", icon: Truck, href: "/bl" }] : []),
    ...(can("customers.create") ? [{ label: "Nouveau client", desc: "Fiche client", icon: Inbox, href: "/customers" }] : []),
  ];

  const drafts = recentDocs.filter((d) => d.status === "DRAFT");
  const pendingBL = recentDocs.filter((d) => d.type === "BL" && (d.status === "DRAFT" || d.status === "EMISE"));

  if (!loading && loadError) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <ErrorState
            title="Tableau de bord indisponible"
            step="Chargement du tableau de bord"
            cause={loadError}
            action="Vérifiez votre connexion puis réessayez. Si le problème persiste, contactez l'administrateur."
            onRetry={load}
            reference={loadRef}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <Skeleton className="h-36 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5 sm:space-y-6">
          {/* ── Hero ── */}
          <section className="relative overflow-hidden gradient-navy rounded-2xl p-5 sm:p-7 text-white shadow-lg">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.12]">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border-[3px] border-gold" />
              <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full border-2 border-gold/70" />
              <div className="absolute top-8 left-1/3 w-24 h-24 rounded-full border border-gold/50" />
            </div>
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-lt/90 mb-1">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
                {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir"}, {user?.name?.split(" ")[0]}
              </h1>
              <p className="text-sm text-white/70 mb-4">Voici l&apos;état de votre activité en un coup d&apos;œil.</p>
              {quickActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((a) => (
                    <button
                      key={a.href + a.label}
                      onClick={() => router.push(a.href)}
                      className="inline-flex items-center gap-2 bg-gold text-navy text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-gold-lt transition-all cursor-pointer shadow-md active:scale-[0.98]"
                    >
                      <a.icon className="w-4 h-4" aria-hidden="true" /> {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Proactive alerts ── */}
          {(companyOk === false || drafts.length > 0) && (
            <div className="grid gap-3">
              {companyOk === false && can("company.update") && (
                <Alert tone="warning" title="Entreprise incomplète" action="Compléter les détails" onAction={() => router.push("/settings")}>
                  Le nom, le téléphone ou l&apos;email de l&apos;entreprise sont manquants. Ils apparaissent sur chaque document imprimé.
                </Alert>
              )}
              {drafts.length > 0 && (
                <Alert tone="info" title={`${drafts.length} brouillon${drafts.length > 1 ? "s" : ""} en attente`} action="Voir les documents" onAction={() => router.push("/documents")}>
                  Des documents attendent d&apos;être finalisés ou annulés.
                </Alert>
              )}
            </div>
          )}

          {/* ── KPIs ── */}
          <section aria-label="Indicateurs" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Documents", value: String(stats.totalDocuments), icon: FileText, ring: "ring-navy/15", chip: "bg-navy text-white" },
              { label: "Chiffre finalisé", value: `${fmtNum(stats.totalRevenue)} F`, icon: CircleDollarSign, ring: "ring-green/25", chip: "bg-green text-white" },
              { label: "Créés ce mois", value: String(stats.documentsThisMonth), icon: Clock, ring: "ring-blue/25", chip: "bg-blue text-white" },
              { label: "Bons de livraison", value: String(stats.totalDeliveryNotes), icon: Truck, ring: "ring-gold/30", chip: "bg-gold text-navy" },
            ].map((s) => (
              <Card key={s.label} shadow className="!p-4">
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl ${s.chip} flex items-center justify-center shrink-0 ring-4 ${s.ring}`}>
                    <s.icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base sm:text-lg font-black text-navy dark:text-white truncate">{s.value}</span>
                    <span className="block text-[10px] font-bold text-txt3 uppercase tracking-wider truncate">{s.label}</span>
                  </span>
                </div>
              </Card>
            ))}
          </section>

          <KsyDivider />

          {/* ── Recent + side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 !p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">Documents récents</h2>
                <button onClick={() => router.push("/documents")} className="inline-flex items-center gap-1 text-xs font-bold text-navy dark:text-gold-lt hover:underline cursor-pointer">
                  Tout voir <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
              {recentDocs.length === 0 ? (
                <div className="px-4 pb-4">
                  <EmptyState icon={<FileText className="w-10 h-10" />} message="Aucun document pour le moment. Créez votre première facture pour démarrer." action={quickActions.length > 0 ? "Créer un document" : undefined} onAction={quickActions.length > 0 ? () => router.push(quickActions[0].href) : undefined} />
                </div>
              ) : (
                <ul className="divide-y divide-bdr/50">
                  {recentDocs.map((d) => (
                    <li key={d.id}>
                      <button onClick={() => router.push(docHref(d))} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-navy/[0.03] dark:hover:bg-white/5 transition-colors cursor-pointer text-left">
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-navy dark:text-white truncate">{d.num}</span>
                          <span className="block text-[11px] text-txt3 truncate">{typeLabel(d.type)}{d.customerName ? ` • ${d.customerName}` : ""}</span>
                        </span>
                        {d.total > 0 && <span className="text-[13px] font-black text-navy dark:text-white whitespace-nowrap">{fmtNum(d.total)} F</span>}
                        <StatusBadge status={d.status} label={d.status === "DRAFT" ? "Brouillon" : d.status === "EMISE" ? "Finalisée" : d.status === "CONVERTED" ? "Convertie" : d.status === "CANCELLED" ? "Annulée" : d.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="space-y-4">
              <Card className="!p-0 overflow-hidden">
                <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white px-4 sm:px-5 pt-4 pb-3">Livraisons à suivre</h2>
                {pendingBL.length === 0 ? (
                  <p className="text-xs text-txt3 text-center px-4 pb-5">Aucune livraison en attente.</p>
                ) : (
                  <ul className="divide-y divide-bdr/50">
                    {pendingBL.slice(0, 4).map((d) => (
                      <li key={d.id}>
                        <button onClick={() => router.push(`/bl?id=${d.id}`)} className="w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 hover:bg-navy/[0.03] dark:hover:bg-white/5 cursor-pointer text-left">
                          <span className="text-xs font-bold text-navy dark:text-white truncate">{d.num}</span>
                          <StatusBadge status={d.status} label={d.status === "DRAFT" ? "Brouillon" : "Finalisée"} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="!p-0 overflow-hidden">
                <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white px-4 sm:px-5 pt-4 pb-3">Activité récente</h2>
                {activity.length === 0 ? (
                  <p className="text-xs text-txt3 text-center px-4 pb-5">Aucune activité enregistrée.</p>
                ) : (
                  <ul className="px-4 sm:px-5 pb-4 space-y-2.5">
                    {activity.slice(0, 6).map((e) => (
                      <li key={e.id} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block text-[11px] text-txt dark:text-white/80 truncate">{e.action.replace(/_/g, " ").toLowerCase()}</span>
                          <span className="block text-[10px] text-txt3">{relativeTime(e.createdAt)}{e.user ? ` • ${e.user.name}` : ""}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {isTech && (
                <Card className="!p-4 border-gold/30">
                  <div className="flex items-center gap-2 mb-1">
                    <HeartPulse className="w-4 h-4 text-gold" aria-hidden="true" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">État du système</h2>
                  </div>
                  <p className="text-[11px] text-txt2 mb-2">Base de données, authentification et configuration.</p>
                  <button onClick={() => router.push("/gestion")} className="text-xs font-bold text-navy dark:text-gold-lt hover:underline cursor-pointer inline-flex items-center gap-1">
                    Ouvrir la supervision <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </Card>
              )}
            </div>
          </div>

          {/* ── Legend ── */}
          <p className="flex items-center gap-1.5 text-[11px] text-txt3">
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            Le chiffre d&apos;affaires comptabilise les documents finalisés. Les brouillons n&apos;y sont jamais inclus.
          </p>
          {companyOk === false && !can("company.update") && (
            <p className="flex items-center gap-1.5 text-[11px] text-txt3">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              Les informations de l&apos;entreprise sont incomplètes — signalez-le à votre responsable.
            </p>
          )}
          {companyOk === null && (
            <p className="flex items-center gap-1.5 text-[11px] text-txt3">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              Configuration de l&apos;entreprise non vérifiée.
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}
