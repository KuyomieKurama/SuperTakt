Aufgabe: T-247-8 — Die drei roten Prüffälle aus T-246-1 beheben; sie blockieren das Qualitätstor
Status: fertig
Artefakte:
- `packages/storage/test/not-billed-audit.test.ts` (Zeile 66/67, jetzt Zeile 58–71: Import und
  Bildung von `REAL_MIGRATIONS_DIR` geändert)

Zusammenfassung:
`REAL_MIGRATIONS_DIR` wurde über `new URL('../migrations', import.meta.url).pathname` gebildet;
unter Windows liefert `.pathname` `/C:/Users/…` mit führendem Schrägstrich vor dem
Laufwerksbuchstaben, und `readdirSync` (über `loadMigrations`) liest daraus den ungültigen Pfad
`C:\C:\Users\…`. Behoben mit `join(import.meta.dirname, '..', 'migrations')` — genau der Weg, den
`migration-runner.test.ts` und `migration-0012-pool-rule-restrict.test.ts` im selben Verzeichnis
bereits für dieselbe Aufgabe verwenden; kein neuer Stil, sondern der schon bewährte. Zunächst kurz
mit `fileURLToPath(new URL(...))` geprüft (funktioniert ebenfalls), dann auf die konsistente
Nachbarlösung umgestellt, um nicht eine dritte Schreibweise für denselben Zweck im selben
Verzeichnis stehen zu lassen. Alle sieben Tests der Datei sind zuerst rot (Ausgangslage aus
T-246-1) und nach der Änderung grün gelaufen; die drei benannten Fälle im Abschnitt
„migrateDownTo — eine `not_billed`-Zeile lässt Migration 0006 nicht zurücknehmen" messen
unverändert: Abbruch bei vorhandener `not_billed`-Zeile mit sprechender Meldung und ohne
Zwischenzustand, keine Blockade durch eine bereits per Exportlauf exportierte Buchung, und die
Gegenprobe ohne jede `not_billed`-Zeile läuft ungehindert hinunter und wieder hinauf. `pnpm run
test:coverage` läuft danach vollständig durch: 88 Testdateien, 1570 bestanden, 3 übersprungen, 0
fehlgeschlagen; Abdeckung `packages/domain` 94,5 % Anweisungen / 92,98 % Zweige, `packages/export`
97,95 % Anweisungen / 92,85 % Zweige — beide deutlich über der 80-Prozent-Schwelle.

Vollständige Suche nach derselben Fehlerklasse (`.pathname`, `path.sep` gegen einen Wert mit
Schrägstrichen, Pfade aus `import.meta.url` ohne `fileURLToPath`/`import.meta.dirname`) über die
gesamte Hoheit (`packages/*/test/**`, `apps/*/test/**`):

- **Behoben** — `packages/storage/test/not-billed-audit.test.ts:66` (einziger Treffer auf
  `.pathname` im ganzen Suchbereich).
