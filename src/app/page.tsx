"use client";
import Link from "next/link";
import { useState } from "react";
import {
  BarChart3, Bell, CalendarDays, Camera, Check, ChevronDown, Hand, Lock, Menu, Mic, MicOff, MonitorUp,
  PhoneOff, ShieldCheck, Smartphone, UserCheck, Users, Video, X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth, homeFor } from "@/lib/auth";

/* ---------- hero product mock ---------- */

function Whiteboard() {
  return (
    <svg viewBox="0 0 400 240" className="h-full w-full" role="img" aria-label="Whiteboard showing one half plus one quarter equals three quarters">
      <rect width="400" height="240" fill="#fbfbf8" />
      <g stroke="#cbd5e1" strokeWidth="1">{Array.from({ length: 11 }, (_, i) => <line key={i} x1="0" x2="400" y1={22 * i + 10} y2={22 * i + 10} />)}</g>
      {/* 1/2 */}
      <circle cx="70" cy="95" r="38" fill="none" stroke="#1e2366" strokeWidth="2.5" />
      <path d="M70 57 A38 38 0 0 1 70 133 Z" fill="#5b6cf0" fillOpacity=".75" />
      <line x1="70" y1="57" x2="70" y2="133" stroke="#1e2366" strokeWidth="2.5" />
      {/* 1/4 */}
      <circle cx="190" cy="95" r="38" fill="none" stroke="#1e2366" strokeWidth="2.5" />
      <path d="M190 95 L190 57 A38 38 0 0 1 228 95 Z" fill="#f59f0b" fillOpacity=".8" />
      <line x1="190" y1="57" x2="190" y2="133" stroke="#1e2366" strokeWidth="2.5" />
      <line x1="152" y1="95" x2="228" y2="95" stroke="#1e2366" strokeWidth="2.5" />
      {/* 3/4 */}
      <circle cx="320" cy="95" r="38" fill="none" stroke="#1e2366" strokeWidth="2.5" />
      <path d="M320 95 L320 57 A38 38 0 1 1 282 95 Z" fill="#14b8a6" fillOpacity=".7" />
      <line x1="320" y1="57" x2="320" y2="133" stroke="#1e2366" strokeWidth="2.5" />
      <line x1="282" y1="95" x2="358" y2="95" stroke="#1e2366" strokeWidth="2.5" />
      <text x="124" y="104" fontSize="30" fill="#1e2366" fontFamily="var(--font-display)">+</text>
      <text x="246" y="104" fontSize="30" fill="#1e2366" fontFamily="var(--font-display)">=</text>
      <text x="150" y="196" textAnchor="middle" fontSize="30" fill="#1e2366" fontFamily="var(--font-display)" fontWeight="600">½ + ¼ = ¾</text>
    </svg>
  );
}

function Tile({ name, tone, hand, muted }: { name: string; tone: string; hand?: boolean; muted?: boolean }) {
  return (
    <div className={`relative flex aspect-video items-center justify-center rounded-lg bg-slate-800 ${hand ? "ring-2 ring-amber-400" : ""}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ${tone}`}>{name.slice(0, 2).toUpperCase()}</span>
      <span className="absolute bottom-1 left-1.5 flex items-center gap-1 text-[9px] text-white/80">{muted && <MicOff className="h-2.5 w-2.5 text-rose-400" />}{name}</span>
      {hand && <Hand className="absolute right-1 top-1 h-3 w-3 text-amber-400" />}
    </div>
  );
}

