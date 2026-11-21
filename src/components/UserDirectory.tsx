"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Search, UserPlus, Users, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { appUrl, fetchClasses, fetchProfiles } from "@/lib/data";
import { fmtDate, relative } from "@/lib/format";
import type { ClassRow, Invite, Profile } from "@/lib/types";
import { Avatar, Badge, Card, Empty, LinkButton, PageHeader, Spinner, copy } from "./ui";

export function UserDirectory({ role }: { role: "educator" | "family" }) {
  const [users, setUsers] = useState<Profile[] | null>(null);
  const [educators, setEducators] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [copied, setCopied] = useState("");

  const load = () => {
    fetchProfiles(role).then(setUsers);
    supabase.from("user_invites").select("*").eq("role", role).eq("kind", "invite").is("used_at", null).eq("cancelled", false).order("created_at", { ascending: false })
      .then(({ data }) => setInvites((data ?? []) as Invite[]));
  };
  useEffect(() => {
    load();
    if (role === "family") fetchProfiles("educator").then(setEducators);
    fetchClasses({ from: new Date().toISOString(), statuses: ["scheduled"] }).then(setClasses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filtered = useMemo(() => (users ?? []).filter((u) =>
    (status === "all" || (status === "active" ? u.active : !u.active)) &&
    `${u.full_name} ${u.email} ${u.children ?? ""}`.toLowerCase().includes(q.toLowerCase())), [users, q, status]);

  async function cancelInvite(token: string) {
    await supabase.from("user_invites").update({ cancelled: true }).eq("token", token);
    load();
  }

  const title = role === "educator" ? "Educators" : "Families";
  const edName = (id: string | null) => educators.find((e) => e.id === id)?.full_name ?? "—";
  const upcomingFor = (u: Profile) => classes.filter((c) => role === "educator" ? c.educator_id === u.id : c.class_invites?.some((i) => i.family_id === u.id)).length;

  return (
    <>
      <PageHeader title={title} subtitle={`${users?.length ?? 0} ${title.toLowerCase()} · ${invites.length} pending invitation${invites.length === 1 ? "" : "s"}`}
        actions={<LinkButton href={`/admin/invite?role=${role}`}><UserPlus className="h-4 w-4" />Invite {role}</LinkButton>} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder={`Search ${title.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Deactivated</option>
        </select>
      </div>

      {invites.length > 0 && (
        <Card className="mb-6">
          <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold">Pending invitations</div>
          <div className="divide-y divide-slate-100">
            {invites.map((i) => (
              <div key={i.token} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <Avatar name={i.full_name || i.email} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{i.full_name}</p><p className="truncate text-xs text-slate-500">{i.email} · sent {relative(i.created_at)}</p></div>
                <Badge value="invited" />
                <button onClick={() => { copy(appUrl(`/invite/${i.token}`)); setCopied(i.token); setTimeout(() => setCopied(""), 2000); }} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"><Copy className="h-3.5 w-3.5" />{copied === i.token ? "Copied" : "Copy link"}</button>
                <button onClick={() => cancelInvite(i.token)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600" title="Cancel invitation"><XCircle className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-x-auto">
        {users === null ? <Spinner /> : filtered.length === 0 ? <Empty icon={<Users className="h-5 w-5" />} title={`No ${title.toLowerCase()} found`} /> : (
          <table className="table-base">
            <thead><tr><th>Name</th>{role === "family" && <th>Children</th>}{role === "family" && <th>Educator</th>}<th>Upcoming</th><th>Joined</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/admin/${role === "educator" ? "educators" : "families"}/${u.id}`} className="flex items-center gap-3">
                      <Avatar name={u.full_name} size="sm" />
                      <div className="min-w-0"><p className="truncate font-medium hover:text-brand-700">{u.full_name}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div>
                    </Link>
                  </td>
                  {role === "family" && <td className="text-slate-600">{u.children || "—"}</td>}
                  {role === "family" && <td className="text-slate-600">{edName(u.educator_id)}</td>}
                  <td className="text-slate-600">{upcomingFor(u)} classes</td>
                  <td className="text-slate-600">{fmtDate(u.created_at)}</td>
                  <td><Badge value={u.active ? "active" : "inactive"} label={u.active ? "Active" : "Deactivated"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
