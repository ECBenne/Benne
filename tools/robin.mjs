// Jeder gegen jeden (1 gegen 1, Auto-Kampf): Siegquote je Linie bei einem Level. node tools/robin.mjs <Kämpfe pro Paarung> <Level> [Arena]
import { build } from 'esbuild';
import { pathToFileURL } from 'url';
await build({ entryPoints: ['src/sim.ts'], bundle: true, format: 'esm', platform: 'node', outfile: 'dist/sim.mjs', logLevel: 'warning' });
await import(pathToFileURL(process.cwd() + '/dist/sim.mjs').href);
const n = +(process.argv[2] ?? 10), lvl = +(process.argv[3] ?? 14), arena = process.argv[4] ?? 'meadow';
const L = ['glimmdra', 'tropfling', 'knoespling', 'funkelkrabb', 'kieselbud', 'flockfiep', 'fetzling', 'knospenkrab', 'raureif', 'dunstkalmar', 'windstelz', 'sporenschleim', 'bronzepanzer', 'lichtglocke', 'duenenhupf', 'quakustik', 'mondschweif', 'drusella'];
const w = Object.fromEntries(L.map((x) => [x, 0])), g = { ...w };
const secs = [];
for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
  const r = globalThis.runSim(n, lvl, 1, [L[i]], [L[j]], arena);
  const a = r.filter((x) => x.winner === 0).length, b = r.filter((x) => x.winner === 1).length;
  w[L[i]] += a; w[L[j]] += b; g[L[i]] += n; g[L[j]] += n; secs.push(...r.map((x) => x.secs));
}
console.log(`Level ${lvl} | Ø Dauer ${(secs.reduce((a, b) => a + b, 0) / secs.length).toFixed(0)} s`);
console.log(L.map((x) => x + ' ' + Math.round((100 * w[x]) / g[x]) + '%').join(' | '));
