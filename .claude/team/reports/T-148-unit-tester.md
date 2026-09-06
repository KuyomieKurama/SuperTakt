# T-148 — Prüffälle für Frist, Anhänge und den Anhang-Bestand

**Rolle:** unit-tester **Datum:** 2026-09-05

---

## Status

**fertig**

---

## Roter Beweis vor grün

Vor dieser Aufgabe existierte keine der drei Prüfdateien:

```
$ grep -rn "due-date\|attachment" packages/domain/test/     -> kein Treffer
$ grep -rln "attachments" packages/storage/test/*.ts        -> kein Treffer außer ports.ts-Typen
```

Gemessener Ausgangszustand (`pnpm test:coverage`, vor jeder Änderung, Bericht des Orchestrators
bestätigt):

| Datei | Anweisungen | Zweige | Funktionen | Zeilen |
|---|---|---|---|---|
| `packages/domain/src/attachment.ts` | 10,37 % | 0 % | 0 % | 13,92 % |
| `packages/domain/src/due-date.ts` | 12 % | 0 % | 0 % | 15,78 % |
| `packages/storage/src/sqlite/repo-attachments.ts` | 6,38 % | 0 % | 9,09 % | 7,69 % |

Paketschwellen vor der Änderung (`pnpm test:coverage`, Exitcode 1):

```
ERROR: Coverage for lines (72.82%) does not meet "packages/domain/src/**" threshold (80%)
ERROR: Coverage for functions (75%) does not meet "packages/domain/src/**" threshold (80%)
ERROR: Coverage for statements (69.98%) does not meet "packages/domain/src/**" threshold (80%)
ERROR: Coverage for branches (62.14%) does not meet "packages/domain/src/**" threshold (80%)
ERROR: Coverage for branches (78.49%) does not meet "packages/storage/src/**" threshold (80%)
```

`pnpm test` lief zu diesem Zeitpunkt bereits grün (1171/1171) — die drei neuen Dateien hatten
schlicht keinen Prüffall, nicht einen fehlschlagenden. Jede der drei neuen Testdateien wurde
deshalb zunächst gegen den unveränderten Produktivstand geschrieben und einzeln lauffähig
gemacht (`npx vitest run packages/domain/test/due-date.test.ts` usw.), bevor der volle Lauf
gefahren wurde — das ist der rote Anfang dieser Aufgabe: eine Datei ohne jeden Test ist rot in
jeder Zeile ihrer Abdeckung, nicht nur im Ergebnis eines fehlschlagenden `it`.

---

## Artefakte

### Neu

