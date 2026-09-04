Aufgabe: T-085 — `forbidOnly` nachtragen, und den Dateikopf berichtigen.

Status: fertig

---

## Artefakte

Geändert, unter meiner Dateihoheit (`tests/e2e/**`):

```
tests/e2e/playwright.config.ts   forbidOnly nachgetragen, Dateikopf berichtigt
.claude/team/reports/T-085-e2e-tester.md   dieser Bericht
```

Nicht angefasst: `docs/testplan.md` — geprüft, keine Änderung nötig (siehe Abschnitt 3).

---

## Zusammenfassung

`forbidOnly: process.env['CI'] !== undefined` ist in `tests/e2e/playwright.config.ts` nachgetragen,
mit Begründungskommentar direkt daneben. Der Dateikopf beschrieb einen überholten Zustand (Wurzel-
Rahmen ohne `webServer`, „kann diese Datei entweder aufgehen … oder bestehen bleiben“) und ist
berichtigt: Diese Datei ist jetzt schlicht der Rahmen, der Aufruf ist `pnpm test:e2e`. Der Nachweis
lief wie verlangt — `test.describe.only` temporär gesetzt, `CI=1 pnpm test:e2e` lief rot mit genau
der `forbidOnly`-Meldung, danach zurückgenommen. Der reguläre Lauf brauchte zwei Anläufe: der erste
zeigte 3 echte Fehlschläge plus 1 flaky, alle als Timeouts (60s Testtimeout bzw. 15s
`toBeVisible`), nicht als falsche Assertions — Indiz für Lastspitzen durch die parallel laufenden
Agenten, vor denen der Auftrag selbst warnt, nicht für eine Regression durch meine Änderung (die
bei fehlendem `.only` keine Wirkung auf Laufzeitverhalten hat). Der zweite, ebenfalls vollständige
Lauf war sauber: 34 passed, 0 fehlgeschlagen, 0 flaky.

---

## 1. `forbidOnly` — Nachweis

Vorgehen: `test.describe.only(` testweise auf `tests/e2e/tag-input.spec.ts:52` gesetzt (das erste
`test.describe` in der Datei), `CI=1 pnpm test:e2e` gestartet, Ergebnis geprüft, Datei per Kopie
zurückgesetzt.

Rot mit `CI=1`, vor jedem Testlauf, wie vorgesehen:

```
Error: item focused with '.only' is not allowed due to the 'forbidOnly' option in 'playwright.config.ts': "tag-input.spec.ts TAGINPUT-01 — Vorschläge folgen der Namensregel des Dienstes"

   at tag-input.spec.ts:52

  50 | import { gotoSettings, gotoTodos } from './support/nav';
  51 |
> 52 | test.describe.only('TAGINPUT-01 — Vorschläge folgen der Namensregel des Dienstes', () => {
  53 |   test('„backend“ = „Backend“ = „  Backend  “, aber „Strasse“ ≠ „Straße“', async ({ page }) => {
```

Danach zurückgenommen: `git diff --stat tests/e2e/tag-input.spec.ts` zeigt keine Änderung — die
Datei ist exakt im Ausgangszustand.

## 2. `pnpm test:e2e` — zwei Läufe, ehrlich berichtet

**Erster vollständiger Lauf nach der Änderung:** 30 passed, 3 failed, 1 flaky (6,2 min statt der
üblichen ~1,3 min). Alle vier betroffenen Fälle mit Timeout-Fehlern, keiner mit einer inhaltlich
falschen Erwartung:

- `kanban.spec.ts:283` (TP-KANBAN-04) — „Test timeout of 60000ms exceeded“, auch im Retry.
- `note-separation.spec.ts:64` (TP-NOTE-01) — Timeout beim Warten auf
  `getByRole('button', { name: 'Erstes Feld hinzufügen' })`, auch im Retry.
- `note-separation.spec.ts:98` (TP-NOTE-02/03, Standardvorlage) — `toBeVisible`-Timeout auf
  `getByRole('heading', { name: 'Standardvorlage' })`, auch im Retry.
- `note-separation.spec.ts:141` (TP-NOTE-02/03, abweichende Vorlage) — im ersten Versuch
  fehlgeschlagen, im Retry bestanden → als „flaky“ gemeldet, nicht als „passed“ verschleiert.

Das sind exakt die Symptome, die der Kommentar im Rahmen selbst für `retries: 1` benennt: „Diese
Maschine faehrt mehrere Team-Agenten gleichzeitig … echte, aber fremdverursachte Verzoegerung“ —
hier offenbar so stark, dass selbst ein Wiederholungsversuch nicht reichte. Meine Änderung
(Kommentar plus `forbidOnly`) berührt weder Testdaten noch Timing und war zu diesem Zeitpunkt ohne
aktives `.only` wirkungslos; ich habe das nicht als bestanden gemeldet, sondern einen zweiten
Lauf gefahren, um eine saubere Messung zu bekommen, statt die erste, verrauschte als Ergebnis zu
nehmen.

**Zweiter vollständiger Lauf, direkt danach:** 34 passed, 0 failed, 0 flaky, 1,4 min — der übliche,
saubere Bestand.

## 3. `docs/testplan.md`

Geprüft auf den alten Aufruf mit `-c` gegen eine andere/gelöschte Konfiguration. Einziger Treffer
für „`playwright.config.ts`“ im gesamten Dokument ist die neutrale Formulierung „mit der
gemeinsamen `tests/e2e/playwright.config.ts`“ (Abschnitt 15) — nennt keinen abweichenden Aufruf
und keinen alten Pfad. Keine Änderung nötig.

---

## Annahmen

1. **Als Nachweisstelle für `.only` genügt ein einzelnes `test.describe.only`** — `forbidOnly`
   greift laut Playwright-Dokumentation unabhängig davon, ob `.only` auf `test` oder
   `test.describe` sitzt; ich habe die für diese Codebasis am wenigsten störende Stelle gewählt
   (ein bereits vorhandenes, unabhängiges `describe` in `tag-input.spec.ts`) statt eine neue Datei
   nur für den Nachweis anzulegen.
2. **Die Timeouts im ersten Lauf sind Lastartefakte, keine Regression.** Begründung: alle vier
   betroffenen Fälle scheitern an derselben Fehlerklasse (Warten auf ein Element, das die
   Anwendung normalerweise binnen Millisekunden zeigt), keiner an einer falschen Erwartung; ein
   zweiter, unveränderter Lauf war sofort wieder sauber; meine Änderung enthält keine Zeile, die
   Timing, Testdaten oder Selektoren berührt.

## Risiken

Keine Sicherheitsbefunde. Keine Zugangsdaten, keine echten Call-Nummern oder Kundennamen berührt —
diese Aufgabe hat keine Testdaten angefasst, nur Ausführungskonfiguration und einen Kommentar.

## Offene Fragen

Keine.

## Nächster Schritt

T-085 ist erledigt: `forbidOnly` greift nachweislich, der Dateikopf beschreibt den tatsächlichen
Zustand, `docs/testplan.md` brauchte keine Korrektur. Falls die Maschine unter anhaltender Last
mehrerer paralleler Agenten steht, ist mit gelegentlichen Timeout-bedingten Fehlschlägen trotz
`retries: 1` zu rechnen — kein Handlungsbedarf an dieser Datei, aber wissenswert für den nächsten,
der `pnpm test:e2e` unter Last misst und ein rotes Ergebnis für eine echte Regression halten
könnte, statt es zu wiederholen.
