# T-393 — Gegenprobe vor dem Bau: C-22 (Suche im Vermerk), O-GF (Fristhinweis), O-CJ

Aufgabe: T-393 — Gegenprobe C-22 / O-GF / O-CJ
Status: fertig
Artefakte: `.claude/team/reports/T-393-spec-ux-reviewer.md` (nur dieser Bericht)
Zusammenfassung: C-22 wird mit **nur Herkunft, kein Textausschnitt** freigegeben, mit Akzeptanzkriterien
für O-CP-1 (Typ) und O-CP (Trefferzeile). O-GF bekommt einen gemeinsamen Kernsatz plus je einen
flächeneigenen Satz. O-CJ: in beiden Fällen ist der **Plan** falsch und der Bau richtig; TP-ANH-20
hat an der Haupttür keine A-ID, A-19.23c muss erweitert werden.
Prüfung: Quelltext, Spezifikation, Entscheidungen, Board, Testplan und Triage gelesen. Keine Läufe
(Auftrag ist eine Gegenprobe vor dem Bau). Wortlautsuche nach E-087 für die beiden betroffenen Sätze
in `tests/**`, `apps/*/test/**`, `packages/*/test/**` und `apps/*/scripts`: siehe unten.
Annahmen: siehe je Punkt.
Risiken: Die gemeinsame Suchbedingung trifft auch die Todo-Liste (siehe C22-03).
Offene Fragen: drei, am Ende.
Nächster Schritt: O-CP-1 an domain-dev mit den Kriterien K-1 bis K-8; danach O-CP an frontend-dev
mit K-9 bis K-17; O-GF an integration-dev und frontend-dev in **einer** Welle; A-19.23c-Erweiterung
an den Orchestrator (Spezifikation).

---

## 1. C-22 — Wie die globale Suche den Vermerk trifft

### Ausgangslage, gemessen am Quelltext

- `packages/storage/src/sqlite/repo-todos.ts:110-118`: `filter.search` sucht per `LIKE` in
  `t.title` und `t.call_number`. Der Vermerk (`todo_note.body`, eigene 1:1-Tabelle) ist nicht dabei.
- `apps/local-api/src/features/todos/todos.ts:619-643`: `SearchResult = { todos: Page<Todo>,
  timeEntries: TimeEntry[] }`. Keine Herkunft des Treffers.
- `apps/web/src/app/GlobalSearch.tsx:60-85`: **eine flache Liste**, Todos und Buchungen nur durch
  ein Symbol unterschieden (`inbox`/`clock`), keine Gruppenüberschrift. Damit verfehlt die Anzeige
  E-038 („nach Trefferart gruppiert“) schon heute, unabhängig vom Vermerk.
- `GlobalSearch.tsx:244` (SP-21): „… Gesucht wird in Titeln, Call-Nummern und Leistungstexten —
  nicht im Vermerk.“ Heute wahr. Fällt mit dem Bau (siehe K-15).
- `apps/web/src/api/types.ts:872`: „Der Vermerk ist kein Suchfeld (A-7.1).“ Falsch: A-7.1 sagt
  darüber nichts (O-CM-Rest). Fällt mit dem Bau.
- `/api/v1/search` ist eine reine Sitzungsroute (`access/route-policy.ts`, nicht unter `/addin`).
  Ein Add-in-Token erreicht sie nicht. Das ist die Voraussetzung dafür, dass A-7.2 („ausschließlich
  innerhalb der Anwendung sichtbar“) gewahrt bleibt.
- Für die globale Suche gibt es **keinen einzigen Prüffall** (weder `tests/**` noch
  `apps/*/test/**` nennen `searchEverything`, `/search` oder `gsearch`).

### Urteil zur Gestaltfrage: nur Herkunft, kein Textausschnitt

**Entschieden: Die Trefferzeile nennt bei einem Vermerkstreffer die Herkunft („Vermerk“), nie einen
Ausschnitt aus dem Vermerk.** Die Empfehlung der Triage wird übernommen. Begründung:

