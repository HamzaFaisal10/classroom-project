"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell, BarChart3, CalendarDays, Camera, GraduationCap, History, Home, LogOut, Menu,
  Settings, UserPlus, Users, X, BookOpen, UserCircle,
} from "lucide-react";
import { useAuth, homeFor } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/lib/types";
import { Avatar, Spinner } from "./ui";
import { Logo } from "./Logo";

type NavItem = { href: string; label: string; icon: React.ElementType };
const NAV: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/schedule", label: "Master schedule", icon: CalendarDays },
    { href: "/admin/educators", label: "Educators", icon: GraduationCap },
    { href: "/admin/families", label: "Families", icon: Users },
    { href: "/admin/invite", label: "Invite user", icon: UserPlus },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  educator: [
    { href: "/educator", label: "Dashboard", icon: Home },
    { href: "/educator/schedule", label: "My schedule", icon: CalendarDays },
    { href: "/educator/families", label: "My families", icon: Users },
    { href: "/educator/history", label: "Class history", icon: History },
    { href: "/educator/camera-setup", label: "Camera setup", icon: Camera },
  ],
  family: [
    { href: "/family", label: "Home", icon: Home },
    { href: "/family/classes", label: "My classes", icon: BookOpen },
    { href: "/device-check", label: "Device check", icon: Camera },
  ],
};

export function AppShell({ children, allow }: { children: React.ReactNode; allow?: Role[] }) {
  const { session, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!session) { router.replace(`/login?next=${encodeURIComponent(path)}`); return; }
    if (profile && allow && !allow.includes(profile.role)) router.replace("/no-access");
  }, [loading, session, profile, allow, router, path]);

  useEffect(() => { setOpen(false); }, [path]);

  const uid = profile?.id;
  useEffect(() => {
    if (!uid) return;
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [uid, path]);
  useEffect(() => {
    if (!uid) return;
    const load = () => supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
    const ch = supabase.channel(`notif:${uid}:${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid]);

  if (loading || !session || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {!loading && session && !profile ? (
          <div className="text-center text-sm text-slate-600">
            <p>Your account isn&apos;t set up yet.</p>
            <button className="mt-2 font-semibold text-brand-600" onClick={signOut}>Sign out</button>
          </div>
        ) : <Spinner />}
      </div>
    );
  }
  if (!profile.active) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div><p className="font-semibold">Your account has been deactivated.</p><p className="mt-1 text-sm text-slate-500">Please contact your administrator.</p>
          <button className="mt-3 text-sm font-semibold text-brand-600" onClick={signOut}>Sign out</button></div>
      </div>
    );
  }
  if (allow && !allow.includes(profile.role)) return <Spinner />;

  const items = NAV[profile.role];
  const isActive = (href: string) => href === homeFor(profile.role) ? path === href : path.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5"><Link href={homeFor(profile.role)}><Logo /></Link></div>
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{profile.role === "admin" ? "Admin panel" : profile.role === "educator" ? "Educator portal" : "Family"}</p>
      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link key={it.href} href={it.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
              <it.icon className={`h-[18px] w-[18px] ${active ? "text-brand-600" : "text-slate-400"}`} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <Link href="/profile" className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100">
          <Avatar name={profile.full_name || profile.email} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile.full_name}</p>
            <p className="truncate text-xs text-slate-500">{profile.email}</p>
          </div>
        </Link>
        <button onClick={async () => { await signOut(); router.replace("/login"); }}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button className="absolute right-3 top-5 rounded-lg p-1 text-slate-400" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-canvas/85 px-4 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="lg:hidden"><Logo /></div>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/notifications" className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-200/60" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
          <Link href="/profile" className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-200/60" aria-label="Profile"><UserCircle className="h-5 w-5" /></Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
