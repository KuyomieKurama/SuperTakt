Aufgabe: T-058 — Neue Tags beim Anlegen eines Todos, die Quelle der Statusspalten, und ein
Anzeigefehler bei der Dauer.

Status: fertig

---

Artefakte:

Neu:

```
packages/domain/src/tag-name.ts                          NEU (215) — wann zwei Tagnamen derselbe
                                                          sind. Normalisierung, aufgezählte
                                                          Faltung, Prüfung einzeln und als Liste
packages/storage/migrations/0008_tag_name_key.up.sql     NEU (205) — Spalte `tag.name_key`,
                                                          Faltung des Bestands über eine rekursive
                                                          Abfrage, Auseinanderziehen bestehender
                                                          Doppelter, zwei Indizes, zwei Trigger
packages/storage/migrations/0008_tag_name_key.down.sql   NEU (24)
apps/local-api/scripts/proof-tags.mjs                    NEU (610) — der Nachweis. 42 Prüfungen,
                                                          darunter acht **gleichzeitige** Anfragen
                                                          mit demselben neuen Tagnamen
```

Geändert:

```
packages/domain/src/index.ts                      +1   `export * from './tag-name.ts'`
packages/storage/src/ports.ts                          `TagPort.findByKey` — eine reine Abfrage,
                                                        keine Regel; `create`/`rename` dürfen jetzt
                                                        `validation_error` melden
packages/storage/src/sqlite/repo-tags.ts               Name **normalisiert** speichern, Schlüssel
                                                        mitschreiben, `findByKey` über
                                                        `ix_tag_name_key`
packages/storage/src/sqlite/migrations.embedded.ts     neu erzeugt (16 Dateien)
apps/local-api/src/usecases/todos.ts                   `tagNames` am Anlegen; `resolveTagNames`
                                                        mit `AbortTodoCreate`; `createdTags` in
                                                        der Antwort
apps/local-api/src/usecases/structure.ts               `createTag`/`updateTag` prüfen den Namen
                                                        über `checkTagName`, bevor eine Klammer
                                                        aufgeht
apps/local-api/src/routes/todos.ts                     `tagNames` im Schema von `POST /todos`
apps/local-api/src/app.ts                              `console.error('DEBUG-T041', …, error)`
                                                        entfernt — siehe „Nebenbefund"
apps/local-api/openapi/takt-local-api.yaml             `TodoCreate.tagNames`,
                                                        `TodoCreated.createdTags`, neuer Bauteil
                                                        `AddinTodoCreated`
apps/local-api/scripts/proof-callers.mjs               ein Eintrag in `NEVER_SENT` mit Begründung
                                                        — Übergabe an frontend-dev
apps/local-api/package.json                            `proof:tags`
package.json (Wurzel)                                  `proof:tags` als Kettenglied, in `check`
                                                        hinter `proof:callers` — auf Weisung des
                                                        Orchestrators selbst eingetragen
docs/datenmodell.md                                    3.1 vollständig neu (Statusspalten), 3.3
                                                        `name_key`, 8.4c Migration 0008, 8.5 sechs
                                                        Nachweiszeilen, 1 und 9 nachgezählt
docs/architektur.md                                    neuer Abschnitt 3.4 — der vierte Ablauf,
                                                        an dem etwas kaputtgehen kann
packages/storage/test/not-billed-audit.test.ts         **Abweichung, siehe unten** — die
                                                        Höchstfassung wird ausgerechnet statt
                                                        hingeschrieben
```

---

Zusammenfassung:

Ein Tagname darf jetzt beim Anlegen eines Todos stehen statt einer Kennung; gibt es ihn noch
nicht, entsteht das Tag in **derselben** Transaktion. Damit kann weder ein zweites Tag desselben
Namens entstehen noch ein Tag ohne das Todo, für das es gedacht war. Getragen wird das von drei
Ebenen — der Reihung der Transaktionen, einem neuen eindeutigen Index über einen
Vergleichsschlüssel `tag.name_key`, und einem Wurf statt eines Rückgabewerts beim Abbruch. Die
Regel, wann zwei Namen derselbe sind, steht als reine Funktion in `packages/domain/src/tag-name.ts`
und ein zweites Mal in Migration 0008; ein Prüflauf hält beide Fassungen über dreißig Namen
gegeneinander, statt ihre Gleichheit zuzusichern. Der Wettlauf selbst ist **gemessen**: acht
gleichzeitige Anfragen mit acht Schreibweisen desselben Namens ergeben ein Tag, acht Todos und
genau eine Antwort, die meldet, es angelegt zu haben. Die Herkunft der Kanban-Spalten steht jetzt
in `docs/datenmodell.md` 3.1 — woher sie kommen, wie man sie ändert, was die Standardspalte
bedeutet und was beim Löschen mit den Todos geschieht. Der Anzeigefehler bei der Dauer liegt
nicht im Dienst; die Messung dazu steht unter „An frontend-dev".

