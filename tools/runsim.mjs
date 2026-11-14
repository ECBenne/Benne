import { build } from 'esbuild';
import { pathToFileURL } from 'url';
await build({ entryPoints: ['src/runsim.ts'], bundle: true, format: 'esm', platform: 'node', outfile: 'dist/runsim.mjs', logLevel: 'warning', loader: { '.png': 'empty' } });
await import(pathToFileURL(process.cwd() + '/dist/runsim.mjs').href);
const n = +(process.argv[2] ?? 30), tier = +(process.argv[3] ?? 1), team = +(process.argv[4] ?? 1), lvl = +(process.argv[5] ?? 10);
const starters = ['glimmdra', 'tropfling', 'knoespling'];
let clear = 0, layers = [];
for (let i = 0; i < n; i++) { const r = globalThis.simulateRun(1000 + i, tier, starters[i % 3], team, lvl); if (r.cleared) clear++; layers.push(r.layer); }
console.log(`Stufe ${tier}, Team ${team}, Start-Lv ${lvl}: ${clear}/${n} Läufe geschafft | Ø erreichte Etappe ${(layers.reduce((a, b) => a + b, 0) / n).toFixed(1)} von 8`);
const hist = {}; for (const l of layers) hist[l] = (hist[l] || 0) + 1; console.log('Scheitern/Ende bei Etappe:', JSON.stringify(hist));
