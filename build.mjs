// Baut alles zu EINER selbstständigen dist/index.html (JS + CSS inline) – direkt auf dem Handy öffnbar.
import { build, context } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import http from 'http';

const serve = process.argv.includes('--serve');
const opts = { entryPoints: ['src/main.ts'], bundle: true, minify: !serve, format: 'iife', target: 'es2020', loader: { '.png': 'dataurl' }, write: false, logLevel: 'info' };

function emit(js) {
  const html = readFileSync('src/web/index.html', 'utf8')
    .replace('/*CSS*/', () => readFileSync('src/web/style.css', 'utf8'))
    .replace('/*JS*/', () => js.replace(/<\/script>/g, '<\\/script>'));
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/index.html', html);
  console.log('dist/index.html', (html.length / 1024).toFixed(1) + ' KB');
}

if (serve) {
  const ctx = await context({ ...opts, plugins: [{ name: 'emit', setup(b) { b.onEnd((r) => { if (r.outputFiles) emit(r.outputFiles[0].text); }); } }] });
  await ctx.watch();
  http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(readFileSync('dist/index.html')); }).listen(8080, '0.0.0.0', () => console.log('Dev: http://localhost:8080'));
} else {
  const r = await build(opts);
  emit(r.outputFiles[0].text);
}