function ClassroomMock() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-[0_30px_80px_-20px_rgba(30,35,102,0.55)] ring-1 ring-white/10">
        <div className="flex items-center justify-between px-4 py-2.5 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE</span>
            <span className="text-xs font-semibold">Maths: Fractions</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">24:10</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 px-2.5">
          <div className="relative overflow-hidden rounded-xl">
            <Whiteboard />
            <span className="absolute left-2 top-2 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-medium text-white">Whiteboard · Camera 2</span>
            <div className="absolute bottom-2 right-2 flex h-[34%] w-[30%] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-brand-500 to-brand-900 ring-2 ring-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold text-white">AK</span>
              <span className="absolute bottom-1 left-1.5 text-[8px] text-white/90">Ms. Ayesha</span>
            </div>
          </div>
          <div className="hidden w-24 flex-col gap-2 sm:flex">
            <Tile name="Zain" tone="bg-teal-600" hand />
            <Tile name="Hania" tone="bg-rose-500" />
            <Tile name="Ibrahim" tone="bg-amber-500" muted />
            <Tile name="Maryam" tone="bg-violet-500" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 px-3 py-3">
          {[Mic, Video].map((I, k) => <span key={k} className="rounded-xl bg-white/10 p-2 text-white"><I className="h-3.5 w-3.5" /></span>)}
          <span className="rounded-xl bg-brand-500 p-2 text-white" title="Camera 2 on"><Camera className="h-3.5 w-3.5" /></span>
          <span className="rounded-xl bg-white/10 p-2 text-white"><MonitorUp className="h-3.5 w-3.5" /></span>
          <span className="relative rounded-xl bg-white/10 p-2 text-white"><Users className="h-3.5 w-3.5" /><span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-amber-950">1</span></span>
          <span className="ml-1 rounded-xl bg-rose-600 p-2 text-white"><PhoneOff className="h-3.5 w-3.5" /></span>
        </div>
      </div>

      <div className="pop-in absolute -top-12 right-6 hidden w-56 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200 sm:block" style={{ animationDelay: "0.6s" }}>
        <p className="text-xs text-slate-500">Waiting room</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700">MF</span>
          <span className="flex-1 text-sm font-medium">Malik family</span>
          <span className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white"><UserCheck className="h-3 w-3" />Admit</span>
        </div>
      </div>
      <div className="pop-in absolute -bottom-9 -left-6 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-200 sm:flex" style={{ animationDelay: "1.2s" }}>
        <span className="rounded-xl bg-teal-50 p-2 text-teal-600"><Check className="h-4 w-4" /></span>
        <div><p className="text-sm font-semibold">Attendance saved</p><p className="text-xs text-slate-500">6 of 6 families joined</p></div>
      </div>
    </div>
  );
}

/* ---------- small feature previews ---------- */

function MiniCalendar() {
  const days = [["Mon", "Maths"], ["Tue", ""], ["Wed", "Reading"], ["Thu", "Maths"], ["Fri", "Science"]];
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {days.map(([d, c]) => (
        <div key={d} className="rounded-lg bg-slate-50 p-2">
          <p className="text-[11px] text-slate-500">{d}</p>
          {c ? <p className="mt-2 truncate rounded-md bg-brand-100 px-1.5 py-1 text-[10px] font-medium text-brand-800">{c}</p> : <p className="mt-2 h-[22px]" />}
        </div>
      ))}
    </div>
  );
}