1. **Datensparsamkeit an der Tür.** Ohne Ausschnitt muss der Vermerkstext die Suchantwort gar nicht
   verlassen. Die Antwort trägt dann dieselben Daten wie heute (`Todo` ohne Vermerk) plus ein
   Herkunftsmerkmal. Die Zusage „der Vermerk steht in keiner Suchantwort“ lässt sich **strukturell**
   halten (kein Feld dafür im Typ), statt sie per Kürzung und Maskierung zu versprechen.
2. **Kein neuer Weg für fremden Text.** Ein Vermerk kann aus einer E-Mail stammen (Add-in,
   Auszug-Option A-10.14). Ein Ausschnitt müsste durch `Foreign`/`visibleText` (E-063), dazu noch
   eine Kürzung um den Treffer herum, die Richtungszeichen und Zeilenumbrüche nicht zerschneiden darf.
   Das ist eine eigene, fehleranfällige Fläche ohne Anforderung, die sie verlangt.
3. **Der Benutzer braucht die Stelle nicht, sondern das Todo.** Er kennt das Suchwort, weil er es
   gerade eingegeben hat. Ein Klick öffnet das Todo; der Vermerk steht dort in voller Länge
   (`TodoNoteCard`). E-038 verlangt, dass **erkennbar** ist, ob ein Treffer aus einem internen
   Vermerk oder aus einem Abrechnungstext stammt. Das leistet die Herkunft allein.
4. **Schulterblick-Schutz.** Die Suche ist eine überlagernde Liste, die bei `Strg`+`K` aufgeht,
   auch mitten in einer Bildschirmfreigabe. Interne Vermerke dort nicht auszubreiten ist bei einem
   Werkzeug, das neben Kundenterminen läuft, die sichere Voreinstellung.

Eine spätere Ausschnittsanzeige wäre eine neue Produktentscheidung mit eigener Abnahme (dann mit
`Foreign`, Kürzungsregel und einem Prüffall für Richtungszeichen); sie ist mit diesem Urteil nicht
vorweggenommen.

### Akzeptanzkriterien für domain-dev (O-CP-1, zuerst: Typ und Dienst)

| Nr | Kriterium |
|---|---|
| K-1 | Der Antworttyp nennt die Herkunft **je Todo-Treffer**. Vorschlag: `type TodoMatchOrigin = 'title' \| 'call_number' \| 'todo_note'` und `interface TodoSearchHit { todo: Todo; origins: readonly TodoMatchOrigin[] }`; `SearchResult.todos` wird `Page<TodoSearchHit>`. `origins` ist nie leer und hat eine feste Reihenfolge (Titel, Call-Nummer, Vermerk), damit die Anzeige nicht selbst sortiert. |
| K-2 | Buchungstreffer bleiben eigene Liste; ihre Herkunft ist implizit „Leistung“ und wird nicht mit Todo-Treffern gemischt (E-038, bestehender Kommentar `todos.ts:612-618`). |
| K-3 | **Die Antwort trägt keinen Vermerkstext.** Weder `Todo` noch `TodoSearchHit` bekommen ein Feld für `todo_note.body`. Nachweis: ein Integrationstest legt ein Todo mit eindeutigem Vermerkswort an, sucht nach diesem Wort, erhält einen Treffer mit `origins = ['todo_note']` **und** findet das übrige Vermerksmaterial (ein zweites, nicht gesuchtes eindeutiges Wort im selben Vermerk) nirgends im JSON der Antwort. |
| K-4 | Der Vermerk wird nur für `searchEverything` durchsucht. **Die gemeinsame Bedingung in `buildConditions` wird nicht stillschweigend erweitert**, denn `filter.search` trägt auch die Todo-Liste (`features/todos/routes.ts:316`) und die Pool-Mitglieder (`repo-tags.ts:897`). Entweder ein eigenes Filterfeld (z. B. `searchIncludesNote: true`) oder eine eigene Abfrage im Port; die Entscheidung steht im Bericht. Siehe C22-03. |
| K-5 | Die Herkunft wird **im Dienst** bestimmt, nicht in der Oberfläche nachgerechnet; dieselbe `LIKE`-Maskierung (`escapeLike`) wie heute, alle Werte als Parameter. |
| K-6 | `/api/v1/search` bleibt Sitzungsroute; kein Add-in-Token erreicht sie. Ein vorhandener oder neuer Prüffall in der Zugriffsschicht sichert das ab. |
| K-7 | Der Abrechnungsexport bleibt unberührt: `v_export_candidate` enthält weiterhin kein `todo_note`, `proof:export` bleibt grün, `note-separation.spec.ts` bleibt grün. Die Suche ist keine Tür in den Export (A-7.2, A-7.4). |
| K-8 | OpenAPI-Beschreibung der Suchroute nachgezogen (`proof:openapi`), einschließlich der geschlossenen Menge von `origins`. |

