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

Pflanzen-Reihe: `knoespling` → `laubpard` (Lv 14) → `maehnenflor` (Lv 22). Diese Sheets haben die Richtungen im Uhrzeigersinn ab Norden (7 Zeilen, NW wird aus NE gespiegelt):
`python3 tools/pack.py knoespling 0.264 7 8 N,NE,E,SE,S,SW,W`.
Typen: Feuer > Pflanze > Wasser > Feuer (Typeneffekt bewusst mild: ×1,1 / ×0,93).

## Spielprinzip (v0.4): Liga-Läufe
Etappenkarte (9 Etappen, Verzweigungen) mit Kampf, Elite, Rast, Händler, Ereignis und Boss. KP bleiben im Lauf erhalten.
Im Kampf: Fokus-Leiste → Spezial, Schild, Anfeuern, Ausweichen. Arena-Wetter, Amulette, Training, Anwerben, 4 Liga-Stufen.
`npm run sim` (Kämpfe) und `node tools/runsim.mjs <n> <stufe> <team> <level>` (ganze Läufe) zum Balancing.

## v0.5: App-Gerüst
Navigationsleiste (Start, Liga, Team, Shop, Mehr), Startseite mit animiertem Team, Monster-Detailseite,
Sammlung, Erfolge, Trainer-Rang, täglicher Bonus, Anleitung, Kampf-Tipps, Sterne-Wertung, Optionen.
Spieltest: `node tools/bot.mjs <ausgabeordner>`.

## v0.6: Spieltiefe
- Attacken lernen: 8 je Linie (`LEARNSETS` in `src/data/species.ts`), 4 ausgerüstet; neue Arten `self` (Heilung/Stärkung) und Flächenangriffe.
- Erfahrung für Monster und Spieler (`src/state.ts`), Spielmodi Liga, Turm, Übung (`src/ui/modes.ts`).
- Arenen mit Gelände (`src/data/maps.ts`): Felsen (Deckung, blockieren Geschosse), Wasser/Lava (nur passender Typ), hohes Gras.
- Tests: `node tools/bot.mjs <ordner>` (Komplettlauf), `node tools/maps.mjs <ordner>` (Arenen), `node tools/sim.mjs <n> <lv> <anzahl> <idsA> <idsB> <arena>`.
