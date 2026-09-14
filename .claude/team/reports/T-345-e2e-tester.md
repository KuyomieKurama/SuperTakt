# T-345 — Den Meßsatz bauen, den beide Papiere schon zusichern

**Rolle:** e2e-tester. **Stand:** 2026-09-13, Welle 7.

## Status

**Fertig**, mit einem gemeldeten, nicht behebbaren Rest (Anwendung, nicht Prüffall) und einem
nicht reproduzierten Einzelfall.

## Artefakte

- `tests/e2e/viewport-fit.spec.ts` — A8/9.6 gebaut, A2/A2b getrennt benannt, A7 zweite Hälfte,
  zwei neue Fenstergrößen, Gegenprobe für „Rot zuerst" (neu geschrieben/erweitert)
- `tests/e2e/version-check-live.spec.ts` — TP-VER-10 als Gegenprobe von R-33/A-A-111 verknüpft
- `tests/e2e/kanban.spec.ts` — TP-KANBAN-04 behoben (Prüffall-Rennen)
- `tests/e2e/toast-eviction.spec.ts` — behoben (Prüffall, eingefrorene Uhr blockierte eine
  Navigation)
- `tests/e2e/support/version-check-services.ts`, `tests/e2e/support/attachment-persistence-services.ts`,
  `tests/e2e/support/global-setup-version-check.ts`, `tests/e2e/support/global-setup-attachment-persistence.ts`
  — Waisenprozeß-Behebung (dieselbe Klasse wie T-330 in `services.ts`), auf zwei bisher
  unbehandelte Kopien übertragen
- `docs/testplan.md` — Abschnitt 34 (Nachtrag T-345)
- `.claude/team/reports/T-345-e2e-tester.md` — dieser Bericht

## Zusammenfassung

A8 samt Abschnitt 9.6 ist vollständig gebaut (Menge, benannte Ausnahme, zwei Untergrenzen), A2
ist in eine starke Fassung (vier getragene Größen) und eine schwache (A2b, die übrigen drei)
geteilt, A7s zweite Hälfte (Kopfkante = Inhaltskante) läuft an 44 Kombinationen mit, und die zwei
neuen Fenstergrößen aus T-339 sind Teil des Satzes. Eine eigene, dienstunabhängige Gegenprobe
weist nach, daß die neue A8-Funktion den historischen T-334-Fehler tatsächlich gefangen hätte —
echt gefahren, nicht nur behauptet. TP-VER-10 ist als Gegenprobe der Klasse R-33 verknüpft,
gefahren und **grün**. Die zwei nie gelaufenen `test:e2e`-Teilläufe sind einzeln nachgeholt,
beide grün, und haben dabei einen echten Waisenprozeß-Fund in zwei bisher unbehandelten Kopien
von `services.ts#startWeb`s T-330-Fix aufgedeckt und behoben. Von sechs roten Fällen sind zwei
Prüffälle behoben (Rennen ohne Warten, eingefrorene Uhr vor unbesuchter Navigation), drei sind
anwendungsseitig (ein neues, engeres E-036-Gatter) und gemeldet statt angefaßt, einer war nicht
reproduzierbar.

## 1 — A8/9.6, die zwei Untergrenzen, A7 zweite Hälfte, zwei neue Größen (blockierend, B-04)

`tests/e2e/viewport-fit.spec.ts` trägt jetzt:

- **Sieben Fenstergrößen** (`WINDOW_SIZES`): die fünf alten plus 1200×820 und 1024×640 aus T-339.
- **A2 in zwei getrennt benannte Zusicherungen** (`A2 (…, getragen)` gegen `A2b (unerreichbar)`),
  nach `isGetragen()` (Breite **und** Höhe ≥ 960×640, `GETRAGEN_SIZES` mit Selbstprüfung
  `.toBe(4)`) — Begründung im Dateikopf, gegen E-115/AK-02 und A-25.4 (`docs/spec.md`), **nicht**
  gegen den überholten T-323-7.1-Satz, den die Datei bis heute zitierte (B-03).
- **A8 vollständig**: `measureRunAreaChildren()` mit der Menge aus 9.6 Punkt 1
  (`.screen__body:not(--frame)`, `.runarea`, `.kcolumn__body`, unterhalb 68rem zusätzlich
  `.screen__body--split`), der Ausnahme aus Punkt 2 (`.screen__body--frame` selbst zählt nicht),
  der Einschränkung aus Punkt 3 (kein `fixed`/`absolute`), und **beiden** Untergrenzen — global
  über den ganzen Lauf gezählt, mit Begründung, warum nicht je Zelle (nicht jede Ansicht hat bei
  jeder Größe echten Überschuß; siehe 9.4).
