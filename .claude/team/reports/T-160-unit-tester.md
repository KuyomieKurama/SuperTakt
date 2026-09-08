# T-160 — Die letzte Kontrolle vor `open` bekommt Prüffälle

**Rolle:** unit-tester **Datum:** 2026-09-05

---

## Kurzfassung

```
Aufgabe: T-160 — Die letzte Kontrolle vor `open` bekommt Prüffälle
Status: fertig
```

**Rust-Fälle in `attachment.rs`: vorher 31, nachher 53 (davon 22 neu — 19 laufen auf jedem
Läufer, 3 ausschließlich unter `#[cfg(windows)]`).** Auf diesem (Linux-)Läufer zeigt
`cargo test --lib` deshalb `50 passed`. **9 der neuen Fälle wären vor der Behebung aus T-157
rot gewesen** — nicht behauptet, sondern gemessen: Ich habe `has_indirect_extension` in einer
Arbeitskopie auf die alte, ungeprüfte Fassung (`Path::extension()` ohne Beschneidung)
zurückgesetzt und `cargo test --lib` erneut laufen lassen. Ergebnis: **2 von 19**
Nicht-Windows-Testfunktionen schlagen fehl (`umleitungsendungen_werden_erkannt_…` und die
eigens gebaute Gegenprobe `gegenprobe_die_alte_fassung_…`), und die Gegenprobe zählt intern
exakt **9** blinde Einzelfälle — dieselbe Zahl, die T-157 selbst gemessen hat. Danach die
Originaldatei byte-identisch wiederhergestellt (`diff -q` bestätigt) und erneut grün gefahren
(50/50). Zusätzlich wären **2 der 3 windows-only Fälle** ebenfalls rot gewesen — sie prüfen
genau die Windows-Namensauflösung, die T-156-1 in Produktion getroffen hat.

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/desktop/src-tauri/src/attachment.rs` | **einzige Änderung: der `#[cfg(test)] mod tests { … }`-Block am Dateiende**, plus ein Kopfkommentar davor. Kein Zeichen im Produktivteil (`check_link`, `check_file`, `is_unc`, `has_indirect_extension`, `effective_file_name`) angefasst. |
| `apps/local-api/test/access/attachment-store.test.ts` | **neu.** 5 Fälle für `AttachmentBlobPort.removeImage` (O-DC): `removed` bei vorhandener und bei bereits fehlender Kopie, `unknown_name` bei Formfehler und ohne eingerichtetes Anwendungsdatenverzeichnis, `failed` samt Protokollzeile. |
| `apps/local-api/test/usecases/attachment-input-validation.test.ts` | **neu.** 7 Fälle für die Türhälfte von TP-ANH-15 bis -20 (O-CK): `addAttachment` lehnt `javascript:`, `file:///`, einen UNC-„Verweis" und einen UNC-Dateipfad mit den richtigen, benannten Meldungen ab; `.lnk` wird an der Tür abgewiesen, `.bat` nicht; zwei Gegenproben zeigen, dass ein gültiger Wert weiter bis zur (hier fehlenden) Transaktion kommt. |

Keine Produktivdatei ist in diesem Bestand verändert. Zwei Dateien wurden während der
Rot-vor-Grün-Nachweise **temporär** verändert und danach byte-identisch wiederhergestellt
(siehe unten) — das war keine Änderung, sondern die Messung selbst.

---

## Rot vor Grün — drei Nachweise

### 1. `attachment.rs` — die Gegenprobe gegen die alte Fassung

```
$ cargo test --lib   # mit has_indirect_extension = alte Fassung (Path::extension(), kein Trim)
running 19 tests
...
test attachment::tests::gegenprobe_die_alte_fassung_waere_bei_neun_der_folgenden_faelle_blind_gewesen ... FAILED
  panicked at: neue Fassung muss ablehnen: /x/rechnung.lnk.
test attachment::tests::umleitungsendungen_werden_erkannt_auch_mit_nachgestelltem_punkt_oder_leerzeichen ... FAILED
  panicked at: T-156-1: nachgestellter Punkt
test result: FAILED. 17 passed; 2 failed

$ # Originaldatei byte-identisch wiederhergestellt (diff -q bestätigt „identisch")
$ cargo test --lib
test result: ok. 50 passed; 0 failed
```

