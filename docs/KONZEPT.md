# Arena Manager – Konzept „Der Kick“

## Problem
- Spielt sich immer gleich: Kampf → Belohnung → Kampf. Es fehlt ein Grund, **heute** und **morgen** wiederzukommen.
- Die Arenen sind klein, im Kampf passiert wenig, alles geht Schlag auf Schlag, der Spieler greift kaum ein.
- Wenn man nicht spielt, passiert nichts.

## Leitidee
Drei Schleifen, die ineinandergreifen:

1. **Im Kampf (Sekunden):** Der Kampf ist ein Ereignis, bei dem du mitspielst – nicht nur zuschaust.
2. **Am Tag (Minuten):** Tagesaufgaben und ein Wochenziel geben dem Spielen ein Ziel und eine Serie.
3. **Zwischen den Sitzungen (Stunden):** Lager, Expeditionen und Beutel arbeiten für dich, auch offline.

## 1. Der Kampf: größer, belebter, steuerbar
| Idee | Wirkung |
|---|---|
| **Große Arenen** (+50 % Fläche, Kamera folgt) | Platz zum Ausweichen, Umgehen, Kreisen; Gelände gewinnt an Bedeutung. Jede Karte hat mehr Felsen, Wasser, Lava, Gras. |
| **Arena-Kristalle** (alle 9–14 s, max. 2) | Heilquelle (+20 % KP), Kraftkristall (+25 % Schaden), Fokusorb (+30 Fokus), Tempofeder (+35 % Tempo). Beide Seiten wollen sie → Wettlauf, Positionierung. |
| **Unwetter** (alle 24–34 s, im Finale häufiger) | 4–7 markierte Kreise (Meteore, Flutwellen, Dornen, Steinschlag, Gewitter je nach Karte), Einschlag nach 1,35 s, 7 % KP Schaden. Wer rechtzeitig läuft, bleibt heil. |
| **Tippen = Laufbefehl** | Dein Monster läuft zum Punkt (Kristall holen, Gefahr meiden, Gegner in eine Falle locken). Der Befehl hat Vorrang vor der KI-Bewegung. |
| **Wisch = Hechtrolle** | Schnelles Ausweichen in genau die Richtung, kostet Fokus. |
| **Kampftempo** | Attacken kommen ~20 % seltener, treffen dafür ~25 % härter (gleiche Kampfdauer, mehr Luft zum Reagieren). |
| **Hinweise** | Die Hinweisleiste erklärt Kristalle und Unwetter, solange man sie noch nicht genutzt hat. |

Die KI-Monster sammeln Kristalle ebenfalls ein und weichen Unwettern aus (Gegner meist, das eigene Monster nur manchmal – den Rest übernimmt der Spieler).

## 2. Der Tag: Aufgaben und Wochenziel
- **3 Tagesaufgaben** (leicht / mittel / schwer), jeden Tag neu, passend zum Spielerlevel. Beispiele: Siege, Paraden, Konter, Ausweichen, Spezialangriffe, Kristalle sammeln, Schaden, „Gewinne mit einem Feuer-Monster“, Kampf ohne K.O., Kampf ohne Unwetterschaden, Expedition losschicken, Kiste öffnen.
- **Tages-Bonus** für alle drei: 150 Münzen, 1 Kistenschlüssel, Spieler-EP.
- **Wochenziel:** 12 Siege → 320 Münzen, 2 Schlüssel, Beleber.
- Schlüssel bleiben selten (Quelle: Tagesbonus, Wochenziel, Expeditionen, Raids, Bosse) – Monster stecken weiter nur in Kisten.
- Übung und Tutorial zählen nicht für Siege, damit sich Ziele nicht ergaunern lassen.

## 3. Offline: das Spiel läuft weiter
- **Trainingslager** (1–4 Plätze je Spielerlevel): zugewiesene Monster sammeln bis zu 8 Stunden Erfahrung (≈14 % eines Levels pro Stunde) und Bindung (1 je 4 Stunden). Auch Team-Monster dürfen mit.
- **Expeditionen** (1–3 Plätze): Monster aus dem Kader reisen 30 Min / 2 Std / 8 Std. Ziele: Schatzsuche (Münzen), Erkundung (Erfahrung, Amulett oder Schriftrolle), Kristallhöhle (Schlüsselchance bis 70 %). Während der Reise sind sie nicht im Team.
- **Gratis-Beutel** alle 6 Stunden: Münzen, manchmal Trank oder Fokustrank.
- **Rückkehr-Bericht** beim Start: zeigt Lager, fertige Expeditionen, Beutel; „Alles abholen“ in einem Tipp.
- Start-Tab zeigt Punkte, sobald etwas bereit ist.

## Zeitplan der Umsetzung
1. Große Arenen, Kristalle, Unwetter, Laufbefehl, Wisch-Ausweichen, Kampftempo.
2. Tagesaufgaben, Wochenziel, Tages-Bonus.
3. Lager, Expeditionen, Beutel, Rückkehr-Bericht.
4. Prüfen (Bot, Simulation, Bildschirmfotos), Balancing, Doku.

## Offene Ideen für später
- Benachrichtigungen, wenn Expeditionen fertig sind (braucht eine Web-App mit Push).
- Wochen-Events mit besonderen Arena-Regeln (z. B. „Meteorwoche“).
- Gilden/Freundesbesuche, Ranglisten.
