# Die Fachlogik — Schnitt der Dateien und Prüfung der Kommentare (T-261)

Dieses Papier nimmt auf, was bei T-261 über `packages/domain` **entschieden**
wurde: welche Datei geteilt wurde, welche ausdrücklich nicht, und was die
Prüfung der Kommentare ergeben hat. Es ist kein Ersatz für die Spezifikation und
keine Anforderungsquelle — die verbindlichen Sätze stehen in `docs/spec.md`, die
Fundorte der Regeln in `docs/architektur.md` Abschnitt 1.2.

Dieselbe Trennlinie wie in `docs/decisions/board.md` (T-253),
`docs/decisions/export.md` (T-254) und `docs/decisions/structure.md` (T-255):
Was der Code selbst braucht, blieb im Code.

**Für dieses Paket gilt die Trennlinie besonders scharf.** `packages/domain` ist
zu drei Vierteln Prosa: 6 975 Zeilen gegen 1 790 Anweisungszeilen. Diese Prosa
ist keine Füllung. Sie ist zum ganz überwiegenden Teil die Begründung dafür, daß
eine Regel **genau einmal** existiert — und ein solcher Satz ist teurer als der
Code, den er begleitet. Der Kommentarteil dieser Aufgabe hat deshalb mehr
bewahrt als bewegt, und das ist unten belegt, nicht behauptet.

## 1 Was geteilt wurde

### 1.1 `tag.ts` → `tag.ts` + `pool.ts`

1 264 Zeilen, die größte Datei des Pakets. Sie trug drei Gegenstände, und der
Schnitt zwischen ihnen stand bereits als Abschnittsüberschrift in der Datei:

| Gegenstand | Anforderung | Tabelle |
|---|---|---|
| Tag-Ordner, Baum, Zyklusprüfung | A-4.1 bis A-4.6 | `tag_folder`, `tag` |
| Pools und Kanban-Spalten | A-3.1 bis A-3.4, E-054 bis E-057 | `pool`, `pool_rule` |
| Standard-Tags | A-9.1 bis A-9.5 | `default_tag` |

Der Name war seit E-055 zu eng: Eine Regel nennt **fünf** Achsen, und vier davon
sind keine Tags. Wer den Exportstatusfilter suchte, suchte ihn in einer Datei,
die „Tags" heißt.

Gemessen wurde die Verwendung in beide Richtungen: **keine einzige.** Der
Poolteil kennt aus dem Tagteil weder `Tag` noch `TagFolder`, sondern allein die
Kennungstypen aus `kernel.ts` — genau der Punkt, den `PoolTagTerm` beschreibt.
Der Tagteil kennt vom Poolteil nichts.

**Standard-Tags blieben in `tag.ts`** und wurden nicht zu einer dritten Datei.
Sie sind 17 Anweisungszeilen, sie rechnen ausschließlich auf `TagId`-Listen, und
`tag.ts` steht nach dem Schnitt bei 197 Zeilen. Eine eigene Datei hätte den
Gegenstand nicht geschärft, sondern nur die Zahl der Dateien erhöht.

### 1.2 `time-entry.ts` → `time-entry.ts` + `export-status.ts`

676 Zeilen, zwei der Regeln, an denen Geld hängt, in einer Datei. Auch hier stand
der Schnitt als Überschrift da („Exportstatuswechsel", „Protokoll des
Exportstatus") und trennt zwei Anforderungsbereiche (A-6.8/A-2.5 gegen
A-6.9/E-012/E-047), zwei Tabellen (`time_entry` gegen `export_audit`) und zwei
Aufrufergruppen.

**Der Wert `ExportStatus` blieb an der Buchung.** Er ist eine Spalte von
`time_entry`; `IsLocked` liest ihn als `Pick<TimeEntry, 'exportStatus'>`. Läge
der Wert drüben, zeigten die beiden Dateien aufeinander. So ist die Richtung
einseitig: `export-status.ts` liest `time-entry.ts`, nicht umgekehrt.

## 2 Was ausdrücklich **nicht** geteilt wurde

### 2.1 `attachment.ts` (1 062 Zeilen) — drei gezählte Kosten

Der naheliegende Schnitt wäre je Art gewesen: Verweis, Datei, Bild. Er wurde
gemessen und verworfen.

1. **Die Migration darf nicht mitwandern.** `0015_todo_attachment.up.sql` nennt
   `packages/domain/src/attachment.ts` **dreimal** als den Ort, an dem
   normalisiert wird (A-A-13), an dem der Zweig je Art steht und an dem die drei
   Grenzwerte stehen. Migrations-SQL trägt einen SHA-256 in
   `schema_migration.checksum`; der Satz ist damit dauerhaft unveränderlich. Ein
   Schnitt macht zwei dieser drei Sätze falsch, ohne daß sie sich korrigieren
   ließen.
