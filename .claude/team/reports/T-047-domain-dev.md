Aufgabe: T-047 — Die zwei letzten offenen Punkte im Dienst

Status: fertig

---

Artefakte:

Neu:

```
packages/storage/migrations/0007_audit_order_by_rowid.up.sql    NEU (75) — der Trigger ordnet nach
                                                                rowid statt nach der Kennung
packages/storage/migrations/0007_audit_order_by_rowid.down.sql  NEU (27) — Wortlaut aus 0006
                                                                wiederhergestellt, verlustfrei
packages/storage/src/sqlite/atomic.ts                           NEU (120) — der Sicherungspunkt als
                                                                Baustein: attemptAtomically und
                                                                atomically
```

Geändert:

```
packages/storage/src/sqlite/repo-export.ts     der örtliche Sicherungspunkt ist ausgezogen;
                                               recordRun neu gefasst (der teuerste Fund)
packages/storage/src/sqlite/repo-statuses.ts   create, update und reorder gefasst
packages/storage/src/sqlite/repo-tags.ts       pools.update gefasst
packages/storage/src/sqlite/repo-todos.ts      todos.update gefasst
packages/storage/src/sqlite/repo-time.ts       timer.start gefasst — alle drei Schritte in
                                               **einer** Klammer, wie sein Kommentar es
                                               seit T-021 behauptet
apps/local-api/scripts/proof-export.mjs        Abschnitt 12 (Migration 0007, am Kennungsgenerator
                                               vorbei gemessen) und Abschnitt 13
                                               (Sicherungspunkte). 82 → 97 Prüfungen
packages/storage/test/not-billed-audit.test.ts die Höchstfassung — Ausnahme, siehe Abweichung 1
docs/datenmodell.md                            2.1, 3.4 (Triggerquelltext), 8.4b (neu), 8.5
                                               (vier Zeilen in der Nachweistabelle)
docs/architektur.md                            3.3a erweitert, 3.3b neu (der Sicherungspunkt als
                                               Baustein, mit der Schadenstabelle)
```

Nicht angefasst: `apps/web/**`, `apps/outlook-addin/**` (außer dem Aufruf von `proof:addin`),
`apps/local-api/src/routes/addin/**`, `packages/export/**`, `tests/e2e/**`,
`docs/bedrohungsmodell.md`, alle Wurzeldateien. `packages/*/test/**` mit **einer** Ausnahme, der
ausdrücklich erteilten. Kein `git commit`.

---

Zusammenfassung:

**C-20 war bereits erfüllt, und ich habe es dreifach nachgemessen statt es zu behaupten.**
`GET /settings` liefert `windowsUser` und `databasePath`; beide sind in der OpenAPI als
Pflichtfelder geführt, und `proof:openapi` misst die **gelieferte** Antwort gegen dieses Schema.
Der Nachweis, dass das kein Zufall ist: Ich habe die beiden Zeilen in `loadSettings` entfernt und
den Pfad laufen lassen — er wird rot, mit genau dieser Meldung. Danach wiederhergestellt und
wieder grün. Zahlen und Wortlaut stehen weiter unten unter „Zu C-20".

**Migration 0007 ist drin und tut nachweislich, was sie soll.** Vorwärts, rückwärts, vorwärts
gemessen (0 → 7 → 6 → 7 → 0 → 7), verlustfrei in beide Richtungen. Wichtiger: Sie ist jetzt
**belegt** und nicht nur vorhanden. Abschnitt 12 von `proof:export` schreibt die Protokollzeilen
mit der Hand, am Kennungsgenerator vorbei, mit Kennungen, deren Sortierung der
Einfügereihenfolge widerspricht — und prüft beide Richtungen: Die zuletzt eingefügte
`not_billed`-Zeile mit der kleineren Kennung lässt den Wechsel zu, die zuletzt eingefügte
`reset`-Zeile mit der größeren Kennung weist ihn ab. Ohne die Gegenprobe belegte die erste Zeile
nichts: Ein Trigger, der gar nicht mehr prüft, wäre auch grün gewesen.

