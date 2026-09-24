Aufgabe: T-021 — Anwendungsfälle und HTTP-Routen

Status: fertig

---

Artefakte:

Neu unter `packages/domain/src/`:

```
call-number.ts        E-045: die Plausibilisierung, eine Fassung für alle
```

Neu unter `packages/storage/src/sqlite/` — der SQLite-Adapter, 2 600 Zeilen:

```
database.ts           die einzige Datei, die `node:sqlite` anfasst
errors.ts             SQLite-Meldung -> TaktError, an genau einer Stelle
ids.ts                UUIDv7
mappers.ts            Zeile -> Domänenwert, ausgeschrieben, kein SELECT *
paging.ts             Fortsetzungsmarke statt Seitenzahl
unit-of-work.ts       die Transaktionsklammer samt Reihung
migration-runner.ts   vorwärts, rückwärts, Prüfsumme, Sicherungskopie
open.ts               Pfad rein, benutzbare Speicherung raus
clock.ts              Uhr und Windows-Benutzername als Ports
file-port.ts          Exportordner, Nachbardatei, fsync, rename
repo-todos.ts         TodoPort, TodoNotePort
repo-tags.ts          TagPort, TagFolderPort, PoolPort
repo-statuses.ts      TodoStatusPort
repo-time.ts          TimeEntryPort, TimerPort, TimerHeartbeatPort
repo-export.ts        ExportReadPort, ExportPort
repo-settings.ts      ExportTemplatePort, AppSettingsPort, DefaultTagPort
```

Neu unter `apps/local-api/src/`:

```
usecases/context.ts     der gemeinsame Zusammenhang; kein `hono` in diesem Ordner
usecases/todos.ts       Anlegen mit Standard-Tags (A-9.5), Vermerk, Duplikatsuche
usecases/timer.ts       Start mit Rückfrage, Stopp, Lebenszeichen, verwaiste Buchung
usecases/export.ts      der transaktionale Exportlauf (A-8.8) und die Vorschau
usecases/structure.ts   Tags, Ordner, Pools, Spalten, Vorlagen, Einstellungen
http/problem.ts         TaktError -> Statuscode, an genau einer Stelle
http/input.ts           Gestaltprüfung am Rand (zod)
routes/todos.ts         /todos, /todos/{id}/note, /todos/{id}/done, /search
routes/structure.ts     /tag-tree, /tags, /tag-folders, /pools, /todo-statuses
routes/time.ts          /time-entries, /timer/*
routes/export.ts        /export/*, /settings/*
taskpane/asn1.ts        so viel DER, wie ein Zertifikat braucht
taskpane/certificate.ts selbst signiertes Zertifikat für `localhost` (E-046)
taskpane/server.ts      der zweite Port, nur statische Dateien
scripts/proof-export.mjs        66 Prüfungen, darunter der Abbruch mittendrin
scripts/proof-taskpane.mjs      25 Prüfungen
scripts/proof-addin-wiring.mjs  30 Prüfungen gegen den echten Dienst
```

Geändert: `packages/domain/src/index.ts` (eine Zeile), `packages/storage/src/ports.ts`
(`ExportPort` neu geschnitten, `exportRead` ergänzt, `create`-Vertrag beschrieben),
`packages/storage/src/index.ts`, `apps/local-api/src/{app,composition,main,config,index}.ts`,
`apps/local-api/src/access/paths.ts`, `apps/local-api/package.json`,
`apps/local-api/openapi/takt-local-api.yaml`, `docs/architektur.md`, `docs/datenmodell.md`.

`pnpm-lock.yaml` um **drei Zeilen** gewachsen: den Arbeitsbereichsverweis
`@takt/export` in `apps/local-api`. Nichts aus dem Netz geladen
(`pnpm install --offline --ignore-scripts`), keine neue Fremdabhängigkeit.

Nicht angefasst: `apps/local-api/src/routes/addin/**`, `packages/*/test/**`,
`packages/export/**`, `apps/web/**`, `apps/desktop/**`, `apps/outlook-addin/**`,
die übrigen Wurzeldateien, `docs/**` außer meinen beiden. Kein `git commit`.

Rund 8 700 Zeilen, davon etwa 40 Prozent Kommentar.

---

Zusammenfassung:

Die Mitte steht. Zwischen der Fachlogik aus T-009 und den Routen liegen jetzt ein
vollständiger SQLite-Adapter über alle dreizehn Ports, die Anwendungsfälle darüber und
41 Pfade mit 62 Operationen hinter der Prüfkette aus T-011 — einschließlich der vier
Add-in-Routen, die seit T-019 unverdrahtet waren.

