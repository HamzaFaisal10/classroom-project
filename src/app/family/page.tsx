"use client";
import { useEffect, useState } from "react";
import { CalendarHeart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchClasses } from "@/lib/data";
import type { ClassRow } from "@/lib/types";
import { Card, CardHeader, Empty, PageHeader, Spinner } from "@/components/ui";
import { ClassRowItem, NextClassHero } from "@/components/ClassCard";

export default function FamilyHome() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  useEffect(() => {
    if (!profile) return;
    const from = new Date(Date.now() - 4 * 3600000).toISOString();
    fetchClasses({ familyId: profile.id, from, statuses: ["scheduled", "live"] }).then(setClasses);
    const t = setInterval(() => fetchClasses({ familyId: profile.id, from, statuses: ["scheduled", "live"] }).then(setClasses), 20000);
    return () => clearInterval(t);
  }, [profile]);
  if (!profile || !classes) return <Spinner />;
  const next = classes.find((c) => c.status === "live") ?? classes.find((c) => new Date(c.starts_at).getTime() + c.duration_min * 60000 > Date.now());
  return (
    <>
      <PageHeader title={`Hi, ${profile.full_name}`} subtitle={profile.children ? `Classes for ${profile.children}` : "Your upcoming classes"} />
      {next ? <NextClassHero c={next} role="family" /> : <Card><Empty icon={<CalendarHeart className="h-5 w-5" />} title="No classes scheduled" text="When your educator invites you to a class, it will appear here." /></Card>}
      <Card className="mt-6">
        <CardHeader title="Upcoming classes" />
        {classes.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing yet.</p> : <div className="divide-y divide-slate-100">{classes.map((c) => <ClassRowItem key={c.id} c={c} role="family" showEducator />)}</div>}
      </Card>
    </>
  );
}
