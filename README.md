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

## Phase 1 abgeschlossen
Vierte Taktik „Konter“, Parade (Schild kurz vor einem vollen Treffer: 0 Schaden, Angreifer bestraft, Konter-Fenster 5 s),
Typvorteil beim Einwechseln wird belohnt, KI nutzt Erholphasen und hält Abstand vor Nahkampf-Anläufen, Spezialangriffe mit Zeitlupe und Namen,
Kampflänge nach Bedeutung (`lenMulOf`: normal ×0,85, Elite ×1,12, Boss ×1,35). Tests: `tools/parry.mjs`, `tools/counter.mjs`.

## Phase 2 – Trainerduelle
- Teamplätze wachsen mit dem Spielerlevel (Level 1/3/6/10/15 für Platz 1–5), gesperrte Plätze sind im Team-Tab sichtbar.
- Gegner-Trainer haben eigene Profile (Stil, Lieblingstyp, Wesen, Spruch), im Scouting sichtbar.
- Rivale Kai auf Etappe 4: wählt sein Team passend zu deinem Anführer, wächst mit jedem Duell, Bilanz wird gezählt, Kistenschlüssel als Beute.
- Bosse bringen größere Teams (bis 5 Monster); HP-Skalierung je Teamgröße.
- Werkzeug: `node tools/rival.mjs <ordner>` erzeugt Screenshots von Team-Tab, Karte, Rivalen-Scouting.

## Phase 3 – Management vertiefen
- **Wesen mit Kampfwirkung:** Mutig = Kampfgeist (unter 50 % KP +12 % Schaden), Scheu = Wachsam (Ausweichen lädt 25 % schneller), Hastig = Flinkheit (25 % kürzere Erholung), Listig = Kalkül (doppelte Volltreffer-Chance), Ruhig (neu) = Zähigkeit (8 % weniger Schaden).
- **Bindung:** wächst mit Siegen (4/10/20): +4 % Schaden, „Durchhalten“ (einmal pro Kampf mit 1 KP überleben), ab Stufe 3 +8 % und 25 % Heilung dabei. Sichtbar im Monsterdetail und auf dem Ergebnis-Bildschirm.
- **Synergien:** gleiche Typen im Team (+6 % / +10 % Schaden dieses Typs), Feuer+Wasser+Pflanze = Dreiklang (Fokus lädt 15 % schneller). Gegner haben sie ebenfalls; Anzeige im Team-Tab und im Scouting.
- **Training sichtbar:** Monsterdetail und Rast zeigen den echten Wertezuwachs (z. B. `20 ▶ 21`).
- Werkzeug: `node tools/phase3.mjs <ordner>` (Screenshots).

## Phase 4 – Motivation und Karriere
- **Turniere** (Spielen → Turniere): 6 Cups mit festen Regeln – Bronze (max. 2 Monster), Feuer/Wasser/Pflanze (nur Gegner dieses Typs, passendes Wetter und Arena), Silber, Meisterschaft (bis 5 Monster, im Finale wartet Rivale Kai). 3–4 Runden, Gegner und Teamgröße wachsen pro Runde, Team erholt sich nur 30 %. Freischaltung über Spielerlevel (2/5/9/14). Pokal + Schlüssel (+ Amulett) beim ersten Sieg, Wiederholungen geben Münzen.
- **Rivale Kai** kehrt im Finale der Meisterschaft zurück (Bilanz zählt mit, wählt Typ-Konter gegen deinen Anführer).
- **Karriere-Bildschirm:** Rangleiter, Pokalschrank, Rivalen-Geschichte (ändert sich mit deinen Siegen) und Gesamtbilanz.
- Neue Erfolge: Pokalsieger, Pokalsammler, Meister der Liga, Rivalenbezwinger.
- Werkzeug: `node tools/cups.mjs <ordner>` spielt die Meisterschaft per Bot durch.