Der Export ist transaktional, und das ist **gemessen, nicht behauptet**:
`proof-export.mjs` führt einen Abbruch mitten im Vorgang herbei — einmal nach dem
Schreiben der Datei und vor dem Markieren, einmal nach dem Markieren und vor dem
Festschreiben — und zählt danach nach. In beiden Fällen: keine markierte Buchung, kein
erhöhter `export_count`, keine Protokollzeile, kein Exportlauf, keine Datei im Ordner,
auch keine `.tmp`. Anschließend läuft derselbe Bestand ohne Haken vollständig durch, und
`export_count` steht danach auf 1 und nicht auf 2.

Vier Prüfpfade, alle grün, alle ohne Windows fahrbar:

| Befehl | Ergebnis |
|---|---|
| `pnpm --filter @takt/local-api proof:export` | **66 bestanden, 0 fehlgeschlagen** |
| `pnpm --filter @takt/local-api proof:addin-wiring` | **30 bestanden, 0 fehlgeschlagen** |
| `pnpm --filter @takt/local-api proof:taskpane` | **25 bestanden, 0 fehlgeschlagen** |
| `pnpm --filter @takt/local-api proof:access` | **75 bestanden, 0 fehlgeschlagen** (unverändert) |

`pnpm typecheck`, `pnpm boundaries`, `pnpm build` — alle drei grün. `pnpm test`: **265 von
265**, der Nachzug des unit-testers ist eingelaufen. `pnpm test:coverage` ist rot, und zwar
begründet — siehe Risiko 1.

---

Was die Prüfpfade an echten Fehlern gefunden haben

Drei, und alle drei hätten in einer Abrechnung gestanden:

1. **Der Vermerk aus dem Add-in ging verloren.** `TodoPort.create` bekam `TodoCreate.note`
   und ließ ihn fallen. Der aus einer E-Mail übernommene Text (B-12.3) verschwand
   stillschweigend; über die Oberfläche wäre es nie aufgefallen, weil mein eigener
   Anwendungsfall den Vermerk zusätzlich schrieb. Der Adapter schreibt ihn jetzt in
   derselben Transaktion, und der doppelte Schreibvorgang im Anwendungsfall ist entfallen.
   Gefunden von `proof-addin-wiring.mjs`, Abschnitt 5.

2. **`exported` von Hand zu setzen ergab „ist schon so" statt „geht so nicht".** Ich hatte
   im Anwendungsfall den Ausgangsstatus fest verdrahtet (`checkExportStatusTransition(
   'exported', …)`) statt ihn zu lesen. Der Aufrufer bekam `export_status_unchanged` statt
   `export_status_not_settable` — also die Auskunft, es sei nichts zu tun, wo in Wahrheit
   ein Weg versperrt ist. Jetzt wird der tatsächliche Zustand gelesen und die Domäne
   darüber befragt. Gefunden von `proof-export.mjs`, Abschnitt 2.

3. **Kollidierende Namen der Sicherungskopie.** Zwei Migrationen in derselben Sekunde
   ergaben denselben Dateinamen, und `VACUUM INTO` bricht ab, statt zu überschreiben — der
   Start hätte gehangen. Der Name trägt jetzt den Bestandsnamen und bei Bedarf einen
   Zähler; bei Fassung 0 unterbleibt die Kopie, weil eine Kopie einer leeren Datei nichts
   sichert. Gefunden von `proof-export.mjs`, Abschnitt 2.

---

Die vier Punkte aus T-019

1. **`'https://localhost:17844'` steht in `ALLOWED_ORIGINS`.** Nachgewiesen:
   `proof-addin-wiring.mjs` Abschnitt 1 fährt die Herkunft gegen den echten Dienst,
   dazu eine fremde (403) und `https://localhost:17844.evil.example` (403).

2. **Der Router hängt.** `api.route('/addin', createAddinRoutes(...))` in `app.ts`, hinter
   der Kette. Ein `TransactionPort` erfüllt `AddinDeps` strukturell — es gibt keinen
   Übersetzungsadapter. Kein Zeichen in `src/routes/addin/**` geändert.