### Akzeptanzkriterien für frontend-dev (O-CP, danach: Trefferzeile)

| Nr | Kriterium |
|---|---|
| K-9 | Die Ergebnisliste ist **nach Trefferart gruppiert** (E-038), nicht nach Objektart: Gruppe „Todos“ (Treffer in Titel oder Call-Nummer), Gruppe „Im Vermerk (intern)“ (Todos, die **nur** im Vermerk getroffen wurden), Gruppe „In Leistungen“ (Buchungen). Ein Todo, das in Titel **und** Vermerk trifft, erscheint **einmal**, in der ersten Gruppe. |
| K-10 | Jede Gruppe hat eine sichtbare Überschrift. Im Kombinationsfeld als `role="group"` mit `aria-labelledby` innerhalb der `listbox`; die Pfeiltasten laufen weiter linear über alle Optionen (heutiges Muster `aria-activedescendant` bleibt). |
| K-11 | Die Herkunft steht in der Trefferzeile **als Text**, nicht nur als Symbol oder Farbe (WCAG 1.4.1). Vorschlag für die Detailzeile: „Call 12345 · Treffer in: Titel, Vermerk“. Bei reinem Vermerkstreffer: „Treffer im Vermerk“. |
| K-12 | Kein Textausschnitt aus dem Vermerk, auch nicht im `title`-Attribut, im zugänglichen Namen oder in einer Sprechblase. |
| K-13 | Die Leistungsgruppe behält den Exportstatus je Treffer (`ExportStatusMarker`, CLAUDE.md „überall sichtbar“). Die Vermerksgruppe trägt **keinen** Exportstatus, weil ein Vermerk nie exportiert wird. |
| K-14 | Alle neuen Oberflächentexte gebündelt (`lib/labels.ts` oder merkmalseigen), nicht im JSX (E-118). Betroffen: drei Gruppenüberschriften, „Treffer in:“, die Herkunftsnamen, der neue Leertext. |
| K-15 | SP-21 fällt und wird **im selben Auftrag** ersetzt (E-081 Punkt 4): „Kein Treffer für „…“. Gesucht wird in Titeln, Call-Nummern, Vermerken und Leistungstexten.“ Auch die unsichtbare Beschriftung `GlobalSearch.tsx:182` („Globale Suche über Todos und Leistungstexte“) wird ergänzt: „Globale Suche über Todos, Vermerke und Leistungstexte“. `api/types.ts:872` und der Kopfkommentar `GlobalSearch.tsx:23-41` werden berichtigt. |
| K-16 | Klick oder Eingabe auf einen Vermerkstreffer öffnet das Todo (wie heute `navigate("todo", id)`); die Vermerkskarte ist dort sichtbar, ohne weiteren Klick. |
| K-17 | Prüffälle: mindestens ein E2E-Fall je Gruppe, ein Fall „Todo trifft in Titel und Vermerk erscheint einmal“, ein Fall „Leertext nennt Vermerke“. Heute gibt es keinen. |

