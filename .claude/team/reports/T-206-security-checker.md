# T-206 — Die Abnahme, die nie stattgefunden hat, und drei Läufe an derselben Frage

**Aufgabe:** T-206 (Welle AE) — O-HF, O-GV.
**Status:** fertig
**Dateien:** `docs/bedrohungsmodell.md` (neuer **Abschnitt 28**), diese Datei. **Kein Produktivcode
angefaßt**, keine Kunstquelle im Baum.

## Urteil je Punkt

| Punkt | Urteil |
|---|---|
| **1 — O-HF** (SP-09) | **SP-09 bleibt.** Von sechs Texten darf **einer** gekürzt werden, um **einen** Satz, unter drei Bedingungen. Keine Fassung vorgelegt (E-078 Punkt 3). Dazu ein Hinweis: T-206-5 |
| **2 — O-GV** (Weigerungsregel für drei Läufe) | **Ja, sinngemäß** — und die Messung hat **vier** Löcher gefunden: T-206-1 (**muß**), T-206-2, T-206-3, T-206-4 (je **soll**). Vier Stellen, an denen ich keines gefunden habe, stehen ausdrücklich in 28.2.5 |

**Gesamt: Nacharbeit.** Sechs Auflagen: **A-A-50** bis **A-A-55**. Fünf davon sind gebaut und im
Spiegel **in beide Richtungen** gemessen; A-A-50 ist ein Auftrag, A-A-55 ein Satz.

## Wie gemessen wurde

Wie in T-176/T-183/T-189: am Verhalten, außerhalb des Bestands. Ein vollständiger Spiegel unter
`/tmp` mit Verweis auf den echten Modulbestand. **Die Prüfzeilen des Spiegels sind zeichengleich
mit denen des Bestands** (Prüfsumme über alle `ok`/`FEHL`-Zeilen, beide Seiten gleich):

| Lauf | Bestand | Spiegel |
|---|---|---|
| `proof:template-fields` | 30/0 | 30/0 |
| `proof:route-policy` | 40/0 | 40/0 |
| `proof:openapi` | 110/0 | 110/0 |

Nach jeder Messung ist der Spiegel zurückgesetzt und gegen diese Zahlen nachgefahren worden.
**`proof:all` nicht gefahren** (E-083 Punkt 3). Guardian und 42Crunch **nicht** erneut versucht
(E-079 Punkt 3) — **elftes** Mal ohne Werkzeug; Ersatz bleibt `proof:openapi`. Gesucht wurde über
die versionierten Dateien (`git grep`), Belege mit Datei und Zitat (E-087 Punkt 4).

## Punkt 1 — SP-09

**Was der Eintrag ist.** Sechs Texte in `apps/web/src/components/NoteField.tsx`: Kopfband, Marke
(nur Vorlesehilfe, im `<label>`) und Fußnote je Feldart. Die vorgemerkte Kürzung gilt der Fußnote
der **Leistung** — 125 Zeichen gegen die 80 aus Regel S-05.

**Zuerst gemessen, ob der Satz allein steht: nein.** Die Grenze ist **sechsfach** gebaut, fünf
Schichten sind gemessen (Abschnitt 28.1.1): der Typ der Domäne, `NoteSourceIsNotPublished` in
`export-catalog.ts`, die wörtliche Auswahlliste in `sources.ts` (gemessen: `todo.note` →
`export_source_forbidden`, ebenso `Todo.CallNumber` und `" todo.callNumber "`), der Renderer bei
umgangener Prüfung (gemessen: `{"Notiz":null,"Call":"TCK-000009"}`), `proof:export-api` und
`proof:export`.

**Urteil.**

| Träger | Urteil |
|---|---|
| Kopfband und Marke, beide Feldarten | **müssen stehen** |
| Fußnote „Vermerk", ganz (80 Zeichen) | **muß stehen, unverändert** |
| Fußnote „Leistung", Satz 1 einschließlich „… steht dort auf der Rechnung des Kunden." | **muß stehen** |
| Fußnote „Leistung", Satz 2 „Standardvorlage: Feld „Notiz“." | **darf fallen**, unter B-1 bis B-3 |

**Warum Satz 1 nicht angetastet wird.** Er ist eine **Folge**, keine Mechanik, und er ist im
Produkt die **einzige** Stelle, die den Empfänger nennt — über die versionierten Dateien gesucht,
ein Treffer außerhalb der Musterseite. R-08 nennt die Verwechslung „der wahrscheinlichste
Bedienfehler in diesem Produkt"; sie wird „erst in der Abrechnung sichtbar".

**Warum Satz 2 fallen darf.** Er nennt eine Zuordnung, keine Grenze, und ein Irrtum darüber kann
keinen Vermerk exportieren. Die Zuordnung steht bereits am richtigen Ort:
`apps/local-api/src/usecases/export-catalog.ts` gibt zur Quelle `group.bookingNotes` aus „Die
Leistungstexte aller enthaltenen Buchungen, vom Dienst zu einem Text zusammengeführt. **Die Quelle
für das Feld „Notiz“ der Standardvorlage.**", und `TemplateFields.tsx` zeigt sie im
Vorlageneditor.