### 2. `attachment-store.test.ts` — gegen die Fassung vor T-159 (`void`, `.catch(() => undefined)`)

```
$ vitest run apps/local-api/test/access/attachment-store.test.ts   # alte removeImage-Fassung
 Test Files  1 failed (1)
      Tests  5 failed (5)
AssertionError: expected undefined to be 'removed'   (× 2)
AssertionError: expected undefined to be 'unknown_name'   (× 2)
AssertionError: expected undefined to be 'failed'   (× 1)

$ # Originaldatei byte-identisch wiederhergestellt
$ vitest run apps/local-api/test/access/attachment-store.test.ts
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### 3. `attachment-input-validation.test.ts` — Mutationsprobe an der Meldungszuordnung

```
$ # INDIRECT_MESSAGE und PATH_MESSAGE im Ternary vertauscht
$ vitest run apps/local-api/test/usecases/attachment-input-validation.test.ts
 Tests  2 failed | 5 passed (7)   # TP-ANH-18 und TP-ANH-20 schlagen genau dort fehl,
                                   # wo die beiden Meldungen vertauscht sind
$ # Originaldatei byte-identisch wiederhergestellt
$ vitest run …
 Tests  7 passed (7)
```

Alle drei Wiederherstellungen sind mit `diff -q <Sicherung> <Datei>` als **byte-identisch**
bestätigt, bevor weitergearbeitet wurde. Die Sicherungen und die Vergleichsimplementierung der
„alten Fassung" (nur für die Gegenprobe, lebt ausschließlich in `#[cfg(test)]`) liegen nicht im
Produktivteil.

---

## Zusammenfassung

`attachment.rs` hatte laut V-01 (T-154) und T-156-2 keinen einzigen `#[cfg(test)]`-Block; jetzt
trägt sie 22 neue Fälle, die die 22 Zeichenketten aus Bedrohungsmodell 20.2, die zehn Zeilen der
Festpunkttabelle, die UNC-Fälle, die Umleitungsfälle samt zwei Reihenfolge-Fällen und drei
windows-only Fälle abdecken — mit einer eigenen Gegenprobe, die 9 der Fälle als vormals blind
belegt statt es zu behaupten. `AttachmentBlobPort.removeImage` (O-DC) hat jetzt fünf Prüffälle,
die alle drei `ImageRemoval`-Werte und das Protokollverhalten aus T-159 abdecken. Die Türhälfte
von TP-ANH-15 bis -20 (O-CK) ist mit sieben neuen Fällen in `apps/local-api/test/usecases/`
gemessen; TP-ANH-08 war bereits vollständig in `packages/domain/test/attachment.test.ts:512-556`
abgedeckt und brauchte keine Ergänzung. `pnpm typecheck`, `pnpm test` (71 Dateien, 1371/1371),
`pnpm run test:coverage` und `pnpm run proof:codepoints` (45/0, nach Korrektur eines
versehentlich eingefügten Nullbreite-Leerraums in einem eigenen Kommentar) laufen grün;
`cargo test --lib` zeigt 50/50 auf diesem Läufer.

---

## Fallliste im Detail

### `attachment.rs` (19 auf jedem Läufer + 3 unter `#[cfg(windows)]`)

- **`check_link`** (A-A-2, A-A-3): alle 22 Zeichenketten aus Bedrohungsmodell 20.2 mit dem dort
  (Abschnitt 21.3 Punkt 1) gemessenen Ablehnungsgrund — nicht neu erfunden, gegen eine eigene
  `cargo`-Wegwerfkiste mit `url 2.5.8` unabhängig nachgerechnet, bevor es in den Test kam. Dazu
  die zehn Zeilen der Festpunkttabelle samt Idempotenzprobe, Zugangsdaten im Wirt, Leer-/Längen-
  und Steuerzeichenfälle mit exakter Bytegrenze (2048/2049), und ein Reihenfolge-Fall
  (Steuerzeichen schlägt vor Schema durch).
