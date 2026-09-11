# Hülle — warum der Rust-Anteil nicht geteilt wurde

Dieses Papier hält eine **Nichthandlung** fest. Es entstand in T-262, als der
Auftraggeber `apps/desktop/src-tauri/src/attachment.rs` mit 1352 Zeilen
namentlich zur Prüfung stellte. Seine Vorgabe war eng:

> Rust/Tauri ebenfalls nur dort aufteilen, wo Dateien **mehrere
> Verantwortlichkeiten oder übermäßige Größe** haben.

Gemessen wurde der gesamte Rust-Baum. Geschnitten wurde nichts. Warum, steht
hier — damit die nächste Runde nicht dieselbe Messung noch einmal machen muß.

## Was an einer Rust-Datei dieses Bestands gezählt gehört

Die Zeilenzahl einer Datei sagt hier weniger als anderswo, weil zwei Dinge
mitgezählt werden, die keine Struktur sind: der Prüfteil in `#[cfg(test)]` und
die Begründungsprosa. Beides gehört in diesen Dateien ausdrücklich dorthin —
der Prüfteil, weil `CLAUDE.md` ihn als benannte Ausnahme neben seinen Gegenstand
stellt; die Prosa, weil sie eine Wiederholung eines gemessenen Fundes
verhindert.

Die Messung trennt deshalb drei Größen. Stand T-262:

| Datei | gesamt | Produktivcode | Prüfcode | Prosa |
|---|---:|---:|---:|---:|
| `attachment.rs` | 1352 | **150** | 609 | 500 |
| `appdata.rs` | 492 | **237** | 90 | 116 |
| `sidecar.rs` | 461 | **175** | 89 | 156 |
| `idle/linux.rs` | 166 | **154** | 0 | 6 |
| `lib.rs` | 298 | **141** | 28 | 106 |
| `idle.rs` | 208 | **126** | 59 | 9 |
| `outlook_certificate.rs` | 124 | **100** | 11 | 6 |
| `identity.rs` | 198 | **96** | 17 | 72 |
| `release.rs` | 358 | **61** | 110 | 158 |
| `menu.rs` | 66 | **44** | 0 | 12 |
| `main.rs` | 8 | **4** | 0 | 3 |

Die größte Datei des Baumes hat den fünftkleinsten Produktivteil. Sie ist nicht
groß, sie ist **geprüft**: 30 der 69 Prüffälle von `cargo test --lib` stehen in
ihr. Der ganze Rust-Anteil der Hülle trägt 1288 Zeilen Produktivcode.

## `attachment.rs` — eine Verantwortlichkeit, kein Schnitt

Die Datei ist die einzige Kontrolle zwischen einer Zeichenkette aus dem Bestand
und `ShellExecuteW` beziehungsweise `xdg-open`. Das ist **eine** Aufgabe, und
ihre Fläche nach außen sind genau zwei Namen: `takt_open_attachment_link` und
`takt_open_attachment_file`. Nichts außerhalb der Datei benutzt `check_link`,
`check_file` oder `Rejection`; die einzigen zwei Fundstellen im übrigen Baum
sind die beiden Zeilen der Befehlsregistrierung in `lib.rs`.

### Der geprüfte Schnitt: `link` / `file` / `rejection`

Der naheliegende Schnitt trennt Verweisprüfung (27 Zeilen Code),
Dateiprüfung (60) und Ablehnungsvokabular (44). Er wurde durchgerechnet und
verworfen. Die Kosten, gezählt:

1. **Die Ablehnungsgründe sind eine Menge, kein Paar.** `Rejection` hat 16
   Ausprägungen, acht je Art. Der Prüffall
   `a_a_29_jeder_ablehnungsgrund_traegt_genau_seinen_eigenen_schluessel` mißt
   sie in **einem** ausgeschriebenen Feld und verlangt paarweise
   Verschiedenheit über alle 16 — quer über beide Arten. Nach dem Schnitt
   urteilte er aus einer dritten Datei über zwei, die er nicht mehr sieht.
2. **Der Modulkopf ist ein durchgehendes Argument, keine Sammlung.** Von seinen
   139 Zeilen gelten die Abschnitte „Warum die ganze Kontrolle in dieser Datei
   liegt", „Warum die Prüfung hier sitzt und nicht im Eingabefeld" und „Die drei
   Arten, und warum es nur zwei Befehle gibt" für beide Hälften zugleich. Sie
   ließen sich nur doppeln oder in eine `mod.rs` heben, wo sie niemand liest,
   der `file.rs` öffnet.
