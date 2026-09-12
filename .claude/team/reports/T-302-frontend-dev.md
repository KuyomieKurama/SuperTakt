# T-302 — Anhänge aus einer E-Mail in SuperTakt richtig zeigen

**Aufgabe:** T-302 — Herkunft, Nachbau und die unantastbare Endung an der Anhangsliste und in der
Rückfrage vor dem Öffnen (A-19.22b, A-19.23a, A-19.23b; A-A-84 bis A-A-87, A-A-93, A-A-97; R-27)
**Rolle:** frontend-dev · **Stand:** 2026-09-11

## Status

**braucht Review**

## Artefakte

**Neu**

- `apps/web/src/shared/ui/ForeignName.tsx` — der Anzeigebaustein für einen Dateinamen aus fremder
  Hand. Nimmt `UncappedText`, behandelt ihn wie `Foreign` und läßt ihn umbrechen statt deckeln.
- `apps/web/scripts/proof-clamp.mjs` — **die Antwort auf R-27.** Siehe unten, Abschnitt „Die
  meßbare Zusage".

**Geändert**

- `apps/web/src/api/types.ts` — neuer Herkunftstyp `UncappedText`
- `apps/web/src/features/todos/api.ts` — `AttachmentOrigin`; vier Felder am `Attachment`
- `apps/web/src/features/todos/attachmentLabel.ts` — `attachmentLabel` reicht den Anzeigenamen
  durch; drei Rückgaben heißen jetzt `UncappedText`
- `apps/web/src/features/todos/AttachmentRow.tsx` — kein `truncate` mehr, Herkunftszeile,
  „(nachgebaut)" hinter dem Namen
- `apps/web/src/features/todos/AttachmentOpenDialog.tsx` — Herkunft, Nachbau, Anzeigename aus der
  E-Mail, abgesetzte Endung
- `apps/web/src/features/todos/Attachments.tsx` — vier Angaben aus dem Bestand in die Rückfrage
- `apps/web/src/showcase/DeadlineSection.tsx` — zwei neue Beispielanhänge, zwei neue Rückfragen
- `apps/web/src/styles/app.css`, `base.css`, `components.css`
- `apps/web/package.json` — `proof:clamp`

## Zusammenfassung

