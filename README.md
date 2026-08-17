# One Piece: Reise zum Piratenkönig 🏴‍☠️

Ein Open-World-Action-Browserspiel in der Welt von One Piece —
in **Ego-Perspektive im Minecraft-Stil** (blockige Voxel-3D-Welt).
Läuft ohne Build-Schritt direkt im Browser; Three.js liegt lokal im Repo.

## Spielen

Einfach die `index.html` im Browser öffnen — fertig.

Alternativ mit einem lokalen Server:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Der Spielstand wird automatisch im Browser gespeichert (localStorage).

## Features

- **Ego-Perspektive im Minecraft-Stil**: blockige 3D-Welt aus Voxeln (Three.js) —
  Maus zum Umsehen (Pointer Lock), WASD zum Laufen, Klick zum Angreifen,
  Leertaste zum Springen; Chunk-Streaming rund um den Spieler, Nebel und
  Himmel wechseln je Meereszone (Eastblue hell, Neue Welt sturmdunkel)
- **Echtzeit-Kampf direkt in der Welt**: Gegner streifen sichtbar über die Inseln und Meere,
  greifen an, weichen aus — Nahkampf, Frucht-Skills, Projektile, Schadenszahlen, Rückstoß,
  Statuseffekte (Brennen, Betäubung) und Boss-Kämpfe mitten in der offenen Welt
- **Riesige Welt nach One-Piece-Vorbild**: 31 Inseln in drei Meeren —
  **Eastblue** (Windmühlendorf, Shells Town, Loguetown …), **Grand Line/Paradies**
  (Alabasta, Skypiea, Water 7, Thriller Bark, Sabaody, Impel Down, Marineford …) und
  **Neue Welt** (Fischmenscheninsel, Dressrosa, Whole Cake, Wano, Elbaf, Laugh Tale)
- **35 Teufelsfrüchte** (Logia, Paramecia, Zoan) mit eigenen Skills und Passiv-Boni —
  versteckt in Schatztruhen, als seltene Gegner-Drops und beim Schwarzmarkt-Händler
  auf Sabaody (kaufen, verkaufen, Angebot neu würfeln) — Sammel-Fortschritt einsehbar
  im Menü unter „Früchte“ (auch nach Essen oder Verkauf dauerhaft vermerkt)
- **Kopfgeld-System**: Jeder Sieg erhöht dein Kopfgeld (Marine bringt mehr!), Bosse
  sorgen für riesige Sprünge — bis über 5 Milliarden Berry
- **Piraten-Rang**: dein Kopfgeld verleiht dir einen Titel von „Unbekannter Pirat“
  über Supernova und Warlord-Niveau bis „Kaiser der Meere“ und „König der Piraten“ —
  sichtbar im HUD und im Menü unter „Status“, mit Banner-Meldung beim Aufstieg
- **Fahndungsplakat**: im Menü unter „Fahndungsplakat“ ein waschechtes „Wanted“-Poster
  mit deinem Charakterportrait, Namen, aktuellem Kopfgeld und Piraten-Rang — als PNG
  herunterladbar
- **Geld-System**: Gegner droppen Berry, die du aufsammelst; Läden, Schiffe,
  Haki-Training und der Schwarzmarkt wollen bezahlt werden
- **28 Bosse** von Higuma über Crocodile, Doflamingo, Big Mom und Kaido bis zum
  Finale gegen Blackbeard auf Laugh Tale — Fortschritt einsehbar im Menü unter „Bosse“
- **Crew aufbauen**: 9 rekrutierbare Mitglieder (Zorro, Nami, Lysop, Sanji, Chopper,
  Robin, Franky, Brook, Jinbe) — sie laufen hinter dir her, geben passive Boni, und
  Zorro, Lysop & Jinbe kämpfen aktiv mit
