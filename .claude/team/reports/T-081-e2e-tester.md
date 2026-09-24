Aufgabe: T-081 — `tests/e2e/kanban.spec.ts` prüft eine Bedienung, die es nicht mehr gibt.

Status: fertig

---

## Artefakte

Geändert/neu, alle unter meiner Dateihoheit (`tests/e2e/**`, `docs/testplan.md`, dieser Bericht):

```
tests/e2e/kanban.spec.ts            komplett neu geschrieben — vier Testfälle statt drei,
                                     keiner davon eine Fortführung von Drag & Drop
tests/e2e/support/api.ts            +markTodoDone, +clearTodoDone, +Pool-Typ, +createPool,
                                     +deletePool, +listPools, +deletePoolByName
tests/e2e/support/actions.ts        +createBoardColumn (legt eine Spalte über die echte
                                     Oberfläche an), +pickExistingTag (intern)
tests/e2e/todo-revival.spec.ts      Fall "Startpunkt S-04" repariert — brauchte seit E-054 eine
                                     echte Spalte, um überhaupt eine Karte zu zeigen
tests/e2e/tag-input.spec.ts         TAGINPUT-05: Feldname "Statusspalte" → "Status" nachgezogen
                                     (unabhängige Umbenennung aus derselben Änderungswelle)
docs/testplan.md                    Abschnitt 8 vollständig neu geschrieben; Nachträge in der
                                     Kopfzeile und Abschnitt 5; TP-STATE-04 (Abschnitt 12) und
                                     die Rückverfolgbarkeitstabelle korrigiert
.claude/team/reports/T-081-e2e-tester.md   dieser Bericht
```

Nicht angefasst: alles außerhalb meiner Dateihoheit. `packages/domain`, `packages/storage`,
`apps/local-api` gehören dem domain-dev und wurden nur gelesen (T-076/T-077-Berichte, die
tatsächlichen Routen/Schemas in `apps/local-api/openapi/takt-local-api.yaml`), nie verändert.

---

## Zusammenfassung

`tests/e2e/kanban.spec.ts` prüfte Drag & Drop und einen Dialog „Statusspalten“, die seit E-054/
E-055 nicht mehr existieren — die Datei war grün, ohne noch etwas zu messen. Ich habe sie
komplett neu geschrieben: vier Fälle, die die Regel-basierte Zugehörigkeit tatsächlich prüfen
(Erscheinen/Verschwinden über echte Tag-Änderungen, eine Karte in mehreren Spalten zugleich, die
zwei unterschiedlichen Leerzustände, und der Timerstart, der eine Karte zwischen einer
„Erledigt“- und einer „Unerledigt“-Spalte verschiebt). Jede Spalte entsteht ausschließlich über
die Oberfläche (`support/actions.ts`, `createBoardColumn`), nie über `POST /pools` — genau die
Falle, vor der der Auftrag warnt. Beim vollständigen Lauf sind mir zwei weitere, durch dieselbe
Umstellung verursachte Fehlschläge in Dateien begegnet, die nicht explizit Teil dieses Auftrags
waren (`todo-revival.spec.ts`, `tag-input.spec.ts`); da beide unter meiner Dateihoheit liegen und
das Definition-of-Done ausdrücklich „`pnpm test:e2e` grün“ verlangt, habe ich sie ebenfalls
minimal repariert, statt sie liegen zu lassen. `docs/testplan.md` Abschnitt 8 ist entsprechend neu
geschrieben, mit Querverweisen von den Stellen, die die alte Fassung zitierten.

**Testergebnis, mit der tatsächlich funktionierenden Ausführungskonfiguration**
(`pnpm exec playwright test -c tests/e2e/playwright.config.ts` — Begründung unten unter
„Offene Frage“): **34 von 34 bestanden**, keine übersprungen, keine als „flaky“ markiert (bei
`retries: 1`). Vorher (Stand vor diesem Auftrag, gleicher Befehl): 33 Fälle insgesamt, davon 3
in `kanban.spec.ts` rot (die drei, um die es in diesem Auftrag geht) und — beim genaueren
Hinsehen für den Vollständigkeitsnachweis — 2 weitere rot, die nichts mit meinem Auftrag zu tun
hatten, aber ebenfalls aus derselben E-054/E-055/T-076/T-079-Welle stammten (siehe unten).