**E-087, gemessen:** „nicht im Vermerk“ und „Globale Suche über Todos und Leistungstexte“ stehen
in keinem Prüffall unter `tests/**`, `apps/*/test/**` oder `packages/*/test/**`. Der Treffer in
`apps/outlook-addin/scripts/proof-addin.mjs:6276` ist ein Codekommentar ohne Bezug zur Suche.
`docs/design/textbestand.md:968` (SP-21) muss von ux-designer nachgezogen werden.

### Befunde zu Punkt 1

```
C22-01  Globale Suche / Vermerk     Abweichung: E-038 und E-075 Punkt 2 versprechen die Suche im Vermerk; der Dienst sucht nur Titel und Call-Nummer.
                                    Vorschlag: Bau nach K-1 bis K-17. Blockierend für O-CP.
C22-02  Globale Suche / Anzeige     Abweichung: flache Liste, Trefferart nur als Symbol (E-038, WCAG 1.4.1).
                                    Vorschlag: K-9 bis K-11. Blockierend für O-CP.
C22-03  Todo-Liste / Suchfeld       Abweichung: droht. `filter.search` trägt auch Todo-Liste und Pool-Ansicht. Eine Erweiterung der gemeinsamen
                                    Bedingung ließe dort Todos ohne sichtbaren Grund erscheinen, weil diese Zeilen keine Herkunft zeigen.
                                    Vorschlag: K-4. Soll die Todo-Liste später auch im Vermerk suchen, ist das eine eigene Entscheidung mit eigener Herkunftsanzeige.
C22-04  Globale Suche / Leistungen  Abweichung (Nebenbefund, A-13.7/E-038): `todos.ts:635` holt nur die **200 jüngsten** Buchungen und filtert im
                                    Arbeitsspeicher. Ältere Leistungstexte werden still nicht gefunden, genau die Frage „wann habe ich zuletzt …“ aus E-038.
                                    Vorschlag: im selben Auftrag O-CP-1 als Parameterfilter im Port (`LIKE` auf `time_entry.note`), da der Antworttyp ohnehin neu entsteht.
                                    Nicht blockierend für C-22, aber empfohlen.
```

**Urteil zu C-22: freigegeben zum Bau** unter K-1 bis K-17. Damit ist die Bedingung aus E-075
Punkt 2 (Wiedervorlage vor dem Bau) erfüllt. Die Abnahme des fertigen Baus bleibt beim
spec-ux-reviewer; C-22 gilt erst nach dieser Abnahme als geschlossen.

---

## 2. O-GF — Ein gemeinsamer Wortlaut für den Fristhinweis

### Ausgangslage

- Add-in, `apps/outlook-addin/src/ui/TaskPane.tsx:507`: „SuperTakt sucht in der E-Mail nicht nach
  einer Frist — Sie tragen sie selbst ein. Uhrzeit optional; leer lassen heißt: keine Frist.“
- Hauptanwendung, `apps/web/src/features/todos/TodoFormDialog.tsx:254`: „Ein Kalendertag mit
  optionaler Uhrzeit. Optional — leer lassen heißt: keine Frist. Sie ändert nichts an Pools,
  Spalten, Buchungen oder Export. Die Uhrzeit ist 00:00, bis Sie sie ändern.“
- Dritte, lesende Stelle: `TodoDetailAside.tsx:62` („Ein Kalendertag mit optionaler Uhrzeit; sie
  steht in keinem Export.“). Sie ist eine Anzeige, kein Eingabehinweis, und bleibt außerhalb von
  O-GF.
- Randbedingungen: V-04 ist **unverändert** freigegeben, eine kürzere Fassung ausdrücklich nicht
  (T-165). Der Satz steht auf der Sperrliste (E-078). Inhalte, die tragen müssen: E-074 Punkt 4
  (nicht aus der E-Mail gelesen, nur Add-in), A-19.1 (leer = keine Frist), A-19.7 (keine Achse,
  nicht im Export), A-19.6 mit A-27.9 (Uhrzeit ist Beiwerk, bewertet wird der Tag).
