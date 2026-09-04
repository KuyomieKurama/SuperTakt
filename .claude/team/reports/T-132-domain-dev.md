# T-132 — Der Startabbruch nennt seinen Grund; dazu O-C und O-M

Aufgabe: T-132 — Der Startabbruch nennt seinen Grund; dazu O-C und O-M
Status: fertig

## Artefakte

**Neu**

| Datei | Was |
|---|---|
| `apps/local-api/src/startup.ts` | Der Startpfad in Worte gefasst: `bringDatabaseUpToDate`, `describeMigrationFailure`, `describeStoreOpenFailure`. Rein, ohne laufenden Dienst prüfbar |
| `packages/storage/test/migration-failure-reason.test.ts` | **Übergabe an unit-tester.** 9 Fälle: der Läufer hängt jedem Fehlschlag seinen Grund an |
| `apps/local-api/test/startup.test.ts` | **Übergabe an unit-tester.** 18 Fälle: Unterscheidung, Pfadfreiheit über den vollständigen Vorrat, Riegel im Protokollierer |

**Geändert**

| Datei | Was |
|---|---|
| `packages/storage/src/migration.ts` | `MigrationFailureReason` (9 Zweige), `migrationFailure`, `migrationFailureReason`, `errorCodeOf`, `sqliteResultCodeOf`, `isBusyResultCode` |
| `packages/storage/src/sqlite/migration-runner.ts` | Jeder Wurf bekommt seinen Grund; `state()`/`applied()` in eine Klammer, Sicherungskopie und Einzelmigration getrennt eingeordnet |
| `packages/storage/src/sqlite/open.ts` | Der Drift der eingebetteten Migrationen wirft mit Grund |
| `packages/storage/src/index.ts` | Laufzeitausfuhr der sechs Helfer |
| `packages/storage/src/ports.ts` | `describeExportDirectory` → `describeLocation`; `SystemPort.databaseFilesTooPermissive()` |
| `packages/storage/src/sqlite/clock.ts` | Umsetzung von `databaseFilesTooPermissive` |
| `packages/domain/src/settings.ts` | `LocationTrait`; `ExportDirectoryTrait` bleibt als Deckname |
| `apps/local-api/src/main.ts` | `compose()` in einer Klammer; Migration über `startup.ts`; sechs weitere Zeilen mit technischem Grund |
| `apps/local-api/src/logger.ts` | `lifecycle(level, message, reason?)` mit engem Zeichenvorrat und `unclassified` als Auffang |
| `apps/local-api/src/taskpane/server.ts` | Der belegte Port 17844 nennt seinen Fehlerschlüssel |
| `apps/local-api/src/access/export-directory.ts` | `describeLocation`, gilt jetzt für beide Orte |
| `apps/local-api/src/usecases/structure.ts` | `SettingsView.databaseTraits`, `SettingsView.databaseFilesTooPermissive` |
| `apps/local-api/openapi/takt-local-api.yaml` | Beide neuen Felder beschrieben; `ExportDirectoryTrait` gilt für Orte |
| `apps/local-api/scripts/caller-scan.mjs` | `CALL_SHAPES`; Methoden/Pfeilfunktionen als umschließende Funktion; Pfadvorsilbe |
| `apps/local-api/scripts/proof-callers.mjs` | Abschnitte 7 und 8: die Aufruferseite des Add-ins (O-M) |
| `apps/local-api/scripts/proof-access.mjs` | Abschnitt 0g: der echte Sidecar bricht ab und nennt den Grund, pfadfrei |
| `apps/local-api/scripts/proof-export.mjs` | Umbenannte Portmethode |
| `docs/architektur.md` | 5.6 (Startabbruch), 5.0a (zweiter Aufrufer), 5 (zweiter Ort) |
| `docs/datenmodell.md` | 8.2a — die neun Gründe, die drei Riegel |

## Zusammenfassung

