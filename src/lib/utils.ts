export function fmtDate(iso: string | Date | null): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function fmtDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function todayStr(): string {
  return fmtDateISO(new Date());
}

export function fmtNum(n: number): string {
  return n
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function padN(n: number): string {
  return String(n).padStart(2, "0");
}

export function curYear(): number {
  return new Date().getFullYear();
}

export function numToWords(n: number): string {
  if (n === 0) return "zéro";
  if (n < 0) return "moins " + numToWords(-n);

  const o = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
    "vingt",
  ];
  const t = [
    "",
    "",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante-dix",
    "quatre-vingt",
    "quatre-vingt-dix",
  ];

  function td(v: number): string {
    if (v === 0) return "";
    if (v <= 20) return o[v];
    const a = Math.floor(v / 10);
    const b = v % 10;
    if (a === 7)
      return "soixante" + (b === 0 ? "-dix" : b === 1 ? " et onze" : "-" + o[v - 60]);
    if (a === 9)
      return "quatre-vingt" + (b === 0 ? "-dix" : b === 1 ? "-onze" : "-" + o[v - 80]);
    const s = t[a];
    if (b === 1 && a >= 2 && a <= 6) return s + " et un";
    return s + (b ? "-" + o[b] : "");
  }

  function hd(v: number): string {
    if (v === 0) return "";
    const h = Math.floor(v / 100);
    const r = v % 100;
    let s = "";
    if (h > 0) {
      s = h === 1 ? "cent" : o[h] + " cents";
      if (r > 0) s = s.replace(/s$/, "");
    }
    if (r > 0) s += (s ? " " : "") + td(r);
    return s;
  }

  function gr(v: number): string {
    if (v === 0) return "";
    if (v < 1000) return hd(v);
    const th = Math.floor(v / 1000);
    const r = v % 1000;
    let s = th === 1 ? "mille" : hd(th) + " mille";
    if (r > 0) s += " " + hd(r);
    return s;
  }

  function ml(v: number): string {
    if (v < 1e6) return gr(v);
    const m = Math.floor(v / 1e6);
    const r = v % 1e6;
    let s = m === 1 ? "un million" : hd(m) + " millions";
    if (r > 0) {
      s += (r < 100 ? " et " : " ") + gr(r);
    }
    return s;
  }

  function bl(v: number): string {
    if (v < 1e9) return ml(v);
    const m = Math.floor(v / 1e9);
    const r = v % 1e9;
    let s = m === 1 ? "un milliard" : hd(m) + " milliards";
    if (r > 0) s += " " + ml(r);
    return s;
  }

  return bl(n);
}

export function numToWordsFCFA(n: number): string {
  return numToWords(n) + " FCFA";
}

export function calcInvoice(products: { quantity: number; unitPrice: number }[], tvaOn: boolean, tvaRate: number) {
  let subtotal = 0;
  const items = products.map((p) => {
    const q = Math.max(0, p.quantity || 0);
    const pr = Math.max(0, p.unitPrice || 0);
    const lineTotal = q * pr;
    subtotal += lineTotal;
    return { ...p, _total: lineTotal };
  });
  const rate = tvaRate || 18;
  const tva = tvaOn ? (subtotal * rate) / 100 : 0;
  return { items, subtotal, tva, rate, total: subtotal + tva };
}
