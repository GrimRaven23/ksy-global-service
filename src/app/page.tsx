"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DocSummary {
  id: string;
  num: string;
  type: string;
  date: string;
  total?: number;
  createdAt: string;
}

export default function HomePage() {
  const [recentDocs, setRecentDocs] = useState<DocSummary[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/documents?type=PROFORMA").then((r) => r.json()),
      fetch("/api/documents?type=DEFINITIVE").then((r) => r.json()),
      fetch("/api/delivery").then((r) => r.json()),
    ])
      .then(([pf, df, bl]) => {
        const pfDocs = (Array.isArray(pf) ? pf : []).map((d: any) => ({
          id: d.id,
          num: d.num,
          type: "PROFORMA",
          date: d.date,
          total: d.total,
          createdAt: d.createdAt,
        }));
        const dfDocs = (Array.isArray(df) ? df : []).map((d: any) => ({
          id: d.id,
          num: d.num,
          type: "DEFINITIVE",
          date: d.date,
          total: d.total,
          createdAt: d.createdAt,
        }));
        const blDocs = (Array.isArray(bl) ? bl : []).map((d: any) => ({
          id: d.id,
          num: d.num,
          type: "BL",
          date: d.date,
          createdAt: d.createdAt,
        }));
        const all = [...pfDocs, ...dfDocs, ...blDocs]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentDocs(all);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="max-w-[780px] mx-auto px-6 py-10">
      <header className="text-center mb-10">
        <img
          src="/images/logo.jpeg"
          alt="KSY Global Service"
          className="h-20 mx-auto mb-3 drop-shadow-sm"
        />
        <h1 className="text-2xl font-extrabold text-navy tracking-wide">
          Gestion de Documents
        </h1>
        <p className="text-sm text-txt2">Facturation &amp; Livraison Professionnelle</p>
      </header>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gold">Factures</span>
        <div className="flex-1 h-px bg-gradient-to-r from-gold to-transparent" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-7">
        <Link
          href="/proforma"
          className="group bg-white border-2 border-bdr rounded-[10px] p-6 text-center transition-all hover:border-gold hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="text-3xl mb-2" aria-hidden="true">&#128196;</div>
          <h2 className="text-sm font-bold text-navy mb-1">Facture Pro Forma</h2>
          <p className="text-[11.5px] text-txt2 mb-4 leading-relaxed">
            Préparer une facture prévisionnelle avant la finalisation de la vente.
          </p>
          <span className="inline-block bg-navy text-white border-none px-5 py-2.5 rounded-md text-xs font-semibold group-hover:bg-navy-l transition-colors">
            Créer une Facture Pro Forma
          </span>
        </Link>
        <Link
          href="/definitive"
          className="group bg-white border-2 border-bdr rounded-[10px] p-6 text-center transition-all hover:border-gold hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="text-3xl mb-2" aria-hidden="true">&#128197;</div>
          <h2 className="text-sm font-bold text-navy mb-1">Facture Définitive</h2>
          <p className="text-[11.5px] text-txt2 mb-4 leading-relaxed">
            Établir une facture finale pour une vente réalisée.
          </p>
          <span className="inline-block bg-navy text-white border-none px-5 py-2.5 rounded-md text-xs font-semibold group-hover:bg-navy-l transition-colors">
            Créer une Facture Définitive
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gold">Livraison</span>
        <div className="flex-1 h-px bg-gradient-to-r from-gold to-transparent" />
      </div>
      <div className="max-w-[380px] mx-auto mb-7">
        <Link
          href="/bl"
          className="group bg-white border-2 border-gold rounded-[10px] p-6 text-center transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="text-3xl mb-2" aria-hidden="true">&#128230;</div>
          <h2 className="text-sm font-bold text-navy mb-1">Bon de Livraison</h2>
          <p className="text-[11.5px] text-txt2 mb-4 leading-relaxed">
            Accompagner une livraison et recueillir la signature du client.
          </p>
          <span className="inline-block bg-gold text-navy border-none px-5 py-2.5 rounded-md text-xs font-bold group-hover:bg-[#b89840] transition-colors">
            Créer un Bon de Livraison
          </span>
        </Link>
      </div>

      {recentDocs.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-txt2">Documents récents</span>
            <div className="flex-1 h-px bg-gradient-to-r from-bdr to-transparent" />
          </div>
          <div className="bg-white border border-bdr rounded-[10px] overflow-hidden">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-4 py-2.5 border-b border-bdr/50 last:border-b-0">
                <div>
                  <span className="text-xs font-bold text-navy">{doc.num}</span>
                  <span className="text-[10px] text-txt2 ml-2">{doc.type}</span>
                </div>
                <span className="text-xs font-bold text-navy">
                  {doc.total ? doc.total.toLocaleString("fr-FR") + " F" : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-txt2">Navigation</span>
        <div className="flex-1 h-px bg-gradient-to-r from-bdr to-transparent" />
      </div>
      <div className="flex gap-3 mb-10">
        <Link href="/documents" className="bg-white border border-bdr text-navy px-5 py-2.5 rounded-md text-xs font-semibold transition-all hover:border-navy hover:shadow-sm">
          Tous les documents
        </Link>
        <Link href="/audit" className="bg-white border border-bdr text-txt2 px-5 py-2.5 rounded-md text-xs font-semibold transition-all hover:border-navy hover:text-navy hover:shadow-sm">
          Journal d&apos;audit
        </Link>
      </div>

      <div className="text-center">
        <Link
          href="/settings"
          className="inline-block bg-white border border-bdr text-txt2 px-5 py-2.5 rounded-md text-xs cursor-pointer transition-all hover:border-navy hover:text-navy"
        >
          &#9881; Paramètres de l&apos;entreprise
        </Link>
      </div>
    </main>
  );
}