**Die drei Bedingungen** (ich lege keine Fassung vor):

- **B-1** — Die Kürzung stellt S-05 **nicht** her: ohne Satz 2 bleiben **94** Zeichen. Wer sie
  vorlegt, sagt, welchen Ausgang von S-05 er nimmt. Eine weitere Kürzung zu Lasten der
  Empfängerangabe ist **nicht** gedeckt.
- **B-2** — Der Ausgang „zustandsgebunden" ist versperrt. S-05 nimmt einen zustandsgebundenen
  Hinweis „**auch** nicht in `aria-describedby`"; dann bliebe hörbar nur die Marke „Wird
  exportiert", die **daß** sagt und nicht **wohin**. **UM-01 darf auf `NoteField` nicht angewendet
  werden**, solange die Empfängerangabe nur in der Fußnote steht.
- **B-3** — Satz 2 darf nur fallen, solange der Editor die Zuordnung nennt. Der Satz in
  `export-catalog.ts` ist heute durch nichts festgehalten → **A-A-50**.

## Punkt 2 — die Weigerungsregel an drei Läufen

**Die sinngemäße Fassung**, weil keiner der drei Quelltext als Text liest, sondern alle drei den
Dienst ausführen: *Keine Zusicherung darf bestehen, ohne daß das Geprüfte stattgefunden hat.* Eine
Aufzählung, die still schrumpft, eine Menge, die leer sein darf, und ein Angriff, der nicht
ankommt, sind dieselbe Blindheit wie ein Zerleger, der aus dem Takt gerät.

### T-206-1 (muß) — eine Route, die beide Läufe nicht sehen

`proof-route-policy.mjs` und `proof-openapi.mjs` filtern beide `if (route.method === 'ALL') continue;`
mit der Begründung, `ALL`-Einträge seien Kettenglieder. Das gilt nicht für `app.all(…)`.

Kunstquelle: eine Zeile `api.all('/addin/leak', (c) => c.json({ data: { leak: 'GEHEIMER-INTERNER-VERMERK' } }));`

- mit dem **Add-in-Token**: **200**, Rumpf mitgeliefert (Sitzung ebenso 200, ohne Nachweis 401)
- `proof:route-policy`: **40/0, Code 0** — „die Add-in-Fläche sind genau vier Routen (4)", „(70
  Operationen)"
- `proof:openapi`: **110/0, Code 0** — „keine Route gibt es nur im Dienst", „beide Seiten führen
  dieselbe Zahl (70)"

Vier namentliche Zusicherungen, in diesem Augenblick alle falsch. Im unveränderten Baum: **10**
`ALL`-Einträge, **alle** mit Platzhalter — die Behebung kostet heute keinen falschen Alarm.
Gegenmittel **A-A-51**, gebaut und beidseitig gemessen: sauber 41/0 und 111/0, mit Kunstquelle
beide rot mit dem Pfad in der Meldung.

### T-206-2 (soll) — die Notiz-Grenze prüft die leere Menge

