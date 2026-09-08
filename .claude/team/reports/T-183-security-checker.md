# T-183 — Die nachgemessene Weigerung, zwei weitere Wächter und der Doppelpunkt als Produktfrage

**Aufgabe:** T-183 (Welle AA) — O-FH, O-FD, O-FO.
**Status:** fertig
**Dateien:** `docs/bedrohungsmodell.md` (neuer Abschnitt 24), diese Datei. **Kein Produktivcode
angefaßt**, keine Kunstquelle im Baum.

## Urteil je Punkt

| Punkt | Urteil |
|---|---|
| **1 — O-FH** (A-A-33 und A-A-34 in gebauter Form) | **Nacharbeit** — A-A-37 (muß), A-A-38 (soll) |
| **2 — O-FD** (`proof:foreign`, `proof:callers`) | **freigegeben mit Auflage** — A-A-39, A-A-40 (beide soll) |
| **3 — O-FO** (Doppelpunkt an der Tür) | **Empfehlung an den Orchestrator**, keine Entscheidung |

## Wie gemessen wurde

Wie in T-176: am Verhalten, außerhalb des Bestands. Zwei Spiegel unter `/tmp` — einer für den
Rust-Anteil samt Fähigkeitenliste, `tauri.conf.json`, `apps/web/src` und `version.ts`, einer für
`apps/web` mit Verweisen auf die echten Modulbestände. Beide Spiegel liefern zeichengleich
dieselbe Ausgabe wie der Bestand (`proof:shell-surface` 6/25/0; `proof:foreign` 14 bestanden,
114 Quelldateien, 165/20/8, 1 Übergangsstelle mit 5 Aufrufen). Kunstquellen und Verstümmelungen
sind dort entstanden und dort geblieben.

Dazu örtlich: `cargo test --lib` (**60 Fälle, 0 Fehler**, unverändert), `proof:callers` (32
bestanden), `proof:codepoints`. **`proof:all` nicht gefahren** (E-083 Punkt 3). Guardian und
42Crunch **nicht** erneut versucht (E-079 Punkt 3).

## Punkt 1 — O-FH

### Abweichung 2 (`b?` statt des Wortlauts): **bestätigt, und tragend**

Nicht kosmetisch. Streicht man `b?`, stellt also den Wortlaut von A-A-33 her, trifft der Ausdruck
`br#"a"b"#` nicht mehr — zwischen `b` und `r` steht keine Wortgrenze. Kunstquelle mit `br#"a"b"#`
und einem vierten Aufrufort dahinter: **0 Befunde**, Lauf 6/25/0, Code 0. Der Wortlaut von A-A-33
wird auf `/\bb?r#*"/` berichtigt. Der Hinweis zum fehlenden `g`-Merker ist ebenfalls richtig.

### Abweichung 1 (Suche auf dem Gerüst): **Anlaß richtig, tragender Satz widerlegt**

Der Anlaß stimmt: `appdata.rs:241` trägt `.arg("/inheritance:r")`, und `\br"` greift dort. Wörtlich
umgesetzt ist der Lauf heute falsch rot.

**Der Satz „die erste rohe Zeichenkette einer Datei steht noch im Takt beider Werkzeuge" ist
falsch.** `stripRustComments` kennt das Zeichenliteral (`proof-shell-surface.mjs:285`),
`stripRustStrings` **nicht** (`:321-350`, es verfolgt nur `"`), und das Gerüst wird mit
`stripRustStrings` **außen** gebaut. Ein `'"'` öffnet dort eine Zeichenkette, die nie zugeht.

Gemessen, Kunstquelle im Baum des Spiegels:

```rust
pub fn trenner() -> char {
    '"'
}

#[cfg(test)]
mod tests {
    const ROH: &str = r#"a"b"#;
    const Z: char = '"';
}

#[tauri::command]
pub fn takt_heimlich(app: AppHandle, url: String) -> Result<(), String> {
    app.shell().open(url, None).map_err(|e| e.to_string())?;
    Ok(())
}
```