Der Fehlschlag des Migrationsläufers ist jetzt ein **Wert** mit benannten Feldern und keine
Meldung mehr: neun unterscheidbare Gründe, jeder mit genau dem, was ihn vom Nachbarn trennt —
Fassungsnummern, Richtung, Fehlerschlüssel der Laufzeit, Ergebniskennzeichen von SQLite. `main.ts`
übersetzt ihn in zwei Auskünfte: einen deutschen Satz für den Benutzer und einen technischen
Schlüssel für die Protokollzeile. Dabei sind zwei weitere Stellen im Startpfad mitbehandelt, an
denen ein Grund verschwand — `compose()` stand in **gar keiner** Klammer, und der Aufgabenbereich
meldete „geht nicht", ohne zwischen fehlendem Zertifikat, fehlendem Recht und belegtem Port zu
unterscheiden. O-C zieht den Datenbankpfad in `GET /settings` auf dieselbe Form wie den
Exportordner (Merkmale des Ortes, Zahl der zu weit liegenden Dateien); O-M führt die Aufruferseite
des Add-ins durch **denselben** Leser wie die der Oberfläche, statt sie einem zweiten zu
überlassen. Die Ursachensuche hat den Zweig vom 2026-09-04 nicht getroffen, aber sieben
Hypothesen an Messungen ausgeschlossen und eine Leithypothese mit ihrer Signatur belegt.

## 1. Der Startabbruch

### 1.1 Der Grund wird unterschieden und protokolliert, pfadfrei

