# T-352 — A2a, A9, `.board` und die drei Timer-Fälle

**Rolle:** e2e-tester. **Stand:** 2026-09-13, Welle 8, nach T-348/T-350/T-354.

**Gegen welchen Stand gelesen.** `.claude/team/reports/T-351-spec-ux-reviewer.md` (B-19),
`.claude/team/reports/T-350-domain-dev.md` (Abschnitt 5, das Rezept für die drei Timer-Fälle),
`.claude/team/reports/T-348-frontend-dev.md` (Übergabe Punkt 2, `.board`),
`docs/design/fensterfeste-flaechen.md` 8.5/9.1/9.6/9.7 — Abschnitt 9.7 kam **während** dieser
Aufgabe dazu (T-354, ui-designer, mit einer Nachricht an mich); ich habe sie gelesen, bevor A9
fertiggebaut wurde, wie im Auftrag verlangt. `docs/design/fensterfeste-flaechen-fluss.md` R-4,
AK-14 (berichtigt T-354). `.claude/team/risks.md` R-34 (gelesen, nicht angefaßt).

---

## Status

**Fertig.** Alle vier Punkte aus dem Auftrag sind umgesetzt und **echt gefahren** — nicht nur
gebaut. `pnpm test:e2e` läuft in dieser Sitzung zum ersten Mal vollständig grün, über alle vier
Ausführungskonfigurationen (drei bestehende plus eine neue, Begründung unten), 130 Fälle, 0 rot.

---

## 1 — B-19: die drei Lücken aus `viewport-fit.spec.ts`

### A8 nahm den Rahmen in jeder Größe aus (behoben)

`measureRunAreaChildren` bekommt einen zweiten Parameter `includeFrame`. Der Aufrufer im
Hauptlauf reicht `getragen` (dieselbe Bedingung wie bei A2): `.screen__body--frame` wird jetzt nur
**unterhalb** von 960×640 ausgenommen, im getragenen Bereich mitgemessen (9.6 Punkt 2, T-344).
Der widerlegte 9.6-Wortlaut im alten Kommentar ist gestrichen und durch die berichtigte Fassung
ersetzt. Die drei Etiketten mit dem widerlegten Wortlaut (`:44` alt Kopfkommentar, `:285` alt
Fenstergrößen-Label, `docs/testplan.md:4957`) sind nachgezogen — Letzteres über einen neuen
Nachtrag (Abschnitt 35), nicht über eine Änderung des historischen Eintrags in Abschnitt 34, der
als abgeschlossener Wellenbericht steht wie die übrigen 32 „Nachtrag aus …"-Abschnitte davor.

**Gegenprobe gebaut** (`Gegenprobe (T-352, A8) — der Rahmen wird im getragenen Bereich
mitgemessen`), derselbe Flexbox-Mechanismus wie die T-334-Gegenprobe, an `.screen__body--frame`
statt an `.screen__body`: Mit der alten Ausnahme (`includeFrame: false`) bleibt ein 62px-Überlauf
ungesehen; mit der berichtigten Vorschrift (`includeFrame: true`) meldet A8 ihn. Das ist die im
Auftrag verlangte Gegenprobe — „vorher wäre er rot gewesen".

### `.board` fehlte in `A8_RUN_AREA_SELECTORS` (behoben)

Ergänzt. `.board` ist seit T-348 der waagerechte Laufbereich der Kanban-Ansicht (AK-15) und
gehört damit zur Menge, die A8 mißt — je direktem Kind (`.kcolumn`) `scrollHeight ≤ clientHeight
+ 1`; `.board` selbst trägt `overflow-y: hidden`, eine zu hohe Spalte würde sonst abgeschnitten,
ohne daß A8 hinsieht. Kein Prüffall wurde dadurch rot (die Menge war nur um eine Fläche zu klein,
nicht falsch).

### A2a fehlte vollständig (gebaut)

