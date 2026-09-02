Aufgabe: T-001 — Domänenmodell und lokale Speicherarchitektur

Status: fertig

Artefakte:

Neu angelegt:

- `docs/architektur.md` — hexagonaler Schnitt, Ablauf der drei kritischen Vorgänge,
  Notiz-Trennung, Routen und Fehlerformat des lokalen Dienstes, Token-Verfahren als Vorgabe
  für T-011.
- `docs/datenmodell.md` — Entitäten, SQLite-Schema, Baumstrategie mit Messwerten,
  Rundungstabelle mit beiden Varianten, Exportstatus-Protokoll, Migrationsverfahren.
- `packages/storage/migrations/0001_initial.up.sql` / `.down.sql` — Schema.
- `packages/storage/migrations/0002_seed_defaults.up.sql` / `.down.sql` — Startbestand
  (vier Beispielspalten, Standard-Exportvorlage, Einstellungszeile).
- `packages/domain/src/kernel.ts` — Kennungen, Zeit, Ergebnis, Fehlerkatalog.
- `packages/domain/src/rundung.ts` — Rundungsvertrag samt Randfällen.
- `packages/domain/src/zeitbuchung.ts` — Exportstatus, Timer-Regel, Protokollzeile.
- `packages/domain/src/todo.ts` — Todo, Kanbanspalte, `TodoNotiz` als eigener Typ.
- `packages/domain/src/tag.ts` — Tags, Ordner, Zyklusprüfung, Pools, Standard-Tags.
- `packages/domain/src/export.ts` — `ExportKandidat`, abschließende Quellenpfadliste,
  Übersetzerbehauptung für die Notiz-Grenze.
- `packages/domain/src/einstellungen.ts`, `packages/domain/src/index.ts`.
- `packages/storage/src/ports.ts` — ausgehende Ports.
- `packages/storage/src/migration.ts`, `packages/storage/src/index.ts`.
- `apps/local-api/openapi/takt-local-api.yaml` — OpenAPI 3.1, 31 Pfade, 51 Operationen.

Nicht angefasst: `docs/spec.md`, `CLAUDE.md`, `board.md`, `package.json`, `packages/export/`,
`apps/web/`, `apps/desktop/`, `apps/outlook-addin/`, `apps/local-api/src/routes/addin/`,
alle Testordner.

Zusammenfassung:

Domäne, Ports und HTTP-Fläche sind entworfen und als reine Typdefinitionen abgelegt; die
Umsetzung bleibt T-009 vorbehalten. Das SQLite-Schema liegt nicht nur als Beschreibung vor,
sondern als ausführbare Migrationen, die ich gegen SQLite 3.51.3 vorwärts, rückwärts, erneut
vorwärts und mit absichtlich mittendrin abgebrochenem Lauf ausgeführt habe. Die fachlichen
Zusicherungen — genau ein laufender Timer, zweiwertiger Exportstatus, Sperre der exportierten
Buchung, unveränderliches Protokoll, unlöschbare Standardvorlage — sind als partielle
eindeutige Indizes, Bedingungen und Trigger im Schema verankert und einzeln nachgewiesen, statt
im Code zugesichert zu werden. Die Notiz-Trennung aus A-7.2 ist vierfach strukturell abgesichert;
die oberste Schicht ist eine Typbehauptung, deren Auslösen ich durch versuchsweises Einfügen von
`todo.note` überprüft habe — der Übersetzer bricht dann ab. Für den Tag-Baum habe ich rekursive
CTE und Closure-Tabelle gebaut und gemessen, statt die Wahl zu setzen.

Annahmen:

1. **„Erledigt" ist nicht dasselbe wie die Kanban-Spalte.** A-2.4 nennt einen festen Zustand,
   A-5.4 verlangt konfigurierbare Spalten. Ich habe `todo.completed_at` als eigenständiges Feld
   geführt und die Spalte über ein Merkmal `is_done` damit verknüpft. Sonst stünde ein
   Spaltenname wie „Done" im Code und A-5.4 wäre verletzt, sobald jemand ihn ändert.

2. **Rückkehrspalte nach A-2.5.** Beim Erledigen wird die vorherige Spalte in
   `status_id_before_done` gemerkt; der Timerstart setzt sie zurück, ersatzweise auf die als
   Standard markierte Spalte. Die Spezifikation sagt „landet erneut in dem zuvor definierten
   Todo-Pool", aber nicht, in welcher Kanban-Spalte. Der Pool ergibt sich ohne Zutun aus den
   Tags (A-3.4); die Spalte brauchte eine Festlegung.

3. **Call-Nummer nicht eindeutig.** A-10.9 verlangt, dass der Benutzer entscheidet, ob er auf
   ein vorhandenes Todo bucht oder bewusst ein zweites anlegt. Ein Eindeutigkeitszwang nähme ihm
   diese Wahl. Indiziert ja, erzwungen nein.

