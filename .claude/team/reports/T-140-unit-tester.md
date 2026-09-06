# T-140 — Prüffälle zur Versionsprüfung, O-BC, Ein-Zeilen-Nachzug

Aufgabe: T-140 — Prüffälle zur Versionsprüfung, O-BC, Ein-Zeilen-Nachzug
Status: teilweise

## Artefakte

**Neu**

| Datei | Was |
|---|---|
| `packages/domain/test/version.test.ts` | 61 Fälle: `checkVersion`, `isVersion`, `normalizeVersion`, `compareVersions`/`comparePrecedence` (TP-VER-15 bis -23, mit Nachweis, dass ein naiver Zeichenkettenvergleich an jeder relevanten Zeile scheitert), `decideUpdateNotice` (neuer und nicht übersprungen, Gleichheit statt „kleiner-gleich", nie ein Wurf) |
| `apps/local-api/test/version/source.test.ts` | 29 Fälle gegen `createGithubReleaseSource({ fetch })`, **echt** gegen einen lokalen `http.createServer()`: TP-VER-01 bis -06, -25, -26, dazu A-V-2, A-V-5, A-V-6 (gzip-Bombe **und** Grenzwert), A-V-7 (nur `tag_name`, kein Rückgriff auf `name`), A-V-8, A-V-12, A-V-13, A-V-14 |
| `apps/local-api/test/version/checker.test.ts` | 9 Fälle für `createVersionChecker`: „tut nichts bis `start()`", A-V-10 (`current()` × 100 löst nichts aus), ein Aufruf je Start, **kein** zweiter Versuch nach Fehlschlag (A-18.11), harter Boden bei stehender Uhr (A-V-11), `stop()` bricht einen laufenden Aufruf ab (A-V-12) — die von T-138 als „gebaut, aber ungemessen" gemeldete Auflage |
| `apps/local-api/test/version/support/http-stub.ts` | Testhelfer: ein echter `http.createServer()`, konfigurierbar, zeichnet jede Anfrage auf |
| `apps/local-api/test/routes/version.test.ts` | 7 Fälle für `GET /api/v1/version-check`: liest nur ab, `current` ist eine parameterlose Funktion ohne jede Möglichkeit, eine Anfrage auszulösen (A-V-10 auf Routenebene) |
| `apps/web/test/lib/foreign.test.ts` | 17 Fälle: `foreignTextFrom` (O-AT-Grenze), `quotedName`, `foreignText` — inklusive Bidi-Zeichen (E-063) |
| `apps/web/test/lib/exportTemplateModel.test.ts` | 15 Fälle: `describeDeviations` (alle vier Abweichungsarten plus „zusätzlich" und „Reihenfolge", mit dem **positionsbasierten** `id`, nicht dem Feldnamen — die O-AT-Grenze aus T-133) und `duplicateFieldNames` |

**Geändert**

| Datei | Was |
|---|---|
| `packages/storage/test/migration-0012-pool-rule-restrict.test.ts` | Der rote Fall: zwei Stellen erwarteten `restrictMigration.version` (= 12) als letzte Migration. Seit T-138s `0013_skipped_version` ist das falsch. Beide auf `migrations.at(-1)?.version` umgestellt — dieselbe Klasse wie T-134 an der Add-in-Tür |
| `packages/storage/test/migration-failure-reason.test.ts` | Übernommen (O-BC). Zwei neue `describe`-Blöcke, 5 Fälle: `errorCodeOf`, `sqliteResultCodeOf`, `isBusyResultCode` direkt gemessen — vorher nur mittelbar über volle Migrationsläufe, nie mit einem schlecht geformten `code` (Pfad, Satz, großbuchstabige Zufallszeichenkette als Geheimnis-Attrappe) |
| `apps/desktop/src-tauri/src/release.rs` | Übernommen und erweitert (T-139 Bitte: „erweitern statt verschieben"). 5 neue `#[test]`-Funktionen neben den vier bestehenden: `MAX_NUMBER_LEN` je Komponente statt nur gesamt, `MAX_VERSION_LEN` exakt an der Grenze (94/95), kein `V`/`v` in irgendeiner Schreibweise, führende Nullen wie in der Domäne, `release_url` ist wirklich `None` und keine Teiladresse |

**Geprüft, nicht geändert**

| Datei | Befund |
|---|---|
| `apps/local-api/test/startup.test.ts` | Übernommen (O-BC), durchgesehen: 18 Fälle, vollständiger Vorrat der neun Gründe per `satisfies`-Übersetzerprüfung abgesichert, Pfadfreiheit über alle 14 ungünstigen Werte gemessen, Riegel im Protokollierer mit fünf bösartigen Eingaben geprüft. Schon vor der Übernahme in meiner Bauart — keine Lücke gefunden, die eine Änderung gerechtfertigt hätte |

## Zusammenfassung

Der Ein-Zeilen-Nachzug ist gemacht und war tatsächlich zwei Stellen in derselben Datei (Zeile 63 und 123), beide auf `migrations.at(-1)?.version` umgestellt; eine weitere Suche nach derselben Bauart (hingeschriebene Migrationsnummern, Längengrenzen, Routenlisten) über den ganzen Testbaum ergab keinen zweiten Fall. O-BC ist übernommen: `startup.test.ts` war bereits vollständig und wurde nicht angefasst, `migration-failure-reason.test.ts` bekam fünf neue Fälle für die drei bisher nur mittelbar gemessenen Riegelfunktionen. Der Kern der Aufgabe — die Versionsprüfung — ist jetzt an vier Ebenen dauerhaft geprüft: die Ordnung in `packages/domain` (Zeichenkettenvergleich nachweislich zum Scheitern gebracht), die Naht zu GitHub in `apps/local-api` gegen einen echten lokalen HTTP-Server (nicht gestubbtes `fetch`), die Terminplanung des Prüfers (A-V-10 bis A-V-12, darunter die von T-138 als ungemessen gemeldete Auflage A-V-12), und die Formprüfung in Rust neben `takt_open_release`. Zwei Lücken aus T-133 (`foreignTextFrom`, `describeDeviations`) sind geschlossen. Eine Lücke bleibt offen und ist unten begründet: `apps/web/src/app/useUpdateNotice.ts` lässt sich mit dem heutigen Bestand nicht als React-Hook prüfen.

## Annahmen

1. **`apps/local-api/test/version/**` ist eine neue Hoheitsuntergliederung**, die die Struktur von `apps/local-api/src/version/**` spiegelt — dieselbe Konvention wie `test/usecases/**` neben `src/usecases/**`. Kein Eintrag in `vitest.config.ts` nötig, das `include`-Muster erfasst sie bereits.
2. **`source.test.ts` misst echt, nicht gestubbt.** `docs/testplan.md` Abschnitt 24 verlangt es ausdrücklich für diese Fälle; ein gestubbtes `fetch` hätte `redirect: 'error'`, die gzip-Entpackung und die Fristbehandlung von Node ungeprüft gelassen. Der Zeitüberschreitungsfall braucht deshalb echte 5 Sekunden — der einzige langsame Fall in dieser Aufgabe, mit eigenem, verlängertem Testzeitlimit.
3. **`checker.test.ts` misst mit einer handgeschriebenen `ReleaseSourcePort`-Attrappe, nicht mit einer echten Gegenstelle.** Das Netzverhalten ist bereits Gegenstand von `source.test.ts`; hier zählt nur, wann und wie oft `latest()` gerufen wird. Der harte Boden (A-V-11) wird mit einer **eingefrorenen Uhr** bei sehr kurzem Zeitgebertakt geprüft — echte Zeit im Millisekundenbereich statt der betrieblichen 24 Stunden bzw. 60 Minuten, damit der Test schnell bleibt und trotzdem dieselbe Verzweigung im Produktivcode trifft.
4. **`useUpdateNotice.ts` bleibt ungetestet — begründeter Verzicht, kein Übersehen.** Die Datei ist ein React-Hook (`useState`, `useEffect`, `useMemo`, `useCallback`, zwei Kontexte). Weder `@testing-library/react` noch `jsdom`/`happy-dom` noch `react-test-renderer` liegen im Arbeitsbereich vor (geprüft: `apps/web/package.json`, `pnpm-lock.yaml`) — React-Hooks lassen sich ohne eine dieser Zutaten nicht außerhalb einer Komponente aufrufen (`Invalid hook call`). `package.json`/`pnpm-lock.yaml` sind Orchestrator-Hoheit, ich habe keine Abhängigkeit hinzugefügt. Siehe „Offene Fragen".
5. **`describeDeviations`/`duplicateFieldNames` werden gegen einen handgeschriebenen `SourceCatalog` geprüft, nicht gegen `readSourceCatalog`.** Das hält den Test auf das beschränkt, was `describeDeviations` tatsächlich aufruft (`sourceLabel`, `transformationLabel`, `conditionOperatorLabel`), statt eine vollständige `ExportSourceCatalog`-Antwort zu erfinden, die nichts zusätzlich prüfte.
6. **Testdaten:** erfundene Fassungsnummern (`9.9.9`, `1.4.0`, …), ein erfundener Bestandsname (`beispiel-organisation/takt-testfixture`) nach der Konvention aus `docs/testplan.md` Abschnitt 24, erfundene Poolnamen/Feldnamen (`Ost`, `Wartung Nord`, `Call`/`Zeit`/`Notiz`/`WindowsUser` — letztere sind die vom Abrechnungstool vorgegebenen Schlüssel selbst, keine Kundendaten). Keine echten Call-Nummern, keine echten Namen.

## Risiken

1. **Sicherheit — dieselbe Beobachtung wie im T-132-Bericht, jetzt gemessen statt vermutet.** Der Riegel in `errorCodeOf` ist eine Gestaltprüfung (`/^[A-Z][A-Z0-9_]{0,31}$/`), keine Inhaltsprüfung: Ein zufällig großbuchstabiger, 32 Zeichen langer Wert käme durch. Mein neuer Fall (`'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0'`, 41 Zeichen, also **über** der Grenze) fällt korrekt durch die Länge — ein Wert mit genau 32 großbuchstabigen Zeichen würde dagegen durchgehen. Das ist derselbe Restbefund, den domain-dev schon benannt hat, nicht neu; ich habe ihn nur mit einer konkreten Zahl unterlegt.
2. **Der Nachweis von A-V-6 bleibt auf die Abbruchgrenze beschränkt, nicht auf die reale Antwortgröße.** T-138s eigener Bericht nennt das als offenen Punkt (die echte Adresse liefert heute 404). Meine gzip-Bombe (128 KiB entpackt gegen die 64-KiB-Grenze) beweist den Abbruchmechanismus, nicht die Angemessenheit der Zahl selbst.
3. **`redactSecrets`/`logger.ts` (`apps/local-api/src/access/token.ts`, `apps/local-api/src/logger.ts`) haben keine eigene Prüfdatei** — weder von mir noch, soweit ich sehe, von einer früheren Aufgabe. Das ist eine bestehende Lücke außerhalb des Auftrags dieser Aufgabe; ich melde sie, ohne sie zu schließen, weil sie nichts mit der Versionsprüfung zu tun hat und den Rahmen gesprengt hätte.
4. **Der Zeitüberschreitungsfall in `source.test.ts` läuft real über 5 Sekunden.** Er ist mit einem eigenen, verlängerten Testzeitlimit versehen (`VERSION_CHECK_TIMEOUT_MS + 3_000`), verlangsamt aber jeden Lauf dieser einen Datei sichtbar (~5,3 s statt Millisekunden). Eine Alternative — die Frist über eine Option kürzbar zu machen — hätte Produktivcode berührt und lag außerhalb meiner Hoheit; ich habe sie nicht vorgeschlagen, weil `VERSION_CHECK_TIMEOUT_MS` bewusst als feste Konstante gebaut ist (A-V-5, „eine Gesamtfrist").

## Offene Fragen

1. **`apps/web/src/app/useUpdateNotice.ts` ist ohne eine Erweiterung des Arbeitsbereichs nicht als Hook prüfbar.** Zwei Wege, beide außerhalb meiner Hoheit:
   - `@testing-library/react` + `happy-dom` (leichter als `jsdom`) als `devDependencies` in `apps/web/package.json` aufnehmen — eine Entscheidung des Orchestrators, weil sie eine neue Testinfrastruktur einführt und `package.json`/`pnpm-lock.yaml` gemeinsame Dateien sind.
   - Oder: die drei von T-139 benannten Verhaltensweisen („übersprungen heißt still", „Fehlschlag heißt still", „Überspringen schreibt `skippedVersion`, nicht `localStorage`") ausschließlich über Playwright in T-142 abdecken (`TP-VER-08`, `-09`, `-11`, `-12` decken das teilweise bereits ab). Das wäre kein Ersatz für einen Einheitentest, aber ein Weg, die Verhaltensfragen zu beantworten, ohne die Lieferkette zu erweitern.

   Ohne eine dieser beiden Entscheidungen bleibt die Lücke bestehen.

2. **`vitest.config.ts` `coverage.include`** deckt nur `packages/domain|storage|export/src`. `apps/local-api/src/version/**` und `apps/web/src/lib/**` sind damit nicht Teil der 80-Prozent-Schwelle, obwohl sie jetzt getestet sind. Das ist die bestehende, begründete Regel (Oberfläche/Dienst werden über andere Mittel geprüft) und keine Lücke, die ich schließen sollte — nur als Erklärung, warum die Coverage-Zahlen unten nur drei Pakete zeigen.

## Nächster Schritt

1. Orchestrator: Entscheidung zu offener Frage 1 (`useUpdateNotice.ts`).
2. Code-Reviewer/security-checker: Risiko 1 zur Kenntnis nehmen — kein neuer Befund, aber jetzt mit Zahl.
3. Nach der ersten echten GitHub-Veröffentlichung: A-V-6 mit der realen Antwortgröße nachmessen (bereits von T-138 als Auflage benannt, hier nur wiederholt, weil mein Test dieselbe Lücke sichtbar macht).

## Zahlen

| Wo | Vorher | Nachher |
|---|---|---|
| `pnpm test` (vitest) | 1027/1028 (1 rot: die Migrationsnummer) | **1171/1171** (66 Dateien, +6 Dateien, +143 Fälle) |
| `cargo test --offline --lib` (`apps/desktop/src-tauri`) | 26/26 | **31/31** (+5) |
| `pnpm typecheck` | — | 0 Fehler (alle acht Pakete, Testprojekte, E2E-Typen) |
| `pnpm test:coverage` | — | Exitcode 0. `packages/domain/src`: 92,62 % Anweisungen / 90,73 % Zweige / 93,75 % Funktionen / 92,71 % Zeilen. `packages/export/src`: 97,95 / 92,85 / 100 / 97,82. `packages/storage/src` (inkl. `sqlite/`): 89,97–100 %. Alle über der 80-Prozent-Schwelle, keine Schwellenverletzung |

**Rot-vor-Grün, nachgewiesen:**

- Der Ein-Zeilen-Nachzug: `packages/storage/test/migration-0012-pool-rule-restrict.test.ts` lief vor der Änderung mit `AssertionError: expected { kind: 'current', version: 13 } to deeply equal { kind: 'current', version: 12 }` — dokumentiert oben unter „Der rote Fall".

**Mutationen, gegengemessen (production code jeweils befristet verändert, Test lief rot, dann zurückgesetzt und wieder grün geprüft):**

| Datei | Mutation | Ergebnis |
|---|---|---|
| `packages/storage/src/migration.ts` | `errorCodeOf`-Regex auf `/^.{0,32}$/` gelockert | 1 Fall rot |
| `packages/domain/src/version.ts` | `compareVersions` auf naiven Zeichenkettenvergleich umgestellt | 8 Fälle rot |
| `packages/domain/src/version.ts` | `decideUpdateNotice`-Skip-Vergleich von `=== 0` auf `<= 0` | 1 Fall rot |
| `apps/local-api/src/version/source.ts` | Feldzugriff um Rückgriff auf `name` erweitert (A-V-7) | 1 Fall rot (nach Ergänzung eines gezielten Falls — die erste Fassung der Prüffälle hatte diese Mutation **nicht** gefangen, siehe unten) |
| `apps/local-api/src/version/source.ts` | Obergrenze `VERSION_CHECK_MAX_BYTES * 10` | 1 Fall rot (anderer, aber weiterhin falscher Ausgang) |
| `apps/local-api/src/version/checker.ts` | Fehlschlag plant trotzdem neu (`schedule(intervalMs)` ergänzt) | 1 Fall rot |
| `apps/local-api/src/version/checker.ts` | harter Boden abgeschaltet (`if (false)`) | 1 Fall rot |
| `apps/local-api/src/version/checker.ts` | `control.abort()` entfernt | 1 Fall rot |
| `apps/web/src/lib/foreign.ts` | `foreignTextFrom` akzeptiert zusätzlich `number` | 1 Fall rot |
| `apps/web/src/lib/exportTemplateModel.ts` | `duplicateFieldNames` ohne `.trim()` | 1 Fall rot |
| `apps/web/src/lib/exportTemplateModel.ts` | `missing`-`id` auf Feldnamen statt Stelle umgestellt | 2 Fälle rot (genau die O-AT-Regression, gegen die der Test geschrieben ist) |
| `apps/desktop/src-tauri/src/release.rs` | `MAX_NUMBER_LEN` von 9 auf 20 | 2 Fälle rot |

**Ein Fund unterwegs, im Sinne von T-134/T-133:** Meine erste Fassung des A-V-7-Falls („nur `tag_name` wird gelesen") maß nur den positiven Fall — eine Antwort mit vielen Feldern, bei der `tag_name` selbst vorhanden war. Die Mutation „bei fehlendem `tag_name` auf `name` ausweichen" blieb dabei **grün**, weil kein Fall je `tag_name` fehlen ließ, während `name` vorhanden war. Ergänzt um genau diesen Fall (`{ name: '1.2.3' }` ohne `tag_name`) — jetzt rot bei der Mutation, wie oben verzeichnet. Derselbe Fehler, den die Aufgabenstellung als Maßstab nennt (T-134 Gegenprobe A, T-133 Gegenproben J/L), ist mir also selbst passiert und wurde vor Abgabe behoben, nicht nur vermieden.
