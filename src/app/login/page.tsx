"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Home, Loader2, Shield } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Alert, Button, Field } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { homeFor, useAuth } from "@/lib/auth";

const DEMO_PASSWORD = "Demo@12345";
const DEMO = [
  { key: "admin", role: "Admin", email: "admin@classroom.demo", icon: Shield, text: "Manage users, schedule and reports" },
  { key: "educator", role: "Educator", email: "educator@classroom.demo", icon: GraduationCap, text: "Schedule classes and teach live" },
  { key: "family", role: "Family", email: "family@classroom.demo", icon: Home, text: "Join classes and reply to invites" },
] as const;

function friendly(msg: string) {
  if (msg === "Invalid login credentials") return "Incorrect email or password.";
  if (/banned/i.test(msg)) return "This account has been deactivated. Please contact your administrator.";
  return msg;
}

export default function LoginPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoBusy, setDemoBusy] = useState<string | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const autoDemo = useRef<string | null>(null);
  const demoRunning = useRef(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const n = q.get("next");
    if (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\")) setNext(n);
    const d = q.get("demo");
    if (d && DEMO.some((x) => x.key === d)) autoDemo.current = d;
  }, []);

  // ?demo=educator signs straight in as that demo account (used by the landing page)
  useEffect(() => {
    if (authLoading || !autoDemo.current) return;
    const d = autoDemo.current;
    autoDemo.current = null;
    demoLogin(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  useEffect(() => {
    if (authLoading || !profile || demoRunning.current || autoDemo.current) return;
    const fits = (n: string) => !["/admin", "/educator", "/family"].some((p) => n.startsWith(p)) || n.startsWith(homeFor(profile.role));
    router.replace(next && fits(next) ? next : homeFor(profile.role));
  }, [authLoading, profile, next, router, demoBusy]);

  async function demoLogin(key: string) {
    const d = DEMO.find((x) => x.key === key);
    if (!d) return;
    setError(""); setDemoBusy(key); demoRunning.current = true;
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email: d.email, password: DEMO_PASSWORD });
    if (error) { setDemoBusy(null); demoRunning.current = false; setError(friendly(error.message)); return; }
    router.replace(homeFor(d.key as "admin" | "educator" | "family"));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setLoading(false);
    if (error) setError(friendly(error.message));
  }

  return (
    <AuthLayout title="Sign in" subtitle="Try a demo account in one click, or sign in with your own.">
      <div className="space-y-2">
        {DEMO.map((d) => (
          <button key={d.key} type="button" onClick={() => demoLogin(d.key)} disabled={!!demoBusy}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60">
            <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600"><d.icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Continue as {d.role}</span>
              <span className="block truncate text-xs text-slate-500">{d.text}</span>
            </span>
            {demoBusy === d.key && <Loader2 className="h-4 w-4 animate-spin text-brand-600" />}
          </button>
        ))}
      </div>

      <div className="my-7 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or sign in with email<span className="h-px flex-1 bg-slate-200" /></div>

      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Email"><input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
        <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
        <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">Forgot password?</Link></div>
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>

      <details className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">Demo login details</summary>
        <ul className="mt-2 space-y-1">
          {DEMO.map((d) => <li key={d.key}>{d.role}: <span className="font-mono">{d.email}</span></li>)}
          <li>Password for all: <span className="font-mono">{DEMO_PASSWORD}</span></li>
        </ul>
      </details>
      <p className="mt-6 text-center text-xs text-slate-500">No public sign-up. Real accounts are created by invitation only.</p>
    </AuthLayout>
  );
}
