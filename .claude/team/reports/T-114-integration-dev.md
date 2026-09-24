# T-114 — Die Add-in-Tür weist dieselben Zeichen ab wie die Haupttür

Aufgabe: T-114 — Die Add-in-Tür weist dieselben Zeichen ab wie die Haupttür
Auftrag: Befund T-112-1 aus `.claude/team/reports/T-112-security-checker.md`
Stand vor der Arbeit: Branch `status-als-regelterm`, Commit `71c6695`
Datum: 2026-09-04. Verantwortlich: integration-dev.

---

## 1. Was der Befund war und was daran nicht stimmte

`routes/addin/schema.ts` prüfte `title` (`:66`) und die Einträge von `tagNames` (`:85`) nicht auf
C0/C1 und die bidirektionalen Formatierungszeichen; `checkName` in der Domäne fängt sie nicht.
Der Kommentar bei `:74` sicherte die Zeichengleichheit mit `nameSchema` weiterhin zu, obwohl sie
seit T-101 nicht mehr bestand.

**Ein Punkt des vorgeschlagenen Gegenmittels ließ sich nicht so ausführen, wie er dastand.**
`withoutControlCharacters` (`apps/local-api/src/http/input.ts:121`) ist **nicht exportiert** —
`const`, ohne `export`. Exportiert sind nur seine beiden Anwendungen, `titleSchema` (`:126`) und
`nameSchema` (`:127`). „Eine Zeile, sie ist schon geschrieben" trifft daher nicht ganz zu: Ohne
eine Änderung in `http/input.ts` (domain-dev) lässt sich die Funktion selbst nicht benutzen.

Ich habe deshalb **die exportierten Anwendungen** genommen statt eine zweite Fassung zu schreiben:

```ts
title:    titleSchema,                                          // war z.string().trim().min(1).max(512)
tagNames: z.array(nameSchema).max(ADDIN_TAG_NAMES_MAX).default([]),
```

Damit ist es nicht mehr ein **zeichengleiches**, sondern **dasselbe** Schema — es kann nicht mehr
auseinanderlaufen, weil es keinen zweiten Wortlaut mehr gibt. `routes/todos.ts:66` schreibt
`z.array(nameSchema).max(50)`; die Add-in-Zeile ist bis auf die benannte Konstante identisch.

**Der Preis: Der Titeldeckel sinkt von 512 auf 500.** Das ist die einzige Verhaltensänderung
dieser Aufgabe, die über „weist mehr ab" hinausgeht, und sie steht unter Annahme 1.

**Nebenbefund am Befundtext, damit die nächste Prüfung ihn nicht übernimmt.** T-112 Abschnitt 2.2
schreibt, „`routes/addin/index.ts` holt `readJson` bereits aus `../http/input.ts`". Das stimmt
nicht: `readJson` ist in `routes/addin/index.ts:394` **lokal definiert**. Der Import über die
Modulgrenze, den es tatsächlich gibt, ist `statusFor` aus `../../http/problem.ts` (`:67`). Die
Schlussfolgerung bleibt richtig — der Bezug ist unbedenklich und hat einen Vorgänger —, nur die
Fundstelle war eine andere.

---

## 2. Was geändert ist

