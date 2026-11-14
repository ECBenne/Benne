import { buildSprite, Sprite } from './spriteBuilder';
import { PIKACHU_ART, CHARMANDER_ART } from './art';

const cache: Record<string, Sprite> = {};
const ARTS = { pikachu: PIKACHU_ART, charmander: CHARMANDER_ART };

export function getSprite(id: string): Sprite {
  if (!cache[id]) cache[id] = buildSprite((ARTS as any)[id]);
  return cache[id];
}
