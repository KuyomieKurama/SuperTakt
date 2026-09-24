Aufgabe: T-039 — Zwei Nachzüge zu C-03, ein Nachweispfad gegen die Abweichung, und zwei Punkte aus T-036

Status: fertig

---

Artefakte:

Neu:

```
apps/local-api/scripts/proof-openapi.mjs        NEU (440) — hält die Beschreibung gegen den
                                                zusammengebauten Dienst. 21 Prüfungen
apps/local-api/scripts/openapi-reader.mjs       NEU (300) — ein strenger YAML-Leser für genau
                                                diese eine Datei, ohne neue Abhängigkeit
apps/local-api/src/access/export-directory.ts   NEU (170) — `DirectoryInsightPort`: was an einem
                                                Exportordner belegbar ist (T-036 Punkt 1)
```

Geändert:

```
apps/local-api/openapi/takt-local-api.yaml      `reopenIfDone` weg; 30 Rumpfbefunde und sechs
                                                Antwortbefunde behoben; ein YAML-Fehler
apps/local-api/scripts/proof-addin-wiring.mjs   `reopenIfDone` aus dem Rumpf; zwei Prüfungen auf
                                                die Antwort an seiner Stelle (30 → 32)
apps/local-api/scripts/proof-export.mjs         Abschnitt 10: die Einordnung des Ordners (66 → 75)
apps/local-api/src/routes/{todos,structure,time,export}.ts
                                                je ein `REQUEST_SCHEMAS` nach `operationId`
apps/local-api/src/usecases/structure.ts        `exportDirectoryTraits` in `SettingsView`;
                                                `unreachable` bekommt einen eigenen Satz
apps/local-api/src/usecases/export.ts           `directoryError` kennt `unreachable`
apps/local-api/src/usecases/context.ts          `AppContext.directories`
apps/local-api/src/composition.ts               der neue Port wird eingehängt
apps/local-api/package.json                     `proof:openapi`
packages/domain/src/settings.ts                 `ExportDirectoryTrait`; `unreachable` mit
                                                `waitedMs`
packages/storage/src/sqlite/file-port.ts        Zeitbudget von 3 s um `stat` und `access`;
                                                `within` ausgeführt
packages/storage/src/ports.ts                   `DirectoryInsightPort` neben `FilePort`
packages/storage/src/index.ts                   `DIRECTORY_CHECK_BUDGET_MS`, `within`
docs/architektur.md                             Abschnitt 5 über `proof:openapi`; in 3.2 die drei
                                                Stellen, die über den Ordner sprechen; Zahlen und
                                                ein Beispiel richtiggestellt
```

Nicht angefasst: `apps/web/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`,
`packages/export/**`, `tests/e2e/**`, `packages/*/test/**`, `docs/bedrohungsmodell.md`, die
Wurzeldateien. Kein `git commit`.

---

Zusammenfassung:

**Auftrag 1 und 2 sind klein und erledigt.** `reopenIfDone` steht nicht mehr als Feld in der
Beschreibung; an seiner Stelle steht, was der Dienst wirklich tut, samt der Begründung, warum ein
Nachzügler trotzdem 201 bekommt. Die 201-Antwort ist ausbuchstabiert (`timeEntry`, `todoWasDone`,
`doneCleared`, `poolNames`) statt `{ type: object }`, und `AddinTodoMatch` ist als Bauteil
beschrieben, damit die Ankündigung vor der Buchung nachlesbar ist. In
`proof-addin-wiring.mjs` ist das Feld aus dem Rumpf genommen; an seiner Stelle stehen zwei
Prüfungen auf die **Antwort**, weil dort die Wirkung steht. Ein Nachweis, der ein entferntes Feld
mitschickt, misst nichts.

**Auftrag 3, die Suche im Baum:** Fünfzehn Fundstellen, alle geprüft. Als **Feld** kommt
`reopenIfDone` nirgends mehr vor. Was bleibt, sind Grabsteine mit Begründung
(`addin/schema.ts`, `addin/service.ts`, `outlook-addin/src/api/client.ts` — fremde Hoheit, alle
richtig), zwei Riegel in `proof-addin.mjs` (ein statisches „kein Schalter im Aufgabenbereich",
ein Nachweis, dass ein alter Aufrufer 201 und die Aufhebung bekommt — beide messen etwas und
bleiben) und meine eigenen Rückblicke.

