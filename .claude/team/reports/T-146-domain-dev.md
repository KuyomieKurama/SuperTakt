# T-146 — Frist und Anhänge in Domäne, Speicherung und Dienst; vier Befunde aus dem Tor

**Rolle:** domain-dev **Datum:** 2026-09-05
**Deckung:** `docs/spec.md` A-19.1 bis A-19.21 · E-070 bis E-074 · R-21, R-22 ·
`docs/bedrohungsmodell.md` Abschnitt 20 (A-A-1 bis A-A-24) · `docs/testplan.md` Abschnitt 25 ·
T-143 S-1/S-3/S-4 · T-145-1, T-145-3

---

## Status

**braucht Review** — mit einer benannten, nicht selbst behebbaren Restposition:
`pnpm typecheck` ist in **allen sieben Produktivprojekten** grün und in **drei Prüfdateien** rot,
die unit-tester gehören. Die Behebung ist je eine Zeile; sie steht unten unter „Offene Fragen"
Punkt 1. Ich habe die Dateien nicht angefasst — Hoheit vor Bequemlichkeit.

---

## Artefakte

### Neu

| Datei | Was |
|---|---|
| `packages/domain/src/due-date.ts` | Form, vier Zustände, Filtervergleich, Sortierregel der Frist |
| `packages/domain/src/attachment.ts` | Arten, Normalisierung der Adresse, Pfadprüfung, Kopfsignaturen, Grenzwerte, Beschriftung |
| `packages/storage/migrations/0014_todo_due_date.{up,down}.sql` | `todo.due_date` + Teilindex |
| `packages/storage/migrations/0015_todo_attachment.{up,down}.sql` | `todo_attachment` + `todo_attachment_kind` |
| `packages/storage/src/sqlite/repo-attachments.ts` | `AttachmentPort` (SQLite) |
| `apps/local-api/src/usecases/attachments.ts` | Anwendungsfälle Anhänge |
| `apps/local-api/src/access/attachment-store.ts` | `AttachmentBlobPort` — Bildkopien im Anwendungsdatenverzeichnis |
| `apps/local-api/scripts/proof-access-entry.ts` | Einstiegspunkt für `proof:access` ohne Netzausgang (T-145-1) |

### Geändert

`packages/domain/src/{index,todo}.ts` ·
`packages/storage/src/{index,ports}.ts` ·
`packages/storage/src/sqlite/{clock,database,mappers,migrations.embedded,repo-todos,unit-of-work}.ts` ·
`apps/local-api/src/{composition,main}.ts` ·
`apps/local-api/src/http/input.ts` ·
`apps/local-api/src/routes/todos.ts` ·
`apps/local-api/src/usecases/{context,todos}.ts` ·
`apps/local-api/src/version/{checker,source}.ts` ·
`apps/local-api/openapi/takt-local-api.yaml` ·
`apps/local-api/scripts/{caller-scan,proof-access,proof-openapi,proof-release-safety,service-scenario}.mjs`

**Nicht angefasst:** `packages/export/**`, `apps/web/**`, `apps/desktop/**`,
`apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`, alle Testordner,
`package.json`, `tsconfig*.json`, `.claude/team/*.md` außer dieser Datei.

---

## Zusammenfassung

Frist und Anhänge liegen jetzt vollständig in Domäne, Speicherung und Dienst: Die Frist ist ein
Kalendertag am Todo, ihre drei Zustände sind eine reine Funktion in `packages/domain` und werden
nirgends gespeichert, und sortiert wird über eine zweite Ordnung, in der ein Todo ohne Frist in
**beiden** Richtungen am Ende steht. Anhänge hängen als Unterressource am Todo
(`/api/v1/todos/{todoId}/attachments`) und damit strukturell außerhalb der Add-in-Tür; die
Adresse eines Verweises wird an genau einer Stelle in der Domäne normalisiert, ein Bild wird
gegen seine Kopfsignatur geprüft, mit gezählten Bytes gelesen und unter einem erzeugten Namen
mit `0600` in ein `0700`-Verzeichnis kopiert. Dazu sind vier Befunde aus dem Qualitätstor
behoben und jeder davon gemessen: der blinde Fleck des Freigabenachweises für
`globalThis.fetch`, die Endlosschleife der Versionsprüfung bei zurückgestellter Systemuhr, die
Entwarnung-ohne-Messung im Rechteport und die Verbindung nach `api.github.com`, die der Nachweis
selbst aufbaute. Der Migrationslauf ist gegen einen Bestand mit Inhalt vorwärts und rückwärts
und wieder vorwärts gefahren.

---

## Auflage für Auflage — Abschnitt 20 des Bedrohungsmodells

### An frontend-dev (A-A-1 bis A-A-12) — nicht meine Hoheit

Die Hülle (`apps/desktop/src-tauri/**`, `apps/desktop/scripts/proof-shell-surface.mjs`) gehört
T-147. Ich habe dort **nichts** geändert. Beobachtet: `apps/desktop/src-tauri/src/attachment.rs`
liegt vor (352 Zeilen) und benutzt `Url::parse`. Die Bewertung dieser zwölf Auflagen steht dem
Security-Checker zu; ich führe sie hier nur auf, damit keine als übergangen gilt.

| ID | Zuständig | Beitrag aus T-146 |
|---|---|---|
| A-A-1 bis A-A-12 | frontend-dev | **Keine Änderung meinerseits.** Was die Hülle für A-A-3 braucht, liefere ich: `isNormalizedAttachmentLink` in `packages/domain/src/attachment.ts` beschreibt den Festpunkt, und der Dienst speichert ausschließlich Normalformen — gemessen unten. Für A-A-5 liefert die Domäne `INDIRECT_EXTENSIONS`, damit die fünf Umleitungen nicht ein zweites Mal aufgeschrieben werden. |

### An domain-dev (A-A-13 bis A-A-20) — meine Hoheit

