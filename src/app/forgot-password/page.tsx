"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Alert, Button, Field } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <AuthLayout title="Reset your password" subtitle="Your administrator sends you a secure reset link.">
      {sent ? (
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Mail className="h-6 w-6" /></div>
          <Alert kind="success">Request noted for <b>{email}</b>. Ask your administrator to send you a password reset link from the admin panel. The link works for 48 hours.</Alert>
          <Link href="/login" className="block text-center text-sm font-semibold text-brand-600">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
          <Field label="Email"><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
          <Button type="submit" className="w-full">Request reset link</Button>
          <Link href="/login" className="block text-center text-sm font-medium text-slate-500 hover:text-slate-800">Back to sign in</Link>
        </form>
      )}
    </AuthLayout>
  );
}
