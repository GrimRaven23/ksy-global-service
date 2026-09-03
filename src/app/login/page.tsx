"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpeg" alt="KSY Global Service" className="h-20 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-navy">KSY GLOBAL SERVICE</h1>
          <p className="text-xs text-txt2 mt-1">KNOWLEDGE &bull; SERVICE &bull; YIELD</p>
        </div>

        {/* Login form */}
        <div className="bg-white border border-bdr rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wide mb-4 text-center">Connexion</h2>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-bdr rounded text-xs focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                placeholder="votre@email.com"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-bdr rounded text-xs focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white border-none px-4 py-2.5 rounded text-xs font-semibold cursor-pointer hover:bg-navy-l disabled:opacity-50 transition-colors"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-txt2 mt-4">
          &copy; {new Date().getFullYear()} KSY Global Service. Tous droits r&eacute;serv&eacute;s.
        </p>
      </div>
    </div>
  );
}
