Aufgabe: T-095 — Einheitentests Poolbewegung, Wachen, Ordnersperre

Status: fertig

**In einem Satz:** Alle fünf Pflichtfälle sind gebaut und grün — 53 neue Fälle insgesamt, 648/648
Gesamtlauf, `packages/domain/src` bei 87,5 % Zweigabdeckung statt 69,72 %; die ursprüngliche
Blockade bei `describeRuleReach`/`emptyFolderNames` ist behoben, seit der Orchestrator
`apps/local-api/tsconfig.test.json` und `apps/web/tsconfig.test.json` angelegt und in
`typecheck:test` verdrahtet hat.

**Nachtrag (dieselbe Aufgabe, nach Aufhebung der Blockade):** `apps/web/test/lib/poolRule.test.ts`
mit acht Fällen für `describeRuleReach`/`emptyFolderNames` ergänzt. Kein Fall hängt an E-059 —
beide Funktionen lesen `POOL_EXPORT_LABEL` nicht; das ist im Dateikopf begründet, damit es beim
nächsten Mal nicht erneut geprüft werden muss. `pnpm run typecheck:test` und `pnpm run test`
(ohne Coverage, wie vom Orchestrator verlangt) je Exitcode 0: 43 Testdateien, 648 Fälle.

---

Artefakte:

Neu:

```
packages/domain/test/pool-movement.test.ts
    poolMovementSentence — 15 Fälle aus der Wortlauttabelle (E-058 Punkt 4: 2 Anlässe × 2
    Zeitformen × je 4 Fälle bei "reopen", 3 bei "booking" + der leere Fall zweimal null),
    Aufzählung von drei Namen ("A", "B" und "C"), "reopen" liefert nie null, dritte
    Überladung mit Laufzeit-Anlass. Dazu ein Rot-Nachweis-Block (siehe unten).
packages/domain/test/matches-pool-guard.test.ts
    Laufzeitwache in matchesPool: wirft bei fehlendem/undefined/String/null/Zahl an
    unresolvedRequired; Gegenprobe false/true wirft nicht. Dazu ein
    Diskriminierungs-Nachweis (siehe unten).
apps/local-api/test/usecases/pool-movement.test.ts
    poolMovementNamer gegen eine selbstgebaute, typgeprüfte Attrappe von
    Pick<PoolPort, 'list' | 'resolveAxes'>: list('all') inklusive reiner Board-Spalten,
    enters ⊆ appears / enters ∩ leaves = ∅, zwei gleichnamige Pools über die Regel
    unterschieden, leere Regel trifft nichts, Regel über leeren Ordner trifft nichts
    (unresolvedRequired, E-057) trotz beisteuerndem Tagterm daneben.
packages/storage/test/repo-tags-folder-in-rule.test.ts
    TagFolderPort.remove auf einem leeren, aber in einer Regel verwendeten Ordner:
    tag_in_use mit details (Pool-Kennung in field, Regelname in message), auch über die
    ausgeschlossene Achse, mehrere Regeln gleichzeitig genannt; zwei Gegenproben (ohne
    Regel löschbar; nach Entfernen aus der Regel wieder löschbar).
packages/storage/test/migration-0012-pool-rule-restrict.test.ts
    Migration 0012 über den echten Läufer: vorwärts RESTRICT (Ordner UND Tag in einer
    Regel nicht löschbar, rohes SQL-DELETE wirft FOREIGN KEY constraint failed),
    rückwärts auf 0011 mit unverändertem Bestand, dort CASCADE (Löschen nimmt den Term
    mit — der Zustand, gegen den 0012 geschrieben ist), wieder vorwärts mit
    integrity_check/foreign_key_check sauber.
```

```
apps/web/test/lib/poolRule.test.ts
    describeRuleReach — sechs Fälle: benannter leerer Ordner, unresolvedRequired ohne
    nennbaren Ordner (Fallback {id:null,label:null}), zwei Sorten "unbenennbar" (Kennung
    ganz ohne Chip vs. Chip mit missing:true), Prioritätsfall unresolvedRequired UND
    isEmpty zugleich (bleibt "empty-folder", nicht "no-condition"), sowie die beiden
    übrigen Zweige "no-condition"/"reachable". emptyFolderNames — zwei Fälle: reine
    Namensaufzählung (ein Name, zwei Namen mit "und"), gemischt benannt/unbenannt und
    Einzahl gegen Mehrzahl bei rein unbenannten Ordnern ("einem unbekannten Ordner"
    gegen "N unbekannten Ordnern").
```

Nicht geändert: keine bestehende Testdatei — siehe „T-089-Bereinigung" unten.

---

Zusammenfassung:

`poolMovementSentence` ist gegen die Wortlauttabelle aus E-058 Punkt 4 geschrieben, nicht gegen
den Stand der Datei beim Start dieser Aufgabe (der noch `inPools`, „in keinem anderen" und den
Ein-Flächen-Leersatz trug). Während der Bearbeitung landete T-093 (domain-dev, parallel) genau
diese Umstellung; ein späterer Lauf war deshalb grün. Damit der Nachweis „rot vor grün" trotzdem
im Prüflauf sichtbar bleibt, hält die Datei — nach dem Vorbild von
`board.test.ts`/`boardAppearancesCountingRuleTerms` — zwei Bausteine der Fassung vor T-093
(wörtlich aus dem Stand, den ich zu Beginn dieser Aufgabe gelesen habe) ausschließlich in der
Testdatei und zeigt, dass sie die Tabelle nicht erfüllen. Dieselbe Technik trägt den
Wachen-Nachweis: `matchesPool`s Wache existierte bereits unverändert seit T-089 (kein echter
Rot-Zustand am Produktivcode), daher eine lokale, bewusst ungesicherte Vergleichsfassung
(`?? false`), die zeigt, dass genau die Eingaben, an denen die echte Wache wirft, dort
unbemerkt durchgehen. `poolMovementNamer` ist gegen eine selbstgebaute, typgeprüfte Attrappe des
Portausschnitts geprüft — mit einer zweiten, „verschluckenden" Attrappenfassung als
Diskriminierungsnachweis für `list('all')`. Die Ordnersperre und Migration 0012 sind gegen den
echten SQLite-Adapter bzw. den echten Migrationsläufer gemessen, nicht gegen eine Nachbildung.

---

## Rot vor Grün — wörtlicher Nachweis

**`poolMovementSentence`.** Vor dieser Aufgabe (Stand `afb3578`, von mir zu Beginn gelesen) lautete
der leere Fall: `'Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem Pool.'`
— ohne „und in keiner Spalte". Der Test `pool-movement.test.ts` erwartet zeichengenau
`'… in keinem Pool und in keiner Spalte.'`. Ein Lauf gegen den Stand von `afb3578` wäre an dieser
Stelle **rot** gewesen (`expect(result).toBe(...)` mit unterschiedlichem String); mein erster Lauf
nach dem Schreiben der Tests war bereits grün, weil T-093 zwischenzeitlich gelandet war (siehe
`git diff afb3578 -- packages/domain/src/pool-movement.ts`, von mir zur Bestätigung nachgesehen).
Der Rot-Nachweis-Block im Test hält das dauerhaft fest, mit der exakten alten Zeichenkette als
Vergleichswert.

**Laufzeitwache `matchesPool`.** Die Wache selbst ist seit T-089 unverändert und war zu keinem
Zeitpunkt dieser Aufgabe fehlerhaft — es gab dafür schlicht **keinen** vorherigen Test (`grep` über
alle bestehenden Testdateien fand keinen Aufruf, der den Wurf prüft). Ein Lauf meiner acht Prüfungen
ist von Anfang an grün. Damit die Prüfung trotzdem nachweislich unterscheidet (und nicht zufällig
grün ist, weil sie z. B. gar nichts wirft), hält der Diskriminierungs-Block eine lokale, bewusst
ungesicherte Fassung (`Boolean(x ?? false)`) dagegen: Ein Lauf der acht Fälle **gegen diese
Fassung** wäre rot — sie wirft bei keiner der vier fehlerhaften Eingaben, bei denen die echte Wache
wirft.

---

## Blockade aufgehoben — `describeRuleReach`/`emptyFolderNames`

Der Orchestrator hat `apps/local-api/tsconfig.test.json` und `apps/web/tsconfig.test.json` angelegt
(beide `extends ./tsconfig.json`, `include: ["src","test"]`) und beide in `typecheck:test`
verdrahtet; ein eigenes `test`-Skript oder eine eigene `vitest`-Abhängigkeit für `apps/web` war
nicht nötig, weil die Wurzel-`vitest.config.ts` `apps/*/test/**/*.{test,spec}.{ts,tsx,mts}` bereits
einschließt. `apps/web/test/lib/poolRule.test.ts` ist jetzt angelegt: acht Fälle, `environment:
'node'` reicht (die Datei importiert nur `@takt/domain`, `../api/types` und `./format` — kein DOM).