- Die Add-in-Fassung sagt nichts zu A-19.7; die Web-Fassung sagt nichts dazu, dass eine Uhrzeit die
  Fälligkeit nicht verschiebt. Beide sind damit **unvollständig**, nicht nur verschieden.
- Die Hauptanwendung setzt bei gesetztem Datum 00:00 (A-27.7); das Add-in schickt ohne Eingabe
  `dueTime: null` (`TaskPane.tsx:384`). Der Satz über 00:00 ist im Add-in also **falsch** und
  darf dort nicht stehen.

### Urteil: gemeinsamer Kernsatz, je ein flächeneigener Satz

Ein Wortlaut für beide Flächen ist an genau einer Stelle nicht möglich, ohne dass eine Fläche etwas
Falsches sagt (00:00) oder etwas Sinnloses (E-Mail in der Hauptanwendung). Deshalb: **ein
wortgleicher Kern**, dazu genau ein Satz je Fläche.

**Kern (wortgleich in beiden Flächen):**

> Ein Kalendertag, die Uhrzeit ist optional. Überfällig ist die Frist erst ab dem Folgetag.
> Leer lassen heißt: keine Frist. Sie ändert nichts an Pools, Spalten, Buchungen oder Export.

**Add-in, vorangestellt:**

> SuperTakt liest die Frist nicht aus der E-Mail — Sie tragen sie selbst ein.

**Hauptanwendung, angehängt:**

> Ohne eigene Uhrzeit gilt 00:00.

Gesamtfassung Add-in: „SuperTakt liest die Frist nicht aus der E-Mail — Sie tragen sie selbst ein.
Ein Kalendertag, die Uhrzeit ist optional. Überfällig ist die Frist erst ab dem Folgetag. Leer
lassen heißt: keine Frist. Sie ändert nichts an Pools, Spalten, Buchungen oder Export.“

Gesamtfassung Hauptanwendung: „Ein Kalendertag, die Uhrzeit ist optional. Überfällig ist die Frist
erst ab dem Folgetag. Leer lassen heißt: keine Frist. Sie ändert nichts an Pools, Spalten,
Buchungen oder Export. Ohne eigene Uhrzeit gilt 00:00.“

Begründung der Einzelentscheidungen:

- „liest … nicht aus“ statt „sucht … nicht nach“: sagt genauer, was E-074 Punkt 4 ausschließt
  (kein erkanntes Muster), und ist kürzer, ohne Inhalt zu verlieren.
- „Überfällig ist die Frist erst ab dem Folgetag“ ist neu und trägt A-19.6/A-27.9. Ohne diesen Satz
  erwartet jemand, der 14:00 einträgt, um 14:01 eine rote Marke. Das Wort „überfällig“ ist einer
  der drei benannten Zustände aus A-19.5 und passt deshalb.
- Beide Gesamtfassungen sind länger als V-04, keine ist kürzer; damit ist die Auflage aus T-165
  eingehalten. Die Länge liegt im Bereich eines Feldhinweises, nicht eines Erklärkastens.
- Das Wort „Frist“ bleibt das einzige Wort für die Sache (A-19.2).

### Bündelung und Gleichlauf (E-118, F-23)

- Der Satz entsteht **nicht** im JSX. Hauptanwendung: als Schlüssel in `apps/web/src/lib/labels.ts`
  oder merkmalseigen unter `features/todos`. Add-in: im gebündelten Textbestand des Add-ins, nicht
  in `TaskPane.tsx`.
- Der Kern ist ein **eigener Schlüssel** (Vorschlag: `deadlineHintCore`), die flächeneigenen Sätze
  eigene Schlüssel (`deadlineHintAddinPrefix`, `deadlineHintDefaultTime`). So übersetzt die spätere
  Umschaltung (A-28.2 für die Hauptanwendung, das Add-in folgt nach E-120 später) den Kern einmal je
  Fläche.