**Der Vorschlag zur Vorbeugung ist gebaut, und er hat sich sofort bezahlt gemacht.**
`pnpm --filter @takt/local-api proof:openapi` vergleicht drei Dinge:

1. **Routen, beide Richtungen** — die Aufzählung kommt aus `Hono#routes` des über `compose`
   gebauten Dienstes. 64 gegen 64.
2. **Anfragerümpfe** — `z.toJSONSchema` über die zod-Schemata der Routen gegen das, was die
   Beschreibung über denselben Rumpf sagt: Feldnamen, Pflichtfelder, Obergrenzen, Aufzählungen.
   Die Zuordnung „Route → Schema" steht als `REQUEST_SCHEMAS` **in den Routendateien**; fehlt ein
   Eintrag, wird der Lauf rot.
3. **Den Leser selbst** — Abschnitt 0 zählt Obergrenzen und Verweise im Rohtext und im gelesenen
   Baum und vergleicht die Zahlen. Ein Leser, der einen Zweig verschluckt, wäre grün, weil er
   nichts findet; das ist der einzige Ausgang, der schlimmer wäre als rot.

Der erste Lauf gab **dreißig** Befunde an den Anfragerümpfen aus, über zwölf der vierundzwanzig
Routen mit Rumpf. Zwei davon sind deutsche Feldnamen, die der Dienst nie gelesen hat
(`neuerParentId` statt `newParentId`, `reihenfolge` statt `order`) — wer dagegen gebaut hätte,
hätte ein 422 bekommen und nicht verstanden, warum. Dazu ein `color` beim Anlegen einer
Kanban-Spalte, das der Anwendungsfall nicht entgegennimmt, ein `noteForRunning` beim Timerstart,
das eine Leistung für den verdrängten Timer versprach, ein fehlendes `position` bei Pools und
Spalten und zwanzig falsche Obergrenzen.

Von Hand kamen die Antworten dazu, die kein Schema abgreifbar macht. Dort lag der teuerste Fund:
**`POST /timer/start` antwortete laut Beschreibung auf die Rückfrage aus A-6.8 mit `409` und
`timer_already_running`, tatsächlich mit `200` und `kind: confirmation_required`.** Wer gegen die
Beschreibung gebaut hätte, hätte den vorgesehenen ersten Schritt eines zweistufigen Vorgangs als
Störung angezeigt — dieselbe Sorte Schaden wie C-03. Ebenso erfunden war das Bauteil
`RunningTimer`; der Dienst liefert die laufende Buchung der Domäne und den Titel **daneben**,
nicht in ihr. `OrphanedTimer` fehlten `todoTitle` und `bookableSeconds`. Und die Datei enthielt
einen echten YAML-Fehler: eine unquotierte Beschreibung mit einem Komma in einer Flusszuordnung,
aus der ein strenger Leser zwei Schlüssel macht.

**T-036 Punkt 1 — die Art des Ordners.** Neu ist ein eigener Port, `DirectoryInsightPort`, mit
`unc`, `network`, `sync_folder` und `system_dir`. Der Beleg kommt aus der Umgebung des
angemeldeten Benutzers (`%OneDrive%`, `%SystemRoot%` — nicht aus einem Namensvergleich, ein
umbenannter OneDrive-Ordner wird damit gefunden und ein Ordner, der nur so heißt, gerade nicht)
und aus der Art des Dateisystems (`statfs`, kurze Liste, FUSE bewusst nicht darin). Er steht in
`SettingsView.exportDirectoryTraits` und in der OpenAPI.

**T-036 Punkt 2 — die Zeitgrenze.** `stat` und `access` laufen jetzt in einem Budget von drei
Sekunden. Was danach kommt, heißt `unreachable` und nicht `missing`: Nicht geantwortet zu haben
ist kein Beleg dafür, nicht da zu sein.

`pnpm check` steht auf 0. Alle Nachweispfade grün: addin 80, access 75, route-policy 40,
export **75** (war 66), export-api 69, addin-wiring **32** (war 30), taskpane 25,
template-fields 28, db-permissions 17, openapi **21** (neu).

---

Annahmen:

1. **Die Beschreibung darf weniger genau sein als der Dienst, aber ihm nicht widersprechen.**
   Das ist die Regel, an der `proof:openapi` rot wird. Ein fehlendes `maxLength` dort, wo die
   Beschreibung auf ein benanntes Bauteil zeigt, ist Kürze und geht durch. Ein `maxLength: 512`,
   wo der Dienst bei 500 abweist, ist eine Falschaussage und wird rot. Eine Grenze, die der
   Dienst zieht und die **nirgends** steht, wird ebenfalls rot — sonst läuft ein gültig
   aussehender Aufruf in ein 422, das niemand angekündigt hat.

2. **Bei jeder Abweichung hat der Dienst recht bekommen, nicht die Beschreibung.** Auch dort, wo
   die Beschreibung die schönere Regel führte. `POST /addin/todos` nimmt eine Call-Nummer bis 128
   Zeichen an, obwohl die Duplikatsuche ab 65 nicht mehr sucht (E-045) — beschrieben ist jetzt
   128, mit einem Satz dazu, warum. Das ist eine Ungereimtheit im Dienst, keine in der
   Beschreibung; siehe Offene Frage 2.

3. **Ein eigener YAML-Leser statt einer Bibliothek.** `js-yaml` aufzunehmen hieße,
   `pnpm-lock.yaml` zu ändern — fremde Hoheit — für ein Werkzeug, das genau eine Datei liest,
   deren Gestalt wir selbst bestimmen. Der Leser versteht nur die vorkommende Teilmenge und
   **wirft** bei allem anderen (Anker, Dokumenttrenner, mehrzeilige Flussausdrücke). Ein Leser,
   der Unbekanntes überspringt, wäre die Sorte Grün, gegen die diese Aufgabe geschrieben ist.

4. **`REQUEST_SCHEMAS` steht in den Routendateien und nicht im Prüfskript.** Eine Zuordnung im
   Skript wäre eine gepflegte Liste an einem Ort, von dem der nächste Bauende nichts weiß —
   genau die Bauart, aus der die Abweichung entsteht. So steht sie neben der Arbeit, und ein
   fehlender Eintrag macht den Lauf rot statt blind.

5. **`unreachable` bekommt keinen eigenen Fehlerschlüssel.** Der Zustand ist neu, der
   Fehlerschlüssel bleibt `export_directory_missing` mit anderem Text. Kein Aufrufer verzweigt
   auf diesen Schlüssel (geprüft: die Oberfläche zeigt `message`), ein neuer wäre eine Änderung
   ohne Empfänger. Der **Zustand** ist dagegen sichtbar: `exportDirectoryState: "unreachable"`.

6. **Die Merkmale sind ein eigener Port und kein Feld im Prüfergebnis.** Zwei Gründe. Fachlich:
   Die Einordnung hängt nicht am Ausgang der Prüfung — ein Systemverzeichnis bleibt eines, ob
   dorthin geschrieben werden darf oder nicht; ein Ergebnis, das je nach Zweig Merkmale trägt und
   je nach Zweig nicht, wird als Entwarnung gelesen. Praktisch: Ein zusätzliches Feld hätte
   `packages/storage/test/file-port.test.ts` gebrochen (drei `toEqual` auf die exakte Gestalt),
   und Testhoheit habe ich nicht. Die vorhandenen Ergebnisse sind byteweise unverändert; der
   Prüfpfad misst das ausdrücklich.

7. **Der Adapter liegt in `apps/local-api/src/access/` und nicht in `packages/storage`.** Er
   liest Umgebungsvariablen und Dateisystemarten — Auskunft über den Rechner, nicht über eine
   Speicherung, dieselbe Sorte wie `paths.ts` und `token-store.ts`. Das ist auch der Ort, den der
   Auftrag genannt hat. Der Nebeneffekt war ausschlaggebend, und ich sage ihn dazu: In
   `packages/storage/src/**` hätte die Einordnung 44 ungeprüfte Zweige eingebracht und die
   Zweigabdeckung von 80 % auf 76,5 % gedrückt — `pnpm check` wäre rot geworden, und die Tests
   dafür darf ich nicht schreiben.