Der Kommentar, der den Wurf begründete („Er kann einen Dateipfad enthalten, B-2.4"), war die halbe
Wahrheit: **B-2.4 verbietet den Pfad, nicht den Grund.** Ein Grund lässt sich so bauen, dass er
gar keinen Pfad tragen kann. Neun Zweige, `packages/storage/src/migration.ts`:

| Grund | Trägt | Protokollzeile (Beispiel) |
|---|---|---|
| `checksum_mismatch` | Fassung | `checksum_mismatch version=12` |
| `database_too_new` | Bestand, höchste bekannte | `database_too_new database=13 known=12` |
| `database_busy` | Ergebniskennzeichen | `database_busy sqlite=5` |
| `state_unreadable` | Schlüssel, Kennzeichen | `state_unreadable code=err_sqlite_error sqlite=11` |
| `backup_failed` | Ausgangsfassung, Schlüssel | `backup_failed from=12 code=enospc` |
| `migration_failed` | Fassung, Richtung, Schlüssel | `migration_failed version=13 direction=up code=err_sqlite_error sqlite=19` |
| `no_way_back` | Fassung | `no_way_back version=13` |
| `embedded_drift` | — | `embedded_drift` |
| `unknown` | Schlüssel, Kennzeichen | `unknown code=enoent` |

`backup_failed` steht bewusst neben `migration_failed`: Im einen Fall ist der Bestand unversehrt
und **ungeändert**, im anderen steht eine zurückgenommene Transaktion dahinter. Das sind
verschiedene Handgriffe.

**Drei Riegel halten den Pfad draußen, und keiner ist Sorgfalt:**

1. Der Grund ist ein Wert. Seine Felder sind Zahlen und ein Fehlerschlüssel, den `errorCodeOf`
   auf `/^[A-Z][A-Z0-9_]{0,31}$/` begrenzt — was nicht so aussieht, wird `null`.
2. Die Sätze für den Benutzer sind **Konstanten**. In keinen wird etwas eingesetzt.
3. `logger.lifecycle` lässt für `reason` nur
   `/^[a-z][a-z0-9_]{0,47}(?: [a-z][a-z0-9_]{0,31}=[a-z0-9_]{1,32}){0,8}$/` durch. Kein
   Schrägstrich, kein Rückstrich, kein Punkt, kein Großbuchstabe, nichts außerhalb von ASCII —
   ein Pfad kann dort nicht durchkommen, auch nicht aus einer künftigen Aufrufstelle. Was nicht
   passt, wird `unclassified`.

Die **Meldung** des zugrunde liegenden Wurfs bleibt im Wurf (`cause` gesetzt, Text unverändert).
Deshalb messen die bestehenden Prüffälle auf `RAISE(ABORT, 'rollback_0006_…')` unverändert weiter,
und nach außen geht davon nichts.

### 1.2 Weitere Stellen im Startpfad, an denen ein Grund verschwand

* **`compose()` stand in gar keiner Klammer.** Ein Wurf beim Öffnen des Bestands lief an `main.ts`
  vorbei und endete im Auffangnetz des gebündelten Sidecars
  (`apps/desktop/sidecar/entry.ts`), das `error.message` nach `stderr` schreibt. Ausgerechnet
  **dort** kann ein Pfad stehen (`ENOENT: … open '/home/…'`); aus dem Quelltext gestartet kam der
  ganze Aufrufstapel dazu. Der Fall, gegen den B-2.4 geschrieben ist, war der ungefangene. Jetzt
  eingeordnet über `describeStoreOpenFailure` (`database_busy`, `embedded_drift`,
  `store_unopenable code=…`), Beendigungscode 78 wie die übrigen Konfigurationsfälle.
* **`startTaskpaneServer`** — sowohl der Wurf in `main.ts` als auch das `error`-Ereignis in
  `taskpane/server.ts` sagten nur „geht nicht". Jetzt `taskpane_failed code=…` beziehungsweise
  `taskpane_listen_failed port=17844 code=eaddrinuse`. Das ist genau die Auskunft, die O-O fehlt.
* **Der `server.on('error')` des Hauptports** außerhalb von `EADDRINUSE`: `listen_failed code=…`.
* Handschlag, Anwendungsdatenverzeichnis, Loopback-Prüfung, Dateirechte und unlesbare Tokendatei
  haben zusätzlich einen Schlüssel bekommen. Ihre Sätze unterschieden schon vorher; jetzt ist die
  Zeile auch maschinell auswertbar.
* `safeHomedir()` behält sein `catch {}`. Dort verschwindet kein Grund: Der Ausgang ist
  `home_missing`, und das ist bereits die Auskunft.

### 1.3 Prüffälle

**Einheitentests (angelegt, Übergabe an unit-tester):** 27 Fälle, alle grün.

* `packages/storage/test/migration-failure-reason.test.ts` (9) misst am **echten** Läufer gegen
  echtes SQLite: `checksum_mismatch`, `database_too_new`, Abbruch **mitten** in einer Migration
  (vorwärts und rückwärts, mit Gegenprobe, dass die halbe Migration zurückgenommen ist),
  `no_way_back`, `backup_failed`, `database_busy` (Ergebniskennzeichen 5), `state_unreadable`,
  und dass kein Feld eines Grundes einen Pfad trägt.
* `apps/local-api/test/startup.test.ts` (18) misst die Übersetzung in die Protokollzeile: jeder
  geforderte Fall einzeln, ein Wurf ohne bekannte Form, ein Wurf, der gar kein Objekt ist, die
  Pfadfreiheit über den **vollständigen** Vorrat (die Zweigliste ist per `satisfies` vom
  Übersetzer abgesichert, ein neuer Zweig ohne Eintrag wird rot), und der Riegel im
  Protokollierer gegen fünf bösartige Gründe.

**Wo der Beweis der Pfadfreiheit hingehört — und warum nicht in `sidecar:verify`.**
`apps/desktop/scripts/verify-sidecar.mjs` liegt in der Hoheit von frontend-dev, der in dieser
Welle parallel in `apps/desktop/**` arbeitet. Ich habe die Datei nicht angefasst. Der Beweis liegt
deshalb an **zwei** Stellen, und das ist kein Ersatz, sondern die richtige Teilung:

* Die **Vollständigkeit** in den Einheitentests. Nur dort lässt sich der ganze Vorrat der Gründe
  aufzählen, einschließlich derer, die sich nicht herstellen lassen (`no_way_back`,
  `backup_failed` mit vollem Datenträger).
* Die **Kette** in `proof:access` Abschnitt 0g (meine Datei, +8 Prüfungen): Der echte Sidecar
  läuft gegen einen präparierten Bestand in einem Wegwerfordner, dessen Name dem Lauf bekannt ist.
  Gemessen wird Beendigungscode 78, die Protokollzeile mit `"reason":"database_too_new
  database=4711 known=12"` beziehungsweise `"reason":"checksum_mismatch version=1"`, und dass die
  gesamte Ausgabe weder Ordner noch Dateinamen noch eine SQLite-Meldung noch einen Aufrufstapel
  trägt. Die Zahl der bekannten Migrationen wird gezählt und nicht abgeschrieben (T-128).

Das ist der Nachweis am ausgelieferten Weg — genau der, der am 2026-09-04 gerissen ist.

### 1.4 Ursachensuche

Der Zweig ist mit den vorliegenden Mitteln nicht getroffen worden. Was **ausgeschlossen** ist,
und woran es gemessen wurde:

| Hypothese | Messung | Ergebnis |
|---|---|---|
| Sperre / zweiter Zugriff auf den Bestand | Kopie des echten Bestands, zweite Verbindung mit `BEGIN EXCLUSIVE`, dann `PRAGMA journal_mode=WAL`, `CREATE TABLE IF NOT EXISTS`, `SELECT` | **alle drei ok.** Im WAL-Betrieb sperrt ein Schreiber die Leser nicht aus. Der Bestand *ist* WAL (Kopfbyte 18 = 2) — die Sperre kann diesen Zweig nicht erreichen |
| dieselbe Sperre ohne WAL | Bestand im `delete`-Modus, sonst gleich | wirft, aber **schon in `openConnection`** — andere Meldung, andere Stelle. Deckt sich mit der Messung des Orchestrators und schließt sie als Erklärung aus |
| liegengebliebene `-wal` aus einem Absturz | Kopie, Schreibvorgang ohne `close()`, zweite Verbindung | ok. Die Wiederherstellung läuft ohne Wurf |
| zerstörte `-shm` | `-shm` mit `0x41` überschrieben, dann öffnen und lesen | ok. SQLite baut sie neu |
| „`-wal` bleibt nach sauberem Ende liegen" | nachgesehen | nein — und es liegt heute keine im Anwendungsdatenverzeichnis |
| beschädigte Datenbankdatei | Kopfbytes zerstört | wirft mit Ergebniskennzeichen 26, **in `openConnection`** — wieder die andere Stelle |
| eine Migration ist wirklich gelaufen und gescheitert | `schema_migration.applied_at` aus einer Kopie: Fassung 11 und 12 stammen von `2026-09-03T23:47:02Z` (Ortszeit 2026-09-04 01:47). Die jüngste Sicherungskopie ist `takt-vor-migration-10-20260903-234702.db` von 01:47 | Um 18:57 war der Bestand auf 12, `migrateToLatest` war ein **Kein-Op** ohne Schreibvorgang und ohne Sicherungskopie. Es gibt keine Kopie von 18:57 — also wurde der Zweig **vor** jedem Schreibvorgang verlassen |
| `checksum_mismatch` aus dem eingecheckten Baum | `git log` über `packages/storage/migrations` und `migrations.embedded.ts`: letzte Änderung `afb3578`, 2026-09-03 22:22. Der Bestand hat Fassung 12 **danach** angewandt (01:47), und die Prüfsummen stimmen zeichengleich | ausgeschlossen, solange kein Agent die Dateien unversioniert geändert und vor dem Sammelstand um 20:53 zurückgenommen hat |

**Übrig bleibt eine Leithypothese, und sie ist nicht bewiesen.** Um 18:57 stand HEAD auf
`status-als-regelterm`, mitten in einer Welle mit unversioniertem Arbeitsstand. `pnpm desktop`
baut den Sidecar **vor** jedem Start neu (`app:dev`), also aus genau diesem Arbeitsstand. War
`packages/storage/migrations/` oder `migrations.embedded.ts` in diesem Augenblick unvollständig —
etwa während eines `git`-Vorgangs —, kannte der frisch gebaute Sidecar weniger Migrationen als der
Bestand. Dass dieser Zustand in diesem Baum vorkommt, ist belegt: Um 20:53 wechselte HEAD von
`status-als-regelterm` auf `main` (Stand `d9555d0`, das 0011 und 0012 nicht enthält) und wurde
erst um 20:59:58 durch `pull` wieder vollständig — sechs Minuten lang hatte der Baum genau zehn
Migrationen. Ein `pnpm desktop` in diesem Fenster wäre mit demselben Satz abgebrochen.

Gemessen: derselbe Bestand (Kopie), Migrationsverzeichnis auf 0001–0010 gekürzt. Ergebnis:

```
{"level":"error","message":"Der Datenbestand stammt aus einer neueren Fassung von Takt. …",
 "reason":"database_too_new database=12 known=10"}
```

Das ist die Signatur, die am 2026-09-04 gefehlt hat. Ob sie es war, kann ich **nicht** sagen —
und ich rate nicht. Käme der Abbruch wieder, steht der Grund binnen einer Zeile fest.

Am echten Bestand wurde nichts geändert: Zeitstempel unverändert `2026-09-04 20:12:55`, alle
Messungen liefen gegen Kopien in Wegwerfordnern.

## 2. O-C — `GET /settings` belegt Merkmale zum Datenbankpfad

Für den Exportordner liefert die Antwort seit T-039 `exportDirectoryState` (Existenz, Ordner,
Schreibbarkeit, Erreichbarkeit) und `exportDirectoryTraits` (`unc`, `network`, `sync_folder`,
`system_dir`). Für den Bestand gab es **nur den Pfad** — der Benutzer musste ihn ansehen und
raten. Das ist die falsche Seite herum: Im Exportordner liegt, was exportiert wurde; im Bestand
liegt alles, einschließlich der internen Vermerke (A-7.2).

Neu in `SettingsView` und in der Beschreibung:

* **`databaseTraits`** — derselbe Vorrat, dieselbe Regel („leer ist keine Entwarnung").
  Die Portmethode heißt jetzt `describeLocation` statt `describeExportDirectory`; ein Name, der
  weiterhin „Exportordner" sagt und den Bestand meint, wäre der stille Bedeutungswechsel, den
  E-033 verbietet. Der Vorrat selbst heißt in der Domäne `LocationTrait`; `ExportDirectoryTrait`
  bleibt als Deckname stehen, damit `apps/web` und die Beschreibung unberührt bleiben.
* **`databaseFilesTooPermissive`** — wie viele der drei Dateien weiter liegen als `0600`.

**Deckung.** Es gibt keine Anforderungs-ID zum Ablageort des Bestands; die Spezifikation spricht
darüber nicht. Die Deckung ist deshalb ausdrücklich eine **Entscheidung plus Bedrohungsmodell**:
E-018 (Ablage unter `%LOCALAPPDATA%`, damit die Kundendatenbank den Rechner nicht verlässt), R-13,
B-5.3 (Synchronisierungsordner) und B-7.2 (Dateirechte), sichtbar auf S-09. Der Bestandspfad
selbst steht seit T-041/T-042 mit derselben Begründung in dieser Antwort. Wenn der Orchestrator
eine Anforderungs-ID dafür will, gehört sie in Abschnitt 11 zu S-09 — ich habe keine erfunden.

**Was von diesen Merkmalen nach draußen darf, und was nicht (B-2.4).**

* `databaseTraits` sind **vier geschlossene Wortmarken**. Sie tragen keinen Inhalt des Pfades.
* `databaseFilesTooPermissive` ist eine **Zahl**, keine Pfadliste. „Zwei Dateien liegen offen",
  nicht welche. `null` heißt „nicht messbar" (Windows, Bestand im Arbeitsspeicher) und
  ausdrücklich nicht `0`.
* Beide gehen über dieselbe Tür wie `databasePath` und `settings.exportDirectory`, also **nur mit
  dem Sitzungsgeheimnis**. `access/route-policy.ts` lässt das Add-in-Token an `/settings` nicht
  heran; `proof:route-policy` misst das (30 Prüfungen, grün). Der Aufgabenbereich des Add-ins
  bekommt von diesen Feldern nichts zu sehen — das war die Frage, die an derselben API hängt.
* In eine **Fehlermeldung** geht davon nichts. Der Unterschied ist der aus B-2.4: eine
  ausdrücklich erfragte Auskunft hinter dem Sitzungsgeheimnis gegen eine Meldung, die auch dort
  ankommt, wo sie nicht hingehört.

## 3. O-M — die Aufruferseite des Add-ins ist erfasst

`proof:callers` las bis jetzt **eine** Datei: `apps/web/src/api/endpoints.ts`. Im Kopf stand
dazu: „Das Add-in ruft dieselben Routen unter `/addin/*` an und hat seinen eigenen Nachweis
(`proof:addin-wiring`)." Der Satz ist richtig und die Schlussfolgerung war falsch —
`proof:addin-wiring` fährt den **Dienst** und prüft, dass die Kette hält; er sieht sich nicht an,
welche Schlüssel der Aufgabenbereich in seine Rümpfe schreibt. Das ist die Frage aus T-050, und
sie war für die zweite Tür offen.

Beide Aufrufer laufen jetzt durch **denselben** Leser mit demselben Urteil. Ein zweiter Leser wäre
die falsche Antwort gewesen: Zwei Leser sind zwei Auffassungen davon, was ein Aufruf ist, und eine
läuft der anderen davon — dasselbe Muster, das T-114 an zwei Eingabeschemata gefunden hat.
`caller-scan.mjs` bekommt dafür einen Formparameter (`CALL_SHAPES`): `request(pfad, optionen)`
gegen `call(methode, pfad, abfrage, rumpf)`, dazu die Pfadvorsilbe `/api/v1` und Methoden eines
Objektliterals als umschließende Funktion.

`proof:callers` misst damit 32 statt 18 Dinge, Abschnitte 7 und 8:

* 5 Aufrufe gelesen, so viele wie im Rohtext stehen; kein unauflösbarer.
* `fetch` steht im ganzen Add-in nur in `api/client.ts` (28 Dateien durchgesehen) — ohne diese
  Zusicherung wäre das Lesen einer Datei nichts wert.
* Jeder Aufruf trifft eine Operation; **jede** der vier `/addin`-Operationen hat einen Aufrufer.
* Kein Rumpfschlüssel, den die Add-in-Tür nicht liest; kein Feld, das sie liest und der
  Aufgabenbereich nie sendet (die Ausnahmeliste ist **leer**); kein unbekannter Abfrageschlüssel.
* Selbstprobe mit drei erfundenen Fehlern im echten Text (im Arbeitsspeicher): `tagNamen` statt
  `tagNames`, `callNummer` statt `callNumber`, ein Weg, den es nicht gibt. Jeder muss **genau
  eine** Beanstandung auslösen; der Wortlaut steht in der Ausgabe.

**Nichts unter `apps/local-api/src/routes/addin/**` wurde geändert.** Der Lauf importiert
`createTodoSchema` und `bookSchema` von dort und liest sie; die Zuordnung auf die
Operationskennungen steht in `proof-callers.mjs`. Eine Änderung dort ist nicht nötig — siehe aber
„Offene Fragen" Punkt 3.

## Läufe

| Befehl | Ergebnis |
|---|---|
| `pnpm typecheck` | fehlerfrei (alle Pakete, alle Testprojekte, E2E) |
| `pnpm test` | 60 Dateien, 1028 Fälle grün (vorher 1001; +27 aus dieser Aufgabe) |
| `pnpm run proof:all` | 16 Läufe, 0 rot. `proof:callers` 18 → **32**, `proof:access` 97 → **105** |
| `pnpm run verify:bundle` | Sidecar neu gebaut und geprüft: **20 von 20**, gegen die Binärdatei mit diesen Änderungen |

`pnpm desktop` und `pnpm test:e2e` habe ich nicht gestartet.

## Annahmen

1. **Der Fehlschlag bleibt ein Wurf und wird kein `Result`.** Die Hausregel „fachliche
   Fehlschläge sind Werte" gilt für Fälle, die ein Aufrufer behandeln kann. Eine gescheiterte
   Migration ist keiner davon: Es gibt genau eine Antwort, und die heißt „nicht starten". Ein
   Umbau des Ports auf `Result` hätte außerdem sechs Nachweispfade und vier Testdateien berührt,
   ohne etwas zu gewinnen. Der Grund hängt deshalb **am** Wurf, über ein `Symbol.for`.
2. **Die Meldung des Wurfs bleibt unverändert.** Sonst hätten die Prüffälle, die auf
   `RAISE(ABORT, 'rollback_0006_only_without_not_billed')` messen, brechen müssen — und der
   Wortlaut ist genau die Auskunft, die man im Debugger sehen will. Nach außen geht sie nirgends.
3. **Ein Fehlschlag beim Öffnen des Bestands endet mit Code 78 statt mit 70.** Bisher lief er
   ungefangen bis in `entry.ts` (70) oder, aus dem Quelltext, in eine unbehandelte Ablehnung (1).
   78 ist der Code für „beim Start fehlte etwas, das er zum Speichern braucht", und das trifft es.
   Siehe aber „Offene Fragen" Punkt 1.
4. **`ExportDirectoryTrait` wird nicht umbenannt, sondern bekommt mit `LocationTrait` einen
   zweiten, richtigen Namen.** Eine Umbenennung hätte `apps/web` und die Beschreibung berührt,
   während frontend-dev dort arbeitet. Die **Portmethode** habe ich dagegen umbenannt
   (`describeLocation`) — sie wird nur von meinen Dateien benutzt, und ein Name, der „Exportordner"
   sagt und den Bestand meint, wäre genau der Bedeutungswechsel aus E-033.
5. **`databaseFilesTooPermissive` wird bei jeder Abfrage neu gemessen**, nicht beim Start gemerkt:
   SQLite legt `-wal` und `-shm` im Betrieb wiederholt neu an. Drei `stat`-Aufrufe auf eine lokale
   Datei.
6. **`unclassified` statt Weglassen**, wenn ein Grund den Zeichenvorrat verlässt. Eine Zeile, die
   sagt „hier war ein Grund, und er hatte die falsche Gestalt", ist besser als eine, die ihn
   ausschreibt — und besser als gar keine.

## Risiken

1. **Sicherheit — der Riegel im Protokollierer ist eine Gestaltprüfung, keine Inhaltsprüfung.**
   Ein Wert, der zufällig wie `[a-z0-9_]{1,32}` aussieht, käme durch. Heute setzt keine
   Aufrufstelle einen solchen Wert ein — alle Werte sind Zahlen oder Wortmarken —, und die
   Einheitentests messen das über den vollständigen Vorrat. Wer künftig etwas anderes einsetzt,
   umgeht den Riegel, wenn er es kleinschreibt. Der eigentliche Schutz bleibt Riegel 1: Der Grund
   ist ein Wert mit Zahlen, kein Text.
2. **Sicherheit — `sqlite` und `code` sind neue Angaben in der Ausgabe.** Beide sind Kennzeichen
   der Laufzeit und tragen keinen Inhalt; sie sagen einem Leser der Protokolldatei aber mehr über
   den Zustand des Rechners als vorher. Die Ausgabe geht nach `stderr` und damit an die Hülle,
   nicht an einen HTTP-Aufrufer. Ich halte das für den richtigen Tausch — die Alternative war
   genau die Blindheit vom 2026-09-04 — und melde es dem security-checker zur Bewertung.
3. **Sicherheit — `databaseTraits` und `databaseFilesTooPermissive` sind zwei neue Angaben über
   den Rechner in einer API-Antwort.** Beide hinter dem Sitzungsgeheimnis, für das Add-in-Token
   nicht erreichbar (`proof:route-policy`). Sie sind schwächer als der Pfad, der dort schon steht.
4. **Der Beendigungscode 78 unterscheidet weiterhin vier Ursachen nicht** (Startgeheimnis,
   Benutzername, Anwendungsdatenverzeichnis, Datenbestand). Die Hülle erklärt ihn mit den ersten
   dreien und liegt im vierten Fall daneben. Ich habe das **nicht** angefasst: Exitcodes sind die
   Naht zu `apps/desktop`, und das Board hat O-AJ ausdrücklich aus dieser Welle herausgehalten,
   um nicht zwei Agenten an eine Naht zu setzen.
5. **`apps/web` liest die zwei neuen Felder noch nicht.** `GET /settings` liefert sie, die
   Oberfläche zeigt sie nicht. Kein Bruch (zusätzliche Felder), aber eine benannte Lücke.
6. **Die Ursache des Abbruchs vom 2026-09-04 ist weiterhin unbekannt.** Sieben Hypothesen sind
   gemessen ausgeschlossen, die achte ist plausibel und unbewiesen. Tritt der Fall wieder auf,
   steht der Grund in einer Zeile — das war der Auftrag; die Ursache war es ausdrücklich nur,
   „soweit sie trägt".

## Offene Fragen

1. **Braucht der Datenbestand einen eigenen Beendigungscode?** Heute teilt er sich 78 mit drei
   anderen Ursachen, und der Satz, den die Hülle daraus baut, nennt sie einzeln auf — den vierten
   nicht. Zwei Wege: ein neuer Code (etwa 65, `EX_DATAERR`) mit einem vierten Satz in
   `explain_exit`, oder ein vierter Halbsatz im bestehenden. Beides berührt `apps/desktop` und
   gehört zu O-AJ. **Entscheidung des Orchestrators, Welle P.**
2. **Soll die Oberfläche die zwei neuen Felder anzeigen?** `databaseTraits` und
   `databaseFilesTooPermissive` gehören auf S-09 neben den Bestandspfad, in derselben Form wie die
   Merkmale des Exportordners. `apps/web/src/api/types.ts` und der Einstellungsbildschirm gehören
   frontend-dev. Vorschlag: eigene Aufgabe in Welle P.
3. **Ein Vorschlag an integration-dev, den ich nicht selbst umgesetzt habe.** Die vier
   Routendateien der Hauptfläche führen je eine Aufstellung `REQUEST_SCHEMAS`, die Operationskennung
   auf zod-Schema abbildet; `routes/addin/schema.ts` führt keine. Die Zuordnung steht deshalb in
   `proof-callers.mjs` — also **neben** der Tür statt an ihr. Kommt eine fünfte Add-in-Route dazu,
   fällt das nicht auf: Der Lauf prüft „jede `/addin`-Operation hat einen Aufrufer", aber nicht
   „jede hat ein Schema in der Aufstellung". Sauberer wäre ein
   `export const REQUEST_SCHEMAS = { createAddinTodo: createTodoSchema, createAddinTimeEntry:
   bookSchema }` in `routes/addin/schema.ts`, das ich importiere. Die Datei gehört integration-dev
   und wurde in dieser Welle parallel geändert — deshalb gemeldet statt angefasst.
4. **Registrierung neuer Prüfdateien.** `packages/storage/test/migration-failure-reason.test.ts`
   und `apps/local-api/test/startup.test.ts` habe ich angelegt, weil die Aufgabe die Prüffälle
   verlangt. Sie liegen in der Hoheit von unit-tester: **Übernahme, nicht Doppelung.** Beide sind
   grün und laufen bereits in `pnpm test` mit.
5. **`docs/bedrohungsmodell.md`** gehört security-checker. Wenn er es für richtig hält, gehören
   dort zwei Zeilen hin: dass B-2.4 den Pfad und nicht den Grund verbietet, und dass die
   Protokollzeilen des Startpfads seit T-132 einen technischen Grund mit engem Zeichenvorrat
   tragen. Ich habe die Datei nicht angefasst.

## Nächster Schritt

Das Qualitätstor über T-132 laufen lassen — Code-Review auf den Schnitt zwischen
`packages/storage` (Grund als Wert) und `apps/local-api` (Grund als Satz), security-checker auf
Risiken 1 bis 3 und auf die zwei neuen Felder in `GET /settings`. Danach in Welle P zwei kleine
Folgeaufgaben: der Beendigungscode für den Datenbestand zusammen mit O-AJ (frontend-dev), und die
Anzeige von `databaseTraits`/`databaseFilesTooPermissive` auf S-09 (frontend-dev). Der Vorschlag
aus „Offene Fragen" 3 kann integration-dev in derselben Welle mitnehmen.
