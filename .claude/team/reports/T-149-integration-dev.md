# T-149 — Das Add-in setzt die Frist

**Rolle:** integration-dev **Datum:** 2026-09-05
**Deckung:** `docs/spec.md` A-19.1, A-19.2, A-19.7, **A-19.19**, **A-19.21** · E-053, E-070,
E-074 (Punkt 1, 3, 4) · R-21, R-22 · `docs/bedrohungsmodell.md` A-A-19, A-A-21, A-A-22 ·
Board **O-BB** · T-146 (Domäne, Speicherung, Dienst)

---

## Status

**braucht Review**

Alle Läufe grün, eine benannte Restposition in fremder Hoheit (O-BB, unten unter „Offene
Fragen" Punkt 1) — sie ist ein veralteter **Kommentar** in `apps/local-api/scripts/`, kein
Loch in der Messung: Die Wache dazu liegt seit dieser Aufgabe in meiner Hoheit und hängt an
keiner fremden Datei.

---

## Artefakte

### Neu

| Datei | Was |
|---|---|
| `apps/outlook-addin/src/duedate/entry.ts` | Der Feldinhalt der Frist: drei Ausgänge, Regel aus `@takt/domain` gerufen |

### Geändert

| Datei | Was |
|---|---|
| `apps/local-api/src/routes/addin/schema.ts` | `dueDate: dueDateSchema.default(null)` · `REQUEST_SCHEMAS` (O-BB) |
| `apps/local-api/src/routes/addin/service.ts` | `AddinCreateTodoInput.dueDate`, an `todos.create` durchgereicht |
| `apps/local-api/src/routes/addin/index.ts` | `dueDate` an den Anwendungsfall, A-19.19 im Routenkopf ausgeschrieben |
| `apps/local-api/openapi/takt-local-api.yaml` | **nur** `/addin/todos` (E-053): `dueDate` im Rumpf, A-19.19 in der Vorgangsbeschreibung |
| `apps/outlook-addin/src/api/client.ts` | `CreateTodoRequest.dueDate` |
| `apps/outlook-addin/src/api/types.ts` | `TodoDto.dueDate` |
| `apps/outlook-addin/src/ui/TaskPane.tsx` | Feld „Frist" (`type="date"`), Sperre bei unbrauchbarem Wert |
| `apps/outlook-addin/scripts/proof-addin.mjs` | **Abschnitt 18**, 18 Prüfungen |
| `apps/outlook-addin/scripts/fixtures.mjs` | Attrappe schreibt `dueDate` wie der echte Adapter |

**Nicht angefasst:** `packages/domain/**`, `packages/storage/**`, `packages/export/**`, alles
Übrige unter `apps/local-api/**` (insbesondere `scripts/`, `http/input.ts`, `routes/todos.ts`),
`apps/web/**`, `apps/desktop/**`, `tests/**`, alle Testordner, `package.json`, `tsconfig*.json`,
`.claude/team/*.md` außer dieser Datei.

---

## Zusammenfassung

Die Add-in-Tür nimmt seit dieser Aufgabe eine `dueDate` entgegen, und sie prüft sie mit
**derselben** Bindung wie die Haupttür: `dueDateSchema` aus `http/input.ts`, darunter
`isCalendarDay` und `DUE_DATE_MESSAGE` aus `packages/domain/src/due-date.ts` (T-146) — es gibt
im ganzen Add-in-Baum keine zweite Fassung der Form, und dass es keine gibt, wird an der
**Herkunft** gemessen und nicht an einem Zahlenvergleich. Im Aufgabenbereich steht dafür ein
Feld „Frist" (`type="date"`, Wortlaut und Hinweis wie im Änderungsdialog der Hauptanwendung);
es ist das einzige Feld dieses Bereichs, das weder aus dem Betreff vorbelegt noch aus dem Text
erkannt wird, und ein statischer Wächter hält diese Abwesenheit fest (E-074 Punkt 4). Ein
unbrauchbarer Wert sperrt den Knopf mit dem Satz der Domäne, statt still verworfen oder erst
vom Dienst abgewiesen zu werden. A-19.19 ist danach erneut gemessen worden, und zwar an der
Wirkung: Ein voll ausgefüllter Anhang in vier Schreibweisen an `POST /addin/todos` ergibt 201
und **null** Zeilen in `todo_attachment`, mit einer Gegenprobe, die belegt, dass diese Zählung
rot werden kann. O-BB ist erledigt und die Zuordnung dabei so gebaut, dass sie ohne fremde
Datei trägt.

---

## Wie A-19.19 gemessen ist — ausdrücklich

Die Frage lautet nicht „antwortet die Route mit 4xx?", sondern „steht danach eine Zeile in
`todo_attachment`?". Gemessen wird deshalb **die Wirkung am Bestand**, in
`apps/outlook-addin/scripts/proof-addin.mjs` Abschnitt 18d, gegen eine echte, migrierte
SQLite-Datenbank im Arbeitsspeicher (`openDatabase(':memory:')` + `migrateToLatest()`, derselbe
Aufbau wie Abschnitt 11c seit T-061) und gegen den **echten** Router (`mountAddinRoutes`).

Ablauf, in dieser Reihenfolge:

1. **Vorbedingung.** `SELECT COUNT(*) FROM todo_attachment` = 0. Ohne diese Zeile sagte die
   Messung danach nichts über die Route, sondern über den leeren Bestand.
2. **Eine Anfrage, die beides trägt.** `POST /api/v1/addin/todos` mit `dueDate: '2026-09-30'`
   **und** einem voll ausgefüllten Anhang in **vier** Schreibweisen zugleich:
   `attachments: [{kind:'file', path:'/tmp/nicht-oeffnen.bat', title:'Rechnung'}, {kind:'image',
   name:'bild.png', bytes:…}]`, `attachment: {kind:'link', url:'https://example.org/…'}`,
   `attachmentUrl`, `attachmentPath: 'C:\\Windows\\System32\\calc.exe'`. Beides in **einer**
   Anfrage, weil genau dieser Fall die Grenze aus E-074 Punkt 3 ist.
3. **Ergebnis:** `201`. Das ist die richtige Antwort und nicht die bequeme — die Anfrage ist
   fachlich vollständig, und ein unbekannter Schlüssel darf ein Todo nicht scheitern lassen
   (dieselbe Überlegung, aus der `reopenIfDone` seit T-038 kein 422 mehr erzeugt).
4. **Die eigentliche Messung:** `SELECT COUNT(*) FROM todo_attachment` = **0**.
5. **Die Frist ist trotzdem angekommen:** `todo.dueDate === '2026-09-30'` in der Antwort **und**
   `SELECT due_date FROM todo WHERE id = ?` = `'2026-09-30'` im Bestand. Ohne diesen Punkt
   bestünde 18d auch dann, wenn die ganze Anfrage abgewiesen worden wäre.
6. **Kein Ausweichweg:** Keiner der Anhangswerte ist in `todo.title`, `todo.call_number` oder
   `todo_note.body` gelandet — geprüft auf die Spuren `nicht-oeffnen`, `calc.exe`,
   `example.org`.
7. **Gegenprobe, dass die Zählung rot werden kann** (eigene Prüfung, 18d zweiter Fall): Nach
   demselben Aufbau wird **von Hand**, an der Add-in-Tür vorbei, ein `INSERT INTO
   todo_attachment (…)` abgesetzt; dieselbe Zählabfrage liefert danach **1**. Ohne diesen
   Schritt wäre die Null oben die schlimmste Sorte grün — eine, die auch bestünde, wenn die
   Abfrage die falsche Tabelle läse oder die Tabelle gar nicht existierte. Das ist derselbe
   Befund, den T-146 im Rechteport aufgeräumt hat: Entwarnung ohne Messung.

Dazu drei **strukturelle** Prüfungen, die vor der Wirkung liegen (18b):

- `Object.keys(createTodoSchema.shape)` enthält kein Feld, das auf `/attach|anhang|file|image|url/i`
  paßt — die Tür führt kein Anhangsfeld, ein Aufrufer kann keines füllen.
- Der Add-in-Abschnitt der OpenAPI-Beschreibung führt kein Anhangsfeld im Rumpf und keinen
  `/addin`-Pfad, der auf `attachment` paßt (A-A-21).
- Und die Gegenprobe zur Struktur: `dueDate` **ist** an der Tür — fehlte es, wäre 18c grün, ohne
  etwas zu messen.

`proof:route-policy` mißt unverändert die andere Hälfte (65 Routen außerhalb von `/addin` ergeben
mit dem Add-in-Token 401, darunter die vier Anhangsrouten); ich habe daran nichts geändert, 40/0.

---

## Was Abschnitt 18 sonst noch mißt (18 Prüfungen, alle grün)

| Ebene | Prüfung |
|---|---|
| 18a rein | leeres Feld → „keine Frist"; 5 echte Tage gehen unverändert durch; **13** Eingaben, die keine Frist sind (`2026-02-30`, `2024-02-30`, `2026-13-01`, `2026-00-10`, `2026-9-3`, `2026-09-30T00:00:00Z`, `2026-09-30 12:00`, `30.09.2026`, `bis Freitag`, Leerraum vorn, Leerraum hinten, ein Jahr vor und eines hinter der Bandbreite — die beiden Jahresgrenzen **gerechnet** aus `MIN_DUE_YEAR`/`MAX_DUE_YEAR`, nicht hingeschrieben) |
| 18a | Der Satz ist `DUE_DATE_MESSAGE` selbst, gibt den abgewiesenen Wert **nicht** wieder und trägt kein unsichtbares Zeichen (geprüft mit `2026-02-30` + `U+202E`) |
| 18a | **Eigenschaft statt Fälletabelle:** für jeden geprüften Wert gilt `readDueDate(v).kind === 'day'` genau dann, wenn `isCalendarDay(v)` |
| 18a Herkunft | Dreiteilig wie bei der Titellänge (T-134): (1) keine `.ts/.tsx` des Add-ins trägt die Form — das Suchmuster wird aus `DUE_DATE_SHAPE.source` **erzeugt**; (2) `duedate/entry.ts` importiert aus `@takt/domain` und erklärt `isCalendarDay` nicht selbst; (3) sie ruft sie auch auf |
| 18a E-074 P4 | Kein `setDueDate(mail…/detection…/parse…/subject…)` irgendwo im Add-in — plus die Gegenprobe, daß es das Feld überhaupt gibt (`readDueDate(` und `label="Frist"` im Aufgabenbereich) |
| 18b beide Türen | Für jeden Wert oben: Haupttür **und** Add-in-Tür je **einzeln gegen die Domäne** gemessen, nicht gegeneinander (T-123) |
| 18b | Die Beanstandung heißt `dueDate` und nicht `body` |
| 18b | An dieser Tür sind „fehlt" und `null` dasselbe; `'2026-09-30'` kommt als `'2026-09-30'` an |
| 18b O-BB | Add-in-Abschnitt der Beschreibung ↔ `REQUEST_SCHEMAS` an der Tür, **beide Richtungen**, plus Identitätsvergleich der Schemaobjekte |
| 18c Bestand | Frist steht in `todo.due_date`; ohne Frist bleibt die Spalte leer (mit und ohne ausdrückliches `null`) |
| 18c | 13 unmögliche Fristen → **422**, `details[].field = ['dueDate']`, der Wert steht **nicht** in der Antwort, und die Zahl der Todos ist unverändert (kein halbes Todo) |

`pnpm run proof:addin`: **187 bestanden, 0 fehlgeschlagen** (vorher 169).

---

## Läufe

| Befehl | Ergebnis |
|---|---|
| `pnpm typecheck` | **grün, Rückgabewert 0** (7 Produktivprojekte, 7 Prüfprojekte, e2e) |
| `pnpm test` | 69 Dateien, **1 359 Prüfungen**, grün |
| `pnpm run proof:addin` | 187 / 0 |
| `pnpm run proof:addin-wiring` | 32 / 0 |
| `pnpm run proof:openapi` | 110 / 0 |
| `pnpm run proof:taskpane` | 25 / 0 |
| `pnpm run proof:route-policy` | 40 / 0 |
| `pnpm run proof:codepoints` | 45 / 0 |
| `pnpm run proof:callers` | 32 / 0 (liest `dueDate` im Add-in-Client mit) |
| `pnpm run proof:export` · `proof:export-api` · `proof:template-fields` | 97 / 0 · 69 / 0 · 30 / 0 — die Frist ist in keiner Feldquelle aufgetaucht (A-19.17, A-A-20) |
| `pnpm --filter @takt/outlook-addin build` | grün, 69 Module, 239,92 kB (76,45 kB gzip) |

**Kein Playwright gestartet** (Auflage der Welle).

Zwischenstand zur Kenntnis: Beim ersten `pnpm typecheck` war `tests/e2e/deadline-lifecycle.spec.ts`
(unversioniert, e2e-tester, T-150) mit zwei ungenutzten Importen rot. Beim Abschlußlauf war es
behoben; ich habe die Datei nicht angefaßt.

---

## Entscheidungen an Ort und Stelle

### 1. `dueDateSchema` importieren statt eine dritte Fassung tippen

`routes/addin/schema.ts` holte seit T-114 bereits `titleSchema` und `nameSchema` aus
`http/input.ts`. Die Frist ist derselbe Handgriff ein drittes Mal — diesmal **vor** dem
Auseinanderlaufen statt danach. `http/input.ts` sagt es an `dueDateSchema` selbst zu:
„Dieselbe Prüfung gilt an der Add-in-Tür (A-19.21, E-074 Punkt 4)." Diese Zusage ist jetzt
eingelöst und nicht abgeschrieben. Eine eigene `z.string().regex(…)` hier wäre nicht nur die
vierte Abschrift, sondern **falsch**: Sie nähme `2026-02-30` an, der Knopf bliebe frei, und der
Dienst antwortete 422 auf einen Wert, an dem nichts zu sehen ist — dieselbe Sackgasse wie bei
der Titellänge vor T-114.

### 2. `.default(null)` statt `.optional()`

Die Haupttür führt zwei Schemata: `createSchema` faßt „fehlt" und `null` zusammen,
`updateSchema` hält sie auseinander, weil `null` dort **entfernen** heißt (A-19.3). Die
Add-in-Tür kennt das Ändern nicht — sie legt an und bucht. `.default(null)` schreibt diese
Zweizuständigkeit **einmal** hin, statt sie an der Aufrufstelle mit `?? null` nachzuholen;
derselbe Handgriff wie bei `callNumber` und `statusId` in derselben Datei. Folge: `index.ts`
enthält kein `?? null` — ein solches sähe aus wie eine Vorsichtsmaßnahme und wäre der Hinweis
auf einen dritten Fall, den es hier nicht gibt.

### 3. Kein `trim` im Add-in

`dueDateSchema` trimmt nicht, die Hauptanwendung schickt ihren Feldinhalt ungeschnitten
(`TodoFormDialog.tsx`), also schneidet das Add-in auch nicht. `" 2026-09-30"` bekommt hier
denselben Satz wie an der Tür. Ein Add-in, das stillschweigend zurechtschnitte, nähme eine
Eingabe an, die über den anderen Weg abgewiesen wird — Befund C-03, nur an zwei Leerzeichen.

### 4. O-BB ohne fremde Datei wirksam gemacht

`REQUEST_SCHEMAS` steht jetzt in `routes/addin/schema.ts`, wie bei den vier Türen der
Hauptfläche. Die **Wache** dazu habe ich aber nicht in `proof-openapi.mjs` gelegt (fremde
Hoheit), sondern in `proof-addin.mjs` Abschnitt 18b: Sie hält die Aufstellung gegen den
Add-in-Abschnitt der Beschreibung in beiden Richtungen und prüft die **Identität** der
Schemaobjekte. Damit ist O-BBs Zweck erfüllt — eine neue Add-in-Route mit Rumpf kann nicht
unbemerkt bleiben —, und zwar unabhängig davon, ob und wann domain-dev die zwei Zeilen in
`proof-openapi.mjs` austauscht.

### 5. Der Aufgabenbereich zeigt die Frist in der Erfolgsmeldung nicht

`TodoDto` trägt sie (der Umschlag ist `Todo`), aber `DoneView` nennt sie nicht. Anders als bei
`createdTags`, wo die Schreibweise aus der Antwort und nicht aus dem Eingabefeld kommt, gibt es
hier nichts, was der Dienst anders entschieden haben könnte. Eine Bestätigung dessen, was eben
im Feld darüber stand, sagt dem Benutzer nichts, was er nicht wüßte.

### 6. Der **Zustand** der Frist erscheint nirgends im Add-in

„Überfällig", „heute fällig", „später fällig" werden gerechnet und nie gespeichert (E-070
Punkt 3). Rechnen würde sie `dueState`; das tut die Hauptanwendung, weil dort die Liste steht,
die er ordnet. Der Aufgabenbereich hat keine Liste, und `AddinTodoMatch` hat deshalb **keine**
`dueDate` bekommen — das wäre Fläche für das Add-in-Token ohne Zuwachs.

