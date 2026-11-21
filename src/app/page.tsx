"use client";
import Link from "next/link";
import { CalendarCheck, Camera, Lock, MonitorSmartphone, ShieldCheck, Users, Video } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth, homeFor } from "@/lib/auth";

const features = [
  { icon: Video, title: "Live video classroom", text: "Real-time WebRTC classes with a host stage, participant grid and adaptive quality." },
  { icon: Camera, title: "Multiple cameras", text: "Educators stream two cameras at once — face plus desk or whiteboard — and share their screen." },
  { icon: CalendarCheck, title: "Scheduling & invitations", text: "Create one-off or weekly classes, invite families and track RSVPs and attendance." },
  { icon: ShieldCheck, title: "Role-based access", text: "Admin, educator and family roles, enforced in the database with row-level security." },
  { icon: Users, title: "Host controls", text: "Waiting room, admit, mute, camera off, remove and end the class for everyone." },
  { icon: MonitorSmartphone, title: "Desktop & mobile", text: "A responsive app that works in any modern browser — no download needed." },
];

export default function Landing() {
  const { profile } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <Link href={profile ? homeFor(profile.role) : "/login"} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
          {profile ? "Open dashboard" : "Sign in"}
        </Link>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 -top-40 -z-0 mx-auto h-[480px] max-w-4xl rounded-full bg-brand-100/70 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-14 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Live classes for educators and families
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            The online classroom that shows <span className="text-brand-600">every angle</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Schedule classes, invite families and teach live with multiple cameras — with secure, role-based access for admins, educators and families.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">Try the demo</Link>
            <a href="#features" className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">See features</a>
          </div>

          <div className="mx-auto mt-14 max-w-4xl rounded-3xl bg-ink p-3 shadow-2xl ring-1 ring-slate-900/10">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 sm:col-span-2 sm:row-span-2 sm:aspect-auto">
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE</div>
                <div className="absolute bottom-3 left-3 rounded-lg bg-black/40 px-2 py-1 text-xs text-white">Ms. Ayesha · Camera 1</div>
                <div className="flex h-full min-h-40 items-center justify-center"><Video className="h-14 w-14 text-white/30" /></div>
              </div>
              <div className="relative aspect-video rounded-2xl bg-slate-800"><div className="absolute bottom-2 left-2 rounded bg-black/40 px-2 py-0.5 text-[11px] text-white">Whiteboard · Camera 2</div></div>
              <div className="grid grid-cols-2 gap-3">
                {["Zain", "Hania"].map((n) => <div key={n} className="relative aspect-video rounded-xl bg-slate-700"><span className="absolute bottom-1.5 left-1.5 text-[10px] text-white/80">{n}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">Everything a live class needs</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 p-6">
              <div className="inline-flex rounded-xl bg-brand-50 p-2.5 text-brand-600"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { r: "Admin", t: "Manages educators and families, sends invitations, sees the master schedule and attendance reports." },
            { r: "Educator", t: "Schedules classes, invites families, sets up cameras and hosts the live classroom with full controls." },
            { r: "Family", t: "Gets an invite, checks camera and mic, and joins the class in one tap from phone or laptop." },
          ].map((x) => (
            <div key={x.r} className="rounded-2xl bg-canvas p-6">
              <p className="text-sm font-semibold text-brand-600">{x.r}</p>
              <p className="mt-2 text-sm text-slate-700">{x.t}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row">
          <Logo />
          <p className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Invitation-only access · Built with Next.js, Supabase and WebRTC</p>
        </div>
      </footer>
    </div>
  );
}