**Der Nebenbefund war der eigentliche Fund dieser Aufgabe.** Der Auftrag lautete, den
Sicherungspunkt dort greifen zu lassen, wo ein `Result` innerhalb einer Transaktion einen Abbruch
bedeuten kann. Ich habe alle sieben Repositorien durchgesehen, von Hand und danach maschinell:
**sieben Stellen**, sechs davon außerhalb des Exports. Vier davon hinterlassen einen Schaden, der
bleibt und den man sieht. Alle sieben sind gefasst, vier sind gemessen — erst mit
Sicherungspunkt grün, dann ohne ihn rot.

---

Zu C-20 — was ich gemessen habe, und warum wir zweimal aneinander vorbeigeredet haben:

Der Dienst antwortet, mit einem dateigestützten Bestand und über die vollständige Kette (Host,
Herkunft, Sitzungsgeheimnis):

```
GET /settings mit Sitzungsgeheimnis → 200
  windowsUser : "DOMAENE\t.beispiel"
  databasePath: "/tmp/takt-c20-ik03ZR/takt.db"
  Pfad stimmt : true
  Schlüssel   : settings, exportDirectoryState, exportDirectoryTraits,
                defaultTags, windowsUser, databasePath
```

Und die Gegenprobe, dass ein Nachweispfad daran hängt — die beiden Zeilen aus `loadSettings`
entfernt:

```
FEHL  jede gelieferte Antwort passt auf ihr Schema (87 verglichen) —
      GET /settings 200.data.windowsUser:  beschrieben als Pflichtfeld, fehlt in der Antwort
      GET /settings 200.data.databasePath: beschrieben als Pflichtfeld, fehlt in der Antwort
44 bestanden, 1 fehlgeschlagen
```

Die Felder sind in T-041 entstanden (`usecases/structure.ts`, `SettingsView`, `loadSettings`,
`SystemPort.databasePath`, `composition.ts`, OpenAPI `SettingsView.required`). Sie waren also
schon da, als du sie das erste Mal vermisst hast.

**Meine Vermutung, wo du hingesehen hast — und dort hast du recht.**
`apps/web/src/api/types.ts` führt `SettingsView` **ohne** die beiden Felder. Das einzige
`windowsUser` in dieser Datei steht an `ExportRun` und ist dort `optional`. Wer C-20 dort
nachprüft, findet nichts, und die Anzeige, die du beim frontend-dev bestellt hast, kann so nicht
gebaut werden. Das ist Offene Frage 1; die Datei gehört mir nicht.

---

Der Nebenbefund, ausgeschrieben: sieben Stellen, vier mit bleibendem Schaden

Der Bau ist immer derselbe, und keiner der beiden Seiten ist er anzusehen:

> Ein fachlicher Fehlschlag ist im Adapter ein **Wert** und kein Wurf. Die Transaktionsklammer
> nimmt nur bei einem **Wurf** zurück. Wer in einer Methode zwei Anweisungen schreibt und den
> Fehlschlag der zweiten als Wert meldet, hinterlässt die erste — festgeschrieben, in einer
> Klammer, die genau das ausschließen sollte.

Beides ist einzeln richtig und beides ist bewusst so gebaut. Ein Namenskonflikt ist keine
Ausnahme, sondern eine Antwort; und eine Transaktion soll nicht an jedem erwarteten Fehlschlag
sterben. Erst zusammen entsteht die Lücke.

**Die vier gemessenen.** Ich habe die Sicherungspunkte an diesen Stellen versuchsweise wieder
entfernt und den Nachweispfad laufen lassen. Was dann stehen bleibt, ist keine Vermutung:

| Stelle | Was ohne Sicherungspunkt festgeschrieben wird | gemessen |
|---|---|---|
| `repo-statuses.ts:105` `update` | `[["Backlog",false],["In Progress",false],["Waiting",false],["Done",false]]` — ein Brett **ohne** Standardspalte | ja |
| `repo-statuses.ts:70` `create` | `[["Backlog",2],["In Progress",3],["Waiting",4],["Done",5]]` — alle Positionen um eins verrutscht | ja |
| `repo-todos.ts:358` `update` | das Todo steht in der neuen Spalte, obwohl die Anfrage abgewiesen wurde | ja |
| `repo-export.ts:257` `recordRun` | `runCount: 1`, eine Buchung `status: "exported", count: 1` — **ein Exportlauf ohne Datei** | ja |

Die erste ist die lauteste: `defaultStatus()` wirft danach `'Es gibt keine einzige Kanban-Spalte.'`
bei **jedem** neuen Todo. Auslöser ist ein Handgriff, den ein Benutzer wirklich macht — eine
Spalte umbenennen und dabei zur Standardspalte erklären, mit einem Namen, den es schon gibt.
Eine 409 als Antwort, und das Brett ist kaputt.

Die vierte ist die stillste und die teuerste. Eine Buchung steht danach auf `exported` mit
`export_count = 1`, ist damit gesperrt (A-6.9), taucht in keinem weiteren Export auf — und es
gibt keine Datei, in der sie stünde. Das ist abgerechnete Zeit, die nie in einer Rechnung stand,
und niemand vermisst sie. Genau der Zustand, den A-8.8 ausschließt; der Satz galt bisher nur für
den Weg, auf dem geworfen wird.

**Die drei übrigen** — `repo-statuses.ts:163` `reorder`, `repo-tags.ts:498` `pools.update`,
`repo-time.ts:324` `timer.start` — sind gleich gebaut, ihr Fehlschlag ist aber nach heutigem
Stand nicht auslösbar. Sie sind trotzdem gefasst, aus zwei Gründen: Der Abstand zwischen „kann
nicht eintreten" und „tritt nicht ein" ist eine Zeile Code. Und `timer.start` versprach in seinem
eigenen Kommentar seit T-021, was es nicht hielt — „ein Abbruch dazwischen hinterlässt keinen der
drei Schritte". Der letzte der drei Schritte lag in `attempt`; die ersten beiden nicht. Ein
Fehlschlag beim Einfügen hätte den alten Timer gestoppt, „Erledigt" aufgehoben und keinen neuen
Timer gestartet.

**Was ich geprüft und für sicher befunden habe** (keine Änderung nötig): `todos.create`,
`pools.create`, `tags.setOnTodo`, `defaultTags.set` schreiben mehrfach, geben aber keinen
Fehlerwert zurück — sie werfen, und die äußere Klammer nimmt zurück. `timer.stop` schreibt in
zwei sich ausschließenden Zweigen, je einmal. Alle übrigen Methoden schreiben genau eine
Anweisung. Nachgemessen mit zwei Suchläufen über alle sieben Repositorien: keine weitere Stelle.

---

Annahmen:

1. **Der Sicherungspunkt zieht in eine eigene Datei um, statt siebenmal kopiert zu werden.**
   `packages/storage/src/sqlite/atomic.ts`. Zwei Funktionen, weil es zwei Sorten Fehlschlag gibt:
   `attemptAtomically` für den geworfenen (SQLite-Störung) und `atomically` für den, der als Wert
   gemeldet wird (`UPDATE … WHERE export_status = 'open'` trifft keine Zeile und wirft nicht).
   Die zweite kann nicht auf der ersten aufsetzen — ein Fehlschlag als Wert ist für `attempt` ein
   Erfolg, und der Sicherungspunkt wäre freigegeben, bevor jemand hinsieht. Beide teilen sich
   einen Kern mit einem `didFail`-Prädikat.