---

## Annahmen

1. **`type="date"` ist im Aufgabenbereich zulässig.** Der moderne Outlook-Aufgabenbereich läuft
   auf WebView2/Edge; das Feld liefert dort von sich aus `JJJJ-MM-TT`. Wo es auf ein Textfeld
   zurückfällt, ändert das **nichts** an der Richtigkeit: Geprüft wird der Wert von
   `readDueDate` und danach an der Tür. Ich behandle das Feld ausdrücklich als Bedienkomfort und
   nicht als Kontrolle, und das steht so im Quelltext. **Ungeprüft auf echtem Outlook** — wie
   alles Übrige in diesem Paket (siehe Kopf von `proof-addin.mjs`).
2. **Wortlaut und Reihenfolge aus dem Designsystem abgeleitet.** Beschriftung „Frist",
   `type="date"` und der Hinweistext folgen `apps/web/src/screens/TodoFormDialog.tsx`; der
   Hinweis ist um den Satz „Sie wird nicht aus der E-Mail übernommen" ergänzt, weil das im
   Add-in eine Aussage ist und in der Hauptanwendung keine. Referenzbilder liegen weiterhin
   nicht vor (A-10.10).
3. **Position:** unter dem Titel, über den Tags. Titel und Frist sind Angaben **über** das
   Todo, Tags und Vermerk ordnen es ein. In der Hauptanwendung steht die Frist zwischen
   Call-Nummer und Status — im Add-in liegt die Call-Nummer weit oben in ihrem eigenen
   Bereich, deshalb weicht die Reihenfolge ab.
