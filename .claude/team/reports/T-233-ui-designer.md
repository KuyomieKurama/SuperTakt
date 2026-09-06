# T-233 — ui-designer

```
Aufgabe: T-233 — Welle AK. Die benannte Moeglichkeit aus T-194 Abschnitt 2.8 ist gemessen:
         2.8 nachziehen, ueber den Rueckfall urteilen, die Mindesthoehe entscheiden, und
         die Warnung an den, der den Lauf baut.
Status: fertig
```

| Gegenstand | Ergebnis |
|---|---|
| 2.8 nachgezogen | aus der Vermutung sind Zahlen geworden — mit Engine, Strichzahl und Strichlängen |
| Rückfall | **hinfällig für seinen Grund**, steht für einen anderen Fall weiter |
| Mindesthöhe | **Regel T-8**: drei Striche, zwei Lücken; Planungsschranke Pfadlänge ≥ 12 × Rahmenbreite |
| Warnung an den Lauf | **P-1 bis P-6** in 2.8, mit der wichtigsten Zahl: die Schranke im Lauf ist **4**, nicht 3 |
| Fokusring, zweite Hälfte der Messung | in **10.4** eingetragen, O-JV zur Hälfte erledigt |
| Zwei eigene Fehler in 2.8 gefunden | `rows={3}` statt `rows={2}`; „drei Unterbrechungen" ist zweideutig |

---

## 1. Was gemessen ist, und was daraus folgt

Der Orchestrator hat die Vorrichtung in **WebKitGTK 4.1** und in Chromium gefahren:

| | WebKitGTK 4.1 | Chromium |
|---|---|---|
| durchgezogen / gestrichelt | bleibt / bleibt | bleibt / bleibt |
| Striche | **3** | **4** |
| Längen | **{7, 9, 7}** | **{7, 7, 7, 7}** |
| bemalte Länge | 23 px | 28 px |

Fokusring, Gefahrenknopf hell, Schnitt von der Fläche zur Füllung: `#2159da ×2`, `#ffffff ×2`,
Füllung — **in beiden Engines zeichengleich**. Das ist genau die gebaute Anordnung aus 10.2
(Umrandung `--focus-ring-color` über dem Schatten `--focus-ring-contrast`), und damit trägt die
Malreihenfolge, an der der Tausch hing, auch dort.

**Die Messung sagt zwei Dinge, und sie dürfen nicht zu einem werden.** Die **Form** entsteht in
beiden Engines — das ist die Aussage, auf der 2.3 und 1.4 stehen. Die **Verteilung** ist
verschieden — und keine ihrer Zahlen ist eine Eigenschaft von Takt. Wer beides zusammenwirft, baut
in eine von zwei Richtungen falsch: Er nagelt eine Prüfung auf die Zahlen fest (falscher Alarm), oder
er hält die Form für maßlos (stiller Ausfall an kurzen Schienen).

## 2. Das Urteil über den Rückfall

**Hinfällig für den Grund, für den er hinterlegt war.** Er sollte den Fall abfangen, daß eine
WebKit-Engine die Schiene gar nicht als Strichmuster zeichnet. Der Fall tritt nicht ein. Was ein
`repeating-linear-gradient` mit fester Geometrie zusätzlich brächte, wäre eine feste **Verteilung**
— und die Verteilung ist nach derselben Messung genau das, was **nicht** trägt. Er kostete ein
zweites Zeichenverfahren für dieselbe Linie und nähme die Schiene aus der Rahmenmalerei, in der sie
nach 2.3 gegen Positionierung und Beschneidung unempfindlich ist.

**Er bleibt für einen anderen Fall stehen:** für eine Schiene unter der Schranke aus T-8, die
trotzdem tragen muß. Dort ist die feste Periode das einzige Mittel, das die Engine nicht neu
verhandelt. Aus einem Rückfall gegen die Engine ist ein Werkzeug gegen die **Kürze** geworden.

