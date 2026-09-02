Aufgabe: T-032 — Zwei Reste aus T-029: Tests für `markNotBilled`, geteilter Port 17843

Status: fertig

---

## Artefakte

Neu unter `packages/storage/test/`:

```
not-billed-audit.test.ts   7 Fälle   Trigger trg_time_entry_exported_needs_provenance direkt am
                                     Schema (Mutation nachgewiesen), migrateDownTo mit/ohne
                                     not_billed-Zeile
```

Geändert unter `packages/storage/test/`:

```
repo-export.test.ts   +9 Fälle in einem neuen describe-Block für
                       createExportPort.markNotBilled — export_count bleibt 0, genau eine
                       Protokollzeile, zweites Ausbuchen/bereits exportiert/laufend/unbekannt,
                       Reset und der Weg zurück, A-8.8-Abbruch
```

Geändert unter `apps/local-api/scripts/` (Ausnahme laut Auftrag, nur Portfreigabe, keine
inhaltliche Änderung an den Prüfungen selbst):

```
proof-access.mjs         waitForPortFree() vor dem eigenen Start; früher Ausstieg wirft jetzt
                          statt process.exit() (sonst übersprang das den finally-Block);
                          finally wartet den Kindprozess ab statt ihn nur anzustoßen
proof-addin-wiring.mjs    dieselben drei Änderungen, an den Kindprozess dieser Datei angepasst
```

Nicht angefasst: `packages/*/src/**`, `apps/*/src/**`, `docs/**`, `apps/web/**`,
`apps/outlook-addin/scripts/**` (der fünfte Prüfpfad, `proof:addin`, hält keinen Port und war
nicht betroffen — siehe unten). Kein `git commit`.

Migrationsdateien `packages/storage/migrations/0006_not_billed_audit_event.{up,down}.sql`: für die
Rot-zuerst-Nachweise dreimal versuchsweise mutiert, danach jedes Mal byteweise auf den
Ursprungszustand zurückgesetzt (`diff` bestätigt Identität, siehe unten). Am Ende der Aufgabe
unverändert.

---

## 1. Tests für `markNotBilled` (E-047, E-032, R-10)

**Vorher/Nachher, `packages/storage/src`:**

| | Statements | Branches | Funktionen | Zeilen |
|---|---|---|---|---|
| **vorher** (`storage/src/sqlite`, aus T-029-Bericht, bestätigt neu gemessen) | 90.38 | **80.82** | 95.18 | 94.05 |
| **nachher** (`storage/src/sqlite`) | 91.70 | **82.05** | 95.92 | 95.56 |
| `repo-export.ts` vorher | 82.05 | 62.50 | 87.50 | 84.90 |
| `repo-export.ts` nachher | 92.30 | 70.83 | 95.83 | 96.22 |

Der Puffer über der 80-Prozent-Schwelle wächst von 0,82 auf 2,05 Punkte. Nebenbefund, ohne eigenes
Zutun: `mappers.ts` und `unit-of-work.ts` stehen jetzt bei 100/100 auf Zweigen — meine neue Datei
`not-billed-audit.test.ts` ruft `createUnitOfWork(conn)` erstmals **ohne** explizite `ids`-Option
auf (jede andere Testdatei übergibt sie), und trifft damit den bislang ungeprüften
Rückfallzweig `options.ids ?? createIdSource()`.

**Was geprüft ist (`repo-export.test.ts`, neuer Block `createExportPort.markNotBilled`):**

- Ausbuchen setzt `exportStatus` auf `exported`, **`export_count` bleibt bei 0** — der zentrale
  Punkt aus dem Auftrag: Ein Exportlauf würde ihn auf 1 setzen (Gegenprobe im selben Test), eine
  Ausbuchung nie. Genau eine Protokollzeile, `event: 'not_billed'`, `exportRunId`/
  `exportRunGroupId` beide `null`.
