"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Plus, Settings, User, LogOut, Menu, X, ChevronRight,
  ClipboardList, Users, Shield,
} from "lucide-react";
import { Avatar } from "@/components/ui";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/types";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

const NAV_ITEMS: { label: string; href: string; icon: typeof FileText; permission?: Permission; roles?: string[] }[] = [
  { label: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText, permission: "documents.read" },
  { label: "Paramètres", href: "/settings", icon: Settings, permission: "company.read" },
];

const CREATE_ITEMS: { label: string; href: string; permission: Permission }[] = [
  { label: "Pro Forma", href: "/proforma", permission: "proforma.create" },
  { label: "Définitive", href: "/definitive", permission: "proforma.create" },
  { label: "Bon de Livraison", href: "/bl", permission: "delivery.create" },
];

const ADMIN_ITEMS: { label: string; href: string; icon: typeof FileText; permission: Permission }[] = [
  { label: "Gestion", href: "/gestion", icon: Shield, permission: "system.manage" },
  { label: "Utilisateurs", href: "/users", icon: Users, permission: "users.read" },
  { label: "Audit", href: "/audit", icon: ClipboardList, permission: "audit.read" },
];

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    OWNER: "Propriétaire",
    IT_ADMIN: "Admin IT",
    ADMIN: "Administrateur",
    ACCOUNTANT: "Comptable",
    SALES: "Vente",
    PROJECT_MANAGER: "Chef de Projet",
    ASSISTANT: "Assistant",
    DELIVERY: "Livreur",
    WAREHOUSE: "Magasinier",
    COMPLIANCE: "Conformité",
    VIEWER: "Lecteur",
  };
  return labels[role] || role;
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((me) => {
        if (!me.user) {
          router.push("/login");
          return;
        }
        setUser(me.user);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const userPerms: Permission[] = user ? ROLE_PERMISSIONS[user.role] || [] : [];
  const can = (p: Permission) => userPerms.includes(p);
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-bg">
        <header className="bg-white border-b border-bdr/60 h-14" />
        <div className="h-16" />
      </div>
    );
  }

  const visibleNav = NAV_ITEMS.filter((item) => !item.permission || can(item.permission));
  const visibleCreate = CREATE_ITEMS.filter((item) => can(item.permission));
  const visibleAdmin = ADMIN_ITEMS.filter((item) => can(item.permission));

  return (
    <div className="min-h-screen bg-bg">
      {!hideNav && (
        <>
          {/* ── Desktop Header ── */}
          <header className="bg-white border-b border-bdr/60 sticky top-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <button onClick={() => router.push("/")} className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg gradient-navy flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-gold-lt font-bold text-xs">KSY</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-sm font-bold text-navy leading-tight group-hover:text-navy-l transition-colors">KSY GLOBAL SERVICE</h1>
              <p className="text-[9px] text-txt3 leading-tight">KNOWLEDGE • SERVICE • YIELD</p>
            </div>
          </button>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5" aria-label="Navigation principale">
            {visibleNav.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive(item.href)
                    ? "bg-navy text-white shadow-sm"
                    : "text-txt2 hover:bg-gray-50 hover:text-navy"
                }`}
              >
                {item.label}
              </button>
            ))}
            {visibleCreate.length > 0 && (
              <div className="relative group">
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-gold bg-gold/8 hover:bg-gold/15 transition-all cursor-pointer flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Créer
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white border border-bdr/60 rounded-xl shadow-lg py-1 min-w-[180px] hidden group-hover:block z-50">
                  {visibleCreate.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="w-full text-left px-3 py-2 text-xs text-txt hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {visibleAdmin.length > 0 && (
              <div className="relative group">
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-txt2 hover:bg-gray-50 transition-all cursor-pointer flex items-center gap-1">
                  Admin <ChevronRight className="w-3 h-3 rotate-90" />
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white border border-bdr/60 rounded-xl shadow-lg py-1 min-w-[180px] hidden group-hover:block z-50">
                  {visibleAdmin.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="w-full text-left px-3 py-2 text-xs text-txt hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* User area */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/account")}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Avatar name={user.name} size="sm" />
              <div className="text-right hidden lg:block">
                <p className="text-xs font-semibold text-navy leading-tight">{greeting()}, {user.name.split(" ")[0]}</p>
                <p className="text-[9px] text-txt3 leading-tight">{roleLabel(user.role)}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-txt3 hover:bg-red/5 hover:text-red transition-colors cursor-pointer"
              title="Déconnexion"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Header ── */}
      <header className="bg-white border-b border-bdr/60 sticky top-0 z-50 md:hidden">
        <div className="px-4 flex items-center justify-between h-12">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-lg gradient-navy flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-gold-lt font-bold text-[10px]">KSY</span>
            </div>
            <span className="text-xs font-bold text-navy">KSY GLOBAL SERVICE</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push("/account")}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Mon compte"
            >
              <Avatar name={user.name} size="sm" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-navy" /> : <Menu className="w-5 h-5 text-navy" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="border-t border-bdr/60 bg-white animate-slide-up">
            <nav className="px-3 py-2 space-y-0.5" aria-label="Navigation mobile">
              {visibleNav.map((item) => (
                <button
                  key={item.href}
                  onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive(item.href)
                      ? "bg-navy text-white"
                      : "text-txt hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              {visibleCreate.length > 0 && (
                <>
                  <div className="pt-2 pb-1 px-3 text-[10px] font-semibold text-txt3 uppercase tracking-wider">Créer</div>
                  {visibleCreate.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-txt hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-gold" />
                      {item.label}
                    </button>
                  ))}
                </>
              )}
              {visibleAdmin.length > 0 && (
                <>
                  <div className="pt-2 pb-1 px-3 text-[10px] font-semibold text-txt3 uppercase tracking-wider">Administration</div>
                  {visibleAdmin.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-txt hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </>
              )}
              <div className="pt-2 border-t border-bdr/60">
                <button
                  onClick={() => { router.push("/account"); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-txt hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Mon compte
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red hover:bg-red/5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
        </>
      )}

      {/* ── Main content ── */}
      <main id="main-content" className="flex-1">{children}</main>

      {!hideNav && (
        <>
          {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-bdr/60 z-50 pb-safe" aria-label="Navigation mobile">
        <div className="flex items-center justify-around h-14">
          <button
            onClick={() => router.push("/")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer min-w-0 transition-colors ${
              isActive("/") ? "text-navy" : "text-txt3"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Accueil</span>
          </button>
          <button
            onClick={() => router.push("/documents")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer min-w-0 transition-colors ${
              isActive("/documents") ? "text-navy" : "text-txt3"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Documents</span>
          </button>
          {visibleCreate.length > 0 && (
            <button
              onClick={() => router.push(visibleCreate[0].href)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer min-w-0 text-gold"
            >
              <div className="w-10 h-10 -mt-5 gradient-navy rounded-full flex items-center justify-center shadow-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-[9px] font-semibold">Créer</span>
            </button>
          )}
          <button
            onClick={() => router.push(visibleAdmin.length > 0 ? visibleAdmin[0].href : "/settings")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer min-w-0 transition-colors ${
              isActive("/settings") || isActive("/gestion") || isActive("/users") || isActive("/audit") ? "text-navy" : "text-txt3"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Menu</span>
          </button>
          <button
            onClick={() => router.push("/account")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer min-w-0 transition-colors ${
              isActive("/account") ? "text-navy" : "text-txt3"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Compte</span>
          </button>
        </div>
      </nav>

      {/* Spacer for bottom nav on mobile */}
      <div className="h-14 md:hidden" />
        </>
      )}
    </div>
  );
}