- Ein gemeinsamer Ablageort über beide Anwendungen ist nicht vorgesehen: `packages/domain` ist für
  Oberflächentexte ausgeschlossen (E-121 Punkt 9). Deshalb stehen zwei Kopien, und ihr Gleichlauf
  wird **gemessen**: ein Prüfschritt (in `proof:addin` oder einem kleinen eigenen Nachweis) vergleicht
  den Kern zeichengleich zwischen beiden Bündeln. Ohne diese Messung laufen die Fassungen wieder
  auseinander, wie `textbestand.md:1696-1698` es beschreibt.
- Englische Fassung als Entwurf für die spätere Übersetzung, **nicht** jetzt einzubauen:
  „A calendar day; the time is optional. The deadline only becomes overdue the next day. Leave empty
  for no deadline. It does not affect pools, columns, bookings or export.“ Add-in-Präfix: „SuperTakt
  does not read the deadline from the email — you enter it yourself.“ Hauptanwendung: „Without a
  time of its own, 00:00 applies.“ Endgültig legt das der Übersetzungsauftrag fest.

**E-087, gemessen:** Beide heutigen Wortlaute stehen in keinem Prüffall (`tests/**`,
`apps/*/test/**`, `packages/*/test/**`, `apps/outlook-addin/scripts/proof-addin.mjs`). Sie stehen
in `docs/design/textbestand.md:951` (SP-04) und `:1792`; ux-designer zieht beide nach.

### Befunde zu Punkt 2

```
GF-01  Add-in / Fristfeld          Abweichung: A-19.7 fehlt im Hinweis; kein Satz dazu, dass die Uhrzeit die Fälligkeit nicht verschiebt (A-19.6, A-27.9).
                                   Vorschlag: Gesamtfassung Add-in oben. Blockierend für O-GF.
GF-02  Hauptanwendung / Fristfeld  Abweichung: Satz zur Fälligkeit fehlt; Sätze stehen im JSX (`TodoFormDialog.tsx:254`) statt gebündelt (E-118; die Stelle wird ohnehin berührt).
                                   Vorschlag: Gesamtfassung Hauptanwendung oben, als Schlüssel. Blockierend für O-GF.
GF-03  beide / Gleichlauf          Abweichung: kein Messpunkt für den gemeinsamen Kern.
                                   Vorschlag: zeichengleicher Vergleich des Kerns in einem Nachweislauf. Blockierend für O-GF.
GF-04  Spezifikation A-19.6        Abweichung (Konflikt, nicht blockierend für O-GF): A-19.6 „Die Frist ist ein Tag, keine Uhrzeit“ steht unverändert,
                                   A-10.14, A-27.7 und A-27.9 führen eine optionale Uhrzeit ein. A-10.14 hebt ausdrücklich nur A-19.2/A-19.3 auf, nicht A-19.6.
                                   Ebenso E-074 Punkt 4 („keine Uhrzeit“ an der Add-in-Tür) und CLAUDE.md „Frist und Anhänge“.
                                   Vorschlag: Orchestrator ergänzt A-19.6 um „Eine optionale Uhrzeit ist Beiwerk; die Zustände bleiben Tagesvergleiche (A-27.9).“
GF-05  Add-in ↔ Hauptanwendung      Abweichung (Nebenbefund): Ein Todo aus dem Add-in ohne Uhrzeit hat `dueTime = null`, eines aus der Hauptanwendung 00:00 (A-27.7).
                                   Zwei gleich eingegebene Fristen sehen danach verschieden aus. Vorschlag: Frage an den Orchestrator (unten), ob A-27.7 auch für die Add-in-Anlage gilt.
```

**Urteil zu O-GF: Wortlaut wie oben freigegeben; Umsetzung in einem Auftrag für beide Flächen
(integration-dev und frontend-dev in derselben Welle, getrennte Dateien).** Blockierend für die
Abnahme: GF-01, GF-02, GF-03.

---

## 3. O-CJ — TP-FRIST-08 und TP-ANH-20

### TP-FRIST-08 — Dashboard zeigt eine Zahl statt einer Frist-Marke

