import { build } from 'esbuild';
import { pathToFileURL } from 'url';
await build({ entryPoints: ['src/skillsim.ts'], bundle: true, format: 'esm', platform: 'node', outfile: 'dist/skillsim.mjs', logLevel: 'warning', loader: { '.png': 'empty' } });
await import(pathToFileURL(process.cwd() + '/dist/skillsim.mjs').href);
// node tools/skilllevels.mjs <Kämpfe> <Level> <Level-Vorsprung Gegner> <Anzahl>
const n = +(process.argv[2] ?? 20), lvl = +(process.argv[3] ?? 18), plus = +(process.argv[4] ?? 0), cnt = +(process.argv[5] ?? 1);
console.log(`Automatik, Level ${lvl} gegen Level ${lvl + plus} (${cnt} Monster):`);
for (const sk of [0, 3, 6, 10]) { const r = globalThis.skillLevelSim(n, lvl, plus, cnt, sk); console.log(`  Fertigkeiten Stufe ${sk}: ${r.wins}/${n} Siege (Ø ${r.secs.toFixed(0)} s)`); }
