# T-112 — Sicherheitsprüfung Welle E bis G, Bedrohungsmodell nachgezogen

Aufgabe: T-112 — Sicherheitsprüfung Welle E bis G, Bedrohungsmodell nachziehen
Prüfumfang: `git diff aca53df..4dd3171` — Wellen E (T-101 bis T-103), F (T-104 bis T-106),
G (T-107 bis T-109) und die Wiedervorlagen R-1a/R-2a/R-3a. 120 geänderte Dateien, davon
97 übersetzbare Quelldateien.
Datum: 2026-09-04. Verantwortlich: security-checker.
Urteil: **Nacharbeit an einem Punkt (T-112-1), sonst freigegeben.**

---

## 0. Was tatsächlich gelaufen ist

Damit niemand ein Prüfergebnis annimmt, das es nicht gibt.

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI 1.166.0, `p/secrets p/security-audit p/typescript p/owasp-top-ten` über die 97 geänderten Quelldateien | **ja** | 156 Regeln, 97 Ziele, **0 Befunde**, rund 99,9 % geparst. Aus `p/secrets` null Treffer. |
| Semgrep Guardian — SAST, Geheimnisse, Lieferkette | **nein** | `Not logged into Semgrep Guardian.` Zum **sechsten** Mal, seit T-003 unverändert. Kein Plattformbefund, weder positiv noch negativ. Kein Ersatz vorgetäuscht. |
| 42Crunch-Audit, 42Crunch-Scan | **nein** | `42c-ast` nicht auffindbar, `~/.42crunch` existiert nicht. Die OpenAPI-Beschreibung liegt vor und ist in dieser Welle um 542 Zeilen gewachsen; das Hindernis ist ausschließlich das Werkzeug. |
| `pnpm run proof:migrations` | **ja** | „`migrations.embedded.ts` ist aktuell (24 Datei(en))." |
| `pnpm run boundaries` | **ja** | grün: 8 Quelldateien in `packages/export`, **319** außerhalb der Domäne, „Notiz-Trennung: alle Schichten unverletzt". |
| Eigene Messungen: Diff je Pfad, Mustersuche über den ganzen Baum (Zugangsdaten, Call-Nummern, E-Mail-Adressen, unsichtbare Zeichen), Lesen der acht Bewegungs-Aufrufstellen | **ja** | Abschnitte 1 bis 5 |
| `pnpm check`, `pnpm test`, `pnpm test:e2e`, die portgebundenen Nachweispfade (`proof:openapi`, `proof:route-policy`, `proof:addin`, …) | **nein** | Untersagt: Ports 17843/17844 gehören dem Orchestrator; `apps/web/**` (frontend-dev) und `apps/*/test/**` (unit-tester) sind gerade in fremder Arbeit. Ich habe die Zahlen der anderen Berichte **nicht** als eigene ausgegeben. |

Zwei Semgrep-Teilparser-Meldungen, damit sie niemand überliest: `takt-local-api.yaml` (ab 4363)
und `apps/local-api/test/http/input.test.ts` (bei 60) wurden nur teilweise geparst. Die zweite ist
kein Zufall, siehe Hinweis T-112-H2.