**`proof:shell-surface` bleibt grün, Code 0, 6 Prüfungen und 25 Gegenproben, 0 blind** — und die
Schlußzeile sagt dabei, der Rust-Anteil habe „genau diese Aufruforte für `open`", während ein
vierter, ungeprüfter danebensteht. `RAW_STRING_OPENER` trifft den Urtext (`true`), das Gerüst nicht
(`false`).

Variante ohne das zweite Zeichenliteral, dafür mit `https://evil.example/holen`: ebenfalls **0
Befunde** — `stripRustComments` läuft an der rohen Zeichenkette aus dem Takt und liest danach das
`//` in `https://` als Zeilenkommentar.

**Zweiter, unabhängiger Weg:** Rust schachtelt Blockkommentare, `stripRustComments` führt aber eine
Fahne (`:261`, `:301`). `/* aussen /* innen */ er sagte " */` genügt ebenfalls.

**Nähe zum Bestand:** elf Zeichenliterale stehen heute im Rust-Anteil (`':'` in `appdata.rs:363`
und `attachment.rs:303`, dazu `'.'`, `' '`, `'-'`, `'?'`, `'#'`). `'"'` ist keines davon — es ist
die nächste Frage „trägt dieser Name ein Anführungszeichen".

### Die vierte Verstümmelung, die die 25 überlebt — es sind zwei

