"use client";
import { useEffect, useRef, useState } from "react";
import { Hand, MicOff, MoreVertical, Pin, UserMinus, VideoOff, MicOff as Mute } from "lucide-react";
import type { Quality } from "@/lib/room";
import { initials } from "@/lib/format";

export function Video({ stream, muted, mirror, contain }: { stream: MediaStream; muted?: boolean; mirror?: boolean; contain?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (v.srcObject !== stream) v.srcObject = stream;
    v.play().catch(() => {});
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={`h-full w-full ${contain ? "object-contain" : "object-cover"} ${mirror ? "scale-x-[-1]" : ""}`} />;
}

function Bars({ q }: { q: Quality }) {
  const n = q === "good" ? 3 : q === "fair" ? 2 : q === "poor" ? 1 : 0;
  const color = q === "good" ? "bg-emerald-400" : q === "fair" ? "bg-amber-400" : q === "poor" ? "bg-rose-500" : "bg-white/40";
  return (
    <span className="flex items-end gap-0.5" title={q === "connecting" ? "Connecting…" : `Connection: ${q}`}>
      {[1, 2, 3].map((i) => <span key={i} className={`w-1 rounded-sm ${i <= n ? color : "bg-white/25"} ${q === "connecting" ? "animate-pulse" : ""}`} style={{ height: 4 + i * 3 }} />)}
    </span>
  );
}

export function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    if (a.srcObject !== stream) a.srcObject = stream;
    a.play().catch(() => {});
  }, [stream]);
  return <audio ref={ref} autoPlay />;
}

export interface TileProps {
  name: string;
  label: string;
  stream?: MediaStream;
  me?: boolean;
  host?: boolean;
  mic: boolean;
  camOff?: boolean;
  hand?: boolean;
  quality: Quality;
  big?: boolean;
  mirror?: boolean;
  isScreen?: boolean;
  onPin?: () => void;
  controls?: { mute: () => void; camoff: () => void; remove: () => void; lowerHand?: () => void };
}

export function VideoTile(p: TileProps) {
  const [menu, setMenu] = useState(false);
  const hasVideo = !!p.stream && p.stream.getVideoTracks().length > 0 && !p.camOff;
  return (
    <div className={`group relative h-full w-full overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-white/5 ${p.hand ? "ring-2 ring-amber-400" : ""}`}>
      {p.stream && (
        <div className={hasVideo ? "h-full w-full" : "hidden"}>
          <Video stream={p.stream} muted mirror={p.mirror} contain={p.isScreen || p.big} />
        </div>
      )}
      {!hasVideo && (
        <div className="flex h-full w-full items-center justify-center">
          <div className={`flex items-center justify-center rounded-full bg-brand-600 font-semibold text-white ${p.big ? "h-24 w-24 text-3xl" : "h-14 w-14 text-lg"}`}>{initials(p.name)}</div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-white">
          {!p.mic && <MicOff className="h-3.5 w-3.5 shrink-0 text-rose-400" />}
          <span className="truncate">{p.name}{p.me ? " (you)" : ""}</span>
          {p.label !== "Camera 1" && <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[10px]">{p.label}</span>}
          {p.host && <span className="shrink-0 rounded bg-brand-500/80 px-1.5 py-0.5 text-[10px]">Host</span>}
        </div>
        {!p.me && <Bars q={p.quality} />}
      </div>
      {p.hand && <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-xs font-semibold text-amber-950"><Hand className="h-3.5 w-3.5" />Hand raised</div>}
      <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        {p.onPin && <button onClick={p.onPin} className="rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70" title="Spotlight"><Pin className="h-4 w-4" /></button>}
        {p.controls && (
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70" title="Participant controls"><MoreVertical className="h-4 w-4" /></button>
            {menu && (
              <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl bg-white py-1 text-sm text-slate-800 shadow-xl" onMouseLeave={() => setMenu(false)}>
                <button onClick={() => { p.controls!.mute(); setMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-100"><Mute className="h-4 w-4" />Mute</button>
                <button onClick={() => { p.controls!.camoff(); setMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-100"><VideoOff className="h-4 w-4" />Turn camera off</button>
                {p.hand && p.controls.lowerHand && <button onClick={() => { p.controls!.lowerHand!(); setMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-100"><Hand className="h-4 w-4" />Lower hand</button>}
                <button onClick={() => { p.controls!.remove(); setMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50"><UserMinus className="h-4 w-4" />Remove from class</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
