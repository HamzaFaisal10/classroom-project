import { supabase } from "./supabase";
import type { ClassRow, Profile } from "./types";

export const CLASS_SELECT = "*, educator:profiles!classes_educator_id_fkey(full_name), class_invites(family_id, rsvp)";

export async function fetchClasses(opts: { educatorId?: string; familyId?: string; from?: string; to?: string; statuses?: string[]; ascending?: boolean; limit?: number } = {}) {
  let q = supabase.from("classes").select(CLASS_SELECT);
  if (opts.educatorId) q = q.eq("educator_id", opts.educatorId);
  if (opts.from) q = q.gte("starts_at", opts.from);
  if (opts.to) q = q.lt("starts_at", opts.to);
  if (opts.statuses) q = q.in("status", opts.statuses);
  q = q.order("starts_at", { ascending: opts.ascending ?? true });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  let rows = (data ?? []) as ClassRow[];
  if (opts.familyId) rows = rows.filter((c) => c.class_invites?.some((i) => i.family_id === opts.familyId));
  return rows;
}

export async function fetchProfiles(role?: "educator" | "family" | "admin") {
  let q = supabase.from("profiles").select("*").order("full_name");
  if (role) q = q.eq("role", role);
  const { data } = await q;
  return (data ?? []) as Profile[];
}

export function appUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