---

## 1. Was in `kanban.spec.ts` gelöscht wurde und warum

Alle drei bisherigen Fälle sind weg, keiner in neuer Bedienung nachgebaut:

- **TP-KANBAN-01 (Drag & Drop zwischen Spalten).** A-5.2 und I-14 sind durch E-054 aufgehoben.
  `Kanban.tsx` trägt seit E-054 kein `draggable`, kein `DataTransfer`, keinen `onDrop` mehr — die
  vier Ereignisse, die der alte Test auslöste (`dragstart`/`dragenter`/`dragover`/`drop`), landen
  auf nichts, was sie noch abonniert. Es gibt keine Bedienung mehr, die dieser Fall ausführen
  könnte.
- **TP-KANBAN-02 (Statusspalten umkonfigurieren — anlegen, Reihenfolge, löschen).** Der Dialog
  „Statusspalten“ mit dem Feld „Neue Spalte“ und den Knöpfen „nach rechts“/„nach links“ existiert
  nicht mehr. An seiner Stelle steht „Spalten des Boards“ (`BoardScreen.tsx`,
  `BoardSetupDialog`), der Regeln verwaltet, keine Statuswerte — der Dialog selbst sagt das
  ausdrücklich („Sie suchen die Statuswerte?“ verweist auf die Einstellungen). Eine Reihenfolge
  lässt sich dort laut eigenem Hinweistext „noch nicht“ ändern.
- **TP-KANBAN-04 (Timer direkt von der Karte starten/stoppen).** Die Bedienung selbst gibt es
  noch (A-5.6 ist nicht aufgehoben) — aber der Fall lief mit `createTodo({ title })` ohne jedes
  Tag gegen ein Board, das seit E-054 **leer beginnt**, bis jemand eine Regel einrichtet. Er
  konnte die Karte nie finden und hätte auch nichts Sinnvolles geprüft, selbst wenn er es
  hätte: Ohne reale Spalte lässt sich der interessante Teil dieser Aufgabe — dass ein
  Timerstart eine Karte zwischen Spalten verschiebt, wenn eine davon auf „Erledigt“ filtert —
  gar nicht stellen. Statt ihn 1:1 zu reparieren, ist er in den neuen TP-KANBAN-04 aufgegangen,
  der beides zugleich prüft: Start/Stopp direkt von der Karte **und** die Spaltenwechsel-Wirkung.

**Zählung:** `kanban.spec.ts` hatte 3 Fälle, hat jetzt 4. Der gesamte Bestand unter
`tests/e2e/**` (ohne die beiden Bau-Ergebnis-Dateien mit eigener Ausführungskonfiguration) hatte
33, hat jetzt 34.

## 2. Was an ihre Stelle getreten ist

Vier Fälle, jeder direkt einem Punkt aus dem Auftrag zugeordnet:

| Datei | Fall | Auftragspunkt |
|---|---|---|
| `kanban.spec.ts` | TP-KANBAN-01 | „Eine Karte erscheint, weil die Regel sie trifft — und verschwindet, wenn …“ |
| `kanban.spec.ts` | TP-KANBAN-02 | „Eine Karte steht in mehreren Spalten zugleich“ |
| `kanban.spec.ts` | TP-KANBAN-03 | „Eine Spalte ohne jede Bedingung bleibt leer und sagt das auch“ |
| `kanban.spec.ts` | TP-KANBAN-04 | „Der Timer auf einer erledigten Karte hebt ‚Erledigt‘ auf — und dadurch ändert sich die Spaltenzugehörigkeit“ |