Die Definition of Done ist an einem Punkt erfüllt („Semgrep ohne offene Befunde hoher Schwere")
und an einem unverändert **nicht erfüllbar** („42Crunch über der Schwelle"). Das ist eine
Beschaffungsentscheidung und kein Befund dieses Branches; sie steht seit T-023.

---

## 1. Bedrohungsmodell nachgezogen (Auftragspunkt 1)

`docs/bedrohungsmodell.md` ist an vier Stellen geändert:

| Stelle | Was |
|---|---|
| 14.2 (Zeile ~2403) | Die Beschreibung `enteringPoolNames`/`leavingPoolNames`/`poolNames` bleibt als **Stand T-086** stehen und trägt jetzt den Nachtrag, dass beide Antworten seit T-104 `poolMovement: { appears, enters, leaves } \| null` führen. |
| 15.3 (Zeile ~2638) | Dasselbe für die Aufzählung mit den Zeilennummern `service.ts:291`/`:722` und `index.ts:367`/`:373`/`:379`; Verweis auf die heutigen Stellen in 16.2. |
| 15.7 | „Die drei Listen tragen Namen und sonst nichts" — Nachtrag, dass es die drei Listen **innerhalb** von `poolMovement` sind. |
| **neu: Abschnitt 16** | Die vollständige Prüfung dieser Welle, 16.1 bis 16.9. |

**Warum ich die alten Absätze nicht überschrieben, sondern nachgetragen habe.** 14.2 und 15.3 sind
Protokoll zweier Prüfungen zu zwei Ständen; wer sie umschreibt, macht aus einem Protokoll eine
Behauptung über die Gegenwart und verliert die Spur, an der man sieht, **wann** die Fläche sich
bewegt hat. Genau diese Spur ist der Inhalt von 15.3. Der heutige Stand steht vollständig in 16.2.

Die neuen Stellen, gegen den Quelltext geprüft und nicht abgeschrieben:

```
routes/addin/service.ts:192   AddinTodoMatch.poolMovement: PoolMovement | null
routes/addin/service.ts:323   bookingMovement(...)   — Duplikatsuche
routes/addin/service.ts:716   bookingMovement(...)   — Buchung
routes/addin/index.ts:217     matches: result.matches            GET  /addin/todo-matches
routes/addin/index.ts:377     poolMovement: result.poolMovement  POST /addin/todos/{id}/time-entries
usecases/pool-movement.ts:381 unit.pools.list('all')
routes/addin/ports.ts:146     Pick<PoolPort, 'list' | 'resolveAxes'>   — unverändert
```

**Die Bewertung ändert sich nicht.** Ein Feld statt dreier, dieselbe Datenklasse: Namen von Regeln
aus dem eigenen Bestand, einschließlich reiner Kanban-Spalten (die Grenzverschiebung aus 15.3, die
bewusst gezahlt und in der OpenAPI ausgesprochen ist). Es kommt kein Feld hinzu, es gehen zwei weg.

---

## 2. `details[].name` (Auftragspunkt 2)

### 2.1 Der Weg, gelesen statt angenommen

`TaktFieldError.name?: string` (`packages/domain/src/kernel.ts:177`) wird an **einer** Stelle
gebildet — `poolReference` in `packages/storage/src/sqlite/mappers.ts:244` — und von den drei
Sperren geerbt, die eine Regel nennen: `repo-tags.ts:250` (Tag), `repo-tags.ts:565` (Ordner),
`repo-statuses.ts:320` (Status). Eine Bildungsstelle statt dreier, `message` Zeichen für Zeichen
unverändert, additiv. Das ist richtig gebaut, und der Grund dafür ist der bessere: Ohne dieses Feld
müsste die Oberfläche den Namen aus einem fremden Satz herausschneiden.

### 2.2 Ist die Wache aus H-2 vollständig? Nein — **Befund T-112-1**

`apps/local-api/src/http/input.ts:111` prüft C0 (U+0000–U+001F), C1 (U+007F–U+009F) und die
bidirektionalen Formatierungszeichen (U+202A–U+202E, U+2066–U+2069); `titleSchema` (`:126`) und
`nameSchema` (`:127`) weisen mit 422 ab, ohne den Wert zu wiederholen. Über sie laufen **alle**
Namen der Hauptfläche und die Titel und Tagnamen aus `POST /todos`.

**Die Add-in-Routen laufen nicht über sie.** `apps/local-api/src/routes/addin/schema.ts` hat sein
eigenes Schema und ist auf dem Stand von vor T-101:

```ts
title:    z.string().trim().min(1).max(512),                       // :66  — keine Zeichenprüfung
tagNames: z.array(z.string().trim().min(1).max(MAX_TAG_NAME_LENGTH))
            .max(ADDIN_TAG_NAMES_MAX).default([]),                 // :85  — keine Zeichenprüfung
```

Die Fachregel dahinter schließt es nicht: `checkTagNames` → `checkName`
(`packages/domain/src/tag-name.ts:213`) normalisiert nach NFC und zieht Leerraum zusammen; die
Menge `WHITESPACE` (`:147`) enthält U+0009–U+000D, U+00A0, U+2000–U+200A, U+2028/2029, U+202F,
U+205F, U+3000 und U+FEFF — **nicht** U+0000–U+0008, **nicht** U+000E–U+001F, **nicht**
U+007F–U+009F und **nicht** die Bidi-Zeichen.

**Warum das schwerer wiegt als H-2 selbst.** R-3a hat H-2 mit „nur wer das Sitzungsgeheimnis hat,
legt Pools an" heruntergestuft. An dieser Tür stimmt der Satz nicht:

- Der Kopfkommentar derselben Datei sagt es: „Jede Zeichenkette, die hier hereinkommt, hat
  mindestens eine fremde Quelle berührt: den Betreff, den Text oder einen Anhangnamen einer
  E-Mail, die jemand geschickt hat (Akteur A-06)."
- Der Titel ist mit dem Betreff **vorbelegt**: `apps/outlook-addin/src/ui/TaskPane.tsx:120`,
  `useState(() => suggestTitle(mail.subject))`; `suggestTitle`
  (`apps/outlook-addin/src/office/mail.ts:41`) streicht nur `AW:`/`RE:`-Vorsätze. Eine Handlung
  des Benutzers genügt.
- Der Titel wird überall angezeigt — Liste, Karte, Dialoge, und seit T-108 im Titel der Meldung
  nach einer Buchung von Hand.
- `todo.title` und `todo.tags` sind zulässige **Feldquellen einer Exportvorlage**
  (`packages/export/src/sources.ts:34`, `:35`). Der Weg endet nicht in der Oberfläche.

**Auswirkung.** Kein Codeausführungsweg: React maskiert (Abschnitt 2.4), und der Export geht über
`JSON.stringify` (`packages/export/src/plan.ts:131`), das Steuerzeichen als Escape-Folge
ausschreibt — die Datei bricht daran nicht auf. Was bleibt, ist genau das, wogegen H-2 geschrieben
wurde, nur mit entferntem Urheber: eine Anzeige, die etwas anderes zeigt, als im Bestand steht, und
eine Exportdatei, die ein fremdes Abrechnungswerkzeug mit Steuerzeichen im Titel bekommt.

**Gegenmittel — eine Zeile, sie ist schon geschrieben.** `withoutControlCharacters` aus
`apps/local-api/src/http/input.ts:121` auf `title` und auf die Einträge von `tagNames` in
`routes/addin/schema.ts` anwenden; dieselbe Meldung, dieselbe 422 über `toFieldIssues`. Der Bezug
über die Modulgrenze ist unbedenklich — `routes/addin/index.ts` holt `readJson` bereits aus
`../http/input.ts`.

**Und der Kommentar gehört mit richtiggestellt.** `routes/addin/schema.ts:74` sagt heute: „Der
Wortlaut des Schemas ist zeichengleich der aus `routes/todos.ts` (`nameSchema` =
`z.string().trim().min(1).max(200)`), damit die Hauptanwendung und das Add-in dieselbe Eingabe
annehmen und dieselbe abweisen." Seit T-101 ist das falsch. Ein Kommentar, der eine Gleichheit
zusichert, die es nicht mehr gibt, sagt dem nächsten Leser ausdrücklich, er brauche nicht
nachzusehen — deshalb steht er im Befund und nicht als Nebensatz.

**Zuständig: integration-dev.** `apps/local-api/src/routes/addin/**` ist seine Hoheit.

### 2.3 Altbestand, Migration, sichtbare Zeichensetzung — drei Grenzen, alle kein Befund

1. **Altbestand.** Die Prüfung sitzt am Eingang. Vor T-101 angelegte Namen bleiben, wie sie sind;
   keine Migration fasst einen Namen an (`packages/storage/migrations/**` ist im ganzen Diff
   unberührt), und eine, die es täte, wäre die stille Änderung, die T-101 Annahme 6 ablehnt. Ein
   solcher Bestand ist hier nicht bekannt. Der Nebeneffekt ist ein Bedienfall: Ein `PATCH`, der
   einen solchen Namen **unverändert** zurückschickt, wird jetzt mit 422 abgewiesen — umbenennen
   und löschen gehen weiterhin.
2. **Sichtbare Zeichensetzung ist nicht erfasst, und eine Zeichenprüfung ist nicht die Antwort
   darauf.** Ein Regelname darf Anführungszeichen, Kommas und das Wort „und" tragen; die Oberfläche
   setzt ihn in einen Satz, der aus genau diesen Zeichen gebaut ist („Betroffen sind Regel „Ost“,
   Regel „Nord“ und Regel „Abrechnung“."). Ein Name kann diesen Satz also umdeuten. Nur der Inhaber
   des Sitzungsgeheimnisses legt Regeln an — er täuscht allein sich selbst, die Schwere ist gering.
   **Die Bauart, die es beantwortet, ist die Anzeige:** Namen als eigene Knoten setzen, eine Liste
   statt eines zusammengefügten Satzes. Genau dafür gibt es `details[].name`.
3. **Vermerk und Leistung sind bewusst nicht erfasst.** Ein Freitextfeld, aus dem Steuerzeichen
   entfernt würden, änderte den Text des Benutzers. Der Unterschied zum Namen ist der Zweck: Ein
   Name wird in fremde Sätze eingesetzt, ein Vermerk als Absatz gezeigt.

### 2.4 Reicht sie für eine Ausgabestelle, die in Anführungszeichen setzt? Heute ja

**Kein XSS-Weg.** Über den **ganzen** Baum `apps/web/src`, `apps/outlook-addin/src`,
`apps/local-api/src` und `packages/*/src` steht kein `dangerouslySetInnerHTML`, kein `innerHTML`,
kein `outerHTML`, kein `insertAdjacentHTML`, kein `document.write`, kein `eval`, keine
`new Function`. `errorMessageWithRules` (`apps/web/src/lib/errorText.ts:98`) liest zum
Prüfzeitpunkt weiterhin `entry.message` und geht als React-Textknoten in
`StatusSettings.tsx:423-433` und `TagsScreen.tsx`.

### 2.5 Die Obergrenze aus H-3 hält — und hat eine Sollbruchstelle

Alle drei Abfragen tragen `LIMIT RULE_REFERENCE_PROBE` (21) und zeigen höchstens
`RULE_REFERENCE_LIMIT` (20) (`mappers.ts:279`, `:292`). Die Kürzung wird **bemerkt**, weil eine
Zeile mehr geholt wird als gezeigt — die stille Kürzung aus B-3b ist vermieden. Der Hinweis darauf
steht aber im `message` der **Hülle** (`repo-tags.ts:253`: „Es sind mehr als 20; genannt werden die
ersten 20.") und **nicht** in `details`.

**Daraus folgt eine Bedingung für T-110, die frontend-dev kennen muss:** Wer den Satz allein aus
`details[].name` zusammensetzt und den Text des Dienstes weglässt, holt die stille Kürzung zurück.
Entweder der Dienstsatz bleibt stehen, oder der Kürzungshinweis wandert als eigenes Feld in die
Hülle. Das ist Hinweis **T-112-H3**.

### 2.6 T-110 nachgeprüft — es ist während dieser Prüfung eingetroffen und hält

Als ich 2.4 schrieb, las `errorText.ts` noch `entry.message`; frontend-dev hat die Umstellung im
selben Zeitraum abgelegt. Ich habe sie gegen die vier Punkte gehalten, die ich mir vorgemerkt
hatte:

| Punkt | Ergebnis |
|---|---|
| `details[].name` mit Rückfall auf `message` | **erfüllt**, und ausgesprochen statt still: `entry.name === undefined ? entry.message : „…“`, dazu `named`, das verlangt, daß **jeder** Eintrag einen Namen mitbringt, bevor das Gattungswort nach vorn wandert. Ein gemischter Satz („die Regeln Regel „Ost“ und „Nord“") kann nicht entstehen. |
| kein `dangerouslySetInnerHTML`, React-Textknoten | **erfüllt.** `ruleList` bildet Zeichenketten, `errorMessageWithRules` gibt eine Zeichenkette zurück, sie steht an denselben zwei Stellen als React-Kind. Über den ganzen Arbeitsbaum: null Treffer für `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`. |
| Kürzungshinweis aus 2.5 geht nicht verloren | **erfüllt.** `errorMessageWithRules` beginnt mit `errorMessage(cause)` — dem Satz des Dienstes samt „Es sind mehr als 20; genannt werden die ersten 20." — und hängt die Aufzählung daran. Die Sollbruchstelle ist nicht ausgelöst. |
| jeder Name ein eigener Knoten | **offen.** Die Namen stehen weiterhin in **einem** zusammengefügten Satz, und die Anführungszeichen setzt seit T-110 die Oberfläche (`„${name}“`) statt des Dienstes. Kein Rückschritt — ein Name konnte auch im Satz des Dienstes ein Anführungszeichen tragen —, aber die Bauart, die 2.3 Punkt 2 endgültig beantwortet, ist die Liste aus eigenen Knoten. |

Nebenbei sauber gelöst: `ApiFieldError` steht jetzt als **ein** Typ in `api/types.ts`, statt in
`client.ts` ein zweites Mal ausgeschrieben zu werden. Die zweite Fassung war strukturell zuweisbar
und hätte das vierte Feld nicht mitbekommen — genau die Sorte Doppelung, die still veraltet.

**T-112-H3 ist damit zur Hälfte erledigt.** Es bleibt der eine Punkt mit geringer Schwere.
Festgehalten im Bedrohungsmodell 16.3 und 16.8.

---

## 3. `POST /time-entries` mit `poolMovement` und der Rest von Welle E bis G (Auftragspunkt 3)

### 3.1 Die Rechnung steht in derselben Transaktion

`apps/local-api/src/usecases/timer.ts:670`: `presenceBeforeBooking` **vor** dem Schreiben,
`unit.timeEntries.create`, dann `movementOfBooking` über denselben `unit` — alles innerhalb von
`context.transactions.inTransaction`. Das ist die einzig richtige Anordnung; eine Bewegung, die
über einen Bestand urteilt, den es zum Zeitpunkt der Handlung nicht mehr gab, wäre eine
Falschauskunft. Der Rumpf steht flach (`entryAfterBooking` in `routes/time.ts`), wie an
`PUT`/`DELETE /done`.

**Bewertung wie bei den Timer-Routen in R-3a: keine neue Datenklasse.** Namen von Regeln aus dem
eigenen Bestand, an einer Route der Hauptfläche hinter dem Sitzungsgeheimnis, **nicht** am
Add-in-Token. Die Notiz-Trennung ist unberührt: `TimeEntry.note` ist die **Leistung** und gehört
per A-7.4 in die Abrechnung; `Todo` trägt überhaupt kein Notizfeld
(`packages/domain/src/todo.ts:88-100`), der interne Vermerk liegt in `todo_note` an einer eigenen
Route. `pnpm run boundaries` ist grün, von mir gemessen.

**Die vorsichtigere Rechnung ist gewählt worden, und sie ist auch sicherheitlich die richtige.**
`closedEntryMovementStates` statt `bookingMovementStates` (T-107 Frage 1, im Nachtrag zu E-061
richtiggestellt): Eine Buchung von Hand hebt „Erledigt" nicht auf. Die andere Fassung hätte ein
Verlassen der Erledigt-Spalten gemeldet, das nicht stattfindet. Ein Satz, der weniger sagt, als
geschehen ist, ist die harmlose Richtung.

### 3.2 H-1 in neuer Fassung — zwei Verbesserungen, ein Zuwachs

- **Besser:** Die Ordnerterme einer Achse werden in **einer** rekursiven Abfrage aufgelöst
  (`repo-tags.ts:1018`, `f.id IN (…)`, `depth < 1000`) und nicht je Term. Der Faktor aus R-3 H-1
  gilt für den Pfad `resolveAxes`, den die Bewegung benutzt, **nicht**.
- **Besser:** Der Normalfall kostet nichts — `movementOfBooking` gibt `null` zurück, bevor es liest
  (`timer.ts:382`); `switchTodoDone` ebenso, wenn das Kennzeichen sich nicht bewegt hat
  (`usecases/todos.ts:325`); die Duplikatsuche des Add-ins baut den Namensgeber verzögert und
  höchstens einmal je Anfrage (T-104).
- **Neu:** Acht Aufrufstellen statt dreier (Start, Stopp, `orphaned/resolve`, `PUT`/`DELETE /done`,
  `POST /time-entries`, zwei Add-in-Routen), und bei `POST /time-entries` läuft die Rechnung
  innerhalb einer **schreibenden** Transaktion auf einer einzelnen SQLite-Datei. Der verbleibende
  Multiplikator ist die Zahl der Regeln — ein `resolveAxes` je Regel, je Anfrage —, und für die
  gibt es nirgends eine Obergrenze.

Bleibt ein **Hinweis** (T-112-H1): Wer viele Regeln anlegt, hat das Sitzungsgeheimnis und
verlangsamt allein sich selbst. Festgehalten, weil die billige Antwort mit jeder neuen
Aufrufstelle mehr wert wird.

### 3.3 `orphan_discarded` — folgenlos und richtig gebaut

Der Grund ist ein Aufzählungswert aus der **Domäne**
(`packages/domain/src/time-entry.ts:607`), kein Freitext; `usecases/timer.ts:547` reicht ihn durch,
statt ihn neu zu setzen; der Verwerfen-Zweig liest **nichts** und löst keine Regel auf; die Antwort
trägt `poolMovement: null` per Typ (`timer.ts:315`). Dass `POST /timer/stop` diesen Grund nicht
liefern **kann** (eigener Typ statt gemeinsamer Vereinigung), ist die engere und damit bessere
Zusage.

### 3.4 H-2 bis H-4 aus R-3a gegen die Umsetzung

| Hinweis | Stand |
|---|---|
| H-2 (Steuer- und Bidi-Zeichen an Namen) | **teilweise** — an der Hauptfläche vollständig und sauber umgesetzt (`input.ts:111`, `:121-127`), an der Add-in-Tür fehlend. Das ist Befund T-112-1. |
| H-3 (`details` ohne Obergrenze) | **erledigt**, und besser als vorgeschlagen: 21 geholt, 20 gezeigt, Kürzung im Meldungstext statt still. Sollbruchstelle siehe 2.5. |
| H-4 (`legacy_alter_table` nicht im `finally`) | **erledigt**, `migration-runner.ts:281`, ohne Bedingung und mit ausgeschriebener Begründung. Die Wahl „ohne Bedingung" ist richtig: `OFF` ist die Vorgabe von SQLite, und ein Pragma je Migration kann keinen Fall verfehlen, den ein Textvergleich übersähe. |
| H-5 (`decodeURIComponent` ohne Netz) | **erledigt**, `router.ts:90-96`, `try` mit Rohtext als Rückfall. |
| H-6 (`visibilitychange` ohne Bremse) | **erledigt**, `useDataFreshness.ts:138`, Mindestabstand gegen **jede** Auffrischung und nicht nur gegen die letzte durch einen Fensterwechsel. |
| H-7 (`new RegExp` aus einem Namen im E2E-Test) | **erledigt**, kein `new RegExp` mehr in `tests/e2e/**`. |

### 3.5 `MAX_TOASTS` / `evict()` — kein Sicherheitsthema

Eine Anzeigegrenze im Speicher eines Browserfensters; die einzige Ausnahme (der Stapel wächst über
vier hinaus, wenn ausschließlich Meldungen mit Rückweg darinstehen) setzt je Eintrag eine
ausdrückliche Handlung des Benutzers voraus und endet mit dem Schließen des Fensters.

---

## 4. Geheimnisse und Kundendaten (Auftragspunkt 4)

- **Zugangsdaten.** Muster aus Schlüsselwort, Zuweisung und mindestens 16 Zeichen Ausweis über die
  97 geänderten Quelldateien: **ein** Treffer, der bekannte Kunstwert
  `apps/outlook-addin/scripts/proof-addin.mjs:1068`. Semgrep `p/secrets`: null Treffer. Das
  Sitzungsgeheimnis der End-zu-End-Hilfe heißt unverändert
  `takt-e2e-erfundenes-sitzungsgeheimnis-2026-08` und sagt im Namen, was es ist.
- **Call-Nummern.** Alle Muster erfunden und als Zählwert oder Scherz erkennbar: `TCK-000042`
  (60-mal), `TCK-000517`/`TCK-000518`, `TCK-000815`, `TCK-000816`, `TCK-000777`, `TCK-999999`.
- **Neue End-zu-End-Testdaten.** Durchweg `E2E-…-${run}`; 16 Dateien unter `tests/e2e` tragen das
  Präfix. Keine neuen Fixtures. `tests/fixtures/**` ist unverändert **leer** (sieben Ordner, keine
  Datei) — die Abweichung von CLAUDE.md aus R-3a besteht fort und ist keine Sicherheitsfrage: Dort
  liegen keine falschen Daten, sondern gar keine.
- **E-Mail-Adressen.** In den 97 geänderten Dateien: keine.
- **Lieferkette.** `pnpm-lock.yaml` im gesamten Diff **unverändert**. Kein neues Paket.
- **Unsichtbare Zeichen im Quelltext (Trojan Source).** Eigene Suche über **jede** versionierte
  Datei nach U+202A–U+202E, U+2066–U+2069, U+200B–U+200F, U+061C, U+FEFF: **fünf** Treffer, alle in
  `apps/local-api/test/http/input.test.ts` und alle der Zweck dieser Datei. Sonst frei. Siehe aber
  Hinweis T-112-H2.

---

## 5. Was ausdrücklich in Ordnung ist

Damit der nächste Leser nicht dasselbe zweimal prüft. Gemessen als „null geänderte Dateien" je
Pfad über `git diff --numstat aca53df..4dd3171`:

```
apps/local-api/src/access        0     apps/local-api/src/taskpane      0
apps/local-api/src/app.ts        0     packages/export                  0
apps/local-api/src/config.ts     0     apps/outlook-addin/src/callnumber 0
apps/local-api/src/composition.ts 0    packages/storage/migrations      0
apps/desktop/src-tauri           0     pnpm-lock.yaml                   0
```

- **Die Vertrauensgrenze selbst.** Kein Zugriffsschutz angefasst, keine Herkunftsprüfung, keine
  Pfadprüfung des Aufgabenbereichs. Der Diff über `apps/local-api/src/routes/` enthält **keine**
  hinzugefügte `routes.get/post/put/patch/delete`-Zeile — keine neue Route.
- **Der konfigurierbare reguläre Ausdruck des Add-ins.** Unberührt; Worker, Zeitschranke und
  Prüfung auf ungültige Ausdrücke sind, wie sie waren (B-4.2). Die vorhandenen `new RegExp` stehen
  ausschließlich dort und in `access/origin-policy.ts`.
- **Die Notiz-Trennung.** `packages/export/**` unberührt, `boundaries` von mir gemessen grün
  (319 Dateien geprüft), `Todo` trägt kein Notizfeld, `PoolMovement` trägt nur Namen.
- **Die eingebetteten Migrationen.** 24 zu 24, „aktuell" — und `migrations:embed:check` steht seit
  R-3a S-2 als erster Schritt in `proof:all`. Der Nachweis wird jetzt gerufen.
- **Der Auslieferungsablauf.** `.github/workflows/release.yml:423` hält die veröffentlichte
  `SHA256SUMS` mit `sha256sum -c --strict` gegen die Dateien daneben (R-3a S-3 erledigt, mit
  `--strict` über den Vorschlag hinaus).
- **Die Fehlerhülle.** `poolReference` gibt Kennung, Namen, Schlüssel und einen Satz — keinen
  Indexnamen, keine SQLite-Meldung, keinen Aufrufstapel. `details` ist der Zahl nach begrenzt.

---

## 6. Befunde

### Befund T-112-1 — die Wache aus H-2 fehlt an der Add-in-Tür

**Schwere: sollte.** **Akteure:** A-06 (Absender einer E-Mail), A-01 unabsichtlich.
**Betrifft:** B-12.1, B-12.3, VG-2, VG-8, Bedrohungsmodell 16.4.
**Zuständig: integration-dev.** **Ort:** `apps/local-api/src/routes/addin/schema.ts:66` (`title`),
`:85` (`tagNames`), Kommentar `:74`.

Vollständige Begründung in Abschnitt 2.2 und im Bedrohungsmodell 16.4.
**Gegenmittel:** `withoutControlCharacters` aus `apps/local-api/src/http/input.ts:121` auf `title`
und auf die Einträge von `tagNames` anwenden; den Kommentar bei `:74` richtigstellen.

### Hinweis T-112-H1 — acht Aufrufstellen, ein `resolveAxes` je Regel, keine Obergrenze

**Schwere: Hinweis.** **Zuständig:** Auftraggeber/Orchestrator. **Ort:**
`apps/local-api/src/usecases/pool-movement.ts:379`. Siehe 3.2. Antwort wäre eine Obergrenze für die
Zahl der Regeln oder eine engere für Ordnerterme je Liste (heute `max(200)`) — beides fachlich
folgenlos, beides steht seit R-3 H-1 offen und wird mit jeder neuen Aufrufstelle mehr wert.

### Hinweis T-112-H2 — der Nachweis der Zeichenwache ist im Review unsichtbar

**Schwere: Hinweis.** **Zuständig:** unit-tester. **Ort:**
`apps/local-api/test/http/input.test.ts` (unter anderem `:60`, `:109`, `:114`, `:131`, `:136`,
`:149`).

Die Steuer- und Bidi-Zeichen stehen dort **roh** im Quelltext statt als Escape-Folge
(`'\u0000'`, `'\u202E'`). Drei Folgen:

1. Das enthaltene NUL macht die Datei für Git zu einer **Binärdatei**. `git diff --stat` zeigt
   `Bin 0 -> 7238 bytes`; im Review sieht niemand eine Zeile. Ausgerechnet der Nachweis einer
   Sicherheitswache ist damit der einzige Teil dieser Welle, den ein Code-Reviewer nicht lesen kann.
2. Semgrep parst die Datei nur teilweise (Syntaxfehler bei `:60`).
3. Ein Werkzeug, das die Datei kopiert oder umformatiert, kann die Zeichen stillschweigend
   entfernen. Der Test schlüge dann fehl statt still durchzugehen — das ist der glimpfliche Ausgang,
   aber der Grund dafür wäre nicht zu sehen.

Escapes prüfen dasselbe und lassen die Datei Text bleiben. Nur Testcode, keine Laufzeitwirkung.

### Hinweis T-112-H3 — halb erledigt durch T-110

**Schwere: Hinweis.** **Zuständig:** frontend-dev. **Ort:** `apps/web/src/lib/errorText.ts`.

Der wichtige Teil ist erledigt, und zwar von selbst: T-110 ist während dieser Prüfung eingetroffen
und behält den Satz des Dienstes samt Kürzungshinweis (2.6). Offen bleibt der leichtere Teil —
die Namen stehen in **einem** zusammengefügten Satz statt als eigene Knoten, und die
Anführungszeichen setzt jetzt die Oberfläche. Das ist die Antwort auf die Zeichensetzung aus
2.3 Punkt 2 und keine Bedingung für die Freigabe.

### Weiterhin offen aus R-3a

**S-1 — der Sicherungszweig trägt die 186 MB weiter.** **Zuständig:** Orchestrator. Nachgemessen:
`backup/status-als-regelterm-vor-filter` existiert, `size-pack` unverändert **181,07 MiB**. Bis zur
Bereinigung gilt weiter: ausschließlich benannte Zweige pushen, nie `--all`, nie `--mirror`.

---

## 7. Kurzfassung

```
Aufgabe: T-112 — Sicherheitsprüfung Welle E bis G, Bedrohungsmodell nachziehen
Status: fertig — Nacharbeit an einem Punkt, sonst freigegeben

Artefakte: docs/bedrohungsmodell.md (neuer Abschnitt 16; Nachträge in 14.2, 15.3, 15.7),
           .claude/team/reports/T-112-security-checker.md

Zusammenfassung: Das Bedrohungsmodell ist nachgezogen — 14.2 und 15.3 behalten ihren
Protokollcharakter und tragen den Nachtrag, dass beide Add-in-Routen seit T-104 poolMovement
liefern statt dreier Namenslisten; der heutige Stand steht mit geprüften Zeilennummern im neuen
Abschnitt 16. Die Bewertung von VG-2 ändert sich dadurch nicht: ein Feld statt dreier, dieselbe
Datenklasse, zwei Felder weniger auf der Leitung. POST /time-entries rechnet die Bewegung in
derselben Transaktion, in der die Buchung entsteht, liefert nur Regelnamen aus dem eigenen
Bestand an der Hauptfläche und hat mit closedEntryMovementStates die vorsichtigere der beiden
möglichen Rechnungen — ein Satz, der weniger sagt, als geschehen ist. Sechs der sieben Hinweise
aus R-3a sind erledigt und nachgemessen, ebenso die Befunde S-2 (migrations:embed:check steht in
proof:all) und S-3 (sha256sum -c --strict vor der Veröffentlichung); S-1 steht unverändert.
Der eine Punkt, der Nacharbeit verlangt: H-2 ist an der Haupttür umgesetzt und an der Add-in-Tür
nicht — genau der Tür, deren eigener Kopfkommentar sagt, dass jede Zeichenkette dort eine fremde
Quelle berührt hat, und deren Titel mit dem E-Mail-Betreff vorbelegt ist.

Befunde:
  Sollte
    T-112-1  routes/addin/schema.ts:66 (title) und :85 (tagNames) — keine Prüfung auf C0/C1 und
             bidirektionale Formatierungszeichen; checkName in der Domäne fängt sie nicht
             (WHITESPACE deckt sie nicht ab). Der Titel ist mit mail.subject vorbelegt
             (TaskPane.tsx:120), und todo.title/todo.tags sind zulässige Feldquellen einer
             Exportvorlage. Kein XSS-Weg, kein Aufbrechen der Exportdatei (JSON.stringify), wohl
             aber eine Anzeige, die etwas anderes zeigt, als im Bestand steht. Gegenmittel:
             withoutControlCharacters aus http/input.ts:121 anwenden und den Kommentar :74
             richtigstellen, der die Gleichheit mit nameSchema noch zusichert. (integration-dev)
    S-1      (aus R-3a, unverändert) Zweig backup/status-als-regelterm-vor-filter, size-pack
             181,07 MiB. Nur benannte Zweige pushen. (Orchestrator)
  Hinweis
    T-112-H1 usecases/pool-movement.ts:379 — acht Aufrufstellen statt dreier, ein resolveAxes je
             Regel, keine Obergrenze für die Zahl der Regeln; bei POST /time-entries innerhalb
             einer schreibenden Transaktion. Ordnerterme werden immerhin in einer Abfrage
             aufgelöst, der Faktor aus R-3 H-1 gilt hier nicht. (Auftraggeber)
    T-112-H2 apps/local-api/test/http/input.test.ts — Steuer- und Bidi-Zeichen stehen roh statt
             als Escape. Das NUL macht die Datei für Git binär (git diff zeigt „Bin 0 -> 7238
             bytes"), Semgrep parst sie nur teilweise. Der Nachweis der Zeichenwache ist damit
             der einzige Teil dieser Welle, den ein Reviewer nicht lesen kann. (unit-tester)
    T-112-H3 apps/web/src/lib/errorText.ts — halb erledigt. T-110 ist waehrend der Pruefung
             eingetroffen und haelt: kein neuer Ausgabeweg, der Satz des Dienstes samt
             Kuerzungshinweis bleibt stehen, der Rueckfall auf message ist ausgesprochen.
             Offen bleibt nur, dass die Namen in einem zusammengefuegten Satz stehen statt als
             eigene Knoten — geringe Schwere, kein Rueckschritt. (frontend-dev)

Annahmen:
  - Ich habe 14.2 und 15.3 nicht überschrieben, sondern nachgetragen. Beide sind Protokoll zweier
    Prüfungen zu zwei Ständen; wer sie umschreibt, verliert die Spur, an der man sieht, wann die
    Fläche sich bewegt hat — und genau diese Spur ist der Inhalt von 15.3.
  - „Sollte" und nicht „muss" für T-112-1: Es ist kein Grenzübertritt (der Aufrufer braucht das
    Add-in-Token) und kein Codeausführungsweg (React maskiert, JSON.stringify escapet). Es ist
    eine Anzeigefrage mit entferntem Urheber — schwerer als H-2, leichter als eine Lücke.
  - Ich habe die portgebundenen Nachweispfade nicht gefahren (Ports beim Orchestrator, apps/web
    und apps/*/test in fremder Arbeit) und berufe mich nirgends auf fremde Zahlen als eigene.
    Gemessen habe ich selbst: Semgrep über 97 Dateien, proof:migrations, boundaries, die Diffs je
    Pfad und die Mustersuchen über den Baum.
  - T-110 lag beim Lesen von errorText.ts noch nicht im Baum und ist während meiner Arbeit
    eingetroffen. Ich habe es nachgeprüft statt es der nächsten Runde zu überlassen (2.6); die
    Aussage „kein XSS-Weg" gilt damit für den Stand 4dd3171 **und** für den Arbeitsbaum
    einschließlich T-110. Die übrigen fremden Änderungen im Arbeitsbaum (Tests des unit-testers,
    e2e-tester) habe ich nicht bewertet — sie gehören zur nächsten Prüfung.

Risiken:
  - Die Wache aus H-2 wird künftig für vorhanden gehalten, weil sie an einer Stelle vorhanden ist.
    Dagegen wacht kein Exitcode: Es gibt keinen Nachweispfad, der prüft, dass beide Türen dieselbe
    Zeichenklasse abweisen. Der Kommentar, der die Gleichheit zusichert, macht es schlimmer.
  - Semgrep Guardian ist zum sechsten Mal nicht erreichbar. Der lokale Lauf ersetzt SAST, nicht
    die Lieferketten- und Geheimnisbefunde der Plattform.
  - 42Crunch ist seit T-023 nicht betriebsbereit. Die Beschreibung ist in dieser Welle um 542
    Zeilen gewachsen; der Auditwert bleibt bei null, das Tor aus Abschnitt 8 uneinlösbar.
  - Die Add-in-Fläche wächst weder über neue Routen noch zwingend über den Port-Ausschnitt.
    Diese Welle hat gezeigt, dass sie auch wieder einziehen kann, ohne dass ports.ts sich rührt.
    Wer sie beurteilt, zählt die Felder der Antwort (Bedrohungsmodell 16.2).

Offene Fragen:
  1. Wann darf der Sicherungszweig weg? Unverändert offen seit R-3a; .git bleibt bei 182 MB.
  2. Bleibt es bei 200 Ordnertermen je Liste und bei keiner Obergrenze für die Zahl der Regeln
     (T-112-H1)? Die Frage steht seit R-3 und ist mit acht Aufrufstellen billiger zu beantworten
     als vorher.
  3. Wird der 42Crunch-Zugang beschafft oder das Tor gestrichen und ersetzt? Steht seit T-023.
  4. Soll tests/fixtures/** seiner Rolle aus CLAUDE.md zugeführt oder die Regel an den
     tatsächlichen Ort der Prüfdaten angepasst werden? Sieben Ordner, unverändert leer.

Nächster Schritt:
  integration-dev: T-112-1 — withoutControlCharacters auf title und tagNames in
  routes/addin/schema.ts, Kommentar :74 richtigstellen. Eine Zeile plus ein Absatz; die einzige
  Nacharbeit, die diese Welle verlangt. Sinnvoll gleich mit einem Nachweis daneben, der beide
  Türen gegen dieselbe Zeichenklasse hält — sonst läuft es beim nächsten Mal wieder auseinander.
  unit-tester: T-112-H2 (Escapes statt roher Zeichen). frontend-dev: T-112-H3 bei T-110.
  Orchestrator: S-1 erledigen, sobald die Wiedervorlagen angenommen sind; T-112-H1 entscheiden.
  security-checker (ich): T-110 ist nachgeprüft (2.6); offen bleibt die nächste Runde über die
  Teständerungen im Arbeitsbaum.
```
