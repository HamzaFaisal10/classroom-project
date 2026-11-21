export const PREF = { cam1: "classroom.cam1", cam2: "classroom.cam2", mic: "classroom.mic" } as const;

export function getPref(k: keyof typeof PREF) {
  try { return localStorage.getItem(PREF[k]) || ""; } catch { return ""; }
}
export function setPref(k: keyof typeof PREF, v: string) {
  try { if (v) localStorage.setItem(PREF[k], v); else localStorage.removeItem(PREF[k]); } catch {}
}

export async function listDevices() {
  const all = await navigator.mediaDevices.enumerateDevices();
  return {
    cams: all.filter((d) => d.kind === "videoinput"),
    mics: all.filter((d) => d.kind === "audioinput"),
    speakers: all.filter((d) => d.kind === "audiooutput"),
  };
}

export async function getCam(deviceId?: string) {
  return navigator.mediaDevices.getUserMedia({
    video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
}

export async function getMic(deviceId?: string) {
  return navigator.mediaDevices.getUserMedia({
    audio: deviceId ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true },
    video: false,
  });
}

export function stopStream(s?: MediaStream | null) {
  s?.getTracks().forEach((t) => t.stop());
}

export function mediaError(e: unknown) {
  const name = (e as { name?: string })?.name;
  if (name === "NotAllowedError") return "Camera or microphone permission was blocked. Allow access in your browser's address bar and try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera or microphone was found. Plug one in or pick another device.";
  if (name === "NotReadableError") return "Your camera or mic is being used by another app. Close it and try again.";
  return "Could not access your camera or microphone.";
}

export function playTestTone() {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.frequency.value = 660; g.gain.value = 0.1;
  o.connect(g); g.connect(ctx.destination); o.start();
  setTimeout(() => { o.stop(); ctx.close(); }, 700);
}

export function attachMeter(stream: MediaStream, cb: (v: number) => void) {
  {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser(); an.fftSize = 512;
    src.connect(an);
    const buf = new Uint8Array(an.fftSize);
    let raf = 0;
    const tick = () => {
      an.getByteTimeDomainData(buf);
      let sum = 0; for (const v of buf) { const x = (v - 128) / 128; sum += x * x; }
      cb(Math.min(1, Math.sqrt(sum / buf.length) * 4));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); ctx.close(); };
  };
}

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ...(process.env.NEXT_PUBLIC_TURN_URL
    ? [{ urls: process.env.NEXT_PUBLIC_TURN_URL.split(","), username: process.env.NEXT_PUBLIC_TURN_USERNAME, credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL }]
    : []),
];
