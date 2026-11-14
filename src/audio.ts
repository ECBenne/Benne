import type { BattleEvent } from './battle/battle';

/** Winziger Synthesizer für Chiptune-SFX + Mini-Musik – keine Audiodateien nötig. */
export class Sfx {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;
  private noiseBuf: AudioBuffer | null = null;
  private musicOn = false;
  private musicT = 0;
  private step = 0;

  /** Muss aus einer Nutzer-Geste heraus aufgerufen werden (iOS/Android). */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx!.createGain(); this.master!.gain.value = this.muted ? 0 : 0.5; this.master!.connect(this.ctx!.destination);
        const len = this.ctx!.sampleRate * 0.6;
        this.noiseBuf = this.ctx!.createBuffer(1, len, this.ctx!.sampleRate);
        const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx!.state === 'suspended') this.ctx!.resume();
    } catch { /* kein Audio – egal */ }
  }
  setMuted(m: boolean) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.5; }

  private tone(f: number, dur: number, type: OscillatorType = 'square', vol = 0.15, slide = 0, delay = 0) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  private noise(dur: number, vol = 0.2, hp = 800, delay = 0) {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hp; f.Q.value = 0.8;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.02);
  }

  ui() { this.tone(880, 0.06, 'square', 0.1); this.tone(1320, 0.07, 'square', 0.08, 0, 0.05); }
  back() { this.tone(520, 0.08, 'square', 0.1, -120); }

  handle(e: BattleEvent, mine: boolean) {
    switch (e.type) {
      case 'shoot':
        if (e.move.type === 'fire') { this.noise(0.22, 0.18, 500); this.tone(220, 0.18, 'sawtooth', 0.07, -100); }
        else { this.tone(1400, 0.14, 'square', 0.09, -900); this.noise(0.08, 0.1, 3000); }
        break;
      case 'hit':
        this.noise(0.12, e.eff > 1 ? 0.35 : 0.25, 700); this.tone(e.eff > 1 ? 150 : 110, 0.13, 'square', 0.18, -60);
        if (mine && e.mon.side === 0 && navigator.vibrate) { try { navigator.vibrate(e.eff > 1 ? 30 : 15); } catch { /* */ } }
        break;
      case 'slash': this.noise(0.12, 0.2, 2500); break;
      case 'dash': this.noise(0.18, 0.15, 1200); this.tone(500, 0.16, 'triangle', 0.08, 700); break;
      case 'thunder': this.noise(0.55, 0.4, 300); this.tone(90, 0.5, 'sawtooth', 0.2, -50); this.tone(2200, 0.1, 'square', 0.08, -1500); break;
      case 'flame': this.noise(0.9, 0.2, 900); this.tone(130, 0.9, 'sawtooth', 0.06, 60); break;
      case 'dodge': this.noise(0.1, 0.1, 2000); break;
      case 'faint': this.tone(440, 0.5, 'square', 0.14, -380); this.tone(330, 0.5, 'square', 0.1, -280, 0.12); break;
      case 'switch': this.tone(520, 0.08, 'square', 0.1); this.tone(780, 0.1, 'square', 0.1, 0, 0.08); this.tone(1040, 0.14, 'square', 0.1, 0, 0.16); break;
      case 'heal': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.12, 0, i * 0.07)); break;
      case 'status': this.tone(300, 0.2, 'sawtooth', 0.08, 80); break;
      case 'cmd': this.tone(660, 0.1, 'square', 0.12); this.tone(990, 0.16, 'square', 0.12, 0, 0.09); break;
    }
  }

  jingle(win: boolean) {
    const notes = win ? [523, 659, 784, 1046, 784, 1046] : [392, 349, 311, 262];
    notes.forEach((f, i) => this.tone(f, 0.18, 'square', 0.12, 0, i * 0.14));
  }

  // ── Mini-Musik (Pentatonik-Loop, leise) ──
  startMusic() { this.musicOn = true; }
  stopMusic() { this.musicOn = false; }
  tick(dt: number) {
    if (!this.musicOn || !this.ctx || this.muted) return;
    this.musicT -= dt;
    if (this.musicT > 0) return;
    this.musicT = 0.2;
    const bass = [110, 110, 165, 110, 147, 147, 165, 196];
    const lead = [0, 392, 0, 440, 523, 0, 440, 0, 0, 392, 330, 0, 392, 0, 523, 0, 587, 0, 523, 0, 440, 0, 392, 0, 330, 0, 0, 0, 392, 0, 0, 0];
    const s = this.step++;
    if (s % 2 === 0) this.tone(bass[(s >> 1) % bass.length], 0.28, 'triangle', 0.09);
    const l = lead[s % lead.length];
    if (l) this.tone(l, 0.16, 'square', 0.035);
    if (s % 4 === 2) this.noise(0.05, 0.05, 6000);
  }
}
export const sfx = new Sfx();
