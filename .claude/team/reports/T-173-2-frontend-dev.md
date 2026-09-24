# T-173-2 — Die Weigerung vor der rohen Zeichenkette (A-A-33) und die bewachte Form (A-A-34)

**Aufgabe:** T-173-2 (Nachtrag) — Befunde T-176-1 (muß) und T-176-2 (soll) aus
`docs/bedrohungsmodell.md` Abschnitt 23.
**Status:** fertig
**Datei:** `apps/desktop/scripts/proof-shell-surface.mjs` (einzige Änderung)

## A-A-33 — der Lauf weigert sich, statt zu raten

Neu ist `RAW_STRING_OPENER` und eine Weigerung als **erste** Anweisung der Quellenschleife in
`checkOpenCallSites`: Trifft der Ausdruck, wird ein Befund gemeldet und die Datei **nicht**
beurteilt (`continue`). Der Satz nennt den Grund:

> `<datei>` enthält eine rohe Zeichenkette (`r"…"` oder `r#"…"#`). Die Textwerkzeuge dieses Laufs
> kennen die Form nicht: Ab dort zählen sie Zeichenketten, Kommentare und Klammern falsch, und ein
> Aufrufort oder eine Adresse dahinter bliebe unsichtbar. Eine Aussage über eine Datei, die dieser
> Lauf nicht lesen kann, ist keine — deshalb urteilt er nicht über sie (A-A-33, Befund T-176-1).

**Zwei bewußte Abweichungen vom Wortlaut der Auflage, beide gemessen:**

1. **Gesucht wird auf dem Gerüst, nicht im Urtext.** A-A-33 nennt „deren Text `/\br#*"/` trifft".
   Wörtlich umgesetzt ist der Lauf **heute rot**, und zwar falsch: `appdata.rs` trägt die
   gewöhnliche Zeichenkette `"/inheritance:r"`, und `\br"` trifft deren letzte zwei Zeichen.
   Gemessen (Verstümmelung G, Weigerung auf dem Urtext):

   ```
     FEHL  3 namentliche Aufruforte für `open`, jeder mit seiner Prüfung (T-136-1, A-A-9)
           appdata.rs enthält eine rohe Zeichenkette (`r"…"` oder `r#"…"#`). …
   ```

   Gesucht wird deshalb auf `stripRustStrings(stripRustComments(text))`. Das ist keine Aufweichung:
   Die **erste** rohe Zeichenkette einer Datei steht immer noch im Takt beider Werkzeuge und ist
   dort sichtbar — aus dem Takt laufen sie erst **an** ihr. Was danach kommt, ist gleichgültig,
   weil die Datei da schon abgelehnt ist. Ein `r#"` in einem Kommentar oder in einer gewöhnlichen
   Zeichenkette ist dagegen keine rohe Zeichenkette und löst folgerichtig nichts aus.

2. **`/\bb?r#*"/` statt `/\br#*"/`.** `br"…"` ist dieselbe Form mit demselben Effekt; die Weitung
   geht in die strengere Richtung. Kein `g`-Merker am Ausdruck — ein globaler Ausdruck merkt sich
   zwischen zwei `test`-Aufrufen seine Stelle und übersähe jede zweite Datei.

**Die Zusage in `:372-373` ist berichtigt.** Der Satz „Im Zweifel misst dieser Lauf zu viel, nie zu
wenig" ist ersetzt durch den Absatz „Was diese Grenze nicht leistet (Befund T-176-1)": Er nennt die
rohe Zeichenkette, den gemessenen Fall (vierter Aufrufort dahinter, Lauf grün), die Weigerung als
Antwort — und sagt, daß der alte Satz erst **mit** dieser Weigerung wieder gilt.

## A-A-34 — die Form des Ausschlusses ist jetzt bewacht

Vierte Gegenprobe zu E-082, im vorhandenen Gegenprobenteil, ohne zweiten Lauf: Eine Kunstquelle
`kunst/merkmal.rs` mit `#[cfg(any(test, feature = "dev"))] mod tests { … }` trägt eine fremde
Adresse **und** einen vierten Aufrufort für `open`. Bestanden gilt nur, wenn **beides** gemeldet
wird. Wer den Attributausdruck auf `any(test, …)` weitet, macht sie blind — gemessen unten als
Verstümmelung F.

## Nachweis

| Lauf | Ergebnis |
|---|---|
| `pnpm run proof:shell-surface` | grün, Beendigungscode 0 — 6 Prüfungen und **25** Gegenproben, **0 blind** |
| `pnpm typecheck` | grün, Beendigungscode 0 |
| `pnpm run proof:codepoints` | grün — 45 bestanden |

