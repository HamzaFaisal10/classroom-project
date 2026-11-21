"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fetchProfiles } from "@/lib/data";
import { toLocalInput, tz } from "@/lib/format";
import type { ClassRow, Profile } from "@/lib/types";
import { Alert, Avatar, Button, Card, Field } from "./ui";

export function ClassForm({ existing }: { existing?: ClassRow }) {
  const { profile } = useAuth();
  const router = useRouter();
  const isAdmin = profile?.role === "admin";
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [start, setStart] = useState(() => {
    if (existing) return toLocalInput(existing.starts_at);
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(16, 0, 0, 0); return toLocalInput(d.toISOString());
  });
  const [duration, setDuration] = useState(existing?.duration_min ?? 60);
  const [repeat, setRepeat] = useState(1);
  const [educatorId, setEducatorId] = useState(existing?.educator_id ?? "");
  const [educators, setEducators] = useState<Profile[]>([]);
  const [families, setFamilies] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(existing?.class_invites?.map((i) => i.family_id) ?? []));
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (!existing && !isAdmin) setEducatorId(profile.id);
    fetchProfiles("family").then(setFamilies);
    if (isAdmin) fetchProfiles("educator").then((e) => { setEducators(e); if (!existing && e[0]) setEducatorId((x) => x || e[0].id); });
    if (!existing) supabase.from("settings").select("default_duration").single().then(({ data }) => data && setDuration(data.default_duration));
  }, [profile, isAdmin, existing]);

  const visibleFamilies = useMemo(() => {
    const base = isAdmin ? families : families.filter((f) => f.educator_id === profile?.id || selected.has(f.id));
    return base.filter((f) => f.active && `${f.full_name} ${f.email} ${f.children ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  }, [families, isAdmin, profile, q, selected]);

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Please add a title.");
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return setError("Please pick a valid date and time.");
    if (!existing && startDate.getTime() < Date.now() - 5 * 60000) return setError("The start time is in the past.");
    setBusy(true);
    try {
      if (existing) {
        const { error } = await supabase.from("classes").update({ title, description, starts_at: startDate.toISOString(), duration_min: duration, educator_id: educatorId }).eq("id", existing.id);
        if (error) throw error;
        const before = new Set(existing.class_invites?.map((i) => i.family_id) ?? []);
        const add = [...selected].filter((id) => !before.has(id));
        const remove = [...before].filter((id) => !selected.has(id));
        if (add.length) { const { error } = await supabase.from("class_invites").insert(add.map((family_id) => ({ class_id: existing.id, family_id }))); if (error) throw error; }
        if (remove.length) { const { error } = await supabase.from("class_invites").delete().eq("class_id", existing.id).in("family_id", remove); if (error) throw error; }
        router.push(`/classes/${existing.id}`);
      } else {
        const rows = Array.from({ length: repeat }, (_, i) => {
          const d = new Date(startDate); d.setDate(d.getDate() + 7 * i);
          return { title, description, starts_at: d.toISOString(), duration_min: duration, educator_id: educatorId, created_by: profile!.id };
        });
        const { data, error } = await supabase.from("classes").insert(rows).select("id");
        if (error) throw error;
        const invites = (data ?? []).flatMap((c) => [...selected].map((family_id) => ({ class_id: c.id, family_id })));
        if (invites.length) { const { error } = await supabase.from("class_invites").insert(invites); if (error) throw error; }
        router.push(`/classes/${data![0].id}`);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <Card className="space-y-5 p-6 lg:col-span-3">
        {error && <Alert>{error}</Alert>}
        <Field label="Class title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Maths: Fractions" required /></Field>
        <Field label="Notes for families (optional)"><textarea className="input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What to prepare, materials, topics…" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date & time" hint={`Shown in your time zone (${tz()}). Families see their own.`}><input className="input" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required /></Field>
          <Field label="Duration">
            <select className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </Field>
        </div>
        {!existing && (
          <Field label="Repeat" hint="Creates the same class every week at this time.">
            <select className="input" value={repeat} onChange={(e) => setRepeat(Number(e.target.value))}>
              <option value={1}>Does not repeat</option>
              {[4, 8, 12].map((n) => <option key={n} value={n}>Weekly for {n} weeks</option>)}
            </select>
          </Field>
        )}
        {isAdmin && (
          <Field label="Educator">
            <select className="input" value={educatorId} onChange={(e) => setEducatorId(e.target.value)} required>
              {educators.map((ed) => <option key={ed.id} value={ed.id}>{ed.full_name}</option>)}
            </select>
          </Field>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={busy}>{existing ? "Save changes" : "Create class & send invites"}</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </Card>

      <Card className="flex max-h-[640px] flex-col lg:col-span-2">
        <div className="border-b border-slate-100 p-5">
          <p className="text-sm font-semibold">Invite families <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{selected.size} selected</span></p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search families" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {visibleFamilies.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No families found.</p>}
          {visibleFamilies.map((f) => (
            <label key={f.id} className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-slate-50 ${selected.has(f.id) ? "bg-brand-50/60" : ""}`}>
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={selected.has(f.id)} onChange={() => toggle(f.id)} />
              <Avatar name={f.full_name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{f.full_name}</p>
                <p className="truncate text-xs text-slate-500">{f.children || f.email}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>
    </form>
  );
}
