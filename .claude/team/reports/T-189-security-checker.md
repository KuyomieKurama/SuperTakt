# T-189 — Die dritte und die vierte Umgehung, und ein Wächter der Barrierefreiheit, der die Hälfte nicht ansieht

**Aufgabe:** T-189 (Welle AB) — Nachmessung A-A-37/A-A-38 (entscheidet die Abnahme von Punkt 1
aus T-183) und O-GH.
**Status:** fertig
**Dateien:** `docs/bedrohungsmodell.md` (neuer Abschnitt 25), diese Datei. **Kein Produktivcode
angefaßt**, keine Kunstquelle im Baum, keine Prüfdatei berührt.

## Urteil je Punkt

| Punkt | Urteil |
|---|---|
| **1 — A-A-37 und A-A-38 in gebauter Form** | **abnahmefähig** — elf von elf Verstümmelungen bestätigt, drei Kunstquellen rot |
| **1a — dritter Weg aus dem Takt?** | **ja, und es sind zwei** — T-189-1 und T-189-2, beide **muß** |
| **2 — O-GH** | **Nacharbeit in der zweiten Richtung** — T-189-5 bis T-189-7 |
| **E-088 Punkt 4** | **wird nicht frei** — Begründung unten |

## Wie gemessen wurde

Spiegel unter `/tmp/t189-spiegel` mit der Verzeichnisform, die `proof-shell-surface.mjs` erwartet:
`src-tauri/src` als echte Kopie, `capabilities`, `tauri.conf.json`, `apps/web/src`, `build-app.mjs`
und `packages/domain/src/version.ts` als Verweise. **`diff` gegen den Bestandslauf ohne Ausgabe** —
beide Code 0, beide **6 Prüfungen und 28 Gegenproben, 0 blind**, 44 Zeilen zeichengleich. Alle
Kunstquellen und Verstümmelungen sind dort entstanden und dort geblieben.

`proof:all` **nicht** gefahren (E-083 Punkt 3). Guardian und 42Crunch **nicht** erneut versucht
(E-079 Punkt 3). Lieferkette nicht erneut gemessen (E-079, T-B06).

## Punkt 1 — die Nachmessung

### Elf Verstümmelungen, elf Treffer, jede Zahl gleich

Jede als Textersatz an genau einer Stelle, einzeln gefahren, danach zurückgesetzt. Gegen die
Tabelle aus `.claude/team/reports/T-173-3-frontend-dev.md`:

| | gemeldet | gemessen |
|---|---|---|
| A Ausschluß bis Dateiende | 0 rot, 2 blind | **stimmt** |
| B Ende an der ersten Klammer | 1 rot, 1 blind | **stimmt** |
| C Klammern in Zeichenketten | 0 rot, 1 blind | **stimmt** |
| D Klammern in Kommentaren | 1 rot, 1 blind | **stimmt** |
| E Weigerung ausgebaut | 0 rot, 3 blind | **stimmt** |
| F Attribut auf `any(test, …)` | 0 rot, 1 blind | **stimmt** |
| G Weigerung auf dem Urtext | 1 rot (falscher Alarm) | **stimmt** |
| **H `#+` statt `#*`** | 0 rot, 1 blind | **stimmt** — A-A-38 |
| **I `b?` gestrichen** | 0 rot, 1 blind | **stimmt** — A-A-38 |
| **J `stripRustStrings` ohne Zeichenliteral** | 0 rot, 2 blind | **stimmt** — Zeichenliteral-Gegenprobe und die „ohne rohe Zeichenkette" |
| **K `stripRustComments` mit Fahne** | 0 rot, 2 blind | **stimmt** — Kommentar-Gegenprobe und dieselbe |

Nicht nur die Zahlen, auch **welche** Gegenprobe blind wird, stimmt in allen elf Fällen.

### Die drei Kunstquellen aus Abschnitt 24

| Kunstquelle | T-183 | jetzt |
|---|---|---|
| 24.1.2 `'"'` + `r#"a"b"#` + vierter Aufrufort | grün, 6/25/0 | **Code 1, Weigerung** |
| 24.1.2 mit fremder Adresse statt Aufrufort | grün | **Code 1, Weigerung** |
| 24.1.3 geschachtelter Blockkommentar | grün | **Code 1, Weigerung** |

Kein falscher Alarm auf `appdata.rs`. **A-A-37 und A-A-38 sind erfüllt.**

## Punkt 1a — die Frage zum dritten Mal: ja, zweimal

### T-189-1 (muß) — `cr"…"` / `cr#"…"#`, die rohe C-Zeichenkette

Rust ≥ 1.77. `RAW_STRING_OPENER = /\bb?r#*"/` (`apps/desktop/scripts/proof-shell-surface.mjs:395`)
verlangt eine Wortgrenze vor `b?r` — vor dem `r` in `cr` steht mit `c` ein Wortzeichen, also keine
Grenze. Beide Textwerkzeuge kennen die rohe Form ohnehin nicht.

Gemessen mit einer Kunstquelle aus `cr#"a"b"#` im Prüfmodul und einem vierten Aufrufort samt
fremder Adresse dahinter: **grün, Beendigungscode 0, 6 Prüfungen und 28 Gegenproben, 0 blind.**
`RAW_STRING_OPENER` trifft **weder Urtext noch Gerüst** (`false`/`false`); im Gerüst ist alles ab
`cr#"` Zeichenkettenrumpf. Dieselbe Wirkung mit `cr"C:\Users\Public\"`. Zeichengleiche Bauart wie
Befund T-183-2, einen Buchstaben weiter.

### T-189-2 (muß) — das Zeichenliteral mit Fluchtfolge, **ohne jede rohe Zeichenkette**

`/^'(\\.|[^'\\])'/` (`:285` und `:365`) kennt nur einzeichige Rümpfe. `'\x22'` und `'\u{22}'` sind
gültige Schreibweisen für `"` und werden **nicht** getroffen; beide Apostrophe bleiben stehen, der
schließende paart sich mit dem nächsten zu einem Scheinliteral, und die folgende Anführung öffnet
eine Zeichenkette, die nie zugeht.

Die ganze Kunstquelle ist eine Zeile:

```rust
pub const TRENNER: [char; 2] = ['\u{22}','"'];
```

Dahinter ein vierter Aufrufort für `open` und `https://boese.example/x`: **grün, Code 0, 6/28/0.**
**Der Riegel A-A-33/37/38 liegt hier neben der Tür** — er schaut nur auf rohe Zeichenketten, und in
der Datei steht keine.

Auslöser genau bestimmt: Hinter dem schließenden Apostroph muß mit **genau einem** Zeichen Abstand
ein weiterer folgen. `['\u{22}','"']` blind, `['\u{22}', '"']` sichtbar;
`matches!(c, '\u{201C}'|'"')` blind, mit Leerzeichen sichtbar. **`cargo fmt` wird nirgends
erzwungen** (weder `package.json` noch `.github/workflows/`) — auf diese Abwesenheit läßt sich
keine Zusage stützen. Nähe zum Bestand: `attachment.rs:594` schreibt bereits
`"https://exam\u{200b}ple.org/"` und `"https://example.org/\u{202e}gpj.exe"` — dieselbe Fluchtfolge,
nur in einer Zeichenkette.

