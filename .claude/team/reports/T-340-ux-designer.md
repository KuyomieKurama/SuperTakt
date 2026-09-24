# T-340 — `fensterfeste-flaechen-fluss.md` auf das nachziehen, was gemessen wurde

**Rolle:** ux-designer. **Stand:** 2026-09-13.
**Vorlagen:** `docs/design/fensterfeste-flaechen.md` (T-323, besonders 7.1/7.2 und 9.1/9.2),
`.claude/team/decisions.md` E-112/E-113/E-114, `.claude/team/reports/T-326-frontend-dev.md`,
`T-329-visual-qa.md`, `T-330-e2e-tester.md`, `T-331-code-reviewer.md`, `T-334-frontend-dev.md`.
Am Quelltext gegengelesen: `apps/web/src/styles/app.css`, `viewport-layout.css`,
`apps/web/src/shared/ui/ScreenBody.tsx`, `Primitives.tsx`,
`apps/web/src/features/settings/SettingsScreen.tsx`, `packages/ui-tokens/tokens.css`.

**Status:** fertig. Vier Berichtigungen, jede mit dem Grund, der sie erzwungen hat. Eine
Entscheidung getroffen (Punkt 4), weil sie meine Regel betrifft. Kein Produktivcode angefaßt,
`fensterfeste-flaechen.md` nicht angefaßt, kein Oberflächentext neu, geändert oder gestrichen.

---

## 1 — AK-02 ist zurückgenommen

**Neu:** Im getragenen Fenster (≥ 960 × 640, ohne Hüllenmeldung, ohne Fassungshinweis) läuft
`.app__main` senkrecht nicht, und die Zahl der inneren Laufbereiche ist die aus Abschnitt 4. Im
Rückfall läuft der Rahmen, und der Laufbereich läuft **innerhalb seines Bodens von 4 rem**
weiter — verschachtelt, nicht übereinander. Gehalten: AK-01 und „keine Fläche unerreichbar".
Nicht gehalten: „genau eine Bildlaufleiste sichtbar".

Mitgezogen, weil die alte Zusage an fünf Stellen stand: R-2 (neuer Punkt „übereinander heißt
nicht ineinander"), R-3 (ganz neu gefaßt: keine Schwellenzahl, Reihenfolge des Nachgebens,
Geltung), Z6 und Z7 in der Zustandsmaschine, AK-18, Abschnitt 12 Punkt 1 und 5,
Risiko R-f, Abschnitt 1 Gegenprobe, Abschnitt 2 Satz 3, 4.4 Kanban.

**Der Grund, festgehalten:** T-322 hat eine Zahl verlangt und sie an T-323 abgegeben; T-323 hat
statt der Zahl den Mechanismus geliefert. Der Mechanismus erfüllt meine eigene Forderung
**genauer** als die Zahl — der Rahmen *ist* der Inhaltsbereich, eine Hüllenmeldung macht ihn
niedriger, und der Rückfall greift entsprechend früher, ohne daß jemand eine Zahl nachzieht.
Eine `@media (max-height: …)`-Abfrage hätte das nie gekonnt, weil sie das Fenster mißt. Die
Zurücknahme ist deshalb keine Niederlage der Regel, sondern ihre bessere Bauform.

## 2 — Der Name des Einstellungs-Laufbereichs (4.11)

Nachgezogen: Der Name kommt aus `AREA_LIST`, also aus dem Eintrag der Bereichsschiene, über den
der Benutzer hergekommen ist — „Darstellung", „Timer", „Export", „Daten", „Standard-Tags",
„Status", „Outlook-Add-in", „Arbeitsplatz". Die alte Zuordnung (Kartentitel, Rückfall
„Einstellungen" bei zwei Karten) ist gestrichen.

**Taugen sie als zugängliche Namen? Ja, und sie sind besser als die alten** — geprüft, nicht
behauptet:

- Der Name ist der Text, den der Benutzer angeklickt hat; die Schiene zeigt denselben Eintrag
  als `aria-current="page"`. Wer mit der Tastatur in den Laufbereich springt, hört die
  Bestätigung seiner Auswahl. Der alte Name sagte in zwei von acht Bereichen „Einstellungen".
