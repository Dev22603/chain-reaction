// sound.jsx — three swappable sound packs with WebAudio synthesis.
// Exposed globally for game.jsx to consume.

(function () {
  const state = { ctx: null, master: null, muted: false, pack: "reactor" };

  function ensureContext() {
    if (typeof window === "undefined") return null;
    if (!state.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = state.muted ? 0 : 0.55;
      master.connect(ctx.destination);
      state.ctx = ctx;
      state.master = master;
    }
    return { ctx: state.ctx, master: state.master };
  }

  function env(gain, now, a, d, peak) {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + a);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + a + d);
  }

  function noiseBuffer(ctx, dur, decay = 2.5) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / d.length;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
    return buf;
  }

  // ─── Pack "reactor" (default) — physical, weighty ────────────────────
  const reactor = {
    place(ctx, m, i) {
      const now = ctx.currentTime;
      // Hollow click
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 2400;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(620 + i * 80, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.14);
      env(g, now, 0.004, 0.18, 0.38);
      osc.connect(f).connect(g).connect(m);
      osc.start(now); osc.stop(now + 0.22);

      // Soft thump under
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = "sine";
      o2.frequency.setValueAtTime(110, now);
      o2.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      env(g2, now, 0.003, 0.12, 0.32);
      o2.connect(g2).connect(m);
      o2.start(now); o2.stop(now + 0.16);
    },
    explode(ctx, m, i) {
      const now = ctx.currentTime;
      // Deep boom
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(160 + i * 20, now);
      o.frequency.exponentialRampToValueAtTime(36, now + 0.35);
      env(g, now, 0.004, 0.45, 0.6 + i * 0.15);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.5);

      // Crackle
      const nb = ctx.createBufferSource();
      nb.buffer = noiseBuffer(ctx, 0.45, 2.0);
      const nf = ctx.createBiquadFilter();
      nf.type = "highpass"; nf.frequency.value = 900;
      const ng = ctx.createGain();
      env(ng, now, 0.003, 0.42, 0.5);
      nb.connect(nf).connect(ng).connect(m);
      nb.start(now); nb.stop(now + 0.5);

      // High shimmer ping
      const o3 = ctx.createOscillator();
      const g3 = ctx.createGain();
      o3.type = "sine";
      o3.frequency.setValueAtTime(1800, now);
      o3.frequency.exponentialRampToValueAtTime(800, now + 0.3);
      env(g3, now, 0.002, 0.28, 0.18);
      o3.connect(g3).connect(m);
      o3.start(now); o3.stop(now + 0.32);
    },
    chain(ctx, m, i) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = "bandpass"; f.Q.value = 8;
      o.type = "sawtooth";
      o.frequency.setValueAtTime(180, now);
      o.frequency.exponentialRampToValueAtTime(1200 + i * 600, now + 0.4);
      f.frequency.setValueAtTime(300, now);
      f.frequency.exponentialRampToValueAtTime(3200, now + 0.4);
      env(g, now, 0.005, 0.4, 0.22);
      o.connect(f).connect(g).connect(m);
      o.start(now); o.stop(now + 0.45);
    },
    win(ctx, m) {
      const now = ctx.currentTime;
      [220, 277.18, 329.63, 440, 554.37, 659.25].forEach((freq, idx) => {
        const t = now + idx * 0.09;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(freq, t);
        env(g, t, 0.008, 0.5, 0.32);
        o.connect(g).connect(m);
        o.start(t); o.stop(t + 0.55);
      });
    },
    click(ctx, m) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(1500, now);
      o.frequency.exponentialRampToValueAtTime(700, now + 0.03);
      env(g, now, 0.001, 0.04, 0.1);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.05);
    },
    turn(ctx, m) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, now);
      o.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      env(g, now, 0.005, 0.14, 0.16);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.18);
    },
    error(ctx, m) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(220, now);
      o.frequency.linearRampToValueAtTime(110, now + 0.18);
      env(g, now, 0.005, 0.22, 0.25);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.25);
    },
  };

  // ─── Pack "arcade" — chiptune, bright ────────────────────────────────
  const arcade = {
    place(ctx, m, i) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(440 + i * 100, now);
      o.frequency.linearRampToValueAtTime(880, now + 0.06);
      env(g, now, 0.002, 0.08, 0.22);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.1);
    },
    explode(ctx, m, i) {
      const now = ctx.currentTime;
      // Pew-pew style descending square
      const steps = [880, 660, 440, 220, 110];
      steps.forEach((f, idx) => {
        const t = now + idx * 0.04;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.setValueAtTime(f, t);
        env(g, t, 0.001, 0.08, 0.3);
        o.connect(g).connect(m);
        o.start(t); o.stop(t + 0.1);
      });
      // Crunchy noise
      const nb = ctx.createBufferSource();
      nb.buffer = noiseBuffer(ctx, 0.25, 1.5);
      const ng = ctx.createGain();
      env(ng, now, 0.002, 0.22, 0.35);
      nb.connect(ng).connect(m);
      nb.start(now); nb.stop(now + 0.28);
    },
    chain(ctx, m, i) {
      const now = ctx.currentTime;
      // Rising arpeggio
      const base = 220;
      const ratios = [1, 1.25, 1.5, 2, 2.5];
      ratios.forEach((r, idx) => {
        const t = now + idx * 0.05;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.setValueAtTime(base * r * (1 + i * 0.5), t);
        env(g, t, 0.001, 0.09, 0.2);
        o.connect(g).connect(m);
        o.start(t); o.stop(t + 0.1);
      });
    },
    win(ctx, m) {
      const now = ctx.currentTime;
      const melody = [523, 659, 784, 1047, 784, 1047, 1319];
      melody.forEach((f, idx) => {
        const t = now + idx * 0.11;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.setValueAtTime(f, t);
        env(g, t, 0.003, 0.18, 0.22);
        o.connect(g).connect(m);
        o.start(t); o.stop(t + 0.2);
      });
    },
    click(ctx, m) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(2000, now);
      env(g, now, 0.001, 0.03, 0.08);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.04);
    },
    turn(ctx, m) {
      const now = ctx.currentTime;
      [523, 784].forEach((f, idx) => {
        const t = now + idx * 0.06;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.setValueAtTime(f, t);
        env(g, t, 0.002, 0.08, 0.16);
        o.connect(g).connect(m);
        o.start(t); o.stop(t + 0.1);
      });
    },
    error(ctx, m) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(110, now);
      env(g, now, 0.002, 0.14, 0.22);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.18);
    },
  };

  // ─── Pack "lab" — clean, tonal, minimal ──────────────────────────────
  const lab = {
    place(ctx, m, i) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(660 + i * 50, now);
      env(g, now, 0.002, 0.12, 0.28);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.15);
    },
    explode(ctx, m, i) {
      const now = ctx.currentTime;
      // Single fat sine swell + filtered noise wash
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(220, now);
      o.frequency.exponentialRampToValueAtTime(55, now + 0.4);
      env(g, now, 0.005, 0.4, 0.45 + i * 0.1);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.45);

      const nb = ctx.createBufferSource();
      nb.buffer = noiseBuffer(ctx, 0.35, 3);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 1200;
      const ng = ctx.createGain();
      env(ng, now, 0.003, 0.32, 0.22);
      nb.connect(f).connect(ng).connect(m);
      nb.start(now); nb.stop(now + 0.35);
    },
    chain(ctx, m, i) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(330, now);
      o.frequency.exponentialRampToValueAtTime(1320 + i * 200, now + 0.35);
      env(g, now, 0.005, 0.35, 0.2);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.4);
    },
    win(ctx, m) {
      const now = ctx.currentTime;
      // C major chord
      [261.63, 329.63, 392, 523.25].forEach((f, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, now);
        env(g, now + idx * 0.04, 0.02, 1.2, 0.18);
        o.connect(g).connect(m);
        o.start(now); o.stop(now + 1.4);
      });
    },
    click(ctx, m) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(1200, now);
      env(g, now, 0.001, 0.04, 0.08);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.05);
    },
    turn(ctx, m) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, now);
      env(g, now, 0.005, 0.16, 0.14);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.18);
    },
    error(ctx, m) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(180, now);
      env(g, now, 0.005, 0.2, 0.22);
      o.connect(g).connect(m);
      o.start(now); o.stop(now + 0.22);
    },
  };

  const packs = { reactor, arcade, lab };

  window.ChainSound = {
    setPack(name) {
      if (packs[name]) state.pack = name;
    },
    setMuted(muted) {
      state.muted = !!muted;
      if (state.master) state.master.gain.value = muted ? 0 : 0.55;
    },
    isMuted() {
      return state.muted;
    },
    async resume() {
      const h = ensureContext();
      if (h && h.ctx.state === "suspended") await h.ctx.resume();
    },
    play(name, opts) {
      const h = ensureContext();
      if (!h) return;
      const { ctx, master } = h;
      if (state.muted) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const pack = packs[state.pack] || reactor;
      const fn = pack[name];
      if (!fn) return;
      try { fn(ctx, master, opts?.intensity ?? 0); } catch (e) { /* ignore */ }
    },
  };
})();