4. **`CreateTodoRequest.dueDate` ist Pflicht, nicht freiwillig.** Jeder Aufrufer soll sich
   entscheiden. Der Nachweispfad ruft die Route teils ohne das Feld — das prüft absichtlich den
   `.default(null)`-Weg der HTTP-Grenze und ist kein Typverstoß (`.mjs`).
5. **Keine `min`/`max` am Eingabefeld.** Die Bandbreite 1970–2999 steht in der Domäne; sie ins
   HTML zu schreiben wäre eine vierte Stelle, und der Satz der Domäne nennt sie ohnehin.
6. **Vier Anhangs-Schreibweisen** in 18d sind geraten, nicht abgeleitet — es gibt keine
   Anhangs-Schnittstelle am Add-in, gegen die man sie halten könnte. Sie decken die drei Arten
   aus A-19.9 (`link`, `image`, `file`) und die zwei naheliegenden flachen Namen ab.

---

## Risiken

1. **Sicherheit — keine neue Fläche.** Das Add-in-Token erreicht weiterhin genau vier Routen;
   `AddinUnit` hat **keinen** `AttachmentPort` bekommen, keine neue Portmethode, keine neue
   Datenklasse. Der Zuwachs ist eine Spalte am Todo, die die Anwendung **anzeigt**. R-21 und
   R-22 sind davon unberührt, und A-19.19 ist gemessen (oben).
