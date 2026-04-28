export type SoundName = "place" | "explode" | "chain" | "win" | "click" | "turn" | "error";

interface SoundEngine {
  play: (name: SoundName, options?: { intensity?: number }) => void;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
  resume: () => Promise<void>;
}

interface InternalState {
  ctx: AudioContext | null;
  master: GainNode | null;
  muted: boolean;
}

const state: InternalState = {
  ctx: null,
  master: null,
  muted: false
};

const STORAGE_KEY = "chain-reaction:muted";

function ensureContext(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === "undefined") return null;

  if (!state.ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;

    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = state.muted ? 0 : 0.55;
    master.connect(ctx.destination);
    state.ctx = ctx;
    state.master = master;
  }

  return { ctx: state.ctx, master: state.master! };
}

function envelope(gain: GainNode, now: number, attack: number, decay: number, peak: number) {
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
}

function placeSound(ctx: AudioContext, master: GainNode, intensity: number) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;

  osc.type = "triangle";
  osc.frequency.setValueAtTime(560 + intensity * 80, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
  envelope(gain, now, 0.005, 0.18, 0.35);

  osc.connect(filter).connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.25);
}

function explodeSound(ctx: AudioContext, master: GainNode, intensity: number) {
  const now = ctx.currentTime;

  const lowOsc = ctx.createOscillator();
  const lowGain = ctx.createGain();
  lowOsc.type = "sawtooth";
  lowOsc.frequency.setValueAtTime(180, now);
  lowOsc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
  envelope(lowGain, now, 0.005, 0.4, 0.55 + intensity * 0.1);
  lowOsc.connect(lowGain).connect(master);
  lowOsc.start(now);
  lowOsc.stop(now + 0.5);

  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.45, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.5);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 1200;
  const noiseGain = ctx.createGain();
  envelope(noiseGain, now, 0.003, 0.35, 0.4);
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  noise.start(now);
  noise.stop(now + 0.5);
}

function chainSound(ctx: AudioContext, master: GainNode, intensity: number) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 6;

  osc.type = "square";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(880 + intensity * 220, now + 0.4);
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(2400, now + 0.4);
  envelope(gain, now, 0.01, 0.45, 0.18);

  osc.connect(filter).connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.5);
}

function winSound(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25, 880];
  notes.forEach((freq, idx) => {
    const t = now + idx * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    envelope(gain, t, 0.01, 0.45, 0.32);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 0.5);
  });
}

function clickSound(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);
  envelope(gain, now, 0.001, 0.05, 0.12);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.06);
}

function turnSound(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  envelope(gain, now, 0.005, 0.12, 0.18);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.15);
}

function errorSound(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.linearRampToValueAtTime(110, now + 0.18);
  envelope(gain, now, 0.005, 0.22, 0.28);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.25);
}

export function createSoundEngine(): SoundEngine {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") state.muted = true;
  }

  return {
    play(name, options) {
      const handle = ensureContext();
      if (!handle) return;
      const { ctx, master } = handle;
      if (state.muted) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const intensity = options?.intensity ?? 0;
      switch (name) {
        case "place":
          placeSound(ctx, master, intensity);
          break;
        case "explode":
          explodeSound(ctx, master, intensity);
          break;
        case "chain":
          chainSound(ctx, master, intensity);
          break;
        case "win":
          winSound(ctx, master);
          break;
        case "click":
          clickSound(ctx, master);
          break;
        case "turn":
          turnSound(ctx, master);
          break;
        case "error":
          errorSound(ctx, master);
          break;
      }
    },
    setMuted(muted) {
      state.muted = muted;
      if (state.master) {
        state.master.gain.value = muted ? 0 : 0.55;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
      }
    },
    isMuted() {
      return state.muted;
    },
    async resume() {
      const handle = ensureContext();
      if (handle && handle.ctx.state === "suspended") {
        await handle.ctx.resume();
      }
    }
  };
}
