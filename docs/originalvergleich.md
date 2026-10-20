# Scarab of RA Originalvergleich

**Aktueller Stand:** Der Abschnitt „Mechanikdurchgang“ am Ende dokumentiert die implementierten Gegner, Fallen und Interaktionen. Die vorherigen Abschnitte enthalten die Entwicklung und frühere offene Punkte.

Die folgenden Versuche klären die Lücken der [Spielmechanik](spielmechanik.md). Massgebend bleibt die bereitgestellte Version 1.4. Bei einer fremd gehosteten Kopie muss deren Identität gesondert geprüft werden; eine Versionsangabe auf einer Webseite allein beweist keine Dateigleichheit.

## Messplan

| Priorität | Offene Frage | Vorgehen | Benötigtes Ergebnis |
| --- | --- | --- | --- |
| 1 | Startzustand | Frisches Spiel, Inventar und Objektinformationen erfassen | Startmengen, Gewichte, Laternenfüllung, Tempo, Gesundheit, Hunger |
| 1 | Ebenengrösse | Erste drei Ebenen vollständig kartieren | Abmessungen, Ein- und Ausgang, Sackgassen und Schleifen |
| 1 | Schrittzeit bei Tempo 2 bis 9 | Gleiche Startlage und kontrollierte Folgen mit Warte-Ticks vergleichen; genaue Ressourcenstände nutzen, sofern auslesbar | Gemessene Tickkosten statt angenommener Formel |
| 1 | Ungültige Aktionen | Wandkontakt und erfolgloses Benutzen gegen reine Wartefolgen vergleichen | Zeitverbrauch, Nebenwirkungen |
| 1 | Orientierung | Bekanntes Feld verlassen, Tempo wechseln, wieder betreten und Karte prüfen | Genauer Zeitpunkt von Verlust und Wiederfinden |
| 1 | Schlüssel | Schlüssel vor verschlossener Ausgangstür benutzen | Zeitkosten, Verbrauch, automatische Bewegung, neuer Startzustand |
| 2 | Öl und Nahrung | Kontrollierte Wartefolgen mit festen Anfangswerten | Verbrauch je Tick, Warnschwellen, Sättigung |
| 2 | Traglast | Gegenstände einzeln aufnehmen und Informationsanzeige nutzen | Gewichte, Höchsttempo je Last, Kapazität |
| 2 | Licht | Laterne umschalten und ablegen; gleiche Korridoransicht vergleichen | Sichtweite und Raster; Rolle der Nachtbrille |
| 2 | Unterbrechungen | Längere Aktionen mit und ohne nahes Tier durchführen | Abbruchzeit, Teilwirkung, verbrauchte Gegenstände |
| 2 | Falle und Brett | Verdeckte, sichtbare, ausgelöste und abgedeckte Falle getrennt prüfen | Zustandsübergänge; sichere Aufnahme des Bretts |
| 3 | Zufallswahrscheinlichkeiten | Viele unabhängige Versuche mit protokolliertem Zustand; alternativ Codeanalyse | Schätzungen samt Stichprobengrösse oder belegte Formel |
| 3 | Wächter und Skarabäus | Relikt aufnehmen, Wächter beobachten, Interaktionen prüfen | Spawn, Verfolgung, Abwehrhandlung, Schaden |
| 3 | Wertung | Prestige vor/nach isolierten Ereignissen notieren | Punkte je Ereignis, Todesabzug und Rundung, Siegbonus |
| 3 | Fortsetzen | Testspiel speichern, erneut öffnen und Dateiverhalten prüfen | Einmalige Fortsetzung, korrekte Wiederherstellung |

## Anforderungen an Beobachtungen

Jeder Eintrag nennt Version, Ausgangszustand, konkrete Eingabefolge und sichtbares Ergebnis. Ein Screenshot belegt Anzeigen, aber keine unsichtbaren Tickwerte. Kleine Unterschiede in Balken sind keine präzisen Zahlenmessungen. Zufallsereignisse gelten auch nach einem erfolgreichen Versuch nicht als garantiert.

