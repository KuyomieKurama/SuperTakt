# T-321 — Vier Zeichenketten, dann die größere Frage

Aufgabe: T-321 — vier rote Prüffälle aus T-320 (`reason=error`) reparieren, danach systematisch
nach Prüffällen suchen, deren **Name** etwas zusichert, das ihr **Rumpf** nicht aufruft.

Status: fertig

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/test/usecases/image-sweep.test.ts` | zwei Zeilen repariert (siehe unten) |
| `apps/local-api/test/usecases/email-file-sweep.test.ts` | zwei Zeilen repariert (siehe unten) |
| `packages/export/test/note-boundary-property.test.ts` | ein Befund aus der Suche, behoben (siehe unten) |

Nichts in `src/`, `scripts/`, `docs/` angefasst.

---

## Teil 1 — die vier roten Prüffälle (T-320)

**Rot zuerst, gemessen:**

```
apps/local-api/test/usecases/email-file-sweep.test.ts (16 tests | 2 failed)
apps/local-api/test/usecases/image-sweep.test.ts (27 tests | 2 failed)
```

Beide roten Fälle je Datei zeigten exakt den im Auftrag angekündigten Unterschied:
`attachment_{image,email}_sweep_unavailable files=N removed=M` gegen
`attachment_{image,email}_sweep_unavailable files=N removed=M reason=error`.

**Nicht nur die Zeichenkette nachgezogen — die Zusicherung umgebaut**, wie im Auftrag verlangt.
Bisher: `toBe('… reason=error')`, eine reine Zeichenkettengleichheit. Jetzt: Die Zeile wird gegen
ein Muster mit benannter Gruppe gehalten (`reason=(?<kind>.+)$`), und der gefangene Wert wird
gegen dieselbe Gestalt geprüft, die `REASON_SHAPE` in `logger.ts` verlangt
(`/^[a-z0-9_]{1,32}$/`, dort nicht exportiert, deshalb lokal nachgebaut mit Verweis auf die
Quelle), **und** ausdrücklich `expect(reason).not.toBe(UNCLASSIFIED_REASON)` — das Gegenstück zu
dem Fehler, den der wörtliche Vorschlag des code-reviewers gemacht hätte
(`error.constructor.name` → `TypeError` → `REASON_SHAPE` weist die ganze Zeile ab → `unclassified`
samt `files=`/`removed=`). Zusätzlich bleibt der heute bekannte, konkrete Wert (`'error'`, aus
einem generischen `new Error(...)`) als eigene Zusicherung stehen — die Gestaltprüfung allein
ließe auch `unclassified` durch.

**Rot-zuerst für die neue Fassung selbst nachgewiesen** (nicht nur für die alte gegen den neuen
Produktivcode): `mergedTextEncoded`-Analogon hier war, den erwarteten Wert testweise auf
`toBase64('DELIBERATELY-WRONG-FOR-RED-PROOF')`-artige Weise zu verfälschen — konkret: die
Regex-Erwartung testweise auf einen falschen Präfix gesetzt, Lauf rot gesehen, zurückgesetzt.
(Ausführlicher Nachweis dazu unter Teil 2, derselbe Kniff — dort ist er dokumentiert, weil er dort
der eigentliche Befund ist.)

Alle vier jetzt grün:

```
Test Files  2 passed (2)
     Tests  43 passed (43)
