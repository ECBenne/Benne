// Kurztest: lädt das Spiel, wählt einen Starter und fotografiert die Startseite
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices[process.argv[3] || 'iPhone SE'], hasTouch: true })).newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
await p.goto('file://' + process.cwd() + '/' + (process.argv[4] || 'dist/index.html')); await p.waitForTimeout(900);
await p.tap('text=NEUES SPIEL'); await p.tap('text=WÄHLEN'); for (let i = 0; i < 3; i++) await p.tap('text=WEITER'); await p.tap('text=VERSTANDEN!');
await p.waitForTimeout(900); await p.screenshot({ path: process.argv[2] });
console.log('Fehler:', errs); await b.close();
