export function typeLabel(t: string): string {
  if (t === "PROFORMA") return "Pro Forma";
  if (t === "DEFINITIVE") return "Définitive";
  if (t === "BL") return "Bon de Livraison";
  return t;
}

export function typeColor(t: string): string {
  if (t === "PROFORMA") return "bg-navy/10 text-navy";
  if (t === "DEFINITIVE") return "bg-blue-100 text-blue-700";
  return "bg-gold/20 text-navy";
}

export function statusLabel(s: string): string {
  if (s === "DRAFT") return "Brouillon";
  if (s === "EMISE" || s === "FINALIZED") return "Finalisée";
  if (s === "CONVERTED") return "Convertie";
  if (s === "CANCELLED") return "Annulée";
  return s;
}

export function statusColor(s: string): string {
  if (s === "DRAFT") return "bg-gray-100 text-gray-600";
  if (s === "EMISE" || s === "FINALIZED") return "bg-green-100 text-green-700";
  if (s === "CONVERTED") return "bg-purple-100 text-purple-700";
  if (s === "CANCELLED") return "bg-red-100 text-red-600";
  return "bg-gray-100 text-gray-600";
}

export function roleLabel(r: string): string {
  const labels: Record<string, string> = {
    OWNER: "Propriétaire",
    IT_ADMIN: "Admin IT",
    DEVELOPER: "Développeur",
    ADMIN: "Administrateur",
    ACCOUNTANT: "Comptable",
    SALES: "Vente",
    ASSISTANT: "Assistant",
    PROJECT_MANAGER: "Chef de Projet",
    DELIVERY: "Livreur",
    WAREHOUSE: "Magasinier",
    COMPLIANCE: "Conformité",
    VIEWER: "Lecteur",
  };
  return labels[r] || r;
}

export function roleColor(r: string): string {
  const colors: Record<string, string> = {
    OWNER: "bg-gold/20 text-navy",
    IT_ADMIN: "bg-purple-100 text-purple-700",
    DEVELOPER: "bg-slate-200 text-slate-700",
    ADMIN: "bg-blue-100 text-blue-700",
    ACCOUNTANT: "bg-emerald-100 text-emerald-700",
    SALES: "bg-green-100 text-green-700",
    PROJECT_MANAGER: "bg-cyan-100 text-cyan-700",
    ASSISTANT: "bg-teal-100 text-teal-700",
    COMPLIANCE: "bg-indigo-100 text-indigo-700",
    DELIVERY: "bg-orange-100 text-orange-700",
    WAREHOUSE: "bg-amber-100 text-amber-700",
    VIEWER: "bg-gray-100 text-gray-600",
  };
  return colors[r] || "bg-gray-100 text-gray-600";
}

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHr < 24) return `Il y a ${diffHr}h`;
  if (diffDay < 7) return `Il y a ${diffDay}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}
