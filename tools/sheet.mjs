// Zeigt alle Posen/Ansichten eines Pokémon vergrößert: node tools/sheet.mjs <species> <out.png>
import { build } from 'esbuild';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [,, sp, out] = process.argv;
await build({ entryPoints: ['src/sheet.ts'], bundle: true, format: 'iife', loader: { '.png': 'dataurl' }, outfile: 'dist/sheet.js', logLevel: 'warning' });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 420 } });
import { writeFileSync } from 'fs';
writeFileSync('dist/sheet.html', `<body style="margin:0;background:#dccb96"><canvas id=c width=250 height=105 style="width:1000px;height:420px;image-rendering:pixelated"></canvas><script>window.SP='${sp}'</script><script src="sheet.js"></script>`);
await p.goto('file://' + process.cwd() + '/dist/sheet.html');
await p.waitForTimeout(600); await p.screenshot({ path: out }); await b.close();
