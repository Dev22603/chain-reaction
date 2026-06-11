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

// All sounds aim for a soft, bouncy arcade feel: sine/triangle voices,
// short envelopes, no harsh square or sawtooth buzz.

function placeSound(ctx: AudioContext, master: GainNode, intensity: number) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(400 + intensity * 60, now);
  osc.frequency.exponentialRampToValueAtTime(800 + intensity * 120, now + 0.06);
  envelope(gain, now, 0.004, 0.08, 0.35);

  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.12);
}

function explodeSound(ctx: AudioContext, master: GainNode, intensity: number) {
  const now = ctx.currentTime;

  // Bubble pop body: quick sine drop
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600 + intensity * 80, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);
  envelope(gain, now, 0.004, 0.22, 0.45 + intensity * 0.08);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.3);

  // Soft, lowpassed pop of air
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 900;
  const noiseGain = ctx.createGain();
  envelope(noiseGain, now, 0.002, 0.1, 0.22);
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  noise.start(now);
  noise.stop(now + 0.15);
}

function chainSound(ctx: AudioContext, master: GainNode, intensity: number) {
  const now = ctx.currentTime;
  // Ascending pentatonic plinks; bigger chains climb further up the scale
  const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
  const start = Math.min(Math.floor(intensity), scale.length - 3);
  const notes = scale.slice(start, start + 3);

  notes.forEach((freq, idx) => {
    const t = now + idx * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    envelope(gain, t, 0.004, 0.12, 0.22);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 0.18);
  });
}

function winSound(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;
  // Bright C major arpeggio with a sparkle layer one octave up
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    const t = now + idx * 0.13;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    envelope(gain, t, 0.01, 0.4, 0.3);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 0.45);

    const sparkle = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkle.type = "sine";
    sparkle.frequency.setValueAtTime(freq * 2, t + 0.03);
    envelope(sparkleGain, t + 0.03, 0.008, 0.2, 0.12);
    sparkle.connect(sparkleGain).connect(master);
    sparkle.start(t + 0.03);
    sparkle.stop(t + 0.28);
  });
}

function clickSound(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(900, now);
  envelope(gain, now, 0.001, 0.03, 0.16);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.04);
}

function turnSound(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;
  // Friendly two-note ding-dong
  [660, 880].forEach((freq, idx) => {
    const t = now + idx * 0.11;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    envelope(gain, t, 0.005, 0.14, 0.16);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 0.18);
  });
}

function errorSound(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;
  // Gentle cartoon "womp", no buzz
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(200, now + 0.2);
  envelope(gain, now, 0.008, 0.24, 0.24);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.28);
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
