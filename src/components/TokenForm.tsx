"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "./AuthLayout";
import { Alert, Badge, Button, Field, Spinner } from "./ui";
import { supabase } from "@/lib/supabase";
import { homeFor } from "@/lib/auth";
import type { Role } from "@/lib/types";

interface Info { email: string; full_name: string; role: Role; kind: "invite" | "reset"; valid: boolean }

export function TokenForm({ mode }: { mode: "invite" | "reset" }) {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<Info | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isUuid = /^[0-9a-f-]{36}$/i.test(token);
    if (!isUuid) { setInfo(null); return; }
    supabase.rpc("get_invite", { p_token: token }).then(({ data }) => {
      const row = (data as Info[] | null)?.[0];
      if (!row || row.kind !== mode) { setInfo(null); return; }
      setInfo(row); setName(row.full_name);
    });
  }, [token, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw.length < 8) return setError("Password must be at least 8 characters.");
    if (pw !== pw2) return setError("Passwords don't match.");
    if (mode === "invite" && !agree) return setError("Please accept the terms to continue.");
    setBusy(true);
    await supabase.auth.signOut();
    const { data: email, error } = await supabase.rpc("accept_invite", { p_token: token, p_password: pw, p_full_name: name });
    if (error) { setBusy(false); return setError(error.message); }
    const { error: e2 } = await supabase.auth.signInWithPassword({ email: email as string, password: pw });
    setBusy(false);
    if (e2) return setError(e2.message);
    router.replace(homeFor(info?.role));
  }

  const title = mode === "invite" ? "Set up your account" : "Choose a new password";
  if (info === undefined) return <AuthLayout title={title}><Spinner /></AuthLayout>;
  if (!info || !info.valid) {
    return (
      <AuthLayout title="Link not valid" subtitle="This link has expired, was already used, or was cancelled.">
        <Alert kind="info">Ask your administrator to send you a new link.</Alert>
        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-brand-600">Go to sign in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={title} subtitle={mode === "invite" ? "You've been invited to Classroom." : `Resetting the password for ${info.email}.`}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm">
          <span className="truncate font-medium text-slate-700">{info.email}</span>
          <Badge value={info.role} />
        </div>
        {mode === "invite" && <Field label="Full name"><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></Field>}
        <Field label="Password" hint="At least 8 characters."><input className="input" type="password" required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Confirm password"><input className="input" type="password" required autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
        {mode === "invite" && (
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I agree to the terms of use and privacy policy.
          </label>
        )}
        <Button type="submit" loading={busy} className="w-full">{mode === "invite" ? "Create account" : "Save new password"}</Button>
      </form>
    </AuthLayout>
  );
}
