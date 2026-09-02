Aufgabe: T-033 — Zwei API-Erweiterungen aus T-031 (E-049, E-051)

Status: fertig

---

Artefakte:

```
apps/local-api/src/usecases/export-catalog.ts   NEU (317) — die Auswahlliste als Auskunft:
                                                Beschriftungen je Quelle, Transformation und
                                                Vergleich, alle über `Record<…>` am Übersetzer
apps/local-api/src/routes/export.ts             GET /export/sources; POST /export/preview nimmt
                                                `definition`; POST /export/runs weist sie ab
apps/local-api/src/usecases/export.ts           `previewExport` nimmt `ExportPreviewTemplate`;
                                                Prüfung über `checkTemplateDefinition` — dieselbe
                                                Funktion wie `createTemplate`/`updateTemplate`
apps/local-api/openapi/takt-local-api.yaml      /export/sources, erweitertes /export/preview,
                                                Schemata `ExportSourceCatalog`,
                                                `ExportTransformation`, `ExportPreview`
apps/local-api/scripts/proof-export-api.mjs     NEU (619) — 69 Prüfungen über HTTP am Dienst
apps/local-api/package.json                     Skript `proof:export-api`
apps/local-api/scripts/proof-export.mjs         nachgezogen auf die neue Signatur
docs/architektur.md                             Ressourcentabelle 5.1: zwei neue Zeilen
```

`packages/export/src/**` **unangetastet** — die Liste wird von dort eingebunden, nicht geändert.
`apps/web/**`, `packages/*/test/**`, `tests/e2e/**` und die Wurzeldateien ebenfalls unangetastet.
Keine neue Abhängigkeit, `pnpm-lock.yaml` unverändert, keine Migration (kein Schemaeingriff).

---

Zusammenfassung:

**E-049.** `GET /api/v1/export/sources` liefert die geschlossene Auswahlliste als Auskunft des
Dienstes: zwölf Quellen mit Ebene, Beschriftung und Beschreibung, die drei Transformationen mit
Wirkung, die beiden Vergleiche einer Bedingung und den festen Satz zur Notiz-Trennung. Die
**Menge** kommt aus `EXPORT_SOURCE_PATHS` und `EXPORT_TRANSFORMATIONS` des Motors — gelaufen wird
über diese Listen, nicht neben ihnen her. Neu hinzugekommen ist ausschließlich deutscher
Anzeigetext, gehalten von `Record<ExportSourcePath, …>` und `Record<ExportTransformation, …>`:
Kommt eine Quelle dazu und fehlt hier die Beschriftung, bricht `tsc`. Damit ist die fünfte
Doppelung beseitigt — `apps/web` kann seine Fassung ersatzlos streichen, ohne `@takt/export`
einzubinden.

**E-051.** `POST /export/preview` nimmt zusätzlich `{ definition, timeEntryIds }`. Der Entwurf
läuft durch **dieselbe Funktion** wie das Speichern (`checkTemplateDefinition` →
`validateExportTemplateDefinition`), nicht durch eine zweite, ähnliche. Nachgewiesen mit elf
abgelehnten Definitionen, die an **beide** Routen geschickt und in Status, Schlüssel, Satz und
`details` verglichen wurden — alle elf identisch. Geschrieben wird nichts: gleich viele Vorlagen,
kein Exportlauf, keine Buchung markiert. Die Antwort trägt `templateSource: 'stored' | 'draft'`;
bei `draft` sind `templateId` und `templateName` `null`. Damit fällt in S-14 der Hinweis „zeigt den
gespeicherten Stand" weg.

Nebenbei beseitigt: Der Zweig für die **gespeicherte** Vorlage rief bisher
`validateExportTemplateDefinition` unmittelbar auf und verpackte den Fehlschlag mit
`taktError(code, message)` — dabei gingen die `details` verloren. Dieselbe kaputte Vorlage
antwortete also je nach Weg einmal mit und einmal ohne Feldangabe. Jetzt geht auch dieser Zweig
durch `checkTemplateDefinition`.

Gemessen am laufenden Dienst über HTTP, nicht behauptet: `pnpm --filter @takt/local-api
proof:export-api` → **69 von 69**, durch die vollständige Kette aus Host-, Herkunfts-, Inhaltstyp-
und Tokenprüfung, gegen eine echte migrierte SQLite-Datei in einem Wegwerfordner. Regression:
`proof:export` 66/66, `proof:access` 75/75, `proof:addin-wiring` 30/30. `pnpm check` **Exitcode 0**
(33 Testdateien, 545 Tests, alle Schwellen gehalten, Kontrastprüfung grün, Bau grün).