## Phase 5 – Feinschliff
- **Balancing der Turniere** per Simulation (`node tools/cupsim.mjs <Läufe> <cup> <Team> <Level>`): Typ-Cups schafft die Test-KI (ohne Befehle) in etwa der Hälfte der Läufe, Silber/Meisterschaft deutlich seltener – Menschen mit Taktik, Schild und Items sollten besser sein. Zwischen den Runden: +40 % KP (`CUP_HEAL`).
- **Bedienung am Smartphone:** alle Tippflächen mindestens 40 px (`node tools/touch.mjs`); Team-Karten im Kampf bei 3–5 Monstern ohne abgeschnittene Namen.
- **Kampftexte** am selben Monster stapeln sich statt sich zu überlagern.
- **Performance:** `node tools/perf.mjs` – 3 gegen 3 hält in Chromium auch mit 4-fach gedrosselter CPU 60 FPS (Headless-Messung, kein echtes Gerät).

## Neue Monster (Sprite-Paket Teil 1)
- 13 neue Monster aus `Monster_Sprites_Teil_1_von_2.zip`: **Elektro** Funkelkrabb → Sprungvolt → Donnerhirsch, **Stein** Kieselbud → Schichtgrub → Felswacht, **Eis** Flockfiep → Frostschnabel → Gletscherflug, **Geist** Fetzling → Schleierich → Nachtnaht, **Pflanze** Knospenkrab (Entwicklung folgt mit Teil 2).
- Neue Typen Stein/Eis/Geist (Typentabelle in `data/types.ts`), je Typ eine eigene Attackenfamilie (Salve, Nahkampf, Sturmangriff, Spezialstrahl, Kugel, Feld, Sturm, Schwächen/Stärken) und eigene Effektfarben.
- Import: `python3 tools/import-sheet.py <png> <id> <Zielgröße>` – findet die Figuren (auch wenn sie über den Zellrand ragen), skaliert auf Spielgröße, spiegelt Südost zu Südwest (die Sheets haben 7 statt 8 Richtungen), Palette statt Volltonfarben.
- Balancing: `node tools/robin.mjs <Kämpfe> <Level>` (jeder gegen jeden, 1 gegen 1).

## Teil 2: 12 weitere Monster, 200+ Attacken, mehr Dynamik
- **Monster:** Knospenkrab → Farnschreck → Orchideva (Pflanze) sowie 10 Einzelmonster: Raureif (Eis), Dunstkalmar (Geist), Windstelz (Wind), Sporenschleim (Gift), Bronzepanzer (Metall), Lichtglocke (Licht), Dünenhupf (Erde), Quakustik (Klang), Mondschweif (Dunkel), Drusella (Kristall). Einzelmonster wachsen mit dem Level wie eine ganze Entwicklungslinie (`singleGrowth`).
- **16 Typen** mit Typentabelle und Effekt-Tabelle (`TYPE_FX` in `data/types.ts`: Farben + Projektil-Stil je Typ). Neuer Status **Vergiftet**.
- **Attacken:** je Typ eine Familie mit 11 Attacken plus vier Signaturattacken mit neuen Mustern: **Kranz** (Schüsse in alle Richtungen), **Verfolger** (lenkende Kugeln), **Schauer** (viele Einschläge nacheinander), **Nova** (Druckwelle um das Monster, stößt den Gegner weg). Insgesamt 236 Attacken (`node tools/checkdata.mjs` prüft die Daten).
- **Optik:** jedes Element hat eigene Projektile (Eiskristall, Irrlicht, Brocken, Windklinge, Giftblase, Sägescheibe, Lichtstern, Schallring, Finsterkugel, Prisma), eigene Einschläge (Säulen, Stacheln, Wirbel, Druckwellen) und Strahlfarben. `node tools/fxshots.mjs <ordner> <Art> <Attacke,…>` löst Attacken gezielt aus und fotografiert sie.
- **Bewegung:** Monster wählen laufend Manöver (Kreisen, Umgehen, Zurückweichen, Vorstürmen, Umherlaufen) nach Wesen und Taktik, bewegen sich auch beim Aufladen und Erholen und stoßen sich voneinander ab. Messung: `node tools/sim.mjs …` zeigt Ø Abstand, Nähe-Anteil und Laufweg.

