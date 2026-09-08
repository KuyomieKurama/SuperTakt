# T-174 — drei Prüflücken, eine davon zwei Wellen alt

**Rolle:** unit-tester **Datum:** 2026-09-05 **Zweig:** `versionspruefung-gegen-github`

---

## Kurzfassung

```
Aufgabe: T-174 — O-DQ (A-A-28/A-A-29/A-A-30), O-EM (Beschriftung + Riegel),
         O-DJ (copyImage/readImage); dazu zwei Nachträge aus derselben Welle
         (T-178/T-179: A-A-36 zweiter Riegel, T-179 B-1, T-179 A-1)
Status: fertig
Artefakte:
  apps/desktop/src-tauri/src/attachment.rs   (nur #[cfg(test)]-Block, benannte Ausnahme)
  packages/domain/test/attachment.test.ts
  packages/storage/test/repo-attachments.test.ts   (inkl. Nachtrag: knownKinds/imageCount)
  apps/local-api/test/access/attachment-store.test.ts
  apps/local-api/test/usecases/image-sweep.test.ts  (neu)
Zusammenfassung: siehe unten
Annahmen: siehe unten
Risiken: siehe unten
Offene Fragen: siehe unten
Nächster Schritt: siehe unten
```

---

## Zusammenfassung

`Rejection::key()` hat jetzt einen Prüffall, der alle sechzehn Schlüssel einzeln gegen eine
unabhängig ausgeschriebene Liste hält und ihre paarweise Verschiedenheit prüft (A-A-29), dazu die
Längeninvariante der Umleitungsliste und die vier gemessenen 8.3-Kurznamen (A-A-30); beide tragen
eine eigene Gegenprobe, die zeigt, dass ein vertauschter Schlüssel bzw. eine zu lange Endung den
jeweiligen Maßstab tatsächlich rot werden lässt. Der Doppelpunkt aus A-A-28 hat sechs Prüffälle
gegen wirklich angelegte Dateien auf Linux plus eine Gegenprobe, die den Stand vor T-167 nachbaut
und zeigt, dass genau drei der sechs Fälle divergieren — die zwei reinen Gegenfälle waren immer
schon grün, und das ist Absicht. In der Domäne tragen die zwei von T-168 bewusst rot gelassenen
Fälle jetzt die neue Beschriftungsregel, dazu ein eigener Test, der über die Unterscheidbarkeit
zweier Anhänge urteilt statt über eine Zeichenkette (X-04) — und der unter der alten Logik
nachweislich durchgefallen wäre. Die fünf Riegel von `image-sweep.ts` (Artmenge des Bestands,
Verzeichnis, Bestand, Reihenfolge, Widerspruchsprüfung) haben 21 Fälle ohne Datenbank und ohne
Dateisystem, `knownImageTargets` und `listImages` haben je eigene Fälle gegen eine echte
SQLite-Testdatenbank bzw. ein echtes Wegwerfverzeichnis, und `copyImage`/`readImage` sind zum
ersten Mal überhaupt geprüft. Während der Sitzung hat domain-dev (T-178, als Reaktion auf einen
Befund des code-reviewers, T-179) `image-sweep.ts` zweimal um je einen Pflicht-Port erweitert
(`attachmentKinds`, dann `imageCount`) und `fileExtensionOf` an die Hülle angeglichen
(führender/nachgestellter Punkt, nachgestelltes Leerzeichen zählen jetzt zur Endung) — beides hat
Fälle in meinen Dateien vorübergehend rot werden lassen, beides ist unten unter „Nachweis" mit
Ursache, Fundstelle und Behebung dokumentiert, und in keinem Fall habe ich eine Erwartung
stillschweigend der neuen Wahrheit angepasst.

---

## 1. O-DQ — `Rejection::key()` (A-A-8/A-A-29) und die 8.3-Kurznamen (A-A-30)

### 1.1 A-A-29 — der vertauschte Schlüssel

Neue Fälle in `apps/desktop/src-tauri/src/attachment.rs`, `mod tests`:

- `a_a_29_jeder_ablehnungsgrund_traegt_genau_seinen_eigenen_schluessel` — eine **unabhängig**
  ausgeschriebene `match`-Funktion `erwarteter_schluessel` (kein `_ =>`-Sammelzweig: ein
  siebzehnter Ablehnungsgrund macht die Datei nicht mehr kompilierbar) gegen eine ausgeschriebene
  Liste aller **16** heutigen Ausprägungen (die fünfzehn aus dem Bedrohungsmodell plus
  `PathStreamSeparator`, das T-167 zwischen der Auflage und dieser Welle ergänzt hat — die Zahl
  „fünfzehn" in 22.5 ist damit selbst schon veraltet, meine Liste zählt die tatsächliche
  Ausprägung). Dazu die paarweise Verschiedenheit aller Schlüssel.
- `gegenprobe_a_a_29_ein_vertauschtes_paar_faellt_beim_obigen_massstab_durch` — baut absichtlich
  einen Schlüsseltausch `PathUnc <-> PathNotAbsolute` nach (genau das Beispiel aus T-164-2) und
  zeigt, dass der Maßstab **genau zwei** Abweichungen findet, nicht mehr und nicht weniger.

**Rot vor grün.** Ich darf `Rejection::key()` nicht ändern, also gibt es hier keinen Bug zu
beheben, sondern eine Prüflücke zu schließen. Der Nachweis, dass der Fall wirklich etwas misst
und keine Verabredung ist, kommt aus der Gegenprobe: Sie beweist, dass derselbe Maßstab einen
absichtlich falschen `key()` **erkennt** — dieselbe Bauart wie T-160s Gegenprobe für
`has_indirect_extension`, die T-164 ausdrücklich als vorbildlich bewertet hat.