Das von T-031 gemessene Verhalten steht unverändert und ist jetzt festgenagelt: `todo.note` ergibt
`export_source_forbidden` mit vorangestelltem `Feld 1: `, alle zwölf Quellen werden angenommen
(201), und eine Bedingung `is_set` bei fehlendem Call **lässt den Schlüssel weg**, statt ihn leer
zu setzen.

---

Annahmen:

1. **Die Beschriftungen liegen im Dienst, nicht im Motor.** `packages/export` gehört dem
   integration-dev und hätte für deutschen Anzeigetext ohnehin die falsche Ebene: Der Motor kennt
   Werte, keine Bildschirmtexte. Im Dienst stehen die deutschen Fehlermeldungen bereits, also
   stehen die Beschriftungen daneben. Der Preis: Wer eine Quelle hinzufügt, ändert zwei Dateien
   in zwei Paketen — aber der Übersetzer sagt ihm das, statt dass es jemand merken muss.

2. **`noteBoundaryHint` wird mitgeliefert.** Er ist eine Aussage über *diese* Liste — wer die
   Liste ausliefert, liefert auch die Begründung dafür, was nicht darauf steht. Sonst wäre er die
   nächste kleine Doppelung.

3. **Die Vorschau nimmt entweder das eine oder das andere, nie beides.** Ein Rumpf mit
   `templateId` **und** `definition` endet mit 422 statt mit einer Vorrangregel. Welche Angabe
   gewinnt, hat niemand entschieden, und die Vorschau ist die Route, bei der Zweifel am gezeigten
   Stand am teuersten sind.

4. **Der Schlüssel entscheidet, nicht sein Wert.** `"definition": null` gilt als angegebener
   Entwurf und wird abgewiesen (`export_template_invalid`) — genau wie beim Speichern. Läse der
   Dienst `null` als „nicht angegeben", zeigte er stillschweigend die gespeicherte Vorlage, und
   der Benutzer sähe ein Ergebnis zu etwas, das er nicht geschickt hat.

5. **`templateSource` ist ausgeschrieben und nicht aus `templateId === null` abzuleiten.** Eine
   Vorschau, die den gezeigten Stand nur andeutet, ist dieselbe Mehrdeutigkeit, die S-14 vorher
   mit einem Hinweissatz überdecken musste.

6. **`POST /export/runs` weist `definition` ausdrücklich ab (422).** Zod würde den Schlüssel sonst
   **still** wegwerfen: Wer ihn dorthin schickt, bekäme eine Datei aus der aktiven Vorlage und
   hielte sie für sein Ergebnis. Der fachliche Grund steht in `recordRun` — jeder Lauf legt einen
   Abzug der Vorlage ab; ein Abzug ohne Vorlage wäre ein Beleg auf etwas, das nie existiert hat.

7. **`z.unknown().optional()`.** In zod 4 macht `z.unknown()` einen Objektschlüssel nicht mehr von
   selbst weglassbar. Ohne `.optional()` wies die Vorschau jeden Rumpf ohne `definition` ab — also
   jeden bisherigen Aufruf. Im ersten Prüflauf aufgefallen, nicht im Übersetzer.

---

Risiken:

1. **`apps/web` liest heute `templateId: Id` und `templateName: string` als nicht-optional.** Die
   Werte sind seit E-051 im Entwurfsfall `null`. Solange die Oberfläche keinen Entwurf schickt,
   ändert sich für sie nichts — aber der Typ in `api/types.ts` ist ab jetzt zu eng und muss beim
   Nachziehen mitgeändert werden, sonst behauptet er etwas Falsches über die eigene Antwort.

2. **Die Liste der Vergleichsoperatoren hängt im Motor an keinem Typ.** `KNOWN_OPERATORS` in
   `packages/export/src/template.ts` ist ein `Set<string>` mit zwei getippten Werten;
   `ExportConditionOperator` klammert es nicht. Mein `Record<ExportConditionOperator, string>`
   hält die **ausgelieferte** Seite fest, die prüfende nicht. Kommt ein dritter Operator in den
   Typ, liefert der Dienst ihn aus und weist ihn beim Speichern ab. Siehe Offene Frage 1.