3. **Der Prüfteil müßte in drei Blöcke zerfallen**, und die drei Helfer
   `eigenes_verzeichnis`, `echte_datei`, `fehlende_datei` (21 Zeilen) bräuchten
   dafür eine geteilte Ablage — also neue Produktivfläche für einen reinen
   Prüfzweck. `CLAUDE.md` gibt diese Blöcke dem `unit-tester`; sie mitzunehmen
   ist erlaubt, sie zu zerreißen widerspricht dem Grund der Ausnahme.
4. **Der Wächter müßte nachgeführt werden.** `proof:shell-surface` führt in
   `OPEN_CALL_SITES` jeden Aufrufort von `open` **namentlich** mit Datei,
   Funktion und der Prüfung, die im selben Funktionsrumpf vor ihm stehen muß.
   Zwei der drei Einträge nennen `attachment.rs`. Ein Schnitt verlangte, genau
   die Liste zu ändern, die die Kontrolle mißt — für einen Gewinn, der in
   Zeilen nicht existiert.

Dagegen stünde: drei Dateien mit 27, 60 und 44 Zeilen Code, drei neue
Modulköpfe, drei `use`-Zeilen. Eine ehrliche große Datei ist besser als drei
künstliche kleine.

### Der geprüfte Schnitt: ein gemeinsamer `open`-Helfer

`release.rs` und `attachment.rs` rufen an drei Stellen `app.shell().open(…)`.
Ein gemeinsamer Helfer wäre die klassische Entdopplung — und ist hier
ausdrücklich verboten. Der Modulkopf von `attachment.rs` sagt den Grund seit
T-147: Ein gemeinsamer Ausgang, der eine Zeichenkette nimmt, ist die Stelle, an
der ein falsch gesetztes Kennzeichen eine Adresse durch die Pfadprüfung schickt.
Die drei Aufruforte sind **absichtlich** drei, jeder mit seiner eigenen Prüfung
im selben Rumpf, und `proof:shell-surface` mißt genau das.

## Die übrigen Dateien

- **`appdata.rs`** (237 Zeilen Code, größter Produktivteil des Baumes) sieht
  nach drei Teilen aus — auflösen, Rechte setzen, Ablageort beurteilen. Sie sind
  aber eine Kette: `prepare` ruft `apply_permissions` und `sync_warning`, und
  der Modulkopf begründet die Kette als Reihenfolge („erst anlegen, dann Rechte,
  dann den Sidecar"). Eine Verantwortlichkeit: der Ablageort und seine Rechte.
- **`lib.rs`** ist der Kompositionswurzel-Fall. `run()` ist die Startreihenfolge
  aus dem Modulkopf, Schritt für Schritt. Sie zu teilen hieße, eine Reihenfolge
  über Dateien zu verteilen.
- **`idle.rs`** hat die Grenze bereits gezogen, wo sie sich lohnt: `idle/linux.rs`
  steht getrennt, weil dort drei Sitzungsprotokolle 154 Zeilen brauchen. Windows
  (28 Zeilen) und macOS (12) danebenzustellen wäre Symmetrie um ihrer selbst
  willen.
- **`sidecar.rs`**, **`release.rs`**, **`identity.rs`**,
  **`outlook_certificate.rs`**, **`menu.rs`** tragen je ein Thema und sind unter
  200 Zeilen Code.

## Ein Nebenbefund, der nicht in diesen Auftrag gehörte

Die Prosadichte des Rust-Baums zerfällt scharf in zwei Gruppen. Die im
Wellenmodell entstandenen Dateien tragen 27 bis 92 Prozent Prosa gemessen am
Code; `idle.rs`, `idle/linux.rs` und `outlook_certificate.rs` tragen 4 bis 5
Prozent — und ihre wenigen Kommentare sind englisch, während der übrige Baum
deutsch kommentiert ist. Alle drei stammen aus den Pull Requests #5 bis #16,
also von außerhalb der Wellen. Der Befund ist gemessen, nicht behoben: Er ist
keine Strukturfrage und gehört in einen eigenen Auftrag.

## Woher dieses Papier kommt

T-262. Kein Schnitt, Δ = 0 Zeilen im Rust-Baum. `pnpm test:rust` steht
unverändert bei 68 bestanden, 0 fehlgeschlagen, 1 übersprungen.
