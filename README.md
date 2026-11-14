# Arena Manager (Prototyp)

Echtzeit-Monster-Manager für Smartphones: Die Monster kämpfen per KI frei in der Arena,
du bist der Trainer (Team, Taktik, Wechsel, Spezial-Befehl, Tränke).

- `npm install && npm run build` → `dist/index.html` (eine einzige Datei, direkt im Handy-Browser spielbar)
- `npm run dev` → Dev-Server auf :8080, `npm run sim` → KI-gegen-KI-Balancing-Simulation
- Erweiterbar über Daten: `src/data/species.ts` (Monster), `src/data/moves.ts` (Attacken)

## Monster-Artwork
Das Spritesheet (8 Blickrichtungen × 7 Laufbilder) liegt als Quelle in `assets/mon/sheet.png`.
`tools/extract.py` stellt die Figuren frei, `tools/pack.py` packt sie zu `src/gfx/img/mon.png`
(heruntergerechnet, einheitliche Palette, Pixelart). Weitere Monster brauchen nur ein Sheet im gleichen Layout.
