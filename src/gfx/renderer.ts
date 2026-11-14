import { Battle } from '../battle/battle';
import { Mon } from '../battle/mon';
import { getSprite } from './sprites';
import { buildBackground } from './background';
import { drawText, textWidth } from './font';
import { clamp, Rng } from '../core/util';
import { TILT, Y, X, SPR, sc, SCREEN_WORLD, view } from './world';

const R = Math.round;

function disc(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, ry = r) {
  g.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.floor(r * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))) + 0.5);
    g.fillRect(R(cx) - w, R(cy) + y, w * 2 + 1, 1);
  }
}

export class Renderer {
  buf = document.createElement('canvas');
  g: CanvasRenderingContext2D;
  bg: HTMLCanvasElement;
  time = 0;
  banner: { text: string; sub?: string; t: number; max: number } | null = null;
  k = 4;
  cam = { x: 0, y: 0 };
  manual = 0;               // Sekunden, in denen die Kamera dem Finger gehört
  private drag: { id: number; x: number; y: number } | null = null;

  constructor(public screen: HTMLCanvasElement) {
    this.g = this.buf.getContext('2d')!;
    this.bg = buildBackground();
    this.fit();
    this.cam.x = (SCREEN_WORLD.w - view.w) / 2; this.cam.y = SCREEN_WORLD.h - view.h;
    // Wischen = Kamera verschieben (die Karte ist größer als der Bildschirm)
    screen.addEventListener('pointerdown', (e) => { this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; screen.setPointerCapture(e.pointerId); });
    screen.addEventListener('pointermove', (e) => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const f = (window.devicePixelRatio || 1) / this.k;
      this.cam.x -= (e.clientX - this.drag.x) * f; this.cam.y -= (e.clientY - this.drag.y) * f;
      this.drag.x = e.clientX; this.drag.y = e.clientY; this.manual = 3; this.clampCam();
    });
    const up = (e: PointerEvent) => { if (this.drag && e.pointerId === this.drag.id) this.drag = null; };
    screen.addEventListener('pointerup', up); screen.addEventListener('pointercancel', up);
  }

  clampCam() {
    const mx = SCREEN_WORLD.w - view.w, my = SCREEN_WORLD.h - view.h;
    this.cam.x = mx <= 0 ? mx / 2 : clamp(this.cam.x, 0, mx);
    this.cam.y = my <= 0 ? my / 2 : clamp(this.cam.y, 0, my);
  }

  /** Kamera folgt dem Kampfgeschehen (Mitte zwischen beiden Pokémon), solange der Spieler nicht wischt. */
  follow(b: Battle, dt: number) {
    this.manual = Math.max(0, this.manual - dt);
    if (this.drag || this.manual > 0) return;
    const ms = b.trainers.map((t) => t.active).filter((m): m is Mon => !!m && m.state !== 'benched');
    if (!ms.length) return;
    const mx = ms.reduce((a, m) => a + X(m.x, m.y), 0) / ms.length, my = ms.reduce((a, m) => a + Y(m.y), 0) / ms.length;
    const tx = mx - view.w / 2, ty = my - view.h * 0.46;
    const k = Math.min(1, dt * 3.5);
    this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
    this.clampCam();
  }

  /** Wählt den größten ganzzahligen Pixel-Maßstab und passt das Sichtfenster an das Gerät an. */
  fit() {
    const s = this.screen, dpr = window.devicePixelRatio || 1;
    const W = Math.max(1, Math.round(s.clientWidth * dpr)), H = Math.max(1, Math.round(s.clientHeight * dpr));
    if (s.width !== W || s.height !== H) { s.width = W; s.height = H; }
    const k = Math.max(1, Math.floor(Math.min(W / 210, H / 280)));
    const vw = Math.floor(W / k), vh = Math.floor(H / k);
    if (vw !== view.w || vh !== view.h || k !== this.k || this.buf.width !== vw) {
      this.k = k; view.w = vw; view.h = vh;
      this.buf.width = vw; this.buf.height = vh;
      this.g = this.buf.getContext('2d')!;
      this.clampCam();
    }
  }

  showBanner(text: string, secs = 1.8, sub?: string) { this.banner = { text, sub, t: secs, max: secs }; }

  /** Puffer in ganzzahligem Maßstab auf das Bildschirm-Canvas skalieren (gestochen scharfe Pixel). */
  present() {
    const s = this.screen, ctx = s.getContext('2d')!;
    const W = s.width, H = s.height, k = this.k;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1f5a2a'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(this.buf, 0, 0, view.w * k, view.h * k);
  }

  draw(b: Battle, dt: number, hud = true) {
    this.fit();
    this.follow(b, dt);
    const g = this.g;
    const VW = view.w, VH = view.h;
    this.time += dt;
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#1f5a2a'; g.fillRect(0, 0, VW, VH);
    g.save();
    const sh = b.shake;
    g.translate(-R(this.cam.x) + (sh > 0 ? R((Math.random() - 0.5) * sh * 2) : 0), -R(this.cam.y) + (sh > 0 ? R((Math.random() - 0.5) * sh * 2) : 0));
    g.drawImage(this.bg, 0, 0);

    // Boden-Telegraphs (Ellipsen wegen der Neigung)
    for (const z of b.zones) this.drawZone(X(z.x, z.y), Y(z.y), z.r * sc(z.y), z.done ? 1 : clamp(z.t / z.delay, 0, 1), z.done ? z.fade : -1);
    const mons = this.mons(b);
    for (const m of mons) this.drawTelegraph(g, m);

    // Schatten
    for (const m of mons) if (m.state !== 'faint' || m.t < 0.6) this.shadow(g, m);
    for (const gh of b.ghosts) this.drawGhost(g, gh);

    // y-sortiert: Mons + Projektile
    type D = { y: number; f: () => void };
    const list: D[] = [];
    for (const m of mons) list.push({ y: m.y, f: () => this.drawMon(g, m) });
    for (const p of b.projs) list.push({ y: p.y + 1, f: () => this.drawProj(g, p) });
    list.sort((a, c) => a.y - c.y).forEach((d) => d.f());

    for (const bo of b.bolts) this.drawBolt(g, bo);
    for (const s of b.slashes) this.drawSlash(g, s);
    for (const p of b.parts) {
      g.globalAlpha = clamp(p.life / p.max * 1.4, 0, 1);
      g.fillStyle = p.color; g.fillRect(R(X(p.x, p.y)), R(Y(p.y) - p.z * SPR(p.y)), p.size, p.size);
    }
    g.globalAlpha = 1;
    for (const t of b.texts) {
      g.globalAlpha = clamp(t.life / t.max * 2, 0, 1);
      const tsc = t.big ? 2 : 1;
      drawText(g, t.text, R(X(t.x, t.y) - textWidth(t.text, tsc) / 2), R(Y(t.y) - (t.z + t.rise) * SPR(t.y)), t.color, tsc, '#202028');
    }
    g.globalAlpha = 1;
    g.restore();
    if (b.flashScreen > 0) { g.globalAlpha = clamp(b.flashScreen * 5, 0, 0.7); g.fillStyle = '#fff'; g.fillRect(0, 0, VW, VH); g.globalAlpha = 1; }

    if (hud) this.drawHud(g, b);
    if (this.banner) {
      const bn = this.banner; bn.t -= dt;
      if (bn.t <= 0) this.banner = null;
      else {
        const a = clamp(Math.min(bn.t, bn.max - bn.t) * 4, 0, 1);
        const by = Math.round(VH * 0.38);
        g.globalAlpha = a * 0.78; g.fillStyle = '#14141c'; g.fillRect(0, by, VW, bn.sub ? 38 : 28);
        g.globalAlpha = a; g.fillStyle = '#f8d030'; g.fillRect(0, by, VW, 1); g.fillRect(0, by + (bn.sub ? 37 : 27), VW, 1);
        drawText(g, bn.text, R((VW - textWidth(bn.text, 2)) / 2), by + 8, '#ffffff', 2, '#b82820');
        if (bn.sub) drawText(g, bn.sub, R((VW - textWidth(bn.sub)) / 2), by + 26, '#f8d030');
        g.globalAlpha = 1;
      }
    }
    this.present();
  }

  mons(b: Battle): Mon[] {
    const out: Mon[] = [];
    for (const tr of b.trainers) if (tr.active && tr.active.state !== 'benched') out.push(tr.active);
    return out;
  }

  // ─────────── Sprites ───────────
  frameOf(m: Mon): string {
    if (m.state === 'windup' || (m.state === 'active' && m.move?.kind === 'cone')) return 'atk';
    if (m.state === 'active' || m.state === 'dodge') return 'walk0';
    if (m.moving) return Math.floor(m.walkT / 0.11) % 2 ? 'walk1' : 'walk0';
    return Math.floor(this.time / 0.55 + m.uid) % 2 ? 'idle1' : 'idle0';
  }

  drawMon(g: CanvasRenderingContext2D, m: Mon) {
    const sp = getSprite(m.speciesId);
    const fr = sp.frames[this.frameOf(m)];
    const f = SPR(m.y), sx = X(m.x, m.y), sy = Y(m.y);
    const w = R(sp.w * f), h = R(sp.h * f);
    let x = R(sx - sp.ax * f), y = R(sy - sp.ay * f);
    const bob = m.moving ? -Math.abs(Math.sin(m.walkT * 15)) * 1.4 : Math.sin(this.time * 2.4 + m.uid) * 0.5;
    y += R(bob);
    if (m.state === 'windup') y += 1;
    if (m.state === 'stagger') x += Math.floor(this.time * 40) % 2 ? 1 : -1;
    if (m.state === 'faint') { this.drawFaint(g, m, fr); return; }
    if (m.state === 'summon' || m.state === 'recall') { this.drawBall(g, m, fr, sp); return; }
    g.drawImage(m.face === 1 ? fr.n : fr.f, x, y, w, h);
    // Blitzen: Treffer / Anspannung
    const white = m.flash > 0 || (m.state === 'windup' && Math.floor(m.t * 20) % 3 === 0 && m.move?.armor);
    const wimg = m.face === 1 ? fr.wn : fr.wf;
    if (white) { g.globalAlpha = m.flash > 0 ? 0.9 : 0.55; g.drawImage(wimg, x, y, w, h); g.globalAlpha = 1; }
    if (m.invuln > 0 && m.state === 'dodge') { g.globalAlpha = 0.5; g.drawImage(wimg, x, y, w, h); g.globalAlpha = 1; }
    if (m.para > 0 && Math.floor(this.time * 8) % 5 === 0) { g.globalAlpha = 0.55; g.drawImage(wimg, x, y, w, h); g.globalAlpha = 1; }
  }

  drawFaint(g: CanvasRenderingContext2D, m: Mon, fr: any) {
    const sp = getSprite(m.speciesId);
    const p = clamp(m.t / 0.45, 0, 1);
    g.save();
    g.globalAlpha = clamp(1 - (m.t - 0.55) / 0.6, 0, 1);
    g.translate(R(X(m.x, m.y)), R(Y(m.y)));
    g.scale(SPR(m.y), SPR(m.y));
    g.rotate((m.face === 1 ? -1 : 1) * (Math.PI / 2) * p);
    g.translate(0, p * 2);
    g.drawImage(m.face === 1 ? fr.n : fr.f, -sp.ax, -sp.ay);
    if (m.t < 0.15) { g.globalAlpha = 0.7; g.drawImage(m.face === 1 ? fr.wn : fr.wf, -sp.ax, -sp.ay); }
    g.restore();
  }

  drawBall(g: CanvasRenderingContext2D, m: Mon, fr: any, sp: ReturnType<typeof getSprite>) {
    const summon = m.state === 'summon';
    const p = clamp(summon ? m.t / 0.4 : m.t / 0.35, 0, 1);
    const k = summon ? p : 1 - p;
    const f = SPR(m.y), bx = X(m.x, m.y), by = Y(m.y);
    const w = Math.max(1, R(sp.w * f * (0.15 + 0.85 * k))), h = Math.max(1, R(sp.h * f * (0.15 + 0.85 * k)));
    const dx = R(bx - w / 2), dy = R(by - h);
    g.globalAlpha = 1;
    g.drawImage(m.face === 1 ? fr.wn : fr.wf, dx, dy, w, h);
    if (k < 0.9) { g.globalAlpha = 0.9 * (1 - k); g.fillStyle = summon ? '#fff' : '#ff6060'; g.drawImage(m.face === 1 ? fr.wn : fr.wf, dx - 1, dy - 1, w + 2, h + 2); g.globalAlpha = 1; }
    // Ball-Funken
    const r = (1 - k) * 12 + 2;
    for (let i = 0; i < 6; i++) {
      const a = i * 1.047 + this.time * 6;
      g.fillStyle = i % 2 ? '#ffffff' : (summon ? '#ffe880' : '#ff7060');
      g.fillRect(R(bx + Math.cos(a) * r), R(by - 14 * f + Math.sin(a) * r * 0.8), 2, 2);
    }
  }

  shadow(g: CanvasRenderingContext2D, m: Mon) {
    const f = SPR(m.y), sw = getSprite(m.speciesId).w; const w = m.state === 'summon' || m.state === 'recall' ? 8 : Math.round(sw * 0.7 * f);
    const sx = X(m.x, m.y), sy = Y(m.y);
    g.fillStyle = 'rgba(30,50,30,0.32)';
    g.fillRect(R(sx - w / 2), R(sy - 3), w, 5);
    g.fillRect(R(sx - w / 2 - 2), R(sy - 2), w + 4, 3);
  }

  drawGhost(g: CanvasRenderingContext2D, gh: { x: number; y: number; face: number; t: number; mon: Mon }) {
    const sp = getSprite(gh.mon.speciesId); const fr = sp.frames.walk0;
    g.globalAlpha = clamp(0.5 * (1 - gh.t / 0.18), 0, 1);
    const gf = SPR(gh.y); g.drawImage(gh.face === 1 ? fr.wn : fr.wf, R(X(gh.x, gh.y) - sp.ax * gf), R(Y(gh.y) - sp.ay * gf), R(sp.w * gf), R(sp.h * gf));
    g.globalAlpha = 1;
  }

  // ─────────── Telegraphs ───────────
  drawZone(x: number, y: number, r: number, p: number, fade: number) {
    const g = this.g;
    if (fade >= 0) { g.globalAlpha = clamp(fade * 2, 0, 1) * 0.5; g.fillStyle = '#403820'; disc(g, x, y, r, '#5a4a28', r * TILT); g.globalAlpha = 1; return; }
    const pulse = Math.floor(this.time * 10) % 2;
    g.globalAlpha = 0.18 + 0.3 * p; disc(g, x, y, r, pulse ? '#f8e848' : '#f8d030', r * TILT); g.globalAlpha = 1;
    g.fillStyle = '#fff6a0';
    const n = 36;
    for (let i = 0; i < n; i++) if (i % 2 === 0) { const a = i / n * Math.PI * 2; g.fillRect(R(x + Math.cos(a) * r), R(y + Math.sin(a) * r * TILT), 1, 1); }
    // schrumpfender Ring = Countdown
    g.fillStyle = '#ffffff';
    const rr = r * (1 - p);
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; g.fillRect(R(x + Math.cos(a) * rr), R(y + Math.sin(a) * rr * TILT), 1, 1); }
  }

  drawTelegraph(g: CanvasRenderingContext2D, m: Mon) {
    if (m.state !== 'windup' || !m.move) return;
    const mv = m.move, p = clamp(m.t / mv.windup, 0, 1);
    g.fillStyle = m.side === 1 ? '#ff6050' : '#ffffff';
    g.globalAlpha = 0.35 + 0.4 * p;
    if (mv.kind === 'dash' || mv.kind === 'projectile') {
      const len = mv.kind === 'dash' ? mv.range : Math.min(40, mv.range);
      for (let d = 12; d < len; d += 5) { const wx = m.x + Math.cos(m.aim) * d, wy = m.y + Math.sin(m.aim) * d; g.fillRect(R(X(wx, wy)), R(Y(wy) - 12 * SPR(wy)), 1, 1); }
    } else if (mv.kind === 'melee') {
      for (let a = -mv.arc!; a <= mv.arc!; a += 0.12) { const wx = m.x + Math.cos(m.aim + a) * mv.radius!, wy = m.y + Math.sin(m.aim + a) * mv.radius!; g.fillRect(R(X(wx, wy)), R(Y(wy) - 12 * SPR(wy)), 1, 1); }
    } else if (mv.kind === 'cone') {
      for (const sg of [-1, 1]) for (let d = 8; d < mv.range; d += 4) { const wx = m.x + Math.cos(m.aim + sg * mv.arc!) * d, wy = m.y + Math.sin(m.aim + sg * mv.arc!) * d; g.fillRect(R(X(wx, wy)), R(Y(wy) - 12 * SPR(wy)), 1, 1); }
    }
    g.globalAlpha = 1;
  }

  // ─────────── Projektile & Effekte ───────────
  drawProj(g: CanvasRenderingContext2D, p: { x: number; y: number; move: { type: string }; age: number; r: number }) {
    const f = SPR(p.y), px = X(p.x, p.y), y = Y(p.y) - 14 * f;
    const q = (n: number) => Math.max(1, R(n * f));
    if (p.move.type === 'water') {
      disc(g, px, y, q(5), '#3858c0'); disc(g, px, y, q(4), '#6890f0'); disc(g, px - 1, y - 1, q(2), '#c8e4ff');
    } else if (p.move.type === 'fire') {
      disc(g, px, y, q(5), '#d83818'); disc(g, px, y, q(4), '#f07820'); disc(g, px, y, q(2), '#f8e8a0');
    } else {
      const rn = new Rng(Math.floor(p.age * 22) + 7);
      disc(g, px, y, q(4), '#f8d838'); disc(g, px, y, q(2), '#ffffff');
      g.fillStyle = '#fff6a0';
      for (let i = 0; i < 4; i++) { const a = rn.next() * 6.28, l = (5 + rn.int(0, 3)) * f; g.fillRect(R(px + Math.cos(a) * l), R(y + Math.sin(a) * l), 1, 1); g.fillRect(R(px + Math.cos(a) * (l - 2)), R(y + Math.sin(a) * (l - 2)), 1, 1); }
    }
  }

  drawBolt(g: CanvasRenderingContext2D, b: { x: number; y: number; t: number; seed: number }) {
    const a = clamp(1 - b.t / 0.35, 0, 1);
    const rn = new Rng(Math.floor(b.t * 30) + b.seed);
    const gy = Y(b.y), bx = X(b.x, b.y), f = SPR(b.y);
    let x = bx, y = gy - 260;
    const pts: [number, number][] = [[x, y]];
    while (y < gy) { y += 9; x = bx + (y >= gy ? 0 : rn.range(-9, 9) * f); pts.push([x, Math.min(y, gy)]); }
    g.globalAlpha = a;
    const stroke = (w: number, col: string) => {
      g.fillStyle = col;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
        for (let k = 0; k <= n; k++) g.fillRect(R(x0 + (x1 - x0) * k / n - w / 2), R(y0 + (y1 - y0) * k / n), w, 1);
      }
    };
    stroke(5, '#f8d83888'); stroke(3, '#f8e848'); stroke(1, '#ffffff');
    g.globalAlpha = 1;
  }

  drawSlash(g: CanvasRenderingContext2D, s: { x: number; y: number; z: number; ang: number; t: number; r: number }) {
    const p = clamp(s.t / 0.15, 0, 1);
    g.globalAlpha = clamp(1 - s.t / 0.22, 0, 1);
    for (let row = 0; row < 3; row++) {
      g.fillStyle = row === 1 ? '#ffffff' : '#d8e8ff';
      const rr = s.r * (0.55 + row * 0.18);
      for (let a = -1; a < -1 + 2 * p; a += 0.08) { const wx = s.x + Math.cos(s.ang + a) * rr * 0.9 - Math.cos(s.ang) * 4, wy = s.y + Math.sin(s.ang + a) * rr * 0.9 - Math.sin(s.ang) * 4; g.fillRect(R(X(wx, wy)), R(Y(wy) - s.z * SPR(wy)), 2, 2); }
    }
    g.globalAlpha = 1;
  }

  // ─────────── HUD ───────────
  hpColor(f: number) { return f > 0.5 ? '#48d048' : f > 0.2 ? '#f8c828' : '#e83830'; }

  box(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, m: Mon, b: Battle, side: 0 | 1) {
    g.fillStyle = '#242a38'; g.fillRect(x, y, w, h);
    g.fillStyle = '#e8e0c0'; g.fillRect(x + 1, y, w - 2, 1); g.fillRect(x + 1, y + h - 1, w - 2, 1); g.fillRect(x, y + 1, 1, h - 2); g.fillRect(x + w - 1, y + 1, 1, h - 2);
    g.fillStyle = '#4a5878'; g.fillRect(x + 2, y + 2, w - 4, 1);
    drawText(g, m.sp.name, x + 4, y + 5, '#fff');
    const lv = 'LV' + m.level; drawText(g, lv, x + w - 4 - textWidth(lv), y + 5, '#c8d0e8');
    // KP-Balken
    const bx = x + 14, bw = w - 18, by = y + 13;
    drawText(g, 'KP', x + 4, by - 1, '#f8c828');
    g.fillStyle = '#10141c'; g.fillRect(bx - 1, by - 1, bw + 2, 5);
    g.fillStyle = '#6a2020'; g.fillRect(bx, by, R(bw * clamp(m.lagHp / m.maxHp, 0, 1)), 3);
    g.fillStyle = this.hpColor(m.hpFrac); g.fillRect(bx, by, R(bw * clamp(m.hpFrac, 0, 1)), 3);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(bx, by, R(bw * clamp(m.hpFrac, 0, 1)), 1);
    // Status
    let sx = x + 4; const sy = y + 20;
    const tag = (txt: string, col: string) => { g.fillStyle = col; g.fillRect(sx - 1, sy - 1, textWidth(txt) + 2, 7); drawText(g, txt, sx, sy, '#fff'); sx += textWidth(txt) + 4; };
    if (m.burn > 0) tag('BRT', '#c04818');
    if (m.para > 0) tag('PAR', '#b09818');
    // Team-Kugeln
    const tr = b.trainers[side];
    let px = x + w - 4 - tr.team.length * 6;
    for (const tm of tr.team) {
      g.fillStyle = '#10141c'; g.fillRect(px, y + 20, 5, 5);
      g.fillStyle = !tm.alive ? '#505058' : tm === m ? '#f8d030' : '#e84838'; g.fillRect(px + 1, y + 21, 3, 3);
      px += 6;
    }
    if (side === 0) {
      // Spezial-Ladebalken
      const sp = m.special;
      if (sp) {
        const f = 1 - clamp(m.cd[sp.id] / sp.cooldown, 0, 1);
        g.fillStyle = '#10141c'; g.fillRect(bx - 1, y + 25, bw + 2, 3);
        g.fillStyle = f >= 1 ? '#f8e848' : '#6070a8'; g.fillRect(bx, y + 26, R(bw * f), 1);
      }
    }
  }

  drawHud(g: CanvasRenderingContext2D, b: Battle) {
    const e = b.trainers[1], p = b.trainers[0];
    const em = e.active ?? e.team.find((m) => m.alive) ?? e.team[0];
    const pm = p.active ?? p.team.find((m) => m.alive) ?? p.team[0];
    const VW = view.w, VH = view.h;
    this.box(g, 3, 3, 88, 27, em, b, 1);
    this.box(g, VW - 91, VH - 31, 88, 29, pm, b, 0);
    if (b.choosing) {
      const by = Math.round(VH * 0.38);
      g.fillStyle = 'rgba(10,10,20,.6)'; g.fillRect(0, by, VW, 30);
      const t1 = 'WÄHLE DEIN NÄCHSTES', t2 = 'POKEMON';
      drawText(g, t1, R((VW - textWidth(t1)) / 2), by + 8, '#f8d030', 1, '#000');
      drawText(g, t2, R((VW - textWidth(t2)) / 2), by + 18, '#fff', 1, '#000');
    }
  }
}
