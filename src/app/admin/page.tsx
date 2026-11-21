"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, CalendarDays, GraduationCap, Plus, Radio, UserPlus, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchClasses, fetchProfiles } from "@/lib/data";
import { relative } from "@/lib/format";
import type { ClassRow, Profile } from "@/lib/types";
import { Avatar, Badge, Card, CardHeader, LinkButton, PageHeader, Spinner, Stat } from "@/components/ui";
import { ClassRowItem } from "@/components/ClassCard";

interface Act { id: number; joined_at: string; user_id: string; class_id: string }

export default function AdminDashboard() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [people, setPeople] = useState<Profile[]>([]);
  const [recent, setRecent] = useState<Act[]>([]);
  const [allClasses, setAllClasses] = useState<ClassRow[]>([]);

  useEffect(() => {
    const from = new Date(); from.setHours(0, 0, 0, 0);
    fetchClasses({ from: from.toISOString(), statuses: ["scheduled", "live"] }).then(setClasses);
    fetchClasses({ ascending: false, limit: 50 }).then(setAllClasses);
    fetchProfiles().then(setPeople);
    supabase.from("attendance").select("id, joined_at, user_id, class_id").order("joined_at", { ascending: false }).limit(8).then(({ data }) => setRecent((data ?? []) as Act[]));
  }, []);

  if (!classes) return <Spinner />;
  const live = classes.filter((c) => c.status === "live");
  const today = classes.filter((c) => new Date(c.starts_at).toDateString() === new Date().toDateString());
  const name = (id: string) => people.find((p) => p.id === id)?.full_name ?? "User";
  const title = (id: string) => allClasses.find((c) => c.id === id)?.title ?? "a class";

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Everything happening across your platform."
        actions={<><LinkButton href="/admin/invite" variant="secondary"><UserPlus className="h-4 w-4" />Invite user</LinkButton><LinkButton href="/classes/new"><Plus className="h-4 w-4" />New class</LinkButton></>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Live right now" value={live.length} icon={<Radio className="h-5 w-5" />} tone="rose" />
        <Stat label="Classes today" value={today.length} icon={<CalendarDays className="h-5 w-5" />} />
        <Stat label="Educators" value={people.filter((p) => p.role === "educator").length} icon={<GraduationCap className="h-5 w-5" />} tone="amber" />
        <Stat label="Families" value={people.filter((p) => p.role === "family").length} icon={<Users className="h-5 w-5" />} tone="teal" />
      </div>

      {live.length > 0 && (
        <Card className="mt-6 border-rose-200">
          <CardHeader title="Live classes" action={<Badge value="live" label={`${live.length} live`} />} />
          <div className="divide-y divide-slate-100">{live.map((c) => <ClassRowItem key={c.id} c={c} role="admin" showEducator />)}</div>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Upcoming classes" action={<LinkButton href="/admin/schedule" variant="ghost" className="py-1.5">Master schedule</LinkButton>} />
          {classes.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing scheduled.</p> :
            <div className="divide-y divide-slate-100">{classes.filter((c) => c.status === "scheduled").slice(0, 6).map((c) => <ClassRowItem key={c.id} c={c} role="admin" showEducator />)}</div>}
        </Card>
        <Card>
          <CardHeader title="Recent activity" action={<Activity className="h-4 w-4 text-slate-400" />} />
          {recent.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">No activity yet.</p> : (
            <div className="divide-y divide-slate-100">
              {recent.map((r) => (
                <Link key={r.id} href={`/classes/${r.class_id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
                  <Avatar name={name(r.user_id)} size="sm" />
                  <div className="min-w-0 text-sm"><p><span className="font-medium">{name(r.user_id)}</span> joined <span className="font-medium">{title(r.class_id)}</span></p><p className="text-xs text-slate-400">{relative(r.joined_at)}</p></div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