- **Eine Doppelung ist dadurch verschwunden:** Der Rahmen heißt `ScreenFrame label="Einstellungen"`.
  Vorher lag darin ein Gebiet namens „Einstellungen" — zwei gleichnamige Landmarken desselben
  Typs, ineinander. Eine Vorlesehilfe sagte zweimal dasselbe an.
- **Keine neue Doppelung entsteht:** `Card` setzt `aria-labelledby` nur mit übergebener `id`; in
  `features/settings/**` wird keine übergeben. Die Karte „Outlook-Add-in" im Gebiet
  „Outlook-Add-in" ist deshalb Überschrift, nicht Landmarke.
- **Auflage (R-g, Abschnitt 10):** „Timer", „Export", „Daten", „Status" stehen in derselben
  Ansicht dreifach — als `link` in der Schiene, als `region` und als `heading`. Für AT eindeutig,
  für eine rollenfreie Abfrage vieldeutig. Jede Abfrage schränkt die Rolle ein:
  `getByRole("region", { name: "Timer" })`, nie `getByText("Timer")`.

## 3 — Die Rückfrage vor dem Öffnen einer Datei (R-6 neu gefaßt)

R-6 hieß „Was fest positioniert ist, bleibt unberührt". Das war falsch, und der Beleg ist
gemessen (T-334): in `glass`/`liquid-glass` 644 × 298 bei (265, 364) statt 1280 × 820 bei (0,0),
„Öffnen" außerhalb des sichtbaren Bereichs, Fläche rollte mit.

