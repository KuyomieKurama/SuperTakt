# T-164 — Vier Punkte und eine Wiedervorlage

**Rolle:** security-checker **Datum:** 2026-09-05 **Zweig:** `versionspruefung-gegen-github`

---

## Kurzfassung

```
Aufgabe: T-164 — O-DF, O-DI, O-DD, O-BD und die Wiedervorlage V-01/T-156-2
Status: fertig
Urteil: Nacharbeit (Grenze VG-11) — V-01/T-156-2 einzeln: freigegeben mit Auflage
```

---

## Artefakte

| Datei | Was |
|---|---|
| `docs/bedrohungsmodell.md` | **Neuer Abschnitt 22** (22.0 bis 22.8): Werkzeugstand, O-DF mit beiden Fällen einzeln beurteilt, O-DI mit der Berichtigung, O-DD als Bewertung, O-BD mit der fehlenden Hälfte, die Wiedervorlage Auflage für Auflage, acht Befunde, fünf neue Auflagen (A-A-28 bis A-A-32), Urteil. **Vier bestehende Stellen berichtigt** (die Zahl 28), jede mit sichtbarer Marke. |
| `.claude/team/reports/T-164-security-checker.md` | diese Datei |

Kein Produktivcode angefasst. Die Messungen liefen gegen einen **mechanischen, mit `diff` als
zeichengleich bestätigten Schnitt** aus `apps/desktop/src-tauri/src/attachment.rs` (Zeilen 116
bis 359 ohne die `ShellExt`-Zeile) in einer Wegwerf-Kiste unter `/tmp`.

---

## Zusammenfassung

Der nachgestellte Punkt aus T-156-1 hatte zwei Nachbarn, und einer davon ist offen: Gemessen auf
Linux gegen den ausgelieferten Code nimmt `check_file` die wirklich angelegten Dateien
`…/rechnung.lnk:harmlos.txt` und `…/rechnung.lnk::$DATA` **an** — unter NTFS löst `datei::$DATA`
auf den unbenannten Datenstrom von `datei` auf, `is_file()` folgt dieser Auflösung und
`has_indirect_extension` nicht. Die 8.3-Kurznamen tragen dagegen nicht, weil vier der fünf
Umleitungsendungen genau drei Zeichen lang sind und die fünfte (`desktop`) unter Windows nichts
tut; ich habe beides gemessen statt es zu vermuten. Von den beiden Zahlen in O-DI stimmte die
**22**: Die Tabelle in 20.2 trägt 22 Datenzeilen, und eine Menge von 28 Zeichenketten hat es in
diesem Dokument nie gegeben — auch nicht als Vereinigung mit der Festpunkttabelle (das wären 25).
Der Dateiname in der neuen Protokollzeile aus T-159 ist unbedenklich, aber aus einem anderen
Grund als dem, der danebensteht: Nicht weil Takt ihn erzeugt hat, sondern weil `pathOf` die
Methode für jeden Namen verlässt, der `GENERATED_NAME_SHAPE` nicht erfüllt. Die Wiedervorlage
V-01/T-156-2 ist bis auf A-A-8 erfüllt und misst nachweislich die Behebung statt sie zu
wiederholen — die Gegenprobe von T-160 ist der Nachweis, den ich verlangt hatte, und nicht sein
Ersatz.

---

## Werkzeugstand

| Werkzeug | Ergebnis |
|---|---|
| `cargo test --lib` (Linux) | **50/50**, davon 19 in `attachment::tests`. Die drei `#[cfg(windows)]`-Fälle werden hier nicht einmal übersetzt. |
| Semgrep lokal (`p/rust`, `p/typescript`, `p/javascript`; 85 Regeln, 263 Dateien) | **8 Befunde, alle INFO.** Keiner hoher Schwere. Sieben `unsafe-usage` (`identity.rs`, `appdata.rs:372`), ein `temp-dir` (`attachment.rs:461`, Prüfhelfer aus T-160). |
| Semgrep Guardian (Plattform) | **Nicht gelaufen, elftes Mal.** Kein Zugang; die Lieferkette ist nie gemessen worden. |
| 42Crunch Audit / Scan | **Nicht gelaufen, zehntes Mal.** Kein `42c-ci-cli`, keine Berechtigung. |
| `pnpm run proof:codepoints` | **45/0** nach dem Schreiben dieser Dateien. |
| Eigene Messung (Schnitt aus `attachment.rs` gegen `url 2.5.8`) | siehe unten |

