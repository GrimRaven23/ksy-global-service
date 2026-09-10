"use client";

import { Search, ChevronLeft, ChevronRight, Loader2, ArrowLeft, AlertTriangle, RefreshCw, WifiOff, Lock, FileWarning, Info, CheckCircle2, Pencil, CheckCheck, Ban, ArrowRightLeft, CircleDot } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

// ─── Button ──────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "gold";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const btnVariants: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white hover:bg-navy-l border-transparent shadow-sm hover:shadow-md",
  secondary: "bg-white dark:bg-surface text-txt hover:bg-gray-50 dark:hover:bg-white/5 border-bdr shadow-xs hover:shadow-sm",
  danger: "bg-red text-white hover:bg-red/90 border-transparent shadow-sm hover:shadow-md",
  ghost: "bg-transparent text-txt2 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-txt border-transparent",
  outline: "bg-white dark:bg-surface text-navy border-navy/20 hover:bg-navy/5 dark:hover:bg-navy/10 hover:border-navy/30",
  gold: "bg-gold text-navy hover:bg-gold-lt border-transparent shadow-sm hover:shadow-md",
};

const btnSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs min-h-[32px] rounded-md",
  md: "px-4 py-2 text-sm min-h-[38px] rounded-lg",
  lg: "px-5 py-2.5 text-sm min-h-[42px] rounded-lg",
  icon: "p-2 min-h-[36px] min-w-[36px] rounded-lg",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 font-semibold border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Badge ───────────────────────────────────────────────────
export function Badge({
  children,
  color = "bg-gray-100 text-gray-600",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${color} ${className}`}>
      {children}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────
export function Card({
  children,
  wide = false,
  hover = false,
  shadow = false,
  className = "",
}: {
  children: React.ReactNode;
  wide?: boolean;
  hover?: boolean;
  shadow?: boolean;
  className?: string;
}) {
  return (
    <section
      className={`bg-white dark:bg-surface border border-bdr/60 rounded-xl p-4 sm:p-5 ${wide ? "md:col-span-2" : ""} ${hover ? "hover:border-navy/20 hover:shadow-card-hover transition-all duration-200" : ""} ${shadow ? "shadow-card" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

// ─── SectionTitle ────────────────────────────────────────────
export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white gradient-navy -mt-4 -mx-4 sm:-mx-5 mb-3.5 px-4 py-2.5 rounded-t-xl">
      {icon}
      {children}
    </h2>
  );
}

// ─── Field ───────────────────────────────────────────────────
export function Field({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
  disabled,
  error,
  helpText,
  required,
  id,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  required?: boolean;
  id?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mb-3 last:mb-0">
      <label htmlFor={fieldId} className="block text-[11px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red">*</span>}
      </label>
      <input
        id={fieldId}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none disabled:opacity-40 disabled:bg-gray-50 dark:disabled:bg-white/5 bg-white dark:bg-surface ${
          error
            ? "border-red focus:border-red focus:ring-2 focus:ring-red/10"
            : "border-bdr focus:border-navy focus:ring-2 focus:ring-navy/10 hover:border-gray-400"
        }`}
      />
      {error && <p id={`${fieldId}-error`} className="text-[11px] text-red mt-1 flex items-center gap-1" role="alert">{error}</p>}
      {helpText && !error && <p id={`${fieldId}-help`} className="text-[11px] text-txt3 mt-1">{helpText}</p>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────
export function Select({
  label,
  value,
  options,
  onChange,
  disabled,
  id,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mb-3 last:mb-0">
      <label htmlFor={fieldId} className="block text-[11px] font-semibold text-txt2 uppercase tracking-wide mb-1.5">{label}</label>
      <select
        id={fieldId}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-bdr rounded-lg text-sm transition-colors focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:opacity-40 disabled:bg-gray-50 dark:disabled:bg-white/5 bg-white dark:bg-surface hover:border-gray-400 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded-lg ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-surface border border-bdr/60 rounded-xl p-4 sm:p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────
export function EmptyState({
  icon,
  message,
  action,
  onAction,
}: {
  icon?: React.ReactNode;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
      {icon && <div className="text-txt3 mb-3">{icon}</div>}
      <p className="text-sm text-txt2 mb-4 max-w-xs leading-relaxed">{message}</p>
      {action && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────
export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizes = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  };

  return (
    <div className={`${sizes[size]} rounded-full bg-navy/8 dark:bg-navy/20 text-navy dark:text-white font-bold flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-surface ${className}`}>
      {initials}
    </div>
  );
}

// ─── SearchInput ─────────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt3" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 border border-bdr rounded-lg text-sm transition-colors focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 bg-white dark:bg-surface hover:border-gray-400"
      />
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────
export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="p-2 rounded-lg border border-bdr text-txt2 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-400 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-xs text-txt3">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[34px] h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              p === page
                ? "bg-navy text-white shadow-sm"
                : "border border-bdr text-txt2 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-400"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="p-2 rounded-lg border border-bdr text-txt2 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-400 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || "Basculer"}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-colors ${checked ? "bg-navy" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : ""}`} />
      </button>
      {label && <span className="text-sm text-txt2">{label}</span>}
    </label>
  );
}

