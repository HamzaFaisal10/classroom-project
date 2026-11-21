"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchClasses } from "@/lib/data";
import type { ClassRow } from "@/lib/types";
import { Card, Empty, PageHeader, Spinner } from "@/components/ui";
import { ClassRowItem } from "@/components/ClassCard";

export default function FamilyClasses() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  useEffect(() => { if (profile) fetchClasses({ familyId: profile.id, ascending: false }).then(setClasses); }, [profile]);
  if (!classes) return <Spinner />;
  const upcoming = classes.filter((c) => c.status === "scheduled" || c.status === "live").reverse();
  const past = classes.filter((c) => c.status === "ended" || c.status === "cancelled");
  const list = tab === "upcoming" ? upcoming : past;
  return (
    <>
      <PageHeader title="My classes" />
      <div className="mb-4 inline-flex rounded-xl bg-slate-200/60 p-1 text-sm">
        {(["upcoming", "past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 font-medium capitalize ${tab === t ? "bg-white shadow-sm" : "text-slate-500"}`}>{t} ({t === "upcoming" ? upcoming.length : past.length})</button>
        ))}
      </div>
      <Card>{list.length === 0 ? <Empty title={tab === "upcoming" ? "No upcoming classes" : "No past classes"} /> : <div className="divide-y divide-slate-100">{list.map((c) => <ClassRowItem key={c.id} c={c} role="family" showEducator />)}</div>}</Card>
    </>
  );
}
