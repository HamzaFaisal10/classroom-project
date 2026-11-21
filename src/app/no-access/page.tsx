"use client";
import { ShieldAlert } from "lucide-react";
import { useAuth, homeFor } from "@/lib/auth";
import { LinkButton } from "@/components/ui";

export default function NoAccess() {
  const { profile } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl bg-amber-50 p-4 text-amber-600"><ShieldAlert className="h-8 w-8" /></div>
      <h1 className="mt-4 text-xl font-bold">You don&apos;t have access to this page</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">This area belongs to a different role. Head back to your own dashboard.</p>
      <LinkButton href={homeFor(profile?.role)} className="mt-6">Go to my dashboard</LinkButton>
    </div>
  );
}
