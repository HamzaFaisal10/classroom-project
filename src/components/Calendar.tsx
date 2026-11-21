"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ClassRow, Role } from "@/lib/types";
import { fmtTime } from "@/lib/format";
import { classHref } from "./ClassCard";

type View = "week" | "month";

function startOfWeek(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x;
}
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const statusColor: Record<string, string> = {
  scheduled: "bg-brand-50 text-brand-800 border-brand-200",
  live: "bg-rose-50 text-rose-800 border-rose-200",
  ended: "bg-slate-50 text-slate-500 border-slate-200",
  cancelled: "bg-amber-50 text-amber-700 border-amber-200 line-through",
};

export function Calendar({ classes, role, showEducator }: { classes: ClassRow[]; role: Role; showEducator?: boolean }) {
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(() => new Date());

  const days = useMemo(() => {
    if (view === "week") {
      const s = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const s = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
  }, [view, cursor]);

  function shift(dir: number) {
    const d = new Date(cursor);
    if (view === "week") d.setDate(d.getDate() + 7 * dir); else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  }

  const label = view === "week"
    ? `${days[0].toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
    : cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50" aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => shift(1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50" aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setCursor(new Date())} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Today</button>
          <span className="ml-2 text-sm font-semibold">{label}</span>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1 text-sm">
          {(["week", "month"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-lg px-3 py-1 font-medium capitalize ${view === v ? "bg-white shadow-sm" : "text-slate-500"}`}>{v}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const items = classes.filter((c) => sameDay(new Date(c.starts_at), d)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
          const out = view === "month" && d.getMonth() !== cursor.getMonth();
          return (
            <div key={i} className={`border-b border-r border-slate-100 p-1.5 ${view === "week" ? "min-h-48" : "min-h-24"} ${out ? "bg-slate-50/60" : ""}`}>
              <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${sameDay(d, today) ? "bg-brand-600 text-white" : out ? "text-slate-300" : "text-slate-600"}`}>{d.getDate()}</div>
              <div className="space-y-1">
                {items.map((c) => (
                  <Link key={c.id} href={classHref(c, role)} className={`block rounded-lg border px-1.5 py-1 text-[11px] leading-tight hover:shadow-sm ${statusColor[c.status]}`}>
                    <span className="font-semibold">{fmtTime(c.starts_at)}</span>
                    <span className="block truncate">{c.title}</span>
                    {showEducator && view === "week" && c.educator && <span className="block truncate opacity-70">{c.educator.full_name}</span>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
