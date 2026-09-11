# T-251-2 — `proof-callers.mjs:726` kennt die alte Struktur

Aufgabe: T-251-2 — die fest verdrahtete Typstichprobe berichtigen und nach Geschwistern suchen
Status: fertig

## Artefakte

- `apps/local-api/scripts/proof-callers.mjs` — `TYPES_PATH` optional, Typaufstellung an der
  Anforderung aufgespannt, Stichprobe durch zwei gemessene Prüfsätze und eine Gegenprobe ersetzt
- `apps/local-api/scripts/caller-scan.mjs` — `keysOf` meldet zusätzlich `types`: die Einträge der
  Aufstellung, über die ein Aufruf beim Auflösen gegangen ist; Kopfabsätze ohne die alte Struktur
- `apps/local-api/scripts/request-scan.mjs` — ein Satz, der noch „**eine** Datei" behauptete

## Zusammenfassung

Die rote Zeile war nicht falsch gemessen, sondern falsch aufgespannt: `typeIndex` kam aus
`api/types.ts` allein, während der Leser längst über `types.ts` **und** die Typen jeder
Aufrufdatei verfügt; `TodoCreate` steht seit Welle 2 in `features/todos/api.ts`. An ihre Stelle
treten drei Sätze ohne einen einzigen festen Namen: die Aufstellung wird über dieselben Quellen
aufgespannt wie beim Leser und nennt sie im Prüfsatznamen; sie muss **benutzt** sein (gezählt
werden die Einträge, über die der Leser beim Auflösen der Rümpfe tatsächlich gegangen ist —
heute sechs, darunter `TodoCreate` aus dem Merkmalsordner und `PoolWrite` aus der Sammelstelle);
und eine Gegenprobe fährt denselben Leser mit leerer Aufstellung und verlangt, dass er auf null
fällt. Damit steht die Stichprobe im Bestand und nicht mehr im Wächter.

Im selben Zug ist `TYPES_PATH` von `paketQuelle` auf `optionaleQuelle` umgestellt. `api/types.ts`
steht auf demselben Zettel wie `api/endpoints.ts` — sie wird auf die Merkmalsordner verteilt und
fällt weg; der Lauf wäre in dieser Welle mit „Quelldatei nicht auflösbar" gestorben, und das wäre
ein Befund über den Lauf gewesen und keiner über den Bestand.

## Läufe

| Lauf | vorher | nachher |
|---|---|---|
| `proof:callers` | 58 bestanden, 1 fehlgeschlagen | **61 bestanden, 0 fehlgeschlagen** |
| `proof:all` (13:05, vor Welle 3) | — | 19 Läufe, letzter `proof:addin` 248/0, **Code 0** |
| `proof:all` (13:2x, während Welle 3) | — | 9 Läufe grün, dann `@takt/web proof:foreign` **19/2** |
| `pnpm typecheck` | — | alle Pakete „Done" **außer `@takt/web`** |

Der rote `proof:foreign` und der rote Typecheck haben **dieselbe** Ursache und sie liegt nicht
hier: `apps/web` steht mitten in Welle 3. `src/features/timer/*` liegt schon da und zeigt auf
`./parts`, `./BookingDialogs`, `../api/client`, `../../app/TimerContext` — Module, die noch nicht
umgezogen sind (40 × TS2307). `apps/web/**` gehört frontend-dev; ich habe dort nichts angefasst.

Der Zwischenstand ist zugleich der beste verfügbare Beweis für die Berichtigung: Zwischen den
beiden `proof:all`-Läufen sind `features/bookings/api.ts` und `features/timer/api.ts` dazugekommen.
`proof:callers` hat sie **von selbst** aufgenommen (3 → 5 Aufrufdateien, 75 → 89 Aufrufe, 89 → 92
Typen aus 4 → 6 Quellen) und blieb bei 61/0. Vor der Berichtigung wäre der Lauf zweimal rot gewesen.

## Gegenproben, die ich gefahren habe

1. **Die Aufstellung fällt weg.** Eine Kopie des Laufs mit unauflösbarem Merkmal für `types.ts`:
   Der Lauf stirbt nicht, sondern meldet 57/4 mit den richtigen Sätzen — „14 Typen aus 3", dazu
   die unauflösbaren Rümpfe in Abschnitt 5. Genau so soll die letzte Welle aussehen, falls sie
   die Typen nicht mitnimmt.
2. **Die Aufstellung ist der Grund der Auflösung.** Derselbe Leser über denselben Text mit leerer
   Aufstellung: null benutzte Typen. Steht als Prüfsatz im Lauf, nicht nur in diesem Bericht.
3. **Die Untergrenze ist gegen den Endstand gesetzt.** `> 30` war die halbe alte `types.ts`.
   Diese Zahl *soll* fallen. Jetzt `>= 10`, begründet gegen acht Merkmalsordner mit je ihren
   Anfragetypen; das Gewicht trägt der Prüfsatz „und sie wird auch benutzt".

