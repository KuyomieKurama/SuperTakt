# T-176 — Zwei Nachschauen vor der Abnahme: die verkleinerte Schranke und der Lauf, der ohne Klick löscht

**Aufgabe:** T-176 (Welle Z) — O-ET (beide Hälften) und O-EN.
**Status:** fertig
**Dateien:** `docs/bedrohungsmodell.md` (neuer Abschnitt 23), diese Datei. Kein Produktivcode
angefaßt.

## Urteil je Punkt

| Punkt | Urteil |
|---|---|
| **1 — O-ET, erste Hälfte** (E-082, Ausschluß der `#[cfg(test)] mod`-Blöcke) | **Nacharbeit** — A-A-33 (muß), A-A-34 (soll) |
| **2 — O-ET, zweite Hälfte** (A-A-28 in gebauter Form, dritter Zustand der Rückfrage) | **freigegeben** — A-A-35 als Auflage für später, ohne Hinderung |
| **3 — O-EN** (`image-sweep.ts`) | **freigegeben mit Auflage** — A-A-36 |

## Wie gemessen wurde

Nicht am Text der Änderungen, sondern am Verhalten. Eine Kopie von
`apps/desktop/scripts/proof-shell-surface.mjs` mit umgehängter Wurzelkonstante liegt außerhalb
des Bestands (`/tmp`), ihre Prüffunktionen sind bereits exportiert. Dagegen liefen **zehn
Kunstquellen** (jede mit einer Adresse an der Stelle, an der sie sichtbar bleiben muß) und
**sieben Verstümmelungen** der Umsetzung, jede als eigene Kopie. Der Bestand wurde dabei nicht
verändert.

Dazu örtlich: `cargo test --lib` in `apps/desktop/src-tauri` (60 Fälle, 0 Fehler, sechs mit
Präfix `a_a_28_`), `proof:shell-surface` (6 Prüfungen, 23 Gegenproben, 0 blind),
`proof:codepoints`. **`proof:all` nicht gefahren** (E-083 Punkt 3, Port 17843). Guardian und
42Crunch **nicht** erneut versucht (E-079 Punkt 3); statt eines elften Vermerks steht in 23.0 die
Bewertung des neuen Prüfauftrags.

## Punkt 1 — der Ausschluß der Prüfmodule

### (a) Blockgenau?

**Für alles, was heute im Baum steht: ja.** Die Grenze wird auf dem Gerüst gezogen
(`proof-shell-surface.mjs:379`), die Tiefenzählung endet an der **zugehörigen** Klammer
(`:396-406`), ein Block ohne schließende Klammer wird gar nicht ausgeschlossen (`:406`). Zehn
Kunstquellen — `}` im Kommentar, `}` in einer Zeichenkette, verschachtelter Block, Adresse
**vor** dem Block, `'{'` und `'}'` als Zeichenliteral, Attribut zwischen `#[cfg(test)]` und
`mod` — wurden **alle zehn** gemeldet.

**Die elfte nicht.** `stripRustComments` und `stripRustStrings` kennen die rohe Zeichenkette von
Rust nicht. Enthält sie ein Anführungszeichen, laufen beide Zustandsautomaten aus dem Takt, und
der Ausschluß endet **hinter** dem Modul:

```rust
#[cfg(test)]
mod tests {
    const S: &str = r#"a"b"#;
}

#[tauri::command]
pub fn takt_heimlich(app: AppHandle, url: String) -> Result<(), String> {
    app.shell().open(url, None).map_err(|e| e.to_string())?;
    let _ = "https://boese.example/x";
    Ok(())
}
```

Diese Datei in `src-tauri/src/` gelegt, alles übrige unverändert: **`proof:shell-surface` bleibt
grün, Beendigungscode 0.** Ein vierter Aufrufort für `open` und eine zweite fremde Adresse sind
zugleich unsichtbar.

Zwei Einordnungen, beide für das Urteil wichtig:

- **Keine Verschlechterung durch T-173.** Dieselbe Kunstquelle gegen die Fassung **vor** dem
  Ausschluß: ebenfalls null Befunde. Die Blindheit steckt in den Textwerkzeugen und ist so alt
  wie sie.
- **Die Zusage darüber stimmt trotzdem nicht.** `:372-373` sagt „Im Zweifel misst dieser Lauf zu
  viel, nie zu wenig". Für die rohe Zeichenkette ist es umgekehrt.