- **A7, zweite Hälfte**: Kopfkante = Inhaltskante, an den vier getragenen Größen über alle elf
  Ansichten (44 Kombinationen, dieselbe Zahl wie T-334), im selben Navigationsdurchlauf wie
  A1/A2/A3/A8 statt in einem zweiten.
- **Eine Gegenprobe** (`page.setContent()`, kein Dienst nötig): baut den Flexbox-Mindesthöhe-0-
  Fehler aus T-334 mechanisch nach und weist in zwei echten Läufen nach, daß A8 ihn ohne die
  T-334-Behebung fängt und mit ihr nicht mehr.

**Gefahren, echt, gegen den zusammengebauten Dienst:** `pnpm exec playwright test -c
tests/e2e/playwright.config.ts viewport-fit.spec.ts` — **6 von 6 grün**, 27,2 Sekunden.
`pnpm exec tsc -p tests/e2e/tsconfig.json --noEmit`: 0 Fehler. Die beiden Gegenprobe-Fälle liefen
zusätzlich isoliert (eigene, temporäre Ausführungskonfiguration ohne `globalSetup`, nach dem Lauf
wieder entfernt) — ebenfalls grün.

## 2 — A2-Geltungsbereich (Abschnitt 2 des Auftrags)

Gebaut gegen **E-115/AK-02 und A-25.4** (`docs/spec.md`, „getragen" = Breite **und** Höhe ≥
960×640, ohne Hüllenmeldung), nicht gegen einen der beiden Papierwortlaute — der Auftrag hat das
so verlangt, für den Fall, daß T-344 zu einer anderen Formulierung kommt. Kein Widerspruch
zwischen A-25.4 und E-115 gefunden.

## 3 — TP-VER-10 als Gegenprobe von R-33

`version-check-live.spec.ts` trägt jetzt einen Kommentar unmittelbar vor `TP-VER-10`, der ihn
ausdrücklich mit R-33 und A-A-111 verknüpft und erklärt, warum ein Verhaltensprüffall hier
leistet, was kein Quelltextwächter kann (er mißt die Auskunft auf dem Bildschirm, nicht die
ausgehende Anfrage). **Gefahren: grün** — `pnpm run test:e2e:version-check`, 5 von 5, 48,8
Sekunden. Für den Benutzer kommt die Auskunft am heutigen, tatsächlich zusammengebauten Dienst
an. Der Fall ist bereit, sobald A-A-111 (domain-dev, eigene Welle) den in R-33 noch offen
genannten Rest der Klasse angeht — er müßte dafür nicht geändert werden, nur ein Ausschalter an
einer der genannten Stellen müßte tatsächlich existieren, damit dieser Fall ihn fängt.

## 4 — Die zwei nie gelaufenen Läufe, nachgeholt, mit einem echten Nebenfund

`pnpm run test:e2e:version-check`: 5/5 grün. `pnpm run test:e2e:attachment-persistence`: 2/2
grün. Beide waren durch die `&&`-Verkettung von `pnpm test:e2e` in T-330 nie einzeln gelaufen.

**Nebenfund, behoben:** Beim ersten Lauf von `test:e2e:version-check` blieb `vite` auf Port 5173
hängen — derselbe Waisenprozeß-Fehler, den T-330 in `services.ts#startWeb` bereits gefunden und
behoben hatte (`child.kill('SIGTERM')` trifft nur `pnpm`, nicht das Enkelkind `vite`), hier in
zwei bislang unbehandelten Kopien: `version-check-services.ts#startVersionCheckWeb`/
`stopVersionCheckWeb` und `attachment-persistence-services.ts#startAttachmentPersistenceWeb`/
`stopAttachmentPersistenceWeb`. Beide Dateien tragen bewußt eine **eigene, kleine Kopie** statt
eines Imports aus `services.ts` (so in ihrem eigenen Dateikopf begründet) — die Behebung ist
deshalb in beiden Dateien dupliziert, in derselben Bauform wie `services.ts#killShellChildTree`
(`detached: true` außerhalb von Windows, `process.kill(-pid, 'SIGTERM')`). Beide `stop…Web`
sind jetzt `async`, und ihre beiden `globalSetup`-Aufrufer (`global-setup-version-check.ts`,
`global-setup-attachment-persistence.ts`) rufen sie jetzt mit `await` — ohne `await` bräche der
Node-Prozeß vor der Signalisierung ab und der Fund käme beim nächsten Lauf zurück. Beide
Konfigurationen danach zweimal nachgefahren: sauber, `ss -ltn` ohne Rest auf 5173.

## 5 — Sechs rote Fälle

