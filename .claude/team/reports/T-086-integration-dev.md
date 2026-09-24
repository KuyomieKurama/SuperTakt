Aufgabe: T-086 — `poolNamer` gibt `unresolvedRequired` mit; `pnpm check` wieder grün.

Status: fertig

**Zustand des Baums in einem Satz:** `poolNamer` fragt seit T-086 `PoolPort.resolveAxes` statt
`resolveRule`/`resolveExcluded`, leitet `unresolvedRequired` über `tagAxisIsUnresolved` aus der
Domäne ab und gibt es an `matchesPool` mit; `pnpm run typecheck` läuft **vollständig** auf
Exitcode 0 durch — einschließlich `typecheck:test` —, `proof:addin` steht bei **123** Prüfungen
(117 → 123), und die drei Mutationen, die den Fehler wiederherstellen, machen genau die dafür
gebauten Prüfungen rot (Abschnitt 4).

---

Artefakte:

Neu: keine Datei.

Geändert:

```
apps/local-api/src/routes/addin/ports.ts
    `AddinUnit.pools` ist jetzt `Pick<PoolPort, 'list' | 'resolveAxes'>`.
    `resolveAxes` kam hinzu — `resolveRule` und `resolveExcluded` sind
    gegangen, siehe Annahme 1. Die Begründung am Ausschnitt ist um den
    E-057-Absatz und um die Bewertung der Vertrauensgrenze erweitert.

apps/local-api/src/routes/addin/service.ts
    `poolNamer`: ein Portaufruf je Pool statt zweier; `unresolvedRequired`
    wird termweise aus `pool.rule.length`, `axes.required.tagIds.length` und
    `axes.required.emptyFolderIds.length` abgeleitet und geht in `holds` an
    `matchesPool`. Der Kopfabsatz „Der leere Ordner geht **nicht** mit" aus
    T-084 ist durch die Beschreibung des jetzigen Zustands ersetzt.

apps/outlook-addin/scripts/fixtures.mjs
    `resolveAxis` neu — dieselbe Gestalt wie `resolvePoolAxis` im echten
    Adapter (`{ tagIds, emptyFolderIds }`, termweise, ohne Doppelte, in der
    Reihenfolge der Regel). `resolveTerms` ist auf sie zurückgeführt, wie
    `resolvePoolRule` im Betrieb. `pools.resolveAxes` in der Attrappe neu.
    Der Tagbaum trägt einen **leeren** Ordner „Archiv" (`ID.folderArchiv`).
    `E057_POOL` und `E057_POOLS` neu: fünf Regeln, drei betroffene mit je
    einer Gegenprobe.

apps/outlook-addin/scripts/proof-addin.mjs
    Abschnitt 13 neu (sechs Prüfungen, davon fünf gegen die echten Routen).
    Die drei bestehenden `matchesPool`-Aufrufe tragen `unresolvedRequired`
    — zwei einzeln, einer über das gemeinsame `regel`-Objekt.

.claude/team/reports/T-086-integration-dev.md   dieser Bericht
```

Nicht angefaßt: `packages/domain/**`, `packages/storage/**`, `apps/local-api/**` außer
`src/routes/addin/`, `apps/web/**`, `packages/*/test/**`, `tests/e2e/**`. In `packages/export/**`
war nichts zu tun: Dort kommt weder `matchesPool` noch eine Pool-Auflösung vor (nachgesehen, nicht
angenommen).

---

Zusammenfassung:

Die eine rote Stelle war der Übersetzer bei der Arbeit: `matchesPool` verlangt seit T-082
`unresolvedRequired`, und `poolNamer` hatte die Auskunft nicht — sie steckt nicht in einer flachen
Tagmenge, sondern in `PoolPort.resolveAxes`, das zu jeder Achse auch die genannten Ordner nennt,
aus denen kein Tag geworden ist. Der Ausschnitt `AddinUnit.pools` führt jetzt `resolveAxes`, und
die Ableitung selbst wird nicht nachgebaut, sondern aus `@takt/domain` importiert
(`tagAxisIsUnresolved`) — dieselbe Zeile, die auch die Übersetzung nach SQL und die Pool-Liste
benutzen. Gefragt wird **termweise**: Ein leerer Ordner neben einem gefüllten verschwindet in der
Achsensumme, nicht aber in `emptyFolderIds`.