## Die vollständige Liste der Geschwister

Methode, damit „vollständig" eine Messung ist und keine Behauptung: (a) jede Auflösung des
Pakets `@takt/web` in `apps/local-api/scripts/**`, (b) jedes pfadförmige Zeichenkettenliteral
außerhalb von Kommentaren, (c) jedes `has('Name')`/`includes('Name')` mit großem Anfangsbuchstaben,
(d) jede Untergrenze (`mindestens:`, `>= NN`). Nur **zwei** Läufe fassen `@takt/web` überhaupt an.

### Behoben

| Ort | Annahme | Was jetzt |
|---|---|---|
| `proof-callers.mjs` Abschnitt 0 | `typeIndex.has('TodoCreate')`, `has('PoolWrite')`, `size > 30` — Stichprobe aus `api/types.ts` | Aufstellung über dieselbe Menge wie der Leser, benutzte Einträge gezählt, Gegenprobe, Untergrenze gegen den Endstand |
| `proof-callers.mjs` `TYPES_PATH` | `paketQuelle` — die Datei **muss** da sein | `optionaleQuelle`; das Ausbleiben wird hingeschrieben, die Menge hat eine Untergrenze |
| `caller-scan.mjs` Kopf + `buildTypeIndex` | „liest `apps/web/src/api/endpoints.ts`", „baut aus `apps/web/src/api/types.ts`" | „die Aufrufdateien", „aus einem Quelltext" |
| `request-scan.mjs` Kopf | „liest **eine** Datei — `endpoints.ts`" | „die Aufrufdateien … seit F-22 eine gemessene Menge" |

### Nicht betroffen — geprüft, nicht angenommen

- `LEGACY_CALLER_PATH`, `WEB_CLIENT_PATH`, `ADDIN_CALLER_PATH`, `SPEC_PATH`: über **Merkmal**
  aufgelöst, der Pfad ist nur Abkürzung. Ein Umzug nimmt sie mit.
- `WEB_FEATURES_DIR` / `FEATURE_API_NAME` (`^features/[^/]+/api\.ts$`): das ist die **Zielstruktur**
  aus F-22 selbst, und sie wird auf zwei Wegen gemessen (Platte gegen Ernte). Ein Merkmalsordner
  mit zweiter Ebene (`features/todos/attachments/api.ts`) fiele heraus — und zwar **laut**: das
  `request` dort wäre ein Fund in Abschnitt 1, kein stilles Grün. Richtige Richtung.
- `INJECTED = 'ui/Eingesetzt.tsx'`: Kunstdatei, liegt nirgends; `ui/` gibt es in `apps/web/src`
  heute gar nicht — der Beweis, dass der Name nichts voraussetzt.
- `REGRESSIONS` in Abschnitt 6 (`body: { newParentId }`, `"/tag-tree"`, `includeCompleted: "true"`):
  Inhalt statt Struktur, und die Trägerdatei wird seit T-250-2 gesucht. Die Todo-Stellen haben
  Welle 2 bereits mitgemacht und sind grün geblieben.
- Zählungen `calls >= 45` (heute 89), `withBody >= 25 && withQuery >= 5`, `proveHarvest >= 100`:
  Größe des Baums, nicht seine Aufteilung.
- `proof-release-safety.mjs` `SOURCE_ROOTS`, `EXTRA_FILES`, `COUNTER_PROOFS[*].path`: Paketnamen
  und Kunstpfade.
- Alle übrigen 21 Skripte unter `apps/local-api/scripts/**` lösen `@takt/web` **überhaupt nicht**
  auf. `proof-codepoints.mjs` geht über `git ls-files` an der Arbeitsbereichswurzel und ist damit
  strukturunabhängig.

### Bewusst gelassen — mit Grund

1. **`proof-release-safety.mjs:302`, `RELEASE_PREFIX_FILES` enthält `apps/web/src/lib/releasePage.ts`.**
   Der einzige verbliebene feste Pfad nach `apps/web/src`. Er bleibt fest, und zwar absichtlich:
   Die Zusage lautet „die Adresse der Release-Seite darf an genau diesen zwei Orten stehen"
   (A-V-18). Löste man den Ort über ein Merkmal auf, wäre das Merkmal die Adresse selbst und die
   Zusage eine Tautologie. Zieht die Datei um, wird der Lauf rot — und mit der **richtigen**
   Begründung, weil T-249-1 dort schon den Prüfsatz „die zwei erlaubten Orte liegen im gelesenen
   Baum" eingezogen hat. Ein Umzug dieser Datei gehört gesehen, nicht automatisch mitgemacht.
   `lib/` steht in keiner der sechs verbleibenden Wellen.
