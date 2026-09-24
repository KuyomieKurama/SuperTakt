Aufgabe: T-405a — Code-Review Welle 18, Dienst/Domäne/Speicherung/Add-in (T-388, T-389, T-397, T-397a, T-397b, T-398, T-398b) und Prüffälle (T-395, T-401, T-401c)
Status: fertig
Artefakte: diese Datei (nichts sonst geschrieben, nichts committet)
Zusammenfassung: Typprüfung und Tests sind grün, und die 24-h-Grenze liegt als Regel in der Domäne. Der Add-in-Rückbau ist sauber, und der Übergangsalias verhält sich wie in E-129 beschlossen. Eine Stelle blockiert: Die neue Namensprüfung im Archivimport weist die eigene Datensicherung eines Bestands ab, der gültige Alt-Titel mit 501 bis 512 Zeichen enthält (A-20.4, Round-Trip). Dazu kommt ein gemeldeter, zurückgenommener Übergriff von T-401c in Produktivcode.

Prüfung:
- `pnpm --filter` typecheck für @takt/domain, @takt/storage, @takt/local-api, @takt/outlook-addin: grün.
- `tsc -p <paket>/tsconfig.test.json` für domain, storage, local-api, outlook-addin: grün.
- `TAKT_PROOF_PORT=21843 npx vitest run packages apps/local-api apps/outlook-addin`: 104 Dateien grün, 1 übersprungen; 1804 Tests grün, 2 übersprungen; Exitcode 0.
- Nicht gefahren: `proof:*`, `pnpm check`, e2e, Rust. Das Review verlangt sie nicht, und parallel baut T-400a. Die Wächter in `proof-addin.mjs` und `proof-access.mjs` habe ich nur stichprobenweise gelesen, nicht vollständig.
- Die Wörter „Schlüssel“ und „gefahren“ in diesem Bericht beziehen sich auf Code, nicht auf Oberflächentext.

Befunde:

