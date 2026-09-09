"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Erreur lors de la modification");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg via-white to-bg px-4 safe-area-inset">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 rounded-2xl bg-navy mx-auto mb-4 flex items-center justify-center shadow-lg shadow-navy/20">
            <span className="text-gold-lt font-bold text-2xl">KSY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Changer le mot de passe</h1>
          <p className="text-xs text-txt2 mt-1 tracking-wide">
            Vous devez changer votre mot de passe pour continuer
          </p>
        </div>

        <div className="bg-white border border-bdr rounded-xl p-6 sm:p-7 shadow-sm animate-slide-up">
          <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Pour des raisons de sécurité, vous devez définir un nouveau mot de passe.</span>
          </div>

          {error && (
            <div role="alert" className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 text-center animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="current-password" className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">
                Mot de passe actuel
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt2" aria-hidden="true" />
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-required="true"
                  className="w-full pl-9 pr-10 py-2.5 border border-bdr rounded-lg text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-txt2 hover:text-navy transition-colors cursor-pointer"
                  aria-label={showCurrent ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="new-password" className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt2" aria-hidden="true" />
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  aria-required="true"
                  className="w-full pl-9 pr-10 py-2.5 border border-bdr rounded-lg text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-colors"
                  placeholder="Min. 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-txt2 hover:text-navy transition-colors cursor-pointer"
                  aria-label={showNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="confirm-password" className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt2" aria-hidden="true" />
                <input
                  id="confirm-password"
                  type={showNew ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  aria-required="true"
                  className="w-full pl-9 pr-3 py-2.5 border border-bdr rounded-lg text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-colors"
                  placeholder="Retapez le mot de passe"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white border-none px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer hover:bg-navy-l disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Modification...</>
              ) : (
                "Changer le mot de passe"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