Neue Regel: **Eine Bestätigungsfläche hängt am Fenster, nie an dem, was sie bestätigt.** Drei
tragende Sätze: (a) der Auslöser ist nicht der Ort — was den ganzen Bildschirm unterbricht, hat
den ganzen Bildschirm als Rahmen; (b) `position: fixed` allein sichert das nicht zu, weil jede
Mal-Eigenschaft eines Vorfahren (`backdrop-filter` war es) den umschließenden Block verschiebt —
eine Zusage, die eine ganze Vorfahrenkette voraussetzt, ist eine Wette auf die nächste Palette;
(c) zugesichert wird strukturell über ein Portal am **Dokumentkörper**, nicht per Verabredung
(dieselbe Lehre wie E-108, dieselbe Bauart wie die Menüs seit T-059). Dazu AK-25 und Risiko R-j,
sowie ein Nachtrag in Abschnitt 8 („Bestätigung") und Abschnitt 9 Nr. 9, und eine Zeile im
Tastaturfluß (Abschnitt 7): Fokus in den Dialog, Falle, `Escape`, Rückkehr auf den Auslöser, der
Laufbereich holt ihn ins Bild.

## 4 — Die Entscheidung: R-3a, der Geltungsbereich des Rückfalls

**Ein Rahmen, der bei 960 × 640 überläuft, ist ein Fehler, nicht der Rückfall.** Von den drei
angebotenen Möglichkeiten gilt die **zweite: der feste Teil ist zu hoch.**

- Die Untergrenze bleibt, wie sie ist — sie steht in `tauri.conf.json` und ist die des
  Erzeugnisses, nicht meine.
- **AK-01 nimmt den Rückfall nicht aus** und muß es nicht: AK-01 mißt das Dokument, und das war
  in allen 55 Paaren grün. Rot war **A2**, die Zusage über den Rahmen — und die ist meine AK-02,
  die jetzt einen Geltungsbereich hat.
- Unterhalb von 960 × 640 ist der laufende Rahmen das erwartete Verhalten. Das stand schon in
  T-323 7.1 („nur die zweite Zusage gilt im getragenen Bereich"); der Meßsatz hat alle fünf
  Größen als getragen gelesen. Die Anpassung ist deshalb **keine Lockerung nach Rot**, sondern
  die Rücknahme einer Überdehnung — und sie kommt mit Ersatz: AK-24 mißt im Rückfall weiter
  (AK-01, AK-02a, alles erreichbar, 4 rem Boden, Tastatur).
- **Waagerecht gibt es keinen Rückfall, in keiner Größe** (AK-02a). `.app__main` trägt
  `overflow-x: hidden` — eine Überbreite ist kein Lauf, sondern ein **Schnitt** (R-d), bis
  hinunter zu 320 × 256 ein Befund.
- **Höhenbudget (AK-23), gerechnet aus der Kette:** 640 − 52 (Kopfleiste,
  `--control-height-lg` 36 + 2 × `--space-2`) = 588 Rahmen; − 24 (`--screen-inset`) = 564;
  − 64 (4 rem Boden) ⇒ **fester Teil höchstens 500 px bei 960 × 640**. Bei Rahmenansichten:
  Kopf plus höchste feste Spalte höchstens 564 px.

**Einsortierung der zehn Verstöße** (steht als Tabelle im Papier): board 960 × 640 (Höhe *und*
Breite) = Fehler, Ursache ist der zerfallene Bildschirmkopf (536,8 statt 129,8 px; 825 − 720 =
105 px, genau die von T-334 gemessene Überbreite) — in T-334 behoben, nachzumessen. board
831 × 640 und die Breite bei 640 × 480 = dieselbe Ursache. todos 831 × 640 (fünf Pixel) und die
vier Fälle bei 640 × 480 = **richtiger Rückfall**.

**Die eigentliche Stelle ist die elfte:** `div.settings-layout` ragt bei **1024 × 640** um 86 px
über den Rahmen. T-334 hält das für meinen Rückfall — nach R-3a ist es ein **Fehler**, denn
1024 × 640 ist ein getragenes Fenster ohne Meldung. Die Ursache ist die Bereichsschiene mit
gemessenen **577 px** (T-329) gegen rund 535 px verfügbare Höhe. Daraus die Regel: **Ein fester
Teil, der bei 960 × 640 nicht paßt, ist nicht fest** — er muß bei knapper Höhe nachgeben, so wie
er bei knapper Breite schon nachgibt (der Zusatz je Eintrag fällt unter 60 rem). Deshalb tritt er
bei 960 selbst nicht auf: Der Ausgleich existiert, er hängt nur an der falschen Achse. **Wie** er
nachgibt, ist Gestaltung und gehört T-339 (OF-6, drei gangbare Wege benannt); **daß** er nachgeben
muß, ist hier entschieden. R-2 ist entsprechend mit einer Auflage versehen: „feste Zahl von
Einträgen" war an der Zahl gemessen, nicht an der Höhe.

**Antwort auf die Ausgangsfrage — angepaßt oder behoben?** Beides, getrennt: angepaßt wird der
**Geltungsbereich von A2** im e2e-Meßsatz (getragene Größen statt aller fünf, plus AK-24
darunter); zu **beheben** ist der feste Teil an zwei Stellen (Kanban-Kopf — erledigt in T-334;
Bereichsschiene — offen). Wer nur das eine täte, hätte entweder einen Meßsatz, der Richtiges rot
meldet, oder einen, der einen echten Fehler durchläßt.

---

## Was sonst noch geändert wurde — und was nicht

Geändert wurden ausschließlich die Stellen, an denen das Papier dem gemessenen Bestand
widersprach, jede mit Datum und Grund im Text: Kopf (Berichtigungstabelle), 1 Gegenprobe,
2 Satz 3, R-2, R-3, R-3a (neu), R-6, 4.4, 4.11, Z6/Z7, Abschnitt 8, Abschnitt 9 Nr. 9,
Abschnitt 11 (AK-01, AK-02, AK-02a neu, AK-18, AK-19, AK-20, AK-23/24/25 neu, AK-22),
Abschnitt 12 Nr. 1 und 5, Risiken R-f/R-g/R-h und R-j/R-k neu, OF-1, OF-5, OF-6 neu.

**Nicht angefaßt:** die Zuweisung „steht/läuft" der übrigen zehn Ansichten, Abschnitt 5
(Buchungstabelle), Abschnitt 10 (kein neuer Text), OF-2 bis OF-4.

## Kurzfassung

```
Aufgabe: T-340 — fensterfeste-flaechen-fluss.md auf das nachziehen, was gemessen wurde
Status: fertig
Artefakte: docs/design/fensterfeste-flaechen-fluss.md, .claude/team/reports/T-340-ux-designer.md
Zusammenfassung: Vier Stellen berichtigt, jede mit dem Grund. (1) AK-02 ist zurückgenommen: Im
  Rückfall läuft der Rahmen, der Laufbereich läuft innerhalb seines 4-rem-Bodens weiter —
  verschachtelt, nicht übereinander; gehalten werden AK-01 und „nichts unerreichbar", nicht
  „genau eine Bildlaufleiste". R-3 ist dafür ganz neu gefaßt (keine Schwellenzahl, Reihenfolge
  des Nachgebens), Z6, AK-18, Abschnitt 12 und R-f ziehen mit. (2) Der Name des
  Einstellungs-Laufbereichs kommt aus AREA_LIST; die neuen Namen tragen als zugängliche Namen
  und beseitigen sogar die vorherige Doppelung „Einstellungen in Einstellungen" — geprüft, daß
  die Karten darin keine konkurrierenden Landmarken sind. (3) R-6 heißt jetzt „Eine
  Bestätigungsfläche hängt am Fenster, nie an dem, was sie bestätigt" und sichert das
  strukturell über das Portal zu, nicht über `position: fixed`. (4) Entschieden: Ein
  überlaufender Rahmen bei 960 × 640 ist ein Fehler, kein Rückfall — der feste Teil ist zu hoch.
  Dazu ein gerechnetes Höhenbudget (fester Teil ≤ 500 px bei 960 × 640), der Geltungsbereich
  R-3a und die Einsortierung aller zehn e2e-Verstöße einzeln.
Annahmen: (a) Die Zahlen in AK-23 sind aus Token und tauri.conf.json gerechnet, nicht im Browser
  gemessen — sie sind als solche gekennzeichnet und von frontend-dev zu bestätigen; die 588 px
  decken sich mit der von T-330 gemessenen clientHeight bei 640 px Fensterhöhe. (b) Ich habe
  „getragen" als „≥ 960 × 640 und Inhaltsbereich ungeschmälert" definiert; mit stehender
  Hüllenmeldung darf der Rückfall auch im getragenen Fenster greifen, und der Meßsatz mißt das
  Budget deshalb ohne die beiden Zeilen. (c) Die Ursachenzuweisung der board-Verstöße (105 px =
  825 − 720) ist aus zwei Berichten gerechnet, nicht selbst gemessen — nach T-334 nachzumessen.
Risiken: R-3a kann als Freibrief gelesen werden („ein laufender Rahmen ist nie ein Fehler") —
  dagegen steht die Einzelzuordnung aller zehn Fälle und AK-23 als Gegenprobe (neu als R-k
  aufgenommen). Die Bereichsschiene ist heute ein **offener Fehler** im getragenen Fenster; wird
  OF-6 nicht in derselben Welle wie die Anpassung des Meßsatzes entschieden, bleibt er
  unbemerkt, weil der angepaßte Meßsatz ihn bei 1024 × 640 zwar trifft, aber niemand zuständig
  ist. Sicherheitsseitig berührt dieses Papier keine Vertrauensgrenze; ein Hinweis bleibt: Die
  Rückfrage vor dem Öffnen einer Datei (A-19.14) ist eine Sicherheitsfläche — ihre Knöpfe
  außerhalb des Sichtfelds waren kein Schönheitsfehler, sondern eine Bestätigung, die der
  Benutzer nicht lesen konnte, bevor er sie gab.
Offene Fragen: (1) Zwei Sätze gehören in decisions.md und schreibt der Orchestrator: der
  Geltungsbereich des Rückfalls samt Höhenbudget (R-3a/AK-23) und die Regel über
  Bestätigungsflächen (R-6). (2) OF-6 — wie die Bereichsschiene bei knapper Höhe nachgibt:
  Zusatz fällt, Schiene kippt in eine umbrechende Zeile, oder eigene Laufstrecke als feste
  Spalte neben dem Bereich. Alle drei sind mit diesem Papier verträglich; die Wahl gehört
  ui-designer/T-339. (3) T-334 fragt, ob `.screen__body--frame { scrollbar-gutter: stable }`
  bestätigt wird — das ist Gestaltung und gehört T-339, nicht mir; aus Sicht des Flusses ist
  die wiederhergestellte Kante von vor T-326 genau das, was AK-10 verlangt.
Nächster Schritt: T-339 (ui-designer) zieht `fensterfeste-flaechen.md` nach und entscheidet OF-6;
  in derselben Welle e2e-tester: A2 nur noch an den getragenen Größen, darunter AK-24, dazu
  AK-02a in jeder Größe und AK-23 als Budgetmessung bei 960 × 640. Danach frontend-dev für die
  Bereichsschiene — eine Aufgabe, nicht zwei, samt Nachmessung der board-Fälle aus T-330 gegen
  den Stand nach T-334.
```
