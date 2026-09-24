Aufgabe: T-082 — Ein Ordnerterm, der auf nichts auflöst, ist eine Einschränkung ohne Treffer

Status: braucht Review

`pnpm check` steht auf Exitcode **2**, und zwar an **einer** Stelle, die du selbst so beauftragt
hast: `apps/local-api/src/routes/addin/service.ts(326,17)` — `poolNamer` gibt `matchesPool` das
nun **verpflichtende** `unresolvedRequired` nicht mit. Datei in fremder Hoheit, deshalb nicht
angefaßt. Alles andere ist grün, einzeln nachgemessen (Abschnitt 6). Der genaue Patch für die
Nachwelle steht in Abschnitt 5.

---

Artefakte:

```
packages/domain/src/tag.ts                    `tagAxisIsUnresolved` (termweise: named/resolved/
                                              emptyTerms), `poolRuleMatchesNothing`,
                                              `ResolvedPoolRuleAxes`; `MatchesPoolRule.
                                              unresolvedRequired` (Pflicht), `PoolResolution` um
                                              `unresolvedRequired`, `unresolvedExcluded`,
                                              `emptyRuleFolderIds`, `matchesNothing` erweitert;
                                              `resolvePool` nimmt die leeren Ordner beider Achsen
                                              entgegen; `matchesPool` lehnt vor allem anderen ab
packages/domain/src/board.ts                  `BoardColumnRule.unresolvedRequired` (Pflicht),
                                              `boardAppearances` reicht es durch
packages/storage/src/sqlite/repo-tags.ts      `resolvePoolAxis` liefert `{named, tagIds,
                                              emptyFolderIds}`; die rekursive Abfrage trägt die
                                              Wurzel mit (`down(root, id, depth)`), damit je
                                              Ordnerterm gezählt werden kann — eine Abfrage, kein
                                              Aufruf je Ordner; `PoolPort.resolveAxes` umgesetzt
packages/storage/src/ports.ts                 `ResolvedTagAxis`, `PoolAxesResolution`,
                                              `PoolPort.resolveAxes`
packages/storage/src/sqlite/unit-of-work.ts   der Pool-Auflöser reicht `unresolvedRequired` an die
                                              Abfrage weiter
packages/storage/src/sqlite/repo-todos.ts     `ResolvedPool.unresolvedRequired` (Pflicht);
                                              `buildConditions` fragt `poolRuleMatchesNothing`;
                                              **Parameter je Regel getrennt gesammelt** (siehe
                                              Abschnitt 3 — latenter Fehler, der durch E-057 erst
                                              erreichbar geworden wäre)
apps/local-api/src/usecases/structure.ts      `poolWithResolution(pool, axes)` nimmt die Antwort
                                              des Ports; `withResolution` über `resolveAxes`
apps/local-api/src/usecases/board.ts          eine Auflösung je Spalte statt zweier Aufrufe; die
                                              Spaltenregel trägt `unresolvedRequired`
apps/local-api/openapi/takt-local-api.yaml    `PoolResolution` um vier Felder erweitert, alle
                                              Pflicht
apps/local-api/scripts/openapi-reader.mjs     mehrzeilige Flusslisten und nachlaufende Kommas
                                              (siehe Abschnitt 7 — der Prüfpfad stand rot, bevor
                                              ich etwas geändert hatte)
apps/local-api/scripts/service-scenario.mjs   drei Spalten: leerer Ordner **und** Status, leerer
                                              Ordner im **Ausschluß**, Tagterm **neben** leerem
                                              Ordner (Modus `any`)
apps/local-api/scripts/proof-openapi.mjs      Abschnitt 14 (neun Prüfungen), Abschnitt 13 um die
                                              vier neuen Felder erweitert
docs/architektur.md                           zwei Zeilen in der Domänentabelle, Begründung
docs/datenmodell.md                           4.4b umgeschrieben
.claude/team/reports/T-082-domain-dev.md      dieser Bericht
```

