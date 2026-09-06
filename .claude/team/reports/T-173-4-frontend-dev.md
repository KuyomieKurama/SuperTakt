# T-173-4 — Die Bauart statt der Aufzählung (A-A-41), Rusts Fluchtfolgen (A-A-42), und der Satz über die Reichweite (A-A-43)

**Aufgabe:** T-173-4 — Befunde T-189-1 und T-189-2 (beide muß) aus `docs/bedrohungsmodell.md`
Abschnitt 25, dazu der Kopfsatz aus A-A-43.
**Status:** fertig
**Datei:** `apps/desktop/scripts/proof-shell-surface.mjs` (einzige Änderung)

## A-A-41 — die rohe Zeichenkette an ihrer Bauart

`RAW_STRING_OPENER` zählt keine Präfixe mehr auf:

```js
const RAW_STRING_OPENER = /(?<![A-Za-z0-9_])[A-Za-z_][A-Za-z0-9_]*?r#*"|(?<![A-Za-z0-9_])r#*"/;
```

Der Ausdruck ist der aus A-A-41, unverändert übernommen. In Rust berührt ein Bezeichner eine
Anführung nur als Literalpräfix, und die rohe Form ist genau die, deren Präfix auf `r` endet —
damit sind `r`, `br`, `cr` **und jedes künftige Präfix** gedeckt. Gemessen, beide Richtungen:

| | neu | alt (`/\bb?r#*"/`) |
|---|---|---|
| `r"…"`, `r#"…"#`, `br"…"`, `br#"…"#` | trifft | trifft |
| **`cr"…"`, `cr#"…"#`** | **trifft** | **trifft nicht** |
| `b"…"`, `c"…"`, `"…"` | trifft nicht | trifft nicht |

Kein falscher Alarm auf dem Bestand: Der Lauf ist grün, und ein Anschlag auf einer der acht
Rust-Dateien machte Prüfung 3 rot — sie ist grün. Gesucht wird unverändert auf dem Gerüst; auf dem
**Urtext** träfe der Ausdruck an fünf Stellen (`"link_control_character"`, `"/inheritance:r"` und
Ähnliches), und genau deshalb steht die Suche dort, wo Zeichenkettenrümpfe schon geleert sind.

## A-A-42 — Rusts Fluchtfolgen, an **einer** Stelle für beide Werkzeuge

```js
const CHAR_LITERAL = /^'(\\u\{[0-9a-fA-F]{1,6}\}|\\x[0-9a-fA-F]{2}|\\.|[^'\\\n])'/;
```

Der Ausdruck aus A-A-42, ebenfalls unverändert, steht jetzt **einmal** und wird von
`stripRustComments` **und** `stripRustStrings` benutzt — die beiden dürfen nach T-189 nicht wieder
auseinanderlaufen. Gemessen: `'a'`, `'\n'`, `'\0'`, `'\''`, `'\"'` unverändert getroffen;
`'\x22'`, `'\u{22}'`, `'\u{1F600}'` **neu** getroffen; `'a` und `'a str` (Lebenszeit) weiterhin
**nicht**.

Dieser Weg wog schwerer als der erste: In der Kunstquelle steht **keine** rohe Zeichenkette, die
Weigerung aus A-A-33 konnte also gar nicht greifen. Entsprechend ist die Gegenprobe gebaut — sie
verlangt nicht die Weigerung, sondern daß der vierte Aufrufort **und** die fremde Adresse
gefunden werden.

## A-A-43 — der Satz über die Reichweite steht im Kopf des Laufs

