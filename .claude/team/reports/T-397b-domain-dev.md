Aufgabe: T-397b — Nachweisläufe auf TAKT_PROOF_PORT, Beendigungscode 65, Fremdschlüssel an export_run.template_id (Welle 18c)
Status: braucht Review
Artefakte:
- `apps/local-api/scripts/proof-access.mjs` — Abschnitt 0g erwartet bei Migrationsfehlern Code 65 statt 78
- `apps/local-api/scripts/proof-tags.mjs`, `proof-conflicts.mjs`, `proof-addin-wiring.mjs`, `proof-db-permissions.mjs` — Port aus `proofPort()`, Start über `proof-access-entry.ts` statt `src/index.ts`
- `apps/local-api/scripts/proof-taskpane.mjs` — Port `proofPort() + 101` (Vorgabe weiter 17944)
- `apps/local-api/scripts/port-probe.mjs` — Obergrenze von `TAKT_PROOF_PORT` jetzt 65434 (wegen +101)
- `apps/local-api/scripts/source-resolve.mjs` — `dienstEinstieg()` entfernt (kein Aufrufer mehr), Kopfkommentar angepasst
- `apps/local-api/scripts/proof-access-entry.ts` — Kommentar: jeder Lauf, der den Dienst als Prozeß startet, startet diesen Einstieg
- `apps/local-api/scripts/proof-route-policy.mjs` — veralteter Satz „lauscht immer auf 17843" berichtigt
- keine Migration (siehe Punkt 3)

Zusammenfassung: Alle vier Läufe, die den Dienst als Prozeß starten, und `proof:taskpane`, der einen Socket bindet, nehmen ihren Port jetzt aus `TAKT_PROOF_PORT`. Sie starten denselben Prüfeinstieg wie `proof:access` und fragen deshalb auch GitHub nicht mehr an. `proof:access` erwartet 65 bei Migrationsfehlern. Der Befund zum Fremdschlüssel aus T-397a war ein Fehlalarm, der Schlüssel besteht und wird durchgesetzt.

Prüfung:
- Mit `TAKT_PROOF_PORT=19843`, alle Exitcode 0: proof-tags 45/0, proof-conflicts 158/0, proof-addin-wiring 31/0, proof-db-permissions 27/0, proof-taskpane 33/0 (auf 19944), proof-template-fields 30/0, proof-route-policy 59/0, proof-openapi 114/0 (fährt `service-scenario` mit), proof-access 123/0 (beide Zeilen „… mit Code 65" grün), proof-export-api 75/0.
- Gegenprobe: 19843 mit einem fremden Listener belegt. proof-tags, proof-conflicts und proof-addin-wiring brechen mit „Auf 127.0.0.1:19843 lauscht bereits etwas" und Exitcode 1 ab. Sie nutzen also wirklich den Prüfport und weichen nicht auf 17843 aus.
- `proofPort()`: ohne Variable 17843, `65434` wird angenommen, `65435` abgewiesen.
- proof-layers, proof-release-safety, proof-callers: Exitcode 0.
- `pnpm --filter @takt/local-api typecheck`: 0 Fehler. Wurzel-`pnpm typecheck` ist **rot**, alle Fehler stehen in `apps/local-api/test/routes/addin/service.test.ts` (`bookOnTodo`, `poolMovement` …). Das ist der Testbestand von unit-tester (T-401) gegen den Add-in-Rückbau, keine Datei dieser Aufgabe.
- Nicht gefahren: der Vorgabeport 17843, weil T-401 ihn parallel belegen kann. Ebenso nicht gefahren: macOS und Windows.

Annahmen:
- **proof-template-fields, proof-route-policy, proof-openapi, service-scenario: bewusst unverändert.** Sie binden keinen Socket. `compose()` plus `app.request()`/`app.fetch()`, kein `listen` und kein `spawn` (per grep geprüft). Ihr `PORT` speist nur die Host-Prüfung von `compose({ port })`, deshalb gibt es keine Kollision. Den Produktwert dort zu lassen, misst die ausgelieferte Einstellung. Der Auftrag sagt „soweit sie einen Dienst starten", E-128 Punkt 3 zählt sie mit auf. Ich habe mich an den Auftrag gehalten und gebe das hier ausdrücklich an.
- `ADDIN_ORIGIN = 'https://localhost:17844'` in proof-addin-wiring bleibt 17844. Das ist ein Eintrag der festen Herkunftsliste in `config.ts`, kein Port, den der Lauf bindet. Ein Kommentar sagt das jetzt.
- proof-taskpane liegt auf `proofPort() + 101` statt auf +1. Mit +1 läge die Vorgabe auf 17844, dem Port der laufenden Anwendung. Genau davor schützte die bisherige 17944. Mit +101 bleibt die Vorgabe 17944 und kollidiert auch nicht mit dem +1 der Dienstläufe auf demselben Prüfport.
- Die Dienstläufe starten `proof-access-entry.ts` statt `src/index.ts`. Es ist derselbe `main()`, mit Port aus der Umgebung und einer Abholfunktion ohne Netz. Nebenwirkung wie schon bei proof-export-api in T-397a: Keiner dieser Läufe fragt noch GitHub an. `src/index.ts` besteht aus zwei Zeilen (`import`, `await main()`), dabei geht also nichts an Abdeckung verloren.
- **Fremdschlüssel (Punkt 3), gemessen:** `export_run.template_id REFERENCES export_template (id) ON DELETE RESTRICT` steht seit 0001. `PRAGMA foreign_key_list(export_run)` zeigt ihn nach allen 29 Migrationen, und `CONNECTION_PRAGMAS` setzt `foreign_keys = ON` und `defer_foreign_keys = OFF`. Probe über `openDatabase` + `recordRun`: Mit `01931000-0000-7000-8000-00000000dead` kommt `{ ok: false, code: 'validation_error' }` zurück, und es entsteht keine Zeile. Die Kennung, die T-397a als „nicht vorhanden" benutzt hat (`01931000-…-0000000000f1`), ist die **Kennung der Standardvorlage** aus `0002_seed_defaults.up.sql`. Der Befund war ein Fehlalarm. Deshalb gibt es keine Migration 0030. Die Probe war ein Wegwerfskript und ist wieder gelöscht.

Risiken:
- Keine neue Außenfläche. `TAKT_PROOF_PORT` wird weiterhin nur unter `scripts/` gelesen. `src/index.ts` übergibt nichts, das Erzeugnis bleibt auf 17843/17844 (B-1.5).
- Die Obergrenze von `TAKT_PROOF_PORT` sinkt von 65534 auf 65434. Ein Wert dazwischen wird jetzt rot abgewiesen statt angenommen. Das ist eine gewollte Weigerung (E-121 Punkt 10).

Offene Fragen:
1. `apps/outlook-addin/scripts/proof-addin.mjs` (integration-dev) liest den Port nicht aus `TAKT_PROOF_PORT`, falls er einen Dienst startet. Das melde ich nur, die Datei habe ich nicht angefasst.
2. E-128 Punkt 4 und R-Eintrag zu `export_run.template_id` bitte schließen. Der Fremdschlüssel ist durchgesetzt, der Befund aus T-397a beruhte auf der Kennung der Standardvorlage.
3. Die vier compose-basierten Läufe bleiben auf dem Produktwert. Soll E-128 Punkt 3 entsprechend berichtigt werden?

Nächster Schritt: security-checker (T-406) prüft die Umstellung der vier Dienstläufe auf den Prüfeinstieg und die Weigerung bei 65435. Nach der Welle fährt der Orchestrator `proof:all` einmal ohne `TAKT_PROOF_PORT` auf 17843.
