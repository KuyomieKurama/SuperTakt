# T-173-5 — Ein Merker, neunzehn Formen, und eine Frage, die man abhaken kann (A-A-46, A-A-47, A-A-48)

**Aufgabe:** T-173-5 — Befunde T-189-9, T-189-10 und T-189-12 aus `docs/bedrohungsmodell.md`
Abschnitt 26; Entscheidung E-089.
**Status:** fertig
**Datei:** `apps/desktop/scripts/proof-shell-surface.mjs` (einzige Änderung)

## A-A-46 — der `u`-Merker, ein Zeichen

`CHAR_LITERAL` trägt jetzt `/…/u`. Ohne ihn traf `[^'\\\n]` genau **eine UTF-16-Einheit**; ein
Zeichen oberhalb U+FFFF steht als Ersatzpaar, also als zwei, der Rumpf paßte nicht, und das
Scheinliteral aus T-189-2 entstand eine Kodierungsebene tiefer. Gemessen:

| | ohne `u` | mit `u` |
|---|---|---|
| `'a'`, `'ä'`, `'字'`, `'\n'`, `'\0'`, `'\''`, `'\x22'`, `'\u{22}'` | trifft | trifft |
| **`'😀'`** | **trifft nicht** | **trifft**, Trefferlänge 4 = Textlänge 4 |
| `'a`, `'a str`, `'static` (Lebenszeit) | trifft nicht | trifft nicht |

**Längentreue gemessen, nicht behauptet:** eine Quelle mit `'😀'` im Produktivteil und einer
fremden Adresse **im** Prüfmodul dahinter. Verschöbe sich die Länge, unterbliebe der Ausschluß
(`skeleton.length !== text.length`) und die Adresse würde gemeldet — sie wird nicht gemeldet, der
Lauf bleibt grün.

## A-A-47 / E-089 — die geschlossene Liste

`RUST_LEXICAL_FORMS` führt **neunzehn** lexikalische Formen der Rust-Referenz, in denen eine
Anführung vorkommen kann; `lexicalFormProbe` macht aus jeder eine eigene Gegenprobe mit eigenem
Dateinamen (`kunst/form-<name>.rs`), hinter jeder derselbe vierte Aufrufort für `open` samt
`https://boese.example/x`:

| Erwartung | Formen |
|---|---|
| **Weigerung** (A-A-33) | `r#"…"#`, `br#"…"#`, `cr#"…"#` |
| **Aufrufort und Adresse gefunden** | Zeichenliteral `'"'`, `'\u{22}'`, `'\x22'`, oberhalb U+FFFF; Byteliteral `b'"'`, `b'\x22'`; Zeichenkette, Bytezeichenkette, C-Zeichenkette, Fortsetzungszeile; Zeilen-, Block- und geschachtelter Blockkommentar; Lebenszeit; Apostrophpaarung `['\u{22}','"']` und dieselbe mit einem Zeichen oberhalb U+FFFF |

Alle neunzehn stehen namentlich in der Ausgabe des Laufs und sind damit einzeln nachweisbar. Der
Kopfabschnitt „Die Reichweite dieses Laufs" sagt das jetzt auch: Die Frage heißt nicht mehr „ist
jemandem noch ein Weg eingefallen" (ein Negativbeweis, den niemand führen kann), sondern **„steht
jede Form der Referenz da"**. Die Tabelle der bisher gefundenen Wege bleibt als Geschichte stehen
und ist um den fünften ergänzt; daneben steht, was das **nicht** heißt — dieser Lauf versteht Rust
nicht, er liest Text, und seine Vollständigkeit ist gegengeprobt statt bewiesen, nur eben gegen
eine Liste aus der Referenz statt gegen die Vorstellungskraft des jeweiligen Prüfers.

## A-A-48 — die `9r"x"`-Gegenprobe ist ersatzlos entfallen

Die Rückschau **bleibt**; die Gegenprobe ist weg, weil sie keine Verhaltensprobe war. An ihrer
Stelle steht das Gemessene im Quelltext neben `RAW_STRING_OPENER`: null Unterschiede mit und ohne
Rückschau über acht Dateien, Urtext und Gerüst, 23 Schreibweisen; `rustc` lehnt die
Unterschiedsfälle ab; ohne die Rückschau ist der Ausdruck **strenger**, nie milder. Damit ist auch
gesagt, warum die Verstümmelung L2 die Gegenproben überleben **soll** — und sie tut es jetzt:
Verstümmelung L2 ergibt Code 0, 0 rot, 0 blind.

## Läufe und Messungen

