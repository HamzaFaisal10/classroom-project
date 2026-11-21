"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { relative } from "@/lib/format";
import type { Notification } from "@/lib/types";
import { Button, Card, Empty, PageHeader, Spinner } from "@/components/ui";

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const load = () => supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => setItems((data ?? []) as Notification[]));
  useEffect(() => { load(); }, []);

  async function markAll() {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    load();
  }
  async function open(n: Notification) {
    if (!n.read) await supabase.from("notifications").update({ read: true }).eq("id", n.id);
  }

  return (
    <>
      <PageHeader title="Notifications" subtitle="Invitations, reminders and changes to your classes."
        actions={<Button variant="secondary" onClick={markAll}><CheckCheck className="h-4 w-4" />Mark all as read</Button>} />
      <Card>
        {items === null ? <Spinner /> : items.length === 0 ? <Empty icon={<Bell className="h-5 w-5" />} title="You're all caught up" text="New invitations and class updates will show up here." /> : (
          <div className="divide-y divide-slate-100">
            {items.map((n) => {
              const body = (
                <div className={`flex items-start gap-3 px-5 py-4 ${n.read ? "" : "bg-brand-50/40"}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-brand-600"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {n.body && <p className="text-sm text-slate-600">{n.body}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{relative(n.created_at)}</span>
                </div>
              );
              return n.link ? <Link key={n.id} href={n.link} onClick={() => open(n)} className="block hover:bg-slate-50">{body}</Link> : <div key={n.id}>{body}</div>;
            })}
          </div>
        )}
      </Card>
    </>
  );
}