Heute steht keine rohe Zeichenkette im Rust-Anteil. `attachment.rs` ist die Datei, in der die
nächste am ehesten entstünde — ein Prüffall über Windows-Pfade schreibt sich mit `r"C:\Users\…"`
angenehmer als mit doppelten Rückstrichen. Der Befund ist einen bequemen Prüffall entfernt.

### (b) Bleibt gemessen, was nicht die ausgeschlossene Form ist?

**Ja, an allen vier verlangten Stellen, gemessen und nicht gelesen.** `#[cfg(test)]` vor `use`,
vor einer einzelnen Funktion, `#[cfg(any(test, …))]`, `#[cfg(test)] mod tests;` mit dem Modul in
eigener Datei: In jedem Fall scheitert der Attributausdruck (`:384`, verlangt zeichengenau
`cfg(test)`) oder der Kopfausdruck (`:393`, verlangt die Modulzeile **mit** öffnender Klammer),
der Ausschluß unterbleibt, die eingesetzte Adresse wird gemeldet.

### (c) Tragen die Gegenproben?

Die vier Verstümmelungen aus T-173 sind nachgemessen. **Die Behauptung darüber ist zu
berichtigen:**

| Verstümmelung | Prüfungen rot | Gegenproben blind | ohne die dritte Gegenprobe |
|---|---|---|---|
| A — Ausschluß bis Dateiende | 0 | 2 | bemerkt |
| B — Ende an der ersten Klammer | 1 | 1 | bemerkt |
| C — Klammern in Zeichenketten zählen mit | 0 | 1 | **unbemerkt** |
| D — Klammern in Kommentaren zählen mit | 1 | 1 | bemerkt |

T-173 berichtet, ohne die dritte Gegenprobe blieben **C und D** unbemerkt; gemessen ist es **C
allein**. Die Einordnung geht aber in die andere Richtung: B und D machen eine Prüfung nur
deshalb rot, weil im Baum gerade Prüffälle mit `https://example.org/…` liegen. Verschwänden sie,
wären beide so still wie C. **Die dritte Gegenprobe ist damit mehr wert als der Bericht sagt —
sie ist die einzige, deren Aussage nicht am zufälligen Inhalt des Baums hängt.**

**Die fünfte Verstümmelung, die alle drei überlebt.** Der Attributausdruck in `:384` wird
geweitet, so daß auch `#[cfg(any(test, …))]` den Ausschluß auslöst:

```js
const attribute = /#\s*\[\s*cfg\s*\(\s*(?:test|any\([^)]*\))\s*\)\s*\]/g;
```

Gegen den Bestand: **6 Prüfungen grün, 23 Gegenproben bestanden, 0 blind.** Keine der drei
E-082-Gegenproben bemerkt etwas, weil alle drei mit `#[cfg(test)]` arbeiten. Der Unterschied ist
der ganze Punkt der Entscheidung: Ein Modul unter `#[cfg(any(test, feature = "dev"))]` **wird**
übersetzt, sobald das Merkmal gesetzt ist. Gemessen mit einer Kunstquelle dieser Form, die einen
vierten Aufrufort enthält: unveränderter Lauf **Beendigungscode 1**, verstümmelter Lauf **0**.

E-082 Punkt 1 begründet den Ausschluß damit, daß `#[cfg(test)]` nicht ausgeliefert wird. Diese
Begründung trägt genau so weit wie die Form, auf die sie sich stützt — und daß die Form eng
bleibt, ist heute unbewacht.

## Punkt 2 — A-A-28 in gebauter Form

### Die Hülle

**Reihenfolge und Plattformunabhängigkeit entsprechen der Auflage, zeichengenau.**
`check_file` (`apps/desktop/src-tauri/src/attachment.rs:387-417`): leer, Länge, Steuerzeichen,
`is_unc` (`:400`), `is_absolute` (`:403`), `has_stream_separator` (`:406`),
`has_indirect_extension` (`:409`), `is_file` (`:412`). A-A-28 verlangt „nach der
Absolutheitsprüfung und **vor** der Endungsprüfung" — genau das steht dort.

`has_stream_separator` (`:301-306`) trägt **kein** `#[cfg(windows)]`, fragt `path.file_name()`
und damit nur den letzten Bestandteil; `Rejection::PathStreamSeparator` (`:188`) hat seinen
eigenen Schlüssel (`:210`).

