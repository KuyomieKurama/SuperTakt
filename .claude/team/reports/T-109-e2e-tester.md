# T-109 — Add-in-Helfer und -Spezifikationen auf die eine Form der Poolbewegung

**Aufgabe:** T-109 — Add-in-Helfer und -Spezifikationen auf `poolMovement` (E-061 Punkt 3, F1 aus T-104)
**Rolle:** e2e-tester
**Stand:** Zweig `status-als-regelterm`, unkommittiert
**Status:** fertig

---

## Artefakte

| Datei | Was |
|---|---|
| `tests/e2e/support/api.ts` | `AddinTodoMatch` (:565 ff.) und `AddinBookResult` (:591 ff., neue Zeilen nach den vorangegangenen Einfügungen) tragen `poolMovement: PoolMovementNames \| null` statt der drei Felder `poolNames`/`enteringPoolNames`/`leavingPoolNames`. Kopfkommentar an `AddinTodoMatch` erklärt die `null`-Regel aus T-104 Annahme 1. |
| `tests/e2e/pool-movement-sentence.spec.ts` | Kommentar über der Add-in-Hälfte des ersten Testfalls berichtigt (kein Zusammensetzen mehr nötig); `previewMovement`/`bookedMovement` lesen jetzt `match.poolMovement`/`booked.poolMovement` direkt; im Fall „Kein Treffer" wird `poolMovement` gegen `{ appears: [], enters: [], leaves: [] }` geprüft (nicht `null`, da das Todo dort erledigt ist); **neuer Testfall** „Vorschau auf offenem Todo mit bereits offener Buchung: `poolMovement: null`" als Dienstprüfung über die API. |
| `tests/e2e/kanban.spec.ts` | Zeile 16: „Regel über Tags" → „Regel" (W-13). |
| `tests/e2e/todo-revival.spec.ts` | Zeile 16 und Zeile 124: „Regel über Tags" → „Regel" (W-13). |
| `docs/testplan.md` | TP-EXPST-12 Schritt 3 auf die neue Form umformuliert; neuer Testfall **TP-EXPST-12a** dokumentiert (mit ausdrücklichem Hinweis auf O-P, nicht automatisiert prüfbar); neuer Abschnitt „20. Nachtrag aus T-109" mit allen vier Punkten und Nachweis. |

Nicht angefasst: alles außerhalb von `tests/e2e/**`, `tests/fixtures/**`, `docs/testplan.md`. Kein
Produktivcode berührt.

---

## Zusammenfassung

