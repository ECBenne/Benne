// Prüft Datenkonsistenz: Lernlisten ohne Dubletten, alle Attacken vorhanden, Level aufsteigend
import { build } from 'esbuild';
import { pathToFileURL } from 'url';
await build({ entryPoints: ['src/data/check.ts'], bundle: true, format: 'esm', platform: 'node', outfile: 'dist/check.mjs', logLevel: 'warning' });
await import(pathToFileURL(process.cwd() + '/dist/check.mjs').href);