2. **`proof-callers.mjs:1573`, `ADDIN_CALLER.typeIndex.has('CreateTodoRequest') && has('BookRequest')`.**
   Gleiche Bauart wie die berichtigte Zeile, anderer Baum: `apps/outlook-addin` wird nicht
   umgebaut, und dort steht die Typaufstellung ohnehin in derselben Datei wie der Aufruf. Wird
   der Aufgabenbereich je nach Merkmalen geschnitten, ist das die Zeile, die zuerst rot wird —
   die Behebung liegt dann in `keysOf(...).types` schon bereit.
3. **Prosa in `NOT_CALLED_BY_UI`, die `BoardScreen.tsx` nennt.** Der Eintrag selbst hängt an der
   `operationId` `getBoard` und nicht an der Datei; nur der begründende Absatz nennt sie.
   `screens/` fällt in der Board-Welle — siehe „Offene Fragen".

## Annahmen

- Der **Leser** bekommt die vereinigte Aufstellung ausdrücklich **nicht**. Er löst weiter je Datei
  auf (`types.ts` plus die eigene Datei). Ein gemeinsamer Topf würde einen Typ auflösen, den nur
  ein fremder Merkmalsordner deklariert — eine stillschweigende Lockerung des Lesers unter dem
  Vorwand einer Messung. Die Vereinigung dient allein dem Urteil in Abschnitt 0.
- Untergrenze „benutzte Einträge" auf **3** bei heute 6 (rund die Hälfte, wie bei `proveHarvest`).
  Die meisten Rümpfe sind Objektliterale; über die Aufstellung geht nur, wer einen getippten
  Parameter weiterreicht. Die Zahl soll rot werden, wenn die Auflösung **aufhört**, nicht wenn
  ein Aufruf sein Literal ausschreibt.
- `types` in der Rückgabe von `keysOf` ist additiv; kein Test und kein anderer Lauf liest die
  Gestalt dieser Rückgabe (gemessen: keine Fundstelle für `caller-scan`/`scanCallers` außerhalb
  der beiden Dateien).

## Risiken

- **R-a (klein, gemessen).** `quellbaum('@takt/web','src',{ mindestens: 100 })` steht heute bei
  140. Wenn die Wellen Dateien nicht nur verschieben, sondern **zusammenlegen** (`parts.tsx` für
  mehrere Bauteile), schrumpft die Zahl. Spielraum: 40 Dateien. `proof-release-safety` hat für
  denselben Baum 60 und mehr Luft. Kein Handlungsbedarf jetzt, aber die Zahl gehört bei der
  letzten Welle nachgesehen.
- **R-b.** `proof:all` ist derzeit rot an `@takt/web proof:foreign`, und `pnpm typecheck` an
  `@takt/web`. Ursache ist der halb gelandete Umbau nebenan, nicht dieser Auftrag. Solange das so
  steht, kann das Qualitätstor keine Aussage über den Gesamtstand machen.
- Sicherheitsseitig ändert sich nichts: Abschnitt 1 (kein zweiter Weg zum Dienst) ist unberührt,
  seine sechs `fetch`- und sechs `request`-Gegenproben laufen unverändert grün.

## Offene Fragen

1. **An frontend-dev / Orchestrator, Board-Welle:** Sobald die Oberfläche `GET /board` anruft,
   gehört `getBoard` aus `NOT_CALLED_BY_UI` (`proof-callers.mjs`) **entfernt**. Der Lauf wird
   davon nicht rot — die Zeile sagt dann nur etwas Falsches. Dasselbe gilt für `getVersionCheck`.
   Ich fasse die Zeile nicht an, solange die Oberfläche die Route nicht anruft; bitte in den
   Auftrag der Board-Welle aufnehmen.
2. **An frontend-dev, letzte Welle:** Wenn `api/types.ts` aufgelöst wird — wohin gehen die Typen,
   die **keine** Anfragetypen sind (`Todo`, `Tag`, `TimeEntry`)? Landen sie in einer
   `features/*/types.ts` statt in `api.ts`, sieht dieser Lauf sie nicht mehr, und die Aufstellung
   schrumpft auf die Anfragetypen. Das ist verkraftbar (Untergrenze 10, Gegenprobe über die
   benutzten Einträge), aber es wäre gut, es vorher zu wissen statt hinterher zu messen.
3. **An frontend-dev:** Zieht `apps/web/src/lib/releasePage.ts` um, ist
   `proof-release-safety.mjs:302` eine Einzeilenänderung in meiner Hoheit. Bitte melden statt
   selbst eintragen.

## Nächster Schritt

`proof:callers` ist grün und wellenfest; die nächste Welle (`board` oder `export`) kann ohne
Nacharbeit an diesem Lauf starten. Der Gesamtdurchlauf `pnpm check` sollte erst wieder gemessen
werden, wenn `apps/web` typecheckt — vorher misst er den Umbau, nicht den Bestand.