- `reason` darf leer bleiben (E-037 fortgeführt in E-047).
- Zweites Ausbuchen derselben Buchung: `export_status_unchanged`, keine zweite Protokollzeile.
- Eine per echtem Exportlauf bereits exportierte Buchung lässt sich nicht zusätzlich ausbuchen:
  `export_status_unchanged`, `export_count` bleibt bei 1, kein zweiter Protokolleintrag.
- Eine laufende Buchung (kein `ended_at`) ergibt `not_found` — dasselbe wie bei `resetStatus`.
- Eine unbekannte Buchung ergibt `not_found`.
- **Zurücksetzen und der Weg zurück:** Eine ausgebuchte Buchung lässt sich zurücksetzen
  (`exportStatus` → `open`, `export_count` bleibt bei 0 — anders als nach dem Reset eines echten
  Exportlaufs, wo er bei 1 bliebe), erscheint danach wieder als Kandidat mit
  `previouslyExported: false` (sie war nie wirklich exportiert), und lässt sich erneut ausbuchen.
  Die Protokollkette nach drei Vorgängen: `['not_billed', 'reset', 'not_billed']`.
- **Kein Zustand außer den zweien ist über eine Exportauswahl erreichbar:** Nach dem Ausbuchen
  liefern `openCandidates()` und `openCount()` beide leer/0.
- **A-8.8, angewandt auf den neuen Pfad:** Ein Abbruch der umgebenden Transaktion nach einem
  erfolgreichen `markNotBilled`, aber vor dem Festschreiben, hinterlässt die Buchung unverändert
  offen, ohne Protokollzeile, wieder als Kandidat.

**Der Trigger `trg_time_entry_exported_needs_provenance` (`not-billed-audit.test.ts`), direkt am
Schema, mit derselben Methode wie `export-candidate-view.test.ts`:**

- Eine offene Buchung ohne jede Protokollzeile lässt sich **nicht** per rohem `UPDATE ... SET
  export_status = 'exported'` umsetzen — `export_status_not_settable`.
- Auch dann nicht, wenn die jüngste Protokollzeile `reset` ist (eine alte Ausbuchung rechtfertigt
  keine neue) — aufgebaut über einen echten Exportlauf plus `resetStatus`, nicht durch von Hand
  eingesetzte Zeilen.
- Erlaubt, wenn die jüngste Protokollzeile `not_billed` ist — genau der Weg, den `markNotBilled`
  selbst geht.
- Erlaubt, wenn `export_count` in derselben Anweisung mitzählt — der Weg des Exportlaufs.

**`migrateDownTo` und die `not_billed`-Zeile**, über den echten `MigrationRunnerPort`
(`createMigrationRunner` + `loadMigrations`, nicht über direktes `exec()`):

- Eine Buchung, über den echten `markNotBilled`-Adapter ausgebucht, lässt `migrateDownTo(5)` mit
  `rollback_0006_only_without_not_billed` abbrechen. Der Bestand bleibt danach unverändert auf
  Fassung 6 (`runner.state()` bestätigt) — kein Zwischenzustand.
- Eine per echtem Exportlauf exportierte Buchung (`export_count >= 1`) hält die Rücknahme **nicht**
  auf — nur die belegfreie Ausbuchung tut das.
- Ohne jede `not_billed`-Zeile läuft die Rücknahme bis Fassung 5 und wieder vorwärts bis 6
  ungehindert durch (Gegenprobe).

### Rot zuerst

Vor Abschluss der Datei `not-billed-audit.test.ts` drei Mutationen an den (unveränderten
mitgelieferten) Migrationsdateien vorgenommen, jeweils die Tests gefahren, danach die Dateien
byteweise zurückgesetzt (`diff` bestätigt Identität nach jedem Schritt):

1. `WHEN`-Prädikat des Triggers in `0006_not_billed_audit_event.up.sql` auf `WHEN 0` verkürzt (der
   Trigger feuert nie mehr) → genau die beiden „kein Exportstatus ohne Herkunft"-Tests werden rot
   (die verbotene `UPDATE`-Anweisung läuft klaglos durch); die beiden „erlaubt, wenn …"-Tests
   bleiben grün, wie es sein muss.