4. **Mindestdauer eine Sekunde.** Ein Stopp unterhalb davon verwirft die Buchung, statt eine mit
   Dauer 0 anzulegen — das ist der Doppelklick auf „Start", nicht geleistete Arbeit. Der Dienst
   meldet das mit `200` und `art: "verworfen"`, nicht als Fehler.

5. **Rundung je Buchung, nicht auf die Summe.** Siehe „Offene Fragen", Punkt 2.

6. **Zeitstempel sekundengenau in UTC**, Dauer als berechnete Spalte aus Start und Ende, Endzeit
   beim Stoppen aus einer monotonen Messung. Damit können Start, Ende und Dauer nicht
   auseinanderlaufen und eine Zeitumstellung während eines laufenden Timers verändert die
   Abrechnung nicht.

7. **Auch `/health` verlangt das Token.** Eine offene Zustandsabfrage verriete jedem lokalen
   Prozess und jeder Webseite, dass Takt läuft und auf welchem Port.

8. **`401` und `403` sind getrennt.** „Falsches Token" und „falsche Herkunft" sind für den
   Benutzer beim Einrichten unterschiedliche Probleme. Die Zuordnung steht an einer Stelle im
   HTTP-Adapter und lässt sich zusammenlegen, falls T-003 das anders bewertet.

9. **Adjazenzliste statt Closure-Tabelle** für den Tag-Baum, siehe Zusammenfassung und
   `docs/datenmodell.md` Abschnitt 4.2.

10. **Token in einer eigenen Datei, nicht in der Datenbank.** Die Datenbankdatei wird kopiert —
    für Sicherungen, zur Fehlersuche, in abgeglichene Ordner. Ein Token darin wandert mit.

Risiken:

- **R-03 bleibt offen und ist die einzige Zahl, an der Geld hängt.** Beide Rundungsverfahren
  sind in `docs/datenmodell.md` Abschnitt 5.2 mit gerechneter Beispieltabelle
  gegenübergestellt: Bei den sechzehn geforderten Werten ergibt „aufwärts" 16,00 Stunden,
  „kaufmännisch" 15,25 Stunden — 4,9 Prozent Unterschied. Ich empfehle „aufwärts" nach E-008.
  Beide sind über `app_setting.rounding_mode` umschaltbar und der verwendete Modus wird je
  Exportlauf mitgeschrieben, damit die Entscheidung bis zur Bestätigung umkehrbar bleibt.

- **R-10, Doppelabrechnung.** Das Protokoll ist angelegt und über Trigger unveränderlich; ohne
  Protokollzeile gibt es keinen Statuswechsel. Es macht eine Doppelabrechnung aber nur
  *nachvollziehbar*, nicht unmöglich — das ist die Folge von E-012 und keine Lücke. Die
  Oberfläche muss den Zustand `export_status = 'offen' AND export_count > 0` sichtbar
  kennzeichnen; ein Teilindex bedient die Abfrage. **Für frontend-dev und spec-ux-reviewer
  relevant.**

- **R-06, Notiz-Trennung.** Vier Schichten, alle nachgewiesen. Die schwächste Stelle ist die
  Paketgrenze: Sie hält nur, wenn `packages/export` weder `@takt/storage` noch `@takt/domain`
  als Ganzes als Abhängigkeit führt, sondern ausschließlich `@takt/domain/export`. Das steht in
  einer `package.json` und gehört damit dem Orchestrator — siehe „Offene Fragen", Punkt 1.

- **R-02 und R-09, lokaler Dienst.** Ich habe das Verfahren beschrieben, aber ausdrücklich
  nichts umgesetzt (T-011). Drei Punkte, die über E-009 hinausgehen und die T-003 bewerten
  sollte: Prüfung von `Sec-Fetch-Site` gegen `cross-site`, Prüfung des `Host`-Kopfs gegen
  DNS-Rebinding, und der Vergleich über SHA-256-Abdrücke statt direkt, weil ein zeitkonstanter
  Vergleich bei ungleicher Länge scheitert und damit die Länge verriete.

- **R-11, Exportordner.** Prüfung vor *jedem* Lauf, nicht nur beim Einstellen; Zielpfad gegen
  den aufgelösten Ordner geprüft; Dateiname vom Dienst gebildet, nie aus der Anfrage.

- **R-04, Sidecar-Bündelung.** `better-sqlite3` ist eine native Erweiterung und der
  wahrscheinlichste Stolperstein beim Bündeln. Der Ersatz `node:sqlite` ist in Node 22 eingebaut
  und braucht keine mitgelieferte Binärdatei; ich habe alle Schema- und Migrationstests damit
  gefahren, sie laufen also nachweislich auf beiden. Der Tausch bleibt im Adapter.