Nicht angefaßt: `apps/web/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`,
`packages/export/**`, `packages/*/test/**`, `tests/e2e/**`.

---

Zusammenfassung:

Ein Ordnerterm, der auf keinen Tag auflöst, verschwand aus der Regel — in `matchesPool` **und** in
der Übersetzung nach SQL, weil beide eine leere Tagmenge als Neutralwert lasen. Beide fragen jetzt
dieselbe Funktion (`poolRuleMatchesNothing`), und die Auskunft, die eine Tagmenge nicht tragen
kann, ist ein eigenes, **verpflichtendes** Feld. Gefragt wird **termweise**: Ein leerer Ordner
neben einem Tagterm bleibt sichtbar, obwohl die Achsensumme dann positiv ist — dafür trägt die
rekursive Ordnerauflösung ihre Wurzel mit, und die Antwort nennt die leeren erforderlichen Ordner
beim Namen (`resolved.emptyRuleFolderIds`), damit die Oberfläche **welcher** sagen kann.
Ausgeschlossene Terme über leere Ordner schließen weiterhin nichts aus.

Gemessen statt behauptet: Mit abgeschalteter Entscheidung fällt Abschnitt 14 mit `karten: 2` um;
mit achsenweiser statt termweiser Lesart fällt die gemischte Spalte mit `tagCount: 1` um. Beides
steht mit Zahlen in Abschnitt 4.

---

## 1. Was jetzt in der Domäne steht

```ts
export const tagAxisIsUnresolved = (axis: {
  readonly named: number;      // genannte Terme
  readonly resolved: number;   // Tags, die daraus wurden
  readonly emptyTerms: number; // einzelne Terme ohne Tag (E-057)
}): boolean => axis.emptyTerms > 0 || (axis.named > 0 && axis.resolved === 0);

export const poolRuleMatchesNothing = (axes: ResolvedPoolRuleAxes): boolean =>
  poolRuleIsEmpty(axes) || axes.unresolvedRequired;
```

Zwei Gründe, aus denen eine Regel nichts trifft, an einer Stelle: **keine Bedingung genannt**
(A-3.4) und **eine erforderliche Bedingung ohne Treffer** (E-057). Die zweite Bedingung in
`tagAxisIsUnresolved` (`named > 0 && resolved === 0`) ist heute von der ersten mit abgedeckt — nur
ein Ordnerterm kann leer ausgehen — und steht als Netz für eine dritte Termart da, die eines Tages
ins Leere zeigt, ohne ein Ordner zu sein.

**Warum die ausgeschlossene Achse nicht darin steht.** „Keiner davon" über nichts schließt nichts
aus. Bleibt daneben keine andere Bedingung übrig, greift trotzdem Fall 1 — nicht, weil ein
Ausschluß ins Leere zeigt, sondern weil die Regel dann gar nichts mehr sagt. Der Unterschied ist
in `proof:openapi` als eigene Prüfung festgehalten, weil er die Stelle ist, an der eine zu grobe
Behebung auffällt.

**Warum `unresolvedRequired` Pflicht ist** (deine zweite Ergänzung): Es ist keine Achse, sondern
eine Auskunft über eine bereits genannte. `matchesPool` überspringt, was es nicht genannt bekommt;
freiwillig hieße also „wer schweigt, bekommt die zu weite Antwort — und niemand wird rot". Das ist
die T-078-Falle. Dasselbe gilt für `BoardColumnRule.unresolvedRequired`: Wäre es dort freiwillig,
stünde in `boardAppearances` ein `=== true`, und die Wache schaltete sich selbst ab.

## 2. Termweise statt achsenweise — und was das an Daten kostet

Nichts. Die rekursive Abfrage stieg schon vorher über den Ordnerbaum ab; sie führt jetzt die
Wurzel mit:

```sql
WITH RECURSIVE down(root, id, depth) AS (
  SELECT f.id, f.id, 0 FROM tag_folder f WHERE f.id IN (…)
  UNION
  SELECT down.root, f.id, down.depth + 1 FROM tag_folder f JOIN down ON f.parent_id = down.id
   WHERE down.depth < 1000
)
SELECT down.root AS root, t.id AS id FROM tag t JOIN down ON t.folder_id = down.id
```