- A-19.4 verlangt: „Die Frist ist in der **Todo-Ansicht** sichtbar, ohne dass man das Todo öffnen
  muss.“ Gemeint sind die Stellen, an denen ein Todo als Zeile oder Karte erscheint.
- Gebaut und in `tests/e2e/deadline-lifecycle.spec.ts` gemessen: Todo-Liste, Kanban-Karte und
  Detailansicht zeigen die Frist mit Zustand. Das deckt A-19.4.
- Das Dashboard ist kein Todo-Ansicht im Sinn von A-19.4. „Zuletzt bearbeitet“ beantwortet eine
  andere Frage (woran war ich zuletzt), die Kachel „Überfällig“ mit einer Zahl
  (`DashboardScreen.tsx:98-112`, im Dienst gezählt, nur bei Wert größer null) ist ein zusätzliches
  Angebot und keine Pflicht aus A-19.4.
- Der Testplan (`docs/testplan.md:3778-3783`) erhebt die Dashboard-Kachel zur Mindeststelle, „eine
  Stelle, die die Frist nur in der Detailansicht zeigt, verfehlt A-19.4 wörtlich“. Das verwechselt
  zwei Dinge: die Regel verbietet, die Frist **nur** in der Detailansicht zu zeigen, sie verlangt
  keine Marke an jeder Liste mit Todo-Namen.

**Urteil: Plan falsch, Bau richtig. A-19.4 ist erfüllt.** e2e-tester berichtigt TP-FRIST-08
(`docs/testplan.md` Abschnitt 25, Fall und Ebene): Mindeststellen Todo-Liste, Kanban-Karte,
Pool-Ansicht, Detailansicht; das Dashboard als eigener Fall „Kachel ‚Überfällig‘ zeigt die Zahl der
offenen überfälligen Todos, fehlt bei null“. Keine neue A-ID nötig.

Nebenhinweis zur Kachel, nicht blockierend: Die Zahl muss als Zahl **und** Wort lesbar sein
(„3 überfällig“), nicht nur als rote Ziffer (WCAG 1.4.1). Das wird im Fall mitgeprüft.

### TP-ANH-20 — `.lnk` wird schon beim Anlegen abgewiesen

- Gebaut: `checkAttachmentPath` (`packages/domain/src/attachment.ts:473`) weist die fünf
  Umleitungsendungen `INDIRECT_EXTENSIONS` (`:333-339`) an **jeder** Schreibtür ab: Anlegen in der
  Hauptanwendung, Fremdimport, Add-in. Dieselbe Liste prüft die Hülle vor dem Öffnen
  (`attachment.rs:31`), der Gleichlauf ist gemessen (E-085).
- A-19.23c deckt die Abweisung **nur** für Dateien, die aus einer E-Mail übernommen werden
  (Abschnitt 19.5), und verweist auf A-19.29 (Meldung im Add-in-Ergebnis).
- Für den Dateianhang von Hand (A-19.9, A-19.10) und für Anhänge aus Fremdimporten (A-20.x) gibt
  es **keine A-ID**, die eine Endung ausschließt. Gedeckt ist das nur durch Auflagen des
  Bedrohungsmodells (A-A-4/A-A-5/A-A-8, `path_indirect_extension`) und die Begründung in E-072.
- E-072 Punkt 3 nennt `.lnk` als Beispiel für die **Rückfrage**. Das widerspricht der Abweisung
  nicht: Die Rückfrage bleibt für alle zulässigen Dateien (`.bat`, `.exe`, TP-ANH-19); eine
  Umleitungsdatei ist gar nicht zulässig, weil ihr angezeigter Pfad ihr Ziel verschweigt, und die
  Rückfrage könnte deshalb nicht nennen, was sie startet.

**Urteil: Plan falsch, Bau richtig, aber an der Haupttür ungedeckt.** Die schärfere Kontrolle
bleibt. Es fehlt eine A-ID. Vorschlag an den Orchestrator (Spezifikation gehört dem Auftraggeber):

