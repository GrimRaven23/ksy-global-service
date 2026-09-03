"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/lib/hooks";
import { fmtDate, todayStr, esc, curYear, padN } from "@/lib/utils";
import { SectionTitle, Field } from "@/components/ui";

interface BLProduct {
  designation: string;
  quantity: string;
  observation: string;
}

interface BLData {
  id?: string;
  num: string;
  date: string;
  ref: string;
  orderRef: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddr: string;
  driver: string;
  driverPhone: string;
  products: BLProduct[];
  observations: string;
}

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
}

const blankBLProduct = (): BLProduct => ({ designation: "", quantity: "", observation: "" });

function blankBL(): BLData {
  return {
    num: "",
    date: todayStr(),
    ref: "",
    orderRef: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientAddr: "",
    driver: "",
    driverPhone: "",
    products: [blankBLProduct()],
    observations: "",
  };
}

export default function BLEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get("id");
  const [doc, setDoc] = useState<BLData>(blankBL);
  const [company, setCompany] = useState<Company | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isDirty = useRef(false);
  const isInitialLoad = useRef(true);
  const [printCopies, setPrintCopies] = useState<0 | 1 | 2>(0);
  const printRef = useRef<HTMLDivElement>(null);

  const docNum = doc.num || `BL-${curYear()}-${padN(1)}`;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/settings").then((r) => {
        if (!r.ok) throw new Error(`Erreur ${r.status}`);
        return r.json();
      }),
      docId ? fetch(`/api/delivery?id=${docId}`).then((r) => {
        if (!r.ok) throw new Error(`Erreur ${r.status}`);
        return r.json();
      }) : Promise.resolve(null),
    ]).then(([comp, existing]) => {
      if (cancelled) return;
      if (comp && !comp.error) setCompany(comp);
      if (existing && existing.id) {
        setDoc({
          id: existing.id,
          num: existing.num,
          date: existing.date?.split("T")[0] || todayStr(),
          ref: "",
          orderRef: existing.orderRef || "",
          clientName: existing.customerName || existing.customer?.name || "",
          clientPhone: existing.customerPhone || existing.customer?.phone || "",
          clientEmail: existing.customerEmail || existing.customer?.email || "",
          clientAddr: existing.customerAddr || existing.customer?.address || "",
          driver: existing.driverName || "",
          driverPhone: existing.driverPhone || "",
          products: existing.items?.map((item: { designation: string; quantity: number | string; observation?: string | null }) => ({
            designation: item.designation,
            quantity: String(item.quantity),
            observation: item.observation || "",
          })) || [blankBLProduct()],
          observations: existing.observations || "",
        });
      }
      setTimeout(() => { isInitialLoad.current = false; }, 100);
    }).catch((err) => {
      if (cancelled) return;
      console.error("Failed to load BL data:", err);
      setLoadError("Impossible de charger les données. Vérifiez votre connexion et votre authentification.");
      setTimeout(() => { isInitialLoad.current = false; }, 100);
    });
    return () => { cancelled = true; };
  }, [docId]);

  const updateField = useCallback((field: keyof BLData, value: string) => {
    isDirty.current = true;
    setDoc((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateProduct = useCallback((i: number, field: keyof BLProduct, value: string) => {
    isDirty.current = true;
    setDoc((prev) => {
      const products = [...prev.products];
      products[i] = { ...products[i], [field]: value };
      return { ...prev, products };
    });
  }, []);

  const addProduct = useCallback(() => {
    isDirty.current = true;
    setDoc((prev) => ({ ...prev, products: [...prev.products, blankBLProduct()] }));
  }, []);

  const removeProduct = useCallback((i: number) => {
    isDirty.current = true;
    setDoc((prev) => {
      if (prev.products.length <= 1) return prev;
      return { ...prev, products: prev.products.filter((_, idx) => idx !== i) };
    });
  }, []);

  const buildPayload = (data: BLData) => ({
    date: data.date ? new Date(data.date) : undefined,
    driverName: data.driver || undefined,
    driverPhone: data.driverPhone || undefined,
    observations: data.observations || undefined,
    orderRef: data.orderRef || undefined,
    customerName: data.clientName || undefined,
    customerAddr: data.clientAddr || undefined,
    customerPhone: data.clientPhone || undefined,
    customerEmail: data.clientEmail || undefined,
    items: data.products
      .filter((p) => p.designation || p.quantity)
      .map((p, i) => ({
        designation: p.designation,
        quantity: parseFloat(p.quantity) || 0,
        observation: p.observation,
        sortOrder: i,
      })),
  });

  const handleSave = async () => {
    const payload = buildPayload(doc);

    if (doc.id) {
      const res = await fetch(`/api/delivery?id=${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        isDirty.current = false;
        alert("Bon de livraison sauvegardé !");
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    } else {
      const res = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.id) {
        setDoc((prev) => ({ ...prev, id: data.id, num: data.num }));
        isDirty.current = false;
        alert(`Bon de livraison créé : ${data.num}`);
      } else {
        alert("Erreur lors de la création.");
      }
    }
  };

  const autoSave = useDebounce(async (documentData: BLData) => {
    if (!documentData.id || !isDirty.current || isInitialLoad.current) return;
    const payload = buildPayload(documentData);
    await fetch(`/api/delivery?id=${documentData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    isDirty.current = false;
  }, 1000);

  useEffect(() => {
    if (doc.id && isDirty.current && !isInitialLoad.current) autoSave(doc);
  }, [doc, autoSave]);

  const handlePrint = useCallback((copies: 1 | 2) => {
    setPrintCopies(copies);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintCopies(0), 500);
    }, 50);
  }, []);

  const handleNew = () => {
    if (!confirm("Créer un nouveau document ? Les données non sauvegardées seront perdues.")) return;
    setDoc(blankBL());
    router.push("/bl");
  };

  if (loadError) return (
    <main className="no-print">
      <div className="max-w-[600px] mx-auto mt-20 px-5 text-center">
        <div className="bg-white border border-red-200 rounded-xl p-8">
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <h2 className="text-sm font-bold text-red-700 mb-2">Erreur de chargement</h2>
          <p className="text-xs text-txt2 mb-4">{loadError}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => router.push("/")} className="bg-white text-navy border border-navy px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy/5">
              Retour au tableau de bord
            </button>
            <button onClick={() => window.location.reload()} className="bg-navy text-white border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy-l">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </main>
  );

  if (!company) return <div className="p-10 text-center text-txt2">Chargement...</div>;

  const renderCopy = (copyLabel: string) => (
    <div className="doc-page text-[9pt]" style={{ transformOrigin: "top left", transform: "scale(0.55)" }}>
      <div className="copy-banner">{copyLabel}</div>
      <div className="corner-tl" />
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="corner-br" />
      <div className="topbar" />

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
          </div>
        </div>
        <div className="hdr-r">
          <div className="doc-title">BON DE LIVRAISON</div>
          <div className="badge">N° {docNum}</div>
          <div className="dates">
            <div className="dr"><span className="dlbl">Date de livraison : </span>{fmtDate(doc.date)}</div>
            {doc.ref && <div className="dr"><span className="dlbl">Réf. facture : </span>{esc(doc.ref)}</div>}
          </div>
        </div>
      </div>

      <div className="ids">
        <div className="ids-l">
          <div className="idr"><span className="idk">RCCM : </span>{esc(company.rccm)}</div>
          <div className="idr"><span className="idk">NINEA : </span>{esc(company.ninea)}</div>
        </div>
        <div className="ids-c">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cachet.jpeg" alt="" style={{ height: 40, opacity: 0.55 }} />
        </div>
        <div className="ids-r">
          <div className="idr"><span className="idk">Banque : </span>{esc(company.bank)}</div>
          <div className="idr"><span className="idk">IBAN : </span>{esc(company.iban)}</div>
        </div>
      </div>

      <div className="bl-two-col">
        <div className="box bl-box">
          <div className="box-h">CLIENT / DESTINATAIRE</div>
          <div className="box-b">
            {doc.clientName && <div className="cl-name">{esc(doc.clientName)}</div>}
            {doc.clientAddr && <>{esc(doc.clientAddr)}<br /></>}
            {doc.clientPhone && esc(doc.clientPhone)}
          </div>
        </div>
        <div className="box bl-box">
          <div className="box-h">LIVREUR</div>
          <div className="box-b">
            {doc.driver && <div className="cl-name">{esc(doc.driver)}</div>}
            {doc.driverPhone && esc(doc.driverPhone)}
          </div>
        </div>
      </div>

      <table className="ptbl">
        <thead>
          <tr>
            <th className="th-n">#</th>
            <th className="th-d">DÉSIGNATION</th>
            <th className="th-q">QUANTITÉ</th>
            <th className="th-obs">OBSERVATIONS</th>
          </tr>
        </thead>
        <tbody>
          {doc.products.map((p, i) => {
            const q = parseFloat(p.quantity) || 0;
            return (
              <tr key={i}>
                <td className="tn">{i + 1}</td>
                <td>{esc(p.designation)}</td>
                <td className="tq">{q}</td>
                <td>{esc(p.observation)}</td>
              </tr>
            );
          })}
          {Array.from({ length: Math.max(0, 7 - doc.products.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="empty-r"><td>&nbsp;</td><td /><td /><td /></tr>
          ))}
        </tbody>
      </table>

      <div className="bl-obs-box">
        <div className="bl-obs-hdr">OBSERVATIONS / RÉSERVES DU CLIENT</div>
        <div className="bl-obs-body">{esc(doc.observations || "")}</div>
      </div>

      <div className="bl-sigs">
        <div className="bl-sig-block">
          <div className="bl-sig-title">LIVREUR</div>
          <div className="bl-sig-row"><span>Nom :</span><span className="bl-sig-line" /></div>
          <div className="bl-sig-row"><span>Signature :</span><span className="bl-sig-line" /></div>
        </div>
        <div className="bl-sig-block">
          <div className="bl-sig-title">CLIENT / DESTINATAIRE</div>
          <div className="bl-sig-row"><span>Nom :</span><span className="bl-sig-line" /></div>
          <div className="bl-sig-row"><span>Signature :</span><span className="bl-sig-line" /></div>
          <div className="bl-sig-row"><span>Date :</span><span className="bl-sig-line" /></div>
        </div>
      </div>

      <div className="ftr">
        <div className="ftr-hdr">COORDONNÉES BANCAIRES</div>
        <div className="ftr-body">
          <div className="bk-col">
            <div className="bk-r"><span className="bk-k">Banque :</span><span>{esc(company.bank)}</span></div>
            <div className="bk-r"><span className="bk-k">Titulaire :</span><span>{esc(company.bkName)}</span></div>
            <div className="bk-r"><span className="bk-k">IBAN :</span><span>{esc(company.iban)}</span></div>
            <div className="bk-r"><span className="bk-k">SWIFT :</span><span>{esc(company.swift)}</span></div>
            <div className="bk-r"><span className="bk-k">N° Compte :</span><span>{esc(company.compte)}</span></div>
          </div>
        </div>
      </div>
      <div className="bbar"><em>Merci pour votre confiance !</em></div>
    </div>
  );

  return (
    <>
      <main className="no-print">
        <nav className="flex items-center justify-between flex-wrap gap-2 py-3 border-b-2 border-navy mb-5 sticky top-0 bg-bg z-50 max-w-[1440px] mx-auto px-5">
          <button onClick={() => router.push("/")} className="bg-transparent border-none text-navy text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded hover:bg-navy/5">
            &#8592; Retour
          </button>
          <span className="text-[15px] font-bold text-navy">Bon de Livraison</span>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold text-gold bg-navy px-3 py-1 rounded text-xs">{docNum}</span>
            <button onClick={handleNew} className="bg-white text-navy border border-navy px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy/5">
              Nouveau
            </button>
            <button onClick={handleSave} className="bg-white text-navy border border-navy px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy/5">
              Enregistrer
            </button>
            <button onClick={() => handlePrint(1)} className="bg-navy text-white border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy-l">
              Imprimer (1 ex.)
            </button>
            <button onClick={() => handlePrint(2)} className="bg-gold text-navy border-none px-4 py-2 rounded-md text-xs font-bold cursor-pointer hover:bg-[#b89840]">
              Imprimer 2 exemplaires
            </button>
          </div>
        </nav>

        <div className="max-w-[1440px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="flex flex-col gap-3.5">
            {/* Delivery info */}
            <section className="bg-white border border-bdr rounded-[10px] p-4">
              <SectionTitle>Informations de livraison</SectionTitle>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="N° du bon" value={doc.num} placeholder="BL-2026-001" onChange={(v) => updateField("num", v)} />
                <Field label="Date de livraison" type="date" value={doc.date} onChange={(v) => updateField("date", v)} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Référence facture associée" value={doc.ref} placeholder="FAC-2026-001" onChange={(v) => updateField("ref", v)} />
                <Field label="Référence commande" value={doc.orderRef} placeholder="REF-2026/001" onChange={(v) => updateField("orderRef", v)} />
              </div>
            </section>

            {/* Driver */}
            <section className="bg-white border border-bdr rounded-[10px] p-4">
              <SectionTitle>Livreur</SectionTitle>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Nom du livreur" value={doc.driver} placeholder="Nom du livreur" onChange={(v) => updateField("driver", v)} />
                <Field label="Téléphone" value={doc.driverPhone} placeholder="+221 77 000 00 00" onChange={(v) => updateField("driverPhone", v)} />
              </div>
            </section>

            {/* Client */}
            <section className="bg-white border border-bdr rounded-[10px] p-4">
              <SectionTitle>Client / Destinataire</SectionTitle>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Nom / Société" value={doc.clientName} placeholder="Nom du client" onChange={(v) => updateField("clientName", v)} />
                <Field label="Téléphone" value={doc.clientPhone} placeholder="+221 77 000 00 00" onChange={(v) => updateField("clientPhone", v)} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Email" type="email" value={doc.clientEmail} placeholder="client@example.com" onChange={(v) => updateField("clientEmail", v)} />
                <Field label="Adresse de livraison" value={doc.clientAddr} placeholder="Adresse complète" onChange={(v) => updateField("clientAddr", v)} />
              </div>
            </section>

            {/* Products */}
            <section className="bg-white border border-bdr rounded-[10px] p-4">
              <SectionTitle>Articles livrés</SectionTitle>
              <div className="overflow-x-auto mb-2">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-navy text-white text-[9px] uppercase tracking-wide">
                      <th className="w-8 text-center py-1.5 px-1.5">#</th>
                      <th className="text-left py-1.5 px-1.5 min-w-[150px]">Désignation</th>
                      <th className="w-20 text-right py-1.5 px-1.5">Quantité</th>
                      <th className="min-w-[100px] text-left py-1.5 px-1.5">Observations</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.products.map((p, i) => (
                      <tr key={i} className="border-b border-bdr/50">
                        <td className="text-center py-1.5 px-1.5 font-semibold text-navy">{i + 1}</td>
                        <td className="py-1.5 px-1.5">
                          <input type="text" value={p.designation} onChange={(e) => updateProduct(i, "designation", e.target.value)} placeholder="Désignation" className="w-full px-1.5 py-1 border border-bdr rounded text-[11px]" />
                        </td>
                        <td className="py-1.5 px-1.5">
                          <input type="number" value={p.quantity} min={0} onChange={(e) => updateProduct(i, "quantity", e.target.value)} className="w-full px-1.5 py-1 border border-bdr rounded text-[11px] text-right" />
                        </td>
                        <td className="py-1.5 px-1.5">
                          <input type="text" value={p.observation} onChange={(e) => updateProduct(i, "observation", e.target.value)} placeholder="Observation" className="w-full px-1.5 py-1 border border-bdr rounded text-[11px]" />
                        </td>
                        <td className="py-1.5 px-1.5">
                          <button onClick={() => removeProduct(i)} className="bg-transparent border-none text-red cursor-pointer text-base p-0.5 rounded hover:bg-red/10" title="Supprimer">
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addProduct} className="bg-white text-navy border-2 border-dashed border-navy px-4 py-2 rounded-md cursor-pointer text-[11px] font-semibold hover:bg-navy hover:text-white transition-colors">
                + Ajouter un article
              </button>
            </section>

            {/* Observations */}
            <section className="bg-white border border-bdr rounded-[10px] p-4">
              <SectionTitle>Observations / Reserves du client</SectionTitle>
              <textarea
                value={doc.observations}
                onChange={(e) => { isDirty.current = true; updateField("observations", e.target.value); }}
                rows={4}
                placeholder="Ex : Articles endommagés, quantité manquante, etc."
                className="w-full px-3 py-2.5 border border-bdr rounded text-xs resize-y min-h-[60px] focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </section>
          </div>

          {/* Preview panel */}
          <div className="sticky top-[70px]">
            <div className="text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">Aperçu du document</div>
            <div className="bg-white border border-bdr rounded shadow-md overflow-hidden">
              {renderCopy("EXEMPLAIRE 1 — CLIENT / DESTINATAIRE")}
            </div>
          </div>
        </div>
      </main>

      {/* Hidden print area — renders actual copies */}
      <div ref={printRef} className="print-doc">
        {printCopies >= 1 && (
          <div className="print-active">
            {renderCopy("EXEMPLAIRE 1 — CLIENT / DESTINATAIRE")}
          </div>
        )}
        {printCopies >= 2 && (
          <div className="print-active">
            {renderCopy("EXEMPLAIRE 2 — KSY GLOBAL SERVICES")}
          </div>
        )}
      </div>
    </>
  );
}