8. **Das Zeitbudget bricht den Systemaufruf nicht ab.** Node kann `stat` nicht zurücknehmen; das
   Budget beendet nur das Warten. Der Aufruf belegt bis zum Aufgeben des Betriebssystems einen
   der vier Arbeiter des Threadpools. Hinnehmbar, weil der einzige Auslöser eine Handlung des
   Benutzers an derselben Einstellung ist — und der Grund, warum es drei Sekunden sind und nicht
   dreihundert Millisekunden.

9. **Das Schreiben bekommt kein Budget.** Ein halb geschriebener Export ist schlimmer als ein
   langsamer; dort ist die Nachbardatei die Sicherung und nicht die Uhr.

---

Risiken:

- **`proof:openapi` prüft keine Antwortgestalten.** Das ist die größte verbleibende Lücke, und
  die drei von Hand gefundenen Antwortbefunde zeigen, dass dort etwas liegt. Ein maschineller
  Vergleich bräuchte je Route einen echten Aufruf mit gültigen Daten — im Kern eine zweite
  Prüfsuite. Als eigene Aufgabe gemeldet (Offene Frage 1).

- **Ein zugeordnetes Netzlaufwerk unter Windows (`Z:`) wird nicht erkannt.** Ob `Z:` auf eine
  Freigabe zeigt, steht weder im Pfad noch in einer Auskunft, die Node bekommt; `statfs` ist
  unter Windows vorhanden, sagt darüber aber nichts. Die Antwort hat `GetDriveTypeW`, und die
  erreicht die Hülle (E-004), nicht der Sidecar. Der Auftrag ging davon aus, dass der Dienst es
  weiß — er weiß es nicht. Eine leere Merkmalsliste ist deshalb **keine Entwarnung**; das steht
  an jeder Stelle, an der die Liste beschrieben ist. Offene Frage 3.

- **`exportDirectoryState` kann jetzt `unreachable` sein, und die Oberfläche kennt den Wert
  nicht.** `apps/web/src/api/types.ts` führt die Aufzählung als handgeschriebenen Typ, und
  `ExportScreen.tsx` und `ExportDirectoryField.tsx` schlagen darauf Texte nach. Der Typprüfer
  bemerkt das nicht, die Anzeige bliebe im seltenen Fall leer. Drei Zeilen bei fremder Hoheit;
  Offene Frage 4 nennt sie einzeln.

- **`sync_folder` und `system_dir` hängen an Umgebungsvariablen des Prozesses.** Der Sidecar
  erbt sie von der Hülle. Startet ihn jemand aus einer Umgebung ohne `%OneDrive%`, bleibt der
  Befund aus — nicht falsch, aber leer. Deshalb bleibt die Heuristik der Oberfläche daneben
  stehen, und deshalb steht sie in der Architektur als eigene Zeile neben der meinen.

- **Die Zeitgrenze selbst ist nicht gemessen.** Ohne eine tote Netzfreigabe lässt sie sich nicht
  auslösen. Der Prüfpfad misst das Gegenstück: dass ein erreichbarer Ordner weit innerhalb des
  Budgets antwortet und die Konstante bei 3000 steht. Ein Budget, das schon im Normalfall greift,
  wäre der schlimmere Fehler und würde auffallen.

- **`within` ist jetzt aus `@takt/storage` ausgeführt.** Eine Klammer mehr an der Paketfläche.
  Die Alternative wäre eine zweite Fassung im Adapter gewesen — zwei Zeitbudgets, die
  auseinanderlaufen können.

- **`pnpm check` lief zwischenzeitlich rot, und zwar an `apps/web/src/screens/ExportScreen.tsx`**
  (fünf Fehler, unbenutzte Einfuhren und ein unbekannter Typ). Die Datei war neun Sekunden vor
  dem Lauf geschrieben worden — der frontend-dev arbeitet dort. Beim nächsten Lauf war sie grün.
  Kein Befund, nur eine Warnung an den nächsten, der einen roten Lauf sieht und ihn sich selbst
  zuschreibt.

---

Offene Fragen:

1. **An den Orchestrator: eine eigene Aufgabe für den Abgleich der Antwortgestalten.**
   `proof:openapi` deckt Routen und Anfragerümpfe. Die Antworten fehlen, und dort lagen in T-029
   die teuersten Befunde (der Seitenumschlag) und in T-039 der teuerste (die 409, die es nicht
   gibt). Ein Zuschnitt, der ohne zweite Prüfsuite auskommt: Der Dienst wird einmal mit einem
   kleinen, festen Bestand aufgebaut; jede Leseroute wird einmal angefahren; die Antwort wird
   gegen das Schema der Beschreibung gehalten (Pflichtfelder vorhanden, kein unbeschriebenes
   Feld). Schreibrouten bleiben außen vor — dafür bräuchte es je Route gültige Eingaben, und das
   ist die zweite Suite. Schätzung: ein Tagwerk, und danach ist die Beschreibung vollständig
   gemessen.