2. **Zwei Helfer würden heimatlos.** `byteLength` zählt für den Verweis **und**
   für den Pfad, `PlatformUrl` zerlegt für `normalizeAttachmentLink` **und** für
   `attachmentLabel`. Beide sind heute dateiprivat. Ein Schnitt macht aus zwei
   privaten Helfern zwei öffentliche Ausfuhren von `@takt/domain` — oder zwei
   Abschriften. Beides ist teurer als die Dateigröße.
3. **Die Datei hat eine These, und die These ist der Vergleich.** Ihr Kopf stellt
   die drei Arten in **einer** Tabelle gegenüber: was Takt hält und was „öffnen"
   je Art heißt. Drei Dateien hätten drei Kopfzeilen und keine Tabelle.

Dazu: 1 062 Zeilen sind hier **230 Anweisungszeilen**. Die Größe ist Begründung,
nicht Code.

### 2.2 `export.ts` (558 Zeilen) — die Exportfläche ist eine Grenze, kein Ordner

Diese Datei ist der zweite Einstiegspunkt des Pakets (`@takt/domain/export`,
R-06). Drei Dinge hängen daran, und jedes einzelne genügt:

- `packages/domain/package.json` führt den Einstiegspunkt — und `package.json`
  ändert nur der Orchestrator.
- `check-export-boundary.mjs` hält eine **absichtlich abschließende** Liste
  dessen, was diese Datei importieren darf: `./kernel.ts` und `./rounding.ts`.
- Die sieben Typbehauptungen (`NoteBoundaryIsSealed` und die übrigen) müssen
  neben den Typen stehen, die sie versiegeln. Ein Schnitt setzt die Wache in
  eine andere Datei als ihren Gegenstand.

Die zwei Nennungen in den Migrationen kommen hinzu.

### 2.3 `kernel.ts` (409 Zeilen) — der Schnitt kostet eine Sicherheitsschranke

`kernel.ts` trägt zwei Dinge: das Alphabet (Kennungen, Skalare, `Result`,
Fehlerkatalog) und ein Kapitel echter Rechnung (der Tagesbegriff aus E-025 samt
Zeitumstellung, zwei Anläufe für den Versatz, `Intl` als einzige
Plattformberührung des Pakets). Ein `calendar-day.ts` lag nahe.

Er wurde verworfen, weil `export.ts` `resolveTimeZone` und `toCalendarDay`
benutzt. Der Umzug hätte genau zwei Möglichkeiten:

- `allowedExportSurfaceImports` in `check-export-boundary.mjs` von zwei auf drei
  Einträge erweitern — also eine Liste öffnen, deren Kommentar sagt, sie sei
  absichtlich abschließend, und zwar für eine Umsortierung; **oder**
- den Tagesbegriff halbieren: `toCalendarDay` hier, `calendarDayBounds` dort. Das
  wäre eine erfundene Grenze mitten durch einen Begriff.

Beides ist teurer als 409 Zeilen. `kernel.ts` bleibt, wie es ist.

## 3 Die Kommentare — was geprüft und was bewahrt wurde

Geprüft wurden alle **vierzehn** Stellen im Paket, die mit „Bis T-…" beginnen,
also die Kandidaten für „Vorgeschichte". **Alle vierzehn bleiben**, und zwar
nicht aus Vorsicht, sondern weil jede von ihnen unter dem Maßstab „verhindert
eine Wiederholung" fällt und nicht unter „erzählt, wie es war":

