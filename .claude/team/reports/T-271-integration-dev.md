# T-271 — Zehn Pfadangaben in `routes/addin/` zeigen ins Leere

Aufgabe: T-271 — Pfadverweise in der Add-in-Fläche nach dem featureweisen Umbau nachziehen
Status: fertig

## Artefakte

Geändert (ausschließlich Kommentare, kein ausführbarer Code):

- `apps/local-api/src/routes/addin/index.ts`
- `apps/local-api/src/routes/addin/schema.ts`
- `apps/local-api/src/routes/addin/service.ts`
- `apps/outlook-addin/src/duplicate/reopen.ts`
- `apps/outlook-addin/src/duplicate/rule.ts`
- `apps/outlook-addin/scripts/fixtures.mjs`
- `apps/outlook-addin/scripts/proof-addin.mjs`

Bericht: `.claude/team/reports/T-271-integration-dev.md`

## Zusammenfassung

Ich habe die ganze Hoheit abgesucht — nicht nur die zehn gemeldeten Stellen — und **30**
veraltete Pfadangaben in Gegenwartsform nachgezogen: 19 in `apps/local-api/src/routes/addin/`
und 11 in `apps/outlook-addin/`. Die Trennung Gegenwart/Vergangenheit ist gezogen: sechs
Sätze im Präteritum, die einen früheren Ort benennen, bleiben unverändert stehen. Zwei
Angaben waren nicht bloß veraltet, sondern hätten bei mechanischem Nachziehen etwas
**Falsches** behauptet; sie sind unten eigens gemeldet. Alle Läufe stehen zeichengleich:
`proof:addin` 248/0, `proof:addin-wiring` 32/0, `proof:route-policy` 44/0, `pnpm typecheck`
ohne Befund.

## Der Befund in Zahlen

Der code-reviewer meldete zehn Verweise, fünf davon auf `usecases/todos.ts`. Gemessen habe
ich in `routes/addin/`:

| alter Verweis | Anzahl | neuer Ort |
|---|---|---|
| `usecases/todos.ts` | 5 | `features/todos/todos.ts` |
| `usecases/tag-names.ts` | 3 | `src/tag-names.ts` |
| `usecases/pool-movement.ts` | 2 | `src/pool-movement.ts` |
| `usecases/timer.ts` | 1 | `features/timer/movement.ts` (siehe Befund 2) |
| `routes/todos.ts` | 5 | `features/todos/routes.ts` |
| `structure.ts`, `time.ts`, `export.ts` | 3 | `features/{structure,timer,export}/routes.ts` |

Das sind **11** `usecases/`-Verweise, nicht zehn, und dazu **8** Verweise auf die alten
flachen Routendateien, die in der Meldung nicht enthalten waren. Insgesamt 19 an 16
Kommentarstellen.

In `apps/outlook-addin/` kamen 11 weitere dazu, die niemand gemeldet hatte:

- `scripts/proof-addin.mjs`: 6× `usecases/pool-movement.ts`, 1× `usecases/tag-names.ts`,
  1× `routes/todos.ts`
- `scripts/fixtures.mjs`: 1× `apps/local-api/src/usecases/pool-movement.ts`
- `src/duplicate/reopen.ts`: 1× `apps/local-api/src/usecases/pool-movement.ts`
- `src/duplicate/rule.ts`: 1× `usecases/pool-movement.ts`

Wichtig für die Bewertung des Umbaus: In `proof-addin.mjs` waren die **Importe** bereits
nachgezogen (`../../local-api/src/features/todos/routes.ts`,
`.../features/timer/routes.ts`, `.../features/todos/todos.ts`) — nur die Kommentare
daneben behaupteten weiter den alten Ort. Der Lauf war deshalb grün und die Prosa
trotzdem falsch. Das ist genau die Bauart, die diesem Bestand teuer geworden ist: die
gemessene Hälfte stimmt, die behauptete nicht.

## Zwei Verweise, die etwas Falsches behauptet hätten (Punkt 4 des Auftrags)

**Befund 1 — `schema.ts:418`, die „vier Türen".**
Der Satz lautet: „Die vier Türen der Hauptfläche (`routes/todos.ts`, `structure.ts`,
`time.ts`, `export.ts`) führen dafür je eine Aufstellung `REQUEST_SCHEMAS`." Die vier
Pfade habe ich nachgezogen. Die **Zahl** habe ich stehengelassen, und sie stimmt nicht
mehr: `REQUEST_SCHEMAS` steht heute an **sechs** Stellen —
`features/todos/routes.ts`, `features/structure/routes.ts`, `features/timer/routes.ts`,
`features/export/routes.ts`, **`features/settings/routes.ts`** und
**`features/data-transfer/routes.ts`**. Der Satz ist eine vollständige Aufzählung mit
Zahlwort davor; er zählt zwei zu wenig. Eine Zahl zu ändern ist keine Pfadnachziehung,
und der Auftrag sagt „sonst nichts" — deshalb gemeldet statt gefaßt. Der Grund, aus dem
der Satz überhaupt dasteht (`proof-openapi.mjs` hält jedes Rumpfschema gegen die
Beschreibung), gilt für sechs Türen genauso wie für vier.