Neuer Abschnitt „Die Reichweite dieses Laufs — was er leistet und was nicht": daß dieser Lauf Rust
als Text liest und keinen Zerleger hat; daß ab einer Schreibweise, die eines der Werkzeuge aus dem
Takt bringt, **alles** dahinter unsichtbar ist, auch ein Aufrufort für `open`; die Tabelle der vier
Wege in drei Wellen (`r#"…"#`, `'"'` und geschachtelter Kommentar, `cr…`, `'\u{22}'`), jeder einen
Buchstaben vom vorigen entfernt; daß die allgemeine Eigenschaft („das Werkzeug verläßt die Datei
nicht neutral") gemessen ist und **nicht trägt** (T-189-4); und was daraus für den nächsten Leser
folgt — jeder neue Weg gehört als Kunstquelle in den Gegenprobenteil, jede Behebung an **beide**
Werkzeuge zugleich, und die Entscheidung über einen vollen Zerleger ist offen.

## Die sechs Kunstquellen im Spiegel — je rot

Gemessen wie in T-173-3: Kopie des Laufs mit umgehängter Wurzel, `src-tauri/src` als echte Kopie,
alles übrige als Verweis. Der Bestand wurde nicht angefaßt.

| Kunstquelle | vorher | jetzt |
|---|---|---|
| 25.2.1 `cr#"a"b"#` | grün, Code 0 | **Code 1** — Weigerung |
| 25.2.1 `cr"C:\Users\Public\"` | grün, Code 0 | **Code 1** — Weigerung |
| 25.2.2 `['\u{22}','"']` | grün, Code 0 | **Code 1** — vierter Aufrufort gefunden |
| 25.2.2 `['\x22','"']` | grün, Code 0 | **Code 1** — vierter Aufrufort gefunden |
| 24.1.2 Zeichenliteral + rohe Zeichenkette | (T-173-3) | **Code 1** — Weigerung |
| 24.1.3 geschachtelter Blockkommentar | (T-173-3) | **Code 1** — Weigerung |

Spiegel ohne Kunstquelle: **grün, Code 0**, kein Befund über `appdata.rs`.

## Gegenproben und Verstümmelungen

Der Gegenprobenteil steht bei **31**. Neu oder erweitert:

| Gegenprobe | Was sie einsetzt |
|---|---|
| A-A-38/A-A-41: alle **sechs** Formen | `r"…"`, `r#"…"#`, `br"…"`, `br#"…"#`, **`cr"…"`**, **`cr#"…"#`** — jede muß die Weigerung erzeugen |
| A-A-42: Fluchtfolgen | `['\u{22}','"']` und `['\x22','"']` — Aufrufort **und** Adresse müssen gefunden werden |
| A-A-42: Lebenszeit | `&'a [&'a str]` — der erweiterte Ausdruck darf sie nicht als Zeichenliteral lesen |
| A-A-41: die Rückschau | eine **absichtlich künstliche** Quelle mit `9r"x"`; ohne Rückschau wird sie verweigert und der Aufrufort verschwindet |

**Fünfzehn Verstümmelungen, fünfzehn Treffer** (jede einzeln, danach zurückgesetzt):

| | Änderung | Ergebnis |
|---|---|---|
| A–D | die vier aus T-173 | 0–1 rot, 1–2 blind |
| E | Weigerung ausgebaut | 3 blind |
| F | Attribut auf `any(test, …)` geweitet | 1 blind |
| G | Weigerung auf dem Urtext | 1 rot, 2 blind |
| H | `#+` statt `#*` | 1 blind |
| I | Wortlaut A-A-33 (`\br#*"`) | 1 blind |
| J | `stripRustStrings` ohne Zeichenliteral | **3** blind (neu: A-A-42) |
| K | `stripRustComments` mit Fahne | 2 blind |
| **L1** | `r` aus dem Ausdruck gestrichen | 1 rot, **8** blind |
| **L2** | Rückschau entfernt | **1 blind** (A-A-41) |
| **M** | Ausdruck zurück auf die Fassung von T-173-3 | 1 blind |
| **N** | Zeichenliteral zurück auf die alte Fassung | 1 blind |

## Läufe

| Lauf | Ergebnis |
|---|---|
| `proof:shell-surface` | grün, Code 0 — 6 Prüfungen, **31** Gegenproben, **0 blind** |
| `pnpm typecheck` | grün, Code 0 |
| `pnpm run proof:codepoints` | grün — 45 bestanden |
| die sechs Kunstquellen im Spiegel | je **Code 1** |
| `appdata.rs`, `attachment.rs` (`b"…"`) | kein Befund |

`proof:all` auf Weisung **nicht** gefahren.

## Annahmen

1. **Beide Ausdrücke sind zeichengleich aus A-A-41 und A-A-42 übernommen.** Keine Abweichung,
   also auch keine zu messende.
2. **Die Gegenprobe zur Rückschau ist künstlich, und sie sagt es.** In gültigem Rust kann einer
   Anführung keine Ziffer als Präfix vorangehen; ohne die Rückschau wäre nur der Ausdruck
   schärfer, nicht die Sprache anders. L2 war ohne diese Gegenprobe die einzige Verstümmelung, die
   alle 30 überlebte — sie ist deshalb genau dort gebaut, wo der Unterschied entsteht.
3. **A-A-42 tritt an beiden Stellen zugleich an** (ein `const`, zwei Benutzer). Ein Ausdruck an
   zwei Stellen war die Ursache dafür, daß die Werkzeuge auseinanderliefen.

## Risiken

- **Ein fünfter Weg ist nicht ausgeschlossen** — vier Wellen, vier Wege, jeder einen Buchstaben
  vom vorigen entfernt. Das steht jetzt im Kopf des Laufs, statt in einem Bericht. Die Antwort
  wäre ein voller Zerleger, und die ist als A-A-43 offen.
- **Die Weigerung bleibt grob** (ganze Datei) und schlägt bei jeder rohen Zeichenkette an, jetzt
  auch bei `cr"…"`. Verfahren unverändert: Prüffall mit doppelten Rückstrichen schreiben, die
  Weigerung nicht ausbauen.

## Offene Fragen

Keine. A-A-44 und A-A-45 (`contrast-check.mjs`, `apps/web/**`) gehören ebenfalls zu frontend-dev,
sind aber nicht Teil dieses Auftrags.

## Nächster Schritt

security-checker mißt die sechs Kunstquellen und die Verstümmelungen H, I, J, K, L1, L2, M, N
gegen seinen Spiegel nach. Fällt das durch, ist die Bedingung aus **E-088 Punkt 4** erfüllt und die
Wiedervorlage der Doppelpunktregel wird frei. A-A-44/A-A-45 gehören in die nächste Welle.
