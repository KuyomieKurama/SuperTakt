# T-261 — Die großen Dateien in `packages/domain`

Aufgabe: T-261 — Dateien in `packages/domain` nach Verantwortlichkeiten schneiden
Status: **braucht Review** — fertig. **Zwei** Schnitte gemacht, **drei** abgelehnt,
jeder mit gezählten Kosten. Alle Läufe grün, `proof:all` Ausgangskode 0,
`test:coverage` zeichengleich (88 / 1570 / 3), Anweisungszeilen der geschnittenen
Dateien 504 → 504 mit **keiner** Abweichung außerhalb der Importzeilen.

---

## 0 Kurzfassung in fünf Zeilen

**Zwei Schnitte.** `tag.ts` → `tag.ts` + `pool.ts`; `time-entry.ts` →
`time-entry.ts` + `export-status.ts`. Beide Grenzen standen als
Abschnittsüberschrift in der Datei, beide trennen eigene Anforderungen und eigene
Tabellen, beide haben **null** Verwendungen über die Grenze in der falschen
Richtung.

**Drei Ablehnungen, alle mit Kosten gemessen, nicht mit Geschmack begründet.**
`attachment.ts` (drei unveränderliche Nennungen in einer SHA-256-geprüften
Migration, zwei heimatlose Helfer, eine Kopftabelle, die der Gegenstand ist),
`export.ts` (die Exportfläche R-06 mit einer absichtlich abschließenden
Importliste), `kernel.ts` (der Schnitt kostet **entweder** eine geöffnete
Sicherheitsschranke **oder** einen halbierten Begriff).

**Ein Befund wiegt schwerer als beide Schnitte:** Eine Regel steht zweimal, und
die beiden Fassungen sind auseinandergelaufen — Abschnitt 5.

**Ein Fehler aus meiner eigenen letzten Aufgabe behoben:** T-257 hat zwei
Kommentare in `packages/domain/src/pool-movement.ts` auf sich selbst zeigen
lassen (Abschnitt 6).

---

## 1 Was zuerst gemessen wurde — die Zahl, die den Zuschnitt umdreht

`packages/domain` ist **6 975 Zeilen** groß und hat **1 790 Anweisungszeilen**.
Drei Viertel des Pakets sind Prosa.

| Datei | Zeilen | Anweisungszeilen |
|---|---:|---:|
| `tag.ts` | 1 264 | 272 |
| `attachment.ts` | 1 062 | 230 |
| `time-entry.ts` | 676 | 232 |
| `export.ts` | 558 | 196 |
| `kernel.ts` | 409 | 140 |

Das ändert die Frage. „1 264 Zeilen" ist hier nicht „zu viel Code", sondern „zu
viele Gegenstände in einem Aktendeckel" — oder eben nicht. Der Maßstab kann
deshalb nicht die Zeilenzahl sein, sondern nur: **Wie viele Dinge stehen hier,
und weiß der Leser vorher, welches davon er sucht?**

---

## 2 Schnitt 1 — `tag.ts` → `tag.ts` (197) + `pool.ts` (1 116)

### 2.1 Die Grenze stand ausgeschrieben da

Die Datei trug ihre eigenen Trennlinien als Abschnittsüberschriften:

| Gegenstand | Anforderung | Tabelle | Anweisungszeilen |
|---|---|---|---:|
| Tag-Ordner, Baum, Zyklusprüfung, Standard-Tags | A-4.*, A-9.* | `tag_folder`, `tag`, `default_tag` | 75 |
| Pools und Kanban-Spalten | A-3.*, E-054 bis E-057 | `pool`, `pool_rule` | 196 |

**Der Name war seit E-055 falsch.** Eine Poolregel nennt fünf Achsen —
erforderliche Tags, ausgeschlossene Tags, Status, Erledigt, Exportstatus — und
**vier davon sind keine Tags**. Wer den Exportstatusfilter suchte, suchte ihn in
einer Datei namens `tag.ts`.

### 2.2 Die Kopplung, gezählt

Ich habe beide Hälften auf jede Verwendung der anderen abgesucht:

| Richtung | Treffer |
|---|---:|
| Poolteil benutzt `Tag`, `TagFolder`, `TagTree`, `checkFolderMove`, `DefaultTag` | **0** |
| Tagteil benutzt `Pool`, `matchesPool`, `resolvePool`, eine Achse, `isVisibleInPool` | **0** |