- **Nicht betroffen, geprüft** — alle acht übrigen Fundstellen von `import.meta.url`:
  - `packages/storage/test/support/setup.ts:28` und
    `packages/storage/test/support/migrated-database.ts:23` — bereits `dirname(fileURLToPath(...))`.
  - `packages/storage/test/appearance-settings.test.ts:36,38,51,53` — `new URL(...)` wird direkt
    (als URL-Objekt, nicht als `.pathname`-Zeichenkette) an `readFileSync` gereicht; Node liest
    `fs`-Funktionen mit `URL`-Objekten betriebssystemgerecht, dieser Pfad ist sicher.
  - `apps/web/test/lib/startupAppearance.test.ts:5` — dieselbe sichere Form.
  - `apps/web/test/components/dismissLabel.test.ts:75` — bereits `fileURLToPath(url)`.
  - `apps/local-api/test/outlook-certificate.windows.test.ts:10,85,115` — `scriptUrl` bleibt ein
    `URL`-Objekt und geht direkt in `readFile(scriptUrl, 'utf8')`; ebenfalls sicher, keine
    manuelle Pfadzeichenkette.
  - `packages/storage/test/migration-runner.test.ts:20` und
    `packages/storage/test/migration-0012-pool-rule-restrict.test.ts:34` — bereits
    `join(import.meta.dirname, '..', 'migrations')`, das Vorbild für die jetzige Korrektur.
  - `apps/desktop/test/paths.test.ts` — testet `isInside` explizit gegen `path.win32` **und**
    `path.posix` mit fest verdrahteten Testpfaden je Variante; kein Bezug zum tatsächlichen
    `process.platform`, also unabhängig vom ausführenden Betriebssystem korrekt.
  - `path.sep`-Suche über die ganze Hoheit: keine Treffer.
  - Kontrolliert, aber ohne Fund derselben Klasse: POSIX-Rechte
    (`packages/storage/test/file-port.test.ts`, `chmodSync`/`statSync`-Fälle bereits mit
    `it.skipIf(platform === 'win32')` bzw. `if (platform !== 'win32')` abgesichert — die fünfte,
    bereits behobene Fundstelle derselben Serie, hier nur nachgeprüft, nicht verändert) und
    hartkodierte POSIX-Pfade wie `/etc/passwd`, `/tmp/…` in
    `packages/domain/test/attachment.test.ts`, `apps/local-api/test/access/attachment-store.test.ts`,
    `apps/local-api/test/usecases/attachment-input-validation.test.ts` — dort ausschließlich als
    Zeichenketten gegen reine Formatprüfungen (`normalizeAttachmentLink`, `checkAttachmentPath`,
    Namensformprüfung ohne Dateisystemzugriff) getestet, kein echter Dateisystemzugriff, also
    betriebssystemunabhängig richtig.

Untergrenzen-Frage (Punkt 4 des Auftrags): In `packages/storage/test/migration-runner.test.ts:30`
steht bereits ein Zählwächter der verlangten Art —
`expect(migrations.length).toBeGreaterThanOrEqual(5)` direkt nach `loadMigrations(REAL_MIGRATIONS_DIR)`
im Test „liest reale Migrationsdateien". Dieser Wächter hätte den jetzt behobenen Pfadfehler in
`not-billed-audit.test.ts` **nicht** gefangen, weil `loadMigrations` bei einem nicht existierenden
Verzeichnis nicht leise eine leere Liste liefert, sondern direkt beim `readdirSync` wirft (ENOENT)
— der Fehler war laut in den drei roten Tests sichtbar, kein stilles Leerlaufen. In
`not-billed-audit.test.ts` selbst gibt es keine eigene Untergrenze auf `migrations.length`, weil
die Datei `loadMigrations` nie isoliert prüft, sondern immer über `runner.migrateToLatest()` bzw.
`runner.migrateDownTo(5)` — und dort schlägt eine leere Migrationsliste ebenfalls sofort und laut
fehl (keine Version zu erreichen, `to`-Wert falsch). Kein stiller Blindlauf gefunden, der einen
Zählwächter bräuchte; anders als bei `proof:foreign` gibt es hier keinen Pfad, auf dem „0 Dateien
gefunden" als grüner Erfolg durchgehen könnte.

Annahmen:
- `import.meta.dirname` (Node ≥ 20.11 bzw. Node 21) wird bereits an zwei Stellen im selben
  Verzeichnis verwendet und funktioniert unter Vitest; für die dritte Stelle keine neue Prämisse.
- Der Wechsel von der zunächst geprüften `fileURLToPath`-Variante auf `import.meta.dirname` ist
  eine reine Stilangleichung an die beiden Nachbardateien, keine fachliche Änderung; beide Formen
  wurden lokal grün gefahren, bevor ich mich für die konsistente entschieden habe.

Risiken: Keine neuen. Die Korrektur betrifft ausschließlich Testcode, keine Produktivlogik, kein
Sicherheitsbezug.

Offene Fragen: Keine.

Nächster Schritt: `pnpm check` als Ganzes fahren, um zu bestätigen, dass `test:coverage` im vollen
Torlauf ebenso durchläuft wie im isolierten Lauf hier (die übrigen Torschritte — `typecheck`,
`boundaries`, `contrast`, `proof:all`, `verify:bundle`, `test:rust`, `build`, `audit` — waren nicht
Teil dieses Auftrags und wurden hier nicht erneut gefahren).