---

## 1 — Die Regel: wann zwei Tagnamen derselbe sind

**Die Antwort auf die Frage aus der Aufgabenstellung.** Zwei Namen bezeichnen dasselbe Tag, wenn
ihr Vergleichsschlüssel gleich ist. Der Schlüssel entsteht in vier Schritten:

| Schritt | Wirkung |
|---|---|
| 1. Unicode-Zusammensetzung (NFC) | „ä" als ein Zeichen und „a" mit nachgestelltem Trema werden gleich |
| 2. Leerraum | jede Art Leerraum wird ein Leerzeichen, Folgen werden eines, vorn und hinten fällt es weg |
| 3. Groß-/Kleinschreibung | A–Z **und** der lateinische Ergänzungsblock U+00C0–U+00DE, dazu ẞ auf ß |
| 4. sonst nichts | keine Umschrift, kein „ß" zu „ss", kein „Ä" zu „AE" |

Damit ausdrücklich:

```
  „Backend"   = „backend"   = „ Backend "  = „bAcKeNd"     ein Tag
  „Änderung"  = „änderung"                                 ein Tag
  „back  end" = „back end"                                 ein Tag
  „Straße"   ≠ „Strasse"                                   zwei Tags
  „ΑΛΦΑ"     ≠ „αλφα"                                      zwei Tags
```

**Der angezeigte Name behält seine Schreibweise.** Wer „Backend" tippt und damit ein bestehendes
„backend" trifft, bekommt „backend" — das zuerst angelegte Tag gewinnt. Der Schlüssel entscheidet
über die Gleichheit, nicht über die Darstellung.

**Warum die Faltung aufgezählt ist und nicht `toLowerCase()` heißt.** Der Schlüssel steht als
Spalte in der Datenbank und trägt dort den eindeutigen Index — nur so ist „kein doppeltes Tag"
eine Zusage des Schemas und nicht eine Hoffnung des Adapters. Das geht aber nur, wenn die
**Migration** denselben Schlüssel errechnet wie die Domäne. SQLites `lower()` fasst A–Z an und
sonst nichts; `toLowerCase()` in JavaScript fasst jedes Schriftsystem an. Beides nebeneinander
ergäbe zwei Regeln, von denen die Datenbank die schwächere erzwingt — und genau dort entstünde das
doppelte Tag, das der Index verhindern soll. Die Aufzählung ist der Preis dafür, dass beide
Fassungen gleich **sein können**; `proof:tags` Abschnitt 1 misst, dass sie es sind.

Der Preis steht ausdrücklich da: Griechische, kyrillische und türkische Großbuchstaben werden
nicht gefaltet. Für eine deutschsprachige Anwendung halte ich das für den richtigen Tausch — eine
Regel, die überall gleich gilt, gegen eine, die weiter reicht und an einer Stelle anders ausfällt.

Vier Namensfälle, die ich entschieden habe und die nicht in der Spezifikation stehen, stehen unter
„Annahmen".

---

## 2 — Der Wettlauf, gemessen statt behauptet

`pnpm --filter @takt/local-api proof:tags` — 42 Prüfungen, alle grün. Der Kern:

```
4  Acht gleichzeitige Anfragen, ein Tag
  ok    alle acht Anfragen werden angenommen
  ok    danach gibt es **genau ein** Tag mit diesem Schlüssel
  ok    alle acht Todos hängen an genau diesem Tag
  ok    genau eine Antwort meldet, das Tag angelegt zu haben
  ok    die übrigen sieben melden nichts Neues
  ok    die Liste zu diesem Tag führt alle acht Todos
```

Acht Schreibweisen (`backend`, `Backend`, `BACKEND`, ` backend`, `backend `, `  Backend  `,
`bAcKeNd`, `backend\t`), alle zugleich unterwegs, nichts dazwischen abgewartet. Ein Prüffall, der
sie nacheinander schickte, wäre grün und sagte nichts.

**Drei Ebenen tragen das, und sie ersetzen einander nicht:**

