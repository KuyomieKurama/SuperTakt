# T-290 — Der Wächter zählt jetzt Klammern, mißt die Importmenge und sagt nur noch, was er sieht

Aufgabe: T-290 — Nacharbeit an `apps/local-api/scripts/proof-release-safety.mjs` aus T-289
(code-reviewer: Nacharbeit, blockierender Befund zu Zeile 828; security-checker: freigegeben mit
Auflage **A-V-28**)
Status: **fertig, braucht Review**

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/scripts/proof-release-safety.mjs` | **(1)** `interfaceRumpf()` zählt Klammern statt `[^}]*` — der blockierende Befund. **(2)** Fünfte Gestalt: `VERSION_FEATURE_IMPORTS`, die Importmenge des Prüferordners, beide Richtungen (A-V-28). **(3)** Drei zu weite Sätze auf das Gemessene zurückgenommen. **(4)** „Was dieser Wächter NICHT fängt" berichtigt und erweitert. **(5)** Sechs neue Gegenproben, darunter alle bisher unerreichten Untergrenzen. **(6)** `checkNoStoreReadback` in fünf Funktionen geschnitten, entlang der vom code-reviewer genannten Linien. **(7)** Neu am Gegenprobenwerk: `entfernt` (eine Datei **wegnehmen**) und `erwartet` (**woran** die Gegenprobe rot wird) |
| `docs/architektur.md` | „Warum vier und nicht zwei" → **fünf**; der Satz „über seinen Port oder gar nicht" gestrichen und durch das Gemessene ersetzt, mit V1b als Beleg und den drei Lücken daneben |
| `docs/datenmodell.md` | „mit **vier** Gegenproben" → „in **fünf Gestalten**", dazu die Unterscheidung, die der code-reviewer verlangt hat: die Gestalten messen den Baum in *einer* Prüfung, die zehn Gegenproben messen den Wächter |
| `.claude/team/reports/T-288-domain-dev.md` | Annahme 2 berichtigt (eigener Bericht, alter Wortlaut steht daneben) |

Kein Produktivcode, keine Migration, keine Prüfdatei, kein fremdes Papier angefaßt.
`docs/bedrohungsmodell.md`, `apps/local-api/test/**` und `docs/testplan.md` sind **gelesen und nicht
geändert**; Befunde daran stehen unten.

## 1. Der blockierende Befund — repariert und gegengeprobt

Die Lücke, vor der Reparatur nachgestellt:

```
Rumpf:   "\n  write(at: Date, opts: { force: boolean "
members: [ 'write' ]
fremd:   []            → Urteil GRÜN
```

`interfaceRumpf(code, name)` zählt jetzt öffnende und schließende Klammern und gibt `null` zurück,
wenn die Klammer nicht zugeht — ein **Fehlschlag der Messung**, den der Aufrufer als Befund meldet.
Die verlangte Signatur steht wörtlich als Gegenprobe (e):

```
write(at: Date, opts: { force: boolean }): Promise<void>;
read(): Promise<string | null>;
```

**Gegen die Reparatur gemessen, nicht nur daneben behauptet.** Ich habe den alten Ausdruck in einer
Kopie des Laufs wieder eingesetzt (`scripts/messung-t290.mjs`, für die Dauer eines Befehls, im
selben Befehl entfernt; `git status` danach unverändert): **42 bestanden, 1 fehlgeschlagen** — und
zwar genau Gegenprobe (e). Dasselbe Verfahren für alle fünf weiteren neuen Zweige:

| Mutation am Wächter | erwartet rot | gemessen |
|---|---|---|
| M1 Rumpf bricht wieder am ersten `}` | (e) Inline-Objekttyp | 42/1, nur (e) |
| M2 Gestalt 5 Obergrenze aus | (f) V1b | 42/1, nur (f) |
| M3 Gestalt 5 Untergrenze aus | (g) erlaubte Quelle fehlt | 42/1, nur (g) |
| M4 Gestalt 3 Untergrenze A aus | (h) tragende Datei verliert die Spalte | 42/1, nur (h) |
| M5 Gestalt 3 Untergrenze B aus | (i) tragende Datei nicht im Baum | 42/1, nur (i) |
| M6 Untergrenze der Gestalten 4/5 aus | (j) Ordner nicht im Baum | 42/1, nur (j) |

Jede Mutation trifft **genau eine** Gegenprobe. Damit ist nicht nur behauptet, daß die neuen Zweige
im Code stehen, sondern gemessen, daß sie tragen.

## 2. Die fünfte Gestalt (A-V-28) — und sie ist an V1b gemessen

`VERSION_FEATURE_IMPORTS` nagelt die Importquellen von
`apps/local-api/src/features/version/**` fest: `@takt/domain`, `hono`, `../../http/guards.ts`,
`../../http/problem.ts`, `../../logger.ts`, `./source.ts`, `./version.ts`. Gelesen wird über
`stripComments`; erfaßt werden `from '…'`, `import '…'`, `import('…')` und `require('…')` —
absichtlich zu weit, denn gegen eine Erlaubnisliste ist zu viel die sichere Richtung.

**Beide Richtungen**, wie bei den vier Spaltendateien: eine fremde Quelle ist ein Befund, und eine
erlaubte Quelle, die im Ordner nicht mehr vorkommt, ist auch einer.

**V1b live gemessen**, nicht nur eingesetzt — die Datei lag für die Dauer eines Befehls im Baum
(eigene Hoheit) und wurde im selben Befehl entfernt:

```
FEHL  kein Rückweg vom Bestand in die Versionsprüfung …
      apps/local-api/src/features/version/messung-v1b.ts: importiert `@takt/storage` — der Ordner
      des Prüfers hat genau 7 festgenagelte Importquellen, und ein zweiter Port ist der geliehene
      Rückweg (T-290, A-V-28)
42 bestanden, 1 fehlgeschlagen
```

Vor T-290 ließ dieselbe Datei den Lauf bei **37/0**.

## 3. Die drei Sätze, zurückgenommen auf das Gemessene

„Der Prüfer erreicht den Bestand über seinen Port oder gar nicht" steht an keiner der drei Stellen
mehr:

- **Begründung im Quelltext** (bei `DATABASE_MARKERS`): jetzt „Womit man eine Datenbank
  **unmittelbar** anfaßt" — mit dem Zeiger auf das, was sie nicht mißt, und auf
  `VERSION_FEATURE_IMPORTS`.
- **Ausgegebene Befundzeile**: „faßt mit `X` eine Datenbank **unmittelbar** an — im Ordner des
  Prüfers ist das verboten; daß er sich auch keine leiht, mißt Gestalt 5".
- **`docs/architektur.md`**: der alte Satz ist zitiert, die Rücknahme begründet, V1b als Beleg
  genannt und die Lücke daneben in denselben Absatz geschrieben.

Dazu eine vierte Stelle, die im Auftrag nicht stand und mir beim Nachlesen auffiel: die **grüne**
Zeile in Abschnitt 2 hieß „kein Rückweg vom Bestand in die Versionsprüfung — ein Programmstart prüft
immer einmal". Das ist die Zusage, die beim Grünsein gedruckt wird, und sie war die weiteste von
allen: Der Lauf mißt fünf Gestalten, nicht die Regel aus E-106. Sie heißt jetzt „… — fünf Gestalten
gemessen, die Lücken daneben stehen bei `checkNoStoreReadback`". Gesucht nach dem alten Wortlaut in
`git grep` **und** über `apps/*/src`, `packages/*/src`, `tests/`, `apps/*/test`: **genau ein**
Vorkommen, die Zeile selbst. Kein Prüffall, kein Papier hängt daran.

## 4. „Was dieser Wächter NICHT fängt" — zweimal berichtigt

- **Der Baum.** Nicht mehr „die `.sql`-Dateien unter `packages/storage/migrations/`", sondern:
  gelesen werden die acht `src`-Wurzeln und die zehn Einzeldateien; draußen liegen **jeder**
  `scripts/`-Baum (auch dieser Lauf selbst), `packages/ui-tokens/**`, `apps/web/public/**` (dort
  liegt mit `startup-appearance.js` ausgelieferter Laufzeitcode), `packages/storage/migrations/`
  **ganz** — auch eine `helper.ts` neben den Migrationen —, dazu Prüfordner und `dist/`.
- **„Irrtum und Bequemlichkeit".** Der Satz ist gestrichen und durch die Begründung ersetzt, warum
  er nicht trägt: V1b ist der **Form** nach Bequemlichkeit — ein Port, den es gibt, richtig
  benutzt — und ging trotzdem durch. Was gefangen ist, steht jetzt als Aufzählung der fünf
  Gestalten da, nicht als Haltung.
- **Neu benannt**, weil Gestalt 5 sie erzeugt: der **erlaubte Nachbar**. Gestalt 5 mißt die Menge
  der Quellen, nicht deren Inhalt — `guards.ts`, `problem.ts`, `logger.ts` und `@takt/domain`
  werden nicht weiterverfolgt. Heute trägt keiner von ihnen eine der fünf Marken (nachgemessen),
  morgen ist das eine Zeile in einer fremden Datei.
- Ebenfalls neu benannt, mit den Kennungen des security-checkers: **V2b** und **V11** bleiben grün
  und stehen dort jetzt beim Namen.

## 5. Der Schnitt, entlang der benannten Linien

`checkNoStoreReadback` (84 Zeilen, vier Durchläufe) ist fünf Funktionen geworden — die Linien sind
die des code-reviewers, die fünfte kam mit Gestalt 5 dazu:

| alt | neu |
|---|---|
| 764–770 | `findeLeserUeberDenPort(files)` |
| 781–801 | `findeSpaltennameAmPortVorbei(files)` |
| 810–818 | `findeDatenbankgriffImPrueferordner(ordner)` |
| — | `findeFremdeImporteImPrueferordner(ordner)` |
| 820–842 | `pruefeGestaltDesPorts(files)` |

`checkNoStoreReadback` verkettet die Rückgaben. **Verhaltensgleich**, wie angekündigt: Die beiden
frühen `return findings` wirkten schon vorher erst nach allen Durchläufen und sind zu lokalen
`return` geworden. Der lange Prosakopf blieb, wo er war; die Absatzüberschriften sind an ihre
Funktion gewandert. Eine bewußte Abweichung: Ist der Ordner des Prüfers **leer**, laufen die
Gestalten 4 und 5 gar nicht, und es steht **eine** Nachricht da statt sieben „Importquelle fehlt".

## 6. Die Untergrenzen haben jetzt Gegenproben — und das Werk dafür zwei neue Griffe

Vorher stand im Code, was beim Wegfallen rot werden sollte, aber **kein Verstoß erreichte diese
Zweige je** (Befund des code-reviewers zu Zeile 788 und 810). Nachgezogen sind vier:

- (g) eine erlaubte **Importquelle** kommt im Ordner nicht mehr vor,
- (h) eine tragende Datei **verliert die Spalte**,
- (i) eine tragende Datei **liegt nicht mehr im Baum**,
- (j) der **Ordner des Prüfers** liegt nicht im gelesenen Baum.

Dafür kann ein Verstoß seit T-290 auch **wegnehmen** (`entfernt`, Liste oder Prüfregel) und nicht
nur einsetzen — „die erlaubte Datei ist weg" läßt sich nicht einsetzen.

Und er kann sagen, **woran** er rot werden muß (`erwartet`). Das ist kein Schmuck: Bei M6 wurde die
Gegenprobe (j) ohne diesen Zusatz aus dem **falschen** Grund grün gemeldet — die sieben
„Importquelle fehlt" hätten gereicht, um `findings.length > 0` zu erfüllen, während der gemessene
Zweig ausgeschaltet war. Das ist T-143 S-1, eine Ebene höher. Gesetzt ist `erwartet` an allen zehn
Verstößen von `rueckweg`.

Aus demselben Grund tragen die beiden Verstöße, die `version.ts` **ersetzen** ((b) und (e)), deren
zwei ordnerinterne Importzeilen mit — sonst schlüge die Untergrenze von Gestalt 5 an und die
Gegenprobe wäre aus dem falschen Grund rot. Ein Satz im Quelltext sagt das, weil ein Streichen
dieser Zeilen die Gegenprobe stumpf machte, ohne rot zu werden.

## 7. Die Zahlen, vorgerechnet

| Abschnitt | Zählregel | vorher | nachher |
|---|---|---|---|
| 0 | feste `check(`-Aufrufe (6 × `stripComments` + 3) | 9 | **9** |
| 1 | je Prüfung je Verstoß, dazu 5 Nicht-Ausgänge | 13 + 5 = 18 | 19 + 5 = **24** |
| 2 | je `CHECKS`-Eintrag eine Zeile | 7 | **7** |
| 3 | feste `check(`-Aufrufe | 3 | **3** |
| **Summe** | | **37** | **43** |

**Woher die +6 kommen, einzeln:** Alle sechs liegen in Abschnitt 1 und alle sechs in der Prüfung
`rueckweg`, deren Verstoßliste von 4 auf 10 wächst — (e) Inline-Objekttyp, (f) V1b, (g) bis (j) die
vier Untergrenzen. Abschnitt 2 bewegt sich **nicht**: Er zählt je `CHECKS`-Eintrag, und `rueckweg`
bleibt ein Eintrag, auch mit fünf Gestalten darin. Dieselbe Rechnung wie bei 35 → 37 in T-288.

**Der ganze Lauf des Tores**, alle neun Stufen, Exit 0. Er ist **dreimal** gefahren, und der Grund
gehört dazu: Der erste Lauf begann, während ich noch zwei ausgegebene Sätze einkürzte, der zweite
lief vor einer letzten Umformatierung eines Kommentarblocks. Berichtet ist der **dritte**, der von
der ersten bis zur letzten Stufe gegen genau den abgelieferten Stand lief. Alle drei endeten mit
Exit 0 und mit denselben Zahlen.

| Stufe | Ergebnis |
|---|---|
| `typecheck` | grün, acht Pakete plus Prüfbäume plus `tests/e2e` |
| `boundaries` | grün |
| `contrast` | grün |
| `proof:all` | Exit 0, **0 rot**; darin `release-safety` **43/0** (vorher 37/0), `callers` 74/0, `layers` 36/0, `openapi` 115/0, `route-policy` 44/0, `foreign` 21/0, `addin` 248/0 und 19/0, `migrations` 44 Datei(en) unverändert |
| `verify:bundle` | grün |
| `test:coverage` | 90 Dateien, **1696 bestanden**, 3 übersprungen, 0 rot |
| `test:rust` | ok, 68 bestanden, 0 fehlgeschlagen, 1 übersprungen |
| `build` | grün |
| `audit` | „No known vulnerabilities found" |

Kein Prüflauf außer `release-safety` hat sich bewegt — erwartet, weil kein Produktivcode und keine
Prüfdatei angefaßt wurde.

## Annahmen

1. **Die Erlaubnisliste enthält auch die ordnerinternen Quellen** (`./source.ts`, `./version.ts`).
   Sie messen nichts gegen den Rückweg, aber ihr Fehlen ist derselbe stumme Zustand wie bei einer
   fehlenden Spaltendatei: Wer den Ordner umbaut, bestätigt es hier. Der Preis ist bekannt und
   gewollt (E-103) — und bei (b)/(e) im Quelltext benannt.
2. **`importQuellen` ist absichtlich zu weit gefaßt** (jedes `from '…'` im entkommentierten Code
   gilt als Importquelle). Gegen eine Erlaubnisliste ist ein falsches Rot der billigere Fehler;
   ein falsches Grün wäre ein geliehener Port, den niemand sieht.
3. **Der Ordner hat heute drei Dateien, acht Importzeilen, sieben Quellen.** A-V-28 nennt „sieben
   Importzeilen aus sechs Quellen" und „vier Dateien"; die **Aufzählung** dort ist vollständig und
   richtig, die drei **Zahlen** sind es nicht. Ich habe nachgezählt, meine Zahl in den Quelltext
   geschrieben und den Unterschied dort benannt. Das Papier gehört dem security-checker — ich habe
   es nicht angefaßt (Befund T-290-1).
4. **Der leere Ordner unterdrückt die Gestalten 4 und 5.** Ohne das stünden bei (j) acht Befunde,
   von denen sieben Folgeschäden sind. Der Zustand selbst ist als eigener Befund benannt.
5. **Die Meßdateien lagen in eigener Hoheit**, jede für die Dauer eines Befehls, jede im selben
   Befehl entfernt (`messung-v1b.ts` unter `features/version/`, `messung-t290.mjs` unter
   `scripts/`). Dieselbe Annahme wie in T-288 und T-287; `git status` ist danach unverändert.

## Risiken

1. **Die Importliste ist ein Umzugshindernis, und diesmal ein feineres als die Spaltendateien.**
   Wer im Prüferordner eine Datei anlegt, die aus einem neuen Nachbarn importiert, sieht Rot — auch
   wenn der Nachbar mit dem Bestand nichts zu tun hat. Gewollt (der Punkt von A-V-28), aber der
   Preis fällt in **meiner** Datei an, während der Anlaß im Merkmal liegt: zwei Hoheiten, eine
   Welle. Das ist derselbe Nachsatz, den der security-checker unter T-289-2 gemacht hat.
2. **Gestalt 5 mißt Namen von Quellen, nicht deren Inhalt.** Ein erlaubter Nachbar, der selbst
   einen Bestandszugriff bekommt, ist die nächste Lücke. Sie steht im NICHT-fängt-Absatz, und sie
   ist die ehrlichste Stelle dieses Laufs: Die Zusage wandert schneller als die Messung.
3. **V2b und V11 bleiben grün.** Beide brauchen zwei Dateien und eine neue Kante zwischen zwei
   Merkmalen; `proof:layers` sieht die Kante, aber nicht ihren Zweck. Kein Gegenmittel gebaut, weil
   keines bestellt war — benannt ist es.
4. **Kein Sicherheitsrisiko hinzugefügt.** Kein Produktivpfad, kein Netzweg, keine Route berührt.

## Offene Fragen an den Orchestrator

- **T-290-1, an den security-checker:** In A-V-28 (38.7) stehen drei Zahlen, die ich anders messe —
  **drei** Dateien statt vier, **acht** Importzeilen statt sieben, **sieben** Quellen statt sechs
  (die Aufzählung im selben Satz nennt sieben). Die Auflage ist davon nicht betroffen, der Stand
  daneben schon. `docs/bedrohungsmodell.md` gehört ihm; ich habe die gemessenen Zahlen im Quelltext
  vermerkt.
- **A-V-28 gilt damit als erfüllt** — fünfte Gestalt gebaut, beide Richtungen, Gegenprobe ist V1b
  und sie ist **live** gemessen. Ob 37.8/38.7 das nachtragen, entscheidet der security-checker.
- **`docs/testplan.md` und `apps/local-api/test/**` nennen die Prüfzahl nicht** (gesucht über
  `git grep` und über den Arbeitsbaum). Falls doch ein Prüffall die 37 festhält, gehört er dem
  unit-tester.
- **T-289-4 (R-23 und R-24 nie bewertet)** bleibt offen; es ist die sechste Meldung und nicht meine
  Fläche.

## Nächster Schritt

Freigabe durch code-reviewer und security-checker. Für den code-reviewer ist die interessante
Frage, ob `erwartet` an **allen** Gegenproben stehen sollte statt nur bei `rueckweg` — die sechs
übrigen Prüfungen haben zusammen neun Verstöße, und für jeden gilt dasselbe Argument. Für den
security-checker: ob Gestalt 5 an der Menge der Quellen die richtige Grenze zieht oder einen Schritt
zu früh aufhört — der erlaubte Nachbar ist die nächste Tür, und sie ist heute zu, weil niemand sie
gebraucht hat.
