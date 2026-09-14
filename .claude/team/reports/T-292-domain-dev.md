# T-292 — Der Wächter liest die Schnittstelle jetzt mit dem Compiler

Aufgabe: T-292 — dritte Runde an `apps/local-api/scripts/proof-release-safety.mjs`
(code-reviewer T-291: Nacharbeit, zwei blockierende Befunde zu `:1030` und `:816`, dazu zwei
`mittel` und drei `niedrig`)
Status: **fertig, braucht Review**

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/scripts/proof-release-safety.mjs` | **(1)** `interfaceRumpf` + Mitgliederregel sind weg; `portMitglieder` liest mit `typescript`. **(2)** Untergrenze der Gestalt 2: null gelesene Mitglieder ist rot. **(3)** Sechs neue Gegenproben bei `rueckweg` (10 → 16 Einträge). **(4)** `adressen` und `optionen` haben je zwei Einträge mit je einem `erwartet` — die beiden `mittel`-Befunde. **(5)** Befundsatz der Gestalt 5 nach Quelle getrennt (`niedrig`, :1002). **(6)** `catch` nennt den Abbruch, bevor die Bilanz gedruckt wird (`niedrig`, :1431) |
| `docs/architektur.md` | „zehn Gegenproben" → **sechzehn**; ein Absatz, warum die Gestalt 2 vom Compiler gelesen wird; „acht `src`-Wurzeln" → „**und der zehn gelesenen Einzeldateien**" (`niedrig`, T-291) |
| `docs/datenmodell.md` | „**zehn** Gegenproben" → **sechzehn**, mit dem Grund der sechs neuen in einem Satz |

Kein Produktivcode, keine Migration, keine Prüfdatei, kein fremdes Papier.
`docs/bedrohungsmodell.md`, `docs/testplan.md` und `apps/local-api/test/**` sind **gelesen und
nicht geändert**. `typescript` steht bereits als Entwicklungsabhängigkeit in
`apps/local-api/package.json` (^5.9.3) — **kein Eintrag für den Orchestrator nötig**.

## 1. Der Umstieg, und warum kein sechster Ausdruck

Der code-reviewer hat zweimal an derselben Stelle blockiert, beide Male mit einer Zeile im
Hausstil dieser Datei. Der Grund war nicht der jeweilige Ausdruck, sondern die Bauart:

| Fassung | Blind gegen | Befund |
|---|---|---|
| `\{([^}]*)\}` | Inline-Objekttyp in der Signatur | T-289 |
| gezählte Klammern | `}` **in einer Zeichenkette** | T-291 :816 |
| `/(\w+)\s*\(/` als Mitgliederregel | jede Eigenschaftsschreibweise, u. a. `readonly read: () => …` | T-291 :1030 |

Gelesen wird jetzt mit `ts.createSourceFile`, genau wie in `caller-scan.mjs` und
`proof-route-policy.mjs` im selben Ordner und in `proof-foreign.mjs` / `proof-surface.mjs`
daneben — kein eigener Stil für dieselbe Sache. `portMitglieder(quelltext, name, dateiname)`
gibt die Mitgliedsnamen zurück, `null` bei einem **Meßfehlschlag**.

Drei Entscheidungen daran, alle im Quelltext begründet:

- Gelesen wird der **ungekürzte** Quelltext, nicht `stripComments`. Der Compiler wirft
  Kommentare selbst weg, und zwar richtig.
- **Ein Mitglied ohne einfachen Namen** (Indexsignatur, Rufsignatur, berechneter Name) bekommt
  seine Art als Namen und gilt damit als **fremd**. Wenn der Leser etwas sieht, das er nicht
  benennen kann, ist Rot die sichere Richtung.
- Angenommen wird **auch** `type X = { … }`. Wer die Schnittstelle in einen Alias umschreibt,
  soll denselben Wächter treffen und nicht einen Meßfehlschlag. Das ist ein **neuer Zweig**,
  und er hat deshalb seine eigene Gegenprobe (siehe M4) — ein neuer Zweig ohne Gegenprobe wäre
  in dieser Datei der schlechteste aller Beiträge.

**Die Untergrenze, die allen drei Ausfällen gemeinsam war.** Jedesmal fand der Leser **null**
Mitglieder und meldete grün: „kennt außer `write` nichts" war wahr, *weil nichts gesehen wurde*.
`pruefeGestaltDesPorts` unterscheidet seit T-292 „nichts gefunden" von „nichts gesehen" und ist
im zweiten Fall rot. Positiv gegengemessen am echten Baum: Der Leser liefert für
`VersionCheckStorePort` heute `['write']` und für `VersionCheckerOptions`
`['logger','now','source','startDelayMs','intervalMs','minIntervalMs','store','random']` — er
sieht also wirklich etwas und ist nicht aus Versehen leer.

Das ist dieselbe Regel wie bei den acht Quellordnern (`mindestens`), den vier Spaltendateien,
der Importliste und der Baumgröße (`tree.length > 100`) — nur eine Ebene tiefer.

## 2. Die drei vorgegebenen Gegenproben, wörtlich

| Gegenprobe | heute |
|---|---|
| `readonly read: () => Promise<string \| null>;` neben `write(at: Date): Promise<void>;` | **rot** ✔ |
| `write(at: Date, mode: '}' \| 'x')` mit `}` in der Zeichenkette, `read()` daneben | **rot** ✔ |
| (e) Inline-Objekttyp (aus T-290) | **rot** ✔ (unverändert) |
| mehrzeilige Signatur (aus T-290, bisher **keine** Gegenprobe) | **rot** ✔, jetzt als Eintrag |

Dazu zwei, die ich ergänzt habe, weil sonst ein Zweig ungemessen bliebe: der **Typalias** (neuer
Zweig von mir) und die **Untergrenze** (kein einziges gelesenes Mitglied). Der Vollständigkeit halber: (p), die ordnerinterne Quelle, kommt aus dem `niedrig`-Befund zu :1002.

## 3. Elf Mutationen, jede in einer Kopie des Laufs gefahren

Verfahren wie in T-288 und T-290: Kopie unter `apps/local-api/scripts/messung-t292.mjs` (eigene
Hoheit), je ein Zweig aus, im selben Befehl entfernt. `git status` danach unverändert.

| Mutation | Bilanz | rot wurde |
|---|---|---|
| M1 der Leser aus T-290 zurück (Klammerzählung + Mitgliederregel) | **48/3** | (k) Eigenschaft, (l) `}` in Zeichenkette, (n) Typalias |
| M2 Untergrenze der Gestalt 2 aus | 50/1 | nur (o) „kein einziges gelesenes Mitglied" |
| M3 Eigenschaften wieder unsichtbar (`!isPropertySignature`) | 50/1 | nur (k) |
| M4 Zweig für den Typalias aus | 50/1 | nur (n) |
| M5 `FORBIDDEN_IN_SOURCE = []` | 50/1 | nur `optionen`/`.json()` |
| M6 `REQUIRED_IN_SOURCE = []` | 50/1 | nur `optionen`/Zusagen |
| M7 Zweig „dritte Adresse auf github.com" entfernt | 50/1 | nur `adressen`/dritte Adresse |
| M8 Zweig „nennt api.github.com außerhalb" entfernt | 50/1 | nur `adressen`/Wirt |
| M9 Trennung nach Quelle in Gestalt 5 aus | 50/1 | nur (p) ordnerinterne Quelle |
| M10 erzwungener Absturz nach Abschnitt 1 | — | `stdout` sagt jetzt `ABGEBROCHEN: …` **vor** der Bilanz, Exit 1 |
| M11 die acht neuen Verstoßeinträge herausgefiltert, Leser und Untergrenze bleiben | **43/0** | nichts — die Zahl aus T-290, siehe Abschnitt 4 |

**M5 und M7 sind wörtlich die beiden `mittel`-Befunde des code-reviewers.** Beide ließen den
Lauf vorher bei 43/0; beide sind jetzt genau eine rote Zeile, und es steht dran, welcher Zweig
fehlt.

**M1 ist die einzige Mutation, die mehr als eine Gegenprobe dreht — mit Absicht.** Sie tauscht
nicht einen Zweig, sondern den ganzen Leser. Die drei, die sie dreht, haben je ihre eigene
Einzelmutation (M3, M4) oder sind gegen genau diesen Rückbau gesetzt (l). **Was ich dazusage:
die mehrzeilige Signatur dreht keine der elf Mutationen** — sie ist ein Merkposten gegen den
vierten Anlauf mit einem regulären Ausdruck, kein eigener Zweig, und das steht auch so im
Quelltext daneben. Eine Gegenprobe, die nichts mißt, will ich nicht als eine verkaufen, die
etwas mißt.

## 4. Die Zahl, von unten vorgerechnet — und was den Umstieg angeht

**Der Umstieg auf den Compiler bewegt die Zahl nicht.** Er ändert, *wie* Gestalt 2 ihre
Mitglieder liest, nicht *wie viele* Prüfzeilen gedruckt werden: `pruefeGestaltDesPorts` bleibt
ein Aufruf in einem `CHECKS`-Eintrag, und Abschnitt 2 zählt je Eintrag eine Zeile.

**Gemessen, nicht gerechnet (M11):** In einer Kopie des abgelieferten Standes — Compiler drin,
Untergrenze drin, Befundsatz getrennt, aber die acht in T-292 dazugekommenen Verstoßeinträge
herausgefiltert — läuft der Lauf **43 bestanden, 0 fehlgeschlagen**, also zeichengleich die Zahl
aus T-290. Die **+8** kommen ausschließlich aus Abschnitt 1 und alle aus neuen
Verstoßeinträgen.

| Abschnitt | Zählregel im Code | gerechnet | gemessen |
|---|---|---|---|
| 0 | 6 × `stripComments` + 3 feste | 9 | **9** |
| 1 | je `CHECKS`-Eintrag je Verstoß (2+1+1+1+4+2+**16**) + 5 Nicht-Ausgänge | 27 + 5 = 32 | **32** |
| 2 | je `CHECKS`-Eintrag eine Zeile | 7 | **7** |
| 3 | feste `check(`-Aufrufe | 3 | **3** |
| **Summe** | | **51** | **51** |

**Die +8 einzeln, alle in Abschnitt 1:**

| | vorher | nachher | woher |
|---|---|---|---|
| `adressen` | 1 | 2 | derselbe Verstoß zweimal, je ein `erwartet` (Befund :1084) |
| `optionen` | 1 | 2 | derselbe Verstoß zweimal, je ein `erwartet` (Befund :1122) |
| `rueckweg` | 10 | 16 | (k) Eigenschaft, (l) `}` in Zeichenkette, (m) mehrzeilig, (n) Typalias, (o) Untergrenze, (p) ordnerinterne Quelle |

Abschnitt 2 bewegt sich **nicht**: Er zählt je `CHECKS`-Eintrag, und die drei Prüfungen bleiben
je ein Eintrag. Dieselbe Rechnung wie 35 → 37 (T-288) und 37 → 43 (T-290).

## 5. Warum zwei Einträge auf **einer** eingesetzten Datei kein Doppel sind

Das ist die Form, in der ich die beiden `mittel`-Befunde erledigt habe, und sie ist die
allgemeine Antwort auf „ein Verstoß, zwei unabhängige Zweige":

`erwartet` kann immer nur **einen** Zweig festnageln. Setzt man es an den einen Eintrag, wird der
andere Zweig ungemessen — man hat den Befund erledigt und einen neuen erzeugt. Wer beide behalten
will, schreibt denselben Verstoß zweimal hin, mit je einem `erwartet`. M7 und M8 zeigen, daß das
trägt: Jeder der beiden Zweige von `checkAddresses` dreht genau seine Gegenprobe, M5 und M6
dasselbe für `checkFetchOptions`.

Ein contrivierter zweiter Verstoß wäre hier der schlechtere Weg gewesen: Der Zweig „nennt
`api.github.com` außerhalb der einen Stelle" ist praktisch **nicht allein** auszulösen — jede
Zeichenkette mit dem Wirt trifft auch „dritte Adresse". Zwei Einträge auf derselben Zeile messen
genau, was sie sollen, ohne eine Datei zu erfinden, die es so nie gäbe.

## 6. Die drei `niedrig`-Befunde

- **:1002 (Befundsatz der Gestalt 5) — erledigt.** Eine Quelle mit `./` kann den Ordner nicht
  verlassen und ist nie ein geliehener Port. Rot bleibt beides (die Erlaubnisliste ist zu
  bestätigen, nicht nachzuziehen), der Satz nennt jetzt den Umzug. Neuer Zweig ⇒ neue Gegenprobe
  (p) ⇒ eigene Mutation (M9).
- **:1431 (`finally` druckt die Bilanz auch nach einem Wurf) — erledigt.** Der `catch` schreibt
  `ABGEBROCHEN: <Grund>` und „Die Bilanz unten ist damit unvollständig", dann wirft er weiter.
  Gemessen (M10): `stdout` endet mit `ABGEBROCHEN: …` über der Bilanz, Exit 1.
- **`docs/architektur.md:1464` (acht Wurzeln, aber auch zehn Einzeldateien) — erledigt.**

## Annahmen

1. **`type X = { … }` wird angenommen, alles andere ist `null`.** Ein Alias auf `Omit<…>` oder
   eine Vereinigung ist ein Meßfehlschlag und damit rot. Der Leser soll nicht so tun, als kenne
   er einen Typ, den er nicht auflöst — dieselbe Haltung wie in `buildTypeIndex` in
   `caller-scan.mjs`.
2. **Gelesen wird `file.source`, nicht `file.code`.** Nur bei Gestalt 2; die vier anderen
   Gestalten arbeiten weiter auf dem entkommentierten Text. Ein Grund mehr, es hier so zu tun:
   Der Compiler ist der einzige Leser in dieser Datei, der Kommentare korrekt von Zeichenketten
   trennen kann.
3. **Ein Syntaxfehler in `version.ts` wird nicht eigens gemeldet.** `ts.createSourceFile` liefert
   dann einen unvollständigen Baum; findet es die Schnittstelle nicht, ist das rot. Auf
   `parseDiagnostics` greife ich nicht zu — das ist keine zugesagte Schnittstelle. Vor diesem
   Lauf steht ohnehin `typecheck` im Tor.
4. **Die `erwartet`-Ausweitung auf die übrigen sieben Verstöße habe ich nicht angefaßt** —
   ausdrücklich nicht in diesem Auftrag. `adressen` und `optionen` sind drin, weil sie die beiden
   gemessenen `mittel`-Befunde sind.
5. **Die Meßkopie lag in eigener Hoheit**, je für die Dauer eines Befehls, je im selben Befehl
   entfernt. Dieselbe Annahme wie in T-288 und T-290.

## Risiken

1. **Ein Werkzeug mehr in einem Prüflauf.** `proof:release-safety` hängt jetzt an `typescript`.
   Das Paket steht bereits in `apps/local-api/package.json` und wird von zwei Nachbarläufen im
   selben Ordner benutzt; das Risiko ist eine gemeinsame Fassung, kein neuer Bezug. Der Gewinn
   ist, daß dieser Lauf aufhört, TypeScript nachzubauen.
2. **Der Compiler sieht die Schreibweise, nicht den Sinn.** Ein `write`, das in Wahrheit liest
   (`write(at: Date): Promise<string | null>`), bleibt grün — Gestalt 2 mißt Namen und Zahl der
   Mitglieder, nicht Rückgabetypen. Das ist dieselbe Grenze wie bei Gestalt 5 (Menge der Quellen,
   nicht deren Inhalt) und steht im NICHT-fängt-Absatz benachbart. Kein Gegenmittel gebaut, weil
   keines bestellt war.
3. **Die mehrzeilige Gegenprobe mißt keinen eigenen Zweig** (oben benannt). Sie kostet eine Zeile
   und ist ein Merkposten; wer sie streicht, verliert nichts Gemessenes.
4. **Teilweises Leeren der beiden Markenlisten bleibt ungemessen.** M5 und M6 fangen das
   **vollständige** Leeren. Wer `FORBIDDEN_IN_SOURCE` auf `['.json()']` kürzt, verliert drei
   Marken, ohne daß eine Gegenprobe anschlägt — dafür bräuchte jede Marke ihren eigenen Eintrag,
   so wie `ausgang` seine vier Schreibweisen einzeln hat. Steht als Satz im Quelltext bei
   `optionen`; gehört in den Auftrag zu den übrigen sieben Verstößen.
5. **Kein Sicherheitsrisiko hinzugefügt.** Kein Produktivpfad, kein Netzweg, keine Route berührt.

## Offene Fragen an den Orchestrator

- **T-290-1 steht unverändert, an den security-checker:** A-V-28 (38.7) nennt „vier Dateien,
  sieben Importzeilen, sechs Quellen"; gemessen sind **drei / acht / sieben** (die Aufzählung im
  selben Satz nennt sieben). `docs/bedrohungsmodell.md` gehört ihm — **gemeldet, nicht geändert**.
  Die gemessenen Zahlen stehen im Quelltext des Laufs.
- **Die übrigen sieben Verstöße ohne `erwartet`** (`felder`, `oeffnen`, `download`, vier ×
  `ausgang`) sind nicht angefaßt. Dazu kommt, was mir beim Zählen aufgefallen ist und nicht
  Gegenstand dieses Auftrags war: `checkAddresses` hat **fünf** Zweige, von denen drei gar keine
  Gegenprobe haben (Abfrageadresse am falschen Ort, Release-Adresse am fremden Ort, `apiCount !==
  1`), und `checkFetchOptions` hat mit `${API_URL_FILE} fehlt` eine **Untergrenze** ohne
  Gegenprobe. Beides gehört in denselben Auftrag wie die sieben — es ist dieselbe Frage („wie
  viele unabhängige Zweige hat diese Prüfung überhaupt"), und sie bewegt die Prüfzahl erneut.
- **Die Prüfzahl steht heute bei 51** (vorher 43). `docs/testplan.md` und `apps/local-api/test/**`
  nennen sie nicht — gesucht über `git grep` **und** über `apps/*/src`, `packages/*/src`,
  `tests/`, `apps/*/test`.
- **T-289-4 (R-23 und R-24 nie im Bedrohungsmodell bewertet)** bleibt offen; nicht meine Fläche.

## Der Torlauf

`pnpm check`, alle neun Stufen, **Exit 0**, einmal von der ersten bis zur letzten Stufe gegen
genau den abgelieferten Stand.

| Stufe | Ergebnis |
|---|---|
| `typecheck` | grün |
| `boundaries` | grün |
| `contrast` | grün |
| `proof:all` | Exit 0, 0 rot; darin `release-safety` **51/0** (vorher 43/0), `callers` 74/0, `layers` 36/0, `openapi` 115/0, `route-policy` 44/0, `foreign` 21/0, `surface` 27/0, `addin` 248/0 und 19/0, `codepoints` 46/0, `access` 109/0, `export` 98/0 |
| `verify:bundle` | grün |
| `test:coverage` | 90 Dateien, **1696 bestanden**, 3 übersprungen, 0 rot |
| `test:rust` | ok, 68 bestanden, 0 fehlgeschlagen, 1 übersprungen |
| `build` | grün |
| `audit` | „No known vulnerabilities found" |

Kein Prüflauf außer `release-safety` hat sich bewegt — erwartet, weil kein Produktivcode und
keine Prüfdatei angefaßt wurde.

## Nächster Schritt

Freigabe durch code-reviewer und security-checker. Für den code-reviewer ist die kurze Frage, ob
„derselbe Verstoß zweimal, je ein `erwartet`" die Form ist, in der auch die übrigen sieben
Verstöße ihre Zweige bekommen sollen — dann ist der Folgeauftrag mechanisch und die Zahl der
Zweige vorher abzählbar. Für den security-checker: ob A-V-28 die drei Zahlen nachzieht und ob
Gestalt 2 mit „Namen und Zahl der Mitglieder" die richtige Grenze zieht oder ob der Rückgabetyp
dazugehört.
