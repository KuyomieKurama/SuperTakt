# T-270 — Der Widerspruch im Exportstatus, und die toten Pfadangaben

Aufgabe: T-270 — Der Widerspruch im Exportstatus, und die toten Pfadangaben in
meiner Hoheit
Status: fertig

## Artefakte

| Datei | Was |
|---|---|
| `packages/domain/src/export-status.ts` | zweite Aufzählung gestrichen → Verweis auf den Typ; `ExportStatusTrigger` abgeleitet; `allowedExportStatusTransitions()` als gerechnete Menge samt zwei Übersetzerbehauptungen |
| `packages/domain/src/attachment.ts` | drei Pfadangaben auf `apps/web/src/features/todos/attachmentLabel.ts` gezogen |
| `packages/domain/src/enumeration.ts` | `screens/TodoFormDialog.tsx` → `features/todos/TodoFormDialog.tsx` |
| `packages/domain/src/tag-name.ts` | `components/TagInput.tsx` → `features/tags/TagInput.tsx` |
| `apps/local-api/src/access/export-directory.ts` | `lib/exportDirectoryAdvice.ts` → `features/export/exportDirectoryAdvice.ts` |
| `apps/local-api/src/features/export/catalog.ts` | `lib/exportTemplateModel.ts` → `features/export/exportTemplateModel.ts` |
| `docs/datenmodell.md` | 6.1 „Zwei Werte, **zwei** Übergänge" → drei; Schaubild, Fließtext und die Liste „nicht erreichbar" nachgezogen |
| `docs/architektur.md` | Schaubild Zeile 35: `apps/local-api/src/anwendung/` → `src/features/` |
| `docs/decisions/domain.md` | 3.1 aufgelöst (Vorgeschichte berichtigt, drei Auflagen benannt); 3.2 um den Nachtrag T-270 erweitert — der Abschnitt verstieß gegen die eigene Regel |
| `docs/decisions/board.md`, `docs/decisions/export.md` | `scripts/proof-foreign.mjs` → `apps/web/scripts/proof-foreign.mjs` |
| `docs/decisions/settings.md` | `apps/web/test/components/liveRegionsAlwaysRendered.test.ts` → `apps/web/test/liveRegionsAlwaysRendered.test.ts` |

## Zusammenfassung

Die zweite Aufzählung an `checkExportStatusTransition` ist **nicht berichtigt,
sondern gestrichen**; an ihrer Stelle steht ein Verweis auf
`ExportStatusTransition`, die eine Wahrheit oben. Dazu drei Ergänzungen, die
verhindern sollen, daß dieselbe Stelle in einem Jahr wieder auseinanderläuft:
`ExportStatusTrigger` ist jetzt `ExportStatusTransition['trigger']` (der
Funktionstyp zählte die drei Auslöser bis dahin ein **drittes** Mal auf),
`allowedExportStatusTransitions()` legt dem Wächter die vollständige
Eingabemenge Status × Status × Auslöser vor und behält, was er annimmt — die
Zahl der Übergänge ist damit eine Messung an der Regel statt einer Abschrift
daneben —, und zwei Übersetzerbehauptungen halten die beiden Eingabelisten in
**beide** Richtungen vollständig (`satisfies` fängt einen Eintrag zuviel,
`Exclude<…> extends never` einen zuwenig). Kein Zweig, kein Fehlercode, keine
Signatur eines Aufrufers hat sich geändert. Bei der Suche nach weiteren
Fassungen derselben Regel fiel eine **dritte** auf, außerhalb des Quelltextes:
`docs/datenmodell.md` 6.1 hieß „Zwei Werte, zwei Übergänge" und widersprach
6.2 zwei Bildschirme tiefer, wo `not_billed` als dritter Ereignistyp steht —
ebenfalls berichtigt. Die Pfadangaben in meiner Hoheit sind über den
Arbeitsbaum gemessen (`existsSync`, nicht Erinnerung) und **zwölf** davon
nachgezogen.

## Der Fund, der nicht im Auftrag stand

**Der einzige Zweig des Wächters, den kein Prüffall der Abdeckungsläufe
erreicht, ist genau der, den der falsche Kommentar geleugnet hat.**

`test:coverage` weist `export-status.ts` als unbedeckt aus: Zeile **257** —
`return ok({ from: 'open', to: 'exported', trigger: 'not_billed' })`. Die
Bedingung darüber wird ausgewertet und ist nie wahr (Zweigabdeckung 84,21 %).
Gesucht über alle Prüfordner: `not_billed` kommt in
`packages/storage/test/not-billed-audit.test.ts` und `repo-export.test.ts` vor
(dort über SQL, nicht über die Domäne), in
`apps/local-api/test/usecases/data-transfer.test.ts` als Protokolldatum — und
sonst nur in `tests/e2e/export-mixed-status-and-billing.spec.ts`, das nicht in
`test:coverage` läuft. Die Prosa war also nicht bloß veraltet; sie beschrieb
genau die Lücke, die daneben im Prüfstand klafft. Der Mengenprüffall schließt
sie mit einer Zeile.

