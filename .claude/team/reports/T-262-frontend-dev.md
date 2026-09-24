# T-262 — `attachment.rs` und der übrige Rust-Anteil der Hülle

Aufgabe: T-262 — `apps/desktop/src-tauri/src/attachment.rs`, 1352 Zeilen
Status: fertig
Artefakte:
- `docs/decisions/shell.md` (neu)
- `.claude/team/reports/T-262-frontend-dev.md` (dieser Bericht)
- **Kein Rust-Quelltext geändert.** Δ = 0 Zeilen in `apps/desktop/src-tauri/src/**`.

---

## 1. Das Urteil vorweg

**Kein Schnitt — weder in `attachment.rs` noch in einer anderen Rust-Datei.**

Die Vorgabe des Auftraggebers lautet „nur dort aufteilen, wo Dateien **mehrere
Verantwortlichkeiten oder übermäßige Größe** haben". Keine der elf Rust-Dateien
erfüllt eine der beiden Bedingungen. Die Messung steht unten; die Begründung
zusätzlich dauerhaft in `docs/decisions/shell.md`, damit die nächste Runde sie
nicht wiederholen muß.

## 2. Die Messung

Zeilen sind hier dreigeteilt gezählt, weil zwei Anteile mitzählen, die keine
Struktur sind: der Prüfteil in `#[cfg(test)]` (den `CLAUDE.md` als benannte
Ausnahme neben seinen Gegenstand stellt) und die Begründungsprosa
(`//!`, `///`, `//`).

| Datei | gesamt | Produktivcode | Prüfcode | Prosa | leer |
|---|---:|---:|---:|---:|---:|
| `attachment.rs` | 1352 | **150** | 609 | 500 | 93 |
| `appdata.rs` | 492 | **237** | 90 | 116 | 49 |
| `sidecar.rs` | 461 | **175** | 89 | 156 | 41 |
| `idle/linux.rs` | 166 | **154** | 0 | 6 | 6 |
| `lib.rs` | 298 | **141** | 28 | 106 | 23 |
| `idle.rs` | 208 | **126** | 59 | 9 | 14 |
| `outlook_certificate.rs` | 124 | **100** | 11 | 6 | 7 |
| `identity.rs` | 198 | **96** | 17 | 72 | 13 |
| `release.rs` | 358 | **61** | 110 | 158 | 29 |
| `menu.rs` | 66 | **44** | 0 | 12 | 10 |
| `main.rs` | 8 | **4** | 0 | 3 | 1 |
| **Summe** | **3731** | **1288** | 1013 | 1144 | 286 |

Der Befund in einem Satz: **Die größte Datei des Baumes hat den fünftkleinsten
Produktivteil.** `attachment.rs` ist nicht groß, sie ist geprüft — 30 der 69
Prüffälle von `cargo test --lib` stehen in ihr (43 %), gegen 11 in `sidecar.rs`,
11 in `appdata.rs`, 9 in `release.rs`, 4 in `idle.rs`, 2 in `lib.rs`, je 1 in
`identity.rs` und `outlook_certificate.rs`.

Aufteilung der 1352 Zeilen von `attachment.rs`:

| Abschnitt | Zeilen | davon Code |
|---|---:|---:|
| Modulkopf `//!` (Z. 1–140) | 140 | 0 |
| `use` (141–144) | 4 | 3 |
| Konstanten + `Rejection` + `key()` (145–215) | 71 | 44 |
| `check_link` (216–268) | 53 | 27 |
| Dateiprüfung: 4 Helfer + `check_file` (269–417) | 149 | 60 |
| die zwei `#[tauri::command]` (418–467) | 50 | 16 |
| Kommentarblock des `unit-tester` vor dem Prüfteil (468–508) | 41 | 0 |
| `#[cfg(test)] mod tests` (509–1352) | 844 | 609 |

## 3. `attachment.rs` — eine Verantwortlichkeit

Die Datei ist die einzige Kontrolle zwischen einer Zeichenkette aus dem Bestand
und `ShellExecuteW` beziehungsweise `xdg-open`. Ihre Fläche nach außen sind
genau zwei Namen. Gemessen über den ganzen Baum:

```
lib.rs:235:            attachment::takt_open_attachment_link,
lib.rs:236:            attachment::takt_open_attachment_file
```

Das sind **alle** Fundstellen. Nichts außerhalb der Datei benutzt `check_link`,
`check_file` oder `Rejection`. Ein kleinerer öffentlicher Umfang ist bei zwei
Befehlen nicht möglich.

## 4. Die abgelehnten Schnitte, mit Grund

### 4.1 `attachment/{link,file,rejection}.rs` — abgelehnt

Der naheliegende Schnitt trennt Verweisprüfung (27 Zeilen Code), Dateiprüfung
(60) und Ablehnungsvokabular (44). Vier gezählte Kosten, kein gezählter Gewinn:

1. **Die Ablehnungsgründe sind eine Menge, kein Paar.** `Rejection` trägt 16
   Ausprägungen, acht je Art. Der Prüffall
   `a_a_29_jeder_ablehnungsgrund_traegt_genau_seinen_eigenen_schluessel`
   (Z. 1003–1074) schreibt sie in **einem** Feld `[Rejection; 16]` aus und
   verlangt zusätzlich paarweise Verschiedenheit über alle 16 — quer über beide
   Arten. Nach dem Schnitt urteilte er aus einer dritten Datei über zwei, die er
   nicht mehr sieht. Dasselbe gilt für seine Gegenprobe (Z. 1076–1128), die
   genau das Paar `PathUnc ↔ PathNotAbsolute` vertauscht.
2. **Der Modulkopf ist ein durchgehendes Argument.** Drei seiner acht
   Abschnitte — „Warum die ganze Kontrolle in dieser Datei liegt", „Warum die
   Prüfung hier sitzt und nicht im Eingabefeld", „Die drei Arten, und warum es
   nur zwei Befehle gibt" — gelten für beide Hälften zugleich. Sie ließen sich
   nur doppeln oder in eine `mod.rs` heben, wo sie niemand liest, der `file.rs`
   öffnet.
3. **Der Prüfteil zerfiele in drei Blöcke**, und die drei Prüfhelfer
   `eigenes_verzeichnis`, `echte_datei`, `fehlende_datei` (Z. 518–541, 21
   Zeilen) bräuchten eine geteilte Ablage — also neue Produktivfläche für einen
   reinen Prüfzweck. `CLAUDE.md` gibt diese Blöcke dem `unit-tester`; sie
   **mitzunehmen** wäre erlaubt gewesen, sie zu **zerreißen** widerspricht dem
   Grund der Ausnahme. Der 41-zeilige Kommentarblock aus T-160 (Z. 468–508)
   hätte zusätzlich willkürlich einer der drei Dateien zugeschlagen werden
   müssen.
4. **Der Wächter müßte nachgeführt werden.**
   `apps/desktop/scripts/proof-shell-surface.mjs` führt in `OPEN_CALL_SITES`
   (Z. 225–243) jeden Aufrufort von `open` **namentlich** mit Datei, Funktion
   und der Prüfung, die im selben Funktionsrumpf vor ihm stehen und deren
   Ergebnis das Öffnen tragen muß. Zwei der drei Einträge nennen
   `attachment.rs`. Ein Schnitt verlangte, genau die Liste zu ändern, die die
   Kontrolle mißt.

Dagegen stünden drei Dateien mit 27, 60 und 44 Zeilen Code, drei neue
Modulköpfe und drei `use`-Zeilen.

### 4.2 Ein gemeinsamer `open`-Helfer für `release.rs` und `attachment.rs` — abgelehnt

Drei Aufruforte von `app.shell().open(…)` sähen nach Dopplung aus. Der
Modulkopf von `attachment.rs` verbietet die Zusammenführung ausdrücklich: Ein
gemeinsamer Ausgang, der eine Zeichenkette nimmt, ist die Stelle, an der ein
falsch gesetztes Kennzeichen eine Adresse durch die Pfadprüfung schickt
(A-A-1). Die drei Aufruforte sind **absichtlich** drei, jeder mit seiner Prüfung
im selben Rumpf, und `proof:shell-surface` mißt genau diese Zuordnung.