| Lauf | Ergebnis |
|---|---|
| `proof:shell-surface` | grün, Code 0 — 6 Prüfungen, **49** Gegenproben, **0 blind**, 0,6 s |
| davon A-A-47 | **19** Formen, je einzeln in der Ausgabe benannt |
| `pnpm typecheck` | grün, Code 0 |
| `pnpm run proof:codepoints` | grün — 45 bestanden (auch mit dem Zeichen oberhalb U+FFFF im Quelltext) |
| Bestand | kein falscher Alarm; `appdata.rs` und `attachment.rs` (`b"…"`) unauffällig |

**Kunstquellen im Spiegel** (Kopie des Laufs mit umgehängter Wurzel, `src-tauri/src` als echte
Kopie, alles übrige als Verweis; der Bestand blieb unangetastet) — alle **Code 1**:

| Kunstquelle | Ergebnis |
|---|---|
| `['😀','"']` **mit** fremder Adresse | Code 1 — vierter Aufrufort gefunden |
| `['😀','"']` **ohne** fremde Adresse | Code 1 — vierter Aufrufort gefunden |
| Kontrollprobe `['\u{1F600}','"']` | Code 1 — unverändert |
| `['\u{22}','"']`, `cr#"a"b"#`, 24.1.2, 24.1.3 | Code 1 — unverändert |
| Spiegel **ohne** Kunstquelle | Code 0, 6/49/0 |

**Verstümmelungen** — jede einzeln, danach zurückgesetzt. Die neunzehn Formen machen die Befunde
schärfer: Sie nennen jetzt die **Form**, die nicht mehr gefangen wird.

| | Änderung | Ergebnis |
|---|---|---|
| **O** | `u`-Merker gestrichen | 1 blind: „A-A-47: Apostrophpaarung mit einem Zeichen oberhalb U+FFFF" |
| E | Weigerung ausgebaut | 6 blind (drei alte, drei rohe Formen) |
| F | Attribut auf `any(test, …)` geweitet | 1 blind |
| H | `#+` statt `#*` | 1 blind |
| I | Wortlaut A-A-33 (`\br#*"`) | 3 blind (`br`, `cr` namentlich) |
| J | `stripRustStrings` ohne Zeichenliteral | 7 blind |
| K | `stripRustComments` mit Fahne | 3 blind |
| M | Ausdruck zurück auf T-173-3 | 2 blind (`cr` namentlich) |
| N | Zeichenliteral zurück auf die alte Fassung | 3 blind |
| **L2** | Rückschau entfernt | **0 rot, 0 blind — erwartet** (A-A-48) |

`proof:all` auf Weisung **nicht** gefahren.

## Annahmen

1. **`u`-Merker statt der Ersatzpaar-Alternative.** A-A-46 läßt beides zu; der Merker ist ein
   Zeichen, und die Längentreue bleibt, weil `literal[0].length` weiterhin UTF-16-Einheiten zählt.
2. **Die Formen stehen als Zeichen im Quelltext, nicht als Fluchtfolge** — außer den Zeichen
   oberhalb U+FFFF, die als `\u{1F600}` in der JavaScript-Zeichenkette stehen. So bleibt der
   Nachweislauf selbst in ASCII, und `proof:codepoints` hat nichts zu beanstanden.
3. **Neunzehn eigene Gegenproben statt einer Sammelprobe.** Der Lauf ist damit 0,6 s lang statt
   0,5 s, und dafür sagt eine blinde Zeile, **welche** Form gefallen ist — bei O, I, K und M ist
   genau das der Unterschied zwischen einem Befund und einer Suche.
4. **Doppelungen zu den älteren Gegenproben bleiben stehen.** A-A-37 und A-A-42 messen dieselben
   Formen mit anderer Absicht (die Weigerung, nicht die Form); sie zu streichen hieße, die
   Geschichte aus dem Lauf zu nehmen.

## Risiken

- **Die Liste ist der Referenz entnommen, nicht der Sprache selbst.** Wächst Rust um eine Form —
  ein weiteres Literalpräfix, eine weitere Kommentarform —, wächst die Liste nicht von allein.
  Das ist die verbleibende Kante; sie ist benannt, im Kopf des Laufs und hier.
- **Die Entscheidung A-A-43 bleibt offen.** Ein voller Zerleger für Rust wäre die Antwort auf die
  Bauart; bis dahin ist die Reichweite gegengeprobt, nicht bewiesen.

## Offene Fragen

Keine. A-A-44 und A-A-45 (`contrast-check.mjs`) sind nicht Teil dieses Auftrags.

## Nächster Schritt

security-checker mißt die neunzehn Formen und die Verstümmelung O gegen seinen Spiegel nach.
Trägt das, ist die Bedingung aus **E-088 Punkt 4** in der Fassung von **E-089** erfüllt —
A-A-46 gebaut, A-A-47 vollständig — und die Wiedervorlage der Doppelpunktregel wird frei.