Beide Hälften kennen ausschließlich Kennungstypen aus `kernel.ts`. Das ist genau
der Punkt, den `PoolTagTerm` seit jeher beschreibt: Ein Ordnerterm ist eine
bequeme Schreibweise für „diese Tags", und wer die Regel auswertet, sieht am Ende
eine Tagmenge und keinen Ordner mehr. Die Datei hat also nie zwei verzahnte Dinge
getragen, sondern zwei nebeneinanderliegende.

### 2.3 Der abgelehnte **dritte** Teil: Standard-Tags

`DefaultTag` + `ApplyDefaultTags` + `applyDefaultTags` sind A-9, eigene Tabelle
`default_tag`, eigene Überschrift. Nach der Regel „eigene Anforderung, eigene
Tabelle" wäre `default-tag.ts` fällig gewesen. **Verworfen**, weil die Rechnung
hier andersherum ausgeht:

- **17 Anweisungszeilen.** Die Datei wäre die zweitkleinste des Pakets.
- `tag.ts` steht nach dem Schnitt bei **75** Anweisungszeilen — es gibt keinen
  Druck, es gibt nichts zu entlasten.
- Der Gegenstand ist derselbe: `applyDefaultTags` rechnet ausschließlich auf
  `TagId`-Listen. „Welche Tags bekommt ein neues Todo" ist eine Aussage über
  Tags, nicht eine dritte Sache.

Zwei Dateien statt drei.

### 2.4 Der abgelehnte Schnitt **innerhalb** von `pool.ts`

`pool.ts` ist mit 1 116 Zeilen weiterhin die größte Datei des Pakets. Der
naheliegende zweite Schnitt wäre gewesen: die Achsenmaschinerie (T-080:
`POOL_RULE_AXIS_CONDITIONS`, `POOL_RULE_AXIS_IDS`, `POOL_RULE_AXIS_OF_FIELD`,
`countPoolRuleConditions`, `poolRuleIsEmpty`, `tagAxisIsUnresolved`,
`poolRuleMatchesNothing`, `resolvePool`) von der Zugehörigkeitsregel
(`matchesPool`) trennen.

**Verworfen, weil er einen Zyklus erzeugt:**

- `POOL_RULE_AXIS_OF_FIELD` ist über `keyof MatchesPoolRule` getippt — die
  Achsentabelle braucht die Regelseite von `matchesPool`.
- `matchesPool` ruft `poolRuleMatchesNothing` als **Wert** auf — die
  Zugehörigkeitsregel braucht die Achsenmaschinerie.

Zwei Dateien, die aufeinander zeigen, sind keine Grenze, sondern eine Naht mit
Klebeband. Und der Grund dafür ist genau der Zweck des Ganzen: Die Tabelle ist
die Wache, die rot wird, wenn eine **sechste** Achse dazukommt — sie muß den
Aufrufer sehen, den sie bewacht.

Der zweite denkbare Schnitt — `IsVisibleInPool` heraus, weil es
Sicht**barkeit** und nicht Zugehörigkeit ist — sind **2 Anweisungszeilen**. Eine
Datei dafür wäre die kleinste des Bestands.

**`pool.ts` ist damit die ehrliche große Datei dieser Aufgabe.** Sie ist eine
Sache: die Regel, die über die Zugehörigkeit eines Todos entscheidet, und die
Auskünfte, die die Oberfläche über diese Regel braucht.

---

## 3 Schnitt 2 — `time-entry.ts` → `time-entry.ts` (475) + `export-status.ts` (254)

Zwei der Regeln, an denen Geld hängt, lagen in **einer** Datei: die Timer-Regel
(A-6.8, A-2.5) und der Exportstatuswechsel (A-6.9, E-012, E-047, R-10). Jede hat
jetzt ihre.

