"use client";
import { useEffect, useMemo, useState } from "react";
import { Clock, Download, Percent, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { download, fetchClasses, fetchProfiles, toCsv } from "@/lib/data";
import { fmtDate, minutesBetween } from "@/lib/format";
import type { ClassRow, Profile } from "@/lib/types";
import { Button, Card, CardHeader, PageHeader, Spinner, Stat } from "@/components/ui";

interface Att { class_id: string; user_id: string; joined_at: string; left_at: string | null }

export default function ReportsPage() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [att, setAtt] = useState<Att[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const from = new Date(Date.now() - days * 86400000).toISOString();
    fetchClasses({ from, to: new Date(Date.now() + 86400000).toISOString(), ascending: false }).then(setClasses);
    supabase.from("attendance").select("class_id, user_id, joined_at, left_at").gte("joined_at", from).then(({ data }) => setAtt((data ?? []) as Att[]));
    fetchProfiles().then(setPeople);
  }, [days]);

  const held = useMemo(() => (classes ?? []).filter((c) => c.status === "ended"), [classes]);
  const rows = useMemo(() => held.map((c) => {
    const invited = c.class_invites?.length ?? 0;
    const attended = new Set(att.filter((a) => a.class_id === c.id && a.user_id !== c.educator_id).map((a) => a.user_id)).size;
    return { c, invited, attended, mins: c.started_at && c.ended_at ? minutesBetween(c.started_at, c.ended_at) : 0 };
  }), [held, att]);
  const families = useMemo(() => people.filter((p) => p.role === "family").map((f) => {
    const invited = held.filter((c) => c.class_invites?.some((i) => i.family_id === f.id)).length;
    const attended = new Set(att.filter((a) => a.user_id === f.id && held.some((c) => c.id === a.class_id)).map((a) => a.class_id)).size;
    const mins = att.filter((a) => a.user_id === f.id).reduce((s, a) => s + minutesBetween(a.joined_at, a.left_at), 0);
    return { f, invited, attended, mins };
  }), [people, held, att]);

  if (!classes) return <Spinner />;
  const totalInv = rows.reduce((s, r) => s + r.invited, 0);
  const totalAtt = rows.reduce((s, r) => s + r.attended, 0);
  const rate = totalInv ? Math.round((totalAtt / totalInv) * 100) : 0;
  const hours = Math.round(rows.reduce((s, r) => s + r.mins, 0) / 6) / 10;
  const edName = (id: string) => people.find((p) => p.id === id)?.full_name ?? "";

  function exportCsv() {
    download(`attendance-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([
      ["Class", "Educator", "Date", "Minutes", "Invited", "Attended"],
      ...rows.map((r) => [r.c.title, edName(r.c.educator_id), fmtDate(r.c.starts_at), r.mins, r.invited, r.attended]),
    ]));
  }

  return (
    <>
      <PageHeader title="Reports" subtitle="Classes held and attendance."
        actions={<><select className="input w-40" value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select>
          <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</Button></>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Classes held" value={held.length} icon={<Video className="h-5 w-5" />} />
        <Stat label="Attendance rate" value={`${rate}%`} icon={<Percent className="h-5 w-5" />} tone="teal" />
        <Stat label="Teaching hours" value={hours} icon={<Clock className="h-5 w-5" />} tone="amber" />
      </div>
      <Card className="mt-6 overflow-x-auto">
        <CardHeader title="Classes" />
        <table className="table-base">
          <thead><tr><th>Class</th><th>Educator</th><th>Date</th><th>Minutes</th><th>Attendance</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No classes held in this period.</td></tr>}
            {rows.map((r) => (
              <tr key={r.c.id}>
                <td className="font-medium">{r.c.title}</td><td className="text-slate-600">{edName(r.c.educator_id)}</td>
                <td className="text-slate-600">{fmtDate(r.c.starts_at)}</td><td className="text-slate-600">{r.mins}</td>
                <td><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-teal-500" style={{ width: `${r.invited ? (r.attended / r.invited) * 100 : 0}%` }} /></div><span className="text-xs text-slate-600">{r.attended}/{r.invited}</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="mt-6 overflow-x-auto">
        <CardHeader title="Attendance by family" />
        <table className="table-base">
          <thead><tr><th>Family</th><th>Invited</th><th>Attended</th><th>Minutes in class</th></tr></thead>
          <tbody>
            {families.map((x) => <tr key={x.f.id}><td className="font-medium">{x.f.full_name}</td><td>{x.invited}</td><td>{x.attended}</td><td>{x.mins}</td></tr>)}
          </tbody>
        </table>
      </Card>
    </>
  );
}
