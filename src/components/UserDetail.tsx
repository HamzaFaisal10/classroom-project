"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, KeyRound, Mail, Phone, Power } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { appUrl, fetchClasses, fetchProfiles } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import type { ClassRow, Profile } from "@/lib/types";
import { Alert, Avatar, Badge, Button, Card, CardHeader, Empty, Field, Spinner, copy } from "./ui";
import { ClassRowItem } from "./ClassCard";

export function UserDetail({ role }: { role: "educator" | "family" }) {
  const { id } = useParams<{ id: string }>();
  const [u, setU] = useState<Profile | null | undefined>(undefined);
  const [educators, setEducators] = useState<Profile[]>([]);
  const [families, setFamilies] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [edId, setEdId] = useState("");
  const [children, setChildren] = useState("");
  const [msg, setMsg] = useState("");
  const [reset, setReset] = useState("");

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    const p = data as Profile | null;
    setU(p ?? null);
    if (!p) return;
    setEdId(p.educator_id ?? ""); setChildren(p.children ?? "");
    const all = await fetchClasses({ ascending: false });
    setClasses(all.filter((c) => role === "educator" ? c.educator_id === p.id : c.class_invites?.some((i) => i.family_id === p.id)));
  };
  useEffect(() => {
    load();
    if (role === "family") fetchProfiles("educator").then(setEducators);
    else fetchProfiles("family").then(setFamilies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, role]);

  if (u === undefined) return <Spinner />;
  if (!u) return <Empty title="User not found" />;

  async function saveFamily() {
    const { error } = await supabase.from("profiles").update({ educator_id: edId || null, children }).eq("id", u!.id);
    setMsg(error ? error.message : "Saved."); load();
  }
  async function toggleActive() {
    await supabase.from("profiles").update({ active: !u!.active }).eq("id", u!.id);
    setMsg(u!.active ? "Account deactivated. They can no longer sign in to the app." : "Account reactivated."); load();
  }
  async function makeReset() {
    const { data, error } = await supabase.rpc("admin_reset_link", { p_user: u!.id });
    if (error) return setMsg(error.message);
    setReset(appUrl(`/reset/${data}`));
  }

  const back = role === "educator" ? "/admin/educators" : "/admin/families";
  const upcoming = classes.filter((c) => c.status === "scheduled" || c.status === "live");
  const past = classes.filter((c) => c.status === "ended");
  const assigned = families.filter((f) => f.educator_id === u.id);

  return (
    <div>
      <Link href={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" />{role === "educator" ? "Educators" : "Families"}</Link>
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Avatar name={u.full_name} size="lg" />
              <div className="min-w-0"><p className="truncate text-lg font-semibold">{u.full_name}</p><div className="mt-1 flex gap-2"><Badge value={u.role} /><Badge value={u.active ? "active" : "inactive"} label={u.active ? "Active" : "Deactivated"} /></div></div>
            </div>
            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{u.email}</p>
              {u.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{u.phone}</p>}
              <p className="text-xs text-slate-400">Member since {fmtDate(u.created_at)}{u.timezone ? ` · ${u.timezone}` : ""}</p>
            </div>
          </Card>

          {role === "family" && (
            <Card className="space-y-4 p-6">
              <p className="text-sm font-semibold">Family details</p>
              <Field label="Children"><input className="input" value={children} onChange={(e) => setChildren(e.target.value)} placeholder="Zain (8), Hania (6)" /></Field>
              <Field label="Assigned educator">
                <select className="input" value={edId} onChange={(e) => setEdId(e.target.value)}>
                  <option value="">Not assigned</option>
                  {educators.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </Field>
              <Button onClick={saveFamily}>Save</Button>
            </Card>
          )}

          <Card className="space-y-3 p-6">
            <p className="text-sm font-semibold">Account</p>
            <Button variant="secondary" className="w-full" onClick={makeReset}><KeyRound className="h-4 w-4" />Create password reset link</Button>
            {reset && (
              <div className="rounded-xl bg-slate-100 p-3">
                <p className="text-xs text-slate-500">Send this link to {u.full_name}. Valid for 48 hours.</p>
                <div className="mt-2 flex items-center gap-2"><span className="min-w-0 flex-1 truncate font-mono text-xs">{reset}</span><button onClick={() => { copy(reset); setMsg("Reset link copied."); }} className="rounded-lg bg-white p-2 shadow-sm"><Copy className="h-4 w-4" /></button></div>
              </div>
            )}
            <Button variant={u.active ? "ghost" : "success"} className={`w-full ${u.active ? "text-rose-600 hover:bg-rose-50" : ""}`} onClick={toggleActive}><Power className="h-4 w-4" />{u.active ? "Deactivate account" : "Reactivate account"}</Button>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {role === "educator" && (
            <Card>
              <CardHeader title={`Assigned families (${assigned.length})`} />
              {assigned.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">No families assigned. Assign them from a family&apos;s page.</p> : (
                <div className="grid gap-2 p-3 sm:grid-cols-2">
                  {assigned.map((f) => <Link key={f.id} href={`/admin/families/${f.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"><Avatar name={f.full_name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-medium">{f.full_name}</p><p className="truncate text-xs text-slate-500">{f.children}</p></div></Link>)}
                </div>
              )}
            </Card>
          )}
          <Card>
            <CardHeader title={`Upcoming classes (${upcoming.length})`} />
            {upcoming.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">None scheduled.</p> : <div className="divide-y divide-slate-100">{upcoming.map((c) => <ClassRowItem key={c.id} c={c} role="admin" showEducator={role === "family"} />)}</div>}
          </Card>
          <Card>
            <CardHeader title={`Class history (${past.length})`} />
            {past.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">No past classes.</p> : <div className="divide-y divide-slate-100">{past.map((c) => <ClassRowItem key={c.id} c={c} role="admin" showEducator={role === "family"} />)}</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