```
apps/local-api/src/features/data-transfer/data-transfer.ts:221  hoch    `todo.title` wird im Archiv gegen MAX_TITLE_CHARACTERS (500) geprüft. Titel bis 512 Zeichen sind aber legitimer Altbestand aus der Zeit vor T-114 (OpenAPI :3875 „Bis T-114 lag die Grenze bei 512“, `todo` hat keine CHECK-Länge). Eine eigene Datensicherung eines solchen Bestands wird damit vollständig abgewiesen: A-20.4 bricht, und der Benutzer kann sein eigenes Backup nicht einspielen. Fix: Für das Archiv eine benannte Altgrenze (`LEGACY_MAX_TITLE_CHARACTERS = 512` in `packages/domain/src/text-length.ts`) verwenden oder Überlänge annehmen und mit Warnung zählen wie die >24-h-Buchungen. Prüffall in `data-archive-name-directory.test.ts` mit einem Titel von 512 Zeichen → angenommen.
packages/domain/src/time-entry.ts:—  hoch    Dateihoheit: T-401c (unit-tester) hat nach eigenem Bericht `exceedsMaximumDuration` in Produktivcode per Edit abgeschaltet und sofort zurückgesetzt. Der heutige Diff der Datei enthält nur die in T-388/T-397 beschriebenen Änderungen, eine Spur ist nicht sichtbar. Kein Codefix nötig. Der Orchestrator nimmt den Fall zur Kenntnis und weist den unit-tester für Rot-vor-Grün auf Wegwerfnachbauten im Kritzelverzeichnis hin. Blockiert die Freigabe nicht, weil kein Rest im Baum steht.
apps/local-api/src/features/timer/idle.ts:258  mittel  Zweite Formulierung der 24-h-Regel: `part.seconds > MAX_TIME_ENTRY_SECONDS` vergleicht selbst, während alle anderen Stellen `exceedsMaximumDuration` fragen. Konstante und Vergleich sollen genau einmal in der Domäne stehen. Fix: In `packages/domain/src/time-entry.ts` `exceedsMaximumSeconds(seconds)` ergänzen, `exceedsMaximumDuration` darauf aufbauen und hier nutzen. Den Import von `MAX_TIME_ENTRY_SECONDS` in idle.ts streichen.
packages/storage/src/sqlite/repo-time.ts:113  niedrig Der bestehende Docstring von `createTimeEntryPort` (`@param timeZone …`) steht jetzt über den neu eingefügten Konstanten `TIME_ENTRY_TOO_LONG`/`TIMER_STOP_END_REQUIRED` (:118-129) und dokumentiert damit die falsche Deklaration. Fix: Die beiden Konstanten über den Docstring ziehen, direkt hinter `filterConditions`.
apps/local-api/src/features/todos/todos.ts:649  niedrig Die Suche im Leistungstext ist von JS `toLowerCase().includes` auf SQL `LIKE` umgestellt (repo-time.ts:89). Groß-/Kleinschreibung wird damit nur noch für ASCII ignoriert: „Ärger“ findet „ärger“ nicht mehr, vorher schon. Der Kommentar im Port nennt das, der Bericht T-397 nicht. Fix: Die Einschränkung als Verhaltensänderung an spec-ux-reviewer melden. Wenn gewünscht, `lower()` genügt für Umlaute nicht; dann bräuchte es eine eigene Kollation. Mindestens einen Prüffall mit Umlaut festschreiben.
apps/local-api/src/features/structure/routes.ts:217  niedrig `PUT /pools/order` begrenzt auf 200 Kennungen, während O-Z ausdrücklich keine Obergrenze für Regeln kennt. Ab 201 Regeln lässt sich nichts mehr sortieren, auch nicht über den kaputten PATCH-Tausch. Fix: Die Grenze als benannte Konstante mit Grund führen und die Obergrenze für Regeln im Board als Folgefrage zu O-Z festhalten, oder die Grenze aus der Zahl vorhandener Regeln ableiten (die Speicherung prüft die Vollständigkeit ohnehin).
packages/storage/src/sqlite/repo-version-check.ts:52  niedrig `isEnabled()` liefert bei fehlender Zeile oder Spalte `false`, `toAppSettings` (mappers.ts:509) im selben Fall `versionCheckEnabled: true`. Die Einstellungsseite zeigt dann „an“, während der Prüfer schweigt. Heute nicht erreichbar, weil die Zeile gesät ist. Fix: Beide Stellen gleich lesen, bevorzugt `=== 1` im Mapper.
apps/local-api/test/main-exit-codes.test.ts:42  niedrig Der Titel behauptet „the exact condition main.ts maps to code 73“. Gemessen wird aber nur, dass `ensureDirectory` wirft; die Zuordnung zu `EXIT_CODES.appData` in `main.ts` ist ungemessen, und ein Tausch gegen `EXIT_CODES.storeOpen` bliebe grün. Fix: Den Titel auf das Gemessene kürzen und die Abbildung der Codes einem prozessstartenden Lauf zuordnen (`proof:access` startet `main()` bereits als Prozess und misst 78/65; 73 dort ergänzen).
apps/local-api/test/taskpane-server-map-extension.test.ts:18  niedrig Der Test bindet fest `127.0.0.1:18973`, nicht über `TAKT_PROOF_PORT`. Zwei parallele Vitest-Läufe (Wellenbetrieb, E-121 Punkt 8) kollidieren dort. Fix: Den Port über `server.address()` nach `port: 0` nehmen, falls `startTaskpaneServer` das trägt, sonst von `TAKT_PROOF_PORT` ableiten.
apps/outlook-addin/src/duplicate/rule.ts:35  niedrig Die umgeschriebenen Kommentare sind neu verfasst und weiter deutsch (auch :52). E-118 verlangt Englisch, wo ein Auftrag einen Kommentar ohnehin umschreibt. Fix: Beim nächsten Berühren ins Englische übertragen, zusammen mit apps/local-api/src/routes/addin/index.ts:109 (derselbe Fall, dort zusätzlich eine überlange Zeile).
apps/local-api/src/features/data-transfer/data-transfer.ts:1  niedrig `MAIL_NOTE_MAX_LENGTH` ist in den vorbestehenden Einzelimport **über** dem Dateikopf angehängt, während ein zweiter `@takt/domain`-Import in Zeile 34 steht. Zwei Importe aus derselben Quelle verwirren beim Lesen. Fix: Zeile 1 in den Importblock ab :34 einfügen.
```