## Korrekturen nach Teil 2
- **Seitenvorteil behoben:** Die Update-Reihenfolge wechselt jeden Schritt, gleichzeitiges K.O. wird per Münzwurf entschieden (vorher gewann Seite 0 in gleichstarken 3-gegen-3-Kämpfen ~70 %, jetzt ~50–60 %).
- **Raid:** Boss-KP deutlich gesenkt (Start 0,9× statt 1,9×, +4 % je Stufe, Level +1 je 2 Siege). `node tools/raidsim.mjs <Läufe> <Stufe> <Team> <Level>` simuliert ihn (Test-KI ohne Befehle schafft Stufe 1 etwa in 40 %).
- **Liga:** Gegner-Level steigt in allen Stufen gleich (Etappe/5), Boss ab Stufe 2 mit gleich großem Team statt +1.
- **Laufen:** Monster hüpfen leicht beim Gehen (die Sheets enthalten kaum Laufbilder). Kranz-/Verfolger-Projektile größer.
- **Übung:** Gegner-Typ lässt sich für alle 16 Typen wählen. Sammlung: lange Namen werden gekürzt statt abgeschnitten.
- Die Simulationen (`runsim`, `cupsim`, `raidsim`) rüsten die Test-Spieler jetzt mit den stärksten Attacken aus statt mit den ersten vier.

## Der Kick: Konzept und Umsetzung (siehe `docs/KONZEPT.md`)
- **Große Arenen** (`ARENA` 312×436, Welt 400×680), Kamera folgt dem Geschehen. Karten wurden übertragen und mit weiterem Gelände ergänzt.
- **Kristalle und Unwetter** (`updateWorld` in `battle.ts`), KI sammelt und weicht aus. **Tippen** = Laufbefehl (`orderMove`), **Wischen** = Hechtrolle in diese Richtung, Kampftempo `PACE`.
- **Tagesaufgaben, Wochenziel, Tages-Bonus** (`systems/live.ts`, `ui/daily.ts`), Fortschritt aus Kampfwerten (`trackBattle`).
- **Offline:** Trainingslager, Expeditionen, Gratis-Beutel, Rückkehr-Bericht. Zeit kommt aus `now()` (`state.ts`, in Tests mit `clock.skew` verschiebbar).
- Tests: `node tools/world.mjs <ordner>` (Kristalle, Unwetter, Tippen), `node tools/daily.mjs <ordner>` (Aufgaben, Lager, Expeditionen mit Zeitsprung).

## Tutorial, Starter, Größen
- **Tutorial:** Anleitung mit 8 Seiten (Steuerung, Kristalle/Unwetter, Kisten, Tagesaufgaben) und geführter Übungskampf mit 10 Schritten: Spezial, Schild/Parade, Tippen zum Laufen, Wischen zur Hechtrolle, Kristall holen, Unwetter meiden, Taktik, Trank. Jeder Schritt lässt sich überspringen. Wiederholbar unter MEHR → „Tutorial wiederholen“. `node tools/tutorial.mjs <ordner>` spielt alles durch.
- **Erste Schritte:** Einstiegsliste im Start-Tab (Kampf gewinnen, Attacke aufstufen, Kiste öffnen, Lager/Expedition, Tagesaufgabe) mit Belohnungen.
- **Starter:** zur Wahl stehen nur Glimmdra, Tropfling und Knöspling; alles andere kommt aus Kisten (`STARTERS` in `game.ts`).
- **Größen:** Sprites werden nach dem geometrischen Mittel aus Höhe und Breite skaliert (Stufe 1 ≈ 40, Stufe 2 ≈ 48, Stufe 3 ≈ 55, Einzelmonster 44–50 px). Trefferradius und Effekthöhe der neuen Monster folgen daraus (`tools/import-sheet.py`).