### Die allgemeine Eigenschaft — gesucht, gemessen, verworfen

„Weigere dich, wenn ein Werkzeug die Datei nicht neutral verläßt (offene Zeichenkette,
`blockDepth > 0`)": über alle acht Rust-Dateien des Bestands **und alle sechs Kunstquellen**
neutral. Die Anführungen gehen jedes Mal zufällig auf. **Gemessener Fehlschlag, kein Vorschlag.**

### Was statt dessen trägt — beides gemessen

**A-A-41:** Die Weigerung erkennt die Bauart statt einer Präfixliste. In Rust berührt ein
Bezeichner eine Anführung nur als Literalpräfix, und die rohe Form ist die, deren Präfix auf `r`
endet:

```js
/(?<![A-Za-z0-9_])[A-Za-z_][A-Za-z0-9_]*?r#*"|(?<![A-Za-z0-9_])r#*"/
```

Gemessen: **kein falscher Alarm** über alle acht Rust-Dateien (auch nicht auf `attachment.rs:531`
und `:594`, die `b""` tragen), und **alle sechs** Formen getroffen — `r"…"`, `r#"…"#`, `br"…"`,
`br#"…"#`, `cr"…"`, `cr#"…"#`.

**A-A-42:** Rusts Fluchtfolgen-Grammatik ist geschlossen, also ist die vollständige Aufzählung
möglich — an **beiden** Stellen, damit die Werkzeuge nicht wieder auseinanderlaufen:

```js
/^'(\\u\{[0-9a-fA-F]{1,6}\}|\\x[0-9a-fA-F]{2}|\\.|[^'\\\n])'/
```

Gemessen: `'a'`, `'\n'`, `'\0'`, `'\''`, `'\"'` unverändert getroffen; `'\x22'`, `'\u{22}'`,
`'\u{1F600}'` neu getroffen; ein unabgeschlossenes `'a` weiterhin nicht.

**A-A-43** ist die offene Entscheidung: voller Zerleger oder nicht. Vier Wege in drei Wellen.

## Punkt 2 — O-GH

**240 Paare × 2 Modi = 480.** Gemessen gegen `apps/web/src/styles/{app,base,components,showcase}.css`
und jedes `var(--…)` in den `.ts`/`.tsx` unter `apps/web/src`, getrennt nach Vordergrund- und
Flächeneigenschaft. 222 Token deklariert, 69 von Paaren genannt, 143 von Klassen gezeichnet.

### Erste Richtung: **0 von 480** — mit einer Einschränkung, die dazugehört

Kein Paar nennt einen Token, den keine Klasse zeichnet. Der Anlaßfall ist behoben:
`--accent-border-subtle` steht seit dem Nachtrag selbst in der Liste
(`apps/web/scripts/contrast-check.mjs:400`, als `exempt`).

**Die Null ist tokengenau, nicht flächengenau, und damit eine Untergrenze.** Der Anlaßfall war
richtiger Token, falsche Fläche — diese Messung hätte ihn nie gefunden.

### Zweite Richtung, die gefährlichere: **15 Token gezeichnet, kein Paar**

Vier ohne Kontrastfrage (`--shadow-xs/sm/lg`, `--bg-scrim`). Elf gemessen, hell und dunkel, mit
derselben Rechnung wie der Lauf:

| Token / Ort | gegen | hell | dunkel |
|---|---|---:|---:|
| `--danger-bg-hover` `.btn--danger:hover` (`components.css:100`) | `--text-on-solid` | 9,00 | 11,45 |
| `--danger-bg-active` (`:105`) | `--text-on-solid` | 11,52 | 14,84 |
| `--focus-ring-contrast` `.on-solid:focus-visible` (`base.css:186`) | `--accent-bg` | 5,98 | 6,26 |
| `--note-billing-bg` (`:1387`) | `--text-primary` | 15,76 | 14,64 |
| `--status-exported-border` (`:397`) | `--bg-surface` | 8,93 | 11,41 |
| `--success-border` (`:538`) | `--bg-surface` | 1,50 | 2,04 |
| `--danger-border` (`:548`) | `--bg-surface` | 1,66 | 1,79 |
| `--note-internal-border` (`:1319`) | `--bg-surface` | 1,46 | 1,57 |
| `--note-billing-border` (`:1325`) | `--bg-surface` | 1,53 | 1,98 |
| `--timer-idle-border` (`:1201`) | `--bg-surface` / `--bg-subtle` | 1,46 / 1,30 | 1,57 / 1,43 |
| **`--status-reopened-hatch`** (`:409`) | `--status-reopened-bg` | **1,24** | **1,45** |

### Der Befund: zwei Sätze im Quelltext, die gemessen nicht halten

**`components.css:401`** sagt: *„Die Schraffur traegt die Unterscheidung auch dann, wenn Farbe
nicht wahrgenommen wird."* Gemessen **1,24:1** hell, **1,45:1** dunkel gegen die eigene Fläche.
Ein Kontrastverhältnis von 1,24 ist eine Aussage über die Leuchtdichte: in Graustufen ist die
Schraffur so gut wie nicht da. **Kein Paar mißt sie.**

**`components.css:1329-1331`** sagt über die gestreifte Schiene des Leistungsfeldes: *„Der
Unterschied bleibt in Graustufen und bei Farbfehlsichtigkeit bestehen (R-08, SC 1.4.1)."*

| gemessen | hell | dunkel |
|---|---:|---:|
| `--note-billing-rail-stripe` gegen `--note-billing-rail` | **1,76** | **1,98** |
| `--note-billing-rail` gegen `--note-internal-rail` | **1,71** | **1,31** |

**Beide Token stehen in der Paarliste — aber nur gegen `--bg-surface`, nie gegeneinander.** Und das
ist die Frage, für die sie zitiert werden. Die Unterscheidung Leistung/Vermerk trennt, was in die
Abrechnung geht, von dem, was intern bleibt (E-016); beide Träger sind gemessen schwach.

### Dritte Richtung, gemessen und verworfen

Elf Token in einer Rolle gezeichnet, in der kein Paar sie mißt — zehn davon sind ein Fehler meiner
Einteilung: Marker und Punkte werden mit `background-color` gezeichnet, weil sie kleine gefüllte
Flächen sind; ihre Füllung **ist** ihr Vordergrund, und die Paare messen sie richtig. **Kein
Befund** — steht im Bericht, damit niemand es ein zweites Mal fährt.

