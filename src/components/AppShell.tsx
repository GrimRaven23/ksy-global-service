"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Receipt, Truck, Users, ClipboardList, ShieldCheck,
  Building2, UserRound, LogOut, Menu, X, Plus, HeartPulse, RefreshCw,
} from "lucide-react";
import { Avatar, ThemeSwitcher, OfflineBanner } from "@/components/ui";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/types";
import { roleLabel } from "@/lib/document-helpers";
import { csrfFetch } from "@/lib/csrf";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof FileText;
  permission?: Permission;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Pilotage",
    items: [{ label: "Tableau de bord", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "Factures",
    items: [
      { label: "Pro Forma", href: "/proforma", icon: FileText, permission: "proforma.create" },
      { label: "Définitive", href: "/definitive", icon: Receipt, permission: "documents.read" },
      { label: "Tous documents", href: "/documents", icon: FileText, permission: "documents.read" },
    ],
  },
  {
    title: "Livraison",
    items: [{ label: "Bons de livraison", href: "/bl", icon: Truck, permission: "delivery.read" }],
  },
  {
    title: "Clients",
    items: [{ label: "Clients", href: "/customers", icon: Users, permission: "customers.read" }],
  },
  {
    title: "Administration",
    items: [
      { label: "Équipe et accès", href: "/users", icon: ShieldCheck, permission: "users.read" },
      { label: "Audit", href: "/audit", icon: ClipboardList, permission: "audit.read" },
      { label: "Supervision", href: "/gestion", icon: HeartPulse, permission: "system.manage" },
    ],
  },
  {
    title: "Paramètres",
    items: [
      { label: "Entreprise", href: "/settings", icon: Building2, permission: "company.read" },
      { label: "Mon compte", href: "/account", icon: UserRound },
    ],
  },
];