`proof:all` wurde auf Weisung **nicht** gefahren (fester Port, andere Agenten laufen).

**Die neuen Gegenproben tragen** — jeweils die eigene Umsetzung beschädigt, gemessen, zurückgesetzt:

| Verstümmelung | Ergebnis |
|---|---|
| E — die Weigerung wieder ausgebaut | `A-A-33` **blind** → rot |
| F — Attributausdruck auf `#[cfg(any(test, …))]` geweitet | `A-A-34` **blind** → rot |
| G — Weigerung auf dem Urtext statt auf dem Gerüst | Prüfung 3 rot (falscher Alarm auf `appdata.rs`) |

Die drei Verstümmelungen aus T-173 (A, B, D) und C bleiben unberührt gültig.

## Wenn die Weigerung anschlägt — und sie wird

`attachment.rs` ist die Datei, in der die nächste rohe Zeichenkette entsteht: `r"C:\Users\…"`
schreibt sich in einem Prüffall über Windows-Pfade angenehmer als mit doppelten Rückstrichen.
Dann meldet dieser Lauf die Datei und urteilt nicht mehr über sie. **Was dann zu tun ist, in
dieser Reihenfolge:**

1. **Den Prüffall umschreiben, nicht den Wächter.** `"C:\\Users\\…"` ist derselbe Wert, und der
   Prüffall prüft dasselbe. Das ist der Normalfall und kostet nichts.
2. **Die Weigerung nicht ausbauen.** Sie ist die einzige Stelle, an der dieser Lauf zugibt, daß er
   eine Datei nicht lesen kann. Ohne sie ist er nicht etwa unsicherer, sondern **still** — genau
   der Zustand, den 23.1.1 gemessen hat: grün, während ein vierter Aufrufort für `open` daneben
   steht.
3. **Wird die Form wirklich gebraucht**, ist der Weg ein Zerleger für rohe Zeichenketten in
   **beiden** Textwerkzeugen (`stripRustComments` und `stripRustStrings`), mit eigener Gegenprobe
   für `r"…"`, `r#"…"#` und `br#"…"#`. Das ist eine Entscheidung des Orchestrators, keine Zeile
   nebenbei — und bis dahin gilt Punkt 1.

Derselbe Hinweis steht als Kommentar unmittelbar neben der Weigerung, damit der nächste Leser ihn
dort findet, wo er anschlägt.

## Berichtigung meines eigenen Berichts (T-176-5)

`T-173-frontend-dev.md` behauptet, ohne die dritte Gegenprobe blieben **C und D** unbemerkt.
Gemessen ist **C allein**; B und D machen eine Prüfung rot, aber nur, solange Prüffälle mit
`https://example.org/…` im Baum liegen. Die Einordnung von 23.1.3 ist zutreffend und übernommen:
Die dritte Gegenprobe ist die einzige, deren Aussage nicht am zufälligen Inhalt des Baums hängt.

## Annahmen

1. Die Weigerung sitzt in `checkOpenCallSites` und nicht als eigene Prüfung — dort werden die
   Rust-Quellen gelesen, und dort fällt die Aussage, die ohne sie falsch wäre. Eine abgelehnte
   Datei erzeugt zusätzlich die schon vorhandenen Befunde über fehlende Aufruforte; rot bleibt rot.
2. Die Gegenprobe zu A-A-34 verlangt **beide** Befunde (Adresse und Aufrufort). Ein einzelner
   hätte genügt; zwei messen die Weitung an der Stelle, an der sie weh tut.
3. Die Kunstquellen der Gegenproben tragen erfundene Adressen (`merkmal.example`, `boese.example`)
   und stehen ausschließlich im Nachweislauf, nicht im Rust-Anteil.

## Risiken

- **Ein falscher Alarm bleibt möglich**, wenn jemand `r"` außerhalb einer Zeichenkette und
  außerhalb eines Kommentars schreibt, ohne eine rohe Zeichenkette zu meinen — in Rust gibt es
  diese Schreibweise nicht, aber die Behauptung ruht auf dem Gerüst, nicht auf einem Zerleger.
  Richtung: rot, nicht still.
- **Die Weigerung ist grob.** Sie nimmt die ganze Datei aus der Beurteilung, nicht nur die Zeile.
  Das ist gewollt: Ab der rohen Zeichenkette ist jede Stellenangabe dieses Laufs unzuverlässig.

## Offene Fragen

Keine.

## Nächster Schritt

security-checker mißt die beiden neuen Gegenproben gegen seine Kunstquellen aus 23.1.1 nach
(A-A-33: Befund vorhanden; A-A-34: geweiteter Ausdruck macht blind). Danach ist Punkt 1 der
Prüfung T-176 abnahmefähig.