Die Breitenhälfte von A2 (`main.scrollWidth ≤ clientWidth + 1`) stand bis dahin nur innerhalb
`if (getragen)`; unterhalb dessen prüfte A2b ausschließlich `overflow-y !== 'hidden'`, nie die
Breite. A2a läuft jetzt **ohne Untergrenze** über alle sieben Fenstergrößen des Hauptlaufs, plus
ein eigener, kleiner Testfall bei 320×256 (9.2 letzter Satz: „nur A1 und A2a", ausdrücklich ohne
A3/A4/A7/A8) — als eigener `test()` statt einer achten Zeile in `WINDOW_SIZES`, weil eine achte
Größe im Hauptlauf jede der übrigen sieben Zusicherungen hätte einzeln ausnehmen müssen.

### A9 — gebaut, nach der Berichtigung aus T-354

**Vor dem Bau gelesen, wie im Auftrag verlangt:** Die Nachricht des Orchestrators kam mit einer
frischen Fassung von `fensterfeste-flaechen.md` 9.7 (T-354, ui-designer), die AK-14/A9 (a) und (c)
genau an der Stelle berichtigt, die B-20 gemeldet hatte. Gebaut ist die berichtigte Fassung, nicht
die aus T-344:

- **(a)** — aggregiert über die vier **getragenen** Größen (nicht in jeder einzelnen): Der Kasten
  mit `id="inhalt"` hat in mindestens einer davon eine **eigene** Laufstrecke. „Eigene
  Laufstrecke" ist enger als `scrollHeight > clientHeight`: Ein Kasten mit `overflow-y: visible`
  erfüllt diese Ungleichung, obwohl `scrollTop` dort für immer 0 bleibt (selbst gemessen, siehe
  Abschnitt 3) — genau der Zustand von Laufbereich A der Zeiterfassung unterhalb von 68rem. Die
  Messung schließt deshalb `overflow-y !== 'visible'` (bzw. `overflow-x` im Kanban) ein.
- **(b)** — `#inhalt` ist mit `tabIndex === 0` selbst fokussierbar. Das ist die **strukturelle**
  Fassung von „kein weiterer Tabulatorhalt dazwischen": Ein fokussierbares Sprungziel wird nach
  dem HTML-Standard („scroll to the fragment"/„focusing steps") ohne Zwischenschritt direkt
  fokussiert — keine Annahme dieses Laufs, sondern die geprüfte Eigenschaft.
- **(c)** — je Größe, in den zwei Zweigen aus 9.7: der Kasten selbst, oder — **abschließend
  aufgezählt: nur die Zeiterfassung unterhalb von 68rem** — sein nächster laufender Vorfahre.
  Jedes andere Paar aus Ansicht und Fenstergröße ohne eigene Laufstrecke ist rot, auch wenn sich
  dort etwas bewegt hätte.

**Die echte Sprungmarke `<a href="#inhalt">` wird bewußt nicht angeklickt.** Sie ändert
`location.hash`, und `useRoute` liest daraus über `parseRoute` eine neue Route — für den Kopf
„inhalt" gibt es keinen Fall in `parseRoute`, also fällt sie auf `DEFAULT_ROUTE` (Dashboard)
zurück. Das ist keine neue Beobachtung: Derselbe Satz steht bereits im Kopfkommentar dieser Datei
über die Sprungmarke selbst, mit Verweis auf `board.md` (T-326-Fund). Ein echter Klick striche die
gerade geprüfte Ansicht weg, bevor (c) gemessen ist — deshalb prüft (b) strukturell und (c)
fokussiert `#inhalt` direkt per `element.focus()`.

`a9TargetsOf` öffnet die Einstellungen mit `?bereich=daten` statt der Vorgabe „Darstellung".
Gemessen, nicht geraten: Die Vorgabe ist bei 1280×820 zu kurz (671/671); `?bereich=standardtags`
ebenfalls (671/671 — `DefaultTagSettings` zeigt nur ein Suchfeld und die gewählten Tags als
Chips, nicht den ganzen Tag-Baum als Liste, wie ich zunächst angenommen hatte); `?bereich=daten`
(`DataTransferSettings`) überläuft zuverlässig (786/671).

