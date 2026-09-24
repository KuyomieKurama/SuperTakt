# T-156 — Sicherheitsprüfung über T-146, T-147 und T-149

**Rolle:** security-checker. **Datum:** 2026-09-05.
**Zweig:** `versionspruefung-gegen-github`.
**Prüfumfang:** die vierundzwanzig Auflagen A-A-1 bis A-A-24 aus meiner eigenen Vorabbewertung
(T-145 Teil 2, Bedrohungsmodell Abschnitt 20) gegen den gebauten Code, dazu O-BD und R-19.
**Artefakte:** `docs/bedrohungsmodell.md` (neuer Abschnitt 21, Kopf, Werkzeugstand, VG-11),
dieser Bericht. **Kein Produktivcode angefasst.**

---

## Kurzfassung

```
Aufgabe:   T-156 — Sicherheitsprüfung über T-146, T-147 und T-149
Status:    fertig
Urteil:    Nacharbeit — drei Befunde der Stufe „muss"
Artefakte: docs/bedrohungsmodell.md (Abschnitt 21 neu, ~420 Zeilen), dieser Bericht
```

**15 von 24 Auflagen erfüllt, 8 abweichend erfüllt, 1 nicht erfüllt.** Der Entwurf aus
Abschnitt 20 hat gehalten, und er hat an der Stelle gehalten, auf die T-145 hingewiesen hatte:
Der **Festpunkt** weist gemessen vier Zeichenketten ab, die jede Schemaprüfung passiert hätten
und deren Anzeige danach etwas anderes gesagt hätte als ihr Ziel. Sieben der acht Abweichungen
sind **fehlende Messungen bei richtigem Code**; ich habe fünf davon selbst nachgemessen. Die
achte ist eine echte Lücke: Ein nachgestellter Punkt oder ein nachgestelltes Leerzeichen hebt
die Sperre der fünf Umleitungsendungen unter Windows auf, und die Rückfrage sagt dann ebenfalls
das Falsche. Sie ist zwei Wellen lang unbemerkt geblieben, weil `attachment.rs` **keinen
einzigen Prüffall** hat — `cargo test` zählt dieselben 31 wie in T-145.

---

## 1. Die vierundzwanzig Auflagen — gegen den Code, nicht gegen die Berichte

Auflage für Auflage in `docs/bedrohungsmodell.md` Abschnitt 21.2, mit Fundstelle je Aussage.

| Urteil | Auflagen |
|---|---|
| erfüllt (15) | A-A-1, A-A-7, A-A-8, A-A-9, A-A-11, A-A-12, A-A-13, A-A-14, A-A-15, A-A-16, A-A-19, A-A-21, A-A-22, A-A-23, A-A-24 |
| abweichend erfüllt (8) | A-A-2, A-A-3, A-A-4, A-A-6, A-A-10, A-A-17, A-A-18, A-A-20 |
| nicht erfüllt (1) | **A-A-5** — in der Sache, nicht im Wortlaut |

**Die acht Abweichungen, jede mit dem Unterschied:**