Beide Wege durch den Dienst hängen an derselben Stelle, und das ist nachgesehen: `matchesPool`
kommt in meiner Hoheit genau **einmal** vor (`service.ts:339`, in `holds`), und beide Aufrufer —
`GET /addin/todo-matches` und `POST /addin/todos/{todoId}/time-entries`, letzterer einschließlich
des Wiederöffnen-Pfads — holen sich ihre Antwort über `poolNamer`. `appears`, `enters`, `leaves`
und `bookingStates` liegen damit alle hinter demselben Feld; es gibt keinen zweiten Weg, auf dem
die alte Antwort noch herauskäme.

Die Attrappe im Add-in bekommt `resolveAxes` in derselben Gestalt wie der Adapter, und der Baum
einen wirklich leeren Ordner. Der Nachweispfad mißt daran drei Dinge: daß eine Spalte mit leerem
erforderlichem Ordner **nicht** genannt wird (einmal allein neben einer Statusachse, einmal
termweise neben einem gefüllten Ordner), daß dieselbe Achse ohne den Ordner sehr wohl nennt, und
daß derselbe leere Ordner im **Ausschluß** weiterhin nichts ausschließt.

`apps/outlook-addin/src/api/types.ts` brauchte keine Zeile: `PoolDto` trägt kein `resolved`, und
`/addin/context` liefert nach der Beschreibung `Pool` und nicht `PoolWithResolution`. Im ganzen
Add-in-Quelltext kommt kein Zugriff auf `resolved` vor — nachgesehen, siehe Abschnitt 5.

---

## 1. Was jetzt in `poolNamer` steht

```ts
const axes = await unit.pools.resolveAxes(pool.id);

return {
  …,
  ruleTagIds: axes.required.tagIds,
  excludedTagIds: axes.excluded.tagIds,
  unresolvedRequired: tagAxisIsUnresolved({
    named: pool.rule.length,
    resolved: axes.required.tagIds.length,
    emptyTerms: axes.required.emptyFolderIds.length,
  }),
};
```