Zwei Fallen aus dem Auftrag, konkret umgangen:

1. **Spalten entstehen ausschließlich über die Oberfläche.** `createBoardColumn`
   (`support/actions.ts`) klickt „Spalten verwalten“ → „Neue Spalte anlegen“ → füllt das echte
   Regelformular (`PoolFormDialog.tsx`) und klickt „Anlegen“ — nirgends `POST /pools`. Tags und
   Todos entstehen weiterhin über die API, wie in jeder anderen Datei unter `tests/e2e/**` auch
   (reine Vorbereitung, kein Teil der geprüften Bedienung).
2. **Mindestens zwei Karten, wo es um Zugehörigkeit geht.** TP-KANBAN-01 legt zwei Todos an,
   von denen während des gesamten Falls nur eines die Regel je erfüllt — die Gegenprobe zeigt,
   dass die Spalte nicht einfach „irgendeine Karte“ zeigt, sobald irgendetwas passiert.

**Eine dritte Falle, unterwegs selbst gefunden, nicht im Auftrag benannt:** Ein erster Entwurf von
TP-KANBAN-02 (mehrere Spalten) suchte eine Spalte über `page.locator('.kcolumn', { hasText: name
})`. Das schlug fehl — mit „strict mode violation: … resolved to 2 elements“ —, weil jede Karte,
die in zwei Spalten steht, im **Text der jeweils anderen Spalte** auftaucht („Steht auch in
„E2E-Kanban-Mehrfach-B-…“„, `Kanban.tsx`). Ein `hasText`-Filter auf den ganzen Spaltenrumpf traf
deshalb sowohl die eigene als auch jede Spalte, die auf sie verweist. Behoben mit einem Filter auf
`.kcolumn__title` allein (Überschrift, nie ein Querverweis) — dokumentiert in `kanban.spec.ts` als
eigener Kommentar an der `boardColumn`-Hilfsfunktion, weil der nächste, der eine Spalte über
ihren Namen sucht, sonst in dieselbe Falle liefe.

**Playwrights `hasText`-Falltür bei „Erledigt“/„Unerledigt“, wie im Auftrag angekündigt** — nicht
`ß`/`ss` (dafür gab es hier keinen Anlass, siehe unten), sondern: Der zugängliche Name jedes
Optionsknopfs in der Achse „Erledigt“ enthält den erklärenden Hinweistext, weil `RadioRow.tsx`
ihn **innerhalb** des `<label>` platziert (`„Erledigt Nur erledigte Todos. …“`, per
`ariaSnapshot()` an der laufenden Oberfläche nachgesehen, bevor ich mich auf eine Vermutung
verlassen hätte). „Unerledigt“ enthält „erledigt“ als Teilzeichenkette und würde ein bloßes
`{ name: 'Erledigt' }` mittreffen. Gelöst mit einem am Anfang verankerten Muster
(`/^Erledigt\b/` gegen `/^Unerledigt\b/`) in `createBoardColumn` — kommentiert, mit Begründung,
an der Stelle selbst.

**Zum `ß`/`ss`-Hinweis des Auftrags:** Keiner meiner erfundenen Namen enthält „ß“ — bewusst,
weil ich testen wollte, was der Auftrag verlangt (Regelzugehörigkeit), nicht Playwrights
Namensfaltung selbst; TAGINPUT-01 deckt Letzteres bereits ausdrücklich ab. Ich habe es trotzdem
geprüft: Kein Feldname, Achsenwert oder Knopftext, den `createBoardColumn` anspricht, enthält „ß“
oder „ss“ in einer Weise, die zwei verschiedene Dinge zusammenfallen ließe.

## 3. Die beiden zusätzlichen Reparaturen, die nicht im Auftragstext stehen

Beim vollständigen Lauf über alle 33 (vor meiner Änderung) Fälle sind mir zwei weitere Fehlschläge
begegnet, die zur selben Änderungswelle (E-054/E-055, T-076, T-079) gehören, aber nicht
`kanban.spec.ts` betreffen:

