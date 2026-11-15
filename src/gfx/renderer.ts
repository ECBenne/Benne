import { Battle, Impact, PICKUP_INFO, ARENA } from '../battle/battle';
import { Mon } from '../battle/mon';
import { getSprite } from './sprites';
import { dirFromAngle, dirCenterDeg } from './spriteBuilder';
import { buildBackground, rockSprite } from './background';
import { MAPS } from '../data/maps';
import { TYPE_FX, TypeId } from '../data/types';
import { drawText, textWidth } from './font';
import { clamp, Rng } from '../core/util';
import { TILT, Y, X, SPR, sc, SCREEN_WORLD, view, unproject } from './world';

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
  showMap = true;
  private curT = 0; private foeName = '';
  private press: { id: number; x: number; y: number; t: number; fired: boolean } | null = null;
  taps: { x: number; y: number; t: number }[] = [];             // Tipp-Wellen zur Rückmeldung
  onTap: ((wx: number, wy: number, sx: number, sy: number) => void) | null = null;       // kurzes Tippen aufs Spielfeld (Boden- und Bildkoordinaten)
  onSwipe: ((dx: number, dy: number) => void) | null = null;
  onHold: ((sx: number, sy: number) => void) | null = null;      // langes Drücken (ohne Bewegung)     // schneller Wisch (Bildschirmrichtung)

  constructor(public screen: HTMLCanvasElement) {
    this.g = this.buf.getContext('2d')!;
    this.bg = this.bgFor('meadow');
    this.fit();
    this.cam.x = (SCREEN_WORLD.w - view.w) / 2; this.cam.y = SCREEN_WORLD.h - view.h;
    // Touch im Kampf: kurzes Tippen = Befehl, schneller Wisch = Hechtrolle. Die Kamera folgt automatisch (kein Verschieben per Finger).
    screen.style.touchAction = 'none';
    screen.addEventListener('pointerdown', (e) => {
      const pr = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), fired: false }; this.press = pr; screen.setPointerCapture(e.pointerId);
      window.setTimeout(() => { if (this.press === pr && !pr.fired) { pr.fired = true; const q = this.toScreenWorld(pr.x, pr.y); this.onHold?.(q.x, q.y); } }, 380);
    });
    screen.addEventListener('pointermove', (e) => {
      const p = this.press; if (!p || p.id !== e.pointerId || p.fired) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (Math.hypot(dx, dy) >= 24 && performance.now() - p.t < 700) { p.fired = true; this.onSwipe?.(dx, dy); }   // sofort auslösen, nicht erst beim Loslassen
    });
    const up = (e: PointerEvent) => {
      const p = this.press; if (!p || p.id !== e.pointerId) return; this.press = null;
      if (e.type !== 'pointerup' || p.fired) return;
      if (performance.now() - p.t < 900 && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 24) { const q = this.toScreenWorld(e.clientX, e.clientY), w = unproject(q.x, q.y); this.taps.push({ x: w.x, y: w.y, t: 0 }); this.onTap?.(w.x, w.y, q.x, q.y); }
    };
    screen.addEventListener('pointerup', up); screen.addEventListener('pointercancel', up);
  }

  /** Bildschirmpunkt (CSS-Pixel) -> Bodenebene */
  toScreenWorld(cx: number, cy: number) {
    const rect = this.screen.getBoundingClientRect(), f = (window.devicePixelRatio || 1) / this.k;
    return { x: (cx - rect.left) * f + this.cam.x, y: (cy - rect.top) * f + this.cam.y };
  }
  /** Bildschirmposition (CSS-Pixel) eines Bodenpunkts – für Tests */
  clientAt(wx: number, wy: number) { const rect = this.screen.getBoundingClientRect(), f = this.k / (window.devicePixelRatio || 1); return { x: rect.left + (X(wx, wy) - this.cam.x) * f, y: rect.top + (Y(wy) - this.cam.y) * f }; }
  /** Bildschirmposition (CSS-Pixel) eines Monsters – für Tests */
  clientPos(m: Mon) { const rect = this.screen.getBoundingClientRect(), f = this.k / (window.devicePixelRatio || 1); return { x: rect.left + (X(m.x, m.y) - this.cam.x) * f, y: rect.top + (Y(m.y) - m.sp.height * SPR(m.y) * 0.5 - this.cam.y) * f }; }
  /** Monster unter dem Finger (Bildkoordinaten der Welt), großzügig für Finger */
  monAt(b: Battle, sx: number, sy: number): Mon | null {
    let best: Mon | null = null, bd = 1e9;
    for (const tr of b.trainers) {
      const m = tr.active; if (!m || !m.alive || m.state === 'benched' || m.state === 'faint') continue;
      const d = Math.hypot(sx - X(m.x, m.y), sy - (Y(m.y) - m.sp.height * SPR(m.y) * 0.5)), lim = Math.max(26, m.sp.height * SPR(m.y) * 0.62);
      if (d < lim && d < bd) { bd = d; best = m; }
    }
    return best;
  }

  clampCam() {
    const mx = SCREEN_WORLD.w - view.w, my = SCREEN_WORLD.h - view.h;
    this.cam.x = mx <= 0 ? mx / 2 : clamp(this.cam.x, 0, mx);
    this.cam.y = my <= 0 ? my / 2 : clamp(this.cam.y, 0, my);
  }

  /** Kamera folgt dem Kampfgeschehen (Mitte zwischen beiden Monster), solange der Spieler nicht wischt. */
  follow(b: Battle, dt: number) {
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
    const k = Math.max(1, Math.floor(Math.min(W / 210, H / 190)));
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
    this.time += dt; this.curT = b.t; this.foeName = (b.trainers[1].name || 'GEGNER').toUpperCase().slice(0, 16);
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#1f5a2a'; g.fillRect(0, 0, VW, VH);
    g.save();
    const sh = b.shake;
    g.translate(-R(this.cam.x) + (sh > 0 ? R((Math.random() - 0.5) * sh * 2) : 0), -R(this.cam.y) + (sh > 0 ? R((Math.random() - 0.5) * sh * 2) : 0));
    g.drawImage(this.bgFor(b.map.id), 0, 0);

    // Boden-Telegraphs (Ellipsen wegen der Neigung)
    for (const z of b.zones) this.drawZone(X(z.x, z.y), Y(z.y), z.r * sc(z.y), z.done ? 1 : clamp(z.t / z.delay, 0, 1), z.done ? z.fade : -1, z.move.type);
    for (const hz of b.hazards) if (hz.t >= 0) this.drawHazard(g, hz);
    this.drawOrder(g, b);
    this.drawTaps(g, dt);
    for (const pk of b.pickups) this.drawPickup(g, pk);
    for (const im of b.impacts) if (im.kind === 'scorch' || im.kind === 'groundring') this.drawImpact(g, im);
    const mons = this.mons(b);
    for (const m of mons) this.drawTelegraph(g, m);
    for (const m of mons) this.drawThreat(g, m);

    // Schatten
    for (const m of mons) if ((m.state !== 'faint' || m.t < 0.6) && m.terrain !== 'water' && m.terrain !== 'lava') this.shadow(g, m);
    for (const gh of b.ghosts) this.drawGhost(g, gh);

    // y-sortiert: Mons + Projektile
    type D = { y: number; f: () => void };
    const list: D[] = [];
    for (const m of mons) list.push({ y: m.y, f: () => this.drawMon(g, m) });
    for (const p of b.projs) list.push({ y: p.y + 1, f: () => this.drawProj(g, p) });
    const rs = this.rockCache.get(b.map.id) ?? [];
    b.rocks.forEach((f, i) => { const rk = rs[i]; if (!rk) return; list.push({ y: f.y, f: () => { g.globalAlpha = 0.25; disc(g, X(f.x, f.y) + 3, Y(f.y) + 2, R(f.r * sc(f.y) * 1.15), '#102010', R(f.r * sc(f.y) * 0.5)); g.globalAlpha = 1; g.drawImage(rk.c, R(X(f.x, f.y) - rk.ax), R(Y(f.y) - rk.ay)); } }); });
    list.sort((a, c) => a.y - c.y).forEach((d) => d.f());

    for (const im of b.impacts) if (im.kind !== 'scorch' && im.kind !== 'groundring') this.drawImpact(g, im);
    for (const bo of b.bolts) this.drawBolt(g, bo);
    for (const s of b.slashes) this.drawSlash(g, s);
    for (const p of b.parts) {
      g.globalAlpha = clamp(p.life / p.max * 1.4, 0, 1);
      const ps = p.size + (p.grow ?? 0) * (1 - p.life / p.max);
      if (ps >= 4) disc(g, X(p.x, p.y), Y(p.y) - p.z, Math.round(ps / 2), p.color); else { g.fillStyle = p.color; g.fillRect(R(X(p.x, p.y)), R(Y(p.y) - p.z), p.size, p.size); }
    }
    g.globalAlpha = 1;
    for (const t of b.texts) {
      g.globalAlpha = clamp(t.life / t.max * 2, 0, 1);
      const tsc = t.big ? 2 : 1;
      drawText(g, t.text, R(X(t.x, t.y) - textWidth(t.text, tsc) / 2), R(Y(t.y) - (t.z + t.rise)), t.color, tsc, '#202028');
    }
    g.globalAlpha = 1;
    g.restore();
    this.drawWeather(g, b);
    this.drawOffscreen(g, b);
    if (b.hurtFlash > 0) {   // roter Rand: du wurdest getroffen
      const a = clamp(b.hurtFlash * 1.6, 0, 0.55), gr = g.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.35, VW / 2, VH / 2, Math.max(VW, VH) * 0.75);
      gr.addColorStop(0, 'rgba(220,30,30,0)'); gr.addColorStop(1, 'rgba(220,30,30,' + a + ')'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
    }
    if (b.flashScreen > 0) { g.globalAlpha = clamp(b.flashScreen * 5, 0, 0.7); g.fillStyle = '#fff'; g.fillRect(0, 0, VW, VH); g.globalAlpha = 1; }

    if (hud) this.drawHud(g, b);
    if (b.eventBanner) {
      const eb = b.eventBanner, a = clamp(Math.min(eb.t, 2.2 - eb.t) * 4, 0, 1), by = Math.round(VH * 0.2);
      g.globalAlpha = a * 0.75; g.fillStyle = '#2a0c0c'; g.fillRect(0, by, VW, 20); g.globalAlpha = a; g.fillStyle = eb.color; g.fillRect(0, by, VW, 1); g.fillRect(0, by + 19, VW, 1);
      drawText(g, 'ACHTUNG: ' + eb.text, R((VW - textWidth('ACHTUNG: ' + eb.text)) / 2), by + 6, '#ffffff', 1, '#802010'); g.globalAlpha = 1;
    }
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

  private bgCache = new Map<string, HTMLCanvasElement>();
  private rockCache = new Map<string, ReturnType<typeof rockSprite>[]>();
  /** Hintergrund je Arena (einmalig vorgerendert). */
  bgFor(id: string) {
    let c = this.bgCache.get(id);
    if (!c) { const map = MAPS[id] ?? MAPS.meadow; c = buildBackground(map); this.bgCache.set(id, c); this.rockCache.set(id, map.features.filter((f) => f.kind === 'rock').map((f) => rockSprite(f, id === 'jungle'))); }
    return c;
  }

  /** Schaufenster fürs Hauptmenü: Monster stehen animiert auf dem Kampfplatz. */
  drawShowcase(list: Mon[], dt: number, frac = 0.3) {
    this.fit();
    const g = this.g, VW = view.w, VH = view.h;
    this.time += dt;
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#1f5a2a'; g.fillRect(0, 0, VW, VH);
    const mx = X(200, 358), my = Y(358);
    this.cam.x = mx - VW / 2; this.clampCam(); this.cam.y = my - VH * frac;   // senkrecht frei: Monster immer im sichtbaren Bereich über der Startkarte
    g.save(); g.translate(-R(this.cam.x), -R(this.cam.y)); g.drawImage(this.bgFor('meadow'), 0, 0);
    for (const m of list) { m.walkT += dt; this.shadow(g, m); }
    for (const m of [...list].sort((a, c) => a.y - c.y)) this.drawMon(g, m);
    g.restore();
    g.fillStyle = 'rgba(10,14,26,0.18)'; g.fillRect(0, 0, VW, VH);
    this.present();
  }

  mons(b: Battle): Mon[] {
    const out: Mon[] = [];
    for (const tr of b.trainers) if (tr.active && tr.active.state !== 'benched') out.push(tr.active);
    return out;
  }

  // ─────────── Sprites ───────────
  /** Blickrichtung (8 Richtungen) mit Hysterese, damit das Sprite an Grenzen nicht flackert. */
  dir(m: Mon): number {
    const want = dirFromAngle(m.look);
    if (want !== m.dirIdx) {
      let d = ((m.look * 180) / Math.PI - dirCenterDeg(m.dirIdx)) % 360;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      if (Math.abs(d) > 30) m.dirIdx = want;
    }
    return m.dirIdx;
  }

  /** Bewegung nur durch Verschieben (ganze Pixel) – Sprites werden nie verzerrt. */
  poseOf(m: Mon): { ox: number; oy: number } {
    const ca = Math.cos(m.aim), sa = Math.sin(m.aim);
    if (m.state === 'windup') { const k = clamp(m.t / m.move!.windup, 0, 1); return { ox: -ca * 3 * k, oy: 1 + (-sa * 1.5 * k) }; }
    if (m.state === 'active') return { ox: ca * 3, oy: sa * 1.5 };
    if (m.state === 'recover' && m.move && m.t < 0.16) { const k = 1 - m.t / 0.16; const big = m.move.kind === 'melee' ? 6 : 3; return { ox: ca * big * k, oy: sa * big * 0.6 * k }; }
    return { ox: 0, oy: 0 };
  }

  dirIdxOf(m: Mon) { return this.dir(m); }

  frameOf(m: Mon) {
    const sp = getSprite(m.speciesId);
    const col = (m.moving || m.state === 'active' || m.state === 'dodge') && m.state !== 'faint' ? Math.floor(m.walkT / (m.state === 'active' ? 0.06 : 0.085)) % sp.cols : 0;
    return sp.frames[this.dir(m)][col];
  }

  drawMon(g: CanvasRenderingContext2D, m: Mon) {
    const sp = getSprite(m.speciesId);
    const fr = this.frameOf(m), ps = this.poseOf(m);
    const sx = X(m.x, m.y), sy = Y(m.y);
    let x = R(sx + ps.ox - sp.ax), y = R(sy + ps.oy - sp.ay);
    y += R(m.moving ? -Math.abs(Math.sin(m.walkT * 13 + m.uid)) * Math.min(3.5, sp.h * 0.05) : Math.sin(this.time * 2.4 + m.uid) * 0.7);   // Laufen: kleine Hüpfer (die Sheets haben kaum Laufbilder)
    if (m.state === 'stagger') x += Math.floor(this.time * 40) % 2 ? 1 : -1;
    if (m.state === 'faint') { this.drawFaint(g, m, fr, x, y); return; }
    if (m.state === 'summon' || m.state === 'recall') { this.drawBall(g, m, fr, x, y); return; }
    g.drawImage(fr.n, x, y);
    this.drawTerrainFx(g, m, sx, sy);
    this.drawMarker(g, m, sx, sy);
    if (m.state === 'windup' && m.move?.armor && Math.floor(this.time * 8) % 2 === 0) { const wx = R(sx), wy = R(sy - m.sp.height - 10); g.fillStyle = '#ff3040'; g.fillRect(wx - 2, wy - 8, 5, 11); g.fillRect(wx - 2, wy + 5, 5, 4); g.fillStyle = '#fff'; g.fillRect(wx - 1, wy - 7, 3, 8); }
    if (m.counterT > 0 && Math.floor(this.time * 10) % 2 === 0) { g.fillStyle = '#ffe060'; g.fillRect(R(sx) - 1, R(sy - m.sp.height - 8), 3, 3); g.fillRect(R(sx) - 4, R(sy - m.sp.height - 5), 9, 1); }
    this.drawBuffs(g, m, sx, sy, sp.ay);
    const white = m.flash > 0 || (m.state === 'windup' && Math.floor(m.t * 20) % 3 === 0 && m.move?.armor);
    if (white) { g.globalAlpha = m.flash > 0 ? 0.9 : 0.55; g.drawImage(fr.wn, x, y); g.globalAlpha = 1; }
    if (m.invuln > 0 && m.state === 'dodge') { g.globalAlpha = 0.5; g.drawImage(fr.wn, x, y); g.globalAlpha = 1; }
    if (m.para > 0 && Math.floor(this.time * 8) % 5 === 0) { g.globalAlpha = 0.55; g.drawImage(fr.wn, x, y); g.globalAlpha = 1; }
  }

  /** Monster steht im Wasser, in der Lava oder im hohen Gras: Füße verdecken, Wellen bzw. Halme. */
  drawTerrainFx(g: CanvasRenderingContext2D, m: Mon, sx: number, sy: number) {
    if (!m.terrain) return;
    const w = m.sp.radius + 7;
    if (m.terrain === 'grass') {
      for (let i = -w; i <= w; i += 2) { const hh = 4 + ((i * 7 + m.uid) & 3); g.fillStyle = (i & 2) ? '#5cb046' : '#46963a'; g.fillRect(R(sx + i), R(sy - hh + 2), 1, hh); }
      return;
    }
    const liquid = m.terrain === 'water' ? ['#5890f0', '#b0d6ff', '#3870d8'] : ['#f07820', '#ffec96', '#c83c18'];
    disc(g, sx, sy - 1, w, liquid[0], 4);
    const ph = (this.time * 1.4 + m.uid * 0.37) % 1, rr = w + 2 + ph * 7;
    g.globalAlpha = 1 - ph; g.fillStyle = liquid[1];
    for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.283; g.fillRect(R(sx + Math.cos(a) * rr), R(sy - 1 + Math.sin(a) * rr * 0.36), 1, 1); }
    g.globalAlpha = 1; g.fillStyle = liquid[1]; g.fillRect(R(sx - w * 0.5), R(sy - 3), R(w * 0.6), 1);
    if (m.moving && Math.random() < 0.4) { g.fillStyle = liquid[1]; g.fillRect(R(sx + (Math.random() - 0.5) * w * 2), R(sy - 4 - Math.random() * 5), 1, 2); }
  }

  /** Schild-Blase und Anfeuern-Aura (Manager-Befehle). */
  drawBuffs(g: CanvasRenderingContext2D, m: Mon, sx: number, sy: number, ay: number) {
    const hgt = m.sp.height;
    if (m.shield > 0) {
      const pulse = 0.5 + 0.2 * Math.sin(this.time * 8), rx = m.sp.radius + 10, ry = hgt * 0.62;
      g.globalAlpha = (m.shieldT < 1 ? Math.floor(this.time * 12) % 2 ? 0.2 : 0.6 : pulse) * 0.5; g.fillStyle = '#8cdcff';
      for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry))); g.fillRect(R(sx - w), R(sy - hgt * 0.5 + y), w * 2, 1); }
      g.globalAlpha = 0.85; g.fillStyle = '#e8fbff';
      for (let i = 0; i < 48; i++) { const a = (i / 48) * 6.283; g.fillRect(R(sx + Math.cos(a) * rx), R(sy - hgt * 0.5 + Math.sin(a) * ry), 1, 1); }
      g.globalAlpha = 1;
    }
    if (m.buffT > 0) {
      for (let i = 0; i < 5; i++) {
        const k = (this.time * 1.6 + i * 0.2 + m.uid) % 1, x = sx + Math.sin(i * 2.3 + this.time * 3) * (m.sp.radius + 2), y = sy - 2 - k * hgt * 0.9;
        g.globalAlpha = 1 - k; g.fillStyle = i % 2 ? '#ffb070' : '#ff7040'; g.fillRect(R(x), R(y), 2, 3);
      }
      g.globalAlpha = 1;
    }
  }

  /** Arena-Wetter: Farbstich + Partikel. */
  drawWeather(g: CanvasRenderingContext2D, b: Battle) {
    const mod = b.mod; if (mod.id === 'none') return;
    const VW = view.w, VH = view.h;
    g.fillStyle = mod.tint; g.fillRect(0, 0, VW, VH);
    if (mod.id === 'rain') {
      g.fillStyle = 'rgba(190,215,255,0.55)';
      for (let i = 0; i < 46; i++) { const x = (i * 53 + this.time * 40) % (VW + 30) - 15, y = ((i * 97 + this.time * 230) % (VH + 20)); g.fillRect(R(x), R(y), 1, 4); g.fillRect(R(x - 1), R(y + 4), 1, 2); }
    } else if (mod.id === 'sun') {
      const gr = g.createRadialGradient(VW * 0.85, 0, 4, VW * 0.85, 0, VW * 0.9); gr.addColorStop(0, 'rgba(255,240,170,0.35)'); gr.addColorStop(1, 'rgba(255,200,90,0)');
      g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
    } else if (mod.id === 'jungle') {
      g.fillStyle = 'rgba(200,255,150,0.7)';
      for (let i = 0; i < 18; i++) { const x = (i * 71 + Math.sin(this.time + i) * 12) % VW, y = VH - ((i * 41 + this.time * 16) % VH); g.fillRect(R(x), R(y), 2, 2); }
    }
  }

  /** K.O.: Blinken, dann absinken und ausblenden (ohne Drehen/Skalieren). */
  drawFaint(g: CanvasRenderingContext2D, m: Mon, fr: { n: HTMLCanvasElement; wn: HTMLCanvasElement }, x: number, y: number) {
    const blink = m.t < 0.5 ? (Math.floor(m.t * 14) % 2 === 0) : false;
    g.globalAlpha = clamp(1 - (m.t - 0.55) / 0.6, 0, 1);
    const sink = R(clamp((m.t - 0.4) / 0.6, 0, 1) * 4);
    g.drawImage(fr.n, x, y + sink);
    if (blink) { g.globalAlpha = 0.8; g.drawImage(fr.wn, x, y + sink); }
    g.globalAlpha = 1;
  }

  /** Ein-/Zurückrufen: weißes Aufblitzen mit Funken, ohne Größenänderung. */
  drawBall(g: CanvasRenderingContext2D, m: Mon, fr: { n: HTMLCanvasElement; wn: HTMLCanvasElement }, x: number, y: number) {
    const summon = m.state === 'summon';
    const p = clamp(summon ? m.t / 0.4 : m.t / 0.35, 0, 1);
    const k = summon ? p : 1 - p;
    g.globalAlpha = k < 0.5 ? 0 : (k - 0.5) * 2; g.drawImage(fr.n, x, y);
    g.globalAlpha = k < 0.5 ? k * 2 : 1 - (k - 0.5) * 2; g.drawImage(fr.wn, x, y);
    g.globalAlpha = 1;
    const bx = X(m.x, m.y), by = Y(m.y), r = (1 - k) * 12 + 2;
    for (let i = 0; i < 6; i++) {
      const a = i * 1.047 + this.time * 6;
      g.fillStyle = i % 2 ? '#ffffff' : (summon ? '#ffe880' : '#ff7060');
      g.fillRect(R(bx + Math.cos(a) * r), R(by - 16 + Math.sin(a) * r * 0.8), 2, 2);
    }
  }

  shadow(g: CanvasRenderingContext2D, m: Mon) {
    const w = m.state === 'summon' || m.state === 'recall' ? 10 : getSprite(m.speciesId).shadow[this.dirIdxOf(m)].w;
    const sx = X(m.x, m.y) + (m.state === 'summon' || m.state === 'recall' ? 0 : getSprite(m.speciesId).shadow[this.dirIdxOf(m)].dx), sy = Y(m.y);
    g.globalAlpha = 0.3; disc(g, sx, sy - 1, R(w / 2), '#1e321e', Math.max(2, R(w * 0.14))); g.globalAlpha = 1;
    // Teamring: blau = du, rot = Gegner
    if (m.state !== 'faint') {
      const f = SPR(m.y), rr = R((m.sp.radius + 5) * f), col = m.side === 0 ? '#58c8ff' : '#ff6a6a', n = 28, pulse = 0.55 + 0.25 * Math.sin(this.time * 4);
      g.globalAlpha = pulse; g.fillStyle = col;
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.28; g.fillRect(R(sx + Math.cos(a) * rr), R(sy - 1 + Math.sin(a) * rr * TILT), 2, 1); }
      g.globalAlpha = 1;
    }
  }

  /** Kennzeichnung über dem Kopf: Pfeil in Teamfarbe, in den ersten Sekunden mit Namen (DU / Name des Gegners). */
  drawMarker(g: CanvasRenderingContext2D, m: Mon, sx: number, sy: number) {
    if (!m.alive || m.state === 'faint' || m.state === 'summon' || m.state === 'recall') return;
    const col = m.side === 0 ? '#58c8ff' : '#ff6a6a', dark = m.side === 0 ? '#1a5a80' : '#802020';
    const x = R(sx), y = R(sy - m.sp.height * SPR(m.y) - 22 + Math.sin(this.time * 5 + m.uid) * 1.5);
    g.fillStyle = dark; for (let i = 0; i < 5; i++) g.fillRect(x - 4 + i, y - 1 + i, 9 - i * 2, 1);
    g.fillStyle = col; for (let i = 0; i < 4; i++) g.fillRect(x - 3 + i, y + i, 7 - i * 2, 1);
    const label = m.side === 0 ? 'DU' : this.foeName;
    if (this.curT - m.since < 6 || this.curT < 8) {
      const a = clamp((6 - (this.curT - m.since)) * 1.2, 0, 1); g.globalAlpha = Math.max(a, this.curT < 8 ? clamp(8 - this.curT, 0, 1) : 0);
      drawText(g, label, R(sx - textWidth(label) / 2), y - 10, col, 1, '#10141c'); g.globalAlpha = 1;
    }
  }

  drawGhost(g: CanvasRenderingContext2D, gh: { x: number; y: number; face: number; t: number; mon: Mon }) {
    const sp = getSprite(gh.mon.speciesId); const fr = sp.frames[this.dir(gh.mon)][0];
    g.globalAlpha = clamp(0.5 * (1 - gh.t / 0.18), 0, 1);
    g.drawImage(fr.wn, R(X(gh.x, gh.y) - sp.ax), R(Y(gh.y) - sp.ay));
    g.globalAlpha = 1;
  }

  // ─────────── Telegraphs ───────────
  drawZone(x: number, y: number, r: number, p: number, fade: number, type = 'electric') {
    const g = this.g;
    const fz = (TYPE_FX[type as TypeId] ?? TYPE_FX.electric).pal; const [zc1, zc2, zc3] = type === 'electric' ? ['#f8e848', '#f8d030', '#fff6a0'] : type === 'fire' ? ['#f8a030', '#f07820', '#ffe0a0'] : [fz[1], fz[2], fz[0]];
    if (fade >= 0) return;   // Einschlagspur zeichnet der Treffer-Effekt
    const pulse = Math.floor(this.time * 10) % 2;
    g.globalAlpha = 0.18 + 0.3 * p; disc(g, x, y, r, pulse ? zc1 : zc2, r * TILT); g.globalAlpha = 1;
    g.fillStyle = zc3;
    const n = 36;
    for (let i = 0; i < n; i++) if (i % 2 === 0) { const a = i / n * Math.PI * 2; g.fillRect(R(x + Math.cos(a) * r), R(y + Math.sin(a) * r * TILT), 1, 1); }
    // schrumpfender Ring = Countdown
    g.fillStyle = '#ffffff';
    const rr = r * (1 - p);
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; g.fillRect(R(x + Math.cos(a) * rr), R(y + Math.sin(a) * rr * TILT), 1, 1); }
  }

  drawTelegraph(g: CanvasRenderingContext2D, m: Mon) {
    if (m.state === 'active' && m.move?.kind === 'cone') {
      const mv = m.move, col = (TYPE_FX[mv.type as TypeId] ?? TYPE_FX.fire).pal[1];
      const pt = (a: number, d: number) => { const wx = m.x + Math.cos(a) * d, wy = m.y + Math.sin(a) * d; return [X(wx, wy), Y(wy) - m.sp.height * 0.5]; };
      const flick = 0.85 + Math.sin(this.time * 40) * 0.15, d = mv.range * flick;
      const [x0, y0] = pt(m.aim, 8), [x1, y1] = pt(m.aim - mv.arc! * 0.9, d), [x2, y2] = pt(m.aim + mv.arc! * 0.9, d);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.13; g.fillStyle = col;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); g.fill();
      g.globalAlpha = 0.1; const [xm, ym] = pt(m.aim, d * 0.8); g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(xm, ym); g.stroke();
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      return;
    }
    if (m.state !== 'windup' || !m.move) return;
    const mv = m.move, p = clamp(m.t / mv.windup, 0, 1);
    // Aufladeschein am Boden in Typfarbe
    const glow = (TYPE_FX[mv.type as TypeId] ?? TYPE_FX.normal).pal[1];
    const gx = X(m.x, m.y), gy = Y(m.y), gf = SPR(m.y);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.22 + 0.3 * p; disc(g, gx, gy, R((m.sp.radius + 6 + 8 * p) * gf), glow, R((m.sp.radius + 6 + 8 * p) * gf * TILT)); g.globalAlpha = 0.3; disc(g, gx, gy, R((m.sp.radius * 0.7 + 4 * p) * gf), glow, R((m.sp.radius * 0.7 + 4 * p) * gf * TILT)); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = m.side === 1 ? '#ff6050' : '#ffffff';
    g.globalAlpha = 0.35 + 0.4 * p;
    if (mv.kind === 'dash' || mv.kind === 'projectile') {
      const len = mv.kind === 'dash' ? mv.range : Math.min(40, mv.range);
      for (let d = 12; d < len; d += 5) { const wx = m.x + Math.cos(m.aim) * d, wy = m.y + Math.sin(m.aim) * d; g.fillRect(R(X(wx, wy)), R(Y(wy) - m.sp.height * 0.45), 1, 1); }
    } else if (mv.kind === 'melee') {
      for (let a = -mv.arc!; a <= mv.arc!; a += 0.12) { const wx = m.x + Math.cos(m.aim + a) * mv.radius!, wy = m.y + Math.sin(m.aim + a) * mv.radius!; g.fillRect(R(X(wx, wy)), R(Y(wy) - m.sp.height * 0.45), 1, 1); }
    } else if (mv.kind === 'cone') {
      const pt = (a: number) => { const wx = m.x + Math.cos(a) * mv.range, wy = m.y + Math.sin(a) * mv.range; return [X(wx, wy), Y(wy) - m.sp.height * 0.45]; };
      const [ax1, ay1] = pt(m.aim - mv.arc!), [ax2, ay2] = pt(m.aim + mv.arc!);
      g.globalAlpha = 0.14 + 0.12 * p; g.fillStyle = glow; g.beginPath(); g.moveTo(X(m.x, m.y), Y(m.y) - m.sp.height * 0.45); g.lineTo(ax1, ay1); g.lineTo(ax2, ay2); g.closePath(); g.fill(); g.globalAlpha = 0.35 + 0.4 * p; g.fillStyle = m.side === 1 ? '#ff6050' : '#ffffff';
      for (const sg of [-1, 1]) for (let d = 8; d < mv.range; d += 4) { const wx = m.x + Math.cos(m.aim + sg * mv.arc!) * d, wy = m.y + Math.sin(m.aim + sg * mv.arc!) * d; g.fillRect(R(X(wx, wy)), R(Y(wy) - m.sp.height * 0.45), 1, 1); }
    }
    g.globalAlpha = 1;
  }

  // ─────────── Projektile & Effekte ───────────
  drawProj(g: CanvasRenderingContext2D, p: { x: number; y: number; owner: Mon; move: { type: string; id: string }; age: number; r: number; scale: number; trail: { x: number; y: number }[] }) {
    const f = SPR(p.y), px = X(p.x, p.y), y = Y(p.y) - p.owner.sp.height * 0.5;
    const q = (n: number) => Math.max(1, R(n * f * (p.scale < 0.9 ? 0.8 : 1)));
    const T = p.trail.map((t) => [X(t.x, t.y), Y(t.y) - p.owner.sp.height * 0.5] as const);
    const style = TYPE_FX[p.move.type as TypeId]?.proj ?? 'orb';
    if (p.move.type === 'grass') {
      T.forEach(([tx, ty], i) => { const k = (i + 1) / T.length; g.globalAlpha = 0.2 + 0.5 * k; disc(g, tx, ty, Math.max(1, R(2.5 * k * f)), '#78b840'); });
      g.globalAlpha = 1;
      // Blatt: Rautenform entlang der Flugrichtung
      const a = Math.atan2(p.trail.length > 1 ? Y(p.y) - Y(p.trail[0].y) : 1, p.trail.length > 1 ? X(p.x, p.y) - X(p.trail[0].x, p.trail[0].y) : 1);
      const ca = Math.cos(a), sa = Math.sin(a), L = q(7), Wd = q(3.2);
      for (let t = -L; t <= L; t++) {
        const wd = Math.round(Wd * (1 - Math.abs(t) / (L + 0.5)));
        for (let w = -wd; w <= wd; w++) {
          const col = Math.abs(w) <= 0 ? '#e8ffb0' : (w < 0 ? '#5fa838' : '#3f7f2a');
          g.fillStyle = col; g.fillRect(R(px + ca * t - sa * w), R(y + sa * t + ca * w), 1, 1);
        }
      }
      g.fillStyle = '#2d5e1e'; g.fillRect(R(px - ca * (L + 1)), R(y - sa * (L + 1)), 1, 1);
    } else if (p.move.type === 'fire') {
      T.forEach(([tx, ty], i) => { const k = (i + 1) / T.length; g.globalAlpha = 0.25 + 0.6 * k; disc(g, tx, ty, Math.max(1, R(4 * k * f)), k > 0.6 ? '#f07820' : '#d83818'); });
      g.globalAlpha = 0.28; disc(g, px, y, q(8), '#f8a030'); g.globalAlpha = 1;
      const fl = Math.floor(p.age * 20) % 2;
      disc(g, px, y, q(5), '#d83818'); disc(g, px, y, q(4), '#f07820'); disc(g, px + (fl ? 1 : -1), y - 1, q(2.5), '#f8c030'); disc(g, px, y, q(1.5), '#fff6c0');
    } else if (p.move.type === 'water') {
      T.forEach(([tx, ty], i) => { const k = (i + 1) / T.length; g.globalAlpha = 0.2 + 0.5 * k; disc(g, tx, ty, Math.max(1, R(2.5 * k * f)), '#8cc0ff'); });
      g.globalAlpha = 0.3; disc(g, px, y, q(6), '#a8d0f8'); g.globalAlpha = 1;
      disc(g, px, y, q(4), '#3858c0'); disc(g, px, y, q(3.4), '#6890f0'); disc(g, px - 1, y - 1, q(1.6), '#e0f0ff');
    } else if (style !== 'bolt') {
      this.drawProjStyle(g, style, TYPE_FX[p.move.type as TypeId]?.pal ?? TYPE_FX.normal.pal, px, y, f, q, T, p.age, p.trail.length > 1 ? Math.atan2(Y(p.y) - Y(p.trail[0].y), X(p.x, p.y) - X(p.trail[0].x, p.trail[0].y)) : 0);
    } else {
      const rn = new Rng(Math.floor(p.age * 30) + 7);
      // Zackiger Blitzschweif bis zum Anfang des Schweifs
      const pts = [[px, y], ...T.slice().reverse().filter((_, i) => i % 2 === 0)];
      for (const [col, w] of [['#f8d83899', 3], ['#ffffff', 1]] as const) {
        g.fillStyle = col;
        for (let i = 0; i < pts.length - 1; i++) {
          const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
          for (let k = 0; k <= n; k++) g.fillRect(R(x0 + (x1 - x0) * k / n + (k ? rn.range(-2, 2) * f : 0)), R(y0 + (y1 - y0) * k / n + (k ? rn.range(-2, 2) * f : 0)), w, w);
        }
      }
      g.globalAlpha = 0.3; disc(g, px, y, q(8), '#f8e848'); g.globalAlpha = 1;
      disc(g, px, y, q(5), '#f8d838'); disc(g, px, y, q(3), '#ffffff');
      g.fillStyle = '#fff6a0';
      for (let i = 0; i < 5; i++) { const a = rn.next() * 6.28, l = (6 + rn.int(0, 4)) * f; for (let k = 2; k < l; k += 2) g.fillRect(R(px + Math.cos(a) * k + rn.range(-1, 1)), R(y + Math.sin(a) * k + rn.range(-1, 1)), 1, 1); }
    }
    g.globalAlpha = 1;
  }

  /** Liegt ein Monster außerhalb des Bildes, zeigt ein Randpfeil in Teamfarbe, wo es ist. */
  drawOffscreen(g: CanvasRenderingContext2D, b: Battle) {
    const VW = view.w, VH = view.h;
    for (const tr of b.trainers) {
      const m = tr.active; if (!m || !m.alive || m.state === 'benched') continue;
      const px = X(m.x, m.y) - this.cam.x, py = Y(m.y) - this.cam.y - m.sp.height * 0.4;
      if (px > 4 && px < VW - 4 && py > 4 && py < VH - 4) continue;
      const mx = 12, top = 34, bot = 40, ax = clamp(px, mx, VW - mx), ay = clamp(py, top, VH - bot);
      const ang = Math.atan2(py - ay, px - ax), col = m.side === 0 ? '#58c8ff' : '#ff6a6a';
      g.fillStyle = '#10141c'; for (let t = -6; t <= 6; t++) { const w = 7 - Math.abs(t); for (let u = -w; u <= w; u++) g.fillRect(R(ax + Math.cos(ang) * t - Math.sin(ang) * u), R(ay + Math.sin(ang) * t + Math.cos(ang) * u), 2, 2); }
      g.fillStyle = col; for (let t = -4; t <= 4; t++) { const w = 5 - Math.abs(t); for (let u = -w; u <= w; u++) g.fillRect(R(ax + Math.cos(ang) * t - Math.sin(ang) * u), R(ay + Math.sin(ang) * t + Math.cos(ang) * u), 1, 1); }
      const lb = m.side === 0 ? 'DU' : 'GEGNER'; drawText(g, lb, R(ax - textWidth(lb) / 2), R(ay - 14), col, 1, '#10141c');
    }
  }

  /** Minikarte: Arena von oben mit Gelände, Kristallen, Unwettern und beiden Monstern. */
  drawMinimap(g: CanvasRenderingContext2D, b: Battle) {
    const W = 34, H = 47, x0 = 4, y0 = 34, sx = W / (ARENA.x1 - ARENA.x0), sy = H / (ARENA.y1 - ARENA.y0);
    const mx = (x: number) => R(x0 + (x - ARENA.x0) * sx), my = (y: number) => R(y0 + (y - ARENA.y0) * sy);
    g.globalAlpha = 0.72; g.fillStyle = '#10141c'; g.fillRect(x0 - 2, y0 - 2, W + 4, H + 4); g.fillStyle = '#6a8a50'; g.fillRect(x0, y0, W, H); g.globalAlpha = 1;
    for (const f of b.map.features) { g.fillStyle = f.kind === 'water' ? '#5a8ae0' : f.kind === 'lava' ? '#e0602a' : f.kind === 'grass' ? '#3f7a2a' : '#8a8a94'; const r = Math.max(1, R(f.r * sx)); g.fillRect(mx(f.x) - r, my(f.y) - r, r * 2, r * 2); }
    for (const hz of b.hazards) if (!hz.done) { g.fillStyle = '#ff4030'; g.fillRect(mx(hz.x) - 2, my(hz.y) - 2, 4, 4); }
    for (const pk of b.pickups) { g.fillStyle = PICKUP_INFO[pk.kind].color; g.fillRect(mx(pk.x) - 1, my(pk.y) - 1, 3, 3); }
    // sichtbarer Ausschnitt
    const a = unproject(this.cam.x, this.cam.y), c = unproject(this.cam.x + view.w, this.cam.y + view.h);
    g.strokeStyle = '#ffffff88'; g.lineWidth = 1;
    const rx = clamp(mx(a.x), x0, x0 + W), ry = clamp(my(a.y), y0, y0 + H), rx2 = clamp(mx(c.x), x0, x0 + W), ry2 = clamp(my(c.y), y0, y0 + H);
    g.strokeRect(rx + 0.5, ry + 0.5, Math.max(1, rx2 - rx), Math.max(1, ry2 - ry));
    for (const tr of b.trainers) { const m = tr.active; if (!m || !m.alive) continue; const col = m.side === 0 ? '#58c8ff' : '#ff6a6a'; g.fillStyle = '#10141c'; g.fillRect(mx(m.x) - 2, my(m.y) - 2, 5, 5); g.fillStyle = col; g.fillRect(mx(m.x) - 1, my(m.y) - 1, 3, 3); }
  }

  /** Unwetter-Markierung: pulsierender Kreis, der sich füllt; kurz vor dem Einschlag blinkt er. */
  drawHazard(g: CanvasRenderingContext2D, hz: { x: number; y: number; r: number; t: number; delay: number; type: string; done: boolean; fade: number }) {
    if (hz.done) return;
    const p = clamp(hz.t / hz.delay, 0, 1), rr = hz.r * sc(hz.y), cx = X(hz.x, hz.y), cy = Y(hz.y), pal = (TYPE_FX[hz.type as TypeId] ?? TYPE_FX.fire).pal;
    const blink = p > 0.7 && Math.floor(this.time * 14) % 2 === 0;
    g.globalAlpha = 0.16 + 0.26 * p; disc(g, cx, cy, R(rr * p), blink ? '#ffffff' : pal[1], R(rr * p * TILT));
    g.globalAlpha = 0.9; g.fillStyle = blink ? '#ffffff' : '#ff5a40';
    for (let i = 0; i < 44; i++) { const a = (i / 44) * 6.28 + this.time * 2; if (i % 2) continue; g.fillRect(R(cx + Math.cos(a) * rr), R(cy + Math.sin(a) * rr * TILT), 2, 2); }
    // Warnzeichen
    g.fillStyle = '#ff5a40'; g.fillRect(R(cx) - 1, R(cy) - 8, 3, 8); g.fillRect(R(cx) - 1, R(cy) + 2, 3, 3);
    g.globalAlpha = 1;
  }

  /** Kristall auf dem Spielfeld: schwebt, leuchtet, blinkt kurz vor dem Verschwinden. */
  drawPickup(g: CanvasRenderingContext2D, pk: { kind: string; x: number; y: number; t: number; life: number }) {
    if (pk.life < 4 && Math.floor(this.time * 10) % 2 === 0) return;
    const f = SPR(pk.y), cx = X(pk.x, pk.y), gy = Y(pk.y), bob = Math.sin(this.time * 4 + pk.x) * 2 * f, y = gy - 12 * f + bob;
    const col = PICKUP_INFO[pk.kind as keyof typeof PICKUP_INFO].color, rr = Math.max(4, R(7 * f));
    g.globalAlpha = 0.3; disc(g, cx, gy, R(9 * f), '#000000', R(9 * f * TILT)); g.globalAlpha = 0.25 + 0.1 * Math.sin(this.time * 6); disc(g, cx, R(y), R(rr * 1.9), col); g.globalAlpha = 1;
    disc(g, cx, R(y), rr, col); disc(g, cx, R(y), R(rr * 0.7), '#ffffffcc');
    g.fillStyle = col;
    const c = R(cx), yy = R(y);
    if (pk.kind === 'heal') { g.fillRect(c - 1, yy - 3, 3, 7); g.fillRect(c - 3, yy - 1, 7, 3); }
    else if (pk.kind === 'power') { g.fillRect(c - 1, yy - 3, 3, 6); g.fillRect(c - 3, yy - 1, 7, 2); g.fillRect(c - 2, yy - 2, 5, 1); }
    else if (pk.kind === 'focus') { g.fillRect(c, yy - 3, 1, 7); g.fillRect(c - 1, yy - 2, 3, 5); g.fillRect(c - 3, yy, 7, 1); }
    else { g.fillRect(c - 1, yy - 3, 4, 2); g.fillRect(c - 2, yy - 1, 4, 2); g.fillRect(c - 1, yy + 1, 3, 3); }
    for (let i = 0; i < 3; i++) { const a = this.time * 3 + i * 2.1; g.fillStyle = '#ffffff'; g.fillRect(R(cx + Math.cos(a) * rr * 1.5), R(y + Math.sin(a) * rr * 1.2), 1, 1); }
  }

  /** Warnzeichen für Angriffe des Gegners: zeigt Fläche und Richtung, im letzten Moment leuchtet es auf (jetzt ausweichen!). */
  drawThreat(g: CanvasRenderingContext2D, m: Mon) {
    const mv = m.move; if (!mv || m.state !== 'windup' || mv.kind === 'aoe' || mv.kind === 'self' || mv.kind === 'status') return;
    const mine = m.side === 0, p = clamp(m.t / mv.windup, 0, 1), now = !mine && (mv.windup - m.t) < 0.26, blink = now && Math.floor(this.time * 18) % 2 === 0;
    const col = mine ? '#58d0ff' : blink ? '#ffffff' : now ? '#ff3a30' : '#ff7050';   // blau = deine Reichweite, rot = Gefahr
    const pt = (a: number, d: number): [number, number] => { const wx = m.x + Math.cos(a) * d, wy = m.y + Math.sin(a) * d; return [X(wx, wy), Y(wy)]; };
    g.globalAlpha = (mine ? 0.12 + 0.22 * p : 0.18 + 0.34 * p) + (now ? 0.18 : 0); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1; g.beginPath();
    const [x0, y0] = pt(m.aim, 0);
    if (mv.kind === 'melee' || mv.kind === 'cone') {
      const rad = mv.kind === 'melee' ? mv.radius! + 8 : mv.range, half = (mv.kind === 'melee' ? mv.arc! + 0.35 : mv.arc! + 0.1);
      g.moveTo(x0, y0); for (let i = 0; i <= 14; i++) { const a = m.aim - half + (2 * half * i) / 14; const [x, y] = pt(a, rad); g.lineTo(x, y); } g.closePath();
    } else if (mv.kind === 'dash') {
      const len = mv.range, w = Math.max(10, mv.radius! + 4), nx = -Math.sin(m.aim), ny = Math.cos(m.aim);
      const A = (d: number, s: number): [number, number] => { const wx = m.x + Math.cos(m.aim) * d + nx * s, wy = m.y + Math.sin(m.aim) * d + ny * s; return [X(wx, wy), Y(wy)]; };
      const q = [A(0, -w), A(len, -w), A(len, w), A(0, w)]; g.moveTo(q[0][0], q[0][1]); for (const [x, y] of q.slice(1)) g.lineTo(x, y); g.closePath();
    } else if (mv.kind === 'projectile') {
      if (mv.ring) { for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.28; const [x, y] = pt(a, 60); g.fillRect(R(x), R(y), 2, 2); } g.globalAlpha = 1; return; }
      const [x1, y1] = pt(m.aim, Math.min(mv.range, 130)); const dx = x1 - x0, dy = y1 - y0, n = Math.max(1, Math.floor(Math.hypot(dx, dy) / 6));
      g.globalAlpha = 0.5 + 0.4 * p; for (let i = 0; i < n; i += 1) if (i % 2 === 0) g.fillRect(R(x0 + (dx * i) / n), R(y0 + (dy * i) / n), 2, 2); g.globalAlpha = 1; return;
    }
    g.fill(); g.globalAlpha = 0.85; g.stroke(); g.globalAlpha = 1;
  }

  /** Tipp-Rückmeldung: kleine Welle an der Stelle, die der Finger berührt hat. */
  drawTaps(g: CanvasRenderingContext2D, dt: number) {
    for (const t of this.taps) { t.t += dt; const p = t.t / 0.45; if (p >= 1) continue; const f = SPR(t.y), rr = R((4 + 18 * p) * f), cx = X(t.x, t.y), cy = Y(t.y); g.globalAlpha = 1 - p; g.fillStyle = '#ffffff'; for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.28; g.fillRect(R(cx + Math.cos(a) * rr), R(cy + Math.sin(a) * rr * TILT), 2, 1); } g.globalAlpha = 1; }
    this.taps = this.taps.filter((t) => t.t < 0.45);
  }

  /** Laufbefehl: pulsierender Zielring am Boden. */
  drawOrder(g: CanvasRenderingContext2D, b: Battle) {
    const tr = b.trainers[0], o = tr.order; if (!o || !tr.active) return;
    const pulse = (Math.floor(this.time * 6) % 3);
    if (o.kind === 'attack') {   // roter Zielkreis am Gegner
      const e = b.trainers[1].active; if (!e) return; const cx = X(e.x, e.y), cy = Y(e.y), f = SPR(e.y), rr = R((e.sp.radius + 8 + pulse * 2) * f);
      g.globalAlpha = 0.95; g.fillStyle = '#ff5a40'; for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.28; g.fillRect(R(cx + Math.cos(a) * rr), R(cy + Math.sin(a) * rr * TILT), 2, 2); }
      g.fillRect(R(cx) - rr - 3, R(cy), 5, 1); g.fillRect(R(cx) + rr - 1, R(cy), 5, 1); g.globalAlpha = 1; return;
    }
    const cx = X(o.x, o.y), cy = Y(o.y), f = SPR(o.y), rr = R((o.kind === 'hold' ? 9 : 7 + pulse * 2) * f);
    g.globalAlpha = 0.9; g.fillStyle = o.kind === 'hold' ? '#ffe060' : '#ffffff';
    for (let i = 0; i < 22; i++) { const a = (i / 22) * 6.28; g.fillRect(R(cx + Math.cos(a) * rr), R(cy + Math.sin(a) * rr * TILT), 2, 1); }
    if (o.kind === 'hold') { const x = R(cx), y = R(cy); g.fillStyle = '#ffe060'; g.fillRect(x, y - 14, 1, 14); g.fillRect(x + 1, y - 14, 6, 1); g.fillRect(x + 1, y - 13, 5, 1); g.fillRect(x + 1, y - 12, 4, 1); g.fillRect(x + 1, y - 11, 3, 1); g.fillRect(x + 1, y - 10, 2, 1); }   // Fähnchen
    g.fillRect(R(cx) - 1, R(cy) - 1, 3, 2); g.globalAlpha = 1;
  }

  /** Projektil-Stile der neuen Typen: jede Sorte sieht anders aus und fliegt anders. */
  drawProjStyle(g: CanvasRenderingContext2D, style: string, pal: readonly string[], px: number, y: number, f: number, q0: (n: number) => number, T: readonly (readonly [number, number])[], age: number, ang: number) {
    const q = (n: number) => q0(n * 1.3);
    const [c0, c1, c2] = pal, ca = Math.cos(ang), sa = Math.sin(ang);
    const trail = (col: string, r: number, a0 = 0.2) => T.forEach(([tx, ty], i) => { const k = (i + 1) / T.length; g.globalAlpha = a0 + 0.5 * k; disc(g, tx, ty, Math.max(1, R(r * k * f)), col); });
    const px1 = (x: number, yy: number, col: string, w = 1) => { g.fillStyle = col; g.fillRect(R(x), R(yy), w, w); };
    switch (style) {
      case 'shard': {   // Eiskristall: drehende Raute mit weißem Kern und Glitzern
        trail(c1, 2.2); g.globalAlpha = 1; const a = age * 9, L = q(7);
        for (let k = -L; k <= L; k++) { const w = Math.round(q(3) * (1 - Math.abs(k) / (L + 1))); for (let j = -w; j <= w; j++) px1(px + Math.cos(a) * k - Math.sin(a) * j, y + Math.sin(a) * k + Math.cos(a) * j, Math.abs(j) < 1 ? c0 : j < 0 ? c1 : c2); }
        if (Math.floor(age * 18) % 2) px1(px + q(5), y - q(5), '#ffffff', 2); break;
      }
      case 'wisp': {   // Irrlicht: Flamme mit hohlem Kern und wehendem Schweif
        trail(c2, 3.4, 0.15); g.globalAlpha = 0.3; disc(g, px, y, q(8), c1); g.globalAlpha = 1;
        disc(g, px, y, q(5), c1); disc(g, px, y, q(3.4), '#1a1030'); disc(g, px - q(1), y - q(1), q(1.4), c0);
        for (let i = 0; i < 3; i++) { const o = (i + 1) * q(3); px1(px - ca * o + Math.sin(age * 14 + i) * q(2) * -sa, y - sa * o + Math.sin(age * 14 + i) * q(2) * ca, c2, 2); } break;
      }
      case 'chunk': {   // Brocken: kantiger, rotierender Stein mit Geröll
        trail(c2, 2.6, 0.12); g.globalAlpha = 1; const a = age * 6, rn = new Rng(7);
        for (let i = 0; i < 9; i++) { const aa = a + i * 0.7, rr = q(2.5 + rn.next() * 3.2); px1(px + Math.cos(aa) * rr, y + Math.sin(aa) * rr, i % 3 === 0 ? c0 : i % 3 === 1 ? c1 : c2, q(2.4)); }
        disc(g, px, y, q(3.4), c1); disc(g, px - 1, y - 1, q(1.6), c0); break;
      }
      case 'slash': {   // Windklinge: Sichel quer zur Flugrichtung mit Streifen
        g.globalAlpha = 0.5; for (let i = 1; i < 5; i++) { const o = i * q(3); px1(px - ca * o - sa * q(2), y - sa * o + ca * q(2), c1, 2); px1(px - ca * o + sa * q(2), y - sa * o - ca * q(2), c1, 2); } g.globalAlpha = 1;
        for (let k = -q(8); k <= q(8); k++) { const bend = (k * k) / (q(8) * 2.4); const wx = px + (-sa) * k + ca * bend, wy = y + ca * k + sa * bend; px1(wx, wy, Math.abs(k) < q(4) ? c0 : c1, 2); px1(wx - ca, wy - sa, c2); } break;
      }
      case 'bubble': {   // Giftblase mit Glanz, tropft
        trail('#c8f060', 2, 0.1); g.globalAlpha = 0.35; disc(g, px, y, q(6.5), c1); g.globalAlpha = 1;
        disc(g, px, y, q(5), c2); disc(g, px, y, q(4.2), c1); px1(px - q(1.5), y - q(1.8), c0, q(2)); px1(px + q(1.2), y + q(2.4), '#c8f060', q(1.4));
        if (Math.floor(age * 12) % 3 === 0) px1(px + q(2), y + q(6), '#c8f060', 2); break;
      }
      case 'disc': {   // Metallscheibe: vier rotierende Klingen
        trail(c1, 1.8, 0.1); g.globalAlpha = 1; const a = age * 18;
        for (let b = 0; b < 4; b++) { const aa = a + (b * Math.PI) / 2; for (let k = 2; k < q(8); k += 1) { const w = Math.max(1, Math.round((q(8) - k) / 3)); px1(px + Math.cos(aa) * k + Math.cos(aa + 1.4) * w * 0.4, y + Math.sin(aa) * k + Math.sin(aa + 1.4) * w * 0.4, k > q(5) ? c0 : c1, 2); } }
        disc(g, px, y, q(3), c2); disc(g, px, y, q(2), c0); break;
      }
      case 'star': {   // Lichtstern: vierzackig, blinkend, mit Funkelschweif
        trail(c1, 1.6, 0.12); g.globalAlpha = 0.28; disc(g, px, y, q(8), c1); g.globalAlpha = 1;
        const L = q(9) * (0.85 + 0.15 * Math.sin(age * 30)), a = age * 3;
        for (let b = 0; b < 4; b++) { const aa = a + (b * Math.PI) / 2; for (let k = 1; k < L; k++) px1(px + Math.cos(aa) * k, y + Math.sin(aa) * k, k < L * 0.5 ? c0 : c1, Math.max(1, Math.round(q(2) * (1 - k / L)))); }
        disc(g, px, y, q(2.6), c0); break;
      }
      case 'ring': {   // Schallring: mehrere Bögen hintereinander, die sich weiten
        g.globalAlpha = 1;
        for (let i = 0; i < 3; i++) { const rr = q(3 + i * 2.6), al = 1 - i * 0.28; g.globalAlpha = al; const col = i === 0 ? c0 : i === 1 ? c1 : c2; for (let a = -1.0; a <= 1.0; a += 0.14) { const aa = ang + a; px1(px - ca * i * q(3) + Math.cos(aa) * rr, y - sa * i * q(3) + Math.sin(aa) * rr, col, 2); } }
        g.globalAlpha = 1; disc(g, px, y, q(2), c0); break;
      }
      case 'void': {   // Finsterkugel: schwarzer Kern, violetter Rand, Sog
        g.globalAlpha = 0.35; disc(g, px, y, q(8), c1); g.globalAlpha = 1;
        disc(g, px, y, q(5.2), c1); disc(g, px, y, q(4.2), c2);
        for (let i = 0; i < 6; i++) { const aa = age * 10 + i * 1.05, rr = q(7) - ((age * 20 + i * 3) % q(7)); px1(px + Math.cos(aa) * rr, y + Math.sin(aa) * rr, c0, 1); } break;
      }
      case 'prism': {   // Prisma: Sechseck mit regenbogenfarbigen Facetten
        trail(c1, 2, 0.1); g.globalAlpha = 1; const cols = ['#ff9ad0', '#9ad0ff', '#fff0a0', '#a0ffc0', '#e0b8ff', '#ffffff'], a = age * 5;
        for (let i = 0; i < 6; i++) { const a0 = a + (i * Math.PI) / 3; for (let k = 1; k < q(6); k++) { px1(px + Math.cos(a0) * k, y + Math.sin(a0) * k, cols[i], Math.max(1, Math.round(q(2.4) * (1 - k / q(7))))); } }
        disc(g, px, y, q(2.2), c0); break;
      }
      default: { trail(c1, 2.4, 0.15); g.globalAlpha = 0.3; disc(g, px, y, q(6), c1); g.globalAlpha = 1; disc(g, px, y, q(4), c1); disc(g, px - 1, y - 1, q(2), c0); }
    }
    g.globalAlpha = 1;
  }

  // ─────────── Treffer-Effekte ───────────
  drawImpact(g: CanvasRenderingContext2D, im: Impact) {
    const f = SPR(im.y), cx = X(im.x, im.y), gy = Y(im.y), cy = gy - im.z;
    if (im.t < 0) return;
    const p = clamp(im.t / im.max, 0, 1);
    const pxl = (x: number, yy: number, col: string, w = 1) => { g.fillStyle = col; g.fillRect(R(x), R(yy), w, w); };
    if (im.kind === 'pillar') {   // Säule: Licht, Feuer, Wasser, Geist – steigt schnell auf und zerfällt
      const hgt = 120 * f * Math.min(1, p * 4) * (1 - 0.3 * p), wd = im.r * sc(im.y) * 0.55 * (1 - p * 0.7);
      g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < hgt; k += 2) { const w = wd * (1 - (k / hgt) * 0.35) * (0.8 + 0.2 * Math.sin(k * 0.3 + this.time * 30)); g.globalAlpha = (1 - p) * 0.55; g.fillStyle = im.c1; g.fillRect(R(cx - w), R(gy - k), R(w * 2), 2); g.globalAlpha = (1 - p) * 0.8; g.fillStyle = im.c2; g.fillRect(R(cx - w * 0.4), R(gy - k), R(w * 0.8), 2); }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; return;
    }
    if (im.kind === 'spikes') {   // Stacheln brechen aus dem Boden (Eis, Kristall, Stein, Erde, Dornen)
      const n = im.big ? 9 : 6, rr = im.r * sc(im.y);
      for (let i = 0; i < n; i++) {
        const a = im.ang + (i / n) * 6.28 + (i % 2) * 0.3, d = rr * (0.25 + 0.7 * ((i * 37) % 10) / 10), bx = cx + Math.cos(a) * d, by = gy + Math.sin(a) * d * TILT;
        const hh = (14 + ((i * 53) % 12)) * f * Math.sin(Math.PI * Math.min(1, p * 1.5)) * (p > 0.66 ? 1 - (p - 0.66) * 3 : 1), bw = Math.max(2, 4 * f);
        g.globalAlpha = clamp(1.3 - p, 0, 1);
        for (let k = 0; k < hh; k += 1) { const w = bw * (1 - k / (hh + 1)); g.fillStyle = k > hh * 0.6 ? im.c2 : im.c1; g.fillRect(R(bx - w / 2), R(by - k), Math.max(1, R(w)), 1); }
        pxl(bx - 1, by - hh, '#ffffff');
      }
      g.globalAlpha = 1; return;
    }
    if (im.kind === 'shock') {   // Druckwelle: dicker Ring mit Füllung, weitet sich und verblasst
      const rr = im.r * sc(im.y) * (0.15 + 0.85 * Math.sqrt(p));
      g.globalAlpha = clamp(0.35 * (1 - p), 0, 1); disc(g, cx, gy, R(rr), im.c1, R(rr * TILT));
      g.globalAlpha = clamp(1.1 - p, 0, 1); g.fillStyle = im.c2;
      for (let i = 0; i < 70; i++) { const a = (i / 70) * 6.28; g.fillRect(R(cx + Math.cos(a) * rr), R(gy + Math.sin(a) * rr * TILT), 3, 2); g.fillRect(R(cx + Math.cos(a) * rr * 0.93), R(gy + Math.sin(a) * rr * 0.93 * TILT), 2, 2); }
      g.globalAlpha = 1; return;
    }
    if (im.kind === 'vortex') {   // Wirbel: Spiralarme (Sog beim Dunkel, Aufwind beim Wind)
      const rr = im.r * sc(im.y), up = im.ang === 1;
      g.globalAlpha = clamp(1.2 - p, 0, 1);
      for (let arm = 0; arm < 3; arm++) for (let k = 0; k < 26; k++) {
        const t = k / 26, a = arm * 2.1 + this.time * 9 + t * 5 * (up ? -1 : 1), d = rr * (up ? 0.3 + t * 0.7 : 1 - t * 0.9);
        pxl(cx + Math.cos(a) * d, gy + Math.sin(a) * d * TILT - (up ? t * 50 * f : 0), k % 3 ? im.c1 : im.c2, 2);
      }
      if (!up) disc(g, cx, gy, R(rr * 0.22 * (1 - p)), '#08040f', R(rr * 0.22 * (1 - p) * TILT));
      g.globalAlpha = 1; return;
    }
    if (im.kind === 'scorch') {
      const rr = R(im.r * sc(im.y) * 0.85), fa = clamp(1 - p * 1.2, 0, 1);
      g.globalAlpha = fa * 0.2; disc(g, cx, gy, rr, '#6a5a38', R(rr * TILT)); g.globalAlpha = fa * 0.32; disc(g, cx, gy, R(rr * 0.55), im.c1, R(rr * 0.55 * TILT)); g.globalAlpha = 1;
      if (p < 0.5) { g.fillStyle = im.c2; for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28 + this.time * 8; g.fillRect(R(cx + Math.cos(a) * rr * 0.7), R(gy + Math.sin(a) * rr * 0.7 * TILT), 1, 1); } }
      return;
    }
    if (im.kind === 'groundring') {
      const rr = im.r * sc(im.y) * (0.3 + 0.7 * p);
      g.globalAlpha = clamp(1 - p, 0, 1); g.fillStyle = im.c1;
      for (let i = 0; i < 60; i++) { const a = (i / 60) * 6.28; g.fillRect(R(cx + Math.cos(a) * rr), R(gy + Math.sin(a) * rr * TILT), 2, 1); }
      g.globalAlpha = 1; return;
    }
    if (im.kind === 'ring') {
      const rr = im.r * f * (0.25 + 0.75 * p);
      g.globalAlpha = clamp(1 - p, 0, 1); g.fillStyle = im.c1;
      for (let i = 0; i < 40; i++) { const a = (i / 40) * 6.28; g.fillRect(R(cx + Math.cos(a) * rr), R(cy + Math.sin(a) * rr), 2, 2); }
      g.globalAlpha = 1; return;
    }
    if (im.kind === 'claw') {
      const prog = clamp(p * 3, 0, 1); g.globalAlpha = clamp(1.6 - p * 1.6, 0, 1);
      for (let i = -1; i <= 1; i++) {
        const ox = i * 6 * f;
        for (let k = 0; k < 16 * prog; k++) {
          const t = k / 16; g.fillStyle = k > 12 ? '#ffe880' : '#ffffff';
          g.fillRect(R(cx + ox - 8 * f + t * 16 * f), R(cy - 10 * f + t * 20 * f), 2, 2);
        }
      }
      g.globalAlpha = 1; return;
    }
    // star: Strahlenkranz
    const len = (im.r * (0.5 + 0.8 * p)) * f, n = im.big ? 10 : 6;
    g.globalAlpha = clamp(1.4 - p * 1.4, 0, 1);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28 + im.ang * 0.2, l = len * (i % 2 ? 0.55 : 1);
      g.fillStyle = i % 2 ? im.c1 : im.c2;
      for (let k = len * 0.25; k < l; k += 1) g.fillRect(R(cx + Math.cos(a) * k), R(cy + Math.sin(a) * k), 2, 2);
    }
    if (p < 0.5) disc(g, cx, cy, Math.max(1, R(im.r * 0.4 * f * (1 - p * 2))), im.c2);
    g.globalAlpha = 1;
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
    g.fillStyle = side === 0 ? '#58c8ff' : '#ff6a6a'; g.fillRect(x, y + 1, 3, h - 2);   // Teamfarbe: blau = du, rot = Gegner
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
    if (m.counterT > 0) tag('KONTER', '#b8901c');
    if (m.boss) tag('BOSS', '#a01830');
    if (m.own) tag('HEIM+', '#2f8a3a');
    if (m.rage) tag('WUT', '#c02020');
    if (m.shield > 0) tag('SCH', '#3a8ab8');
    if (m.buffT > 0) tag('ANG+', '#b8501c');
    if (m.burn > 0) tag('BRT', '#c04818');
    if (m.psn > 0) tag('GFT', '#8a3098');
    if (m.recovering) tag('ERHOLT SICH', '#2f8a3a');
    if (m.flow > 0) tag('FLOW ' + m.flow, '#1c7a90');
    if (m.combo >= 2) tag('KOMBO ' + m.combo, '#a06a10');
    for (const [k, lbl] of [['atk', 'A'], ['def', 'V'], ['spe', 'T']] as const) { const n = m.stage[k]; if (n) tag(lbl + (n > 0 ? '+' : '-') + Math.abs(n), n > 0 ? '#2f8a3a' : '#a02838'); }
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
    if (this.showMap) this.drawMinimap(g, b);
    drawText(g, b.map.name.toUpperCase(), 4, VH - 38, '#ffffff', 1, '#10141c');
    if (b.mod.id !== 'none') drawText(g, 'WETTER: ' + b.mod.name.toUpperCase(), 4, VH - 30, '#f8d030', 1, '#10141c');
    this.box(g, VW - 91, VH - 31, 88, 29, pm, b, 0);
    { const o = p.order, label = o ? (o.kind === 'hold' ? 'STELLUNG' : o.kind === 'attack' ? 'ANGRIFF!' : 'LAUFEN') : 'AUTO', col = o ? (o.kind === 'attack' ? '#ff8a70' : '#ffe060') : '#a8e0b8';
      drawText(g, label, VW - 4 - textWidth(label), VH - 40, col, 1, '#10141c'); }
    if (b.choosing) {
      const by = Math.round(VH * 0.38);
      g.fillStyle = 'rgba(10,10,20,.6)'; g.fillRect(0, by, VW, 30);
      const t1 = 'WÄHLE DEIN NÄCHSTES', t2 = 'MONSTER';
      drawText(g, t1, R((VW - textWidth(t1)) / 2), by + 8, '#f8d030', 1, '#000');
      drawText(g, t2, R((VW - textWidth(t2)) / 2), by + 18, '#fff', 1, '#000');
    }
  }
}