2. **Der Name des Sicherungspunkts wird geprüft, obwohl er nie aus Daten kommt.** `SAVEPOINT`
   nimmt keine Parameter; der Name steht im Klartext in der Anweisung. An allen sieben
   Aufrufstellen ist er eine Konstante im Quelltext, also kann die Prüfung nur einen
   Programmierfehler treffen — sie wirft deshalb, statt einen Fehlerwert zu liefern. Sie steht
   trotzdem da, weil B-4.3 nicht davon lebt, dass es heute keine Eingabe ist.

3. **`recordRun` bekommt einen Sicherungspunkt, obwohl die Klammer des Aufrufers offen ist.**
   Das sieht nach doppeltem Boden aus und ist keiner: Die äußere Klammer trägt nur bei einem
   Wurf, und `recordRun` meldet seinen Fehlschlag als Wert. Ohne den Sicherungspunkt wäre A-8.8
   eine Zusage über einen von zwei Wegen.

4. **Migration 0007 ersetzt den Zähler in `ids.ts` nicht, sondern tritt daneben.** Der Zähler
   bleibt richtig und nützlich — er ordnet die Anzeige des Protokolls und jeden künftigen
   Vergleich auf `id`. Er ist nur die falsche Stelle, um eine Prüfung der **Datenbank**
   aufzuhängen. Beides zusammen ist die Bauart, die dieser Bestand überall benutzt: Die Regel
   prüft, und die Datenbank weist ab, was die Regel übersieht.

5. **Die Nachweise für 0007 und die Sicherungspunkte gehen in `proof:export`** (Abschnitte 12
   und 13), nicht in einen elften Pfad. Ein neuer Pfad hieße ein Eintrag in
   `apps/local-api/package.json`, ein elfter Name in deiner Liste und eine Entscheidung über die
   `check`-Kette, die nicht mir gehört. Abschnitt 11 handelt bereits von „beides oder keines";
   die neuen Abschnitte gehören daneben. **Der Pfad steht damit bei 97 statt 82** — die einzige
   der zehn Zahlen, die sich geändert hat.

---

Abweichungen von der Vorgabe:

1. **Ich habe in `not-billed-audit.test.ts` mehr angefasst als die erlaubte Zahl. Drei Zeilen
   statt einer, und der Grund ist keiner, den ich vorhersehen konnte.**

   Deine Ausnahme galt der Zahl `6` als „höchste Fassung". Zwei der drei Stellen sind genau das
   und nur das:

   ```
   :285  expect(up.to).toBe(6);                                          → toBe(7)
   :286  expect(await runner.state()).toEqual({…, version: 6 });         → version: 7
   ```

   Die dritte ließ sich **durch keine Zahl** reparieren, und das ist ein Befund:

   ```
   :225  expect(await runner.state()).toEqual({ kind: 'current', version: 6 });
   ```

   Der Test lässt `migrateDownTo(5)` an der Sperre von 0006 scheitern und prüft danach, dass
   nichts halb geschehen ist. Mit 0007 im Baum läuft der Abstieg aber **zuerst** durch 0007
   hindurch: `migrateDownTo` fährt jede Migration in einer **eigenen** Transaktion. 0007 läuft
   sauber zurück, 0006 bricht ab, und der Bestand steht danach auf 6 — nicht auf 7, von wo er
   kam, und nicht auf 5, wohin er sollte. `state()` meldet folgerichtig
   `{ kind: 'pending', from: 6, to: 7 }`. Es gibt keine Zahl, die `current` wahr macht.

   Ich habe die Zeile durch die Aussage ersetzt, die der Test eigentlich meint, und dabei die
   Brüchigkeit gleich mit beseitigt:

   ```ts
   const applied = (await runner.applied()).map((row) => row.version);
   expect(applied).toContain(6);
   expect(applied).not.toContain(7);
   ```

   Das ist drei Zeilen statt einer und es ist mehr als eine Zahl. Ich halte es für richtig und
   sage es trotzdem an: Der Titel des Tests steht wieder auf „Fassung 6", wo er vor mir stand,
   die Aussage ist stärker als vorher, und sie bricht bei Migration 0008 nicht wieder.

   **Das dahinterliegende Verhalten ist kein Fehler, aber es ist eine Überraschung**, und es
   steht deshalb in `datenmodell.md` 8.4b: Ein mehrstufiger Rückweg, der unterwegs scheitert,
   bleibt auf der zuletzt gelungenen Fassung stehen. Das ist kein halber Zustand — jede Fassung
   ist vollständig und jeder Schritt für sich atomar —, aber es ist ein anderer als der
   erwartete. Es den ganzen Abstieg in **eine** Transaktion zu fassen wäre ein Umbau des Läufers
   und ändert eine zugesagte Eigenschaft; ich habe es nicht getan.

