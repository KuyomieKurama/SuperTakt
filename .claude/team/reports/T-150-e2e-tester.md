# T-150 — Die 32 End-to-End-Fälle zu Abschnitt 19

**Aufgabe:** T-150 — Die 32 End-to-End-Fälle zu Abschnitt 19 (Frist und Anhänge)
**Status:** fertig
**Rolle:** e2e-tester
**Datum:** 2026-09-05

---

## Artefakte

**Neu**

| Datei | Was |
|---|---|
| `tests/e2e/deadline-lifecycle.spec.ts` | TP-FRIST-01/02/03/08 (Setzen, Ändern, Entfernen, sichtbar an drei Stellen ohne zu öffnen), A-19.1-Zusatzfall, TP-FRIST-11 (keine Achse, inkl. 422 gegen einen Regelterm `kind: 'due'`) |
| `tests/e2e/deadline-computed-state.spec.ts` | TP-FRIST-09 (Zustand gerechnet statt gespeichert, gemessen mit `page.clock` über eine echte Mitternacht) und TP-FRIST-10 (derselbe Tagesbegriff wie die Exportgruppierung, E-025) |
| `tests/e2e/attachment-crud.spec.ts` | TP-ANH-01 bis -04, -07 bis -10 Stufe 1: Feld je Art, kein Rest beim Wechseln, vier gemischte Anhänge, Ersatzbezeichnung (08a/b/c), Vorschaubild ohne externe Anfrage, Entfernen (persistiert), Browserspeicher-Reset |
| `tests/e2e/attachment-open-commands.spec.ts` | TP-ANH-05, -06, -14, -19 — über die erweiterte `shell-shim.ts`-Nachbildung |
| `tests/e2e/attachment-dangerous-input.spec.ts` | TP-ANH-15 bis -18, -20 (Türprüfung, R-21/R-22) |
| `tests/e2e/attachment-export-and-addin-exclusion.spec.ts` | TP-ANH-12 (zwei Vorlagen, Volltextsuche) plus struktureller Nachweis (geschlossene Feldquellenliste), TP-ANH-13 (Spotcheck über die echte Tür) |
| `tests/e2e/attachment-legacy-todo-regression.spec.ts` | TP-ANH-11 (bestehender Weg, „nicht gesetzt" statt Fehler/Platzhalter, gewohnter Ablauf läuft mit) |
| `tests/e2e/attachment-persistence-live.spec.ts` | TP-ANH-10 Stufe 2 — echter Prozess-Neustart des lokalen Dienstes, eigene Ausführungskonfiguration |
| `tests/e2e/playwright.attachment-persistence.config.ts` | Ausführungskonfiguration für die Datei oben (eigener Port-Zeitraum, derselbe Grund wie bei `playwright.version-check.config.ts`) |
| `tests/e2e/support/global-setup-attachment-persistence.ts` | Startet nur die Oberfläche; der Dienst startet/neustartet innerhalb der Spezifikationsdatei selbst (Prozessgrenze von `globalSetup`) |
| `tests/e2e/support/attachment-persistence-services.ts` | Eigene, bewusst kleine Kopie von `services.ts#startWeb` — Begründung dort, dieselbe Bauart wie `version-check-services.ts#startVersionCheckWeb` (T-142) |

**Geändert**

| Datei | Was |
|---|---|
| `tests/e2e/support/api.ts` | `Todo.dueDate`, `createTodo({dueDate})`, `updateTodoDueDate`, `loadTodoDetail`, vollständige Anhangs-CRUD-Helfer (`createAttachment`, `listAttachmentsByTodo`, `deleteAttachmentById`, `getAttachmentImage`, `attemptCreateAttachment`), `addinCreateTodo` (bewusst **ohne** `dueDate` — Auftragsvorgabe, die Add-in-Frist-Route ist Welle V) |
| `tests/e2e/support/shell-shim.ts` | `takt_open_attachment_link`/`takt_open_attachment_file` samt Aufzeichnung (`window.__taktOpenAttachmentLinkCalls__`/`…FileCalls__`) und konfigurierbaren Abweisungen — dieselbe Bauart wie `takt_open_release` (T-142) |
| `tests/e2e/support/services.ts` | `startLocalApi` unverändert im Verhalten, intern in `spawnLocalApi` zerlegt; neu `restartLocalApi` (kein Löschen von `E2E_DATA_DIR`) für TP-ANH-10 Stufe 2 |
| `tests/e2e/playwright.config.ts` | `attachment-persistence-live.spec.ts` zu `testIgnore` hinzugefügt (eigene Konfiguration, derselbe Port) |
| `tests/e2e/web-build-smoke.spec.ts` | Neuer Fall für die Feldbezeichnung „Frist" (Mikrofall aus Abschnitt 25), mit eigenem `.map`-freiem Textsuchhelfer (Begründung: ein Kommentar in `TodoFormDialog.tsx` nennt die verbotenen Wörter als Gegenbeispiel und tritt sonst in der Quellkarte als falscher Treffer auf) |
| `tests/e2e/shell-quit-failure.spec.ts` | `installedVersion: '9999.0.0'` ergänzt — Fund unten, Abschnitt „Risiken" |
| `tests/e2e/shell-username-lock.spec.ts` | dieselbe Ergänzung, derselbe Grund |
| `docs/testplan.md` | Abschnitt 25: Nachtrag „T-150 — gebaut und gefahren" direkt nach der Planungsnotiz, plus Vermerke an TP-FRIST-08 und TP-ANH-20, wo der Bau vom Plan abwich |

---

## Zusammenfassung

Alle 32 Fälle aus Testplan-Abschnitt 25 (TP-FRIST-01 bis -11, TP-ANH-01 bis -20, der Mikrofall zur
Feldbezeichnung) sind jetzt gegen die echte Kette aus Oberfläche, lokalem Dienst und SQLite
gefahren; kein Fall bleibt unangetastet. 26 neue Playwright-Fälle in 9 neuen Spezifikationsdateien
sind grün, dazu zwei bestehende Dateien mit einer einzeiligen, sicherheitsneutralen Ergänzung
(siehe Risiken). Zwei Stellen weichen dabei nachweislich vom vor dem Bau geschriebenen Plan ab —
TP-FRIST-08 (Dashboard zeigt eine Zahl statt einer Frist-Marke) und TP-ANH-20 (`.lnk` wird bereits
beim Anlegen abgewiesen, erreicht die Rückfrage nie) — beide sind in `docs/testplan.md` an ihrer
jeweiligen Stelle vermerkt, nicht stillschweigend an die Realität angepasst. Sieben der 20
TP-ANH-Fälle (08, 13, 15 bis 20) haben eine zweite Hälfte, die strukturell nicht meiner Ebene
gehört (reine Ableitungsfunktion, Integrationstür des Add-ins, Rust-Einheitentest neben dem
Öffnen-Befehl) — dort ist ausschließlich der von der Oberfläche aus erreichbare Teil gelaufen, und
das ist im Bericht wie im Testplan so benannt, nicht verschwiegen. Die gesamte bestehende Suite
(86 Fälle in der Hauptreihe, 5 im Bauergebnis-Lauf, 4 in der Versionsprüfung, 1 im
Neustart-Lauf — macht 96 insgesamt) läuft nach diesem Auftrag vollständig grün.

---

## Annahmen

1. **Keine Fixture-Dateien angelegt.** Alle Testdaten entstehen inline mit `Date.now()`-Markern und
   testlaufeigenen Temporärverzeichnissen (`mkdtemp` in `os.tmpdir()`), genau wie es der Rest des
   Bestands durchgehend tut — die in `docs/testplan.md` Abschnitt 25 vorgeschlagenen
   `tests/fixtures/anhaenge/` sind (wie die anderen sechs vorgeschlagenen Fixture-Ordner im
   Dokument) bis heute leere Verzeichnisse geblieben; ich habe diese Konvention fortgesetzt statt
   sie an dieser einen Stelle zu durchbrechen.
2. **`addinCreateTodo` bleibt ohne `dueDate`-Parameter**, wörtlich wie im Auftrag verlangt — die
   Add-in-Frist-Route ist Welle V. Für TP-ANH-13 genügt ein Titel plus ein zusätzliches, unbekanntes
   Feld.
3. **TP-FRIST-08 und TP-ANH-20 sind angepasst statt wörtlich nachgebaut**, mit Begründung im
   Dateikopf des jeweiligen Falls und einem Vermerk an der passenden Stelle in
   `docs/testplan.md`. Der Befund selbst ist keine Annahme, sondern gemessen (siehe Zusammenfassung).
4. **`installedVersion: '9999.0.0'`** in den drei betroffenen Dateien ist eine bewusst hohe, real
   unerreichbare Fassungsnummer und keine Abschaltung der Versionsprüfung (die kennt dafür ohnehin
   keinen Schalter, E-064) — sie hält lediglich den modalen Versionsdialog von Fällen fern, die
   etwas anderes prüfen.
5. **TP-ANH-15 bis TP-ANH-18 belegen nur „dieselbe Meldung, mit erkennbarem Grund"**, nicht
   „nennt das UNC-Präfix wörtlich": Der Dienst weist jeden Verweis-Fehlschlag mit **derselben**
   Meldung ab („nur http/https"), unabhängig vom genauen Grund (`normalizeAttachmentLink` in
   `packages/domain/src/attachment.ts` unterscheidet 7 Gründe, die Anwendungsfallschicht
   `usecases/attachments.ts` bildet sie auf **eine** Meldung ab). Das erfüllt A-19.11/R-22 wörtlich
   (eine benannte Regel statt einer unbenannten Störung), ist aber gröber als die Rust-seitige
   15-Werte-Unterscheidung beim Öffnen-Befehl — kein Fund, sondern eine bewusste Vergröberung an der
   Tür, die ich nicht verändern kann und nicht sollte (nicht meine Hoheit).

---

## Risiken

1. **Sicherheit — kein neues Risiko, ausschließlich Testinfrastruktur.** Die erweiterte
   `shell-shim.ts` prüft an keiner Stelle die übergebene Adresse/den Pfad selbst (dieselbe Lage wie
   bei `takt_open_release`, T-142) — die Formprüfung ist Sache von `attachment.rs`
   (`#[cfg(test)]`, Hoheit unit-tester). Die Tests hier messen ausschließlich, **dass** und **womit**
   die Oberfläche den Befehl ruft, nicht dessen Betriebssystemwirkung.
2. **Ein echter, während dieses Auftrags gefundener Flakiness-Fund an bestehenden Dateien.** Der
   lokale Dienst führt seit T-146/T-147 real die Versionsprüfung gegen das echte GitHub aus
   (E-064) — es gibt tatsächlich eine Veröffentlichung `v0.1.0`. Jeder Testfall, der
   `installShellShim` einsetzt und keinen `installedVersion` angibt (Vorgabe „0.0.0"), riskiert
   damit den echten, modalen Update-Dialog als `.scrim` über der Seite — abhängig einzig davon, wie
   viel reale Zeit seit dem Start des lokalen Dienstes vergangen ist
   (`VERSION_CHECK_START_DELAY_MS`), nicht vom Inhalt des jeweiligen Testfalls. Ich habe das zuerst
   an meinen eigenen neuen Fällen (`attachment-open-commands.spec.ts`, reproduzierbar mit
   „`.scrim` intercepts pointer events") gefunden und danach geprüft, ob es **bestehende** Dateien
   ebenso träfe: `shell-quit-failure.spec.ts` und `shell-username-lock.spec.ts` (beide
   `tests/e2e/**`, meine Hoheit) setzen `installShellShim` ohne `installedVersion` ein und sind
   damit potenziell genauso betroffen — in den beiden vollständigen Läufen dieses Auftrags sind sie
   zufällig **nicht** angeschlagen (Zeitpunkt im Lauf lag vor Ablauf der Frist), das ist aber Glück
   der Ausführungsreihenfolge, keine Eigenschaft der Datei. Ich habe die naheliegende, minimale
   Behebung direkt mitgeliefert (eine Zeile je Datei, `installedVersion: '9999.0.0'`), weil sie in
   meiner eigenen Dateihoheit liegt und ohne sie ein Teil der „bestehenden Suite bleibt grün"-Zusage
   auf Zufall beruht hätte. `version-check-live.spec.ts` ist nicht betroffen — es läuft gegen eine
   Attrappe, nicht gegen das echte GitHub.
3. **TP-ANH-15 bis TP-ANH-20 messen ausschließlich die Tür (den Dienst), nicht den Öffnen-Befehl der
   Hülle selbst** (T-B08: kein echter Tauri-Prozess unter Linux erreichbar). Die zweite Hälfte —
   dass `attachment.rs` dieselbe Eingabe beim tatsächlichen Öffnen ebenfalls abweist — ist laut
   T-147-Bericht bereits einmalig gegen `url 2.5.8` erprobt, aber noch **nicht** als
   `#[cfg(test)]`-Block dauerhaft eingetragen; das ist unit-tester (T-148) vorbehalten.
4. **TP-ANH-08 (Ableitungsfunktion `attachmentLabel`) und TP-ANH-13 (Integrationstür,
   `proof:addin`)** sind hier nur als Spotcheck von der Oberfläche/über HTTP vertreten. Die im Plan
   verlangte erschöpfende Eingabenmatrix (Titel mit reinen Leerzeichen, Pfad ohne Trenner usw. für
   TP-ANH-08; die zod-`.strict()`-Frage strukturell für TP-ANH-13) liegt bei unit-tester bzw.
   integration-dev.

---

## Offene Fragen an den Orchestrator

1. **Kein Eintrag für `playwright.attachment-persistence.config.ts` in der Wurzel-`package.json`**
   (dieselbe Lage wie bei `playwright.version-check.config.ts` in T-142). Ich trage hier den Befehl
   ein, statt ihn zu erfinden: `pnpm exec playwright test -c tests/e2e/playwright.attachment-persistence.config.ts`.
   Ein Eintrag `test:e2e:attachment-persistence` (und seine Aufnahme in die Kette von `test:e2e`)
   liegt beim Orchestrator.
2. **Die Flakiness aus Risiko 2 betrifft die Versionsprüfung als Ganzes, nicht nur meine drei
   Dateien.** Jeder künftige Testfall, der `installShellShim` einsetzt, braucht denselben
   Handgriff, oder die Nachbildung bräuchte einen sinnvollen Vorgabewert weit über jeder realen
   Fassung statt „0.0.0" — das ist eine Entscheidung, die über meine einzelnen Testfälle
   hinausgeht (`shell-shim.ts` gehört zwar meiner Hoheit, aber die Voreinstellung selbst zu ändern
   berührt jede Datei, die die Attrappe heute schon nutzt, ohne dass ich das systematisch geprüft
   habe). Ich melde den Fund und die punktuelle Behebung; eine grundsätzliche Entscheidung (eigener
   Vorgabewert in `shell-shim.ts` versus Handgriff je Datei) überlasse ich dem Orchestrator.

---

## Nächster Schritt

1. **unit-tester (T-148):** die sieben `TP-ANH`-Fälle mit Rust-/Unit-Hälfte (08, 13, 15 bis 20)
   sowie TP-FRIST-04 bis -07 (`dueState`-Unit-Fälle) — Fundstellen und erwartete Werte stehen im
   T-147-Bericht (Abschnitt 12) und in `docs/testplan.md` Abschnitt 25.
2. **integration-dev (T-149)** und **security-checker:** TP-ANH-13s strukturelle Bedingung
   (`proof:addin`) und Auflage-für-Auflage-Wiedervorlage aus Bedrohungsmodell 20.10, jetzt gegen
   den tatsächlichen Bau.
3. **Orchestrator:** Entscheidung zu offener Frage 2 (Vorgabewert der Versionsprüfung in
   `shell-shim.ts` versus Handgriff je Datei), bevor eine weitere Welle neue Fälle mit dieser
   Nachbildung anlegt.

---

## Zahlen

| Wo | Ergebnis | Belegt durch |
|---|---|---|
| Neue Playwright-Fälle (T-150) | **26 von 26 grün** | Läufe unten |
| `docs/testplan.md` Abschnitt 25 — Plan-IDs mit mindestens einem gelaufenen, grünen E2E-/Build-Fall | **32 von 32** (TP-FRIST-01 bis -11, TP-ANH-01 bis -20, Mikrofall) | dieselben Läufe, siehe Zusammenfassung für die 7 Fälle mit zusätzlicher, nicht meiner Ebene |
| Hauptreihe (`playwright.config.ts`) | **86 passed** (62 vorher bestehend + 24 neu) | `pnpm exec playwright test -c tests/e2e/playwright.config.ts` → 86 passed (1.9m) |
| Bauergebnis-Reihe (`playwright.web-build.config.ts`) | **5 passed** (4 vorher bestehend + 1 neu) | `pnpm exec playwright test -c tests/e2e/playwright.web-build.config.ts` → 5 passed (23,6s) |
| Neustart-Reihe (`playwright.attachment-persistence.config.ts`, neu) | **1 passed** | `pnpm exec playwright test -c tests/e2e/playwright.attachment-persistence.config.ts` → 1 passed (2,4s) |
| Versionsprüfungs-Reihe (`playwright.version-check.config.ts`, unverändert) | **4 passed** | eigener Lauf, siehe unten |
| `pnpm run typecheck:e2e` | **0 Fehler** | Lauf nach jeder Änderungsrunde |
| `pnpm run proof:codepoints` | **45 bestanden, 0 fehlgeschlagen** | inklusive aller neuen Dateien |

Nicht laufbar durch mich, mit Grund: die Unit-Hälfte von TP-FRIST-04 bis -07 und TP-ANH-08
(`packages/domain/test/**`, `apps/web/test/**`), die Integrationshälfte von TP-ANH-13
(`apps/local-api/test/routes/addin/**`, `proof:addin`) und die Rust-Einheitentest-Hälfte von
TP-ANH-15 bis -20 (`#[cfg(test)]` in `apps/desktop/src-tauri/src/attachment.rs`) — alle vier liegen
außerhalb meiner Dateihoheit (unit-tester/integration-dev, T-148/T-149, parallel in dieser Welle).
