import { Check, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

/* ---------- Page intro ---------- */
export function PageIntro({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  const { t } = useI18n();
  return (
    <header className="border-b bg-paper">
      <div className="site-container py-14 md:py-20">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            {t.common.home}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{eyebrow}</span>
        </nav>
        <h1 className="max-w-3xl text-4xl md:text-[3.25rem]">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{lead}</p>
      </div>
    </header>
  );
}

/* ---------- Section inside a form card ---------- */
export function FormSection({
  title,
  hint,
  aside,
  children,
}: {
  title: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t px-6 py-8 first:border-t-0 md:px-8">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-2xl">{title}</h2>
          {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function OptionalTag() {
  const { t } = useI18n();
  return <span className="text-xs font-medium text-muted-foreground">{t.common.optional}</span>;
}

/* ---------- Field ---------- */
export function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} data-invalid={error ? "" : undefined}>
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && <p className="text-[13px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

export const invalidClass = "border-destructive focus-visible:ring-destructive";

/* ---------- Segmented choice ---------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-md border border-input bg-card p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-9 flex-1 rounded-[4px] px-3 text-sm font-semibold transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Checkbox row with price ---------- */
export function OptionRow({
  label,
  detail,
  price,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  detail?: string;
  price: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-4 rounded-md border bg-card px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        checked ? "border-foreground" : "border-input hover:border-foreground/40",
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-[4px] border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="flex-1">
        <span className="block text-[15px] font-semibold">{label}</span>
        {detail && <span className="block text-sm text-muted-foreground">{detail}</span>}
      </span>
      <span className="figure text-lg">{price}</span>
    </button>
  );
}

/* ---------- Stepper ---------- */
export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  lessLabel,
  moreLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  lessLabel: string;
  moreLabel: string;
}) {
  return (
    <div className="flex h-11 items-center rounded-md border border-input bg-card" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={lessLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-full w-11 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
      <span className="flex-1 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={moreLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-full w-11 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/* ---------- Summary panel ---------- */
export function Summary({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-lg border bg-card lg:sticky lg:top-24">
      <h2 className="border-b px-6 py-5 text-xl">{title}</h2>
      <div className="px-6 py-5">{children}</div>
    </aside>
  );
}

export function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dashed py-2.5 text-[14.5px] last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

export function SummaryTotal({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="my-5 flex items-baseline justify-between border-t pt-5">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span className="figure text-4xl">
        {value}
        {suffix && <small className="ml-1.5 font-sans text-sm text-muted-foreground">{suffix}</small>}
      </span>
    </div>
  );
}

export function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" }) {
  return (
    <p className={cn("mt-3 text-[13px] leading-relaxed", tone === "error" ? "font-medium text-destructive" : "text-muted-foreground")}>
      {children}
    </p>
  );
}

/* ---------- Two-column booking layout ---------- */
export function BookingLayout({ form, summary }: { form: ReactNode; summary: ReactNode }) {
  return (
    <div className="site-container grid gap-8 py-12 lg:grid-cols-[1fr_360px] lg:items-start lg:py-16">
      <div className="overflow-hidden rounded-lg border bg-card">{form}</div>
      {summary}
    </div>
  );
}
