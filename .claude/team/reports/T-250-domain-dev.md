# T-250-2 — F-22: der `request`-Wächter spannt seine Menge an der Anforderung auf

Aufgabe: T-250-2 — F-22 entschieden: der `request`-Wächter spannt seine Menge künftig an der
Anforderung auf
Status: braucht Review

## Artefakte

- `apps/local-api/scripts/proof-callers.mjs` — geändert
- `apps/local-api/scripts/source-resolve.mjs` — geändert (`optionaleQuelle`, gemeinsamer Kern
  `quelleSuchen`)

Nicht angefaßt: `apps/web/**` (zwei Wegwerfdateien für die Gegenproben, beide wieder entfernt;
`endpoints.ts` zeitweise verschoben und über `git checkout` zeichengleich wiederhergestellt —
`diff` bestätigt), `scripts/source-anchors.mjs`, `apps/outlook-addin/**`, `packages/**`.

## Zusammenfassung

Die Zusage von Abschnitt 1 bleibt Wort für Wort, ihre Menge wird jetzt gemessen. `request` darf
stehen in `api/client.ts`, wo es entsteht, in der Sammelstelle `api/endpoints.ts`, solange es sie
gibt, und in jeder `api.ts` eines Merkmalsordners, **die auf der Platte liegt**. Die Menge kommt
auf zwei getrennten Wegen zustande — ein `readdirSync` über `src/features/*/api.ts` und die Ernte
des Sammlers — und beide müssen dieselben Namen nennen; verglichen werden Namen, nicht Zahlen
(F-22 Punkt 3, Lehre aus T-247-7). Ist die Menge leer, ist das ein Fehlschlag der Messung und
kein bestandener Prüfsatz (Punkt 4).