**Zwei Chromium-Eigenheiten im Headless-Betrieb, gemessen statt vermutet — die teuerste Stelle
dieser Aufgabe:**

1. `page.keyboard.press('PageDown'/'ArrowRight')` bewegt in dieser Umgebung nur zuverlässig, wenn
   zuvor eine `page.mouse`-Bewegung über der betroffenen Fläche stattgefunden hat.
2. `scrollTop`/`scrollLeft` zeigen den neuen Wert **nicht sofort** nach `keyboard.press()` — eine
   Messung braucht eine kurze Wartezeit danach (`page.waitForTimeout(200)`).

Ohne beides meldete A9 an praktisch jeder Ansicht „bewegt nichts: 0 → 0", obwohl der Bildlauf in
Wirklichkeit funktionierte — mit einer isolierten Gegenprobe (`page.setContent`, kein Dienst)
Schritt für Schritt eingekreist, bevor ich es in den echten Lauf zurückgetragen habe.

**Nachgewiesen:** `pnpm exec playwright test -c tests/e2e/playwright.config.ts
viewport-fit.spec.ts` — **10 von 10 grün**, 1,3 Minuten isoliert, unverändert im vollen Lauf
(unten). `pnpm exec tsc -p tests/e2e/tsconfig.json` — 0 Fehler.

---

## 2 — Die drei Timer-Fälle: von der Fehlfassung auf die Neustart-Vorrichtung

Fachlich geklärt in `T-350-domain-dev.md`: Die Verengung auf „beim Start des Dienstprozesses
vorgefunden" ist die erste tatsächliche Umsetzung von E-036, nicht ihre Verschärfung. Die drei
Fälle (`:259` `recorded`, `:359` `orphan_discarded`, `:418` `timer_too_short`) stellten den
verwaisten Zustand über einen rohen `startTimer`-Aufruf gegen den **bereits laufenden**
gemeinsamen Dienst her — nach der heutigen, richtigen Regel kann das nie mehr als verwaist
gelten, gleich wie lange man wartet.

**Umgestellt auf die Neustart-Vorrichtung**, dieselbe Bauart wie
`attachment-persistence-live.spec.ts`, exakt nach dem Rezept aus T-350 Abschnitt 5:
`services.ts#restartLocalApi` **nach** dem Anlegen des Eintrags (und nach dem Lebenszeichen, wo
eines gebraucht wird) und **vor** der ersten Navigation — die Reihenfolge ist Inhalt. Neu:

- `tests/e2e/support/timer-stop-announcement-services.ts` — startet ausschließlich die
  Oberfläche, eigene kleine Kopie statt einer Ausfuhr aus `services.ts` (derselbe Grund wie bei
  `attachment-persistence-services.ts`/`version-check-services.ts`: `startWeb` bleibt
  unexportiert und unverändert).
- `tests/e2e/support/global-setup-timer-stop-announcement.ts`.
- `tests/e2e/playwright.timer-stop-announcement.config.ts` — `testMatch:
  'timer-stop-announcement.spec.ts'`.

Geändert:

- `tests/e2e/timer-stop-announcement.spec.ts` — `test.beforeAll`/`test.afterAll` starten und
  beenden den lokalen Dienst jetzt **innerhalb** der Datei (`startLocalApi`/`stopGithubStub`,
  unverändert wiederverwendet); die drei betroffenen Fälle rufen `restartLocalApi` an der
  Stelle des Rezepts auf, mit `test.setTimeout(60_000)`. Die drei übrigen Fälle der Datei
  (`recorded` über die Oberfläche, `discarded` bei zu kurzem Timer über die Oberfläche, die
  Live-Region-Bauart) sind fachlich unbetroffen und laufen unverändert gegen denselben, jetzt
  selbst gestarteten Dienst mit. **Die fachliche Frage jedes der drei Fälle ist unverändert — nur
  der Weg zum Zustand.**
- `tests/e2e/playwright.config.ts` — die Datei kommt in `testIgnore`, derselbe Ausschlussgrund wie
  bei `attachment-persistence-live.spec.ts`.