**Befund 2 — `service.ts:225`, `movementOfStart`.**
Der Kommentar sagte: „genau der aus `movementOfStart` in `usecases/timer.ts`". Ein
mechanisches `usecases/` → `features/timer/` hätte `features/timer/timer.ts` ergeben —
eine Datei, die es **gibt**, in der `movementOfStart` aber **nicht steht**. Sie liegt
heute in `features/timer/movement.ts`; `timer.ts` ruft sie nur (`timer.ts:28`, `:167`).
Der Verweis wäre damit von „zeigt ins Leere" zu „zeigt auf die falsche Datei"
verschlechtert worden — auflösbar, prüfbar aussehend und trotzdem gelogen. Ich habe auf
`features/timer/movement.ts` gesetzt und den Symbolort vorher am Quelltext nachgeschlagen,
nicht am Verzeichnisnamen. Denselben Handgriff habe ich für jedes andere genannte Symbol
gemacht (`createTodo`, `resolveTagNames`, `AbortTodoCreate`, `poolMovementNamer`,
`bookingMovementStates`, `ResolvedPoolRule`, `createSchema`/`updateSchema`).

## Vergangenheit, die stehenbleibt

Sechs Stellen im Präteritum benennen einen früheren Ort und sind Vorgeschichte, nicht
Auskunft. Sie bleiben unverändert:

- `apps/outlook-addin/src/callnumber/labels.ts:11` — „Bis T-028 lag beides zusammen in
  `plausibility.ts`". Die Datei gibt es nicht mehr, und genau das ist die Aussage.
- `apps/outlook-addin/scripts/proof-addin.mjs:747` — „Er lag damals in `lib/labels.ts`";
  der Satz sagt selbst dazu, warum dort kein Pfad mehr steht (T-249).
- `apps/outlook-addin/scripts/proof-addin.mjs:305` — `src/lib/labels.ts` nach
  `src/features/…/labels.ts` als **Beispiel** eines Umzugs, den die Landkarte mitnimmt.
  Beide Enden sind hypothetisch; `apps/web/src/lib/labels.ts` steht im übrigen noch.
- `apps/outlook-addin/scripts/proof-addin.mjs:3080` und `:3203` — „bis T-092 `poolNamer` in
  `routes/addin/service.ts`" / „Bis T-092 stand dafür eine eigene Wache". Der genannte Pfad
  existiert ohnehin weiter; nur der jeweils zweite Halbsatz war Gegenwart und ist
  nachgezogen.
- `routes/addin/index.ts:289` und `schema.ts:311` — die gefallene Anhangsroute aus T-247,
  ausdrücklich im Präteritum („Daneben **stand** …", „die Route **ist gefallen**").

## Was ich sonst geprüft habe

Ich habe jede in Rückstrichen gesetzte Pfadangabe meiner ganzen Fläche maschinell gegen
den Arbeitsbaum aufgelöst — 119 verschiedene Angaben in `apps/outlook-addin/src`,
`/scripts`, `/test`, `README.md`, `manifest.xml`, `index.html`, `vite.config.ts` und in
`apps/local-api/src/routes/addin/`. Ohne Entsprechung bleiben nur: relative Angaben mit
`..` (existieren, mein Muster löst sie nicht auf), erfundene Beispiele im Auflöser
(`./x.ts`, `./kernel.js`), das Paketziel `@takt/ui-tokens/tokens.css` (existiert),
Microsoft-Dokumentationsverweise in `manifest.xml`, das CDN-`office.js`, ein Bauergebnis
in `dist/` und das oben genannte `plausibility.ts` im Präteritum.

Verweise nach `apps/web/**` waren in meiner Fläche nur zwei, beide auf
`apps/web/src/styles/components.css` (`src/styles/addin.css:14`, `src/ui/Primitives.tsx:5`)
— die Datei liegt unverändert dort, der Umbau hat `styles/` nicht angefaßt. Bloße
Dateinamen ohne Pfad (`TodoFormDialog.tsx`, `Tag.tsx`) habe ich stehengelassen: Sie
behaupten keinen Fundort, und die Dateien gibt es.

`apps/outlook-addin/test/**` (Hoheit unit-tester) habe ich mitgeprüft, aber nicht
angefaßt — dort steht keine veraltete Pfadangabe.

## Annahmen

