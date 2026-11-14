import { SPECIES, NATURES, SpeciesDef, TacticId } from '../data/species';
import { MOVES, MoveDef } from '../data/moves';

export type MonState =
  | 'ready' | 'windup' | 'active' | 'recover' | 'dodge'
  | 'stagger' | 'faint' | 'recall' | 'summon' | 'benched';

/** Globale Skalierung, damit Echtzeitkämpfe ~30–60 s dauern statt 5 s. */
export const HP_SCALE = 2.0;

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

  side: 0 | 1 = 0;
  x = 0; y = 0; vx = 0; vy = 0; kx = 0; ky = 0;
  face: 1 | -1 = 1;
  aim = 0;

  state: MonState = 'benched';
  t = 0;
  move: MoveDef | null = null;
  moveSerial = 0;
  hitDone = false;
  dashLeft = 0; dashDx = 0; dashDy = 0;
  tickT = 0;

  cd: Record<string, number> = {};
  burn = 0; burnT = 0; para = 0;
  invuln = 0; dodgeCd = 0; flash = 0; stagger = 0;
  fx = { hurtT: 0 }; // Renderer-Hilfswerte
  walkT = 0; moving = false;

  // KI-Zustand
  think = 0.3; orbit: 1 | -1 = 1; orbitT = 1; retreatT = 0; forced = 0;
  seen = new Set<number>();
  react: { at: number; kind: 'proj' | 'zone' | 'melee'; dir: number; cx: number; cy: number } | null = null;
  evade: { x: number; y: number; r: number; until: number } | null = null;

  constructor(public speciesId: string, public level: number, public nature: string) {
    this.sp = SPECIES[speciesId];
    this.moves = this.sp.moves.map((id) => MOVES[id]);
    const b = this.sp.base;
    const stat = (v: number) => Math.floor((2 * v * level) / 100) + 5;
    this.maxHp = Math.round((Math.floor((2 * b.hp * level) / 100) + level + 10) * HP_SCALE);
    this.hp = this.maxHp; this.lagHp = this.hp;
    this.atk = stat(b.atk); this.def = stat(b.def); this.spa = stat(b.spa); this.spd = stat(b.spd); this.spe = stat(b.spe);
    this.baseSpeed = (28 + b.spe * 0.5) * (NATURES[nature]?.speed ?? 1);
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

export class Trainer {
  active: Mon | null = null;
  tactic: Tactic = 'balanced';
  switchCd = 0; cmdCd = 0; itemCd = 0; potions = 2; supers = 0;
  pending: number | null = null;
  chooseT = 0;           // Auswahl nach K.O. (KI)
  aiT = 0;
  lastX = 0; lastY = 0;
  constructor(public side: 0 | 1, public name: string, public team: Mon[], public auto: boolean) {
    team.forEach((m) => (m.side = side));
  }
  get aliveCount() { return this.team.filter((m) => m.alive).length; }
}