function MiniBars() {
  const v = [62, 80, 74, 92, 88, 100];
  return (
    <div className="flex h-24 items-end gap-2">
      {v.map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-teal-500/80" style={{ height: `${h}%` }} />)}
    </div>
  );
}

/* ---------- content ---------- */

const ROLES = {
  Admin: {
    lead: "See every class, educator and family from one dashboard.",
    points: ["Invite educators and families with a one-time link", "Master calendar across all educators", "Assign families to an educator", "Attendance reports with CSV export", "Deactivate accounts or send a password reset link"],
  },
  Educator: {
    lead: "Plan the week, invite families, and start teaching in one click.",
    points: ["Schedule one-off or weekly classes", "Invite families and see who's coming", "Send reminders, reschedule or cancel", "Set up two cameras before class", "Admit, mute or remove participants live"],
  },
  Family: {
    lead: "A simple home screen with one button that matters: Join.",
    points: ["See the next class and the teacher's notes", "Reply yes or no to each invitation", "Check camera, mic and connection first", "Join from a phone or laptop, no download", "Raise a hand during class"],
  },
} as const;

const COMPARE: [string, boolean, boolean][] = [
  ["Only invited families can enter", true, false],
  ["Teacher streams two cameras at once", true, false],
  ["Class schedule and invitations built in", true, false],
  ["Attendance recorded automatically", true, false],
  ["Separate dashboards for admin, teacher and family", true, false],
  ["Waiting room and host controls", true, true],
  ["Works in the browser", true, true],
];

const FAQ = [
  ["Do families need to install anything?", "No. Classroom runs in any modern browser on a phone, tablet or laptop. Families open the invitation link, check their camera and join."],
  ["How do people get an account?", "There's no public sign-up. An admin creates a one-time invitation link for each educator or family and shares it by WhatsApp or email. The link expires after 7 days."],
  ["How do two cameras work?", "Before class, the educator picks Camera 1 (usually their face) and Camera 2 (a desk or whiteboard camera, or a phone used as a webcam). Families see both, and anyone can pin either one to the big screen."],
  ["How many students can join one class?", "The current version is designed for small-group classes of up to about six people, which suits tutoring and coaching sessions."],
  ["Who can see a family's details?", "Only the admin and the educators that family is assigned to. Every rule is enforced in the database, not just hidden in the interface."],
];

/* ---------- page ---------- */

export default function Landing() {
  const { profile } = useAuth();
  const [role, setRole] = useState<keyof typeof ROLES>("Educator");
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState<number | null>(0);
  const cta = profile ? homeFor(profile.role) : "/login";

  const nav = [["#how", "How it works"], ["#features", "Features"], ["#roles", "Who it's for"], ["#faq", "FAQ"]];

  return (
    <div className="min-h-screen bg-white text-ink">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/"><Logo /></Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            {nav.map(([h, l]) => <a key={h} href={h} className="hover:text-ink">{l}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            {!profile && <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:block">Sign in</Link>}
            <Link href={cta} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">{profile ? "Open dashboard" : "Try the demo"}</Link>
            <button className="rounded-lg p-2 text-slate-600 md:hidden" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-slate-100 px-5 py-3 md:hidden">
            {nav.map(([h, l]) => <a key={h} href={h} onClick={() => setMenu(false)} className="block py-2 text-sm text-slate-700">{l}</a>)}
            {!profile && <Link href="/login" className="block py-2 text-sm font-semibold text-brand-700">Sign in</Link>}
          </nav>
        )}
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,#e0e7ff_0%,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 pb-24 pt-14 lg:grid-cols-[1fr_1.1fr] lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-600 ring-1 ring-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />For tutors, coaching centres and online schools
            </p>
            <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Run your online classes without the chaos.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              Scheduling, invites, live video and attendance in one simple platform for tutors and schools.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={cta} className="rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700">{profile ? "Open dashboard" : "Try the live demo"}</Link>
              <a href="#how" className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold hover:bg-slate-50">See how it works</a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {["No download for families", "Invite-only classes", "Two cameras for teachers"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" />{t}</li>
              ))}
            </ul>
          </div>
          <ClassroomMock />
        </div>
      </section>

      {/* before / after */}
      <section className="bg-canvas py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Most online tutoring still runs on WhatsApp, video links and a notebook.</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200">
              <p className="font-semibold text-slate-500">Without Classroom</p>
              <ul className="mt-5 space-y-3.5 text-slate-600">
                {["Meeting links shared in group chats, and forwarded to anyone", "Schedules kept in a spreadsheet nobody updates", "Attendance written down by hand after class", "One camera, so students can't see your notebook and your face", "Parents asking “what time is class?” every week"].map((t) => (
                  <li key={t} className="flex gap-3"><X className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-brand-900 p-7 text-white">
              <p className="font-semibold text-brand-200">With Classroom</p>
              <ul className="mt-5 space-y-3.5 text-brand-50">
                {["Only invited, signed-in families can enter a class", "One calendar for every educator and family", "Attendance saved the moment someone joins or leaves", "Face camera and whiteboard camera, side by side", "Invitations, reminders and changes sent automatically"].map((t) => (
                  <li key={t} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="scroll-mt-16 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">From invite to live class in three steps</h2>
          <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              ["Invite your people", "Create a one-time link for each educator or family and share it on WhatsApp or email. They set a password and they're in."],
              ["Schedule a class", "Pick a time, choose families and repeat it weekly if you like. Everyone gets the invite in their own time zone."],
              ["Teach live", "Start the class, admit families from the waiting room and teach with two cameras. Attendance is saved for you."],
            ].map(([t, d], i) => (
              <li key={t} className="relative border-t-2 border-brand-600 pt-6">
                <span className="font-display text-5xl font-bold text-brand-300">{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{t}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* features bento */}
      <section id="features" className="scroll-mt-16 bg-canvas py-24">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Everything a live class needs, nothing it doesn't</h2>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-6">
            <div className="overflow-hidden rounded-3xl bg-brand-900 p-7 text-white md:col-span-4 md:row-span-2">
              <Camera className="h-6 w-6 text-accent" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Two cameras, one lesson</h3>
              <p className="mt-2 max-w-md text-brand-100">Show your face and your notebook, whiteboard or keyboard at the same time. Add screen sharing when you need it. Students pin whichever view they want.</p>
              <div className="mt-7 grid grid-cols-3 gap-3">
                <div className="col-span-2 overflow-hidden rounded-xl ring-1 ring-white/10"><Whiteboard /></div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold">Camera 1</div>
                  <div className="flex flex-1 items-center justify-center rounded-xl bg-white/10 text-sm"><MonitorUp className="mr-1.5 h-4 w-4" />Screen</div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200 md:col-span-2">
              <ShieldCheck className="h-6 w-6 text-brand-600" />
              <h3 className="mt-4 text-lg font-semibold">Waiting room</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Families wait until you let them in. Mute, turn off a camera or remove someone at any time.</p>
            </div>
            <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200 md:col-span-2">
              <Lock className="h-6 w-6 text-brand-600" />
              <h3 className="mt-4 text-lg font-semibold">Invite-only accounts</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">No public sign-up. Each person only sees their own classes and details.</p>
            </div>
            <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200 md:col-span-3">
              <CalendarDays className="h-6 w-6 text-brand-600" />
              <h3 className="mt-4 text-lg font-semibold">Scheduling that families can follow</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Weekly classes, RSVPs and automatic notices when a time changes.</p>
              <div className="mt-5"><MiniCalendar /></div>
            </div>
            <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200 md:col-span-3">
              <BarChart3 className="h-6 w-6 text-teal-600" />
              <h3 className="mt-4 text-lg font-semibold">Attendance without the register</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Join and leave times are recorded for every class. Export a report in one click.</p>
              <div className="mt-5"><MiniBars /></div>
            </div>
            <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200 md:col-span-2">
              <Bell className="h-6 w-6 text-brand-600" />
              <h3 className="mt-4 text-lg font-semibold">Reminders</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Send a reminder to one family or the whole class before it starts.</p>
            </div>
            <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200 md:col-span-2">
              <Smartphone className="h-6 w-6 text-brand-600" />
              <h3 className="mt-4 text-lg font-semibold">Phone or laptop</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Runs in the browser. A device check makes sure camera and mic work first.</p>
            </div>
            <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200 md:col-span-2">
              <Hand className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-lg font-semibold">Raise a hand</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Students raise a hand instead of talking over each other. You see it on their tile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* roles */}
      <section id="roles" className="scroll-mt-16 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">A view made for each person</h2>
          <div className="mt-8 inline-flex rounded-2xl bg-slate-100 p-1.5" role="tablist">
            {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((r) => (
              <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${role === r ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"}`}>{r}</button>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-2" role="tabpanel">
            <div>
              <p className="font-display text-2xl font-semibold leading-snug">{ROLES[role].lead}</p>
              <ul className="mt-6 space-y-3">
                {ROLES[role].points.map((p) => <li key={p} className="flex gap-3 text-slate-700"><Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />{p}</li>)}
              </ul>
            </div>
            <div className="rounded-3xl bg-canvas p-5 ring-1 ring-slate-200">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">{role === "Admin" ? "Today across the platform" : role === "Educator" ? "Your next class" : "Hi, Hassan family"}</p>
                {role === "Admin" ? (
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    {[["2", "live now"], ["7", "classes today"], ["24", "families"]].map(([n, l]) => <div key={l} className="rounded-xl bg-slate-50 py-4"><p className="font-display text-2xl font-bold">{n}</p><p className="text-xs text-slate-500">{l}</p></div>)}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-brand-900 p-5 text-white">
                    <div><p className="font-semibold">Maths: Fractions</p><p className="text-sm text-brand-200">Today, 4:00 PM · 45 min</p></div>
                    <span className={`rounded-xl px-4 py-2 text-sm font-semibold ${role === "Family" ? "bg-emerald-500" : "bg-white text-brand-900"}`}>{role === "Family" ? "Join class" : "Start class"}</span>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  {(role === "Family" ? [["Reading Circle", "Tue, 5:00 PM"], ["Science: Plants", "Thu, 4:30 PM"]] : [["Reading Circle", "3 of 4 coming"], ["Science: Plants", "4 of 4 coming"]]).map(([t, s]) => (
                    <div key={t} className="flex items-center justify-between rounded-xl px-3 py-2.5 ring-1 ring-slate-100"><span className="text-sm font-medium">{t}</span><span className="text-xs text-slate-500">{s}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* compare */}
      <section className="bg-canvas py-24">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Built for classes, not meetings</h2>
          <p className="mt-3 max-w-xl text-slate-600">General video-call apps are made for office calls. Classroom is made for teaching a group of children every week.</p>
          <div className="mt-10 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200"><th className="px-5 py-4 font-medium text-slate-500" /><th className="px-5 py-4 text-center font-semibold text-brand-700">Classroom</th><th className="px-5 py-4 text-center font-medium text-slate-500">Video-call apps</th></tr>
              </thead>
              <tbody>
                {COMPARE.map(([f, a, b]) => (
                  <tr key={f} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3.5 text-slate-700">{f}</td>
                    <td className="px-5 py-3.5 text-center">{a ? <Check className="mx-auto h-5 w-5 text-emerald-600" aria-label="Yes" /> : <X className="mx-auto h-5 w-5 text-slate-300" aria-label="No" />}</td>
                    <td className="px-5 py-3.5 text-center">{b ? <Check className="mx-auto h-5 w-5 text-slate-400" aria-label="Yes" /> : <X className="mx-auto h-5 w-5 text-slate-300" aria-label="No" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="scroll-mt-16 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 lg:grid-cols-[1fr_1.6fr]">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Questions families and teachers ask</h2>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map(([q, a], i) => (
              <div key={q}>
                <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 py-5 text-left font-semibold">
                  {q}<ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open === i ? "rotate-180" : ""}`} />
                </button>
                {open === i && <p className="pb-5 leading-relaxed text-slate-600">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="px-5 pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-brand-900 px-8 py-16 text-center text-white sm:px-16">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-5xl">See it from the teacher&apos;s side and the family&apos;s side</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-brand-100">Pick a demo account. One click signs you straight in, no password needed.</p>
          <div className="relative mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
            {[
              ["admin", "Admin", "admin@classroom.demo", "Users, master schedule, reports"],
              ["educator", "Educator", "educator@classroom.demo", "Schedule classes and teach live"],
              ["family", "Family", "family@classroom.demo", "Join classes and RSVP"],
            ].map(([k, r, e, t]) => (
              <Link key={k} href={`/login?demo=${k}`} className="group rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 transition hover:bg-white hover:text-brand-900">
                <p className="font-display text-lg font-semibold">Continue as {r}</p>
                <p className="mt-1 text-sm text-brand-100 group-hover:text-slate-600">{t}</p>
                <p className="mt-4 truncate font-mono text-xs text-brand-200 group-hover:text-slate-500">{e}</p>
              </Link>
            ))}
          </div>
          <p className="relative mt-6 text-sm text-brand-200">Signing in by hand? The password for all three accounts is <span className="font-mono text-white">Demo@12345</span>.</p>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row">
          <Logo />
          <div className="flex flex-wrap justify-center gap-5">
            {nav.map(([h, l]) => <a key={h} href={h} className="hover:text-ink">{l}</a>)}
            <Link href="/login" className="hover:text-ink">Sign in</Link>
          </div>
          <p>© {new Date().getFullYear()} Classroom</p>
        </div>
      </footer>
    </div>
  );
}