Ein Ordner, der über zwei Wurzeln erreichbar ist, ergibt zwei Zeilen — gewollt, denn gefragt ist
je **Term**. Die Tiefenschranke bleibt. `emptyFolderIds` steht in der Reihenfolge der Regel und
ohne Doppelte, damit die Oberfläche die Ordner in derselben Folge nennt wie das Formular.

Das Board zahlt **weniger** als vorher: `resolveAxes` ersetzt zwei Portaufrufe je Spalte durch
einen.

## 3. Ein latenter Fehler, den E-057 erreichbar gemacht hätte

In `buildConditions` gingen die Werte einer Regel unmittelbar in die gemeinsame `params`-Liste,
**bevor** feststand, ob ihre Bedingungen im Text landen. Solange „trifft nichts" nur bei einer
Regel ohne jede Bedingung eintrat, war nichts gesammelt worden, und der Fehler war unerreichbar.

Mit E-057 trifft eine Regel **mit** Achsen nichts: Die Statuskennungen lägen in `params`, ihr
Fragezeichen verschwände mit `0 = 1` — und **alle** folgenden Werte der Abfrage rutschten um eine
Stelle, auch die der Suche und der Blätterung. Die Werte werden jetzt je Regel gesammelt und erst
übernommen, wenn ihre Bedingungen im Text stehen. Ohne diese Zeile wäre die neue Spalte im
Prüfpfad nicht leer, sondern falsch gefüllt gewesen.

## 4. Welche Prüffälle rot geworden wären — gemessen

**Die ehrliche Antwort auf die Frage der Aufgabe: kein einziger bestehender.** Deshalb hat der
Fehler überlebt. Im einzelnen:

| Bestehender Prüffall | Vor T-082 | Warum |
|---|---|---|
| `repo-todos.test.ts` — `pools.members` gegen `matchesPool`, 4 Karten × 6 Spalten | **grün** | Beide Seiten haben denselben Fehler gemacht. Ein Gleichheitstest kann eine gemeinsame Falschheit nicht sehen — er hätte nur den halb umgestellten Zustand gefangen |
| `repo-tags.test.ts:406` — Pool ohne aufgelöste Tags trifft keinen Todo | **grün** | Reiner Ordnerterm: nach dem Auflösen leer, trifft schon nach A-3.4 nichts |
| `proof:openapi` 11 — Abfrage und Domänenregel nennen dieselben Spalten | **grün** | Dieselbe gemeinsame Falschheit |
| `proof:openapi` 13 — aufgelöst leere Regel hat keine Mitglieder | **grün** | Liest nur `isEmpty`; die gemischte Regel ist nicht leer |

Rot geworden **wäre**, was den gemischten Fall mißt. Zweimal nachgemessen, indem ich die
Entscheidung vorübergehend abgeschaltet und den Prüfpfad laufen lassen habe:

**a) Entscheidung ganz aus** (`poolRuleMatchesNothing` ohne `unresolvedRequired`):

```
FEHL  ein leerer Ordner **neben** einer zweiten Achse läßt die Regel nichts treffen
      {"terme":1,"status":1,"aufgeloest":{"tagCount":0,"isEmpty":false,
       "unresolvedRequired":true,"matchesNothing":false},"karten":2}
FEHL  was nichts trifft, hat keine Mitglieder — und es gibt den Fall
      „nicht leer und trotzdem nichts" (0)
76 bestanden, 2 fehlgeschlagen
```

`karten: 2` ist der Befund in einer Zahl: Die Spalte „leerer Ordner **und** Status" zeigte beide
Karten des Bestands — genau die Menge der Statusspalte daneben.

**b) Achsenweise statt termweise** (`emptyTerms` ignoriert):