- **`check_file` / `is_unc`** (A-A-4): alle vier Schreibweisen aus 20.2/21.3, der
  Windows-Laufwerksfall (`C:\…`) mit ausgeschriebener Begründung, warum er auf Linux
  `PathNotAbsolute` und nicht `PathUnc` ergibt, Leer-/Längen-/Steuerzeichenfälle mit exakter
  Bytegrenze (4096/4097).
- **`has_indirect_extension`** (A-A-5, A-A-5′, T-157): die volle Fallliste aus
  `T-157-frontend-dev.md` — zehn Ablehnungen (inklusive `.lnk.`, `.lnk ` mehrfach gemischt,
  `.LNK.`, alle fünf Endungen je einmal mit nachgestelltem Zeichen, `.lnk` als reiner
  Dateiname), sechs Durchlässe (`.txt`, `.txt.`, `.lnk.txt`, reiner Punkt, `.gitignore`,
  `.exe.`), zwei Reihenfolge-Fälle (UNC vor Endung, Absolutheit vor Endung) und eine echte,
  angelegte `.lnk`-Datei, die trotzdem abgewiesen wird.
- **Die Gegenprobe** (Auftrag Punkt 2): eine reine Testfunktion baut die alte,
  `Path::extension()`-basierte Fassung nach und behauptet für neun benannte Fälle, dass Alt und
  Neu **auseinanderfallen müssen** — schlägt das fehl, ist der Fall kein Beleg für die Behebung.
  Empirisch mit der wirklich alten Fassung gegengeprüft (siehe „Rot vor Grün" oben).
- **Drei `#[cfg(windows)]`-Fälle** (A-A-10): eine reale Datei `x.lnk` wird angelegt, danach wird
  gegen drei Schreibweisen (`x.lnk`, `x.lnk.`, `x.lnk `) geprüft, dass `Path::is_file()` für
  **alle drei** `true` liefert — das ist die Windows-Namensnormalisierung selbst, unabhängig von
  dieser Anwendung — und dass `check_file` trotzdem in allen drei Fällen `PathIndirectExtension`
  liefert. **Nicht auf Windows gemessen** (Läufer war Linux); Kompilierbarkeit gegen
  `x86_64-pc-windows-msvc` mit einer aus der echten Datei geschnittenen Wegwerfkiste geprüft
  (`cargo check --target x86_64-pc-windows-msvc --tests`, sauber, keine Warnung). Eine Prüfung
  der ganzen Kiste gegen dieses Ziel scheitert am fehlenden Sidecar-Programm für Windows
  (`resource path … doesn't exist`) — unabhängig von dieser Aufgabe und keine Aussage über den
  Testcode.

### `attachment-store.test.ts` (O-DC, 5 Fälle)

`removed` bei vorhandener Kopie (ohne Protokollzeile), `removed` bei einer Kopie, die es längst
nicht mehr gibt (`force: true`), `unknown_name` bei sechs Namen, die die Form verfehlen
(Pfadausbruch, falsche Endung, 31/33 Hexziffern, Großschreibung, leer), `unknown_name` ohne
eingerichtetes Anwendungsdatenverzeichnis, und `failed` mit der Protokollzeile: `warn`,
Schlüssel `attachment_image_remove_failed` (ausdrücklich **nicht** `UNCLASSIFIED_REASON` —
dieselbe Probe, die T-159 selbst nennt), der erzeugte Name in der Meldung, kein Pfad und kein
`errno`. Der Fehlschlag wird ohne Rechteentzug und ohne echte Bilddatei erzwungen: Ein
Verzeichnis unter dem erzeugten Namen lässt `rm(…, { force: true })` (ohne `recursive: true`)
mit `ERR_FS_EISDIR` scheitern — empirisch geprüft, bevor es in den Test kam.

### `attachment-input-validation.test.ts` (O-CK, 7 Fälle)

TP-ANH-15 (`javascript:`), -16 (`file:///etc/passwd`), -17 (UNC als „Verweis"), -18 (UNC als
Dateipfad) mit den vier zutreffenden, benannten Meldungen; -20 (`.lnk` wird **beim Anlegen**
abgewiesen, mit der Umleitungs-Meldung und nicht mit der allgemeinen Pfad-Meldung); -19 (`.bat`
läuft **nicht** in die Formprüfung, weil es keine Verbotsliste für ausführbare Dateien gibt).
Zwei Gegenproben zeigen, dass ein gültiger Verweis bzw. ein gültiger `.bat`-Pfad **weiter** bis
zur (in der Attrappe fehlenden) Transaktion kommt — ohne sie könnten alle Ablehnungsfälle grün
sein, weil `addAttachment` grundsätzlich alles ablehnt. TP-ANH-08 war bereits vollständig in
`packages/domain/test/attachment.test.ts:512-556` abgedeckt (die drei Fälle aus dem Testplan:
Verweis ohne Titel → Wirtsname, Datei ohne Titel → Dateiname, gesetzter Titel bleibt) und
brauchte keine Ergänzung.

---

## Annahmen

1. **Die 22 Zeichenketten aus Bedrohungsmodell 20.2, nicht die dort in A-A-2 genannten „28".**
   Die Tabelle in Abschnitt 20.2 selbst hat 22 Zeilen; T-156 (Abschnitt 21.3, Punkt 1) misst
   ausdrücklich „von den 22 Zeilen der Tabelle". Ich habe gegen das gemessen, was tatsächlich
   dasteht, nicht gegen eine Zahl, die an keiner Stelle als Liste vorliegt. Die Abweichung „28"
   gegen „22" gehört an security-checker/documenter, nicht an mich — ich erfinde keine sechs
   zusätzlichen Zeichenketten, um eine Zahl zu treffen.
2. **Ohne `tempfile`.** Die Kiste liegt nur transitiv in `Cargo.lock` (über `tauri-plugin-dialog`
   vermutlich), nicht in `Cargo.toml` — und `Cargo.toml` gehört nicht zu meiner Hoheit. Die
   Hilfsfunktionen legen eigene, über Prozess-ID und einen Zähler eindeutige Verzeichnisse unter
   dem System-Temp an und räumen bewusst nicht auf (Wegwerfdateien im Byte-Bereich).
3. **`unknown_name`-Fälle ohne Dateisystemzugriff getestet, nicht über `mkdirSync`-Konstruktionen.**
   Der Port lehnt die Form vor jedem `fs`-Aufruf ab; ein Test, der trotzdem eine Datei anlegt,
   würde nur verschleiern, dass der Zugriff nie stattfindet.
4. **Für O-CK: eine schmale `AppContext`-Attrappe (nur `clock`), keine volle Fake-Transaktion.**
   `addAttachment` liest die Uhr vor jeder Verzweigung, lehnt aber `link`/`file`-Eingaben ab,
   **bevor** `context.transactions` berührt wird — das ist im Kopfkommentar der Funktion selbst
   so benannt. Ein vollständiger Fake wäre für die vier Ablehnungsfälle unnötiger Aufwand
   gewesen und hätte einen echten Fehler (ein Zugriff auf ein fehlendes Feld) verdeckt statt ihn
   zum Testsignal zu machen (siehe die beiden Gegenproben).
5. **TP-ANH-08 nicht dupliziert.** Es ist in der Domäne bereits vollständig und exakt nach den
   Fällen aus `docs/testplan.md` 25.2 geprüft; ein zweiter, wortgleicher Test in
   `apps/local-api/test` hätte nur Wartungslast ohne zusätzliche Aussage erzeugt.
6. **Rot-vor-Grün durch temporäre, sofort rückgängig gemachte Bearbeitung der Produktivdateien
   nachgewiesen, nie als bleibende Änderung.** Jede der drei Wiederherstellungen ist mit
   `diff -q` gegen eine vorherige Sicherung als byte-identisch bestätigt, bevor weitergearbeitet
   wurde. Das ist Messung, keine Bearbeitung des Produktivteils — dieselbe Unterscheidung, die
   die benannte Ausnahme in `CLAUDE.md` selbst trifft.
7. **Keine Rust-Fälle für `AttachmentBlobPort` auf der TypeScript-Seite dupliziert** — das war
   bereits präzise als O-DC benannt und ist erledigt; ich habe nicht versucht, `copyImage` oder
   `readImage` zusätzlich abzudecken, weil T-159/O-DC ausdrücklich nur den `removeImage`-Fund
   nennt.

---

## Risiken

1. **Sicherheit — keine neue Erkenntnis, aber eine Bestätigung: A-A-5′ ist jetzt gemessen, nicht
   nur behauptet.** Die Gegenprobe belegt neun konkrete Fälle, bei denen die alte Fassung
   `has_indirect_extension` einen Umleiter durchgelassen hätte. Damit ist V-01/T-156-2
   inhaltlich geschlossen — die verbleibende Lücke ist ausschließlich, dass die drei
   windows-only Fälle **nie auf echtem Windows gelaufen sind** (derselbe Vorbehalt, den T-157
   und T-156 bereits für ihre eigenen Messungen genannt haben). Das ist der Punkt, an dem der
   Windows-Läufer aus O-BX seine erste echte Aufgabe bekommt.
2. **Die 28-vs-22-Diskrepanz in `docs/bedrohungsmodell.md` (A-A-2 gegen 20.2/21.3) bleibt offen**
   und ist keine, die ich beheben darf (fremde Datei). Sie ist harmlos, solange niemand „28"
   als Zielzahl für einen künftigen Prüflauf nimmt und dabei sechs erfundene Zeichenketten
   ergänzt, nur um die Zahl zu treffen.
3. **Zwei bekannte Nachbarfälle aus T-157 Risiko 1 (alternative Datenströme, 8.3-Kurznamen)
   bleiben ungeprüft.** Sie waren dort ausdrücklich „für security-checker, nicht für mich"
   benannt und sind kein Teil dieses Auftrags.
4. **Keine echten Call-Nummern, Kundendaten oder Zugangsdaten** in den neuen Dateien. Todo-IDs,
   Domänen (`example.org`) und Pfade sind erfunden bzw. reserviert.

---

## Offene Fragen an den Orchestrator

1. **Wer richtet den Windows-Läufer für `cargo test --lib` an dieser Datei tatsächlich scharf?**
   O-BX hat den Läufer, T-160 die Fälle — aber ich konnte in dieser Umgebung nur bis
   `cargo check --target x86_64-pc-windows-msvc --tests` gegen eine aus der echten Datei
   geschnittene Wegwerfkiste kommen (sauber). Die volle Kiste scheitert dort am fehlenden
   Windows-Sidecar-Programm, unabhängig vom Testcode. Das ist eine Ablaufbeobachtung für die
   nächste Freigabe, kein Befund gegen den Bau.
2. **Soll die 28-vs-22-Zahl in `docs/bedrohungsmodell.md` A-A-2 berichtigt werden?** Ich schlage
   „22" vor (die tatsächliche Zeilenzahl von 20.2), aber das ist fremde Datei und fremde
   Zuständigkeit (security-checker/documenter).
3. **`copyImage`/`readImage` bleiben ungeprüft in `apps/local-api/test`.** Kein Befund der
   vorigen Wellen hat sie benannt; falls das gewünscht ist, ist es eine eigene, klar
   abgrenzbare Aufgabe.

---

## Nächster Schritt

**Wiedervorlage durch security-checker** über V-01/T-156-2 (jetzt mit Fallliste und Gegenprobe)
und über die 28-vs-22-Frage. Danach, falls noch offen: ein echter Windows-Lauf von
`cargo test --lib`, damit die drei `#[cfg(windows)]`-Fälle einmal tatsächlich etwas anderes tun
als auf diesem Läufer — das ist der Nachweis, den A-A-10 seit T-145 verlangt und den bisher
niemand erbringen konnte, weil es die Fälle nicht gab.