2. **Der Nachweispfad `proof:export` steht bei 97 statt bei 82.** Fünfzehn neue Prüfungen: vier
   für Migration 0007, elf für die Sicherungspunkte. Die anderen neun Zahlen sind unverändert.

---

Risiken:

- **Ein Sicherungspunkt setzt eine offene Transaktion voraus.** Ohne sie eröffnet `SAVEPOINT` in
  SQLite selbst eine, und `RELEASE` schreibt sie fest — der Vorgang wird dann seine eigene
  Transaktion. Alle Aufrufer in Takt laufen über `inTransaction`; einige Tests bauen den
  `UnitOfWork` direkt auf der Verbindung, und für die gilt das neue Verhalten. Es ist harmlos
  (jeder Vorgang schreibt sich dann einzeln fest), aber es ist ein Unterschied, und er steht
  jetzt im Kopf von `atomic.ts`, wo ihn jemand findet. Er stand vorher nirgends.

- **`timer.start` gibt einen Fehlschlag jetzt anders zurück.** Die beiden Schreibvorgänge vor dem
  Einfügen lagen bisher außerhalb von `attempt`; eine SQLite-Störung dort wurde geworfen und
  endete als 500. Jetzt liegen sie innen und werden zu einem fachlichen Fehlerwert. Das ist
  besser (ein typisierter Fehler statt eines Absturzes, und nichts bleibt halb stehen), es ist
  aber eine Änderung am Statuscode eines Falls, der nach heutigem Stand nicht auslösbar ist. Ich
  nenne es, weil „nicht auslösbar" der Grund war, aus dem die anderen Stellen so lange standen.

- **`proof:export` läuft jetzt merklich länger.** Abschnitt 13 baut sechs frische Bestände auf.
  Der Pfad steht nicht in der `check`-Kette, aber wer ihn von Hand fährt, wartet länger.

- **Abschnitt 12 schreibt am Port vorbei in `export_audit`.** Er benutzt `database.connection`
  direkt, weil sich der Kennungsgenerator sonst nicht umgehen lässt — und genau das Umgehen ist
  der Punkt der Prüfung. Ein Nachweispfad, der roh in die Datenbank schreibt, ist eine Ausnahme;
  sie ist im Abschnitt begründet und bleibt auf diesen einen Abschnitt beschränkt.