Dazu kam eine zweite Änderung, ohne die Punkt 2 nicht einzulösen war: **der Leser liest jetzt die
Menge und nicht eine Datei.** Bis heute las `proof:callers` genau `endpoints.ts` und urteilte
daraus über Wege, Rümpfe und Fragezeichenparameter. Mit der ersten `features/todos/api.ts` wären
deren Aufrufe ungelesen geblieben und Abschnitt 2 wäre rot geworden ("diese Operation hat keinen
Aufrufer") — Welle 2 hätte also auch mit dem gelockerten Abschnitt 1 nicht bestanden. `inspect`
bleibt dieselbe reine Funktion über einen Text; darüber liegt `inspectAll`, das die Teilurteile
vereinigt (Wege, Rümpfe, gesendete Schlüssel, blinde Flecken). Jeder Befund trägt seitdem den
Dateinamen, und die vier Selbstproben aus T-050 suchen sich ihre Trägerdatei, statt sie zu wissen.

Die Sammelstelle wird über `optionaleQuelle` aufgelöst: dasselbe Merkmal wie bisher
(`export function checkHealth(`), aber ihr Ausbleiben ist ein zulässiges Ergebnis und wird
**hingeschrieben**. Damit stirbt der Lauf in der letzten Welle nicht daran, daß eine erwartete
Datei fehlt — und er wird davon auch nicht stumm, weil die Untergrenze aus Punkt 4 darunter steht.

## Läufe

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm --filter @takt/local-api proof:callers` | 56/0 | **59/0** |
| `pnpm run proof:all` | 248/0, Code 0 | **248/0, Code 0** (unverändert) |
| `pnpm typecheck` | fehlerfrei | fehlerfrei |
| `pnpm boundaries` | grün | grün |

Die drei neuen Prüfsätze in `proof:callers`:

1. `die Aufrufdateien der Oberfläche sind gesucht und gefunden (1): api/endpoints.ts`
   — die Untergrenze aus F-22 Punkt 4.
2. `Platte und Sammler sehen dieselben Aufrufdateien der Merkmalsordner (0 zu 0)`
   — der Mengenvergleich aus F-22 Punkt 3.
3. `die Oberfläche: eine erfundene features/erfunden/api.ts — der Name allein erlaubt nichts wird
   gefunden` — die Gegenprobe darauf, daß die Erlaubnis an der **Messung** hängt und nicht an
   einem Muster über den Dateinamen.

Die Zahl in `proof:all` ändert sich nicht: Die Schlußzahl dort ist die des letzten Laufs
(`proof:addin`), nicht eine Summe.

## Gegenproben (am Baum gemessen, alle wieder zurückgebaut)

**A — Wegwerfdatei an einem unerlaubten Ort** (F-22 Punkt 4, wörtlich verlangt).
`apps/web/src/screens/ScheinAufruf.tsx` mit `client.request("/todos", { method: "DELETE" })`:

```
FEHL  `request` steht nur in api/client.ts, wo es entsteht, und in der einen gemessenen
      Aufrufdatei: api/endpoints.ts — screens/ScheinAufruf.tsx:3 —
      export const ladeHeimlich = async () => client.request("/todos", { method: "DELETE" });
58 bestanden, 1 fehlgeschlagen
```

Rot, und die Datei **und** die Zeile stehen im Befund.

**B — der Zielzustand, erste Hälfte.** `apps/web/src/features/todos/api.ts` mit
`import { request } from "../../api/client"` und einem echten Aufruf: 59/0. Der Lauf nennt beide
Aufrufdateien, zählt 76 statt 75 Aufrufe (die neue Datei wird also nicht nur geduldet, sondern
**gelesen**) und der Mengenvergleich sagt "1 zu 1".

**C — der Zielzustand, zweite Hälfte: die Sammelstelle ist weg.** `endpoints.ts` entfernt, die
Merkmalsdatei aus B behalten:

```
Hinweis: @takt/web/src/api/endpoints.ts ist nicht (mehr) auflösbar — …
ok    die Aufrufdateien der Oberfläche sind gesucht und gefunden (1): features/todos/api.ts
ok    `request` steht nur in api/client.ts, wo es entsteht, und in der einen gemessenen
      Aufrufdatei: features/todos/api.ts
```

Der Lauf lebt, sagt das Ausbleiben laut und urteilt über die verbliebene Datei. Rot ist er in
diesem Kunstzustand trotzdem — aber an `es sind überhaupt Aufrufe da (1, mindestens 45)`, also an
einem Befund über den Bestand und nicht an einer fehlenden Datei. Genau der Unterschied, den
F-22 Punkt 2 verlangt.

**D — gar keine Aufrufdatei.** Beide entfernt:

```
FEHL  die Aufrufdateien der Oberfläche sind gesucht und gefunden (0):  — keine einzige Datei,
      in der ein Aufruf an den Dienst stehen dürfte — das ist ein Fehlschlag der Messung und
      kein sauberer Baum
```

Die Untergrenze trägt. Ohne sie wäre `strayRequest.length === 0` grün gewesen, weil niemand
hingesehen hätte.

Danach: `git status` über `apps/web/src/api` und `apps/web/src/features` zeigt nur noch die
Dateien der Welle 1 von frontend-dev; `endpoints.ts` ist zeichengleich wiederhergestellt.

## Annahmen

1. **Die Form ist `features/<merkmal>/api.ts`, genau eine Ebene tief.** Kein Muster wie
   `features/**/api*.ts`. Legt frontend-dev seine Aufrufe unter `features/todos/api/index.ts`
   oder `features/todos/todos.api.ts` ab, sieht der Wächter sie nicht als erlaubt und meldet sie
   als zweiten Weg — laut und mit Dateinamen, nicht still. Das ist Absicht: Eine weite Form wäre
   wieder eine Erlaubnis über den Namen.
2. **Der Leser vereinigt die Teilurteile.** Ob eine Operation einen Aufrufer hat, ist eine Frage
   an die Oberfläche als Ganzes. Getrennt geurteilt wäre der Umbau eine Amnestie — jede einzelne
   Datei ruft die meisten Operationen nicht an.
3. **Die Typaufstellung ist `types.ts` plus die Typen der Aufrufdatei selbst** (dieselbe Bauart
   wie beim Aufgabenbereich). Ohne das würde ein Rumpftyp, der mit seinem Merkmal umzieht, in
   Abschnitt 5 als blinder Fleck gezählt, obwohl keiner entstanden ist.
4. **`optionaleQuelle` ist die Ausnahme und trägt ihre Bedingungen im Kopfabsatz**: das Ausbleiben
   wird geschrieben, und der Aufrufer braucht eine Untergrenze auf die Menge, in die das Ergebnis
   fällt. Sie steht heute an genau einer Stelle.
5. Die Befunde tragen jetzt den Dateinamen (`api/endpoints.ts moveTagFolder (Zeile 373)`), auch
   die des Aufgabenbereichs. Kein Prüffall und kein anderer Lauf liest diese Zeichenketten.

## Risiken

- **R-a: Die Ernte und die Platte teilen sich die Paketauflösung.** Beide Wege gehen durch
  `paketVerzeichnis('@takt/web')`. Fällt *die* aus, endet der Lauf laut in `scheitern` — der
  stumme gemeinsame Nullpunkt aus T-247-7 ist damit versperrt, aber die beiden Wege sind erst ab
  dort getrennt. Eine vollständige Trennung hieße, den Paketort zweimal unabhängig zu bestimmen;
  das halte ich für teurer als den Gewinn.
- **R-b: Die Divergenz Platte/Ernte ist ohne Gegenprobe.** Ich konnte keinen Zustand bauen, in dem
  die beiden Wege verschiedene Mengen sehen, ohne einen der beiden künstlich zu beschädigen. Der
  Prüfsatz existiert und ist grün; daß er auch rot werden **kann**, ist heute nur aus dem Code zu
  lesen. Vorschlag an unit-tester unter "Offene Fragen".
- **R-c: keine Sicherheitsfläche berührt.** Der Wächter mißt Quelltext; es entsteht kein neuer Weg
  nach außen, keine neue Route, keine Änderung an der CSP oder am Bestand.
- **R-d:** Sollte ein Merkmalsordner eine `api.ts` bekommen, die `request` **nicht** benutzt, steht
  sie trotzdem in der Erlaubnisliste. Das ist harmlos (sie darf, sie tut es nur nicht), macht die
  Ausgabe aber länger.

## Offene Fragen

1. **An frontend-dev, über den Orchestrator:** Die Form `features/<merkmal>/api.ts` ist ab sofort
   die gemessene Menge. Weicht der Umbau davon ab, bitte vor der Welle melden — die Antwort ist
   dann eine Änderung an dieser Stelle, nicht ein Umbenennen von `request`.
2. **An unit-tester:** `apps/local-api/scripts/**` hat heute keine Prüffälle. Die Bausteine, die
   sich ohne Baum prüfen ließen — die Auswahl der Merkmalsdateien, die Vereinigung der
   Teilurteile, das Verhalten bei divergierenden Mengen (R-b) — liegen in meiner Hoheit, die
   Prüffälle in seiner. Ich habe nichts angelegt.
3. **An den Orchestrator:** Wenn die letzte Welle `endpoints.ts` auflöst, fallen mit ihr die
   Einträge in `NOT_CALLED_BY_UI` und `NEVER_SENT` nicht automatisch — sie hängen an
   Operationskennungen und bleiben gültig. Sie sind aber Übergaben an frontend-dev
   (`getBoard`, `getVersionCheck`, `createTodo.tagNames`) und gehören bei der Gelegenheit
   angesehen.
4. Der Abschnitt "Was dieser Lauf nicht prüft" im Kopf der Datei nennt jetzt die gemessene Menge
   statt zweier Dateinamen. Ob `docs/architektur.md` oder `docs/bedrohungsmodell.md` (A-A-61,
   A-A-62) dieselbe Formulierung tragen, habe ich nicht geprüft — `bedrohungsmodell.md` gehört
   dem security-checker.

## Nächster Schritt

Welle 2 kann laufen. Empfohlene Reihenfolge: frontend-dev legt `features/todos/api.ts` in der
vereinbarten Form an; danach `pnpm --filter @takt/local-api proof:callers` — die erste Zeile von
Abschnitt 0 muß die neue Datei **namentlich** nennen und der Mengenvergleich "1 zu 1" sagen.
Sagt er "0 zu 0", während die Datei existiert, ist der Umbau an der Form vorbeigelaufen und nicht
am Wächter.
