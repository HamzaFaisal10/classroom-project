"use client";
import { useEffect, useState } from "react";
import { CalendarDays, Clock4, Plus, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchClasses, fetchProfiles } from "@/lib/data";
import type { ClassRow } from "@/lib/types";
import { Card, CardHeader, Empty, LinkButton, PageHeader, Spinner, Stat } from "@/components/ui";
import { ClassRowItem, NextClassHero } from "@/components/ClassCard";

export default function EducatorDashboard() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [families, setFamilies] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const from = new Date(); from.setHours(0, 0, 0, 0);
    fetchClasses({ educatorId: profile.id, from: from.toISOString(), statuses: ["scheduled", "live"] }).then(setClasses);
    fetchProfiles("family").then((f) => setFamilies(f.filter((x) => x.educator_id === profile.id).length));
  }, [profile]);

  if (!profile || !classes) return <Spinner />;
  const live = classes.find((c) => c.status === "live");
  const next = live ?? classes.find((c) => new Date(c.starts_at).getTime() + c.duration_min * 60000 > Date.now());
  const today = classes.filter((c) => new Date(c.starts_at).toDateString() === new Date().toDateString());
  const weekEnd = Date.now() + 7 * 86400000;
  const pending = classes.reduce((n, c) => n + (c.class_invites?.filter((i) => i.rsvp === "pending").length ?? 0), 0);

  return (
    <>
      <PageHeader title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${profile.full_name.split(" ")[0]}`}
        subtitle="Here's your teaching day at a glance." actions={<LinkButton href="/classes/new"><Plus className="h-4 w-4" />New class</LinkButton>} />
      {next ? <NextClassHero c={next} role="educator" /> : (
        <Card><Empty icon={<CalendarDays className="h-5 w-5" />} title="No upcoming classes" text="Schedule a class and invite your families." action={<LinkButton href="/classes/new">Schedule a class</LinkButton>} /></Card>
      )}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Classes this week" value={classes.filter((c) => new Date(c.starts_at).getTime() < weekEnd).length} icon={<CalendarDays className="h-5 w-5" />} />
        <Stat label="My families" value={families} icon={<Users className="h-5 w-5" />} tone="teal" />
        <Stat label="Pending RSVPs" value={pending} icon={<Clock4 className="h-5 w-5" />} tone="amber" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Today" />
          {today.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">No classes today.</p> : <div className="divide-y divide-slate-100">{today.map((c) => <ClassRowItem key={c.id} c={c} role="educator" />)}</div>}
        </Card>
        <Card>
          <CardHeader title="Coming up" action={<LinkButton href="/educator/schedule" variant="ghost" className="py-1.5">View calendar</LinkButton>} />
          {classes.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing scheduled.</p> : <div className="divide-y divide-slate-100">{classes.slice(0, 5).map((c) => <ClassRowItem key={c.id} c={c} role="educator" />)}</div>}
        </Card>
      </div>
    </>
  );
}
