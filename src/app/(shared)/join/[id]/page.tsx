"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Camera, Check, Clock, Hourglass, Video, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { CLASS_SELECT } from "@/lib/data";
import { fmtDate, fmtTime, relative, tz } from "@/lib/format";
import type { ClassRow } from "@/lib/types";
import { Avatar, Badge, Button, Card, Empty, LinkButton, Spinner } from "@/components/ui";

export default function JoinPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const router = useRouter();
  const [c, setC] = useState<ClassRow | null | undefined>(undefined);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase.from("classes").select(CLASS_SELECT).eq("id", id).maybeSingle();
    setC((data as ClassRow) ?? null);
  }, [id]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`class-status:${id}:${Date.now()}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "classes", filter: `id=eq.${id}` }, load)
      .subscribe();
    const poll = setInterval(load, 15000);
    const t = setInterval(() => tick((x) => x + 1), 30000);
    return () => { supabase.removeChannel(ch); clearInterval(poll); clearInterval(t); };
  }, [id, load]);

  useEffect(() => {
    if (profile && profile.role !== "family") router.replace(`/classes/${id}`);
  }, [profile, id, router]);

  if (c === undefined || !profile) return <Spinner />;
  if (c === null) return <Empty title="Invitation not found" text="This class doesn't exist or you weren't invited to it." action={<LinkButton href="/family">Go home</LinkButton>} />;

  const mine = c.class_invites?.find((i) => i.family_id === profile.id);
  async function rsvp(v: "accepted" | "declined") {
    await supabase.from("class_invites").update({ rsvp: v }).eq("class_id", c!.id).eq("family_id", profile!.id);
    load();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden">
        <div className="relative bg-brand-900 px-6 py-8 text-white sm:px-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600/50 blur-2xl" />
          <div className="relative">
            <Badge value={c.status} />
            <h1 className="mt-3 text-2xl font-bold">{c.title}</h1>
            {c.educator && (
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={c.educator.full_name} size="sm" />
                <span className="text-sm text-brand-100">with {c.educator.full_name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6 p-6 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"><CalendarDays className="h-5 w-5 text-brand-600" /><div><p className="text-xs text-slate-500">Date</p><p className="text-sm font-semibold">{fmtDate(c.starts_at)}</p></div></div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"><Clock className="h-5 w-5 text-brand-600" /><div><p className="text-xs text-slate-500">Time ({tz()})</p><p className="text-sm font-semibold">{fmtTime(c.starts_at)} · {c.duration_min} min</p></div></div>
          </div>
          {c.description && <p className="whitespace-pre-wrap text-sm text-slate-600">{c.description}</p>}

          {c.status === "live" && (
            <div className="rounded-2xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-200">
              <p className="font-semibold text-emerald-800">The class is live now</p>
              <p className="mt-1 text-sm text-emerald-700">You&apos;ll check your camera and mic, then the educator lets you in.</p>
              <LinkButton href={`/room/${c.id}`} variant="success" className="mt-4 px-8 py-3 text-base"><Video className="h-5 w-5" />Join class</LinkButton>
            </div>
          )}
          {c.status === "scheduled" && (
            <div className="rounded-2xl bg-brand-50 p-5 text-center ring-1 ring-brand-200">
              <Hourglass className="mx-auto h-6 w-6 text-brand-600" />
              <p className="mt-2 font-semibold text-brand-900">Class starts {relative(c.starts_at)}</p>
              <p className="mt-1 text-sm text-brand-700">Keep this page open — the Join button appears as soon as the educator starts the class.</p>
            </div>
          )}
          {c.status === "ended" && <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-600">This class has ended.</div>}
          {c.status === "cancelled" && <div className="rounded-2xl bg-amber-50 p-5 text-center text-sm text-amber-800">This class was cancelled by the educator.</div>}

          {mine && c.status === "scheduled" && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <p className="text-sm text-slate-600">Will you attend? <Badge value={mine.rsvp} /></p>
              <div className="flex gap-2">
                <Button variant={mine.rsvp === "accepted" ? "success" : "secondary"} onClick={() => rsvp("accepted")}><Check className="h-4 w-4" />Yes</Button>
                <Button variant="secondary" onClick={() => rsvp("declined")}><X className="h-4 w-4" />No</Button>
              </div>
            </div>
          )}
          <Link href="/device-check" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600"><Camera className="h-4 w-4" />Test your camera and microphone</Link>
        </div>
      </Card>
    </div>
  );
}