`proof-openapi.mjs` Abschnitt 6: `noteBearing.every(…)`, ohne Untergrenze. Der Kommentar daneben
sagt „Er darf in genau zwei Antworten stehen"; die Zwei wird nirgends geprüft. Gemessen, indem der
Durchlauf den Vermerk nicht mehr trägt: **0 Treffer, Lauf 110/0, Code 0**. Der Lauf führt das
Gegenmittel zweimal selbst („die Klasse ist nicht leer — sonst prüfte alles Folgende die leere
Menge"). Gegenmittel **A-A-52**, gemessen: sauber 111/0, blinder Durchlauf rot.

### T-206-3 (soll) — die Aufzählung ist einseitig ungeprüft

`if (describedEnum !== undefined && enforcedEnum !== undefined)`. Für `maxLength` zieht derselbe
Abschnitt die einseitige Grenze ausdrücklich („Eine Grenze, die der Dienst zieht, muss beschrieben
sein"), für die Aufzählung nicht. Gemessen: `enum` aus `theme` in der Beschreibung entfernt →
**110/0**; Leser ohne `enum` → **110/0**; dieselbe Verstümmelung auf `maxLength` → 108/2, auf
`required` → 105/5. Gegenmittel **A-A-53**, gemessen: sauber 110/0 (kein falscher Alarm über alle
29 Rumpfschemata), Kunstquelle 109/1.

### T-206-4 (soll) — drei Zusicherungen, die ohne den Angriff bestehen

`proof-template-fields.mjs` Abschnitt 5 trägt `check('die Vorlage steckt an jeder Prüfung vorbei in
der Datenbank', true);` — die Bedingung ist wörtlich `true` — und zweimal `status >= 400`. Ohne den
`INSERT` antworten Vorschau und Lauf **404 `not_found`**, und **alle drei bestehen**. Rot wird der
Lauf nur an den zwei `details`-Zeilen aus T-046, also aus einem anderen Anlaß. Zähne hat er sonst:
Feldnamenprüfung außer Kraft → **17/13**. Gegenmittel **A-A-54**, gemessen: sauber 30/0, ohne
`INSERT` 25/5 mit den richtigen roten Zeilen.

### Wo ich nichts gefunden habe

Vier Erwartungen, die sich nicht bestätigt haben (28.2.5): der YAML-Leser **wirft** bereits bei
allem Unbekannten und sagt das im Kopf — die Regel aus A-A-33, drei Wellen älter; Abschnitt 0 von
`proof:openapi` hält den Leser gegen den **Rohtext** und fängt jede Verschluckung von Pfaden,
Bauteilen, `maxLength` und `$ref`; die Untergrenzen sind da, wo sie gebraucht werden; und die
Vermerksmessung in `proof:route-policy` ist **positiv** verankert — sie ist die Vorlage für A-A-52.

## Annahmen

1. **Die Zeilennummern in `textbestand.md` sind veraltet**; ich habe SP-09 an den Texten gemessen,
   nicht an den Nummern. `NoteField.tsx:50` meint die Fußnote der Leistung.
2. **„Kürzung" heißt für mich: ein Satz weniger.** Eine Umformulierung derselben Aussage ist keine
   Kürzung und braucht meine Zustimmung nicht.
3. **Die Musterseite (`showcase/**`) ist kein Träger.** Bei der Frage „steht der Satz sonst
   irgendwo" habe ich sie ausgeschlossen.
4. **Als Zuständigen für T-206-1 bis T-206-4 habe ich domain-dev eingetragen**, weil alle vier
   Dateien unter `apps/local-api/**` außerhalb `src/routes/addin/` liegen.

## Risiken

- **T-206-1 nimmt `proof:route-policy` seine Aussage, solange er besteht.** Der Lauf schreibt sich
  zu, jede neu registrierte Route ohne Zutun mitzuprüfen. Für eine ganze Registrierungsart tut er
  das nicht, und `proof:openapi` fängt sie ebensowenig — die zweite Chance fällt mit der ersten.
- **T-206-2 und T-206-4 sind dieselbe Sorte in zwei Läufen**: eine Zusicherung, die ihr eigenes
  Vorbedingung nicht prüft. Beide sind billig zu beheben, und beide haben im selben Lauf ein
  Vorbild.
- **SP-09 hängt an nichts.** Solange A-A-50 nicht gebaut ist, kann jeder der sechs Texte in einer
  Textwelle fallen, ohne daß etwas rot wird — auch die zwei, die eine Grenze allein tragen.
- **Elftes Mal ohne Guardian und ohne 42Crunch.** Die Aussage über die OpenAPI-Beschreibung ruht
  vollständig auf `proof:openapi`, und T-206-1 und T-206-3 sind zwei Löcher in genau diesem Ersatz.

## Offene Fragen

1. **Darf Satz 2 der Fußnote „Leistung" jetzt fallen, oder erst nach A-A-50?** Meine Zustimmung
   steht unter B-3; ob die Reihenfolge „erst Zusicherung, dann Kürzung" erzwungen wird, ist eine
   Entscheidung des Orchestrators.
2. **A-A-55 — soll der Satz überhaupt geschrieben werden?** Er ist keine Messung, und E-090 warnt
   vor Papieren, die Papiere spiegeln. Ich halte ihn für gerechtfertigt, weil er **vier** Läufe
   betrifft und keiner ihn heute trägt; die Entscheidung liegt nicht bei mir.
3. **Gilt dieselbe Frage noch für `proof:export`, `proof:export-api` und `proof:access`?** Ich habe
   in dieser Aufgabe nur die drei beauftragten Läufe geprüft. Nach der Ausbeute von sechs Runden
   würde ich sie stellen.

## Nächster Schritt

1. **T-206-1 (A-A-51) vor der Abnahme dieser Welle** — domain-dev, dieselbe Änderung in zwei
   Dateien, je ein Prüfsatz. Die Behebung ist gebaut und beidseitig gemessen; sie ist abzuschreiben.
2. **A-A-52, A-A-53, A-A-54 in derselben Aufgabe** — dieselben zwei Dateien plus
   `proof-template-fields.mjs`, zusammen etwa zwanzig Zeilen, alle drei gemessen.
3. **A-A-50** an frontend-dev und unit-tester, nächste Welle — **vor** einer Kürzung von SP-09.
4. **SP-09 an spec-ux-reviewer** zurück: meine Stellungnahme liegt vor, eine Fassung nicht. Wer sie
   verfaßt, mißt sie an B-1 bis B-3.