| Datei | Prüffälle | Was |
|---|---|---|
| `packages/domain/test/due-date.test.ts` | 61 | Form (`isCalendarDay`), Jahresbandbreite, Existenztest (30. Februar, Schaltjahr 2024/2023), die vier Zustände, die Tagesgrenze **gemessen mit `toCalendarDay` aus `kernel.ts`** (demselben Tagesbegriff wie der Export, E-025) kurz vor/nach Mitternacht in Europe/Berlin, die Eigenschaft `matchesDueComparison(d, dueComparison(s, heute)) === (dueState(d, heute) === s)` über alle vier Zustände, und `compareByDueDate` inklusive der sortierten Liste, die zeigt, dass ein Todo ohne Frist in **beiden** Richtungen ans Ende rückt, ohne Platzhalterdatum. |
| `packages/domain/test/attachment.test.ts` | 105 | Drei Arten, `normalizeAttachmentLink` (Normalform, Groß-/Kleinschreibung, UNC als `link_unparsable`, Zugangsdaten, Längen vor **und** nach dem Zerlegen, Steuer-/Richtungszeichen inkl. RLO, die beiden Nullbreiten, Idempotenz, ein Emoji als vierbytiger Codepunkt), `isNormalizedAttachmentLink`, `checkAttachmentPath` (leer, zu lang, Steuerzeichen, UNC in vier Schreibweisen inkl. `\\?\` und `\\.\`, nicht absolut, die fünf Umleitungsendungen, `.exe`/`.bat`/`.ps1` ausdrücklich **nicht** abgewiesen), `isUncPath`, `isAbsoluteAttachmentPath`, `fileExtensionOf`, `imageMediaTypeOf` (alle vier Kopfsignaturen, RIFF ohne WEBP, MZ, leerer und zu kurzer Puffer, SVG), `attachmentLabel` (alle Rückfälle je Art). Die Bildgrenze ist gegen ihre **Herkunft** geprüft (`8 * 1024 * 1024`, nicht die abgeschriebene Ziffernfolge `8388608`), nicht gegen ihren Wert — der Anspruch aus T-134. |
| `packages/storage/test/repo-attachments.test.ts` | 22 | Anlegen (Position je Todo unabhängig ab 0, UTF-8/Emoji im Titel), `list`/`load`/`listMany` (auch für Todos ohne Anhänge, leere Kennungsliste), `remove` (gibt den gelöschten Datensatz zurück, `not_found`), `imageTargets` (nur die Bildziele), der Fremdschlüssel-Fehlschlag bei nicht existierendem Todo, `ON DELETE CASCADE` beim Löschen des Todos, die Blockade durch eine bestehende Zeitbuchung, und eine der Domäne unbekannte Art wird beim Lesen übergangen statt geworfen — die Zeile bleibt dabei physisch im Bestand. |

### Geändert (Kommentar, keine Prüflogik)

| Datei | Was |
|---|---|
| `packages/storage/test/migration-failure-reason.test.ts` | Kopfkommentar: Übernahme durch unit-tester (T-132) ist mit T-148 förmlich vollzogen. Kein Testfall geändert. |
| `apps/local-api/test/startup.test.ts` | Dasselbe, plus Vermerk, dass die neun Zweige aus `ZWEIGE` bei der Übernahme geprüft wurden. Kein Testfall geändert. |

Nicht angefasst: jede `src/`-Datei, jede Konfiguration, jede `package.json`.

---

## Zusammenfassung

Die drei von T-148 benannten Lücken sind geschlossen: `due-date.ts` und `attachment.ts` in
`packages/domain` sowie `repo-attachments.ts` in `packages/storage` haben jetzt je eine
eigenständige, umfassende Prüfdatei. Die Domänenabdeckung liegt wieder deutlich über 80 % (siehe
Tabelle unten), `pnpm test` steht bei 1359/1359 (+188 gegenüber dem Ausgangsstand von 1171),
`pnpm typecheck` bleibt bei 0, und `pnpm run proof:codepoints` bleibt bei 45/0. Die beiden von
domain-dev in T-132 angelegten Prüfdateien (`migration-failure-reason.test.ts`,
`startup.test.ts`) sind geprüft, bestehen unverändert, und ihre Übernahme in meine Hoheit ist im
Kopfkommentar festgehalten.

Ein Fund aus `src`, nicht behoben (nicht meine Hoheit): In `packages/domain/src/attachment.ts`
bleiben vier Verzweigungen praktisch unerreichbar — `line 289` und `line 320`
(`character.codePointAt(0) ?? …`, ein `for...of` über eine nichtleere Zeichenkette liefert für
jedes Zeichen immer einen Codepunkt, der Rückfall ist tote Defensivkodierung), sowie `line 419`
(`url.hostname === ''`) und `line 678` (derselbe Fall in `attachmentLabel`). Ich habe mit Node 22
(derselben WHATWG-`URL`-Implementierung, die die Datei benutzt) systematisch nach einer Eingabe
gesucht, die `new URL(x)` für ein `http`/`https`-Schema einen leeren `hostname` liefern lässt,
ohne zu werfen — keine gefunden: Der Standard verlangt für „besondere" Schemata einen nicht
leeren Wirt, und der Parser wirft stattdessen (`https://:80/pfad`, `https://user:pass@/pfad`
u. a.). `packages/storage/src/sqlite/repo-attachments.ts:157` ist im Quellkommentar selbst als
unerreichbar ausgewiesen ("Unerreichbar, solange das INSERT durchging"). Keine dieser vier
Stellen senkt die Paketschwelle unter 80 %; ich melde sie, statt sie stillschweigend
unberücksichtigt zu lassen oder `src` anzufassen.

---

## Abdeckung je Paket, vorher/nachher (`pnpm test:coverage`)

| Paket | vorher (Anw./Zweige/Funkt./Zeilen) | nachher | Schwelle bestanden? |
|---|---|---|---|
| `packages/domain/src` (gesamt) | 69,98 / 62,14 / 75 / 72,82 | 94,49 / 92,77 / 95 / 94,56 | vorher nein, **jetzt ja** |
| `packages/domain/src/attachment.ts` | 10,37 / 0 / 0 / 13,92 | 99,05 / 95,6 / 100 / 100 | — |
| `packages/domain/src/due-date.ts` | 12 / 0 / 0 / 15,78 | 100 / 100 / 100 / 100 | — |
| `packages/storage/src` (gesamt inkl. `sqlite`) | — / 78,49 (Zweige) / — / — | 91,26 gesamt Statements über alle drei Pakete; `storage/src/**` Zweige **85,32 %** gesamt, keine Schwellenmeldung mehr | vorher nein, **jetzt ja** |
| `packages/storage/src/sqlite/repo-attachments.ts` | 6,38 / 0 / 9,09 / 7,69 | 97,87 / 87,5 / 100 / 97,43 | — |
| `packages/export/src` (unverändert von mir) | 97,95 / 92,85 / 100 / 97,82 | 97,95 / 92,85 / 100 / 97,82 | unverändert, bereits grün |

Gesamtlauf zum Abschluss (`pnpm test:coverage`, Exitcode 0, keine `ERROR:`-Zeile mehr):

```
Statements   : 91.26% ( 2195/2405 )
Branches     : 85.32% ( 1291/1513 )
Functions    : 93.99% ( 438/466 )
Lines        : 93.44% ( 1952/2089 )
```