```
FEHL  ein leerer Ordner **neben** einem Tagterm bleibt sichtbar und läßt die Regel nichts treffen
      {"terme":2,"modus":"any","aufgeloest":{"tagCount":1,"unresolvedRequired":false,
       "emptyRuleFolderIds":["01a0…"],"matchesNothing":false},"karten":2}
FEHL  die Ableitung „genannt, aber nichts daraus geworden" gilt in genau einer Ecke
79 bestanden, 2 fehlgeschlagen
```

`tagCount: 1` bei gleichzeitig genanntem leerem Ordner ist der Fall, den der frontend-dev gemeldet
hat: Die Achsensumme sieht gesund aus.

### Was das für den unit-tester heißt

Vier Fälle, jeder mit einer Gegenprobe. **Wichtig:** Testdateien werden von `pnpm typecheck` nicht
erfaßt (die Paket-`tsconfig`s stehen auf `include: ["src"]`, Vitest prüft keine Typen) — das neue
Pflichtfeld erinnert dort also **nicht** von selbst. Wer `matchesPool` in einem Test ruft und
`unresolvedRequired` wegläßt, bekommt zur Laufzeit `undefined` und damit die Antwort von vor
E-057.

1. **Gemischte Achse** — Regel: leerer Ordner + `statusIds`. `pools.members` liefert **nichts**;
   Gegenprobe: dieselbe `statusIds` ohne den Ordner liefert die Karten.
2. **Gemischte Terme** — Regel: `[{tag}, {folder leer}]`, `matchMode: 'any'`. Liefert **nichts**,
   obwohl `resolveRule` einen Tag zurückgibt. Gegenprobe: derselbe Tagterm allein liefert Karten.
3. **Ausschluß über einen leeren Ordner** — `excludedTags: [{folder leer}]` neben einem Tagterm.
   Liefert **dieselbe** Menge wie ohne den Ausschluß. Das ist der Fall, an dem eine zu grobe
   Behebung auffällt.
4. **`pools.members` gegen `matchesPool`** mit den Spalten aus 1–3. Der Domänenaufruf braucht

```ts
import { resolvePoolAxis, poolAxes, poolMatchMode } from '../src/sqlite/repo-tags.ts';
import { tagAxisIsUnresolved, matchesPool } from '@takt/domain';

const required = resolvePoolAxis(db.conn, column.id);
const excluded = resolvePoolAxis(db.conn, column.id, 'excluded');
matchesPool({
  ruleTagIds: required.tagIds,
  excludedTagIds: excluded.tagIds,
  unresolvedRequired: tagAxisIsUnresolved({
    named: required.named,
    resolved: required.tagIds.length,
    emptyTerms: required.emptyFolderIds.length,
  }),
  // … die übrigen Achsen wie bisher
});
```

`resolvePoolRule` bleibt unverändert bestehen; die bestehende Prüfung `repo-tags.test.ts:396/403`
läuft weiter.

Und für die Domäne rein (ohne Dienst): `poolRuleMatchesNothing` und `tagAxisIsUnresolved` sind
reine Funktionen; die vier Ecken der Ableitung (`(1,0,1)`, `(0,0,0)`, `(1,1,0)`, `(0,3,0)`) plus
der termweise Fall `(2,1,1)` decken sie ab.

## 5. Der Patch für die Nachwelle (integration-dev)

Der Port gibt es her — `PoolPort.resolveAxes` steht seit dieser Aufgabe. Der Ausschnitt in
`routes/addin/ports.ts` gibt es **nicht** her und muß erweitert werden:

