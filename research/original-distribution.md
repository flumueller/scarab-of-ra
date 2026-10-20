# Scarab of RA 1.4 – Verteilung und Wandbelegung

Stand: 16. Oktober 2026. Primärquelle: die vom Nutzer gelieferte Scarab14.sea.hqx, extrahierte CODE-Ressourcen und Typentabelle. Dies ist eine Codeanalyse, kein behauptetes Langzeit-Spielprotokoll des Emulators.

## Belegte Regeln

- CODE 30:0020–0040: interne Tiefe steigt weiter, Dimension höchstens 20. Angezeigte Ebene 1 entspricht interner Tiefe 3, also 3×3 Feldern.
- CODE 30:0450–0496: bei Fläche A unter 10 keine regulären Ziehungen; sonst floor(A/20) + floor(A/10) − Zufall(0 … floor(A/10)−1).
- CODE 9:0bc4: nur Typen innerhalb ihrer Min-/Max-Tiefe nehmen an der gewichteten Ziehung teil. Häufigkeitsgewichte sind keine Prozentwerte; Wahrscheinlichkeit = Gewicht / Summe der aktuell zulässigen Gewichte.
- CODE 30:049e–0514: Typ ziehen, Menge aus inklusivem Min-/Max-Bereich, zufälliges Feld. Keine Garantie für Nahrung, Öl oder gleichmässige räumliche Abstände. Reguläre Ziehungen enthalten auch Tiere, Fallen und Wandobjekte, nicht nur tragbare Gegenstände.
- CODE 30:014e–0188: ein Schlüssel auf zufälligem Feld, zusätzlich zum regulären Kontingent. Fundstücke können zusammenliegen.
- Relikte werden separat erzeugt, nur einmal pro Expedition; spätestens bei 15×15. Vermessungspunkte werden separat je 3×3-Block versucht.
- CODE 30:0522 ff.: zusätzlich 2 + 2×Kontingent Versuche für Wandbilder. Ein Versuch muss nicht erfolgreich sein.
- CODE 9:093c–09ba: Wandobjekte brauchen eine geschlossene, noch unbelegte Wand. Die Richtung wird im Objekt gespeichert und die Fläche als belegt markiert. Ohne geeignete Wand wird das Objekt verworfen.
- CODE 30:01a4/01aa und 01d2/01ea: Eingang Nord, Ausgang Süd werden vorab reserviert. Bank und Tür können im selben Feld sein, aber nicht dieselbe Wandfläche belegen.
- CODE 9:09f0 ff.: der Banktext lautet „Bank of RA - Gold Deposit“.

## Korrekturen im Prototyp

Bank erhält eine konkrete Wandrichtung; Beschriftung erscheint nur beim Blick auf diese Wand. Türflächen, Inschriften, Bank und Wandbilder teilen dieselbe Belegungsprüfung. Alte Spielstände mit einer Bank ohne Richtung erhalten für die Darstellung eine freie Wand ohne Änderung des Zufallszustands.

Bei der breiten Prüfung fiel ausserdem ein Fehler im Labyrinthgenerator auf: beim Anschluss einer Verzweigung wurde der Nachbar statt des neu angeschlossenen Feldes markiert. Dies erzeugte zusätzliche Kanten und auf manchen Startwerten extrem lange Suchen. Jetzt wird das richtige Feld markiert; erfolglos untersuchte Felder werden innerhalb derselben Suche nicht erneut besucht. Die Tests prüfen Verbindung, Grenzen und genau n²−1 Kanten.

## Stichprobe des Prototyps

200 deterministische Startwerte pro Ebene, 18 Ebenen (3.600 beobachtete Ebenen). Gemessen werden reguläre Ziehungen vor einer eventuell fehlgeschlagenen Wandplatzierung, nicht sichtbare Item-Stapel. Rohwerte und vollständige Gewicht-/Mengentabellen pro Ebene stehen in `distribution-sample.json`.

| Ebene | Grösse | beobachtete Ziehungen | Mittelwert |
|---|---|---|---|
| 1 | 3×3 | 0 | 0 |
| 2 | 4×4 | 1 | 1 |
| 3 | 5×5 | 2–3 | 2,54 |
| 8 | 10×10 | 6–15 | 10,32 |
| 13 | 15×15 | 12–33 | 21,99 |
| 18 | 20×20 | 21–60 | 39,78 |

## Grenzen der Gleichheit

Der Browser verwendet einen anderen Zufallszahlengenerator als Macintosh QuickDraw. Gleiche Startwerte erzeugen daher keine identischen Originalpartien. Die Wahl unter freien Wandflächen ist im Browser gleichverteilt; die genaue Richtungs-Fallbackfolge des Originals ist noch nicht vollständig nachgebildet. Mehrere Bankziehungen im selben Feld werden derzeit zu einer Bank zusammengefasst. Seitliche Inschrift-Projektion ist noch nicht umgesetzt. Die Einzahlungsbedingung wurde nicht auf eine unbestätigte Blickrichtungsregel umgestellt.

Die Statistik bestätigt Kontingente und prüft Belegung; sie beweist weder identische räumliche Verteilung noch identische Langzeit-Schwierigkeit. Deshalb wurden keine erfundenen Versorgungsgarantien oder neuen Häufigkeiten eingeführt.

## Grafik

Modern-Modus: integrierte gezeichnete Stats-/Aktionsvertiefungen, kräftigerer Kartenrahmen, unregelmässige kleine Risse und Steinporen statt wiederholter Pfeile und Randstriche. Originalmodus behält seine Darstellung. Die detailreiche Referenzszene ist damit noch nicht erreicht: insbesondere grosse Reliefs, Bodenplatten und tiefe gezeichnete Schatten fehlen weiterhin.

Die beiden Rahmen wurden mit dem eingebauten Bildgenerator erstellt. Exakte Prompts: `../art-prompts/hud-insets-prompt.txt`, `../art-prompts/minimap-heavy-prompt.txt`. Assets: `../dist/assets/unified-hud-insets.png`, `../dist/assets/minimap-heavy.png`.
