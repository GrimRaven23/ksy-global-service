"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, ClipboardList, Shield, BarChart3, FileText, Truck } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, Badge, Skeleton, EmptyState, PageHeader } from "@/components/ui";
import { roleLabel } from "@/lib/document-helpers";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Stats {
  totalDocuments: number;
  totalDeliveryNotes: number;
  totalUsers: number;
  totalRevenue: number;
}

interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user?: { name: string } | null;
  details?: Record<string, unknown> | null;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHr < 24) return `Il y a ${diffHr}h`;
  if (diffDay < 7) return `Il y a ${diffDay}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function auditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    LOGIN_SUCCESS: "Connexion réussie",
    LOGIN_FAILURE: "Tentative de connexion échouée",
    LOGOUT: "Déconnexion",
    USER_CREATED: "Utilisateur créé",
    USER_DISABLED: "Utilisateur désactivé",
    USER_ENABLED: "Utilisateur activé",
    USER_UPDATED: "Utilisateur modifié",
    USER_DELETED: "Utilisateur supprimé",
    PASSWORD_CHANGED: "Mot de passe modifié",
    ROLE_CHANGED: "Rôle modifié",
    COMPANY_SETTINGS_UPDATED: "Paramètres entreprise modifiés",
    DOCUMENT_CREATED: "Document créé",
    DOCUMENT_UPDATED: "Document modifié",
    DOCUMENT_PRINTED: "Document imprimé",
    DOCUMENT_FINALIZED: "Document finalisé",
    DOCUMENT_CONVERTED: "Document converti (PF→DF)",
    DOCUMENT_CANCELLED: "Document annulé",
    DOCUMENT_DELETED: "Document supprimé",
    DELIVERY_NOTE_CREATED: "Bon de livraison créé",
    DELIVERY_NOTE_UPDATED: "Bon de livraison modifié",
    DELIVERY_NOTE_PRINTED: "Bon de livraison imprimé",
    DELIVERY_NOTE_CONFIRMED: "Bon de livraison confirmé",
    DELIVERY_NOTE_DELETED: "Bon de livraison supprimé",
    CUSTOMER_CREATED: "Client créé",
    CUSTOMER_UPDATED: "Client modifié",
    CUSTOMER_DELETED: "Client supprimé",
  };
  return labels[action] || action.replace(/_/g, " ").toLowerCase();
}

function auditActionColor(action: string): string {
  if (action.startsWith("LOGIN") || action === "LOGOUT") return "bg-blue-100 text-blue-700";
  if (action.startsWith("USER") || action === "ROLE_CHANGED" || action === "PASSWORD_CHANGED") return "bg-purple-100 text-purple-700";
  if (action.startsWith("DOCUMENT")) return "bg-green-100 text-green-700";
  if (action.startsWith("DELIVERY")) return "bg-orange-100 text-orange-700";
  if (action.startsWith("CUSTOMER")) return "bg-teal-100 text-teal-700";
  if (action.startsWith("COMPANY")) return "bg-gold/20 text-navy";
  return "bg-gray-100 text-gray-600";
}

export default function GestionPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAudit, setRecentAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/dashboard/stats").then((r) => r.json()).catch(() => null),
      fetch("/api/users").then((r) => r.json()).catch(() => []),
      fetch("/api/audit?limit=10").then((r) => r.json()).catch(() => ({ events: [] })),
    ]).then(([me, st, users, audit]) => {
      if (!me.user) { router.push("/login"); return; }
      if (me.user.role !== "OWNER" && me.user.role !== "IT_ADMIN" && me.user.role !== "ADMIN") {
        router.push("/");
        return;
      }
      setUser(me.user);
      const usersArr = Array.isArray(users) ? users : [];
      setStats({
        totalDocuments: st?.totalDocuments || 0,
        totalDeliveryNotes: st?.totalDeliveryNotes || 0,
        totalUsers: usersArr.length,
        totalRevenue: st?.totalRevenue || 0,
      });
      setRecentAudit(audit.events || []);
      setLoading(false);
    }).catch(() => { router.push("/login"); });
  }, [router]);

  const managementSections = [
    {
      title: "Paramètres de l'entreprise",
      desc: "Nom, adresse, banque, TVA, identifiants officiels",
      icon: Building2,
      href: "/settings",
      color: "bg-navy/5 text-navy",
      access: "Tous les rôles",
    },
    {
      title: "Gestion des utilisateurs",
      desc: "Créer, modifier, activer/désactiver les comptes",
      icon: Users,
      href: "/users",
      color: "bg-blue-50 text-blue-600",
      access: "OWNER, IT_ADMIN, ADMIN",
    },
    {
      title: "Journal d'audit",
      desc: "Consultez toutes les actions effectuées dans le système",
      icon: ClipboardList,
      href: "/audit",
      color: "bg-purple-50 text-purple-600",
      access: "OWNER, IT_ADMIN, ADMIN",
    },
    {
      title: "Tous les documents",
      desc: "Gérer les factures et bons de livraison",
      icon: FileText,
      href: "/documents",
      color: "bg-green-50 text-green-600",
      access: "Selon le rôle",
    },
    {
      title: "Tableau de bord",
      desc: "Vue d'ensemble des activités récentes",
      icon: BarChart3,
      href: "/",
      color: "bg-amber-50 text-amber-600",
      access: "Tous les rôles",
    },
  ];

  return (
    <AppShell>
      <PageHeader title="Gestion de l'entreprise" backHref="/" />

      <div className="max-w-6xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-5">
        {loading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Documents", value: stats.totalDocuments, icon: FileText, color: "text-navy" },
                  { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
                  { label: "Livraisons", value: stats.totalDeliveryNotes, icon: Truck, color: "text-orange-600" },
                  { label: "Revenus", value: `${new Intl.NumberFormat("fr-FR").format(stats.totalRevenue)} FCFA`, icon: BarChart3, color: "text-green-600" },
                ].map((s) => (
                  <Card key={s.label} shadow className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${s.color}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-lg font-bold text-navy truncate">{s.value}</p>
                      <p className="text-[9px] sm:text-[10px] text-txt2 uppercase tracking-wide">{s.label}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-[10px] sm:text-xs font-bold text-navy uppercase tracking-wide mb-3">Accès rapide</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {managementSections.map((s) => (
                  <button
                    key={s.href}
                    onClick={() => router.push(s.href)}
                    className="bg-white border border-bdr rounded-xl p-4 sm:p-5 text-left hover:border-navy/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${s.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <s.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-navy mb-1">{s.title}</h3>
                    <p className="text-[10px] sm:text-[11px] text-txt2 mb-2">{s.desc}</p>
                    <p className="text-[9px] text-txt2/60 uppercase tracking-wide">{s.access}</p>
                  </button>
                ))}
              </div>
            </div>

            <Card>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-3 h-3 text-navy" />
                <h2 className="text-[10px] font-bold uppercase tracking-wide text-navy">Activité récente</h2>
              </div>
              {recentAudit.length === 0 ? (
                <EmptyState icon={<ClipboardList className="w-8 h-8" />} message="Aucune activité récente" />
              ) : (
                <div className="space-y-2">
                  {recentAudit.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 sm:gap-3 py-1.5 border-b border-bdr/50 last:border-0">
                      <Badge color={auditActionColor(e.action)}>{auditActionLabel(e.action)}</Badge>
                      <span className="text-[9px] sm:text-[10px] text-txt2 flex-1 truncate">
                        {e.entityType}
                        {e.user ? ` • ${e.user.name}` : ""}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-txt2 whitespace-nowrap">{relativeTime(e.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