2. **Ein Tag ist eine Aussage über den Benutzer, nicht über den Absender.** Der Riegel dagegen
   ist die **Abwesenheit** einer Erkennung, und Abwesenheiten verschwinden leise. Deshalb ist
   sie statisch bewacht (18a, `setDueDate(mail…)`-Muster) — der Wächter greift auch dann, wenn
   jemand die Bequemlichkeit später „nur als Vorschlag" einbaut.
3. **Fremder Text in der Fehlermeldung.** Der abgewiesene Wert kann aus einer E-Mail
   abgeschrieben sein. Die Meldung ist deshalb die Konstante der Domäne und gibt den Wert nicht
   wieder — geprüft an der Zeichenkette **und** an der HTTP-Antwort (18a, 18c).
4. **Prüfdaten.** Keine echte Call-Nummer, kein Kundenname, keine Zugangsdaten. Die neuen Werte
   sind erfunden; Adressen liegen in `example.org` (RFC 2606) und `beispiel.invalid`. Abschnitt 0
   von `proof:addin` prüft das weiterhin und ist grün.
5. **Offen und nicht in meiner Hoheit:** Ob die Todo-Liste der Hauptanwendung nach der Frist
   sortiert und filtert (A-19.20), gehört T-152/frontend-dev; der Dienst kann es seit T-146.
   Meine Änderungen berühren das nicht.