> **A-19.10a** — Ein Dateianhang, dessen Endung eine Umleitungsart ist (`.lnk`, `.url`, `.pif`,
> `.scf`, `.desktop`), wird auf **keinem** Weg angelegt: nicht von Hand, nicht aus einem
> Fremdimport, nicht aus dem Add-in (A-19.23c). Die Abweisung nennt den Grund, nicht den
> abgewiesenen Pfad. Eine solche Datei gilt nicht als Anhang, weil ihr angezeigter Pfad ihr Ziel
> verschweigt; die Rückfrage vor dem Öffnen (A-19.26, E-072 Punkt 3) könnte sie deshalb nicht
> ehrlich benennen.

Alternativ A-19.23c so umformulieren, dass er für alle Schreibwege gilt; eine eigene ID unter 19.2
ist klarer, weil 19.5 nur das Add-in behandelt. e2e-tester stellt TP-ANH-20 auf die neue ID um
(Türprüfung „Anlegen wird mit Grund abgewiesen, Bestand unverändert“) und streicht den
Rückfragefall für `.lnk` aus der Tabelle `docs/testplan.md:4121`.

Zusätzlich zu prüfen im selben Auftrag (Nebenpunkt, UX): Die Meldung an der Haupttür muss dem
Benutzer sagen, **warum** und **was stattdessen** („Verknüpfungen werden nicht angehängt. Hängen
Sie die Zieldatei selbst an.“), sonst steht er vor einer Abweisung ohne Weg weiter. Den heutigen
Wortlaut der Meldung habe ich nicht gegen diesen Maßstab gelesen; das gehört in die Abnahme.

### Befunde zu Punkt 3

```
CJ-01  Testplan / TP-FRIST-08     Abweichung: Plan verlangt eine Frist-Marke im Dashboard, die A-19.4 nicht verlangt.
                                  Vorschlag: Testplan berichtigen (e2e-tester). Nicht blockierend.
CJ-02  Spezifikation / Anhänge    Abweichung: Abweisung der Umleitungsendungen an Haupttür und Fremdimport ohne A-ID (nur A-19.23c für das Add-in).
                                  Vorschlag: A-19.10a wie oben (Orchestrator). Blockierend für den Abschluss von O-CJ.
CJ-03  Testplan / TP-ANH-20       Abweichung: Plan erwartet eine Rückfrage, die es für `.lnk` nicht geben kann.
                                  Vorschlag: auf A-19.10a umstellen (e2e-tester), nach CJ-02.
```

**Urteil zu O-CJ: Bau in beiden Fällen richtig. TP-FRIST-08: A-19.4 genügt, Plan berichtigen.
TP-ANH-20: Nacharbeit an der Spezifikation (CJ-02) – es fehlt eine A-ID für die Abweisung an der
Haupttür.**

---

## Gesamturteil

| Punkt | Urteil | blockierend |
|---|---|---|
| C-22 / O-CP-1 / O-CP | **freigegeben zum Bau** mit K-1 bis K-17 | C22-01, C22-02 (für die spätere Abnahme) |
| O-GF | **freigegeben** mit dem Wortlaut oben | GF-01, GF-02, GF-03 (für die spätere Abnahme) |
| O-CJ | **Nacharbeit** (Spezifikation) | CJ-02 |

## Offene Fragen an den Orchestrator

1. **GF-05:** Soll ein Todo aus dem Add-in mit gesetztem Datum und ohne Uhrzeit ebenfalls 00:00
   erhalten (A-27.7 gilt heute nur „im Todo-Dialog“)? Falls ja, fällt der flächeneigene Satz
   „Ohne eigene Uhrzeit gilt 00:00.“ in den gemeinsamen Kern.
2. **GF-04:** Ergänzung von A-19.6 um die optionale Uhrzeit (Spezifikation, E-074 Punkt 4 und
   CLAUDE.md ziehen nach).
3. **CJ-02:** A-19.10a als neue ID oder Umformulierung von A-19.23c.