**Warum `RuleDescription`/`PoolResolution` von Hand gebaut sind, nicht über `describeRule`.** Beide
Funktionen unter Prüfung nehmen die Werte fertig entgegen; ein handgebauter Wert hält jeden Fall
unabhängig vom Rest der Datei nachvollziehbar (dieselbe Bauart wie `board.test.ts`, das
`BoardColumnRule`-Werte ebenfalls direkt zusammensetzt statt sie zu berechnen). Das hat einen
Nebeneffekt, der die E-059-Warnung des Orchestrators gegenstandslos macht: `POOL_EXPORT_LABEL`
fließt ausschließlich in `describeRule` ein (bei der Beschriftung der Exportachse), nicht in
`describeRuleReach` oder `emptyFolderNames` — beide lesen nur `resolved.unresolvedRequired`,
`description.isEmpty`, die Chips der Achse `required` und die Liste der `EmptyRuleFolder`. Kein
Fall unten hängt an T-094; das steht auch im Kopf der Testdatei, damit es beim nächsten Mal nicht
erneut nachgeprüft werden muss.

Die acht Fälle, tatsächlich geschrieben (der ursprüngliche Zuschnitt in der vorherigen Fassung
dieses Berichts nannte einen anderen Vierer-Vierer-Split; beim Schreiben war der hier
aussagekräftiger, weil er die **Reihenfolge** aus dem Kopfkommentar von `describeRuleReach`
nachweist, nicht nur die drei Ausgänge einzeln):

1. `unresolvedRequired` mit einem benannten leeren Ordner → `empty-folder` mit Kennung und Namen.
2. `unresolvedRequired` ohne nennbaren Ordner (`emptyRuleFolderIds` leer) → genau ein Eintrag
   `{id:null,label:null}`, kein leeres Feld.
3. Zwei Sorten „unbenennbar": eine Kennung ganz ohne Chip in der Achse, ein Chip mit
   `missing:true` — beide liefern `label:null`, aber **mit** Kennung.
4. Priorität: `unresolvedRequired` **und** `isEmpty` gleichzeitig wahr → bleibt `empty-folder`,
   wird **nicht** zu `no-condition` (die Regel, die nur aus einem leeren Ordner besteht, ist
   eingerichtet und trotzdem leer aufgelöst).
5. `unresolvedRequired: false`, `isEmpty: true` → `no-condition`.
6. `unresolvedRequired: false`, `isEmpty: false` → `reachable`.
7. `emptyFolderNames`: ein Name ohne Verknüpfung, zwei Namen mit „und".
8. `emptyFolderNames`: gemischt (benannt + unbenannt) und rein unbenannt in Einzahl gegen
   Mehrzahl — „einem unbekannten Ordner" gegen „2 unbekannten Ordnern" (`formatCount`).

## T-089-Bereinigung — nichts zu bereinigen

`pnpm run test` und `pnpm run typecheck:test` liefen während der gesamten Aufgabe durchgehend grün
(zuletzt vor meinen Ergänzungen: 595/595, Exitcode 0). `BoardColumnRule extends MatchesPoolRule`
und die neue `tag_in_use`-Variante an `TagFolderPort.remove` hatten also keinen bestehenden Test in
`packages/*/test/**` gebrochen — `board.test.ts` und `tags-and-pools.test.ts` führten
`unresolvedRequired` bereits seit T-088. Es gab nichts zu bereinigen; ich habe stattdessen die
bislang fehlende Abdeckung für genau diese beiden Verhaltensänderungen ergänzt (siehe oben).

---

## Messungen

```
pnpm run typecheck:test    Exitcode 0 — jetzt fünf Pakete/Apps (domain, storage, export,
                           local-api, web), seit der Orchestrator die beiden neuen
                           tsconfig.test.json angelegt hat
pnpm run test              Exitcode 0 — 43 Testdateien, 648 Fälle, 0 rot
pnpm run test:coverage     Exitcode 0 — dieselben 648 Fälle, Schwellen erfüllt (Zahlen unten
                           von der Messung vor dem apps/web-Nachtrag; apps/web zählt nicht in
                           coverage.include und ändert die Prozentzahlen nicht)
```

Zweigabdeckung `packages/domain/src`: **69,72 % → 87,5 %** (Schwelle 80 %, jetzt erfüllt).
`pool-movement.ts`: 0 % → 100 % Anweisungen / 94,73 % Zweige (die verbleibende Lücke, Zeilen
148–149, ist der `?? ''`-Rückfall in der privaten `listPools` für eine leere Namensliste — dieser
Pfad ist von jedem Aufrufer in der Datei durch eine vorgelagerte Längenprüfung ausgeschlossen und
von außen nicht auslösbar, ohne die nicht exportierte Funktion direkt zu testen).
`packages/domain/src`, `packages/storage/src` und `packages/export/src` liegen alle über der
80-Prozent-Schwelle in allen vier Metriken; der Gesamtlauf (`pnpm run test:coverage`) endet mit
Exitcode 0. `apps/web` und `apps/local-api` sind nicht in `coverage.include` — für sie zählt der
Nachweis über `pnpm run test`, nicht über eine Prozentzahl.

