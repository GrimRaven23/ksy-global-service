"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Building2, Phone, Shield, Landmark, Settings } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, SectionTitle, Field, Select, Button, Skeleton, PageHeader } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useDebounce } from "@/lib/hooks";
import { csrfFetch } from "@/lib/csrf";

interface Company {
  name: string; slogan: string; activite: string; address: string; city: string;
  phone: string; phone2: string; email: string; web: string;
  rccm: string; ninea: string; ifu: string;
  bank: string; bkName: string; iban: string; swift: string; compte: string;
  tvaDefault: string; tvaRate: number; currency: string;
}

const DEFAULT: Company = {
  name: "", slogan: "", activite: "", address: "", city: "",
  phone: "", phone2: "", email: "", web: "",
  rccm: "", ninea: "", ifu: "",
  bank: "", bkName: "", iban: "", swift: "", compte: "",
  tvaDefault: "non", tvaRate: 18, currency: "XOF",
};

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [company, setCompany] = useState<Company>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const isDirty = useRef(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    Promise.all([
      csrfFetch("/api/auth/me").then((r) => r.json()),
      csrfFetch("/api/settings").then((r) => r.json()),
    ]).then(([me, data]) => {
      if (!me.user) { router.push("/login"); return; }
      if (data && !data.error) setCompany({ ...DEFAULT, ...data });
      setTimeout(() => { isInitialLoad.current = false; }, 100);
      setLoading(false);
    }).catch(() => { router.push("/login"); });
  }, [router]);

  const save = useCallback(async (data: Company) => {
    try {
      const res = await csrfFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        isDirty.current = false;
        setLastSaved(new Date().toLocaleTimeString("fr-FR"));
      } else {
        const body = await res.json().catch(() => null);
        if (body?.error) toast.error(body.error);
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }, [toast]);

  const autoSave = useDebounce((data: Company) => {
    if (!isDirty.current || isInitialLoad.current) return;
    save(data);
  }, 1500);

  const update = (key: keyof Company, value: string | number) => {
    isDirty.current = true;
    setCompany((prev) => {
      const next = { ...prev, [key]: value };
      autoSave(next);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await save(company);
    setSaving(false);
    toast.success("Paramètres enregistrés");
  };

  return (
    <AppShell>
      <PageHeader title="Paramètres de l'entreprise" backHref="/">
        {lastSaved && <span className="text-[10px] sm:text-[11px] text-txt2 hidden sm:block">Sauvegardé à {lastSaved}</span>}
        <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
          <Save className="w-4 h-4" /> <span className="hidden sm:inline">Enregistrer</span>
        </Button>
      </PageHeader>

      <div className="max-w-5xl mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <SectionTitle icon={<Building2 className="w-3 h-3" />}>Identité</SectionTitle>
              <Field label="Nom" value={company.name} onChange={(v) => update("name", v)} required />
              <Field label="Slogan" value={company.slogan} onChange={(v) => update("slogan", v)} />
              <Field label="Activité" value={company.activite} onChange={(v) => update("activite", v)} />
            </Card>

            <Card>
              <SectionTitle icon={<Phone className="w-3 h-3" />}>Coordonnées</SectionTitle>
              <Field label="Adresse" value={company.address} onChange={(v) => update("address", v)} />
              <Field label="Ville" value={company.city} onChange={(v) => update("city", v)} />
              <Field label="Téléphone" value={company.phone} onChange={(v) => update("phone", v)} type="tel" />
              <Field label="Téléphone 2" value={company.phone2} onChange={(v) => update("phone2", v)} type="tel" />
              <Field label="Email" value={company.email} onChange={(v) => update("email", v)} type="email" />
              <Field label="Site web" value={company.web} onChange={(v) => update("web", v)} placeholder="https://..." />
            </Card>

            <Card>
              <SectionTitle icon={<Shield className="w-3 h-3" />}>Identifiants officiels</SectionTitle>
              <Field label="RCCM" value={company.rccm} onChange={(v) => update("rccm", v)} helpText="Registre du Commerce et du Crédit Mobilier" />
              <Field label="NINEA" value={company.ninea} onChange={(v) => update("ninea", v)} helpText="Numéro d'Identification Nationale des Entreprises et Associations" />
              <Field label="IFU" value={company.ifu} onChange={(v) => update("ifu", v)} helpText="Identifiant Fiscal Unique" />
            </Card>

            <Card>
              <SectionTitle icon={<Landmark className="w-3 h-3" />}>Informations bancaires</SectionTitle>
              <Field label="Banque" value={company.bank} onChange={(v) => update("bank", v)} />
              <Field label="Titulaire" value={company.bkName} onChange={(v) => update("bkName", v)} />
              <Field label="IBAN" value={company.iban} onChange={(v) => update("iban", v)} />
              <Field label="SWIFT" value={company.swift} onChange={(v) => update("swift", v)} />
              <Field label="Compte" value={company.compte} onChange={(v) => update("compte", v)} />
            </Card>

            <Card wide>
              <SectionTitle icon={<Settings className="w-3 h-3" />}>Paramètres des documents</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="TVA par défaut"
                  value={company.tvaDefault}
                  onChange={(v) => update("tvaDefault", v)}
                  options={[{ value: "non", label: "Non" }, { value: "oui", label: "Oui" }]}
                />
                <Field label="Taux TVA (%)" value={String(company.tvaRate)} onChange={(v) => update("tvaRate", Number(v) || 0)} type="number" min="0" max="100" />
                <Field label="Devise" value={company.currency} onChange={(v) => update("currency", v)} />
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