| Datei | Was |
|---|---|
| `apps/local-api/src/routes/addin/schema.ts` | `title` → `titleSchema`, `tagNames` → `z.array(nameSchema)`; Kommentar bei `:74` richtiggestellt; Begründung, warum `note` (Vermerk) und `note` (Leistung) die Wache **nicht** tragen |
| `apps/local-api/src/routes/addin/index.ts` | nur der Kommentar über `statusFor`: „der **einzige** Import aus dem übrigen Dienst" gilt für das Modul nicht mehr und steht berichtigt statt gestrichen da |
| `apps/local-api/openapi/takt-local-api.yaml` (**nur** Add-in-Abschnitt, E-053) | `POST /addin/todos`: `title.maxLength` 512 → 500 mit Begründung; `tagNames` um die Zeichenregel ergänzt |
| `apps/outlook-addin/src/office/mail.ts` | `suggestTitle` entfernt die abgewiesenen Zeichen aus dem Vorschlag und kürzt auf `MAX_TITLE_CHARACTERS` (500) statt auf 512 |
| `apps/outlook-addin/src/ui/TaskPane.tsx` | `fieldLabel()`: ein Befund an `tagNames.0` heißt jetzt „Neue Tags, Eintrag 1" statt „tagNames.0" |
| `apps/outlook-addin/scripts/proof-addin.mjs` | **Abschnitt 16**, 14 Prüfungen: beide Türen gegen dieselbe Zeichenklasse |
| `.claude/team/reports/T-114-integration-dev.md` | dieser Bericht |

**Keine fremde Datei angefasst.** `apps/local-api/scripts/**` (domain-dev), `packages/domain/**`,
`packages/storage/**`, `apps/web/**`, `apps/*/test/**`, `tests/e2e/**` sind unberührt; der
Hauptabschnitt der OpenAPI ebenfalls. Kein `git commit`, kein `stash`, kein `checkout`, kein
fremder Prozess beendet. Ports 17843/17844 nicht belegt — `proof:addin` fährt gegen
`app.request(...)` ohne Netzsteckplatz.

---

## 3. Der Nachweis (Auftragspunkt 3)

Er steht in **meinem** Nachweispfad, `apps/outlook-addin/scripts/proof-addin.mjs` Abschnitt 16 —
er passt dorthin, weil dieser Pfad schon heute beide Seiten importiert (`mountAddinRoutes`,
`usecases/todos.ts`) und über `proof:all` bei jedem Lauf mitkommt. **Eine Zeile in
`apps/local-api/scripts/**` brauche ich nicht:** `proof:addin` ist der letzte Schritt von
`proof:all`, und `proof:all` läuft auch dann, wenn nur `apps/local-api` sich bewegt. Es gibt also
keinen Weg, `http/input.ts` zu ändern, ohne diesen Abschnitt zu fahren.

Geprüft wird **Verhalten, nicht Wortlaut** — ein Textvergleich zweier Dateien wäre wieder eine
Aussage über Abschriften:

```
16  Beide Türen weisen dieselben Zeichen ab (T-114, Befund T-112-1)
  ok  beide Türen weisen dieselben 20 Zeichen im Titel ab
  ok  beide Türen weisen dieselben Zeichen in einem Tagnamen ab
  ok  die Beanstandung nennt das Feld, in dem sie entstanden ist
  ok  beide Türen nehmen dieselben 9 harmlosen Zeichen an
  ok  die Länge läuft ebenfalls nicht auseinander
  ok  der Tagname bleibt an 200 Zeichen aus der Domäne gebunden
  ok  T-114 Punkt 4: Vermerk und Leistung tragen die Wache bewusst nicht
  ok  der Titelvorschlag aus einem Betreff läuft nie in die Abweisung
  ok  Leerraum bleibt Leerraum, unsichtbare Zeichen verschwinden ersatzlos
  ok  ein Betreff aus lauter unsichtbaren Zeichen ergibt einen sichtbar leeren Vorschlag
  ok  ein überlanger Betreff wird auf den Deckel gekürzt, den der Dienst annimmt
  ok  an der laufenden Route: 422 mit deutschem Satz, und nichts ist angelegt
  ok  an der laufenden Route: derselbe Titel ohne das Zeichen geht durch
  ok  T-114 Punkt 4: die Call-Nummer braucht keine zweite Wache
```

Verglichen werden `REQUEST_SCHEMAS.createTodo` aus `routes/todos.ts` und `createTodoSchema` aus
`routes/addin/schema.ts` — die **Türen**, nicht die Hilfsfunktion dahinter. Die Prüfung bliebe
auch dann richtig, wenn eine Seite ihre Wache umbaut.

