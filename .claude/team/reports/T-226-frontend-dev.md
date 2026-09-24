# T-226 — Vier Flächen, ein Baustein: der Auslöser überlebt seinen eigenen Erfolg

**Aufgabe:** T-226 (Welle AI) — O-JR und O-JX zusammen. `ExportGroups.tsx`, `TemplatePreview.tsx`
(Zeile **und** Sperrmeldung), `ExportScreen.tsx` (`SkippedRow`), dazu die Musterseite und die
Hausregeln in `DESIGNSYSTEM.md`.

**Status:** fertig

---

## Artefakte

| Datei | Änderung |
|---|---|
| `apps/web/src/components/ExportGroups.tsx` | Die zwei Bausteine werden **ein** `Button`; Ausprägung wechselt (`secondary` → `ghost`), Sinnbild und Größe bleiben. Verborgener Zusatz `, Buchung {entry.period}`. Kopfkommentar: warum **ein** Baustein und warum **kein** `aria-label` |
| `apps/web/src/screens/TemplatePreview.tsx` | Zeilenknopf: „Bearbeiten" → „Leistung bearbeiten", Ausprägung folgt jetzt dem Mangel, Zusatz `, Buchung {period}` — `formatTimeRange` **einmal** gerechnet und zweimal benutzt. Sperrmeldung der Gruppe (O-JX): Zusatz `, Tagesgruppe {formatDayLabel(summary.day)}` |
| `apps/web/src/screens/ExportScreen.tsx` | `SkippedRow`: Zusatz `, {day}`, `formatDayLabel` einmal gerechnet und zweimal benutzt |
| `apps/web/src/showcase/ExportPreviewSection.tsx` | Neue Bildunterschrift „Am Ende jeder Buchungszeile steht ein Knopf, nicht zwei"; die Ansage des Knopfes nennt die Buchung jetzt mit ihrem **sichtbaren** Zeitraum statt mit ihrer Kennung (dort stand die alte Namensform „Leistung der Buchung … bearbeiten") |
| `apps/web/design/DESIGNSYSTEM.md` | Neuer Abschnitt **5.2** mit U-5, R-0, R-1, R-3, R-4, R-5, R-6 und **N-1 bis N-4** („der Fokus folgt der Arbeit, nicht dem Baum"); dazu der Satz zu `loading` an einem Rückkehrziel (B-18) neben „Deaktiviert gegen ladend"; neue **Regel 16** in Abschnitt 11; Eintrag „Was T-226 geändert hat" |
| `.claude/team/reports/T-226-screens/` | 19 Bildschirmabzüge, beide Themen, 1280×820 und 1024×640 (gitignoriert wie bei T-210/T-217/T-220) |

Nicht angefasst: `DialogSurface.tsx` (F-11 bleibt offener Auftrag), `packages/ui-tokens`,
`apps/desktop`, `tests/**`, `docs/**`.

---

## Zusammenfassung

An allen vier Flächen steht jetzt **ein** Baustein statt zweier: derselbe `Button` mit `pencil`,
`sm` und wechselnder Ausprägung — `secondary`, solange die Leistung fehlt, `ghost`, sobald sie da
ist. Der Zeilenbezug steht als `visually-hidden`-Zusatz **im** Knopf, hinter der sichtbaren
Beschriftung, mit Komma, und schreibt die sichtbare Zeichenkette der Zeile zeichengleich ab; ein
`aria-label` gibt es nirgends, und der Kommentar nennt dafür den **tragenden** Grund (die zweite
Abschrift, die still auseinanderläuft) und ausdrücklich nicht den alten (SC 2.5.3), damit der Weg
nicht zurückkommt. Die vierte Fläche — der Gruppenknopf in der Sperrmeldung — hat den
**Tagesbezug** statt des Zeitraums bekommen; sein Name ist damit nicht mehr der Anfang der Namen
aller Zeilenknöpfe derselben Gruppe. U-5, R-0 bis R-6 und N-1 bis N-4 stehen als Hausregeln in
`DESIGNSYSTEM.md` 5.2, nicht mehr als Befund einer Aufgabe. Im Browser gemessen: **29 Messungen,
0 Fehlschläge**, darunter die eine, auf die es ankommt.

---

## Die Messung, auf die es ankommt

Gemessen in Chromium gegen den echten Dienst und die echte Oberfläche (Dienst aus dem Quelltext
über `tests/e2e/support/version-check-entry.ts` mit eigener GitHub-Attrappe und eigenem
`XDG_DATA_HOME`, `apps/web` über `vite --host 127.0.0.1 --port 5173 --strictPort`; vorher
`ss -ltn` geprüft, nach jedem Lauf beide Prozesse beendet). Das Meßskript liegt **außerhalb** des
Repos unter `/tmp/t226/measure.mts` — `tests/**` gehört e2e-tester.

Der Ablauf ist zeichengleich der aus `TP-FOCUS-07`: Die Auffrischung wird über
`page.route('**/time-entries**')` **angehalten** (nur `GET … ?exportStatus=open`, die `PATCH` läuft
durch), dann wird bei t+0 gemessen, dann das Zügel gelöst, dann auf das sichtbare Ereignis
gewartet (die Zeile zeigt die neue Leistung), dann **noch einmal** gemessen — auf
**Knotengleichheit**, nicht auf Wortlaut.

```
ok  Messung 1 (t+0): Fokus nicht auf <body> — "Leistung nachtragen, Buchung 05:00–05:45 Uhr"
ok  Messung 2: derselbe Knoten hält den Fokus nach der Auffrischung — sameNode=true
ok  Messung 2: nicht <body> — "Leistung bearbeiten, Buchung 05:00–05:45 Uhr"
ok  Messung 2: Name gewechselt auf „Leistung bearbeiten" samt Zeilenbezug
ok  Ausprägung nach dem Gelingen: ghost — {"cls":"btn btn--ghost btn--sm","focusVisible":true,"outline":"2px"}
ok  Tastatur: Enter öffnet, Escape kehrt auf denselben Knopf zurück
    Fokusring: {"focusVisible":true,"outline":"2px","offset":"2px"}
```

`sameNode=true` ist der ganze Punkt: Der Knoten, der bei t+0 den Fokus trug, **ist** der Knoten,
der ihn nach dem Eintreffen der Auffrischung trägt. Der Fokusring steht sichtbar auf ihm
(`:focus-visible`, 2 px Ring, 2 px Abstand), und der Name hat auf „Leistung bearbeiten" gewechselt
— am selben Knoten, ohne zweite Live-Region.

**`TP-FOCUS-07` selbst habe ich nicht gefahren** — `pnpm test:e2e` war mir untersagt, e2e-tester
hat in dieser Welle den Port. Aus dem Quelltext des Falls gelesen und mit der obigen Messung
abgeglichen, wird er grün:

* `row.getByRole('button', { name: 'Leistung nachtragen' })` trifft weiter — Playwright vergleicht
  den Namen ohne `exact` als **Teilzeichenkette**, und der Kopfkommentar des Falls nennt genau das
  als Absicht für den Fall, „sollte der verborgene Zeilenbezug dann schon ergänzt sein".
* `expect(trigger).toBeFocused()` bei t+0: die Zeile trägt in diesem Bild noch die alte, leere
  Leistung, der Knopf heißt noch „nachtragen" — gemessen bestanden.
* `sameNodeAfterRefresh` … `.toBe(true)`: **das ist die Zeile, die heute rot ist**, und sie ist die
  Messung, die ich oben mit `sameNode=true` reproduziert habe.
* `focusedAccessibleName(page)` `.not.toBe('<body>')`: gemessen `"Leistung bearbeiten, Buchung
  05:00–05:45 Uhr"`.

---

## Alle vier Flächen, im gerenderten Zustand gemessen

| # | Fläche | sichtbar | voller Name | Ausprägung |
|---|---|---|---|---|
| 1 | `ExportGroups`, Buchungszeile | `Leistung nachtragen` / `Leistung bearbeiten` | `… , Buchung 05:00–05:45 Uhr` | `secondary` / `ghost` |
| 2 | `TemplatePreview`, Buchungszeile | dieselben zwei | `… , Buchung 06:00–06:20 Uhr` | `secondary` / `ghost` |
| 3 | `TemplatePreview`, **Sperrmeldung** | `Leistung nachtragen` | `Leistung nachtragen, Tagesgruppe So., 06.09.2026` | `secondary` |
| 4 | `ExportScreen`, `SkippedRow` | `Leistung nachtragen` | `Leistung nachtragen, So., 06.09.2026` | `secondary` |

Fläche 3 und 4 sind **im laufenden Fenster** erreicht worden, nicht nur aus dem Quelltext gelesen:
Fläche 3 über eine Tagesgruppe, in der keine Buchung Text trägt; Fläche 4 über einen **echten
Exportlauf**, bei dem die Leistung einer bereits ausgewählten Gruppe hinter dem Rücken der
Oberfläche geleert wurde — der Dienst läßt die Gruppe dann nach E-034 aus, und `result.skipped`
zeichnet die Zeile.

Weitere Messungen, alle bestanden:

* **Der Zusatz kostet kein Layout.** Gemessen am Knopf: `1×1 px`, `position: absolute`, sichtbare
  Textknoten des Knopfes genau `["Leistung nachtragen"]`.
* **Kein `aria-label`, kein `title`** an allen sieben gemessenen Knöpfen der beiden Vorschauen.
* **Der Gruppenknopf ist nicht mehr der Anfang der Zeilennamen** — geprüft mit `startsWith` gegen
  jeden Zeilenknopf derselben Gruppe.
* **„Bearbeiten" allein kommt an diesen Flächen nicht mehr vor.**
* **Musterseite** (`/designsystem.html#export`): die berichtigte Bildunterschrift steht genau
  einmal, beide Zustände tragen den Zeilenbezug, kein Skriptfehler.

### Dichte — der teure Fall, wie in 15.6 verlangt

Gemessen an einer Gruppe, in der **jede** der vier Buchungen ihre Leistung trägt (67 Zeichen), in
beiden Themen:

| Fenster | Spalte 6 (Leistung) | sichtbare Zeichen | Knopf |
|---|---|---|---|
| 1280×720 hell / dunkel | 464 px | 67 von 67 | 165×28 px |
| 1024×640 hell / dunkel | 208 px | 34 von 67 | 165×28 px |

Der vorab entschiedene **Rückfall wird nicht gezogen**: Die Grenze aus 11.7 lautet „weniger als
etwa zwanzig Zeichen", gemessen sind 34 im engeren Fall und der volle Text im weiteren. Die
Klickfläche ist mit 28 px höher als die 24 px aus SC 2.5.8 und breiter als der frühere
Sinnbildknopf.

---

## Nachweis

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** Fehler (einschließlich `typecheck:test` und `typecheck:e2e`) |
| `pnpm test` | **77 Dateien, 1464 Tests, alle grün** |
| `pnpm --filter @takt/web build` | grün, 421 Module |
| `pnpm run contrast` | **0 von 518** Paaren durchgefallen, **259 Paare**, 0 Befunde zur Vollständigkeit, **11/11** Gegenproben |
| `pnpm run proof:surface` | **20 bestanden, 0 fehlgeschlagen**, darunter 12 Gegenproben |
| `pnpm run proof:foreign` | **20 bestanden, 0 fehlgeschlagen**, darunter 3 Gegenproben |
| `pnpm run proof:codepoints` | **45 bestanden, 0 fehlgeschlagen** |
| Browsermessung `/tmp/t226/measure.mts` | **29 Messungen, 0 Fehlschläge** |

`pnpm run proof:all` und `pnpm test:e2e` sind auftragsgemäß **nicht** gefahren worden (E-083
Punkt 3).

### E-087 — der heutige Wortlaut, gemessen am 2026-09-06

Gesucht über den **Wortlaut** und über **beides**: versionierte Dateien (`git grep`) und
Quellverzeichnisse.

| Wortlaut | Fundstellen nach dem Bau |
|---|---|
| `Leistung nachtragen` | 5 in `apps/web/src` (2× `ExportGroups`/`TemplatePreview` als Zweig, 1× `TemplatePreview`-Sperrmeldung, 1× `ExportScreen`, 2× Musterseite als Fließtext), 5 in `tests/e2e/focus-return-after-dialog.spec.ts`, 2 in `docs/testplan.md`, 2 in `board.md` |
| `Leistung bearbeiten` | 2 in `ExportGroups.tsx` (Zweig + Kommentar), 1 in `TemplatePreview.tsx`, 1 auf der Musterseite |
| `Leistung der Buchung … bearbeiten` (alte Namensform) | **null** in `apps/web/src`. Verbleibend: 2 Vorkommen im **Kopfkommentar** von `tests/e2e/focus-return-after-dialog.spec.ts` und 1 in `docs/testplan.md` — beide beschreiben den Zustand **vor** dieser Aufgabe, beide gehören e2e-tester |
| `Bearbeiten` als alleinige Knopfbeschriftung | 3 Vorkommen, alle **Menüeinträge** (`BookingsScreen`, `TodoDetailScreen`, `TodoListScreen`) und nicht dieser Fluß |

---

## Annahmen

1. **Die Musterseite bekommt einen eigenen Hinweisblock statt einer umformulierten Zeile.** Die
   Übergabe verlangt „die Bildunterschrift ist entsprechend zu berichtigen". Der Satz, der die
   Beschriftung nennt („aufklappen und ‚Leistung nachtragen'"), ist nach dem Bau weiterhin richtig
   — falsch war nur, daß die Seite den Baustein nicht erklärt. Ich habe deshalb einen zweiten
   Hinweis unter den ersten gesetzt, der beide Zustände benennt und sagt, warum es **ein** Knopf
   ist. Er duzt nicht und siezt wie die Nachbarschaft.
2. **Die Ansage des Knopfes auf der Musterseite habe ich mitgeändert.** Sie lautete
   `Leistung der Buchung ${entryId} bearbeiten.` — die **alte Namensform**, dazu mit der Kennung
   statt der Uhrzeit. Sie wäre die letzte Stelle im Produkt gewesen, an der die abgeschaffte Form
   noch steht. Jetzt: `Buchung 09:12–09:22 Uhr bearbeiten. Hier öffnet sich sonst der Dialog.`
3. **`formatTimeRange` und `formatDayLabel` werden je Zeile einmal gerechnet** und an beide
   Stellen gereicht. Zwei Aufrufe wären zwei Rechenwege für denselben Wert — genau die Abschrift,
   gegen die 15.4 argumentiert, nur eine Ebene tiefer.
4. **Kommentarorthographie je Datei.** `ExportGroups.tsx` schreibt seine Kommentare durchgängig
   mit `ae/oe/ue/sz`, `TemplatePreview.tsx` und `ExportScreen.tsx` mit Umlauten. Ich habe die
   jeweilige Hausform übernommen statt eine dritte einzuführen. Oberflächentext trägt überall
   echte Umlaute.
5. **R-2 steht nicht mehr in `DESIGNSYSTEM.md`.** T-222 15.8 sagt ausdrücklich, N-1 bis N-4 treten
   an die Stelle der **Tabelle** in R-2, nicht an die der Regeln daneben. Ich habe deshalb R-0,
   R-1, R-3, R-4, R-5 und R-6 aufgenommen und statt R-2 die vier N-Stufen. R-2 als eigener Eintrag
   hätte zwei Ketten nebeneinander gestellt.

---

## Risiken

1. **Der Kopfkommentar von `tests/e2e/focus-return-after-dialog.spec.ts` beschreibt ab jetzt einen
   Zustand, den es nicht mehr gibt** (Zeilen um 301/302 und 340: „Heutiger Zweig: `Button` …",
   „einem `IconButton` (‚Leistung der Buchung … bearbeiten')"). Dasselbe in `docs/testplan.md` um
   4363. Beide Dateien gehören e2e-tester; ich habe sie nicht angefaßt. **Ohne Nachzug liest der
   nächste Durchgang dort eine falsche Gegenwart** — genau die Alterung, die E-087 meint. Klein,
   aber es gehört auf das Board.
2. **Die Ausprägung wechselt jetzt auch in `TemplatePreview`** (vorher dort immer `ghost`). Das ist
   F-12, in 11.8 zugunsten von `secondary` entschieden; wer widerspricht, widerspricht nach dem
   Bau. Kein neues Farbpaar — `contrast` bleibt bei 259 Paaren und 0 Durchfallern, weil beide
   Ausprägungen vorher schon auf derselben Fläche standen.
3. **Meine Browsermessung belegt `TP-FOCUS-07` nicht, sie reproduziert ihn.** Wenn der Fall in
   einem Punkt anders greift als mein Skript (etwa durch den gemeinsamen Testbestand der ganzen
   Reihe), sieht das erst e2e-tester. Meine Messung ist die stärkere in einer Hinsicht — sie mißt
   zusätzlich Ausprägung, Fokusring, Tastaturweg und die drei anderen Flächen —, aber sie ist
   nicht derselbe Prozeß.
4. **Ich habe 5173 und 17843 belegt**, weil der Dienst den Port fest verdrahtet hat und
   `ALLOWED_ORIGINS` nur 5173 zuläßt. Vor dem ersten Lauf war beides frei (`ss -ltn`), nach jedem
   Lauf sind beide Prozesse beendet. Läuft e2e-tester gleichzeitig, kollidieren wir — deshalb
   fahre ich ab jetzt nichts mehr im Browser.

---

## Offene Fragen

1. **An e2e-tester, über den Orchestrator:** Der Kopfkommentar von
   `focus-return-after-dialog.spec.ts` und `docs/testplan.md` TP-FOCUS-07 beschreiben die Bauart
   von **vor** T-226. Nachziehen — und dabei aus dem „heutigen Zweig" die Geschichte machen, die er
   jetzt ist.
2. **An ux-designer (12.6 (a), sein eigener Vorschlag):** Die Liste der ausgelassenen Gruppen kann
   zwei Zeilen mit gleichem sichtbarem Text und jetzt gleichem zugänglichem Namen zeigen — zwei
   ausgelassene Gruppen verschiedener Todos am selben Tag. Der Zusatz kann das nicht heilen, weil
   er abschreibt, was dasteht. Der Vorschlag (die Zeile zeigt den Titel des Todos, durch `Foreign`)
   gehört in denselben Auftrag wie der Fluß von `SkippedRow` und nicht hierher.
3. **F-11 / O-JQ bleibt offen wie vorher.** N-1 bis N-4 sagen jetzt, **was** die Ersatzkette tun
   soll; `fallbackFocus` in `DialogSurface` ist nicht gebaut, weil an diesen vier Flächen kein Ziel
   fällt. Der richtige Anlaß ist die nächste Löschung aus einer Liste heraus.

---

## Nächster Schritt

`visual-qa` gegen die 19 Abzüge unter `.claude/team/reports/T-226-screens/` und, wenn ein Fenster
frei ist, gegen die laufende Oberfläche — Schwerpunkt: die Dichte bei 1024×640 im dunklen Thema
und der Ausprägungswechsel im Augenblick des Gelingens. Danach `e2e-tester` mit `TP-FOCUS-07` und
dem Nachzug aus Offene Frage 1; `unit-tester` mit der billigen zweiten Naht aus 11.9 (derselbe
Knoten vor und nach dem Neuzeichnen, ohne Browser).
