import { SPECIES, LEARNSETS, baseForm } from './species';
import { MOVES } from './moves';
let bad = 0;
for (const id of Object.keys(SPECIES)) {
  const ls = LEARNSETS[baseForm(id)];
  if (!ls) { console.log('Keine Lernliste:', id); bad++; continue; }
  const ids = ls.map(([m]) => m);
  for (const m of ids) if (!MOVES[m]) { console.log('Attacke fehlt:', id, m); bad++; }
  if (new Set(ids).size !== ids.length) { console.log('Dublette:', id); bad++; }
  for (const m of SPECIES[id].moves) if (!MOVES[m]) { console.log('Standard-Attacke fehlt:', id, m); bad++; }
}
console.log('Arten:', Object.keys(SPECIES).length, '· Attacken:', Object.keys(MOVES).length, '· Fehler:', bad);
