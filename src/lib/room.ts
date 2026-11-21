"use client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { ICE_SERVERS } from "./devices";

export type Quality = "good" | "fair" | "poor" | "connecting";

export interface Member {
  id: string;
  name: string;
  host: boolean;
  mic: boolean;
  cam: boolean;
  hand?: boolean;
  streams: Record<string, string>; // streamId -> label
  admitted?: string[]; // only hosts publish
  removed?: string[]; // only hosts publish
  joinedAt: number;
}

export interface RemoteStream { id: string; label: string; stream: MediaStream }
export interface Participant extends Member {
  me: boolean;
  admittedNow: boolean;
  quality: Quality;
  remoteStreams: RemoteStream[];
}

type ControlAction = "mute" | "camoff" | "remove" | "end" | "lowerhand";

interface PeerConn {
  pc: RTCPeerConnection;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  pending: RTCIceCandidateInit[];
  senders: Map<string, RTCRtpSender>;
  streams: Map<string, MediaStream>;
  quality: Quality;
  session: number;
}

export interface LocalStream { id: string; label: string; stream: MediaStream }

export type RoomEvent =
  | { type: "change" }
  | { type: "control"; action: ControlAction; from: string }
  | { type: "status"; connected: boolean };

export class RoomEngine {
  private channel: RealtimeChannel | null = null;
  private peers = new Map<string, PeerConn>();
  private members: Record<string, Member> = {};
  private everAdmitted = new Set<string>();
  private admitted = new Set<string>(); // host-only: who I admitted
  private removed = new Set<string>(); // host-only
  private statsTimer: ReturnType<typeof setInterval> | null = null;
  private local: LocalStream[] = [];
  private state: Omit<Member, "joinedAt" | "id" | "name" | "host" | "streams"> = { mic: true, cam: true, hand: false };
  private joinedAt = Date.now();
  private closed = false;
  connected = false;

  constructor(
    private classId: string,
    public me: { id: string; name: string; host: boolean },
    private opts: { waitingRoom: boolean },
    private emit: (e: RoomEvent) => void,
    private transport: { channel: (name: string, opts: object) => RealtimeChannel; remove: (c: RealtimeChannel) => void } = {
      channel: (name, opts) => supabase.channel(name, opts as Parameters<typeof supabase.channel>[1]),
      remove: (c) => { supabase.removeChannel(c); },
    },
  ) {
    if (me.host) this.everAdmitted.add(me.id);
  }

  // ---------- lifecycle ----------
  async join(local: LocalStream[], mic: boolean, cam: boolean) {
    this.local = local;
    this.state.mic = mic; this.state.cam = cam;
    const ch = this.transport.channel(`room:${this.classId}`, { config: { presence: { key: this.me.id }, broadcast: { self: false, ack: false } } });
    this.channel = ch;
    ch.on("presence", { event: "sync" }, () => this.onPresence());
    ch.on("broadcast", { event: "signal" }, ({ payload }) => this.onSignal(payload));
    ch.on("broadcast", { event: "control" }, ({ payload }) => this.onControl(payload));
    ch.subscribe(async (status) => {
      const ok = status === "SUBSCRIBED";
      this.connected = ok;
      this.emit({ type: "status", connected: ok });
      if (ok) await this.publish();
    });
    this.statsTimer = setInterval(() => this.pollStats(), 3000);
  }

  leave() {
    this.closed = true;
    if (this.statsTimer) clearInterval(this.statsTimer);
    this.peers.forEach((p) => p.pc.close());
    this.peers.clear();
    if (this.channel) { this.channel.untrack().catch(() => {}); this.transport.remove(this.channel); }
    this.channel = null;
  }

  // ---------- presence ----------
  private payload(): Member {
    return {
      id: this.me.id, name: this.me.name, host: this.me.host,
      mic: this.state.mic, cam: this.state.cam, hand: this.state.hand,
      streams: Object.fromEntries(this.local.map((l) => [l.stream.id, l.label])),
      admitted: this.me.host ? [...this.admitted] : undefined,
      removed: this.me.host ? [...this.removed] : undefined,
      joinedAt: this.joinedAt,
    };
  }

  private async publish() {
    if (!this.channel || this.closed) return;
    await this.channel.track(this.payload()).catch(() => {});
  }

