"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        const userData = data.data || data;
        if (userData.mustChangePassword) {
          router.push("/change-password");
        } else {
          router.push("/");
        }
        router.refresh();
      } else {
        setError(data.error || "Identifiants incorrects");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg dark:bg-[#0f1117] safe-area-inset">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 gradient-navy relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-gold/30" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border-2 border-gold/20" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full border border-gold/15" />
        </div>
        <div className="relative z-10 text-center px-12 max-w-md">
          <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mx-auto mb-8 flex items-center justify-center">
            <span className="text-gold-lt font-bold text-3xl">KSY</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">KSY GLOBAL SERVICE</h1>
          <p className="text-gold-lt/80 text-sm tracking-[0.2em] uppercase mb-8">Knowledge • Service • Yield</p>
          <div className="space-y-4 text-left">
            {[
              { icon: Shield, text: "Sécurité renforcée pour vos données" },
              { icon: Shield, text: "Gestion complète de vos documents" },
              { icon: Shield, text: "Suivi des livraisons en temps réel" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70 text-sm">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-gold-lt" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden animate-slide-up">
            <div className="w-16 h-16 rounded-2xl gradient-navy mx-auto mb-4 flex items-center justify-center shadow-lg shadow-navy/20">
              <span className="text-gold-lt font-bold text-xl">KSY</span>
            </div>
            <h1 className="text-lg font-bold text-navy dark:text-white">KSY GLOBAL SERVICE</h1>
            <p className="text-[10px] text-txt2 mt-1 tracking-[0.15em] uppercase">Knowledge • Service • Yield</p>
          </div>

          <div className="bg-white dark:bg-surface border border-bdr/60 rounded-2xl p-6 sm:p-8 shadow-sm animate-slide-up">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-navy dark:text-white">Bienvenue</h2>
              <p className="text-xs text-txt2 mt-1">Connectez-vous à votre espace de travail</p>
            </div>

            {error && (
              <div role="alert" className="mb-4 px-3.5 py-2.5 bg-red-bg border border-red/20 rounded-lg text-xs text-red text-center animate-slide-up">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="login-email" className="block text-[11px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt3" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    aria-required="true"
                    className="w-full pl-10 pr-3 py-2.5 border border-bdr rounded-lg text-sm bg-bg dark:bg-white/5 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-colors placeholder:text-txt3"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label htmlFor="login-password" className="block text-[11px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt3" aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    aria-required="true"
                    className="w-full pl-10 pr-10 py-2.5 border border-bdr rounded-lg text-sm bg-bg dark:bg-white/5 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-colors placeholder:text-txt3"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-txt3 hover:text-navy dark:hover:text-gold transition-colors cursor-pointer"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-navy text-white border-none px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-navy/20"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Connexion...</> : "Se connecter"}
              </button>
            </form>
          </div>

          <p className="text-center text-[10px] text-txt3 mt-6">
            © {new Date().getFullYear()} KSY Global Service. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