// ─── PageHeader ──────────────────────────────────────────────
export function PageHeader({
  title,
  backHref,
  onBack,
  children,
}: {
  title: string;
  backHref?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-surface border-b border-bdr/60 sticky top-0 z-40 md:static md:z-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 flex items-center justify-between h-12 md:h-14 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {(backHref || onBack) && (
            <button
              onClick={onBack || (() => window.history.back())}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft className="w-4 h-4 text-navy dark:text-white" />
            </button>
          )}
          <h1 className="text-sm sm:text-base font-bold text-navy dark:text-white truncate">{title}</h1>
        </div>
        {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>
    </div>
  );
}

// ─── FilterPills ─────────────────────────────────────────────
export function FilterPills({
  groups,
}: {
  groups: { label: string; options: { value: string; label: string }[]; selected: string; onChange: (v: string) => void }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-2">
          {gi > 0 && <span className="w-px h-5 bg-bdr" />}
          <span className="text-[10px] sm:text-[11px] font-semibold text-txt3 uppercase tracking-wide">{group.label}:</span>
          <div className="flex flex-wrap gap-1">
            {group.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => group.onChange(opt.value)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                  group.selected === opt.value
                    ? "bg-navy text-white border-navy shadow-sm"
                    : "bg-white dark:bg-surface text-txt2 border-bdr hover:border-gray-400 hover:text-txt"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── StatusBadge (icon + text, never color-only) ─────────────
const STATUS_META: Record<string, { icon: typeof CircleDot; classes: string }> = {
  DRAFT: { icon: Pencil, classes: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200 ring-gray-300 dark:ring-white/15" },
  EMISE: { icon: CheckCheck, classes: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300 ring-green-300 dark:ring-green-500/30" },
  FINALIZED: { icon: CheckCheck, classes: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300 ring-green-300 dark:ring-green-500/30" },
  CONVERTED: { icon: ArrowRightLeft, classes: "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300 ring-purple-300 dark:ring-purple-500/30" },
  CANCELLED: { icon: Ban, classes: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300 ring-red-300 dark:ring-red-500/30" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const meta = STATUS_META[status] || { icon: CircleDot, classes: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-200 ring-gray-300" };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ring-1 ${meta.classes}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {label ?? status}
    </span>
  );
}

// ─── Alert (proactive inline message) ────────────────────────
export function Alert({
  tone = "info",
  title,
  children,
  action,
  onAction,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  const tones = {
    info: { box: "bg-blue-bg dark:bg-blue-500/10 border-blue/25", icon: <Info className="w-4 h-4 text-blue" />, title: "text-navy dark:text-white" },
    success: { box: "bg-green-bg dark:bg-green-500/10 border-green/25", icon: <CheckCircle2 className="w-4 h-4 text-green" />, title: "text-green dark:text-green" },
    warning: { box: "bg-gold-bg dark:bg-gold/10 border-gold/30", icon: <AlertTriangle className="w-4 h-4 text-gold" />, title: "text-navy dark:text-gold-lt" },
    danger: { box: "bg-red-bg dark:bg-red-500/10 border-red/25", icon: <AlertTriangle className="w-4 h-4 text-red" />, title: "text-red" },
  };
  const t = tones[tone];
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={`border rounded-xl px-3.5 py-3 flex items-start gap-2.5 ${t.box}`}>
      <span className="mt-0.5 shrink-0">{t.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className={`text-xs font-bold mb-0.5 ${t.title}`}>{title}</p>}
        <div className="text-xs text-txt2 dark:text-white/70 leading-relaxed">{children}</div>
        {action && onAction && (
          <button onClick={onAction} className="mt-2 text-xs font-bold text-navy dark:text-gold-lt hover:underline cursor-pointer">
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ErrorState (contextual: WHAT / WHERE / ACTION + ref) ───
export function ErrorState({
  title,
  step,
  cause,
  action,
  onRetry,
  retryLabel = "Réessayer",
  reference,
  details,
}: {
  title: string;
  step?: string;
  cause?: string;
  action?: string;
  onRetry?: () => void;
  retryLabel?: string;
  reference?: string;
  details?: string;
}) {
  return (
    <div role="alert" className="bg-white dark:bg-surface border border-red/25 rounded-2xl p-5 sm:p-6 max-w-lg mx-auto shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-bg dark:bg-red-500/15 flex items-center justify-center shrink-0">
          <FileWarning className="w-5 h-5 text-red" />
        </div>
        <h2 className="text-sm font-bold text-navy dark:text-white">{title}</h2>
      </div>
      <dl className="space-y-2 text-xs mb-4">
        {step && (
          <div className="flex gap-2">
            <dt className="font-bold text-txt2 w-16 shrink-0 uppercase text-[10px] tracking-wide pt-0.5">Étape</dt>
            <dd className="text-txt dark:text-white/80">{step}</dd>
          </div>
        )}
        {cause && (
          <div className="flex gap-2">
            <dt className="font-bold text-txt2 w-16 shrink-0 uppercase text-[10px] tracking-wide pt-0.5">Cause</dt>
            <dd className="text-txt dark:text-white/80">{cause}</dd>
          </div>
        )}
        {action && (
          <div className="flex gap-2">
            <dt className="font-bold text-txt2 w-16 shrink-0 uppercase text-[10px] tracking-wide pt-0.5">Action</dt>
            <dd className="text-txt dark:text-white/80">{action}</dd>
          </div>
        )}
      </dl>
      {reference && (
        <p className="text-[11px] text-txt3 mb-4">
          Référence : <span className="font-mono font-bold text-txt2">{reference}</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {onRetry && (
          <Button variant="primary" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5" /> {retryLabel}
          </Button>
        )}
        {details && (
          <details className="text-[11px] text-txt3">
            <summary className="cursor-pointer hover:text-txt2 font-semibold">Voir les détails techniques</summary>
            <pre className="mt-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg overflow-x-auto font-mono text-[10px]">{details}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div role="alert" className="flex items-center justify-center gap-2 bg-gold text-navy text-xs font-bold px-4 py-2">
      <WifiOff className="w-4 h-4" aria-hidden="true" />
      Connexion perdue — vos modifications ne sont pas enregistrées. Vérifiez votre réseau.
    </div>
  );
}

export function ForbiddenNote() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-txt3">
      <Lock className="w-3 h-3" aria-hidden="true" /> Action non autorisée pour votre rôle
    </span>
  );
}

// ─── ThemeSwitcher (Clair / Sombre / Système) ────────────────
export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light" as const, icon: Sun, label: "Clair" },
    { value: "dark" as const, icon: Moon, label: "Sombre" },
    { value: "system" as const, icon: Monitor, label: "Système" },
  ];
  return (
    <div role="group" aria-label="Thème d'affichage" className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-100 dark:bg-white/10 ${compact ? "" : "border border-bdr/60"}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          aria-pressed={theme === opt.value}
          title={`Thème ${opt.label.toLowerCase()}`}
          className={`flex items-center gap-1 rounded-md transition-all cursor-pointer ${compact ? "p-1.5" : "px-2 py-1.5 text-[11px] font-semibold"} ${
            theme === opt.value
              ? "bg-white dark:bg-surface text-navy dark:text-gold-lt shadow-sm"
              : "text-txt3 hover:text-txt"
          }`}
        >
          <opt.icon className="w-3.5 h-3.5" />
          {!compact && opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── KSY gold divider motif ──────────────────────────────────
export function KsyDivider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-2 ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/60 to-gold" />
      <span className="w-1.5 h-1.5 rotate-45 bg-gold shrink-0" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/60 to-gold" />
    </div>
  );
}
