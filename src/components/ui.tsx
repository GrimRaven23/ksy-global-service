"use client";

export function Card({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={`bg-white border border-bdr rounded-[10px] p-4 ${wide ? "md:col-span-2" : ""}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold uppercase tracking-wide text-white bg-navy -mt-4 -mx-4 mb-3.5 px-4 py-[7px] rounded-t-[10px]">
      {children}
    </h2>
  );
}

export function Field({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <label className="block text-[10px] font-semibold text-txt2 uppercase tracking-wide mb-0.5">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 border border-bdr rounded text-xs focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:opacity-50"
      />
    </div>
  );
}
