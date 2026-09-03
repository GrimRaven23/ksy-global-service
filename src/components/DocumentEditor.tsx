"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks";
import {
  fmtDate,
  fmtNum,
  numToWordsFCFA,
  calcInvoice,
  todayStr,
  esc,
  curYear,
  padN,
} from "@/lib/utils";

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
  tvaOn: boolean;
  tvaRate: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddr: string;
  products: Product[];
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

const blankProduct = (): Product => ({ designation: "", quantity: "", price: "" });

function blankDoc(type: string): DocData {
  return {
    num: "",
    date: todayStr(),
    validity: "",
    ref: "",
    saleMode: "directe",
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
  const [doc, setDoc] = useState<DocData>(() => blankDoc(type));
  const [company, setCompany] = useState<Company | null>(null);
  const [nextNum, setNextNum] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  const isPF = type === "pf";
  const prefix = isPF ? "PF" : "FAC";
  const docNum = doc.num || `${prefix}-${curYear()}-${padN(nextNum)}`;

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch(`/api/documents?type=${isPF ? "PROFORMA" : "DEFINITIVE"}`).then((r) => r.json()),
    ]).then(([comp, docs]) => {
      if (comp && !comp.error) setCompany(comp);
      if (Array.isArray(docs)) setNextNum(docs.length + 1);
    });
  }, [isPF]);

  const updateField = useCallback(
    (field: keyof DocData, value: any) => {
      setDoc((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateProduct = useCallback((i: number, field: keyof Product, value: string) => {
    setDoc((prev) => {
      const products = [...prev.products];
      products[i] = { ...products[i], [field]: value };
      return { ...prev, products };
    });
  }, []);

  const addProduct = useCallback(() => {
    setDoc((prev) => ({ ...prev, products: [...prev.products, blankProduct()] }));
  }, []);

  const removeProduct = useCallback((i: number) => {
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

  const handleSave = async () => {
    const items = doc.products
      .filter((p) => p.designation || p.quantity || p.price)
      .map((p) => ({
        designation: p.designation,
        quantity: parseFloat(p.quantity) || 0,
        unitPrice: parseFloat(p.price) || 0,
      }));

    const payload = {
      type: isPF ? "PROFORMA" : "DEFINITIVE",
      date: doc.date ? new Date(doc.date) : undefined,
      validity: isPF && doc.validity ? new Date(doc.validity) : undefined,
      ref: doc.ref || undefined,
      saleMode: isPF ? undefined : doc.saleMode.toUpperCase(),
      tvaOn: doc.tvaOn,
      tvaRate: doc.tvaRate,
      items,
    };

    if (doc.id) {
      await fetch(`/api/documents?id=${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert(`${isPF ? "Facture Pro Forma" : "Facture Définitive"} sauvegardée !`);
    } else {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.id) {
        setDoc((prev) => ({ ...prev, id: data.id, num: data.num }));
        setNextNum((n) => n + 1);
      }
      alert(`${isPF ? "Facture Pro Forma" : "Facture Définitive"} créée : ${data.num || docNum}`);
    }
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const autoSave = useDebounce(async (documentData: DocData) => {
    if (!documentData.id) return;
    const items = documentData.products
      .filter((p) => p.designation || p.quantity || p.price)
      .map((p) => ({
        designation: p.designation,
        quantity: parseFloat(p.quantity) || 0,
        unitPrice: parseFloat(p.price) || 0,
      }));
    await fetch(`/api/documents?id=${documentData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: documentData.date ? new Date(documentData.date) : undefined,
        validity: isPF && documentData.validity ? new Date(documentData.validity) : undefined,
        ref: documentData.ref || undefined,
        saleMode: isPF ? undefined : documentData.saleMode.toUpperCase(),
        tvaOn: documentData.tvaOn,
        tvaRate: documentData.tvaRate,
        items,
      }),
    });
  }, 1000);

  useEffect(() => {
    if (doc.id) autoSave(doc);
  }, [doc, autoSave]);

  const handleCreateBL = async () => {
    if (!doc.id) {
      alert("Veuillez d'abord sauvegarder la facture.");
      return;
    }
    try {
      const res = await fetch("/api/documents/create-bl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const bl = await res.json();
      if (bl.id) {
        router.push("/bl");
      } else {
        alert("Erreur lors de la création du BL.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleNew = () => {
    if (!confirm("Créer un nouveau document ? Les données non sauvegardées seront perdues.")) return;
    setDoc(blankDoc(type));
  };

  if (!company) return <div className="p-10 text-center text-txt2">Chargement...</div>;

  return (
    <main className="no-print">
      {/* Nav */}
      <nav className="flex items-center justify-between flex-wrap gap-2 py-3 border-b-2 border-navy mb-5 sticky top-0 bg-bg z-50 max-w-[1440px] mx-auto px-5">
        <button onClick={() => router.push("/")} className="bg-transparent border-none text-navy text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded hover:bg-navy/5">
          &#8592; Retour
        </button>
        <span className="text-[15px] font-bold text-navy">
          {isPF ? "Facture Pro Forma" : "Facture Définitive"}
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold text-gold bg-navy px-3 py-1 rounded text-xs">{docNum}</span>
          <button onClick={handleNew} className="bg-white text-navy border border-navy px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy/5">
            Nouvelle
          </button>
          <button onClick={handleSave} className="bg-white text-navy border border-navy px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy/5">
            Enregistrer
          </button>
          <button onClick={handlePrint} className="bg-navy text-white border-none px-4 py-2 rounded-md text-xs font-semibold cursor-pointer hover:bg-navy-l">
            Imprimer
          </button>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Editor panel */}
        <div className="flex flex-col gap-3.5">
          {/* Invoice info */}
          <Card>
            <SectionTitle>Informations de la facture</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="N° de facture" value={doc.num} placeholder={isPF ? "PF-2026-001" : "FAC-2026-001"} onChange={(v) => updateField("num", v)} />
              <Field label="Date d'émission" type="date" value={doc.date} onChange={(v) => updateField("date", v)} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {isPF && (
                <Field label="Date de validité" type="date" value={doc.validity} onChange={(v) => updateField("validity", v)} />
              )}
              <Field label="Référence commande" value={doc.ref} placeholder="REF-2026/001" onChange={(v) => updateField("ref", v)} />
              {!isPF && (
                <div>
                  <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-0.5">Mode de vente</label>
                  <select
                    value={doc.saleMode}
                    onChange={(e) => updateField("saleMode", e.target.value)}
                    className="w-full px-2.5 py-2 border border-bdr rounded text-xs focus:outline-none focus:border-navy"
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
            <SectionTitle>Client</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Nom / Société" value={doc.clientName} placeholder="Nom du client" onChange={(v) => updateField("clientName", v)} />
              <Field label="Téléphone" value={doc.clientPhone} placeholder="+221 77 000 00 00" onChange={(v) => updateField("clientPhone", v)} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Email" type="email" value={doc.clientEmail} placeholder="client@example.com" onChange={(v) => updateField("clientEmail", v)} />
              <Field label="Adresse" value={doc.clientAddr} placeholder="Adresse du client" onChange={(v) => updateField("clientAddr", v)} />
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
                    className="sr-only"
                  />
                  <span className={`absolute inset-0 rounded-full transition-colors ${doc.tvaOn ? "bg-gold" : "bg-gray-400"}`} />
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${doc.tvaOn ? "translate-x-4" : ""}`} />
                </label>
              </div>
            </div>

            {doc.tvaOn && (
              <div className="flex items-center gap-2 mb-2.5 px-3 py-2 bg-gold-bg border border-gold rounded text-xs">
                <label className="font-semibold text-navy whitespace-nowrap">Taux TVA (%)</label>
                <input
                  type="number"
                  value={doc.tvaRate}
                  min={0}
                  max={100}
                  onChange={(e) => updateField("tvaRate", parseFloat(e.target.value) || 18)}
                  className="w-16 px-2 py-1 border border-gold rounded text-xs text-center"
                />
              </div>
            )}

            <div className="overflow-x-auto mb-2">
              <table className="w-full border-collapse text-[11px]">
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
                        <td className="text-center py-1.5 px-1.5 font-semibold text-navy">{i + 1}</td>
                        <td className="py-1.5 px-1.5">
                          <input type="text" value={p.designation} onChange={(e) => updateProduct(i, "designation", e.target.value)} placeholder="Désignation" className="w-full px-1.5 py-1 border border-bdr rounded text-[11px]" />
                        </td>
                        <td className="py-1.5 px-1.5">
                          <input type="number" value={p.quantity} min={0} onChange={(e) => updateProduct(i, "quantity", e.target.value)} className="w-full px-1.5 py-1 border border-bdr rounded text-[11px] text-right" />
                        </td>
                        <td className="py-1.5 px-1.5">
                          <input type="number" value={p.price} min={0} onChange={(e) => updateProduct(i, "price", e.target.value)} className="w-full px-1.5 py-1 border border-bdr rounded text-[11px] text-right" />
                        </td>
                        <td className="text-right py-1.5 px-1.5 font-semibold text-navy whitespace-nowrap">
                          {fmtNum(lineTotal)} F
                        </td>
                        <td className="py-1.5 px-1.5">
                          <button
                            onClick={() => removeProduct(i)}
                            className="bg-transparent border-none text-red cursor-pointer text-base p-0.5 rounded hover:bg-red/10"
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
            <button onClick={addProduct} className="bg-white text-navy border-2 border-dashed border-navy px-4 py-2 rounded-md cursor-pointer text-[11px] font-semibold hover:bg-navy hover:text-white transition-colors">
              + Ajouter un produit
            </button>

            {/* Totals display */}
            <div className="mt-3 border border-bdr rounded-md overflow-hidden">
              <div className="flex justify-between px-3 py-2 text-xs border-b border-bdr/50">
                <span className="font-medium text-txt2">Sous-total</span>
                <span className="font-bold text-navy">{fmtNum(calc.subtotal)} F</span>
              </div>
              {doc.tvaOn && (
                <div className="flex justify-between px-3 py-2 text-xs border-b border-bdr/50 bg-gray-50">
                  <span className="font-medium text-txt2">TVA ({calc.rate}%)</span>
                  <span className="font-bold text-navy">{fmtNum(calc.tva)} F</span>
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
            <span className="font-bold text-navy uppercase">{numToWordsFCFA(Math.round(calc.total))}</span>
          </div>

          {/* Delivery link for definitive */}
          {!isPF && doc.saleMode === "livraison" && (
            <div className="bg-gold-bg border border-gold rounded-[10px] p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-navy mb-2">Livraison associée</h3>
              <p className="text-[11px] text-txt2 mb-3">Ce bon de livraison accompagnera la livraison des marchandises.</p>
              <button
                onClick={handleCreateBL}
                className="bg-gold text-navy border-none px-4 py-2 rounded-md text-xs font-bold cursor-pointer hover:bg-[#b89840]"
              >
                Créer un Bon de Livraison
              </button>
            </div>
          )}
        </div>

        {/* Preview panel */}
        <div className="sticky top-[70px]">
          <div className="text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">Aperçu du document</div>
          <div ref={printRef} className="bg-white border border-bdr rounded shadow-md overflow-hidden">
            <DocumentPrintTemplate type={type} doc={doc} company={company} calc={calc} docNum={docNum} />
          </div>
        </div>
      </div>
    </main>
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
          <div className="badge">N° {docNum}</div>
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
          <div className="idr"><span className="idk">RCCM : </span>{esc(company.rccm)}</div>
          <div className="idr"><span className="idk">NINEA : </span>{esc(company.ninea)}</div>
          {company.ifu && <div className="idr"><span className="idk">IFU : </span>{esc(company.ifu)}</div>}
        </div>
        <div className="ids-c">
          <img src="/images/cachet.jpeg" alt="" style={{ height: 40, opacity: 0.55 }} />
        </div>
        <div className="ids-r">
          <div className="idr"><span className="idk">Banque : </span>{esc(company.bank)}</div>
          <div className="idr"><span className="idk">IBAN : </span>{esc(company.iban)}</div>
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
          <img src="/images/cachet.jpeg" alt="Cachet" className="stamp-img" />
        </div>
        <div className="sig-txt">
          <div className="sig-t">Pour {company.name}</div>
          <div className="sig-s">La Direction</div>
          <div className="sig-line" />
        </div>
      </div>

      {/* Footer */}
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
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="bg-white border border-bdr rounded-[10px] p-4">{children}</section>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold uppercase tracking-wide text-white bg-navy -mt-4 -mx-4 mb-3.5 px-4 py-[7px] rounded-t-[10px]">
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-0.5">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 border border-bdr rounded text-xs focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
      />
    </div>
  );
}
