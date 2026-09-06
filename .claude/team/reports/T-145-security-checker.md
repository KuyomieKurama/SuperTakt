# T-145 — Wiedervorlage 18.9, Bedrohungsmodell für Frist und Anhänge

**Rolle:** security-checker. **Datum:** 2026-09-05.
**Zweig:** `versionspruefung-gegen-github`. **Prüfumfang Teil 1:** `git diff 0635aea..HEAD`, 99 Dateien.
**Artefakte:** `docs/bedrohungsmodell.md` (neue Abschnitte 19 und 20, neue Grenze VG-11, Kopf),
dieser Bericht.

---

## Kurzfassung

```
Aufgabe: T-145 — Wiedervorlage 18.9, Bedrohungsmodell für Frist und Anhänge
Status:  Teil 1 (Wiedervorlage) — nicht freigegeben, Nacharbeit für 0.1.1
         Teil 2 (Vorabbewertung) — freigegeben für den Bau, mit 24 Auflagen
                                   und einer Vorbedingung
```

Keine der zwanzig Auflagen aus 18.9 ist **nicht** erfüllt. Sechs sind *abweichend erfüllt*, und
fünf davon sind Fehler in der **Messung**, nicht im Code. Zwei neue Befunde der Stufe „muss"
betreffen die Nachweise: Die Prüfläufe sprechen mit GitHub (gemessen), und `cargo test` läuft
nirgends — obwohl dort die einzige Kontrolle zwischen einer fremden Zeichenkette und dem
Prozeßstart liegt. Für Teil 2 ist die Bauform aus E-070/E-071/E-072 tragfähig; zwei Messungen
haben Auflagen erzeugt, die man ohne sie anders geschrieben hätte.

---

## Teil 1 — Die zwanzig Auflagen gegen den Code

Vollständig in `docs/bedrohungsmodell.md` Abschnitt 19.1, Auflage für Auflage.

| Urteil | Auflagen |
|---|---|
| erfüllt (14) | A-V-2, A-V-3, A-V-5, A-V-7, A-V-8, A-V-9, A-V-10, A-V-11, A-V-13, A-V-15, A-V-17, A-V-18, A-V-19, A-V-20 |
| abweichend erfüllt (6) | A-V-1, A-V-4, A-V-6, A-V-12, A-V-14, A-V-16 |
| nicht erfüllt (0) | — |

Die drei von T-138 selbst gemeldeten Punkte:

* **A-V-14** — bestätigt als *abweichend erfüllt, enger als gefordert*. Zwei Felder statt drei;
  das dritte war die installierte Fassung, die der Dienst seit E-069 nicht mehr kennt. Der Kern
  („kein Text aus der Antwort, kein `html_url`") ist gewahrt und wird mit Gegenprobe gemessen.
  Die Auflage nannte eine **Zahl**, wo sie eine **Verbotsliste** meinte — neu als A-V-14′.
* **A-V-1** — die Formulierung stimmt nicht mehr. `grep -rn "api\.github\.com" apps/local-api/src`
  liefert **zwei** Zeilen (Konstante + begründender Kommentar), `grep -rn "github\.com"` über den
  Produktivcode **sechs** statt der als Ausgangspunkt genannten null. Alle sechs sind erklärt und
  gemessen. Die richtige Messung ist `proof:release-safety`, das Kommentare vorher wegschneidet —
  neu als A-V-1′. Dieselbe Sache bei A-V-4 (`dispatcher`, `ProxyAgent`, `undici` stehen je einmal
  im Kommentar, der erklärt, daß sie nicht dastehen) — neu als A-V-4′.
* **A-V-6** — die 64-KiB-Grenze **nachgemessen**, siehe unten. Zwei Zahlen gerade gezogen.

### Die sieben Messungen

| # | Messung | Ergebnis |
|---|---|---|
| 1 | `releases/latest`, echt, mit `v0.1.0` | 200; auf der Leitung **4 126** Bytes gzip, **entpackt 21 683**; `tag_name = v0.1.0`; 21 Felder; `assets` **14 996** Bytes bei 9 Anhängen = **1 666 je Anhang**; `body` 4 734. Die Grenze ist damit das **3,02-fache**, nicht das Vierfache wie der Quelltextkommentar sagt. |
| 2 | gzip-Bombe gegen den echten Leser | 50 989 → 52 428 800 Bytes; `too_large` in 17 ms, kein `JSON.parse`. **Tatsächlich gelesen: 81 920 Bytes** = Grenze + genau eine Leseeinheit (16 384). A-V-6 („Abbruch vor 65 537 gelesenen Bytes") ist als Zahl falsch, als Sache richtig. |
| 3 | Kopfzeilen gegen einen Prüfserver | `GET /`, acht Kopfzeilen: die drei gesetzten plus `accept-encoding`, `accept-language: *`, `connection`, `host`, `sec-fetch-mode`. Keine Kennung, keine Fassung, keine Sprache. |
| 4 | Antwort, die anfängt und nie endet | `timeout` nach **5 007 ms** — die Frist deckt das Lesen des Rumpfes. |
| 5 | Die ganze Kette gegen die echte Quelle | Dienst gestartet wie die Hülle ihn startet: nach 4 s `{"state":"unknown"}`, nach 14 s `{"state":"known","latestVersion":"0.1.0"}`. |
| 6 | `ss -tnp` während `pnpm run proof:access` | `ESTAB … 140.82.121.6:443 users:(("node",…))` — das ist `api.github.com` (Rückwärtsauflösung `lb-140-82-121-6-fra.github.com`). **Befund T-145-1.** |
| 7 | `cargo test` in `apps/desktop/src-tauri` | 31 Prüffälle grün, 0,00 s nach dem Übersetzen — **von Hand gefahren, kein Ablauf ruft ihn**. **Befund T-145-2.** |

### Die zwei Zeilen für T-132

* **`sqlite` und `code` als neue Angaben in der Ausgabe: unbedenklich.** `errorCodeOf` nimmt
  `error.code` nur an, wenn es `^[A-Z][A-Z0-9_]{0,31}$` erfüllt; `sqliteResultCodeOf` nur als
  ganze Zahl; `pair()` schreibt Zahlen nur als nicht negative sichere Ganzzahlen und Text nur
  kleingeschrieben. Ein Pfad fällt an `^[A-Z]`, ein Benutzername steht in keiner
  `.code`-Eigenschaft eines Wurfs aus `node:sqlite` oder `node:fs`.
* **Der Riegel im Protokollierer ist eine Gestalt-, keine Inhaltsprüfung — und das ist die richtige
  Bauart, solange man weiß, was er nicht kann.** Gemessen: `C:\Users\Kerem` und
  `/home/kerem/.local/share/takt/takt.sqlite3` werden abgewiesen; `x user=kerem`,
  `x tag=kunde_mueller`, `x n=tck4711` kommen **durch**. Die größte durchkommende Zeile ist 336
  Zeichen lang, davon **256 Zeichen Wertinhalt** (8 Paare × 32). Er begrenzt **Gestalt und
  Menge**, nicht **Herkunft**. Der Sonderfall Sitzungsgeheimnis ist von `redactSecrets`
  geschlossen (zweite Schicht, unabhängig von der Schreibweise). Auflage **A-V-21**: der dritte
  Parameter von `lifecycle` als geschlossene Vereinigung statt `string`.

### Befunde Teil 1

| Kennung | Schwere | Sache |
|---|---|---|
| **T-145-1** | **muss** | Die Nachweisläufe sprechen mit GitHub. `main.ts` sagt „kein Nachweispfad, kein Prüffall und keine Messung stellt eine Verbindung nach außen her" — gemessen ist das Gegenteil. Folgen: Lebenszeichen (R-19 Punkt 3) aus jedem `pnpm check`, auch aus dem Auslieferungstor; Mitverbrauch der 60 Anfragen je Stunde und Quelladresse (T-136-5); eine Zusage im Quelltext, die nicht stimmt. **Das Muster für die Behebung liegt vor:** T-142 hat für den E2E-Lauf einen zweiten, nie ausgelieferten Einstiegspunkt mit `compose({ releaseSource })` gebaut; `proof:access` startet dagegen unverändert `apps/local-api/src/index.ts`. |
| **T-145-2** | **muss** | `cargo test` steht in keinem Ablauf. Die 31 Rust-Prüffälle sind die **einzige** Kontrolle zwischen einer Fassungsbezeichnung und `xdg-open`/`ShellExecuteW` (T-136-1). A-V-16 ist formal erfüllt und faktisch ungesichert. |
| **T-145-3** | Hinweis | Die 64-KiB-Grenze hat **drei** Fach Luft, nicht vier; rechnerisch bei rund **35 Anhängen** erreicht, heute neun. Der Ausgang beim Überschreiten ist der stille `too_large` — die Versionsprüfung stellte den Betrieb ein, sichtbar nur an einer Protokollzeile. |
| **T-145-4** | Hinweis | Fünf der zwanzig Auflagen nennen eine **Zählung**, wo sie eine **Eigenschaft** meinen (A-V-1, -4, -6, -12, -14). Neufassungen in 19.5. Derselbe Befund wie T-136-2, gegen den eigenen Text. |
| **T-145-5** | Hinweis | `logger.lifecycle` nimmt `string`; siehe oben. |
| **T-145-6** | Hinweis | Semgrep Guardian zum **neunten** Mal nicht erreichbar, 42Crunch zum **achten** Mal ohne Werkzeug. Lieferkette bleibt ungemessen — und mit `v0.1.0` ist zum ersten Mal etwas ausgeliefert. |

### Neue und berichtigte Auflagen

A-V-1′, A-V-4′, A-V-6′, A-V-12′, A-V-14′ (Neufassungen) sowie **A-V-21** (geschlossene
Vereinigung für den Protokollgrund), **A-V-22** (kein Nachweislauf spricht nach außen),
**A-V-23** (`cargo test` in `pnpm check`). Wortlaut in 19.5.

---

## Teil 2 — Frist und Anhänge, vor dem Bau

Vollständig in `docs/bedrohungsmodell.md` Abschnitt 20. Neue Grenze **VG-11**, sechs Bedrohungen
**B-19.1** bis **B-19.6**, **vierundzwanzig Auflagen A-A-1 bis A-A-24**.

### Die sechs Punkte der Beauftragung

1. **Der Dateianhang ist ein Startknopf (R-21).** Was trägt: der Pfad aus dem **Systemdialog**
   (`dialog:allow-open`, `directory: false` — kein Zuwachs an Fläche, die Berechtigung steht
   bereits in der Liste); absoluter Pfad; **kein UNC** — und die ist unter Windows **nicht** aus
   `Path::is_absolute()` ableitbar, weil ein UNC-Pfad absolut ist. Was nicht trägt: `exists()` als
   Sicherheitsprüfung (Wettlauf) und die **Endungs-Verbotsliste**. Letztere ist keine Grenze:
   `PATHEXT` ist unter Windows benutzerbestimmt, die Menge ist nicht abzählbar, und eine Liste,
   die blockiert, lehrt das Umbenennen. Sie trägt an **einer** Stelle etwas bei, und zwar an einer
   anderen als der erwarteten: bei den fünf **Umleitungen** `.lnk`, `.url`, `.pif`, `.scf`,
   `.desktop` — dort zeigt der Pfad, den die Rückfrage nennt, nicht auf das, was startet; die
   Rückfrage sagt die Wahrheit über die Datei und lügt über die Wirkung. Diese fünf hart abweisen
   (A-A-5), alles Weitere ist Beruhigung.
   **Die Rückfrage (E-072 Punkt 3)** braucht sechs Eigenschaften, damit sie kein Wegklicker ist —
   und die wichtigste kostet nichts, weil sie existiert: **jeder angezeigte Teil geht durch
   `visibleText`/`ForeignText`**, sonst zeigt `rechnung\u{202e}cod.exe` als `rechnungexe.doc` an.
   Dazu: voller ungekürzter Pfad, die **Wirkung** im Satz, keine Vorauswahl und kein Anfangsfokus,
   **kein** „nicht mehr fragen", kein `window.confirm`. (A-A-6.)
2. **Der Verweis (R-22) — gemessen, nicht vermutet.** 28 Zeichenketten gegen drei Fassungen in
   Rust (`url 2.5.8`). Ergebnis: **Ja, eine Positivliste aus `http`/`https` reicht** — auch gegen
   den UNC-Pfad in **beiden** Schreibweisen: `\\server\freigabe` läßt sich gar nicht zerlegen,
   `file://server/freigabe` fällt an der Positivliste. Eine eigene UNC-Regel braucht der
   **Verweis** nicht; sie braucht der Typ **Datei**.
   Was an einer naiven Fassung vorbeikommt, ist **nicht** ein Schema, sondern die
   **Normalisierung**: Der Zerleger macht aus `http:/\example.org/` ein `http://example.org/`,
   entfernt Tabulator und Zeilenumbruch an jeder Stelle (`ht<TAB>tps://…` → `https`), läßt eine
   Nullbreite im Wirt verschwinden (`exam<ZWSP>ple.org` → `example.org`), wandelt Homoglyphen nach
   Punycode und behält Zugangsdaten im Wirt. Wer die Rohfassung anzeigt und die Normalform öffnet,
   hat einen Verweis gebaut, der lügt. **Die Antwort ist ein Festpunkt** — beim Anlegen einmal
   normalisieren und die Normalform speichern, der Öffnen-Befehl verlangt
   `Url::parse(x).as_str() == x`. **Gemessen idempotent** für alle zehn Fälle. (A-A-2, A-A-3.)
   Nebenwirkungen, alle erwünscht: RLO wird zu `%E2%80%AE`, Homoglyph zu `xn--exmple-4nf.org`
   (Anzeige = Ziel), Zugangsdaten werden abgewiesen statt normalisiert.
3. **Der Prüfort ist nicht verhandelbar**, weil heute schon **drei** Schreibwege am Eingabefeld
   vorbei in den Bestand führen: VG-1 (jeder lokale Prozeß mit dem Sitzungsgeheimnis), VG-3
   (`0700` hält andere Benutzer ab, nicht andere Prozesse desselben Benutzers — `sqlite3` und ein
   `UPDATE` genügen) und jede künftige Migration.
   **`proof:shell-surface` muß von Zählen auf Benennen umgestellt werden**, und zwar **vor** der
   ersten Bauaufgabe: namentliche Liste (Datei **und** Funktion) statt einer Zahl; für **jeden**
   Aufrufort die Bedingung „im selben Funktionsrumpf steht die zugehörige Prüfung, und das Öffnen
   hängt von ihrem Ergebnis ab"; drei neue Gegenproben. Die Zahl auf 3 zu setzen wäre der
   Nachweis, der grün wird, ohne etwas geprüft zu haben (14.7). (A-A-9, Befund T-145-7.)
4. **Die Add-in-Grenze ist im Bestand baubar — und die stärkste Form ist zugleich die billigste.**
   Heute schon: `z.object()` entfernt unbekannte Felder stillschweigend (wirksam, aber eine
   Voreinstellung der Bibliothek), und `routes/addin/index.ts:305-312` baut die Eingabe **Feld für
   Feld** aus sechs benannten Werten. Das Vorbild R-06 ist übertragbar: `ExportSourcePath` ist eine
   geschlossene Vereinigung, `SOURCE_PRESENCE: Record<ExportSourcePath, true>` erzwingt
   Vollständigkeit beim Übersetzen, der Auflöser ist ein `switch` — *„Was keinen Zweig hat, hat
   keinen Wert."* **Übertragen heißt: Anhänge entstehen über eigene Routen außerhalb von
   `/addin`.** Dann trägt die Grenze ohne einen neuen Wächter, weil `requiredCredentialForPath`
   alles außerhalb von `/addin` und `SHARED_PATHS` von selbst schließt und `proof:route-policy`
   Abschnitt 4 **jede** Route mit dem Add-in-Token anfährt (heute 61, keine nimmt es an).
   Gemessen werden muß: die Route-Policy bleibt grün; die Add-in-Eingabetypen tragen kein
   Anhangsfeld **als Typ**; ein Prüffall schickt einen Anhang an `POST /addin/todos` und mißt
   danach **am Bestand** null Anhänge (nicht den Statuscode — ein 422 wäre die Bibliothek, nicht
   die Grenze); `GET /addin/context` bekommt kein Anhangsfeld. (A-A-21 bis A-A-23.)
5. **Das Bild.** Vier Fragen: Größe (Obergrenze **beim Lesen gezählt**, nicht aus `stat` —
   dieselbe Begründung wie A-V-6; Vorschlag 8 MiB), Typ (**Kopfsignatur**-Positivliste, nicht
   Endung und nicht `content-type`), **SVG** (im `<img>` harmlos, aber über den Typ *Datei*
   geöffnet laufen die Skripte — es hat keine Signatur und gehört nicht in die Liste) und die
   Kopie (`0700`/`0600`, **erzeugter** Dateiname, muß beim Löschen mitgehen).
   **Ist `data:` wirklich billiger als eine erweiterte CSP? Ja — aber aus dem Grund, den E-071
   nicht nennt.** „Die Positivliste bleibt unverändert" wiegt wenig: `img-src` um
   `http://127.0.0.1:17843` zu erweitern brächte keinen Zuwachs nach außen, weil `connect-src`
   denselben Eintrag trägt. Entscheidend ist: **ein `<img src>` trägt kein `X-Takt-Token`.** Die
   CSP-Variante bräuchte eine unauthentifizierte Byte-Route auf `127.0.0.1` (VG-1) oder ein
   Geheimnis in der Adresse (B-2.4) — beides schlechter als ein Drittel mehr Arbeitsspeicher.
   (Befund T-145-9: E-071 Punkt 3 um diesen Satz ergänzen.)
6. **Frist — harmlos, und hier steht warum.** Ein Tag ohne Uhrzeit, der Zustand wird gerechnet und
   nicht gespeichert, sie steuert nichts (kein Pool, keine Spalte, kein Export) und ist damit kein
   Fall von VG-6. Drei Kleinigkeiten: die Form muß einen **existierenden** Tag verlangen
   (`2026-02-30` paßt auf `YYYY-MM-DD` und ist keiner → `Invalid Date` an unerwarteter Stelle),
   der Tagesbegriff ist der aus E-025, und **A-19.17 ist strukturell gesichert**: `ExportSourcePath`
   hat **zwölf** Werte, `SOURCE_PRESENCE` erzwingt Vollständigkeit, der Auflöser ist ein `switch`,
   `isExportSourcePath` vergleicht wörtlich ohne Normalisierung. Die messbare Auflage ist deshalb
   keine Filterprüfung, sondern eine **Zahl**: zwölf Quellen, wörtlich aufgezählt, rot bei einer
   dreizehnten — und `proof:export` fährt **beliebige** Vorlagen. (A-A-19, A-A-20.)

### Befunde Teil 2

| Kennung | Schwere | Sache |
|---|---|---|
| **T-145-7** | **muss** | `proof:shell-surface` zählt, wo es benennen muß. Vor dem Bau umzustellen, nicht mit ihm. |
| **T-145-8** | **muss** | Die einzige Kontrolle liegt wieder in Rust, und Rust wird nicht geprüft (T-145-2). **Vorbedingung:** A-V-23 vor der ersten Bauaufgabe. |
| **T-145-9** | Hinweis | E-071 Punkt 3 begründet die richtige Entscheidung mit dem schwächeren Argument. |
| **T-145-10** | Hinweis | E-072 Punkt 2 nennt „kein UNC-Pfad" beim **Verweis**, wo man ihn nicht braucht; er gehört zum Typ **Datei**. |
| **T-145-11** | Hinweis | Der Zerleger normalisiert — darin liegt der eigentliche Angriff. Gehört auch ins Entwicklerhandbuch. |
| **T-145-12** | Hinweis | `url 2.5.8` liegt bereits im Baum (`Cargo.lock:4286`, transitiv über `tauri`). Eine unmittelbare Abhängigkeit ist **kein** Zuwachs in der Lieferkette; das Argument gegen eine Bibliothek aus `is_release_version` gilt hier nicht. |

---

## Werkzeugstand

| Werkzeug | Ergebnis |
|---|---|
| Semgrep lokal (`p/nodejsscan`, `p/typescript`) | 188 Regeln, 231 Dateien, **10 Befunde**, alle in bekannten Falschmeldungsklassen. **Kein Befund hoher Schwere.** Der neue Code der Versionsprüfung erzeugt keinen einzigen. |
| Semgrep Guardian | **Nicht erreichbar** — „Not logged into Semgrep Guardian", **neuntes** Mal. |
| 42Crunch Audit | **Nicht gelaufen** — kein `42c-ci-cli`, kein Token, kein `~/.42crunch`, **achtes** Mal. Ersatz: `proof:openapi`, 110 Prüfungen grün. |
| `proof:release-safety` | 23/0, davon 6 Gegenproben. |
| `proof:shell-surface` | 4 Prüfungen + 10 Gegenproben, grün. |
| `proof:route-policy` | 40/0, **61 Routen**. |
| `proof:openapi` | 110/0. |
| `proof:access` | 105/0 — und dabei eine Verbindung nach `api.github.com` (T-145-1). |
| `vitest` (Versionspfad) | 124/0. |
| `cargo test` | 31/0 — von Hand. |
| Repository-Hygiene über 99 geänderte Dateien | Sauber. Treffer: `TCK-4711` (erfundene Call-Nummer), `a.beispiel@example.org`, `1.2.3@evil.example` (Ausbruchsversuch). `example.org` ist nach RFC 2606 reserviert. |

---

## Annahmen

* **Die Wiedervorlage mißt gegen den Code, nicht gegen die Berichte.** Wo ein Bericht und der Baum
  auseinandergehen, gilt der Baum.
* **Eine Auflage, deren Messung falsch ist, deren Sache aber gewahrt ist, heißt *abweichend
  erfüllt* und nicht *nicht erfüllt*.** Ich habe die Messung neu geschrieben statt den Code zu
  beanstanden. Fünfmal geschehen.
* **A-V-6′ nennt 81 920 als Obergrenze** (65 536 + eine Leseeinheit von 16 384). Ich habe die
  Leseeinheit nicht als Zusage der Laufzeit behandelt, sondern als gemessene Zahl, die bei jeder
  Wiedervorlage neu zu messen ist.
* **Für T-145-3 habe ich 262 144 Bytes als neue Grenze vorgeschlagen**, aber nicht entschieden —
  das ist eine Entwurfsfrage. Die Auflage lautet, den Abstand zu messen, nicht ihn zu erraten.
* **Für die Anhänge habe ich `url` als Zerleger vorausgesetzt**, weil er im Baum liegt. Eine
  handgeschriebene Zerlegung wäre zulässig, müßte aber dieselben 28 Fälle bestehen — und die
  Messung zeigt, wie viele Regeln man dabei nachbaute.
* **Die Bildobergrenze 8 MiB ist ein Vorschlag**, keine gemessene Zahl. Verbindlich ist, daß es
  **eine** Zahl gibt und daß sie **beim Lesen** gilt.
* **Ich habe für Messung 5 und 6 eine echte ausgehende Verbindung nach `api.github.com`
  hergestellt.** Das war nötig, um A-V-6 nachzumessen und T-145-1 zu belegen; es sind vier
  Anfragen im Rahmen der Ratenbegrenzung, ohne Kennung.

## Risiken

* **T-145-1 und T-145-2 stehen gegen einen bereits ausgelieferten Stand.** `v0.1.0` ist draußen.
  Beide sind Nachweis-, keine Verhaltensfehler — der ausgelieferte Code tut das Richtige, es ist
  nur nicht abgesichert, daß er es weiter tut.
* **T-145-8 ist eine Vorbedingung und keine Auflage.** Beginnt die nächste Welle mit den Anhängen,
  bevor `cargo test` läuft, entsteht die gesamte Adreß- und Pfadprüfung in einer Datei, die kein
  Ablauf ausführt.
* **T-145-3 ist ein leiser Ausfall.** Wird die 64-KiB-Grenze überschritten, hört die
  Versionsprüfung auf zu arbeiten, und das ist nach A-18.11 richtig — sichtbar nur an einer
  Protokollzeile. Der Abstand ist rund Faktor drei und schrumpft mit jedem neuen Erzeugnis in der
  Auslieferung.
* **Lieferkette weiterhin ungemessen** (T-145-6). Erstmals mit ausgelieferten Binärdateien.
* **`v0.1.0` ist unsigniert.** Unverändert aus 18.11 Punkt 3; alle Auflagen schützen den Weg,
  nicht das Ziel.

## Offene Fragen an den Orchestrator

1. **T-145-1: welcher Riegel?** Eine Umgebungsvariable im Prüfbetrieb ist die naheliegende
   Antwort und zugleich die, die ein Angreifer setzen könnte, um die Prüfung abzuschalten. Ein
   ausdrücklicher Parameter an `compose()`/`main()` wäre sauberer. Das ist eine Entwurfsfrage und
   keine Sicherheitsentscheidung, die ich treffe.
2. **T-145-3: Grenze anheben, im Auslieferungsablauf messen, oder beides?** Ich empfehle beides,
   entscheide es aber nicht.
3. **E-071 und E-072 nachziehen (T-145-9, T-145-10)?** Zwei Sätze, beide von mir vorformuliert.
   Nach E-063 Punkt 4/5 wäre die haltbarere Antwort jeweils eine Messung — hier geht es aber um
   die **Begründung** einer richtigen Entscheidung, und die kann nur im Text stehen.
4. **Bleibt es bei `\u{200D}` erlaubt / `\u{200E}` verboten für die Adresse (A-A-14)?** Ich habe
   `U+200B` und `U+FEFF` **zusätzlich** verlangt, weil der Zerleger sie entfernt. Das ist eine
   Erweiterung der Zeichenklasse für **ein** Feld; ob die Klasse in `packages/domain` dafür
   wächst oder das Feld eine eigene bekommt, ist eine Entwurfsfrage.
5. **Guardian und 42Crunch, zum neunten beziehungsweise achten Mal.** Beschaffungsentscheidung.

## Nächster Schritt

**Welle R, in dieser Reihenfolge:**

1. **Vor allem anderen:** A-V-23 (`cargo test` in `pnpm check`) und T-145-7
   (`proof:shell-surface` benennt statt zu zählen). Beide sind klein und beide sind die Bedingung
   für alles, was danach kommt.
2. Parallel dazu, gegen `0.1.1`: T-145-1 (domain-dev, mit A-V-22), T-145-3 (domain-dev),
   A-V-21 (domain-dev) und die drei Textnachzüge T-145-9, T-145-10 sowie die Neufassungen aus
   19.5 in E-064/CLAUDE.md (Orchestrator).
3. Erst danach die Bauaufgaben zu Spezifikation Abschnitt 19, gegen die Auflagen A-A-1 bis
   A-A-24. Wiedervorlage durch den security-checker nach ihrem Rücklauf.
