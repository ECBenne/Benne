// Nutzung: node tools/shot.mjs <url|datei> <out.png> [breite] [höhe] [wartezeit-ms]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [,, target, out, w = '420', h = '300', wait = '300'] = process.argv;
const url = target.startsWith('http') ? target : 'file://' + (target.startsWith('/') ? target : process.cwd() + '/' + target);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
p.on('console', m => console.log('console:', m.text()));
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(url);
await p.waitForTimeout(+wait);
await p.screenshot({ path: out });
await b.close();