3. **Welche `tagIds` liest `TodoPort.create`?** Das **zweite Argument**. `input.tagIds`
   wird vom Adapter nicht gelesen. Begründung: `TodoCreate.tagIds` sind laut Vertrag „die
   ausdrücklich gewählten Tags", das zweite Argument ist die wirksame Liste nach
   `applyDefaultTags`. Damit greift A-9.5 unabhängig davon, ob der Aufrufer ergänzt hat —
   und die Annahme des integration-dev (beide gleich zu übergeben) bleibt richtig. Steht
   jetzt im Vertrag in `ports.ts`.

4. **TP-ADDIN-08 ist ausführbar**, jedenfalls sein Dienstanteil:
   `proof-addin-wiring.mjs` erzeugt ein Token über die Hülle, lädt damit den Tag-Baum,
   erzeugt ein zweites und weist nach, dass das erste sofort ungültig ist. Der
   Oberflächenanteil — Token in S-13 eintragen, DOM auf den Klartext prüfen — gehört dem
   e2e-tester und braucht Playwright.

---

E-045 und E-046

**E-045.** `packages/domain/src/call-number.ts` ist die eine Fassung. Sie wird von meinen
Routen und Anwendungsfällen aufgerufen. Die **beiden anderen Fassungen habe ich nicht
entfernt** — `apps/local-api/src/routes/addin/call-number.ts` und
`apps/outlook-addin/src/callnumber/plausibility.ts` liegen beide außerhalb meiner Hoheit.
Der Wächter im Add-in-Nachweispfad kann also noch nicht entfallen. Siehe offene Frage 1;
es sind zwei Importe.

**E-046.** Der Aufgabenbereich liegt unter `https://localhost:17844`, ausgeliefert vom
Dienst auf einem zweiten Port. Das Zertifikat entsteht beim ersten Start, liegt mit `0600`
im Anwendungsdatenverzeichnis neben dem Token und wird erst 14 Tage vor Ablauf erneuert —
ein Zertifikat, das sich bei jedem Start ändert, müsste bei jedem Start angenommen werden,
und wer eine Warnung täglich wegklickt, klickt sie auch weg, wenn sie einmal berechtigt
ist.

Das Zertifikat wird **ohne Fremdbibliothek** erzeugt: `node:crypto` kann Schlüssel erzeugen
und signieren, aber kein X.509 schreiben, und `openssl` ist auf einem Windows-Arbeitsplatz
nicht verlässlich vorhanden. `taskpane/asn1.ts` schreibt die Struktur aus — 200 Zeilen, die
sich nie ändern. Nachgeprüft wird sie nicht von mir, sondern von `crypto.X509Certificate`:
Inhaber, Aussteller, `subjectAltName`, Laufzeit, Signatur, Schlüsselzugehörigkeit. Dazu ein
echter TLS-Handschlag gegen den laufenden Port. Der echte Add-in-Bündelordner wird
ausgeliefert (gemessen: 200, 2 394 Bytes, enthält `office.js`).

Der Port liefert **nur statische Dateien**, über eine Positivliste von Endungen: Eine `.pem`
im Bündelordner bekommt 403, kein Pfad führt aus der Wurzel heraus, auch kodiert nicht.

---

E-042 — der Benutzername auf seinem Weg

Von der zweiten `stdin`-Zeile bis in `export_run.windows_user` und `export_audit.actor`
gibt es **keine Stelle, an der ihn jemand überschreiben könnte**:

```
stdin Zeile 2 -> readStartupHandshake -> compose(windowsUser) -> createSystemPort
              -> AppContext.system     -> runExport liest ihn selbst
              -> ExportRunRecord.windowsUser -> export_run / export_audit
```

Kein Anwendungsfall nimmt ihn als Argument entgegen, keine Route liest ihn aus einem
Rumpf, keine Abfragezeichenkette trägt ihn. `proof-export.mjs` prüft, dass `WindowsUser` in
der geschriebenen Datei `t.beispiel` lautet — der Wert, der beim Start hereinkam.

---

Annahmen:

1. **`ExportPort.runExport` ist zu `recordRun` geworden.** Der ursprüngliche Vertrag legte
   den ganzen Ablauf in die Speicherung: Ordner prüfen, gruppieren, rendern, Datei
   schreiben, markieren. Das hätte bedeutet, dass `packages/storage` den Vorlagen-Motor
   einbindet und den `FilePort` zugleich benutzt und umsetzt. Ein austauschbarer Adapter
   (E-001) trüge damit das Vorlagenformat mit sich, und ein zweiter Adapter müsste es
   nachbauen. Jetzt führt der Anwendungsfall den Ablauf, und der Port schreibt fest — die
   Klammer bleibt, wo die Transaktion ist, das Rendern, wo das Format ist. `sumQuarters`
   ist ersatzlos entfallen: Die Größe war ohne Rundungsmodus nicht bestimmbar und hatte
   keinen Aufrufer.

