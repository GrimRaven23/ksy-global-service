"use client";

import { Search, ChevronLeft, ChevronRight, Loader2, ArrowLeft } from "lucide-react";

// ─── Button ──────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const btnVariants: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white hover:bg-navy-l border-transparent",
  secondary: "bg-gray-100 text-txt hover:bg-gray-200 border-transparent",
  danger: "bg-red text-white hover:bg-red/90 border-transparent",
  ghost: "bg-transparent text-txt2 hover:bg-gray-100 border-transparent",
  outline: "bg-white text-navy border-navy hover:bg-navy/5",
};

const btnSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs min-h-[36px]",
  md: "px-4 py-2.5 text-sm min-h-[40px]",
  lg: "px-5 py-3 text-sm min-h-[44px]",
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
      className={`inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97] ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${color} ${className}`}>
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
      className={`bg-white border border-bdr rounded-xl p-4 sm:p-5 ${wide ? "md:col-span-2" : ""} ${hover ? "hover:border-navy/30 hover:shadow-md transition-all duration-200" : ""} ${shadow ? "shadow-sm" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

// ─── SectionTitle ────────────────────────────────────────────
export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-white bg-navy -mt-4 -mx-4 sm:-mx-5 mb-3.5 px-4 py-2 rounded-t-xl">
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
      <label htmlFor={fieldId} className="block text-[11px] font-semibold text-txt2 uppercase tracking-wide mb-1">
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
        className={`w-full px-3 py-2.5 border rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${error ? "border-red focus:border-red focus:ring-red/10" : "border-bdr focus:border-navy focus:ring-navy/10"}`}
      />
      {error && <p className="text-[11px] text-red mt-1">{error}</p>}
      {helpText && !error && <p className="text-[11px] text-txt2 mt-1">{helpText}</p>}
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
      <label htmlFor={fieldId} className="block text-[11px] font-semibold text-txt2 uppercase tracking-wide mb-1">{label}</label>
      <select
        id={fieldId}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-bdr rounded-lg text-sm min-h-[40px] focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:opacity-50 bg-white transition-colors"
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
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-bdr rounded-xl p-4 sm:p-5 space-y-3">
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
      {icon && <div className="text-txt2/30 mb-4">{icon}</div>}
      <p className="text-sm text-txt2 mb-4 max-w-xs">{message}</p>
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
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-base",
  };

  return (
    <div className={`${sizes[size]} rounded-full bg-navy/10 text-navy font-bold flex items-center justify-center shrink-0 ${className}`}>
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 border border-bdr rounded-lg text-sm min-h-[40px] focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 bg-white transition-colors"
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
    <div className="flex items-center gap-1">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="p-2 rounded-lg border border-bdr text-txt2 hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[36px] min-w-[36px]"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-xs text-txt2">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[36px] h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              p === page ? "bg-navy text-white" : "border border-bdr text-txt2 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="p-2 rounded-lg border border-bdr text-txt2 hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[36px] min-w-[36px]"
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
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-navy" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
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
  const router = typeof window !== "undefined" ? null : null;
  return (
    <div className="bg-white border-b-2 border-navy sticky top-0 z-40 md:static md:z-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 flex items-center justify-between h-12 md:h-14 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {(backHref || onBack) && (
            <button
              onClick={onBack || (() => window.history.back())}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft className="w-4 h-4 text-navy" />
            </button>
          )}
          <h1 className="text-sm sm:text-base font-bold text-navy truncate">{title}</h1>
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
          <span className="text-[10px] sm:text-[11px] font-semibold text-txt2 uppercase tracking-wide">{group.label}:</span>
          <div className="flex flex-wrap gap-1.5">
            {group.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => group.onChange(opt.value)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                  group.selected === opt.value
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-navy border-bdr hover:border-navy/30"
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