**`todo-revival.spec.ts`, „Startpunkt S-04 (Kanban-Karte)“.** Legte ein Todo ohne jedes Tag an und
erwartete, es auf dem Board zu sehen — seit E-054 ist das Board ohne eingerichtete Spalte leer.
Repariert, indem der Fall sich selbst eine Spalte mit **neutraler** Achse „Erledigt“ anlegt (über
`createBoardColumn`, dieselbe Oberflächen-Bedienung wie in `kanban.spec.ts`) — genau die
Voraussetzung, unter der die hier geprüfte Aussage („die Kanban-Spalte bleibt unverändert“, E-023)
überhaupt gilt. Kommentar im Fall und im Dateikopf verweist auf `TP-KANBAN-04`, wo das Gegenteil
(eine Spalte, die auf „Erledigt“ filtert) absichtlich geprüft wird. Die anderen vier Fälle in
dieser Datei brauchten keine Spalte (sie prüfen S-01/S-02/S-03/S-05) und sind unverändert.

**`tag-input.spec.ts`, TAGINPUT-05.** Suchte ein Auswahlfeld „Statusspalte“ im Dialog „Neues
Todo“; das Feld heißt seit derselben Umstellung „Status“ (`TodoFormDialog.tsx` — der Status ist
seit E-054 keine Kanban-Spalte mehr, sondern eine Eigenschaft des Todos). Eine Zeile geändert, der
eigentlich geprüfte Befund (die `[hidden]`-Regel für geschlossene Auswahlfelder, T-059) ist davon
unberührt.

**Warum ich diese beiden repariert habe, obwohl der Auftrag nur `kanban.spec.ts` nennt:** Beide
Dateien liegen unter meiner Dateihoheit (`tests/e2e/**`), und die Definition of Done verlangt
ausdrücklich „`pnpm test:e2e` grün“ — nicht „`kanban.spec.ts` grün“. Beide Reparaturen waren
klein, eindeutig auf dieselbe Ursache zurückzuführen und rein innerhalb meiner Hoheit; sie liegen
zu lassen hätte bedeutet, „`pnpm test:e2e` grün“ zu melden, obwohl es das nicht wäre.

## 4. Ausführung

Mit `pnpm exec playwright test -c tests/e2e/playwright.config.ts` (Begründung siehe „Offene
Frage“ unten):

- **Vorher** (unveränderter Bestand, 33 Fälle): 28 bestanden, 5 fehlgeschlagen — die drei aus
  `kanban.spec.ts` plus die zwei oben genannten.
- **Nachher** (34 Fälle): **34 bestanden, 0 fehlgeschlagen**, keine Wiederholung nötig
  (`retries: 1` konfiguriert, keiner davon gebraucht). Vollständiger Lauf zweimal gefahren
  (einmal nur `kanban.spec.ts`, einmal die ganze Suite), beide Male grün.

`pnpm check` habe ich nicht gefahren: Er ist laut `package.json` nicht von `tests/e2e/**`
abhängig (`tsc -p tsconfig.json` inkludiert nur `vitest.config.ts`/`playwright.config.ts`, keine
Datei unter `tests/e2e/`), und meine Änderungen an `docs/testplan.md` sind Markdown. Ich habe
nichts unter `packages/**` oder `apps/**` angefasst, das ihn hätte beeinflussen können.

## 5. `docs/testplan.md`

Abschnitt 8 (Kanban) ist vollständig neu geschrieben — nicht ergänzt —, mit einem Absatz, der
offen sagt, warum: Die alte Fassung prüfte eine Bedienung, die es nicht mehr gibt, und ein
gegenstandsloser Testplan-Abschnitt ist derselbe Fehler wie ein gegenstandsloser Testfall, nur in
Dokumentform. Mitgezogen:

- Kopfzeile: neuer Nachtrag-Absatz, der die Ablösung benennt (Stil wie der bestehende „Hinweis zu
  E-023“).