Die 20 Zeichen stehen als **Zahlen** (`String.fromCodePoint(0x202e)`) und nicht roh im Quelltext.
Das ist die Lehre aus Hinweis T-112-H2: Ein rohes `U+0000` macht die Datei für Git zu einer
Binärdatei, und ausgerechnet der Nachweis einer Zeichenwache wäre dann der eine Teil, den ein
Reviewer nicht lesen kann. Eigene Gegenmessung über alle sechs geänderten Quelldateien und über
diesen Bericht: kein rohes Steuer-, Bidi- oder unsichtbares Zeichen (C0, C1, `U+202A`–`U+202E`,
`U+2066`–`U+2069`, `U+200B`–`U+200F`, `U+061C`, `U+FEFF`).

**Gegenprobe, dass der Abschnitt überhaupt unterscheidet.** Ich habe den Stand von `71c6695`
(`z.string().trim().min(1).max(512)`) außerhalb des Baums nachgebaut und dieselbe Tabelle gegen
ihn gefahren: **20 von 20 Abweichungen** im Titel („Haupttür weist ab, alte Add-in-Tür nimmt an"),
dazu die Längenabweichung 512/500. Der Abschnitt wäre vor der Änderung rot gewesen. Ohne diese
Messung wäre „grün" nur die Aussage, dass die Prüfung nichts findet.

---

## 4. Auftragspunkt 4 — welche Zeichenketten die Add-in-Tür sonst annimmt

Vier Routen, davon zwei mit Rumpf. Vollständig durchgesehen, mit Ergebnis auch dort, wo nichts
dazukommt:

| Eingang | Schema | Braucht die Wache? |
|---|---|---|
| `title` (`POST /addin/todos`) | `titleSchema` | **ja — behoben** |
| `tagNames[]` (`POST /addin/todos`) | `nameSchema` | **ja — behoben** |
| `callNumber` (`POST /addin/todos`, `GET /addin/todo-matches`) | Transportdeckel 128, dann `checkCallNumber` | **nein.** `ALLOWED_SHAPE = /^[A-Za-z0-9._\/-]+$/` (`packages/domain/src/call-number.ts:60`) ist ein **geschlossener** Vorrat; er schließt jedes Steuer- und Richtungszeichen mit ein, ohne es zu nennen. Trotzdem geprüft (Abschnitt 16, letzte Zeile) — „ist schon abgedeckt" ist der Satz, mit dem T-112-1 fünf Wellen überlebt hat. |
| `note` (Vermerk, `POST /addin/todos`) | `z.string().max(4000)` | **nein, und das ist eine Grenze, keine Lücke.** Dieselbe Trennung, die `http/input.ts` zwischen `nameSchema` und `textSchema` zieht: Ein Name wird in fremde Sätze eingesetzt, ein Vermerk als eigener Absatz gezeigt. Ein Freitextfeld, das an einem Steuerzeichen scheitert, weist Text des Benutzers ab. Der Vermerk ist zudem **keine** zulässige Feldquelle einer Exportvorlage (A-7.2) — der Titel ist eine, und das ist der Unterschied, der die Prüfung dort nötig macht. Ausgeschrieben im Quelltext und in Abschnitt 16 festgehalten, damit eine spätere Änderung eine Entscheidung ist und kein Vorbeigehen. |
| `note` (Leistung, `POST /addin/todos/{id}/time-entries`) | `z.string().max(4000)` | **nein**, gleicher Grund; sie kommt als einziges Feld dieser Tür ausschließlich aus dem Eingabefeld und nie aus der E-Mail. |
| `statusId`, `tagIds[]` | `z.string().uuid()` | nein — geschlossen. |
| `startedAt`, `endedAt` | `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$` | nein — geschlossen. |
| `todoId` (Pfad von `POST /addin/todos/{todoId}/time-entries`) | keines, `as TodoId` | nein — **und die Haupttür macht es genauso** (`routes/todos.ts:199, 217, 241, …`). Der Wert wird als Nachschlageschlüssel benutzt, geht als SQL-Platzhalter hinein und endet bei Nichttreffer als 404; er erreicht keine Anzeige und keinen Bestand. Keine Abweichung zwischen den Türen, also nichts, was T-114 zu schließen hätte. |
| **Ordnername** | — | **kommt an dieser Tür gar nicht vor.** Das Add-in legt keine Ordner an; Ordner verlassen den Dienst ausschließlich lesend über `GET /addin/context`. Es gibt hier nichts zu bewachen. |

---

## 5. Die Sackgasse aus dem Auftrag, und warum ich sie nicht durch Bereinigen an der Tür gelöst habe

Der Auftrag warnt: „Eine Mail mit einem Steuerzeichen im Betreff darf das Anlegen nicht in eine
Sackgasse führen." Ohne Gegenmittel wäre sie genau das gewesen — `useState(() =>
suggestTitle(mail.subject))` belegt das Titelfeld vor, der Benutzer drückt „Anlegen", bekommt ein
422 auf ein Feld, an dem **nichts Falsches zu sehen ist**, und der einzige Ausweg wäre, den ganzen
Titel neu zu tippen.

**Bereinigen an der Tür wäre die falsche Antwort gewesen**, und die Begründung steht schon
geschrieben in `http/input.ts`: Ein stilles Entfernen änderte, was der Benutzer eingegeben hat, und
er erführe es nicht. Deshalb bleibt die Tür beim Abweisen, und der **Vorschlag** wird bereinigt:

- `suggestTitle` nimmt die Zeichen heraus, bevor sie im Feld landen. Das ändert keine Eingabe — es
  ist ein Vorschlag aus fremder Quelle, den der Benutzer vor dem Absenden sieht und ändern kann,
  und `suggestTitle` streicht dort ohnehin schon `AW:`-Vorsilben, Leerraumfolgen und Überlänge.
- Was der Benutzer selbst tippt oder einfügt, geht **unverändert** an den Dienst und wird dort
  abgewiesen, mit dem deutschen Satz an dem Feld, in dem es passiert ist.
- `U+0009` bis `U+000D` fallen **nicht** ersatzlos, sondern werden vom nachfolgenden `\s+`-Schritt
  zu einem Leerzeichen: aus „Störung⇥Lüftung" wird „Störung Lüftung" und nicht „StörungLüftung".

Die Meldung selbst kommt aus `http/input.ts` und ist deutsch: „Steuerzeichen und Richtungszeichen
sind in einem Namen nicht erlaubt." Der Aufgabenbereich setzt die Feldbeschriftung davor. Damit
das bei einem Tagnamen nicht „tagNames.0: …" heißt, übersetzt `fieldLabel()` den Pfad jetzt in
„Neue Tags, Eintrag 1". **Der abgewiesene Wert steht nirgends in der Meldung** — er stammt
möglicherweise aus einer fremden E-Mail, und ein Text, der ein solches Zeichen wörtlich
wiedergibt, richtet in der Fehlermeldung genau den Schaden an, den er verhindern soll. Auch das
ist in Abschnitt 16 geprüft.

---

## 6. Gemessen, nicht angenommen

Jeder Befehl einzeln aufgerufen, Ausgabe in eine Datei umgeleitet, Endstatus unmittelbar danach
gelesen — keine Pipe (zsh `pipestatus`).

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm typecheck` | **0** | grün über neun Konfigurationen einschließlich `typecheck:test` und `typecheck:e2e` |
| `pnpm test` | **0** | 53 Dateien, **787** Tests, 0 fehlgeschlagen |
| `pnpm proof:addin` | **0** | **148** Prüfungen (vorher 134), 0 fehlgeschlagen |
| `pnpm proof:openapi` | **0** | 105 Prüfungen, 0 fehlgeschlagen |
| `pnpm proof:all` | **0** | 13 Pfade, **847** Prüfungen, 0 fehlgeschlagen; `migrations.embedded.ts` aktuell (24 Dateien) |
| `pnpm boundaries` | **0** | 8 Quelldateien in `packages/export`, **321** außerhalb der Domäne, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm --filter @takt/outlook-addin build` | **0** | `tsc --noEmit` + `vite build`, 60 Module, 237,67 kB |

Alles nach der letzten Änderung noch einmal vollständig gefahren.

**Nicht gefahren: `pnpm test:e2e`.** Steht nicht in der Nachweisliste dieser Aufgabe, und
`tests/e2e/**` gehört dem e2e-tester. Suche über `tests/**`, `apps/*/test/**` und
`apps/outlook-addin/**` nach der Zahl `512`: **kein Treffer** außer der von mir geänderten Stelle
in `mail.ts`. Es hängt also kein fremder Test an dem alten Deckel.

---

## 7. Kurzfassung

```
Aufgabe: T-114 — Die Add-in-Tür weist dieselben Zeichen ab wie die Haupttür
Status: fertig

Artefakte:
  apps/local-api/src/routes/addin/schema.ts       (title → titleSchema, tagNames → nameSchema,
                                                   Kommentar :74 richtiggestellt, Vermerk begründet)
  apps/local-api/src/routes/addin/index.ts        (nur Kommentar: „einziger Import" berichtigt)
  apps/local-api/openapi/takt-local-api.yaml      (nur Add-in-Abschnitt, E-053)
  apps/outlook-addin/src/office/mail.ts           (suggestTitle bereinigt den Vorschlag, 512 → 500)
  apps/outlook-addin/src/ui/TaskPane.tsx          (fieldLabel: „tagNames.0" → „Neue Tags, Eintrag 1")
  apps/outlook-addin/scripts/proof-addin.mjs      (Abschnitt 16, 14 Prüfungen)
  .claude/team/reports/T-114-integration-dev.md

Zusammenfassung: Die Add-in-Tür benutzt jetzt `titleSchema` und `nameSchema` aus
`http/input.ts` statt eigener Abschriften — es ist nicht mehr ein zeichengleiches, sondern
dasselbe Schema, und der Kommentar bei :74, der die Gleichheit seit T-101 zu Unrecht zusicherte,
ist richtiggestellt. `withoutControlCharacters` selbst ließ sich nicht anwenden, weil es nicht
exportiert ist; ich habe seine beiden exportierten Anwendungen genommen statt eine zweite Fassung
zu schreiben, und das senkt den Titeldeckel von 512 auf 500 (Annahme 1). Abschnitt 16 des
Add-in-Nachweispfads hält beide Türen gegen dieselben 20 Zeichen und dieselben neun harmlosen,
gegen beide Längengrenzen und gegen die laufende Route; eine Gegenprobe gegen den nachgebauten
Stand von 71c6695 zeigt 20 von 20 Abweichungen, der Abschnitt wäre vorher rot gewesen. Damit ein
Betreff mit einem unsichtbaren Zeichen nicht in eine Sackgasse führt, nimmt `suggestTitle` die
Zeichen aus dem Vorschlag heraus — die Tür weist weiter ab, bereinigt wird nur, was der Benutzer
nicht selbst geschrieben hat. Von den übrigen Zeichenketten der Add-in-Tür braucht keine eine
zweite Wache (Abschnitt 4), und einen Ordnernamen nimmt diese Tür überhaupt nicht entgegen.

Annahmen:
  1. **Der Titeldeckel sinkt von 512 auf 500, und ich habe das entschieden statt gefragt.**
     `withoutControlCharacters` ist nicht exportiert; die einzige Form, in der die Prüfung ohne
     eine Änderung in fremder Hoheit benutzbar ist, ist `titleSchema` — und die trägt 500. Ich
     halte das auch unabhängig davon für den richtigen Wert: `POST /todos` und
     `PATCH /todos/{todoId}` tragen 500, ein hier mit 512 Zeichen angelegtes Todo war in der
     Hauptanwendung nicht mehr speicherbar (der Änderungsdialog schickt den Titel mit), und das
     ist dieselbe Sackgasse aus derselben Ursache, nur über die Länge statt über ein Zeichen.
     Zwölf Zeichen sind das nicht wert; ein Betreff, der sie braucht, ist kein Titel mehr. Kein
     Test und keine Vorrichtung hing an der 512. **Umkehrbar** — siehe offene Frage 1.
  2. **Der Titelvorschlag wird bereinigt, die Eingabe nicht.** Ich habe das nicht als Aufhebung
     der Regel „abweisen statt entfernen" gelesen, sondern als deren Voraussetzung: Der Vorschlag
     ist nichts, was der Benutzer eingegeben hat. Wäre auch das eine Entscheidung, die mir nicht
     zusteht, ist der Rückweg eine Zeile in `mail.ts` — dann bleibt die Tür wie sie ist und der
     Fall aus dem Auftrag („darf nicht in eine Sackgasse führen") tritt wieder ein.
  3. **`fieldLabel()` im Aufgabenbereich** ist Beiwerk und stand nicht im Auftrag. Ich habe es
     dazugenommen, weil die Zeichenprüfung den Fall „Befund an einem Listeneintrag" erst häufig
     macht: Vorher konnte ein Tagname nur an seiner Länge scheitern, jetzt an einem unsichtbaren
     Zeichen — und die Meldung hätte „tagNames.0" geheißen.
  4. **Zwei Zahlen stehen weiter zweimal im Baum** (`MAX_TITLE_CHARACTERS` im Add-in, 500 in
     `titleSchema`). Der Aufgabenbereich ist ein Browserbündel und darf `@takt/local-api` nicht
     in seiner Abhängigkeitsliste führen; die Zahl kann nicht geteilt werden. Statt es im
     Kommentar zuzusichern, hält Abschnitt 16 sie gegeneinander — dieselbe Antwort, die T-114
     auf das ursprüngliche Problem gibt.

Risiken:
  - **Sicherheit, behoben:** Ein Steuer- oder Richtungszeichen kann über das Add-in nicht mehr in
    `todo.title` oder einen Tagnamen gelangen. Damit ist auch der Weg in eine Exportdatei zu:
    `todo.title` und `todo.tags` sind zulässige Feldquellen (`packages/export/src/sources.ts:34,35`).
  - **Sicherheit, offen und außerhalb dieses Auftrags:** `TaskPane.tsx:364` zeigt `mail.subject`
    **roh** an, und `prepareNote` übernimmt ihn wörtlich in den Vermerk. Ein `U+202E` im Betreff
    dreht damit die Anzeige dieses Blocks im Aufgabenbereich um, ohne je durch die Tür zu gehen.
    Kein Bestand, keine Ausführung, kein Export — eine reine Anzeigefrage im Add-in-Fenster. Das
    Gegenmittel ist eine CSS-Zeile (`unicode-bidi: isolate` auf den Anzeigeblock) oder `<bdi>`;
    ich habe sie **nicht** gesetzt, weil sie eine eigene Frage ist und der Diff dieser Aufgabe
    beim Befund bleiben soll. Vorschlag als eigene Aufgabe.
  - **Altbestand:** Die Prüfung sitzt am Eingang. Vor T-114 über das Add-in angelegte Titel mit
    einem solchen Zeichen oder mit 501 bis 512 Zeichen bleiben, wie sie sind; ein `PATCH`, der sie
    unverändert zurückschickt, wird jetzt mit 422 abgewiesen. Umbenennen und Löschen gehen
    weiterhin. Das ist derselbe Nebeneffekt, den T-101 Annahme 6 für die Hauptfläche in Kauf
    genommen hat, und eine Migration wäre die stille Änderung, die dort abgelehnt wurde.
  - **Kleiner Rest in `suggestTitle`:** Der Schnitt bei 500 kann ein Ersatzzeichenpaar (Emoji)
    zerteilen und eine einzelne Hälfte hinterlassen. Vorbestand — bei 512 galt dasselbe —, und
    beide Türen nehmen den Wert an; es ist keine neue Lücke, aber eine Zeile wert, falls jemand
    ohnehin dort ist.
  - **Der Nachweis läuft, solange `proof:addin` in `proof:all` steht.** Fiele er heraus, fiele
    die Gleichheitsmessung lautlos mit. Sie ist der einzige Ort, an dem sie gemessen wird.

Offene Fragen:
  1. **Bleibt der Titeldeckel bei 500?** Wenn das Add-in seine 512 behalten soll, braucht es genau
     ein Wort in fremder Hoheit: `export` vor `withoutControlCharacters` in
     `apps/local-api/src/http/input.ts:121` (domain-dev). Dann schriebe die Add-in-Tür
     `withoutControlCharacters(z.string().trim().min(1).max(512))` und Abschnitt 16 verlöre die
     eine Prüfung „die Länge läuft ebenfalls nicht auseinander". **Meine Empfehlung: bei 500
     bleiben** und den Export trotzdem erwägen — er machte die Prüfung an weiteren Feldern ohne
     Längenzwang benutzbar. Ich habe die Datei nicht angefasst.
  2. **`Todo.title` im Hauptabschnitt der OpenAPI** (`takt-local-api.yaml:3691`) trägt weiterhin
     `maxLength: 512`, während `TodoCreate`/`TodoUpdate` (`:3715`, `:3758`) 500 tragen. Die 512
     war die Obergrenze, die es nur über das Add-in gab; seit heute gibt es sie an keinem Eingang
     mehr. Der Abschnitt gehört domain-dev (E-053) — **Vorschlag an ihn**, nicht von mir geändert.
  3. **Für `apps/local-api/scripts/**` brauche ich keine Zeile.** `proof:addin` ist der letzte
     Schritt von `proof:all`, und `proof:all` läuft auch bei einer reinen Änderung an
     `apps/local-api`. Falls der Orchestrator die Gleichheitsmessung trotzdem näher an
     `http/input.ts` haben will, wäre der Ort `apps/local-api/scripts/proof-openapi.mjs` —
     dann ist es ein Auftrag an domain-dev und keine Änderung von mir.
  4. **Der Befundtext T-112 Abschnitt 2.2 nennt eine Fundstelle falsch** („`index.ts` holt
     `readJson` bereits aus `../http/input.ts`" — es ist dort lokal definiert, `:394`). Soll
     `readJson` zusammengelegt werden? Zwei Fassungen desselben JSON-Lesers sind genau die Sorte
     Doppelung, um die es in dieser Aufgabe geht — aber es ist eine eigene Entscheidung, und die
     Add-in-Fassung ist heute die kürzere. Ich habe nichts zusammengelegt.

Nächster Schritt:
  Zur Freigabe an Code-Reviewer und security-checker; T-112-1 ist damit beantwortet und mit einem
  laufenden Nachweis versehen. Danach zwei kleine Folgeaufgaben, beide in meiner Hoheit und beide
  bewusst nicht in diesem Diff: die Bidi-Isolierung der rohen Betreffanzeige in
  `TaskPane.tsx:364`/`addin.css`, und der Schnitt auf Codepunkte statt UTF-16-Einheiten in
  `suggestTitle`. An domain-dev: Frage 2 (die 512 im Hauptabschnitt der OpenAPI) und,
  falls Frage 1 anders entschieden wird, das `export` in `http/input.ts`.
```
