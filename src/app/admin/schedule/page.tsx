"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { fetchClasses, fetchProfiles } from "@/lib/data";
import { tz } from "@/lib/format";
import type { ClassRow, Profile } from "@/lib/types";
import { LinkButton, PageHeader, Spinner } from "@/components/ui";
import { Calendar } from "@/components/Calendar";

export default function MasterSchedule() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [educators, setEducators] = useState<Profile[]>([]);
  const [ed, setEd] = useState("");
  const [hideCancelled, setHideCancelled] = useState(false);
  useEffect(() => { fetchClasses().then(setClasses); fetchProfiles("educator").then(setEducators); }, []);
  const shown = useMemo(() => (classes ?? []).filter((c) => (!ed || c.educator_id === ed) && (!hideCancelled || c.status !== "cancelled")), [classes, ed, hideCancelled]);
  return (
    <>
      <PageHeader title="Master schedule" subtitle={`Every class across all educators · ${tz()}`} actions={<LinkButton href="/classes/new"><Plus className="h-4 w-4" />New class</LinkButton>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input w-56" value={ed} onChange={(e) => setEd(e.target.value)}>
          <option value="">All educators</option>
          {educators.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={hideCancelled} onChange={(e) => setHideCancelled(e.target.checked)} />Hide cancelled</label>
      </div>
      {classes ? <Calendar classes={shown} role="admin" showEducator /> : <Spinner />}
    </>
  );
}
