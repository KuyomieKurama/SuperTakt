# T-199 — Die letzte Duz-Stelle, und eine Zusage ohne Wächter

**Aufgabe:** T-199, Welle AD. **Rolle:** integration-dev.
**Status:** fertig.

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/outlook-addin/src/ui/App.tsx` | O-HM Schritt 2: der Satz der Hinweisfläche „Keine E-Mail geöffnet" siezt |
| `apps/outlook-addin/scripts/proof-addin.mjs` | O-HM Schritt 3: `IMPERATIV_AUSNAHME` gelöscht, Nachfolgeprüffall gebaut; **neuer Abschnitt 20** für O-HO |
| `apps/outlook-addin/src/callnumber/pattern.ts` | Kommentar nachgeführt: die achte Duz-Stelle ist gegangen, die Ausnahme gelöst |
| `docs/design/textbestand-aufgabenbereich.md` | Stand der Messung, Abschnitt 4 (Sperrliste), Abschnitt 5 (Anrede), A-08, **neuer Abschnitt 8.7**, Abschnitt 10 |

Nicht angefasst: `TaskPane.tsx` und `TagPicker.tsx` — sie wurden für die Gegenproben am Baum
zweimal verletzt und **zeichengleich** zurückgenommen (`git diff` zeigt an diesen Stellen keine
Abweichung). Kein Exportschlüssel, keine Route, kein Feld hat sich bewegt.

---

## 1. O-HM — die Dreierfolge, in der vorgeschriebenen Reihenfolge

### Der genommene Wortlaut: die Sie-Form

**„Öffnen Sie eine E-Mail, um daraus ein Todo anzulegen."** — nicht eine kürzere Fassung ohne
Anrede, und das gegen die Vorliebe von E-080 Punkt 4. Der Grund ist gemessen und nicht Geschmack:

1. **Der Prüffall trägt nicht beliebige Fassungen, sondern zwei.** `noEmailOpen` in
   `tests/e2e/outlook-addin-build.spec.ts` hängt seit T-192 an dem Teilstring
   „eine E-Mail, um daraus ein Todo anzulegen." Jede Fassung, die diesen Teil aufgibt, macht dort
   eine fremde Zusicherung **blind, ohne sie rot zu machen** — der Ausdruck steht in einer
   `or`-Verbindung mit „Dieser Bereich läuft außerhalb von Outlook.", und im Browserbau greift
   regelmäßig dieser zweite Zweig. Ich hätte einen fremden Prüffall stillschweigend entwertet und
   es nicht gemerkt.
2. **Verhandelbar ist damit nur der Satzanfang**, und ohne Anrede ergeben sich dort ausschließlich
   **Zustandssätze**: „Es fehlt …", „Es braucht …", „Noch fehlt …". Sie sind **nicht kürzer** als
   „Öffnen Sie " und sie sagen etwas **anderes**: Die Bereichsüberschrift darüber nennt den Zustand
   bereits („Keine E-Mail geöffnet"). Ein zweiter Zustandssatz an dieser Stelle wäre genau der
   D-Befund, den ST-A-01 für diese Fläche ohnehin führt. Eine Aufforderung durch eine Doppelung zu
   ersetzen ist keine kürzere Fassung derselben Aussage — sie ist eine andere Aussage.

Wer die Anrede hier ganz loswerden will, streicht die **Überschrift der Hinweisfläche**. Das ist
ST-A-01, es braucht spec-ux-reviewer und e2e-tester, und es ist ausdrücklich nicht diese Aufgabe.

### Die Reihenfolge, und der Nachweis, daß sie erzwungen ist

1. **e2e-tester (T-192)** hatte den Wortlaut gelöst — Vorbedingung, von mir nicht angefasst.
2. **Satz umgestellt** (`App.tsx`). Dabei ist ein verirrtes Leerzeichen vor dem `>` des
   `Callout`-Elements mitgefallen; sonst keine Änderung an der Fläche.
3. **`IMPERATIV_AUSNAHME` gelöscht.** Der Wächter `E-080 Punkt 1` rechnet seither **nichts** mehr
   aus dem Bestand heraus. Der alte Wortlaut bleibt als `IMPERATIV_VORHER` stehen — aber als
   **Gegenprobe**, damit der Wächter die eigene Vergangenheit wiederfindet, nicht als Ausnahme.

**Die Selbstauflösung ist gemessen, nicht angenommen.** Ich habe den Lauf in drei Zuständen
gefahren:

| Zustand | Wächterstand | `proof:addin` |
|---|---|---|
| Satz umgestellt, Ausnahme **noch da** (Schritt 3 fehlt) | vor T-199, 224 Fälle | **223 / 1**, Exit 1 — `O-GE` fällt, genau wie T-190 es gebaut hat |
| Ausnahme gelöscht, Satz **noch in der Du-Form** (Schritt 2 fehlt) | nach T-199, 228 Fälle | **226 / 2** — der Imperativwächter **und** sein Nachfolger |
| beide Schritte gegangen | nach T-199, 228 Fälle | **228 / 0** |

An die Stelle des selbstauflösenden Prüffalls tritt ein **dauerhafter** (`O-HM: die letzte
Duz-Stelle ist umgestellt — und der Satz steht noch da`): Die Du-Fassung darf im ganzen Bestand
nicht mehr vorkommen, die neue Fassung muß **genau einmal** dastehen, und sie darf selbst weder
duzen noch ein Imperativ sein. Ohne die zweite Hälfte wäre der Abschnitt am grünsten, wenn die
Hinweisfläche ganz fehlte — dieselbe Bauart wie die Gegenprobe zu A-19.2 weiter oben im selben
Lauf.

---

## 2. O-HO — zwei Sätze bekommen ihren Wächter

Neuer **Abschnitt 20** in `proof-addin.mjs`, vier Prüffälle. Gemessen wird, was **allein** trägt:

- **SP-A-01** mit allen drei Trägern: „(bleibt in Takt)", „(geht in die Abrechnung)" und — seit
  ST-A-08 der einzige ganze **Satz** dieser Fläche zu A-7.2/R-08 — „Er geht nicht in die
  Abrechnung."
- **SP-A-05** („Text aus der E-Mail gehört in den Vermerk, nicht hierher.") ist mit aufgenommen.
  Er stand nicht in meinem Auftrag, aber er ist seit T-196 aus demselben Grund allein, sein
  Kommentar in `TaskPane.tsx` sagt „bleibt zeichengleich" — und das war bis heute niemandes
  Messung. Dieselbe Klasse, dieselbe Datei, ein Handgriff.
- **SP-A-12** („— entsteht beim Anlegen des Todos") und die **Abhängigkeit ST-A-06 → SP-A-12**.

Drei Bauentscheidungen, jede mit einem Grund:

1. **Zeichengleich, und genau einmal.** Eine Umschreibung ist der Weg, auf dem so ein Satz
   verschwindet; eine zweite Fassung wäre der E-078-Befund.
2. **Gegenprobe einzeln, nicht als Bündel.** Für jeden Eintrag wird eine plausible Verletzung in
   eine **Kopie** der Quelle gesetzt („Er bleibt intern.", `label="Vermerk"`, …), und gefunden
   werden muß genau dieser Eintrag und kein zweiter. Ein Sucher, der bei jeder Änderung alles
   meldet, wird beim ersten Fehlalarm gelockert — und mißt dann nichts mehr.
3. **Die Abhängigkeit als Rechnung, nicht als zwei Behauptungen.** `kuerzungIstGedeckt` ist eine
   **Folgerung**: Die gekürzte Chip-Erklärung ist gedeckt, *solange* der Auswähler die Folge
   ausspricht (Auflage 1 aus Z-44). Wird ST-A-06 zurückgenommen, darf SP-A-12 fallen — ein
   „beides muß dastehen" hätte ST-A-06 unwiderruflich gemacht. Beide Richtungen sind gegengeprobt.

**Am Baum gegengeprobt, nicht nur im Arbeitsspeicher.** Eine echte Änderung an `TaskPane.tsx`
(„Er bleibt intern.") ergab **226 / 2**; das Streichen der Folge in `TagPicker.tsx` ergab
**224 / 4**, darunter die Abhängigkeitsrechnung. Beide Änderungen sind zeichengleich
zurückgenommen.

**Was Abschnitt 20 bewußt nicht mißt:** die ganze Sperrliste. SP-A-02 bis SP-A-26 hängen an
Flächen, die andere Abschnitte des Laufs bereits halten (SP-A-02 an 19d, SP-A-22 über alle 24
Möglichkeiten, SP-A-16 mit seiner Zahl), oder sie tragen ihre Aussage nicht allein.

---

## 3. E-087 — die Zeilenangaben

Gesucht wurde ausschließlich über den **Wortlaut**. Ich habe **keine** der ~75 Zeilenangaben
nachgeführt, die dieses Papier als nicht nachgemessen führt, und ich habe auch keine neue
hinzugefügt: Die drei Einträge, die ich in `App.tsx` und A-08 angefasst habe, nennen ihre Stelle
jetzt über die Hinweisfläche statt über eine Zahl. Die Tabelle „Stand der Messung" trägt dafür
eine eigene Zeile.

---

## 4. Nachweis

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** |
| `pnpm test` | **1456 grün in 76 Dateien** |
| `pnpm run proof:addin` | **228 / 0** (vorher 224/0 — vier neue Prüffälle) |
| `pnpm run proof:taskpane` | **25 / 0** |
| `pnpm run proof:codepoints` | **45 / 0** |
| `proof:all`, `proof:addin-wiring`, `test:e2e` | **nicht gefahren** — E-083 Punkt 3, fester Port, parallele Agenten |

Dazu die drei Rotmessungen aus Abschnitt 1 und die zwei aus Abschnitt 2.

---

## Annahmen

1. **Die Sie-Form statt einer anredefreien Fassung** — begründet in Abschnitt 1. Ich habe die
   Vorrangregel aus E-080 Punkt 4 geprüft und sie greift hier nicht, weil keine anredefreie
   Fassung **dasselbe** sagt, ohne den Teilstring aufzugeben, an dem ein fremder Prüffall hängt.
2. **SP-A-05 mit aufgenommen**, obwohl O-HO nur zwei Sätze nennt. Gleiche Lücke, gleiche Datei,
   gleicher Grund — und der Kommentar daneben sagt „bleibt zeichengleich", ohne daß es jemand maß.
3. **Der alte Wortlaut bleibt im Wächter stehen** — als `IMPERATIV_VORHER` in der Gegenprobe und
   in der Rückfallprüfung, nicht als Ausnahme. Ein Wächter, der die eigene Vergangenheit nicht
   wiederfindet, ist keiner.
4. **Ein verirrtes Leerzeichen** vor dem `>` des `Callout` ist beim Umstellen mitgefallen. Reine
   Schreibweise, keine Fläche.
5. **Der Nachfolgeprüffall pinnt den neuen Wortlaut.** Wird ST-A-01 gebaut, geht er rot — das ist
   gewollt und im Prüffall selbst kommentiert: Wer diesen Satz anfasst, macht **beide** Läufe rot
   und nicht nur einen.

## Risiken

1. **Der Nachfolgeprüffall und der e2e-Fall messen dieselbe Stelle von zwei Seiten.** Das ist
   Absicht, aber es heißt auch: ST-A-01 kostet künftig zwei Dateien in zwei Hoheiten in **einer**
   Welle. Das steht so in Abschnitt 10 des Papiers.
2. **`apps/web/scripts/proof-surface.mjs` nennt `IMPERATIV_AUSNAHME` als Vorbild** („dieselbe
   Bauart wie … im Add-in"). Der Verweis zeigt ab jetzt ins Leere. Es ist ein Kommentar, kein Lauf
   bricht — aber es ist frontend-devs Datei, ich habe sie nicht angefasst. Siehe offene Frage 1.
3. **`docs/testplan.md` beschreibt die Ausnahme im Präsens** (Hoheit e2e-tester). Gleiche Lage.
4. **Sicherheit:** keine. Es sind Oberflächentexte und statische Prüffälle; Abschnitt 20 liest
   Quelltext und ruft keine Fläche auf. Keine echte Call-Nummer, kein Kundenname, kein Zugangsdatum
   ist entstanden — die eingesetzten Verletzungen sind erfundene Sätze in Kopien im
   Arbeitsspeicher.
5. **Base64, Rundung, Anhänge, Frist:** unverändert. Über das Add-in entstehen weiterhin keine
   Anhänge; V-04 steht zeichengleich; der Feldwächter zählt weiterhin zwölf.

## Offene Fragen

1. **Zwei fremde Dateien führen eine Ausnahme, die es nicht mehr gibt** —
   `apps/web/scripts/proof-surface.mjs` (Kommentar, frontend-dev) und `docs/testplan.md`
   (e2e-tester). Beide nur redaktionell. Soll das in Welle AE mitlaufen?
2. **Die Sperrliste ist jetzt zu einem Achtel gemessen.** Vier Einträge von 26. Soll Abschnitt 20
   in einer späteren Welle auf die übrigen ausgedehnt werden, oder bleibt die Regel „gemessen wird,
   was allein trägt"? Ich habe die zweite Fassung gebaut, weil eine vollständige Abschrift der
   Liste in einen Lauf sie zu einer zweiten Quelle neben dem Papier machte.
3. **ST-A-01** wartet weiter auf spec-ux-reviewer **und** e2e-tester. Mein Anteil bliebe eine
   Zeile in `App.tsx` — aber sie nimmt dem e2e-Fall seinen Suchtext.

## Nächster Schritt

ST-A-05 und ST-A-01 in **einen** Auftrag mit ui-designer, spec-ux-reviewer und e2e-tester —
beide hängen an derselben fremden Datei, und beide sind seit drei Wellen die einzigen offenen
Einträge dieses Papiers. Vorher die zwei redaktionellen Verweise aus offener Frage 1 aufräumen,
solange die Erinnerung frisch ist.

---

## Nachtrag (T-199, sofort) — die zweite Hälfte der Gleichlaufmessung

**Auftrag:** E-086, aus T-197. `proof:surface` liest `apps/outlook-addin/scripts/proof-addin.mjs`
seit T-197 **lesend** und hält beide Anredewächter gegeneinander. frontend-dev hat in seiner
Hälfte `(?!-)` gebaut; meine fehlte, und damit stand `proof:surface` bei 19/1.

**Was geändert wurde — zwei Zeichen an zwei Stellen.** In `proof-addin.mjs` endet der Nachblick
von `ANREDE_DU_QUELLE` und `ANREDE_IMPERATIV_QUELLE` jetzt auf `(?![\wäöüß-])` statt
`(?![\wäöüß])`. Der Vorblick bleibt unverändert. Dazu ein Absatz im Kopfkommentar: warum der
Bindestrich dasteht (ein Wort vor einem Bindestrich ist ein **Bestimmungswort** und keine Anrede)
und daß ein Zeichen hier ohne dasselbe Zeichen drüben `proof:surface` rot macht.

**Die rote Meldung war der Arbeitsauftrag und hat gehalten, was E-086 verspricht:** Sie nannte
beide Muster im Wortlaut, beide Dateinamen und die zwei Falltafelsätze, an denen die Seiten
auseinandertraten („Im Prüf- und Entwicklungsbetrieb ist das gewollt.", „Leer-, Lade- und
Fehlerzustand.") — jeweils mit dem Urteil beider Seiten. Ich mußte nichts suchen.

**Gemessen, nicht angenommen:**

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm run proof:surface` | **19 / 1**, Exit 1 | **20 / 0** |
| `pnpm run proof:addin` | 228 / 0 | **228 / 0** — die Zahl hat sich nicht bewegt |
| `pnpm run proof:taskpane` | 25 / 0 | **25 / 0** |

**Und die Kostenfrage selbst nachgerechnet**, statt die 9 → 9 aus T-191/T-197 zu übernehmen: Über
die **sichtbaren** Texte des Add-ins (Quelltext ohne Kommentare plus Manifest — dieselbe Menge,
die der Wächter mißt) findet der Imperativausdruck vorher wie nachher **0** Treffer und der
Du-Ausdruck ebenfalls **0**; über den **ganzen** Quelltext mit Kommentaren sind es vorher wie
nachher **9**. Die Menge der Stellen, die der Bindestrich abzieht, ist leer. Das deckt sich mit
der Zahl aus T-197.

**Befund: keiner.** Hätte `proof:addin` sich bewegt, wäre das der interessante Fall gewesen — dann
sagten die beiden Wächter nicht dasselbe. Er hat sich nicht bewegt.