Nicht gemessen: `pnpm run test:e2e` (nicht meine Hoheit, nicht Teil des Auftrags),
`pnpm run proof:*` (unverändert, da ich nichts in `src` oder `scripts` angefasst habe).

---

Annahmen:

1. **Rot-vor-Grün als eingebetteter Nachweis statt als beobachteter Lauf**, wo die Umsetzung
   entweder schon vor Aufgabenbeginn korrekt war (`matchesPool`-Wache) oder während der Aufgabe von
   einem parallelen Agenten korrekt gemacht wurde (`poolMovementSentence`, T-093). In beiden Fällen
   nach dem in `board.test.ts` etablierten Muster (`boardAppearancesCountingRuleTerms`): eine
   bewusst falsche Vergleichsfassung ausschließlich in der Testdatei, die zeigt, dass die Prüfung
   zwischen richtig und falsch unterscheidet, statt zufällig grün zu sein.
2. **`db.unit.pools.create({..., position: 0})` für mehr als einen Pool im selben Test.** `pools.create`
   nimmt eine ausdrückliche Position erst ab 1 an (O-B); zwei Pools mit derselben *ausgesprochenen*
   Position über 0 kollidieren am eindeutigen Index. `position: 0` bei jedem Pool überlässt die
   tatsächliche Position der automatischen Vergabe — dieselbe Konvention wie in den bestehenden
   Prüfdateien (`pool-rule-unresolved-required.test.ts`).
3. **Migrationsversion dynamisch ermittelt** (`migrations.find(m => m.name === 'pool_rule_restrict')`)
   statt der Zahl 12 fest verdrahtet — falls eine künftige Migration eingeschoben würde, bräche der
   Test nicht an einer falschen Stelle.
4. **`RuleDescription`/`PoolResolution` für `apps/web/test/lib/poolRule.test.ts` von Hand gebaut**,
   nicht über `describeRule`/den Dienst — Begründung oben im Abschnitt „Blockade aufgehoben". Das
   ist zugleich der Grund, aus dem kein Fall an T-094/E-059 hängt.
5. **Testdaten sind erfunden:** „Ost", „Support", „Wartung Nord"/„Erste Regel"/„Zweite Regel",
   „Abrechnung", „Beratung", „Erledigt, noch nicht abgerechnet". Keine echte Call-Nummer, kein
   Kundenname, keine Zugangsdaten.

Risiken:

1. **Die verbleibende Zweiglücke in `pool-movement.ts` (94,73 %, Zeilen 148–149)** ist ein
   Verteidigungsfall in einer nicht exportierten Funktion und von außen nicht auslösbar; ich habe
   sie nicht künstlich geschlossen (etwa durch einen Export nur für den Test), weil das eine
   Änderung an `src` verlangt hätte.
2. **`resolvePool` (tag.ts, vormals Zeilen 1040–1053, jetzt 1062–1075 nach T-093s Einfügungen weiter
   oben) bleibt unter der 100-%-Linie.** Das ist eine Altlast außerhalb des T-095-Auftrags
   (`resolvePool` steht nicht in der Aufgabenliste) und hat die Gesamtschwelle nicht verhindert;
   ich nenne es, damit es nicht als übersehen gilt.
3. **`apps/web/test/**` und `apps/local-api/test/**` zählen nicht zur Zweigabdeckungsmessung** —
   `coverage.include` in der Wurzel-`vitest.config.ts` nennt weiterhin nur `packages/domain/src`,
   `packages/storage/src`, `packages/export/src`. Das ist Bestand (dokumentierte Absicht laut
   Kopfkommentar der Datei: die Oberfläche deckt Playwright ab), keine Lücke aus dieser Aufgabe.
4. **Sicherheit:** keine neue Angriffsfläche. Alle Testdaten sind erfunden, keine Zugangsdaten,
   keine echten Call-Nummern. Die Migrationsprüfung öffnet ausschließlich `:memory:`-Verbindungen.

Offene Fragen: keine.

Nächster Schritt:

T-095 ist aus meiner Sicht abgeschlossen. Falls ein künftiger Aufrufer `describeRuleReach`/
`emptyFolderNames` um eine Abhängigkeit von `POOL_EXPORT_LABEL` oder einer anderen E-059-Beschriftung
erweitert, bräche das den Warnhinweis im Dateikopf von `apps/web/test/lib/poolRule.test.ts` sichtbar
— dieser Fall ist an den Orchestrator zu melden, sobald er eintritt, statt hier vorwegzunehmen.
