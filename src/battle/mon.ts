import { SPECIES, NATURES, SpeciesDef, TacticId, isSingle, singleGrowth } from '../data/species';
import { MOVES, MoveDef } from '../data/moves';
import { AMULETS, AmuletDef } from '../data/items';
import type { Synergy } from '../data/synergy';
import { MoveState, tunedMove, SLOT_WEIGHT, RULES } from '../data/mastery';

export type MonState =
  | 'ready' | 'windup' | 'active' | 'recover' | 'dodge'
  | 'stagger' | 'faint' | 'recall' | 'summon' | 'benched';

/** Globale Skalierung, damit Echtzeitkämpfe ~30–60 s dauern statt 5 s. */
export const HP_SCALE = 3.0;
/** Kleine Kämpfe bekommen mehr KP, damit jeder Kampf etwa 1–2 Minuten dauert (1 gegen 1 wie 3 gegen 3). */
export const sizeHpMul = (n: number) => (n <= 1 ? 2.1 : n === 2 ? 1.45 : n === 3 ? 1.1 : n === 4 ? 1.0 : 0.92);

export type Stat = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export const STATS: Stat[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
export const STAT_NAMES: Record<Stat, string> = { hp: 'KP', atk: 'Angriff', def: 'Verteidigung', spa: 'Spez.-Angriff', spd: 'Spez.-Vert.', spe: 'Tempo' };
export type Bonus = Record<Stat, number>;
export const noBonus = (): Bonus => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
export const BONUS_STEP = 0.04, BONUS_MAX = 5;     // Training: +4 % je Stufe, höchstens 5 Stufen

export interface MonOpts {
  bonus?: Bonus; amulet?: string | null;
  hpFrac?: number;          // Start-KP-Anteil (Liga: KP bleiben erhalten); 0 = K.O.
  boss?: boolean; hpMul?: number;
  moves?: string[];         // ausgerüstete Attacken in Rangfolge (sonst Standard der Art)
  moveStates?: Record<string, MoveState>;   // Stufen, Spezialisierungen, Einsatzregeln
  bondLvl?: number;         // Bindungsstufe (0..3)
}

/** Werte eines Monsters (Spiel- und Oberflächen-Code nutzen dieselbe Rechnung). */
export function computeStats(speciesId: string, level: number, bonus?: Bonus, amulet?: string | null, hpMul = 1) {
  const sp = SPECIES[speciesId], bn = bonus ?? noBonus();
  const gr = isSingle(speciesId) ? singleGrowth(level) : 1;
  const b = gr === 1 ? sp.base : { hp: sp.base.hp * gr, atk: sp.base.atk * gr, def: sp.base.def * gr, spa: sp.base.spa * gr, spd: sp.base.spd * gr, spe: sp.base.spe * gr };
  const stat = (v: number, k: Stat) => Math.floor(((2 * v * level) / 100 + 5) * (1 + BONUS_STEP * bn[k]));
  const am = amulet ? AMULETS[amulet] : undefined;
  const maxHp = Math.round((Math.floor((2 * b.hp * level) / 100) + level + 10) * HP_SCALE * (1 + BONUS_STEP * bn.hp) * (am?.hpMul ?? 1) * hpMul);
  return { maxHp, atk: stat(b.atk, 'atk'), def: stat(b.def, 'def'), spa: stat(b.spa, 'spa'), spd: stat(b.spd, 'spd'), spe: stat(b.spe, 'spe') };
}

let uid = 1;

export class Mon {
  uid = uid++;
  ownerId = 0;      // Verweis auf den Spielstand-Eintrag
  fought = false;   // war im Kampf aktiv (für Erfahrung)
  sp: SpeciesDef;
  moves: MoveDef[];
  maxHp: number; hp: number; lagHp: number;
  atk: number; def: number; spa: number; spd: number; spe: number;
  baseSpeed: number;
  amulet: AmuletDef | null;
  boss = false; rage = false;
  terrain: 'water' | 'lava' | 'grass' | null = null;   // steht gerade in diesem Gelände
  own = false;               // … und es ist das eigene Element
  regenAcc = 0;
  counterT = 0;              // Konter-Fenster nach gelungenem Ausweichen (Sekunden)
  punishT = 0;               // verpatzter Angriff: längere Erholzeit
  lastReg = -9;
  lastDodge = -9;            // Kampfzeit des letzten Ausweichens
  stage = { atk: 0, def: 0, spe: 0 };   // Werte-Stufen (−3 … +3), verfallen beim Auswechseln
  shield = 0; shieldT = 0; shieldAt = -9;   // shieldAt: Kampfzeit der Aktivierung (für Parade)   // Schild-Befehl: nimmt Schaden auf
  buffT = 0;                 // Anfeuern: +25 % Schaden
  since = 0;                 // Kampfzeit, zu der das Monster aufs Feld kam
  speedT = 0;                // Tempo-Kristall: schneller
  bondLvl = 0; survived = false; traitShown = false;   // Bindung, „Durchhalten“ schon genutzt, Wesens-Hinweis gezeigt

  side: 0 | 1 = 0;
  x = 0; y = 0; vx = 0; vy = 0; kx = 0; ky = 0;
  face: 1 | -1 = 1;
  look = 0;                  // Blickrichtung (rad)
  dirIdx = 0;                // Renderer: aktuelle Blickrichtung (0=S, 1=SE, 2=E … gegen den Uhrzeigersinn)
  aim = 0;

  state: MonState = 'benched';
  t = 0;
  move: MoveDef | null = null;
  moveSerial = 0;
  hitDone = false;
  dashLeft = 0; dashDx = 0; dashDy = 0;
  tickT = 0;

  cd: Record<string, number> = {};
  moveW: Record<string, number> = {};   // KI-Gewicht je Attacke (Platz in der Rangfolge × Einsatzregel)
  burn = 0; burnT = 0; para = 0; psn = 0; psnT = 0;
  invuln = 0; dodgeCd = 0; flash = 0; stagger = 0;
  walkT = 0; moving = false;

  // KI-Zustand
  think = 0.3; orbit: 1 | -1 = 1; orbitT = 1; retreatT = 0; forced = 0;
  forcedId: string | null = null;   // vom Trainer befohlene Attacke
  elixir = false;                    // Angriffs-Elixier: +20 % Schaden, solange auf dem Feld
  seen = new Set<number>();
  decided = new Set<number>(); want = new Set<number>();   // Entscheidungen zu Kristallen/Unwettern (Id -> gewollt?)
  react: { at: number; kind: 'proj' | 'zone' | 'melee'; dir: number; cx: number; cy: number } | null = null;
  evade: { x: number; y: number; r: number; until: number } | null = null;
  man: { k: 'strafe' | 'flank' | 'kite' | 'rush' | 'roam'; until: number; dist: number; th: number; sign: 1 | -1; tx: number; ty: number } | null = null;   // aktuelles Bewegungsmanöver

  constructor(public speciesId: string, public level: number, public nature: string, o: MonOpts = {}) {
    this.sp = SPECIES[speciesId];
    this.moves = (o.moves?.length ? o.moves : this.sp.moves).filter((id) => MOVES[id]).map((id) => tunedMove(MOVES[id], o.moveStates?.[id]));
    this.moves.forEach((mv, i) => { this.moveW[mv.id] = (SLOT_WEIGHT[i] ?? 0.9) * RULES[o.moveStates?.[mv.id]?.rule ?? 'auto'].w; });
    this.amulet = o.amulet ? AMULETS[o.amulet] ?? null : null;
    this.boss = !!o.boss; this.bondLvl = o.bondLvl ?? 0;
    const st = computeStats(speciesId, level, o.bonus, o.amulet, (o.hpMul ?? 1) * (o.boss ? 1.2 : 1));
    this.maxHp = st.maxHp; this.atk = st.atk; this.def = st.def; this.spa = st.spa; this.spd = st.spd; this.spe = st.spe;
    this.hp = Math.max(0, Math.min(this.maxHp, Math.round(this.maxHp * (o.hpFrac ?? 1)))); this.lagHp = this.hp;
    const spe = Math.floor(((2 * this.sp.base.spe * level) / 100 + 5)); void spe;
    this.baseSpeed = 1.14 * (36 + this.sp.base.spe * 0.6) * (NATURES[nature]?.speed ?? 1) * (this.amulet?.speedMul ?? 1);
    for (const m of this.moves) this.cd[m.id] = 0;
  }

  get alive() { return this.hp > 0; }
  get hpFrac() { return this.hp / this.maxHp; }
  /** Kann gerade getroffen werden? */
  get targetable() {
    return this.alive && this.invuln <= 0 && this.state !== 'recall' && this.state !== 'summon'
      && this.state !== 'faint' && this.state !== 'benched';
  }
  get onField() { return this.state !== 'benched'; }
  get special(): MoveDef | undefined { return this.moves.find((m) => m.special); }
}

export type Tactic = TacticId;

/** Kosten der Manager-Befehle (Fokus) */
export const FOCUS = { max: 100, start: 40, regen: 4.5, special: 30, move: 15, shield: 25, buff: 25, dodge: 15 };

export class Trainer {
  active: Mon | null = null;
  tactic: Tactic = 'balanced';
  baseTactic: Tactic = 'balanced';   // Grundplan der KI
  switchCd = 0; cmdCd = 0; itemCd = 0; potions = 2; supers = 0; focusPots = 0; elixirs = 0;
  focus = FOCUS.start;
  syn: Synergy[] = [];     // Team-Synergien
  /** Befehl des Spielers: hold = Stellung beziehen und halten, go = nur hinlaufen (Kristall), attack = den Gegner angreifen */
  order: { kind: 'hold' | 'go' | 'attack'; x: number; y: number; until: number } | null = null;
  focusRegenMul = 1;       // z. B. Boss-Trainer laden schneller
  pending: number | null = null;
  chooseT = 0;           // Auswahl nach K.O. (KI)
  aiT = 0;
  lastX = 0; lastY = 0;
  constructor(public side: 0 | 1, public name: string, public team: Mon[], public auto: boolean) {
    team.forEach((m) => (m.side = side));
  }
  get aliveCount() { return this.team.filter((m) => m.alive).length; }
}