## Befunde

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-189-1** | **muß** | `cr"…"` / `cr#"…"#` gehen an der Weigerung vorbei; Lauf grün, Code 0, 6/28/0, vierter Aufrufort und fremde Adresse unsichtbar. Gegenmittel **A-A-41**. | frontend-dev |
| **T-189-2** | **muß** | `['\u{22}','"']` genügt allein; der Riegel greift nicht, weil keine rohe Zeichenkette in der Datei steht. Lauf grün, Code 0, 6/28/0. Gegenmittel **A-A-42**. | frontend-dev |
| **T-189-3** | Hinweis | A-A-37 und A-A-38 sind erfüllt: elf von elf Verstümmelungen bestätigt, drei Kunstquellen rot, kein falscher Alarm. | Einordnung |
| **T-189-4** | Hinweis | Die allgemeine Eigenschaft („nicht neutral verlassen") findet nichts — gemessener Fehlschlag. Bleibt **A-A-43**, eine Entscheidung. | Orchestrator |
| **T-189-5** | soll | `--status-reopened-hatch` hält die Zusage aus `components.css:401` nicht: 1,24 / 1,45. Kein Paar. Gegenmittel **A-A-44**. | frontend-dev / ui-designer |
| **T-189-6** | soll | Streifen und Schienen der Feldarten: 1,76 / 1,98 und 1,71 / 1,31 gegen die Zusage aus `components.css:1329-1331`. Beide Token gemessen — nie gegeneinander. Gegenmittel **A-A-44**. | frontend-dev / ui-designer |
| **T-189-7** | soll | Fünfzehn gezeichnete Farben ohne Paar; fünf Rahmen zwischen 1,30 und 2,04 tragen keine Grenze — richtig, aber nirgends aufgeschrieben, während dieselbe Entscheidung für `--warning-border` und `--accent-border-subtle` im Lauf steht. Gegenmittel **A-A-45**. | frontend-dev |
| **T-189-8** | Hinweis | Erste Richtung null von 480 — tokengenau und damit Untergrenze. | Einordnung |

## Neue Auflagen (Wortlaut und Messung in `docs/bedrohungsmodell.md` 25.5)

| ID | Kurz | Zuständig |
|---|---|---|
| **A-A-41** | Die Weigerung erkennt die **Bauart** statt einer Präfixliste; Ausdruck und Messung liegen vor (kein falscher Alarm, alle sechs Formen), plus zwei Gegenproben für `cr`. | frontend-dev |
| **A-A-42** | Rusts vollständige Fluchtfolgen-Grammatik im Zeichenliteral, an **beiden** Stellen; zwei Gegenproben, beide heute blind. | frontend-dev |
| **A-A-43** | Voller Rust-Zerleger: **Entscheidung**, keine Zeile. Solange offen, steht im Kopf des Laufs, daß die Reichweite an einer Aufzählung hängt, die viermal unvollständig war. | Orchestrator |
| **A-A-44** | Vier neue Farbpaare für die vier Zusagen, auf die sich der Quelltext beruft; wer durchfällt, berichtigt den Wert **oder** nimmt den Satz zurück. | frontend-dev / ui-designer |
| **A-A-45** | `contrast-check.mjs` mißt seine **eigene Vollständigkeit** und wird rot bei jedem gezeichneten Farbtoken ohne Paar oder benannte Ausnahme. Zwei Gegenproben. Grenze (tokengenau, nicht flächengenau) gehört in den Kopf des Laufs. | frontend-dev |

## Annahmen

1. **Alle Messungen liefen gegen einen Spiegel außerhalb des Bestands**, der zeichengleich dieselbe
   Ausgabe liefert. Kein Produktivcode, keine Prüfdatei, keine Kunstquelle im Baum — frontend-dev,
   domain-dev, unit-tester und e2e-tester liefen gleichzeitig.
2. **Die zwei Ausdrücke zu A-A-41 und A-A-42 sind gemessene Vorschläge, keine Vorgabe der
   Umsetzung.** Ich habe sie gefahren, um zu belegen, daß sie den Bestand nicht falsch rot machen.
3. **Die O-GH-Messung ist tokengenau.** Eine flächengenaue Antwort verlangt die aufgelöste Kaskade;
   das steht als Grenze im Bericht und in der Auflage, statt verschwiegen zu werden.
4. **`--warning-border` habe ich mitgemessen** (1,44 / 2,71 gegen `--bg-surface`), obwohl es der
   Lauf ausdrücklich ablehnt — als Bestätigung der dort niedergelegten Entscheidung, nicht als
   Befund.
5. **`proof:callers` steht seit T-188 absichtlich bei 44/1**; das habe ich nicht angefaßt und nicht
   erneut bewertet.

## Risiken

- **E-088 Punkt 4 bleibt hängen, und die Kopplung ist echt.** Die Begründung, die Tür lockern zu
  dürfen, ruht auf „`check_file` ist die einzige Kontrolle" — und der Wächter, der das absichert,
  bleibt heute mit zwei neuen Kunstquellen grün.
- **Vier Wege in drei Wellen, jeder einen Buchstaben entfernt vom vorigen** (`b`, `#`, `c`, `\u`).
  Das ist kein Zufall mehr, sondern die Eigenschaft des Verfahrens.
- **T-189-2 ist der erste Weg, den A-A-33 gar nicht erreichen kann.** Alle bisherigen Befunde
  ließen sich mit einem schärferen Ausdruck derselben Weigerung schließen; dieser nicht.
- **T-189-6 berührt eine fachliche Grenze**, nicht nur die Optik: Leistung geht in die Abrechnung,
  Vermerk bleibt intern.

## Offene Fragen

1. **A-A-43 — voller Zerleger oder nicht?** Meine Empfehlung: A-A-41 und A-A-42 jetzt (zusammen
   zwei Ausdrücke, sechs Gegenproben), die Entscheidung ausdrücklich vertagen, aber den Satz über
   die Reichweite in den Kopf des Laufs schreiben.
2. **Wer entscheidet bei A-A-44 zwischen „Wert berichtigen" und „Satz zurücknehmen"?** Das ist eine
   Gestaltungsfrage (ui-designer), keine Sicherheitsfrage.
3. **Soll die Regel aus A-A-45 sinngemäß auch für `proof:openapi`, `proof:route-policy` und
   `proof:template-fields` gestellt werden?** Dieselbe offene Frage wie in T-183, unverändert.

## Nächster Schritt

1. **A-A-41 und A-A-42 an frontend-dev, in einer Aufgabe, gleiche Datei, gleicher
   Gegenprobenteil** — sechs neue Gegenproben, beide Ausdrücke liegen gemessen vor.
2. **Danach E-088 Punkt 4 wiedervorlegen**, mit derselben Bedingung, gegen den dann gebauten Stand.
3. **A-A-44 und A-A-45 an frontend-dev**, A-A-44 mit ui-designer über die Werte.
4. **A-A-43 als Entscheidungsvorlage** an den Orchestrator, nicht als Bauaufgabe.

---

# Nachtrag T-189/2 — die Nachmessung von A-A-41 und A-A-42, der künstliche Fall, und der fünfte Weg

**Anlaß:** T-173-4 hat A-A-41 und A-A-42 gebaut. Gemessen gegen denselben Spiegel wie oben, nach
dem Einspielen der neuen Fassung: `diff` gegen den Bestandslauf **ohne Ausgabe**, beide Code 0,
beide **6 Prüfungen und 31 Gegenproben, 0 blind**. Beide Ausdrücke sind zeichengleich aus A-A-41
und A-A-42 übernommen (`proof-shell-surface.mjs:291` und `:467`). `proof:all` nicht gefahren.

## 1. Die Nachmessung: sie trägt

### Fünfzehn Verstümmelungen, fünfzehn Treffer

| | gemeldet | gemessen |
|---|---|---|
| A / B / C / D | 0–1 rot, 1–2 blind | **0/2 · 1/1 · 0/1 · 1/1** ✓ |
| E Weigerung ausgebaut | 3 blind | **0 rot, 3 blind** ✓ |
| F Attribut geweitet | 1 blind | **0 rot, 1 blind** ✓ |
| G Weigerung auf dem Urtext | 1 rot, 2 blind | **1 rot, 2 blind** ✓ |
| H `#+` statt `#*` | 1 blind | **0 rot, 1 blind** ✓ |
| I Wortlaut A-A-33 | 1 blind | **0 rot, 1 blind** ✓ |
| J `stripRustStrings` ohne Zeichenliteral | **3** blind | **0 rot, 3 blind** ✓ — die zwei aus A-A-37 **und** die aus A-A-42 |
| K `stripRustComments` mit Fahne | 2 blind | **0 rot, 2 blind** ✓ |
| **L1** `r` gestrichen | 1 rot, **8** blind | **1 rot, 8 blind** ✓ |
| **L2** Rückschau entfernt | 1 blind | **0 rot, 1 blind** ✓ — „A-A-41: die Rückschau" |
| **M** Ausdruck zurück auf T-173-3 | 1 blind | **0 rot, 1 blind** ✓ — „alle sechs Formen" |
| **N** Zeichenliteral zurück | 1 blind | **0 rot, 1 blind** ✓ — „A-A-42: Fluchtfolgen" |

Nicht nur die Zahlen, auch **welche** Gegenprobe blind wird, stimmt in allen fünfzehn Fällen.

### Sieben Kunstquellen, je einzeln im Spiegel

| Kunstquelle | Ergebnis | wodurch rot |
|---|---|---|
| 24.1.2 `'"'` + `r#"a"b"#` | Code 1 | Weigerung |
| 24.1.2 mit fremder Adresse | Code 1 | Weigerung |
| 24.1.3 geschachtelter Blockkommentar | Code 1 | Weigerung |
| 25.2.1 `cr#"a"b"#` | Code 1 | Weigerung |
| 25.2.1 `cr"C:\Users\Public\"` | Code 1 | Weigerung |
| 25.2.2 `['\u{22}','"']` | Code 1 | **vierter Aufrufort und fremde Adresse gefunden** |
| 25.2.2 `['\x22','"']` | Code 1 | **vierter Aufrufort und fremde Adresse gefunden** |

Die letzten zwei sind der wichtige Teil: Dort kann die Weigerung strukturell nicht greifen — es
steht keine rohe Zeichenkette in der Datei —, der Lauf **mußte** sie also richtig lesen. Er tut es.

**A-A-41 und A-A-42 sind erfüllt. Punkt 1 aus T-183 bleibt abgenommen.**

## 2. Die `9r"x"`-Gegenprobe — ehrlich benannt, aber als Gegenprobe nicht tragfähig

Gefragt war, ob ich diese Bauart für tragfähig halte. **Nein — und die richtige Folgerung ist eine
andere, als der Erbauer gezogen hat.** Gemessen statt geurteilt:

**Erstens: Die Rückschau ist gegen gültiges Rust wirkungslos.** Mit und ohne
`(?<![A-Za-z0-9_])` verglichen über alle acht Rust-Dateien des Bestands, **je im Urtext und im
Gerüst** (16 Vergleiche), und über einen Korpus von 23 gültigen Rust-Schreibweisen (`r"…"`,
`br"…"`, `cr"…"`, `b"…"`, `c"…"`, `r#type`, `0xFFr`, `1_000`, `&'a str`, `format!`, …):
**null Unterschiede.** Die beiden Ausdrücke treffen dieselbe Menge von Texten. Der Unterschied
entsteht ausschließlich, wenn dem `r` eine reine Ziffernfolge unmittelbar vorangeht.

**Zweitens: genau diese Eingaben lehnt der Übersetzer ab.** Mit `rustc --edition 2021` gemessen:

| Quelle | rustc |
|---|---|
| `9r"x"` | `error: expected one of \`.\`, \`;\`, \`?\`, \`where\`, or an operator, found \`"x"\`` |
| `a9r"x"` | ``error: prefix `a9r` is unknown`` |
| `cr"x"` | nur `error[E0308]: mismatched types` — **lexikalisch gültig** |

**Drittens: Das Entfernen der Rückschau kann gar nichts verbergen.** Ohne sie trifft der Ausdruck
*mehr* Texte, also verweigert der Lauf *mehr* Dateien — er wird strenger, nie milder. Ein falscher
Alarm auf dem Bestand entsteht dabei nicht (L2: **0 Prüfungen rot**).

**Was daraus folgt.** L2 war nie eine Schwächung. Eine Verstümmelung, die an keiner Eingabe etwas
ändert, die die Sprache erzeugen kann, **soll** die Gegenproben überleben — das ist die richtige
Antwort und keine Lücke. Sie mit `9r"x"` zu beantworten verwandelt eine Verhaltens-Gegenprobe in
eine **Festschreibung des Quelltextes**: Sie sagt nur noch, daß diese Zeichen im Ausdruck noch
stehen. Sie steht dabei in derselben Liste wie Gegenproben, die einen echten vierten Aufrufort
einsetzen, und zählt ununterschieden in „31 Gegenproben, 0 blind".

Warum das über Pedanterie hinausgeht: Diese Liste ist das wichtigste Werkzeug dieses Vorhabens für
die Frage „merkt der Wächter einen Verstoß?". Ihr Wert hängt daran, daß **jeder** Eintrag mit „ja,
und hier ist der Verstoß, den sie gefangen hätte" beantwortbar ist. Und die Lehre, die ein Eintrag
wie dieser weitergibt — *jede überlebende Verstümmelung braucht eine Gegenprobe* — ist genau der
Weg, auf dem ein Wächter am Ende seinen eigenen Quelltext mißt statt des Erzeugnisses.

**Schwere: Hinweis, keine Nacharbeit.** Es bleibt nichts ungemessen; die Anmerkung im Quelltext
nennt die Quelle ausdrücklich künstlich, und das ist der Maßstab, den ich in T-183 selbst verlangt
habe („die zulässige Ausnahme wird benannt statt erschlichen"). Es ist eine Einordnung, keine
Täuschung. **Empfehlung:** die Rückschau **behalten** (sie kostet nichts und ist gegen eine
künftige Änderung der Sprache richtig), die Probe aber aus der Zählung nehmen — eigene Rubrik
„Festschreibung" oder ersatzlos, mit dem hier gemessenen Satz als Anmerkung daneben: *gegen
gültiges Rust wirkungslos, gemessen über acht Dateien und 23 Schreibweisen, `rustc` lehnt den
Unterschiedsfall ab.*

## 3. Die Frage zum vierten Mal: ja, ein fünfter Weg — und diesmal ist er der letzte in dieser Grammatik

### T-189-9 (muß) — das Zeichenliteral außerhalb der BMP

`CHAR_LITERAL` (`:291`) trägt **keinen `u`-Merker**. Ohne ihn trifft `[^'\\\n]` genau **eine
UTF-16-Einheit**. Ein Zeichen oberhalb von U+FFFF steht in JavaScript als Ersatzpaar, also als
zwei Einheiten — der Rumpf paßt nicht, beide Apostrophe bleiben als vermeintliche Lebenszeit
stehen, und der schließende paart sich mit dem nächsten zu einem Scheinliteral. Danach öffnet die
folgende Anführung eine Zeichenkette, die nie zugeht. **Derselbe Mechanismus wie T-189-2, eine
Kodierungsebene tiefer.**

Die ganze Kunstquelle ist wieder eine Zeile:

```rust
pub const TRENNER: [char; 2] = ['😀','"'];
```

Dahinter ein vierter Aufrufort für `open` und `https://boese.example/x`. **Gemessen: grün,
Beendigungscode 0, 6 Prüfungen und 31 Gegenproben, 0 blind** — und Prüfung 3 meldet wörtlich
*„3 namentliche Aufruforte für `open`, jeder mit seiner Prüfung"*, während der vierte danebensteht.
Ohne die fremde Adresse: dasselbe.

**Die Kontrollprobe, die den Fall festnagelt.** Dieselbe Datei, dasselbe Zeichen, andere
Schreibweise:

| Quelle | Ergebnis |
|---|---|
| `['😀','"']` — das Zeichen selbst | **grün, Code 0** — Aufrufort unsichtbar |
| `['\u{1F600}','"']` — dasselbe Zeichen als Fluchtfolge | **Code 1** — Aufrufort und Adresse gefunden |

Ein Zeichen, zwei Schreibweisen, entgegengesetzte Ergebnisse. Die Fluchtfolge ist die, die A-A-42
gelernt hat; das Zeichen selbst nicht.

**Das Gegenmittel ist ein Zeichen.** Der `u`-Merker am Ausdruck. Gemessen am Spiegel:

| | Ergebnis |
|---|---|
| Bestand mit `u`-Merker | **grün, Code 0, 6/31/0** — kein falscher Alarm |
| `['😀','"']` | **Code 1**, Aufrufort und Adresse gefunden |
| `['😀','"']` ohne Adresse | **Code 1**, Aufrufort gefunden |
| `['\u{1F600}','"']` | **Code 1**, unverändert |
| `'a'`, `'ä'`, `'字'`, `'\n'`, `'\0'`, `'\''`, `'\x22'`, `'\u{22}'` | unverändert getroffen |
| `'a`, `'a str`, `'static` | unverändert **nicht** getroffen |

Die Längentreue bleibt: `literal[0].length` ist auch im `u`-Modus die UTF-16-Länge (`'😀'` → 4),
`' '.repeat(length - 2)` also weiterhin richtig. Wer den `u`-Merker nicht will, tut es auch
`[\uD800-\uDBFF][\uDC00-\uDFFF]` als weitere Alternative — gleich gemessen, gleiches Ergebnis.

**Nähe zum Bestand: geringer als bei allen vier Vorgängern, und das gehört dazu.** Der Rust-Anteil
trägt heute **kein einziges** Zeichen oberhalb der BMP; das Nicht-ASCII, das dort steht, ist
durchweg BMP (`—`, `ü`, `ä`, `ö`, `ß`, `„`, `“`, `′`, `…` und die Ziffern `١٢٣` in `release.rs`).
T-189-2 lag eine Datei entfernt, dieser liegt weiter weg. Er bleibt trotzdem **muß**, weil das
Ergebnis dasselbe ist — ein grüner Lauf, der drei Aufruforte zusichert, während vier dastehen — und
weil die Behebung ein Zeichen kostet.

### Die abschließende Rundum-Messung: neunzehn Formen, genau eine blind

Damit die Frage nach dem sechsten Weg nicht wieder von meiner Vorstellungskraft abhängt, habe ich
**die lexikalische Grammatik der Rust-Referenz vollständig durch den Lauf gefahren** — je eine
Kunstquelle mit einer Anführung im Rumpf, dahinter derselbe vierte Aufrufort:

| Form | Ergebnis |
|---|---|
| `'"'`, `'\u{22}'`, `'\x22'`, `'😀'` **allein** | rot — Aufrufort gefunden |
| `b'"'`, `b'\x22'` | rot — Aufrufort gefunden |
| `"a\"b"`, `b"a\"b"`, `c"a\"b"` | rot — Aufrufort gefunden |
| `r#"a"b"#`, `br#"a"b"#`, `cr#"a"b"#` | rot — **Weigerung** |
| Zeilenkommentar, Blockkommentar, geschachtelter Blockkommentar (je mit `"`) | rot — Aufrufort gefunden |
| Lebenszeit `&'a str`, Fortsetzungszeile `"a\⏎b"` | rot — Aufrufort gefunden |
| `['\u{22}','"']` | rot — Aufrufort gefunden |
| **`['😀','"']`** | **grün, Code 0 — Aufrufort unsichtbar** |

**Neunzehn Formen, achtzehn gefangen, eine blind.** Das macht aus „gibt es einen sechsten Weg?"
eine begrenzte Frage statt einer offenen.

## 4. Neue Auflagen

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-46** | `CHAR_LITERAL` bekommt den `u`-Merker (oder das Ersatzpaar als weitere Alternative), damit ein Zeichen oberhalb der BMP im Zeichenliteral als **ein** Zeichen gilt. | Gemessen und oben aufgeschrieben: Bestand grün ohne falschen Alarm, drei Kunstquellen rot, Längentreue erhalten, alle bisherigen Fälle unverändert. Eine Gegenprobe: `['😀','"']` mit viertem Aufrufort **und** fremder Adresse — beide müssen gefunden werden. Sie ist heute blind. |
| **A-A-47** | Die Reichweite wird an einer **geschlossenen** Liste gemessen statt an der Erfindungskraft des jeweiligen Prüfers: Der Gegenprobenteil trägt je eine Kunstquelle für **jede** lexikalische Form der Rust-Referenz, in der eine Anführung vorkommen kann — Zeichenliteral, Byteliteral, Zeichenkette, Bytezeichenkette, C-Zeichenkette, die drei rohen Formen, Zeilen-, Block- und geschachtelter Blockkommentar, Lebenszeit, Fortsetzungszeile. Der Kopf des Laufs nennt diese Liste als das, woran seine Reichweite gemessen ist. | Die neunzehn Läufe oben sind die Ausgangsmessung: achtzehn gefangen, einer blind. Die Liste ist der Referenz entnommen und damit endlich und nachprüfbar — anders als „ist noch jemandem etwas eingefallen". **Damit wird die Bedingung aus E-088 Punkt 4 erfüllbar, statt an einem Negativbeweis zu hängen.** |
| **A-A-48** | Die Gegenprobe „A-A-41: die Rückschau" wird aus der Zählung genommen — eigene Rubrik oder ersatzlos. Die Rückschau selbst **bleibt**. Daneben steht, was hier gemessen ist. | Null Unterschiede zwischen mit und ohne Rückschau über acht Dateien (Urtext und Gerüst) und 23 gültige Schreibweisen; `rustc` lehnt `9r"x"` und `a9r"x"` ab; ohne Rückschau wird der Ausdruck strenger, nie milder. |

## 5. Befunde des Nachtrags

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-189-9** | **muß** | Fünfter Weg: `['😀','"']`. `CHAR_LITERAL` ohne `u`-Merker liest ein Ersatzpaar als zwei Zeichen; Lauf **grün, Code 0, 6/31/0**, Prüfung 3 sichert drei Aufruforte zu, während vier dastehen. Kontrollprobe mit derselben Zeichenkodierung als Fluchtfolge: Code 1. Gegenmittel **A-A-46**, ein Zeichen. | frontend-dev |
| **T-189-10** | Hinweis | Die Gegenprobe `9r"x"` mißt den Ausdruck, nicht die Sprache: null Unterschiede über acht Dateien und 23 gültige Schreibweisen, `rustc` lehnt den Unterschiedsfall ab, und ohne Rückschau wird der Wächter strenger statt milder. Ehrlich benannt, aber keine Verhaltens-Gegenprobe. Gegenmittel **A-A-48**. | frontend-dev |
| **T-189-11** | Hinweis | A-A-41 und A-A-42 sind erfüllt: fünfzehn von fünfzehn Verstümmelungen bestätigt (samt der jeweils blinden Gegenprobe), sieben Kunstquellen rot, Spiegel und Bestand zeichengleich, beide Ausdrücke zeichengleich übernommen. | Einordnung |
| **T-189-12** | Hinweis | Neunzehn lexikalische Formen der Rust-Referenz durch den Lauf gefahren: **achtzehn gefangen, eine blind.** Damit ist die Klasse erstmals **begrenzt** statt offen. Gegenmittel **A-A-47**. | frontend-dev |

## 6. Urteil des Nachtrags — und die zwei Sätze, um die gebeten wurde

**Abnahme von Punkt 1 aus T-183: ja, unverändert.** Sie stand schon nach der ersten Nachmessung
(A-A-37/A-A-38) und steht nach dieser erst recht: fünfzehn von fünfzehn, sieben von sieben, jede
Zahl und jede blinde Gegenprobe nachgemessen, beide neuen Ausdrücke zeichengleich übernommen. Die
Arbeit des Erbauers ist an keiner Stelle zu beanstanden.

**Freigabe der Wiedervorlage aus E-088 Punkt 4: nein — noch nicht, und das ist kein Urteil über
T-173-4.** Die Bedingung dort lautet wörtlich: der Satz „`check_file` ist die einzige Kontrolle vor
dem Prozeßstart" darf nicht länger auf einem Wächter ruhen, *der nachweislich grün bleibt, während
ein vierter Aufrufort danebensteht*. Mit `['😀','"']` bleibt er nachweislich grün, Code 0, und sagt
dabei „3 namentliche Aufruforte". Die Bedingung ist wörtlich verletzt, und ich weiche sie nicht auf,
nachdem ich sie mitformuliert habe.

**Damit das nicht ein viertes Mal so ausgeht, gehört der Ausweg dazu.** Ich blockiere eine
Entscheidung zum dritten Mal mit einem Befund, den ich selbst gefunden habe — das ist auf Dauer
kein tragfähiges Verfahren, weil die Bedingung dann an einem Negativbeweis hängt („security-checker
hat nichts mehr gefunden"), und den kann niemand führen. Deshalb:

**Vorschlag zur Umformulierung der Bedingung aus E-088 Punkt 4** — an den Orchestrator, als
Entscheidung, nicht als Auflage: Die Wiedervorlage wird frei, wenn **A-A-46 gebaut und A-A-47
erfüllt** ist — also wenn der Gegenprobenteil je eine Kunstquelle für jede lexikalische Form der
Rust-Referenz trägt und alle bestehen. Das ist eine **geschlossene, nachprüfbare** Bedingung. Sie
ist heute zu 18 von 19 erfüllt; es fehlt ein Zeichen im Ausdruck und die Aufnahme der neunzehn
Quellen in den Lauf. Danach ist die Frage nicht mehr „ist jemandem noch etwas eingefallen", sondern
„steht jede Form der Referenz im Gegenprobenteil" — und die läßt sich abhaken.

**Der Satz dieses Nachtrags.** Fünf Wege in vier Wellen, jeder gefunden, jeder behoben, jeder
gegengeprobt — und jedes Mal war die Antwort auf „gibt es noch einen?" ein Bericht statt eines
Kriteriums. Die Aufzählung ist erst dann kein Risiko mehr, wenn sie **von außen kommt**: nicht aus
dem, was ein Prüfer sich vorstellen konnte, sondern aus der Grammatik der Sprache, die der Wächter
zu lesen behauptet.

---

# Nachtrag T-189/3 — A-A-46, A-A-47, A-A-48 nachgemessen: der Wächter ist zu

**Anlaß:** T-173-5. Spiegel wie zuvor; nach dem Einspielen liefert er `diff`-frei dieselbe Ausgabe
wie der Bestand, beide Code 0, beide **6 Prüfungen und 49 Gegenproben, 0 blind**. `proof:all` nicht
gefahren.

## 1. A-A-47 — steht jede Form meiner Aufstellung da? **Ja, neunzehn zu neunzehn**

Die Ausgabe trägt **19** Zeilen `A-A-47: <Form>`. Gegen meine Aufstellung aus 26.4 gehalten,
eins zu eins, ohne Rest:

`'"'` · `'\u{22}'` · `'\x22'` · Zeichenliteral oberhalb U+FFFF · `b'"'` · `b'\x22'` ·
Zeichenkette · Bytezeichenkette · C-Zeichenkette · Fortsetzungszeile · `r#"…"#` · `br#"…"#` ·
`cr#"…"#` · Zeilenkommentar · Blockkommentar · geschachtelter Blockkommentar · Lebenszeit ·
Apostrophpaarung `['\u{22}','"']` · Apostrophpaarung mit einem Zeichen oberhalb U+FFFF.

**Und die Kunstquellen sind die echten, nicht abgeschwächte.** Das habe ich eigens nachgesehen,
weil hier der billige Fehler läge: `RUST_LEXICAL_FORMS` setzt für die entscheidende Form den Kopf
`pub const TRENNER: [char; 2] = ['😀','"'];` — **ohne Leerzeichen nach dem Komma**, also mit genau
der Apostrophpaarung, die den Takt bricht. Ein Leerzeichen hätte die Probe trivial bestehen lassen.
`lexicalFormProbe` hängt an jeden Kopf `blindingSource(head, null)`, also denselben vierten
Aufrufort für `open` **und** `https://boese.example/x`, und verlangt bei sechzehn Formen **beide**
Befunde, bei den drei rohen die Weigerung.

**Nennt eine blinde Zeile die Form? Ja.** Verstümmelung **O** (`u`-Merker gestrichen):
**genau eine** Gegenprobe blind, und die Zeile lautet
`BLIND A-A-47: Apostrophpaarung mit einem Zeichen oberhalb U+FFFF`. Das ist der Unterschied
zwischen einem Befund und einer Suche, und er ist da.

**Einundzwanzig Verstümmelungen gefahren, alle gemeldeten bestätigt** — und die neuen Zeilen nennen
durchweg die Form:

| | Ergebnis | genannte Formen |
|---|---|---|
| **O** `u`-Merker gestrichen | 1 blind | Apostrophpaarung oberhalb U+FFFF |
| **L2** Rückschau entfernt | **Code 0, 0 rot, 0 blind** | — wie A-A-48 es erwartet ✓ |
| E Weigerung ausgebaut | 6 blind | `r#`, `br#`, `cr#` |
| I Wortlaut A-A-33 | 3 blind | `br#`, `cr#` |
| M Ausdruck zurück auf T-173-3 | 2 blind | `cr#` |
| J `stripRustStrings` ohne Zeichenliteral | 7 blind | `'"'`, `b'"'`, beide Apostrophpaarungen |
| K `stripRustComments` mit Fahne | 3 blind | geschachtelter Blockkommentar |
| N Zeichenliteral zurück | 3 blind | beide Apostrophpaarungen |
| F, H, A, B, C, D, G | 1–2 blind | wie gemeldet |

## 2. Beißen alle neunzehn? — **dreizehn ja, sechs konnte ich nicht blind machen**

Eine Liste, die vollständig ist, ist noch nicht eine Liste, die mißt. Deshalb sechs weitere
Verstümmelungen, eigens für diese Frage gebaut:

| | Änderung | Ergebnis |
|---|---|---|
| **P** | `CHAR_LITERAL` überbreit (`/^'[^']*'/u`) | **1 Prüfung rot** — falscher Alarm auf dem Bestand, also gefangen, nur nicht über eine Probe |
| **Q** | Zeilenkommentar-Zweig entfernt | 4 blind, darunter **„A-A-47: Zeilenkommentar mit Anführung"** ✓ |
| **R** | Fluchtzeichen in `stripRustStrings` entfernt | 3 blind: **Zeichenkette, Bytezeichenkette, C-Zeichenkette** ✓ |
| **T** | Blockkommentar-Zweig entfernt | 4 blind, darunter **„A-A-47: Blockkommentar mit Anführung"** ✓ |
| **S** | `\n` aus dem Zeichenliteral-Ausdruck | Code 0 — Lebenszeit-Probe unbeeindruckt |
| **U** | Zeichenliteral um ein Zeichen überbreit | Code 0 — ebenso |

**Dreizehn der neunzehn** habe ich unter mindestens einer Verstümmelung blind bekommen. **Sechs
nicht:** Zeichenliteral mit `\u{…}`, mit `\x…` und oberhalb U+FFFF (je **allein**), Byteliteral mit
`\x…`, Fortsetzungszeile, Lebenszeit.

**Für vier davon kann ich sagen, warum, und es ist kein Mangel.** Ein alleinstehendes
Zeichenliteral, das der Leser nicht versteht, hinterläßt zwei lose Apostrophe und **keine
Anführung** — es bricht nichts. Gemessen statt behauptet: Verstümmelung N nimmt dem Ausdruck genau
`\u{…}` und `\x…`, Verstümmelung O nimmt ihm das Zeichen oberhalb U+FFFF — und **keine** der drei
„allein"-Proben wird davon blind, wohl aber die zugehörigen **Apostrophpaarungen**. Die drei
„allein"-Formen dokumentieren also die Form; **gemessen** wird der Mechanismus von ihren Paaren,
und die beißen. Jeder Mechanismus der Liste ist damit von mindestens einer beißenden Probe gedeckt.

Die Lebenszeit-Probe schützt die **Gegenrichtung** (der Ausdruck darf nicht zu viel treffen), und
die ist gedeckt — nur nicht über eine Probe, sondern über eine rote Prüfung (P).

**Einordnung, kein Befund und ausdrücklich kein Hindernis.** Es bleibt aber wahr, daß „49
Gegenproben, 0 blind" jetzt Proben mit sehr unterschiedlicher Kraft in einer Zahl führt — dieselbe
Beobachtung wie bei A-A-48, eine Stufe milder: dort **konnte** eine Probe nie beißen, hier können
sechs es **derzeit** nicht. Der Unterschied ist erheblich, und ich setze die beiden nicht gleich.
Empfehlung, leicht: in der Kopfzeile der Liste vermerken, welche Form von einer **paarigen**
beißenden Probe gedeckt ist, damit niemand 19 für 19 unabhängige Messungen hält.

## 3. Die Kunstquellen — neun von neun rot

| Kunstquelle | Ergebnis |
|---|---|
| `['😀','"']` **mit** fremder Adresse | Code 1 — Aufrufort **und** Adresse gefunden |
| `['😀','"']` **ohne** fremde Adresse | Code 1 — Aufrufort gefunden |
| Kontrollprobe `['\u{1F600}','"']` | Code 1 — unverändert |
| `['\u{22}','"']`, `['\x22','"']` | Code 1 — Aufrufort und Adresse |
| `cr#"a"b"#`, `cr"C:\Users\Public\"` | Code 1 — Weigerung |
| 24.1.2, 24.1.3 | Code 1 — Weigerung |
| Spiegel ohne Kunstquelle | **Code 0, 6/49/0** |

Damit ist der fünfte Weg zu, und die Kontrollprobe zeigt, daß dabei nichts verlorenging.

## 4. „Die Liste stammt aus der Referenz, nicht aus der Sprache" — reicht der Satz im Kopf?

**Nein, nicht ganz — und die Antwort ist billiger, als sie klingt.** Ich bin an meinen eigenen Satz
aus 24.6 gebunden: *wo ein Wächter etwas begründet, statt es zu messen, gehört die Begründung in
die nächste Gegenprobe.* Ein Satz im Kopf, der sagt „diese Liste altert", ist genau die Bauart, die
in diesem Faden fünfmal nachgegeben hat.

**Was ich vorfinde:** `apps/desktop/src-tauri/Cargo.toml:5-6` erklärt `edition = "2021"` und
`rust-version = "1.82"`. Eine `rust-toolchain.toml` gibt es nicht, und die Arbeitsläufe unter
`.github/workflows/` legen keine Fassung fest; örtlich läuft `rustc 1.89.0`. **Nirgends steht,
gegen welches Rust die Liste gelesen wurde.**

**Der billige Wächter über die Liste** (A-A-49, **soll**): Der Lauf liest `edition` und
`rust-version` aus `Cargo.toml` und wird **rot**, sobald einer der beiden Werte von dem abweicht,
gegen den die Liste geprüft ist — mit dem Satz, die Referenz sei erneut zu lesen. Das ist offline
(E-001 bleibt unberührt), deterministisch, und es bindet die Liste an die **einzige** Stelle im
Bestand, an der die Sprachfassung erklärt wird. Die Grenze gehört danebengeschrieben:
`rust-version` ist die **untere** Schranke, nicht die Fassung, mit der gebaut wird — eine neue Form
in 1.90 bewegt sie nicht. Der Wächter fängt also die erklärte Anhebung, nicht jede neue Form.

**Ausdrücklich verworfen:** die Referenz zur Laufzeit holen. Das wäre eine zweite Adresse außerhalb
`127.0.0.1` und damit eine Aufhebung von E-001 — dafür gäbe es eine Entscheidung, nicht eine Zeile.

**Und die Größenordnung gehört dazu, damit das nicht überzeichnet wird:** Rust hat in einem
Jahrzehnt **eine** neue Literalform bekommen (`c"…"` / `cr"…"`, stabil seit 1.77). Das Restrisiko
ist echt, aber langsam, und seine Folge ist genau die Klasse, die diese Liste findbar macht.
**Deshalb `soll`, nicht `muß`, und deshalb kein Hindernis für die Freigabe.**

## 5. Befunde des Nachtrags

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-189-13** | Hinweis | A-A-46, A-A-47 und A-A-48 sind erfüllt: 19 von 19 Formen als eigene Probe, je namentlich in der Ausgabe; O macht genau eine blind und **nennt die Form**; L2 ergibt Code 0/0/0 wie erwartet; 21 Verstümmelungen und 9 Kunstquellen nachgemessen; die Kunstquellen der Liste tragen den echten Auslöser (Apostrophpaarung ohne Leerzeichen). | Einordnung |
| **T-189-14** | Hinweis | Sechs der 19 Proben habe ich unter keiner von 21 Verstümmelungen blind bekommen; für vier ist der Grund gemessen (ein alleinstehendes, unverstandenes Zeichenliteral bricht nichts) und harmlos, weil ihr Mechanismus von der jeweils paarigen Probe gemessen wird. „49 Gegenproben, 0 blind" führt damit Proben unterschiedlicher Kraft in einer Zahl. Empfehlung: in der Kopfzeile vermerken, welche Form eine paarige beißende Probe hat. | frontend-dev |
| **T-189-15** | soll | Die Bindung der Liste an die Rust-Referenz ist ein Satz, keine Messung. `Cargo.toml:5-6` erklärt `edition = "2021"` und `rust-version = "1.82"`; eine Toolchain-Festlegung gibt es nicht, örtlich läuft 1.89.0, und nirgends steht, gegen welches Rust die Liste gelesen wurde. Gegenmittel **A-A-49**. | frontend-dev |

## 6. Neue Auflage

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-49** | Der Lauf liest `edition` und `rust-version` aus `apps/desktop/src-tauri/Cargo.toml` und wird **rot**, sobald einer der Werte von dem abweicht, gegen den `RUST_LEXICAL_FORMS` geprüft ist; daneben steht, mit welcher `rustc`-Fassung die Referenz gelesen wurde, und die Grenze: `rust-version` ist die untere Schranke, nicht die Baufassung. Die Referenz zur Laufzeit zu holen ist **ausgeschlossen** (E-001). | Zwei Gegenproben: `edition` auf `2024` gesetzt → rot; `rust-version` auf `1.90` gesetzt → rot. Ausgangslage: `2021` / `1.82`, örtlich `rustc 1.89.0`, keine `rust-toolchain.toml`, keine Fassung in den Arbeitsläufen. |

## 7. Die zwei Sätze, um die gebeten wurde

**1. Ist A-A-47 in meinem Sinn erfüllt? — Ja.** Neunzehn Formen, eins zu eins mit meiner
Aufstellung, jede als **eigene** Gegenprobe mit eigener Kunstquelle, eigenem Dateinamen und
demselben vierten Aufrufort dahinter; jede namentlich in der Ausgabe. Die Kunstquellen tragen den
echten Auslöser und nicht seine entschärfte Fassung. Und eine blinde Zeile **nennt die Form** —
gemessen an O, das genau eine blind macht und sie beim Namen ruft. A-A-46 (der `u`-Merker) und
A-A-48 (die künstliche Probe entfallen, die Rückschau geblieben, das Gemessene als Begründung
daneben) ebenso erfüllt.

**2. Wird die Wiedervorlage aus E-088 Punkt 4 in der Fassung von E-089 frei? — Ja, ausdrücklich.**
E-089 Punkt 1 nennt die Bedingung: A-A-46 gebaut und A-A-47 erfüllt, also je eine Kunstquelle für
jede lexikalische Form der Rust-Referenz im Gegenprobenteil. Beides ist erfüllt und nachgemessen.
Neun von neun Kunstquellen rot, darunter der fünfte Weg samt Kontrollprobe. **Die Doppelpunktfrage
kann als Entscheidungsvorlage gehen; von der Sicherheitsseite steht ihr nichts mehr im Weg.**

Ich habe das Kriterium selbst vorgeschlagen, und ich hänge jetzt keine Bedingung daran, die vorher
nicht dastand. **T-189-14 und T-189-15 sind Hinweise für die nächste Welle, kein Vorbehalt gegen
diese Freigabe** — das gehört ausdrücklich gesagt, weil ich dreimal recht behalten habe und ein
viertes „ja, aber" sonst wie ein Vorbehalt gelesen würde. Es ist keiner.

**Der Satz zum Schluß.** Fünf Wege in fünf Wellen, und was den Faden beendet hat, war nicht der
sechste Fund, sondern der Wechsel der Frage: von „ist jemandem noch etwas eingefallen" zu „steht
jede Form der Referenz da". Die erste Frage kann niemand beantworten; die zweite konnte der
Erbauer in einer Welle abhaken. **Ein Wächter wird nicht dadurch vollständig, daß man länger sucht,
sondern dadurch, daß sein Maßstab von außerhalb kommt.**
