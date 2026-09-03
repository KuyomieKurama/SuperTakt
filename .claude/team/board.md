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
| O-D | Die Aufruferseite des Add-ins ist von `proof:callers` nicht erfasst | domain-dev |
| O-G | Die Quellkarten des Add-ins gehen in die Auslieferung mit (1,1 MiB, über HTTPS abrufbar). Nichts wurde stillschweigend gefiltert — die Frage gehört entschieden. | Auftraggeber |
| O-H | `pnpm desktop` braucht jetzt beide Ports frei (17843 und 17844). Verhaltensänderung durch den mitlaufenden Nachweis; die Kette bleibt sauber stehen und nennt den Grund. | — |
| O-E | Neun End-to-End-Fälle nicht gelaufen: Add-in (kein Office.js-Wirt), drei Hüllenzustände (kein echter Tauri-Prozess), Stichprobe über die 19 Orte mit Exportstatus, Standard-Tags über die Oberfläche | e2e-tester |
| O-F | 14 Befunde aus T-025 unverändert offen, geordnet nach Gewicht ab C-12 | spec-ux-reviewer |

| O-I | Kommentar an `packages/storage/src/ports.ts` begründet `resolveRule`/`resolveExcluded` mit einem Aufrufer in `routes/addin`, den es seit T-086 nicht mehr gibt; einziger Nutzer in `src` ist der Adapter, dazu `repo-tags.test.ts`. Entweder Kommentar richtigstellen oder beide zugunsten von `resolveAxes` streichen | domain-dev |
| O-J | `resolved` trägt drei Wahrheitswerte (`isEmpty`, `unresolvedRequired`, `matchesNothing`); frontend-dev schlägt einen benannten Grund `matchesNothingReason: 'none' \| 'empty' \| 'unresolved-required'` vor, damit ein dritter Grund die Oberfläche rot statt still macht | domain-dev |
| O-K | Das Add-in kann nicht sagen, *warum* ein Pool im Aufgabenbereich fehlt (bekommt nur Namen). Produktfrage: reicht das? | Auftraggeber |
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