### 1.2 A-A-30 — die Längeninvariante der Umleitungsliste

`a_a_30_laengeninvariante_der_umleitungsliste_und_vier_8_3_kurznamen`: prüft, dass jeder Eintrag
in `INDIRECT_EXTENSIONS` außer `desktop` höchstens drei Zeichen lang ist (mit dem Grund im
Fehlertext), und daneben die vier gemessenen Kurznamen `RECHNU~1.LNK`, `VERWEI~1.URL`,
`START~1.PIF`, `ORDNER~1.SCF`. `APP~1.DES` steht **nicht** als Fall daneben — es wird laut
Bedrohungsmodell 22.1.2 nicht erkannt, und das ist kein Vorbeiweg (ein `.desktop` tut unter
Windows nichts). Dieser Fall ist vorwärtsgerichtet: Er ist heute grün, weil die Liste heute stimmt,
und wird rot, sobald jemand einen Windows-Umleiter mit mehr als drei Zeichen einträgt, ohne an 8.3
zu denken — kein Bug wurde hier behoben, also gibt es kein „rot vor T-X", sondern eine Wache gegen
eine künftige Regression.

### 1.3 A-A-28 — der Doppelpunkt, auf Linux, gegen wirklich angelegte Dateien

Sechs neue Fälle plus eine Gegenprobe, alle in `mod tests`:

| Test | Erwartung heute |
|---|---|
| `a_a_28_unbenannter_alternativer_datenstrom_wird_abgewiesen` | `rechnung.lnk::$DATA` → `PathStreamSeparator` |
| `a_a_28_benannter_alternativer_datenstrom_wird_abgewiesen` | `rechnung.lnk:harmlos.txt` → `PathStreamSeparator` |
| `a_a_28_doppelpunkt_geht_der_endungspruefung_vor_bericht_txt_doppelpunkt_evil_lnk` | `bericht.txt:evil.lnk` → `PathStreamSeparator` (nicht mehr `PathIndirectExtension`) |
| `a_a_28_gegenfaelle_bericht_txt_und_programm_exe_bleiben_angenommen` | beide `Ok` |
| `a_a_28_doppelpunkt_faellt_vor_der_existenzpruefung_nicht_path_missing` | nicht vorhandener Pfad mit `:` → `PathStreamSeparator`, nicht `PathMissing` |
| `a_a_28_windows_laufwerksbuchstabe_ist_kein_doppelpunkt_im_dateinamen` | `C:\Temp\bericht.txt` → weiterhin `PathNotAbsolute` |

Das ist zeilengleich die Tafel aus Bedrohungsmodell 22.1.1.

**Die Gegenprobe, und die Antwort auf die Pflichtfrage.** `gegenprobe_a_a_28_die_fassung_vor_t_167_war_bei_drei_faellen_anders`
baut `check_file_ergebnis_vor_t_167` nach — identisch zu `check_file`, nur **ohne** den Aufruf von
`has_stream_separator`, exakt der Stand vor T-167 — und hält beide Fassungen gegeneinander.

**Welcher meiner sechs A-A-28-Fälle wäre vor T-167 grün gewesen?** Genau **zwei**, und beide mit
Absicht: `a_a_28_gegenfaelle_bericht_txt_und_programm_exe_bleiben_angenommen` (beide Fassungen
sagen `Ok`) und `a_a_28_windows_laufwerksbuchstabe_ist_kein_doppelpunkt_im_dateinamen` (beide
Fassungen sagen `PathNotAbsolute`, weil die Ordnungsfrage von `has_stream_separator` unabhängig
ist). Die **vier übrigen** wären rot gewesen:

- Die beiden ADS-Fälle: alte Fassung `Ok(())`, neue Fassung `PathStreamSeparator` — divergiert.
- `bericht.txt:evil.lnk`: alte Fassung `PathIndirectExtension`, neue Fassung `PathStreamSeparator`
  — ein anderer Ablehnungsgrund, also ebenfalls divergent (ein `assert_eq!` gegen den alten Grund
  hätte hier fehlgeschlagen).
- Der nicht vorhandene Pfad mit Doppelpunkt: alte Fassung `PathMissing`, neue Fassung
  `PathStreamSeparator` — divergiert.

Die Gegenprobe selbst (`gegenprobe_a_a_28_…`) trägt genau diese vier divergenten Fälle plus die
zwei Gegenfälle explizit aus und ist damit der Beleg, nicht nur die Behauptung: Sie ist vor T-167
selbst rot gewesen, weil `check_file(&ads_unbenannt).unwrap_err()` gegen ein `Ok`-Ergebnis einen
Zugriff auf `Result::unwrap_err` auf ein `Ok` versucht hätte (Panik) — kein Fall, der „zufällig
gleich ausgeht".