---

## Offene Fragen an den Orchestrator

1. **Abweichung in fremder Hoheit (O-BB, `apps/local-api/scripts/proof-openapi.mjs`).** Die
   Datei führt weiterhin zwei Einzelimporte und daneben einen Vermerk, der seit dieser Aufgabe
   **nicht mehr stimmt** („Die Add-in-Routen liegen in fremder Hoheit und führen kein
   `REQUEST_SCHEMAS`"). Ich habe sie nicht angefaßt; `proof:openapi` ist 110/0. Der Austausch
   ist zwei Zeilen, für domain-dev:

   - Zeile 94: `import { bookSchema, createTodoSchema } from '../src/routes/addin/schema.ts';`
     → `import { REQUEST_SCHEMAS as ADDIN_SCHEMAS } from '../src/routes/addin/schema.ts';`
   - im Objekt `REQUEST_SCHEMAS`: die drei Zeilen (Kommentar + `createAddinTodo` +
     `createAddinTimeEntry`) → `...ADDIN_SCHEMAS,`

   Die Messung hängt **nicht** daran (siehe „Entscheidungen" Punkt 4); es geht um die falsche
   Zusicherung im Kommentar.

2. **Soll die Add-in-Tür eine Frist in der **Vergangenheit** annehmen?** Sie tut es heute
   (`1970-01-01` geht durch), genau wie die Haupttür, und `dueState` nennt sie „überfällig".
   Das halte ich für richtig — eine Frist, die verstrichen ist, ist eine Tatsache und kein
   Eingabefehler —, aber es steht nirgends geschrieben. Wenn es eine Zusage sein soll, gehört
   sie nach `decisions.md` und nicht in eine Zeile.

3. **`ADDIN_BOOKING_NOTE_MAX_LENGTH` bleibt enger als `textSchema` an der Haupttür** (offene
   Frage aus T-134, unverändert). Sie ist mir bei dieser Aufgabe wieder begegnet; ich habe sie
   nicht angerührt, weil sie eine Zusage der Schnittstelle ändert.

---

## Nächster Schritt

Freigabe durch code-reviewer, spec-ux-reviewer und security-checker. Für den **spec-ux-reviewer**
sind die drei Fragen konkret: Ist „Frist" an dieser Stelle im Aufgabenbereich richtig platziert
(unter dem Titel), ist der ergänzte Hinweissatz („wird nicht aus der E-Mail übernommen")
verständlich, und ist die gesperrte Schaltfläche bei unbrauchbarer Eingabe die richtige Härte —
oder soll das Add-in absenden lassen und den Dienst antworten lassen? Für den
**security-checker**: Abschnitt 18d oben, insbesondere die Gegenprobe.

Danach O-BB Punkt 1 an domain-dev (zwei Zeilen), und der E2E-Fall „Frist aus dem Add-in
erscheint in der Liste der Hauptanwendung" an e2e-tester — er verbindet T-149 mit T-152 und ist
der einzige Weg, beide zusammen zu messen.