2. **Die Transaktionen werden gereiht.** `node:sqlite` ist synchron, die Ports sind es
   nicht — und der Exportlauf **muss** innerhalb der Transaktion `await` sagen, weil er die
   Datei schreibt, bevor er markiert. An jedem `await` könnte die Ereignisschleife eine
   zweite Anfrage bedienen, deren `BEGIN` in dieselbe offene Klammer liefe; ein `ROLLBACK`
   des Exports nähme ihre Schreibvorgänge mit. `createTransactionPort` lässt deshalb nie
   zwei Transaktionen gleichzeitig laufen. Für einen Einbenutzerdienst ist das kein
   Engpass.

3. **Ein fachlicher Fehlschlag im Exportlauf wird ausdrücklich geworfen.** Die Klammer
   nimmt nur bei einem Wurf zurück; ein `Result` mit `ok: false` ist ein Wert. Ohne den
   Kunstgriff wäre der schlimmste Fall möglich: Datei geschrieben, `recordRun` scheitert,
   „Fehler" an den Benutzer — und die halbe Markierung bliebe festgeschrieben.

4. **Ein Haken für den Abbruch steht im Erzeugnis.** `ExportFaultInjection` ist im Betrieb
   `undefined`, wird ausschließlich im Zusammenbau gesetzt und ist über keine Anfrage,
   keine Kopfzeile und keine Umgebungsvariable erreichbar. Er steht dort, weil sich A-8.8
   sonst nicht **nachweisen** lässt, sondern nur behaupten — und weil ein Abbruch zwischen
   Datei und Markierung genau der Fall ist, der selten und teuer ist.

5. **`TodoPort.create` schreibt den Vermerk mit.** Siehe Befund 1 oben. Das schwächt die
   Notiz-Trennung nicht: Sie ist eine Grenze auf der **Leseseite**, und es gibt weiterhin
   genau einen Weg, den Vermerk zu lesen.

6. **Ein Auflösungshaken in `src/index.ts`.** `packages/domain` und `packages/export`
   schreiben ihre internen Importe mit `.js`; Node löst das wörtlich auf und findet
   nichts. Im Betrieb spielt es keine Rolle (esbuild bündelt), beim Start aus dem
   Quelltext schon — und das tun der Entwicklungsbetrieb und jeder Prüfpfad. Der Haken
   greift **erst nach** einer gescheiterten Auflösung und nur für relative `./x.js`. Er
   steht in `index.ts` und nicht in `main.ts`, damit das Bündel ihn gar nicht enthält.
   `packages/domain` und `packages/storage` habe ich **nicht** umgestellt, um den Wächter
   und fremde Pakete nicht anzufassen; nötig ist er nur noch wegen `packages/export`.

7. **Blätterung: `updated_at DESC, id DESC`.** Die Board-Reihenfolge (`board_rank` je
   Spalte) wird **nicht** in derselben Abfrage hergestellt. Das Board fragt je Spalte und
   ordnet nach `boardRank`; zwei Sortierungen in einer Abfrage wären zwei Wahrheiten über
   dieselbe Liste. `board_rank` eines neuen Todos ist seine Kennung — je Spalte eindeutig,
   nach Erzeugungszeit wachsend.

8. **Mehrere Pools im Filter wirken als Vereinigung.** Der Schnitt ginge in der Praxis
   regelmäßig leer aus und wäre niemandem erklärbar.

9. **Die Rückfrage beim Timerstart antwortet mit `200`, nicht `409`.** Sie ist kein Fehler
   des Aufrufers, sondern der vorgesehene erste Schritt eines zweistufigen Vorgangs. Ein
   `409` liefe in jeder Fehleranzeige auf.