```ts
// apps/local-api/src/routes/addin/ports.ts:119
readonly pools: Pick<PoolPort, 'list' | 'resolveRule' | 'resolveExcluded' | 'resolveAxes'>;

// apps/local-api/src/routes/addin/service.ts, poolNamer
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

Dazu die Attrappe in `apps/outlook-addin/scripts/fixtures.mjs:356` — sie baut den Pool-Port nach
und braucht ein `resolveAxes`, das `{ required: { tagIds, emptyFolderIds }, excluded: { … } }`
liefert. Ohne das läuft `proof:addin` in ein `undefined`.

**Zur Frage der Vertrauensgrenze, die der integration-dev aufgeworfen hat** (bekommt das
Add-in-Token diese breitere Auskunft?): `resolveAxes` liefert **Ordnerkennungen**, und
`/addin/context` liefert dem Add-in ohnehin schon den ganzen Tagbaum (`unit.folders.loadTree()`)
und alle Pools. Es ist also keine neue Datenklasse, sondern dieselbe Auskunft in aufgelöster Form.
Die Bewertung liegt beim security-checker; aus meiner Sicht wächst die Fläche nicht.

**`proof-addin.mjs` (JS) ruft `matchesPool` an zwei Stellen ohne das Feld** (Zeilen ~2119, ~2197).
Dort schweigt der Übersetzer — die Datei ist `.mjs`. Das ist keine Blockade (`proof:addin` steht
auf 117/117), aber die beiden Stellen messen bis auf weiteres die Antwort von vor E-057.

## 6. Nachweise

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **1 Fehler**, `routes/addin/service.ts(326,17)` — fremde Hoheit, beauftragt |
| `pnpm test` | 35 Dateien, **581** Prüffälle, grün |
| `pnpm run boundaries` | grün, Notiz-Trennung unverletzt |
| `pnpm proof:openapi` | **81 von 81** (vorher 72; Abschnitt 14 neu mit 9) |
| `proof:callers` 18, `proof:conflicts` 149, `proof:tags` 42, `proof:access` 75 | grün |
| `proof:export` 97, `proof:export-api` 69, `proof:route-policy` 40 | grün |
| `proof:template-fields` 30, `proof:db-permissions` 17, `proof:addin-wiring` 32 | grün |
| `proof:taskpane` 25, `proof:addin` 117, `verify:bundle` 20 | grün |
| `pnpm run build` | grün (vor der Pflichtstellung vollständig durchgelaufen, Exitcode 0) |

`pnpm check` lief unmittelbar **vor** der Pflichtstellung von `unresolvedRequired` einmal
vollständig auf **Exitcode 0** durch — der jetzige Fehlschlag hat genau eine Ursache, und sie ist
die beauftragte.

## 7. Ein Fund am Rande: der Prüfpfad stand rot, bevor ich etwas geändert hatte

`proof:openapi` brach mit `Keine Zuordnung: [` ab. Ursache: In `takt-local-api.yaml` standen zwei
Fluß-Listen mehrzeilig (`required:` + `[`, ein Eintrag je Zeile, nachlaufendes Komma) — die Form,
die ein Formatierer erzeugt. Der hausgemachte Leser kannte nur die einzeilige.

Statt fremde Absätze zurückzuformatieren habe ich den Leser tolerant gemacht
(`apps/local-api/scripts/openapi-reader.mjs`, meine Hoheit): mehrzeilige Fluß-Ausdrücke und
nachlaufende Kommas. Ein nachlaufendes Komma hätte vorher stillschweigend ein `null` an die Liste
gehängt. Ein Prüfpfad, der von der Formatierung der Datei abhängt, meldet sonst einen Befund über
die Schnittstelle, wo keiner ist.

---

Annahmen:

- **`unresolvedExcluded` bleibt eine Auskunft ohne Wirkung.** Es steht in der Antwort, weil ein
  Ausschluß, der nicht wirkt, eine Anzeige wert ist — es geht in keine Treffermenge ein. Die
  Namen der leeren **ausgeschlossenen** Ordner liefere ich nicht: Aus ihnen folgt keine Handlung,
  und eine Kennung ohne Handlung wäre eine Anzeige ohne Sinn (so von dir vorgegeben).
- **`isEmpty` behält seine Bedeutung** („nach dem Auflösen bleibt keine Bedingung übrig") und ist
  seit E-057 nur noch **hinreichend**, nicht mehr notwendig für „trifft nichts". Die vollständige
  Antwort heißt `matchesNothing`. Grund: Die Oberfläche braucht beide — „richte die Regel ein" und
  „leg einen Tag in den Ordner" sind verschiedene Sätze. Bestehende Leser von `isEmpty` bleiben
  richtig, nur unvollständig.
- **`resolveRule`/`resolveExcluded` bleiben unverändert** neben `resolveAxes` stehen. An ihnen
  hängen ein Aufrufer in fremder Hoheit und zwei bestehende Prüffälle; eine geänderte Rückgabe
  hätte beide gebrochen, ohne sie richtiger zu machen.
- **Die Reihenfolge in `emptyRuleFolderIds`** ist die der Regel, nicht die der Abfrage, und
  Doppelte fallen weg.
- **Eine Regel, die es nicht gibt**, nennt nichts (`named: 0`) und trifft nach A-3.4 nichts — nicht
  nach E-057. Der Unterschied ist für niemanden sichtbar, aber er hält die beiden Gründe getrennt.

Risiken:

- **R-neu: Der Aufgabenbereich nennt bis zur Nachwelle Pools, die das Board nicht führt.** Genau
  der T-078-Fehler, eine Achse weiter. Er wirkt nur bei Regeln mit leeren Ordnertermen, und er
  geht in die schlechtere Richtung (zu viele Pools). Der Übersetzer hält ihn seit dieser Aufgabe
  fest; bis zur Nachwelle steht er im Baum.
- **Verhaltensänderung an bestehenden Beständen.** Wer heute eine Spalte über einen Ordner hat,
  der (noch) leer ist, sieht sie ab sofort leer statt gefüllt. Das ist der Zweck von E-057, aber
  es ist eine sichtbare Änderung ohne Migration — die Oberfläche sollte den Grund nennen können,
  und dafür liegt jetzt alles bereit.
- **Kein neuer Datenpfad zur Notiz.** `resolveAxes` liest `pool_rule`, `tag` und `tag_folder`; die
  Grenzprüfung ist unverändert grün.
- **Die Reihenfolge der Prüfungen in `matchesPool`** ist weiterhin gleichgültig — die neue
  Bedingung lehnt vor allem anderen ab und kann keine Menge vergrößern.

Offene Fragen:

1. **Die Nachwelle für `routes/addin/**`** (Patch in Abschnitt 5) — ohne sie bleibt `pnpm check`
   auf Exitcode 2. Zwei Dateien in Hoheit des integration-dev plus die Attrappe im Add-in.
2. **`apps/web`**: `describeRuleReach` liest `resolved.tagCount === 0` als Übergang. Ab jetzt gibt
   es `resolved.emptyRuleFolderIds` (welche Ordner) und `resolved.matchesNothing` (ob überhaupt
   etwas kommen kann). Der dokumentierte blinde Fleck — „Tag Support **oder** Ordner Ost" — ist
   damit abgedeckt; die Oberfläche muß dafür `emptyRuleFolderIds` lesen und nicht die Summe.
   Reihenfolge der Sätze: `unresolvedRequired` vor `isEmpty`, sonst steht „richte die Regel ein"
   an einer Regel, die eingerichtet ist.
3. **Formatierer auf `takt-local-api.yaml`**: Wenn dort einer läuft, gehört er in die
   gemeinsamen Befehle, damit er nicht bei jedem zweiten Lauf eine andere Form erzeugt. Der Leser
   verträgt jetzt beide; die Frage ist trotzdem offen.

Nächster Schritt:

Die Nachwelle mit zwei Aufträgen: **integration-dev** den Patch aus Abschnitt 5 (drei Dateien,
danach ist `pnpm check` wieder grün), **unit-tester** die vier Fälle aus Abschnitt 4 samt dem
Hinweis, daß Testdateien nicht typgeprüft werden und `unresolvedRequired` deshalb von Hand
mitgegeben werden muß. Der frontend-dev kann parallel auf `emptyRuleFolderIds` und
`matchesNothing` umstellen.

Befehle, die ich benutzt habe: `pnpm typecheck`, `pnpm test`, `pnpm run boundaries`,
`pnpm proof:openapi`, `pnpm check`.
