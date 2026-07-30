// =====================================================================
//  Soundeffekte — synthetisiert per Web Audio API, keine Audiodateien nötig
// =====================================================================
'use strict';

const SFX = (() => {
  let ctx = null;
  let enabled = true;
  let volume = 0.5;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Kurzer Ton mit exponentiellem Fade-out; slide lässt die Tonhöhe gleiten
  function tone(freq, dur, opts) {
    if (!enabled || volume <= 0) return;
    const c = ensureCtx();
    if (!c) return;
    try {
      const t0 = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = (opts && opts.type) || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (opts && opts.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.slide), t0 + dur);
      const peak = Math.max(0.0002, volume * (opts && opts.gain != null ? opts.gain : 0.2));
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    } catch (e) { /* Audio in diesem Browser nicht verfügbar */ }
  }

  function sequence(notes) {
    if (!enabled || volume <= 0) return;
    for (const n of notes) setTimeout(() => tone(n.freq, n.dur, n), (n.delay || 0) * 1000);
  }

  return {
    setEnabled(v) { enabled = !!v; },
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); },
    isEnabled() { return enabled; },
    getVolume() { return volume; },

    hit() { tone(180, 0.08, { type: 'square', slide: 70, gain: 0.22 }); },
    hurt() { tone(120, 0.15, { type: 'sawtooth', slide: 50, gain: 0.25 }); },
    pickup() { tone(660, 0.09, { type: 'sine', slide: 990, gain: 0.15 }); },
    click() { tone(440, 0.04, { type: 'square', gain: 0.12 }); },
    jump() { tone(300, 0.09, { type: 'sine', slide: 520, gain: 0.14 }); },
    skill() { tone(220, 0.18, { type: 'sawtooth', slide: 660, gain: 0.2 }); },
    conqueror() { tone(80, 0.5, { type: 'sawtooth', slide: 40, gain: 0.28 }); },
    levelup() {
      sequence([
        { freq: 523, dur: 0.1, delay: 0, type: 'square', gain: 0.2 },
        { freq: 659, dur: 0.1, delay: 0.1, type: 'square', gain: 0.2 },
        { freq: 784, dur: 0.2, delay: 0.2, type: 'square', gain: 0.24 },
      ]);
    },
    bossDefeat() {
      sequence([
        { freq: 392, dur: 0.12, delay: 0, type: 'square', gain: 0.22 },
        { freq: 494, dur: 0.12, delay: 0.12, type: 'square', gain: 0.22 },
        { freq: 587, dur: 0.12, delay: 0.24, type: 'square', gain: 0.22 },
        { freq: 784, dur: 0.32, delay: 0.36, type: 'square', gain: 0.26 },
      ]);
    },
  };
})();