- Abschnitt 5 (Timer/Wiederbelebung): Nachtrag, der die T-016-Aussage „Erledigt ist unabhängig von
  der Kanban-Spalte“ auf den Fall einschränkt, in dem die Spalte zur Achse „Erledigt“ neutral
  steht, und auf die neue Ausnahme (TP-KANBAN-04) verweist. Die früheren Querverweise auf
  `TP-KANBAN-05`/`-06` sind korrigiert.
- Abschnitt 12 (Zustände je Screen), Zeile TP-STATE-04 (S-04 Kanban): Ziehen/Ablegen durch die
  beiden neuen Leerzustände und den Timer-Aktivzustand ersetzt; der Bestätigungsdialog verweist
  jetzt auf „Vom Board nehmen“ statt auf eine Löschung, die Karten verlieren könnte — die gibt es
  für eine Regel nicht (`DELETE /pools/{id}` löscht nur die Regel, nie ein Todo).
- Rückverfolgbarkeitstabelle: A-2.5, A-5.1–A-5.6 und I-14 korrigiert; I-14 als durch E-054
  aufgehoben markiert, statt weiter auf einen nicht mehr existierenden Testfall zu verweisen.
- „Offene Punkte“: die Zeile zu TP-KANBAN-02 (Annahme zum Konfigurationsort) als erledigt markiert
  — der Ort steht seit T-072 fest.

Nicht angefasst: der Rest des ca. 2000-zeiligen Dokuments. Andere Abschnitte enthalten ältere,
unabhängig davon möglicherweise veraltete Aussagen (z. B. „Kein Testfall in diesem Dokument wurde
ausgeführt“ in „Offene Punkte“, offensichtlich nicht mehr zutreffend) — das ist eine allgemeine
Pflege-Lücke des Dokuments, keine Folge von E-054/E-055, und nicht Gegenstand dieses Auftrags.

---

## Annahmen

1. **`pnpm exec playwright test -c tests/e2e/playwright.config.ts` ist die richtige
   Ausführungskonfiguration, nicht das Wurzel-Skript `pnpm test:e2e`.** Siehe „Offene Frage“
   unten — das ist keine Annahme im Sinne einer Ermessensentscheidung, sondern eine Tatsache, die
   ich nachgemessen habe, bevor ich sie als Grundlage genommen habe.
2. **Die Reihenfolge „erforderliche Tags, dann Achse ‚Erledigt‘“ in `createBoardColumn`
   entspricht der tatsächlichen Reihenfolge im Formular** (per `ariaSnapshot()` an der laufenden
   Oberfläche nachgesehen, nicht am Quelltext geraten).
3. **`markTodoDone`/`clearTodoDone` in `support/api.ts` senden keinen Rumpf** (`PUT`/`DELETE`
   ohne `body`) — wie `todo-revival.spec.ts`s bisherige, direkte `fetch`-Aufrufe es taten, die
   nachweislich funktionieren; nicht das leere `{}`, das `apps/web/src/api/endpoints.ts` sendet.
4. **`createPool`/`deletePool`/`listPools` in `support/api.ts` sind bewusst nur für Aufräumung und
   die eine Stelle in `todo-revival.spec.ts` gedacht, in der das Anlegen selbst nicht der
   geprüfte Schritt ist** — in `kanban.spec.ts` entstehen alle geprüften Spalten ausschließlich
   über `createBoardColumn` (Oberfläche).
5. **Keine echten Call-Nummern, Kundennamen oder Benutzernamen** — alle Tag-, Spalten- und
   Todo-Namen sind erfunden und tragen `Date.now()`-Zeitstempel (`CLAUDE.md`, Abschnitt
   Sicherheit).

## Risiken