Die vier Fundstellen aus F1 in `reports/T-104-integration-dev.md` sind nachgezogen: Die
Add-in-Helfer in `support/api.ts` und die Erwartungen in `pool-movement-sentence.spec.ts` stehen
jetzt auf der einen Form `poolMovement: { appears, enters, leaves } | null`, wie sie T-104 an den
Add-in-Routen ausgeliefert hat. Der geklärte Punkt aus dem Auftrag: Im Fall „Kein Treffer" ist das
Todo `markTodoDone`, also erledigt — die `null`-Bedingung aus T-104 (offenes Todo **und** schon
eine offene Buchung) trifft dort nicht, der Dienst liefert drei leere Listen, kein `null`; das
prüft der Testfall jetzt ausdrücklich. Ergänzt wurde der in Punkt 2 verlangte neue Fall — Vorschau
auf einem offenen Todo mit bereits offener Buchung liefert `poolMovement: null` — als reine
Dienstprüfung über die HTTP-Antwort, mit dem ausdrücklichen Hinweis, dass die zugehörige
Oberflächen-Zusicherung des Aufgabenbereichs (keine Fläche „Was sich dadurch ändert") ohne
Office.js-Wirt nicht automatisiert prüfbar ist (O-P). W-13 ist, soweit es in meiner Hoheit liegt,
abgeschlossen: Die beiden verbliebenen Stellen in `kanban.spec.ts` und `todo-revival.spec.ts` sind
auf „Regel" statt „Regel über Tags" gestellt, `docs/testplan.md` dokumentiert den Abschluss.

---

## Nachweis

```
pnpm run typecheck:e2e                                                          Exitcode 0
                                                                                 (zweifach reproduziert)

pnpm exec playwright test -c tests/e2e/playwright.config.ts \
  tests/e2e/pool-movement-sentence.spec.ts --reporter=list --retries=0          4/4 (isoliert)

pnpm exec playwright test -c tests/e2e/playwright.outlook-build.config.ts \
  --reporter=list --retries=0                                                  2/2

pnpm exec playwright test -c tests/e2e/playwright.config.ts \
  tests/e2e/done-movement-announcement.spec.ts \
  tests/e2e/timer-stop-announcement.spec.ts --reporter=list --retries=0        8/8

pnpm exec playwright test -c tests/e2e/playwright.config.ts \
  tests/e2e/pool-movement-sentence.spec.ts \
  tests/e2e/done-movement-announcement.spec.ts \
  tests/e2e/timer-stop-announcement.spec.ts --reporter=list --retries=0        12/12 (Verbundlauf)

pnpm exec playwright test -c tests/e2e/playwright.config.ts \
  tests/e2e/kanban.spec.ts tests/e2e/todo-revival.spec.ts \
  --reporter=list --retries=0            1. Lauf: 9/10, TP-KANBAN-02 mit
                                          Zeitüberschreitung (60s); isoliert
                                          nachgefahren: 1/1 in 10,3s; 2. Volllauf:
                                          10/10, TP-KANBAN-02 dabei 9,9s
```

Port 17843/17844 (bzw. 17944 für die Bauergebnis-Prüfung des Add-ins) war vor jedem Lauf frei
(`ss -ltnp` geprüft); kein fremder Prozess beendet. Kein voller `pnpm run test:e2e`, wie
beauftragt — `git status` zeigt parallele, laufende Änderungen von domain-dev
(`packages/domain/**`, `packages/storage/**`, `apps/local-api/**`) und frontend-dev
(`apps/web/**`), keine davon von mir angefasst.

Keine echten Call-Nummern oder Kundendaten — alle neuen Testdaten mit `E2E-`-Präfix, erfunden
(`E2E-BEWEGUNG-OFFEN-…`).

---

## Annahmen

1. **`PoolMovementNames` bleibt der lokale Typ in `support/api.ts`**, nicht `PoolMovement` aus
   `@takt/domain` — konsistent mit der bestehenden Begründung im Kopfkommentar der Datei (diese
   Hoheit soll keine Domänenabhängigkeit brauchen). Strukturell identisch, TypeScript akzeptiert
   die Zuweisung zwischen beiden anstandslos.
2. **Der neue Testfall (Punkt 2) gehört in `pool-movement-sentence.spec.ts`**, nicht in eine neue
   Datei — thematisch dieselbe Fläche (Add-in-Route, `poolMovement`), dieselbe `describe`-Gruppe.
3. **Der neue Testfall ist reine Dienstprüfung**, wie ausdrücklich beauftragt: Er ruft
   `addinBookOnTodo`/`addinTodoMatches` direkt über HTTP auf, ohne Office.js-Wirt. Die
   zugehörige Oberflächen-Zusicherung (`TaskPane.tsx` lässt die Fläche „Was sich dadurch ändert"
   bei `poolMovement: null` weg) ist als offener Punkt in `docs/testplan.md` (TP-EXPST-12a)
   vermerkt, nicht automatisiert geprüft (O-P), wie im Auftrag vorgesehen.
4. **W-13-Korrektur ohne zusätzlichen Nebensatz** an den beiden Stellen in `kanban.spec.ts`/
   `todo-revival.spec.ts`: Beide standen bereits im unmittelbaren Umfeld einer Erwähnung der
   Achsen (`kanban.spec.ts` nennt die fünf Achsen zwei Sätze später, `todo-revival.spec.ts`
   spricht direkt von der Achse „Erledigt") — anders als bei den zwei von T-106 bereits
   korrigierten Stellen in `docs/testplan.md`, wo ein Nebensatz nötig war, weil dort keine
   Achsen-Erwähnung in der Nähe stand.
5. **TP-KANBAN-02 als Parallelarbeits-Symptom eingeordnet, nicht als Regression meiner Änderung**:
   Meine Änderung an `kanban.spec.ts`/`todo-revival.spec.ts` ist ausschließlich Kommentartext
   (`git diff` belegt das); die Zeitüberschreitung trat an einem Klick auf einen Dialogknopf auf,
   der von einem Toast verdeckt war — ein Bereich, an dem laut Aufgabenbeschreibung frontend-dev
   in dieser Welle gerade arbeitet (Toast-Verdrängung, Toastpaar). Zwei Wiederholungen liefen
   grün. Ich habe die Datei `support/actions.ts` nicht angefasst.

---

## Risiken

1. **TP-KANBAN-02 lief einmal in eine 60-Sekunden-Zeitüberschreitung**, weil ein Toast einen
   Dialogknopf verdeckte (`getByRole('dialog', …).getByRole('button', { name: 'Anlegen' })`
   hinter `<li class="toast toast--success">`). Zwei Wiederholungen (isoliert und im Volllauf)
   liefen grün. Da meine eigene Änderung an dieser Datei nur Kommentartext betrifft und die
   parallele Welle laut Auftrag genau an Toast-Verhalten arbeitet (Toast-Verdrängung,
   Toastpaar Board/Regelliste), melde ich die Stelle, statt sie zu deuten oder zu beheben — sie
   liegt außerhalb meiner Hoheit (`support/actions.ts`, `apps/web/**`).
2. **Der neue Fall aus Punkt 2 deckt nur die Dienstantwort ab, nicht die Oberfläche des
   Aufgabenbereichs.** Wie im Auftrag vorgesehen (O-P): Ohne echten Office.js-Wirt lässt sich
   `TaskPane.tsx` in dieser Suite nicht ansteuern. Die Zusicherung „keine Fläche bei `null`" ist
   nur durch Quelltext-Lektüre und T-104s eigene Läufe belegt, nicht durch einen automatisierten
   End-to-End-Test dieser Suite.
3. **Sicherheit:** keine neue Angriffsfläche. Reine Teständerungen — ein Vertragswechsel in
   Testtypen nachgezogen, ein neuer Testfall gegen bestehende Routen, zwei Wortkorrekturen in
   Kommentaren. Keine neue Route, kein neues Geheimnis, keine geänderte Testdaten-Herkunft; alle
   Namen mit `E2E-`-Präfix.

---

## Offene Fragen

Keine an den Orchestrator. Die im Auftrag benannte Klärung (null vs. drei leere Listen) war durch
den tatsächlichen Quelltext (`apps/local-api/src/routes/addin/service.ts:232`) eindeutig zu
beantworten, keine Annahme nötig.

---

## Nächster Schritt

Welle H, wie im Auftrag vorgesehen: Sobald domain-dev (`POST /time-entries` mit `poolMovement`,
W-11 `details[].name`) und frontend-dev (Toast „Zeit gebucht." mit Bewegungssatz, Toast-
Verdrängung, Toastpaar Board/Regelliste) ihren Teil im Baum haben, lege ich die Testfälle für den
Bewegungssatz nach Buchung von Hand und für `details[].name` an. Ein voller
`pnpm run test:e2e`-Lauf ist dann durch den Orchestrator vorzunehmen, sobald alle drei Wellen
zusammenlaufen.
