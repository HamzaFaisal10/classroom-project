"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { appUrl, fetchProfiles } from "@/lib/data";
import type { Profile, Role } from "@/lib/types";
import { Alert, Button, Card, Field, PageHeader, copy } from "@/components/ui";

export default function InvitePage() {
  const [role, setRole] = useState<Role>("family");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [children, setChildren] = useState("");
  const [edId, setEdId] = useState("");
  const [educators, setEducators] = useState<Profile[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("role");
    if (r === "educator" || r === "family" || r === "admin") setRole(r);
    fetchProfiles("educator").then(setEducators);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    const { data, error } = await supabase.rpc("admin_create_invite", {
      p_email: email.trim(), p_full_name: name.trim(), p_role: role,
      p_educator_id: role === "family" && edId ? edId : null, p_children: role === "family" ? children : null,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setLink(appUrl(`/invite/${data}`));
  }

  function reset() { setLink(""); setName(""); setEmail(""); setChildren(""); setCopied(false); }
  const msg = `Hi ${name}, you've been invited to Classroom as ${role === "educator" ? "an educator" : role === "admin" ? "an admin" : "a family"}. Set up your account here: ${link}`;

  return (
    <>
      <PageHeader title="Invite a user" subtitle="Create a secure, one-time invitation link (valid for 7 days)." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          {link ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-emerald-500" /><div><p className="font-semibold">Invitation created for {name}</p><p className="text-sm text-slate-500">{email}</p></div></div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-2 pl-3">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{link}</span>
                <button onClick={() => { copy(link); setCopied(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow-sm"><Copy className="h-3.5 w-3.5" />{copied ? "Copied" : "Copy"}</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" />Share on WhatsApp</a>
                <a href={`mailto:${email}?subject=${encodeURIComponent("Your Classroom invitation")}&body=${encodeURIComponent(msg)}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><Mail className="h-4 w-4" />Send by email</a>
              </div>
              <Button variant="ghost" onClick={reset}>Invite another person</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {error && <Alert>{error}</Alert>}
              <div>
                <span className="label">Role</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["family", "educator", "admin"] as Role[]).map((r) => (
                    <button type="button" key={r} onClick={() => setRole(r)} className={`rounded-xl border px-3 py-3 text-sm font-semibold capitalize transition ${role === r ? "border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-100" : "border-slate-200 hover:bg-slate-50"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={role === "family" ? "Family / parent name" : "Full name"}><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Email"><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              </div>
              {role === "family" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Children (optional)"><input className="input" value={children} onChange={(e) => setChildren(e.target.value)} placeholder="Zain (8), Hania (6)" /></Field>
                  <Field label="Assign to educator">
                    <select className="input" value={edId} onChange={(e) => setEdId(e.target.value)}>
                      <option value="">Not yet</option>
                      {educators.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                    </select>
                  </Field>
                </div>
              )}
              <Button type="submit" loading={busy}>Create invitation</Button>
            </form>
          )}
        </Card>
        <Card className="p-6 lg:col-span-2">
          <p className="text-sm font-semibold">How invitations work</p>
          <ol className="mt-3 space-y-3 text-sm text-slate-600">
            <li><b>1.</b> You create a one-time link for a specific email and role.</li>
            <li><b>2.</b> Share it by WhatsApp or email. It expires after 7 days.</li>
            <li><b>3.</b> They open it, set a password and land on their own dashboard.</li>
            <li><b>4.</b> Pending invites show on the Educators / Families pages, where you can copy or cancel them.</li>
          </ol>
        </Card>
      </div>
    </>
  );
}