1. `TransactionPort` reiht Transaktionen (`unit-of-work.ts`). Zwei laufen nie ineinander; die
   zweite Anfrage sieht das Tag der ersten. Das ist die Ebene, die im Betrieb trägt.
2. `ux_tag_name_key` weist den zweiten gleichen Schlüssel strukturell ab — auch dann, wenn Ebene 1
   eines Tages nicht mehr gilt. Abschnitt 2 des Prüflaufs fügt am Adapter vorbei ein und erwartet
   die Abweisung.
3. Der **Wurf** statt eines Rückgabewerts beim Abbruch. Das ist die achte Stelle jener Bauart aus
   T-047, und sie ist ausgelöst statt begutachtet:

```
5  Kein Tag ohne sein Todo — die achte Stelle aus T-047
  ok    die Anfrage scheitert
  ok    das Tag der gescheiterten Anfrage gibt es nicht
  ok    und es ist überhaupt kein Tag hinzugekommen
```

**Warum hier ein Wurf und nicht der Sicherungspunkt aus `atomic.ts`.** Der Sicherungspunkt nimmt
einen Ausschnitt zurück und lässt die Klammer weiterlaufen — richtig, wenn danach noch etwas
geschehen soll. Hier soll nichts mehr geschehen: Es gibt kein Todo, also soll es auch nichts geben,
was für dieses Todo entstanden ist. `AbortTodoCreate` ist dieselbe Bauart wie `AbortExport` in
`usecases/export.ts`, und `unit-of-work.ts` beschreibt sie ausdrücklich als den vorgesehenen Weg
(„Wer eine Transaktion wegen eines fachlichen Fehlschlags verwerfen will, wirft ausdrücklich").

**Zwei Schreibweisen in einer Anfrage sind ein Tag.** Der Fall, den man ohne die Entdoppelung in
`checkTagNames` übersieht: Wer in einem Zug „Auswertung", „auswertung" und „ AUSWERTUNG " angibt,
meint ein Tag. Ohne diesen Schritt liefe die zweite Anlage in den eindeutigen Index, und der
Benutzer bekäme für eine Eingabe, die er für richtig hält, „Name bereits vergeben".

**Mehrdeutigkeit wird gefragt, nicht geraten.** Tagnamen sind nur **je Ordner** eindeutig (A-4.2).
Gibt es „Abnahme" in zwei Ordnern, wird die Anfrage mit 422 abgewiesen
(`details[].code = tag_name_ambiguous`) statt auf den ersten Treffer aufgelöst. Ein Münzwurf
zeigte sich später als falsche Pool-Zugehörigkeit, und niemand wüsste, woher sie kommt.

**Gesucht wird ordnerübergreifend.** Läge „backend" in einem Ordner und suchte der Dienst nur auf
Wurzelebene, entstünde daneben ein zweites „backend" — für den Benutzer dasselbe Tag, für jede
Pool-Regel ein anderes. Ein neues Tag entsteht auf Wurzelebene; ein Ordner wäre geraten.

**Wo die Regel liegt.** Die Domäne sagt, wann zwei Namen derselbe sind. Der **Anwendungsfall** sagt,
was aus keinem, einem oder mehreren Treffern folgt. Der **Adapter** liefert zwei Bausteine und
urteilt nicht: `findByKey` fragt, `create` schreibt. Ich hatte die Auflösung zunächst als
`TagPort.resolveNames` in den Adapter gelegt und wieder herausgenommen — sie ist eine Regel über
Tagnamen, keine über SQL, und im Adapter stünde sie in einer Abfrage versteckt.

---

## 3 — Die Migration

`0008_tag_name_key`, vorwärts und rückwärts gemessen (`proof:tags` 1–3, `docs/datenmodell.md` 8.5):

| Fall | Ergebnis |
|---|---|
| 0 → 8 | 69 Objekte, `integrity_check` = ok, `foreign_key_check` leer |
| Faltung gegen die Domäne | dreißig Namen — Umlaute, ẞ, Tabulator, geschütztes und ideographisches Leerzeichen, 200 Zeichen — ergeben in SQL denselben Schlüssel und dieselbe Anzeigeform |
| Bestand mit Doppelten | läuft durch, kein Tag verloren, das zuerst angelegte behält seinen Namen |
| 8 → 7 → 8 | Spalte, Indizes und Trigger verschwinden und kommen wieder |
| 8 → 0 → 8 | 0 verbleibende Objekte, danach dieselbe Objektliste wie im ersten Lauf |
| gebündelter Sidecar | `pnpm verify:bundle` 20/20 — die eingebettete Fassung enthält 0008 |

**Zwei Punkte, die ich gemessen und nicht befürchtet habe:**

*Bestehende Doppelte.* Ein Bestand von vor 0008 kann „ backend" und „Backend" nebeneinander führen
— `ux_tag_name` aus 0001 lässt das durch. Unter dem neuen Schlüssel sind das zwei gleiche, und der
Index ließe sich nicht anlegen. Statt abzubrechen bekommt jedes weitere Tag mit demselben Schlüssel
ein „ (2)" an den Namen: verlustfrei, sichtbar, vom Benutzer zu bereinigen. Zusammenführen wäre die
Alternative gewesen und ist schlechter — es verschöbe Todos zwischen Tags und damit zwischen Pools,
ohne dass jemand gefragt worden wäre.

*Der erste Entwurf ist an `ux_tag_name` gescheitert.* Der Index wird **je Zeile** geprüft, nicht am
Ende der Anweisung: Aus „back  end" wird „back end", und solange die Zeile daneben noch „back end"
heißt, stehen für die Dauer eines Schreibvorgangs zwei gleiche Namen da. Die Migration brach mit
einer UNIQUE-Verletzung ab, obwohl das Ergebnis eindeutig war. Behoben mit zwei Durchläufen — erst
auf einen Zwischenwert, der nicht kollidieren kann, dann auf den endgültigen. Dasselbe Muster wie
beim Umsortieren der Kanban-Spalten, aus demselben Grund.

**Was die Migration nicht kann**, und was deshalb in ihrem Kopf steht: Unicode-Zusammensetzung
(NFC). Ein bestehender Name, in dem „ä" als „a" plus Trema gespeichert ist, bekommt einen Schlüssel
in derselben Zerlegung. Für Namen, die über eine Tastatur unter Windows oder Linux entstanden sind,
ist der Fall gegenstandslos.

**Der Rückweg ist nicht vollständig**, und auch das steht in der Datei: Trigger, Indizes und Spalte
verschwinden, die vereinheitlichten Leerzeichen und die „ (2)"-Zusätze bleiben. Der ursprüngliche
Text ist nach dem UPDATE nirgends mehr gespeichert.

---

## 4 — Die Quelle der Statusspalten

`docs/datenmodell.md` 3.1, vier neue Unterabschnitte. Die Kurzfassung:

- **Woher.** Aus der Datenbank, Tabelle `todo_status`, sonst nirgendwoher. Die vier Startwerte legt
  `0002_seed_defaults.up.sql` **einmal** an, beim ersten Start auf einer leeren Datenbank. Die
  englischen Namen sind der Wortlaut aus A-5.3 und sind **Daten**, keine Oberflächentexte — wer sie
  deutsch haben will, benennt sie um, und das ist eine Handlung des Benutzers und keine Änderung am
  Programm.
- **Wie man sie ändert.** Fünf Operationen des lokalen Dienstes, als Tabelle ausgeschrieben. Dazu
  die zwei Regeln, die die Datenbank erzwingt und nicht die Anwendung, und warum `PUT .../order`
  die Reihenfolge vollständig entgegennimmt.
- **Die Standardspalte.** `is_default` ist die Spalte, in der ein Todo landet, wenn der Aufrufer
  keine nennt — der Normalfall, denn weder der Anlegedialog noch das Add-in fragen danach. Genau
  eine trägt die Markierung, erzwungen über einen partiellen eindeutigen Index. Was geschieht, wenn
  sie fehlt, steht daneben.
- **Löschen mit Todos darin.** Nichts — die Spalte wird nicht gelöscht. Vier Fälle in der
  Reihenfolge, in der der Dienst sie prüft, mit Statuscode und Fehlerschlüssel. Es gibt bewusst
  kein automatisches Umhängen: Das versteckte eine Zustandsänderung an fremden Datensätzen hinter
  einer Löschung.
- **Der einzige Ort im Frontend mit eigenen Spalten** ist `apps/web/src/showcase/data.ts`, die
  Musterseite. Der Absatz sagt ausdrücklich, dass eine dort gefundene Antwort für die Musterseite
  stimmt und sonst für nichts.

---

## 5 — Der Anzeigefehler bei der Dauer: **nicht im Dienst**

Beide Hälften gemessen.

**Der Dienst ist genau.** `time_entry.duration_seconds` ist eine berechnete Spalte
(`unixepoch(ended_at) - unixepoch(started_at)`, sekundengenau, `CHECK … >= 1`). Gegen das echte
Schema gefahren:

```
e1  01:07:40 → 01:08:20 =  40 s
e2  01:01:10 → 01:02:05 =  55 s
e3  02:00:00 → 02:01:00 =  60 s
e4  03:00:00 → 03:00:01 =   1 s
```

Die API liefert diesen Wert unverändert (`TimeEntry.durationSeconds`, `integer, minimum: 1`).

**Die Oberfläche schneidet ab.** `apps/web/src/lib/format.ts:99` rechnet über
`Math.trunc((total % 3600) / 60)` und zeigt nur Stunden und Minuten:

```
    1 s -> 0:00 h      40 s -> 0:00 h      59 s -> 0:00 h
   60 s -> 0:01 h      90 s -> 0:01 h    3599 s -> 0:59 h
```

Das Bildschirmfoto passt genau: `01:07–01:08 Uhr` ist die auf Minuten gekürzte Darstellung von
Start und Ende; die Buchung dazwischen war kürzer als eine Minute. Die Anzeige ist arithmetisch
richtig und für den Benutzer falsch — er sieht eine Buchung, die es gibt, als „0:00 h" und legt
eine zweite an.

Damit liegt der Fehler in `apps/web` und gehört frontend-dev. Details unter „An frontend-dev".

---

## Nebenbefund, den niemand gemeldet hat

`apps/local-api/src/app.ts` enthielt in `app.onError` die Zeile

```ts
console.error('DEBUG-T041', c.req.method, c.req.path, error);
```

— ein Rest aus einer Fehlersuche, unmittelbar unter einem Absatz, der Wort für Wort das Gegenteil
zusagt („Kein Aufrufstapel, keine Meldung der Laufzeitumgebung, kein Dateipfad … Innen bleibt die
Zeile im Protokoll, und die trägt nur einen Schlüssel"). Geschrieben wurde der vollständige Wurf
samt SQLite-Meldung, Tabellennamen und Aufrufstapel auf `stderr`. `stderr` des Sidecars läuft in
der Hülle zusammen und geht bei einer Fehlermeldung mit — damit lag der Innenbau der Datenbank in
einem Protokoll, das ein Benutzer weitergibt (B-2.4). Entfernt, mit einem Kommentar an der Stelle,
damit die Zeile nicht ein zweites Mal entsteht.

---

Annahmen:

1. **Vier Namensfälle, die ich entschieden habe.** Die Spezifikation sagt zu Tagnamen nichts über
   Schreibweise. Ich habe festgelegt: Groß-/Kleinschreibung zählt nicht (auch bei Umlauten),
   Leerraum am Rand und doppelter Leerraum im Inneren zählen nicht, „ß" bleibt „ß", und es wird
   nicht umgeschrieben. Zurücknehmbar wäre nur der dritte Punkt ohne Migration; die anderen drei
   hängen am Index.
2. **Ein neues Tag entsteht auf Wurzelebene, farblos.** Ein Ordner wäre geraten. Der Benutzer
   verschiebt es später (A-4.2).
3. **Ein mehrdeutiger Name ist ein 422 und kein Münzwurf.** Der Fehlerschlüssel bleibt
   `validation_error`; die maschinenlesbare Unterscheidung steht in
   `details[].code = tag_name_ambiguous`. So kam kein neuer Wert in `TaktErrorCode` und damit in
   keine Statuszuordnung, in keine OpenAPI-Aufzählung und in keinen Zweig der Oberfläche.
4. **Obergrenze fünfzig Namen je Anfrage** (gegenüber 200 Kennungen). Kennungen kommen aus einer
   Auswahl, Namen aus einem Eingabefeld; fünfzig neue Tags in einer Anfrage sind kein
   Arbeitsablauf, sondern ein Skript.
5. **`POST /addin/todos` bekommt `tagNames` nicht.** Der Add-in-Weg läuft über einen eigenen
   Anwendungsfall in `routes/addin/service.ts` — fremde Hoheit. Die Beschreibung dort zeigt jetzt
   auf einen eigenen Bauteil `AddinTodoCreated` statt auf `TodoCreated` und sagt ausdrücklich,
   warum. Siehe „Offene Fragen" 2.
6. **Die Migration lässt `tag.updated_at` in Ruhe**, obwohl sie `tag.name` normalisiert. Eine
   Vereinheitlichung des Leerraums ist keine Änderung des Benutzers, und ein aufgefrischter
   Zeitstempel schöbe jedes Tag in jeder nach Änderung sortierten Liste nach oben.

---

Abweichungen von der Dateihoheit — **eine, und sie war unvermeidbar:**

`packages/storage/test/not-billed-audit.test.ts`, ein Prüffall, drei Zeilen. Er schrieb die
Höchstfassung der Migrationen als Zahl hin:

```ts
const up = await runner.migrateToLatest();
expect(up.to).toBe(7);
expect(await runner.state()).toEqual({ kind: 'current', version: 7 });
```

Jede neue Migration bricht diesen Fall, ohne dass an seiner Aussage etwas falsch geworden wäre —
T-047 hatte dieselbe Stelle schon von `6` auf `7` gezogen und den Vorgang als Abweichung gemeldet.
Ich habe statt der Zahl die Aussage geschrieben, die der Prüffall meint:

```ts
const latest = migrations.reduce((max, entry) => Math.max(max, entry.version), 0);
```

Damit ist es die letzte Änderung an dieser Stelle. Der Titel des Falls sagt jetzt „wieder ganz nach
oben" statt „wieder vorwärts auf 7". Ohne diese drei Zeilen ist `pnpm check` nicht grün zu
bekommen, und die Migration ist der Kern der Aufgabe. Ich melde es trotzdem, weil die Regel klar
ist.

**Was ich ausdrücklich nicht getan habe:** Prüffälle für den neuen Code geschrieben. Siehe „An den
unit-tester".

---

Risiken:

1. **Die Abdeckungsschwelle von `packages/storage/src` steht auf der Kante — schon vorher.**
   Gemessen: vor dieser Aufgabe 576/718 Zweige = 80,22 %, Schwelle 80 %. Ein einziger
   ungeprüfter Zweig mehr, und `pnpm check` wird rot. Mein Entwurf lag zwischenzeitlich bei
   80,06 % (578/722), weil die Auflösung der Tagnamen im Adapter lag und dort kein Prüffall sie
   erreicht. Nach dem Umzug in den Anwendungsfall steht die Zahl **wieder exakt auf 576/718 =
   80,22 %** — diese Aufgabe ist für die Abdeckung von `packages/storage` neutral. Das ist eine
   Nebenwirkung und war nicht der Grund für den Umzug; der Grund steht in Abschnitt 2. Aber der
   Befund bleibt: Die nächste Aufgabe, die eine Zeile in `packages/storage/src/sqlite` hinzufügt,
   ohne dass ein Prüffall sie erreicht, macht die Kette rot. Das gehört gesehen, bevor es jemanden
   überrascht.
2. **`tag.name_key` und `tagNameKey` müssen zusammenbleiben.** Wer die Faltung in der Domäne
   ändert, ohne den Bestand neu zu falten, bekommt Schlüssel, die nicht mehr zu ihren Namen
   passen — und der eindeutige Index erzwingt dann eine andere Regel, als die Anwendung prüft. Die
   Trigger aus 0008 fangen nur den groben Fall (Schlüssel sieht aus wie ein Name). Eine Änderung an
   `tagNameKey` braucht **immer** eine Migration.
3. **Der Wettlauf ist innerhalb *eines* Prozesses gemessen.** Die Reihung der Transaktionen gilt je
   Verbindung. Öffnete ein zweiter Prozess dieselbe Datei — heute tut das keiner —, trüge nur noch
   `ux_tag_name_key`, und der Verlierer bekäme `name_conflict` statt des vorhandenen Tags. Ein
   Wiederholungsversuch wäre die Behebung; ich habe ihn nicht gebaut, weil der Fall nicht
   erreichbar ist und ungeprüfter Code für einen unerreichbaren Fall schlechter ist als keiner.
4. **Der Prüflauf `proof:tags` belegt Port 17843**, wie alle anderen. Er läuft nicht neben ihnen.
5. **Sicherheit.** Ein neues Eingabefeld am Dienst: `tagNames` ist durch `nameSchema`
   (1–200 Zeichen, getrimmt) und eine Obergrenze von 50 begrenzt, geht nie in eine SQL-Anweisung
   ohne Parameter und erscheint in einer Fehlermeldung nur als **Echo der eigenen Eingabe**
   (`details[].message`) — kein Innenleben, kein Pfad, kein Indexname. Die Notiz-Trennung ist nicht
   berührt: `Tag` trägt keinen Vermerk, und `check:boundary` ist grün.

---

Offene Fragen:

1. ~~**An den Orchestrator: `proof:tags` in die `check`-Kette.**~~ **Erledigt.** Der Orchestrator
   hat die Frage beantwortet und mich gebeten, den Eintrag selbst zu setzen. Getan:

   ```json
   "proof:tags": "pnpm --filter @takt/local-api proof:tags",
   "check": "… && pnpm run proof:callers && pnpm run proof:tags && pnpm run test:coverage && …"
   ```

   Die Kette führt jetzt **drei** Nachweispfade statt zwei (`proof:openapi`, `proof:callers`,
   `proof:tags`); im Repository stehen zwölf. Gegengeprüft nach dem Eintrag: `pnpm check` exit 0,
   `proof:tags` läuft als Glied der Kette mit 42/0 zwischen `proof:callers` und `test:coverage`.

   **Zur Kollisionswarnung:** keine Kollision. Der frontend-dev hat um 03:07:47 `pnpm-lock.yaml`
   und `apps/web/package.json` angefasst (Ark UI), die Wurzel-`package.json` nicht — sie führt
   keinen `ark`-Eintrag, und meine beiden Zeilen stehen unverändert darin. Die vollständige Kette
   ist **nach** seiner Installation gelaufen und ist grün, der Bau der Oberfläche eingeschlossen.

2. **An integration-dev (über den Orchestrator): `tagNames` für das Add-in?** `POST /addin/todos`
   nimmt weiterhin nur Kennungen. Der Anwendungsfall dort ist ein eigener
   (`routes/addin/service.ts`), und die Datei gehört nicht mir. Fachlich spricht nichts dagegen —
   der Bausteine wegen wäre es wenig Arbeit: `checkTagNames` aus der Domäne, dann dieselbe Schleife
   über `unit.tags.findByKey` / `unit.tags.create` innerhalb der bestehenden Transaktion, mit einem
   Wurf beim Abbruch. **Wichtig, falls es kommt:** nicht abschreiben. `resolveTagNames` in
   `usecases/todos.ts` ist heute nicht exportiert; ich exportiere es gern, statt eine zweite
   Fassung entstehen zu lassen.

3. **An den Auftraggeber, falls es ihn interessiert: „Straße" gegen „Strasse".** Ich habe
   entschieden, dass das zwei Tags sind (keine Umschrift). Das ist die einzige der vier
   Namensregeln, bei der ich mir eine andere Antwort vorstellen kann. Sie zu ändern hieße: neue
   Faltung in der Domäne **und** eine Migration, die den Bestand neu faltet und dabei entstehende
   Doppelte zusammenführt — teurer als jetzt.

---

An frontend-dev (`apps/web` gehört ihm, drei Punkte):

1. **`formatDuration` zeigt jede Buchung unter einer Minute als „0:00 h"**
   (`apps/web/src/lib/format.ts:99`). Der Dienst ist genau, die Anzeige schneidet ab — Messung in
   Abschnitt 5. Das ist mehr als Kosmetik: Der Benutzer glaubt, seine Buchung sei leer, und legt
   eine zweite an. Betroffen sind alle Stellen, an denen die **ungerundete** Dauer einer einzelnen
   Buchung steht: `TimeScreen`, `DashboardScreen:305`, `TodoDetailScreen:407`, `BookingDialogs:412`,
   `GlobalSearch:59`, `BookingsScreen:564`.

   Ein Vorschlag, kein Auftrag: Für `seconds < 60` etwas anderes zeigen als „0:00 h" — etwa
   `unter 1 Minute` oder `0:00:53`. Aufrunden auf „0:01 h" wäre die schlechteste Antwort: Neben der
   Buchung steht die **erfasste Wirklichkeit**, und die darf nicht runden (die Rundung gehört der
   Tagesgruppe, E-020).

2. **`spokenDuration` hat denselben Fehler und einen zweiten dazu** (`format.ts:110`). Bei 40
   Sekunden liest ein Bildschirmleser „0 Minuten"; bei genau einer Stunde liest er
   „**1 Stunden** und 0 Minuten".

3. **Der Leistungstext wird als „Ohne Le…" abgeschnitten.** Der Text lautet „Ohne Leistung" und
   steht in `TodoDetailScreen.tsx:411`, `DashboardScreen.tsx:309` und `TimeScreen.tsx:361`. Das ist
   Layout, nicht Inhalt.

4. **Zum Anlegedialog:** `POST /todos` nimmt jetzt `tagNames: string[]` entgegen (OpenAPI
   `TodoCreate`). Die Antwort führt `createdTags: Tag[]` — vollständige Tags, damit die Karte den
   neuen Namen sofort zeigen kann, ohne `/tag-tree` erneut zu holen. Bis die Oberfläche das
   sendet, steht ein Eintrag mit Begründung in `NEVER_SENT` in `proof-callers.mjs`; wer ihn
   entfernt, ohne dass die Oberfläche sendet, bekommt den Befund zurück. Ein möglicher Fehlerfall,
   der behandelt werden will: 422 mit `details[].code === 'tag_name_ambiguous'` — dann muss der
   Benutzer das gemeinte Tag aus der Liste wählen.

5. **Ein Widerspruch in der Musterseite**, den ich beim Dokumentieren gefunden habe:
   `showcase/ControlsSection.tsx:281` sagt beim Löschen einer Spalte „Die vier Todos in dieser
   Spalte wandern nach „Backlog". Es geht nichts verloren." Der Dienst tut das **nicht** — er weist
   die Löschung mit `409 status_in_use` ab („In dieser Spalte stehen noch Todos. Verschieben Sie
   sie zuerst."). Da die Musterseite gerade aus der Navigation verschwindet, ist es vielleicht
   gegenstandslos; falls der Text irgendwo als Vorlage dient, ist er falsch. Beschrieben in
   `docs/datenmodell.md` 3.1.

An den unit-tester (Angebot, kein Bedarf):

Neuer Code ohne Prüffälle, alles in deiner Hoheit:

- `packages/domain/src/tag-name.ts` — `normalizeTagName`, `tagNameKey`, `checkTagName`,
  `checkTagNames`. Rein, ohne Uhr und ohne Datenbank, also die billigsten Prüffälle im Haus.
  Zweigabdeckung dieser Datei heute 51,5 % (die Domäne insgesamt bleibt bei 85,95 %, Schwelle
  80 %). Die interessanten Fälle stehen als Aufzählung in `proof:tags` (`NAMES`, dreißig Stück).
- `TagPort.findByKey` in `repo-tags.ts` — eine Abfrage ohne Zweige, aber es gibt keinen Prüffall,
  der den Index trifft.
- `resolveTagNames` in `apps/local-api/src/usecases/todos.ts` — nicht exportiert; wenn du sie
  einzeln prüfen willst, exportiere ich sie. Ihre drei Fälle (0 / 1 / >1 Treffer) und der Abbruch
  sind über HTTP in `proof:tags` 4–8 gemessen, aber nicht als Einheit.

Bitte **nicht** doppeln: Der Wettlauf und die Gleichheit von SQL- und TypeScript-Faltung gehören in
`proof:tags` und nicht in Vitest — der eine braucht acht gleichzeitige HTTP-Anfragen, der andere
die echte Migrationsdatei.

---

Nächster Schritt:

1. ~~Orchestrator trägt `proof:tags` ein~~ — erledigt, siehe Offene Frage 1.
2. frontend-dev baut das Eingabefeld für einen neuen Tagnamen in den Anlegedialog und behebt
   `formatDuration` — die beiden sind unabhängig voneinander.
3. Danach ein End-zu-Ende-Fall für e2e-tester: „Todo anlegen mit Titel ‚API dokumentieren' und Tag
   ‚backend', Tag existiert nicht" — der Weg, den der Auftraggeber wörtlich beschrieben hat, einmal
   durch die echte Oberfläche.

---

Befehle, die diese Aufgabe belegen:

```
pnpm check                                       exit 0  — enthält seit dieser Aufgabe
                                                 `proof:tags`; 556 Prüffälle, Abdeckung, Bau
pnpm --filter @takt/local-api proof:tags         42 bestanden, 0 fehlgeschlagen
pnpm --filter @takt/local-api proof:access       75 / 0
pnpm --filter @takt/local-api proof:export       97 / 0
pnpm --filter @takt/local-api proof:export-api   69 / 0
pnpm --filter @takt/local-api proof:taskpane     25 / 0
pnpm --filter @takt/local-api proof:addin-wiring 32 / 0
pnpm --filter @takt/local-api proof:route-policy 40 / 0
pnpm --filter @takt/local-api proof:template-fields 30 / 0
pnpm --filter @takt/local-api proof:db-permissions  17 / 0
pnpm --filter @takt/local-api proof:openapi      46 / 0
pnpm --filter @takt/local-api proof:callers      18 / 0
pnpm verify:bundle                               20 / 0  (der gebündelte Sidecar startet mit 0008)
```
