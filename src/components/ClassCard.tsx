"use client";
import Link from "next/link";
import { Clock, Users, Video } from "lucide-react";
import type { ClassRow, Role } from "@/lib/types";
import { fmtDate, fmtTime, relative } from "@/lib/format";
import { Badge, LinkButton } from "./ui";

export function classHref(c: ClassRow, role: Role) {
  return role === "family" ? `/join/${c.id}` : `/classes/${c.id}`;
}

export function ClassAction({ c, role, size = "md" }: { c: ClassRow; role: Role; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "px-6 py-3 text-base" : "";
  if (c.status === "cancelled" || c.status === "ended") return <LinkButton href={classHref(c, role)} variant="secondary" className={cls}>View</LinkButton>;
  if (role === "family") {
    return c.status === "live"
      ? <LinkButton href={`/room/${c.id}`} variant="success" className={cls}><Video className="h-4 w-4" />Join class</LinkButton>
      : <LinkButton href={`/join/${c.id}`} variant="secondary" className={cls}>Details</LinkButton>;
  }
  return <LinkButton href={`/room/${c.id}`} variant={c.status === "live" ? "success" : "primary"} className={cls}><Video className="h-4 w-4" />{c.status === "live" ? "Rejoin class" : "Start class"}</LinkButton>;
}

export function ClassRowItem({ c, role, showEducator }: { c: ClassRow; role: Role; showEducator?: boolean }) {
  const d = new Date(c.starts_at);
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-brand-50 py-1.5 text-brand-700">
        <span className="text-[11px] font-semibold uppercase">{d.toLocaleDateString(undefined, { month: "short" })}</span>
        <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
      </div>
      <Link href={classHref(c, role)} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-slate-900 hover:text-brand-700">{c.title}</p>
          <Badge value={c.status} />
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmtTime(c.starts_at)} · {c.duration_min} min</span>
          {c.status === "scheduled" && <span>{relative(c.starts_at)}</span>}
          {showEducator && c.educator && <span>with {c.educator.full_name}</span>}
          {role !== "family" && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{c.class_invites?.length ?? 0} invited</span>}
        </p>
      </Link>
      <div className="shrink-0"><ClassAction c={c} role={role} /></div>
    </div>
  );
}

export function NextClassHero({ c, role }: { c: ClassRow; role: Role }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-900 p-6 text-white sm:p-8">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-600/50 blur-2xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-200">{c.status === "live" ? "Happening now" : "Next class"}</p>
          <h2 className="mt-1 text-2xl font-bold">{c.title}</h2>
          <p className="mt-2 text-sm text-brand-100">
            {fmtDate(c.starts_at)} · {fmtTime(c.starts_at)} · {c.duration_min} min
            {role === "family" && c.educator ? ` · with ${c.educator.full_name}` : ""}
          </p>
          {c.status === "scheduled" && <p className="mt-1 text-sm font-semibold text-accent">Starts {relative(c.starts_at)}</p>}
        </div>
        <ClassAction c={c} role={role} size="lg" />
      </div>
    </div>
  );
}
