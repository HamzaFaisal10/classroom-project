"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchClasses, fetchProfiles } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import type { ClassRow, Profile } from "@/lib/types";
import { Avatar, Card, Empty, PageHeader, Spinner } from "@/components/ui";

export default function EducatorFamilies() {
  const { profile } = useAuth();
  const [families, setFamilies] = useState<Profile[] | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    if (!profile) return;
    fetchProfiles("family").then(setFamilies);
    fetchClasses({ educatorId: profile.id }).then(setClasses);
  }, [profile]);

  const rows = useMemo(() => (families ?? [])
    .filter((f) => `${f.full_name} ${f.email} ${f.children ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    .map((f) => {
      const mine = classes.filter((c) => c.class_invites?.some((i) => i.family_id === f.id));
      const upcoming = mine.filter((c) => c.status === "scheduled" && new Date(c.starts_at) > new Date());
      const past = mine.filter((c) => c.status === "ended");
      return { f, upcoming, past };
    }), [families, classes, q]);

  if (!families) return <Spinner />;
  return (
    <>
      <PageHeader title="My families" subtitle="Families assigned to you or invited to your classes." />
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search by name or child" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {rows.length === 0 ? <Card><Empty icon={<Users className="h-5 w-5" />} title="No families yet" text="Your admin assigns families to you." /></Card> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map(({ f, upcoming, past }) => (
            <Card key={f.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={f.full_name} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{f.full_name}</p>
                  <p className="truncate text-sm text-slate-500">{f.email}{f.phone ? ` · ${f.phone}` : ""}</p>
                </div>
              </div>
              {f.children && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">Children: {f.children}</p>}
              <div className="mt-3 flex gap-4 text-sm text-slate-600">
                <span><b>{upcoming.length}</b> upcoming</span><span><b>{past.length}</b> attended classes</span>
              </div>
              {upcoming[0] && <p className="mt-2 text-xs text-slate-500">Next: {upcoming[0].title} · {fmtDateTime(upcoming[0].starts_at)}</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