1. **Schreibweise der beiden flachen Module.** `pool-movement.ts` und `tag-names.ts`
   liegen heute **nicht** unter `features/`, sondern flach in `apps/local-api/src/`. Ein
   bloßes `pool-movement.ts` wäre nicht unterscheidbar von
   `packages/domain/src/pool-movement.ts`, das in denselben Absätzen vorkommt. Deshalb:
   innerhalb von `apps/local-api` `src/pool-movement.ts` und `src/tag-names.ts`, in
   `apps/outlook-addin` der volle Pfad `apps/local-api/src/pool-movement.ts`.
2. **Zeilenumbruch.** Wo eine Angabe länger geworden ist, habe ich den Absatz neu
   umbrochen (etwa 76–80 Zeichen, wie im Umfeld). Es gibt keine Formatvorgabe im Bestand
   — weder Prettier noch ESLint —, also ist das Handarbeit und Geschmackssache.
3. Die Zahl „vier Türen" und die Zahl „drei Stellen" (`proof-addin.mjs`, Abschnitt 16)
   habe ich nicht angefaßt. Die zweite stimmt noch (Add-in-Schema, `createSchema`,
   `updateSchema`), die erste nicht — siehe Befund 1.

## Risiken

- **Keine sicherheitsrelevante Änderung.** Es ist kein Zeichen ausführbaren Codes bewegt
  worden; die drei Läufe stehen zeichengleich auf 248/0, 32/0 und 44/0, und `typecheck` ist
  leer. Der Nachweis dafür, daß nichts Ausführbares bewegt wurde, ist genau diese
  Zeichengleichheit.
- **Der Rückfall ist eingebaut, nicht behoben.** Ein ausgeschriebener Pfad in einem
  Kommentar ist nach dem nächsten Umzug wieder falsch. `proof-addin.mjs` hat dafür seit
  T-249 eine Landkarte (`FREMDE_ORTE`, Auflösung über Paket und Inhaltsmerkmal statt über
  eine Buchstabenkette) — sie deckt aber nur die Orte ab, die der Lauf **liest**, nicht
  die, die seine Prosa nennt. Die 30 nachgezogenen Angaben sind alle von der ungemessenen
  Sorte.
- Keine echte Call-Nummer, kein Kundenname, kein Zugangsdatum berührt.

## Offene Fragen

1. **Bleiben `pool-movement.ts` und `tag-names.ts` flach unter `src/`?** Der Auftrag sagt,
   der neue Ort sei `src/features/<merkmal>/`; für diese beiden stimmt das nicht. Ist das
   Absicht (sie sind merkmalsübergreifend) oder ein unfertiger Rest des Umbaus? Falls sie
   noch wandern, gehen 15 der 30 heute nachgezogenen Angaben wieder verloren — dann lieber
   in einem Zug mit dem Umzug.
2. **Wer faßt die „vier Türen" in `schema.ts:418`?** Die Zeile ist meine Datei, die
   Wahrheit dahinter (`REQUEST_SCHEMAS` in sechs Merkmalen) ist domain-dev. Ich schlage
   vor, daß ich das Zahlwort in einem Nachlauf mitnehme, sobald bestätigt ist, daß
   `settings` und `data-transfer` als „Türen der Hauptfläche" mitgezählt gehören.
3. **`CLAUDE.md` nennt weiter `apps/local-api/src/routes/addin/attachments.ts`** und
   `app.ts:279` als bestehende Fläche (Abschnitt „Ungedeckt gebaut — der offene
   Widerspruch an A-19.19"). Die Datei ist im Arbeitsbaum gelöscht, F-21 ist laut den
   Kommentaren in `index.ts:288` und `schema.ts:309` **gegen** das Anhängen entschieden
   (T-247), und der Quelltext ist mit sich im reinen. `CLAUDE.md` gehört dem Orchestrator
   — der Abschnitt beschreibt einen Zustand, den es nicht mehr gibt.

## Nächster Schritt

Diese Aufgabe braucht keinen Nachlauf. Zwei Vorschläge für die nächste Welle:

1. Ein kleiner Auftrag, der die „vier Türen" in `schema.ts:418` auf sechs setzt —
   zusammen mit der Antwort auf offene Frage 1, damit nicht zweimal an denselben Zeilen
   gearbeitet wird.
2. Der wiederkehrende Teil des Problems: ein Wächter, der **jede** in Rückstrichen
   gesetzte Pfadangabe in `routes/addin/**` und `apps/outlook-addin/**` gegen den
   Arbeitsbaum auflöst und rot wird, wenn eine ins Leere zeigt — mit einer Ausnahmeliste
   für die oben benannten Präteritum-Sätze. Das Skript dafür habe ich für diesen Auftrag
   geschrieben und wieder weggeworfen; als Prüfsatz in `proof:addin` wären es ungefähr
   dreißig Zeilen, und diese Aufgabe wäre zum letzten Mal nötig gewesen. Ob das
   Abschnitt 21 des Add-in-Laufs wird oder ein eigener Lauf, entscheidet der Orchestrator
   — es bewegt die Zahl 248, und das darf nicht nebenbei geschehen.