| ID | Urteil | Woran gemessen |
|---|---|---|
| **A-A-13** | **erfüllt** | Normalisierung an **einer** Stelle: `normalizeAttachmentLink` in `packages/domain/src/attachment.ts`. Der Dienst nimmt eine Adresse nur normalisiert an und speichert sie so: `POST …/attachments` mit `HTTP://Beispiel.EXAMPLE/Seite` → **201**, gespeichert `http://beispiel.example/Seite`. `grep` über `packages/**`/`apps/**` (ohne Testordner) findet **keine** zweite Normalisierung im TypeScript-Baum; `new URL(` steht sonst nur in Pfad- und Vite-Auflösungen (`open.ts`, `taskpane/server.ts`, `vite.config.ts`, Add-in-Client) und einmal in `apps/web/src/lib/attachmentLabel.ts`, das die **Beschriftung** ableitet und nicht normalisiert. Die Rust-Seite prüft den Festpunkt, statt zu normalisieren — das ist A-A-3 und keine zweite Stelle. |
| **A-A-14** | **erfüllt** | Adresse, Pfad und Titel gehen durch dieselbe Klasse: `attachmentUrlSchema`, `attachmentPathSchema`, `attachmentTitleSchema` in `http/input.ts` benutzen `withoutControlCharacters` und damit `FORBIDDEN_NAME_CHARACTERS`. Zusätzlich für die Adresse `U+200B` und `U+FEFF` über `INVISIBLE_IN_ADDRESS` in der Domäne. Gemessen: `https://exam<U+200B>ple.org/` → **422**; `ht<TAB>tps://…` → 422 (`link_control_character`). `proof:codepoints` 45/0. |
| **A-A-15** | **erfüllt, mit der Zahl aus dem Bedrohungsmodell** | `MAX_ATTACHMENT_IMAGE_BYTES = 8 388 608` — **eine** Konstante in `packages/domain/src/attachment.ts`, bei den übrigen Grenzwerten aus T-128. Gezählt wird **beim Lesen**, blockweise in `attachment-store.ts`; `stat` kommt darin nicht vor. Gemessen: eine Datei knapp über 8 MiB mit gültiger PNG-Signatur → **422** („Dieses Bild ist zu groß. Erlaubt sind bis zu 8 MiB."), und das Bildverzeichnis enthielt danach **null** Dateien — nichts kopiert, nichts kodiert. |
| **A-A-16** | **erfüllt** | Positivliste auf der Kopfsignatur: `imageMediaTypeOf` in der Domäne, PNG/JPEG/GIF/WebP, kein SVG, keine Endung, kein angesagter `content-type`. Gemessen an vier Fällen: eine als `.png` benannte `MZ`-Datei → 422; eine `.svg` → 422; eine leere Datei → 422 („Diese Datei ist leer."); ein gültiges PNG → 201. Keiner davon wirft. Beim **Lesen** wird die Signatur erneut gemessen und der Endung des gespeicherten Namens nicht geglaubt. |
| **A-A-17** | **erfüllt** | Verzeichnis `<appdata>/attachments` mit `0700`, Datei mit `0600` — beide **ausdrücklich gesetzt** (`chmod` nach `mkdir` und nach `open`), nicht der `umask` überlassen. Gemessen: Verzeichnis `700`, Datei `600`. Der Name ist erzeugt: `47dda9c43d804e45b9e1a5d89252abb8.png` aus `randomUUID()`, ohne jeden Bezug zur Quelldatei; der Quellpfad wird **nicht** gespeichert (Migration 0015). Beim Lesen wird der Name gegen `GENERATED_NAME_SHAPE` geprüft **und** der aufgelöste Pfad gegen das aufgelöste Verzeichnis gehalten. `proof:db-permissions` 17/0. |
| **A-A-18** | **erfüllt** | `DELETE …/attachments/{id}` auf einen Bildanhang: Bildverzeichnis vorher 1 Datei, nachher **0**. Beim Löschen eines **Todos** liest `removeTodo` zuerst `attachments.imageTargets(id)` und entfernt die Dateien nach dem `COMMIT` — die Reihenfolge ist im Quelltext begründet. `ON DELETE CASCADE` nimmt die Zeilen, der Anwendungsfall die Dateien. |
| **A-A-19** | **erfüllt** | `YYYY-MM-DD`, existierender Tag, Jahr 1970–2999 — `isCalendarDay` in `packages/domain/src/due-date.ts`, gebunden an der Tür über `dueDateSchema`. Gemessen: `2029-02-30` → 422, `0000-01-01` → 422, `2029-2-3` → 422, `2029-02-28T00:00:00Z` → 422, `2024-02-29` → **201**. Der Tagesbegriff ist der aus E-025: `today(context)` ruft `toCalendarDay(clock.now(), resolveTimeZone())` — dieselbe Funktion wie die Tagesgruppierung des Exports, ein zweiter Tagesbegriff entsteht nicht. Der Zustand wird gerechnet und **nirgends** gespeichert: keine Spalte, kein Feld in einer Antwort (Begründung unten unter „Annahmen" Punkt 2). |
| **A-A-20** | **erfüllt** | `EXPORT_SOURCE_PATHS` hat **zwölf** Werte, zeichengleich mit der ausgeschriebenen Liste aus dem Bedrohungsmodell — gemessen mit einem Vergleich gegen die zwölf wörtlich hingeschriebenen Pfade: `true`. Kein Pfad passt auf `/due|deadline|attach/i`. `ExportCandidate` und `ExportGroup` haben kein Frist- und kein Anhangsfeld (unverändert; ich habe `packages/export/**` und `packages/domain/src/export.ts` nicht angefasst). `grep` über `packages/export/src/` findet weder `dueDate` noch `attachment`. `proof:export` 97/0, `proof:export-api` 69/0, `proof:template-fields` 30/0. |

### An integration-dev (A-A-21 bis A-A-24) — nicht meine Hoheit, aber gemessen

| ID | Urteil | Woran gemessen |
|---|---|---|
| **A-A-21** | **erfüllt, und zwar strukturell durch meinen Routenschnitt** | Anhänge entstehen über `/api/v1/todos/{todoId}/attachments` — außerhalb von `/addin`, nicht in `SHARED_PATHS`, und **ohne** Änderung an `app.ts` (die Modulregistrierung gehört dem Orchestrator; sie war nicht nötig, weil die Routen im bestehenden `/todos`-Router hängen). `proof:route-policy` Abschnitt 4 hat die vier neuen Routen von selbst mitgemessen: **65 Routen außerhalb von `/addin` ergeben mit dem Add-in-Token 401**, darunter alle vier Anhangsrouten namentlich im Protokoll. Gegenprobe mit dem Sitzungsgeheimnis: 200 bzw. 422. 149/0. |
| **A-A-22** | **erfüllt** | Ein vollständig ausgefüllter Anhang in **drei** Schreibweisen (`attachments: [{kind:'file',path:'/tmp/boese.bat'}]`, `attachment: {kind:'link',url:…}`, `attachmentUrl: …`) an `POST /api/v1/addin/todos`: Antwort **201**, Todo angelegt — und **am Bestand** gemessen: `SELECT COUNT(*) FROM todo_attachment` = **0**. Gemessen ist die Wirkung, nicht der Statuscode. |
| **A-A-23** | **erfüllt** | `GET /api/v1/addin/context` mit Add-in-Token: die vollständige Antwort enthält kein `attach`, kein `dueDate`, kein `deadline` (Regex über das serialisierte JSON: `false`). `proof:addin` 169/0, `proof:addin-wiring` 32/0, `proof:openapi` 110/0. |
| **A-A-24** | **nicht abschließend messbar in meiner Hoheit** | Der E2E-Fall gehört e2e-tester. Was ich beitragen kann und getan habe: **keine** Route und **kein** Anwendungsfall in `apps/local-api/**` ruft `open`, eine Shell oder einen Betrachter — `usecases/attachments.ts` und `access/attachment-store.ts` lesen und schreiben Bytes und sonst nichts. `GET …/image` liefert Bytes, es öffnet nichts. `proof:shell-surface` (frontend-dev) 6 Prüfungen und 20 Gegenproben bestanden. |

---

## Die Bildgrenze

**8 388 608 Bytes (8 MiB)** — die Zahl aus **A-A-15**, nicht die 5 MiB aus E-073 Punkt 3.

Begründung, ausgeschrieben in `packages/domain/src/attachment.ts`: Die Rechnung aus E-073 (ein
Drittel Aufschlag durch base64, fünf Anhänge ≈ 33 MiB im Webview) bleibt richtig — sie sagt, was
der Preis ist. Was sie nicht abbildet, ist der Regelfall: Ein Foto aus einer heutigen
Handykamera liegt regelmäßig zwischen fünf und acht Mebibyte, ist nicht bösartig, und bei fünf
wäre es mit einer Meldung abgewiesen worden, die der Benutzer für eine Fehlfunktion hält. Das
Bedrohungsmodell hat in A-A-15 acht vorgeschlagen; die Domäne nimmt die Zahl von dort.

**Falls der Orchestrator bei 5 MiB bleiben will:** eine Zeile in
`packages/domain/src/attachment.ts`, und E-073 Punkt 3 gewinnt. Die Zahl steht an **einer**
Stelle, und der Nachweis fragt nach ihrer Herkunft und nicht nach ihrem Wert.

---

## Die Naht zu T-147 (frontend-dev)

Der Stand beim Schreiben dieses Berichts: `apps/web/src/api/types.ts` und `endpoints.ts` haben
sich **bereits auf diesen Vertrag eingestellt** (`dueDate`, `dueState`, `sortByDueDate`, die
unterschiedene Vereinigung für `AttachmentCreate`), und `proof:callers` ist grün. Was folgt, ist
die verbindliche Fassung — ich halte mich daran.

### Die eine Regel dieser Fläche

> **Gespeichert wird geliefert, abgeleitet wird gerechnet.**

Der Dienst liefert `dueDate`, `title`, `target`, `position`. Er liefert **nicht** `dueState` und
**nicht** `label`: Beide sind reine Ableitungen, sie liegen als Funktion in `@takt/domain`, und
jede Fläche ruft sie dort. Ein abgeleiteter Wert in einer Antwort ist ein zweiter Wert über
dieselbe Sache, und einer von beiden altert — der Zustand über Nacht (E-073 Punkt 2), das
Etikett beim Ändern des Titels.

### Frist

| Sache | Fassung |
|---|---|
| Feld am `Todo` | `dueDate: string \| null` (`YYYY-MM-DD`), **Pflichtfeld** in jeder Todo-Antwort |
| Anlegen | `POST /todos` mit `dueDate?: string \| null` — „fehlt" und `null` heißen beide „ohne Frist" |
| Ändern | `PATCH /todos/{id}` mit `dueDate?: string \| null` — **Feld fehlt** = unverändert, **`null`** = entfernen, **Tag** = setzen |
| Filtern | `GET /todos?dueState=overdue,due_today,due_later,no_due_date` — kommagetrennt, wirkt als Vereinigung, unbekannter Wert = 422 |
| Sortieren | `GET /todos?sortByDueDate=asc\|desc` — ohne Angabe die bisherige Ordnung (zuletzt geändert, absteigend) |
| Zustand | **nicht** in der Antwort. `dueState(todo.dueDate, heute)` aus `@takt/domain`, Rückgabe `'overdue' \| 'due_today' \| 'due_later' \| 'no_due_date'` — vier Werte, kein `null` |
| Heute | `toCalendarDay(new Date(), resolveTimeZone())` aus `@takt/domain` — dieselbe Funktion, die der Export benutzt |
| Sortierregel | `compareByDueDate(a, b, richtung)` aus `@takt/domain`. Ein Todo ohne Frist steht in **beiden** Richtungen am Ende; die Oberfläche setzt **kein** Platzhalterdatum |

Die Blätterung (`cursor`) gilt je Ordnung. Wer mitten in einer Liste die Ordnung wechselt,
beginnt neu — die Fortsetzungsmarke der einen trifft in der anderen nicht.

### Anhänge

Vier Routen, alle unterhalb des Todos:

```
GET    /api/v1/todos/{todoId}/attachments                        → { data: { items: Attachment[] } }
POST   /api/v1/todos/{todoId}/attachments                        → 201 { data: Attachment }, Location-Kopfzeile
DELETE /api/v1/todos/{todoId}/attachments/{attachmentId}         → 204
GET    /api/v1/todos/{todoId}/attachments/{attachmentId}/image   → { data: AttachmentImage }
```

```ts
interface Attachment {
  id: string; todoId: string;
  kind: 'link' | 'image' | 'file';
  title: string | null;      // null = nicht gesetzt
  target: string;            // link: Normalform der Adresse · file: absoluter Pfad · image: erzeugter Name der Kopie
  position: number;          // gespeichert, stabile Reihenfolge (A-19.8)
  createdAt: string;         // YYYY-MM-DDTHH:MM:SSZ
}

type AttachmentCreate =
  | { kind: 'link';  url: string;        title?: string | null }
  | { kind: 'file';  path: string;       title?: string | null }
  | { kind: 'image'; sourcePath: string; title?: string | null };

interface AttachmentImage { mediaType: 'image/png'|'image/jpeg'|'image/gif'|'image/webp'; base64: string }
```

Und dazu, ohne Feld in der Antwort:
`attachmentLabel(kind, title, target)` aus `@takt/domain` — die Beschriftung nach A-19.12,
**nie leer**: Titel, sonst Wirtsname (Verweis) / Dateiname (Datei) / Name der Kopie (Bild).

Fünf Punkte, an denen sich eine Oberfläche sonst verrechnet:

1. **Der Rumpf ist eine unterschiedene Vereinigung.** `{ kind: 'file', url: '…' }` wird mit 422
   abgewiesen und nicht ausgewertet — dieselbe Begründung wie A-A-1 für die Öffnen-Befehle.
2. **Das Bild geht als Pfad hinein, nicht als Bytes.** Der Rumpf ist auf 1 MB begrenzt (B-1.7),
   ein Bild darf 8 MiB haben. Der Pfad kommt aus dem Systemdialog (`dialog:allow-open`,
   `directory: false`); der Dienst liest, prüft und kopiert.
3. **`target` bei einem Bild ist kein Pfad.** Es ist der erzeugte Name der Kopie, er taugt nicht
   zum Öffnen und gehört in keine Anzeige. Die Bytes holt die `image`-Route.
4. **`target` bei einem Verweis ist bereits die Normalform.** Angezeigt wird genau dieser Wert;
   die Hülle öffnet genau diesen Wert. `HTTP://Beispiel.EXAMPLE/Seite` liegt als
   `http://beispiel.example/Seite` im Bestand.
5. **`title` und `target` sind fremder Text** und gehen in der Anzeige durch `visibleText`.

### Was an der Add-in-Tür ankommen darf (A-19.21, für integration-dev)

**Die Frist: ja, und nur in dieser Form.** Ein Tag `YYYY-MM-DD`, geprüft mit `dueDateSchema`
aus `apps/local-api/src/http/input.ts` — derselbe Schema-Ausdruck wie an der Haupttür, also
`isCalendarDay` aus der Domäne: Form, existierender Tag, Jahr 1970–2999. **Kein** freier Text,
**keine** Uhrzeit, **kein** Zeitstempel mit Zone, **kein** aus einem Betreff errechnetes Datum.
Der Wert kommt aus einem Feld, das der Benutzer im Aufgabenbereich ausfüllt.

Das Feld und die Prüfung stehen bereit; die Add-in-Route setzt sie noch nicht. **Gemessen:**
`POST /api/v1/addin/todos` mit `dueDate: '2029-11-27'` legt das Todo an, und die Frist ist
danach `null` — sie wird von `createTodoSchema` stillschweigend verworfen. Das ist der heutige,
richtige Zustand für alles außer A-19.21; die Route ist integration-dev.

**Anhänge: nein, und zwar strukturell.** Es gibt keine Leitung dorthin — nicht ein Feld, das
fehlt, sondern eine Fläche, die außerhalb von `/addin` liegt und für ein Add-in-Token 401 ergibt
(A-A-21, gemessen).

---

## Die vier Befunde aus dem Tor

### O-BP / T-143 S-1 — `proof-release-safety.mjs` war blind für `globalThis.fetch`

**Behoben, und die Gegenprobe trifft jetzt die Lücke.**

Der alte Ausdruck `/(?<![\w.$-])fetch\b(?!\s*:)/` schloss über den Punkt in der Rückschau
**jedes** `.fetch` aus und über die Vorausschau **jedes** `fetch:`. Beide Ausnahmen waren zu
breit: `globalThis.fetch(u)`, `window.fetch(u)` und `const { fetch: f } = globalThis` waren
unsichtbar.

Statt „alles außer" stehen jetzt die zwei bekannten Nicht-Ausgänge **namentlich**
(`fetch: app.fetch`, `app.fetch`, `options.fetch`); sie werden aus dem Text entfernt, und was
danach noch als Wort dasteht, ist ein Ausgang. Die Funktion heißt `mentionsGlobalFetch` und ist
exportiert, damit der Lauf sie gegen sich selbst fahren kann.

**Gemessen — vier Gegenproben, wo vorher eine stand:**

| Eingesetzter Verstoß | vorher | jetzt |
|---|---|---|
| `fetch('https://beispiel.invalid/x')` | rot | rot |
| `globalThis.fetch('https://beispiel.invalid/x')` | **grün** (die Lücke) | rot |
| `window.fetch('https://beispiel.invalid/x')` | **grün** | rot |
| `const { fetch: holen } = globalThis` | **grün** | rot |

Und die Gegenrichtung, ohne die ein zu gieriger Ausdruck ebenfalls grün wäre: fünf
Nicht-Ausgänge (`fetch: app.fetch`, `app.fetch`, `options.fetch`, `sec-fetch-site`,
`fetch_context_not_allowed`) werden **nicht** dafür gehalten. `proof:release-safety` **31/0**.

### O-BP / T-143 S-3 — `version/checker.ts`, zurückgestellte Systemuhr

**Behoben an der Ursache und mit einem Deckel darüber.**

Zwei Änderungen, und die erste ist die eigentliche:

1. **`elapsed < 0` ist ein eigener Zweig.** Eine zurückgesprungene Wanduhr macht den gemerkten
   Zeitpunkt wertlos — er bezieht sich auf eine Uhr, die es nicht mehr gibt. Der Bezugspunkt
   wird neu genommen, der volle Boden gewartet, und der Rücksprung steht als
   `version_check_clock_moved_backwards` im Protokoll. Der Boden aus A-V-11 bleibt gewahrt:
   zwischen zwei ausgehenden Anfragen liegt weiterhin mindestens `minIntervalMs` **nach der
   Uhr, die gerade gilt**.
2. **`schedule()` deckelt.** Auf `min(max(intervalMs, minIntervalMs), 2^31−1)`. Das
   `max(intervalMs, minIntervalMs)` ist kein Detail: Ein Prüffall setzt den Boden ausdrücklich
   **über** den Takt („die Uhr steht"), und ein Deckel auf `intervalMs` allein hätte ihm genau
   die Wirkung genommen, die er messen soll.

**Ausdrücklich kein unterer Boden.** Eine Sekunde wäre die naheliegende zweite Grenze und die
falsche: Sie hätte jeden eingestellten Startabstand unter einer Sekunde verlängert und damit die
Prüffälle verstellt, statt den Fehler zu verhindern. Der Fehler entsteht oben, nicht unten.

**Gemessen:**

| | Frist | Ausgang |
|---|---|---|
| vorher, Uhr 30 Tage zurück | `3 600 000 − (−2 592 000 000)` = **2 595 600 000 ms** | > `2^31−1` → Node kürzt auf **1 ms**, `TimeoutOverflowWarning`, gefeuert nach 1 ms |
| jetzt, derselbe Sprung | **3 600 000 ms** | eine Stunde, keine Warnung |

Lauf gegen den echten Prüfer mit gestellter Uhr: Rücksprung **einmal** erkannt, ausgehende
Anfragen **1**, `TimeoutOverflowWarning` **0**.

### O-BQ / T-143 S-4 — `clock.ts:70` gab `0` statt `null`

**Behoben.** `inspectDatabasePermissions` hat jetzt **drei** Ausgänge statt zwei und liest den
`code` des Wurfs, statt ihn zu verschlucken:

| `statSync` sagt | heißt | Ausgang |
|---|---|---|
| Erfolg | gemessen | Pfad in `tooPermissive` oder nichts |
| `ENOENT` | gibt es nicht — `-wal`/`-shm` entstehen erst mit der ersten Transaktion | nichts, **und das ist eine Aussage** |
| alles andere (`EACCES`, `EIO`, `ELOOP`, `ENOTDIR`) | **nicht messbar** | `unmeasured` wächst |

`checked` ist nur noch dann `true`, wenn **jede** der drei Dateien geantwortet hat — eine
einzige nicht messbare macht die ganze Auskunft zu einer Nichtaussage. Damit gibt
`databaseFilesTooPermissive()` in genau dem Fall `null`, in dem er vorher `0` gab: „nicht
nachgesehen" ist keine Entwarnung, und `ports.ts` sagt das seit T-132 wörtlich. `main.ts` meldet
den Fall zusätzlich als `file_permissions_unmeasured` — als `info` und nicht als `warn`, weil
nicht bekannt ist, dass etwas offen liegt, sondern bekannt ist, dass man es nicht weiß.

`proof:db-permissions` **17/0**.

### O-BU / T-145-1 — `proof:access` sprach mit `api.github.com`

**Behoben, mit einem ausdrücklichen Parameter am Zusammenbau, ohne Umgebungsvariable.**

`proof:access` startete `src/index.ts`, also `main()`, also die Versionsprüfung. `main()` nimmt
jetzt `MainOptions { releaseSource? }` entgegen und reicht sie an `compose()` weiter;
`src/index.ts` ruft `main()` **ohne Argument**, das Erzeugnis ist damit unberührt.
`proof:access` startet stattdessen `scripts/proof-access-entry.ts`, das **denselben** `main()`
ruft — dieselbe Migration, dieselbe Rechteprüfung, dasselbe Aufräumen, denselben Aufgabenbereich
— und als einziges eine Abholfunktion einsetzt, die den Prozess nicht verlässt (sie antwortet
`{ ok: false, reason: 'unreachable' }`, ohne irgendetwas zu öffnen).

**Warum kein Nachbau wie `version-check-entry.ts`:** T-142 brauchte dort **weniger** als den
echten Start, weil es etwas anderes misst. `proof:access` misst **genau diesen Start**. Ein
nachgebauter Start wäre ein zweiter Weg, der vom echten abweichen kann, ohne dass ein Fall es
misst — dann prüfte der Nachweis eine Anwendung, die niemand ausliefert.

**Gemessen**, zwei vollständige Läufe mit `ss -tnp` im Sekundentakt und Zuordnung über die PID
zur Befehlszeile:

| | vorher (T-145) | jetzt |
|---|---|---|
| Verbindungen des `node`-Prozesses außerhalb `127.0.0.1` | `ESTAB … 140.82.121.6:443` | **keine, in beiden Läufen** |
| `proof:access` | 105/0 | **105/0** |

### O-BW / T-145-3 — die 64-KiB-Grenze der Versionsprüfung

**Gewählt: die Grenze anheben, auf 262 144 Bytes** — plus den stillen Ausgang lauter machen.
Warum diese Hälfte und nicht die andere:

* Die Messung im Auslieferungsablauf liegt in `.github/workflows/release.yml`. Die Datei gehört
  nicht mir; ich hätte sie nur über den Orchestrator ändern können, und eine Auflage, die auf
  eine fremde Datei wartet, ist keine Behebung.
* Eine Messung nach der Veröffentlichung sagt außerdem erst dann „zu groß", wenn es schon
  draußen ist. Was den Benutzer schützt, ist eine Grenze, die eine plausible Veröffentlichung
  nicht erreicht.
* Was die Grenze **leisten** soll — eine fremde Antwort davon abhalten, den Arbeitsspeicher zu
  füllen —, leistet sie bei 256 KiB unverändert. Der Unterschied zwischen 64 KiB und 256 KiB ist
  dafür bedeutungslos; der zwischen 256 KiB und „unbegrenzt" ist es nicht.

Rechnung, nachgerechnet: rund 1,7 KiB je Anhang plus knapp 1 KiB Grundgerüst.
64 KiB ≈ **38 Anhänge** (T-145 rechnete 35, heute sind es neun), 256 KiB ≈ **153**.

Und die zweite Hälfte des Befundes — der **stille** Ausgang — ist mitbehandelt: Der Satz zu
`too_large` nennt jetzt die **Folge** und nicht nur den Vorgang („Die Versionsprüfung liefert
damit dauerhaft kein Ergebnis"). Wer „wurde verworfen, Takt läuft unverändert weiter" liest,
hält es für eine Kleinigkeit; tatsächlich sieht „unbekannt" von außen genauso aus wie „alles
aktuell".

**An den Orchestrator:** Die zweite Hälfte aus T-145-3 — die tatsächliche Größe von
`releases/latest` im Auslieferungsablauf gegen `VERSION_CHECK_MAX_BYTES` halten — steht unten
unter „Offene Fragen" Punkt 3.

---

## Läufe

| Befehl | Ergebnis |
|---|---|
| `ss -ltn \| grep 1784` | **beide Ports frei**, vor jedem Lauf geprüft |
| `pnpm typecheck` | **alle sieben Produktivprojekte grün**; drei Prüfdateien rot (unit-tester, siehe unten) |
| `pnpm test` | **66 Dateien, 1171 Prüfungen, 0 Fehlschläge** |
| `pnpm run proof:all` | **18 Läufe, alle grün** — 45, 110, 32, 149, 42, 105, 97, 69, 25, 14, 32, 40, 31, (6 + 20 Gegenproben), 30, 17, 169, jeweils 0 fehlgeschlagen |
| `pnpm run verify:bundle` | **20/0** — der gebündelte Sidecar startet, migriert auf 15, bindet 17843 und 17844 |
| Migration vorwärts/rückwärts/vorwärts | siehe unten |
| `pnpm desktop`, `pnpm test:e2e` | **nicht gestartet** (Auftrag) |

### Migration gegen einen Bestand mit Inhalt

Bestand vor dem Rückweg: 3 Todos (2 mit Frist), 4 Anhänge über alle drei Arten, 1 Zeitbuchung,
3 Vermerke, 3 Tag-Zuordnungen.

```
vorwärts            0 → 15
rückwärts          15 → 13   Todos 3 | Buchungen 1 | Vermerke 3 | Tag-Zuordnungen 3
                             due_date-Spalte weg · Anhangstabellen weg · ix_todo_due_date weg
erneut vorwärts    13 → 15   Schema wieder vollständig, 3 Arten in todo_attachment_kind
                             Todos 3 | Buchungen 1 | Vermerke 3
```

Der Datenverlust auf dem Rückweg ist genau der, den `0014_todo_due_date.down.sql` benennt: Alle
Fristen sind danach `null`. Todo, Tags, Buchungen, Vermerk und Exportstatus bleiben unberührt —
die Frist war nie eine Achse, deshalb hängt an ihr nichts.

### Schema-Gegenproben

| Was | Ausgang |
|---|---|
| `INSERT … kind='video'` | **abgewiesen** — `FOREIGN KEY constraint failed` (Nachschlagetabelle, nicht CHECK) |
| `UPDATE todo SET due_date='2029-1-1'` | **abgewiesen** — `CHECK constraint failed: due_date …` |
| `DELETE FROM todo` | Anhänge von 3 auf **0** (`ON DELETE CASCADE`) |

---

## Annahmen

1. **Der vierte Fristzustand heißt `'no_due_date'` und ist kein `null`.** `docs/testplan.md`
   Abschnitt 25 nimmt in TP-FRIST-07 `null` an — der Plan sagt selbst, dass seine Bezeichner
   Annahmen sind. Der Auftrag verlangt „ein vierter Fall im Typ und kein `null`, über das der
   Aufrufer raten muss", und genau das ist es: Wer `null` bekommt, muss den Ausgang selbst
   benennen, und die naheliegende Benennung ist „später fällig" oder ein leerer Text — beides
   behauptet etwas.

2. **Der Dienst liefert `dueState` nicht mit.** E-073 Punkt 2 legt fest, dass der Zustand bei
   jedem Zeichnen gerechnet wird, dazu bei `visibilitychange` und über einen Zeitgeber auf
   Mitternacht. Ein Feld in der Antwort trüge den Zustand zum Zeitpunkt der **Anfrage**, wäre um
   23:59 richtig und um 00:01 falsch, und die Oberfläche hätte daneben ihren eigenen, jüngeren
   Wert. Serverseitig gerechnet wird er an genau einer Stelle, und dort muss er sein: beim
   **Filtern**, wo eine Abfrage nicht jede Zeile laden kann.

3. **`label` ist ebenfalls kein Feld der Antwort**, aus demselben Grund. `attachmentLabel` liegt
   in `@takt/domain`, jede Fläche ruft sie dort. Die Regel lautet: gespeichert wird geliefert,
   abgeleitet wird gerechnet.

4. **`TodoCreate.dueDate` ist freiwillig, `Todo.dueDate` ist Pflicht.** Beim Anlegen gibt es
   nichts zu entfernen — „fehlt" und `null` heißen dasselbe. Beim Ändern sind sie verschieden,
   und ohne die Unterscheidung gäbe es keinen Weg, eine gesetzte Frist wieder loszuwerden. Der
   Nebeneffekt: `routes/addin/service.ts` (integration-dev) übersetzt unverändert weiter.

5. **Die Arten der Anhänge stehen in einer Nachschlagetabelle statt in einem CHECK.** Der
   Auftrag verlangt, dass eine vierte Art keine Migration mit Tabellenumbau braucht. SQLite kann
   einen CHECK nicht ändern; ein Fremdschlüssel auf `todo_attachment_kind` macht die Menge zu
   **Daten**. Preis: eine Tabelle mit drei Zeilen. Gegenwert: die Datenbank lässt eine unbekannte
   Art trotzdem nicht still durch (gemessen oben).

6. **Der Sortierschlüssel für „ohne Frist am Ende" ist ein Zeichen, kein Datum.**
   `COALESCE(due_date, '~')` aufsteigend, `COALESCE(due_date, '!')` absteigend. Beide liegen
   außerhalb des Zeichenvorrats, den der GLOB aus 0014 zulässt, und sie verlassen die Datenbank
   nie — `toTodo` liest `due_date`. Ein Platzhalter**datum** wäre genau die Bequemlichkeit, die
   E-074 Punkt 2 verbietet.

7. **Der Adapter des Bildports liegt in `apps/local-api/src/access/`, der Port in
   `packages/storage/src/ports.ts`.** Dieselbe Aufteilung wie bei `DirectoryInsightPort`: Der
   Port ist das, was ein Anwendungsfall benennt; der Adapter fragt das Betriebssystem nach dem
   Anwendungsdatenverzeichnis, und das ist die Nachbarschaft von `paths.ts` und
   `token-store.ts`.

8. **Die Domäne benutzt `URL` aus der Laufzeit**, über eine einzige, vier Zeilen lange
   Zusicherung. `packages/domain/tsconfig.json` führt `types: []` und `lib: ["ES2023"]`, und
   `URL` ist WHATWG. Eine Änderung an der `tsconfig` wäre Sache des Orchestrators gewesen und
   hätte der Domäne die ganze DOM-Bibliothek gegeben; eine handgeschriebene Adresszerlegung wäre
   nach T-145-12 die schlechtere Wahl. `TextEncoder` habe ich dagegen **nicht** übernommen: Die
   UTF-8-Bytelänge sind vier Zeilen über Codepunkte, und sie legt kein Bytefeld an, das niemand
   liest.

9. **`bytes` steht nicht an `AttachmentImage`.** Es wäre nützlich und hat keine
   Anforderungs-ID — „keine Umsetzung ohne Deckung durch eine Anforderungs-ID" (`CLAUDE.md`).

10. **Ich habe die Namensgebung gegen den früheren Stand von T-147 durchgehalten.** Deren erste
    Fassung führte `deadline`, `sort` und ein gemeinsames `value`; ich bin bei `dueDate`,
    `sortByDueDate` und der unterschiedenen Vereinigung geblieben — `due_date` ist der
    Spaltenname (E-015, R-16), „Deadline" ist genau das Wort, das A-19.2 für diese Sache
    ausschließt, und ein gemeinsames Wertfeld mit Typkennzeichen ist die Form, die A-A-1 für die
    Öffnen-Befehle verbietet. T-147 hat inzwischen nachgezogen; `proof:callers` ist grün.

---

## Risiken

1. **Sicherheit — die Bildkopie ist Kundenmaterial an einem zweiten Ort.** Bisher lag alles in
   einer Datei (VG-3, B-11.4). Ab jetzt liegen Bilder daneben, wachsen dort und werden von jedem
   Sicherungs- und Synchronisierungsagenten mitgenommen. Dagegen tragen `0700`/`0600` und der
   **erzeugte** Dateiname; mehr ist ohne Verschlüsselung nicht zu haben, und die wäre eine
   eigene, größere Entscheidung. Gehört ins Benutzerhandbuch (Bedrohungsmodell 20.9 Punkt 3).

2. **Sicherheit — der Rückweg von 0015 lässt die Bildkopien liegen.** SQL kennt kein
   Dateisystem, und ein Rückweg, der Dateien löschte, täte etwas, das man ihm nicht ansieht.
   Nach `migrateDownTo(13)` bleibt Kundenmaterial ohne Eigentümer im Bildverzeichnis liegen. Der
   Satz steht in `0015_todo_attachment.down.sql`; er gehört ins Entwicklerhandbuch.

3. **Sicherheit — die ganze Kontrolle über das Öffnen liegt in Rust.** Was ich an der Tür prüfe,
   ist eine Bequemlichkeit für den Benutzer und **keine** Kontrolle: Zwischen Speichern und
   Öffnen liegt der Bestand, und drei Wege führen daran vorbei (VG-1, VG-3, jede künftige
   Migration). Ich habe die Tür so gebaut, dass sie den Wert prüft, der **gespeichert** wird —
   insbesondere `attachmentPathSchema` **ohne** `.trim()`. Die Grenze selbst ist A-A-1 bis A-A-9
   und gehört T-147.

4. **Die zweite Fassung der Fristregel steht in SQL.** `buildConditions` übersetzt
   `dueComparison` aus der Domäne, und der Sortierschlüssel ist ein Zeichenkniff mit
   BINARY-Kollation. Beides ist begründet und über einen `switch` gegen einen fünften Zustand
   abgesichert — aber es ist eine zweite Fassung, wie `matchesPool` gegenüber `buildConditions`.
   Für die gibt es seit T-076 einen Nachweis, der beide gegeneinander hält; für die Frist gibt
   es ihn noch nicht. Vorschlag unter „Nächster Schritt".

5. **Die Bildgrenze ist eine Annahme über eine fremde Datei, die Netzgrenze eine über eine
   fremde Antwort.** Beide altern. Für die zweite ist die Messung im Auslieferungsablauf die
   Antwort (Offene Fragen 3); für die erste gibt es keine, außer sie eines Tages zu erhöhen.

6. **Ich habe drei Prüfdateien rot hinterlassen** (siehe Offene Fragen 1). Kein
   Sicherheitsrisiko, aber `pnpm check` läuft nicht durch, bis sie angefasst sind.

---

## Offene Fragen

1. **Drei Prüfdateien brauchen je eine Zeile** — Hoheit unit-tester, ich habe sie nicht
   angefasst. Jede hat einen `baseTodo`-Bauer, dem `dueDate` fehlt; `Todo.dueDate` ist ein
   Pflichtfeld, weil ein Leser es nicht vergessen können soll.

   | Datei | Zeile | Ergänzung |
   |---|---|---|
   | `apps/local-api/test/routes/addin/service.test.ts` | 119 ff. | `dueDate: null,` |
   | `apps/local-api/test/usecases/time-entry-movement.test.ts` | 167 ff. | `dueDate: null,` |
   | `apps/local-api/test/usecases/todo-done-movement.test.ts` | 174 ff. | `dueDate: null,` |

   Zur Laufzeit ist nichts kaputt: `pnpm test` ist mit 1171 Prüfungen grün, es ist ausschließlich
   `typecheck:test`.

2. **A-19.21 ist an der Add-in-Tür noch nicht verdrahtet.** Feld und Prüfung stehen bereit
   (`dueDateSchema`), gemessen ist der heutige Zustand: `dueDate` wird von `createTodoSchema`
   stillschweigend verworfen. Die Route gehört integration-dev; was dort ankommen darf, steht
   oben unter „Die Naht" ausgeschrieben. **Anhänge bleiben aus dieser Tür ausgeschlossen** und
   brauchen dort keine Zeile — die Grenze trägt über den Routenschnitt.

3. **Soll `release.yml` die Größe von `releases/latest` messen?** Zweite Hälfte von T-145-3.
   Vorschlag, fertig formuliert: nach dem Veröffentlichen einmal
   `curl -sS -H 'accept: application/vnd.github+json' …/releases/latest | wc -c` und gegen
   `VERSION_CHECK_MAX_BYTES` (262 144) halten; über der Hälfte davon eine Warnung, darüber ein
   roter Schritt. Die Datei ist nicht meine.

4. **Soll die Bildgrenze bei 8 MiB bleiben?** Ich habe die Zahl aus dem Bedrohungsmodell
   (A-A-15) genommen; E-073 Punkt 3 nennt 5 MiB. Eine der beiden Entscheidungen sollte
   nachgezogen werden, damit nicht zwei Zahlen im Bestand stehen — die Zahl selbst steht an
   **einer** Stelle, die Begründungen an zweien.

5. **Zwei Einträge für `package.json`** (nur der Orchestrator): keiner ist neu nötig — `proof:*`
   und `test:rust` bleiben unverändert. `proof:access` zeigt jetzt intern auf
   `scripts/proof-access-entry.ts`; der Skripteintrag bleibt wörtlich derselbe. **Es ist nichts
   einzutragen.**

6. **`ExportSourcePath` bleibt bei zwölf — soll das jemand messen?** Heute belegt es ein `grep`
   und mein Lauf oben. Ein Prüffall, der die zwölf **wörtlich** aufzählt und bei einer
   dreizehnten rot wird, verlangt A-A-20 ausdrücklich; er gehört in `packages/export/test/**`
   oder `packages/domain/test/**` und damit unit-tester.

---

## Nächster Schritt

1. **Die drei Zeilen aus Offene Fragen 1** an unit-tester, damit `pnpm check` durchläuft. Das ist
   die einzige Blockade.
2. **Wiedervorlage beim Security-Checker** gegen A-A-13 bis A-A-20 mit den Messungen oben, und
   gegen A-A-1 bis A-A-12 zusammen mit T-147.
3. **unit-tester, nächste Welle**, mit den Fällen, die jetzt lauffähig sind: TP-FRIST-04 bis -07
   gegen `dueState` (ohne jede Attrappe), TP-ANH-08 gegen `attachmentLabel`, dazu die von A-A-20
   verlangte Aufzählung der zwölf Quellen und die Eigenschaft, die `dueState` und
   `dueComparison` aneinander bindet:
   `matchesDueComparison(d, dueComparison(s, heute)) === (dueState(d, heute) === s)` für jedes
   `d` und jedes `s`. Sie ist die Klammer um Risiko 4 — bricht eine der beiden Funktionen aus,
   bricht sie.
4. **Ein Nachweis, der die SQL-Fassung der Fristregel gegen die Domäne hält**, nach dem Vorbild
   von `proof:openapi` Abschnitt 11 (`matchesPool` gegen `buildConditions`): Für eine Handvoll
   Todos mit und ohne Frist beide Wege fahren und die Mengen vergleichen — einschließlich der
   Blätterung, weil dort der Sortierschlüssel zweimal vorkommt.
5. **documenter, zuletzt:** die drei Sätze für das Benutzerhandbuch (ein geöffneter Verweis ist
   ein geöffneter Verweis; die Bildkopien wachsen im Anwendungsdatenverzeichnis) und für das
   Entwicklerhandbuch (T-145-11: der Zerleger normalisiert, und wer die Rohfassung anzeigt und
   die Normalform öffnet, hat einen Verweis gebaut, der lügt).