Der Anzeigename aus der E-Mail bekommt einen **eigenen Herkunftstyp** (`UncappedText`), und daran
hängt alles übrige. `truncate` ist aus der Anhangsliste verschwunden — Beschriftung und Wertzeile
brechen um; die Rückfrage zeigt zusätzlich den Namen aus der E-Mail, die **abgesetzte Endung** mit
ihrem Urteil („Endung: exe — wird ausgeführt", A-A-86) und, wenn die Datei aus einer E-Mail stammt,
den Satz aus A-A-85 mit dem Absender als fremdem Text. „(nachgebaut)" steht wortgleich mit dem
Aufgabenbereich hinter dem Namen in der Liste **und** als eigener Absatz in der Rückfrage — an der
Datei, nicht am Augenblick (A-19.22b, A-A-97). Der Kern der Arbeit ist aber nicht die Anzeige,
sondern `proof:clamp`: ein Nachweislauf, der die Menge der deckelnden CSS-Klassen aus den
Stilblättern **rechnet** und die Menge der Anzeigestellen aus dem **Typsystem**, und ihren Schnitt
auf leer prüft. Beide Mengen sind nirgends aufgezählt.

---

## Die meßbare Zusage — die Antwort auf R-27

R-27 endet mit einer Frage, nicht mit einer Maßnahme: *„Wie mißt man eine Zusage über die
Darstellung?"* Der Befund darunter ist, daß ein Deckel **ohne ein verändertes Zeichen** die
Rückfrage zum Lügen bringt und deshalb von keinem Wächter dieses Bestands gesehen wird.

**Meine Antwort: Der Deckel hat keinen Typ — aber er hat einen Namen, und die Stelle, an der er
wirkt, hat einen. Daraus werden zwei Mengen, und beide entstehen bei jedem Lauf neu.**

### Menge D — die Deckel, gelesen aus den Stilblättern

`proof-clamp.mjs` zerlegt alle sieben Stilblätter unter `apps/web/src/styles/` in Blattregeln und
erklärt jede Regel zum Deckel, die `text-overflow`, `-webkit-line-clamp`, `white-space: nowrap|pre`
oder `overflow[-x]: hidden|clip` deklariert. Aus ihren Wählern entsteht die Klassenmenge. **Heute
34 Klassen.** Niemand schreibt „truncate" in den Lauf; wer morgen `.name-kurz { text-overflow:
ellipsis }` erfindet, hat die Menge erweitert, ohne hier eine Zeile anzufassen. Eine Gegenprobe
legt genau so eine erfundene Regel dazu und mißt, daß sie ankommt.

Zwei Feinheiten, die beide **gemessen** und nicht geraten sind:

- **Nur der Gegenstand der Regel zählt**, nicht jede Klasse im Wähler. Der erste Lauf hat
  `.screen:has(> .board) > .board { overflow-y: hidden }` gelesen und daraus `.screen` zum Deckel
  erklärt — und damit die halbe Detailansicht. Die Argumente von `:has()`, `:is()`, `:where()`,
  `:not()` fallen weg, und von dem, was bleibt, zählt der letzte Teil hinter dem letzten Kombinator.
- **`max-width` ist kein Deckel.** Eine Breite allein kürzt nicht, sie läßt umbrechen. Wer sie
  mitzählte, machte den Lauf unbrauchbar — und ein unbrauchbarer Lauf wird abgeschaltet.

### Menge A — die Anzeigestellen, gerechnet aus dem Typ

`UncappedText` in `api/types.ts` markiert jeden Wert, an dessen **Ende** eine Entscheidung hängt:
`displayName`, `fileNameOf`, `effectiveFileNameOf`, `extensionOf`, `attachmentLabel`, der volle
Pfad in der Rückfrage. Der Übersetzer führt die Marke mit; der Lauf fragt ihn danach — dieselbe
Bauart, mit der `proof:foreign` seit T-129 der abgeschriebenen Feldliste entkommen ist.

Gefunden wird:

1. jedes JSX-Element, das einen markierten Wert als Kind oder Attributwert aufnimmt;
2. **jedes Elternelement in derselben Datei**;
3. über einen **Fixpunkt**: jeder Baustein, der so ein Element enthält, gilt als Träger, und jede
   Aufrufstelle dieses Bausteins ist wieder eine Anzeigestelle — rekursiv. Damit reicht die Messung
   über Dateigrenzen. **Das ist nicht theoretisch:** Genau über diesen Weg hat der erste Lauf
   `TodoDetailScreen.tsx` gefunden, drei Bausteine von `AttachmentRow` entfernt.

Heute: **20 Anzeigestellen in 9 Bausteinen, 70 geprüfte Elemente einschließlich Eltern.**

### Und drei Löcher, die ohne sie offen blieben

- **Die Marke darf nicht an einer Bausteingrenze verlorengehen.** Wer den Namen an einen Baustein
  reicht, dessen Parameter `ForeignText` heißt, würde die Verfolgung an seiner Tür beenden. Der
  Lauf fragt deshalb den **Erwartungstyp** an jeder Übergabe: `<Foreign value={name} />` mit einem
  `UncappedText` ist ein Befund.
- **Eine Kürzung im Quelltext.** `slice`/`substring`/`substr` auf einem markierten Wert **mit
  zweitem Argument** ist ein Befund — ein Schnitt, der das Ende wegnimmt. Ein Schnitt, der den
  Anfang wegnimmt (`slice(k)`), ist erlaubt: Genau das tut `extensionOf`. Das ist A-A-93 wörtlich,
  in einer Regel.
- **Eine Klassenangabe, die der Lauf nicht lesen kann**, ist ein Befund und kein Schweigen.
  `` `attachment--${kind}` `` wird als Muster behandelt und gegen die Deckelmenge gehalten; ein
  freier Ausdruck wird gemeldet.

### Neun Gegenproben

Jede Verletzung wird in eine Quelle eingesetzt, **die es auf der Platte nicht gibt** (Überlagerung
im Übersetzerwirt, wie `proof:foreign` seit T-186): Deckel am Element, Deckel zwei Ebenen höher,
Deckel über `cx`, Deckel im `style`-Attribut, verlorene Marke, Kürzung, unlesbare Klasse. Dazu die
erfundene Deckelklasse und der Beweis, daß der Lauf mit **leerer** Deckelmenge wirklich still
bliebe — sonst käme sein Urteil von woanders her.

### Was der Lauf nicht kann, ausgesprochen

**Er mißt Quelltext, keine Pixel.** Daß ein 200 Zeichen langer Name im Browser umbricht und seine
Endung zeigt, mißt nur ein Browser. A-A-93 verlangt diesen Prüffall ausdrücklich und er gehört dem
e2e-tester; dieser Lauf ersetzt ihn nicht. **Er schließt die Ursache aus, jener mißt die Wirkung.**
Ich habe die Wirkung für diesen Bericht von Hand gemessen (unten) — aber eine Messung von Hand ist
ein Stand, kein Wächter.

---

## Was wo steht, und warum

### Die Endung (A-19.23b, A-A-93, Punkt 1 des Auftrags)

| Fläche | vorher | jetzt |
|---|---|---|
| `.attachment__label` | `truncate` | `ForeignName`, `overflow-wrap: anywhere` |
| `.attachment__value` (Pfad/Adresse) | `truncate` | Umbruch; `title` bleibt als zweite Auskunft |
| Rückfrage, Dateiname | rohes `<bdi>` | `ForeignName` |
| Rückfrage, aufgelöster Name | rohes `<bdi>` | `ForeignName` |
| Rückfrage, Anzeigename aus der E-Mail | **gab es nicht** | `ForeignName`, eigenes Beschriftungspaar |
| Rückfrage, Endung | nur im Fließsatz | **abgesetzt**, eigene Zeile, mit Urteil (A-A-86) |
| Musterseite | `truncate` an zwei Stellen | dieselbe Bauart wie die Anwendung |

**Vier weitere `truncate` im Bestand habe ich bewußt stehen lassen**: `.auditrow__file`,
`.run-row__path`, `ExportScreen` (Exportverzeichnis, Abrechnungsbenutzer). Das sind Pfade, die
SuperTakt **selbst** erzeugt hat, an keiner Öffnen-Handlung hängen und nicht unter A-A-93 fallen
(„die Rückfrage vor dem Öffnen und die Anhangsliste"). Sie sind nicht vergessen, sie sind
abgegrenzt — und sollte jemand sie unter A-A-93 stellen wollen, macht ein `UncappedText` an ihrem
Typ sie sofort meßbar, ohne eine Zeile im Nachweislauf.

### Der Nachbau (A-19.22b, A-A-97, Punkt 2 des Auftrags)

Er hängt an der **Datei** und steht an **zwei** Stellen:

- **an der Zeile**, als `(nachgebaut)` unmittelbar hinter dem Namen. Das ist wortgleich mit dem
  Aufgabenbereich (T-303 Abschnitt 6.3a, F-06 verlangt genau diese Wortgleichheit und überläßt die
  Fläche dem Hauptfenster). Die Klammer steht in einem **eigenen Element** neben dem Namen und
  nicht in ihm: Dort steht fremder Text, und ein Absender, der seine Datei
  `Nachtrag.eml (nachgebaut)` nennt, hätte sonst die Kennzeichnung erfunden, die er nicht hat. Sie
  steht auch im zugänglichen Namen des Öffnen-Knopfes — ein Wort, das nur zu sehen ist, gibt es für
  eine Vorlesehilfe nicht.
- **in der Rückfrage**, als eigener Absatz im Warnton, mit dem Wortlaut aus 6.3a: *„Diese Datei ist
  ein Nachbau: Outlook hat die ursprüngliche Nachricht nicht als Datei hergegeben. Absender,
  Empfänger, Betreff, Versanddatum und Text stehen in der Datei. Die technischen Kopfzeilen der
  ursprünglichen Nachricht stehen nicht darin — und mit ihnen nicht der Nachweis, welchen Weg sie
  genommen hat."*

**Warnton, nicht Fehlerfarbe.** A-19.31 kennt „geklappt" und „etwas fehlt"; der Nachbau ist der
dritte Zustand — es hat geklappt, aber anders. Wer den Fehlerton hier ausleiht, hat ihn nicht mehr,
wenn eine Datei sich wirklich nicht öffnen läßt, und ein Benutzer mit älterem Outlook sähe ihn bei
jedem Todo, bis er ihn nicht mehr sieht. Dieselbe Entscheidung wie Z3a im Entwurf.

### Die Herkunft (A-A-84, A-A-85, A-A-87, Punkt 3 des Auftrags)

Sie steht an **beiden** Stellen, und das ist begründet und nicht doppelt gemoppelt:

- **An der Zeile**, als eigene Zeile mit Symbol und Satz: „Aus einer E-Mail von ‹Absender›". Grund:
  Die Rückfrage kommt erst **nach** dem Klick, und bei einem Verweis kommt sie nach A-A-7 gar nicht
  — ein Cloud-Anhang nach A-19.25 hat damit die Zeile als einzige Auskunft (A-A-87). Die Liste ist
  außerdem die Stelle, an der ein Mensch seine Anhänge überblickt; wer dort nicht sieht, welcher aus
  fremder Hand kam, hat die Unterscheidung aus R-21 nicht.
- **In der Rückfrage**, als Satz aus A-A-85 mit einem zweiten dazu: „Ihren Namen und ihren Inhalt
  hat der Absender bestimmt, nicht Sie." Dieser zweite Satz ist meine Zutat und der Grund steht in
  39.5.2: Bis A-19.23 kannte der Benutzer die Herkunft jedes Dateianhangs, weil er sie selbst
  gewählt hatte. Der Satz benennt genau das, was sich geändert hat.

**Der Absender ist fremder Text** und geht an beiden Stellen durch `<Foreign>`.

**Der Wirt eines Cloud-Verweises** (A-A-87) steht schon heute an der Zeile: `.attachment__value`
zeigt die volle normalisierte Adresse, und dort ist der Wirt das erste, was nach dem Schema kommt.
Mit dem entfallenen `truncate` ist er auch in einer engen Spalte nicht mehr das erste, was
verschwindet.

---

## Was ich gemessen habe

**Werkzeuglage:** Node 22.23.2, Windows 11, Playwright 1.62.1 (Chromium), pnpm 11.3.0.

| Messung | Ergebnis |
|---|---|
| `proof:clamp` | **21 bestanden, 0 rot**; 34 Deckelklassen, 20 Anzeigestellen, 9 Bausteine, 70 Elemente, 9 Gegenproben |
| `proof:foreign` | 21 bestanden, 0 rot — 170 Quelldateien, 184 behandelte Übergaben |
| `proof:surface` | 27 bestanden, 0 rot |
| `proof:locked` | 9 bestanden, 0 rot — 22 Sperrlisteneinträge, kein gestrichener Satz |
| `contrast` | 0 von 522 Paaren durchgefallen, 11 von 11 Gegenproben |
| **Gerendert und am Bildschirm gemessen**, 1280 px und **420 px**, hell und dunkel | Der Anzeigename aus 79 Zeichen (`…Endfassung_final.exe`) steht bei 420 px **vollständig** in drei Zeilen; `.exe` sichtbar. Gemessen am DOM: kein `.attachment__label` überläuft seinen Kasten |
| Rückfrage, gerendert | Dateiname, Name aus der E-Mail, voller Pfad und Endung stehen vollständig; „Endung: exe — wird ausgeführt" in Warnfarbe; Herkunft und Nachbau als getrennte Absätze |
| Dunkler Modus | beide Flächen geprüft, `--warning-fg`/`--warning-bg` tragen |
| Tastatur | keine neuen Bedienelemente; Fokusreihenfolge und -falle der Rückfrage unverändert, `focusableWithin` findet weiterhin genau die beiden Knöpfe |

**`pnpm check`, zweimal vollständig gefahren.** Beim zweiten Lauf:

| Schritt | Ergebnis |
|---|---|
| `typecheck` | grün, alle acht Projekte, dazu `typecheck:test` und `typecheck:e2e` |
| `boundaries` | grün |
| `contrast` | grün |
| `proof:all` (21 Läufe, inzwischen 22) | **grün** |
| `verify:bundle` | 19 bestanden, 0 rot |
| `test:coverage` | **1 rot von 1 699**, siehe Risiken 1 — nicht aus meinen Dateien |
| `test:rust` | 68 bestanden, 0 rot |
| `build` | grün |
| `audit` | keine bekannten Schwachstellen |

Beim **ersten** Lauf waren zusätzlich `proof:openapi` und `proof:callers` rot (Einrückungsfehler in
`apps/local-api/openapi/takt-local-api.yaml`) und ein zweiter Prüffall
(`outlook-certificate.windows.test.ts`). Beides ist zwischen den Läufen von anderen Agenten behoben
worden beziehungsweise nicht wieder aufgetreten; ich habe keine dieser Dateien angefaßt.

---

## Annahmen — was ich entschieden habe, ohne zu fragen

1. **`UncappedText` ist ein Schnitt mit `ForeignText`, keine Alternative.** Ein Wert dieses Typs
   **ist** fremder Text; jede Behandlung aus E-063 arbeitet unverändert auf ihm, und
   `proof:foreign` sieht ihn weiter. Die Alternative — ein eigenständiger Typ — hätte zwei
   Herkunftsvokabulare nebeneinander gestellt und beim ersten Fall die Frage aufgeworfen, welches
   gilt.
2. **`attachment.target` bleibt `ForeignText`, `path` in der Rückfrage wird `UncappedText`.** Der
   Pfad ist an der Anzeigestelle das, was zählt; ihn schon im Antwortmodell zu markieren hätte jede
   Adresse jedes Verweises mitgenommen, auch dort, wo kein Ende entscheidet.
3. **`proof:clamp` hängt an genau einem Namen.** Zwischenstand, nachgetragen: Bis zur Antwort des
   Orchestrators lief er behelfsweise als zweites Glied von `proof:surface` in
   `apps/web/package.json`, damit die Zusage überhaupt im Tor stand. Der Orchestrator hat ihn als
   **eigenes, dreizehntes Glied** in `proof:all` gehängt (22 statt 21); der Behelf ist
   zurückgenommen, `proof:surface` fährt wieder seinen einen Lauf. Der Grund gegen den Behelf ist
   nicht Ordnung, sondern Zählbarkeit: Ein Lauf, der zweimal fährt, schreibt seine Bilanzzeile
   zweimal, und in einer Ausgabe, in der Zeilen gezählt werden, ist eine doppelte Bilanz schlimmer
   als ein fehlender Lauf. Der Satz steht jetzt im Kopf von `proof-clamp.mjs`.
4. **Die vier `truncate` an Exportpfaden bleiben.** Begründung oben.
5. **Das Symbol für „aus einer E-Mail" ist `inbox`.** Der Symbolsatz führt kein `mail`; einen neuen
   Pfad zu zeichnen wäre eine Gestaltungsentscheidung, die dem ui-designer gehört.
6. **Ein Bildanhang kann keine E-Mail-Herkunft zeigen**, weil er strukturell keine hat — die
   Übernahme erzeugt `kind: 'file'` und `kind: 'link'`. Die Marken erscheinen deshalb an jeder Art,
   ohne Sonderfall; ein Bild trägt sie schlicht nie.
7. **„(nachgebaut)" darf `white-space: nowrap` tragen** und steht damit selbst in der Deckelmenge.
   Das ist kein Widerspruch: Es sind zwölf Zeichen **eigener** Text, und die Zusage aus A-A-93 gilt
   dem fremden Namen. `proof:clamp` bestätigt das, indem es die Klasse als Deckel führt und
   trotzdem grün bleibt — sie ist Geschwister des Namens, nicht sein Elternteil.

## Risiken

1. **`pnpm check` ist rot, an einer Stelle außerhalb meiner Hoheit.**
   `apps/local-api/test/usecases/data-transfer.test.ts:295` erwartet Archivfassung **5**, der Code
   steht auf **6**. Das ist die Folge einer Entscheidung über A-A-90 (Bytes im Archiv) und gehört
   domain-dev und unit-tester. Ich habe nichts unter `apps/local-api/**` oder `*/test/**` angefaßt.
2. **Der e2e-Prüffall aus A-A-93 fehlt.** Meine Messung der gerenderten Breite ist von Hand und
   steht in diesem Bericht, nicht im Tor. Der Fall gehört dem e2e-tester: 200 Zeichen, Endung
   `.exe`, Rückfrage geöffnet, Text **und** sichtbare Breite gemessen. Ohne ihn ist die zweite
   Hälfte von A-A-93 unbewacht.
3. **`proof:clamp` sieht keine Stile von außerhalb dieses Bestands** und keinen Klassennamen, der
   zur Laufzeit entsteht (letzteres meldet er, statt zu schweigen). Beides steht im Kopf der Datei.
4. **Die Anhangsliste wird höher.** Ein langer Name aus drei Zeilen plus Herkunftszeile plus
   Pfadzeile ist eine Zeile von rund 90 px. Bei zwanzig übernommenen Anhängen ist das eine lange
   Liste. Das ist der bewußte Tausch — Höhe kostet Scrollen, ein Deckel kostet die Endung —, aber
   es ist eine Frage an den ui-designer, ob die Wertzeile bei einer übernommenen Datei überhaupt
   noch etwas sagt: Dort steht der **erzeugte** Hexname, und der sagt einem Menschen so wenig wie
   der Bildname, für den A-A-17 die Zeile schon einmal weggelassen hat.
5. **Zwei Sätze über den Nachbau stehen jetzt an zwei Orten** — im Aufgabenbereich (Z3a) und hier.
   Wortgleich, aber nicht aus einer Quelle: Die beiden Anwendungen teilen keinen React-Baum.
   Ändert einer den Satz, läuft der andere auseinander. Ein Sperrlisteneintrag in
   `docs/design/textbestand.md` wäre die Antwort; die Datei gehört dem ui-designer.

## Offene Fragen an den Orchestrator

1. ~~`proof:clamp` in die Wurzel-`package.json`~~ — **erledigt.** Der Orchestrator hat den
   eigenen Eintrag und das dreizehnte Glied in `proof:all` gesetzt (22 Glieder), `CLAUDE.md` ist
   mitgezogen; ich habe den Behelf in `apps/web/package.json` zurückgenommen. Gemessen nach der
   Rücknahme: `pnpm run proof:all` fährt durch (Ausstieg 0), `proof-clamp.mjs` wird **einmal**
   aufgerufen, seine Bilanzzeile steht **einmal** im Protokoll, und der Lauf steht zwischen
   `proof:surface` und `proof:locked`.
2. **F-06 des ux-designers ist damit beantwortet, aber nicht abgenommen.** „(nachgebaut)" steht in
   Liste und Rückfrage; der Wortlaut der Rückfrage ist aus 6.3a übernommen. Gehören die beiden
   Sätze auf die Sperrliste in `docs/design/textbestand.md` (Hoheit ui-designer)? Ohne sie ist die
   Wortgleichheit eine Absicht.
3. **A-A-93 verlangt einen e2e-Prüffall über die gerenderte Breite.** Bitte an e2e-tester
   vergeben; Vorlage steht in Risiken 2. Die beiden neuen Knöpfe auf der Musterseite („Aus einer
   E-Mail, langer fremder Name mit ,.exe'" und „Nachbau der Nachricht") sind genau dafür da.
4. **Soll die Wertzeile bei einer übernommenen Datei entfallen?** Siehe Risiken 4 — die Frage
   gehört dem ui-designer, nicht mir.
5. **A-19.29/A-19.30 haben in SuperTakt keine Fläche**, und sie brauchen vielleicht auch keine: Was
   bei der Übernahme scheiterte, meldet der Aufgabenbereich (Z4). Ein Todo, das mit weniger
   Anhängen entstand als die E-Mail trug, sagt das in SuperTakt **nicht** — dort ist die
   Information drei Wochen später nicht mehr vorhanden. Das ist dieselbe Bauart wie der Nachbau,
   der genau deshalb in den Bestand gewandert ist. Ich melde es und baue es nicht: Es bräuchte ein
   Feld am Todo, und Felder gehören domain-dev.

## Nächster Schritt

Den e2e-Fall aus A-A-93 vergeben (Offene Fragen 3) und `visual-qa` über die zwei neuen Knöpfe der
Musterseite laufen lassen — die beiden Flächen, um die es in T-302 geht, sind dort ohne Dienst und
ohne Outlook erreichbar. `proof:clamp` steht seit der Antwort des Orchestrators als eigenes Glied
im Tor; das war der erste Schritt und ist erledigt.
