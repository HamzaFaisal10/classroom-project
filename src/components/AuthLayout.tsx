import { Logo } from "./Logo";
import Link from "next/link";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <Link href="/" className="relative"><Logo light /></Link>
        <div className="relative max-w-md">
          <p className="text-3xl font-bold leading-tight">Teach live, from anywhere, with every angle in view.</p>
          <p className="mt-4 text-brand-200">Schedule classes, invite families and run secure live lessons with multiple cameras — all in one place.</p>
        </div>
        <p className="relative text-sm text-brand-200">Admin · Educator · Family</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Link href="/"><Logo /></Link></div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
