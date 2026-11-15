// Misst, wie viel Können bringt: Seite 0 (Spieler, wie im Spiel mit schwächerem Auto-Ausweichen) mit Können s gegen Seite 1 (KI).
import { build } from 'esbuild';
import { pathToFileURL } from 'url';
await build({ entryPoints: ['src/skillsim.ts'], bundle: true, format: 'esm', platform: 'node', outfile: 'dist/skillsim.mjs', logLevel: 'warning', loader: { '.png': 'empty' } });
await import(pathToFileURL(process.cwd() + '/dist/skillsim.mjs').href);
// node tools/skillsim.mjs <Kämpfe> <Level Spieler> <Level-Vorsprung Gegner> <Anzahl>
const n = +(process.argv[2] ?? 20), lvl = +(process.argv[3] ?? 18), plus = +(process.argv[4] ?? 0), cnt = +(process.argv[5] ?? 1);
const out = [];
for (const s of [0, 0.5, 0.8, 1]) { const r = globalThis.skillSim(n, lvl, plus, cnt, s); out.push(`Können ${s}: ${r.wins}/${n} Siege (Ø ${r.perfects.toFixed(1)} perfekte Ausweicher, ${r.parries.toFixed(1)} Paraden, ${r.secs.toFixed(0)} s)`); }
console.log(`Level ${lvl} gegen Level ${lvl + plus}, ${cnt} Monster:\n  ` + out.join('\n  '));