3. **Es gibt keinen automatischen Abgleich zwischen OpenAPI und Dienst.** Ich habe die
   Übereinstimmung für den Export- und Einstellungsteil einmalig maschinell geprüft (Pfade und
   Methoden der Spezifikation gegen die registrierten Hono-Routen: keine Abweichung in beiden
   Richtungen) — aber als Wegwerfskript, nicht als Prüfpfad. Die nächste Route kann wieder
   auseinanderlaufen.

4. **Der Prüfpfad ist kein Test.** `proof:export-api` läuft nicht in `pnpm check`, weil er Port
   17843 belegt. Er teilt sich diesen Port mit `proof:access` und `proof:addin-wiring` und wartet
   deshalb auf einen freien Port, bevor er startet — nacheinander gefahren funktionieren alle
   drei, gleichzeitig nicht.

5. **Sicherheitsbefund, nicht aus dieser Aufgabe.** Die Fachrouten hängen hinter `authGuard`, aber
   ohne `requireCredential('session')`. Ein **Add-in-Token** kommt damit an `/export/runs`,
   `/settings` und alles Übrige — die Zusage in `app.ts` („ein entwendetes Add-in-Token kommt
   genau so weit, wie diese Fläche reicht", RR-1, B-2.9 Punkt 3) hält im Code nur für `/token` und
   `/security/notices`. Ich habe daran **nichts geändert**: Die Umstellung ist eine
   Sicherheitsverschärfung über den Auftrag hinaus und könnte die parallel entstehenden
   e2e-Prüfpfade treffen. Siehe Offene Frage 3.

---

Offene Fragen:

1. **An den integration-dev (`packages/export`):** Bitte ein `EXPORT_CONDITION_OPERATORS` neben
   `EXPORT_TRANSFORMATIONS`, gebildet aus einem `Record<ExportConditionOperator, true>`, und
   `KNOWN_OPERATORS` in `template.ts` daraus ableiten. Dann hängt auch die prüfende Seite am Typ
   statt an einem `Set<string>`, und der Dienst kann die Liste einbinden, statt sie über einen
   eigenen `Record` zu führen. Ich habe die Stelle in `export-catalog.ts` kommentiert und
   unangetastet gelassen — es ist seine Datei.

2. **An den frontend-dev:** `apps/web/src/lib/exportTemplateModel.ts` kann den gesamten oberen
   Teil streichen — `ExportSourcePath`, `SOURCE_INFO`, `SOURCE_GROUPS`, `SOURCE_PATHS`,
   `TRANSFORMATION_INFO`, `TRANSFORMATIONS`, `CONDITION_OPERATOR_LABEL`, `CONDITION_OPERATORS`,
   `NOTE_BOUNDARY_HINT`, `isExportSourcePath` — und alles aus `GET /export/sources` beziehen.
   `parseTemplateDefinition` bleibt sinnvoll, prüft dann aber gegen die geholte Liste.
   `ExportPreview.templateId`/`templateName` werden `| null`, dazu kommt
   `templateSource: "stored" | "draft"`. Für die Vorschau des ungespeicherten Stands:
   `POST /export/preview` mit `{ definition, timeEntryIds }` — **ohne** `templateId`, sonst 422.

3. **An den Orchestrator, zur Entscheidung:** Sollen die Fachrouten `requireCredential('session')`
   bekommen, damit ein Add-in-Token wirklich nur an `/addin/*` und `/health` kommt (Risiko 5)? Das
   ist eine eigene Aufgabe mit eigenem Prüfpfad und berührt den e2e-Tester; ich rate davon ab, es
   nebenbei in einer Erweiterungsaufgabe zu tun.

4. **Kleinigkeit:** `routes/export.ts` führt eine eigene Funktion `issues(ZodError)`, die
   `toFieldErrors` aus `http/input.ts` wörtlich wiederholt — in `routes/time.ts` und
   `routes/todos.ts` steht sie noch einmal. Drei Fassungen derselben vier Zeilen. Nicht angefasst,
   weil es nicht diese Aufgabe war; als eigener kleiner Auftrag jederzeit machbar.

---

Nächster Schritt:

Der frontend-dev zieht nach (Offene Frage 2) — das ist die Handlung, die die Doppelung
tatsächlich beseitigt; heute ist sie nur *auflösbar*. Danach in S-14 den Hinweissatz entfernen und
die Vorschau bei jeder Änderung gegen `{ definition }` fahren (A-8.7). Parallel dazu Offene
Frage 1 als Zeile im Board für den integration-dev, und Offene Frage 3 als eigene Aufgabe
einplanen oder ausdrücklich verwerfen.