10. **Keine TypeScript-Bauform, die mehr als Typstreichen braucht.** Node führt `.ts` nur
    durch Streichen aus; eine Parametereigenschaft (`constructor(readonly x: T)`) bricht
    mit `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. Das ist mir einmal passiert und ist behoben.
    Für alle, die hier weiterbauen: keine `enum`, keine `namespace`, keine
    Parametereigenschaften — sonst ist der Dienst nicht mehr aus dem Quelltext startbar.

---

Risiken:

1. **`pnpm test:coverage` ist rot, und ich kann es nicht selbst beheben.**
   `packages/storage/src/**` ist von 0 auf 2 600 Zeilen ausführbaren Code gewachsen und hat
   **0 Prozent** Abdeckung; die Schwelle von 80 Prozent greift. Das ist kein Streit über
   die Zahl — es ist der Adapter auf dem Weg zur Abrechnung, und er ist durch meine
   Prüfpfade gefahren, aber nicht durch Unit-Tests. `packages/*/test/**` gehört dem
   unit-tester. Vorschlag für den Zuschnitt steht unter „Nächster Schritt".

2. **`packages/domain/src/**` taucht in der Abdeckungstabelle überhaupt nicht auf** — auch
   nicht bei einem Lauf, der nur `packages/domain/test/` fährt. Die Tabelle ist dann leer.
   Damit ist die 80-Prozent-Schwelle für die Domäne **wirkungslos**, und die 100 Prozent
   aus T-009 sind mit der heutigen Konfiguration nicht reproduzierbar. Das ist **kein
   Befund aus dieser Aufgabe** — ich habe nur eine Datei ergänzt —, aber es ist ein Befund
   über die wichtigste Prüffläche des Projekts. `vitest.config.ts` ist eine Wurzeldatei.

3. **Der Migrationsläufer ist gegen fünf Migrationen gefahren, nicht gegen einen benutzten
   Bestand mit Kundendaten.** Die Rückwärtsrichtung ist geprüft (Abschnitt 8 von
   `proof-export.mjs`), aber auf leerem Bestand. Die Fälle „0002 rückwärts auf benutztem
   Bestand bricht ab" aus `docs/datenmodell.md` 8.5 sind von T-013 von Hand geprüft, nicht
   von meinem Läufer.

4. **Die Reihung der Transaktionen ist eine Serialisierung.** Ein Exportlauf über ein Jahr
   hält die Klammer, solange die Datei geschrieben wird; jede andere Anfrage wartet. Bei
   einem Einbenutzerdienst auf Loopback ist das richtig, aber es ist eine bewusste
   Entscheidung gegen Nebenläufigkeit und keine Nebenwirkung.

5. **Der Aufgabenbereich-Port ist ohne Prüfschicht.** Absicht (E-046: nur statische
   Dateien), aber es heißt: Jeder lokale Prozess kann das Add-in-Bündel lesen. Es enthält
   kein Geheimnis — das Token liegt im `localStorage` der Add-in-Herkunft, nicht im
   Bündel — aber der security-checker soll es wissen und nicht selbst herausfinden.

6. **E-037 lässt sich mit dem heutigen Schema nicht umsetzen.** „Manuelles Markieren als
   exportiert wird protokolliert" verlangt eine `export_audit`-Zeile mit
   `event = 'exported'`; der CHECK dort erzwingt dafür `export_run_id IS NOT NULL` **und**
   `export_run_group_id IS NOT NULL`. Ein manuelles Markieren hat aber keinen Lauf. Die
   OpenAPI-Beschreibung hat das bereits aufgelöst (nur `open` ist setzbar), und die Domäne
   auch (`checkExportStatusTransition` lässt `open -> exported` nur mit `export_run` zu).
   Damit ist E-037 in der Sache **nicht umgesetzt**, und zwar konsistent an drei Stellen.
   Ich habe nichts daran geändert; es ist eine Entscheidung und keine Auslegung.

---

Offene Fragen:

1. **An den integration-dev, über den Orchestrator: die beiden alten Fassungen der
   Plausibilisierung entfernen (E-045).** `apps/local-api/src/routes/addin/call-number.ts`
   und `apps/outlook-addin/src/callnumber/plausibility.ts` durch
   `import { checkCallNumber, mayLookUpDuplicates } from '@takt/domain'` ersetzen. Danach
   entfällt der Wächter in `proof-addin.mjs`, der beide Fassungen gegen dieselbe Tabelle
   fährt. Meine Fassung ist zeichengleich zur Dienstfassung — die 5 000 erzeugten Werte aus
   Abschnitt 2 jenes Nachweispfads müssen danach unverändert grün sein.

2. **An den integration-dev: `.js` auf `.ts` in `packages/export/src`.** Danach entfällt
   der Auflösungshaken in `apps/local-api/src/index.ts` (Annahme 6). Acht Dateien, reine
   Endungsänderung; `pnpm boundaries` prüft dort keine Endungen.

3. **An den unit-tester, über den Orchestrator: Tests für den SQLite-Adapter** (Risiko 1).
   Die Testhilfe gibt es schon — `packages/storage/test/support/migrated-database.ts`. Mein
   Vorschlag für den Zuschnitt, nach fallendem Schaden geordnet:
   * `repo-export.ts`: dass `openGroups` **nur** offene Buchungen liefert; dass `recordRun`
     eine inzwischen exportierte Buchung im Auftrag ablehnt statt sie zu überspringen; dass
     `resetStatus` ohne Protokollzeile nicht möglich ist.
   * `unit-of-work.ts`: dass zwei gleichzeitig gestartete Transaktionen nicht ineinander
     laufen; dass ein Wurf zurücknimmt.
   * `repo-time.ts`: der Partialindex gegen den zweiten Timer; dass `stop` unter der
     Mindestdauer die Zeile löscht statt sie mit Dauer 0 zu schreiben.
   * `repo-tags.ts`: `ancestors`/`subtree` über vier Ebenen; dass `move` einen Zyklus
     ablehnt; dass ein Tag an einem Todo nicht gelöscht wird.
   * `migration-runner.ts`: geänderte Prüfsumme, fehlende Rückwärtsdatei, `database_too_new`.
   * `file-port.ts`: `..` im Dateinamen, Ordner nicht beschreibbar.

4. **An den Orchestrator: `packages/domain` fehlt in der Abdeckung** (Risiko 2).
   `vitest.config.ts` ist eine Wurzeldatei. Solange das so ist, ist die wichtigste
   Prüffläche des Projekts ungemessen.

5. **An den Orchestrator: E-037 ist heute nicht umgesetzt** (Risiko 6). Entweder die
   Entscheidung wird zurückgenommen, oder Schema, Domäne und OpenAPI bekommen einen dritten
   Auslöser `manual` neben `export_run` und `reset`. Beides ist vertretbar; die Umsetzung
   folgt derzeit der zweiten Lesart, ohne dass es jemand entschieden hätte.

6. **An den Orchestrator, zur Kenntnis: `pnpm-lock.yaml` ist um drei Zeilen gewachsen.**
   `@takt/export` als Arbeitsbereichsverweis in `apps/local-api`. Ohne ihn gibt es keinen
   Exportlauf: Der Anwendungsfall braucht `planExportRun`, `serializeExportRows` und
   `validateExportTemplateDefinition`, und die Regel nachzubauen ist zweimal ausdrücklich
   verboten. Installiert wurde offline und ohne Skripte; keine Fremdabhängigkeit kam hinzu.

7. **F-14 ist weiterhin offen** und betrifft jetzt Produktivcode: `WindowsUser` im Export —
   nackter Name oder `DOMAIN\benutzer`? Der Dienst reicht durch, was die Hülle liefert.
   Ändert sich die Antwort, ändert sich eine Zeile in `lib.rs` und keine hier.

---

Nächster Schritt:

1. **T-022, die Oberfläche.** Sie kann anfangen: Alle Routen aus `docs/architektur.md` 5.1
   antworten, das Fehlerformat steht, `pnpm --filter @takt/local-api proof:addin-wiring`
   zeigt an einem laufenden Dienst, wie eine Anfrage aussieht. Zwei Dinge, die dort früh
   zählen: Der Exportstatus ist **zweiwertig** (E-032) — „schon einmal exportiert" ist
   `open` mit `exportCount > 0` und niemals ein Filterwert. Und `/export/runs` liefert im
   Erfolgsfall **auch** die ausgelassenen Gruppen (E-034); sie gehören in die Anzeige,
   sonst merkt niemand, dass etwas offen geblieben ist.
2. **Die Tests für den Adapter** (offene Frage 3). Erst danach ist `pnpm check` als Ganzes
   grün.
3. **Die beiden Aufräumschritte beim integration-dev** (offene Fragen 1 und 2). Beide sind
   klein, beide entfernen jeweils einen Wächter beziehungsweise einen Haken.
4. **Der security-checker kann prüfen.** `apps/local-api/openapi/takt-local-api.yaml` hat
   41 Pfade und 62 Operationen und ist gültiges YAML ohne offene Referenzen. Drei Punkte
   für ihn ausdrücklich: der zweite Port ohne Prüfschicht (Risiko 5), das selbst erzeugte
   Zertifikat samt seiner Ablage, und der Auflösungshaken in `src/index.ts`.