| Auflage | Sache | Was fehlt |
|---|---|---|
| A-A-2 | Alle fünf Bedingungen stehen da, in der verlangten Reihenfolge, Steuerzeichen **vor** dem Zerlegen | Der `#[cfg(test)]`-Block neben dem Befehl mit den 28 Zeichenketten. Ich habe sie selbst gefahren. |
| A-A-3 | Festpunkt wörtlich umgesetzt; geöffnet wird `checked.as_str()`, nicht die Rohfassung | Dieselbe Sache in Rust. In der Domäne 105 Prüffälle einschließlich Idempotenz. |
| A-A-4 | `is_unc` trägt **beide** Hälften, und die UNC-Prüfung steht vor `is_absolute()` | Die Fallliste auf **Windows**. Es gibt gar keine. Der Zweig `Component::Prefix` und „`C:\…` ist absolut" sind nicht gemessen. |
| A-A-6 | Alle sechs Eigenschaften vorhanden; Dialog bekommt **denselben** Wert, der an den Befehl geht | Der RLO-Anzeigefall und der E2E-Fall „`Enter` öffnet nichts". |
| A-A-10 | `test:rust` in `pnpm check`; `cargo test --lib` auf allen drei Läufern, **vor** dem Bau | Die Fälle. Der Windows-Läufer fährt 31 Prüffälle, von denen keiner einen Pfad berührt. |
| A-A-17 | `0700`/`0600` ausdrücklich gesetzt **und** nachgezogen; erzeugter Name; zwei Riegel beim Lesen | `proof:db-permissions` ist nicht um das Bildverzeichnis erweitert. Selbst gemessen: stimmt. |
| A-A-18 | Die Kopie geht an drei Stellen mit, mit richtiger Reihenfolge und Begründung | Die Zählung der Dateien vor und nach dem Löschen. Selbst gemessen: 2 → 1 → 0. |
| A-A-20 | Zwölf Werte, `SOURCE_PRESENCE`, kein Frist-/Anhangsfeld in `ExportCandidate`/`ExportGroup` | Der Prüffall gegen die ausgeschriebene Liste. Der Übersetzer ersetzt ihn **nicht**: Eine sauber an beiden Stellen eingetragene dreizehnte Quelle übersetzt grün. |

**Was besonders gut gebaut ist** — es gehört genauso in einen Prüfbericht wie das andere:

* **A-A-9.** `proof:shell-surface` benennt jetzt drei Aufruforte mit Datei, Funktion und
  Prüffunktion, verlangt für jeden, dass die Prüfung **vor** dem `.open(` steht und in `?`,
  `ok_or` oder `return Err` endet, liest rekursiv und alle drei Fähigkeitenendungen — und die
  drei geforderten Gegenproben laufen wörtlich mit. 6 Prüfungen, **20** Gegenproben. T-145-7 ist
  geschlossen.
