# Scarab of RA 1.4 Spielmechanik

> Nachtrag: Die direkte Codeprüfung in [Originalvergleich](originalvergleich.md) ersetzt frühere vorläufige Annahmen zu Grössen, Zeiten, Traglast, Labyrinthaufbau und Reliktplatzierung. Die vollständige Schwierigkeit ist noch nicht portiert.

Die Browser-Version soll das Verhalten der klassischen Macintosh-Version 1.4 nachbilden. Diese Spezifikation beschreibt den belegten Regelkern und trennt ihn von noch zu messenden Details. Moderne Bedienhilfen dürfen diese Regeln nicht unbemerkt verändern.

## Quellen und Verbindlichkeit

Primärquelle ist die vom Nutzer bereitgestellte Datei `Scarab14.sea.hqx`. Ihre extrahierten Ressourcen stehen im [Inventar](../reference/resource-inventory.json), die lesbaren Texte in [original-texts.txt](../reference/original-texts.txt). Quellenangaben wie „Help 1009“ bezeichnen Ressourcentyp und ID und sind dort direkt auffindbar.

- **Belegt:** ausdrücklich in Help oder Hint beschrieben.
- **Textindiz:** aus Meldungen der Ressource STRS 0 erschlossen; Auslöser und Parameter müssen geprüft werden.
- **Offen:** nicht hinreichend belegt; keine erfundenen Werte als Originalregeln übernehmen.
- **Entwurfsentscheidung:** technische Umsetzung für den Browser, keine Aussage über den Originalcode.

