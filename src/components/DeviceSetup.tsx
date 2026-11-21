"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Mic, Volume2, Wifi } from "lucide-react";
import { getCam, getMic, getPref, listDevices, mediaError, playTestTone, setPref, stopStream, attachMeter } from "@/lib/devices";
import { supabase } from "@/lib/supabase";
import { Alert, Button, Card } from "./ui";

function Preview({ stream, label }: { stream: MediaStream | null; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
      {stream ? <video ref={ref} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" /> :
        <div className="flex h-full items-center justify-center text-sm text-slate-400"><Camera className="mr-2 h-5 w-5" />No camera</div>}
      <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white">{label}</span>
    </div>
  );
}

export function DeviceSetup({ multi = false, onReady }: { multi?: boolean; onReady?: () => void }) {
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cam1, setCam1] = useState("");
  const [cam2, setCam2] = useState("");
  const [mic, setMic] = useState("");
  const [s1, setS1] = useState<MediaStream | null>(null);
  const [s2, setS2] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const [rtt, setRtt] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const refresh = useCallback(async () => {
    const d = await listDevices();
    setCams(d.cams); setMics(d.mics);
    return d;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stopStream(tmp);
      } catch (e) { setError(mediaError(e)); }
      const d = await refresh();
      const p1 = getPref("cam1"), p2 = getPref("cam2"), pm = getPref("mic");
      setCam1(d.cams.find((c) => c.deviceId === p1)?.deviceId ?? d.cams[0]?.deviceId ?? "");
      setCam2(multi ? (d.cams.find((c) => c.deviceId === p2)?.deviceId ?? "") : "");
      setMic(d.mics.find((m) => m.deviceId === pm)?.deviceId ?? d.mics[0]?.deviceId ?? "");
    })();
    const t0 = performance.now();
    supabase.from("settings").select("id").limit(1).then(() => setRtt(Math.round(performance.now() - t0)));
  }, [multi, refresh]);

  useEffect(() => {
    if (!cam1) return;
    let s: MediaStream | null = null; let cancelled = false;
    getCam(cam1).then((x) => { if (cancelled) stopStream(x); else { s = x; setS1(x); } }).catch((e) => setError(mediaError(e)));
    return () => { cancelled = true; stopStream(s); setS1(null); };
  }, [cam1]);

  useEffect(() => {
    if (!cam2 || cam2 === cam1) { setS2(null); return; }
    let s: MediaStream | null = null; let cancelled = false;
    getCam(cam2).then((x) => { if (cancelled) stopStream(x); else { s = x; setS2(x); } }).catch(() => setError("Camera 2 could not start. Some devices can't run two cameras at once."));
    return () => { cancelled = true; stopStream(s); setS2(null); };
  }, [cam2, cam1]);

  useEffect(() => {
    if (!mic) return;
    let s: MediaStream | null = null; let stop = () => {}; let cancelled = false;
    getMic(mic).then((x) => { if (cancelled) { stopStream(x); return; } s = x; setMicStream(x); stop = attachMeter(x, setLevel); }).catch((e) => setError(mediaError(e)));
    return () => { cancelled = true; stop(); stopStream(s); setMicStream(null); };
  }, [mic]);

  function save() {
    setPref("cam1", cam1); setPref("cam2", multi ? cam2 : ""); setPref("mic", mic);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    onReady?.();
  }

  const quality = rtt === null ? "Checking…" : rtt < 300 ? "Good" : rtt < 800 ? "Fair" : "Weak";
  const qColor = rtt === null ? "text-slate-500" : rtt < 300 ? "text-emerald-600" : rtt < 800 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}
      <div className={`grid gap-4 ${multi ? "md:grid-cols-2" : ""}`}>
        <Card className="p-4">
          <Preview stream={s1} label="Camera 1" />
          <select className="input mt-3" value={cam1} onChange={(e) => setCam1(e.target.value)}>
            {cams.length === 0 && <option value="">No cameras found</option>}
            {cams.map((c, i) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${i + 1}`}</option>)}
          </select>
        </Card>
        {multi && (
          <Card className="p-4">
            <Preview stream={s2} label="Camera 2 (desk / whiteboard)" />
            <select className="input mt-3" value={cam2} onChange={(e) => setCam2(e.target.value)}>
              <option value="">Not used</option>
              {cams.filter((c) => c.deviceId !== cam1).map((c, i) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${i + 2}`}</option>)}
            </select>
            {cams.length < 2 && <p className="mt-2 text-xs text-slate-500">Connect a second camera (e.g. a USB webcam or phone-as-webcam) to stream two angles.</p>}
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Mic className="h-4 w-4 text-brand-600" />Microphone</div>
          <select className="input mt-3" value={mic} onChange={(e) => setMic(e.target.value)}>
            {mics.map((m, i) => <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${i + 1}`}</option>)}
          </select>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} /></div>
          <p className="mt-1.5 text-xs text-slate-500">{micStream ? "Speak — the bar should move." : "Microphone off"}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Volume2 className="h-4 w-4 text-brand-600" />Speakers</div>
          <p className="mt-3 text-sm text-slate-600">Play a short tone to check you can hear audio.</p>
          <Button variant="secondary" className="mt-3 w-full" onClick={playTestTone}>Play test sound</Button>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Wifi className="h-4 w-4 text-brand-600" />Connection</div>
          <p className={`mt-3 text-2xl font-bold ${qColor}`}>{quality}</p>
          <p className="text-xs text-slate-500">{rtt !== null ? `Server response ${rtt} ms` : "Measuring…"}</p>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save}>{onReady ? "Continue" : "Save devices"}</Button>
        {saved && <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" />Saved for your next class</span>}
      </div>
    </div>
  );
}