Die Grenze stand auch hier als Überschrift da („Exportstatuswechsel", „Protokoll
des Exportstatus — Tabelle `export_audit`"). Gemessen:

| | |
|---|---|
| Timerteil ruft `isLocked` / `checkExportStatusTransition` | **0×** |
| Exportstatusteil ruft `decideTimerStart` / `decideTimerStop` / `decideOrphanedTimer` / `determineReopen` | **0×** |

### 3.1 Der Wert bleibt an der Buchung, die Regel zieht um

`ExportStatus` ist **in `time-entry.ts` geblieben**, und das ist die eine
Entscheidung, die den Schnitt trägt. Sie war nicht Geschmack:

- `ExportStatus` ist eine **Spalte** von `time_entry`, wie `startedAt` und
  `durationSeconds`.
- `IsLocked` liest sie als `Pick<TimeEntry, 'exportStatus'>` — der Typ ist
  absichtlich an die Entität gebunden.

Läge der Wert drüben, zeigten beide Dateien aufeinander. So ist die Richtung
einseitig und im Kopf beider Dateien ausgeschrieben: `export-status.ts` liest
`time-entry.ts`, `time-entry.ts` liest `export-status.ts` nicht.

Die Alternative — `IsLocked` auf `{ readonly exportStatus: ExportStatus }`
umschreiben, was TypeScript strukturell nicht unterscheiden kann — wurde
verworfen: Sie hätte den Zyklus zum Preis einer Signatur gelöst, deren `Pick`
ausdrücklich sagt, worüber hier geurteilt wird.

**`export-status.ts` liegt bewußt nicht in `export.ts`.** `export.ts` ist über
`@takt/domain/export` für `packages/export` sichtbar; der Exportmotor hätte dann
die Statusregel gesehen, die ihn nichts angeht (R-06). Der Grenzwächter bestätigt
das nach dem Schnitt unverändert: „importiert nur `./kernel.ts` und
`./rounding.ts`, 7 von 7 Typbehauptungen vorhanden."

---

## 4 Die drei abgelehnten Schnitte, mit gezählten Kosten

### 4.1 `attachment.ts` (1 062) — der Schnitt je Art

Der naheliegende Schnitt: `attachment-link.ts`, `attachment-path.ts`,
`attachment-image.ts`. Drei Kosten, jede einzelne genügt:

**1. Drei Sätze in einer Migration, die niemand mehr ändern kann.**
`0015_todo_attachment.up.sql` nennt `packages/domain/src/attachment.ts` dreimal:
als Ort der Normalisierung (A-A-13), als Ort des Zweigs je Art („Eine vierte Art
ist ein INSERT und ein Zweig in …"), als Ort der drei Grenzwerte („4 096 ist
`MAX_ATTACHMENT_PATH_BYTES`, die weiteste der drei Grenzen aus …").
`packages/storage/scripts/embed-migrations.mjs` schreibt einen **SHA-256** über
den Inhalt in `schema_migration.checksum`. Der Kommentar ist damit dauerhaft
unveränderlich — ein Schnitt macht zwei dieser drei Sätze falsch, ohne daß sie
sich je korrigieren ließen.

**2. Zwei dateiprivate Helfer würden öffentlich oder doppelt.**

| Helfer | gebraucht von | wäre nach dem Schnitt |
|---|---|---|
| `byteLength` | `normalizeAttachmentLink` **und** `checkAttachmentPath` | eine neue öffentliche Ausfuhr von `@takt/domain` — oder eine Abschrift |
| `PlatformUrl` / `ParsedUrl` | `normalizeAttachmentLink` **und** `attachmentLabel` | dasselbe |

`attachmentLabel` kann außerdem in keiner der drei Dateien wohnen: Es beschriftet
**alle drei** Arten in einem `switch`.

**3. Die Datei hat eine These, und die These ist der Vergleich.** Ihr Kopf stellt
die drei Arten in **einer** Tabelle gegenüber — was Takt hält, was „öffnen"
heißt. Drei Dateien hätten drei Kopfzeilen und keine Tabelle. Dazu: 1 062 Zeilen
sind hier 230 Anweisungszeilen.

**Nebenbefund, gemeldet, nicht behoben:** `inRanges` steht zweimal im Paket
(`characters.ts:190`, `attachment.ts:337`), zeichengleich, und die zweite Fassung
sagt es selbst („Dieselben vier Zeilen wie in `characters.ts`"). Vier Zeilen, kein
fachlicher Satz, ausdrücklich bekannt — ich habe es nicht angefaßt, weil das
Zusammenlegen eine dritte öffentliche Ausfuhr wäre und der Auftrag Umbau, nicht
Ausbau war.

### 4.2 `export.ts` (558) — die Exportfläche ist eine Grenze, kein Ordner

Drei Dinge hängen an dieser Datei, jedes einzelne genügt:

1. `packages/domain/package.json` führt sie als zweiten Einstiegspunkt
   (`"./export"`). **`package.json` ändert nur der Orchestrator.**
2. `check-export-boundary.mjs` hält `allowedExportSurfaceImports` als
   **absichtlich abschließende** Liste: `./kernel.ts`, `./rounding.ts`. Der
   Kommentar dort sagt ausdrücklich, warum sie abschließend ist.
3. Die sieben Typbehauptungen (`NoteBoundaryIsSealed`, `TodoSourcesAreCovered`,
   `ExportCandidateHasNoTodoNote`, …) müssen neben den Typen stehen, die sie
   versiegeln. Ein Schnitt setzt die Wache in eine andere Datei als ihren
   Gegenstand — genau die Bauart, gegen die dieser Bestand sonst prüft.

Dazu zwei weitere unveränderliche Nennungen in Migrationen.

### 4.3 `kernel.ts` (409) — der Schnitt kostet eine Sicherheitsschranke

Dies ist die Ablehnung, die ich **umgeworfen** habe. Ich hatte `calendar-day.ts`
bereits entschieden und dann gemessen.

`kernel.ts` trägt zwei verschiedene Dinge, und das ist unstrittig: das Alphabet
(Kennungen, Skalare, `Result`, Fehlerkatalog — von jedem Modul importiert) und
ein Kapitel echter Rechnung (der Tagesbegriff aus E-025, zwei Anläufe für den
Zonenversatz, Zeitumstellung in beide Richtungen, `Intl` als einzige
Plattformberührung des ganzen Pakets — von drei Modulen importiert). Der Kopf der
Datei behauptet sogar noch „Es steht keine Laufzeitlogik in diesem Paket".

Der Umzug hätte **vier** Importzeilen gekostet, alle in meiner Hoheit, und keine
einzige Zeile außerhalb — `index.ts` verteilt weiter. Ich hielt ihn für
kostenlos. Er ist es nicht:

**`export.ts` benutzt `resolveTimeZone` und `toCalendarDay`.** Nach dem Umzug
importiert die Exportfläche `./calendar-day.ts`, und dann gibt es genau zwei
Wege:

- `allowedExportSurfaceImports` von zwei auf drei Einträge erweitern. Also eine
  Liste öffnen, deren Kommentar sagt, sie sei abschließend, und deren Zweck es
  ist, die Fläche zu begrenzen, die `packages/export` sehen kann — **für eine
  Umsortierung**. Das ist der Preis, den ich nicht zahle.
- Den Begriff halbieren: `toCalendarDay` bleibt in `kernel.ts`,
  `calendarDayBounds` zieht um. Das wäre eine erfundene Grenze mitten durch
  einen Gegenstand, und `calendarDayBounds` importierte `toCalendarDay` zurück.

Beides ist teurer als 409 Zeilen mit 140 Anweisungszeilen. `kernel.ts` bleibt.

---

## 5 Der Befund — dieselbe Regel steht zweimal, und einmal falsch

Das Paket ist nach „Vertrag oben, `// Umsetzung (T-009)` unten" gebaut. Die Folge
war keine Absicht: **Jede Regel trägt zwei Beschreibungen**, eine am
Funktionstyp, eine an der Umsetzung, und sie paraphrasieren einander. Gezählt —
acht Fälle:

`checkFolderMove`, `matchesPool`, `isVisibleInPool`, `applyDefaultTags`,
`determineReopen`, `isLocked`, `checkExportStatusTransition`,
`roundToQuarterHours`.

Bei **einem** davon sind die beiden Fassungen auseinandergelaufen, und das ist
der Befund, um den es geht:

| Stelle | Was sie sagt |
|---|---|
| `ExportStatusTransition` (Typ) | „Erlaubte Übergänge. **Es gibt genau drei**", darunter drei Pfeile: `export_run`, `not_billed`, `reset` |
| `checkExportStatusTransition` (Umsetzung) | „**Es gibt genau zwei** erlaubte Übergänge, und jeder hat genau einen Auslöser", darunter **zwei** Pfeile — `not_billed` fehlt im Bild |

**Der Code ist richtig** und hat drei Zweige; die Union hat drei Glieder. Falsch
ist das zweite Bild. Es steht nach dem Schnitt in derselben Datei
(`export-status.ts`), vierzig Zeilen unter dem ersten — der Widerspruch ist damit
zum ersten Mal auf einem Bildschirm sichtbar.

**Ich habe ihn nicht geändert.** Der Satz stammt aus einer Prüferrunde
(E-047-Nachtrag), und Streichung und Ausgleich gehören in **einen** Auftrag
(E-081 Punkt 4, E-078 Punkt 3). Er ist hiermit gemeldet.

---

## 6 Der Fehler aus T-257, den ich dabei gefunden und behoben habe

`packages/domain/src/pool-movement.ts` verwies an **zwei** Stellen auf „die
Stelle, die rechnet (`pool-movement.ts`)" — also auf sich selbst.

Entstanden ist das in meiner letzten Aufgabe: T-257 hat
`apps/local-api/src/usecases/pool-movement.ts` nach
`apps/local-api/src/pool-movement.ts` verschoben, und dabei wurde `usecases/`
auch in diesem **Domänen**kommentar weggekürzt. Aus einem Zeiger über die
Paketgrenze wurde ein Selbstverweis, der dem Leser genau die Auskunft verweigert,
die er gibt.

Behoben: beide Stellen nennen jetzt `apps/local-api/src/pool-movement.ts`. Die
Lehre steht in `docs/decisions/domain.md` Abschnitt 3.2, nicht im Code — ein
Pfad, der über eine Paketgrenze zeigt, wird voll geschrieben.

Gegenprobe über beide Pakete: alle übrigen acht Verweise aus `packages/domain`
und `packages/storage` auf Dateien in `apps/local-api` zeigen auf existierende
Dateien. Nur dieser eine war kaputt.

---

## 7 Zeilennummern in Prosa halten nicht — schon vor dieser Aufgabe nicht

Beim Nachziehen der Verweise habe ich die Anker mit Zeilennummer geprüft. Zwei
von drei waren **vor** meiner Änderung falsch:

| Anker | Behauptet | Stand bei HEAD |
|---|---|---|
| `pool-rule-unresolved.test.ts:7` → `tag.ts:946` | `tagAxisIsUnresolved` | Zeile 979 — 33 daneben |
| `pool-rule-unresolved.test.ts:8` → `tag.ts:1003` | `poolRuleMatchesNothing` | Zeile 1036 — 33 daneben |
| `docs/bedrohungsmodell.md:3206` → `time-entry.ts:607` | `orphan_discarded` | traf — bewegt sich durch diesen Schnitt |
| dieselbe Zeile → `usecases/timer.ts:547` | Durchreichen des Grundes | **Datei existiert seit T-257 nicht mehr** |

Das ist kein Nebenbefund: Ein Anker auf eine Zeilennummer ist ein Anker auf einen
Stand, nicht auf eine Sache.

---

## 8 Kommentare — vierzehn geprüft, vierzehn geblieben

Geprüft wurden alle vierzehn Stellen im Paket, die mit „Bis T-…" beginnen, also
die Kandidaten für Vorgeschichte. **Alle vierzehn bleiben.** Die vollständige
Tabelle mit der Begründung je Stelle steht in `docs/decisions/domain.md`
Abschnitt 3; hier die Prüfung, an der sie sich gemessen haben:

> Es bleibt, was eine Wiederholung verhindert oder erklärt, warum der heutige
> Code überrascht.

Beispiele, die zeigen, warum das kein bequemes Ergebnis ist:

- `kernel.ts` — „Bis T-042 rechnete der SQLite-Adapter selbst:
  `date(started_at) >= date(?)`." Ohne diesen Satz erfindet der nächste Adapter
  den Tagesbegriff neu, und die Tagessumme wird auf der falschen Seite gerundet.
  Das ist die teuerste Zeile Prosa im Paket.
- `attachment.ts` — „Bis T-159 stand hier ein `if (host !== '')`, das diese
  Zusage ein zweites Mal prüfte — ein Kommentar in Codeform, den kein Prüffall
  erreichen kann." Der Satz **ist** der Grund, warum dort heute kein Code steht.
- `pool-movement.ts` — „Bis T-107 stand hier als Begründung, zwei Pools dürften
  denselben Namen tragen. Das ist falsch." Eine Begründung, die nachweislich
  falsch war, und der Satz, der sie nicht wiederkommen läßt.

**Nach `docs/decisions/domain.md` gewandert ist damit kein Satz aus dem
Quelltext**, sondern allein die Entscheidung darüber — samt der gezählten Gründe,
damit niemand die Prüfung ein zweites Mal machen muß. Das Papier hält außerdem
die drei Ablehnungen aus Abschnitt 4 fest, damit ein späterer Auftrag nicht
dieselben drei Kosten noch einmal entdeckt.

---

## 9 Der Mengenvergleich

Alle Anweisungszeilen der beiden geschnittenen Dateien, gegen
`git show HEAD:…` als **Menge** verglichen (nicht als Diff):

```
Anweisungszeilen vorher: 504   nachher: 504

nur vorher (5)                      nur nachher (5)
  PoolId,                             import { err, ok, taktError } from './kernel.ts';
  StatusId,                           import type { PoolId, StatusId, TagFolderId, TagId, Timestamp } …
  Seconds,                            import type { Seconds, Timestamp, TimeEntryId, TodoId } …
  TodoId,                             import { secondsBetween } from './kernel.ts';
  import { err, ok, secondsBetween,   import type { ExportStatus, TimeEntry } from './time-entry.ts';
    taktError } from './kernel.ts';
```

**Zehn Zeilen, alle zehn Importzeilen.** Keine einzige Regel-, Typ- oder
Ausdruckszeile ist verschieden. Über das ganze Paket: 1 790 → **1 792**
Anweisungszeilen, und die zwei sind die beiden neuen `export * from` in
`index.ts`.

---

## 10 Läufe

Alle nach dem Umbau, in dieser Runde gelesen.

| Lauf | vorher | nachher |
|---|---|---|
| `typecheck` (8 Projekte + 7 Testprojekte + e2e) | 0 | **0** |
| `boundaries` | 0, 5 Prüfsätze | **0, 5 Prüfsätze, wortgleich** |
| `proof:all` (zwanzig Läufe) | 1 — **fremd**, siehe unten | **0** |
| `proof:layers` | 20 bestanden | **20 bestanden** |
| `test:coverage` | 88 / 1570 / 3 | **88 / 1570 / 3** |

`proof:all` im Einzelnen, nachher — jede Zahl zeichengleich zum Ausgangsstand:

```
codepoints 46 · migrations ok · openapi 115 · callers 74 · conflicts 154
tags 45 · access 109 · export 98 · export-api 72 · taskpane 29 · foreign 21
surface 27 · addin-wiring 32 · layers 20 · route-policy 44 · release-safety 32
shell-surface 7 Prüfungen + 54 Gegenproben · template-fields 30
db-permissions übersprungen (Windows, T-011) · addin 248
```

**Die eine rote Zahl im Ausgangslauf war nicht meine.** `proof:export-api` brach
mit „Auf 127.0.0.1:17843 lauscht bereits etwas" ab. Gemessen: zwei fremde
Node-Prozesse (PID 8612 auf 5173 seit 19:36, PID 10608 auf 17843 seit 19:59) —
der Entwicklungsdienst eines parallel laufenden Agenten. **Ich habe sie nicht
abgeschossen**, sondern die elf übrigen Läufe einzeln gemessen und den
Gesamtlauf wiederholt, als die Ports frei waren. Danach: Ausgangskode 0,
`export-api` 72 bestanden.

---

## Artefakte

**Neu**
- `packages/domain/src/pool.ts`
- `packages/domain/src/export-status.ts`
- `docs/decisions/domain.md`

**Geändert**
- `packages/domain/src/tag.ts` (1 264 → 197)
- `packages/domain/src/time-entry.ts` (676 → 475)
- `packages/domain/src/index.ts` (zwei Zeilen)
- `packages/domain/src/board.ts` (zwei Importe, ein Satz)
- `packages/domain/src/todo.ts` (drei Sätze)
- `packages/domain/src/pool-movement.ts` (**Fehlerbehebung**, Abschnitt 6)
- `docs/architektur.md` (Tabelle 1.2, ein Absatz, eine Stelle in Abschnitt 3.1)
- `docs/datenmodell.md` (eine Stelle)

**Fremde Hoheit, nur Importpfad, jede Stelle einzeln:** sechs Dateien unter
`packages/domain/test/` — siehe „Offene Fragen", Punkt 3.

---

## Zusammenfassung

`packages/domain` hat 6 975 Zeilen und 1 790 Anweisungszeilen; die „großen
Dateien" sind zu drei Vierteln Begründung. Geschnitten habe ich deshalb nur dort,
wo mehr als ein Gegenstand im Aktendeckel lag und die Grenze bereits als
Abschnittsüberschrift dastand: `tag.ts` trug Tags **und** Pools (null Verwendungen
über die Grenze), `time-entry.ts` trug die Timer-Regel **und** den
Exportstatuswechsel (ebenfalls null). Abgelehnt habe ich drei weitere Schnitte,
jeden mit gezählten Kosten — bei `attachment.ts` drei unveränderliche Nennungen
in einer SHA-256-geprüften Migration und zwei heimatlose Helfer, bei `export.ts`
die abschließende Importliste der Exportfläche, bei `kernel.ts` die Wahl zwischen
einer geöffneten Sicherheitsschranke und einem halbierten Begriff. Der schwerste
Fund ist kein Schnitt: Acht Regeln tragen zwei Beschreibungen, und bei
`checkExportStatusTransition` sagen die beiden „genau drei" und „genau zwei"
Übergänge — der Code hat drei, das zweite Bild ist falsch, und es fällt nur mit
Zustimmung des Prüfers, der es verlangt hat.

## Annahmen

1. **`ExportStatus` bleibt an der Buchung.** Ohne diese Entscheidung zeigten
   `time-entry.ts` und `export-status.ts` aufeinander. Begründung in 3.1.
2. **Standard-Tags bleiben in `tag.ts`**, obwohl sie A-9 und eine eigene Tabelle
   haben — 17 Anweisungszeilen. Begründung in 2.3.
3. **Die Dateinamen** `pool.ts` und `export-status.ts` habe ich gewählt.
   `pool.ts` steht neben dem schon vorhandenen `pool-movement.ts`;
   `export-status.ts` beschreibt, was die Datei tut, obwohl der Typ
   `ExportStatus` nebenan steht — der Kopf sagt das ausdrücklich.
4. **Keine Registrierung nötig.** `packages/domain/package.json` führt nur
   `"."` → `src/index.ts` und `"./export"` → `src/export.ts`; beide unverändert.
   Die neuen Module hängen an `index.ts`, das in meiner Hoheit liegt. Der
   Orchestrator muß nichts eintragen.
5. **Kein Kommentar gestrichen.** Vierzehn Kandidaten geprüft, vierzehn behalten.

## Risiken

- **R-A: Der Widerspruch aus Abschnitt 5 steht weiterhin im Bestand.** Ein
  Kommentar, der „genau zwei Übergänge" sagt und zwei Pfeile zeichnet, während
  daneben drei Zweige stehen, ist die Bauart, an der jemand eines Tages den
  dritten Zweig für überflüssig hält. Er ist jetzt sichtbar; behoben ist er
  nicht.
- **R-B: Prosaverweise über Dateinamen sind nach jedem Schnitt eine Schuld.**
  Fünf fremde Stellen nennen `tag.ts` oder `time-entry.ts` für etwas, das jetzt
  woanders steht. Sie stehen unter „Offene Fragen"; keine davon ist Code, keine
  bricht einen Lauf.
- **R-C: Sicherheitlich unverändert.** Kein Wächter wurde geöffnet, keine
  Ausfuhrfläche vergrößert, keine Zusicherung gelockert. Die Notiz-Trennung
  (R-06) meldet nach dem Schnitt dieselben fünf Prüfsätze wortgleich. Der
  ausdrücklich **nicht** gemachte Schnitt an `kernel.ts` ist die Stelle, an der
  diese Aufgabe eine Schranke hätte öffnen können — sie ist zu geblieben.

## Offene Fragen

1. **An den Prüfer, der E-047 verlangt hat (Abschnitt 5):** Darf der Satz „Es
   gibt genau zwei erlaubte Übergänge" samt seinem zweizeiligen Bild in
   `export-status.ts` durch das dreizeilige Bild vierzig Zeilen darüber ersetzt
   werden? Der Code hat drei Zweige. Ich habe ihn nicht angefaßt (E-078 Punkt 3).
2. **An security-checker:** `docs/bedrohungsmodell.md:3206` nennt zwei Anker in
   **einem** Satz. `packages/domain/src/time-entry.ts:607` traf bis eben und
   bewegt sich durch diesen Schnitt; `usecases/timer.ts:547` zeigt seit T-257 auf
   eine Datei, die es nicht gibt. Vorschlag für beide: den **Bezeichner** nennen
   (`decideOrphanedTimer` in `packages/domain/src/time-entry.ts`,
   `apps/local-api/src/features/timer/`), nicht die Zeile.
3. **An unit-tester** — ich habe in `packages/domain/test/` **ausschließlich
   Importpfade** geändert, sechs Dateien, zehn Zeilen, keine Zusicherung:
   `matches-pool-guard.test.ts` (2), `pool-rule-unresolved.test.ts` (2),
   `tags-and-pools.test.ts` (1 Zeile in 2 geteilt), `timer.test.ts` (1),
   `board.test.ts` (1 dynamischer Import), `export-status.test.ts` (1; die zweite
   Zeile zeigt weiter auf `time-entry.js`, weil `ExportStatus` dort blieb).
   **Nicht angefaßt** habe ich die Prosa mit Zeilenankern — sie gehört dir:
   `pool-rule-unresolved.test.ts` Zeilen 7, 8, 86, 128, 137 (`tag.ts:946`,
   `tag.ts:1003`, `tag.ts:953`, `tag.ts:1004` → jetzt `pool.ts`, und die Zahlen
   waren schon vorher 33 Zeilen daneben), `timer.test.ts` Zeilen 7–8
   (`isVisibleInPool` in `tag.ts` → `pool.ts`), `board.test.ts` Zeile 169
   („tag.ts: …" → `pool.ts`), `export-status.test.ts` Zeilen 19, 32, 87, 114
   (`ExportStatusTransition`/`checkExportStatusTransition` „(time-entry.ts)" →
   `export-status.ts`; Zeile 7 bleibt richtig, `ExportStatus` steht weiterhin in
   `time-entry.ts`). `tags-and-pools.test.ts` Zeilen 9 und 12 und
   `tests/e2e/tags-folders.spec.ts` Zeilen 41 und 190 bleiben **richtig** —
   `checkFolderMove` und der Baum sind in `tag.ts` geblieben.
4. **An frontend-dev:** `apps/web/src/lib/labels.ts` nennt in Zeile 36 und Zeile
   325 `tag.ts` als Ort von `PoolMatchMode`. Der Typ steht jetzt in `pool.ts`.
   Zeile 77 (`time-entry.ts` für den Wertebereich des Exportstatus) bleibt
   richtig. Der Import selbst läuft über `@takt/domain` und ist unberührt.
5. **An den Orchestrator, `inRanges` (4.1):** Vier zeichengleiche Zeilen stehen
   in `characters.ts` und `attachment.ts`, ausdrücklich und mit Kommentar. Soll
   das zusammengelegt werden? Es kostet eine dritte öffentliche Ausfuhr von
   `@takt/domain` für einen Helfer ohne fachlichen Inhalt. Meine Empfehlung:
   nein, lassen — aber es gehört einmal entschieden statt jedes Mal neu bemerkt.

## Nächster Schritt

`pnpm check` als Ganzes durchfahren lassen (ich habe `typecheck`, `boundaries`,
`proof:all`, `proof:layers` und `test:coverage` gemessen; `contrast`,
`verify:bundle`, `test:rust`, `build` und `audit` sind von diesem Umbau nicht
berührt, aber ungemessen), dann die Punkte 1 und 2 der offenen Fragen als **einen**
kleinen Auftrag an den jeweiligen Prüfer geben — beide betreffen einen Satz, den
ein Prüfer verlangt hat, und beide sind in fünf Minuten erledigt, sobald die
Zustimmung da ist.
