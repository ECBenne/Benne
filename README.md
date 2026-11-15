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

## v0.7
- Kampfdauer 1–2 Minuten bei jeder Teamgröße (`sizeHpMul`, Level-Ausgleich, Finale ab 90 s in `battle.ts`).
- Attacken-Leiste im Kampf: jede ausgerüstete Attacke direkt befehlen (auch vormerken).
- Tutorial-Kampf (`Game.startTutorial`), Monster nur aus Kisten (`openChest` in `league.ts`), Schlüssel aus Boss, Raid, Turmwächter.
- Neue Items (Fokus-Trank, Angriffs-Elixier) und Amulette (Dornenpanzer, Wutstein, Wechselband, Heilblatt). Raid-Modus.

## v0.8: Attacken-System
Kein direktes Befehlen einzelner Attacken mehr (nur Spezial). Tiefe liegt im Ausrüsten (`src/data/mastery.ts`, `src/ui/moves.ts`):
Rangfolge der vier Plätze (KI-Gewicht), fünf Stufen je Attacke (Attackenpunkte: 1 pro Level, Lehrbücher),
Spezialisierungen auf Stufe 3 und 5, Einsatzregel (Normal/Oft/Selten), Schriftrollen für zusätzliche Attacken.

## v0.9
- Spielstände: drei Plätze (`loadSlot`/`deleteSlot` in `src/state.ts`, Bildschirm `Game.showSlots`).
- Werte-Stufen wie in den Vorbildern (`applyStage` in `battle.ts`): Angriff, Verteidigung, Tempo ±3, verfallen beim Auswechseln.
  Neue Attacken-Art `status` (Gegner schwächen), `self` mit `stages` (sich stärken), Nebeneffekte `foeStage` bei Treffern.

## v1.0 – Phase 1 (Kämpfe retten)
Konter-System (`registerDodge` in `battle.ts`): erfolgreiches Ausweichen → Konter-Fenster (+30 %, defensiv +45 %), Strafe für verfehlte Nahkämpfer.
Taktiken ändern echte Werte (Angriff +8 % Schaden, Defensiv −8 % erlittener Schaden). Gegner-Trainer wechseln die Taktik je nach Lage.
Warnzeichen bei gepanzerten Attacken, „GEBLOCKT −N“, Konter-/Block-Statistik. Test: `node tools/counter.mjs <ordner>`.
