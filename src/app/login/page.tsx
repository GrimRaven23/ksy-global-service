"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

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
        router.push("/");
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
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-navy mx-auto mb-3 flex items-center justify-center shadow-lg">
            <span className="text-gold-lt font-bold text-xl">KSY</span>
          </div>
          <h1 className="text-xl font-bold text-navy">KSY GLOBAL SERVICE</h1>
          <p className="text-xs text-txt2 mt-1">KNOWLEDGE • SERVICE • YIELD</p>
        </div>

        <div className="bg-white border border-bdr rounded-xl p-6 shadow-sm animate-slide-up">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wide mb-4 text-center">Connexion</h2>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 text-center animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-8 pr-3 py-2 border border-bdr rounded-lg text-xs focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-colors"
                  placeholder="votre@email.com"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-8 pr-9 py-2 border border-bdr rounded-lg text-xs focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt2 hover:text-navy transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white border-none px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-navy-l disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connexion...</> : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-txt2 mt-4">
          © {new Date().getFullYear()} KSY Global Service. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
