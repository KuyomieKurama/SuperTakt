# Aufgabenboard — Takt

Stand: 2026-09-01, Abschluss des Durchlaufs. 55 Aufgaben, 55 Berichte.

Nachtrag T-053 bis T-055: Takt startete nicht — der gebündelte Sidecar starb beim Start, weil im
Bündel weder Quelltextort noch Migrationsverzeichnis existieren. Elf Nachweispfade waren grün,
weil **jeder von ihnen aus dem Quelltext lief**. Behoben; der Sidecar-Nachweis wuchs von 12 auf
20 Prüfungen, läuft jetzt in `pnpm desktop` mit, und die Warnung, die den Fehler die ganze Zeit
angesagt hatte, bricht den Bau. Für Oberfläche und Add-in wurde gemessen, dass dieselbe Lücke
dort **nicht** klafft — mit Gegenproben. Und das Bündel des Add-in-Aufgabenbereichs wird jetzt
überhaupt erst ausgeliefert.

---

## Fertig

Alle Aufgaben von T-001 bis T-052. Berichte unter `.claude/team/reports/`.

| Bereich | Ergebnis |
|---|---|
| Domäne und Speicherung | 17 Tabellen, 7 Migrationen vorwärts und rückwärts geprüft, Abdeckung 100 Prozent |
| Lokaler Dienst | 64 Operationen hinter Nachweisprüfung, Export transaktional und gemessen |
| Oberfläche | 14 Screens gegen den echten Dienst, 332 Kontrastpaare ohne Durchfaller |
| Tauri-Hülle | `.deb` und `.AppImage`, 22 Rust-Tests, Sidecar mit Lebenszyklus |
| Outlook-Add-in | 86 Prüfungen, konfigurierbarer regulärer Ausdruck, Duplikatangebot |
| Exportmotor | Vorlagen mit geschlossener Quellenliste, ein Renderer für Vorschau und Datei |
| Tests | 556 Unit- und Integrationsfälle, 28 End-to-End-Fälle, 11 Nachweispfade |
| Dokumentation | Benutzer- und Entwicklerhandbuch, Glossar, README |
| Prüfberichte | Bedrohungsmodell (52 Bedrohungen), Testplan (125 Fälle), Zustandsmatrix (14 Screens) |

Urteile: Spezifikations- und UX-Abgleich **freigegeben** (T-042). Sicherheitsprüfung und
Code-Review haben je vier blockierende Befunde gemeldet, alle behoben.

## Läuft — Welle vom 2026-09-03

Ausgangspunkt: T-076 hat die Regel von einer Liste gleichartiger Terme auf eine **Struktur mit
benannten Feldern** umgebaut (E-055, Vorbild Super Productivity): erforderliche Tags mit Modus,
ausgeschlossene Tags, Status, Erledigt, Exportstatus. Alle dreizehn Nachweispfade grün.
`pnpm check` rot an genau einem Punkt — Zweigabdeckung `packages/storage/src` 79,54 gegen 80.

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~T-077~~ | **fertig.** `pnpm check` Exitcode 0. Zweigabdeckung Speicherung 79,55 auf 81,68, Domäne 80,00 auf 85,29 | unit-tester |
| ~~T-078~~ | **fertig.** `poolNamer` behoben, E-056 gebaut, `proof:addin` 100 auf 112 | integration-dev |
| ~~T-079~~ | **fertig.** Regelformular, `PoolFormDialog` 236 auf 604 Zeilen, Kontrast 416 Paare ohne Durchfaller | frontend-dev |

Alle drei fertig, committet als `48c982a`. `pnpm check` grün.

**Dabei gefunden und behoben — dieselbe Lücke wie T-053:** `pnpm check` lief nur **vier der
dreizehn** Nachweispfade. Die anderen neun waren nur im Unterpaket erreichbar und hingen in keiner
Kette. Alle dreizehn hängen jetzt an `proof:all`, dazu `verify:bundle`: 770 Prüfungen in 37
Sekunden, ganzer Durchlauf 71.

### Welle vom 2026-09-03, zweite Runde

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~T-080~~ | **fertig.** Es waren **drei** Fassungen, nicht zwei — Domäne, SQL, Oberfläche. Alle fragen `poolRuleIsEmpty`; sechste Achse gibt sechs Typfehler in drei Paketen. Committet als `a2d74ef` | domain-dev |

**Nebenbefund aus T-080, schwerer als der Anlass:** Ein Ordnerterm über einen leeren Ordner
verschwindet in `matchesPool` als Neutralwert. „Tags aus Ordner X **und** Status offen" wird zu
„Status offen" — die Regel trifft **mehr**, als der Benutzer gesagt hat. Entschieden als **E-057**:
Einschränkung ohne Treffer, die Regel trifft nichts.

### Welle vom 2026-09-03, dritte Runde

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~T-082~~ | **braucht Review.** `poolRuleMatchesNothing` in Domäne und SQL, termweise; `unresolvedRequired` Pflicht; `resolved.emptyRuleFolderIds`. Nebenfund: `buildConditions` hängte Parameter an, bevor feststand, ob ihre Bedingung im Text landet — mit E-057 wären alle folgenden Werte verrutscht. Behoben. Kein bestehender Prüffall wäre rot geworden (beide Seiten hatten denselben Fehler); `pnpm check` rot an genau `routes/addin/service.ts:326` | domain-dev |
| ~~T-083~~ | **fertig.** `countConditions` gelöscht, Domäne gefragt; drei Leerzustände an sechs Flächen. Befund: `resolved.tagCount` ist achsenweise, E-057 termweise — im gemischten Fall unsichtbar. An T-082 weitergegeben: `emptyRuleFolderIds` | frontend-dev |
| ~~T-084~~ | **fertig.** Dritte Liste `enters` neben `appears`/`leaves`, `proof:addin` 112 auf 117. Befund: `matchesPool` hat ein neues **freiwilliges** Feld, `poolNamer` gibt es nicht mit — T-078-Falle ein zweites Mal. An T-082: Feld wird Pflicht | integration-dev |
| ~~T-085~~ | **fertig.** `forbidOnly` greift — nachgewiesen mit temporärem `.only` unter `CI=1`. Erster Lauf 30/3/1 durch Last paralleler Agenten, zweiter 34/34 | e2e-tester |

