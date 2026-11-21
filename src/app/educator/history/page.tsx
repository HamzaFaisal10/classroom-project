"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchClasses } from "@/lib/data";
import { fmtDate, fmtTime, minutesBetween } from "@/lib/format";
import type { ClassRow } from "@/lib/types";
import { Badge, Card, Empty, PageHeader, Spinner } from "@/components/ui";

export default function EducatorHistory() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  useEffect(() => { if (profile) fetchClasses({ educatorId: profile.id, statuses: ["ended", "cancelled"], ascending: false }).then(setClasses); }, [profile]);
  if (!classes) return <Spinner />;
  return (
    <>
      <PageHeader title="Class history" subtitle="Past and cancelled classes." />
      <Card className="overflow-x-auto">
        {classes.length === 0 ? <Empty icon={<History className="h-5 w-5" />} title="No past classes yet" /> : (
          <table className="table-base">
            <thead><tr><th>Class</th><th>Date</th><th>Duration</th><th>Invited</th><th>Status</th></tr></thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td><Link href={`/classes/${c.id}`} className="font-medium hover:text-brand-700">{c.title}</Link></td>
                  <td className="text-slate-600">{fmtDate(c.starts_at)} · {fmtTime(c.starts_at)}</td>
                  <td className="text-slate-600">{c.started_at && c.ended_at ? `${minutesBetween(c.started_at, c.ended_at)} min` : "—"}</td>
                  <td className="text-slate-600">{c.class_invites?.length ?? 0}</td>
                  <td><Badge value={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