### 4.3 Modulkopf nach `docs/decisions/` verlagern — abgelehnt

In den Wellen T-250 bis T-252 ist Rückblicksprosa aus `apps/web/src` nach
`docs/decisions/**` gewandert; die Trennlinie war „was eine Wiederholung
verhindert, bleibt im Code". Die 140 Zeilen hier fallen fast vollständig auf die
bleibende Seite: T-136 (das Shell-Plugin prüft aus Rust heraus nicht), T-145
(die Normalisierungsfalle), T-156 (`x.lnk.` schlägt `Path::extension()`), T-164
(`x.lnk::$DATA`). Jeder dieser Absätze verhindert, daß jemand eine Prüfung
„aufräumt". Der Kopf sagt es selbst: „Wer hier später aufräumen und
`Path::extension()` zurückholen will: Der Fall heißt `x.lnk.`, er ist gemessen."
Und: Ein Schnitt an der Prosa änderte am Größenurteil nichts, weil der
Produktivteil bei 150 Zeilen steht.

### 4.4 `appdata.rs` in Auflösung / Rechte / Ablageort-Befund — abgelehnt

Größter Produktivteil des Baumes (237 Zeilen) und der einzige echte Kandidat
nach Umfang. Die drei Teile sind aber eine Kette, keine drei Dinge: `prepare`
ruft `apply_permissions` **und** `sync_warning`, und der Modulkopf begründet die
Reihenfolge als Sicherheitsaussage („erst anlegen, dann Rechte setzen, dann den
Sidecar starten"). Eine Verantwortlichkeit: der Ablageort und seine Rechte.

### 4.5 `idle/windows.rs` und `idle/macos.rs` neben `idle/linux.rs` — abgelehnt

Hier ist eine Grenze bereits ausgeschrieben — `mod linux` —, aber sie ist nach
Umfang gezogen und nicht nach Symmetrie: Linux braucht 154 Zeilen für drei
Sitzungsprotokolle (Wayland `ext-idle-notify`, Mutter, X11 ScreenSaver), Windows
braucht 28, macOS 12. Zwei weitere Dateien wären Symmetrie um ihrer selbst
willen.

### 4.6 `lib.rs`, `sidecar.rs`, `release.rs`, `identity.rs`, `outlook_certificate.rs`, `menu.rs`, `idle/linux.rs` — abgelehnt

`lib.rs` ist die Kompositionswurzel; `run()` ist die Startreihenfolge aus dem
Modulkopf, Schritt für Schritt — sie zu teilen hieße, eine Reihenfolge über
Dateien zu verteilen. Die übrigen tragen je ein Thema und liegen bei 44 bis 175
Zeilen Produktivcode. `idle/linux.rs` (154) hat drei Hintergründe, aber
`run_x11` und `run_gnome` sind 10 und 14 Zeilen; die Rückfallkette ist der
Gegenstand.

## 5. Verschobene `#[cfg(test)]`-Blöcke

**Keine.** Kein Prüffall wurde verschoben, gestrichen, umgeschrieben oder
abgeschwächt. `pnpm test:rust` steht zeichengleich bei der Vorgabe.

## 6. Läufe

| Lauf | Ergebnis |
|---|---|
| `pnpm test:rust` | **68 bestanden, 0 fehlgeschlagen**, 1 übersprungen (`idle::tests::live_desktop_reports_activity_without_a_webview`, „Requires an actual supported desktop session"). Vorgabe gehalten. |
| `pnpm typecheck` | **fehlerfrei** um 19:56; 7 Pakete, dazu `typecheck:test` über 7 Prüf-Projekte und `typecheck:e2e`. Um 20:12 nicht mehr — Grund unten, nicht aus diesem Auftrag. |
| `pnpm run proof:shell-surface` | **7 Prüfungen und 54 Gegenproben bestanden.** Die Ausgabe nennt die drei Aufruforte namentlich: `release.rs > takt_open_release() → release_url()`, `attachment.rs > takt_open_attachment_link() → check_link()`, `attachment.rs > takt_open_attachment_file() → check_file()`. |
| `pnpm run verify:bundle` | **19 bestanden, 0 fehlgeschlagen.** Bündel: 60 + 18 + 24 Dateien, 1212 KiB, Node v22.23.2 mit geprüfter Prüfsumme, 85 MiB Binärdatei. (Erster Anlauf war an belegtem Port 17843 gescheitert, siehe unten; der zweite lief durch.) |
| `pnpm run proof:all` | **rot, dreimal, dreimal fremd.** Anlauf 1 und 2 am belegten Port 17843, jeweils nach grünen Teilläufen (Anlauf 2 kam bis `proof:conflicts` mit 98 bestanden, 0 fehlgeschlagen). Anlauf 3, im Portfenster gestartet, fällt schon bei `proof:codepoints` — an einem gebrochenen Import in `packages/domain`. Siehe unten. |

### Zur Fremdursache, gemessen und nicht vermutet

Auf 17843/17844 lauscht `node tests/e2e/support/version-check-entry.ts`,
gestartet von `npx playwright test` (PID 4864 ab 19:59:09 mit
`playwright.web-build.config.ts`, danach ein zweiter Lauf ab 20:02). `CLAUDE.md`
sagt, warum es nicht bei einem bleibt: „`pnpm test:e2e` fährt drei
Playwright-Konfigurationen nacheinander." Der Lauf hebt und beendet den Dienst je
Prüffall; die Ports sind in Abständen von rund 45 Sekunden frei und wieder
belegt. Zusätzlich laufen zwei Vite-Prozesse (5173 als `dev`, 4319 als
`preview`).

### Die zweite Fremdursache: `packages/domain` steht gerade offen

Der dritte Anlauf lief in einem freien Portfenster los und fiel sofort:

```
packages/domain/src/board.ts:66
import { isVisibleInPool, matchesPool } from './tag.ts';
SyntaxError: The requested module './tag.ts' does not provide an export named 'isVisibleInPool'
```

Nachgemessen mit `tsc -p packages/domain/tsconfig.json --noEmit`:

```
src/board.ts(65,15): error TS2305: Module '"./tag.ts"' has no exported member 'MatchesPoolRule'.
src/board.ts(65,32): error TS2305: Module '"./tag.ts"' has no exported member 'Pool'.
src/board.ts(66,10): error TS2305: Module '"./tag.ts"' has no exported member 'isVisibleInPool'.
src/board.ts(66,27): error TS2305: Module '"./tag.ts"' has no exported member 'matchesPool'.
```

`isVisibleInPool` steht inzwischen in `packages/domain/src/pool.ts:1115`;
`board.ts` importiert es weiterhin aus `tag.ts`. Das ist der halbfertige Stand
der laufenden Aufteilung von `packages/domain` durch `domain-dev`. Um 19:56 war
`pnpm typecheck` über alle Pakete grün, um 20:12 nicht mehr — dazwischen liegt
kein Schreibzugriff von mir. `packages/**` ist mir in diesem Auftrag
ausdrücklich verschlossen; ich habe nichts angefaßt und nichts repariert.

**Ich habe diese Prozesse nicht beendet.** `tests/e2e/**` gehört dem
`e2e-tester`, der Lauf ist offensichtlich seiner und läuft jetzt. Einen fremden
Prüflauf abzuschießen, um den eigenen grün zu bekommen, ist die schlechtere
Wahl. Die Wiederholungsläufe stehen unten unter „Nächster Schritt".

Wichtig für die Bewertung: **Beide Abbrüche liegen vor der ersten Zeile, die
irgendetwas mit dieser Aufgabe zu tun hätte**, und diese Aufgabe hat keine
Quelldatei geändert. Der Stand von `git show HEAD:…` und der Arbeitsbaum sind
für alle elf Rust-Dateien zeichengleich (492/1352/198/208/298/8/66/124/358/461/166
Zeilen, HEAD = Arbeitsbaum).

## 7. Annahmen

1. **Δ = 0 ist ein Ergebnis.** Ich habe die Vorgabe „kein Umbau auf Verdacht"
   wörtlich genommen und die Messung als Lieferung behandelt.
2. **`docs/decisions/shell.md` ist neu angelegt**, obwohl die übrigen Papiere
   dort Merkmale von `apps/web` betreffen. Der Auftrag nennt `docs/decisions/**`
   ausdrücklich; ein Papier, das eine **Nichthandlung** begründet, ist sonst
   nach Ende der Welle nur noch im Berichtsordner zu finden.
3. Der Kommentarblock der Zeilen 468–508 (der T-160-Rückblick über den Prüfteil)
   steht formal außerhalb des `#[cfg(test)]`-Blocks, ist aber vollständig eine
   Aussage über ihn und trägt die Unterschrift des `unit-tester`. Ich habe ihn
   deshalb wie dessen Fläche behandelt und nicht angefaßt.

## 8. Risiken

- **Keine sicherheitsrelevante Änderung**, weil keine Änderung. Die einzige
  Kontrolle vor `open` steht unverändert; `proof:shell-surface` bestätigt die
  drei Aufruforte mit ihren Prüfungen.
- Der Wächter `OPEN_CALL_SITES` bindet die Kontrolle an **Dateinamen**. Das ist
  richtig so und zugleich eine Bremse: Jeder künftige Schnitt an
  `attachment.rs` oder `release.rs` muß diese Liste mitführen, sonst wird der
  Lauf rot — was er soll. Wer sie mitführt, ändert die Prüfung der Prüfung; das
  gehört in denselben Auftrag und vor die Augen des `security-checker`.

## 9. Offene Fragen an den Orchestrator

1. **Prosadichte und Sprache der drei Dateien von außerhalb der Wellen.**
   Gemessen: `idle.rs` 9 Prosazeilen auf 185 Code, `idle/linux.rs` 6 auf 154,
   `outlook_certificate.rs` 6 auf 111 — 4 bis 5 Prozent, und die wenigen
   Kommentare sind **englisch**. Der übrige Baum liegt bei 27 bis 92 Prozent und
   ist deutsch kommentiert. Alle drei stammen aus den Pull Requests #5 bis #16.
   `CLAUDE.md` verlangt Dokumentation auf Deutsch. Das ist keine Strukturfrage
   und deshalb hier nicht behoben — soll daraus ein eigener Auftrag werden?
   (Betroffen wären genau drei Dateien und nur Kommentare, keine Bezeichner.)
2. **`proof:all` ist für diesen Auftrag ungemessen geblieben** — nicht wegen
   T-262, sondern weil `packages/domain` gerade halbfertig offensteht (siehe
   oben) und davor ein fremder Playwright-Lauf die Ports hielt. Der Lauf muß
   nachgeholt werden, sobald `domain-dev` seine Aufteilung geschlossen hat.
   Genügt bis dahin der Nachweis, daß der Rust-Baum zeichengleich zu `HEAD`
   steht und `test:rust`, `proof:shell-surface` und `verify:bundle` grün sind?
3. **Drei Prüfläufe des Tores brauchen 17843/17844 exklusiv** und vertragen
   keinen zweiten Prüfpfad daneben (B-1.5). Solange E2E- und Prüf-Wellen
   gleichzeitig laufen, mißt der zweite Agent nicht seinen Code, sondern die
   Ports des ersten. Das ist eine Ablauffrage, keine Codefrage.

## 10. Nächster Schritt

Zwei Dinge, beide nicht in meiner Hand:

1. `domain-dev` schließt die Aufteilung von `packages/domain` — `board.ts`
   importiert `Pool`, `MatchesPoolRule`, `isVisibleInPool` und `matchesPool`
   noch aus `tag.ts`, wo sie nicht mehr stehen.
2. Danach, in einer Runde ohne gleichzeitigen E2E-Lauf, einmal
   `pnpm run proof:all` und die Zahl in diesen Bericht nachtragen.

Für T-262 selbst ist nichts offen. Die Entscheidung steht in
`docs/decisions/shell.md`; wer sie umstoßen will, hat mit `OPEN_CALL_SITES` in
`proof-shell-surface.mjs` und mit den beiden `a_a_29`-Prüffällen zwei Stellen zu
beantworten, bevor die erste Zeile umzieht.
