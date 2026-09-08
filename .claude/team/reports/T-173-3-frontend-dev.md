# T-173-3 — Das Gerüst lernt das Zeichenliteral und zählt Kommentare (A-A-37, A-A-38)

**Aufgabe:** T-173-3 — Befunde T-183-1 (muß) und T-183-2 (soll) aus `docs/bedrohungsmodell.md`
Abschnitt 24.
**Status:** fertig
**Datei:** `apps/desktop/scripts/proof-shell-surface.mjs` (einzige Änderung)

## Der Satz, auf dem meine Abweichung ruhte, war falsch — und ist jetzt gemessen

Ich hatte in T-173-2 begründet, die Weigerung bleibe scharf, weil die **erste** rohe Zeichenkette
einer Datei noch im Takt beider Textwerkzeuge stehe. Der Nachweis dazu war Prosa, und er ist
widerlegt. Behoben ist beides, was ihn widerlegt hat:

1. **`stripRustStrings` kennt jetzt das Zeichenliteral** — mit demselben Ausdruck
   `/^'(\\.|[^'\\])'/`, den `stripRustComments` seit je trägt und der die Lebenszeit `&'a str`
   unterscheidet. Der Rumpf wird längentreu geleert, `b'"'` und `'\"'` fallen unter dieselbe Zeile.
   Nebenwirkung, die zum Ziel gehört: `'{'` und `'}'` zählen seither auch in der Klammerzählung
   nicht mehr mit.
2. **`stripRustComments` zählt Blockkommentare** — `inBlock` (Fahne) ist `blockDepth` (Zähler);
   ein geöffneter Kommentar im Kommentar erhöht, ein Schluß senkt. Rust schachtelt, eine Fahne
   nicht.
3. **Der Absatz „Was diese Grenze nicht leistet" nennt beides** und sagt jetzt ausdrücklich, daß
   die Weigerung nur so weit trägt wie das Gerüst, daß der tragende Satz zweimal falsch war, und
   daß er im Gegenprobenteil steht, statt behauptet zu werden.

## Die Kunstquellen aus Abschnitt 24 — je rot, am Spiegel gemessen

Gemessen nicht am Text, sondern am Verhalten: eine Kopie des Laufs mit umgehängter Wurzel in einem
Temporärverzeichnis, `capabilities`, `apps/web/src`, `build-app.mjs` und `version.ts` als
Verweise, `src-tauri/src` als echte Kopie. Der Bestand wurde dabei nicht angefaßt.

| Kunstquelle | vor der Behebung | nach der Behebung |
|---|---|---|
| 24.1.2 — `'"'`, dann `r#"a"b"#`, dann vierter Aufrufort | grün (T-183 gemessen), mit meinen neuen Gegenproben: **3 blind** | **rot**, Code 1 — Weigerung |
| 24.1.2 — dieselbe Bauart mit fremder Adresse statt Aufrufort | wie oben | **rot**, Code 1 — Weigerung |
| 24.1.3 — geschachtelter Blockkommentar statt Zeichenliteral | grün, mit den neuen Gegenproben: **3 blind** | **rot**, Code 1 — Weigerung |

**Kein falscher Alarm auf `appdata.rs`:** Der Bestand läuft grün, `"/inheritance:r"` löst nichts
aus. Die Suche bleibt auf dem Gerüst — der Anlaß der Abweichung besteht fort, nur ihre Begründung
ist jetzt hergestellt statt behauptet.

## Vier neue Gegenproben (A-A-37, A-A-38)

Die eine A-A-33-Gegenprobe aus T-173-2 (nur `r#"a"b"#`) ist ersetzt:

| Gegenprobe | Was sie einsetzt |
|---|---|
| **A-A-38:** alle vier Formen der rohen Zeichenkette | `r"C:\Users\Public\"`, `r#"a"b"#`, `br"C:\Temp\"`, `br#"a"b"#` — je eine Kunstquelle, **jede** muß die Weigerung erzeugen |
| **A-A-37:** Zeichenliteral `'"'` | Kunstquelle 24.1.2, Weigerung verlangt |
| **A-A-37:** geschachtelter Blockkommentar | Kunstquelle 24.1.3, Weigerung verlangt |
| **A-A-37:** dieselben zwei Köpfe **ohne** rohe Zeichenkette | dann greift keine Weigerung — verlangt sind der vierte Aufrufort **und** die fremde Adresse, je Kopf |

Die letzte mißt die beiden Behebungen dort, wo sie wirken (im Gerüst), und nicht über den Umweg
der Weigerung. Kunstquellen entstehen über `blindingSource(head, raw)` aus 23.1.1/24.1.2, damit
Kopf und rohe Zeichenkette einzeln getauscht werden können.