## 3. Die Mindesthöhe — Regel T-8

> **Ein Formmerkmal ist erst Träger, wenn die Engine es zeichnen kann. Die Schranke ist drei
> Striche und zwei Lücken.**

Ein Strich ist von einer kurzen durchgezogenen Schiene nicht zu unterscheiden. Zwei Striche mit
einer Lücke sind keine Wiederholung, sondern eine Kerbe — und wo die eine Lücke liegt, entscheidet
die Engine (die verschobenen 9 px oben sind der Beleg). Erst zwei Lücken machen aus zwei Dingen ein
Muster.

**Der teure Teil ist der zweite Halbsatz.** Eine Farbe, die zu schwach wird, sagt „unklar". Eine
**Form**, die zu kurz wird, sagt **den anderen Wert desselben Merkmals**: Die gestrichelte Schiene
mit einem Strich **ist** die durchgezogene. Am Vermerkfeld heißt das, es sieht aus wie das
Leistungsfeld — der Verwechslungsweg, gegen den 2.3 gebaut ist (R-08, E-016). Ein ausfallendes
Formmerkmal ist schlechter als ein fehlendes.

**Die Rechengröße**, aus drei Messungen an drei Schienen (T-202: 19 Striche an 4 px; heute 4 und 3):
Zahl der Striche ≈ Pfadlänge ÷ (3 × Rahmenbreite) in Chromium. Daraus die **Planungsschranke:
Pfadlänge ≥ 12 × Rahmenbreite** — vier Striche in Chromium, drei in WebKitGTK. Ein angepaßtes
Modell, keine Zusage: CSS legt die Strichgeometrie nicht fest.

**Angewandt auf jede Fläche, an der durchgezogen gegen gestrichelt etwas sagt:**

| Fläche | Rahmen | kürzeste Ausprägung | über der Schranke? | Stufe |
|---|---:|---|---|---|
| `.note--internal` | 4 px | `rows={2}` (`TodoFormDialog.tsx:272`), ≫ 100 px | ja, um ein Vielfaches | **Träger** |
| `.badge--not-billed` | 1 px, geschlossen | Pille 22×22, Umfang ≈ 69 px | ja, zwölffach | **Träger** |
| `.table__row--not-billed > td:first-child` | 3 px | 40 px, **compact 32 px** | 40 ja, **32 nein** | Verstärkung |
| `.auditrow__reason--absent` | 2 px | eine Zeile | vermutlich ja, **ungemessen** | Verstärkung |

**Die kürzeste Karte ist die dritte Zeile, und sie kostet nichts.** Eine Buchung ist eine Zeile; in
der dichten Ansicht 32 px, und damit fällt genau diese eine Fläche unter die Schranke. Es fällt
dort aber nichts weg, **weil dort nie etwas getragen hat**: Der Zeilenrand steht in 1.4 ausdrücklich
als reines Farbmerkmal, der Kommentar sagt „zusaetzlich gestrichelt". Getragen wird „Nicht
abgerechnet" dreifach — vom **Balken** des Zustandspunktes (vierte Silhouette neben Ring, Scheibe
und Raute), vom **Symbol** und vom **Wort**.

**Was unterhalb der Schranke an die Stelle tritt, in dieser Rangfolge:** (1) nichts, weil nichts
wegfällt — der einzige heutige Fall; (2) ein anderes Merkmal derselben Fläche (Marke, Symbol,
Wort), **nie eine zweite Farbe**, weil 2.2 dieses Fenster im dunklen Thema arithmetisch geschlossen
hat; (3) die Geometrie festschreiben. **Ausdrücklich nicht:** eine Fläche höher machen, damit die
Striche hineinpassen.

## 4. Die Warnung an den, der den Lauf baut

Steht wörtlich in 2.8 als **P-1 bis P-6**. Der Kern:

* **Geprüft wird die Form:** durchgezogen = genau **ein** Strich, **keine** Lücke; gestrichelt =
  **mindestens drei** Striche, **mindestens zwei** Lücken. Dazu Strichfarbe = Token, Lückenfarbe =
  Karte (das ist das Verhältnis aus 2.5).
* **Jede Schranke ist ein `≥`, nie ein `=`.** Beleg: dieselbe Vorrichtung, dasselbe Erzeugnis, 3
  gegen 4. Eine Gleichheitsprüfung ist nicht die strengere, sondern eine **andere** — sie mißt die
  Engine.
* **Nicht geprüft wird:** feste Strichzahl, feste Strichlänge, gleiche Strichlängen, bemalte Länge
  oder ihr Anteil (23 gegen 28 px sind 18 Prozent), Vergleich gegen ein hinterlegtes Bild.
* **Die Schranke im Lauf ist 4, nicht 3.** Der Lauf fährt in Chromium, der großzügigeren Engine.
  Wer dort 3 verlangt, läßt eine Schiene durch, die im Linux-Erzeugnis 2 zeichnet. Der Zuschlag
  kommt aus **einem** gemessenen Paar und wird bei einem zweiten neu entschieden.
* **Mitgeschrieben, nicht geprüft:** Engine und Fassung, Schienenhöhe, Strichzahl, Strichlängen —
  Stand mit Datum (E-087 Punkt 2).
* **Was der Lauf nicht kann:** Er sagt nichts über WebKitGTK oder WKWebView. Er kann nur Chromiums
  Zahl großzügig genug halten.

## 5. Zwei eigene Fehler in 2.8, berichtigt an Ort und Stelle

1. **`rows={3}` ist der Vorgabewert, nicht die kleinste Ausprägung.** Die kleinste ist `rows={2}`
   in `TodoFormDialog.tsx:272` — und sie ist `scope="internal"`, also ausgerechnet die
   gestrichelte. Das Urteil ändert sich nicht (das Feld liegt weit über der Schranke), aber die
   Messung wäre an das falsche Feld gegangen.
2. **„Drei sichtbare Unterbrechungen" ist zweideutig** — Lücke oder Strich. Als **Lücken** gelesen
   verlangt der Satz vier Striche; WebKitGTK zeichnet drei und wäre rot, während die Form
   unverkennbar dasteht. **Meine eigene Anforderung war der erste Fall des Fehlers, vor dem P-2
   jetzt warnt** (B-21). Verbindlich ist ab jetzt: drei Striche, zwei Lücken.

## 6. Wo was steht (Regel T-7)

| Was | Wohin |
|---|---|
| Zahlen der zwei Engines, Urteil über den Rückfall, T-8, Mindesthöhe, Flächentabelle, P-1 bis P-6 | **2.8** |
| Zweite Bedingung für ein Formmerkmal | **0**, erste Tabellenzeile, Pointer in **0.1** |
| Grenze des Paares „Balken gegen Lücke" | **2.5** |
| Pfadlänge als Maß am Etikett | **1.4**, Zeile Konturform |
| Malreihenfolge in WebKitGTK, Schnitt und Farben | **10.4** |
| Herleitung, Übergabe, Befunde und offene Fragen | **13** (neu) |

---

**Artefakte:** `docs/design/traeger-und-zusage.md` — Abschnitte 0, 0.1, 1.4, 2.5, 2.8, 10.4 und der
neue Abschnitt 13. `docs/design/textabbau-gestalt.md` **unberührt** (es sagt nichts über Schienen
oder Engines; gesucht, nicht angenommen). Kein Produktivcode.

**Annahmen:**

1. **Die Schranke „drei Striche, zwei Lücken" ist eine Hausentscheidung**, wie die 3:1 in
   Abschnitt 0. WCAG nennt für Formmerkmale keine Zahl; Takt braucht eine, weil nur eine Zahl in
   einen Lauf paßt. Sie steht an einer Stelle und ist dort zu ändern.
