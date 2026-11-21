import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mlgmkqnoiuhegslndkwn.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Kqcw7tbwb1ATIMFFqop7xw_hH1R9d6P";

// Add ?tab=1 to any URL to keep this browser tab's sign-in separate from other tabs
// (handy for testing educator + family side by side in one browser).
function pickStorage() {
  if (typeof window === "undefined") return undefined;
  try {
    if (new URLSearchParams(window.location.search).get("tab") === "1") sessionStorage.setItem("classroom.tabSession", "1");
    if (sessionStorage.getItem("classroom.tabSession") === "1") return window.sessionStorage;
  } catch {}
  return undefined;
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, storage: pickStorage() },
  realtime: { params: { eventsPerSecond: 40 } },
});
