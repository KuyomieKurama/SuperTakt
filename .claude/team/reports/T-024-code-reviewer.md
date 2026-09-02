Aufgabe: T-024 — Code-Review über den gesamten Produktivcode

Status: braucht Review (Urteil: **Nacharbeit**)

---

Artefakte: ausschließlich diese Datei. Kein Produktivcode geändert.

---

Umfang: 8 Pakete, 146 Quelldateien unter `apps/*/src` und `packages/*/src`, 6 Rust-Dateien,
6 Migrationen, 33 Testdateien. Selbst nachgemessen, nicht aus Berichten übernommen:

```
pnpm typecheck     8 von 8 Paketen ohne Fehler
pnpm boundaries    7 von 7 Typbehauptungen, 247 Dateien auf Tiefenzugriffe, grün
pnpm test          33 Dateien, 545 Fälle, alle grün
grep any / as any / @ts-ignore / Nicht-Null-Zusicherung   0 Treffer
```

---

## Befunde

### hoch

```
packages/storage/src/sqlite/repo-time.ts:66   hoch   Die sechste Doppelung des Kalendertags.
  `date(started_at)` wertet den in UTC gespeicherten Zeitstempel als UTC-Tag aus; E-025 und
  `toCalendarDay` in packages/domain/src/kernel.ts:193 bestimmen den Tag in Ortszeit. Nachgemessen
  mit node:sqlite: `date('2026-08-31T23:30:00Z')` = `2026-08-31`, derselbe Zeitpunkt in
  Europe/Berlin = `2026-09-01`. Jede Buchung, die zwischen 00:00 und 02:00 Ortszeit beginnt, liegt
  für den Filter im Vortag und für den Export im Starttag. `apps/local-api/src/http/input.ts:22`
  sagt selbst „Ein Kalendertag in Ortszeit" — der Vertrag ist verletzt, nicht nur die Absicht.
  Fix: `fromDay`/`toDay` im Anwendungsfall über `toCalendarDay` in UTC-Zeitgrenzen umrechnen
  (Ortszeit 00:00:00 und 23:59:59 des Tages) und `started_at >= ? AND started_at <= ?`
  lexikographisch vergleichen. Dann gibt es weiterhin genau eine Fassung der Regel. Kein Testfall
  deckt das ab: `packages/storage/test/repo-time.test.ts:132` prüft nur Zeitpunkte fern von
  Mitternacht.

packages/storage/src/sqlite/repo-time.ts:70   hoch   Dieselbe Regel, zweite Stelle. Fix wie oben.

apps/web/src/screens/ExportScreen.tsx:365   hoch   `.catch(() => { if (live) setTotals(null); })`
  verschluckt den Fehlschlag der Gesamtvorschau vollständig — ohne Meldung, ohne Toast, ohne
  Sperre. Folge in Zeile 867: der Bestätigungsdialog vor dem Lauf sagt dann „N Buchungen werden in
  **0 Exportzeilen** geschrieben — zusammen — Stunden", und in Zeile 492 meldet die
  Erfolgsmeldung dieselbe 0. Der Benutzer bestätigt einen unumkehrbaren, geldwirksamen
  Schreibvorgang gegen eine Zahl, die falsch und nicht bloß fehlend ist (A-8.6). Fix: wie die
  beiden Effekte darüber (Zeile 262, 322) einen `totalsError` setzen, ihn anzeigen und die
  Schaltfläche „Export ausführen" sperren, solange er steht.

packages/export/src/render.ts:146   hoch   Dateihoheit. `packages/export/**` gehört laut
  CLAUDE.md dem integration-dev; der Bericht T-034-domain-dev.md führt `packages/export/src/render.ts`
  und `packages/export/src/template.ts` in seiner Artefaktliste, und die Änderungen stehen im Code
  (`Object.create(null)` mit „B-3.2, T-034"). Fix: keine Codeänderung — der Orchestrator muss die
  Zuständigkeit klären und den integration-dev die beiden Dateien nachprüfen lassen, bevor
  freigegeben wird.

packages/export/src/template.ts:95   hoch   Dieselbe Dateihoheitsverletzung, zweite Datei
  (Zeichenvorrat, Sperrliste, Abgleich auf doppelte Namen aus T-034).
```

### mittel

```
apps/web/src/app/dayGroup.ts:64   mittel   Blankes `catch {}` um `previewExport`. Der Kommentar
  nennt „ohne Vorlage oder ohne Exportordner" als Grund, aber `previewExport` prüft den
  Exportordner gar nicht, und der Zweig fängt zusätzlich Netzabbruch, 500 und
  `export_template_invalid`. Der Benutzer sieht danach die ungerundete Zeit und keinen Hinweis,
  dass der gerundete Wert nicht ermittelt werden konnte. Fix: nur die bekannten fachlichen
  Schlüssel (`not_found`, `export_nothing_to_do`) stillschweigend behandeln, alles andere als
  Fehlschlag zurückgeben und in `TimerContext.reportStopped` als Warnung zeigen.

apps/web/src/screens/TimeScreen.tsx:84   mittel   Gleiches blankes `catch { quarters = null }`.
  Zusätzlich betroffen von dem Kalendertag-Befund oben: `todayCalendarDay()` (Zeile 62) ist der
  Ortstag, der Dienst filtert den UTC-Tag. Fix wie oben.

apps/web/src/screens/DashboardScreen.tsx:86   mittel   Dieselbe Stelle im Dashboard (Zeile 61
  `todayCalendarDay()`). Fix wie oben.

packages/storage/src/sqlite/file-port.ts:228   mittel   `removeFile` verschluckt jeden Fehlschlag
  (`rm(...).catch(() => undefined)`). Der Kopfkommentar von `usecases/export.ts` verspricht
  ausdrücklich: „Sonst läge im Ordner eine Abrechnung, die es nach der Datenbank nie gegeben hat."
  Genau diese Zusicherung ist nicht durchgesetzt — scheitert das Entfernen, bleibt eine gültig
  aussehende Exportdatei liegen, während die Buchungen offen bleiben und beim nächsten Lauf ein
  zweites Mal in die Abrechnung gehen. Fix: `Promise<boolean>` zurückgeben; `runExport` meldet den
  Rest über `runtime.notices` und ergänzt die Fehlermeldung um „Bitte die Datei X im Exportordner
  von Hand entfernen".

apps/local-api/src/http/input.ts:88   mittel   `readPagination` gibt bei jedem Schemafehlschlag
  `{}` zurück und wirft damit **beide** Werte weg. `?cursor=<gültig>&limit=500` verliert die
  Fortsetzungsmarke, weil `limit` an `max(200)` scheitert — die Blätterung springt still auf Seite
  eins zurück, und ein Client, der weiterblättert, bekommt dieselben Zeilen erneut. Fix: die
  beiden Felder einzeln prüfen, oder bei Fehlschlag über `failValidation` antworten statt still
  auf Vorgaben zurückzufallen.

apps/local-api/src/routes/time.ts:117   mittel   `query['exportStatus'] as ExportStatus` ohne
  Prüfung. E-032 verlangt, dass jeder Filter genau zwei Werte kennt; `?exportStatus=offen` läuft
  ungeprüft in die WHERE-Klausel und liefert eine leere Liste, die aussieht wie „nichts offen".
  Der Kopf derselben Datei sagt: „Ein Typ am Rand ist eine Behauptung, keine Prüfung." Fix:
  `z.enum(['open','exported']).safeParse(...)` und `failValidation` bei Fehlschlag; gleiches für
  `todoId` in Zeile 114.

apps/local-api/src/routes/time.ts:118   mittel   `daySchema.parse(...)` statt `safeParse`. Ein
  ungültiges `?fromDay=gestern` wirft eine ZodError, landet in `app.onError` und ergibt **500
  internal_error** statt 422 — ein Serverfehler für eine fehlerhafte Eingabe, genau das, was
  `readJson` in derselben Datei ausdrücklich vermeidet. Betrifft Zeile 118 und 119. Fix:
  `safeParse` plus `failValidation`.

apps/local-api/src/usecases/todos.ts:301   mittel   Die globale Suche über Leistungstexte (E-038)
  liest `unit.timeEntries.search({}, { limit: 200 })` und filtert in JavaScript. Die Sortierung ist
  `started_at DESC` — gesucht wird also nur in den 200 jüngsten Buchungen, und die Antwort trägt
  weder `nextCursor` noch `total` für diesen Teil. „Wann habe ich das letzte Mal etwas zur
  Schnittstelle geschrieben" — die Frage, mit der E-038 begründet ist — antwortet ab der 201.
  Buchung still mit „nichts gefunden". Fix: den Filter in SQL ziehen (`note LIKE ?` in
  `filterConditions`) und die Blätterung des Aufrufers durchreichen.

apps/local-api/src/routes/structure.ts:232   mittel   `updatePool(context, id, parsed.data as never)`.
  `as never` ist auf jeden Zieltyp zuweisbar und schaltet die Prüfung vollständig ab: Kommt ein
  Feld in `poolUpdateSchema` dazu, das `PoolInput` nicht kennt, sagt der Übersetzer nichts. Überall
  sonst im Dienst steht dafür das Muster `...(x === undefined ? {} : { x })`. Fix: dasselbe Muster,
  dann trägt `exactOptionalPropertyTypes` wieder.

apps/local-api/src/routes/structure.ts:222   mittel   `rule: parsed.data.rule as never` verdeckt
  die fehlende Markierung von `TagId`/`TagFolderId`. Fix: `as PoolRuleTerm[]` wie die
  Nachbarzeilen, oder besser eine Abbildung, die die Kennungen ausgeschrieben markiert.

apps/local-api/src/routes/todos.ts:103   mittel   `poolIds.split(',') as never`. Gleicher Befund,
  gleicher Fix (`as PoolId[]`).

packages/export/src/template.ts:84   mittel   Der Kommentar über `RESERVED_FIELD_NAMES` behauptet:
  „Sie sind bereits durch FIELD_NAME_PATTERN ausgeschlossen". Das ist falsch — nachgemessen:
  `/^[A-Za-z0-9_-]{1,64}$/` trifft auf `__proto__`, `constructor` und `prototype` **alle drei** zu.
  Die Sperrliste ist damit nicht die zweite Schicht, sondern die einzige. Wer den Kommentar glaubt
  und die Liste entfernt, öffnet B-3.2 wieder — und der gemessene Schaden steht drei Zeilen
  darüber. Fix: den Satz in „Sie halten dem Zeichenvorrat stand und werden deshalb hier
  ausdrücklich abgewiesen" ändern.

packages/export/src/template.ts:55   mittel   `KNOWN_OPERATORS` ist ein handgeschriebenes
  `Set<string>` und hängt nicht an `ExportConditionOperator`. Die veröffentlichte Liste in
  `apps/local-api/src/usecases/export-catalog.ts:249` hängt dagegen an einem `Record` über
  denselben Typ. Beide können auseinanderlaufen: Der Dienst böte einen Vergleich zur Auswahl an,
  den `template.ts` beim Speichern abweist. Das ist die Restdoppelung, die E-049 offen gelassen hat
  — `export-catalog.ts:246` nennt sie selbst als „gewünschten Nachtrag". Fix:
  `EXPORT_CONDITION_OPERATORS` aus `Record<ExportConditionOperator, true>` ableiten und exportieren,
  wie `EXPORT_TRANSFORMATIONS` es vormacht; `KNOWN_OPERATORS` daraus bauen.

apps/local-api/src/usecases/export.ts:328   mittel   Der **Lauf** ruft
  `validateExportTemplateDefinition` unmittelbar auf und baut in Zeile 330 mit
  `taktError(code, message)` einen Fehler ohne `details`. Die **Vorschau** benutzt seit T-030
  `checkTemplateDefinition`, das `details` erhält — der Kopfkommentar dieser Datei beschreibt genau
  diesen Verlust als behoben. Er ist im Laufpfad noch da: dieselbe kaputte Vorlage meldet in der
  Vorschau das betroffene Feld und beim Lauf nicht. Fix: `checkTemplateDefinition(template.value.definition)`
  auch hier.

apps/local-api/src/main.ts:132   mittel   Der Migrationsfehlschlag verwirft die Ursache
  vollständig (`} catch {`) und beendet mit `process.exit(78)`. Das ist der Fehlschlag, nach dem
  der Dienst ausdrücklich nicht startet — und niemand kann feststellen warum. B-2.4 verbietet
  Innenleben in einer **Antwort**, nicht in `stderr`, und der Logger schwärzt seine Zeilen ohnehin
  über `redactSecrets`. Fix: `logger.lifecycle('error', ...)` um eine unterscheidende Größe
  ergänzen (`error instanceof Error ? error.name : 'unbekannt'` und die Fassungsnummer, auf der
  abgebrochen wurde).

apps/local-api/src/app.ts:247   mittel   `app.onError` protokolliert nur Methode und Pfad; das
  Ausnahmeobjekt wird nirgends festgehalten. Jeder 500 im ganzen Dienst ist damit
  ununterscheidbar — ein Programmierfehler in `toGroupRecords`, ein SQLITE_BUSY und eine kaputte
  Vorlage ergeben dieselbe Zeile. Fix wie oben: `error.name` (keine Meldung, kein Stapel) in die
  Protokollzeile aufnehmen.

apps/web/src/app/StructureContext.tsx:156   mittel   `poolsContaining` beantwortet „in welchen
  Pools ist dieses Todo" ein zweites Mal und anders als der Dienst: Es holt je Pool die Todo-Liste
  und sucht die Kennung darin, gedeckelt auf `pools.slice(0, 12)` und `limit: 200`, mit
  `catch { return null }` je Pool. Der Dienst beantwortet dieselbe Frage in
  `routes/addin/service.ts:117` über `matchesPool` aus `packages/domain`. Die Oberfläche nennt
  danach in der A-2.5-Meldung womöglich zu wenige Pools und sagt nicht, dass sie abgeschnitten hat.
  Fix: eine Route, die `matchesPool` für ein Todo auswertet — dieselbe Auskunft, die das Add-in
  schon bekommt — statt der Rekonstruktion in der Oberfläche.

packages/storage/src/sqlite/repo-tags.ts:88   mittel   `err(outcome.error as never)` verengt
  einen allgemeinen `TaktError` auf die im Port versprochene Untermenge. `TagPort.create` verspricht
  `TaktError<'name_conflict'>` (packages/storage/src/ports.ts:188), `attempt` kann aber
  `validation_error` (CHECK), `conflict` (RESTRICT) oder `storage_error` liefern. Der deklarierte
  Fehlertyp lügt; ein Aufrufer, der erschöpfend über die Untermenge verzweigt, fällt durch. 20
  Fundstellen in repo-tags, repo-time, repo-statuses, repo-settings, repo-export. Zwei Zeilen
  weiter (repo-tags.ts:110) steht dasselbe **ohne** `as never` — die Zusicherung ist also nicht
  einmal einheitlich. Fix: die Portsignaturen auf den tatsächlich möglichen `TaktError` weiten und
  die 20 Zusicherungen entfernen; die Verengung dort vornehmen, wo sie belegbar ist.
```

### niedrig

```
apps/web/src/app/TimerContext.tsx:48   niedrig   Stehengebliebener Kommentar: „Die Beschreibung
  nennt das Feld `noteForRunning`". T-039 hat es aus `takt-local-api.yaml:1360ff` entfernt und dort
  ausgeschrieben, dass der verdrängte Timer ohne Leistung gebucht wird. Der Satz „Sobald der Dienst
  das Feld annimmt, wird daraus wieder ein Aufruf" beschreibt einen Weg, den es nicht mehr gibt.
  Fix: auf „der Dienst nimmt bewusst keine Leistung entgegen (T-039); deshalb zwei Schritte"
  umschreiben.

apps/local-api/src/routes/addin/service.ts:257   niedrig   „Solange der Adapter aus T-009 fehlt,
  ist das eine offene Frage" — der Adapter existiert, und `packages/storage/src/ports.ts:135`
  beantwortet die Frage ausdrücklich („Der Adapter schreibt das zweite Argument"). Fix: den Absatz
  auf die Antwort kürzen.

apps/local-api/src/usecases/timer.ts:239   niedrig   `void timestamp;` — `now(context)` wird in
  Zeile 208 gelesen und im Erfolgszweig weggeworfen. Eine Uhrabfrage, deren Ergebnis niemand
  benutzt, sieht aus wie ein vergessener Parameter. Fix: `timestamp` nur in den Zweigen holen, die
  ihn brauchen, oder ganz entfernen.

packages/storage/src/sqlite/file-port.ts:247   niedrig   `sweepTemporaryFiles` zählt Versuche,
  nicht Entfernungen: `rm(...).catch(() => undefined)` schluckt den Fehlschlag, `removed += 1`
  läuft trotzdem. Die Meldung in main.ts:174 („N unvollständige Exportdateien entfernt") kann
  damit Dateien melden, die noch da liegen — und die enthalten Kundendaten (R-05). Fix: nur bei
  erfolgreichem `rm` zählen.

packages/storage/src/sqlite/repo-time.ts:286   niedrig   Der Stopp des laufenden Timers innerhalb
  von `start` läuft nicht durch `attempt()`, anders als jeder andere Schreibvorgang der Datei.
  Löst ein Trigger `time_entry_locked` aus, kommt die rohe SQLite-Meldung als Wurf heraus und wird
  zu 500 statt zu 409. Betrifft auch das `DELETE` in Zeile 292. Fix: beide in `attempt()` klammern
  wie die Zeilen 306 und 344.

apps/local-api/scripts/_explore.mjs:1   niedrig   Acht Erkundungsskripte (`_explore.mjs` bis
  `_explore8.mjs`, 185 Zeilen) liegen im Produktivbaum, von keinem `package.json`-Eintrag
  aufgerufen und nicht in `.gitignore`. Repository-Hygiene. Fix: löschen.
```

---

## Was ich geprüft und in Ordnung gefunden habe

Nur als Abgrenzung, damit erkennbar ist, worauf sich das Urteil nicht bezieht — keine Wertung.

- **Rundung.** Einzige Fassung in `packages/domain/src/rounding.ts`. `packages/export/src/sources.ts:120`
  ruft sie auf, `apps/web/src/lib/format.ts:132` teilt nur zur Anzeige durch vier und rundet nicht.
  Kein zweiter `Math.ceil` auf Sekunden im Baum.
- **Base64.** Einzige Fassung in `packages/export/src/base64.ts`. Kein `btoa`, kein
  `Buffer.toString('base64')` im Exportpfad außerhalb davon.
- **Call-Nummer.** Eine Fassung in `packages/domain/src/call-number.ts`, aufgerufen von
  `outlook-addin/src/callnumber/detect.ts:105`, `duplicate/rule.ts:48`, `ui/SettingsView.tsx:147`
  und `routes/addin/service.ts:168`. Die Zweitschrift aus T-019 ist weg, der Wächter mit ihr.
- **Quellenliste.** `export-catalog.ts` läuft über `EXPORT_SOURCE_PATHS` statt neben ihr her;
  `exportTemplateModel.ts` kennt seit E-049 keine Quelle mehr beim Namen. Die Doppelung ist echt
  aufgelöst, nicht verschoben — mit der einen Ausnahme der Vergleichsoperatoren oben.
- **Notiz-Trennung, alle fünf Schichten.** Die Typbehauptungen stehen (7 von 7, vom Wächter
  gezählt), `packages/domain/src/export.ts` importiert nur `kernel` und `rounding`, die
  `exports`-Tabelle hat keinen Platzhalter, `v_export_candidate` führt `todo_note.body` nicht, und
  keine Abfrage in `repo-todos.ts` verbindet die beiden Tabellen. Die vom frontend-dev in T-035
  gemeldete Abschwächung (`looksLikeNoteSource` hängt an der Antwort statt am Übersetzer) ist der
  einzige Fall dieser Art, den ich gefunden habe; er ist begründet und der Schaden bliebe eine
  fehlende Auswahl. Der zweite Kandidat, `RESERVED_FIELD_NAMES`, ist der umgekehrte Fall und oben
  als Befund geführt: eine Schicht, die weniger überflüssig ist, als ihr Kommentar behauptet.
- **Transaktionsgrenzen.** `unit-of-work.ts` reiht über eine Warteschlange, der
  Verschachtelungswächter steht über `AsyncLocalStorage` **vor** der Reihung — die Verklemmung aus
  T-027 kann so nicht wiederkehren, und der Wächter weist die zulässige nebenläufige Anfrage nicht
  ab. `recordRun` setzt Status und Protokollzeile in derselben Schleife und prüft `changes === 1`.
  `runExport` schreibt die Datei vor der Markierung und wirft jeden fachlichen Fehlschlag als
  `AbortExport`, damit die Klammer zurücknimmt. Die Reihenfolge ist richtig herum: eine Datei ohne
  Markierung ist auffindbar, eine Markierung ohne Datei wäre es nicht.
- **Typsicherheit.** Kein `any`, kein `@ts-ignore`, keine Nicht-Null-Zusicherung im ganzen Baum.
  Die 60 Markierungszusicherungen an den Routen (`as TodoId` und Verwandte) sind das übliche
  Muster am HTTP-Rand und stehen hinter einem zod-Schema — bis auf die oben genannten Ausnahmen.
- **Sprache.** Oberflächentexte deutsch, Bezeichner englisch, Kommentare deutsch. Kein deutscher
  Bezeichner und kein englischer Oberflächentext gefunden.
- **Dateihoheit** im Übrigen: die Artefaktlisten der 22 Berichte gegen die Tabelle in `CLAUDE.md`
  gehalten. Außer T-034 keine Überschreitung. `apps/desktop/src/shell.ts` durch den frontend-dev
  (T-040) und `docs/datenmodell.md` durch den domain-dev (T-034) sind gedeckt.

---

## Urteil

**Nacharbeit.**

Blockierend sind vier Befunde:

1. `packages/storage/src/sqlite/repo-time.ts:66` und `:70` — der Kalendertag existiert zum
   sechsten Mal doppelt, in zwei Fassungen, die sich jede Nacht zwischen 00:00 und 02:00 Ortszeit
   widersprechen. Die Folge steht dem Benutzer unmittelbar nach dem Timer-Stopp auf dem Bildschirm
   („das ergibt beim Export 0,75") und ist dann falsch, weil `previewExport` die vom UTC-Tag
   ausgewählte Menge in zwei Ortstage regruppiert und deren Summe als eine ausgibt. Kein Test
   deckt es ab. Das ist genau die Sorte Befund, gegen die dieses Projekt fünfmal angetreten ist.

2. `apps/web/src/screens/ExportScreen.tsx:365` — der Bestätigungsdialog vor dem Exportlauf nennt
   nach einem verschluckten Fehlschlag „0 Exportzeilen" und „— Stunden", und der Lauf ist trotzdem
   auslösbar. A-8.6 verlangt, dass deutlich dargestellt wird, welche Zeiten exportiert werden; hier
   wird eine falsche Zahl dargestellt, nicht eine fehlende.

3. `packages/export/src/render.ts` und `packages/export/src/template.ts` — Dateihoheit. Der
   domain-dev hat in T-034 in Dateien des integration-dev geschrieben. Die Änderungen selbst sind
   fachlich richtig und ich würde sie nicht zurückdrehen; blockierend ist die Regel, nicht die
   Qualität. Der Orchestrator entscheidet, der integration-dev bestätigt.

Die übrigen 16 Befunde mittlerer Schwere und 6 niedriger Schwere blockieren nicht, gehören aber
vor die Dokumentation — insbesondere `file-port.ts:228`, `usecases/export.ts:328` und
`usecases/todos.ts:301`, weil das Handbuch sonst Verhalten beschreibt, das der Code nicht zeigt.

---

Annahmen: Dass `date()` in SQLite den UTC-Tag liefert, habe ich gegen `node:sqlite` gemessen und
nicht angenommen. Dass die beiden Dateien in `packages/export` wirklich vom domain-dev stammen,
habe ich aus der Artefaktliste in T-034 **und** aus den Verweisen „T-034" im Quelltext geschlossen;
eine Git-Historie gibt es nicht (kein Commit im Arbeitsbereich).

Risiken: Der Kalendertag-Befund berührt `repo-time.ts` (domain-dev) und die drei Bildschirme in
`apps/web` (frontend-dev). Beide Seiten müssen in derselben Welle laufen, sonst zeigt die
Oberfläche kurzzeitig gegen den alten Filter.

Offene Fragen an den Orchestrator:
1. Der Kalendertag-Befund ist eine Verhaltensänderung an einer Abfrage, die 19 Orte mit
   Exportstatus speist. Reicht der Fix im Adapter, oder soll die Tagesgrenze eine eigene Funktion
   in `packages/domain` bekommen (`dayBoundsUtc(day, timeZone)`), damit sie auch dann nur einmal
   existiert, wenn ein zweiter Adapter dazukommt?
2. T-034: Änderung stehen lassen und nur nachprüfen lassen, oder zurückdrehen und vom
   integration-dev neu schreiben lassen?

Nächster Schritt: Eine Nacharbeitswelle mit drei Aufgaben — domain-dev für die Tagesgrenze und die
Randbefunde im Dienst, frontend-dev für `ExportScreen.tsx:365` und die drei blanken `catch`,
integration-dev für die Bestätigung der beiden Dateien in `packages/export` und den Nachtrag
`EXPORT_CONDITION_OPERATORS`. Danach ein Testnachzug beim unit-tester: ein Fall mit einer Buchung
um 01:30 Ortszeit, der heute rot wäre.