- **Warum nach `is_absolute`:** `C:\datei.txt` käme unter Linux sonst mit dem falschen Grund
  zurück. Sicherheitlich gleichwertig, beide Zweige weisen ab; ein Prüffall hält es fest.
- **Warum der rohe Name statt `effective_file_name`:** Die Beschneidung dort kann keinen
  Doppelpunkt entfernen — beide Wege liefern dieselbe Antwort. Bestätigt.
- **Vor der Existenzprüfung:** ja, und gemessen.

Sechs Prüffälle mit Präfix `a_a_28_` laufen, darunter die Gegenprobe
`gegenprobe_a_a_28_die_fassung_vor_t_167_war_bei_drei_faellen_anders`. Seit
`.github/workflows/pruefung.yml` (Matrix `ubuntu-24.04`/`windows-2022`, `fail-fast: false`, bei
jedem Anstoß) laufen die Windows-Zweige zum ersten Mal auf dem Betriebssystem, über das sie etwas
behaupten. **T-164-1 behoben, A-A-32 erfüllt.**

### Die Oberfläche — dieselbe Wahrheit oder eine zweite?

**Dieselbe, und der Grund ist die Richtung.** `foreseeableRefusalOf`
(`apps/web/src/lib/attachmentLabel.ts:270-274`) kann die Rückfrage nur **enger** machen: Steht
ein Satz in `foreseenRefusal`, entfällt der Öffnen-Knopf (`AttachmentOpenDialog.tsx:236`,
`:364-368`); steht keiner, läuft der Klick unverändert über `openAttachmentFile` in `check_file`.
Es gibt keinen Zweig, in dem die Vorhersage etwas **öffnet**.

Beide Abweichungsrichtungen durchgerechnet:

- **Milder als die Hülle** (UNC, nicht absolut, zu lang, Steuerzeichen, fehlende Datei): Ausgang
  ist der Fehlerzustand **im** Dialog — das Verhalten von vor T-167. Kein Zuwachs an Fläche.
