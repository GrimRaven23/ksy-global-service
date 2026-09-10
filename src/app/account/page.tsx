"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Lock, User, Shield, Clock } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, Field, Button, SectionTitle, Badge, Skeleton, PageHeader } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { roleLabel, roleColor, relativeTime } from "@/lib/document-helpers";
import { csrfFetch } from "@/lib/csrf";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt?: string;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    csrfFetch("/api/auth/me")
      .then((r) => r.json())
      .then((me) => {
        if (!me.user) { router.push("/login"); return; }
        setUser(me.user);
        setName(me.user.name);
        setEmail(me.user.email);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await csrfFetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser((prev) => prev ? { ...prev, name: updated.name, email: updated.email } : null);
        toast.success("Profil mis à jour");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await csrfFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast.success("Mot de passe modifié avec succès");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors du changement de mot de passe");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setChangingPassword(false);
  };

  return (
    <AppShell>
      <PageHeader title="Mon compte" backHref="/" />

      <div className="max-w-3xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-5">
        {loading ? (
          <>
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </>
        ) : !user ? null : (
          <>
            <Card>
              <SectionTitle icon={<User className="w-3 h-3" />}>Informations du compte</SectionTitle>
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-navy flex items-center justify-center shrink-0">
                    <span className="text-gold-lt font-bold text-lg sm:text-xl">{user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-navy dark:text-white">{user.name}</h2>
                    <p className="text-xs sm:text-sm text-txt2">{user.email}</p>
                    <Badge color={roleColor(user.role)}>{roleLabel(user.role)}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-xs text-txt2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Dernière connexion : {user.lastLoginAt ? relativeTime(user.lastLoginAt) : "Jamais"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-txt2">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Membre depuis : {relativeTime(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle icon={<User className="w-3 h-3" />}>Modifier le profil</SectionTitle>
              <div className="p-4 sm:p-5 space-y-3">
                <Field label="Nom complet" value={name} onChange={setName} placeholder="Votre nom" />
                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="votre@email.com" />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" loading={saving} onClick={handleUpdateProfile}>
                    <Save className="w-3.5 h-3.5" /> Sauvegarder
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle icon={<Lock className="w-3 h-3" />}>Changer le mot de passe</SectionTitle>
              <div className="p-4 sm:p-5 space-y-3">
                <Field
                  label="Mot de passe actuel"
                  type="password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Votre mot de passe actuel"
                />
                <Field
                  label="Nouveau mot de passe"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Minimum 8 caractères"
                  helpText="Au moins 8 caractères"
                />
                <Field
                  label="Confirmer le mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirmez le nouveau mot de passe"
                  error={confirmPassword && newPassword !== confirmPassword ? "Les mots de passe ne correspondent pas" : undefined}
                />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" loading={changingPassword} onClick={handleChangePassword}>
                    <Lock className="w-3.5 h-3.5" /> Modifier le mot de passe
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