2. Wächter `_rollback_0006_guard` in der Rückwärtsdatei durch `INSERT ... VALUES (1);` ersetzt
   (Zählung entfällt vollständig) → `migrateDownTo` bricht **trotzdem** ab, aber mit
   `CHECK constraint failed: event IN ('exported', 'reset')` statt mit
   `rollback_0006_only_without_not_billed` — die kopierte `not_billed`-Zeile verletzt den
   wiederhergestellten alten CHECK aus 0001. Mein Test prüft ausdrücklich auf die **sprechende**
   Meldung des Wächters (der Grund, den der Kopfkommentar der Rückwärtsdatei für ihn nennt: „ein
   sprechender Abbruch statt eines rohen CHECK-Fehlers mitten im Kopieren") und wird deshalb rot.
3. Denselben Wächter durch ein stilles `DELETE FROM export_audit WHERE event = 'not_billed';`
   ersetzt, um zu prüfen, ob sich die Zeile so unbemerkt beseitigen ließe → `export_audit` ist
   selbst gegen `DELETE` gesperrt (`trg_export_audit_no_delete`), der Versuch scheitert mit
   `append_only`, ebenfalls nicht mit der erwarteten Meldung — wieder rot.

Nach jeder Mutation beide Migrationsdateien wortgleich wiederhergestellt und alle sieben Tests
erneut grün gefahren (Log dieser Sitzung, `npx vitest run packages/storage/test/not-billed-audit.test.ts`,
7/7 bestanden vorher und nachher). Das ist ein stärkerer Nachweis als ursprünglich geplant: Selbst
zwei verschiedene Wege, den Wächter zu umgehen, führen zu einem Fehlschlag — nur nicht zu dem
sprechenden, den er eigentlich liefern soll, und genau diesen Unterschied hält der Test fest.

### Nicht angefasst, zur Kenntnis: die offene Frage 2 aus dem T-029-Bericht

`mappers.test.ts` hält weiterhin fest, dass ein unbekannter Wert in `export_audit.event` zu
`'exported'` wird (domain-dev-Vorschlag: `'reset'` wäre die harmlosere Wahl). Das gehört nicht zu
den zwei in diesem Auftrag benannten Resten — ich habe den Test nicht angefasst und die Frage nicht
entschieden. Bleibt offen für den Orchestrator/domain-dev.

---

## 2. Die Prüfpfade teilen sich Port 17843

### Befund, reproduziert

`proof-access.mjs` und `proof-addin-wiring.mjs` binden beide echt an `127.0.0.1:17843`
(`proof-export.mjs` benutzt die Anwendungsfälle direkt ohne HTTP und ist nicht betroffen;
`proof-taskpane.mjs` hat mit 17944 bereits einen eigenen Port; `proof-addin.mjs` im
Outlook-Add-in mockt die Adresse nur und startet keinen echten Dienst). Zwei unabhängige Ursachen
im Zusammenspiel:

1. **`waitForService()` prüft nur, ob überhaupt etwas auf `/health` antwortet — nicht, ob es der
   eigene, gerade gestartete Dienst ist.** Antwortet noch ein Kindprozess eines vorigen Laufs, hält
   `waitForService()` das sofort für den eigenen Start und fährt mit dem **falschen**
   Sitzungsgeheimnis weiter — daher die „reihenweise Fehlschläge, die keine sind" aus dem
   T-029-Bericht.
2. **Beide Skripte konnten ihren eigenen Kindprozess verwaisen lassen:** `proof-access.mjs` verließ
   bei „Dienst nicht hochgekommen" den Lauf über `process.exit(1)` — das überspringt den
   `finally`-Block ersatzlos, der gerade gestartete Kindprozess blieb am Port hängen.
   `proof-addin-wiring.mjs` schickte `SIGTERM`, schlief pauschal 200 ms und `SIGKILL`te dann, ohne
   je das tatsächliche `exit`-Ereignis abzuwarten — auf einer langsamen Maschine reicht das nicht.

### Zuschnitt, nach dem Vorbild von `apps/desktop/scripts/verify-sidecar.mjs` (T-008b)

Dessen Muster ist zweiteilig, und ich habe beide Teile übernommen:

- **Vorher prüfen, mit Wartezeit statt sofortigem Aufgeben.** `verify-sidecar.mjs` prüft einmalig
  und gibt bei Belegung sofort eine sprechende Fehlermeldung aus. Für zwei Skripte, die
  routinemäßig unmittelbar nacheinander laufen, ist ein kurzes Warten die bessere Wahl (Auftrag:
  „entweder warten … oder ihn selbst freigeben") — `waitForPortFree(PORT, 5000)` pollt alle 150 ms,
  bevor überhaupt ein eigener Kindprozess entsteht. Erst wenn der Port nach 5 s immer noch belegt
  ist, kommt dieselbe sprechende Meldung wie bei `verify-sidecar.mjs` („Läuft Takt oder ein anderer
  Prüfpfad … noch?").
- **Selbst aufräumen, mit Abwarten statt Anstoßen.** `verify-sidecar.mjs` killt einen unerwartet
  noch laufenden Kindprozess und wartet explizit auf `waitForExit`, bevor die nächste Sektion
  beginnt, die denselben Port braucht. Beide Skripte bekommen dasselbe Verfahren im `finally`:
  `SIGTERM`, dann auf das echte `exit`-Ereignis warten (3 s), erst danach nötigenfalls `SIGKILL` mit
  weiterem Warten — nie ein reines "anstoßen und hoffen".
- `proof-access.mjs` zusätzlich: Der früher überspringende `process.exit(1)` bei „Dienst nicht
  hochgekommen" ist jetzt ein `throw`, das den `finally`-Block durchläuft; ein `catch` außen fängt
  ihn ab und meldet ihn danach unverändert über `console.error` + `process.exit(1)`.

### Nachweis

Alle fünf Prüfpfade **einzeln**, mit denselben Zahlen wie im T-029-Bericht:

```
proof:access 75, proof:export 66, proof:taskpane 25, proof:addin-wiring 30, proof:addin 73
— je 0 Fehlschläge
```

Und **hintereinander**, zweimal durchlaufen, genau die vorher problematische Abfolge
(`proof:access` → `proof:addin-wiring` → `proof:access`, unmittelbar nacheinander ohne Pause):

```
Durchlauf 1: 75 bestanden, 0 fehlgeschlagen. / 30 bestanden, 0 fehlgeschlagen. / 75 bestanden, 0 fehlgeschlagen.
Durchlauf 2: 75 bestanden, 0 fehlgeschlagen. / 30 bestanden, 0 fehlgeschlagen. / 75 bestanden, 0 fehlgeschlagen.
```

Keine der Zahlen hat sich gegenüber einem isolierten Lauf verändert — inhaltlich ist an den
Prüfungen selbst nichts anders, wie im Auftrag verlangt.

---

## Nachweise

```
pnpm check (typecheck, boundaries, contrast, test:coverage, build)   Exitcode 0
  545 Tests in 33 Dateien (vorher 529 in 32) — 16 neu (9 in repo-export.test.ts,
  7 in der neuen not-billed-audit.test.ts), alle grün, keiner geändert
  storage/src/sqlite   91.70 / 82.05 / 95.92 / 95.56   (vorher 90.38 / 80.82 / 95.18 / 94.05)
  domain/src           99.28 / 98.79 / 100 / 99.15     (unverändert, weiterhin über der Schwelle)
  export/src           98.72 / 93.20 / 100 / 98.63     (unverändert, weiterhin über der Schwelle)
proof:access 75, proof:export 66, proof:taskpane 25, proof:addin-wiring 30, proof:addin 73
  — je 0 Fehlschläge, einzeln UND zweimal hintereinander in der zuvor problematischen Reihenfolge
Migrationsdateien 0006 nach den drei Mutationsproben byteweise identisch zum Ausgangszustand (diff)
```

---

## Annahmen

1. **`proof:export` und `proof:taskpane` waren nicht Teil des Portproblems** und wurden nur zur
   Vollständigkeit des Fünferblocks unangetastet gegengeprüft. `proof:export` bindet keinen Port,
   `proof:taskpane` hat mit 17944 einen eigenen. Keine Änderung an beiden Dateien.
2. **`apps/outlook-addin/scripts/proof-addin.mjs` bleibt unangetastet.** Es mockt `127.0.0.1:17843`
   in Erwartungswerten, startet aber keinen echten Dienst und hält keinen Port — die formal
   erteilte Ausnahme galt der Portfreigabe, hier gab es nichts freizugeben.
3. **`waitForPortFree` prüft nur den TCP-Verbindungsaufbau, nicht den Dienst dahinter.** Genügt
   hier: Der einzige erwartbare Belegtfall auf 17843 in dieser Umgebung ist ein Takt-Sidecar oder
   ein anderer Prüfpfad, beide sind reine Node-Prozesse, die einen Verbindungsversuch sofort
   annehmen oder ablehnen.
4. **Die Rot-zuerst-Mutationen an Migration 0006 sind ausschließlich für diesen Bericht gefahren**
   und am Ende dreifach auf Bytegleichheit mit dem Ausgangszustand geprüft — kein Rest davon im
   Arbeitsverzeichnis.

---

## Risiken

1. **`waitForPortFree` schützt nicht gegen einen Fremdprozess, der den Port dauerhaft belegt** (ein
   von Hand gestartetes Takt zum Beispiel). Nach 5 s Warten kommt dieselbe sprechende Meldung wie
   bei `verify-sidecar.mjs` — kein stiller Fehlschlag, aber auch kein automatisches Freiräumen
   eines fremden, absichtlich laufenden Dienstes. Das ist Absicht: Ein Skript, das unbekannte
   Prozesse auf einem gemeinsam genutzten Port automatisch tötet, wäre der gefährlichere Fehler.
2. **Der Zeitwert 5 s (Warten) bzw. 3 s (SIGTERM-Frist) ist eine Schätzung**, keine Messung unter
   Last. Auf dieser Maschine reichten beide in mehreren Wiederholungen sicher; eine deutlich
   langsamere CI-Maschine könnte das ausreizen. Bewusst großzügig statt knapp gewählt.
3. **`toExportAuditEvent`-Rückfall (E-047-Nachfolgefrage aus T-029) bleibt offen**, siehe oben —
   kein Teil dieses Auftrags, aber weiterhin unentschieden.
4. **Ein `pnpm check`-Lauf gegen Ende der Aufgabe schlug einmalig am Typecheck von
   `apps/local-api/src/routes/export.ts` fehl** (`ExportPreviewTemplate`/`exportSourceCatalog`
   ungenutzt, ein `ExportTemplateId | null` gegen `ExportPreviewTemplate`). Die Datei war zu diesem
   Zeitpunkt nachweislich in Bearbeitung (Dateigröße und Änderungszeit veränderten sich innerhalb
   von Sekunden zwischen zwei Prüfungen) — kein Fund aus dieser Aufgabe, ich habe
   `apps/local-api/src/**` nicht angefasst. Nach kurzem Warten war die Datei stabil und `pnpm
   check` lief erneut mit Exitcode 0 durch (Zahlen wie oben berichtet). Erwähnt, falls derselbe
   Zwischenstand jemandem sonst begegnet.

---

## Offene Fragen

Keine neuen an den Orchestrator. Die einzige aus T-029 verbliebene Frage (`toExportAuditEvent`-
Rückfall bei unbekanntem `event`-Wert) ist bewusst nicht Teil dieses Auftrags und bleibt beim
domain-dev/Orchestrator.

---

## Nächster Schritt

Beide Reste aus T-029 sind geschlossen. `packages/storage/src` hat wieder spürbaren Puffer über der
80-Prozent-Zweigschwelle (2,05 statt 0,82 Punkte), und die fünf Prüfpfade vertragen sich jetzt auch
unmittelbar hintereinander gefahren.
