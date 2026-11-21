"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, CalendarDays, Clock, Copy, Pencil, Trash2, Users, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { CLASS_SELECT, appUrl } from "@/lib/data";
import { fmtDate, fmtTime, fmtDateTime, minutesBetween, relative } from "@/lib/format";
import type { ClassRow, Profile } from "@/lib/types";
import { Alert, Avatar, Badge, Button, Card, CardHeader, Empty, Modal, Spinner, copy } from "@/components/ui";
import { ClassAction } from "@/components/ClassCard";

interface Att { user_id: string; joined_at: string; left_at: string | null }

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const router = useRouter();
  const [c, setC] = useState<ClassRow | null | undefined>(undefined);
  const [people, setPeople] = useState<Record<string, Profile>>({});
  const [att, setAtt] = useState<Att[]>([]);
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("classes").select(CLASS_SELECT).eq("id", id).maybeSingle();
    setC((data as ClassRow) ?? null);
    if (!data) return;
    const ids = (data as ClassRow).class_invites?.map((i) => i.family_id) ?? [];
    const { data: a } = await supabase.from("attendance").select("user_id, joined_at, left_at").eq("class_id", id).order("joined_at");
    setAtt((a ?? []) as Att[]);
    const all = [...new Set([...ids, ...((a ?? []) as Att[]).map((x) => x.user_id)])];
    if (all.length) {
      const { data: p } = await supabase.from("profiles").select("*").in("id", all);
      setPeople(Object.fromEntries(((p ?? []) as Profile[]).map((x) => [x.id, x])));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (profile?.role === "family") router.replace(`/join/${id}`); }, [profile, id, router]);

  if (c === undefined || !profile) return <Spinner />;
  if (c === null) return <Empty title="Class not found" text="It may have been deleted, or you don't have access to it." action={<Link className="text-sm font-semibold text-brand-600" href="/">Go back</Link>} />;

  const back = profile.role === "admin" ? "/admin/schedule" : "/educator/schedule";
  const joinLink = appUrl(`/join/${c.id}`);
  const editable = c.status === "scheduled";

  async function remind(familyId?: string) {
    const { data, error } = await supabase.rpc("send_class_reminder", { p_class: c!.id, p_family: familyId ?? null });
    setMsg(error ? error.message : `Reminder sent to ${data} ${data === 1 ? "family" : "families"}.`);
  }
  async function cancelClass() {
    setBusy(true);
    await supabase.from("classes").update({ status: "cancelled" }).eq("id", c!.id);
    setBusy(false); setConfirm(null); setMsg("Class cancelled. Families have been notified."); load();
  }
  async function deleteClass() {
    setBusy(true);
    await supabase.from("classes").delete().eq("id", c!.id);
    router.replace(back);
  }

  const invites = c.class_invites ?? [];
  const counts = { accepted: invites.filter((i) => i.rsvp === "accepted").length, pending: invites.filter((i) => i.rsvp === "pending").length, declined: invites.filter((i) => i.rsvp === "declined").length };

  return (
    <div>
      <Link href={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" />Schedule</Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3"><h1 className="text-2xl font-bold tracking-tight">{c.title}</h1><Badge value={c.status} /></div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmtDate(c.starts_at)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{fmtTime(c.starts_at)} · {c.duration_min} min</span>
            {c.status === "scheduled" && <span className="font-medium text-brand-600">Starts {relative(c.starts_at)}</span>}
            {c.educator && <span>Educator: {c.educator.full_name}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ClassAction c={c} role={profile.role} />
          {editable && <Link href={`/classes/${c.id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><Pencil className="h-4 w-4" />Edit</Link>}
        </div>
      </div>

      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={`Invited families (${invites.length})`} action={editable && invites.length > 0 ? <Button variant="ghost" className="py-1.5" onClick={() => remind()}><Bell className="h-4 w-4" />Remind all</Button> : undefined} />
            {invites.length === 0 ? (
              <Empty icon={<Users className="h-5 w-5" />} title="No families invited yet" text="Edit the class to invite families." />
            ) : (
              <div className="divide-y divide-slate-100">
                {invites.map((i) => {
                  const p = people[i.family_id];
                  return (
                    <div key={i.family_id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={p?.full_name ?? "?"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p?.full_name ?? "Family"}</p>
                        <p className="truncate text-xs text-slate-500">{p?.children || p?.email}</p>
                      </div>
                      <Badge value={i.rsvp} />
                      {editable && <button onClick={() => remind(i.family_id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Send reminder"><Bell className="h-4 w-4" /></button>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {(c.status === "ended" || c.status === "live" || att.length > 0) && (
            <Card>
              <CardHeader title="Attendance" />
              {att.length === 0 ? <p className="p-5 text-sm text-slate-500">Nobody has joined yet.</p> : (
                <table className="table-base">
                  <thead><tr><th>Name</th><th>Joined</th><th>Left</th><th>Minutes</th></tr></thead>
                  <tbody>
                    {att.map((a, k) => (
                      <tr key={k}>
                        <td className="font-medium">{people[a.user_id]?.full_name ?? (a.user_id === c.educator_id ? c.educator?.full_name : "User")}</td>
                        <td>{fmtTime(a.joined_at)}</td>
                        <td>{a.left_at ? fmtTime(a.left_at) : <Badge value="live" label="in class" />}</td>
                        <td>{minutesBetween(a.joined_at, a.left_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-sm font-semibold">Join link</p>
            <p className="mt-1 text-xs text-slate-500">Share this with invited families. Only invited, signed-in families can enter.</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 p-2 pl-3">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{joinLink}</span>
              <button onClick={() => { copy(joinLink); setMsg("Join link copied."); }} className="rounded-lg bg-white p-2 text-slate-600 shadow-sm hover:text-brand-600"><Copy className="h-4 w-4" /></button>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold">RSVP summary</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {Object.entries(counts).map(([k, v]) => <div key={k} className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold">{v}</p><p className="text-xs capitalize text-slate-500">{k}</p></div>)}
            </div>
          </Card>
          {c.description && <Card className="p-5"><p className="text-sm font-semibold">Notes</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{c.description}</p></Card>}
          {c.started_at && <Card className="p-5 text-sm text-slate-600"><p>Started: {fmtDateTime(c.started_at)}</p>{c.ended_at && <p className="mt-1">Ended: {fmtDateTime(c.ended_at)} ({minutesBetween(c.started_at, c.ended_at)} min)</p>}</Card>}
          {editable && (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirm("cancel")}><XCircle className="h-4 w-4" />Cancel class</Button>
              <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setConfirm("delete")}><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm === "cancel" ? "Cancel this class?" : "Delete this class?"}>
        <p className="text-sm text-slate-600">{confirm === "cancel" ? "All invited families will be notified that the class is cancelled." : "This removes the class and its invitations permanently."}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(null)}>Keep it</Button>
          <Button variant="danger" loading={busy} onClick={confirm === "cancel" ? cancelClass : deleteClass}>{confirm === "cancel" ? "Cancel class" : "Delete"}</Button>
        </div>
      </Modal>
    </div>
  );
}