| Fall | Ursache | Behandlung |
|---|---|---|
| `kanban.spec.ts:288` (TP-KANBAN-04) | Prüffall: `stopDialog.isVisible()` wartet nicht; unmittelbar nach dem Klick war der Dialog noch nicht gezeichnet | **Behoben** — `waitFor({ state: 'visible', timeout: 5_000 })`, dieselbe Frage mit echtem Warten. 5/5 grün |
| `toast-eviction.spec.ts:123` | Prüffall: die zweite Navigation (Todos) geschah unter bereits eingefrorener Uhr, die Ansicht blieb dauerhaft bei „Ansicht wird geladen …" | **Behoben** — kurzes `resume()`/`pauseAt(...)` um genau diese Navigation, kostenlos für die geprüfte Sache. Grün |
| `timer-stop-announcement.spec.ts:216, :316, :368` | **Anwendung**: `apps/local-api/src/features/timer/timer.ts:31-35` (`captureTimerRecovery`) und `:358-361`/`:400-404` — ein neues Gatter erfaßt einmalig beim Dienststart, welcher Eintrag da lief; ein danach über die rohe API gestarteter Eintrag gilt nicht mehr als „verwaist" | **Nicht behoben, gemeldet.** Fachlich eine engere, konsistente E-036-Fassung, keine Regression — aber die drei Fälle können unter dieser Regel keinen echten Fall mehr erzeugen, egal wie geschrieben. Eine tragfähige Behebung bräuchte einen echten Dienst-Neustart nach dem Anlegen des Eintrags (wie `attachment-persistence-live.spec.ts`) und damit eine eigene Ausführungskonfiguration — reicht über `tests/e2e/**` hinaus in `package.json` (gemeinsame Datei) |
| `attachment-crud.spec.ts:35` | — | **Nicht reproduziert.** Zweimal gefahren (isoliert, im Verbund), beide Male grün |

Gesamtnachweis der vier Dateien nach den Behebungen: 13 Fälle, 10 grün, 3 rot (die genannten
anwendungsseitigen), 1,5 Minuten, `ss -ltn` vor und nach ohne Rest.

## Annahmen

- Die zwei Untergrenzen aus 9.6 zähle ich **global über den ganzen Lauf**, nicht je
  Ansicht/Größe — der Wortlaut in 9.6 („mindestens ein Laufbereich … gefunden") ist nicht
  eindeutig auf eine Zelle bezogen, und eine Untergrenze je Zelle wäre an Ansichten ohne
  verstärkten Vorrat (9.4 nennt vier, nicht elf) blind rot, ohne etwas zu messen. Im Bericht
  offen benannt, nicht still entschieden.
- Die Gegenprobe für „Rot zuerst" baut den Flexbox-Mechanismus **mechanisch nach**, statt das
  historische DOM einer bestimmten Ansicht am alten Bestand nachzustellen — schneller, und die
  Ursache ist ohnehin ein allgemeiner CSS-Mechanismus (Flexbox §4.5), kein ansichtsspezifischer.
- `attachment-crud.spec.ts` habe ich als „nicht reproduziert" statt als „stillschweigend
  behoben" gemeldet — ich habe nichts daran verändert.

## Risiken

- Die drei roten Fälle in `timer-stop-announcement.spec.ts` bleiben rot, bis jemand sie in eine
  eigene, neustartfähige Ausführungskonfiguration überführt (Vorschlag unten). Bis dahin zeigt
  `pnpm test:e2e` dort echte Fehlschläge, die keine Anwendungsregression sind — wer das nicht
  weiß, könnte danach suchen.
- Der Waisenprozeß-Fund in Abschnitt 4 könnte in weiteren, noch unbehandelten Kopien desselben
  Musters stecken, die dieser Auftrag nicht durchsucht hat (nur die vier `spawn('pnpm', ['exec',
  'vite', …])`-Fundstellen unter `tests/e2e/support/**` wurden geprüft, alle vier tragen jetzt
  die Behebung).

## Offene Fragen

- Wer überführt `timer-stop-announcement.spec.ts`s drei Orphan-Fälle in eine eigene
  Ausführungskonfiguration mit echtem Dienst-Neustart? Das braucht eine Zeile in `package.json`
  (gemeinsame Datei, Orchestrator) und eine neue `global-setup-*.ts` plus `playwright.*.config.ts`
  (meine Dateihoheit) — ein Auftrag über beide Hoheiten.
- A-A-111 (domain-dev, eigene Welle) kann TP-VER-10 jetzt als fertige Gegenprobe nutzen, sobald
  die verbliebenen Stellen aus R-33 angegangen sind.

## Nächster Schritt

Vorschlag an den Orchestrator: einen Auftrag für die drei Orphan-Fälle vormerken (eigene
Ausführungskonfiguration, `package.json`-Zeile), sonst ist B-04 aus T-343 vollständig
geschlossen und Welle 7 kann zur Freigaberunde übergehen.
