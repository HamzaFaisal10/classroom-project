"use client";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { initials } from "@/lib/format";

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
const btnStyles: Record<BtnVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
};
const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({ variant = "primary", loading, className = "", children, ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean }) {
  return (
    <button className={`${btnBase} ${btnStyles[variant]} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = "primary", className = "", children }:
  { href: string; variant?: BtnVariant; className?: string; children: React.ReactNode }) {
  return <Link href={href} className={`${btnBase} ${btnStyles[variant]} ${className}`}>{children}</Link>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  scheduled: "bg-brand-50 text-brand-700 ring-brand-200",
  live: "bg-rose-50 text-rose-700 ring-rose-200",
  ended: "bg-slate-100 text-slate-600 ring-slate-200",
  cancelled: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  declined: "bg-slate-100 text-slate-600 ring-slate-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-500 ring-slate-200",
  invited: "bg-sky-50 text-sky-700 ring-sky-200",
  admin: "bg-violet-50 text-violet-700 ring-violet-200",
  educator: "bg-brand-50 text-brand-700 ring-brand-200",
  family: "bg-teal-50 text-teal-700 ring-teal-200",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${badgeColors[value] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
      {value === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />}
      {label ?? value}
    </span>
  );
}

const avatarColors = ["bg-brand-100 text-brand-700", "bg-amber-100 text-amber-700", "bg-teal-100 text-teal-700", "bg-rose-100 text-rose-700", "bg-violet-100 text-violet-700", "bg-sky-100 text-sky-700"];
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const s = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return <div className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${s} ${avatarColors[n % avatarColors.length]}`}>{initials(name)}</div>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> {label ?? "Loading…"}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-3 rounded-2xl bg-brand-50 p-3 text-brand-600">{icon}</div>}
      <p className="font-semibold text-slate-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  const c = kind === "error" ? "bg-rose-50 text-rose-700 ring-rose-200" : kind === "success" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-brand-50 text-brand-700 ring-brand-200";
  return <div className={`rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${c}`}>{children}</div>;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, icon, tone = "brand" }: { label: string; value: React.ReactNode; icon: React.ReactNode; tone?: "brand" | "rose" | "amber" | "teal" }) {
  const t = { brand: "bg-brand-50 text-brand-600", rose: "bg-rose-50 text-rose-600", amber: "bg-amber-50 text-amber-600", teal: "bg-teal-50 text-teal-600" }[tone];
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`rounded-xl p-3 ${t}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

export function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}
