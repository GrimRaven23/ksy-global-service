"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, Lock, Shield, Trash2, Clock, UserX, UserCheck, User } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, Field, Button, SectionTitle, Badge, Skeleton, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { roleLabel, roleColor, relativeTime } from "@/lib/document-helpers";

const ALL_ROLES = ["OWNER", "IT_ADMIN", "ADMIN", "ACCOUNTANT", "SALES", "ASSISTANT", "PROJECT_MANAGER", "DELIVERY", "WAREHOUSE", "COMPLIANCE", "VIEWER"] as const;

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  recentAudit?: { id: string; action: string; entityType: string; details: unknown; createdAt: string }[];
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const { confirm } = useConfirm();
  const userId = params.id as string;

  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch(`/api/users/${userId}`).then((r) => r.json()),
    ])
      .then(([me, data]) => {
        if (!me.user) { router.push("/login"); return; }
        setCurrentUser(me.user);
        if (data.error) { toast.error(data.error); router.push("/users"); return; }
        setTargetUser(data);
        setName(data.name);
        setEmail(data.email);
        setRole(data.role);
        setStatus(data.status);
        setLoading(false);
      })
      .catch(() => { router.push("/login"); });
  }, [userId, router, toast]);

  const canEditRole = currentUser && (
    currentUser.role === "OWNER" ||
    (currentUser.role === "IT_ADMIN" && targetUser?.role !== "OWNER")
  );

  const canResetPassword = currentUser && (
    currentUser.role === "OWNER" ||
    (currentUser.role === "IT_ADMIN" && targetUser?.role !== "OWNER")
  );

  const canDelete = currentUser?.role === "OWNER";
  const isSelf = currentUser && targetUser && userId === (currentUser as unknown as { id: string }).id;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTargetUser((prev) => prev ? { ...prev, ...updated } : null);
        toast.success("Utilisateur mis à jour");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSaving(false);
  };

  const handleToggleStatus = async () => {
    if (!targetUser) return;
    const newStatus = targetUser.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const action = newStatus === "DISABLED" ? "désactiver" : "réactiver";
    const ok = await confirm(`Voulez-vous ${action} ce compte ?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTargetUser((prev) => prev ? { ...prev, status: newStatus } : null);
        setStatus(newStatus);
        toast.success(`Compte ${action}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleResetPassword = async () => {
    setResettingPassword(true);
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setTempPassword(data.tempPassword);
        setShowResetPassword(true);
        toast.success("Mot de passe réinitialisé");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la réinitialisation");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setResettingPassword(false);
  };

  const handleDelete = async () => {
    const ok = await confirm("Supprimer définitivement ce compte ? Cette action est irréversible.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Compte supprimé");
        router.push("/users");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  return (
    <AppShell>
      <PageHeader title="Détail utilisateur" backHref="/users" />

      <div className="max-w-3xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-5">
        {loading ? (
          <>
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </>
        ) : !targetUser ? null : (
          <>
            <Card>
              <SectionTitle icon={<User className="w-3 h-3" />}>Informations</SectionTitle>
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-navy flex items-center justify-center shrink-0">
                    <span className="text-gold-lt font-bold text-lg sm:text-xl">{targetUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-navy">{targetUser.name}</h2>
                    <p className="text-xs sm:text-sm text-txt2">{targetUser.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge color={roleColor(targetUser.role)}>{roleLabel(targetUser.role)}</Badge>
                      <Badge color={targetUser.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {targetUser.status === "ACTIVE" ? "Actif" : "Désactivé"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-txt2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Dernière connexion : {targetUser.lastLoginAt ? relativeTime(targetUser.lastLoginAt) : "Jamais"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Membre depuis : {relativeTime(targetUser.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle icon={<User className="w-3 h-3" />}>Modifier</SectionTitle>
              <div className="p-4 sm:p-5 space-y-3">
                <Field label="Nom complet" value={name} onChange={setName} />
                <Field label="Email" type="email" value={email} onChange={setEmail} />
                {canEditRole && (
                  <Select label="Rôle" value={role} onChange={setRole} options={ALL_ROLES.map((r) => ({ value: r, label: roleLabel(r) }))} />
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                    <Save className="w-3.5 h-3.5" /> Sauvegarder
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle icon={<Lock className="w-3 h-3" />}>Actions</SectionTitle>
              <div className="p-4 sm:p-5 space-y-3">
                {canResetPassword && !isSelf && (
                  <div className="flex flex-col sm:flex-row items-start gap-3">
                    <Button variant="outline" size="sm" loading={resettingPassword} onClick={handleResetPassword}>
                      <Lock className="w-3.5 h-3.5" /> Réinitialiser le mot de passe
                    </Button>
                    {showResetPassword && tempPassword && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs flex-1">
                        <p className="font-semibold text-yellow-800 mb-1">Nouveau mot de passe temporaire :</p>
                        <code className="bg-white px-2 py-1 rounded border font-mono text-sm">{tempPassword}</code>
                        <p className="text-yellow-700 mt-1">Communiquez ce mot de passe {"à"} l&apos;utilisateur. Il devra le changer {"à"} sa prochaine connexion.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {!isSelf && targetUser.status === "ACTIVE" && (
                    <Button variant="danger" size="sm" onClick={handleToggleStatus}>
                      <UserX className="w-3.5 h-3.5" /> Désactiver le compte
                    </Button>
                  )}
                  {!isSelf && targetUser.status === "DISABLED" && (
                    <Button variant="primary" size="sm" onClick={handleToggleStatus}>
                      <UserCheck className="w-3.5 h-3.5" /> Réactiver le compte
                    </Button>
                  )}
                  {canDelete && !isSelf && (
                    <Button variant="danger" size="sm" onClick={handleDelete}>
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer le compte
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {targetUser.recentAudit && targetUser.recentAudit.length > 0 && (
              <Card>
                <SectionTitle icon={<Clock className="w-3 h-3" />}>Activité récente</SectionTitle>
                <div className="p-4 sm:p-5 space-y-2">
                  {targetUser.recentAudit.map((e) => (
                    <div key={e.id} className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-navy/30 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-navy">{e.action.replace(/_/g, " ").toLowerCase()}</span>
                        <span className="text-txt2 ml-2">{relativeTime(e.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