- **Strenger als die Hülle:** konstruktiv ausgeschlossen. `lastSeparator` (`:148-150`) schneidet
  an `/` **und** `\`, `Path::file_name()` unter Linux nur an `/`. Der Name der Oberfläche ist
  stets ein **Suffix** des Namens der Hülle; enthält das Suffix einen Doppelpunkt, enthält ihn
  der längere Name auch. Unter Windows sind beide gleich.

Die fünf Endungen kommen aus `@takt/domain` statt abgeschrieben zu sein; `extensionOf`
(`:218-232`) gibt für einen Namen mit Doppelpunkt ausdrücklich nichts zurück; `runsWhenOpened`
hängt hinter `blocked` (`:237`), so daß der Dialog nicht zugleich „wird nicht geöffnet" und „wird
ausgeführt" sagt.

Was bleibt: Die Gleichsortierung beider Reihenfolgen ist heute unbewacht (A-A-35). Das hindert
die Freigabe nicht.

## Punkt 3 — der Aufräumlauf

Der Code hält, was der Kopf zusagt: `listImages()` (`image-sweep.ts:102`), dann
`knownImageTargets(found)` (`:105`), dann die Schleife (`:107-112`); der Aufruf steht in
`main.ts:315-325`, also **vor** `listen`.

### Jede Verzweigung

| Fall | Verhalten | Zweifel richtig? |
|---|---|---|
| Verzeichnis nicht lesbar / nicht vorhanden | `listImages` fängt und gibt `[]` (`attachment-store.ts:427-445`), Lauf endet bei `:103` | ja |
| Name ohne die erwartete Form | `GENERATED_NAME_SHAPE` (`:132`) läßt ihn nicht in die Liste | ja |
| Unterordner, Symlink, halbe Kopie | `entry.isFile()` schließt aus | ja |
| `knownImageTargets` wirft (Tabelle fehlt nach Rückweg 0015) | äußeres `catch` (`:113`), Warnzeile, **kein** Entfernen | ja |
| ein Abfrageblock wirft | dieselbe Klammer, Schleife hat nicht begonnen | ja |
| `removeImage` → `unknown_name` | Form erneut gemessen, Datei bleibt | ja |
| `removeImage` → `failed` (`EBUSY`) | eigene Protokollzeile, nicht gezählt | ja |
| `removeImage` wirft | äußeres `catch`, Rest bleibt liegen | ja |
| Bestand wächst zwischen den Schritten | siehe unten | ja, aber der Träger steht anderswo |
| **Antwort kommt, ist aber leer** | jede Datei gilt als Waise | **nein** |

### Der Bestand, der zwischen den Schritten wächst

Die Reihenfolge stimmt, und eine Kopie, die dazwischen entsteht, überlebt. **Der Beleg liegt aber
nicht dort, wo der Kommentar ihn sucht.** „Solange keine Route zuhört" gilt für **diesen**
Prozeß. Daß es keinen zweiten gibt, hängt an `tauri_plugin_single_instance`
(`apps/desktop/src-tauri/src/lib.rs:105`), registriert als erstes Plugin und damit vor dem
`setup`, in dem der Sidecar entsteht. Der Portanschlag (`main.ts:373`, `EADDRINUSE`) trüge es
**nicht** — er greift erst beim Lauschen, also nach dem Aufräumen. Im Entwicklungsbetrieb (API
von Hand gestartet) gibt es die Einzigkeit gar nicht; das Fenster ist schmal und die Folge eine
verlorene Bildkopie, kein Datenabfluß.

### Die eine Verzweigung, an der der Zweifel falsch fällt

„Bleibt die Antwort aus, wird nichts entfernt" stimmt. Eine **leere** Antwort ist aber keine
ausbleibende, und sie wird als Beweis der Verwaistheit gelesen. Die Abfrage lautet
`WHERE a.kind = 'image' AND a.target IN (…)` (`repo-attachments.ts:187-215`); der Filter ist
nötig, weil `ix_todo_attachment_image` ein **Teilindex** über `WHERE kind = 'image'` ist. Zugleich
ist die Menge der Arten nach Migration 0015 ausdrücklich **Daten und keine Schemaklausel** — der
ganze Zweck der Nachschlagetabelle `todo_attachment_kind` ist, daß eine vierte Art ein `INSERT`
ist und kein Umbau.

Bekäme ein Bild eine zweite Art, zählte diese Abfrage die zugehörigen Zeilen nicht mit, und der
nächste Start entfernte **Kundenmaterial, das einen Eigentümer hat**. Kein Angriff; ein
Datenverlust durch eine Migration, die an ganz anderer Stelle geschrieben wird.

## Befunde

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-176-1** | **muß** | Eine rohe Zeichenkette mit Anführungszeichen macht den Rest einer Rust-Datei für `proof:shell-surface` unsichtbar; gemessen mit einem vierten Aufrufort für `open` dahinter — Lauf grün, Beendigungscode 0. Älter als T-173 (Fassung davor ebenfalls blind), aber die Zusage in `:372-373` sagt das Gegenteil. Gegenmittel **A-A-33**. | frontend-dev |
| **T-176-2** | soll | Der Ausschluß ist an seiner **Form** unbewacht: Weitung auf `#[cfg(any(test, …))]` überlebt alle 23 Gegenproben (0 blind, 0 rot). Gemessen: unverändert Code 1, verstümmelt Code 0. Gegenmittel **A-A-34**. | frontend-dev |
| **T-176-3** | soll | Der Aufräumlauf liest eine **leere** Antwort als Beweis der Verwaistheit; `kind = 'image'` ist eine harte Annahme über eine absichtlich erweiterbare Menge. Gegenmittel **A-A-36**, zweite Hälfte. | domain-dev |
| **T-176-4** | Hinweis | Die Reihenfolge-Zusage des Aufräumlaufs wird von `tauri_plugin_single_instance` (`lib.rs:105`) getragen, nicht vom fehlenden Lauscher; der Portanschlag trägt sie nicht. Gegenmittel **A-A-36**, erste Hälfte. | domain-dev |
| **T-176-5** | Hinweis | Berichtigung zu `T-173-frontend-dev.md`: Ohne die dritte Gegenprobe bliebe **C allein** unbemerkt, nicht C und D. B und D fallen nur wegen des zufälligen Inhalts des Baums auf — die dritte Gegenprobe ist damit **wertvoller** als der Bericht sagt. | Einordnung, keine Behebung |
| **T-176-6** | Hinweis | Vorhersage und Kontrolle sind heute zufällig gleich sortiert. Gegenmittel **A-A-35**. | unit-tester |