  private onPresence() {
    if (!this.channel) return;
    const raw = this.channel.presenceState() as Record<string, Member[]>;
    const next: Record<string, Member> = {};
    for (const [key, list] of Object.entries(raw)) {
      const last = list[list.length - 1];
      if (last) next[key] = last;
    }
    this.members = next;

    // host: auto-admit when waiting room is off; keep admitted lists in sync
    if (this.me.host) {
      let changed = false;
      for (const m of Object.values(next)) {
        if (m.host || m.id === this.me.id) continue;
        const otherHostAdmitted = Object.values(next).some((h) => h.host && h.admitted?.includes(m.id));
        if ((!this.opts.waitingRoom || otherHostAdmitted) && !this.admitted.has(m.id) && !this.removed.has(m.id)) { this.admitted.add(m.id); changed = true; }
      }
      if (changed) this.publish();
    }

    // compute admissions
    for (const m of Object.values(next)) {
      if (this.isAdmittedNow(m.id)) this.everAdmitted.add(m.id);
    }
    const removedByHost = Object.values(next).some((h) => h.host && h.removed?.includes(this.me.id));
    if (removedByHost && !this.me.host) { this.emit({ type: "control", action: "remove", from: "host" }); return; }

    // peers that left
    for (const id of [...this.peers.keys()]) {
      if (!next[id]) this.closePeer(id);
    }
    // peers to connect
    if (this.amAdmitted()) {
      for (const m of Object.values(next)) {
        if (m.id === this.me.id) continue;
        const existing = this.peers.get(m.id);
        if (this.everAdmitted.has(m.id) && (!existing || existing.session !== m.joinedAt)) this.ensurePeer(m.id, m.joinedAt);
      }
    }
    this.emit({ type: "change" });
  }

  private isAdmittedNow(id: string) {
    const m = this.members[id];
    if (!m) return false;
    if (m.host) return true;
    return Object.values(this.members).some((h) => h.host && h.admitted?.includes(id) && !h.removed?.includes(id));
  }

  amAdmitted() {
    return this.me.host || this.everAdmitted.has(this.me.id);
  }

  // ---------- peers ----------
  private ensurePeer(id: string, session: number) {
    let p = this.peers.get(id);
    if (p && p.session === session) return p;
    if (p) this.closePeer(id);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    p = { pc, polite: this.me.id > id, makingOffer: false, ignoreOffer: false, pending: [], senders: new Map(), streams: new Map(), quality: "connecting", session };
    this.peers.set(id, p);
    const peer = p;

    for (const l of this.local) for (const t of l.stream.getTracks()) peer.senders.set(t.id, pc.addTrack(t, l.stream));

    pc.onnegotiationneeded = async () => {
      try {
        peer.makingOffer = true;
        await pc.setLocalDescription();
        this.send(id, { description: pc.localDescription?.toJSON() });
      } catch (e) { console.warn("negotiation", e); } finally { peer.makingOffer = false; }
    };
    pc.onicecandidate = ({ candidate }) => { if (candidate) this.send(id, { candidate: candidate.toJSON() }); };
    pc.ontrack = (ev) => {
      const s = ev.streams[0] ?? new MediaStream([ev.track]);
      peer.streams.set(s.id, s);
      s.onremovetrack = () => { if (s.getTracks().length === 0) peer.streams.delete(s.id); this.emit({ type: "change" }); };
      ev.track.onunmute = () => this.emit({ type: "change" });
      this.emit({ type: "change" });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") pc.restartIce();
      if (pc.connectionState !== "connected") peer.quality = "connecting";
      this.emit({ type: "change" });
    };
    return peer;
  }

  private closePeer(id: string) {
    const p = this.peers.get(id);
    if (!p) return;
    p.pc.close();
    this.peers.delete(id);
  }

  private send(to: string, data: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
    this.channel?.send({ type: "broadcast", event: "signal", payload: { from: this.me.id, sess: this.joinedAt, to, ...data } });
  }