| Stelle | Was sie verhindert |
|---|---|
| `kernel.ts` — „Bis T-042 rechnete der SQLite-Adapter selbst: `date(started_at)`" | daß ein zweiter Adapter den Tagesbegriff neu erfindet und die Tagessumme auf der falschen Seite rundet |
| `call-number.ts` — „Bis T-021 gab es sie zweimal" | die zweite Fassung der Plausibilisierung |
| `text-length.ts` — „Bis T-114 waren es dort 512" | ein Vorschlag, der länger ist als das, was die Tür annimmt |
| `pool.ts` — „Bis T-076 war die Regel eine Liste" | das Umbenennen von `rule` ohne die Aufrufer in fremder Hoheit |
| `pool.ts` — der Kopf über die Achsen (T-080) | die vierte Abschrift der Frage „nennt diese Regel eine Bedingung?" |
| `board.ts` — „Bis T-089 zählte dieser Typ die Achsen als eigene Felder auf" (zweimal) | eine sechste Achse, die ein Aufrufer stillschweigend überspringt |
| `time-entry.ts` — „Bis T-101 stand hier ‚die Karte bleibt, wo sie ist‘" | einen Satz, den E-058 an vier Flächen als falsch begraben hat |
| `time-entry.ts` — „Bis T-101 stand dieses Paar an vier Stellen" | vier Fassungen derselben Wirkung einer Buchung |
| `attachment.ts` — „Bis T-157 stand hier der Wirt allein" | die Rückkehr zu einer Beschriftung, unter der drei Tickets gleich heißen |
| `attachment.ts` — „Bis T-159 stand hier ein `if (host !== '')`" | einen toten Zweig, den kein Prüffall erreicht |
| `enumeration.ts` — „Bis T-093 gab es einen zweiten Baustein" | ein Gattungswort, das den Benutzer in die falsche Liste schickt |
| `tag-name.ts` — „Bis T-074 hatte der Pool `COLLATE NOCASE`" | die zweite, schwächere Namensregel |
| `pool-movement.ts` — „Bis T-107 stand hier als Begründung …" | eine Begründung, die nachweislich falsch war |
| `attachment.ts` — das Meßprotokoll gegen Bedrohungsmodell 20.2 | den Verdacht, die Übereinstimmung mit dem Zerleger der Hülle sei Zufall und keine Eigenschaft |

Nach `docs/decisions/domain.md` gewandert ist damit **kein Satz aus dem
Quelltext**, sondern allein die Entscheidung darüber. Wer sie umstoßen will,
findet hier die gezählten Gründe statt einer zweiten Meinung.

### 3.1 Der Befund: dieselbe Regel steht zweimal, und einmal verschieden

Das Paket ist nach der Bauart „Vertrag oben, `// Umsetzung (T-009)` unten"
geordnet. Das hat eine Folge, die keine Absicht war: **Jede Regel trägt zwei
Beschreibungen** — eine am Funktionstyp, eine an der Umsetzung —, und die beiden
paraphrasieren einander. Gezählt: `checkFolderMove`, `matchesPool`,
`isVisibleInPool`, `applyDefaultTags`, `determineReopen`, `isLocked`,
`checkExportStatusTransition`, `roundToQuarterHours`.

Bei **einer** davon sind die beiden Fassungen inzwischen auseinandergelaufen:

- `ExportStatusTransition` (`export-status.ts`) sagt „Es gibt genau **drei**"
  und zeichnet drei Pfeile — `export_run`, `not_billed`, `reset`.
- `checkExportStatusTransition` sagt vierzig Zeilen weiter „Es gibt genau
  **zwei** erlaubte Übergänge" und zeichnet zwei Pfeile; `not_billed` fehlt im
  Bild und wird erst im Fließtext nachgereicht.

Der **Code** ist richtig und hat drei Zweige. Falsch ist das zweite Bild. Es
wurde bei T-261 **nicht** geändert: Der Satz stammt aus einer Prüferrunde, und
Streichung und Ausgleich gehören in einen Auftrag (E-081 Punkt 4, E-078
Punkt 3). Er ist gemeldet.

**Aufgelöst mit T-270**, und die Vorgeschichte hat sich dabei gedreht: E-078
Punkt 3 greift für diesen Satz gar nicht. Der spec-ux-reviewer hat den Wortlaut
zurückverfolgt — er steht erstmals in `.claude/team/reports/T-009-domain-dev.md`,
also im Erstentwurf der Domäne und lange vor E-047. **Kein Prüferbericht hat ihn
verlangt.** Code-Reviewer und spec-ux-reviewer haben unabhängig zugestimmt; der
Code-Reviewer hat außerdem gemessen, daß der Widerspruch schon vor dem Schnitt
aus T-261 im Bestand lag (`time-entry.ts:177` gegen `:630`) — der Schnitt hat ihn
nur sichtbar gemacht.

Die Auflage lautete **nicht** „die Zahl berichtigen", und das ist der Punkt
dieses Eintrags:

1. **Die zweite Aufzählung fällt.** An ihrer Stelle steht ein Verweis auf
   `ExportStatusTransition`. Eine berichtigte zweite Aufzählung wäre wieder eine
   zweite Aufzählung, und in einem Jahr wieder eine auseinandergelaufene.
2. **Die Menge wird gerechnet.** `allowedExportStatusTransitions()` in
   `packages/domain/src/export-status.ts` schreibt keinen Übergang hin: Sie legt
   dem Wächter die vollständige Eingabemenge vor (Status × Status × Auslöser) und
   behält, was er annimmt. Die Zahl ist damit eine Messung an der Regel; ein
   Mengenprüffall über `…().length` schlägt an, wo ein Kommentar still falsch
   wird. Zwei Behauptungen am Übersetzer halten die beiden Eingabelisten
   vollständig, in beide Richtungen.
