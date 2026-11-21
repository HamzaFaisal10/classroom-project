"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { Alert, Button, Field } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { homeFor, useAuth } from "@/lib/auth";

const DEMO = [
  { role: "Admin", email: "admin@classroom.demo" },
  { role: "Educator", email: "educator@classroom.demo" },
  { role: "Family", email: "family@classroom.demo" },
];

export default function LoginPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\")) setNext(n);
  }, []);

  useEffect(() => {
    if (!authLoading && profile) {
      const fits = (n: string) => !["/admin", "/educator", "/family"].some((p) => n.startsWith(p)) || n.startsWith(homeFor(profile.role));
      router.replace(next && fits(next) ? next : homeFor(profile.role));
    }
  }, [authLoading, profile, next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setLoading(false);
    if (error) setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : /banned/i.test(error.message) ? "This account has been deactivated. Please contact your administrator." : error.message);
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Classroom account.">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Email"><input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
        <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
        <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">Forgot password?</Link></div>
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts · password Demo@12345</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DEMO.map((d) => (
            <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword("Demo@12345"); }}
              className="rounded-xl bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700">{d.role}</button>
          ))}
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">No public sign-up. Accounts are created by invitation only.</p>
    </AuthLayout>
  );
}