## Zahlen

Ports 5173/17843/17844 vor den Läufen frei (`netstat`), schwere Läufe
nacheinander.

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** — acht Projekte, sieben Prüfkonfigurationen, e2e |
| `pnpm boundaries` | ok — 464 Quelldateien, 7/7 Typbehauptungen, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm proof:all` | **Ausgangskode 0**, 18 Ergebniszeilen, jede „0 fehlgeschlagen"; `proof:layers` **36 bestanden, 0 fehlgeschlagen** |
| `pnpm test:coverage` | **88 Dateien, 1570 bestanden, 3 übersprungen**, Ausgangskode 0 |

Keine Zahl hat sich bewegt. Eine Zahl **innerhalb** der Abdeckung hat sich
bewegt, und sie gehört benannt statt versteckt:

| `packages/domain/src/export-status.ts` | Anweisungen | Zweige | Funktionen | Zeilen | unbedeckt |
|---|---|---|---|---|---|
| vorher (gerechnet, s. u.) | 93,33 % | 84,21 % | 100 % | 92,86 % | 257 |
| nachher (gemessen) | 70 % | 84,21 % | 33,33 % | 68,42 % | 257, 324–328 |

Die Vorher-Zeile ist **gerechnet, nicht gemessen**: Der Schnitt bringt fünf
Anweisungszeilen und vier Pfeilfunktionen dazu, alle unbedeckt; 14/15 und 13/14
ergeben die beiden Prozentsätze. Die Schwelle greift auf `packages/domain/src/**`
im ganzen (93,76 %, Grenze 80) und ist nicht berührt. Die Zahl steigt wieder auf
100 %, sobald der Mengenprüffall steht — er ruft genau diese Funktion.

Gegenprobe an der neuen Funktion, ohne Prüfordner gefahren
(`node --experimental-strip-types`):

```
Menge: 3
[{"from":"open","to":"exported","trigger":"export_run"},
 {"from":"open","to":"exported","trigger":"not_billed"},
 {"from":"exported","to":"open","trigger":"reset"}]
not_billed angenommen: true
reset in der Gegenrichtung: {"ok":false,"error":{"code":"export_status_not_settable",…}}
```

## Die toten Pfadangaben — Fundorte und Urteil

Gemessen mit einem Wegwerfläufer über `packages/domain`, `packages/storage`,
`apps/local-api` und `docs/decisions`: jede Zeichenkette der Form
`apps|packages|docs|tests|scripts|src/…` mit Dateiendung, aufgelöst gegen den
Arbeitsbaum **und** gegen die Paketwurzel; dazu ein zweiter Lauf über
Ordnerpfade. Zwölf nachgezogen (Liste oben, Zählung in
`docs/decisions/domain.md` 3.2).

**Stehengeblieben, mit Begründung** — jede dieser Angaben ist entweder eine
Abkürzung, eine Attrappe oder ausdrücklich Vergangenheit, keine ist eine
Behauptung über den heutigen Baum:

| Fundort | Warum kein Fund |
|---|---|
| `scripts/proof-callers.mjs:207,238,258,262,266`, `proof-codepoints.mjs:862`, `proof-openapi.mjs:141`, `source-resolve.mjs:8` | `hinweis:`-Werte der Auflösung aus T-249-1. Der Lauf sagt selbst: „der bisherige Ort steht als Hinweis daneben und ist eine Abkürzung, keine Bedingung"; gefunden wird über `merkmal:` |
| `proof-layers.mjs:747,755`, `proof-release-safety.mjs:638–671` (`eingesetzt.ts`) | Attrappen der Gegenproben. Diese Dateien **dürfen** nicht existieren |
| `proof-release-safety.mjs:321` | ausdrücklich Vergangenheit: „Zuletzt nachgezogen mit T-257 (`lib/releasePage.ts` → `features/settings/releasePage.ts`)" |
| `proof-access.mjs:1139` | Meßprotokoll zu T-234: eine eingesetzte Verletzung, die es nie im Baum gab |
| `features/data-transfer/super-productivity-time.ts:6` | Verweis in einen **fremden** Bestand (SP-OutlookBridge, mit Commit-Kennung) |

## Annahmen

1. **Verweis statt Zahl, auch dort, wo eine Zahl bequemer wäre.** Die Auflage
   des spec-ux-reviewers lautete „Verweis auf den Typ statt zweiter
   Aufzählung". Ich habe sie auf die dritte Fassung in `docs/datenmodell.md`
   6.1 mitangewandt: Das Schaubild zeigt jetzt drei Pfeile, aber die Zahl steht
   dort mit dem Satz daneben, daß maßgeblich `ExportStatusTransition` ist und
   `allowedExportStatusTransitions()` nachrechnet.
2. **`docs/datenmodell.md` und `docs/architektur.md` mitgenommen.** Der Auftrag
   nennt sie nicht, `CLAUDE.md` weist sie mir zu, und beide trugen genau die
   Fehler dieses Auftrags — eine falsche Beschreibung derselben Regel und eine
   tote Pfadangabe. Keine Verhaltensänderung, keine Anforderung berührt.
3. **`allowedExportStatusTransitions` ist eine Funktion, kein Modulwert.** Ein
   `const` würde die Rechnung beim Einlesen des Moduls ausführen; für eine
   reine Domäne ist das harmlos, aber eine Funktion sagt deutlicher, daß
   gerechnet und nicht hinterlegt wird.
4. **Die drei Zweige bleiben Zweige.** Ein Tabellendurchgriff statt der drei
   `if` wäre kürzer, hätte aber die Regel in Daten verwandelt, und der Auftrag
   sagt ausdrücklich: Der Code behält seine Zweige.
5. **Der historische Pfad in `domain.md` 3.2 ist umgeschrieben, nicht
   gestrichen.** Er nennt jetzt das Ereignis („der damalige Ordner
   `usecases/`") statt einer Ortsangabe, die ins Leere zeigt.

## Risiken

- **R-T270-1 (mittel, offen bis unit-tester).** `export-status.ts` steht bis
  zum Mengenprüffall bei 68,42 % Zeilenabdeckung. Wer die Zahl ohne die
  Vorgeschichte sieht, hält den Schnitt für einen Rückschritt. Die Paketgrenze
  ist nicht gefährdet (93,76 % gegen 80).
- **R-T270-2 (mittel).** Der `not_billed`-Zweig ist außerhalb der E2E-Läufe
  ungemessen — ein Weg, auf dem Zeit als „abgerechnet" markiert wird, ohne daß
  je eine Datei entstand. Solange nur ein Playwright-Lauf ihn berührt, fällt
  ein Rückschritt dort erst spät auf.
- **R-T270-3 (niedrig).** Die beiden Eingabelisten in `export-status.ts` sind
  die einzige Stelle, an der `open`/`exported` noch einmal als Werte
  dastehen. Sie sind in beide Richtungen an den Typ gebunden; fällt eine der
  beiden Behauptungen weg, fällt diese Sicherung still.
- **Sicherheit:** keine Fläche berührt. Kein Netzweg, kein Schreibpfad, keine
  Route, kein Feld der Antwort. Die Notiz-Trennung ist von `boundaries`
  ausdrücklich als unverletzt gemeldet.

## Offene Fragen an den Orchestrator

1. **Der Mengenprüffall gehört unit-tester** (`packages/domain/test/**`, fremde
   Hoheit). Vorschlag, wörtlich:
   `expect(allowedExportStatusTransitions()).toHaveLength(3)` plus ein
   `toContainEqual` je Übergang — und ausdrücklich **kein** zweites
   Hinschreiben der Liste als Erwartungswert, sonst ist die Abschrift nur
   umgezogen. Dazu der eigentliche Gewinn: ein Fall für
   `checkExportStatusTransition('open','exported','not_billed')`, der heute
   fehlt (siehe Fund oben).
2. **`packages/domain/test/export-status.test.ts` trägt denselben Irrtum**
   (fremde Hoheit): Der Kopf spricht von „die zwei erlaubten Übergänge … x
   {export_run, reset}" und verweist auf `ExportStatusTransition
   (time-entry.ts)` — die Datei heißt seit T-261 `export-status.ts`. Beides
   gehört in denselben Auftrag wie Punkt 1.
3. **Zwölf von vierzehn Pfadangaben lagen bei mir.** Die übrigen zwei hat der
   code-reviewer in fremder Hoheit gefunden; sie sind in seinem Bericht
   benannt. In meinem Meßlauf über die fremden Bäume habe ich nicht gesucht —
   das wäre ein Auftrag an frontend-dev bzw. integration-dev, mit demselben
   Läufer.
4. **E-078 Punkt 3 hat hier nicht gegriffen**, und das ist eine Erkenntnis über
   das Verfahren: Der Satz sah wie eine Prüferauflage aus und stammte aus
   meinem eigenen Erstentwurfsbericht (`T-009-domain-dev.md:129`). Vorschlag:
   Wer sich auf E-078 Punkt 3 beruft, nennt den **Berichtsfundort**, nicht die
   Vermutung. Das ist eine Zeile in `decisions.md` wert — die ändert der
   Orchestrator.

## Nächster Schritt

Welle: unit-tester schreibt den Mengenprüffall und den fehlenden
`not_billed`-Fall und zieht den Kopf von `export-status.test.ts` nach (Punkte 1
und 2); parallel dazu code-reviewer über diesen Schnitt, weil er den Widerspruch
gemeldet hat und die drei Ergänzungen mehr sind als die verlangte Streichung.
Danach `pnpm check` im ganzen, mit der Erwartung, daß
`packages/domain/src/export-status.ts` wieder bei 100 % Funktionsabdeckung
steht.