`named` kommt aus der Regel und nicht aus dem Port: `ResolvedTagAxis` trägt die Zahl der Terme
ausdrücklich **nicht** („Wer sie braucht, hat die Regel in der Hand und zählt `rule.length`"), und
`pool.rule` ist genau die Liste, die der Benutzer ausgesprochen hat. Die **ausgeschlossene** Achse
steht absichtlich nicht daneben — „keiner davon" über nichts schließt nichts aus, und eine zu
grobe Behebung fiele genau dort auf (gemessen, Abschnitt 4c).

## 2. Der Port-Ausschnitt: eine Methode statt zweier

```ts
readonly pools: Pick<PoolPort, 'list' | 'resolveAxes'>;
```

Der Auftrag lautete „erweitern". Ich habe statt dessen **ersetzt**, und das ist die einzige
Abweichung dieser Aufgabe (Annahme 1). Nach der Umstellung hat in `apps/local-api/src/routes/addin/`
kein Aufrufer mehr `resolveRule` oder `resolveExcluded` — sie stünden als Fähigkeit im Ausschnitt,
die niemand benutzt. Der Ausschnitt ist hier aber die Wache: Wer in diesem Teilbaum eine Regel
auflöst, bekommt die leeren Ordner unvermeidlich mit, statt sich `unresolvedRequired` aus einer
Tagmenge zusammenzureimen, die die Antwort nicht kennt. Das ist dieselbe Überlegung, aus der T-082
das Feld zur Pflicht gemacht hat — nur eine Ebene früher.

Am Port selbst bleiben beide Methoden stehen; ich habe `packages/storage` nicht angefaßt.

**Zur Vertrauensgrenze** (meine offene Frage aus T-084, Antwort des domain-dev in T-082):
`resolveAxes` liest dieselben Zeilen derselben Regel wie `resolveRule` und liefert zusätzlich
**Ordnerkennungen**. Den ganzen Tag- und Ordnerbaum bekommt das Add-in ohnehin über
`folders.loadTree()` in `GET /addin/context`. Es ist dieselbe Auskunft in aufgelöster Form, keine
neue Datenklasse: keine Todos, keine Notizen, kein Bestand — und es sind zwei Portaufrufe weniger
je Anfrage. Die Bewertung liegt beim security-checker; aus meiner Sicht wächst die Fläche nicht,
sie wird um eine Methode kleiner.

## 3. Warum ein eigener Poolsatz und nicht drei Spalten mehr in `AXIS_POOLS`

`AXIS_POOLS` trägt die Messungen von T-078, E-056 und T-084, und drei davon halten Sätze und
Namenslisten **Zeichen für Zeichen** fest („Es erscheint dann wieder in den Pools „Wartung Nord“
und „Wartung, noch nicht abgerechnet“."). Eine zusätzliche Spalte hätte diese Erwartungen
verschoben, ohne einen Fehler zu zeigen — und eine Messung, die man beim Erweitern nachzieht,
mißt beim nächsten Mal weniger. `E057_POOLS` steht deshalb daneben, aus demselben Grund, aus dem
`AXIS_POOLS` seinerzeit neben `DEFAULT_POOLS` gestellt wurde.

Der leere Ordner ist ein **wirklich** leerer Ordner im Baum („Archiv", auf Wurzelebene, ohne Tags
und ohne Unterordner) und kein Kunstgriff über `includeSubfolders: false`. Er ändert an keiner
bestehenden Zählung etwas — `flattenTagTree` zählt Tags, und davon sind es weiterhin sechs — und
er ist der Bestand, den jede Einrichtung durchläuft: Ordner angelegt, noch nicht gefüllt.

## 4. Gemessen statt behauptet: drei Mutationen, dreimal die passende Farbe

Jede Mutation wurde einzeln eingesetzt, `proof:addin` gefahren und danach die Datei aus einer
Kopie zurückgeholt (`diff` gegen die Kopie am Ende: identisch).

**a) Das Feld ganz aus** (`unresolvedRequired: false` in `holds`):

```
FEHL  E-057: „Archiv und In Arbeit" wird nicht genannt — die Gegenprobe ohne Ordner schon
FEHL  E-057 termweise: der leere Ordner **neben** einem gefüllten zählt mit
FEHL  Die vollständige Auskunft, in der Reihenfolge der Pools
        + 'Wartung oder Archiv'
        + 'Archiv, in Arbeit'
120 bestanden, 3 fehlgeschlagen
```

Die beiden zusätzlichen Namen sind der Befund in zwei Zeilen: genau die Pools, die die
Hauptanwendung nicht führt. Die Ausschlußprüfung bleibt dabei grün — richtig, sie mißt die andere
Richtung.

**b) Achsenweise statt termweise** (`emptyTerms: 0`):

```
FEHL  E-057 termweise: der leere Ordner **neben** einem gefüllten zählt mit
FEHL  Die vollständige Auskunft, in der Reihenfolge der Pools   + 'Wartung oder Archiv'
121 bestanden, 2 fehlgeschlagen
```

Der Fall, in dem die Achsensumme gesund aussieht: „Wartung **oder** Archiv" löst auf zwei Tags
auf, und der leere Ordner daneben wäre unsichtbar.

**c) Zu grob behoben** (die leeren Ordner **beider** Achsen gezählt):

```
FEHL  E-057: derselbe leere Ordner im **Ausschluss** schließt nichts aus
FEHL  Die vollständige Auskunft, in der Reihenfolge der Pools   - 'Wartung, außer Archiv'
121 bestanden, 2 fehlgeschlagen
```

Das ist die Stelle, an der die naheliegende Übertreibung auffällt und sonst nirgends.