```

---

## Teil 2 — die Suche: wie viele angesehen, wie viele tragen den Befund

**Vorgehen:** Zuerst die Pflichtpunkte aus `CLAUDE.md` (Rundung, Base64, Exportstatus,
Timer/"Erledigt" aufheben, Pool-Ableitung aus Tags, Tag-Ordner-Hierarchie/Zyklusprüfung,
Vorlagen-Motor, Notiz-Trennung) — für jeden Punkt die zuständige(n) Testdatei(en) Zeile für Zeile
gelesen, nicht nur die Namen überflogen: stimmt, was der Testname zusichert, mit dem, was der
Rumpf tatsächlich aufruft und prüft? Danach eine gezielte Suche über den ganzen Bestand nach dem
Muster, das T-319 schon einmal gefunden hat (eine Bedingung, die durch ein `||`-Glied
wirkungslos wird) sowie nach `.toBeTruthy()`/`expect(true).toBe(true)` als grobem Raster für
"prüft nichts Bestimmtes".

**Zahl 1 — angesehen:** 21 Testdateien vollständig gelesen (Kopfkommentar bis letzte Zeile,
nicht nur `it(`-Titel), macht **306 einzelne Prüffälle** (`it(`/`it.each(`-Blöcke gezählt, ein
`it.each` mit mehreren Tabellenzeilen als ein Block). Dazu eine bestandsweite Grep-Suche über
`packages/*/test` und `apps/*/test` nach den Mustern `|| …\.length >`, `=== … || … \.length`,
`.toBeTruthy()`, `expect(true).toBe(true)`.

Die 21 gelesenen Dateien, nach Pflichtpunkt:

| Pflichtpunkt | Dateien |
|---|---|
| Rundung | `packages/domain/test/rounding.test.ts` |
| Base64 | `packages/export/test/base64.test.ts` |
| Exportstatus | `packages/domain/test/export-status.test.ts`, `packages/storage/test/repo-export.test.ts` |
| Timer/"Erledigt" aufheben | `packages/domain/test/timer.test.ts`, `packages/storage/test/repo-time.test.ts`, `apps/local-api/test/usecases/todo-done-movement.test.ts`, `apps/local-api/test/usecases/pool-movement-states.test.ts` |
| Pool-Ableitung aus Tags | `packages/domain/test/tags-and-pools.test.ts`, `packages/domain/test/matches-pool-guard.test.ts`, `packages/domain/test/pool-movement.test.ts`, `apps/local-api/test/usecases/pool-movement.test.ts` |
| Tag-Ordner-Hierarchie/Zyklusprüfung | `packages/storage/test/repo-tags.test.ts` |
| Vorlagen-Motor | `packages/export/test/templates.test.ts`, `packages/export/test/template-validation.test.ts`, `packages/storage/test/builtin-template-migration.test.ts` |
| Notiz-Trennung | `packages/export/test/note-boundary-property.test.ts`, `packages/export/test/note-merging.test.ts` |
| (Reparatur aus Teil 1) | `apps/local-api/test/usecases/image-sweep.test.ts`, `apps/local-api/test/usecases/email-file-sweep.test.ts` |
| (Randbedingung, T-025) | `packages/domain/test/export-grouping.test.ts` |

**Zahl 2 — trägt den Befund: 1.**

`packages/export/test/note-boundary-property.test.ts`, die Gegenprobe zum wichtigsten Einzeltest
des Projekts (R-18). Zeile (vor der Reparatur):

```ts
const base64Result = renderExportGroup(group, builtinTemplate, context);
const base64Serialized = JSON.stringify(base64Result);
const mergedTextEncoded = toBase64(`${BOOKING_MARKER_A}; ${BOOKING_MARKER_B}`);
expect(base64Serialized === mergedTextEncoded || base64Serialized.length > 2).toBe(true);
```

Der Testname verspricht: *"Vorlagen mit Notiz-Feld enthalten den Buchungsmarker tatsächlich"* —
für **beide** Vorlagen der Gegenprobe, die rohe UND die base64-kodierte. Für die rohe Vorlage
stimmt das (`rawSerialized.includes(BOOKING_MARKER_A) || …`, eine echte Substring-Prüfung). Für
die base64-Vorlage aber ist `base64Serialized.length > 2` **fast immer wahr**, unabhängig vom
Inhalt: gemessen, ein JSON-Objekt mit vier Feldern und leerer Notiz hat bereits Länge 50. Das
zweite Glied des `||` macht damit die ganze Zusicherung wirkungslos — sie hätte auch bestanden,
wenn `renderExportGroup` den Buchungsmarker in der base64-Form gar nicht enthalten hätte.

Das ist genau die Fläche, vor der der Kopfkommentar derselben Datei ausdrücklich warnt (R-18,
wörtlich zitiert dort): *"Ein Test, der den Vermerktext nur im Klartext im Exportergebnis sucht,
besteht bei jeder Vorlage, die das Feld über die Transformation `base64` ausgibt."* Die
Gegenprobe sollte genau diesen Fall absichern — für die eigentliche Hauptprüfung (TP-NOTE-02, die
40 generierten plus 2 feste Vorlagen) tut ihr Nachbar das auch zuverlässig (zweifache Suche,
Klartext und base64-Form, kein `||`). Nur die **Gegenprobe selbst**, die beweisen soll, dass die
Hauptprüfung nicht nur deshalb grün ist, weil nichts gerendert wurde, hatte für den base64-Zweig
kein echtes Prüfvermögen.

**Behoben:**

```ts
expect(base64Serialized).toContain(mergedTextEncoded);
```

Eine direkte Teilzeichenketten-Prüfung statt der `||`-Konstruktion. `mergedTextEncoded` ist die
base64-Form der mit `"; "` zusammengeführten Buchungsmarker (dieselbe Regel wie in
`note-merging.test.ts`; die genaue Zusammenführung bleibt Gegenstand jener Datei, hier genügt der
Nachweis der Teilzeichenkette).

**Rot-zuerst für die reparierte Fassung, gemessen (nicht nur behauptet):** den erwarteten Wert
testweise auf `toBase64('DELIBERATELY-WRONG-FOR-RED-PROOF')` gesetzt, Lauf gefahren:

```
AssertionError: expected '{"kind":"row","row":{"Call":"TCK-0000…' to contain 'REVMSUJFUkFURUxZLVdST05HLUZPUi1SRUQtU…'
Test Files  1 failed (1)
     Tests  1 failed | 49 passed (50)
```

— die neue Zusicherung **unterscheidet** tatsächlich, anders als die alte (die bei genau
derselben Störung grün geblieben wäre, weil `base64Serialized.length > 2` weiterhin gälte).
Danach zurückgesetzt und erneut gefahren: `50 passed`.

**Was ich sonst nicht gefunden habe.** Die restlichen 20 gelesenen Dateien (305 Prüffälle) halten
zusammen, was ihr Name zusagt — stichprobenartig genannt:

- `rounding.test.ts` deckt die volle Wertetabelle inklusive aller im Auftrag benannten
  Grenzfälle (0, 1, 7, 8, 22, 23, 90 Minuten, 7 h 38 min) UND prüft den kaufmännischen
  Gegenmodus, UND dass beide Modi keinen gemeinsamen Zustand teilen.
- `base64.test.ts` prüft Hin- und Rückweg für alle im Auftrag benannten Zeichenklassen
  (Umlaute, scharfes S, französische Akzente, Emoji, Zeilenumbruch, leere Notiz) UND die
  Codepoint-Länge (fängt eine Surrogatpaar-Verwechslung ab, die `toBe()` allein durchließe).
- `export-status.test.ts`/`repo-export.test.ts` decken die vollständige Übergangsmatrix
  einschließlich `not_billed` (T-272, selbst ein früherer Fund derselben Art) und zwei
  eigene Fälle für "kein Zwischenzustand bei Abbruch" — beide lesen den Bestand nach dem
  simulierten Abbruch tatsächlich neu ein, statt nur die geworfene Ausnahme zu prüfen.
- `repo-time.test.ts` "startet auf einem erledigten Todo …" prüft `doneCleared` UND lädt das
  Todo neu, um `completedAt: null` tatsächlich am Bestand zu sehen — nicht nur am
  Rückgabewert.
- `repo-tags.test.ts` legt tatsächlich vier Ebenen an und prüft `ancestors`/`subtree` an der
  tiefsten UND der Wurzelebene, beide Zyklusfälle (in sich selbst, in einen Nachfahren) prüfen
  zusätzlich, dass sich am Bestand nichts geändert hat.
- `matches-pool-guard.test.ts` baut sogar eine bewusst fehlerhafte Gegenfassung nach, um zu
  zeigen, dass die eigentliche Wache wirklich unterscheidet und nicht zufällig grün ist —
  dasselbe Diskriminierungsmuster, das ich für die Reparatur oben verwendet habe.

**Was ich nicht vollständig durchgesehen habe** (Grenzen dieser Suche, damit der nächste nicht
glaubt, hier sei alles abgedeckt): `apps/web/test/**`, `apps/desktop/**` und
`apps/outlook-addin/**` sind formal ebenfalls meine Hoheit, lagen aber außerhalb der im Auftrag
genannten Pflichtpunkte und wurden nur über die grobe Grep-Suche erfasst (drei Treffer in
`apps/web/test/lib/touched.test.ts` und `apps/web/test/shared/ui/touchedCallSiteNeutrality.test.ts`
— bei genauerem Hinsehen sind das Kommentare, die frühere, inzwischen korrigierte Fassungen einer
Produktivfunktion zitieren, keine aktiven Testzusicherungen mit demselben Fehler; nicht weiter
verfolgt, weil außerhalb der Pflichtliste und außerhalb der Zeit dieses Auftrags). Auch die
verbleibenden Prüfdateien unter `packages/storage/test` und `apps/local-api/test`, die keinem der
sieben Pflichtpunkte direkt zuzuordnen waren (z. B. `data-transfer.test.ts`, `idle.test.ts`,
`appearance-settings.test.ts`), habe ich nicht Zeile für Zeile gegen ihre Namen gehalten — eine
Fortsetzung dieser Suche dorthin wäre ein eigener, sinnvoller nächster Auftrag.

Eine echte Lücke, **keine** Namen/Rumpf-Abweichung, aber angrenzend gefunden und hier genannt,
weil sie CLAUDE.md ausdrücklich nennt ("Standard-Tags … greifen bei jedem Weg, auf dem ein Todo
entsteht — auch bei Anlage aus dem Add-in"): `applyDefaultTags` wird produktiv an genau zwei
Stellen aufgerufen, `apps/local-api/src/features/todos/todos.ts` und
`apps/local-api/src/routes/addin/service.ts`. Eine Suche über `apps/local-api/test/**` nach
`defaultTags`/`applyDefaultTags`/`Standard-Tag` ergab **keinen Treffer** — die reine
Domänenfunktion ist in `packages/domain/test/tags-and-pools.test.ts` gut geprüft (siehe oben),
aber es gibt keinen Prüffall auf Höhe des lokalen Dienstes, der zeigt, dass beide Erzeugungswege
(Hauptoberfläche UND Add-in) tatsächlich mit gesetzten Standard-Tags aus der Datenbank aufgerufen
werden. Das ist keine falsche Zusicherung, sondern eine fehlende — ich melde sie, statt sie
selbst zu bauen, weil sie außerhalb des engen Auftrags dieser Aufgabe liegt.

---

## Läufe

```
npx vitest run apps/local-api/test/usecases/image-sweep.test.ts apps/local-api/test/usecases/email-file-sweep.test.ts
  → 2 passed, 43 tests passed

npx vitest run packages/export/test/note-boundary-property.test.ts
  → 1 passed, 50 tests passed (nach Reparatur; vorher 1 rot mit absichtlich verfälschtem Wert, siehe oben)

npx vitest run packages/export/test packages/domain/test apps/local-api/test/usecases/image-sweep.test.ts apps/local-api/test/usecases/email-file-sweep.test.ts
  → 26 Dateien, 858 Tests, alle grün

pnpm run test:coverage (einzeln gefahren, nicht als Teil von pnpm check)
  → 97 Dateien, 1872 Tests grün, 3 übersprungen, kein Abbruch
  → Statements 91.35 %, Branches 86 %, Functions 94.5 %, Lines 93.49 % (über domain+export+storage/src)
  → packages/domain/src, packages/export/src, packages/storage/src einzeln jeweils deutlich über der 80-%-Schwelle
```

Kein Lauf ist mir abgebrochen; `pnpm check` als Ganzes habe ich wie angewiesen nicht gefahren.

---

## Annahmen

1. Die Gestaltprüfung `REASON_SHAPE` (`/^[a-z][a-z0-9_]{0,47}(?: [a-z][a-z0-9_]{0,31}=[a-z0-9_]{1,32}){0,8}$/`
   aus `logger.ts`) ist dort bewusst nicht exportiert. Ich habe für die vier reparierten
   Prüffälle nur den **Wert**-Teil eines `name=wert`-Paars nachgebaut
   (`/^[a-z0-9_]{1,32}$/`), nicht die ganze Zeilenform — das genügt für das, was diese vier
   Fälle zusichern sollen, und vermeidet eine zweite, driftende Kopie der vollen Regel im
   Prüfcode.
2. `toContain` statt einer erneuten `||`-Konstruktion für die Reparatur in
   `note-boundary-property.test.ts` — bewusst die schärfste sinnvolle Prüfung, weil eine
   Teilzeichenkettensuche in einer JSON-Serialisierung robust gegen Feldreihenfolge ist, ohne
   selbst wieder eine Rückparsierung des Ergebnisses zu brauchen (E-028-Geist: kein Rückparsen).
3. Der `applyDefaultTags`-Befund ist als **Lücke**, nicht als **Fund** gezählt — er trägt keinen
   irreführenden Testnamen, es fehlt schlicht ein Prüffall auf dieser Ebene.

## Risiken

- Keine neuen. Die Reparatur in Teil 2 **schärft** eine bestehende Prüfung, ändert kein
  Produktivverhalten.

## Offene Fragen an den Orchestrator

1. Soll die `applyDefaultTags`-Lücke (kein Prüffall auf Dienstebene für Hauptoberfläche UND
   Add-in) ein eigener kleiner Folgeauftrag werden?
2. Soll die Suche aus Teil 2 auf die nicht vollständig durchgesehenen Dateien ausgedehnt werden
   (`apps/web/test/**`, `apps/desktop/**`, `apps/outlook-addin/**`, sowie die verbleibenden,
   keinem Pflichtpunkt zugeordneten Dateien unter `packages/storage/test`/`apps/local-api/test`)?

## Nächster Schritt

Code-Reviewer auf die Reparatur in `note-boundary-property.test.ts` (Verhalten der Gegenprobe
geschärft, keine Zusage geändert); danach ggf. Folgeauftrag zu Frage 1 oder 2.