## Endschliff (Version 1.0)
- **Wer bin ich, wer ist der Gegner:** Teamring unter jedem Monster (blau = du, rot = Gegner), Pfeil über dem Kopf mit „DU“ bzw. Trainername in den ersten Sekunden, farbige Streifen an den KP-Kästen, Randpfeile für Monster außerhalb des Bildes, Minikarte (Gelände, Kristalle, Unwetter, beide Monster, sichtbarer Ausschnitt; im Pausenmenü abschaltbar).
- **Sicherung:** Optionen → „Spielstand sichern / laden“ (Text kopieren und wieder einfügen).
- Lange Monsternamen brechen in Listen um statt abgeschnitten zu werden; Versionsanzeige 1.0.

## Touch-Steuerung (überarbeitet)
- **Tippen aufs Feld = Stellung:** das Monster läuft hin, bleibt dort stehen und kämpft von dort aus (Distanz halten, Deckung, Fallen stellen). Läuft nach 20 s oder per Tippen aufs eigene Monster zurück in die Automatik. Auf einen Kristall getippt läuft es nur hin und holt ihn.
- **Tippen auf den Gegner = Angriff** (10 s aggressiv nachsetzen). **Tippen aufs eigene Monster = Automatik.** Anzeige „AUTO / STELLUNG / ANGRIFF!“ über dem eigenen KP-Kasten, Zielring/Fähnchen im Feld, Tipp-Welle als Rückmeldung, kurzes Vibrieren.
- **Wischen = Hechtrolle** löst sofort aus (ab 24 px), die Kamera lässt sich im Kampf nicht mehr per Finger verschieben (sie folgt automatisch).
- Tutorial um „Angriff“ und „Automatik“ erweitert (12 Schritte).

## Können zählt (Skill-System)
- **Perfektes Ausweichen:** Wisch kurz vor dem Treffer (≤ 0,4 s) → „PERFEKT!“: Zeitlupe, Gegner taumelt, +30 Fokus, Ausweich-Rolle sofort wieder bereit, stärkster Konter (×1,3 zusätzlich), +1 Flow.
- **Flow** (bis 4 Stufen): +12 % Schaden und −9 % erlittener Schaden je Stufe; bauen Perfekt-Ausweichen, Parade (zusätzlich +25 Fokus) und Unterbrechen auf, klingt nach 8 s (dann alle 5 s eine Stufe) ab.
- **Unterbrechen** (Treffer während des Aufladens): ×1,4 Schaden, +10 Fokus, +1 Flow. **Lücke** (Treffer direkt nach seinem Angriff): ×1,2. **Kombo:** je Treffer in Folge ohne selbst getroffen zu werden +8 % (bis +48 %).
- **Warnflächen:** Angriffe des Gegners zeigen Fläche/Richtung (Fächer, Linie, Strahl); im letzten Moment leuchtet sie auf. Hinweisleiste: „JETZT WISCHEN“.
- Das automatische Ausweichen des eigenen Monsters ist schwächer (×0,4), gutes Ausweichen und Parieren muss man selbst machen.
- Neue Tagesaufgaben (perfekt ausweichen, unterbrechen, 5er-Kombo) und Ergebnis-Werte.
- Messung: `node tools/skillsim.mjs <Kämpfe> <Level> <Level-Vorsprung Gegner> <Anzahl>` (1 gegen 1, Level 15 gegen 18: Können 0 → 3 %, Können 1 → 50 % Siege; gleiches Level: 47 % → 90 %). Die Simulation bildet nur perfektes Ausweichen nach; echte Spieler können mehr (Pariere, Positionieren, Kristalle).