const QUICK_CREATE: { label: string; href: string; permission: Permission }[] = [
  { label: "Pro Forma", href: "/proforma", permission: "proforma.create" },
  { label: "Définitive", href: "/definitive", permission: "documents.create" },
  { label: "Bon de livraison", href: "/bl", permission: "delivery.create" },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function AppShell({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const [health, setHealth] = useState<"ok" | "degraded" | "unknown">("unknown");

  const loadUser = useCallback(() => {
    setLoading(true);
    csrfFetch("/api/auth/me")
      .then((r) => r.json())
      .then((me) => {
        if (!me.user) { router.push("/login"); return; }
        setUser(me.user);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    csrfFetch("/api/health")
      .then((r) => r.json())
      .then((h) => setHealth(h.status === "healthy" ? "ok" : "degraded"))
      .catch(() => setHealth("degraded"));
  }, [user]);

  const handleLogout = async () => {
    await csrfFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const userPerms: Permission[] = user ? ROLE_PERMISSIONS[user.role] || [] : [];
  const can = (p?: Permission) => !p || userPerms.includes(p);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const canSeeHealth = userPerms.includes("system.manage");

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-bg" role="status" aria-label="Chargement de la session">
        <div className="animate-pulse flex">
          <div className="hidden md:block w-64 bg-navy/90 min-h-screen" />
          <div className="flex-1 p-6 space-y-4">
            <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" />
            <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />
            <div className="h-40 bg-gray-100 dark:bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const sections = NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => can(i.permission)) })).filter(
    (s) => s.items.length > 0
  );
  const quickCreate = QUICK_CREATE.filter((q) => can(q.permission));

  const sidebarBody = (
    <div className="flex flex-col h-full">
      <button onClick={() => { router.push("/"); setMobileOpen(false); }} className="flex items-center gap-3 px-5 pt-6 pb-5 cursor-pointer text-left group">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold to-gold-lt flex items-center justify-center shadow-lg shadow-black/30 shrink-0 group-hover:scale-105 transition-transform">
          <span className="text-navy font-black text-sm">KSY</span>
        </span>
        <span>
          <span className="block text-[13px] font-black tracking-wide text-white leading-tight">KSY GLOBAL SERVICE</span>
          <span className="block text-[9px] tracking-[0.22em] text-gold-lt/80 uppercase mt-0.5">Knowledge • Service • Yield</span>
        </span>
      </button>

      <div aria-hidden="true" className="mx-5 mb-4 flex items-center gap-2">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-gold/50" />
        <span className="w-1.5 h-1.5 rotate-45 bg-gold/70" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/50 to-gold/50" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5" aria-label="Navigation principale">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => { router.push(item.href); setMobileOpen(false); }}
                      aria-current={active ? "page" : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                        active
                          ? "bg-gold text-navy shadow-md shadow-black/20"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {quickCreate.length > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-lt/80 mb-2 px-1">Créer</p>
            <div className="space-y-1">
              {quickCreate.map((q) => (
                <button
                  key={q.href}
                  onClick={() => { router.push(q.href); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-navy hover:bg-gold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-white/10">
        <button onClick={() => { router.push("/account"); setMobileOpen(false); }} className="w-full flex items-center gap-2.5 rounded-xl p-2 hover:bg-white/10 transition-colors cursor-pointer text-left">
          <Avatar name={user.name} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-white truncate">{greeting()}, {user.name.split(" ")[0]}</span>
            <span className="block text-[10px] text-white/50 truncate">{user.email} • {roleLabel(user.role)}</span>
          </span>
        </button>
        <button onClick={handleLogout} className="mt-1 w-full flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {offline && <OfflineBanner />}
      {!hideNav && health === "degraded" && (
        <div role="alert" className="flex items-center justify-center gap-2 bg-red text-white text-xs font-semibold px-4 py-2">
          <span>Le service rencontre des difficultés.</span>
          {canSeeHealth ? (
            <button onClick={() => router.push("/gestion")} className="underline underline-offset-2 cursor-pointer">Voir la supervision</button>
          ) : (
            <span className="opacity-80">Réessayez dans un instant ou contactez l&apos;administrateur.</span>
          )}
        </div>
      )}

      <div className="md:flex md:items-stretch">
        {!hideNav && (
          <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen gradient-navy shadow-xl z-40">
            {sidebarBody}
          </aside>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          {!hideNav && (
            <header className="md:hidden sticky top-0 z-50 bg-navy text-white shadow-md">
              <div className="px-4 flex items-center justify-between h-13 py-2.5">
                <button onClick={() => router.push("/")} className="flex items-center gap-2 cursor-pointer" aria-label="Accueil KSY">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-gold-lt flex items-center justify-center shrink-0">
                    <span className="text-navy font-black text-[10px]">KSY</span>
                  </span>
                  <span className="text-xs font-black tracking-wide">KSY GLOBAL SERVICE</span>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => router.push("/account")} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer" aria-label="Mon compte">
                    <Avatar name={user.name} size="sm" />
                  </button>
                  <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                    aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
                    aria-expanded={mobileOpen}
                  >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {mobileOpen && (
                <div className="max-h-[70vh] overflow-y-auto border-t border-white/10 animate-slide-up">{sidebarBody}</div>
              )}
            </header>
          )}

          {!hideNav && (
            <div className="hidden md:flex items-center justify-between gap-3 px-6 lg:px-8 h-14 bg-white/70 dark:bg-surface/70 backdrop-blur border-b border-bdr/60 sticky top-0 z-30">
              <p className="text-xs text-txt2 truncate">
                Connecté en tant que <strong className="text-navy dark:text-white">{user.name}</strong>
                <span className="text-txt3"> — {user.email} • {roleLabel(user.role)}</span>
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {health !== "unknown" && (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${health === "ok" ? "bg-green-bg text-green-700 dark:text-green-300 ring-green/25" : "bg-red-bg text-red ring-red/25"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${health === "ok" ? "bg-green animate-pulse" : "bg-red"}`} />
                    {health === "ok" ? "Système opérationnel" : "Incident en cours"}
                  </span>
                )}
                <ThemeSwitcher compact />
                <button
                  onClick={loadUser}
                  className="p-1.5 rounded-lg text-txt3 hover:text-navy hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
                  title="Actualiser la session"
                  aria-label="Actualiser la session"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <main id="main-content" className="flex-1 min-w-0">{children}</main>

          {!hideNav && (
            <>
              <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy text-white border-t border-gold/20 z-50 pb-safe" aria-label="Navigation mobile">
                <div className="flex items-center justify-around h-14">
                  {[
                    { href: "/", label: "Accueil" },
                    { href: "/documents", label: "Docs" },
                    { href: "/bl", label: "BL" },
                    { href: "/account", label: "Compte" },
                  ].map((l) => (
                    <button
                      key={l.href}
                      onClick={() => router.push(l.href)}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className={`px-3 py-1 text-[10px] font-bold cursor-pointer ${isActive(l.href) ? "text-gold-lt" : "text-white/60"}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </nav>
              <div className="h-14 md:hidden" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
