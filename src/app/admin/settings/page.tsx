"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchProfiles } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { Alert, Avatar, Button, Card, CardHeader, Field, LinkButton, PageHeader, Spinner } from "@/components/ui";

export default function SettingsPage() {
  const [s, setS] = useState<{ org_name: string; support_email: string | null; default_duration: number; waiting_room: boolean } | null>(null);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.from("settings").select("*").single().then(({ data }) => setS(data));
    fetchProfiles("admin").then(setAdmins);
  }, []);
  if (!s) return <Spinner />;

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("settings").update({ ...s, updated_at: new Date().toISOString() }).eq("id", 1);
    setBusy(false); setMsg(error ? error.message : "Settings saved.");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Platform-wide preferences." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <form onSubmit={save} className="space-y-5">
            {msg && <Alert kind="success">{msg}</Alert>}
            <Field label="Organisation name"><input className="input" value={s.org_name} onChange={(e) => setS({ ...s, org_name: e.target.value })} /></Field>
            <Field label="Support email" hint="Shown to users who need help."><input className="input" type="email" value={s.support_email ?? ""} onChange={(e) => setS({ ...s, support_email: e.target.value })} /></Field>
            <Field label="Default class length">
              <select className="input" value={s.default_duration} onChange={(e) => setS({ ...s, default_duration: Number(e.target.value) })}>
                {[30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </Field>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={s.waiting_room} onChange={(e) => setS({ ...s, waiting_room: e.target.checked })} />
              <span><span className="block text-sm font-semibold">Waiting room</span><span className="text-sm text-slate-500">Families wait until the educator admits them. Turn off to let invited families enter directly.</span></span>
            </label>
            <Button type="submit" loading={busy}>Save settings</Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Administrators" action={<LinkButton href="/admin/invite?role=admin" variant="ghost" className="py-1.5">Add</LinkButton>} />
          <div className="divide-y divide-slate-100">
            {admins.map((a) => <div key={a.id} className="flex items-center gap-3 px-5 py-3"><Avatar name={a.full_name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-medium">{a.full_name}</p><p className="truncate text-xs text-slate-500">{a.email}</p></div></div>)}
          </div>
        </Card>
      </div>
    </>
  );
}