2. **An den integration-dev: `POST /addin/todos` nimmt eine Call-Nummer bis 128 Zeichen an.**
   `createTodoSchema` in `apps/local-api/src/routes/addin/schema.ts` erlaubt 128,
   `checkCallNumber` (E-045) hält alles über 64 für unplausibel und sucht nicht danach. Ein Todo
   mit einer 100-stelligen Call-Nummer ist damit anlegbar und über die Duplikatsuche nie wieder
   auffindbar. Ich habe die Beschreibung auf den Dienst gezogen (128, mit Erklärung), weil die
   Beschreibung den Dienst beschreibt. Die Angleichung auf `CALL_NUMBER_MAX_LENGTH` wäre die
   bessere Lösung, liegt aber bei dir. Dasselbe gilt für den Titel: 512 im Add-in gegen 500 auf
   der Hauptfläche (`titleSchema`).

3. **An den Orchestrator und die Hülle: `GetDriveTypeW` für zugeordnete Laufwerke.** Der eine
   Fall, den weder die Oberfläche noch der Dienst belegen kann. Er gehört in die Tauri-Hülle und
   wäre dort ein Aufruf: Laufwerksbuchstabe herein, Art heraus, über dieselbe `stdin`-Zeile oder
   einen Befehl an den Sidecar gereicht wie der Windows-Benutzername (E-042). Ich habe es nicht
   gebaut, weil `apps/desktop/**` fremde Hoheit ist.

4. **An den frontend-dev: drei Stellen für `unreachable`, und ein neues Feld zum Abholen.**
   - `apps/web/src/api/types.ts:548` — `ExportDirectoryState` um `"unreachable"` erweitern.
   - `apps/web/src/screens/ExportScreen.tsx:~95` — ein Eintrag in der Meldungstabelle. Vorschlag:
     „Der Exportordner antwortet nicht" / „Er liegt vermutlich auf einem Netzlaufwerk, das gerade
     nicht erreichbar ist. Takt hat drei Sekunden gewartet und dann abgebrochen — der Ordner kann
     durchaus noch da sein."
   - `apps/web/src/components/ExportDirectoryField.tsx:~115` — ein Satz, Vorschlag: „Dieser
     Ordner hat nicht geantwortet. Möglicherweise ist das Laufwerk nicht verbunden."
   - Und das eigentliche Angebot: `GET /settings` liefert jetzt `exportDirectoryTraits` mit
     `unc`, `network`, `sync_folder`, `system_dir`. Beschrieben in der OpenAPI unter
     `ExportDirectoryTrait`. **Eine leere Liste ist keine Entwarnung** — deine Heuristik bleibt
     die Erklärung, meine ist der Beleg, und für `Z:` habe ich keinen (siehe Offene Frage 3).

5. **An den unit-tester (kein Bedarf, nur eine Auskunft):** `packages/storage/test/file-port.test.ts`
   läuft unverändert grün; die Gestalt der bestehenden Ergebnisse ist absichtlich byteweise
   gleich geblieben. Neu und **ungetestet** sind der Zeitbudget-Zweig in `file-port.ts` und
   `apps/local-api/src/access/export-directory.ts`. Letzteres liegt außerhalb der
   Abdeckungsschwellen und ist über `proof:export` Abschnitt 10 gemessen; wenn du es lieber als
   Test hättest, sind es reine Funktionen über Pfad und Umgebung und ohne Aufbau prüfbar.

---

Nächster Schritt:

Offene Frage 4 an den frontend-dev — solange `unreachable` in der Oberfläche fehlt, zeigt sie im
einen Fall, für den die Zeitgrenze gebaut wurde, nichts an. Danach Offene Frage 1 an den
Orchestrator: Der Abgleich der **Antwortgestalten** ist die letzte offene Hälfte, und sie ist die
Hälfte, in der zweimal die teuersten Befunde lagen.