3. **Der Auslöser wird abgeleitet.** `ExportStatusTrigger` ist
   `ExportStatusTransition['trigger']`; der Funktionstyp zählte die drei Werte
   bis dahin ein drittes Mal auf.

Gefunden wurde dabei eine **dritte** Fassung derselben Regel, außerhalb des
Quelltextes: `docs/datenmodell.md` 6.1 hieß „Zwei Werte, zwei Übergänge",
zeichnete zwei Pfeile und schrieb „Nur ein Exportlauf löst diesen Übergang aus"
— während 6.2 vier Bildschirme tiefer `not_billed` als dritten Ereignistyp
führt. Dieselbe Klasse, derselbe Auftrag, ebenfalls berichtigt.

### 3.2 Der Fehler, der dabei auffiel

`packages/domain/src/pool-movement.ts` verwies an zwei Stellen auf „die Stelle,
die rechnet (`pool-movement.ts`)" — also auf sich selbst. Entstanden ist das bei
T-257, als der Anwendungsfall aus dem damaligen Ordner `usecases/` eine Ebene
höher nach `apps/local-api/src/pool-movement.ts` zog und der Pfad im
**Domänenkommentar** mitgekürzt wurde, obwohl er über die Paketgrenze zeigt.
Beide Stellen nennen jetzt wieder den vollen Pfad.

**Die Lehre gehört hierher, nicht in den Code:** Ein Pfad, der über eine
Paketgrenze zeigt, wird voll geschrieben. Innerhalb eines Pakets genügt der
Dateiname; sobald er ein anderes Paket meint, ist der kurze Name eine Falle, weil
er sich irgendwann selbst trifft.

**Nachtrag T-270 — und er trifft diesen Abschnitt selbst.** Bis T-270 stand hier
der alte Pfad `apps/…/usecases/pool-movement.ts` in der Form, in der er einmal
gültig war. Der Ordner gibt es seit T-257 nicht mehr; der Abschnitt, der die
Regel aufstellt, verstieß damit gegen sie. Also die zweite Hälfte der Lehre:

- Ein voll geschriebener Pfad ist eine **Behauptung über den heutigen Baum** und
  keine Erzählung. Wer ihn schreibt, prüft, daß die Datei dort liegt.
- Ein Pfad, der Vergangenheit meint, wird als Vergangenheit geschrieben — mit
  dem Ereignis, das ihn beendet hat, statt als Ortsangabe.
- Der Umbau nach Merkmalen (T-249 ff.) hat genau diese Klasse in Menge erzeugt:
  `lib/attachmentLabel.ts`, `screens/TodoFormDialog.tsx`,
  `components/TagInput.tsx`, `lib/exportDirectoryAdvice.ts`,
  `lib/exportTemplateModel.ts` liegen alle unter `features/`; die
  Anwendungsfälle des Dienstes ebenso. **Zwölf** Angaben in der Hoheit von
  domain-dev sind mit T-270 nachgezogen — drei in `attachment.ts`, je eine in
  `enumeration.ts`, `tag-name.ts`, `access/export-directory.ts`,
  `features/export/catalog.ts`, `board.md`, `export.md`, `settings.md`, hier
  und im Schaubild von `docs/architektur.md`, das die Anwendungsfälle in einem
  nie existierenden `src/anwendung/` zeigte. Gemessen wurde über den
  Arbeitsbaum gegen `existsSync`, nicht über die Erinnerung; die Angaben in den
  Nachweisläufen bleiben stehen, weil sie `hinweis:`-Abkürzungen,
  Prüfattrappen oder ausdrücklich als Vergangenheit geschrieben sind.

### 3.3 Zeilennummern in Prosa halten nicht

Bei der Messung fiel auf, daß die Anker mit Zeilennummer bereits vor T-261
gewandert waren:

- `packages/domain/test/pool-rule-unresolved.test.ts` nennt
  `tag.ts:946` für `tagAxisIsUnresolved` (stand bei 979) und `tag.ts:1003` für
  `poolRuleMatchesNothing` (stand bei 1036) — beide etwa 33 Zeilen daneben.
- `docs/bedrohungsmodell.md` nennt neben `time-entry.ts:607` (traf) auch
  `usecases/timer.ts:547` — eine Datei, die es seit T-257 nicht mehr gibt.

Ein Anker auf eine Zeilennummer ist ein Anker auf einen Stand, nicht auf eine
Sache. Wer eine Stelle festnageln will, nennt den **Bezeichner**.