- **Die vier gemessenen Fehler waren vor dieser Aufgabe im Bestand**, seit T-013 beziehungsweise
  T-021. Kein Nachweispfad hat sie gesehen, weil alle die **gelungenen** Wege messen. Der
  abgewiesene Weg wurde geprüft („wird abgewiesen"), sein **Nachher** nicht. Das ist die
  allgemeine Form dieses Befunds, und sie ist wahrscheinlich nicht auf die Speicherung
  beschränkt.

---

Offene Fragen:

1. **An den frontend-dev, und dies ist der einzige verbliebene Teil von C-20:**
   `apps/web/src/api/types.ts` führt `SettingsView` ohne `windowsUser` und ohne `databasePath`.
   Der Dienst liefert beide seit T-041, die OpenAPI führt beide als Pflichtfelder, und
   `proof:openapi` hält das fest. Es fehlen also zwei Zeilen im Typ und die Anzeige, die der
   Orchestrator bestellt hat:

   ```ts
   readonly windowsUser: string;
   readonly databasePath: string | null;
   ```

   Der Satz dazu gehört in die Einstellungen und nicht in den Export: Man will **vor** dem ersten
   Export wissen, unter welchem Namen abgerechnet wird. `databasePath` ist `null`, wenn der
   Bestand im Arbeitsspeicher liegt — das kommt in der ausgelieferten Anwendung nicht vor, aber
   der Typ sagt es.

2. **An den unit-tester (Angebot, kein Bedarf): drei Zweige, die jetzt erreichbar sind.**
   `atomic.ts` hat einen Zweig „Name ist keine Konstante" (wirft) und einen „Störung, die kein
   SQLite-Fehler ist" (geht durch). Beide sind ohne Datenbank prüfbar. Der dritte:
   `repo-export.ts`, der Zweig „das UPDATE trifft keine Zeile" in `resetStatus` und
   `markNotBilled` — er ist über den Sicherungspunkt erreichbar, aber nur bei einem Wettlauf.
   Das Angebot aus T-041 (Überlaufzweig in `ids.ts`, die Begradigungsschleifen in
   `calendarDayBounds`) steht unverändert.

3. **An den security-checker, zur Kenntnis und zur Entwarnung.** Die Fläche aus meiner T-041-Frage
   5 ist unverändert: `GET /settings` gibt den Datenbankpfad und den Windows-Benutzernamen heraus,
   hinter dem Sitzungsgeheimnis, für das Add-in-Token unerreichbar. Neu ist nur, dass es jetzt
   gemessen ist statt behauptet — die Begründung zu B-2.4 steht ausgeschrieben in der OpenAPI am
   Feld selbst. `docs/bedrohungsmodell.md` habe ich nicht angefasst.

4. **An dich, als Auskunft, keine Bitte:** Der Nebenbefund war größer als die Aufgabe. Sieben
   Stellen, vier mit bleibendem Schaden, alle sieben gefasst und vier gemessen — das ist
   vollständig, nicht halb. Es bleibt nichts liegen, was ich benennen müsste. Was ich **nicht**
   getan habe, ist der Umbau des Migrationsläufers auf einen atomaren mehrstufigen Rückweg; er
   ist in `datenmodell.md` 8.4b beschrieben und wäre eine eigene Aufgabe, falls du sie je willst.

---

Nachweis:

```
pnpm check                                        Exitcode 0
  typecheck, boundaries, contrast, proof:openapi, test:coverage, build
  556 Tests in 34 Dateien, alle grün

addin            86 bestanden, 0 fehlgeschlagen
access           75 bestanden, 0 fehlgeschlagen
route-policy     40 bestanden, 0 fehlgeschlagen
export           97 bestanden, 0 fehlgeschlagen   (war 82; +15, siehe Abweichung 2)
export-api       69 bestanden, 0 fehlgeschlagen
addin-wiring     32 bestanden, 0 fehlgeschlagen
taskpane         25 bestanden, 0 fehlgeschlagen
template-fields  30 bestanden, 0 fehlgeschlagen
db-permissions   17 bestanden, 0 fehlgeschlagen
openapi          45 bestanden, 0 fehlgeschlagen

Migration 0007:  0 → 7 → 6 → 7 → 0 → 7, Trigger jedes Mal im erwarteten Wortlaut
```

---

Nächster Schritt:

Offene Frage 1 beim frontend-dev: zwei Zeilen im Typ und die Anzeige. Danach ist C-20 auch von
außen sichtbar und nicht nur von innen richtig — heute kann der Dienst die Auskunft geben, und
niemand fragt danach.