`pnpm test`: 69 Testdateien, **1359/1359** bestanden (vorher 66 Dateien, 1171).
`pnpm typecheck`: 0 Fehler (ein von mir selbst verursachter Fehler — `TextEncoder` ist in
`packages/domain` wegen `lib: ["ES2023"]` ohne DOM nicht bekannt, dieselbe Einschränkung, die der
Quellkommentar von `byteLength` in `attachment.ts` für die Produktivdatei nennt — wurde noch in
dieser Aufgabe gefunden und in der Prüfdatei selbst behoben: ein reiner Byte-Array-Aufbau über
`codePointAt` statt `TextEncoder`).
`pnpm run proof:codepoints`: 45/0, unverändert.

---

## Annahmen

1. **Die Bildgrenze wird gegen ihre Herkunft geprüft, nicht gegen den Wert** (`8 * 1024 * 1024`
   statt `8_388_608`), wörtlich nach dem im Auftrag genannten T-134-Anspruch — inklusive einer
   Gegenprobe gegen `8_000_000` (die naheliegende dezimale Verwechslung) und gegen `5 * 1024 *
   1024` (die von E-075 berichtigte Zahl aus E-073).
2. **Die Tagesgrenze wird mit der echten `toCalendarDay`-Funktion gemessen**, nicht mit zwei
   hingeschriebenen Zeichenketten, die zufällig einen Tageswechsel simulieren — das ist die
   „echte Gleichheitsprüfung, keine zweite Rechnung" aus dem Auftrag. `Europe/Berlin` steht
   explizit als zweites Argument, obwohl es auch aus der Testumgebung (`vitest.config.ts`,
   `env.TZ`) käme — Selbstdokumentation vor stillschweigender Abhängigkeit.
3. **`link_host_missing` und der Parallel-Zweig in `attachmentLabel` sind nicht getestet**, weil
   ich nach systematischer Suche mit der echten `URL`-Implementierung keine Eingabe gefunden
   habe, die sie erreicht (siehe Fund oben). Ich habe keinen künstlichen Bypass eingebaut (z. B.
   Mocken von `URL`), weil das den Prüffall von der Produktivimplementierung entkoppelt hätte,
   statt eine echte Lücke zu belegen.
4. **Die beiden übernommenen Dateien wurden nicht erweitert**, nur im Kopfkommentar als
   übernommen markiert — sie waren bereits vollständig (neun Zweige, Pfadfreiheit, Riegel im
   Protokollierer) und liefen bereits grün. Eine Erweiterung ohne erkannte Lücke wäre Prüfcode
   ohne Nachweiswert gewesen.
5. **Die allgemeinen Pflichtfälle des Rollenauftrags** (Rundung, Base64, Exportstatus, Timer,
   Notiz-Trennung, Tags/Ordner, Standard-Tags, Exportvorlagen) sind nicht Gegenstand dieser
   Aufgabe — sie haben bereits eigene, in früheren Wellen entstandene Prüfdateien
   (`rounding.test.ts`, `packages/export/test/base64.test.ts`, `export-status.test.ts`,
   `timer.test.ts`, `tags-and-pools.test.ts`, `packages/export/test/note-boundary-property.test.ts`,
   `templates.test.ts` u. a.), die weiterhin grün sind. T-148 benennt konkret nur die vier oben
   behandelten Punkte; ich habe mich daran gehalten, statt das Feld zu verbreitern.
6. **Kein Test verwendet echte Call-Nummern, Kundennamen oder Zugangsdaten** — alle Testdaten
   sind erfunden (`beispiel.example`, `Todo A`/`Todo B`, generische Pfade).

---

## Risiken

- **Vier faktisch tote Verzweigungen in `packages/domain/src/attachment.ts`** (Zeilen 289, 320,
  419, 678) und eine in `packages/storage/src/sqlite/repo-attachments.ts` (Zeile 157) senken die
  gemessene Zweigabdeckung der jeweiligen Datei, ohne dass ein Prüffall sie beheben könnte, ohne
  Produktivcode anzufassen. Kein Sicherheitsrisiko — im Gegenteil, defensive Kodierung gegen
  einen Fall, der mit der heutigen `URL`-Implementierung nicht eintreten kann. Empfehlung an den
  Orchestrator/domain-dev: entweder als bewusst unerreichbar dokumentieren (wie bei
  `repo-attachments.ts:157` bereits der Fall) oder bei Gelegenheit entfernen.
- **Kein Sicherheitsbefund** in den von mir gelesenen Dateien darüber hinaus.

---

## Offene Fragen

Keine. Die Aufgabe war ohne Rückfrage lösbar.

---

## Nächster Schritt

`pnpm check` als Ganzes (inklusive `boundaries`, `contrast`, `proof:all`, `verify:bundle`,
`test:rust`, `build`) liegt außerhalb der für diese Welle genannten Befehle und außerhalb
dessen, was ich in meiner Hoheit ändern könnte — ich empfehle, ihn nach Abschluss der parallel
laufenden Aufgaben T-149/T-150/T-152 einmal vollständig zu fahren, damit die Domänenabdeckung
zusammen mit deren Änderungen im Gesamtbild bestätigt ist.