  private async onSignal(msg: { from: string; sess: number; to: string; description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
    if (msg.to !== this.me.id || this.closed) return;
    const sender = this.members[msg.from];
    if (!this.me.host && sender && !sender.host && !this.amAdmitted()) return;
    const cur = this.peers.get(msg.from);
    if (cur && msg.sess < cur.session) return; // stale message from an old session
    const p = this.ensurePeer(msg.from, msg.sess);
    const pc = p.pc;
    try {
      if (msg.description) {
        const collision = msg.description.type === "offer" && (p.makingOffer || pc.signalingState !== "stable");
        p.ignoreOffer = !p.polite && collision;
        if (p.ignoreOffer) return;
        await pc.setRemoteDescription(msg.description);
        for (const c of p.pending.splice(0)) await pc.addIceCandidate(c).catch(() => {});
        if (msg.description.type === "offer") {
          await pc.setLocalDescription();
          this.send(msg.from, { description: pc.localDescription?.toJSON() });
        }
      } else if (msg.candidate) {
        if (!pc.remoteDescription) { p.pending.push(msg.candidate); return; }
        try { await pc.addIceCandidate(msg.candidate); } catch (e) { if (!p.ignoreOffer) console.warn("ice", e); }
      }
    } catch (e) { console.warn("signal", e); }
  }

  // ---------- local media ----------
  setMic(on: boolean) {
    this.local.forEach((l) => l.stream.getAudioTracks().forEach((t) => (t.enabled = on)));
    this.state.mic = on; this.publish(); this.emit({ type: "change" });
  }
  setCam(on: boolean) {
    const main = this.local.find((l) => l.label === "Camera 1");
    main?.stream.getVideoTracks().forEach((t) => (t.enabled = on));
    this.state.cam = on; this.publish(); this.emit({ type: "change" });
  }
  setHand(on: boolean) { this.state.hand = on; this.publish(); this.emit({ type: "change" }); }
  get micOn() { return this.state.mic; }
  get camOn() { return this.state.cam; }
  get handUp() { return !!this.state.hand; }
  get localStreams() { return this.local; }

  addLocal(l: LocalStream) {
    this.local.push(l);
    this.peers.forEach((p) => { for (const t of l.stream.getTracks()) p.senders.set(t.id, p.pc.addTrack(t, l.stream)); });
    this.publish(); this.emit({ type: "change" });
  }
  removeLocal(streamId: string) {
    const l = this.local.find((x) => x.stream.id === streamId);
    if (!l) return;
    this.local = this.local.filter((x) => x !== l);
    this.peers.forEach((p) => {
      for (const t of l.stream.getTracks()) { const s = p.senders.get(t.id); if (s) { try { p.pc.removeTrack(s); } catch {} p.senders.delete(t.id); } }
    });
    l.stream.getTracks().forEach((t) => t.stop());
    this.publish(); this.emit({ type: "change" });
  }

  // ---------- host controls ----------
  admit(id: string) { if (!this.me.host) return; this.removed.delete(id); this.admitted.add(id); this.everAdmitted.add(id); this.publish(); this.onPresence(); }
  admitAll() { this.waiting().forEach((m) => this.admitted.add(m.id)); this.publish(); this.onPresence(); }
  control(to: string, action: ControlAction) {
    if (!this.me.host) return;
    if (action === "remove") { this.removed.add(to); this.admitted.delete(to); this.everAdmitted.delete(to); this.closePeer(to); this.publish(); }
    this.channel?.send({ type: "broadcast", event: "control", payload: { from: this.me.id, to, action } });
    this.emit({ type: "change" });
  }

  private onControl(msg: { from: string; to: string; action: ControlAction }) {
    const from = this.members[msg.from];
    if (!from?.host) return; // only hosts may control
    if (msg.to !== this.me.id && msg.to !== "*") return;
    if (msg.to === "*" && this.me.host && msg.action !== "end") return;
    if (msg.action === "mute") this.setMic(false);
    if (msg.action === "camoff") this.setCam(false);
    if (msg.action === "lowerhand") this.setHand(false);
    this.emit({ type: "control", action: msg.action, from: msg.from });
  }

  // ---------- views ----------
  waiting(): Member[] {
    return Object.values(this.members).filter((m) => !m.host && !this.everAdmitted.has(m.id) && !this.removed.has(m.id))
      .sort((a, b) => a.joinedAt - b.joinedAt);
  }

  participants(): Participant[] {
    const list: Participant[] = [];
    const meMember = this.payload();
    list.push({ ...meMember, me: true, admittedNow: true, quality: "good", remoteStreams: this.local.map((l) => ({ id: l.stream.id, label: l.label, stream: l.stream })) });
    if (!this.amAdmitted()) return list;
    for (const m of Object.values(this.members)) {
      if (m.id === this.me.id || !this.everAdmitted.has(m.id)) continue;
      const p = this.peers.get(m.id);
      const remoteStreams: RemoteStream[] = [];
      if (p) {
        for (const [sid, label] of Object.entries(m.streams ?? {})) {
          const s = p.streams.get(sid);
          if (s) remoteStreams.push({ id: sid, label, stream: s });
        }
      }
      list.push({ ...m, me: false, admittedNow: true, quality: p ? p.quality : "connecting", remoteStreams });
    }
    return list.sort((a, b) => (a.host === b.host ? a.joinedAt - b.joinedAt : a.host ? -1 : 1));
  }

  private async pollStats() {
    let changed = false;
    for (const p of this.peers.values()) {
      if (p.pc.connectionState !== "connected") continue;
      try {
        const stats = await p.pc.getStats();
        let rtt: number | undefined;
        stats.forEach((r) => {
          if (r.type === "candidate-pair" && (r as RTCIceCandidatePairStats).nominated && (r as RTCIceCandidatePairStats).state === "succeeded") {
            rtt = (r as RTCIceCandidatePairStats).currentRoundTripTime;
          }
        });
        const q: Quality = rtt === undefined ? "good" : rtt < 0.25 ? "good" : rtt < 0.6 ? "fair" : "poor";
        if (q !== p.quality) { p.quality = q; changed = true; }
      } catch {}
    }
    if (changed) this.emit({ type: "change" });
  }
}
