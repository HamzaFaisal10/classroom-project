import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mlgmkqnoiuhegslndkwn.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Kqcw7tbwb1ATIMFFqop7xw_hH1R9d6P";

// Add ?tab=1 to any URL to keep this browser tab's sign-in separate from other tabs
// (handy for testing educator + family side by side in one browser).
function tabAuth(): { storage?: Storage; storageKey?: string } {
  if (typeof window === "undefined") return {};
  try {
    if (new URLSearchParams(window.location.search).get("tab") === "1" && !sessionStorage.getItem("classroom.tabSession")) {
      sessionStorage.setItem("classroom.tabSession", `sb-classroom-tab-${Math.random().toString(36).slice(2)}`);
    }
    const k = sessionStorage.getItem("classroom.tabSession");
    // a unique key per tab also gives each tab its own auth sync channel
    if (k) return { storage: window.sessionStorage, storageKey: k };
  } catch {}
  return {};
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, ...tabAuth() },
  realtime: { params: { eventsPerSecond: 40 } },
});