Geprüft ohne Befund:
- **24-h-Grenze:** Konstante und Regel stehen einmal in `packages/domain/src/time-entry.ts`. Sie greifen in der Speicherung an create/update/stop/start sowie vorab in `beginIdle`, `namedEndProblem`, Fremdimport und Archivwarnung, jeweils über `exceedsMaximumDuration`. Die einzige Abweichung ist idle.ts:258, siehe oben. Rundung, Base64 und Exportstatus sind unberührt; keine zweite Umsetzung im Diff.
- **Verschluckte Fehler:** `app.onError` protokolliert Klasse und Code in geschlossener Form. `allowedByUser` fängt, protokolliert einmal und entscheidet für „aus“, die billige Richtung nach A-28.1. `ensureDirectory` in main.ts führt jetzt zu Code 73, statt unbehandelt zu werfen. `earlierOf`/`decideTimerStop` verwerfen NaN, statt zu buchen. `filterConditions` wirft bei fehlendem Pool-Auflöser; das ist ein Programmierfehler, laut und kein Schweigen.
- **Transaktionen:** `importDataArchive` ruft `replaceAll` und `observeRecovery` in einer Klammer. Die Ordnerprüfung N-1 läuft davor und schreibt nichts. `reorderPools` nutzt `inTransaction` plus Sicherungspunkt mit Zweiphasenschreiben. `resolveIdle` prüft alle Abschnitte vor der ersten Schreibung. Die Stopp-Pfade lassen die Speicherung die 24-h-Regel innerhalb derselben Transaktion prüfen.
- **Übergangsalias E-129:** POST und PATCH nehmen `requiredTags` oder `rule`; beides zugleich ergibt 422 an `requiredTags`. PATCH ohne beide lässt die Regel unverändert (`requiredTags ?? legacyRule` → undefined). Die Antwort trägt beide Namen, `/addin/context` bleibt bei `rule`. Die TS-Umbenennung ist als T-411 terminiert.
- **Namensverzeichnis:** zehn Tabellen mit elf Spalten, die Längen aus den Konstanten der jeweiligen Tür. Die Meldung nennt Tabelle.Spalte, nie den Wert. Offen bleibt nur der Titel, siehe den ersten Befund.
- **Typsicherheit:** kein `any`. Die Zusicherungen `as TagId[]`/`as PoolId[]`/`as Timestamp` stehen hinter Zod-Prüfungen, wie im Bestand üblich. `item[rule.column] as ArchiveScalar | undefined` ist durch `isScalar` davor gedeckt.
- **Add-in:** `AddinUnit` ist strukturell ohne `clearDone`, `timeEntries.create` und `resolveAxes`. Die Grenzen kommen aus `@takt/domain`, `ADDIN_ATTACHMENT_SENDER_MAX_LENGTH` begründet eigenständig. Neue Texte liegen gebündelt in `ui/texts.ts` (E-118).
- **Dateihoheit:** `main.ts` durch T-397a genehmigt (E-128 Punkt 1). Sonst habe ich keine Datei außerhalb der jeweiligen Hoheit gefunden, bis auf den Befund zu T-401c.
- **Merkmalsstruktur:** `request` wird nicht berührt. Neue Kante `data-transfer → timer` (`observeRecovery`), Grund steht an der Kante. `repo-time.ts → repo-todos.ts` liegt innerhalb der Speicherung.
- **Wächter:** `proofPort()` weigert sich bei ungültigem Wert, statt auf 17843 auszuweichen. O-LE in `proof-addin.mjs` hat laut T-398b eine Gegenprobe; ich habe sie gelesen, nicht gefahren.
- Keine Bewegung in der Oberfläche berührt; ein Animations-Review entfällt.

Urteil: **Nacharbeit**

Blockierend: `apps/local-api/src/features/data-transfer/data-transfer.ts:221`, weil die eigene Datensicherung mit legitimem Alt-Titel abgewiesen wird (A-20.4). Der Fix ist klein (benannte Altgrenze 512 plus ein Prüffall). Alle übrigen Befunde blockieren nicht. Der Hoheitsbefund zu T-401c ist `hoch`, braucht aber keinen Codefix und blockiert deshalb nicht.

Annahmen:
- Titel über 500 bis 512 Zeichen existieren tatsächlich in Beständen. Das stützt sich auf die OpenAPI-Beschreibung, nicht auf eine Messung an einer echten Datenbank.
- Die Rückstellung von `time-entry.ts` durch T-401c ist vollständig. Das habe ich am Diff gegen die Berichte T-388/T-397 abgeglichen, nicht byte-genau gegen einen Zwischenstand.

Risiken: keine neuen Sicherheitsrisiken aus dem Review. R-30 (Schalter der Versionsprüfung) und C-22 (Vermerk als Suchquelle) gehören T-406.

Offene Fragen:
1. Titel im Archiv: Altgrenze 512 übernehmen, oder Überlänge annehmen und warnen? Beides schließt den Befund; ersteres ist kleiner.
2. Suche im Leistungstext nur ASCII-unabhängig von der Schreibweise: akzeptiert oder Rückschritt?

Nächster Schritt: domain-dev behebt data-transfer.ts:221 (und nach Wahl idle.ts:258, repo-time.ts:113, mappers.ts:509). unit-tester ergänzt den Prüffall mit 512 Zeichen und korrigiert die beiden Testbefunde. Danach genügt ein kurzer Nachprüfdurchgang.