**Nachgewiesen:** `pnpm exec playwright test -c
tests/e2e/playwright.timer-stop-announcement.config.ts` — **6 von 6 grün**, 14,8 Sekunden.

### Reicht über die Dateihoheit hinaus — Vorschlag an den Orchestrator

`package.json` ist eine gemeinsame Datei. Solange sie nicht angepaßt ist, läuft
`timer-stop-announcement.spec.ts` bei einem bloßen `pnpm test:e2e` **gar nicht** mit — die Datei
ist aus der Hauptreihe ausgeschlossen und in keiner der drei bestehenden Zeilen benannt. Vorschlag,
in derselben Form wie die bestehenden Zeilen für `attachment-persistence`/`version-check`:

```json
"test:e2e": "playwright test -c tests/e2e/playwright.config.ts && pnpm run test:e2e:version-check && pnpm run test:e2e:attachment-persistence && pnpm run test:e2e:timer-stop-announcement",
"test:e2e:timer-stop-announcement": "playwright test -c tests/e2e/playwright.timer-stop-announcement.config.ts",
```

Bis dahin habe ich alle vier Ausführungskonfigurationen einzeln gefahren (Abschnitt 4).

---

## 3 — R-34: nicht gebaut, wie beauftragt

`dataArchive.replaceAll` als zweiter, nicht erfaßter Eingang für offene Timer-Einträge (gelesen in
`risks.md` und `T-350-domain-dev.md` Abschnitt 4). Die Behebung ist ein Polaritätswechsel über
fünf Dateien in `apps/local-api/src/**` und gehört in dieselbe Welle wie ihr Prüffall — hier
**nicht** gebaut, damit nicht gegen einen Zwischenstand gemessen wird, der sich in der nächsten
Welle noch ändert.

---

## 4 — Die Ports: vier Konfigurationen, einzeln gefahren, sauber abgeräumt

`ss -ltn` vor **und** nach jedem der vier Läufe: 17843, 17844 und 5173 frei — keine fremde
Sitzung angefaßt, kein eigener Prozeß liegengeblieben.

| Lauf | Ergebnis | Zeit |
|---|---|---|
| `playwright.config.ts` (Hauptreihe, 39 Dateien) | **117 von 117 grün** | 4,2 Minuten |
| `playwright.version-check.config.ts` | **5 von 5 grün** | 49,1 Sekunden |
| `playwright.attachment-persistence.config.ts` | **2 von 2 grün** | 3,6 Sekunden |
| `playwright.timer-stop-announcement.config.ts` (neu) | **6 von 6 grün** | 14,8 Sekunden |
| **Gesamt** | **130 von 130 grün** | — |

Das ist, nach meiner Einschätzung, **der erste vollständig grüne Stand von `pnpm test:e2e`** in
dieser Sitzung — alle vier Konfigurationen, nicht nur eine Teilmenge, und die Ports nach jedem
Lauf gemessen statt angenommen.

Eine temporäre Debug-Datei (`tests/e2e/debug-a9-temp.spec.ts`) habe ich beim Einkreisen der beiden
Headless-Eigenheiten aus Abschnitt 1 angelegt und **vor Abschluss der Aufgabe wieder gelöscht** —
`git status` zeigt sie nicht mehr.

---

## Annahmen

- **A9 (c) folgt der Berichtigung aus T-354, nicht der ursprünglichen Fassung aus T-344.** Die
  Nachricht kam während des Baus; ich habe die neue Fassung von 9.7 gelesen, bevor ich A9
  fertiggestellt habe, statt die alte Zusage zu lockern oder zu raten.
- **`?bereich=daten` statt `?bereich=standardtags`** für die Einstellungs-Ansicht in A9 — meine
  ursprüngliche Annahme (der Tag-Baum aus 9.4 erscheint als Liste in `DefaultTagSettings`) war
  falsch und ist am laufenden Bild widerlegt worden, bevor ich sie in den Prüffall geschrieben
  habe.