Die gehostete Vergleichsumgebung ist [MacEmu mit Mini vMac](https://macemu.com/run/scarab-of-ra/). Die Anwendung und ihre sichtbare Versionsanzeige sind gesondert von der begleitenden Webseite auszuwerten. Es wurde keine Nutzerdatei hochgeladen.

## Beobachtungen vom 15. Oktober 2026

Die gehostete Anwendung startete erfolgreich. Über Command-M liess sich die Kartenansicht öffnen. Die Legende zeigt Position, Notizzeiger sowie die drei Zustände betreten, nur kartiert und unbekannt. Das bestätigt die in Help 1011 und 1012 beschriebene Darstellung für diese laufende Kopie. [Screenshot](../reference/observations/macemu-map.jpg).

In der zunächst sichtbaren Spielansicht standen ein Schlüssel, 16 Unzen Nahrung und eine Laterne im Inventar, Prestige 50, Bankgold 0 und Tempo 5. Diese Werte werden **nicht als Startwerte übernommen**: Der Zustand zeigte bereits mehrere Fundmeldungen, und ein garantiert frischer Start war nicht nachgewiesen.

Die Mausaktionen trafen in dieser Umgebung nicht zuverlässig die beabsichtigten Steuerelemente; zudem waren zeitweise Darstellungsreste sichtbar. Die Versionsanzeige innerhalb der Anwendung und die Dateigleichheit mit der Nutzerkopie konnten daher noch nicht verifiziert werden. Die Webseite bezeichnet die Kopie als Version 1.4, was allein nicht genügt. Präzise Zeit-, Verbrauchs- und Zufallsmessungen bleiben offen. Für sie ist eine kontrollierbare Emulatorsitzung mit der bereitgestellten Datei der nächste notwendige Schritt.

## Direkte Prüfung des Originalprogramms (Version 1.4)

Die bereitgestellte Datei enthält THINK-C-Funktionsnamen. Die Prüfung nutzt die extrahierten CODE-, DATA- und ZERO-Ressourcen. `tools/disassemble_original.py` erzeugt die lesbare Disassemblierung; `tools/extract_game_data.py` expandiert die initialisierten globalen Variablen genau nach CODE 1:00a0–00da. Das Ergebnis hat die im CODE-0-Kopf angegebene Länge von **27 240 Bytes**. Die 33 Gegenstandstypen stehen in `reference/item-data.json`.

Funktionsüberschriften im automatisch erzeugten Listing sind Orientierungshilfen: Einige Namen folgen mehreren unbenannten Funktionen oder Sprungtabellen. Die unten angegebenen Segmentnummern und Offsets sind deshalb die massgebenden Belege.

| Verhalten | Befund aus der Nutzerkopie | Umsetzung |
| --- | --- | --- |
| Grösse | Start 3×3; Dimension wächst je Ausgang bis 20×20. DATA; CODE 30:0020–0040 | Korrigiert; bisherige Grenze 14 entfernt |
| Labyrinth | Zuerst selbstvermeidender Hauptweg zum Ausgang, mit Erreichbarkeitsprüfung; danach rekursiv angeschlossene Nebenwege. CODE 19:010c, 01f0, 0244, 034c | In `maze.js` übertragen; Browser-Zufallsgenerator bleibt anders |
| Start | Gesundheit 100, Sättigung 16, Schrittzeit 6 (Tempo 5), Blick nach Süden. Laterne mit 16 Einheiten Öl, 16 Unzen Nahrung. DATA; CODE 19:0004; CODE 10:05c2–0726 | Korrigiert; Ölgewicht wird mitgerechnet: Startlast 112 Unzen |
| Tempo | Schrittzeit = 11 − Tempo; Höchsttempo = 10 − floor(Last / 160). CODE 9:1492–154c, 1a8a–1b10 | Korrigiert |
| Traglast | Aufnahme ab 1600 Unzen abgelehnt; stapelbare Mengen können im Original teilweise aufgenommen werden. CODE 3:042e–0504 | Grenze 1599 korrekt; Mengenabfrage/Teilaufnahme noch offen |
| Nahrung | Sättigung verliert 1 von 16 Einheiten alle 200 Ticks; Warnung bei 2; Tod bei 0. CODE 9:1d4a–1dd2; erster Termin CODE 10:069e | Korrigiert; Essen füllt pro Unze eine Einheit. Mengenwahl und Unterbrechungen fehlen |
| Öl | 16 Einheiten im Startlicht; Verbrauch einer Einheit nach jeweils 150 Brennticks. CODE 10:0602–064a; CODE 9:117c–11dc | Korrigiert; vollständige Ereignissemantik beim An-/Ausschalten noch abzugleichen |
| Heilung | Erster Termin 75; +1 Gesundheit; nächste Verzögerung 112 − rand(75), also 38–112. CODE 10:06ae; CODE 9:1bba–1bec | Korrigiert |
| Relikte | Für jedes noch nicht erzeugte Relikt: rand(225) < floor(Fläche / 4), bei Breite 15 garantiert; danach nie neu erzeugt. CODE 30:020e–0368 | Korrigiert; Demo-Platzierung auf Ebenen 2–4 entfernt |
| Schlüssel | Zufälliges Feld einschliesslich Ein-/Ausgang. CODE 30:014e–0188 | Korrigiert |
| Prestige | Benchmark einmalig +50; beim Ebenenwechsel vorherige Fläche ×10. CODE 9:0004–002c; CODE 30:000c–0018 | Korrigiert; erfundene +5 pro Feld/+50 pro Ebene entfernt. Abschlusswertung noch vereinfacht |
| Fallen entdecken | Geradeaus bis zur Wand; pro verborgener Falle rand(50) < Aktionsdauer. CODE 9:089e–091a | Formel und Reichweite übernommen; vollständige Aufruf-/Lichtbedingungen noch offen |
| Perspektive | Quadratische Projektion 302×302, oben bei y=84 abgeschnitten. Breitenfolge 302,240,120,60,30,16,8,4,2,1. CODE 2:2ea2–2ef0; A5−$dd8 | Geometrie korrigiert; Horizont liegt höher als in der ersten Fassung |
| Dunst | Unskalierte PICT 134–136, mit Licht alle drei Tiefenstufen. CODE 2:3a8e–3b44 | Stufen und Originalgrösse übernommen; Überlagerung/Reihenfolge nicht vollständig portiert |

Diese Aussagen sind Codebefunde, keine Behauptung, alle Fälle im Emulator durchgespielt zu haben. `rand(n)` im Original verwendet QuickDraw Random mit Restbildung (CODE 9:23c0); unser reproduzierbarer Browsergenerator hat eine andere Folge. Identische Seeds ergeben deshalb keine identischen Originallevel.

### Zunehmende Schwierigkeit: belegt, aber noch nicht vollständig umgesetzt

Die originale Auswahl gewichtet Typen nach ihrer Häufigkeit und ihrer internen Tiefe (Startwert 3, anschliessend +1; nicht auf 20 begrenzt). CODE 9:0bc4–0c6c. Anzahl zufälliger Objekte bei Fläche A≥10: floor(A/20) + floor(A/10) − rand(floor(A/10)); bei A<10 null. CODE 30:0450–051e. Dazu kommen Schlüssel, Benchmarks, Relikte und Wandbilder.

Aus der Originaltabelle, interne Tiefenwerte:

| Typ | Ab Tiefe | Bis Tiefe | Auswahlgewicht |
| --- | --- | --- | --- |
| Affe | 5 | 32000 | 10 |
| Löwin | 8 | 32000 | 10 |
| Kobra | 7 | 32000 | 10 |
| Speerfalle | 5 | 32000 | 30 |
| Windfalle | 3 | 32000 | 10 |
| Wasserfalle | 3 | 32000 | 3 |
| Giftpfeilfalle | 6 | 32000 | 10 |
| Brett | 5 | 10 | 3 |
| Zehn-Fuss-Stange | 2 | 7 | 15 |
| Erste Hilfe | 10 | 32000 | 10 |
| Betäubungsgewehr und Pfeile | 12 | 32000 | je 10 |

**Historischer Zwischenstand vor dem Mechanikdurchgang:** Tierverhalten, Wächter, Gift, weitere Werkzeuge und die vollständige Originalverteilung fehlten. Der aktuelle Stand steht im folgenden Abschnitt „Mechanikdurchgang“. Die damalige Verteilung von Nahrung, Öl und Speerfallen war ein Ersatz. Grössere Labyrinthe und korrekte Ressourcenzeiten allein sind kein Nachweis eines gleichen Spielgefühls.

### Sichtprüfung und Tests

Eine weitere Originalaufnahme zeigt einen Ebenenwechsel mit Prestige 140 (50 Benchmark +90 für 3×3): `reference/observations/macemu-level2.jpg`. Dies passt zum Codebefund. Die Identität der fremd gehosteten ausführbaren Datei bleibt ungeprüft; die Codebefunde beziehen sich auf die Nutzerkopie.

12 automatische Tests prüfen zusammenhängende Labyrinthe, Gegenkanten, erreichbare Schlüssel, grosse 20×20-Bäume, Aktionszeiten, Rückwärtsbewegung, Orientierung, Inventar, Speichern/Fortsetzen einschliesslich Ereigniszeitpunkten, Traglastgrenzen, Relikt-Einmaligkeit über 50 Expeditionen bis zur 20. Ebene, Siegentscheidung und Brettschutz. Sie belegen Eigenschaften der Implementierung, keinen vollständigen Differentialtest gegen den Emulator.

Noch offene Bildabweichungen: Bitmap-Systemschrift, QuickDraw-Linienraster, Seitenansichten der Türen, mehrere Gegenstände im selben Feld, Wandbilder, Dunst vor/hinter Objekten, einige Dialoge, Cursor und Scrollleisten. Keine Modernisierung wurde begonnen.

## Grafik-Korrektur: Brett, Gold und Schärfe

CODE 2:4292–43be wählt die Originalgrafik je Objektzustand; CODE 2:43ce–44d6 skaliert und positioniert sie. Die Grössentabelle A5−$d60 enthält 1,1,1,2,4,8,…: auf dem unmittelbar nächsten Feld (Original-Tiefenindex 2) bleibt die Grafik vollständig erhalten. Die alte Browserfassung verkleinerte sie dort bereits auf die Hälfte. Brett: **60×43**, Gold: **59×50** Originalpixel, danach ganzzahlige Halbierung. Die Korrektur betrifft alle Bodenobjekte. Die Originalbilder wurden nicht neu gezeichnet.

Die Konturen gerader Seitenwände erhalten keine senkrechten Linien an künstlichen Zellgrenzen mehr. Echte Wandenden und Abzweigungen bleiben sichtbar. Linien werden auf einem Schwarzweiss-Pixelraster gezeichnet. Dunst wird zwischen den Tiefenstufen zusammengesetzt, damit fernes Dunstmuster nicht nachträglich über nahe Objekte gelegt wird. Die seitlichen Türgrafiken folgen den Grössen- und Versatzformeln aus CODE 2:3cbc–3f82.

Die Oberfläche verwendet nun eine gerasterte 12-Pixel-Variante der vorhandenen ChicagoFLF-Ersatzschrift sowie ganzzahlige 1×-/2×-Darstellung. **Dies ist weiterhin keine Extraktion der originalen Macintosh-Systemschrift.**

16 Tests bestanden, einschliesslich Objektgrössen, fehlender Trennlinien in geraden Gängen und vorhandener Grafikressourcen. Lokale Browsersichtprüfung: Brett und Gold je in drei Entfernungen, Interface in 1× und 2×. Reproduzierbare Szene: `prototype/tests/render-check.html`, über den Entwicklungsserver unter `/__render-check`. Diese Grafikprüfung ersetzt weder den offenen Vergleich aller Spielmechaniken noch einen vollständigen Bildvergleich gegen den Emulator.

## Mechanikdurchgang — 15. Oktober 2026

Die vereinfachte Verteilung garantierter Vorräte wurde ersetzt. Die 33 Original-Typdatensätze sind als `prototype/dist/item-types.js` exportiert. Interne Tiefe = angezeigte Ebene +2; die Tiefe steigt auch nach dem Grössenlimit 20×20 weiter. Auswahlgewichte, Mengen und Tiefengrenzen folgen DATA/ZERO und CODE 9:0bc4, CODE 30:0450. Auf jedem Feld höchstens eine Falle; belegte Fallenfelder werden wie in CODE 9:0a58 weitergeschoben. Wandbilder, Inschriften, Bankfächer, Schlüssel, Benchmarks und Relikte sind getrennte Einrichtungsarten.

| Bereich | Jetzt implementiert | Originalbeleg |
| --- | --- | --- |
| Tiere | Anfangszustand schlafend/wach; Bewegung alle 3/2/4 Ticks für Löwin/Affe/Kobra, 7 für Wächter; Wandern, Verfolgen, Fliehen; blockierte Felder; Aufwachen; fallen gelassene Beute | CODE 2:0004–0692, Typintervalle DATA |
| Angriffe | Löwin 0–14 Schaden; Kobra 5 plus Gift; Affe stiehlt ganzen Inventareintrag; gestohlene Laterne geht aus | CODE 5,6,8 und CODE 2:0048–0090 |
| Wächter | Weit entfernter Spawn; verfolgt; Berührung ohne Skarabäus tödlich, mit Skarabäus 30 Schaden; Skarabäuswurf zerstört ihn, Gegenstand bleibt liegen, +500 Prestige | CODE 28:0004–019c; CODE 9:214a; ursprüngliche Vermutung „Krone“ ausdrücklich verworfen |
| Fallen | Speer 11–20 Schaden; Wind löscht Licht über Laternenroutine; Giftpfeil 5 plus Gift; Wasser löscht Kartierung/Notizen; Auslösung rand(15) ≥ Schrittzeit; Brett schützt; ausgelöste Fallen bleiben unschädlich | CODE 45:0004–01xx |
| Gift | Je Vergiftung eigener Termin nach 75 Ticks; dann 1 Schaden und nächste Verzögerung 38–112; 1/100 Ende; Gegengift entfernt ein Gift-Ereignis | CODE 9:12d8, CODE 14 |
| Erste Hilfe | 30 unterbrechbare Ticks, danach 0–9 Heilung; Kit mit Wahrscheinlichkeit 1/10 verbraucht; auch bei voller Gesundheit Zeitverbrauch | CODE 22:0004–0078 |
| Werkzeuge | Stange weckt/reizt Tiere oder löst Fallen auf Distanz aus und kann brechen; Peitsche erschreckt entlang vier Korridoren; Netz braucht 2 Ticks und vergibt +150 bei Fang; Dartgewehr fasst 6 Pfeile und betäubt normale Tiere | CODE 32,7,18,24 |
| Wurf | Mengenwahl; Reichweite trunc((21−trunc(Last/16))/3)+1, zusätzlich Wandbegrenzung; Treffer/Flucht und zerbrechliche Gegenstände; Ölflasche zerbricht; Affenbestechung floor(rand(Menge)/16)>0 | CODE 2:141a–1846; CODE 9:1248; CODE 39:0136; CODE 42:00a4 |
| Karte | 7 Felder Sichtkartierung mit Licht, 2 ohne; keine Kartierung durch Wände; manuelles Ergänzen verbraucht keine Zeit | CODE 2:478e–4864, 2456 |
| Zeitreihenfolge | Bewegen/Abbiegen: Zeitereignisse vor den abschliessenden Feld-Callbacks; Warten löst keine erneute Trittfalle aus; Aufnahme 1 Tick je Eintrag | CODE 2:0d6c–10be; CODE 3:042e–05fc |
| Zeitfreie Aktionen | Laterne umschalten, Öl nachfüllen, Pfeile laden, Gegengift, Gold einzahlen, Schlüssel am Ausgang; Spezialwürfe von Gold/Öl/Laterne/Skarabäus | jeweilige Handler enthalten keinen Advance-Aufruf; CODE 4,14,39,42,9:1320 |
| Nachtgläser | 4 Ticks Fokussierung, Fernansicht ohne Ortswechsel; Nachfokussieren 1 unterbrechbarer Tick; kleine Palette im Spielfenster | CODE 3:0004–01dc; DLOG 12574, DITL 13609 |
| Inschriften | Schreiben auf feste Wände, maximal 32 Zeichen, 20 unterbrechbare Ticks, 1/10 Zerbröseln; originale Zufallssprüche und Weg-Hinweise | CODE 26; CODE 9:0c6e |
| Wertung | Relikt erstmals +1000; Bankgold +5/Unze; Tod −floor(Prestige/4); Ausgang mit Relikten: aktuelle Fläche×10, je intaktem Relikt +4000 / gebrochenem +1000, getragenes Gold +5/Unze ohne Doppelzählung der Bank | CODE 9:20ec; CODE 42; CODE 13; Originaltexte zum Todesabzug |
| Fortsetzen | Save v3 mit Tieren, Beute, Giftterminen, Werkzeugzuständen; v2-Migration behält vorhandene Ebene; lokale Bestenliste | Browserimplementierung, kein originales Macintosh-Dateiformat |

### Verifikation und Grenzen dieses Durchgangs

44 automatische Tests. Kontrollierte Browserszenen prüfen Teilaufnahme, Einzahlung samt +35 für 7 Unzen, Wurfdialog, Netzfehlschlag, Nachtglas-Palette, Wandnotiz und Wächtervernichtung samt +500. Die Szenen sind ausschliesslich im lokalen Entwicklungsserver erreichbar. Die normale veröffentlichte Anwendung enthält keine Testzustände.

MacEmu wurde erneut gestartet: Originalinventar mit 16 Unzen Nahrung und Laterne, Aufnahme des Schlüssels sowie Command-M-Karte wurden sichtbar überprüft. Screenshot: `reference/observations/macemu-map-current.png`. Die Darstellung im Emulator aktualisiert sich in dieser Sitzung nicht immer vollständig; daraus wurden keine präzisen Timing- oder Schadenswerte abgeleitet. Die originale Nachtglas-Palette wurde deshalb zusätzlich aus DLOG/DITL rekonstruiert.

**Keine Behauptung vollständiger Gleichheit:** Der Browser-Zufallsgenerator unterscheidet sich, die Reihenfolge gleichzeitig fälliger Ereignisse ist noch nicht gegen den originalen Scheduler vollständig geprüft. Wandtext/seitliche Inschriften, einige Dialoge, Systemschrift und Scrollleisten bleiben Darstellungsnäherungen. Die Verteilung benutzt die Originalgewichte, aber abweichende Zufallsaufrufreihenfolge erzeugt andere konkrete Ebenen. Die globale Ölverwaltung ist auf die eine im regulären Spiel verfügbare Laterne ausgelegt; Gewehre speichern Munition einzeln.

Ein bewusst offener Widerspruch: Die Hints empfehlen, Tiere mit geworfener Nahrung einzuschläfern. Der Original-Typdatensatz für Nahrung hat jedoch keinen Throw-Callback; der geprüfte generische Wurfcode zeigt diesen Effekt nicht. Bis zu einem kontrollierten Laufzeitnachweis folgt Nahrung dem generischen Wurfhandler. Es wurde keine erfundene Fütterungswahrscheinlichkeit eingebaut.


## Nachkorrektur: Abzweigungen, Scrollpfeile und Kartenschärfe

Die erste Konturkorrektur beseitigte nur Nähte im geraden Gang. Die Nutzerbilder zeigten weitere Fehler an seitlichen Öffnungen: fehlende nahe Kanten und falsche senkrechte Nähte in einer durchgehenden Stirnwand. CODE 2:307c–3a7a prüft zusätzlich das seitliche Nachbarfeld in Blickrichtung. Diese Fallunterscheidung sowie die kurzen Rücksprünge aus A5−$dba (25,13,7,4,2,1,0,…) sind jetzt übertragen. Links und rechts verwenden spiegelbildlich dieselben Regeln. Fünf zusätzliche Regressionstests und feste Browserszenen decken einseitige/beidseitige Öffnungen, tiefere Sicht mit Dunst und seitlich weiterführende Gänge ab.

Die Scrollpfeile waren bislang dekorative Unicode-Zeichen ohne Mausereignisse. Jetzt sind es zugängliche Schaltflächen mit gespiegelten Rasterkonturen, Zeilenscrollen, Wiederholung beim Gedrückthalten und seitenweisem Scrollen über die Leiste. Browserprüfung: Inventar 0→16→0 sowie Seitenende 82; News 58→43→58.

Die Karte wurde als zusammengesetztes Bild mit CSS transform vergrössert. Sie verwendet nun wie das Hauptfenster Layout-Zoom in 1×/2× und ganzzahlige Zellgrenzen. Beide Grössen wurden im Browser geprüft; keine Konsolenfehler. Die Nachtglas-Palette verwendet dieselbe Positionierungsroutine. Screenshots: `reference/observations/junction-both-corrected.png`, `map-sharp-2x.png`, `scroll-arrows-corrected.png`.

## Kartenlinien und Kartenstatus — Nachprüfung

CODE 21:0488 setzt vor den Kartenwänden `PenSize(2,2)` und stellt danach `PenSize(1,1)` wieder her. Die bisherigen CSS-Zellrahmen waren falsch: Innenwände konnten doppelt, Aussenwände einfach erscheinen; transparente Nachbarränder und gerundete Button-Ecken verursachten Lücken. Ein gemeinsamer 296×296-Raster ersetzt diese Rahmen. Die Zellgrösse folgt CODE 21:003e–0062 / DITL 28345, Element 4: `floor((296−2)/n)` für alle Zellen, statt Restpixel auf unterschiedlich breite Zellen zu verteilen. Gemeinsame Kanten werden auf denselben Pixeln gezeichnet.

CODE 21:03bc–044a verwendet für kartiert/unbetreten QuickDraw ltGray, für unbekannt gray; betretene Felder bleiben weiss. Die Darstellung und Legende verwenden nun monochrome 25%- bzw. 50%-Muster. Die Rasterung von Positionskreis/Notenmarkierung bleibt eine Browserimplementierung und ist nicht als bitidentische QuickDraw-Ovalroutine nachgewiesen.

Die Statuslogik erforderte keine Änderung. Help 1010 sowie CODE 2:478e–485e bestätigen: Tempo ≤5 kartiert betretene Felder; Tempo ≤3 zusätzlich den angeschauten Korridor (Peek zählt nicht); „Add To Map“ kartiert den Blickkorridor manuell bis Tempo 5. Geprüft mit Zustand 0→1 durch Anschauen bei Tempo 3 und 1→2 erst beim Betreten; weitere sichtbare Felder bleiben 1. Tempo 5 und manuelle Kartierung separat geprüft. Die HTML-Schaltflächen benennen den Zustand jetzt ausdrücklich, während das gemeinsame Raster die sichtbare Karte zeichnet.

Sieben zusätzliche Tests prüfen einheitliche Linienstärke, geschlossene Verbindungen, offene Durchgänge, Zellgrösse und die drei Kartenstatus. Browserprüfung in 1×/2× inklusive tatsächlichem Schritt vom schraffierten in den weissen Zustand. Screenshot `reference/observations/map-after-walking.png`.

## Nachtgläser und Aufwecken — Nachprüfung vom 20. Oktober 2026

Erneut direkt gegen die extrahierte Nutzerkopie von 1.4 geprüft, nicht gegen eine
fremde Emulatorversion. Die A5-Aufrufe wurden anhand der Sprungtabelle in CODE 0
aufgelöst: `$fa` → CODE 2:2b0e (Zeit), `$55a` → CODE 9:089e
(Fallenprüfung), `$132` → CODE 2:2ef2 (Ansicht).

- **Nachtglas-Palette:** Die später hinzugefügten modernen Dialogregeln legten
  einen dunklen, verschwommenen Hintergrund über die Fernansicht und überschrieben
  Abstände der kleinen Palette. Modern hat jetzt eine seitliche, größere Palette
  mit transparentem Hintergrund; Original behält die kompakte Palette.
- **Erste Fokussierung:** CODE 3:000c–0020 benötigt vier unterbrechbare Ticks.
  CODE 3:00ac–00b0 ruft danach die Fallenprüfung mit Argument 1 auf. Dieser erste
  Prüfaufruf fehlte; Nachfokussieren hatte ihn bereits.
- **Startposition und Grenzen:** CODE 3:0036–00e0 scannt höchstens sieben Felder,
  bleibt vor einem Bodenobjekt/Tier stehen und führt einen separaten Distanzzähler.
  Beim Objektstopp wird dieser erhöht, ohne die virtuelle Position zu versetzen;
  nach dem Scan wird er dekrementiert. CODE 3:010c–0110 erlaubt Weiter bei Zähler
  ≤7, CODE 3:0156–015a Näher nur bei >1. Deshalb ist ein pauschaler Bereich von
  null bis acht Schritten keine exakte Übertragung. `nightglasses.js` bildet
  Position und Zähler getrennt ab, einschließlich dieser ungewöhnlichen Grenzen.
  Nicht mögliche Schritte verbrauchen keine Zeit. Karte und Spielerposition
  bleiben unverändert.
- **Schließen:** Auch Escape beendet nun den temporären Blickzustand; verspätete
  Close-Ereignisse dürfen einen inzwischen neu geöffneten Dialog nicht zurücksetzen.
- **Tierverhalten:** CODE 2:056a–05ce kehrt für bereits wache Tiere sofort zurück.
  Beim tatsächlichen Aufwecken setzt `rand(2)==0` für normale Tiere beide Flags
  Tracking und Fleeing. Bisher fehlte Tracking; ein Sonderfall bei Begegnungen
  setzte nur Fleeing mit anderer Zufallsbedingung. Die gemeinsame Aufweckroutine
  wurde entsprechend korrigiert und setzt bei bereits wachen Tieren keinen neuen
  Bewegungstermin.

Weitere gelesene Bereiche: CODE 2:0474–052c (Tierbegegnung), CODE 45:0004–00d2
(Brett/Fallenschutz und Speer), CODE 9:1bee–1d38 (Nahrung), CODE 9:117c–1240
(Ölverbrauch/Nachfüllen). Daraus wird keine vollständige Äquivalenz abgeleitet.
Die vorher dokumentierten Unsicherheiten zur Ereignisreihenfolge, Zufallsfolge
und Tierfütterung bleiben offen.

Verifikation: 111 Tests bestanden, einschließlich vier neuer Nachtglas-Tests und
Aufweckregression. Browserprüfung in Modern und Original: Palette öffnen,
Näher-Grenze, Moduswechsel bei geöffneter Palette und Escape. Aufnahme:
`reference/observations/nightglasses-fixed.png`. Kein neuer kontrollierter
Durchlauf des Originalprogramms im Emulator; die Mechanikkorrekturen beruhen auf
dem disassemblierten Originalcode.