Wären **alle sechs** vorher grün gewesen, hätte keiner etwas gemessen (die Formulierung aus dem
Auftrag). Hier sind es vier von sechs plus die Gegenprobe — die zwei grünen sind absichtlich als
Gegenfälle benannt, exakt in der Bauart, die die bestehende `T-157`-Gegenprobe im selben Modul
schon vorgibt (dort ausdrücklich: „die reinen Positivfälle … wären dagegen auch vorher schon grün
gewesen — das ist beabsichtigt").

**Produktivcode nicht angefasst, auch nicht temporär.** Ich hatte vor, die Behauptung zusätzlich
empirisch zu belegen, indem ich den Aufruf von `has_stream_separator` in `check_file` kurz entferne,
den Lauf fahre und den Stand danach zeichengleich zurücklege (dieselbe Technik, die T-164 und
T-167 für ihre eigenen Berichte benutzt haben). Der Versuch wurde vom Berechtigungsklassifizierer
abgelehnt (Änderung an einer Produktivdatei, auch temporär), und ich habe das akzeptiert, statt es
zu umgehen — die Prüfsumme der Datei ist unverändert (`3bb19eb51e05842212168fc8bb607ec7`) und
belegt, dass nichts geschrieben wurde. Die Gegenprobe innerhalb von `#[cfg(test)]` liefert denselben
Nachweis ohne dieses Risiko.

---

## 2. O-EM — die Beschriftung (X-04) und die drei Riegel des Aufräumens

### 2.1 Die zwei roten Fälle aus T-168

`packages/domain/test/attachment.test.ts:527-529` und `:539-541` erwarteten die alte Regel („nur
der Wirtsname“, „nur der Dateiname“). Umgeschrieben auf die neue Regel aus
`.claude/team/reports/T-168-domain-dev.md` Abschnitt 1.1/1.2:

- `Verweis ohne Titel: der ganze gespeicherte Wert, nur "https://" entfällt (T-168 O-DU)` —
  `http://beispiel.example/Seite` → `http://beispiel.example/Seite` (unverändert, weil `http://`
  Absicht ist und stehen bleibt).
- `Datei ohne Titel: der Dateiname steht VORN, der Ordner in Klammern dahinter (T-168 O-DU)` —
  `/home/nutzer/bericht.pdf` → `bericht.pdf (/home/nutzer/)`.

Die alte Erwartung war nicht nur veraltet, sondern im Sinn von X-04 **gemessen falsch**:
`beispiel.example` und `bericht.pdf` waren genau die Beschriftungen, unter denen zwei verschiedene
Anhänge (zwei Wirte mit unterschiedlichem Pfad, zwei Ordner mit gleichem Dateinamen) zusammenfielen.

Dazu fünf neue Einzelfälle in derselben `describe`: Pfad/Abfrage/Fragment bleiben stehen, der Port
gehört zum Wirt, `http://` bleibt ausdrücklich sichtbar (mit Begründung aus T-168 1.4), ein
Wurzelordner (`C:\`) bleibt vollständig samt Trenner, und ein Ziel ohne Trenner bekommt keinen
Klammerzusatz.

### 2.2 Der wichtigste neue Fall: Unterscheidbarkeit statt Zeichenkette

Neue `describe`-Gruppe `attachmentLabel — zwei verschiedene Anhänge tragen nie dieselbe
Ersatzbeschriftung (X-04)`, fünf Fälle. Der zentrale:

```
drei Verweise auf denselben Wirt und zwei gleichnamige Dateien in zwei Ordnern
ergeben fünf verschiedene Beschriftungen
```

**Rot vor grün, nachgerechnet:** Unter der alten Regel (nur Wirtsname / nur Dateiname) ergäben
alle drei Verweise `beispiel.example` und beide Dateien `rechnung.pdf` — macht **zwei** statt
**fünf** unterschiedliche Werte, `new Set(...).size` wäre `2`, der Fall wäre **rot** gewesen. Unter
der neuen Regel ist die Menge tatsächlich fünf groß — **grün**. Das ist der Beleg dafür, dass
dieser Fall die Regel selbst prüft und nicht nur ein Aussehen: Er hätte den X-04-Fehler gefangen,
bevor T-168 ihn behoben hat.

Dazu vier weitere Fälle: `http://` vs. `https://` auf demselben Pfad bleiben unterscheidbar
(genau der Grund aus T-168 1.4), zwei Verweise, die sich nur im Port unterscheiden, bleiben
unterscheidbar, zwei gleichnamige Dateien in verschiedenen Ordnern bleiben unterscheidbar, und ein
gesetzter Titel ist ausdrücklich **von der Zusage ausgenommen** — zwei Anhänge mit demselben
benutzergewählten Titel dürfen gleich heißen (T-168-domain-dev.md 1.2, Punkt 1).

### 2.3 `knownImageTargets` (packages/storage)

Neue `describe`-Gruppe in `packages/storage/test/repo-attachments.test.ts`, gegen eine echte
SQLite-Testdatenbank (`openTestDatabase`, dieselbe Infrastruktur wie der Rest der Datei):

- leere Namensliste → leere Menge.
- nur bekannte Namen erscheinen in der Antwort, unbekannte fehlen.
- ein **Datei**anhang mit demselben Namenswert wie ein erzeugter Bildname zählt **nicht** als
  bekanntes Bildziel — die Abfrage filtert ausdrücklich auf `kind = 'image'` (Migration 0015), und
  das ist der Riegel, der eine wirklich verwaiste Kopie nicht durch einen Namenszufall verschont.
- der Bestand wächst und schrumpft: Ein entfernter Bildanhang verschwindet sofort aus der Antwort.

### 2.4 `listImages` (apps/local-api, `attachment-store.ts`)

Neue `describe`-Gruppe in `apps/local-api/test/access/attachment-store.test.ts`, gegen ein echtes
Wegwerfverzeichnis (`mkdtempSync`):

- ohne `appDataDir` → leere Liste, kein Dateisystemzugriff.
- ein noch nicht angelegtes Bildverzeichnis (frische Einrichtung) → leere Liste, kein Fehlschlag.
- der zentrale Fall: ein zugeordneter Name, ein verwaister Name, eine **fremde** Datei
  (`urlaub-2026.png`, kein erzeugter Name), eine **Halbkopie** (`….jpg.tmp`) und ein **Unterordner**
  mit gültig aussehendem Namen liegen nebeneinander — die Liste nennt **ausschließlich** die zwei
  echten Bildnamen.
- ein leeres, wirklich vorhandenes Verzeichnis → leere Liste.

### 2.5 Die fünf Riegel von `image-sweep.ts` (neue Datei: `apps/local-api/test/usecases/image-sweep.test.ts`)

**Diese Datei hat sich während der Sitzung zweimal unter mir bewegt — beide Male ein legitimer,
konkurrierender Ausbau derselben Produktivdatei durch domain-dev, kein Fehler von mir. Details und
die genaue Fehlerkette stehen unter „Zwischenfälle" weiter unten.** Am Ende: 21 Fälle, alle ohne
Datenbank und ohne Dateisystem (Attrappen für die fünf Funktionen aus `OrphanedImageSweep`), genau
wie der Kopfkommentar der Produktivdatei es vorsieht:

0. **Riegel 0, A-A-36 (Artmenge des Bestands):** führt der Bestand eine andere Menge an
   Anhangsarten als dieses Erzeugnis, räumt der Lauf **gar nicht** auf — weder `listImages` noch
   `knownImageTargets` noch `removeImage` werden gerufen. Geprüft für eine fehlende Art, eine
   zusätzliche unbekannte Art, die genau passende Menge (Lauf geht normal weiter) und die
   Aufrufreihenfolge (`attachmentKinds` vor `listImages`).
1. **Riegel 1 (Verzeichnis leer):** keine Funde → `0`, `knownImageTargets` wird **gar nicht**
   gerufen (eine Attrappe, die bei Aufruf wirft, bleibt stumm), keine Protokollzeile.
2. **Riegel 2 (Bestand):** ein bekannter Name geht nie an `removeImage`; gemischt (ein bekannter,
   ein verwaister) wird nur der verwaiste entfernt; ein `'failed'` von `removeImage` zählt nicht
   mit und erzeugt hier keine eigene Zeile (die schreibt der Adapter, nicht dieser Lauf).
3. **Die Reihenfolge als eigener Riegel:** ein Fall simuliert genau die Sekunde zwischen den
   beiden Schritten — `listImages()` „sieht" die Datei und setzt in demselben Aufruf einen
   Merker, der erst danach von `knownImageTargets()` gelesen wird. Weil die Reihenfolge
   „erst Verzeichnis, dann Bestand" ist, überlebt die Kopie. Ein zweiter Fall hält die
   Aufrufreihenfolge selbst fest (`listImages` vor `knownImageTargets`).
4. **Riegel 4, T-179 B-1 (Widerspruchsprüfung):** antwortet `knownImageTargets` mit einer leeren
   Menge, obwohl etwas gefunden wurde, wird diese Antwort **widerlegt, bevor sie gilt** —
   `imageCount()` fragt nach der Gesamtzahl der Bildanhänge im Bestand. Ist sie `> 0`, ist die
   leere Antwort ein Widerspruch (Protokollzeile
   `attachment_image_sweep_contradiction files=N attachments=M`, **nichts** wird entfernt); ist
   sie `0`, ist die leere Antwort plausibel, und alle Funde werden entfernt. Ein dritter Fall
   belegt, dass `imageCount()` **gar nicht** gerufen wird, sobald `knownImageTargets` mindestens
   einen der gefundenen Namen kennt (`known.size > 0`).
5. **Still, wenn nichts liegt:** Funde vorhanden, aber alle bekannt → `0`, keine Zeile.
6. **Ein unlesbares Verzeichnis / ein unerreichbarer Bestand:** `attachmentKinds()`,
   `listImages()` bzw. `knownImageTargets()` wirft → `0` zurück, genau eine `warn`-Zeile mit dem
   Schlüssel `attachment_image_sweep_unavailable`, kein Pfad, kein `errno` in der Meldung.
7. **Ein Abbruch mitten im Entfernen** verschluckt den Fortschritt nicht: Eine Kopie wird vor dem
   Wurf noch entfernt, `removed` bleibt `1`, und **beide** Zeilen erscheinen — die Abbruchzeile
   **und** die Fortschrittszeile, wörtlich der Anspruch aus dem Kopfkommentar der Produktivdatei.

**Rot vor grün für Riegel 4 (die von der Wiedervorlage ausdrücklich verlangte Antwort).** Vor der
Ergänzung durch T-178 gab es in `sweepOrphanedImages` keinen `if (known.size === 0) { … }`-Zweig:
Der Code ging bei einer leeren `known`-Menge direkt in die Entfernungsschleife und löschte **jeden**
gefundenen Namen, unabhängig davon, ob der Bestand insgesamt Bildanhänge führte. Mein Fall
„`knownImageTargets ist leer UND der Bestand führt insgesamt Bildanhänge`" verlangt `removed === 0`
bei zwei Funden; gegen die Fassung vor T-178 hätte derselbe Aufbau `removed === 2` ergeben (beide
Funde gelöscht, kein Widerspruch erkannt, kein `imageCount`-Aufruf, den es dort noch gar nicht
gab) — der Fall wäre **rot** gewesen. Der Gegenfall (`imageCount` liefert `0`, alles wird entfernt)
wäre dagegen **auch vorher schon grün** gewesen — er ist absichtlich daneben gestellt und nicht als
Beleg der Behebung gedacht, genau wie die Rust-Gegenfälle aus Abschnitt 1.3.

### 2.6 Nachtrag T-179 A-1: `fileExtensionOf` und der führende Punkt (nicht in der ursprünglichen
Aufgabe, entstanden aus einer konkurrierenden Änderung während dieser Sitzung)

Details, Ursache und Fundstelle stehen unter „Nachweis" (Zwischenfall 3). Kurz: Ein
**vorbestehender** Fall in `packages/domain/test/attachment.test.ts` (`:421`, nicht von mir
angelegt) erwartete, dass ein Name mit führendem Punkt (`.bashrc`) **keine** Endung hat — die
Unix-Sicht. code-reviewer (T-179, Auflage A-1) hat gemessen, dass das der Hülle
(`has_indirect_extension`, Windows-Explorer-Sicht: ein führender Punkt zählt zur Endung) seit
T-178 wörtlich widersprach, und den Fix benannt. Ich habe:

* den Fall umgeschrieben, mit Begründung im Kommentar statt stillschweigend (`.bashrc` → `bashrc`,
  dazu `.gitignore` → `gitignore` als zweiter Beleg für den benannten „Preis": eine harmlose
  Punktdatei bekommt jetzt ebenfalls eine „Endung", ohne dass sich an ihrer Behandlung sonst etwas
  ändert);
* die eigentliche **Konsequenz** dieser Korrektur ergänzt und nicht nur ihre Zeichenkette: ein
  `it.each` über alle fünf Umleitungsendungen, bei denen der Name **nur** aus der Endung besteht
  (`.lnk`, `.url`, `.pif`, `.scf`, `.desktop`) — vorher an der Tür angenommen, jetzt mit
  `path_indirect_extension` abgewiesen, konsistent mit der Hülle;
* dieselbe Konsequenz für einen nachgestellten Punkt oder ein nachgestelltes Leerzeichen
  (`rechnung.lnk.`, `rechnung.lnk `, `rechnung.lnk.. `, `verweis.URL `) — dieselbe Familie, die
  T-156-1/A-A-5′ für die Hülle bereits geschlossen hatte und die die Domäne bis T-178 noch nicht
  kannte;
* eine Gegenprobe, dass eine harmlose Datei mit nachgestelltem Punkt (`bericht.pdf.`) unverändert
  gültig bleibt.

**Rot vor grün, konkret:** Vor T-178 lieferte `fileExtensionOf('/home/nutzer/rechnung.lnk ')` die
ungetrimmte „Endung" `"lnk "` (mit Leerzeichen) — kein Treffer in `INDIRECT_EXTENSIONS`, also
`checkAttachmentPath(...) === { ok: true, … }`. Meine neuen Fälle verlangen
`path_indirect_extension`; gegen die Fassung vor T-178 wären sie **rot** gewesen. Ich habe das
nicht gegen eine nachgebaute alte Fassung gemessen (anders als bei den Rust- und
`image-sweep`-Gegenproben) — die Divergenz ist hier direkt aus dem Diff der Produktivdatei
ablesbar und von domain-dev in T-178s eigenem Bericht mit derselben Zahl (`"lnk "` trifft keinen
Eintrag) unabhängig vorgemessen.

---

## 3. O-DJ — `copyImage` und `readImage` (kein Befund verlangt es, T-159 mahnt es an)

Zwei neue `describe`-Gruppen in `apps/local-api/test/access/attachment-store.test.ts`, mit echten
Wegwerfdateien und minimalen, aber echten Kopfsignaturen (PNG: `89 50 4E 47 0D 0A 1A 0A`, JPEG:
`FF D8 FF E0`):

**`copyImage`:** relativer Quellpfad → `unreadable`, ohne dass etwas gelesen wird; ohne
`appDataDir` → `write_failed`; nicht vorhandene Quelle → `unreadable`; eine echte PNG-Datei wird
kopiert (erzeugter Name nach der Form, richtiger `mediaType`, richtige Bytezahl, dieselben Bytes
liegen unter dem erzeugten Namen — Prüfsumme über `imageDigest`, der Name der Kopie enthält nichts
vom Quellnamen, A-A-17); Text ohne Kopfsignatur → `not_an_image`; leere Quelle → `empty`.

**`readImage`:** ein Name ohne die richtige Form → `bad_name`, ohne Dateisystemzugriff außerhalb
des Bildverzeichnisses; ohne `appDataDir` → `bad_name`; eine fehlende Kopie → `unreadable`
(A-19.15, kein Wurf); eine echte Kopie liefert dieselben Bytes und den `mediaType` zurück; **der
Name lügt, der Inhalt entscheidet** — eine `.png`-Kopie mit JPEG-Bytes ergibt `image/jpeg` (genau
der im Kopfkommentar beschriebene Fall); eine Kopie ohne gültige Signatur trotz gültigem Namen →
`not_an_image`; eine leere Kopie → `empty`.

**Bewusst ausgelassen:** ein Test gegen `MAX_ATTACHMENT_IMAGE_BYTES` (`too_large`, sowohl bei
`copyImage` als auch bei `readImage`) — er bräuchte eine reale Datei bzw. einen realen Puffer über
8 MiB und wäre der teuerste Einzelfall dieser Welle für vergleichsweise wenig zusätzliche
Aussagekraft (die Zählschleife selbst ist dieselbe an beiden Stellen und für `copyImage` bereits
durch den PNG-Rundlauf indirekt durchlaufen). Siehe Offene Frage 1.

---

## Nachweis — Zahlen vorher und nachher

| Lauf | vorher (Stand laut Auftrag / Orchestrator-Update) | nachher |
|---|---|---|
| `pnpm test` | 1369 grün, 2 rot (O-EM) → nach meinen ersten Änderungen bereits 1381 grün, 0 rot (Zwischenstand des Orchestrators) | **1430 grün, 0 rot** |
| `cargo test --lib` (Linux, `apps/desktop/src-tauri`) | 50 bestanden | **60 bestanden**, 0 fehlgeschlagen |
| `pnpm typecheck` | 0 Fehler (ein zwischenzeitlicher fremder Fehler in `apps/web` war laut Orchestrator-Update bereits wieder behoben) | **0 Fehler** |
| `pnpm run proof:codepoints` | — | **45 bestanden, 0 fehlgeschlagen** |
| Testabdeckung `packages/domain/src` (`vitest --coverage`, nur domain+export) | — | **85,11 % Anweisungen, 85,4 % Zweige** |
| Testabdeckung `packages/export/src` | — | **97,95 % Anweisungen, 92,26 % Zweige** |

Neue/geänderte Fälle in Zahlen, nach Datei: Rust (`attachment.rs`, eigener Lauf, nicht in
`pnpm test` enthalten) `+10` (6 A-A-28, 2 Gegenproben, 1 A-A-29, 1 A-A-30). In `pnpm test`
(JavaScript/TypeScript): `packages/storage/test/repo-attachments.test.ts` `+4`
(`knownImageTargets`); `apps/local-api/test/access/attachment-store.test.ts` `+17` (`listImages`
4, `copyImage` 6, `readImage` 7); `apps/local-api/test/usecases/image-sweep.test.ts` neu mit
`21` Fällen (**125** Gesamtfälle jetzt in `packages/domain/test/attachment.test.ts`, davon drei
Fälle bewusst umgeschrieben — die zwei aus O-EM und der eine aus T-179 A-1 — und der Rest neu
zwischen dem O-EM-Zwischenstand und diesem Bericht).

**Zwei Zwischenfälle während dieser Sitzung — beide fremde, legitime Produktivänderungen in
derselben Datei, kein Fehler von mir, beide im Testfile behoben und um die dazugehörigen
Prüffälle ergänzt:**

1. **A-A-36, zweiter Riegel (`attachmentKinds`).** T-178 (domain-dev) hat `image-sweep.ts` um
   einen Pflicht-Port `attachmentKinds()` erweitert, gefragt **vor** allem anderen; führt der
   Bestand eine andere Artmenge, räumt der Lauf gar nicht auf. Meine damals zehn
   `image-sweep.test.ts`-Attrappen kannten die neue Pflichtfunktion noch nicht und fielen alle
   acht betroffenen mit derselben Ursache durch (`ports.attachmentKinds is not a function`, vom
   `try`/`catch` zu `attachment_image_sweep_unavailable` gemacht). Behoben durch die neue Funktion
   in jeder Attrappe (`KNOWN_KINDS` aus `@takt/domain`) plus vier neue Fälle für den Riegel selbst.
2. **T-179 B-1, die Widerspruchsprüfung (`imageCount`).** Unmittelbar danach hat T-178 (in
   derselben Aufgabe, als Reaktion auf einen Befund des code-reviewers) einen **fünften** Port
   `imageCount()` ergänzt — gefragt genau dann, wenn `knownImageTargets` eine **leere** Menge
   liefert, um eine leere Antwort gegen die Gesamtzahl der Bildanhänge im Bestand zu widerlegen,
   bevor ihr vertraut wird. Das brach erneut alle 15 Attrappen (Typfehler, `imageCount` fehlt) und
   zwei konkrete Fälle zur Laufzeit (die beiden, deren `knownImageTargets` eine leere Menge
   zurückgaben, ohne `imageCount` zu kennen). Behoben durch die fünfte Funktion in jeder Attrappe
   plus drei neue Fälle für den Riegel selbst (Widerspruch → nichts entfernt; kein Widerspruch →
   normal entfernt; `imageCount` wird bei bekannten Namen gar nicht erst gerufen).
3. **T-179 A-1, `fileExtensionOf` und der führende Punkt.** Unabhängig davon hat T-178 auch
   `packages/domain/src/attachment.ts` geändert: `fileExtensionOf` zerlegt jetzt am
   **aufgelösten** Namen (`effectiveNameSegment`, dieselbe Zerlegung wie `effective_file_name` in
   der Hülle) statt am rohen — ein führender, nachgestellter Punkt oder ein nachgestelltes
   Leerzeichen zählen jetzt zur Endung, konsistent mit `has_indirect_extension` in
   `attachment.rs`. Das hat einen **vorbestehenden** Fall in meiner Datei rot werden lassen:
   `packages/domain/test/attachment.test.ts:421`, „eine versteckte Unix-Datei (führender Punkt)
   hat KEINE Endung", erwartete `fileExtensionOf('/home/nutzer/.bashrc') === ''`. Das war die
   **alte, jetzt falsche** Wahrheit — code-reviewer (T-179, Auflage A-1) hatte genau diesen
   Widerspruch zwischen Domäne und Hülle gemessen und den Fix wörtlich benannt
   (`dot <= 0` → `dot === -1`, Testfall `.bashrc` → `bashrc`). Ich habe den Fall entsprechend
   umgeschrieben (mit Begründung im Kommentar, nicht stillschweigend) und zehn neue Fälle ergänzt:
   fünf für die Konsistenz von `checkAttachmentPath` bei einem Namen, der **nur** aus einer
   Umleitungsendung besteht (`.lnk`, `.url`, `.pif`, `.scf`, `.desktop`), drei für eine
   Umleitungsendung mit nachgestelltem Punkt oder Leerzeichen, einer für Groß-/Kleinschreibung mit
   Backslash-Trenner, und eine Gegenprobe, dass eine harmlose Datei mit nachgestelltem Punkt
   weiterhin gültig bleibt.

**Rot vor grün für den dritten Punkt, konkret:** Vor T-178 lieferte `fileExtensionOf('/home/nutzer/rechnung.lnk ')`
die (rohe, ungetrimmte) „Endung" `"lnk "` mit Leerzeichen — kein Treffer in `INDIRECT_EXTENSIONS`,
also `checkAttachmentPath` `ok: true`. Meine neuen Fälle mit nachgestelltem Punkt oder Leerzeichen
verlangen `path_indirect_extension`; gegen die Fassung vor T-178 wären sie rot gewesen. Domain-dev
hat dieselbe Tabelle in T-178s eigenem Bericht mit sieben von zehn Namen als Abweichung vorher,
null von vierzehn nachher gemessen — ich habe das nicht nachgeglaubt, sondern mit den zehn neuen
Fällen hier selbst nachvollzogen.

---

## Annahmen

1. **A-A-29 misst gegen 16 Ausprägungen, nicht 15.** Das Bedrohungsmodell (22.5) datiert von vor
   T-167s `PathStreamSeparator`; ich zähle die tatsächlich heutige Aufzählung, nicht die
   dokumentierte Zahl — dieselbe Lehre, die 22.2 aus der 28-gegen-22-Verwechslung zieht („eine
   Auflage nennt keine Zahl, die sie nicht selbst zählt").
2. **Die Gegenprobentechnik (alte Fassung nachbauen, im `#[cfg(test)]`-Block) ist der zulässige
   Ersatz für ein temporäres Patchen der Produktivdatei.** Der direkte Versuch wurde vom
   Berechtigungssystem abgelehnt; ich halte die Gegenprobe für einen mindestens gleichwertigen
   Nachweis, weil sie dauerhaft im Baum steht und bei jedem künftigen Lauf erneut prüft, statt nur
   einmal in einem Bericht zu stehen.
3. **`too_large` für `copyImage`/`readImage` bleibt ungeprüft** (Kostenabwägung, siehe oben) — kein
   Befund verlangt es, und O-DJ selbst ist schon „nicht von einem Befund verlangt".
4. **Für `image-sweep.ts` zählen die fünf Portfunktionen als Testgrenze** (am Ende der Sitzung:
   `attachmentKinds`, `imageCount`, `listImages`, `knownImageTargets`, `removeImage` — die letzten
   drei waren meine ursprüngliche Annahme, die ersten beiden kamen während der Sitzung dazu), nicht
   die echten Adapter — genau wie die Produktivdatei es im eigenen Kopfkommentar vorschreibt. Die
   echten Adapter haben ihre eigenen Fälle in `repo-attachments.test.ts` und
   `attachment-store.test.ts`.
5. **Keine Testdaten mit echten Call-Nummern, Kundennamen oder Zugangsdaten.** Alle Wirte
   (`beispiel.example`), Pfade (`/home/kundeEins/…`, `C:\Kunden\Meier\…`) und Namen sind erfunden.

---

## Risiken

1. **`INDIRECT_EXTENSIONS` hat weiterhin keinen Prüffall, der eine künftige Erweiterung um einen
   Windows-Umleiter mit mehr als drei Zeichen automatisch ablehnt** — A-A-30 macht den bestehenden
   Zustand nur **sichtbar** (der Fall wird rot), er verhindert die Erweiterung nicht. Das ist
   Absicht (die Entscheidung, ob eine neue Endung dazukommt, ist fachlich, nicht testlich), aber
   es lohnt sich, das im Review nicht zu übersehen.
2. **Die A-A-32-Auflage (Windows-Bahn in einem Ablauf, der bei jedem Stand aufgeht) liegt beim
   Orchestrator**, nicht bei mir — ich habe sie nicht angefasst, weil sie `.github/workflows/`
   betrifft und außerhalb meiner Dateihoheit liegt.
3. **`gegenprobe_a_a_28_…` und `gegenprobe_a_a_29_…` enthalten je eine vollständige Nachbildung
   von Produktivlogik** (`check_file_ergebnis_vor_t_167`, `schluessel_mit_vertauschtem_paar`).
   Ändert sich `check_file` oder `Rejection` künftig strukturell, müssen diese Nachbildungen von
   Hand nachgezogen werden — dieselbe Wartungslast, die die bestehende T-157-Gegenprobe im selben
   Modul schon trägt, und aus demselben Grund vertretbar.

---

## Offene Fragen

1. **spec-ux-reviewer / Orchestrator:** Soll ich in einer Folgewelle die `too_large`-Fälle für
   `copyImage`/`readImage` nachreichen? Kein Befund verlangt es aktuell.
2. **Orchestrator:** A-A-32 (Windows-Ablauf in `release.yml`) ist weiterhin offen und liegt nicht
   in meiner Dateihoheit.

---

## Nächster Schritt

`pnpm run proof:all` einmal vollständig durch den Orchestrator nach Schließen der Welle (fester
Port 17843, in dieser Welle nicht von mir gefahren). Danach: Freigabe durch code-reviewer,
spec-ux-reviewer und security-checker für die drei Punkte dieser Aufgabe.

---

## Nachtrag — die Schwelle in `packages/storage/src/**` (Auftrag des Orchestrators)

**Befund, zuerst nachgesehen und nicht vermutet.** `pnpm run test:coverage` schrieb vor diesem
Nachtrag:

```
 ...age/src/sqlite |   88.72 |    79.28 |   92.37 |   92.02
 ...ttachments.ts  |      90 |       80 |      80 |    89.79   157,224-239
ERROR: Coverage for branches (79.93%) does not meet "packages/storage/src/**" threshold (80%)
```

Die unbetretenen Zweige in `repo-attachments.ts` lagen auf den Zeilen **224–239**: zwei ganze
Methoden, `knownKinds()` (A-A-36) und `imageCount()` (T-179 B-1) — beide während dieser Welle
durch T-178 (domain-dev, als Reaktion auf einen Befund von security-checker bzw. code-reviewer)
neu in diese Datei gekommen, **ohne** dass für sie bis dahin ein Prüffall existierte. Das ist genau
die Lücke, die der Orchestrator benannt hat: neuer Code aus dieser Welle, dessen Zweige ein noch
so grüner Bestand an alten Fällen nicht betritt.

**Geurteilt, nicht gefüllt.** Zwei Sorten Zweig standen zur Wahl:

* **Echte Lücken — gebaut.** `knownKinds()` und `imageCount()` sind reine SQL-Abfragen ohne
  Attrappe, beide leicht gegen `openTestDatabase()` zu prüfen, und beide waren schlicht vergessen.
  Neue Fälle in `packages/storage/test/repo-attachments.test.ts`:
  - `knownKinds()`: die drei aus Migration 0015 eingetragenen Arten (`file`, `image`, `link`);
    unverändert durch Anlegen/Entfernen von Anhängen (sie liest die Nachschlagetabelle, nicht die
    Nutzung); eine vierte, von außen eingetragene Art (`INSERT INTO todo_attachment_kind …` über
    `db.conn.exec`, direkt am Bestand vorbei an der Domäne) erscheint sofort — genau der Fall, für
    den A-A-36 überhaupt gebaut wurde.
  - `imageCount()`: `0` ohne jeden Anhang; zählt ausschließlich `kind = 'image'`, keine Verweise,
    keine Dateien; zählt über mehrere Todos hinweg; sinkt wieder, wenn ein Bildanhang entfernt
    wird.
* **Eine Zeile, die ich nicht zugedeckt habe — Zeile 157, unverändert weiter offen.** Der `if
  (created === null)`-Zweig in `create()` ist laut eigenem Kommentar der Produktivdatei
  „unerreichbar, solange das INSERT durchging" — er entstand nicht in dieser Welle (die Funktion
  ist aus T-146/T-148) und hat mit `knownKinds`/`imageCount` nichts zu tun. Ihn mit einem Fall zu
  decken hieße, `loadOne` künstlich `null` zurückgeben zu lassen, obwohl die Zeile gerade erst
  eingefügt wurde — ein Fall, der eine Situation behauptet, die es laut dem Kommentar der
  Produktivdatei nicht geben kann. Das ist genau die Sorte Zweig, die der Auftrag ausdrücklich
  ausnimmt: still lassen und sagen, nicht zudecken.
* **Auch nicht angefasst: der ternäre Zweig `row === undefined` in `imageCount()`.** `SELECT
  COUNT(*) … ` liefert unter SQLite **immer genau eine** Zeile, auch wenn kein Datensatz zutrifft
  — anders als ein `SELECT` ohne Aggregatfunktion. `row` kann mit dem echten Treiber nie
  `undefined` sein; die Prüfung ist eine Typzusicherung gegen die Signatur von `.get()`
  (`SqlRow | undefined`) und kein erreichbarer Fachfall. Ein Prüffall, der das erzwänge, müsste den
  Adapter selbst durch eine Attrappe ersetzen, die etwas vorgibt, was die echte Datenbank nicht
  tut — dieselbe Falle, vor der der Auftrag warnt.

**`ports.ts` mit 0 %:** wie vom Orchestrator vorweggenommen reiner Schnittstellencode ohne
ausführbare Zeile — nichts zu tun.

**Nachweis, Zahlen vorher/nachher:**

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm run test:coverage` | **ERROR** — Branches 79,93 % gegen `packages/storage/src/**` (Schwelle 80 %) | **grün, Exitcode 0** |
| `packages/storage/src/sqlite/repo-attachments.ts`, Branch | 80 % (Zeilen 157, 224–239 offen) | **85 %** (nur Zeile 157 offen, benannt und begründet) |
| `packages/storage/src/sqlite/**` gesamt, Branch | 79,28 % | 79,39 % (steigt leicht; die Schwelle gilt für `packages/storage/src/**` insgesamt, nicht je Unterordner, und dort zählt `storage/src` selbst mit 100 % mit hinein) |
| `pnpm test` | 1430 grün | **1437 grün**, 0 rot (7 neue Fälle: 3 `knownKinds`, 4 `imageCount`) |
| `pnpm typecheck` | 0 Fehler | 0 Fehler (unverändert) |

**Was dieser Nachtrag nicht behauptet:** Die übrigen Dateien unter `packages/storage/src/sqlite/**`
mit niedrigerer Zweigdeckung (`clock.ts` 33 %, `database.ts` 61 %, `open.ts` 71 % und andere)
stammen **nicht** aus dieser Welle und liegen außerhalb dessen, was mich beauftragt wurde zu
beheben — der Auftrag war die Schwelle zu halten, nicht jede Datei im Verzeichnis zu vervollständigen.
Sie zu einer eigenen Aufgabe zu machen, überlasse ich dem Orchestrator.

Artefakt: `packages/storage/test/repo-attachments.test.ts` (sieben neue Fälle in zwei neuen
`describe`-Blöcken, keine Produktivdatei angefasst).