- **Segeln**: Beiboot → Going Merry (Tiefsee der Grand Line) → Thousand Sunny
  (Sturmsee der Neuen Welt); auf dem Schiff feuerst du Kanonen ab, Marine-Patrouillen
  und Seekönige greifen an
- **Haki-Training** bei Rayleigh: Rüstungshaki, Observationshaki und die
  Königshaki-Schockwelle (Taste 3)
- **Eigener Charakter**: Name, Frisur, Farben, Strohhut — mit Live-Vorschau
- Weltkarte mit drei Meereszonen, Quest-Kompass im HUD, Autosave, Touch-Steuerung
- **Live-Minikarte**: runde Karte oben rechts im HUD zeigt ständig die Umgebung um
  den Spieler samt rotierendem Blickrichtungspfeil — Orientierung ohne Menü zu öffnen
- **Schnellreise**: von der Karte aus sofort zu jeder bereits entdeckten Insel springen,
  ohne erneut übers Meer zu segeln
- **Questlog**: die komplette Hauptgeschichte (23 Etappen von Ruffys erstem Beiboot
  bis Laugh Tale) im Menü unter „Quests“ einsehbar — erledigte, aktuelle und
  gesperrte Etappen auf einen Blick
- **Erfolge**: 20 Meilensteine (erstes Schiff, volle Crew, alle Früchte, alle Bosse,
  Levelmarken, Kopfgeld-Stufen bis zum Kaiser, König der Piraten …) im Menü unter
  „Erfolge“ einsehbar — Fortschritt wird automatisch erkannt, kein manuelles Freischalten
- **Soundeffekte**: per Web Audio API synthetisiert (keine Audiodateien nötig) —
  Treffer, Sprung, Skills, Levelaufstieg, Bosssieg, Berry-Aufsammeln
- **Statistik**: Lebenszeit-Werte im Menü unter „Statistik" — Spielzeit, besiegte
  Gegner (inkl. Bosse), Niederlagen, ausgeteilter/erlittener Schaden, insgesamt
  verdiente Berry, zurückgelegte Strecke und entdeckte Inseln
- **Einstellungen** (ESC → Einstellungen): Lautstärke, Stummschaltung,
  Mausempfindlichkeit, Sichtweite (Niedrig/Mittel/Hoch für schwächere Geräte) —
  gespeichert unabhängig vom Spielstand

## Steuerung

| Taste | Aktion |
|---|---|
| Maus | Umsehen (ins Spiel klicken zum Aktivieren) |
| WASD / Pfeiltasten | Laufen (relativ zur Blickrichtung) |
| Linksklick / J | Angreifen (auf dem Schiff: Kanone) |
| Leertaste | Springen |
| 1 / 2 | Teufelsfrucht-Skills |
| 3 | Königshaki-Schockwelle |
| E / Enter / Rechtsklick | Interagieren, Dialog weiter |
| ESC | Menü |

Auf Touch-Geräten: Steuerkreuz zum Laufen, Wischen auf dem Bild zum Umsehen,
plus Angriffs-, Skill- und Menü-Knöpfe.

## Projektstruktur

```
index.html        — Seite & UI-Overlays
style.css         — komplettes Styling
js/data.js        — Spieldaten: 31 Inseln, 35 Früchte, 28 Bosse, Gegner, Items, Quests, Erfolge
js/world.js       — Weltgenerierung (600×400 Kacheln), Kollision, Minimap
js/combat.js      — Echtzeit-Kampf: Gegner-KI, Projektile, Skills, Drops, Kopfgeld
js/render3d.js    — Voxel-Renderer: Chunks, Block-Figuren, Effekte, 3D-Labels
js/audio.js       — Soundeffekte (Web Audio API, synthetisiert)
js/main.js        — Engine: Spielschleife, Ego-Steuerung, Dialoge, Menüs, Speichern
js/lib/three.min.js — Three.js r128 (lokal, kein CDN nötig)
```

*Inoffizielles Fanprojekt. One Piece © Eiichiro Oda.*