## Neue Auflagen (Wortlaut und Messung in `docs/bedrohungsmodell.md` 23.5)

| ID | Kurz | Zuständig |
|---|---|---|
| **A-A-33** | `proof:shell-surface` weigert sich, eine Rust-Quelle mit roher Zeichenkette (`/\br#*"/`) zu beurteilen, und meldet das als Befund; die Zusage in `:372-373` wird berichtigt. Gegenprobe: die Kunstquelle aus 23.1.1 muß einen Befund erzeugen. | frontend-dev |
| **A-A-34** | Vierte E-082-Gegenprobe mit geweitetem Attributausdruck: eine Adresse unter `#[cfg(any(test, feature = "…"))]` muß gemeldet werden. | frontend-dev |
| **A-A-35** | Prüffall hält `ForeseeableRefusal` gegen `Rejection::key()` und mißt für eine ausgeschriebene Fallliste denselben Schlüssel auf beiden Seiten. | unit-tester |
| **A-A-36** | Erste Hälfte: der Kopf von `image-sweep.ts` benennt `tauri_plugin_single_instance` als Träger. Zweite Hälfte: der Lauf prüft, daß `todo_attachment_kind` genau die drei bekannten Arten führt, und räumt bei Abweichung **gar nicht** auf. | domain-dev |

## Annahmen

1. **Die Messung lief gegen eine Kopie außerhalb des Bestands.** `proof-shell-surface.mjs` wurde
   nicht verändert; die Kopie in `/tmp` unterscheidet sich in genau einer Zeile (der Wurzelpfad).
   Verstümmelungen und Kunstquellen sind dort entstanden und dort geblieben.
2. **„Auf jeder Plattform" wurde auf Linux gemessen** und für Windows aus dem Code gelesen. Die
   `#[cfg(windows)]`-Fälle laufen seit `pruefung.yml` in der Reihe; ihr Ergebnis dort habe ich
   nicht abgerufen.
3. **A-A-32 gilt als erfüllt**, weil `pruefung.yml` bei jedem Anstoß läuft und nicht am Etikett.
   Das ist eine Bewertung, keine Entscheidung — sie liegt beim Orchestrator.
4. **Die Lieferkette wurde nicht erneut gemessen** (E-079, T-B06). In 23.0 steht stattdessen eine
   Bewertung des neuen Prüfauftrags.

## Risiken

- **T-176-1 ist die einzige Kontrolle über eine Kontrolle.** Der Wächter behauptet, es gebe genau
  drei Aufruforte für `open`. Solange die Blindheit besteht, ist diese Behauptung an eine
  Schreibweise gebunden, die niemand kennt, der sie versehentlich verwendet.
- **T-176-3 ist ein Datenverlustrisiko, kein Angriffsweg** — aber es trifft Kundenmaterial und
  löst ohne Klick aus. Es steht deshalb bei „soll" und nicht bei „Hinweis".
- **A-A-34 und A-A-35 sind beide Wächter über Wächter.** Sie kosten je einen Prüffall und
  verhindern jeweils eine Klasse, die diese Prüfung nur deshalb gefunden hat, weil sie
  Verstümmelungen gefahren ist statt Code zu lesen.

## Offene Fragen

1. **Soll A-A-33 im selben Zug auf `apps/local-api` und `apps/web` ausgedehnt werden?** Dort gibt
   es keine rohen Zeichenketten, aber `proof:foreign` und `proof:callers` arbeiten mit derselben
   Bauart „Text lesen, Form annehmen". Ich habe sie in dieser Aufgabe nicht geprüft.
2. **Gilt A-A-32 als abgeschlossen?** Ich habe es in 23.0 so bewertet; die Streichung aus der
   Auflagenliste ist eine Entscheidung des Orchestrators.

## Nächster Schritt

1. **T-176-1 (A-A-33) vor der Abnahme der Welle** — frontend-dev, eine Zeile in
   `proof-shell-surface.mjs` plus eine Gegenprobe. Ohne sie ist die Aussage „genau drei
   Aufruforte" nicht gedeckt.
2. **A-A-34 in derselben Aufgabe**, gleiche Datei, gleicher Gegenprobenteil.
3. **A-A-36** an domain-dev, beide Hälften zusammen — die zweite ist eine Abfrage über eine
   Tabelle mit drei Zeilen.
4. **A-A-35** an unit-tester, nächste Welle; kein Hindernis für die Abnahme.
