"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera, CameraOff, Hand, LayoutGrid, Loader2, LogOut, Mic, MicOff, MonitorUp, PhoneOff,
  Presentation, Square, UserCheck, Users, Video as VideoIcon, VideoOff, WifiOff, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth, homeFor } from "@/lib/auth";
import { getCam, getMic, getPref, listDevices, mediaError, setPref, stopStream } from "@/lib/devices";
import { RoomEngine, type LocalStream, type Participant } from "@/lib/room";
import { initials } from "@/lib/format";
import type { ClassRow } from "@/lib/types";
import { RemoteAudio, Video, VideoTile } from "@/components/room/VideoTile";
import { Logo } from "@/components/Logo";

type Phase = "loading" | "denied" | "notlive" | "precheck" | "joining" | "waiting" | "live" | "ended" | "removed" | "left";

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">{children}</div>;
}

function CtrlBtn({ on = true, danger, label, onClick, children, active }: { on?: boolean; danger?: boolean; active?: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  const c = danger ? "bg-rose-600 hover:bg-rose-500" : !on ? "bg-rose-500/90 hover:bg-rose-500" : active ? "bg-brand-500 hover:bg-brand-500/90" : "bg-white/10 hover:bg-white/20";
  return (
    <button onClick={onClick} title={label} className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium text-white transition sm:min-w-16 ${c}`}>
      {children}<span className="hidden sm:block">{label}</span>
    </button>
  );
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [error, setError] = useState("");

  // pre-check
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cam1Id, setCam1Id] = useState("");
  const [cam2Id, setCam2Id] = useState("");
  const [micId, setMicId] = useState("");
  const [preview, setPreview] = useState<MediaStream | null>(null);
  const [preMic, setPreMic] = useState(true);
  const [preCam, setPreCam] = useState(true);

  // live
  const engineRef = useRef<RoomEngine | null>(null);
  const [, force] = useState(0);
  const [connected, setConnected] = useState(true);
  const [panel, setPanel] = useState(false);
  const [view, setView] = useState<"speaker" | "grid">("speaker");
  const [pinned, setPinned] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const attIdRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const isHost = !!profile && !!cls && (profile.role === "admin" || cls.educator_id === profile.id);

  const flash = useCallback((t: string) => { setToast(t); setTimeout(() => setToast(""), 3500); }, []);

  // ---- load class ----
  useEffect(() => {
    if (loading) return;
    if (!session) { router.replace(`/login?next=/room/${id}`); return; }
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from("classes").select("*").eq("id", id).maybeSingle();
      const { data: s } = await supabase.from("settings").select("waiting_room").single();
      if (s) setWaitingRoom(s.waiting_room);
      if (!data) { setPhase("denied"); return; }
      const c = data as ClassRow;
      setCls(c);
      const host = profile.role === "admin" || c.educator_id === profile.id;
      if (c.status === "ended" || c.status === "cancelled") { setPhase("ended"); return; }
      if (!host && c.status !== "live") { setPhase("notlive"); return; }
      setPhase("precheck");
    })();
  }, [loading, session, profile, id, router]);

  // families: auto-continue when class goes live
  useEffect(() => {
    if (phase !== "notlive") return;
    const ch = supabase.channel(`room-status:${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "classes", filter: `id=eq.${id}` }, ({ new: n }) => {
        if ((n as ClassRow).status === "live") { setCls(n as ClassRow); setPhase("precheck"); }
      }).subscribe();
    const t = setInterval(async () => {
      const { data } = await supabase.from("classes").select("*").eq("id", id).maybeSingle();
      if (data?.status === "live") { setCls(data as ClassRow); setPhase("precheck"); }
    }, 10000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [phase, id]);

  // ---- precheck devices ----
  useEffect(() => {
    if (phase !== "precheck") return;
    (async () => {
      try { const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); stopStream(tmp); }
      catch (e) { setError(mediaError(e)); }
      const d = await listDevices();
      setCams(d.cams); setMics(d.mics);
      const p1 = getPref("cam1"), p2 = getPref("cam2"), pm = getPref("mic");
      setCam1Id(d.cams.find((c) => c.deviceId === p1)?.deviceId ?? d.cams[0]?.deviceId ?? "");
      setCam2Id(d.cams.find((c) => c.deviceId === p2)?.deviceId ?? "");
      setMicId(d.mics.find((m) => m.deviceId === pm)?.deviceId ?? d.mics[0]?.deviceId ?? "");
    })();
  }, [phase]);

  useEffect(() => {
    if (phase !== "precheck" || !cam1Id) return;
    let s: MediaStream | null = null; let cancel = false;
    getCam(cam1Id).then((x) => { if (cancel) stopStream(x); else { s = x; setPreview(x); } }).catch(() => setPreview(null));
    return () => { cancel = true; stopStream(s); };
  }, [phase, cam1Id]);

  // ---- join ----
  async function join() {
    if (!profile || !cls) return;
    setPhase("joining");
    stopStream(preview); setPreview(null);
    setPref("cam1", cam1Id); setPref("mic", micId); if (isHost) setPref("cam2", cam2Id);

    const main = new MediaStream();
    try { const m = await getMic(micId || undefined); m.getAudioTracks().forEach((t) => main.addTrack(t)); micStreamRef.current = m; } catch {}
    try { const c = await getCam(cam1Id || undefined); c.getVideoTracks().forEach((t) => main.addTrack(t)); } catch {}
    main.getAudioTracks().forEach((t) => (t.enabled = preMic));
    main.getVideoTracks().forEach((t) => (t.enabled = preCam));
    const local: LocalStream[] = [{ id: main.id, label: "Camera 1", stream: main }];
    if (isHost && cam2Id && cam2Id !== cam1Id) {
      try { const c2 = await getCam(cam2Id); local.push({ id: c2.id, label: "Camera 2", stream: c2 }); } catch { flash("Camera 2 couldn't start."); }
    }

    const engine = new RoomEngine(cls.id, { id: profile.id, name: profile.full_name || profile.email, host: isHost }, { waitingRoom }, (e) => {
      if (e.type === "status") setConnected(e.connected);
      if (e.type === "control") {
        if (e.action === "end") { finish("ended"); return; }
        if (e.action === "remove") { finish("removed"); return; }
        if (e.action === "mute") flash("The host muted your microphone.");
        if (e.action === "camoff") flash("The host turned off your camera.");
        if (e.action === "lowerhand") flash("The host lowered your hand.");
      }
      force((x) => x + 1);
    });
    engineRef.current = engine;
    await engine.join(local, preMic, preCam);

    if (isHost && cls.status !== "live") {
      const now = new Date().toISOString();
      await supabase.from("classes").update({ status: "live", started_at: cls.started_at ?? now }).eq("id", cls.id);
      setCls({ ...cls, status: "live", started_at: cls.started_at ?? now });
    }
    setPhase(isHost ? "live" : "waiting");
  }

  // guests: move from waiting to live once admitted
  const engine = engineRef.current;
  const admitted = engine?.amAdmitted() ?? false;
  useEffect(() => {
    if (phase === "waiting" && admitted) setPhase("live");
  }, [phase, admitted]);

  // attendance
  useEffect(() => {
    if (phase !== "live" || !profile || !cls || attIdRef.current) return;
    supabase.from("attendance").insert({ class_id: cls.id, user_id: profile.id }).select("id").single().then(({ data }) => { if (data) attIdRef.current = data.id; });
  }, [phase, profile, cls]);

  const closeAttendance = useCallback(() => {
    if (attIdRef.current) {
      supabase.from("attendance").update({ left_at: new Date().toISOString() }).eq("id", attIdRef.current).then(() => {});
      attIdRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    const e = engineRef.current;
    if (e) { e.localStreams.forEach((l) => stopStream(l.stream)); e.leave(); }
    stopStream(micStreamRef.current);
    engineRef.current = null;
    closeAttendance();
  }, [closeAttendance]);

  const finish = useCallback((p: Phase) => { cleanup(); setPhase(p); }, [cleanup]);

  useEffect(() => {
    const onHide = () => closeAttendance();
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("pagehide", onHide); cleanup(); };
  }, [cleanup, closeAttendance]);

  // timer
  useEffect(() => {
    if (phase !== "live" || !cls?.started_at) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(cls.started_at!).getTime()) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase, cls]);

  // ---- actions ----
  async function endClass() {
    if (!cls || !engineRef.current) return;
    if (!confirm("End the class for everyone?")) return;
    engineRef.current.control("*", "end");
    await supabase.from("classes").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", cls.id);
    finish("ended");
  }
  function leave() { finish("left"); }

  async function toggleCam2() {
    const e = engineRef.current; if (!e) return;
    const cur = e.localStreams.find((l) => l.label === "Camera 2");
    if (cur) { e.removeLocal(cur.stream.id); return; }
    const other = cams.find((c) => c.deviceId !== cam1Id);
    const dev = cam2Id && cam2Id !== cam1Id ? cam2Id : other?.deviceId;
    if (!dev) { flash("No second camera found. Connect one and try again."); return; }
    try { const s = await getCam(dev); e.addLocal({ id: s.id, label: "Camera 2", stream: s }); setCam2Id(dev); }
    catch { flash("Camera 2 couldn't start. It may be in use."); }
  }

  async function toggleScreen() {
    const e = engineRef.current; if (!e) return;
    const cur = e.localStreams.find((l) => l.label === "Screen");
    if (cur) { e.removeLocal(cur.stream.id); return; }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      s.getVideoTracks()[0].onended = () => engineRef.current?.removeLocal(s.id);
      e.addLocal({ id: s.id, label: "Screen", stream: s });
      setPinned(`${profile!.id}:${s.id}`);
    } catch { /* user cancelled */ }
  }

  // ---- derived ----
  const participants: Participant[] = engine?.participants() ?? [];
  const waitingList = isHost ? engine?.waiting() ?? [] : [];
  const tiles = useMemo(() => participants.flatMap((p) => {
    const streams = p.remoteStreams.length ? p.remoteStreams : [{ id: "none", label: "Camera 1", stream: undefined as unknown as MediaStream }];
    return streams.map((s) => ({ key: `${p.id}:${s.id}`, p, s }));
  }), [participants]);

  const defaultSpot = useMemo(() => {
    const host = participants.find((p) => p.host && !p.me) ?? participants.find((p) => p.host);
    const screen = participants.flatMap((p) => p.remoteStreams.filter((s) => s.label === "Screen").map((s) => `${p.id}:${s.id}`))[0];
    if (screen) return screen;
    if (host) { const s = host.remoteStreams.find((x) => x.label === "Camera 1") ?? host.remoteStreams[0]; return `${host.id}:${s?.id ?? "none"}`; }
    return tiles[0]?.key;
  }, [participants, tiles]);
  const spotKey = pinned && tiles.some((t) => t.key === pinned) ? pinned : defaultSpot;
  const spot = tiles.find((t) => t.key === spotKey);
  const others = tiles.filter((t) => t.key !== spotKey);

  const fmtElapsed = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  // ---- screens ----
  if (phase === "loading" || loading) return <Screen><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></Screen>;
  const home = homeFor(profile?.role);
  if (phase === "denied") return <Screen><p className="text-lg font-semibold">You don&apos;t have access to this class</p><p className="mt-1 text-sm text-slate-400">Only invited families and the class educator can join.</p><Link href={home} className="mt-6 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900">Back to dashboard</Link></Screen>;
  if (phase === "notlive") return <Screen><Loader2 className="h-8 w-8 animate-spin text-brand-500" /><p className="mt-4 text-lg font-semibold">{cls?.title}</p><p className="mt-1 max-w-sm text-sm text-slate-400">The class hasn&apos;t started yet. This page will open the class automatically when your educator starts it.</p><Link href={home} className="mt-6 text-sm font-semibold text-brand-300">Back to home</Link></Screen>;
  if (phase === "ended") return <Screen><div className="rounded-2xl bg-white/10 p-4"><Square className="h-7 w-7" /></div><p className="mt-4 text-xl font-semibold">The class has ended</p><p className="mt-1 text-sm text-slate-400">Thanks for joining{cls ? ` ${cls.title}` : ""}.</p><Link href={isHost && cls ? `/classes/${cls.id}` : home} className="mt-6 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900">{isHost ? "View attendance" : "Back to home"}</Link></Screen>;
  if (phase === "removed") return <Screen><p className="text-xl font-semibold">You were removed from the class</p><p className="mt-1 text-sm text-slate-400">Contact your educator if you think this was a mistake.</p><Link href={home} className="mt-6 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900">Back to home</Link></Screen>;
  if (phase === "left") return <Screen><p className="text-xl font-semibold">You left the class</p><div className="mt-6 flex gap-3"><button onClick={() => { setPhase("precheck"); }} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold">Rejoin</button><Link href={home} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900">Back to home</Link></div></Screen>;

  if (phase === "precheck" || phase === "joining") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><Logo light /><Link href={home} className="text-sm text-slate-400 hover:text-white">Cancel</Link></div>
        <div className="mx-auto grid max-w-5xl gap-8 px-6 pb-12 pt-4 lg:grid-cols-5 lg:items-center">
          <div className="lg:col-span-3">
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-slate-800">
              {preview && preCam ? <Video stream={preview} muted mirror /> : (
                <div className="flex h-full items-center justify-center"><div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-3xl font-semibold">{initials(profile?.full_name ?? "")}</div></div>
              )}
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
                <button onClick={() => setPreMic(!preMic)} className={`rounded-full p-3.5 ${preMic ? "bg-white/15 hover:bg-white/25" : "bg-rose-500"}`}>{preMic ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button>
                <button onClick={() => setPreCam(!preCam)} className={`rounded-full p-3.5 ${preCam ? "bg-white/15 hover:bg-white/25" : "bg-rose-500"}`}>{preCam ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}</button>
              </div>
            </div>
            {error && <p className="mt-3 rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200">{error} You can still join and listen.</p>}
          </div>
          <div className="lg:col-span-2">
            <p className="text-sm font-medium text-brand-300">{isHost ? "Ready to teach?" : "Ready to join?"}</p>
            <h1 className="mt-1 text-2xl font-bold">{cls?.title}</h1>
            <div className="mt-6 space-y-3">
              <label className="block text-sm"><span className="mb-1 block text-slate-400">Camera {isHost ? "1" : ""}</span>
                <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" value={cam1Id} onChange={(e) => setCam1Id(e.target.value)}>
                  {cams.length === 0 && <option value="">No camera</option>}
                  {cams.map((c, i) => <option key={c.deviceId} value={c.deviceId} className="text-slate-900">{c.label || `Camera ${i + 1}`}</option>)}
                </select></label>
              {isHost && (
                <label className="block text-sm"><span className="mb-1 block text-slate-400">Camera 2 (desk / whiteboard)</span>
                  <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" value={cam2Id} onChange={(e) => setCam2Id(e.target.value)}>
                    <option value="" className="text-slate-900">Not used</option>
                    {cams.filter((c) => c.deviceId !== cam1Id).map((c, i) => <option key={c.deviceId} value={c.deviceId} className="text-slate-900">{c.label || `Camera ${i + 2}`}</option>)}
                  </select></label>
              )}
              <label className="block text-sm"><span className="mb-1 block text-slate-400">Microphone</span>
                <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" value={micId} onChange={(e) => setMicId(e.target.value)}>
                  {mics.map((m, i) => <option key={m.deviceId} value={m.deviceId} className="text-slate-900">{m.label || `Microphone ${i + 1}`}</option>)}
                </select></label>
            </div>
            <button onClick={join} disabled={phase === "joining"} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 font-semibold shadow-lg shadow-brand-900/40 hover:bg-brand-500 disabled:opacity-60">
              {phase === "joining" && <Loader2 className="h-5 w-5 animate-spin" />}{isHost ? (cls?.status === "live" ? "Rejoin class" : "Start class") : "Join class"}
            </button>
            {!isHost && waitingRoom && <p className="mt-3 text-center text-xs text-slate-400">The educator will let you in from the waiting room.</p>}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    const me = participants.find((p) => p.me);
    return (
      <Screen>
        <div className="relative mb-6 aspect-video w-full max-w-md overflow-hidden rounded-3xl bg-slate-800">
          {me?.remoteStreams[0] && me.cam ? <Video stream={me.remoteStreams[0].stream} muted mirror /> : <div className="flex h-full items-center justify-center text-3xl font-semibold">{initials(profile?.full_name ?? "")}</div>}
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
        <p className="mt-3 text-xl font-semibold">Waiting for the educator to let you in</p>
        <p className="mt-1 text-sm text-slate-400">{cls?.title}</p>
        {!connected && <p className="mt-3 text-sm text-amber-300">Reconnecting…</p>}
        <button onClick={leave} className="mt-6 text-sm font-semibold text-slate-300 hover:text-white">Leave</button>
      </Screen>
    );
  }

  // ---- live ----
  const meP = participants.find((p) => p.me);
  const hasCam2 = !!engine?.localStreams.some((l) => l.label === "Camera 2");
  const sharing = !!engine?.localStreams.some((l) => l.label === "Screen");
  const tileProps = (t: (typeof tiles)[number], big = false) => ({
    name: t.p.name, label: t.s.label, stream: t.s.stream, me: t.p.me, host: t.p.host, mic: t.p.mic,
    camOff: t.s.label === "Camera 1" && !t.p.cam, hand: t.p.hand, quality: t.p.quality, big,
    mirror: t.p.me && t.s.label === "Camera 1", isScreen: t.s.label === "Screen",
    onPin: () => setPinned(t.key),
    controls: isHost && !t.p.me && !t.p.host ? {
      mute: () => engine?.control(t.p.id, "mute"),
      camoff: () => engine?.control(t.p.id, "camoff"),
      remove: () => { if (confirm(`Remove ${t.p.name} from the class?`)) engine?.control(t.p.id, "remove"); },
      lowerHand: () => engine?.control(t.p.id, "lowerhand"),
    } : undefined,
  });

  const gridCols = tiles.length <= 1 ? "grid-cols-1" : tiles.length <= 4 ? "grid-cols-1 sm:grid-cols-2" : tiles.length <= 9 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 text-white">
      {participants.filter((p) => !p.me).flatMap((p) => p.remoteStreams.filter((s) => s.stream.getAudioTracks().length > 0).map((s) => <RemoteAudio key={`a:${p.id}:${s.id}`} stream={s.stream} />))}

      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE</span>
          <p className="truncate font-semibold">{cls?.title}</p>
          <span className="hidden font-mono text-sm text-slate-400 sm:block">{fmtElapsed}</span>
        </div>
        <div className="flex items-center gap-2">
          {!connected && <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300"><WifiOff className="h-3.5 w-3.5" />Reconnecting…</span>}
          {isHost && waitingList.length > 0 && <button onClick={() => setPanel(true)} className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">{waitingList.length} waiting</button>}
          <button onClick={() => setView(view === "grid" ? "speaker" : "grid")} className="hidden rounded-xl bg-white/10 p-2 hover:bg-white/20 sm:block" title={view === "grid" ? "Speaker view" : "Grid view"}>{view === "grid" ? <Presentation className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}</button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          {view === "grid" ? (
            <div className={`grid min-h-0 flex-1 auto-rows-fr gap-3 overflow-y-auto ${gridCols}`}>
              {tiles.map((t) => <div key={t.key} className="min-h-40"><VideoTile {...tileProps(t)} /></div>)}
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1">{spot && <VideoTile {...tileProps(spot, true)} onPin={undefined} />}</div>
              {others.length > 0 && (
                <div className="flex h-28 shrink-0 gap-3 overflow-x-auto sm:h-36">
                  {others.map((t) => <div key={t.key} className="aspect-video h-full shrink-0"><VideoTile {...tileProps(t)} /></div>)}
                </div>
              )}
            </>
          )}
        </div>

        {panel && (
          <aside className="fixed inset-0 z-30 flex flex-col bg-slate-900 sm:static sm:w-80 sm:shrink-0 sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-semibold">People ({participants.length})</p>
              <button onClick={() => setPanel(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {isHost && (
                <div>
                  <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Waiting room ({waitingList.length})</p>
                    {waitingList.length > 1 && <button onClick={() => engine?.admitAll()} className="text-xs font-semibold text-brand-300">Admit all</button>}</div>
                  {waitingList.length === 0 ? <p className="text-sm text-slate-500">Nobody is waiting.</p> : waitingList.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold">{initials(m.name)}</div>
                      <p className="min-w-0 flex-1 truncate text-sm">{m.name}</p>
                      <button onClick={() => engine?.admit(m.id)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold hover:bg-emerald-500"><UserCheck className="h-3.5 w-3.5" />Admit</button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">In class</p>
                  {isHost && <button onClick={() => { engine?.control("*", "mute"); flash("Everyone has been muted."); }} className="text-xs font-semibold text-brand-300">Mute all</button>}</div>
                <div className="space-y-1">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold">{initials(p.name)}</div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm">{p.name}{p.me ? " (you)" : ""}</p><p className="text-[11px] text-slate-500">{p.host ? "Host" : "Family"}{p.remoteStreams.length > 1 ? ` · ${p.remoteStreams.length} feeds` : ""}</p></div>
                      {p.hand && <Hand className="h-4 w-4 text-amber-400" />}
                      {p.mic ? <Mic className="h-4 w-4 text-slate-400" /> : <MicOff className="h-4 w-4 text-rose-400" />}
                      {p.cam ? <Camera className="h-4 w-4 text-slate-400" /> : <CameraOff className="h-4 w-4 text-rose-400" />}
                      {isHost && !p.me && !p.host && (
                        <div className="flex gap-0.5">
                          <button onClick={() => engine?.control(p.id, "mute")} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white" title="Mute"><MicOff className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { if (confirm(`Remove ${p.name}?`)) engine?.control(p.id, "remove"); }} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-rose-400" title="Remove"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {toast && <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center"><span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-xl">{toast}</span></div>}

      <footer className="flex flex-wrap items-center justify-center gap-2 border-t border-white/5 px-3 py-3">
        <CtrlBtn on={!!meP?.mic} label={meP?.mic ? "Mute" : "Unmute"} onClick={() => engine?.setMic(!engine.micOn)}>{meP?.mic ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</CtrlBtn>
        <CtrlBtn on={!!meP?.cam} label={meP?.cam ? "Stop video" : "Start video"} onClick={() => engine?.setCam(!engine.camOn)}>{meP?.cam ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}</CtrlBtn>
        {isHost && <CtrlBtn active={hasCam2} label={hasCam2 ? "Camera 2 on" : "Camera 2"} onClick={toggleCam2}><Camera className="h-5 w-5" /></CtrlBtn>}
        {isHost && <CtrlBtn active={sharing} label={sharing ? "Stop share" : "Share screen"} onClick={toggleScreen}><MonitorUp className="h-5 w-5" /></CtrlBtn>}
        {!isHost && <CtrlBtn active={engine?.handUp} label={engine?.handUp ? "Lower hand" : "Raise hand"} onClick={() => engine?.setHand(!engine.handUp)}><Hand className="h-5 w-5" /></CtrlBtn>}
        <CtrlBtn active={panel} label="People" onClick={() => setPanel(!panel)}>
          <span className="relative"><Users className="h-5 w-5" />{isHost && waitingList.length > 0 && <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-950">{waitingList.length}</span>}</span>
        </CtrlBtn>
        <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />
        <CtrlBtn label="Leave" onClick={leave}><LogOut className="h-5 w-5" /></CtrlBtn>
        {isHost && <CtrlBtn danger label="End class" onClick={endClass}><PhoneOff className="h-5 w-5" /></CtrlBtn>}
      </footer>
    </div>
  );
}