---

## Punkt 1 — O-DF

### Alternative Datenströme: **trägt.** Befund T-164-1, Schwere „muss".

**Nicht** der von T-157 vermutete Weg. `…\bericht.txt:evil.lnk` wird abgewiesen, weil
`has_indirect_extension` (`apps/desktop/src-tauri/src/attachment.rs:269-280`) den **ganzen**
letzten Namensbestandteil zerlegt und dessen letztes Punktsegment nimmt — das ist `lnk`. In
dieser Richtung ist die Prüfung strenger als Windows.

Offen ist die umgekehrte Schreibweise. Gemessen gegen den zeichengleichen Schnitt, auf Linux,
gegen wirklich angelegte Dateien (auf ext4 ist `:` ein gewöhnliches Namenszeichen):

```text
rechnung.lnk:harmlos.txt   existiert=true    -> ANGENOMMEN
rechnung.lnk::$DATA        existiert=true    -> ANGENOMMEN
bericht.txt:evil.lnk       existiert=true    -> abgewiesen: path_indirect_extension
rechnung.lnk               existiert=true    -> abgewiesen: path_indirect_extension
bericht.txt                existiert=true    -> ANGENOMMEN
rechnung.lnk:harmlos.txt   existiert=false   -> abgewiesen: path_missing
rechnung.lnk::$DATA        existiert=false   -> abgewiesen: path_missing
```