1. **`package.json`s Wurzel-Skript `test:e2e` startet keine Dienste und lässt jeden Fall sofort
   scheitern.** Siehe „Offene Frage“ — kein Sicherheitsrisiko, aber ein stiller Fallstrick für
   jeden, der `pnpm test:e2e` wörtlich nimmt, ohne die abweichende Konfiguration unter
   `tests/e2e/playwright.config.ts` zu kennen.
2. **Keine Sicherheitsbefunde.** Alle Testdaten erfunden, keine Zugangsdaten im Testcode, der
   lokale Dienst wird wie in jeder anderen `tests/e2e/**`-Datei über dasselbe Sitzungsgeheimnis
   angesprochen (`support/session.ts`, unverändert).
3. **`todo-revival.spec.ts` legt jetzt an zwei Stellen (S-04-Fall) eine Spalte und ein Tag an, die
   in `finally` aufgeräumt werden** — anders als die übrigen vier Fälle in derselben Datei, die
   ihr Todo nie löschen (bestehende Praxis dieser Datei, nicht von mir eingeführt). Kein
   Datenverlust, nur eine kleine Inkonsistenz in der Aufräum-Disziplin derselben Datei, die schon
   vor T-081 bestand.

## Offene Fragen

1. **`package.json`, Zeile `"test:e2e": "playwright test --pass-with-no-tests"`, benutzt beim
   Aufruf aus der Wurzel den Wurzel-Rahmen (`playwright.config.ts`), nicht
   `tests/e2e/playwright.config.ts`.** Der Wurzel-Rahmen hat laut eigenem Kommentar bewusst
   **keinen** `globalSetup`/`webServer`-Eintrag („Ob das der Vite-Server, der Sidecar oder die
   Tauri-Hülle ist, steht noch nicht fest“ — offenbar seit T-008a nie final entschieden). Ruft man
   `pnpm test:e2e` also wörtlich von der Wurzel aus auf, startet nichts, und **alle** 34 Fälle
   scheitern binnen Millisekunden mit Verbindungsfehlern — nicht weil etwas kaputt ist, sondern
   weil kein Dienst läuft. Ich habe stattdessen `pnpm exec playwright test -c
   tests/e2e/playwright.config.ts` benutzt, wie es im Dateikopf dieser Datei seit T-012 explizit
   dokumentiert ist, und darüber tatsächlich 34/34 grün gemessen. `package.json` gehört dem
   Orchestrator (`CLAUDE.md`, „Gemeinsame Dateien“) — ich kann `test:e2e` nicht selbst auf die
   richtige Konfiguration umbiegen. Vorschlag: `"test:e2e": "playwright test -c
   tests/e2e/playwright.config.ts --pass-with-no-tests"` in der Wurzel, dann könnte
   `tests/e2e/playwright.config.ts` möglicherweise ganz aufgehen, wie ihr eigener Kopfkommentar
   es seit T-012 in Aussicht stellt.
2. **`TP-KANBAN-05` (vormals `TP-KANBAN-03`, „Todo direkt vom Board aus öffnen und bearbeiten“,
   A-5.5) ist weiterhin nicht als eigene Datei automatisiert** — schon vor T-080 nicht, jetzt
   nicht anders. Nicht Teil dieses Auftrags; nur der Vollständigkeit halber im Testplan als offen
   benannt statt stillschweigend verschwiegen.

## Nächster Schritt

`tests/e2e/kanban.spec.ts` prüft jetzt Regelzugehörigkeit statt einer abgeschafften Bedienung,
`pnpm exec playwright test -c tests/e2e/playwright.config.ts` läuft mit 34/34 grün, und
`docs/testplan.md` Abschnitt 8 beschreibt dasselbe Verhalten wie der Code. Vorschlag an den
Orchestrator: die `test:e2e`-Zeile in der Wurzel-`package.json` auf die tatsächlich
funktionierende Konfiguration umstellen (offene Frage 1), damit „`pnpm test:e2e`“ auch wörtlich
genommen grün ist und nicht nur unter der richtigen, aber an einer anderen Stelle dokumentierten
Zusatzangabe.