Dazu eine Prüfung **ohne** Dienst, die dasselbe an der Domäne festhält: Dieselbe aufgelöste Regel
mit `unresolvedRequired: false` trifft, mit `true` nicht. Sie steht da, weil der Übersetzer diese
Datei nicht liest — sie ist `.mjs` —, und weil ein Feld, dessen Wirkung niemand mißt, eines Tages
still verschwindet.

## 5. Was ich nachgesehen und **nicht** geändert habe

| Frage | Befund |
|---|---|
| Liest das Add-in `Pool.resolved`? | Nein. `PoolDto` in `src/api/types.ts` trägt `id`, `name`, `matchMode`, `includeSubfolders`, `rule` — kein `resolved`; im ganzen `src` kommt kein Zugriff darauf vor. `/addin/context` liefert nach der Beschreibung `Pool`, nicht `PoolWithResolution`. Die vier neuen Felder aus `PoolResolution` gehören damit nicht in das Add-in-DTO. |
| Gibt es einen zweiten `matchesPool`-Aufruf in meiner Hoheit? | Nein, genau einer (`service.ts:339`). Beide Routen und der Wiederöffnen-Pfad hängen daran. |
| Braucht `packages/export` etwas? | Nein — weder `matchesPool` noch eine Pool-Auflösung kommen dort vor. |

## 6. Nachweise

Jeder Befehl einzeln, ohne Rohr dahinter, Exitcode gelesen:

| Lauf | Ergebnis |
|---|---|
| `pnpm --filter @takt/local-api typecheck` | grün |
| `pnpm --filter @takt/outlook-addin typecheck` | grün |
| `pnpm run typecheck` (vollständig, mit `typecheck:test`) | **Exitcode 0, 0 Fehler** |
| `pnpm run proof:addin` | **123 von 123** (vorher 117) |
| `pnpm run proof:addin-wiring` | 32 von 32 |
| `pnpm run proof:taskpane` | 25 von 25 |
| `pnpm run proof:openapi` | 81 von 81 |
| `pnpm run proof:callers` 18, `proof:route-policy` 40, `proof:access` 75 | grün |
| `pnpm run proof:conflicts` 149, `proof:tags` 42, `proof:export` 97 | grün |
| `proof:export-api` 69, `proof:template-fields` 30, `proof:db-permissions` 17 | grün |
| `pnpm run boundaries` | grün, Notiz-Trennung unverletzt |
| `pnpm test` | 37 Dateien, **595** Prüffälle, grün |
| `pnpm --filter @takt/outlook-addin build` | grün |

Damit ist `pnpm run proof:all` in seinen dreizehn Einzelschritten vollständig grün gemessen.
`verify:bundle`, `contrast` und `test:coverage` habe ich nicht gefahren — sie liegen außerhalb
dessen, was diese Aufgabe berührt, und in einem Baum mit laufenden fremden Änderungen deute ich
sie nicht.

**Zu `typecheck:test`:** Der Auftrag hat den Schritt als „noch rot, gehört T-088" angekündigt. Zum
Zeitpunkt meiner Messung war er **grün** — `tsc -p packages/{domain,storage,export}/tsconfig.test.json`
lief ohne Fehler durch, Gesamtexitcode 0. Ich habe `packages/*/test/**` nicht angefaßt; entweder
war T-088 zu diesem Zeitpunkt fertig, oder die dortigen Aufrufe waren nie betroffen. Die Zahl ist
gemessen und nicht abgeleitet: **0 Fehler**.

Port 17843 hat nie blockiert. `proof:addin` bindet keinen Socket (die Routen werden über
`app.request` gefahren), und die beiden Läufe, die wirklich lauschen — `proof:addin-wiring` und
`proof:taskpane` —, sind auf Anhieb durchgelaufen. Es wurde kein fremder Prozeß beendet.

---

Annahmen:

1. **`resolveRule` und `resolveExcluded` sind aus dem Ausschnitt verschwunden, statt daneben
   stehenzubleiben.** Das ist die einzige Abweichung vom Wortlaut des Auftrags („um `resolveAxes`
   erweitern"), und sie ist umkehrbar in einer Zeile. Begründung in Abschnitt 2: Nach der
   Umstellung hat keine der beiden Methoden in `routes/addin/` noch einen Aufrufer, und ein
   Ausschnitt, der eine unbenutzte Fähigkeit führt, ist genau die Einladung, mit der der Fehler
   aus T-078 zweimal entstanden ist. Der Ausschnitt ist der Übersetzer, und der Übersetzer ist
   die Wache. Wenn der Orchestrator die breitere Fassung will, ist es dieselbe Zeile zurück.

2. **Ein eigener Poolsatz `E057_POOLS` statt dreier Spalten mehr in `AXIS_POOLS`.** Begründung in
   Abschnitt 3: Sonst hätte ich drei bestehende, Zeichen für Zeichen festgehaltene Erwartungen
   nachziehen müssen, ohne daß ein Fehler dahintersteht.

3. **Ein wirklich leerer Ordner im Baum** („Archiv"), nicht ein Ordner, dessen Tags über
   `includeSubfolders: false` unerreichbar sind. Beide wären E-057-Fälle; nur der erste ist der
   Bestand, um den es in der Entscheidung geht, und er ändert an keiner bestehenden Zählung etwas.

4. **`named` kommt aus `pool.rule.length`.** So steht es in der Beschreibung von
   `ResolvedTagAxis`, und so tut es der Adapter (`terms.length`). Für die erforderliche Achse sind
   das dieselben Zeilen.

5. **Ein dritter `matchesPool`-Aufruf im Nachweispfad hat das Feld bekommen.** Der Auftrag nannte
   zwei; der dritte steht als gemeinsames `regel`-Objekt in der T-084-Gegenprobe und wird zweimal
   ausgebreitet. Ohne das Feld hätte er weiter die alte Antwort gemessen.

6. **Die Prüfungen in Abschnitt 13 messen über die echten Routen**, nicht über `poolNamer`
   unmittelbar — mit einer Ausnahme, der reinen Domänenprobe am Ende. Ein Nachweis, der den Dienst
   nachbaut, statt ihn zu befragen, hätte die Attrappe geprüft und nicht die Kette.

Risiken:

1. **`.mjs` wird nicht typgeprüft.** Weder `fixtures.mjs` noch `proof-addin.mjs` sehen den
   Übersetzer. Wer dort künftig `matchesPool` ruft und `unresolvedRequired` wegläßt, bekommt
   `undefined` und damit die Antwort von vor E-057 — schweigend. Die vier Aufrufe in diesen
   Dateien tragen es jetzt; die Prüfung „das Pflichtfeld ist der Unterschied, und zwar in beide
   Richtungen" ist die Wache dagegen, daß die Wirkung des Feldes still verlorengeht. Eine echte
   Wache wäre eine Typprüfung über `scripts/**` — das ist eine `tsconfig`-Frage und gehört dem
   Orchestrator.

2. **Sichtbare Verhaltensänderung ohne Migration.** Wer heute eine Spalte über einen (noch) leeren
   Ordner hat, bekommt sie im Aufgabenbereich ab sofort **nicht** mehr genannt. Das ist der Zweck
   von E-057 und die richtige Richtung — der Aufgabenbereich sagte bisher mehr, als die
   Hauptanwendung führt —, aber es ist eine Änderung, die jemand bemerken wird. Das Add-in kann
   den Grund derzeit nicht nennen: Es bekommt Pool**namen**, keine Regelauflösung. Ob es das
   sollte, ist eine Produktfrage und keine, die ich nebenbei entscheide (offene Frage 2).

3. **Sicherheit: eine Methode weniger, keine neue Datenklasse.** `resolveAxes` liefert
   Ordnerkennungen — dieselben Ordner, die im Tagbaum von `GET /addin/context` ohnehin stehen.
   Keine neue Route, kein neues Feld am Token, kein Zugriff auf fremde Todos oder Vermerke;
   `pnpm run boundaries` meldet die Notiz-Trennung unverletzt.

4. **Keine echten Daten.** Alles Neue ist erfunden: der Ordner „Archiv", die Pools „Wartung oder
   Archiv", „Archiv, in Arbeit", „In Arbeit", „Wartung, außer Archiv", die Kennungen in der
   Gestalt UUID Fassung 7 und die weiterverwendeten Call-Nummern `TCK-000517`/`TCK-000518`. Die
   Quelltexthygiene-Prüfung des Add-ins („Keine echte Call-Nummer und kein echter Kundenname in
   den Prüfdaten") ist grün.

5. **Zwei Pools dürfen denselben Namen tragen.** Unverändert seit T-038; die neuen Namen in
   `E057_POOLS` sind untereinander verschieden, damit die Listenvergleiche eindeutig sind.

Offene Fragen:

1. **Die Beschreibung von `PoolPort.resolveRule`/`resolveExcluded` in `packages/storage/src/ports.ts`
   ist seit heute veraltet** (fremde Hoheit, deshalb nicht angefaßt). Dort steht als Begründung
   für ihr Weiterbestehen: „An dieser Signatur hängt ein Aufrufer in fremder Hoheit
   (`routes/addin/service.ts`)". Diesen Aufrufer gibt es nicht mehr. Die Methoden haben in
   `src/**` jetzt keinen Aufrufer außer dem Adapter selbst; benutzt werden sie noch von
   `packages/storage/test/repo-tags.test.ts`. Ob sie bleiben (als die genügsamere Frage) oder
   gehen, entscheidet der domain-dev — in beiden Fällen sollte der Absatz die neue Begründung
   tragen.

2. **Soll der Aufgabenbereich sagen können, *warum* ein Pool fehlt?** Die Hauptanwendung bekommt
   seit T-082 `resolved.emptyRuleFolderIds` und `resolved.matchesNothing` und kann „leg einen Tag
   in den Ordner" von „richte die Regel ein" unterscheiden. Das Add-in bekommt nur Namen und
   schweigt deshalb über einen Pool, der wegen eines leeren Ordners nicht mehr genannt wird. Ich
   halte Schweigen hier für vertretbar — der Aufgabenbereich zeigt, was **nach** der Buchung gilt,
   und nicht die Verfassung der Regeln —, aber es ist eine Entscheidung und keine Selbstverständlichkeit.

3. **Typprüfung für `scripts/**`?** Siehe Risiko 1. Es betrifft `apps/outlook-addin/scripts` und
   `apps/local-api/scripts` gleichermaßen und ist eine `tsconfig`-Änderung, also Orchestratorsache.

Nächster Schritt:

`pnpm check` in einem Zug, sobald keine Welle mehr mitten im Baum steht — bei mir sind alle
dreizehn Schritte von `proof:all`, `typecheck` (vollständig), `boundaries` und `test` einzeln
grün gemessen; offen bleiben nur `contrast`, `verify:bundle` und `test:coverage`, die diese
Aufgabe nicht berührt. Danach zwei kleine Aufträge: dem **domain-dev** den Absatz aus offener
Frage 1, dem **e2e-tester** ein Playwright-Fall, der eine Spalte über einen leeren Ordner anlegt
und zeigt, daß Hauptanwendung und Add-in dieselbe Antwort geben — das ist die Ecke, in der die
beiden bisher zweimal auseinandergelaufen sind.

Befehle, die ich benutzt habe:

```
pnpm --filter @takt/local-api typecheck        pnpm --filter @takt/outlook-addin typecheck
pnpm run typecheck                             pnpm run boundaries
pnpm run proof:addin                           pnpm run proof:addin-wiring
pnpm run proof:taskpane                        pnpm run proof:openapi
pnpm run proof:callers                         pnpm run proof:route-policy
pnpm run proof:access                          pnpm run proof:conflicts
pnpm run proof:tags                            pnpm run proof:export
pnpm run proof:export-api                      pnpm run proof:template-fields
pnpm run proof:db-permissions                  pnpm test
pnpm --filter @takt/outlook-addin build
```