* **A-A-16/A-A-17.** Strenger gebaut als verlangt: zwei Riegel auf dem Namen statt einem, und die
  Kopfsignatur wird **beim Lesen erneut** gemessen, mit der ausgeschriebenen Begründung, warum
  dort kein Vergleich mit der Endung steht („er hätte nur einen Ausgang, der etwas ändert, und
  das wäre: dem Namen glauben").
* **A-A-22.** Die Gegenprobe ist genau die, die ich verlangt hätte: ein `INSERT` an der Tür
  vorbei, damit die Null nicht die schlimmste Sorte grün ist.

---

## 2. R-21 und R-22 — ist der Weg vom Bestand zum Programmstart geschlossen?

**Bei jedem Aufruf: ja.** Nach Art getrennt: ja. Zwei Befehle, je ein `String`, kein
Typkennzeichen; `check_link` und `check_file` laufen bei jedem Aufruf neu; ein Bild hat gar
keinen Befehl. **Mit einer Ausnahme, und sie ist Befund T-156-1.**

### Die Normalisierung — die Stelle, auf die T-145 gezeigt hatte

Ich habe den geprüften Teil von `attachment.rs` **mechanisch** geschnitten (von `use std::path::`
bis zum Ende von `check_file`), die Zeichengleichheit mit dem Original geprüft und gegen
`url 2.5.8` in einer Wegwerf-Kiste übersetzt. Gemessen wird damit der ausgelieferte Text, nicht
eine Abschrift.

Von den 22 Zeilen aus Bedrohungsmodell 20.2 wird **genau eine** angenommen —
`https://example.org/seite`, die einzige, die bereits Normalform ist. Und der Anteil, auf den es
ankommt:

```
HTTP://example.org/                     abgewiesen  (link_not_normalized)
http:/\example.org/                     abgewiesen  (link_not_normalized)
␣https://example.org                    abgewiesen  (link_not_normalized)
https:///pfad                           abgewiesen  (link_not_normalized)
https://exаmple.org/  (kyrillisches а)  abgewiesen  (link_not_normalized)
https://example.org/<RLO>gpj.exe        abgewiesen  (link_not_normalized)
https://exam<ZWSP>ple.org/              abgewiesen  (link_not_normalized)
ht<TAB>tps://example.org                abgewiesen  (link_control_character)   ← vor dem Zerlegen
https://evil.example@gutartig.example/  abgewiesen  (link_userinfo)
```

**Nicht das Schema hat die lügenden Zeilen abgewiesen, sondern der Festpunkt.** Das ist der
tragende Beleg dieser Wiedervorlage: Die Auflage A-A-3 war die richtige, und sie ist erfüllbar —
`norm(norm(x)) == norm(x)` für alle zehn Zeilen der Festpunkttabelle, gemessen.

Und die zweite Hälfte davon stimmt auch: Die Oberfläche gibt dem Rückfragedialog
`pendingOpen.target` — **denselben** Wert, der an `takt_open_attachment_file` geht. Anzeige und
Ziel sind zeichengleich. Ein Verweis, der lügt, ist damit gebaut ausgeschlossen und nicht bloß
verboten.

### Der Pfad

`\\server\…`, `//server/…`, `\\?\C:\…` und `\\.\…` ergeben alle vier `path_unc` — auch auf einem
Linux-Läufer, auf dem `Component::Prefix` nie entsteht. Die fünf Umleitungen fallen **vor** der
Existenzprüfung, auch in Großschreibung. `.exe`, `.bat`, `.ps1` fallen hier **nicht**: Eine
wirklich angelegte `/tmp/…exe` wird angenommen und geht an die Rückfrage — genau wie A-A-5 es
will.

---

## 3. Die Prüfung beim Anlegen ist kein Ersatz — greift die im Öffnen-Befehl auch sonst?

**Ja, gemessen.** Alle Werte in Abschnitt 2 sind unmittelbar an `check_link`/`check_file`
übergeben worden, ohne je durch eine Route, ein Eingabefeld oder ein Schema gegangen zu sein. Das
ist genau der Weg, den VG-1 und VG-3 offen lassen. Die Prüfung greift dort unverändert.

Und die Kontrolle steht auch an der richtigen Stelle in der **Reihenfolge**: `has_indirect_extension`
läuft **vor** `path.is_file()`, und `is_unc` **vor** `path.is_absolute()`. Beides ist begründet
im Quelltext, und beides wäre andersherum falsch.

---

## 4. Die Add-in-Tür — und der Wächter über der Abwesenheit

Die Abwesenheit ist da: `AddinUnit` führt keinen `AttachmentPort`; die Portauswahl bleibt
`Pick<…>` und benennt jede erlaubte Methode einzeln, mit ausgeschriebener Begründung, warum
`rename`, `move`, `remove`, `load`, `listInFolder` und `setOnTodo` **nicht** dabei sind. Anhänge
hängen als Unterressource am Todo und stehen nicht in `SHARED_PATHS`.

**Der Wächter ist geprüft, nicht nur die Abwesenheit** — und er trägt auf drei Ebenen:

1. **Form der Tür.** `proof:addin` liest `Object.keys(addinTuer.shape)` und verlangt, dass kein
   Feld auf `attach|anhang|file|image|url` passt — **und** dass `dueDate` da ist, sonst mäße der
   Fall nichts. Das ist der Griff, der einen Wächter davor bewahrt, still nichts mehr zu prüfen.
2. **Wirkung am Bestand.** Ein voll ausgefüllter Anhang in vier Schreibweisen ergibt 201, die
   Frist kommt an, `SELECT COUNT(*) FROM todo_attachment` zählt null — und danach prüft derselbe
   Fall, dass keiner der Werte in Titel, Call-Nummer oder Vermerk gewandert ist.
3. **Die Gegenprobe.** Ein `INSERT` an der Tür vorbei, und die Zählung muss dann **eins** sagen.

Dazu strukturell: `proof:route-policy` fährt **alle 65 Routen außerhalb `/addin`** mit dem
Add-in-Token an und bekommt 401 (70 Operationen insgesamt, 4 Add-in-Routen). Eine neue
Anhangsroute ist damit von selbst geschlossen, ohne dass jemand daran denken muss.

Die **Frist** an der Tür: `2026-02-30` ergibt 422 „und kein halbes Todo"; die Beanstandung nennt
das Feld (`dueDate`, nicht „body"); „fehlt" und `null` sind an dieser Tür dasselbe. Der
Add-in-Abschnitt der OpenAPI-Beschreibung führt `dueDate` mit seiner Anforderungs-ID und keine
Anhangsfelder; unter `/addin` liegt keine Anhangsroute.

**A-A-21, A-A-22 und A-A-23: erfüllt.**

---

## 5. O-BD — die zwei Zeilen aus T-132

Vollständig in Bedrohungsmodell 21.5. In Kürze:

* **`sqlite` und `code` sind unbedenklich, und zwar auf zwei Wegen verengt:** an der Quelle nach
  Gestalt (`errorCodeOf` nimmt nur `^[A-Z][A-Z0-9_]{0,31}$`, `sqliteResultCodeOf` nur eine sichere
  ganze Zahl) und an der Zusammensetzung nach Typ (`pair()` schreibt Zahlen nur als nicht negative
  sichere Ganzzahlen, Text nur kleingeschrieben, `null` verschwindet rückstandsfrei). Ein Pfad
  fällt an `^[A-Z]`. In `node:sqlite` und `node:fs` steht der Pfad in `path` — und `path` wird
  nicht gelesen.
* **Der Riegel ist eine Gestalt-, keine Inhaltsprüfung, und das ist die richtige Bauart, solange
  man weiß, was er nicht kann.** Gemessen: `C:\Users\…` und `/home/…/takt.sqlite3` fallen;
  `x user=kerem`, `x tag=kunde_mueller`, `x n=tck4711`, `x p=c_users_kerem_desktop_rechnung`
  kommen durch. Er begrenzt Gestalt und Menge, nicht Herkunft. Kein ReDoS: 0,007 ms gegen 2 000
  Paare mit anschließendem Fehlschlag.
* **Berichtigung einer eigenen Zahl aus T-145:** dort steht „336 Zeichen, davon 256 Wertinhalt".
  Die 256 stimmen, die 336 nicht — bei voll ausgeschöpften Namen sind es **576** (48 + 8 × 66).
  Dieselbe Sorte Fehler, die T-145-4 an fünf fremden Auflagen beschrieben hat, hier im eigenen
  Text.
* **A-V-21 bleibt offen und bleibt richtig** (`lifecycle` nimmt weiterhin `string`): Sie verlegt
  die Zusage von der Gestalt auf die Herkunft, und das ist die einzige Stelle, an der sie zu
  halten ist.

---

## 6. R-19 bei dieser Freigabe — O-CI und E-077

Drei Aussagen, jede gemessen (Bedrohungsmodell 21.6):

1. **Kein Nachweislauf und kein Vitest-Lauf spricht nach außen.** `ss -tnp` alle 0,2 s während
   `proof:all`, während elf einzelnen Nachweisläufen und während `pnpm test`: **null Zeilen**
   außerhalb `127.0.0.1`. T-145-1 ist behoben, und der Riegel ist der richtige — ein ausdrücklicher
   Parameter an `main()`, keine Umgebungsvariable, die von außerhalb des Prozesses setzbar wäre.
   `proof-access-entry.ts` ruft **denselben** `main()` und tauscht nur die Abholfunktion; sie geht
   nirgendwohin, kein `fetch`, keine Attrappe auf einem Port.
2. **O-CI steht offen, und die Kette ist belegt.** `tests/e2e/support/services.ts:86` startet
   `node apps/local-api/src/index.ts`; `index.ts` ruft `main()` ohne Argument; `main()` baut den
   Prüfer mit `createGithubReleaseSource()` und ruft `versionCheck.start()` (`main.ts:448`). Der
   Prozess läuft während dieser Aufgabe (PID 2289990, hört auf 17843 und 17844). **Befund
   T-156-3, Stufe „muss".**
3. **Die Adresse steht weiterhin an genau einer Stelle.** `proof:release-safety` 31/0 mit sechs
   Gegenproben; `api.github.com` steht im Produktivcode nur in `version/source.ts`.

**Zu E-077:** Dass in Prüfläufen zeitabhängig ein modaler Dialog vor die Oberfläche springt, ist
kein Bedienfehler der Prüfreihe, sondern die **Wirkung** von Punkt 2. `installedVersion:
'9999.0.0'` behebt das Symptom in jeder einzelnen Datei; die Ursache behebt nur der Riegel an der
Quelle. Ein Prüflauf, dessen Ergebnis vom Zeitpunkt abhängt, ist kein Prüflauf. Beides ist
richtig, und die Reihenfolge ist: erst der Riegel, dann darf die Vorgabe bleiben, wo sie ist.

---

## 7. Befunde

### Blockierend („muss")

| Kennung | Sache |
|---|---|
| **T-156-1** | **Ein nachgestellter Punkt oder ein nachgestelltes Leerzeichen hebt A-A-5 auf.** Gemessen: `/…/rechnung.lnk.` und `/…/rechnung.lnk ` bestehen `check_file` — `Path::extension()` liefert `""` beziehungsweise `"lnk "`, keines steht in `INDIRECT_EXTENSIONS`. Unter Windows schneidet die Win32-Pfadauflösung nachgestellte Punkte und Leerzeichen vom letzten Namensbestandteil ab, **bevor** die Datei aufgelöst wird: `is_file()` bejaht (dieselbe Abkürzung), und `ShellExecuteW` öffnet danach die Verknüpfung. Genau der Fall, für den die fünf Endungen dastehen. **Und die Rückfrage lügt mit:** `extensionOf` (`apps/web/src/lib/attachmentLabel.ts:113`) gibt für `…exe.` und `…exe ` ebenfalls „keine Endung" zurück, der Dialog sagt also „wird geöffnet" statt „wird ausgeführt". Weg dahin: VG-1 oder VG-3 schreiben den Wert in `todo_attachment.target`, der Benutzer klickt. **Auf Windows nicht gemessen** (Läufer war Linux); die Mechanik ist die dokumentierte Win32-Namensnormalisierung. **Gegenmittel:** nachgestellte `.` und Leerzeichen vom letzten Namensbestandteil abschneiden und auf dem beschnittenen Namen vergleichen — oder, strenger und billiger, einen solchen Pfad als Ganzes abweisen. Dieselbe Änderung in `extensionOf`. Wortlaut als **A-A-5′**. Zuständig: frontend-dev (`attachment.rs`, `attachmentLabel.ts`). |
| **T-156-2** | **`attachment.rs` hat keinen einzigen Prüffall.** `cargo test` zählt 31 — dieselben wie in T-145, alle in `release.rs`, `sidecar.rs`, `identity.rs`, `appdata.rs`. A-A-2, A-A-3, A-A-4, A-A-5 und A-A-8 verlangten die Fälle **neben dem Befehl**, A-A-10 zusätzlich auf Windows. Die Rohrleitung ist gebaut und richtig gebaut (`test:rust` in `pnpm check`; `cargo test --lib` auf allen drei Läufern **vor** dem Bau, mit der richtigen Begründung im Ablauf), aber sie führt nichts. Damit ist die einzige Kontrolle zwischen einer Zeichenkette aus dem Bestand und `ShellExecuteW` weiterhin ungesichert. **T-156-1 ist der Beleg, dass das nicht theoretisch ist:** Ein Prüffall `x.lnk.` hätte ihn beim Schreiben gefunden. Wortlaut als **A-A-25**. Zuständig: unit-tester (benannte Ausnahme in `CLAUDE.md`), Windows-Fälle unter `#[cfg(windows)]`. |
| **T-156-3** | **Die E2E-Hauptreihe spricht bei jedem Lauf mit `api.github.com` (O-CI).** Kette und Beleg in Abschnitt 6. Folgen: ein Lebenszeichen je Lauf (R-19 Punkt 3), Mitverbrauch der 60 Anfragen je Stunde und Quelladresse, und ein zeitabhängiger modaler Dialog vor der Oberfläche (E-077). Die Naht liegt seit T-146 fertig daneben. Wortlaut als **A-A-26**. Zuständig: e2e-tester. |

### Übrige (Hinweise)

| Kennung | Sache |
|---|---|
| T-156-4 | **Sieben verlangte Messungen fehlen bei richtigem Code.** A-A-2/-3/-4/-5/-8 (Rust), A-A-6 (RLO-Anzeige, `Enter`), A-A-17 (`proof:db-permissions` um das Bildverzeichnis), A-A-18 (Dateizahl vor und nach), A-A-20 (die zwölf gegen die ausgeschriebene Liste). Fünf davon habe ich selbst nachgemessen — eine Messung, die in keinem Ablauf steht, ist eine Momentaufnahme und keine Zusage. Derselbe Befund wie T-145-4 und T-136-2, zum dritten Mal. |
| T-156-5 | **A-A-20 fängt den Fall nicht, für den sie geschrieben wurde.** `Record<ExportSourcePath, true>` hält Typ und Laufzeitliste zusammen, aber nicht die **Zahl**. Eine sauber an beiden Stellen eingetragene dreizehnte Quelle übersetzt grün. Neufassung als **A-A-20′**. |
| T-156-6 | **Die Bildgrenze ist als Zahl 8 454 144, nicht 8 388 608** — gezählt wird nach dem Lesen eines Blocks von 65 536 Bytes. Als Sache erfüllt (nichts kopiert, nichts kodiert), als Zahl wie A-V-6 zu berichtigen. Neufassung als **A-A-15′**. |
| T-156-7 | **`logger.lifecycle` nimmt weiterhin `string`** — A-V-21 aus T-145, unerledigt. |
| T-156-8 | **Die erste Zeile eines Verweises zeigt das Schema nicht** (`attachmentLabel` schneidet `https://` weg). Kein Fund im Sinne von R-22 — Anzeige und Ziel bleiben zeichengleich —, aber die Verkürzung nimmt genau das Stück weg, an dem man eine Herabstufung von `https` auf `http` sähe, und bei einem Verweis gibt es keine Rückfrage. |
| T-156-9 | **Semgrep Guardian zum zehnten, 42Crunch zum neunten Mal ohne Werkzeug.** Lieferkette weiterhin nie gemessen, und seit `v0.1.0` sind Binärdateien draußen. |
| T-156-10 | **Fünf Nachweisläufe nicht gemessen**, weil `127.0.0.1:17843` belegt war. Sie stehen als *nicht gemessen*, nicht als grün. |

### Was aus T-145 geschlossen ist

* **T-145-1** (`proof:access` greift nach draußen) — behoben und nachgemessen: null Verbindungen
  außerhalb `127.0.0.1` in drei Läufen.
* **T-145-7** (`proof:shell-surface` zählt statt zu benennen) — vollständig behoben, mit den drei
  geforderten Gegenproben.
* **T-145-2 / T-145-8** (`cargo test` in keinem Ablauf) — **halb** geschlossen: der Ablauf steht,
  der Inhalt fehlt. Siehe T-156-2.

---

## 8. Werkzeugstand

| Werkzeug | Ergebnis |
|---|---|
| Semgrep CLI lokal (`p/nodejsscan p/typescript p/javascript`) | 188 Regeln, 288 Ziele, **24 Befunde**, alle in bekannten Falschmeldungsklassen (`react-insecure-request` auf `127.0.0.1` — das **ist** die Architektur; `node_secret` auf `redactSecrets` selbst; `node_timing_attack` auf Vergleichen ohne Geheimnis; `regex_dos` auf festen Ausdrücken aus dem eigenen Baum). **Kein Befund hoher Schwere, keiner im neuen Code.** |
| Semgrep Guardian | **Nicht erreichbar** — „Not logged into Semgrep Guardian", **zehntes** Mal. |
| 42Crunch Audit / Scan | **Nicht gelaufen** — kein `42c-ci-cli`, kein `~/.42crunch`, keine Berechtigung, **neuntes** Mal. Ersatz: `proof:openapi` 110/0. |
| `cargo test --lib` | **31/0 — unverändert gegenüber T-145.** |
| `pnpm test` (Vitest) | 69 Dateien, **1 359/0**. |
| `proof:shell-surface` | 6 Prüfungen + **20** Gegenproben, grün. |
| `proof:addin` | **187/0** (A-A-21, A-A-22 samt Gegenprobe, A-A-23). |
| `proof:route-policy` | 40/0 — 70 Operationen, 4 Add-in-Routen, 65 Routen außerhalb `/addin` → 401. |
| `proof:release-safety` / `proof:openapi` / `proof:codepoints` / `proof:foreign` | 31/0, 110/0, 45/0, 14/0. |
| `proof:export` / `proof:taskpane` / `proof:template-fields` / `proof:db-permissions` | 97/0, 25/0, 30/0, 17/0. |
| `proof:conflicts` / `tags` / `access` / `export-api` / `addin-wiring` | **nicht gemessen** — Port belegt. |
| Playwright | **nicht gefahren** (Auflage der Aufgabe). E2E-Fälle gelesen, nicht ausgeführt. |
| `ss -tnp` alle 0,2 s über drei Läufe | **null** Verbindungen außerhalb `127.0.0.1`. |
| Eigene Messungen | **acht**, in Bedrohungsmodell 21.3. |
| Repository-Hygiene über 154 geänderte Dateien | Sauber. Keine Zugangsdaten, kein Schlüsselmaterial, keine echten Call-Nummern (`TCK-000042`, `TCK-000815`, `TCK-000517/518` sind erfunden), keine echten Adressen (`example.org`, `.example`, `.invalid` sind reserviert). `/Export/` ist ignoriert; die dort liegende Datei trägt `0600`. |

---

## Annahmen

* **Ich habe gegen den Code gemessen, nicht gegen die Berichte.** Wo Bericht und Baum
  auseinandergehen, gilt der Baum. Dreimal geschehen: `cargo test` zählt 31 statt mehr,
  `proof:db-permissions` misst das Bildverzeichnis nicht, und A-A-20 hat keinen Prüffall.
* **Eine Auflage, deren Sache gewahrt ist und deren Messung fehlt, heißt *abweichend erfüllt* und
  nicht *nicht erfüllt*** — dieselbe Regel wie in T-145. Siebenmal angewandt. **Einmal nicht:**
  A-A-5 ist in der Sache nicht erfüllt, weil die Regel selbst eine Lücke hat.
* **Für T-156-1 habe ich die Windows-Mechanik nicht messen können.** Ich habe gemessen, was
  `check_file` und `extensionOf` mit diesen Namen tun (beide lassen sie durch beziehungsweise
  halten sie für endungslos); dass Windows nachgestellte Punkte und Leerzeichen abschneidet, ist
  dokumentiertes Verhalten der Win32-Pfadnormalisierung und von mir **nicht** auf einem
  Windows-Läufer nachgestellt. Das ist genau die Lücke, die A-A-4/A-A-10 mit den Windows-Fällen
  schließen sollten. Ich führe den Befund trotzdem als „muss": Der Aufwand, ihn zu beheben, ist
  eine Zeile; der Aufwand, ihn falsch abzutun, ist ein Programmstart.
* **Für die Messungen 1 bis 4 habe ich den Prüfteil von `attachment.rs` mechanisch geschnitten**
  und die Zeichengleichheit mit dem Original geprüft, statt ihn abzuschreiben. Eine Abschrift
  wäre der Nachweis gewesen, der grün wird, ohne etwas geprüft zu haben.
* **Ich habe während dieser Aufgabe keine Verbindung nach außen hergestellt.** Anders als in
  T-145 war das nicht nötig: Alles, was zu messen war, lag im Baum.
* **Die fünf nicht gefahrenen Nachweisläufe führe ich als nicht gemessen.** Sie waren in T-145
  grün; das ist kein Ergebnis für heute.

## Risiken

* **T-156-1 trifft nur Windows — und Windows ist die Zielplattform des Auftraggebers.** Der
  Angreifer braucht VG-1 oder VG-3, also genau die Wege, deretwegen die Prüfung überhaupt im
  Öffnen-Befehl steht und nicht im Eingabefeld. Wer den Befund mit „dafür muss man schon
  schreiben können" abtut, hebt damit die Begründung von E-072 Punkt 2 auf.
* **T-156-2 ist der Grund, warum T-156-1 existiert.** Zwei Wellen lang ist die einzige Kontrolle
  zwischen einer fremden Zeichenkette und einem Prozessstart ungeprüft geblieben, während der
  Ablauf, der sie prüfen soll, grün war. Ein grüner Ablauf ohne Fälle ist schlechter als kein
  Ablauf: Er sieht aus wie eine Zusage.
* **T-156-3 macht Prüfergebnisse vom Zeitpunkt abhängig.** T-150 hat gemessen, dass zwei
  bestehende Dateien nur zufällig nicht angeschlagen haben. Das ist kein Zustand, in dem eine
  Reihe eine Freigabe tragen kann.
* **Die Lieferkette ist weiterhin nie gemessen worden**, und seit `v0.1.0` sind unsignierte
  Binärdateien draußen. Unverändert seit T-023.
* **Fünf der acht eigenen Messungen sind mit dieser Aufgabe weg.** Sie ersetzen die fehlenden
  Prüffälle für einen Tag, nicht für die nächste Welle.

## Offene Fragen an den Orchestrator

1. **T-156-1: abschneiden oder abweisen?** Ich empfehle **abweisen** — ein Pfad, dessen letzter
   Bestandteil auf `.` oder ein Leerzeichen endet, ist auf keinem Dateisystem ein gewollter Name,
   und Abweisen kann nicht falsch abschneiden. Abschneiden wäre die zweite Meinung darüber, wie
   ein Name heißt. Das ist eine Entwurfsfrage; ich entscheide sie nicht.
2. **T-156-2: gehen die Rust-Prüffälle in dieselbe Welle wie die Behebung von T-156-1?** Sie
   müssten, sonst wird die Behebung ungeprüft eingebaut. Das kollidiert mit der Dateihoheit:
   frontend-dev im Produktivteil, unit-tester im `#[cfg(test)]`-Block **derselben** Datei. Nach
   `CLAUDE.md` wartet die Prüfaufgabe dann auf die nächste Welle — was hier heißt: Die Behebung
   liegt eine Welle lang ungeprüft. Das ist eine Ablaufentscheidung.
3. **A-V-21 (`lifecycle` als geschlossene Vereinigung) — jetzt oder später?** Sie steht seit
   T-145 offen und ist ein Hinweis, kein Muss. Sie wird aber nicht billiger.
4. **Guardian und 42Crunch, zum zehnten beziehungsweise neunten Mal.** Beschaffungsentscheidung.
   Ich trage das seit T-003 fort und habe nichts hinzuzufügen außer der Zahl.
5. **Soll `proof:db-permissions` das Bildverzeichnis messen (A-A-27), oder reicht ein Prüffall in
   `apps/local-api/test`?** Ich habe A-A-27 für den Nachweislauf geschrieben, weil er als
   einziger unter absichtlich weiter `umask` und im **echten** Startpfad misst — aber das ist
   domain-dev-Hoheit und keine Sicherheitsentscheidung.

## Nächster Schritt

**Welle U, in dieser Reihenfolge:**

1. **T-156-1** (frontend-dev): `attachment.rs` und `attachmentLabel.ts`, nach A-A-5′. Zwei
   Stellen, dieselbe Regel.
2. **T-156-2** (unit-tester): der `#[cfg(test)]`-Block in `attachment.rs` nach A-A-25, mit den
   28 Zeichenketten, der Festpunkttabelle, der Pfadliste und den Fällen aus A-A-5′ — die
   Pfadfälle unter `#[cfg(windows)]`. Die Messungen aus Bedrohungsmodell 21.3 sind dafür die
   Vorlage; sie sind gefahren und ihre Erwartungswerte stehen dort.
3. **T-156-3** (e2e-tester): `tests/e2e/support/services.ts` auf die Naht aus T-146
   (`main({ releaseSource })`), nach A-A-26, mit `ss`-Messung als Nachweis.
4. Parallel, ohne Abhängigkeit: **A-A-27** (domain-dev, `proof:db-permissions`), **A-A-20′**
   (unit-tester), die beiden fehlenden Messungen zu **A-A-6** (unit-tester und e2e-tester) und
   **A-V-21** (domain-dev).
5. **Wiedervorlage durch den security-checker** nach Rücklauf von 1 bis 3. Die übrigen Punkte
   tragen kein „muss" und können in die Freigabe danach.
