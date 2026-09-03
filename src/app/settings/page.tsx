"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks";
import { Card, SectionTitle, Field } from "@/components/ui";

interface Company {
  name: string;
  slogan: string;
  activite: string;
  address: string;
  city: string;
  phone: string;
  phone2: string;
  email: string;
  web: string;
  rccm: string;
  ninea: string;
  ifu: string;
  bank: string;
  bkName: string;
  iban: string;
  swift: string;
  compte: string;
  tvaDefault: string;
  tvaRate: number;
  currency: string;
}

const DEFAULT: Company = {
  name: "KSY GLOBAL SERVICE",
  slogan: "KNOWLEDGE • SERVICE • YIELD",
  activite: "Fourniture de consommables & services associés",
  address: "",
  city: "Dakar, Sénégal",
  phone: "",
  phone2: "",
  email: "",
  web: "",
  rccm: "",
  ninea: "",
  ifu: "",
  bank: "",
  bkName: "",
  iban: "",
  swift: "",
  compte: "",
  tvaDefault: "non",
  tvaRate: 18,
  currency: "XOF",
};

export default function SettingsPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const isDirty = useRef(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setCompany({ ...DEFAULT, ...data });
          // Allow auto-save after initial load completes
          setTimeout(() => { isInitialLoad.current = false; }, 100);
        }
      })
      .catch(() => {});
  }, []);

  const update = (key: keyof Company, value: string | number) => {
    isDirty.current = true;
    setCompany((prev) => ({ ...prev, [key]: value }));
  };

  const autoSave = useDebounce(async (data: Company) => {
    if (!isDirty.current || isInitialLoad.current) return;
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      isDirty.current = false;
    } catch {}
  }, 1500);

  useEffect(() => {
    if (isDirty.current && !isInitialLoad.current) autoSave(company);
  }, [company, autoSave]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });
      if (res.ok) {
        isDirty.current = false;
        alert("Paramètres enregistrés !");
      } else {
        alert("Erreur lors de l'enregistrement.");
      }
    } catch {
      alert("Erreur réseau.");
    }
    setSaving(false);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-5 pb-10">
      {/* Nav */}
      <nav className="flex items-center justify-between flex-wrap gap-2 py-3 border-b-2 border-navy mb-5 sticky top-0 bg-bg z-50">
        <button
          onClick={() => router.push("/")}
          className="bg-transparent border-none text-navy text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded hover:bg-navy/5"
        >
          &#8592; Retour
        </button>
        <span className="text-[15px] font-bold text-navy">Paramètres de l&apos;entreprise</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy text-white border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy-l disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identité */}
        <Card>
          <SectionTitle>Identité</SectionTitle>
          <Field label="Nom de l'entreprise" value={company.name} onChange={(v) => update("name", v)} />
          <Field label="Slogan" value={company.slogan} onChange={(v) => update("slogan", v)} />
          <Field label="Activité" value={company.activite} onChange={(v) => update("activite", v)} />
        </Card>

        {/* Coordonnées */}
        <Card>
          <SectionTitle>Coordonnées</SectionTitle>
          <Field label="Adresse" value={company.address} onChange={(v) => update("address", v)} />
          <Field label="Ville / Pays" value={company.city} onChange={(v) => update("city", v)} />
          <Field label="Téléphone" value={company.phone} onChange={(v) => update("phone", v)} />
          <Field label="Téléphone 2" value={company.phone2} onChange={(v) => update("phone2", v)} />
          <Field label="Email" value={company.email} type="email" onChange={(v) => update("email", v)} />
          <Field label="Site web" value={company.web} onChange={(v) => update("web", v)} />
        </Card>

        {/* Identifiants officiels */}
        <Card>
          <SectionTitle>Identifiants officiels</SectionTitle>
          <Field label="RCCM" value={company.rccm} onChange={(v) => update("rccm", v)} />
          <Field label="NINEA" value={company.ninea} onChange={(v) => update("ninea", v)} />
          <Field label="IFU" value={company.ifu} onChange={(v) => update("ifu", v)} />
        </Card>

        {/* Informations bancaires */}
        <Card>
          <SectionTitle>Informations bancaires</SectionTitle>
          <Field label="Banque" value={company.bank} onChange={(v) => update("bank", v)} />
          <Field label="Titulaire" value={company.bkName} onChange={(v) => update("bkName", v)} />
          <Field label="IBAN" value={company.iban} onChange={(v) => update("iban", v)} />
          <Field label="SWIFT / BIC" value={company.swift} onChange={(v) => update("swift", v)} />
          <Field label="N° Compte" value={company.compte} onChange={(v) => update("compte", v)} />
        </Card>

        {/* Paramètres des documents */}
        <Card wide>
          <SectionTitle>Paramètres des documents</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1">
                TVA applicable par défaut
              </label>
              <select
                value={company.tvaDefault}
                onChange={(e) => { isDirty.current = true; update("tvaDefault", e.target.value); }}
                className="w-full px-2.5 py-2 border border-bdr rounded text-xs"
              >
                <option value="non">Non</option>
                <option value="oui">Oui</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1">
                Taux TVA (%)
              </label>
              <input
                type="number"
                value={company.tvaRate}
                min={0}
                max={100}
                onChange={(e) => { isDirty.current = true; update("tvaRate", parseFloat(e.target.value) || 0); }}
                className="w-full px-2.5 py-2 border border-bdr rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1">
                Devise
              </label>
              <input
                type="text"
                value={company.currency}
                onChange={(e) => { isDirty.current = true; update("currency", e.target.value); }}
                className="w-full px-2.5 py-2 border border-bdr rounded text-xs"
              />
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
