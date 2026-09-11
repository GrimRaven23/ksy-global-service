"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/lib/hooks";
import { fmtDate, fmtNum, numToWordsFCFA, calcInvoice, todayStr, esc, curYear, padN } from "@/lib/utils";
import AppShell from "@/components/AppShell";
import { Card, SectionTitle, Field, Button, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { Company, DEFAULT_COMPANY } from "@/lib/company-defaults";
import { Save, Copy, UserPlus } from "lucide-react";
import { csrfFetch } from "@/lib/csrf";

interface Product {
  designation: string;
  quantity: string;
  price: string;
}

interface DocData {
  id?: string;
  num: string;
  date: string;
  validity: string;
  ref: string;
  saleMode: string;
  status: string;
  tvaOn: boolean;
  tvaRate: number;
  customerId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddr: string;
  products: Product[];
  deliveryNotes?: { id: string; num: string }[];
  convertedFrom?: { id: string; num: string; type: string } | null;
  conversions?: { id: string; num: string; type: string }[];
  finalizedAt?: string | null;
  finalizedBy?: string | null;
}

const blankProduct = (): Product => ({ designation: "", quantity: "", price: "" });

function blankDoc(): DocData {
  return {
    num: "",
    date: todayStr(),
    validity: "",
    ref: "",
    saleMode: "directe",
    status: "DRAFT",
    tvaOn: false,
    tvaRate: 18,
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientAddr: "",
    products: [blankProduct()],
  };
}

export default function DocumentEditor({ type }: { type: "pf" | "df" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get("id");
  const [doc, setDoc] = useState<DocData>(() => blankDoc());
  const [company, setCompany] = useState<Company | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [printActive, setPrintActive] = useState(false);
  const isDirty = useRef(false);
  const isInitialLoad = useRef(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const { confirm } = useConfirm();

  const isPF = type === "pf";
  const prefix = isPF ? "PF" : "FAC";
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const docNum = doc.num || `${prefix}-${curYear()}-${padN(1)}`;
  const isDraft = doc.status === "DRAFT";

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      csrfFetch("/api/settings").then((r) => {
        if (!r.ok) throw new Error(`Erreur ${r.status}`);
        return r.json();
      }),
      docId ? csrfFetch(`/api/documents?id=${docId}`).then((r) => {
        if (!r.ok) throw new Error(`Erreur ${r.status}`);
        return r.json();
      }) : Promise.resolve(null),
    ]).then(([comp, existing]) => {
      if (cancelled) return;
      setCompany(comp && !comp.error ? comp : DEFAULT_COMPANY);
      if (existing && existing.id) {
        setDoc({
          id: existing.id,
          num: existing.num,
          date: existing.date?.split("T")[0] || todayStr(),
          validity: existing.validity?.split("T")[0] || "",
          ref: existing.ref || "",
          saleMode: (existing.saleMode || "DIRECTE").toLowerCase(),
          status: existing.status || "DRAFT",
          tvaOn: existing.tvaOn,
          tvaRate: Number(existing.tvaRate) || 18,
          clientName: existing.customerName || existing.customer?.name || "",
          clientPhone: existing.customerPhone || existing.customer?.phone || "",
          clientEmail: existing.customerEmail || existing.customer?.email || "",
          clientAddr: existing.customerAddr || existing.customer?.address || "",
          customerId: existing.customerId || existing.customer?.id || "",
          products: existing.items?.map((item: { designation: string; quantity: number | string; unitPrice: number | string }) => ({
            designation: item.designation,
            quantity: String(item.quantity),
            price: String(item.unitPrice),
          })) || [blankProduct()],
          deliveryNotes: existing.deliveryNotes || [],
          convertedFrom: existing.convertedFrom || null,
          conversions: existing.conversions || [],
          finalizedAt: existing.finalizedAt || null,
          finalizedBy: existing.finalizedBy || null,
        });
      }
      setTimeout(() => { isInitialLoad.current = false; }, 100);
    }).catch((err) => {
      if (cancelled) return;
      console.error("Failed to load document data:", err);
      setLoadError("Impossible de charger les données. Vérifiez votre connexion et votre authentification.");
      setTimeout(() => { isInitialLoad.current = false; }, 100);
    });
    return () => { cancelled = true; };
  }, [docId, isPF]);

  const updateField = useCallback(
    (field: keyof DocData, value: string | boolean | number) => {
      isDirty.current = true;
      setDoc((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateProduct = useCallback((i: number, field: keyof Product, value: string) => {
    isDirty.current = true;
    setDoc((prev) => {
      const products = [...prev.products];
      products[i] = { ...products[i], [field]: value };
      return { ...prev, products };
    });
  }, []);

  const addProduct = useCallback(() => {
    isDirty.current = true;
    setDoc((prev) => ({ ...prev, products: [...prev.products, blankProduct()] }));
  }, []);

  const removeProduct = useCallback((i: number) => {
    isDirty.current = true;
    setDoc((prev) => {
      if (prev.products.length <= 1) return prev;
      const products = prev.products.filter((_, idx) => idx !== i);
      return { ...prev, products };
    });
  }, []);

  const calc = calcInvoice(
    doc.products.map((p) => ({
      quantity: parseFloat(p.quantity) || 0,
      unitPrice: parseFloat(p.price) || 0,
    })),
    doc.tvaOn,
    doc.tvaRate
  );

  const buildPayload = (data: DocData) => ({
    type: isPF ? "PROFORMA" : "DEFINITIVE",
    date: data.date ? new Date(data.date) : undefined,
    validity: isPF && data.validity ? new Date(data.validity) : undefined,
    ref: data.ref || undefined,
    saleMode: isPF ? undefined : data.saleMode.toUpperCase(),
    tvaOn: data.tvaOn,
    tvaRate: data.tvaRate,
    customerId: data.customerId || undefined,
    customerName: data.clientName || undefined,
    customerAddr: data.clientAddr || undefined,
    customerPhone: data.clientPhone || undefined,
    customerEmail: data.clientEmail || undefined,
    items: data.products
      .filter((p) => p.designation.trim() && (p.quantity || p.price))
      .map((p) => ({
        designation: p.designation,
        quantity: parseFloat(p.quantity) || 0,
        unitPrice: parseFloat(p.price) || 0,
      })),
  });

  const handleSave = async () => {
    setIsSaving(true);
    const payload = buildPayload(doc);

    if (doc.id) {
      const res = await csrfFetch(`/api/documents?id=${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        isDirty.current = false;
        toast.success(`${isPF ? "Facture Pro Forma" : "Facture Définitive"} sauvegardée !`);
      } else {
        toast.error("Erreur lors de la sauvegarde.");
      }
    } else {
      const res = await csrfFetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.id) {
        setDoc((prev) => ({ ...prev, id: data.id, num: data.num }));
        isDirty.current = false;
        toast.success(`${isPF ? "Facture Pro Forma" : "Facture Définitive"} créée : ${data.num}`);
      } else {
        toast.error("Erreur lors de la création.");
      }
    }
    setIsSaving(false);
  };

  const handlePrint = useCallback(async () => {
    if (doc.id && isDirty.current) {
      const payload = buildPayload(doc);
      try {
        const res = await csrfFetch(`/api/documents?id=${doc.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          isDirty.current = false;
        } else {
          toast.error("Erreur de sauvegarde avant impression.");
          return;
        }
      } catch {
        toast.error("Erreur de sauvegarde avant impression.");
        return;
      }
    }
    setPrintActive(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintActive(false), 500);
    }, 50);
    if (doc.id) {
      csrfFetch("/api/audit/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DOCUMENT_PRINTED",
          entityType: "document",
          entityId: doc.id,
          entityNum: doc.num,
          details: { type },
        }),
      }).catch(() => {});
    }
  }, [doc, type, buildPayload, toast]);

  const autoSave = useDebounce(async (documentData: DocData) => {
    if (!documentData.id || !isDirty.current || isInitialLoad.current) return;
    const payload = buildPayload(documentData);
    try {
      const res = await csrfFetch(`/api/documents?id=${documentData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        isDirty.current = false;
      }
    } catch {
      // Keep isDirty true so next change triggers another save attempt
    }
  }, 1000);

  useEffect(() => {
    if (doc.id && isDirty.current && !isInitialLoad.current) autoSave(doc);
  }, [doc, autoSave]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty.current) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleCreateBL = async () => {
    if (!doc.id) {
      toast.error("Veuillez d'abord sauvegarder la facture.");
      return;
    }
    try {
      const res = await csrfFetch("/api/documents/create-bl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const data = await res.json();
      if (data.id) {
        setDoc((prev) => ({
          ...prev,
          deliveryNotes: [...(prev.deliveryNotes || []), { id: data.id, num: data.num }],
        }));
        toast.success("Bon de livraison créé");
      } else if (res.status === 409 && data.existingBlId) {
        toast.warning("Un BL existe déjà pour ce document.");
        router.push(`/bl?id=${data.existingBlId}`);
      } else {
        toast.error(data.error || "Erreur lors de la création du BL.");
      }
    } catch {
      toast.error("Erreur réseau.");
    }
  };

  const handleConvertToDefinitive = async () => {
    if (!doc.id) {
      toast.error("Veuillez d'abord sauvegarder la facture.");
      return;
    }
    const ok = await confirm("Transformer cette Pro Forma en Facture Définitive ? La Pro Forma originale sera conservée et marquée comme 'Convertie'.");
    if (!ok) return;
    try {
      const res = await csrfFetch("/api/documents/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, saleMode: doc.saleMode.toUpperCase() }),
      });
      const data = await res.json();
      if (data.id) {
        toast.success(`Facture Définitive créée : ${data.num}`);
        router.push(`/definitive?id=${data.id}`);
      } else {
        toast.error(data.error || "Erreur lors de la conversion.");
      }
    } catch {
      toast.error("Erreur réseau.");
    }
  };

  const handleDuplicate = async () => {
    if (!doc.id) return;
    const ok = await confirm("Dupliquer ce document comme brouillon ?");
    if (!ok) return;
    try {
      const res = await csrfFetch("/api/documents/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const data = await res.json();
      if (data.id) {
        toast.success(`Document dupliqué : ${data.num}`);
        router.push(`/${isPF ? "proforma" : "definitive"}?id=${data.id}`);
      } else {
        toast.error(data.error || "Erreur lors de la duplication.");
      }
    } catch {
      toast.error("Erreur réseau.");
    }
  };

  const handleQuickCreateCustomer = async () => {
    if (!quickCustomer.name.trim()) {
      toast.error("Le nom du client est requis.");
      return;
    }
    setSavingCustomer(true);
    try {
      const res = await csrfFetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickCustomer.name.trim(),
          phone: quickCustomer.phone.trim() || null,
          email: quickCustomer.email.trim() || null,
          address: quickCustomer.address.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setDoc((prev) => ({
          ...prev,
          customerId: data.id,
          clientName: data.name,
          clientPhone: data.phone || "",
          clientEmail: data.email || "",
          clientAddr: data.address || "",
        }));
        isDirty.current = true;
        setShowQuickCustomer(false);
        setQuickCustomer({ name: "", phone: "", email: "", address: "" });
        toast.success("Client créé et lié au document.");
      } else {
        const err = await res.json().catch(() => ({ error: "Erreur lors de la création" }));
        toast.error(err.error || "Erreur lors de la création du client.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleNew = async () => {
    const ok = await confirm("Créer un nouveau document ? Les données non sauvegardées seront perdues.");
    if (!ok) return;
    setDoc(blankDoc());
    isDirty.current = false;
    router.push(isPF ? "/proforma" : "/definitive");
  };

  const handleFinalize = async () => {
    if (!doc.id) { toast.error("Sauvegardez d'abord."); return; }
    const ok = await confirm("Ce document sera finalisé et ne pourra plus être modifié normalement.\n\nContinuer ?");
    if (!ok) return;
    try {
      const res = await csrfFetch(`/api/documents?id=${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "EMISE" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        toast.error(err.error || "Erreur lors de la finalisation");
        return;
      }
      setDoc((d) => ({ ...d, status: "EMISE" }));
      csrfFetch("/api/audit/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DOCUMENT_FINALIZED", entityType: "document", entityId: doc.id, entityNum: doc.num }),
      }).catch(() => {});
      toast.success("Document finalisé");
    } catch {
      toast.error("Erreur lors de la finalisation");
    }
  };

  const handleCancel = async () => {
    if (!doc.id) { toast.error("Sauvegardez d'abord."); return; }
    const ok = await confirm("Annuler ce document ?");
    if (!ok) return;
    try {
      const res = await csrfFetch(`/api/documents?id=${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        toast.error(err.error || "Erreur lors de l'annulation");
        return;
      }
      setDoc((d) => ({ ...d, status: "CANCELLED" }));
      csrfFetch("/api/audit/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DOCUMENT_CANCELLED", entityType: "document", entityId: doc.id, entityNum: doc.num }),
      }).catch(() => {});
      toast.success("Document annulé");
    } catch {
      toast.error("Erreur lors de l'annulation");
    }
  };

  if (loadError) {
    return (
      <AppShell hideNav>
        <main className="no-print">
          <div className="max-w-[600px] mx-auto mt-20 px-5 text-center">
          <div className="bg-white dark:bg-surface border border-red-200 rounded-xl p-8">
            <div className="text-red-500 text-4xl mb-4">⚠</div>
            <h2 className="text-sm font-bold text-red-700 mb-2">Erreur de chargement</h2>
            <p className="text-xs text-txt2 mb-4">{loadError}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => router.push("/")} className="bg-white dark:bg-surface text-navy dark:text-white border border-navy px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy/5">
                Retour au tableau de bord
              </button>
              <button onClick={() => window.location.reload()} className="bg-navy text-white border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy-l">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </main>
      </AppShell>
    );
  }

  if (!company) return <AppShell hideNav><div className="p-10 text-center text-txt2">Chargement...</div></AppShell>;

  return (
    <AppShell hideNav>
      <main className="no-print">
        {/* Sticky action bar */}
        <nav className="sticky top-0 z-50 bg-bg border-b border-bdr">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between gap-2">
            <button onClick={() => router.push("/")} className="bg-transparent border-none text-navy dark:text-white text-[13px] font-semibold cursor-pointer px-2 py-1.5 rounded hover:bg-navy/5 shrink-0">
              &#8592; <span className="hidden sm:inline">Retour</span>
            </button>
            <span className="text-[13px] sm:text-[15px] font-bold text-navy dark:text-white truncate">
              {isPF ? "Facture Pro Forma" : "Facture Définitive"}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {doc.id && (
                <span className="hidden sm:block">
                  <StatusBadge
                    status={doc.status}
                    label={
                      doc.status === "DRAFT" ? "Brouillon" :
                      doc.status === "EMISE" || doc.status === "FINALIZED" ? "Finalisée" :
                      doc.status === "CONVERTED" ? "Convertie" :
                      doc.status === "CANCELLED" ? "Annulée" :
                      doc.status
                    }
                  />
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] font-semibold text-gold bg-navy px-2 sm:px-3 py-1 rounded hidden sm:block">{docNum}</span>
              <button onClick={handleNew} className="bg-white dark:bg-surface text-navy dark:text-white border border-navy px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold cursor-pointer hover:bg-navy/5 hidden sm:block">
                Nouvelle
              </button>
              {doc.id && (
                <button onClick={handleDuplicate} className="bg-white dark:bg-surface text-navy dark:text-white border border-navy px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold cursor-pointer hover:bg-navy/5 hidden sm:flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5" /> Dupliquer
                </button>
              )}
              <Button variant="primary" size="sm" loading={isSaving} onClick={handleSave} disabled={!isDraft}>
                <Save className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Enregistrer</span>
              </Button>
              <button onClick={handlePrint} className="bg-navy text-white border-none px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-semibold cursor-pointer hover:bg-navy-l">
                Imprimer
              </button>
              {doc.id && doc.status === "DRAFT" && (
                <>
                  <button onClick={handleFinalize} className="bg-green-600 text-white border-none px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-bold cursor-pointer hover:bg-green-700 hidden md:block">
                    Finaliser
                  </button>
                  <button onClick={handleCancel} className="bg-red text-white border-none px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-bold cursor-pointer hover:bg-red/90 hidden md:block">
                    Annuler
                  </button>
                </>
              )}
              {isPF && doc.id && doc.status === "DRAFT" && (
                <button onClick={handleConvertToDefinitive} className="bg-gold text-navy border-none px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-bold cursor-pointer hover:bg-[#b89840] hidden md:block">
                  Transformer en Définitive
                </button>
              )}
            </div>
          </div>
        </nav>

        {!isDraft && doc.id && (
          <div className={`max-w-[1440px] mx-auto px-4 sm:px-5 lg:px-6 pt-3 ${
            doc.status === "EMISE" || doc.status === "FINALIZED" ? "bg-green-50 border-b border-green-200" :
            doc.status === "CANCELLED" ? "bg-red-50 border-b border-red-200" :
            doc.status === "CONVERTED" ? "bg-purple-50 border-b border-purple-200" :
            ""
          }`}>
            <div className="flex items-center gap-2 py-2">
              <span className={`text-xs font-bold ${
                doc.status === "EMISE" || doc.status === "FINALIZED" ? "text-green-700" :
                doc.status === "CANCELLED" ? "text-red-700" :
                doc.status === "CONVERTED" ? "text-purple-700" :
                "text-gray-700"
              }`}>
                {(doc.status === "EMISE" || doc.status === "FINALIZED") && (
                  <>✓ Document finalisé — les modifications sont désactivées{doc.finalizedAt ? ` (le ${fmtDate(doc.finalizedAt)})` : ""}</>
                )}
                {doc.status === "CANCELLED" && "✗ Document annulé"}
                {doc.status === "CONVERTED" && "→ Document converti en facture définitive"}
              </span>
            </div>
          </div>
        )}

        <div className="max-w-[1440px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Editor panel */}
          <div className="flex flex-col gap-3.5">
            {/* Invoice info */}
            <Card>
              <SectionTitle>Informations de la facture</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field label="N° de facture (auto)" value={doc.num || docNum} placeholder={isPF ? "PF-2026-001" : "FAC-2026-001"} onChange={() => {}} disabled={true} />
                <Field label="Date d'émission" type="date" value={doc.date} onChange={(v) => updateField("date", v)} disabled={!isDraft} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {isPF && (
                  <Field label="Date de validité" type="date" value={doc.validity} onChange={(v) => updateField("validity", v)} disabled={!isDraft} />
                )}
                <Field label="Référence commande" value={doc.ref} placeholder="REF-2026/001" onChange={(v) => updateField("ref", v)} disabled={!isDraft} />
                {!isPF && (
                  <div className="mb-2 last:mb-0">
                    <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-0.5">Mode de vente</label>
                    <select
                      value={doc.saleMode}
                      onChange={(e) => updateField("saleMode", e.target.value)}
                      disabled={!isDraft}
                      className="w-full px-2.5 py-2 bg-white dark:bg-surface border border-bdr rounded text-xs focus:outline-none focus:border-navy disabled:opacity-50"
                    >
                      <option value="directe">Vente directe</option>
                      <option value="livraison">Livraison</option>
                    </select>
                  </div>
                )}
              </div>
            </Card>

            {/* Client */}
            <Card>
              <div className="flex items-center justify-between -mt-4 -mx-4 mb-3.5 px-4 py-2 bg-navy rounded-t-[10px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white">Client</span>
                {isDraft && (
                  <button
                    onClick={() => setShowQuickCustomer(!showQuickCustomer)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-gold hover:text-gold-lt transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Nouveau client
                  </button>
                )}
              </div>
              {showQuickCustomer && (
                <div className="mb-3 p-3 bg-navy/[0.04] dark:bg-white/5 border border-navy/10 dark:border-white/10 rounded-lg space-y-2">
                  <input
                    type="text"
                    value={quickCustomer.name}
                    onChange={(e) => setQuickCustomer((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nom / Société *"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-bdr rounded text-xs focus:outline-none focus:border-navy"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={quickCustomer.phone}
                      onChange={(e) => setQuickCustomer((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Téléphone"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-bdr rounded text-xs focus:outline-none focus:border-navy"
                    />
                    <input
                      type="email"
                      value={quickCustomer.email}
                      onChange={(e) => setQuickCustomer((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-bdr rounded text-xs focus:outline-none focus:border-navy"
                    />
                  </div>
                  <input
                    type="text"
                    value={quickCustomer.address}
                    onChange={(e) => setQuickCustomer((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Adresse"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-surface border border-bdr rounded text-xs focus:outline-none focus:border-navy"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowQuickCustomer(false)} className="px-3 py-1 text-[11px] font-semibold text-txt2 hover:text-txt rounded cursor-pointer">Annuler</button>
                    <button onClick={handleQuickCreateCustomer} disabled={savingCustomer} className="px-3 py-1 text-[11px] font-semibold text-white bg-navy rounded cursor-pointer hover:bg-navy-l disabled:opacity-50">
                      {savingCustomer ? "Création..." : "Créer et lier"}
                    </button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field label="Nom / Société" value={doc.clientName} placeholder="Nom du client" onChange={(v) => updateField("clientName", v)} disabled={!isDraft} />
                <Field label="Téléphone" value={doc.clientPhone} placeholder="+221 77 000 00 00" onChange={(v) => updateField("clientPhone", v)} disabled={!isDraft} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field label="Email" type="email" value={doc.clientEmail} placeholder="client@example.com" onChange={(v) => updateField("clientEmail", v)} disabled={!isDraft} />
                <Field label="Adresse" value={doc.clientAddr} placeholder="Adresse du client" onChange={(v) => updateField("clientAddr", v)} disabled={!isDraft} />
              </div>
            </Card>

            {/* Products */}
            <Card>
              <div className="flex items-center justify-between -mt-4 -mx-4 mb-3.5 px-4 py-2 bg-navy rounded-t-[10px]">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white">Articles</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-white uppercase">TVA</span>
                  <label className="relative inline-block w-9 h-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={doc.tvaOn}
                      onChange={(e) => updateField("tvaOn", e.target.checked)}
                      disabled={!isDraft}
                      className="sr-only"
                    />
                    <span className={`absolute inset-0 rounded-full transition-colors ${doc.tvaOn ? "bg-gold" : "bg-gray-400"}`} />
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${doc.tvaOn ? "translate-x-4" : ""}`} />
                  </label>
                </div>
              </div>

              {doc.tvaOn && (
                <div className="flex items-center gap-2 mb-2.5 px-3 py-2 bg-gold-bg border border-gold rounded text-xs">
                  <label className="font-semibold text-navy dark:text-white whitespace-nowrap">Taux TVA (%)</label>
                  <input
                    type="number"
                    value={doc.tvaRate}
                    min={0}
                    max={100}
                    onChange={(e) => updateField("tvaRate", parseFloat(e.target.value) || 18)}
                    disabled={!isDraft}
                    className="w-16 px-2 py-1 bg-white dark:bg-surface border border-gold rounded text-xs text-center disabled:opacity-50"
                  />
                </div>
              )}

              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-2">
                <table className="w-full border-collapse text-[11px] min-w-[500px]">
                  <thead>
                    <tr className="bg-navy text-white text-[9px] uppercase tracking-wide">
                      <th className="w-8 text-center py-1.5 px-1.5">#</th>
                      <th className="text-left py-1.5 px-1.5 min-w-[150px]">Désignation</th>
                      <th className="w-20 text-right py-1.5 px-1.5">Qté</th>
                      <th className="w-24 text-right py-1.5 px-1.5">Prix unit. (XOF)</th>
                      <th className="w-24 text-right py-1.5 px-1.5">Total (XOF)</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.products.map((p, i) => {
                      const q = parseFloat(p.quantity) || 0;
                      const pr = parseFloat(p.price) || 0;
                      const lineTotal = q * pr;
                      return (
                        <tr key={i} className="border-b border-bdr/50">
                          <td className="text-center py-1.5 px-1.5 font-semibold text-navy dark:text-white">{i + 1}</td>
                          <td className="py-1.5 px-1.5">
                            <input type="text" value={p.designation} onChange={(e) => updateProduct(i, "designation", e.target.value)} placeholder="Désignation" disabled={!isDraft} className="w-full px-1.5 py-1 bg-white dark:bg-surface border border-bdr rounded text-[11px] disabled:opacity-50" />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input type="number" value={p.quantity} min={0} onChange={(e) => updateProduct(i, "quantity", e.target.value)} disabled={!isDraft} className="w-full px-1.5 py-1 bg-white dark:bg-surface border border-bdr rounded text-[11px] text-right disabled:opacity-50" />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input type="number" value={p.price} min={0} onChange={(e) => updateProduct(i, "price", e.target.value)} disabled={!isDraft} className="w-full px-1.5 py-1 bg-white dark:bg-surface border border-bdr rounded text-[11px] text-right disabled:opacity-50" />
                          </td>
                          <td className="text-right py-1.5 px-1.5 font-semibold text-navy dark:text-white whitespace-nowrap">
                            {fmtNum(lineTotal)} F
                          </td>
                          <td className="py-1.5 px-1.5">
                            <button
                              onClick={() => removeProduct(i)}
                              disabled={!isDraft}
                              className="bg-transparent border-none text-red cursor-pointer text-base p-0.5 rounded hover:bg-red/10 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Supprimer"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button onClick={addProduct} disabled={!isDraft} className="bg-white dark:bg-surface text-navy dark:text-white border-2 border-dashed border-navy px-4 py-2 rounded-md cursor-pointer text-[11px] font-semibold hover:bg-navy hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-navy">
                + Ajouter un produit
              </button>

              {/* Totals display */}
              <div className="mt-3 border border-bdr rounded-md overflow-hidden">
                <div className="flex justify-between px-3 py-2 text-xs border-b border-bdr/50">
                  <span className="font-medium text-txt2">Sous-total</span>
                  <span className="font-bold text-navy dark:text-white">{fmtNum(calc.subtotal)} F</span>
                </div>
                {doc.tvaOn && (
                  <div className="flex justify-between px-3 py-2 text-xs border-b border-bdr/50 bg-gray-50 dark:bg-white/5">
                    <span className="font-medium text-txt2">TVA ({calc.rate}%)</span>
                    <span className="font-bold text-navy dark:text-white">{fmtNum(calc.tva)} F</span>
                  </div>
                )}
                <div className="flex justify-between px-3 py-2.5 text-[13px] bg-navy font-bold">
                  <span className="text-gold-lt">Total TTC</span>
                  <span className="text-gold-lt">{fmtNum(calc.total)} F</span>
                </div>
              </div>
            </Card>

            {/* Words preview */}
            <div className="px-3.5 py-2.5 bg-gold-bg border border-gold rounded-md text-[11px]">
              <span className="font-medium text-txt2 italic">Arrêté la présente facture à la somme de :</span>
              <br />
              <span className="font-bold text-navy dark:text-white uppercase">{numToWordsFCFA(Math.round(calc.total))}</span>
            </div>

            {/* Conversion relationships */}
            {doc.id && ((doc.convertedFrom && doc.convertedFrom.id) || (doc.conversions && doc.conversions.length > 0)) && (
              <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/25 rounded-xl p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-purple-800 dark:text-purple-200 mb-2">Documents liés</h3>
                {doc.convertedFrom && doc.convertedFrom.id && (
                  <p className="text-[11px] text-txt2 mb-1.5">
                    Issue de la Pro Forma{" "}
                    <button onClick={() => router.push(`/proforma?id=${doc.convertedFrom!.id}`)} className="font-bold text-purple-800 dark:text-purple-200 hover:underline cursor-pointer">
                      {doc.convertedFrom.num}
                    </button>
                  </p>
                )}
                {doc.conversions && doc.conversions.length > 0 && doc.conversions[0] && (
                  <p className="text-[11px] text-txt2">
                    Facture définitive associée :{" "}
                    <button onClick={() => router.push(`/definitive?id=${doc.conversions![0]!.id}`)} className="font-bold text-purple-800 dark:text-purple-200 hover:underline cursor-pointer">
                      {doc.conversions[0].num}
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* Delivery link for definitive */}
            {!isPF && doc.saleMode === "livraison" && (
              <div className="bg-gold-bg border border-gold rounded-xl p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-navy dark:text-white mb-2">Livraison associée</h3>
                {doc.deliveryNotes && doc.deliveryNotes.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] text-txt2">
                      Bon de livraison <span className="font-bold text-navy dark:text-white">{doc.deliveryNotes[0].num}</span> créé.
                    </p>
                    <button
                      onClick={() => router.push(`/bl?id=${doc.deliveryNotes![0].id}`)}
                      className="bg-navy text-white border-none px-4 py-2 rounded-md text-xs font-bold cursor-pointer hover:bg-navy-l"
                    >
                      Voir le Bon de Livraison
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-txt2 mb-3">Ce bon de livraison accompagnera la livraison des marchandises.</p>
                    <button
                      onClick={handleCreateBL}
                      className="bg-gold text-navy border-none px-4 py-2 rounded-md text-xs font-bold cursor-pointer hover:bg-[#b89840]"
                    >
                      Créer un Bon de Livraison
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div className="lg:sticky lg:top-[70px]">
            <div className="text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">Aperçu du document</div>
            <div ref={printRef} className="bg-white dark:bg-surface border border-bdr rounded shadow-md overflow-hidden">
              <DocumentPrintTemplate type={type} doc={doc} company={company} calc={calc} docNum={docNum} />
            </div>
          </div>
        </div>
      </main>

      {/* Hidden print area */}
      {printActive && (
        <div className="print-doc print-active">
          <DocumentPrintTemplate type={type} doc={doc} company={company} calc={calc} docNum={docNum} />
        </div>
      )}
    </AppShell>
  );
}

// ─── Print template rendered inside the preview panel ───
function DocumentPrintTemplate({
  type,
  doc,
  company,
  calc,
  docNum,
}: {
  type: string;
  doc: DocData;
  company: Company;
  calc: ReturnType<typeof calcInvoice>;
  docNum: string;
}) {
  const isPF = type === "pf";

  return (
    <div className="doc-page text-[9pt]" style={{ transformOrigin: "top left", transform: "scale(0.55)" }}>
      <div className="corner-tl" />
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="corner-br" />
      <div className="topbar" />

      {/* Header */}
      <div className="hdr">
        <div className="hdr-l">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.jpeg" alt="KSY" className="logo-img" />
          </div>
          <div className="contact">
            {company.name && <strong>{esc(company.name)}</strong>}
            {company.slogan && <><br /><em>{esc(company.slogan)}</em></>}
            {company.activite && <><br />{esc(company.activite)}</>}
            {company.city && <><br />{esc(company.city)}</>}
            {company.phone && <><br />Tél. {esc(company.phone)}</>}
            {company.email && <><br />{esc(company.email)}</>}
          </div>
        </div>
        <div className="hdr-r">
          <div className="doc-title">{isPF ? "FACTURE PRO FORMA" : "FACTURE DÉFINITIVE"}</div>
          <div className="badge">N° {esc(docNum)}</div>
          <div className="dates">
            <div className="dr"><span className="dlbl">Date d&apos;émission : </span>{fmtDate(doc.date)}</div>
            {isPF && doc.validity && <div className="dr"><span className="dlbl">Date de validité : </span>{fmtDate(doc.validity)}</div>}
            {doc.ref && <div className="dr"><span className="dlbl">Réf. commande : </span>{esc(doc.ref)}</div>}
          </div>
        </div>
      </div>

      {/* IDs */}
      <div className="ids">
        <div className="ids-l">
          {company.rccm && <div className="idr"><span className="idk">RCCM : </span>{esc(company.rccm)}</div>}
          {company.ninea && <div className="idr"><span className="idk">NINEA : </span>{esc(company.ninea)}</div>}
          {company.ifu && <div className="idr"><span className="idk">IFU : </span>{esc(company.ifu)}</div>}
        </div>
        <div className="ids-c">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cachet.jpeg" alt="" style={{ height: 40, opacity: 0.55 }} />
        </div>
        <div className="ids-r">
          {company.bank && <div className="idr"><span className="idk">Banque : </span>{esc(company.bank)}</div>}
          {company.iban && <div className="idr"><span className="idk">IBAN : </span>{esc(company.iban)}</div>}
        </div>
      </div>

      {/* Client */}
      <div className="client-area">
        <div className="box">
          <div className="box-h">CLIENT</div>
          <div className="box-b">
            {doc.clientName && <div className="cl-name">{esc(doc.clientName)}</div>}
            {doc.clientAddr && <>{esc(doc.clientAddr)}<br /></>}
            {doc.clientPhone && <>{esc(doc.clientPhone)}<br /></>}
            {doc.clientEmail && esc(doc.clientEmail)}
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="ptbl">
        <thead>
          <tr>
            <th className="th-n">#</th>
            <th className="th-d">DÉSIGNATION</th>
            <th className="th-q">QUANTITÉ</th>
            <th className="th-p">PRIX UNIT. (XOF)</th>
            <th className="th-t">TOTAL (XOF)</th>
          </tr>
        </thead>
        <tbody>
          {calc.items.map((item, i) => (
            <tr key={i}>
              <td className="tn">{i + 1}</td>
              <td>{esc(doc.products[i]?.designation || "")}</td>
              <td className="tq">{item.quantity}</td>
              <td className="tp">{fmtNum(item.unitPrice)} F</td>
              <td className="tt">{fmtNum(item._total)} F</td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, 7 - calc.items.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="empty-r"><td>&nbsp;</td><td /><td /><td /><td /></tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals-wrap">
        <div className="totals">
          <div className="ttr"><span className="ttl">SOUS-TOTAL</span><span className="ttv">{fmtNum(calc.subtotal)} F</span></div>
          {doc.tvaOn && (
            <div className="ttr"><span className="ttl">TVA ({calc.rate}%)</span><span className="ttv">{fmtNum(calc.tva)} F</span></div>
          )}
          <div className="ttr ttr-ttc"><span className="ttl">TOTAL TTC</span><span className="ttv">{fmtNum(calc.total)} F</span></div>
        </div>
      </div>

      {/* Words */}
      <div className="words">
        <div className="words-l">Arrêté la présente facture à la somme de :</div>
        <div className="words-v">{numToWordsFCFA(Math.round(calc.total))}</div>
      </div>

      {/* Signature */}
      <div className="sig">
        <div className="stamp-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cachet.jpeg" alt="Cachet" className="stamp-img" />
        </div>
        <div className="sig-txt">
          <div className="sig-t">Pour {esc(company.name)}</div>
          <div className="sig-s">La Direction</div>
          <div className="sig-line" />
        </div>
      </div>

      {/* Footer */}
      <div className="ftr">
        <div className="ftr-hdr">COORDONNÉES BANCAIRES</div>
        <div className="ftr-body">
          <div className="bk-col">
            {company.bank && <div className="bk-r"><span className="bk-k">Banque :</span><span>{esc(company.bank)}</span></div>}
            {company.bkName && <div className="bk-r"><span className="bk-k">Titulaire :</span><span>{esc(company.bkName)}</span></div>}
            {company.iban && <div className="bk-r"><span className="bk-k">IBAN :</span><span>{esc(company.iban)}</span></div>}
            {company.swift && <div className="bk-r"><span className="bk-k">SWIFT :</span><span>{esc(company.swift)}</span></div>}
            {company.compte && <div className="bk-r"><span className="bk-k">N° Compte :</span><span>{esc(company.compte)}</span></div>}
          </div>
        </div>
      </div>
      <div className="bbar"><em>Merci pour votre confiance !</em></div>
    </div>
  );
}