### Welle vom 2026-09-03, vierte Runde (Nachwelle zu T-082)

Vorab durch den Orchestrator: Testdateien wurden von `pnpm typecheck` nicht erfaßt — die
Paket-`tsconfig`s stehen auf `include: ["src"]`, Vitest prüft keine Typen. Das Pflichtfeld
`unresolvedRequired` erzwang in den Tests also nichts. Neu: `tsconfig.test.json` in domain,
storage, export und `typecheck:test` in `typecheck`. Erste Messung: 62 Typfehler in Tests, davon
31 fehlende `unresolvedRequired` in `board.test.ts`/`tags-and-pools.test.ts` und einer in der
Kreuzprüfung `repo-todos.test.ts:719` — die lief bislang mit `undefined`.

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~T-086~~ | **fertig.** `poolNamer` über `resolveAxes`, ein Portaufruf statt zweier; `resolveRule`/`resolveExcluded` aus dem Add-in-Ausschnitt entfernt (kein Aufrufer mehr). `proof:addin` 117 auf 123, drei Mutationen gegengemessen. `pnpm run typecheck` Exitcode 0. Nachtrag für domain-dev: Kommentar an `ports.ts` nennt einen Aufrufer in `routes/addin`, den es nicht mehr gibt | integration-dev |
| ~~T-087~~ | **fertig.** `describeRuleReach` über `unresolvedRequired` + `emptyRuleFolderIds`, Chip statt Achse markiert; `unresolvedExcluded` als Hinweis. `matchesNothing` bewusst nicht als Ganzes gelesen (vermischt Regelterme mit allen Achsen — im Formular stünde „trifft nichts" am Entwurf). Vorschlag an domain-dev: `matchesNothingReason` als Aufzählung statt weiterer Wahrheitswerte. E2E 34/34 | frontend-dev |
| ~~T-088~~ | **fertig.** `typecheck:test` 62 auf 0; vier T-082-Fälle je als reine Funktion und gegen SQL, mit Gegenprobe und bewusst falscher Vergleichsfunktion statt Gleichheitstest. 595 Fälle grün, 80 % gehalten. Nebenfund: `pnpm --filter <paket> test` lief lautlos leer (kein Skript) — Orchestrator hat `test`-Skripte in den drei Paketen nachgetragen | unit-tester |

| ~~T-081~~ | **fertig.** 3 gegenstandslose Fälle gelöscht, 4 neue; dazu 2 Fälle in anderen Dateien repariert, die dieselbe Umstellung gebrochen hatte. **34/34** | e2e-tester |

T-080 wurde mit HTTP 529 abgebrochen und per Nachricht fortgesetzt, nicht neu gestartet.

**Dabei gefunden — wieder ein Nachweis, der nur von Hand lief:** `pnpm test:e2e` benutzte den
Wurzel-`playwright.config.ts` ohne `globalSetup`, startete keine Dienste, und **alle 34 Fälle
scheiterten sofort**. Die echte Konfiguration lag seit T-012 in `tests/e2e/`, mit dem richtigen
Aufruf im Dateikopf dokumentiert — den man kennen musste. Wurzel-Config gelöscht, `test:e2e`
zeigt auf die echte. Gemessen: 34 passed über `pnpm test:e2e`.

Kollisionsfrei: `packages/*/test/**` gegen `routes/addin/**` gegen `apps/web/**`.
End-to-End erst danach — `tests/e2e/kanban.spec.ts` prüft noch das Ziehen, das E-054 abgeschafft
hat.

### Welle vom 2026-09-03, Review-Runde (Qualitätstor)

Stand `3240dcc`: `pnpm check` Exitcode 0 (13 Nachweispfade, 818 Prüfungen, 595 Einheitentests,
Abdeckung 91 %), `pnpm test:e2e` 34/34. Prüfumfang `git diff 7c71186..HEAD`.

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~R-1~~ | **nicht freigegeben.** Blockierend: (1) `TagFolderPort.remove` prüft keine Verwendung in `pool_rule`, `folder_id` steht auf `CASCADE` — Löschen eines leeren Ordners macht „Ordner Ost und Status offen" still zu „Status offen", genau die Richtung gegen E-057; (2) `bookOnTodo` gibt bei scheiterndem `clearDone` `rejected` **zurück** statt abzubrechen, die Unit of Work committet — Buchung steht, Client hört „abgewiesen", Doppelbuchung; (3) `poolNamer` ruft `pools.list()` ohne `'all'`, Attrappe ignoriert das Argument — deckt sich mit R-2 B-4; (4) 138,7 MB AppImage + 47,5 MB `.deb` unter `apps/desktop/release/` in `48c982a`, `.git` 181 MB. Sollte: Typwache lückenhaft in `board.ts:86` und `service.ts:306` (sechste Achse würde dort nicht rot), `as never` in `structure.ts`, zweite Fassung der Filteraufzählungen in `labels.ts`, `status_in_use` ohne vierten Grund in OpenAPI | code-reviewer |
| ~~R-2~~ | **nicht freigegeben.** B-1: `CARD_STAYS` („die Spalte ändert sich dadurch nicht") ist seit E-055 falsch, zeichengleich an vier Flächen, seit T-072 offen. B-2: Add-in nennt `leaves`, Hauptanwendung nicht (C-03). B-4: `poolNamer` ruft `pools.list()` ohne `'board'` — reine Board-Spalten nie genannt. B-5: `PoolFormDialog` ohne Lade-/Fehlerzustand für Ordner und Status. D-1/D-2: Benutzerhandbuch beschreibt Drag & Drop. Deckungslücken A-3.5/A-3.6/A-5.7 nachzutragen. Empfehlung O-E: kein Ziehen, Status-Untermenü auf der Karte; O-K: Wahrheitswert über den ganzen Satz | spec-ux-reviewer |
| R-3 | Sicherheitsprüfung: Validierung der Regelfelder, SQL-Zusammensetzung, Vertrauensgrenze Add-in nach `resolveAxes`, Notiz-Trennung, `RESTRICT`, Repository-Hygiene | security-checker |

Danach documenter.

### Welle vom 2026-09-03, Reparatur nach Review — Welle A

Vorab durch den Orchestrator: 186 MB Bauergebnisse (`apps/desktop/release/`) und die
Lizenzbeilage aus den fünf Commits des Branches genommen (`git filter-branch`, Sicherung
`backup/status-als-regelterm-vor-filter`), `apps/desktop/.gitignore` wörtlich von
`release-workflow`. E-058 festgehalten. Doppelte O-Kennungen umbenannt (O-M bis O-Q).

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~T-089~~ | **fertig, braucht Review (R-1a).** Migration 0012 `pool_rule.tag_id`/`folder_id` CASCADE → RESTRICT, `TagFolderPort.remove` weist mit `tag_in_use` + Regelnamen in `details` ab (gleicher Zusatz an `status_in_use`, H-2); `check-export-boundary.mjs` Untergrenzen; `z.array(idSchema).min(1).max(50)` für die drei Kennungslisten von `GET /todos`; `BoardColumnRule extends MatchesPoolRule`; `structure.ts` ohne `as never`; `matchesPool` wirft bei fehlendem `unresolvedRequired`. E-058: `usecases/pool-movement.ts` (`poolMovementNamer`), `POST /timer/start` liefert `poolMovement \| null`, `poolMovementSentence(movement, tense, occasion)` in `@takt/domain` mit Überladungen. 595/595, typecheck 0. Offen (entschieden, siehe E-058 Ergänzung): Gattungswort → keins; Stopp/orphaned liefern ebenfalls `poolMovement`; `GET /addin/context` bleibt bei `list()`. R-3 H-1 (Ordnerauflösung Faktor 70) weiter beim Auftraggeber | domain-dev |
| ~~T-090~~ | **fertig.** `poolNamer` über `list('all')`, Attrappe wertet die Fläche aus, `proof:addin` 123 auf 131; `bookOnTodo` wirft `AbortBooking` statt `rejected` zurückzugeben — Doppelbuchung zu, Mutation gemessen; Typwache `NamedPoolRule` (lokal, in Welle B durch Domänen-Erbauer ersetzen); „Status" statt „Spalte". Offen: Gattungswort im Bewegungssatz für reine Board-Spalten (E-058/Welle B); Kommentar an `PoolPort.list` nennt `poolNamer` als Zeugen für die Vorgabe `'pool'` — stimmt nicht mehr (domain-dev) | integration-dev |
| ~~T-091~~ | **fertig.** B-5: Ordner- und Statusauswahl mit lädt/Fehler+Wiederholen/bereit (`RulePickers.tsx`), keine falsche Leermeldung mehr; B-3b: `slice(0,12)` aufgehoben; `labels.ts` über Domänentypen; „Regel über Tags" an 15 Stellen; `aria-describedby`; Live-Region an `RuleSummary` (500 ms); S-1, S-3, S-5 (schwache Fassung: kein Bestätigungsdialog, dafür „Rückgängig"), S-7, S-9, S-10, H-1–H-3; Ordnersuche (A-4.4 halb). typecheck 0, contrast 0/432, e2e 34/34. Offen: benannte Domänentypen für `AppSettings.theme`/`Pool.matchMode` (domain-dev); `POOL_EXPORT_LABEL.open` → „Noch nicht abgerechnet"? (Auftraggeber); Bestätigungsdialog „Vom Board nehmen" fallen lassen? (Auftraggeber); Kommentar `tests/e2e/support/actions.ts:125-131` veraltet (e2e-tester, Welle B) | frontend-dev |

**Messung nach Welle A (Orchestrator):** `pnpm check` — 13 Nachweispfade 838/0, 595 Einheitentests,
Zweigabdeckung `packages/domain/src` 69,72 % unter 80 % (allein `pool-movement.ts` mit 0 %, Tests
kommen in T-095) → Exitcode 1 an dieser einen Schwelle, sonst grün. `pnpm test:e2e` 34/34 grün (1,3 min).

### Welle vom 2026-09-03, Reparatur nach Review — Welle B

Vorab durch den Orchestrator: E-058 um die Punkte 4–7 ergänzt (kein Gattungswort im Satz;
`occasion` bleibt Pflicht; auch Stopp und `orphaned/resolve` liefern `poolMovement`;
`GET /addin/context` bleibt bei `list()`), E-059 (Exportstatus heißt in der Oberfläche „Noch
nicht abgerechnet"/„Abgerechnet"; „Vom Board nehmen" ohne Bestätigungsdialog, mit „Rückgängig").

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~T-092~~ | **fertig.** `poolNamer`/`bookingStates`/`NamedPoolRule` gelöscht, Add-in-Dienst bildet nur das Zustandspaar (`BOOKING_EFFECT` einmal) und ruft `poolMovementNamer`; `reopen.ts` ohne `poolSentence`/`bookingPoolSentence`/`CARD_STAYS`/`aside`, alles über `poolMovementSentence`; `proof:addin` erzeugt die Erwartung aus der Funktion, 134/0, drei statische Wachen (keine zweite Satzfassung, kein `CARD_STAYS`, kein `matchesPool` im Add-in-Dienst). typecheck 0, 648 Tests, fünf Mutationen rot. Offen: Zustandspaar „Wirkung einer Buchung" jetzt an vier Stellen — `bookingMovementStates(todo, entries)` in `usecases/pool-movement.ts` (domain-dev, O-S); Add-in-Routen liefern drei flache Listen, Timer-Routen `poolMovement` — Vereinheitlichung berührt zwei Hoheiten (O-T) | integration-dev |
| ~~T-093~~ | **fertig.** Satz nur mit Namen, 14/14 zeichengenau nach Tabelle; `POST /timer/stop` und `orphaned/resolve` liefern `poolMovement \| null` (Anlass Buchung, im verworfenen Zweig fest `null`); `PoolPort.list`-Kommentar richtiggestellt (O-I damit erledigt); `Theme`, `PoolMatchMode` exportiert. Alle Nachweispfade 0, `proof:openapi` 100, 633 Einheitentests, Zweigabdeckung Domäne 87,5 %. **Neuer Befund:** `orphaned/resolve` verspricht `reason: [timer_too_short, orphan_discarded]`, liefert nur `timer_too_short` — Entscheidung nötig (O-R) | domain-dev |
| ~~T-094~~ | **fertig.** `CARD_STAYS` und `poolsContaining` ersatzlos weg; Satz an jeder Fläche aus `poolMovementSentence` mit `poolMovement` aus `POST /timer/start`, Anlass aus `doneCleared`, `null` = keine Fläche (O-G damit erledigt: erste Buchung meldet die Spalte); E-059 bis in die Vorschau, `EXPORT_TEXT` gelöscht, Buchungsetikett aus der Regelachse genommen (Annahme 1, an R-2a); Musterseite zeigt vier Wiederöffnen-Fälle aus der Funktion. typecheck 0, build 0, contrast 0/432, boundaries 0, e2e 36 grün + 1 rot (`kanban.spec.ts:357` TP-KANBAN-06 von T-096, nicht T-094). Offen: `PUT`/`DELETE /todos/{id}/done` ebenfalls `poolMovement`? (O-U); Board-Toast nach „Erledigt" schweigt über Spalten, bis O-U entschieden | frontend-dev |
| ~~T-095~~ | **fertig.** 53 neue Fälle: 15 Wortfälle `poolMovementSentence` + Mehrfachaufzählung, Laufzeitwache `matchesPool`, `poolMovementNamer` (list('all'), enters/leaves-Invarianten, gleichnamige Pools über die Regel), Ordnersperre `tag_in_use` mit `details`, Migration 0012 vor/zurück mit Bestand, `describeRuleReach`/`emptyFolderNames` acht Fälle in `apps/web/test/lib/poolRule.test.ts`. 648/648, Domäne 87,5 % Zweige, `typecheck:test` über fünf Konfigurationen (Orchestrator: `apps/local-api/tsconfig.test.json`, `apps/web/tsconfig.test.json`) | unit-tester |
| ~~T-096~~ | **fertig.** TP-KANBAN-06 (E-057: leerer Ordner + Statusachse, Karte bleibt draußen, Vorschau nennt den Grund, Tag im Ordner füllt die Spalte); `tag-folder-rule-lock.spec.ts` (409 `tag_in_use` mit `details[]` über API und Oberfläche, Gegenprobe ungebundener Ordner); `actions.ts`-Kommentar berichtigt; `docs/testplan.md` Abschnitt 17. e2e 37/37. **Zwei Funde in `apps/web`:** (1) zweites `page.goto()` auf eine offene Route löst keine neue Anfrage aus (Daten veralten; im Test über `page.reload()` umgangen); (2) `TaktApiError.details` wird nirgends gelesen — Regelname bei `tag_in_use`/`status_in_use` erscheint nicht in der Fehlermeldung. Beides an frontend-dev, Welle C | e2e-tester |

Wortlaut nach E-058 Punkt 4 (Vorlage für T-092 bis T-095; `„X“` steht für einen Namen, mehrere
werden als `„A“, „B“ und „C“` aufgezählt):

| Anlass | Fall | Ankündigung (`future`) | Bericht (`past`) |
|---|---|---|---|
| reopen | nichts, nichts | Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem Pool und in keiner Spalte. | Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool und in keiner Spalte. |
| reopen | nur `leaves` | Es verschwindet dann aus „X“ und erscheint sonst nirgends. | Es ist aus „X“ verschwunden und erscheint sonst nirgends. |
| reopen | nur `appears` | Es erscheint dann wieder in „X“. | Es ist zurück in „X“. |
| reopen | beides | Es erscheint dann wieder in „X“ und verschwindet aus „Y“. | Es ist zurück in „X“ und aus „Y“ verschwunden. |
| booking | nichts, nichts | `null` | `null` |
| booking | nur `enters` | Es erscheint dann in „X“. | Es steht jetzt in „X“. |
| booking | nur `leaves` | Es verschwindet dann aus „X“. | Es ist aus „X“ verschwunden. |
| booking | beides | Es erscheint dann in „X“ und verschwindet aus „Y“. | Es steht jetzt in „X“ und ist aus „Y“ verschwunden. |

**Messung nach Welle B (Orchestrator):** `pnpm check` Exitcode 0 — 13 Nachweispfade 848/0, 648
Einheitentests, Zweigabdeckung gesamt 84,34 %; `pnpm test:e2e` 37/37.

### Welle vom 2026-09-04, Welle C

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~T-097~~ | **Fertig.** Stopp-Toast trägt den Satz aus `poolMovementSentence(…, 'past', 'booking')`; `discarded`-Zweig typisiert mit `poolMovement: null` (drei Stellen in `usecases/timer.ts` liefern dort ausnahmslos `null`). Neue `lib/errorText.ts` (`enumerateGerman`, `ruleReferences`, `errorMessageWithRules`) nennt Regelnamen aus `details[]` in den Löschdialogen von Ordner, Tag und Status. `page.goto()`-Fund ursächlich behoben: `hashchange` feuert bei gleichem Anker nicht, `popstate` schon — `useRoute` hört darauf und `useDataFreshness` lädt neu (auch bei `visibilitychange`); `navigate()` geht über `location.assign`, weil `location.hash = <gleich>` kein Ereignis erzeugt. Messung: `pnpm check` 0 (848/0, Zweige 84,34 %), e2e 37/37. Offen: `errorText.ts` ungetestet (unit-tester), `page.reload()` in `kanban.spec.ts` Zeilen 312/414 durch zweites `gotoBoard` ersetzbar (e2e-tester), Ordner-Löschdialog wechselt nach Absage Titel/Knopf nicht (hält sich an Selektor des e2e-Tests). Bericht `reports/T-097-frontend-dev.md`. Ursprünglich: Stopp-Antwort anbinden: `POST /timer/stop` und `POST /timer/orphaned/resolve` liefern `poolMovement \| null` (E-058 Punkt 6, OpenAPI ab T-093) — `performStop`/`confirmOrphan` in `TimerContext` bilden den Satz mit Anlass `'booking'`, `null` heißt keine Fläche; `api/types.ts` nachziehen. Funde aus T-096: (1) `TaktApiError.details` nirgends gelesen — bei `tag_in_use`/`status_in_use` die Regelnamen aus `details[]` in der Fehlermeldung nennen (Löschen-Dialog Ordner, Tag, Status); (2) zweites `page.goto()` auf eine offene Route löst keine neue Anfrage aus — Ursache finden (Router/Effekt-Abhängigkeit), beheben, damit `StructureContext`/Listen beim erneuten Aufruf frisch laden | frontend-dev |

| ~~T-098~~ | **Fertig** auf `fix/windows-sidecar-bundle-check` (von `origin/main`, gepusht, Commit 7390bc8; PR anlegen ist Sache des Auftraggebers), in `status-als-regelterm` gemergt (aca53df, damit ist auch 45c0d79 hier). `scripts/paths.mjs` mit `isInside(folder, file, path)` über `path.relative` — nicht `folder + sep`, weil `path.win32.resolve` den Laufwerksbuchstaben nicht vereinheitlicht, `path.win32.relative` aber ohne Rücksicht auf Groß-/Kleinschreibung vergleicht; 12 Fälle gegen `path.win32`/`path.posix` belegt. Zweiter Fund: `verify-node-checksums.mjs` `slice(repoRoot.length + 1)` → `relative`. Archivmitglieder (`split('/')`) bleiben, im Kommentar begründet. Unter Windows nicht ausgeführt — Nachweis ist der nächste Workflow-Lauf. Offen: Test für `isInside` unter `apps/desktop/test/` (unit-tester, Welle D). Ursprünglich: Windows-Build im Release-Workflow (`origin/main`, Lauf `pnpm desktop:build`): `build-sidecar.mjs` Schritt 2 bricht mit „Der lokale Dienst selbst ist nicht im Bündel" ab. Ursache (Orchestrator, Zeile 259): `input.startsWith(\`${folder}/\`)` — `join()`/`resolve()` liefern unter Windows Rückstriche, esbuild meldet die Eingaben mit Schrägstrichen relativ zum Arbeitsverzeichnis; nach `resolve` stehen Rückstriche gegen `…/` und kein Arbeitsbereichspaket zählt. Fix auf einem Zweig von `origin/main` (der Workflow liegt nicht auf `status-als-regelterm`, Commit 45c0d79 fehlt dort): Vergleich über `path.sep` bzw. `relative()`, dieselbe Durchsicht über alle Skripte in `apps/desktop/scripts/` (`collect-licenses`, `collect-release`, `build-app`, `sidecar-runtime`, `verify-node-checksums`), Nachweis der Vergleichsfunktion mit `path.win32` ohne Windows-Rechner. Läuft **nach** T-097, weil derselbe Arbeitsbaum die Zweige wechseln muss | frontend-dev |

### Welle vom 2026-09-04, Welle D (Qualitätstor, zweite Runde) — fertig

Stand `aca53df`: `pnpm check` Exitcode 0 (13 Nachweispfade 848/0, 648 Einheitentests, Zweige
84,34 %), `pnpm test:e2e` 37/37. Prüfumfang der Wiedervorlagen: `git diff 3240dcc..HEAD`
(Welle A, B, C und T-098) mit den Befunden aus R-1, R-2, R-3 als Ausgangspunkt.

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~T-099~~ | **Fertig.** Neu `tests/e2e/pool-movement-sentence.spec.ts` (Hauptanwendung gegen Add-in, reine Board-Spalte, `leaves`-Fall, kein-Treffer-Fall; Erwartung aus `poolMovementSentence` gezogen) und `tests/e2e/timer-stop-announcement.spec.ts` (`recorded`/`discarded`/`orphaned`-resolve; `discarded` zeitabhängig, zweimal ohne Zwischenfall). `tag-folder-rule-lock.spec.ts` prüft Regelname für Ordner/Tag/Status, `kanban.spec.ts` mit zweitem `gotoBoard()` statt `page.reload()`, `support/api.ts` erweitert (`createPool` mit `statusIds`/`exportState`, `startTimer`, `touchTimerHeartbeat`, Add-in-Helfer, typisierte Timer-Antworten), `docs/testplan.md` Abschnitt 17. 45/45. Fund bestätigt R-1a (1): `TagPort.remove()` liefert keine `details`, Tag-Dialog nennt die Regel nicht. Offen (Orchestrator): eigener `tsconfig`/Nachweispfad für `tests/e2e/**` — ein Typfehler wurde nur ad hoc gefunden. Ursprünglich: End-to-End: (1) Bewegungssatz Hauptanwendung gegen Add-in am E-056-Fall — dasselbe erledigte Todo, dieselbe reine Board-Spalte, Timerstart in der Oberfläche gegen Buchung über die Add-in-Route; beide Sätze zeichengleich bis auf die Zeitform (Tabelle im Board bei T-093); (2) Stopp-Anzeige: Toast nach `POST /timer/stop` trägt den Satz mit Anlass Buchung, gemessene Wortlaute in `reports/T-097-frontend-dev.md`; (3) `tag-folder-rule-lock.spec.ts` prüft jetzt den Regelnamen aus `details[]` im Dialogtext („Betroffen ist Regel „…“."); (4) `kanban.spec.ts` Zeilen 312/414: `page.reload()` durch zweites `gotoBoard(page)` ersetzen, Kommentare nachziehen — T-097 hat den Fund ursächlich behoben (`popstate`); (5) `docs/testplan.md` nachziehen | e2e-tester |
| ~~T-100~~ | **Fertig.** `apps/web/test/lib/errorText.test.ts` (22 Fälle, Prüfdaten aus `TaktApiError` und `poolReference`-Format in `mappers.ts`), `apps/desktop/test/paths.test.ts` (14 Fälle, `path.win32`/`path.posix`; erstes `test/` in `apps/desktop`, Import der `.mjs` mit `@ts-expect-error`). Rotnachweis über kurzzeitige Mutation der `src`-Dateien, per `git checkout --` zurück — **nicht wiederholen**, während andere Agenten parallel lesen oder messen. `useRoute`/`useDataFreshness` bewusst ohne Test (kein exportierter reiner Kern; jsdom bezeugt nur jsdom). 684 Einheitentests, `typecheck:test` 0, Abdeckung hält. Offen (Orchestrator): `tsconfig.test.json` für `apps/desktop`; `coverage.include` um `apps/web/src/lib`, `apps/desktop/scripts`? Ursprünglich: Einheitentests: `apps/web/src/lib/errorText.ts` (`enumerateGerman`, `ruleReferences`, `errorMessageWithRules`); `apps/desktop/scripts/paths.mjs` `isInside` unter `apps/desktop/test/` mit `path.win32` und `path.posix` (12 Fälle aus `reports/T-098-frontend-dev.md`); `useRoute`/`useDataFreshness` nur, wenn ohne Browser sinnvoll prüfbar | unit-tester |
| ~~R-1a~~ | **Freigegeben.** Vier Blockierer aus R-1 behoben und gemessen (Migration 0012 an roher DB mit Rückweg 7/7, `AbortBooking`, `list('all')` + Attrappe, 186-MB-Blobs aus allen Zweigen). E-058 hält: eine Rechnung, ein Satz, 14 Wortlaute zur Laufzeit zeichengleich, `null` überall „keine Fläche". Sieben wesentliche, keiner blockierend: (1) `repo-tags.ts:213` `TagPort.remove` ohne `details` — Ordner/Status liefern Namen, Tag nicht, Oberfläche liest schon (domain-dev); (2) `usecases/timer.ts:511` überschreibt `orphan_discarded` aus der Domäne mit `timer_too_short` — O-R: **unterscheiden, nicht kürzen** (domain-dev; `timer.ts:294`, OpenAPI `:2043` dazu); (3) `repo-tags.ts:192`, `repo-statuses.ts:277` CASCADE-Begründungen behaupten das Gegenteil der Lage (domain-dev); (4) `labels.ts:86/239` doppelte Aufzählungen, Bedingung für Import aus der Domäne inzwischen erfüllt (frontend-dev); (5) `verify-node-checksums.mjs:91` fängt nur null Einträge, Kopf verspricht sechs (frontend-dev); (6) `router.ts:134` Wiederbesuch hängt an `popstate` bei `location.assign` auf identische Adresse, nur Chromium gemessen, Linux-Hülle ist WebKitGTK — `navigate()` soll bei gleichem Ziel den Wiederbesuch selbst auslösen (frontend-dev); (7) `useDataFreshness.ts:73` `bump()` über `useAsync` verwirft den Wert → Platzhalter bei jedem Fensterwechsel, Kommentar sagt das Gegenteil (frontend-dev). O-S: Rechnung in `usecases/pool-movement.ts`, **Wirkung** (`BOOKING_EFFECT`) in `packages/domain`, mit O-T zusammen planen. Hoheitsverstoß T-100 notiert. Frage: `backup/status-als-regelterm-vor-filter` löschen + `git gc` (`.git` 182 MB) — beim Auftraggeber. Ursprünglich: Wiedervorlage Code-Review: alle blockierenden und wesentlichen Befunde aus R-1 gegen den Stand prüfen; dazu O-R (`orphan_discarded` versprochen, nie geliefert), O-S (Zustandspaar viermal gebildet), `isInside`, `useRoute`/`popstate`, `errorText.ts` | code-reviewer |
| ~~R-2a~~ | **Freigegeben** für Welle A–C unter Auflagen. Alle fünf blockierenden Befunde aus R-2 erledigt, alle S-/H-Punkte erledigt; T-094 Annahme 1 trägt (SC 1.4.1 besser erfüllt); Gattungswort nicht zurückholen (`ux_pool_name` UNIQUE NOCASE). Wesentlich, keiner blockierend: W-1 OpenAPI `:2961-2963` Add-in-Buchungsroute trägt noch den gestrichenen Satz (domain-dev); W-2 `time-entry.ts:111-112` Kommentar „Karte bleibt, wo sie ist" (domain-dev); W-3 `repo-todos.ts:567` `markDone`-Kommentar, dazu in die falsche Richtung (domain-dev); W-4 `docs/architektur.md:334-344` widerspricht `:105-111` (D-3 aus R-2; domain-dev, weil zuletzt in T-093 seine); W-5 Stopp-/Orphan-Toast ohne Todo-Namen — „Es" ohne Bezug, beim Wechsel A-6.8 zwei „Es"-Sätze für verschiedene Todos; Rahmen wie im Add-in: Titel „Zeit gebucht auf „X“." (frontend-dev); W-6 `BoardScreen.tsx:419-423` „Vom Board nehmen" schließt Dialog, „Als Spalte aufnehmen" nicht, Undo-Toast außerhalb `aria-modal` (frontend-dev); W-7 Hilfssatz zum Widerspruch „Nicht abgerechnet"(Buchung)/„Abgerechnet"(Spalte) an `RuleSummary` bei `exported` (frontend-dev). T-097 Frage 1: Absage im `ConfirmDialog` liegt in `aria-describedby`, wird nicht angesagt (SC 4.1.3) — Titel/Knopf wechseln wie `StatusSettings`, nach T-099; Frage 3: keine Ansage, `RefreshHint` auf die übrigen Ansichten. O-U-Rat: `DELETE /done` = `'reopen'`, `PUT /done` = `'booking'` mit Satz an `PoolMovementOccasion`. Auflagen: W-1–W-3 **vor** dem documenter; D-1/D-2 beschreiben, nicht zitieren. Ursprünglich: Wiedervorlage Spezifikation/UX: B-1 bis B-5, D-1/D-2 aus R-2; E-058 Punkt 4 (Satz ohne Gattungswort) an allen Flächen; E-059-Wortlaute; T-094 Annahme 1 (Exportachse in `RuleSummary` ohne `ExportStatusBadge`); Löschdialoge mit Regelnamen; Ordner-Löschdialog wechselt nach Absage Titel/Knopf nicht (T-097 offene Frage 1); Ansage für Bildschirmleser bei erneutem Laden (T-097 Frage 3) | spec-ux-reviewer |
| ~~R-3a~~ | **Freigegeben.** Sechs Nacharbeiten aus R-3 erledigt und nachgemessen (Blobs nicht mehr in HEAD-Historie, Grenzwächter mit Untergrenzen, `commaSeparatedIds` 1..50, `poolReference`, `matchesPool`-Wache); `navigate()` kann bauartbedingt nur `#/…` erzeugen; `details[]` als React-Text; `useDataFreshness` ohne Schleife/Zeitgeber; Migration 0012 mit `pragma_foreign_key_check`, 24 eingebettete Migrationen zeichengleich mit `.sql`. Flächenzuwachs nur inhaltlich: Namen reiner Board-Spalten gehen über `poolMovement` ans Add-in (E-056/E-058, Bedrohungsmodell 15.3). Sollte: S-1 Sicherungszweig hält 186 MB erreichbar (Auftraggeber); S-2 `migrations:embed:check` von keiner Kette gerufen — **erledigt vom Orchestrator: `proof:migrations` in `proof:all`**; S-3 `release.yml` hält `SHA256SUMS` nie gegen die Dateien — `sha256sum -c` vor `gh release create` (Orchestrator, auf `fix/windows-sidecar-bundle-check`). Hinweise: H-2 `input.ts:57,58` Namen mit Steuer-/Bidi-Zeichen (domain-dev); H-3 `details` ohne LIMIT (domain-dev/frontend-dev); H-4 `migration-runner.ts:274` `legacy_alter_table` nicht im `finally` (domain-dev); H-5 `router.ts:93,106`/`useRoute.ts:75` `decodeURIComponent` ohne Netz (frontend-dev); H-6 `visibilitychange` ohne Mindestabstand (frontend-dev); H-7 `tag-folder-rule-lock.spec.ts` `new RegExp` aus Namen (e2e-tester). Semgrep Guardian erneut nicht erreichbar, 42Crunch weiter nicht betriebsbereit; `tests/fixtures/**` leer — Regel oder Ort anpassen (Auftraggeber). Bedrohungsmodell Abschnitt 15. Ursprünglich: Wiedervorlage Sicherheit: Befunde aus R-3 gegen den Stand; neu: `details[]` (Regelnamen) in der Oberfläche, `poolMovement` an drei Timer-Antworten, `navigate()` über `location.assign`, `useDataFreshness` (`visibilitychange`), Migration 0012, `paths.mjs`; Bedrohungsmodell nachziehen | security-checker |

Danach documenter (D-1/D-2 Benutzerhandbuch, „Regel über Tags" in `docs/`).



**Beim Auftraggeber:** `docs/spec.md` — Drag & Drop in Zeilen 84, 257, 306 seit E-054 aufgehoben;
A-3.5, A-3.6, A-5.7 nachtragen (Vorschlag in R-2); A-13.6 klären.

## Offen — Restpunkte, keine Blocker

| Nr | Punkt | Wer |
|---|---|---|
| O-A | Kanban-Spalten lassen sich nicht umbenennen — es gibt keine Bedienmöglichkeit dafür (T-052) | frontend-dev |
| O-B | `PoolWrite` kennt kein `position`; jeder neue Pool entsteht auf 0. Fachliche Frage: sollen Pools sortierbar sein? | Auftraggeber |
| O-C | `GET /settings` belegt keine Merkmale zum Datenbankpfad, anders als beim Exportordner | domain-dev |
| O-D | `Pool.rule` heißt weiter `rule`, enthält aber nur noch die erforderlichen Tags. Umbenennen berührt drei Hoheiten — eigene Aufgabe | Orchestrator |
| ~~O-F~~ | *erledigt.* Alle 13 Nachweispfade laufen seit T-08x in `pnpm check` (`proof:all`), zuletzt gemessen nach T-088: 818 Prüfungen, 0 rot |
| ~~O-G~~ | *erledigt in T-084.* Der Poolsatz erscheint nur im Wiederöffnen-Fall. Für ein **offenes** Todo liefert der Dienst `poolNames`, die niemand liest. Der Agent hielt das für vollständig gedeckt, weil nur dort etwas *verschwinden* kann — aber **erscheinen** kann auch ohne Wiederöffnen: Die erste Buchung auf einem Todo ohne Buchung setzt `hasOpenEntries` von falsch auf wahr, und eine Spalte `exportState: 'open'` nimmt es damit auf. `bookingStates` rechnet das bereits richtig; nur die Anzeige fehlt | frontend-dev |
| O-E | Soll das **Ziehen für reine Status-Spalten** zurückkommen? Der Status ist eine Eigenschaft, kein Tag; das wäre umkehrbar, ohne E-054 zu verletzen | Auftraggeber |
| O-M | Die Aufruferseite des Add-ins ist von `proof:callers` nicht erfasst | domain-dev |
| O-N | Die Quellkarten des Add-ins gehen in die Auslieferung mit (1,1 MiB, über HTTPS abrufbar). Nichts wurde stillschweigend gefiltert — die Frage gehört entschieden. | Auftraggeber |
| O-O | `pnpm desktop` braucht jetzt beide Ports frei (17843 und 17844). Verhaltensänderung durch den mitlaufenden Nachweis; die Kette bleibt sauber stehen und nennt den Grund. | — |
| O-P | Neun End-to-End-Fälle nicht gelaufen: Add-in (kein Office.js-Wirt), drei Hüllenzustände (kein echter Tauri-Prozess), Stichprobe über die 19 Orte mit Exportstatus, Standard-Tags über die Oberfläche | e2e-tester |
| O-Q | 14 Befunde aus T-025 unverändert offen, geordnet nach Gewicht ab C-12 | spec-ux-reviewer |

| ~~O-I~~ | erledigt mit T-089/T-093. Restfrage: `resolveRule`/`resolveExcluded` zugunsten von `resolveAxes` streichen? Kommentar an `packages/storage/src/ports.ts` begründete `resolveRule`/`resolveExcluded` mit einem Aufrufer in `routes/addin`, den es seit T-086 nicht mehr gibt; einziger Nutzer in `src` ist der Adapter, dazu `repo-tags.test.ts`. Entweder Kommentar richtigstellen oder beide zugunsten von `resolveAxes` streichen | domain-dev |
| O-J | `resolved` trägt drei Wahrheitswerte (`isEmpty`, `unresolvedRequired`, `matchesNothing`); frontend-dev schlägt einen benannten Grund `matchesNothingReason: 'none' \| 'empty' \| 'unresolved-required'` vor, damit ein dritter Grund die Oberfläche rot statt still macht | domain-dev |
| O-K | Das Add-in kann nicht sagen, *warum* ein Pool im Aufgabenbereich fehlt (bekommt nur Namen). Produktfrage: reicht das? | Auftraggeber |
| O-S | Das Zustandspaar „Wirkung einer Buchung" (`completedAt: null`, `hasOpenEntries: true`) wird an vier Stellen gebildet (Add-in zweimal, `timer/start`, `timer/stop`+`orphaned/resolve`). Vorschlag T-092: `bookingMovementStates(todo, entries)` in `usecases/pool-movement.ts` | domain-dev |
| O-T | Add-in-Routen liefern `poolNames`/`enteringPoolNames`/`leavingPoolNames`, Timer-Routen `poolMovement: {appears, enters, leaves}`. Eine Form, zwei Hoheiten plus OpenAPI | Orchestrator |
| O-U | `PUT`/`DELETE /todos/{todoId}/done` liefern kein `poolMovement`; der Board-Toast nach „Erledigt" schweigt deshalb über Spalten. Begründung aus E-058 Punkt 6 gilt wörtlich — dritter Anlass oder Wiederverwendung von `'booking'` (Bewegung ohne „wieder")? | domain-dev |
| O-R | `POST /timer/orphaned/resolve` verspricht `reason: [timer_too_short, orphan_discarded]`, der Dienst liefert ausnahmslos `timer_too_short` (T-093). Entweder unterscheiden oder Aufzählung kürzen | domain-dev |
| O-L | `scripts/**/*.mjs` (Nachweispfade, Attrappen) sieht kein Übersetzer; ein `matchesPool`-Aufruf ohne Pflichtfeld bleibt dort still. Option: `checkJs` mit JSDoc-Typen für die Skripte | Orchestrator |

## Blockiert — braucht eine Umgebung, die hier nicht steht

| ID | Aufgabe | Blockiert durch |
|---|---|---|
| T-B02 | Add-in gegen die Referenzbilder | Referenzbilder liegen nicht vor |
| T-B05 | Windows-Prüfliste, jetzt sieben Punkte | Kein Windows-Rechner. Wichtigster Punkt: Takt mit gesetzter Umgebungsvariable starten und prüfen, dass trotzdem der richtige Name im Export landet (B-8.1, E-042). **Neu:** Nach der Installation muss `…\Takt\taskpane\index.html` existieren — dass NSIS Ressourcen nach `$INSTDIR` legt, ist die unbewiesene Annahme, auf der die Auslieferung des Add-ins steht. |
| T-B08 | Die `.AppImage` mit Playwright fahren | Playwright hat auf Linux keinen Anknüpfungspunkt für Tauris Webview — belegt über die Bibliotheksabhängigkeiten und das Fehlen jeder Tauri-Unterstützung in der Schnittstelle, anders als bei Electron. Keine Auslassung, eine Grenze. |
| T-B06 | 42Crunch-Audit und -Scan | `42c-ast` nicht installiert, keine Zugangsberechtigung. **Es gibt keinen Auditwert.** |
| T-B07 | `cargo audit` über den Rust-Baum | Nicht installiert. Der Rust-Anteil ist nie auf Abhängigkeiten geprüft worden. |

## Offene Fragen an den Auftraggeber

| Nr | Frage |
|---|---|
| F-14 | `WindowsUser` im Export — nackter Name oder `DOMAIN\benutzer`? Die Hülle liefert beides, die Stelle ist beschriftet. |
| F-15 | Was steht hinter „Wenden Sie sich an Ihre Systembetreuung"? Der Satz steht an vier Stellen. Arbeitest du allein mit Takt, ist er eine Sackgasse. |
| F-17 | Sollen Pools sortierbar sein (siehe O-B)? |
