import { build } from 'esbuild';
import { pathToFileURL } from 'url';
await build({ entryPoints: ['src/runsim.ts'], bundle: true, format: 'esm', platform: 'node', outfile: 'dist/runsim.mjs', logLevel: 'warning', loader: { '.png': 'empty' } });
await import(pathToFileURL(process.cwd() + '/dist/runsim.mjs').href);
// node tools/cupsim.mjs <Läufe> <Cup> <Teamgröße> <Level>
const n = +(process.argv[2] ?? 12), cup = process.argv[3] ?? 'bronze', team = +(process.argv[4] ?? 2), lvl = +(process.argv[5] ?? 10);
const starters = ['glimmdra', 'tropfling', 'knoespling']; let win = 0; const hist = {};
for (let i = 0; i < n; i++) { const r = globalThis.simulateCup(500 + i, cup, starters[i % 3], team, lvl); hist[r] = (hist[r] || 0) + 1; if (r >= 3 && cup !== 'silver' && cup !== 'gold') win++; if (r >= 4) win++; }
console.log(`${cup} Team ${team} Lv ${lvl}: Ergebnis (erreichte Runde -> Anzahl)`, JSON.stringify(hist));
