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

Weiterentwicklung: `assets/mon/glutdrax.png` (Glutdrax). Aufruf: `python3 tools/extract.py <tag> <alpha-schwelle> && python3 tools/pack.py <tag> 0.37`.

Dritte Stufe: `assets/mon/glutwyrm.png` (7 Richtungen × 8 Bilder; Süd-West wird aus Süd-Ost gespiegelt: `python3 tools/pack.py glutwyrm 0.37 7 8`).

Wasser-Reihe: `tropfling` → `flutdrax` (Lv 14) → `gischtwyrm` (Lv 22), Sheets in `assets/mon/`. Pack-Aufruf z. B. `python3 tools/pack.py tropfling 0.291 7 8` (Maßstab je Sheet, sodass die Stufen gleich groß wie die Feuer-Reihe sind).
