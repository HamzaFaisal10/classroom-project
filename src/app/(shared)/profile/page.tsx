"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { tz } from "@/lib/format";
import { Alert, Avatar, Badge, Button, Card, Field, PageHeader } from "@/components/ui";

const ZONES = ["Asia/Karachi", "Asia/Dubai", "Asia/Shanghai", "Asia/Kolkata", "Europe/London", "America/New_York", "UTC"];

export default function ProfilePage() {
  const { profile, refresh } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [children, setChildren] = useState("");
  const [msg, setMsg] = useState<{ k: "success" | "error"; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState<{ k: "success" | "error"; t: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name); setPhone(profile.phone ?? ""); setZone(profile.timezone ?? tz()); setChildren(profile.children ?? "");
  }, [profile]);
  if (!profile) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { error } = await supabase.from("profiles").update({ full_name: name, phone: phone || null, timezone: zone, children: profile!.role === "family" ? children : profile!.children }).eq("id", profile!.id);
    setBusy(false);
    setMsg(error ? { k: "error", t: error.message } : { k: "success", t: "Profile saved." });
    refresh();
  }
  async function changePw(e: React.FormEvent) {
    e.preventDefault(); setPwMsg(null);
    if (pw.length < 8) return setPwMsg({ k: "error", t: "Password must be at least 8 characters." });
    if (pw !== pw2) return setPwMsg({ k: "error", t: "Passwords don't match." });
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwBusy(false);
    setPwMsg(error ? { k: "error", t: error.message } : { k: "success", t: "Password updated." });
    if (!error) { setPw(""); setPw2(""); }
  }

  return (
    <>
      <PageHeader title="My profile" subtitle="Your details and sign-in settings." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center p-6 text-center">
          <Avatar name={profile.full_name || profile.email} size="lg" />
          <p className="mt-3 font-semibold">{profile.full_name}</p>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <div className="mt-3"><Badge value={profile.role} /></div>
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={save} className="space-y-4">
              <h2 className="font-semibold">Personal details</h2>
              {msg && <Alert kind={msg.k}>{msg.t}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
                <Field label="Email"><input className="input" value={profile.email} disabled /></Field>
                <Field label="Phone"><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" /></Field>
                <Field label="Time zone">
                  <select className="input" value={zone} onChange={(e) => setZone(e.target.value)}>
                    {[...new Set([zone, ...ZONES])].filter(Boolean).map((z) => <option key={z}>{z}</option>)}
                  </select>
                </Field>
              </div>
              {profile.role === "family" && <Field label="Children" hint="Names and ages, e.g. Zain (8), Hania (6)"><input className="input" value={children} onChange={(e) => setChildren(e.target.value)} /></Field>}
              <Button type="submit" loading={busy}>Save changes</Button>
            </form>
          </Card>
          <Card className="p-6">
            <form onSubmit={changePw} className="space-y-4">
              <h2 className="font-semibold">Change password</h2>
              {pwMsg && <Alert kind={pwMsg.k}>{pwMsg.t}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password"><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
                <Field label="Confirm password"><input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>
              </div>
              <Button type="submit" variant="secondary" loading={pwBusy}>Update password</Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