- **Rückwärtsmigration einer Datenmigration ist nur auf unbenutztem Bestand vollständig.** Das
  ist keine Schwäche der Umsetzung, sondern die Natur der Sache. 0002 bricht deshalb mit
  sprechender Meldung ab, statt still zu scheitern. Der eigentliche Rückweg auf einem benutzten
  Bestand ist die Sicherungskopie, die der Läufer vor jedem Lauf anlegt.

Offene Fragen:

1. **An den Orchestrator, Paketregistrierung und Abhängigkeiten.** Ich habe keine
   `package.json` und keine `pnpm-workspace.yaml` angelegt. Benötigt für T-008:
   - `@takt/domain` mit zwei Einstiegspunkten: `.` auf `src/index.ts` und **`./export` auf
     `src/export.ts`**. Der zweite ist die Trägerschicht von R-06.
   - `@takt/storage` mit Abhängigkeit auf `@takt/domain`.
   - **`packages/export` darf `@takt/storage` und `@takt/domain` (als Ganzes) nicht als
     Abhängigkeit führen, nur `@takt/domain/export`.** Ohne diesen Eintrag ist die vierte
     Schicht der Notiz-Trennung nur eine Vereinbarung.
   - Laufzeitabhängigkeiten: `better-sqlite3`, `kysely`, `zod`, `hono`, `@hono/zod-openapi`.
   - Ein Skript `typecheck`, das über alle Pakete läuft.

2. **An den Auftraggeber, über den Orchestrator: Rundung je Buchung oder auf die Summe?**
   Die Spezifikation schweigt dazu, und der Unterschied ist größer als der aus R-03. Vier
   Buchungen zu je drei Minuten am selben Todo ergeben je Buchung 4 × 0,25 = **1,00 Stunde**,
   auf die Summe gerechnet **0,25 Stunden** — Faktor vier. Ich habe „je Buchung" umgesetzt,
   weil A-8.1 Buchungen exportiert und jede Buchung ihre eigene Notiz trägt, die im Export
   erscheinen soll (A-7.4); ein Zusammenfassen müsste die Notizen verschmelzen. Sollte
   zusammen mit R-03 vor Welle 3 bestätigt werden.

3. **An den Auftraggeber: Was passiert mit einem Todo, dessen Erledigt-Spalte gelöscht wird?**
   Ich habe festgelegt, dass eine Spalte mit Todos darin nicht löschbar ist (`409
   status_in_use`). Die Alternative — Todos in die Standardspalte schieben — wäre bequemer,
   verschiebt aber Karten ohne Zutun des Benutzers. Meine Wahl ist die vorsichtigere; falls sie
   im Alltag stört, ist sie leicht umzustellen.

4. **An security-checker (T-003), drei Punkte zur Bewertung:** die Trennung von `401` und `403`
   (Annahme 8); ob `Sec-Fetch-Site` und `Host` zusammen einen Tokendiebstahl aus einem fremden
   Browsertab auffangen; und die Dateirechte der erzeugten Exportdatei, die ich bewusst nicht
   festgelegt habe.

5. **Hinweis, kein Blocker:** `pnpm typecheck` konnte ich nicht ausführen, weil der
   Arbeitsbereich noch nicht existiert (T-008) und `package.json` nicht mir gehört.
   Ersatzweise habe ich TypeScript 5.9.3 gesondert installiert und alle Typdateien mit
   `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
   und `noUnusedLocals` übersetzt — Exitcode 0. Sobald T-008 den Arbeitsbereich anlegt, sollte
   `pnpm typecheck` ohne Änderung an meinen Dateien durchlaufen.

Nächster Schritt:

1. **Vor allem anderen:** R-03 und die offene Frage 2 (je Buchung oder auf die Summe) dem
   Auftraggeber gemeinsam vorlegen. Beides sind Geldfragen, beides steht mit gerechneten Zahlen
   in `docs/datenmodell.md` Abschnitt 5, und beides muss vor T-010 entschieden sein — sonst
   schreibt unit-tester eine Rundungstabelle fest, die sich danach ändert.

2. T-008 kann starten, sobald die Paketregistrierung aus Frage 1 gesetzt ist. Die Migrationen
   sind lauffähig; der Läufer braucht nur die in `packages/storage/src/migration.ts`
   beschriebene Klammer.

3. T-007 (integration-dev) kann unmittelbar beginnen: `ExportKandidat`, `ExportQuellenpfad` und
   `ExportVorlagenHuelle` stehen. Wichtig für die Übergabe: `packages/export` bekommt **keine
   Ports**, sondern fertige `ExportKandidat`-Werte, und die Quellenpfadliste in
   `packages/domain/src/export.ts` ist abschließend — ein Pfad, der dort fehlt, ist nicht
   wählbar.

4. T-003 (security-checker) kann `apps/local-api/openapi/takt-local-api.yaml` prüfen; sie ist
   vollständig und maschinenlesbar. Der Namensraum `/api/v1/addin/**` ist bewusst nicht darin
   und gehört integration-dev.