- **`docs/testplan.md` bekommt einen neuen Nachtrag (Abschnitt 35) statt einer Änderung an
  Abschnitt 34.** Die 32 vorherigen „Nachtrag aus …"-Abschnitte sind abgeschlossene
  Wellenberichte und werden nirgends rückwirkend umgeschrieben; derselben Form folge ich.
- **Die beiden Chromium-Headless-Eigenheiten (Maus-„Aufwachen", verzögerte `scrollTop`-Sichtbarkeit)
  gelten für diese Playwright-/Chromium-Fassung in dieser Umgebung** — ich habe sie empirisch
  eingekreist (Abschnitt 1), nicht aus einer Dokumentationsquelle übernommen, und im Quelltext
  dort vermerkt, wo sie greifen.
- **Der zweite Zweig von A9 (c) ist strikt an „Zeiterfassung unterhalb von 68rem" gebunden**, wie
  9.7 verlangt — kein anderes Paar aus Ansicht und Fenstergröße darf ihn benutzen, auch wenn dort
  zufällig ein laufender Vorfahre existiert. Das ist im Testfall geprüft, nicht nur behauptet.

## Risiken

- **A9 hängt an zwei ungeschriebenen Chromium-Eigenheiten dieser Umgebung.** Ändert sich das
  Verhalten von Headless-Chromium in einer künftigen Playwright-Fassung (z. B. wird die
  Maus-Bedingung überflüssig oder `scrollTop` synchronisiert sich anders), bleibt der
  Prüffall trotzdem grün — die Wartezeit und die Mausbewegung sind zusätzliche, keine
  ausschließenden Bedingungen. Ein Rückschritt (die Bedingung wird **strenger**) würde den
  Fall dagegen ohne Codeänderung rot machen; das wäre dann ein echter Befund über die Umgebung,
  kein falscher.
- **`?bereich=daten` bindet A9s Einstellungs-Messung an den Inhalt von `DataTransferSettings`.**
  Verliert dieser Bereich seinen Überschuß (kürzerer Text, weniger Knöpfe), müßte A9 (a) für
  „settings" erneut einen anderen Bereich suchen. Das ist dieselbe Klasse Abhängigkeit wie beim
  Vorrat aus 9.4 für die übrigen zehn Ansichten.
- **`timer-stop-announcement.spec.ts` läuft bei einem unveränderten `pnpm test:e2e` nicht mit**,
  bis der Orchestrator die vorgeschlagene Zeile in `package.json` einträgt (Abschnitt 2). Bis
  dahin ist die einzige vollständige Bestätigung dieser Datei der isolierte Lauf aus Abschnitt 4.
- **Sicherheitsseitig nichts Neues:** kein neuer Datenweg, keine neue Adresse, kein
  Öffnen-Aufruf. Die Neustart-Vorrichtung startet denselben lokalen Dienst wie die Hauptreihe,
  gegen dieselbe temporäre `E2E_DATA_DIR`, ohne Verbindung nach außen (`ensureGithubStub`, wie
  überall in dieser Dateifamilie).

## Offene Fragen

1. **Die `package.json`-Zeile aus Abschnitt 2** — Vorschlag steht, Entscheidung beim
   Orchestrator.
2. **Wer nimmt R-34 in die nächste Welle?** Fachliche Klärung liegt in `T-350-domain-dev.md`
   Abschnitt 4/Nächster Schritt vor (Polaritätswechsel, domain-dev, dann unit-tester in der
   Folgewelle). Hier nur zur Kenntnis genommen, wie beauftragt.
3. **`docs/testplan.md` Abschnitt 33/34 zitieren an mehreren Stellen den seit T-344/T-352
   widerlegten Wortlaut wörtlich, als historisches Zitat innerhalb der Begründung ihrer damaligen
   Behebung** (z. B. `:4877`ff „die benannte A8-Ausnahme des Rahmens bei 1024 × 640"). Ich habe
   das **nicht** angefaßt — es ist dort ein Zitat des damaligen Standes, kein aktueller
   Sprechakt, und Abschnitt 34 selbst benennt sein eigenes Rezept für die drei Timer-Fälle bereits
   korrekt im Sinne von T-350. Nur `docs/testplan.md:4957` (die aktive Ausnahme-Behauptung als
   Grund für die 1024×640-Größe) trug den B-19-Befund; das ist mit Abschnitt 35 erledigt.

## Nächster Schritt

`package.json` um die vierte `test:e2e`-Stufe ergänzen (Abschnitt 2), danach kann `pnpm test:e2e`
unverändert als ein Befehl wieder alle vier Konfigurationen fahren. Für die nächste Welle:
R-34 (Polaritätswechsel der Timer-Aufnahme, domain-dev) und danach der zugehörige Prüffall
(unit-tester, folgende Welle).

---

```
Aufgabe: T-352 — A2a, A9, `.board` und die drei Timer-Fälle
Status: fertig
Artefakte: tests/e2e/viewport-fit.spec.ts, tests/e2e/timer-stop-announcement.spec.ts,
  tests/e2e/playwright.config.ts, tests/e2e/playwright.timer-stop-announcement.config.ts (neu),
  tests/e2e/support/timer-stop-announcement-services.ts (neu),
  tests/e2e/support/global-setup-timer-stop-announcement.ts (neu), docs/testplan.md
  (Abschnitt 35, neu)
Zusammenfassung: Die drei B-19-Lücken in viewport-fit.spec.ts sind geschlossen — A8 nimmt
  `.screen__body--frame` nur noch unterhalb von 960×640 aus (mit Gegenprobe), `.board` steht in
  `A8_RUN_AREA_SELECTORS`, und A9 ist gebaut, nach der während der Aufgabe eingetroffenen
  Berichtigung aus T-354 (zwei Zweige bei (c), der zweite abschließend auf die Zeiterfassung
  unterhalb von 68rem beschränkt). Zwei Chromium-Headless-Eigenheiten mußten dafür empirisch
  eingekreist werden (eine Mausbewegung vor der Taste, eine kurze Wartezeit danach). Die drei
  roten Timer-Fälle sind auf die von T-350 vorgezeichnete Neustart-Vorrichtung umgestellt, mit
  einer eigenen, neuen Ausführungskonfiguration (derselbe Grund wie bei TP-ANH-10). R-34 wurde
  gelesen und bewußt nicht gebaut. Alle vier Playwright-Konfigurationen laufen einzeln vollständig
  grün — 130 von 130 Fällen —, `ss -ltn` vor und nach jedem Lauf ohne Rest.
Annahmen: A9 folgt der T-354-Berichtigung, nicht T-344; die Einstellungs-Ansicht für A9 nutzt
  `?bereich=daten` statt der ursprünglich angenommenen `standardtags` (am laufenden Bild
  widerlegt); `docs/testplan.md` bekommt einen neuen Nachtrag statt einer rückwirkenden Änderung;
  die beiden Chromium-Eigenheiten sind für diese Umgebung gemessen, nicht aus einer Quelle
  übernommen.
Risiken: A9 hängt an zwei ungeschriebenen Eigenschaften des heutigen Headless-Chromium (siehe
  Abschnitt „Risiken" oben, mit der Richtung, in der ein künftiger Wandel den Fall eher rot als
  fälschlich grün machen würde); die Einstellungs-Messung von A9 hängt am Inhaltsumfang von
  `DataTransferSettings`; `timer-stop-announcement.spec.ts` läuft ohne die vorgeschlagene
  `package.json`-Zeile nicht in einem einzigen `pnpm test:e2e` mit. Keine neuen Sicherheitswege.
Offene Fragen: die package.json-Zeile aus Abschnitt 2 (Entscheidung beim Orchestrator); wer R-34
  in der nächsten Welle übernimmt (domain-dev laut T-350, dann unit-tester danach).
Nächster Schritt: package.json um `test:e2e:timer-stop-announcement` ergänzen; R-34 als eigene
  Welle (domain-dev, gefolgt von unit-tester) einplanen.
```
