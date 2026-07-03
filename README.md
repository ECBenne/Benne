# One Piece: Reise zum Piratenkönig 🏴‍☠️

Ein 2D-Open-World-Browserspiel im Stil der klassischen Pokémon-Spiele —
komplett in Vanilla JavaScript/HTML5-Canvas, ohne Build-Schritt und ohne Abhängigkeiten.

## Spielen

Einfach die `index.html` im Browser öffnen — fertig.

Alternativ mit einem lokalen Server:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Der Spielstand wird automatisch im Browser gespeichert (localStorage).

## Features

- **Eigener Charakter**: Name, Frisur, Haar-/Haut-/Kleidungsfarbe und Strohhut frei wählbar
- **Offene Welt**: 13 Inseln zum Erkunden — vom Windmühlendorf über Loguetown und
  Alabasta bis nach Marineford und Laugh Tale
- **Segeln**: Kaufe Schiffe (Beiboot → Going Merry → Thousand Sunny), um seichtes Wasser,
  Tiefsee und Sturmsee zu überqueren
- **Rundenkämpfe im Pokémon-Stil**: Zufallskämpfe im hohen Gras und auf See gegen
  Banditen, Marine und Seekönige
- **12 Bosskämpfe**: Higuma, Käpt'n Morgan, Buggy, Kuro, Don Krieg, Arlong, Smoker,
  Wapol, Crocodile, Rob Lucci, Admiral Akainu — und das Finale gegen Blackbeard
- **Teufelsfrüchte**: 6 Früchte (Gum-Gum, Feuer, Donner, Frost, OP, Finster) in
  Schatztruhen versteckt — aber nur EINE kannst du essen!
- **Crew aufbauen**: Rekrutiere Zorro, Nami, Lysop, Sanji, Chopper, Robin, Franky und
  Brook — jedes Mitglied gibt einen passiven Bonus und läuft dir hinterher
- **Haki-Training**: Rüstungs-, Observations- und Königshaki bei Silvers Rayleigh
  in Loguetown trainieren
- **Kopfgeld-System**: Mit jedem besiegten Boss steigt dein Kopfgeld — bis du der
  König der Piraten bist!

## Steuerung

| Taste | Aktion |
|---|---|
| Pfeiltasten / WASD | Bewegen |
| E / Leertaste / Enter | Interagieren, Dialog weiter, Kampfaktion |
| ESC | Menü öffnen/schließen |

Auf Touch-Geräten wird automatisch ein Steuerkreuz mit A/B-Knöpfen eingeblendet.

## Projektstruktur

```
index.html    — Seite & UI-Overlays
style.css     — komplettes Styling
js/data.js    — Spieldaten: Inseln, NPCs, Bosse, Früchte, Items, Quests
js/world.js   — Weltgenerierung, Kollision, Rendering, Sprites, Minimap
js/battle.js  — rundenbasiertes Kampfsystem
js/main.js    — Engine: Spielschleife, Bewegung, Dialoge, Menüs, Speichern
```

*Inoffizielles Fanprojekt. One Piece © Eiichiro Oda.*