## Elf Verstümmelungen, elf Treffer

Jede gegen den Bestand gefahren, danach zurückgesetzt:

| Verstümmelung | Ergebnis |
|---|---|
| A — Ausschluß bis Dateiende | 0 rot, **2 blind** |
| B — Ende an der ersten Klammer | 1 rot, 1 blind |
| C — Klammern in Zeichenketten zählen mit | 0 rot, **1 blind** (die dritte E-082-Gegenprobe — T-176-5/T-183-7 bestätigt) |
| D — Klammern in Kommentaren zählen mit | 1 rot, 1 blind |
| E — Weigerung ausgebaut | 0 rot, **3 blind** |
| F — Attributausdruck auf `any(test, …)` geweitet | 0 rot, **1 blind** (A-A-34) |
| G — Weigerung auf dem Urtext statt auf dem Gerüst | 1 rot (falscher Alarm `appdata.rs`) |
| **H — `#+` statt `#*`** | 0 rot, **1 blind** (A-A-38) — überlebte vorher alle 25 |
| **I — `b?` gestrichen (Wortlaut A-A-33)** | 0 rot, **1 blind** (A-A-38) — überlebte vorher alle 25 |
| **J — `stripRustStrings` ohne Zeichenliteral** | 0 rot, **2 blind** (A-A-37) |
| **K — `stripRustComments` mit Fahne statt Zähler** | 0 rot, **2 blind** (A-A-37) |

J und K sind der Kern: Sie stellen genau den Zustand her, in dem T-183 den Lauf grün gemessen hat
— und jetzt ist er rot, **ohne** daß eine Kunstquelle im Bestand liegen muß.

## Läufe

| Lauf | Ergebnis |
|---|---|
| `proof:shell-surface` | grün, Code 0 — 6 Prüfungen, **28** Gegenproben, **0 blind** |
| `pnpm typecheck` | grün, Code 0 |
| `pnpm run proof:codepoints` | grün — 45 bestanden |
| die drei Kunstquellen aus Abschnitt 24, je einzeln im Spiegel | je **Code 1** |
| `appdata.rs` | kein Befund |

`proof:all` auf Weisung **nicht** gefahren.

## Annahmen

1. **Der Anlaß der Abweichung bleibt.** Gesucht wird weiter auf dem Gerüst und nicht im Urtext;
   Verstümmelung G zeigt unverändert, daß der Wortlaut über den Urtext heute falsch rot ist.
   Neu ist nicht der Ort der Suche, sondern daß das Gerüst die zwei gemessenen Löcher nicht mehr
   hat und daß der Satz darüber gegengeprobt ist.
2. **`'{'` und `'}'` zählen ab jetzt in keiner Klammerzählung mehr mit.** Das ist eine stille
   Verbesserung derselben Zeile; sie kann nur Blöcke **enger** schneiden, nie weiter.
3. **Die Klasse ist nicht abschließend aufgezählt** (24.1.3 nennt das ausdrücklich). Deshalb
   liegt das Gewicht auf den Gegenproben J und K: Wer eines der Textwerkzeuge wieder vereinfacht,
   wird rot, gleich welche Erscheinung er dabei übersieht.

## Risiken

- **Ein dritter Weg aus dem Takt ist nicht ausgeschlossen.** Genannt sind zwei, behoben sind zwei.
  Ein voller Zerleger für Rust ist die Alternative, und die wäre eine Entscheidung — die
  Weigerung samt Gegenproben ist die billigere Hälfte, nicht die vollständige.
- **Die Weigerung bleibt grob** (ganze Datei statt Zeile) und schlägt bei jedem `r"…"` an.
  Was dann zu tun ist, steht unverändert in `T-173-2-frontend-dev.md` und als Kommentar neben der
  Weigerung: Prüffall mit doppelten Rückstrichen schreiben, Weigerung **nicht** ausbauen.

## Offene Fragen

Keine. A-A-39 (`proof:foreign`) und A-A-40 (`proof:callers`) stehen ebenfalls auf frontend-dev,
sind aber nicht Teil dieses Auftrags; `proof:callers` liegt zudem in `apps/local-api/**` und damit
außerhalb meiner Dateihoheit.

## Nächster Schritt

security-checker mißt die drei Kunstquellen aus 24.1.2/24.1.3 und die Verstümmelungen H, I, J, K
gegen seinen eigenen Spiegel nach. Danach ist Punkt 1 der Prüfung T-183 abnahmefähig; A-A-39
gehört in die nächste Welle.