Die [vorhandene Browser-Neuinterpretation](https://lightningmanic.github.io/) ist eine ergänzende Vergleichsquelle. Bei Abweichungen gilt das Original. Ihre Regeln sind nicht in diese Spezifikation übernommen.

## Ziel und Ebenen

Der Spieler erkundet Labyrinthe in einer Pyramide und sucht Krone, Stab und Skarabäus des Ra. Beim Öffnen einer Ausgangstür mit allen drei Relikten kann er siegreich aufhören oder für eine höhere Wertung weiterspielen. Der Sieg tritt also nicht bereits beim Aufnehmen des dritten Relikts ein. **Belegt: Help 1001.**

Jede Ebene hat einen Eingang im Nordwesten und einen Ausgang im Südosten. Der Eingang lässt sich von innen nicht öffnen. Der Ausgang benötigt einen Schlüssel und führt in eine tiefere, grössere Ebene. Rückkehr in frühere Ebenen ist unmöglich. **Belegt: Help 1001, 1011; Hint 1001, 1002.**

**Offen:** exakte Abmessungen je Ebene, Generator, Schleifenfreiheit, Startausrichtung, Platzierungsregeln, Schlüsselverbrauch und technische Tiefengrenze. Die Hilfe verspricht unbegrenzte Tiefe; daraus folgt keine tatsächlich unbegrenzte Datenstruktur. Die häufig genannte Folge 3×3, 4×4 usw. bleibt bis zur Prüfung unbestätigt.

## Bewegung und Zeit

Position und Blickrichtung sind getrennte Zustände. Vorwärts und rückwärts bewegen um ein Feld; rückwärts verändert die Blickrichtung nicht. Links, rechts und umdrehen ändern nur die Richtung. Diagonale oder freie Bewegung sind nicht beschrieben. **Belegt: Help 1003.**

| Aktion | Zeitwirkung | Quelle |
| --- | --- | --- |
| Nach links oder rechts drehen | 1 Tick | Help 1009 |
| Umdrehen | 2 Ticks | Help 1009 |
| Warten mit der Uhr | 1 Tick, unabhängig vom Tempo | Help 1009; Hint 1003 |
| Peek links, rechts oder hinten | 0 Ticks; vorübergehende Ansicht während gedrückter Taste | Help 1003, 1009 |
| Schritt bei Tempo 1 | 10 Ticks | Help 1009 |
| Schritt bei Tempo 10 | 1 Tick, sofern Traglast dieses Tempo erlaubt | Help 1009 |
| Schritt bei Tempo 2 bis 9 | Exakte Werte offen | Help 1009 nennt nur die Endpunkte |
| Gegen eine Wand laufen | Bewegung scheitert, Signalton; Zeitkosten offen | Help 1003, 1014 |
| Aufnehmen, ablegen, werfen, benutzen | Aktionsabhängige Zeitkosten offen | Help 1008; STRS 0 |
| Add to Map | Kleine positive Zeitkosten; genauer Wert offen | Help 1010 |

Ohne Aktion vergeht keine Spielzeit. Ölverbrauch, Hunger, Heilung und Tierbewegungen hängen von der verstrichenen Spielzeit ab. **Belegt: Help 1009, 1013.**

Die Formel `11 − Tempo` ist eine plausible Interpolation der Schrittzeiten, aber noch keine belegte Originalregel. Sie darf bis zur Messung nur als ausdrücklich vorläufige Implementierung dienen.

Traglast begrenzt das Höchsttempo. Das eingestellte Tempo beeinflusst Fallen und das Aufwecken von Tieren auch beim Drehen, obwohl dessen Dauer unverändert bleibt. Bei Betreten eines gefährlichen Feldes zählt das Tempo beim Betreten, nicht beim Verlassen. **Belegt: Hint 1003.**

Bei sichtbaren Tierbewegungen zeigt das Original einzelne Bildwechsel: zuerst die eigene Bewegung, danach die während der Aktionsdauer erfolgenden Tierbewegungen. Daraus lässt sich die interne Reihenfolge sämtlicher Ereignisse noch nicht ableiten. **Belegt: Help 1013.**

## Sicht und Darstellung

Die Ansicht zeigt den Korridor aus der Ich-Perspektive. Objekte unmittelbar unter den Füssen sind unsichtbar; sichtbare Gegenstände liegen folglich noch nicht auf dem eigenen Feld. Mehrere Objekte können auf einem Feld liegen, aber nur das schwerste oder auffälligste ist sichtbar. **Belegt: Help 1002, 1006; Hint 1004.**

Die Laterne erzeugt begrenzte Sicht; das Punktraster stellt Dunkelheit in der Entfernung dar. Abgelegte Laternen erlöschen. **Belegt: Help 1002, 1008.**

**Offen:** genaue Sichtweite, Projektion, Überdeckung von Sprites, Sicht ohne Laterne, Wirkung der Nachtbrille und Auflösungsregeln für gleich auffällige Objekte.

## Karte und Orientierung

| Tempo | Kartierung | Quelle |
| --- | --- | --- |
| 1 bis 3 | Betretene Felder und beim tatsächlichen Hinwenden betrachtete Korridore | Help 1010 |
| 4 bis 5 | Betretene Felder; betrachteter Korridor zusätzlich über Add to Map | Help 1010 |
| 6 bis 10 | Keine laufende Kartierung; Position geht verloren | Help 1010, 1011 |

Peek kartiert niemals einen Korridor. Die Karte zeigt nur die aktuelle Ebene und passt ihren Massstab an deren Grösse an. Weiss bedeutet betreten, hellgrau nur kartiert, dunkelgrau unbekannt. Die Position erscheint als hohler Kreis, wenn der Spieler orientiert ist. **Belegt: Help 1010, 1011.**

Nach zu schnellem Laufen wird die Position erst durch Rückkehr an einen bereits besuchten Ort bei Kartiertempo wieder sichtbar. Nach Zerstörung der Karte muss der Spieler zum Eingang zurückkehren und dort Kartiertempo einhalten. **Belegt: Help 1011.**

Pro Kartenfeld sind editierbare Notizen möglich. Ein Stern markiert ein Feld mit Notiz, ein ausgefüllter Punkt das ausgewählte Notizfeld. Abbrechen stellt den vorigen Notiztext wieder her. **Belegt: Help 1012.**

**Offen:** ob Tempowechsel allein bereits Orientierung verliert oder gewinnt; Grenzen der Korridorkartierung bei Dunkelheit; Einfluss eines Kompasses auf die Kartenanzeige. Die Orientierung ist ohne Kompass nicht automatisch als Richtungspfeil dokumentiert.

## Inventar und Gegenstände

Aufnehmen ist nur auf dem Objektfeld möglich. Inventaraktionen sind Ablegen, Information, Werfen und Benutzen. Doppelklick führt Benutzen aus. Die Reihenfolge des Inventars ist frei änderbar und laut Hilfe ohne spielerische Bedeutung. Werfen fragt eine Distanz in Schritten ab, ist gewichtsabhängig und kann Gegenstände beschädigen. **Belegt: Help 1006 bis 1008.**

| Gegenstand oder Gruppe | Belegte Wirkung beziehungsweise Textindiz | Quelle |
| --- | --- | --- |
| Laterne | Benutzen schaltet an/aus; Ablegen schaltet aus | Help 1008 |
| Öl | Nachfüllen und Verschütten sind vorgesehen; Mengen offen | STRS 0, Textindiz |
| Nahrung | Essen; auf Tiere werfen kann sie einschläfern, kleine Mengen werden ignoriert | Hint 1007; STRS 0 |
| Gold | Bankeinlagen; auf Affen geworfen als Ablenkung, kleine Mengen genügen nicht | Hint 1010; STRS 0 |
| Schlüssel | Öffnet den Ausgang, nicht den Eingang | Help 1001 |
| Brett | Von nebenan auf eine Falle legen; sicher überqueren; auf der Falle wieder aufheben möglich | Hint 1005 |
| Zehnfussstange | Benachbarte Falle auslösen versuchen oder nahe Tiere anstossen | Hint 1005, 1007 |
| Netz | Kann Tiere dauerhaft ausser Gefecht setzen | Hint 1007 |
| Betäubungsgewehr und Pfeile | Ein Treffer kann ein Tier einschläfern | Hint 1007 |
| Peitsche | Kann Tiere vertreiben, aber auch schlafende Tiere wecken | Hint 1007 |
| Schlangengiftmittel | Ein Schluck behandelt einen Biss | Hint 1009 |
| Erste Hilfe | Behandlung kann unterbrochen werden; Vorrat erschöpfbar | STRS 0, Textindiz |
| Kohle | Schreiben auf Wände | Hint 1001 |
| Kompass | Orientierungshilfe; Bruch und Himmelsrichtungen als Meldungen vorhanden | Hint 1001; STRS 0 |
| Nachtbrille | Existiert; Fokussieren und Unterbrechung als Meldung vorhanden, Zuordnung noch zu prüfen | STRS 0, Textindiz |
| Melone | Unvorhersehbar; Explodieren bei Aufnahme/Aufprall und Essen als Meldungen vorhanden | Hint 1000; STRS 0 |
| Krone, Stab, Skarabäus | Gemeinsam Siegbedingung; Skarabäus schützt auch gegen Wächter | Help 1000, 1001; Hint 1012 |

STRS enthält Meldungen für unterbrochenes Essen, Heilen, Schreiben, Fokussieren, Schiessen, Netzwurf und Peitschengebrauch. **Textindiz:** Aktionen sind nicht alle atomar. Welche Ereignisse sie abbrechen, wie viel Zeit zuvor verstreicht und welche Teilwirkung erhalten bleibt, ist offen.

**Offen für alle Gegenstände:** Gewicht, Mengen, Haltbarkeit, Bruchwahrscheinlichkeit, Aktionsdauer, Reichweite, Trefferchance, Startvorrat und Fundverteilung. Seltenere und nützlichere Ausrüstung liegt laut Hint 1004 erst tiefer in der Pyramide.

## Gesundheit und Ressourcen

Wunden heilen im Lauf der Spielzeit. Ein Kobrabiss verursacht dagegen eine zeitweilige Erkrankung, die ungefähr gegen die Heilung arbeitet; mehrere Bisse lassen die Gesundheit zunehmend sinken. Die Wirkung endet auch ohne Heilmittel irgendwann. Exakte Raten sind offen. **Belegt: Hint 1009.**

Hunger und Laternenöl entwickeln sich mit der Spielzeit. STRS enthält separate Todesmeldungen für Verhungern und Verletzungen sowie Warnungen und Meldungen für Sättigung. Exakte Skalen, Schwellen und Verbrauchsraten sind offen. **Belegt: Help 1009; Textindiz: STRS 0.**

## Tiere und Wächter

Tiere können schneller als der Spieler sein, mehrere Schritte während einer Aktion machen und auch unbemerkt von hinten oder von der Seite angreifen. Tiere können nicht getötet werden. **Belegt: Help 1013; Hint 1006.**

| Wesen | Verhalten | Quelle |
| --- | --- | --- |
| Löwin | Verletzt den Spieler und läuft danach weg | Hint 1008 |
| Kobra | Vergiftet durch Bisse; Wirkungen mehrerer Bisse verstärken den Gesundheitsverlust | Hint 1009 |
| Affe | Verletzt nicht, stiehlt ein zufällig gewähltes Inventarobjekt; nimmt gewöhnlich nichts vom Boden | Hint 1010 |
| Affe auf der Flucht | Kann selten alles fallen lassen; beim Kontakt fliehen, stehlen oder etwas abgeben; sucht schliesslich eine Sackgasse | Hint 1011 |
| Wächter | Einer pro Ebene, langsam und unerbittlich; Auftauchen unvorhersehbar; durch den Skarabäus zerstörbar | Hint 1012 |

Schlafende Tiere können durch Betreten und durch Drehen auf ihrem Feld aufwachen. Langsames Tempo senkt das Risiko. Wache Tiere lassen einander nicht passieren und können sich gegenseitig blockieren. **Belegt: Hint 1006, 1007.**

**Offen:** Pfadfindung, Wahrnehmung, Bewegungsintervalle, Angriffswerte, Schlafdauer, Gewichtung beim Diebstahl gestapelter Mengen und Wächter-Spawn. Dass der Skarabäus eine Waffe ist, ist belegt; die genaue Bedienhandlung dafür nicht.

## Fallen

Fallen sind üblicherweise verborgen. Langsames Tempo verbessert sowohl die Entdeckung als auch das sichere Passieren. Sichtbare Fallen lassen sich leichter vermeiden als verborgene. Eine Falle löst höchstens einmal aus und ist danach ungefährlich. Der Fallentyp ist aus der Entfernung nicht erkennbar, auf dem Feld hingegen auch ohne Auslösung. **Belegt: Hint 1005.**

STRS nennt Speer-, Wind-, Giftdart- und Wasserfallen. Die Wasserfallenmeldung beschreibt die Zerstörung der Karte, die Giftdartmeldung eine Vergiftung. Konkrete Schadenswerte und die Wirkung des Windes bleiben offen. Ein Brett ermöglicht sichere Überquerung; die Stange kann eine benachbarte Falle aus sicherer Distanz auslösen, aber nicht garantiert. **Belegt: Hint 1005; Textindiz: STRS 0.**

## Wertung und Spielende

Prestige wächst durch Erkundung, tiefere Ebenen, bewältigte Gefahren, gesichertes Gold und Relikte. Bei freiwilligem Aufgeben bleibt die aktuelle Wertung erhalten. Ein Sieg mit allen Relikten gibt einen grossen Bonus und sichert mitgeführtes Gold automatisch. **Belegt: Help 1015.**

Die Todesmeldung nennt einen Abzug von einem Viertel der Prestige-Punkte; Help 1015 beschreibt nur allgemein einen Verlust. Die konkrete Berechnung und Rundung bleiben zu prüfen. Der historische Goldkurs ist separat als 41025 Cent je Unze gespeichert. Das ist ein Spielwert, kein aktueller Marktpreis. **Textindiz: STRS 0; Ressource STR 128.**

## Speichern und Bedienung

Save Game speichert und beendet die Sitzung. Fortsetzen lädt und entfernt den Spielstand. Eine jederzeit wiederholbare Schnellladefunktion wäre eine Regeländerung. Quit bietet zunächst eine Statusansicht, aus der man auch zurück ins Spiel kann. **Belegt: Help 1014.**

Das Original bietet Bewegung, Egoansicht, Inventar, News und Status in getrennten Fenstern. Status zeigt Prestige, eingezahltes Gold, Tempo, Gesundheit, Hunger und Traglast. News hält ungefähr zwanzig Meldungen; neue Meldungen sind invers hervorgehoben. Sound ist abschaltbar. Click Ahead erlaubt standardmässig Eingaben vor Abschluss der Bildaktualisierung und kann deaktiviert werden. **Belegt: Help 1004, 1005, 1014.**

## Entwurf für die Browser-Version

Die Simulation erhält diskrete Aktionen und verarbeitet daraus Spielzeit und Ereignisse. Browser-Bildrate und reale Wartezeit dürfen den Zustand nicht verändern. Vorschlag: reine Spiellogik in TypeScript, getrennt von Canvas-Darstellung und Bedienoberfläche.

Der Zustand umfasst Ebene und Wände, Position und Blickrichtung, Kartenwissen und Orientierung, Notizen, Inventar, Objekte auf Feldern, Tiere, Fallen, Ressourcen, Vergiftungen, Prestige, Gold, ausstehende Ereignisse und Zufallszustand. Ein gespeicherter Zufallszustand macht Fehler reproduzierbar. Das ist eine technische Entwurfsentscheidung, keine Behauptung über den Originalgenerator.

Offene Zahlenwerte bleiben in einer separat gekennzeichneten vorläufigen Konfiguration. Vorläufige Werte dürfen nicht als originalgetreu abgenommen werden. Der erste spielbare Abschnitt umfasst Bewegung, Peek, Zeit, Licht, Kartierung, Aufnehmen, Schlüssel und Ebenenwechsel. Danach folgen Gefahren, Gegenstandsinteraktionen und Sieg.

## Abnahmeszenarien

1. Ohne Eingabe bleibt der gesamte Simulationszustand unverändert.
2. Peek verändert weder Position noch dauerhafte Blickrichtung, Zeit oder Karte.
3. Rückwärtsgehen behält die Blickrichtung; Links/Rechts kosten je einen Tick, Umdrehen zwei.
4. Tempo 3 kartiert einen angesehenen Korridor, Tempo 5 nur die gelaufene Route; Peek ergänzt keine Karte.
5. Nach schnellem Erkunden bleibt die Position verborgen, bis bekannte besuchte Fläche bei Kartiertempo erreicht wird.
6. Nach Kartenverlust stellt der Eingang bei Kartiertempo die Orientierung wieder her.
7. Ein sichtbares Objekt kann erst nach Betreten seines Feldes aufgenommen werden; mehrere Objekte können dort liegen.
8. Ablegen der brennenden Laterne schaltet sie aus.
9. Eine ausgelöste Falle kann nicht erneut auslösen; ein korrekt aufgelegtes Brett macht die Passage sicher.
10. Tiere können mit normalen Mitteln nicht getötet werden; Wächter können zerstört werden.
11. Das dritte Relikt allein beendet das Spiel nicht; die nächste geöffnete Ausgangstür bietet Sieg oder Weiterspielen.
12. Speichern beendet die Sitzung; Fortsetzen verbraucht den gespeicherten Fortsetzungsstand.

Die ersten neun Szenarien erlauben gezielte kleine Vergleichsversuche. Zufallsraten benötigen wiederholte Versuche oder eine Analyse des kompilierten Codes; ein einzelnes Erlebnis ist dafür kein Beweis.