**Angriffsweg, Schritt für Schritt.** (1) Ein Prozess im Benutzerkonto legt eine `rechnung.lnk`
an oder benutzt eine vorhandene. (2) Derselbe Prozess schreibt `C:\…\rechnung.lnk::$DATA` in
`todo_attachment.target` — über die Route mit dem Sitzungsgeheimnis (VG-1) oder mit `sqlite3`
über die Bestandsdatei (VG-3). Der Anhangpfad wird zwar vom Benutzer eingetragen und **nicht**
aus einer E-Mail übernommen (A-19.x, E-072: über das Add-in entstehen keine Anhänge) — genau
deshalb sitzt die Kontrolle im Öffnen-Befehl und nicht im Eingabefeld: zwischen Eingabe und
Öffnen liegt der Bestand (Bedrohungsmodell 20.3). (3) Der Benutzer klickt; die Rückfrage nennt
den vollen Pfad und sagt „wird geöffnet", weil `extensionOf` dasselbe letzte Punktsegment liest.
(4) `check_file` gibt `Ok` zurück: kein UNC, absolut, keine Umleitungsendung, und `is_file()`
bejaht, weil NTFS `::$DATA` auflöst. (5) `takt_open_attachment_file`
(`attachment.rs:402-409`) reicht weiter an
`Shell::open` (`tauri-plugin-shell-2.3.6/src/lib.rs:77`) →
`tauri_plugin_shell::open::open(None, …)` (`…/src/open.rs:122-137`, Kommentar wörtlich
*„when running directly from Rust code we don't need to validate the path"*) →
`::open::that_detached` (`open 5.4.2`) → unter Windows
`powershell.exe -NoProfile -NonInteractive -Command "Start-Process -FilePath $env:OPEN_RS_TARGET"`,
bei Fehlschlag `explorer.exe <Pfad>` (`open-5.4.2/src/windows.rs:66-92`).

**Was gemessen ist und was nicht.** Gemessen bis einschließlich `check_file`. **Nicht** gemessen,
ob `Start-Process` die Verknüpfung dann wirklich ausführt — die Klassenauflösung von ShellExecute
geht über die Endung der ganzen Zeichenkette, und was sie mit `.lnk::$DATA` tut, ist auf einem
Linux-Läufer nicht zu beantworten. Das ändert an der Bewertung nichts: Der Dateikopf sagt
über sich selbst (`attachment.rs:87-114`) *„geprüft wird der Name, den Windows auflöst, nicht der
gespeicherte"*, und diese Voraussetzung ist gemessen falsch, sobald ein Doppelpunkt im Namen
steht.

**Gegenmittel — Auflage A-A-28, für frontend-dev, ohne Rückfrage baubar.**

1. Neuer Ablehnungsgrund `Rejection::PathStreamSeparator`, Schlüssel `path_stream_separator`, in
   die Aufzählung (`attachment.rs:148-165`) und in `key()` (`attachment.rs:169-187`); der
   deutsche Satz in dieselbe Zuordnung der Oberfläche wie die vierzehn anderen.
2. Neue Funktion neben `has_indirect_extension`:

   ```rust
   fn has_stream_separator(path: &Path) -> bool {
       match path.file_name().and_then(|name| name.to_str()) {
           Some(name) => name.contains(':'),
           None => false,
       }
   }
   ```

   Nur der **letzte** Bestandteil, damit der Laufwerksbuchstabe (`C:`) nicht mitfällt.
3. Aufgerufen in `check_file` **nach** `is_absolute` (sonst würde unter Linux ein
   Windows-Laufwerkspfad mit dem neuen statt mit dem richtigen Grund abgewiesen) und **vor**
   `has_indirect_extension` (ein Name mit Doppelpunkt hat keine beurteilbare Endung mehr).
4. **Auf jeder Plattform**, nicht unter `#[cfg(windows)]` — dieselbe Begründung wie bei `is_unc`
   und `effective_file_name` (A-A-10).
5. Dieselbe Regel in `extensionOf` (`apps/web/src/lib/attachmentLabel.ts`), damit der Dialog für
   einen solchen Namen nicht „wird geöffnet" sagt.
6. **Der Preis, ausgeschrieben:** Unter Linux und macOS ist `:` ein zulässiges Namenszeichen;
   `Besprechung 10:30.pdf` lässt sich danach aus Takt heraus nicht mehr öffnen (der Anhang bleibt
   sichtbar, der Pfad steht da, der Dateimanager öffnet sie weiterhin). Unter Windows — der
   Plattform, für die Takt gebaut ist — kostet die Regel **nichts**: Dort kann ein Doppelpunkt in
   keinem gültigen Dateinamen vorkommen.

**Wie das auf Linux nachweisbar ist** (der Kern der Auflage; drei Fälle sind rot vor der
Behebung):

| Fall, wirklich angelegte Datei | heute | nach A-A-28 |
|---|---|---|
| `rechnung.lnk:harmlos.txt` | **`Ok`** (gemessen) | `path_stream_separator` |
| `rechnung.lnk::$DATA` | **`Ok`** (gemessen) | `path_stream_separator` |
| `bericht.txt:evil.lnk` | `path_indirect_extension` | `path_stream_separator` |
| nicht vorhandener Pfad mit `:` | `path_missing` | `path_stream_separator` (vor der Existenzprüfung) |
| `bericht.txt`, `programm.exe` | `Ok` | `Ok` (Gegenprobe, unverändert) |

Zusätzlich unter `#[cfg(windows)]`: eine wirklich angelegte `x.lnk` und die Zusicherung, dass
`Path::new("…x.lnk::$DATA").is_file()` **wahr** ist — dieser eine Fall belegt die Win32-Auflösung
selbst.

### 8.3-Kurznamen: **trägt hier nicht.**

Gemessen: `RECHNU~1.LNK`, `VERWEI~1.URL`, `START~1.PIF`, `ORDNER~1.SCF`, `APP~1.DESKTOP` werden
alle erkannt; nur `APP~1.DES` nicht. Grund: Vier der fünf Umleitungsendungen sind genau drei
Zeichen lang und überstehen die Verkürzung unverändert (verglichen wird ohnehin ohne Rücksicht
auf Groß- und Kleinschreibung, `attachment.rs:278`). Nur `desktop` verkürzt sich — und ein
`.desktop` tut unter Windows nichts, während es unter Linux keine 8.3-Namen gibt. Es gibt kein
Paar aus Plattform und Endung, bei dem der Kurzname zugleich durchkommt und etwas bewirkt.

Das ist aber eine Eigenschaft der **heutigen Liste**, nicht der Prüfung: Ein Windows-Umleiter mit
mehr als drei Zeichen (`appref-ms`, der ClickOnce-Starter) wäre über `.APP` sofort ein Vorbeiweg.
Deshalb **A-A-30**: ein Prüffall über die Längeninvariante der Liste plus die vier Kurznamen als
Fälle. Zehn Zeilen, läuft auf Linux.

---

## Punkt 2 — O-DI: **22 stimmte.**

Die Tabelle in 20.2 trägt **22** Datenzeilen. Die Zahl 28 hatte in diesem Dokument nie einen
Gegenstand — auch nicht als Vereinigung mit der Festpunkttabelle darunter: Von deren elf Zeilen
sind acht Wiederholungen, drei neu, macht **25**. T-160 hat richtig gemessen und die Abweichung
gemeldet, statt sie zu übergehen; `attachment.rs:479` trägt die Zahl im Typ
(`[(&str, Option<Rejection>); 22]`), was der beste Ort dafür ist.

Vier Stellen in `docs/bedrohungsmodell.md` berichtigt, jede mit sichtbarer Marke: der Fließtext
in 20.2, die Messungsspalte von **A-A-2** in 20.7, die A-A-2-Zeile in 21.2 und Messung 1 in 21.3.
Eine fünfte Stelle liegt außerhalb meiner Hoheit: `attachment.rs:41` sagt im Dateikopf ebenfalls
„28" (Befund T-164-5, frontend-dev).

**Fällt so etwas künftig auf?** Nicht durch Sorgfalt — T-156 hat „28" und „von den 22 Zeilen" in
denselben Satz geschrieben, und der Widerspruch stand vier Absätze lang in einem Dokument, das
sonst jede Zahl belegt. Die Bauart ist das Problem: Eine Zahl wird **abgeschrieben** statt
**abgefragt**, und ein Nachweis kann gegen beide Fassungen grün sein. Die Regel, die daraus folgt
und in 22.2 steht: **Eine Auflage nennt keine Zahl, die sie nicht selbst zählt.** Wo eine Menge
gemeint ist, wird die Menge benannt und die Zahl höchstens in Klammern nachgestellt; im Code
gehört sie in den Typ, wie T-160 es getan hat — dort wird sie rot, ohne dass jemand ein Dokument
gelesen haben muss.

---

## Punkt 3 — O-DD: **bestätigt**, mit einer Berichtigung der Begründung

Die Zeile steht in `apps/local-api/src/access/attachment-store.ts:404-408`. Der Wert `name` ist
gegenstandslos für den Kunden — aber der Grund im Kommentar (`:399-402`, „Er ist nach A-A-17
erzeugt und hat keinen Bezug zur Quelldatei") trägt als **Zusage** nicht: `removeImage` bekommt
seinen Namen aus `todo_attachment.target`, und in diese Spalte kann geschrieben werden, ohne
durch diesen Adapter zu gehen (VG-1, VG-3) — genau die Begründung, aus der derselbe Adapter beim
**Lesen** noch einmal prüft.

Was trägt, steht drei Zeilen darüber: `removeImage` ruft zuerst `pathOf(name)`
(`attachment-store.ts:380-381`) und verlässt die Methode mit `unknown_name`, wenn der Name
`GENERATED_NAME_SHAPE` (`:132`, `/^[0-9a-f]{32}\.(?:png|jpg|gif|webp)$/`) nicht erfüllt. **Die
Protokollzeile ist für jeden anderen Namen unerreichbar.** Das ist eine Formzusage am Aufrufort
und kein Vertrauen in den Erzeuger — sie hält auch dann, wenn jemand `todo_attachment.target`
mit einem Kundennamen überschreibt.

Preisgegeben wird: dass ein Bildanhang existierte und seine Kopie liegengeblieben ist, plus 38
oder 39 Zeichen ohne Wortinhalt. Wer das Protokoll liest, läuft im selben Benutzerkonto und kann
das Bildverzeichnis ohnehin auflisten (VG-3). **Kein Zuwachs an Auskunft. Unbedenklich.**

Befund **T-164-4** (Hinweis, domain-dev): den Kommentar auf die tragende Hälfte umstellen, sonst
baut die nächste Zeile jemand ohne den Riegel.

---

## Punkt 4 — O-BD: eingetragen, mit der Hälfte, die in 21.5 fehlte

Beide Aussagen sind gegen den heutigen Code nachgeprüft und stehen in 21.5:
`errorCodeOf` (`packages/storage/src/migration.ts:166`) und `pair()`
(`apps/local-api/src/startup.ts:88`) verengen `sqlite` und `code` an der Quelle nach Gestalt und
an der Zusammensetzung nach Typ; `REASON_SHAPE` (`apps/local-api/src/logger.ts:63`) begrenzt
Gestalt und Menge, nicht Herkunft.

**Was dort fehlte und jetzt in 22.4 steht: worauf der Riegel liegt.** Er liegt auf `reason` und
auf nichts sonst (`logger.ts:104`). `message` — der deutsche Satz — geht **ungeprüft** in die
Zeile; das einzige darauf ist `redactSecrets` auf der fertigen Zeile (`logger.ts:85`), ein Riegel
gegen genau ein Geheimnis. Die Zusage lautet also: „im Feld `reason` steht nichts, was nicht wie
ein technischer Schlüssel aussieht; für `message` bürgt allein die Aufrufstelle."

Drei Stellen setzen heute Werte in `message` ein: `attachment-store.ts:404` (unbedenklich, siehe
oben), `app.ts:317` und `app.ts:328` (`c.req.method`, `c.req.path`). Die letzten beiden sind
fremder Text aus einer Anfrage in einem Protokoll, das ein Benutzer weitergibt — **Hinweis
T-164-6**, gering: Ein Einschleusen ist ausgeschlossen (`JSON.stringify`, `logger.ts:84`),
erreichbar sind sie nur bei einem echten Wurf. Gegenmittel eine Zeile: `c.req.routePath` statt
`c.req.path`. Als **A-A-31** geführt.

---

## Punkt 5 — Wiedervorlage V-01 / T-156-2: **freigegeben mit Auflage**

`attachment.rs` hat jetzt einen `#[cfg(test)]`-Block, er steht **in** der Datei (A-A-25), und
`cargo test --lib` zeigt nachgemessen **50/50** auf diesem Läufer (53 mit den drei
`#[cfg(windows)]`-Fällen).

**Und er misst etwas.** T-160 hat es geführt, nicht behauptet: eine Testhilfe, die die Fassung
vor T-157 nachbaut (`attachment.rs:771-776`), und ein Fall, der verlangt, dass alt und neu bei
**genau neun** Eingaben auseinanderfallen (`:779-822`). Ein Fall, der vor der Behebung ebenfalls
grün gewesen wäre, ist damit ausgeschlossen; die reinen Positivfälle stehen ausdrücklich neben
der Gegenprobe und nicht in ihr.

| Verlangt in T-156-2 | Urteil |
|---|---|
| **A-A-2** | **erfüllt.** Der Reihenfolge-Fall misst wirklich die Reihenfolge: Liefe die Steuerzeichenprüfung nach dem Zerlegen, ergäbe `java<LF>script:` den Grund `link_scheme_rejected` statt `link_control_character`. |
| **A-A-3** | **erfüllt**, alle zehn Zeilen der Festpunkttabelle samt Idempotenz. |
| **A-A-4** | **erfüllt mit Einschränkung**, siehe T-164-3. |
| **A-A-5 / A-A-5′** | **erfüllt**, und es ist die beste Stelle des Blocks. |
| **A-A-8** | **nicht erfüllt** — Befund T-164-2. |
| **A-A-10** | **bedingt erfüllt** — Befund T-164-3. |

**T-164-2 — A-A-8 ist ungemessen.** `Rejection::key()` (`attachment.rs:169-187`) entscheidet,
welchen deutschen Satz der Benutzer liest; beide Befehle reichen ihn wörtlich weiter (`:375`,
`:403`). Kein Prüffall berührt ihn. Ein vertauschter Schlüssel — `PathUnc => "path_not_absolute"`
— bliebe grün, und der Benutzer bekäme bei einem UNC-Pfad den Satz für einen relativen zu sehen.
Die Zusage „ohne den abgewiesenen Wert" steht nur im Kommentar (`:142-147`) und wäre in dem
Augenblick nicht mehr wahr, in dem jemand ein `format!` daraus macht. **A-A-29**: ausgeschriebene
Liste aller fünfzehn Paare plus paarweise Verschiedenheit; ein sechzehnter Grund macht sie rot.

**T-164-3 — zwei Zusagen über die Windows-Fälle, die nicht halten.**
*Erstens:* `release.yml` ist der **einzige** Ablauf in `.github/workflows/` und löst nur auf ein
Etikett `v[0-9]+.[0-9]+.[0-9]+` oder von Hand aus (`release.yml:68-80`); `cargo test --lib` auf
`windows-2022` steht im Bau-Auftrag (`:372`). Die drei `#[cfg(windows)]`-Fälle werden auf keinem
anderen Läufer **auch nur übersetzt** — ein Tippfehler darin fällt frühestens bei der nächsten
Auslieferung auf. Das ist der Zustand aus dem Nachtrag zu R-21, eine Ebene höher: kein grüner
Lauf auf dem falschen Betriebssystem, sondern gar keiner.
*Zweitens:* `release.yml:361-368` sagt, dieser Auftrag sei „der einzige Ort", an dem `Prefix::UNC`
und seine drei Geschwister gemessen werden. Sie werden auch dort nicht gemessen: `is_unc`
(`attachment.rs:301-312`) kehrt vorher zurück, weil **jede** Zeichenkette, die eines dieser vier
Präfixe erzeugt, zwangsläufig mit zwei Trennern beginnt und schon an
`value.starts_with("\\\\") || starts_with("//")` fällt. Der `match`-Zweig kann das Ergebnis auf
keiner Plattform ändern. Kein Fehler in der Sache — die Doppelung ist mit Absicht dokumentiert
(`:290-300`) —, aber die Zusage im Ablauf beschreibt eine Messung, die es nicht gibt. **A-A-32**.

---

## Befunde

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-164-1** | **muss** | Ein Doppelpunkt im Dateinamen hebt A-A-5 auf; `…/rechnung.lnk::$DATA` und `…/rechnung.lnk:harmlos.txt` werden angenommen (gemessen). Auflage A-A-28. | frontend-dev |
| **T-164-2** | **muss** | A-A-8 ist ungemessen; `Rejection::key()` hat keinen Prüffall. Auflage A-A-29. | unit-tester |
| **T-164-3** | **muss** | Die Windows-Prüffälle laufen in keinem Ablauf, der vor der Auslieferung aufgeht; `release.yml:361-368` behauptet eine Messung, die `is_unc` konstruktiv nie erreicht. Auflage A-A-32. | Orchestrator |
| **T-164-4** | Hinweis | Der Kommentar in `attachment-store.ts:399-402` stützt sich auf die falsche Hälfte. Die Bewertung selbst ist bestätigt. | domain-dev |
| **T-164-5** | Hinweis | `attachment.rs:41` trägt die falsche Zahl 28. Ein Satz. | frontend-dev |
| **T-164-6** | Hinweis | `app.ts:317` und `:328` setzen `c.req.path` in `message` ein. Gegenmittel `c.req.routePath`. Auflage A-A-31. | domain-dev |
| **T-164-7** | Hinweis | Semgrep Guardian zum elften, 42Crunch zum zehnten Mal ohne Werkzeug; die Lieferkette ist nie gemessen worden. | Auftraggeber |
| **T-164-8** | Hinweis | `temp-dir` in `attachment.rs:461` (Semgrep INFO): vorhersagbare Temp-Verzeichnisse im Prüfhelfer, ohne Aufräumen. Kein Produktivcode. | unit-tester, bei Gelegenheit |

**Neue Auflagen:** A-A-28 (Doppelpunkt-Regel), A-A-29 (A-A-8 messen), A-A-30 (8.3-Invariante der
Endungsliste), A-A-31 (kein Anfragewert in `message`), A-A-32 (Windows-Bahn und ehrlicher
Kommentar). Wortlaut und Messung stehen in `docs/bedrohungsmodell.md` 22.7.

---

## Annahmen

1. **Die Doppelpunkt-Regel gilt auf jeder Plattform**, nicht unter `#[cfg(windows)]`. Ich habe
   den Preis unter Linux und macOS ausgeschrieben und ihn für tragbar gehalten, weil Takt eine
   Windows-Anwendung ist (`WindowsUser` im Export, Outlook-Add-in) und weil ein Zweig, der nur
   auf einem Betriebssystem etwas tut, auf dem Läufer der Reihe unmessbar ist. Das ist dieselbe
   Abwägung, die `is_unc` und `effective_file_name` schon getroffen haben.
2. **Die Regel gehört in den Öffnen-Befehl, nicht an die Tür.** Damit bleibt ein Anhang mit
   Doppelpunkt weiter anlegbar und sichtbar; nur das Öffnen aus Takt heraus entfällt. Die Tür
   ebenfalls zu verriegeln wäre eine eigene Entscheidung (domain-dev) und kostet Bedienbarkeit,
   die die Grenze nicht braucht.
3. **Ich habe die vier „28"-Stellen in Abschnitt 21 mit berichtigt**, obwohl das ein
   Prüfprotokoll ist. Begründung: Jede stehengebliebene 28 hält die Falle offen, gegen die O-DI
   sich richtet. Jede Berichtigung trägt eine sichtbare Marke, damit die Änderung nicht als
   stilles Umschreiben durchgeht.
4. **Die Reihenfolge in `check_file`** (nach `is_absolute`, vor `has_indirect_extension`) ist
   meine Festlegung. Sie ist so gewählt, dass die Meldung unter Linux bei einem
   Windows-Laufwerkspfad weiterhin `path_not_absolute` lautet.
5. **`is_file()` bejaht unter Windows für `…lnk::$DATA`.** Das ist die dokumentierte
   NTFS-Auflösung des unbenannten Datenstroms und auf einem Linux-Läufer nicht messbar; genau
   deshalb steht dafür ein `#[cfg(windows)]`-Fall in A-A-28 und keine Behauptung.

---

## Risiken

1. **T-164-1 ist offen und liegt an derselben Grenze wie T-156-1.** Zwischen einer Zeichenkette
   aus dem Bestand und einem Prozessstart steht genau eine Kontrolle, und sie hat zum zweiten Mal
   eine Lücke derselben Klasse.
2. **Die Behebung wird wieder eine Welle lang ungeprüft liegen**, wenn frontend-dev A-A-28 baut
   und unit-tester erst danach messen darf (Dateihoheit, benannte Ausnahme in `CLAUDE.md`). Das
   ist dieselbe Ablaufentscheidung wie bei T-156-1/T-160 und gehört bewusst getroffen.
3. **Ohne A-A-32 ist jede `#[cfg(windows)]`-Zusage eine Absichtserklärung.** Der Code darin wird
   auf keinem Läufer übersetzt, der vor einer Auslieferung läuft.
4. **Die Lieferkette ist nie gemessen worden** (elftes Mal ohne Guardian). Seit `v0.1.0` liegen
   unsignierte Erzeugnisse in einer Veröffentlichung; ein Zulieferer, der zwischen zwei Ständen
   kippt, fiele niemandem auf.
5. **`message` hat keinen Riegel**, und es gibt jetzt drei Einsetzstellen. Der nächste Aufrufer
   erbt eine Zusage, die nur im Kopf des vorigen stand.

---

## Offene Fragen

1. **Soll die Tür (`addAttachment`, domain) den Doppelpunkt ebenfalls abweisen?** Ich habe es
   nicht verlangt (siehe Annahme 2). Wenn ja, gehört es in dieselbe Welle wie A-A-28, sonst
   widersprechen sich Tür und Öffnen-Befehl.
2. **A-A-32 verlangt einen Ablauf, den es nicht gibt.** Es gibt genau eine Datei in
   `.github/workflows/`, und sie hängt am Etikett. Ein zweiter Ablauf („bei jedem Stand") ist
   eine Entscheidung des Orchestrators und keine Aufgabe, die ich zuteilen kann.
3. **A-V-21 steht seit T-145 offen** und wird durch 22.4 dringender, nicht billiger.
4. **Guardian und 42Crunch, zum elften beziehungsweise zehnten Mal.** Beschaffungsentscheidung.

---

## Nächster Schritt

1. **T-164-1** (frontend-dev): A-A-28 in `attachment.rs` und `attachmentLabel.ts`, genau nach der
   Anleitung oben.
2. **T-164-2** (unit-tester): A-A-29, dazu A-A-30 und die Linux-Fälle zu A-A-28 in derselben
   Aufgabe — aber erst in der Welle **nach** der Behebung, wegen der Dateihoheit.
3. **T-164-3** (Orchestrator): A-A-32, und der Kommentar in `release.yml` sagt, was gemessen wird.
4. Parallel, ohne Abhängigkeit: **T-164-4** und **T-164-6** (domain-dev, je eine Zeile plus
   Begründung), **T-164-5** (frontend-dev, ein Satz im Dateikopf).