2. **Der Zuschlag im Lauf (4 statt 3) kommt aus einem einzigen gemessenen Paar.** Ich habe das
   Verhältnis 3 zu 4 als Faktor verallgemeinert, weil ein Lauf eine Zahl braucht — und den Vorbehalt
   in P-4 danebengeschrieben.
3. **Die Faustformel ist ein Modell, das ich an drei Punkte angepaßt habe** (T-202s 19, heute 4 und
   3). Sie stimmt an allen dreien. Sie ist Planungsgröße, nicht Zusage; das steht dabei.
4. **Ich habe die Höhe der gemessenen Vorrichtung nicht erhalten** und sie auch nicht aus den
   Zahlen zurückgerechnet, obwohl es naheläge. Zurückgerechnet wäre es eine Zahl, die wie eine
   Messung aussieht (F-14).
5. **Der Schnitt des Fokusrings ist von mir gegen `tokens.css:267-268` und die Anordnung aus 10.2
   gelesen**, nicht selbst abgezogen: `#2159da` = `--focus-ring-color` hell, `#ffffff` =
   `--focus-ring-contrast` hell, und die Reihenfolge von außen nach innen ist genau die gebaute.

**Risiken:**

1. **Die Planungsschranke steht auf einem Modell, nicht auf einer Messung.** Fällt F-14 anders aus
   als die Formel erwarten läßt, wandert die Zahl 12 — nicht T-8, aber die Tabelle in 2.8. Der
   einzige Eintrag, der dabei kippen könnte, ist die 32-px-Zeile in der dichten Ansicht, und die ist
   eine Verstärkung. **Niedrig.**
2. **Eine Prüfung, die vor dieser Vorgabe gebaut wird, nagelt wahrscheinlich die Strichzahl fest.**
   frontend-dev arbeitet in derselben Welle. Wird P-2 bis P-4 erst danach gelesen, ist die Zusage
   enger als die Wirklichkeit, und der erste Auslieferungsbau unter Linux meldet einen Fehler, den
   es nicht gibt. **Mittel, und zeitkritisch — deshalb steht es zuerst im Bericht.**
3. **macOS/WKWebView bleibt ungemessen** (F-16). Jede Aussage in 2.8 und 10.4 trägt den Vorbehalt;
   wer ihn beim Zitieren wegläßt, macht aus einer halben Grenze eine geschlossene. **Mittel.**
4. **Gemessen ist die Engine-Familie, nicht die gebaute Binärdatei.** WebKitGTK 4.1 auf diesem
   Rechner ist nicht zeichengleich mit dem `libwebkit2gtk` des `ubuntu-24.04`-Läufers. Für die
   **Form** halte ich das für unkritisch (sie hängt an der Zeichenroutine, nicht an der Fassung),
   für die **Zahlen** ausdrücklich nicht — und deshalb tragen die Zahlen keine Zusage. **Niedrig.**

**Offene Fragen:**

1. **F-14, an den Orchestrator, und die Regel hängt daran: wie hoch war die gemessene Schiene?** An
   ihr zeichnet WebKitGTK **genau drei** Striche, liegt also **auf** der Schranke — jede kürzere
   Schiene ist von dieser Messung nicht gedeckt. Mit der Höhe wird aus der Planungsschranke eine
   Messung.
2. **F-15, klein:** `.auditrow__reason--absent` (2 px) ist die einzige Fläche der Tabelle, für die
   weder Messung noch Ausschluß dasteht. Sie trägt nichts allein, der Text sagt dasselbe.
3. **F-16:** macOS/WKWebView — nicht durch mich schließbar, unverändert offen (O-JV, T-207).

**Nächster Schritt:** frontend-dev bekommt 13.2 — vier Textstellen und, falls er die Prüfung baut,
**P-1 bis P-6 wörtlich**, mit der Schranke 4. Danach ist der Satz „durchgezogen gegen unterbrochen
trägt ohne Farbe" an allen fünf Stellen (2.6) nicht nur berichtigt, sondern auch mit der Engine
versehen, in der er gemessen ist.