| Verstümmelung | Bestand | Kunstquelle |
|---|---|---|
| **H** — `#+` statt `#*` | 6/25/**0 blind**, Code 0 | `r"C:\Users\Public\"` mit viertem Aufrufort: **0 Befunde** |
| **I** — `b?` gestrichen (= Wortlaut A-A-33) | 6/25/**0 blind**, Code 0 | `br#"a"b"#` mit viertem Aufrufort: **0 Befunde** |

H ist die ernstere: T-173-2 sagt selbst voraus, die nächste rohe Zeichenkette entstehe als
`r"C:\Users\…"` — und die Gegenprobe, die dazu geschrieben wurde, benutzt `r#"a"b"#`, also die Form
mit Gatter. Gemessen ist die gewählte Form, nicht die vorhergesagte.

### Berichtigung T-176-5: nachgezogen und gegen die 25 bestätigt

Verstümmelung C (Klammern in Zeichenketten zählen mit) gegen den heutigen Stand: **0 Prüfungen rot,
1 Gegenprobe blind**, und es ist die dritte. Nichts anderes fällt auf. Die Einordnung aus 23.1.3
gilt unverändert.

### Das Gegenmittel — gebaut und gemessen, nicht vorgeschlagen

Beide Behebungen am Spiegel gebaut: `stripRustStrings` lernt das Zeichenliteral (dieselbe Zeile wie
`:285`), `stripRustComments` zählt Blockkommentare statt eine Fahne zu führen. Danach: Bestand
**grün** (6/25/0, kein falscher Alarm auf `appdata.rs`); Kunstquelle mit Zeichenliteral **rot**;
Kunstquelle mit fremder Adresse **rot**; Kunstquelle mit geschachteltem Kommentar **rot**.
Wortlaut und Messung stehen als **A-A-37** und **A-A-38** in 24.5.

## Punkt 2 — O-FD

**Die Voraussetzung des Auftrags trifft nicht zu, und das ist die erste Auskunft.** Weder Lauf liest
Text und nimmt eine Form an: `proof-foreign.mjs:166` baut ein Übersetzerprogramm samt Typprüfer aus
derselben `tsconfig.json` wie die Oberfläche; `caller-scan.mjs:59`/`:362` bauen einen Syntaxbaum.
Die Klasse aus T-176-1 gibt es dort strukturell nicht.

### `proof:foreign`

Trifft, wofür es ihn gibt: Kunstquelle mit `<span title={todo.title}>{todo.title}</span>` → **rot,
zwei Befunde**. Untergrenzen gegen Leerlauf sind reichlich vorhanden (`:663`, `:664`, `:735`,
`:923`, `:1020`, `:1103`).

Drei Kunstquellen, je eine Zeile:

| Kunstquelle | Ergebnis |
|---|---|
| `const titel: string = todo.title;` → `{titel}` | **rot** (Abschnitt 4) |
| `const titel = todo.title as string;` → `{titel}` | **grün**, 14/0 |
| `const teile: string[] = []; teile.push(todo.title);` → `{teile[0]}` | **grün**, 14/0 |

Die erste ist genau der Fall, den der Kopf des Laufs für sich beansprucht (`:101-104`). Die zweite
unterscheidet sich um ein Schlüsselwort und wird weder gefunden noch als Grenze genannt. Die dritte
ist derselbe Verlust an einem Parameter, der keiner **eigenen** Funktion gehört. **Beide gehen durch
`pnpm typecheck`** — es gibt keinen zweiten Lauf, der sie aufhielte.

Und die Frage, ob der Lauf merkt, daß er blind ist: Dieselbe Datei mit **verschriebener
Typeinfuhr** (`from "../api/typen"`) zeigt den Titel roh im Inhalt und im `title`-Attribut, `tsc`
meldet `TS2307` — **der Lauf bleibt grün, 14/0**. Er liest keine Übersetzerbefunde. Milder als
T-176-1, weil `pnpm typecheck` es fängt, aber dieselbe Bauart: eine Zusage, deren Träger woanders
steht und nicht benannt ist.

### `proof:callers`

**In dieser Frage der Maßstab dieses Vorhabens**, und das gehört genauso festgehalten wie eine
Lücke: Die Zahl der Aufrufe wird **zweimal** hergeleitet, aus dem Syntaxbaum und aus dem Rohtext,
und Gleichheit verlangt (`:358-362`). Unauflösbares wird gezählt und macht rot (`:277-281`). Die
Selbstproben sind echte Gegenproben — echter Text im Arbeitsspeicher, Zuwachs gegen den
unveränderten Lauf, Anwendbarkeit geprüft, Umkehrung dazu (`:571-655` und Abschnitt 8). Gemessen:
32 bestanden, 0 fehlgeschlagen.

**Die eine Zusage, die niemand mißt.** Der ganze Lauf liest je Fläche **eine** Datei, und sein Kopf
sagt: „Diese Beschränkung ist nur so viel wert wie die Zusicherung, daß es keine zweite gibt. Also
wird sie gemessen und nicht geglaubt." Gemessen wird sie mit
`/(?<![\w.])fetch\s*\(/` (`:406` für `apps/web/src`, `:707` für das Add-in) — **zeichengleich der
Ausdruck, den T-143 S-1 als blind gemessen hat**:

```
gesehen     fetch(url)
UNSICHTBAR  window.fetch(url)
UNSICHTBAR  globalThis.fetch(url)
UNSICHTBAR  self.fetch(url)
UNSICHTBAR  const { fetch: holen } = globalThis
```

Für diese Zusage gibt es **keine einzige Gegenprobe**; die Selbstproben setzen nur Rumpfschlüssel,
Abfrageschlüssel und Wege ein. Die Behebung steht in diesem Bestand bereits geschrieben:
`proof-release-safety.mjs:659-678` führt seit T-146 vier Gegenproben für genau diese vier
Schreibweisen. Belegt am Baum: `apps/outlook-addin/src/ui/App.tsx:58` trägt
`fetch: window.fetch.bind(window)` — zulässig als Port, aber für den Lauf unsichtbar; sein Grün ist
identisch, ob die Zeile dort steht oder nicht.

**Schwere: soll, nicht muß.** Kein Abflußweg — die CSP der Hülle bindet `connect-src` an vier
Marken, die des Add-ins (`apps/outlook-addin/index.html:34`) an den lokalen Dienst und
`appsforoffice.microsoft.com`. Was verlorenginge, ist der **Vertrag**: die Klasse aus T-050, drei
stille Namen, zwei davon wochenlang unbenutzbare Funktionen.

## Punkt 3 — O-FO, Empfehlung

**Was die Sicherheit verlangt:** die Doppelpunktregel **an der Hülle**, auf jeder Plattform,
unverändert. `check_file` ist die einzige Kontrolle zwischen einem gespeicherten Wert und
`Start-Process`/`explorer.exe`, und der Wert kommt an der Tür **vorbei** in den Bestand — VG-1 (die
Routen mit dem Sitzungsgeheimnis) und VG-3 (`UPDATE` mit `sqlite3` auf die Bestandsdatei).

**Was die Sicherheit nicht verlangt:** dieselbe Regel an der Tür. Ein Angreifer nimmt die Tür nie;
für ihn ist ihre Strenge wirkungslos. Nachgerechnet über jede Verwendung eines gespeicherten Pfades
— Öffnen (dort steht `check_file`), Anzeige (fremder Text durch `Foreign`), Protokoll
(`REASON_SHAPE` in `logger.ts:64` läßt keinen Doppelpunkt zu und macht jeden Grund in falscher
Gestalt zu `unclassified`), Export (Anhänge gelangen in keinen), Bildablage (Name von Takt erzeugt)
— trägt der Doppelpunkt außerhalb des Öffnens kein Risiko.

**Die drei Wege:**

1. **Alles bleibt.** Eine Regel, beide Seiten gleich, auf dem Läufer meßbar. Preis:
   `Besprechung 10:30.pdf` unter Linux/macOS unbrauchbar; unter Windows kostet die Regel nichts.
2. **Die Tür warnt nur.** Sicherheitlich unbedenklich, **und trotzdem rate ich ab**: Die Absage
   wandert vom Augenblick der Eingabe, wo sie einen Satz mit Grund hat, hinter einen Klick auf
   einen Anhang, den der Benutzer schon angelegt hat — und es entstehen zwei Wahrheiten über
   dieselbe Frage, mit der milderen an der Stelle, die zuerst gelesen wird (23.2.2).
3. **Plattformabhängig, an beiden Stellen, aus einer Entscheidung.** Sicherheitlich vertretbar: Auf
   ext4/APFS ist der Doppelpunkt gewöhnlich, `Path::file_name()` und das Betriebssystem sind sich
   einig, die Voraussetzung des Befundes gilt dort nicht; ein unter Linux eingetragener Pfad fällt
   unter Windows ohnehin mit `path_not_absolute`. Sein Preis ist die **Meßbarkeit**: A-A-32 hat
   `cargo test --lib` auf `windows-2022` gebracht, aber die pnpm-Nachweise — und damit
   `proof:attachment-parity` aus E-085 — laufen dort **nicht**.

**Empfehlung:** Weg 1 vorerst (Takt ist für Windows gebaut, dort kostet die Regel nichts). Weg 2
**nicht**. Weg 3 nur mit drei Bedingungen: eine Entscheidung an einer Stelle, aus der beide Seiten
die Plattformfrage beziehen; `proof:attachment-parity` trägt die Plattform als Fall und mißt beide
Richtungen für **jede** Plattform; der Nachweis läuft auch auf `windows-2022`. Und **nach**
T-183-1 — der Satz „es gibt genau drei Aufruforte für `open`" ist die halbe Begründung dafür, daß
die Tür überhaupt gelockert werden darf, und er ruht heute auf einem Wächter, der grün bleibt,
während ein vierter danebensteht.

## Befunde

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-183-1** | **muß** | Die Weigerung aus A-A-33 ist mit einem gewöhnlichen `'"'` zu umgehen; `stripRustStrings` kennt das Zeichenliteral nicht, obwohl `stripRustComments` es bei `:285` kennt. Gemessen: Lauf **grün, Code 0, 6/25/0** mit viertem Aufrufort im Baum. Zweiter Weg: geschachtelter Blockkommentar. Der tragende Satz aus T-173-2 ist widerlegt. Gegenmittel **A-A-37**. | frontend-dev |
| **T-183-2** | soll | Zwei Verstümmelungen überleben alle 25 Gegenproben: `#+` statt `#*` (trifft `r"C:\Users\…"`, die vorhergesagte Form) und `b?` gestrichen (= Wortlaut A-A-33, trifft `br#"…"#`). Gegenmittel **A-A-38**. | frontend-dev |
| **T-183-3** | soll | `proof:foreign` verliert die Herkunft still an `as string` und an einem fremden Parameter (`push`); beide grün, beide durch `pnpm typecheck` gedeckt. Die Zeile daneben ist rot und wird im Kopf als abgedeckt genannt. Gegenmittel **A-A-39**. | frontend-dev |
| **T-183-4** | Hinweis | `proof:foreign` liest keine Übersetzerbefunde: verschriebene Typeinfuhr → jede Anzeigestelle `any`, Lauf grün, `tsc` meldet `TS2307`. Gegenmittel **A-A-39**, zweite Hälfte. | frontend-dev |
| **T-183-5** | soll | `proof:callers` mißt seine tragende Zusage („kein zweiter Weg zum Dienst") mit dem Ausdruck, den T-143 S-1 als blind gemessen hat, und hat dafür **keine** Gegenprobe. Behebung steht in `proof-release-safety.mjs:659-678` bereits. Kein Abflußweg (CSP beidseitig), aber der Vertrag aus T-050 wäre unbewacht. Gegenmittel **A-A-40**. | frontend-dev |
| **T-183-6** | Hinweis | `proof:callers` ist im übrigen der **Maßstab**: zwei Herleitungen derselben Zahl, Unauflösbares macht rot, echte Gegenproben mit Zuwachsmessung. Vorlage für jeden neuen Wächter. | Einordnung |
| **T-183-7** | Hinweis | Berichtigung T-176-5 angenommen und gegen die 25 nachgemessen: Verstümmelung C ergibt 0 rot, **1** blind, und es ist die dritte. | Einordnung |
| **T-183-8** | Produktfrage | Der Doppelpunkt an der Tür ist keine Sicherheitsanforderung. Empfehlung: Weg 1 vorerst, Weg 2 nicht, Weg 3 nur mit den drei Bedingungen und **nach** T-183-1. | Orchestrator |

## Neue Auflagen (Wortlaut und Messung in `docs/bedrohungsmodell.md` 24.5)

| ID | Kurz | Zuständig |
|---|---|---|
| **A-A-37** | Der Satz, auf dem die Weigerung ruht, wird hergestellt und gemessen: `stripRustStrings` lernt das Zeichenliteral, `stripRustComments` zählt Blockkommentare, und zwei heute blinde Gegenproben (Zeichenliteral, geschachtelter Kommentar) müssen die Weigerung erzeugen. Beide Behebungen sind am Spiegel gebaut und gemessen. | frontend-dev |
| **A-A-38** | Die Gegenprobe zu A-A-33 mißt **alle vier** Formen (`r"…"`, `r#"…"#`, `br"…"`, `br#"…"#`); der Wortlaut von A-A-33 wird auf `/\bb?r#*"/` berichtigt. | frontend-dev |
| **A-A-39** | `proof:foreign` findet den Verlust der Herkunft an einer `as`-Zusicherung und an einem fremden Parameter; und er wird rot, wenn das Programm nicht fehlerfrei übersetzt (`ts.getPreEmitDiagnostics`). Drei Gegenproben, alle drei heute grün. | frontend-dev |
| **A-A-40** | Der Ausdruck für „kein zweiter Weg zum Dienst" wird durch den aus `proof-release-safety.mjs` ersetzt, die zulässige Ausnahme wird benannt statt erschlichen, und vier Gegenproben (eine je Schreibweise) kommen in beide Selbstprobenteile. | frontend-dev |

## Annahmen

1. **Alle Messungen liefen gegen Spiegel außerhalb des Bestands.** Beide Spiegel liefern
   zeichengleich dieselbe Ausgabe wie der Bestand; das ist der Beleg, daß sie dasselbe messen.
   Kein Produktivcode, keine Prüfdatei und keine Kunstquelle wurde im Baum angefaßt — frontend-dev
   und integration-dev liefen gleichzeitig.
2. **Die zwei Behebungen zu A-A-37 sind Vorschläge in gemessener Form, keine Vorgabe der
   Umsetzung.** Ich habe sie gebaut, um zu belegen, daß sie den Bestand nicht falsch rot machen —
   nicht, um frontend-dev die Zeile vorzuschreiben.
3. **`proof:foreign` habe ich mit der Fassung im Arbeitsverzeichnis gemessen.** frontend-dev
   arbeitet gerade in `apps/web/**`; die Zahlen (114/165/20/8) können sich bis zur Abnahme
   verschieben. Die drei Kunstquellen hängen nicht daran.
4. **A-A-34 gilt als erfüllt.** Die vierte Gegenprobe ist da, sie trägt (Verstümmelung F macht sie
   rot, gemessen von T-173-2 und hier nicht erneut), und die Form des Ausschlusses ist damit
   bewacht. A-A-33 gilt als **teilweise** erfüllt: die Weigerung steht, ihr Wirkungsbereich ist
   kleiner als der Wortlaut.
5. **Die Lieferkette wurde nicht erneut gemessen** (E-079, T-B06).

## Risiken

- **T-183-1 hebt die Aussage von `proof:shell-surface` auf, solange sie besteht.** Der Lauf
  behauptet in seiner Schlußzeile namentlich, es gebe genau drei Aufruforte für `open`. Diese
  Behauptung ist an eine Schreibweise gebunden, die niemand kennt, der sie versehentlich verwendet
  — und `'"'` ist die gewöhnlichste denkbare.
- **Die Kopplung zu O-FO ist echt und nicht nur formal.** Die Empfehlung, die Tür lockern zu
  **dürfen**, ruht auf „`check_file` ist die einzige Kontrolle". Wer T-183-1 offen läßt und
  gleichzeitig die Tür lockert, tauscht zwei Riegel gegen einen Wächter, der grün bleiben kann.
- **T-183-3 und T-183-5 sind beide Wächter über Wächter.** Sie kosten je zwei bis vier Gegenproben
  und verhindern jeweils eine Klasse, die diese Prüfung nur gefunden hat, weil sie Kunstquellen
  gefahren ist statt Code zu lesen.
- **T-183-5 ist eine Wiederholung.** Dieselbe Lücke, derselbe Ausdruck, dieselbe Werkstatt, drei
  Wellen später und in einer anderen Datei. Das ist ein Hinweis darauf, daß eine Behebung, die
  nicht als Vorlage benannt wird, nicht wandert.

## Offene Fragen

1. **Gilt A-A-33 als erfüllt oder als teilweise erfüllt?** Ich habe es als teilweise bewertet
   (24.6). Die Streichung oder Fortschreibung in der Auflagenliste ist eine Entscheidung des
   Orchestrators.
2. **Soll die Weigerungsregel aus A-A-33 sinngemäß auch für `proof:openapi`, `proof:route-policy`
   und `proof:template-fields` gestellt werden?** Ich habe in dieser Aufgabe nur die zwei
   beauftragten Läufe geprüft.
3. **O-FO ist eine Entscheidung, keine Prüfung.** Meine Empfehlung steht in 24.3.4; die Wahl
   zwischen Weg 1 und Weg 3 gehört dem Orchestrator.

## Nächster Schritt

1. **T-183-1 (A-A-37) vor der Abnahme der Welle** — frontend-dev, zwei kleine Änderungen in
   `proof-shell-surface.mjs` plus zwei Gegenproben. Ohne sie ist die Aussage „genau drei
   Aufruforte" nicht gedeckt, und O-FO hängt daran.
2. **A-A-38 in derselben Aufgabe**, gleiche Datei, gleicher Gegenprobenteil.
3. **A-A-40** an frontend-dev, mit `proof-release-safety.mjs:659-678` als Vorlage — die billigste
   der vier Auflagen, weil die Behebung schon geschrieben ist.
4. **A-A-39** an frontend-dev, nächste Welle; die zweite Hälfte (`getPreEmitDiagnostics`) ist
   erheblich billiger als die erste und trägt allein schon einen der beiden Befunde.
5. **O-FO** an den Orchestrator als Entscheidungsvorlage, **nach** Schritt 1.
