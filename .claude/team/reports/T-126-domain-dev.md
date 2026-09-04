# T-126 — Die letzte Frist beim Anhalten, und ein Nullzeichen im Bestand

```
Aufgabe: T-126 — Die letzte Frist beim Anhalten, und ein Nullzeichen im Bestand
Status: fertig
```

Gelesen: `CLAUDE.md`, `.claude/team/reports/T-125-security-checker.md` (Befunde T-125-4 und
T-125-6, Abschnitte 2 und 5), der eigene Bericht `T-122-domain-dev.md` (Abschnitt 3).

---

## 1. T-125-4 — die Frist beim Anhalten

### 1.1 Der Vorschlag ist geprüft, nicht übernommen — und er ist richtig

Der Auftrag verlangt ausdrücklich zu prüfen, ob eine Frist hier das falsche Mittel ist. Sie ist
es nicht, aber die Begründung liegt anders, als sie zuerst klingt: **`closeAllConnections()` ist
das Mittel, die Frist ist der Boden darunter.** Zwei verschiedene Dinge, und beide gebraucht.

- **Das Mittel** beseitigt die Ursache. `server.close()` wartet auf Verbindungen, die gerade eine
  Anfrage senden. Untätige räumt Node seit v19 selbst ab — eine mit **halbem Anfragekopf** nicht.
  Sie fällt erst `headersTimeout` (60 s) oder, bei stockendem Rumpf, `requestTimeout` (300 s) zum
  Opfer. `closeAllConnections()` reißt sie ab und nimmt damit dem fremden Prozess die
  Entscheidung.
- **Der Boden** deckt den Fall ab, in dem der Rückruf aus einem Grund ausbleibt, an den niemand
  gedacht hat. Nur dieser Fall hinterläßt einen Prozess mit Datenbankzugriff und ohne Fenster.
  Ein Boden ohne Mittel wäre zu wenig — er verdeckte, daß das Mittel fehlt; ein Mittel ohne Boden
  hinge daran, daß eine Zusicherung des Laufzeitsystems immer hält.

**Was ich nicht gebaut habe, und warum** — das steht auch im Quelltext, damit es dort steht, wo
jemand die Frage stellt:

- **Keine Schonfrist für laufende Anfragen.** Der übliche Bau wäre: untätige Verbindungen sofort,
  laufenden Anfragen ein paar Sekunden, dann abreißen. Er trägt hier nichts. `database?.close()`
  läuft zwei Zeilen **vorher**; eine Anfrage, die jetzt noch läuft, kann nicht mehr erfolgreich
  enden, gleich wie lange man ihr Zeit ließe. Eine Schonfrist verlängerte also genau das Fenster,
  in dem ein fremder Prozess den Zeitpunkt bestimmt, und kaufte dafür nichts. Sie wäre erst dann
  eine Frage, wenn der Bestand zuletzt geschlossen würde — eine andere Entscheidung, die dieser
  Fund nicht verlangt.
- **`headersTimeout` bleibt, wie es ist.** Es herunterzusetzen verkürzte das Fenster, schlösse es
  nicht, und wirkte auf **jede** Anfrage im Betrieb statt nur auf das Anhalten. Eine Frist am
  Anhalten trifft die Stelle, um die es geht.
- **Die Zeitgrenze aus B-1.7 hilft nicht**, und das ist der Grund, warum der Fall überhaupt
  bestehen konnte: `timeout(REQUEST_TIMEOUT_MS)` (`app.ts:80`) ist Zwischenschicht und läuft erst,
  wenn Node den Kopf **vollständig** gelesen hat. Ein halber Kopf kommt dort nie an. Nachgesehen,
  nicht angenommen.

### 1.2 Die Änderung

| Datei | Was |
|---|---|
| `apps/local-api/src/config.ts` | `SHUTDOWN_DEADLINE_MS = 2_000` — mit der Begründung, warum ein Wert, der nie ablaufen soll, trotzdem einen Namen braucht |
| `apps/local-api/src/main.ts` | `shutdown()`: erst `server.close(…)`, dann `closeAllConnections(server)`, darunter `setTimeout(…).unref()` mit Protokollzeile und Code 0 |
| `apps/local-api/src/main.ts` | Helfer `closeAllConnections(server)` — `'closeAllConnections' in server` statt `as` |

**Reihenfolge: erst schließen, dann abreißen.** Umgekehrt könnte zwischen den beiden Aufrufen noch
eine Verbindung angenommen werden, die danach niemand mehr abräumt.

**Warum eine Abfrage und kein `as`.** `createAdaptorServer` gibt `Server | Http2Server |
Http2SecureServer` zurück. Takt bekommt ohne `serverOptions` immer die erste, und nur die erste
kennt `closeAllConnections`; die beiden HTTP/2-Fassungen erben von `net.Server`. Ein `as` würde
die Zusage bloß behaupten. Fällt der Zweig eines Tages weg, weil jemand umstellt, bleibt nur der
Boden — und `proof:access` Abschnitt 0e wird rot, weil er ausdrücklich prüft, daß es **nicht** die
Frist ist, die den Dienst beendet.

**Code 0 aus dem Boden.** Das Anhalten ist gewollt, auch wenn es über den Boden geht. Die Hülle
liest den Code, um den Grund zu unterscheiden (74 Port, 78 Konfiguration, sonst „unerwartet
beendet", `sidecar.rs:304-333`); eine andere Zahl wäre eine falsche Auskunft an den Benutzer —
dieselbe Klasse wie die Code-1-Kette aus T-122. Was los war, sagt stattdessen eine Zeile im
Protokoll, und Abschnitt 0e prüft, daß sie im Normalfall **nicht** erscheint.

### 1.3 Der Nachweis, und die beiden Gegenproben

`proof:access` wächst von **86 auf 92**. Abschnitt 0e misst nicht nur **ob**, sondern **wann** —
ein Nachweis, der nur `code === 0` prüft, wäre auch ohne die Behebung grün, sofern man ihm eine
Minute Zeit ließe.

```
0e. Ein fremder Prozess hält eine Verbindung offen, während die Hülle stirbt (T-125-4, T-126)
  ok  Vorbedingung: der Dienst ist oben und antwortet
  ok  Ein fremder Prozess hält eine Verbindung mit halbem Anfragekopf
  ok  Der Sidecar überlebt die Hülle auch dann nicht, wenn eine Verbindung offen gehalten wird
  ok  Und er hält binnen 5000 ms an — der fremde Prozess bestimmt den Zeitpunkt nicht
  ok  Er geht dabei den ordentlichen Weg und sagt, warum er anhält
  ok  Und zwar über das Abräumen der Verbindungen, nicht erst über die Frist
```

**Drei Läufe an derselben Stelle, alle gefahren, alle abgelegt.**

| Stand | Ergebnis | Endstatus |
|---|---|---|
| **ohne jede Behebung** (die Gegenprobe, die der Auftrag verlangt) | `Code läuft weiter nach 20006 ms` — zwei Prüfungen rot. Der Dienst lief nach zwanzig Sekunden noch, wegen einer einzigen halben Anfrage. | 1 (89 bestanden, 2 fehlgeschlagen) |
| **nur der Boden** (`closeAllConnections` stillgelegt) | `Code 0 nach 2010 ms`, Protokollzeile „Beim Anhalten waren noch Verbindungen offen" — **die sechste Prüfung rot**. Der Boden trägt, und er verdeckt nichts. | 1 (91 bestanden, 1 fehlgeschlagen) |
| **vollständig** | `Code 0 nach **8 ms**` | 0 (92 bestanden) |

Die zweite Gegenprobe ist die, die T-125 nicht verlangt hat und die mir wichtiger war als die
erste: Ein Boden, der jedes Mal trägt, sieht genauso grün aus wie ein Mittel, das greift. Die
sechste Prüfung ist der Unterschied. Der Zustand nach der Stilllegung ist wiederhergestellt —
`closeAllConnections(server)` steht an genau einer Stelle, kein Rest der Gegenprobe im Baum.

### 1.4 Was der Fund sonst noch berührt hat — geprüft, ohne Befund

- **Der Aufgabenbereich auf 17844.** `taskpane?.close()` hat dieselbe Bauart und räumt seine
  Verbindungen ebenfalls nicht ab. Es blockiert aber nichts: Auf seinen Rückruf wartet niemand,
  der Lauscher fällt sofort, und spätestens `process.exit(0)` nimmt die Reste mit. Kein zweiter
  Befund.
- **Datenintegrität.** `closeAllConnections()` macht nichts schlimmer: `database?.close()` läuft
  vorher, eine abgerissene Anfrage war ohnehin verloren. Eine unvollständige Transaktion nimmt
  SQLite beim nächsten Öffnen zurück, eine halbe Exportdatei räumt `sweepTemporaryFiles` beim
  nächsten Start weg (`main.ts:180`). Der Satz „entweder Datei geschrieben und alle Buchungen
  markiert, oder nichts" gilt unverändert.

---

## 2. T-125-6 — das Nullzeichen, und ob es allein war

### 2.1 Die Stelle

`packages/storage/src/sqlite/paging.ts` trug in `const SEPARATOR` ein **rohes** `U+0000`. Es steht
jetzt als Escape-Folge `'\u0000'`. Am Verhalten ändert sich nichts — es ist derselbe eine
Codepunkt —, und die Datei ist damit für Git wieder Text. Gemessen, nicht angenommen:

```
neue Fassung gegen /dev/null:   84 insertions(+)     → Text
alte Fassung gegen /dev/null:   Bin 0 -> 2533 bytes  → Binärdatei
git grep -I --no-index "const SEPARATOR"  → Treffer in Zeile 59 (vorher: kein Treffer)
```

Der Kommentar nennt jetzt beides: **warum** der Trenner `U+0000` ist — weder Kennung noch
Zeitstempel können ihn tragen, beides ist ASCII ohne Steuerzeichen — und **warum** er als
Escape-Folge dasteht. Der zweite Teil ist der eigentliche Zweck: Wer die Zeile das nächste Mal
anfaßt, soll nicht wieder das Zeichen selbst einsetzen.

### 2.2 Gibt es weitere solche Stellen? Nein — und das ist gemessen

Codepunktsuche über **jede** versionierte Datei (Bilddateien ausgenommen), gegen C0 ohne
Zeilenumbruch und Tabulator, DEL, C1, `U+061C`, `U+200B`–`U+200F`, `U+202A`–`U+202E`,
`U+2066`–`U+2069` und die Bytefolgenmarke:

```
erster Lauf (Beginn der Aufgabe):
  Treffer im Produktivcode:   packages/storage/src/sqlite/paging.ts
  Treffer sonst:              .claude/team/reports/T-111-unit-tester.md

letzter Lauf (nach der Behebung):
  Treffer:                    keiner
```

**T-125-H7 ist damit ebenfalls zu**, aber nicht von mir: `T-111-unit-tester.md` war beim ersten
Lauf noch betroffen und ist beim letzten frei — unit-tester hat sie während T-127 nachgezogen.
`T-121-unit-tester.md` war schon zu Beginn frei; T-125 führt sie noch als Fundstelle, nachgemessen
ist sie es nicht mehr. **Der Baum trägt außerhalb der Bilddateien keine einzige solche Stelle
mehr** — weder im Code noch in den Berichten.

### 2.3 Drei weitere Eigenproben, unfreiwillig

Der security-checker berichtet, das Zeichen sei ihm beim Schreiben der Prüfung zweimal in die
eigene Arbeit gerutscht. Beim Beheben ist es dreimal weiter passiert:

1. Mein erster Befehl, der die alte Zeile suchen sollte, enthielt das rohe `U+0000` — kopiert aus
   einer Ausgabe, in der es wie ein Leerzeichen aussah.
2. Und dann **zweimal** beim Schreiben dieses Berichts — beide Male in genau dem Satz, der die
   Behebung beschreibt. Das zweite Mal ist erst der Codepunktscan über die eigene Datei
   aufgefallen, weil der Bericht nicht über die Befehlszeile entstand und das Werkzeug deshalb
   nicht abwies.

In den ersten beiden Fällen hat dasselbe Werkzeug es abgewiesen:

```
command contains control characters that would be hidden in the approval dialog
```

Der zweite Anlauf hat die Suchzeichenkette aus `chr(0)` **gebaut**, statt sie abzuschreiben. Das
ist derselbe Satz wie E-063 Punkt 4 an einer neuen Stelle: Wer zwei Stellen zusammenhalten will,
fragt die maßgebliche ab und schreibt sie nicht ab — und bei einem unsichtbaren Zeichen merkt man
das Abschreiben nicht einmal. Fünf Vorfälle in zwei Aufgaben sind kein Ungeschick, sondern eine
Eigenschaft des Zeichens — und der fünfte ist der lehrreichste: Er ist durch das Werkzeug
gerutscht, weil er nicht über die Befehlszeile lief. Gefunden hat ihn nur die Messung.

---

## 3. Die Reihenfolge beim Start — die Frage soll nicht ein drittes Mal gestellt werden

**Die Reihenfolge ist richtig, und sie ist es aus einem Grund, der nicht auf der Hand liegt.** Der
Grund steht jetzt an der Stelle (`main.ts`, unmittelbar über `watchParentLink`) und in
`docs/architektur.md` Abschnitt 6.

Der Einwand: `server.listen` steht vor `watchParentLink`, der Dienst hört also auf `127.0.0.1`,
bevor der Wächter angemeldet ist. Stirbt die Hülle in diesem Fenster, bliebe ein Prozess mit Port
und Datenbestand zurück. **Genau das ist einmal passiert** (T-122, Abschnitt 3).

Verursacht hat es aber nicht die Reihenfolge, sondern ein **verlorenes Ereignis**: Der Handschlag
las `stdin` im fließenden Zustand, das Dateiende ging an einen Strom ohne Zuhörer, und
`once('end')` wartete danach auf etwas, das vorbei war. Seit T-122 hält `readStartupHandshake` den
Strom mit `pause()` an, und `watchParentLink` holt ein bereits liegendes Dateiende mit seinem
`resume()` ab — beziehungsweise meldet es sofort, wenn der Strom schon zu Ende ist
(`readableEnded || destroyed`). **Das Ende der Röhre geht in diesem Fenster nicht mehr verloren,
es wird nur später zugestellt.**

Und genau das ist der Grund, den Wächter dort zu lassen, wo er steht: **Zugestellt wird erst, wenn
der Dienst fertig gebaut ist.** Ein `shutdown()` mitten im Start müßte sonst mit halbem Bestand
umgehen — ohne Datenbank, ohne Server, womöglich mitten in einer Migration —, und jeder dieser
Zweige wäre ein eigener Weg, den Prozess in einem undefinierten Zustand zu beenden. So gibt es
einen Weg statt mehrerer, und er läuft immer auf demselben vollständigen Zustand. Wer das
umstellen will, verschiebt nicht drei Zeilen, sondern übernimmt die Verantwortung für das Anhalten
eines halb gebauten Dienstes.

`proof:access` Abschnitt 0d mißt den Fall an seinem Anfang — Röhre zu, unmittelbar nach dem
Handschlag — und ist grün.

---

## 4. Nachweis

Jeder Befehl einzeln, Ausgabe in eine Datei umgeleitet, Endstatus unmittelbar danach gelesen —
keine Pipe (zsh `pipestatus`). Alle Läufe **nach** der letzten Änderung.

| Befehl | Endstatus | Ergebnis | Marke nach Welle K |
|---|---|---|---|
| `pnpm typecheck` | **0** | 8 Pakete, 7 Test-Konfigurationen, `tests/e2e` | — |
| `pnpm test` | **0** | 58 Dateien, **991/991** | 837 — die Differenz ist **fremd** (unit-tester, T-127, läuft parallel) |
| `pnpm proof:access` | **0** | **92** bestanden | 86 — **+6 durch Abschnitt 0e** |
| `pnpm proof:all` | **0** | 13 Ketten, **886** Prüfungen, 0 fehlgeschlagen | 879 — +6 meine, +1 fremd (`proof:addin` steht bei 165, integration-dev T-123) |
| `pnpm boundaries` | **0** | 331 Dateien auf Tiefenzugriffe, „Notiz-Trennung: alle Schichten unverletzt" | — |

Dazu die beiden Gegenproben aus 1.3 (Endstatus je **1**, beide rot an genau der vorgesehenen
Stelle) und die Messungen aus 2.1 und 2.2.

**Zur DoD-Zeile OpenAPI:** Diese Aufgabe ändert keine Route, kein Schema und keinen Statuscode.
`proof:openapi` läuft unverändert mit 110 grün; die Beschreibung ist erzeugt und geprüft. Den
Add-in-Abschnitt habe ich nicht angefaßt (E-053). **Zur DoD-Zeile Migration:** kein Schemawechsel;
`proof:migrations` läuft in `proof:all` mit.

Ports 17843/17844 waren vor jedem Lauf frei und sind es danach; kein verwaister Sidecar
zurückgeblieben (nachgesehen). Kein `git commit`, kein `stash`, kein `checkout`, kein fremder
Prozess beendet.

---

## 5. Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/src/main.ts` | Frist und `closeAllConnections` in `shutdown()`; Helfer mit `in`-Abfrage; die Begründung der Startreihenfolge über `watchParentLink` |
| `apps/local-api/src/config.ts` | `SHUTDOWN_DEADLINE_MS = 2_000` |
| `apps/local-api/scripts/proof-access.mjs` | Abschnitt 0e (6 Prüfungen), Helfer `openHalfRequest` |
| `packages/storage/src/sqlite/paging.ts` | `SEPARATOR` als Escape-Folge, mit dem Grund für beides |
| `docs/architektur.md` | Abschnitt 6, neuer Punkt 5: die Frist beim Anhalten und die Startreihenfolge |
| `.claude/team/reports/T-126-domain-dev.md` | dieser Bericht |

**Nicht angefaßt:** `apps/local-api/src/routes/addin/**` und der Add-in-Abschnitt der OpenAPI
(E-053, integration-dev arbeitet dort an T-123), `apps/web/**`, `apps/desktop/**` (frontend-dev,
T-124), alle Testordner (unit-tester, T-127 — `characters.ts` und `enumeration.ts` sind
unverändert), `packages/export/**`, `docs/bedrohungsmodell.md`, `docs/datenmodell.md` und jede
gemeinsame Datei.

---

## 6. Annahmen

1. **Die Frist steht bei 2000 ms und in `config.ts`, nicht als Zahl im Quelltext.** Der
   ordentliche Weg braucht 8 ms; zwei Sekunden sind auch auf einem ausgelasteten Rechner
   reichlich und kurz genug, daß niemand darauf wartet.
2. **Keine Schonfrist für laufende Anfragen** (Begründung in 1.1). Das ist die Entscheidung, die
   sich am ehesten anders treffen ließe — sie hinge daran, den Bestand zuletzt statt zuerst zu
   schließen, und das ist eine eigene Aufgabe.
3. **`headersTimeout` und `requestTimeout` bleiben auf den Vorgaben.** Sie herunterzusetzen wäre
   eine Änderung am Betrieb für einen Fund am Anhalten.
4. **Der Boden endet mit Code 0** und schreibt eine Zeile ins Protokoll, statt still zu enden.
5. **`'closeAllConnections' in server` statt `as`.** Eine Behauptung weniger im Baum.
6. **Das Nullzeichen bleibt der Trenner**, nur die Schreibweise wechselt. Ein anderer Trenner wäre
   eine Verhaltensänderung an bestehenden Blättermarken, die dieser Fund nicht verlangt.
7. **`docs/architektur.md` nachgezogen, `docs/bedrohungsmodell.md` nicht.** Das Modell gehört dem
   security-checker; die Fundstellen 2.4 und 17 sind mit dieser Aufgabe geschlossen und wollen von
   ihm nachgemessen werden, nicht von mir umgeschrieben.

---

## 7. Risiken

**R1 — `git diff` zeigt `paging.ts` in dieser Welle weiterhin als „Bin".** Git entscheidet über
den Diff anhand **beider** Seiten, und die Seite in `HEAD` ist binär. Erst nach dem Commit ist die
Datei im Diff lesbar. Wer sie in dieser Welle prüfen will, liest sie **als Ganzes** und nicht über
den Diff — sonst wiederholt sich genau der Umstand, wegen dessen sie seit `d9555d0` nie im Review
lag. Gemessen ist die neue Fassung Text (2.1).

**R2 — Der halbe Anfragekopf bleibt im laufenden Betrieb möglich.** Ein lokaler Prozess kann eine
Verbindung 60 Sekunden lang halten, ohne eine vollständige Anfrage zu schicken. Das ist eine Frage
der Betriebsmittel, keine der Lebensdauer, und mit dieser Aufgabe **nicht** behoben — sie war es
auch nicht. Wer sie angehen will, setzt `headersTimeout` herunter und mißt, was das für langsame
Anfragen bedeutet.

**R3 — Der Start hängt an einem `await`.** `taskpane = await startTaskpaneServer(...)` liegt
zwischen Handschlag und Wächter. Bliebe diese Zusage je unerfüllt, würde das aufgeschobene
Dateiende nie zugestellt, und der verwaiste Sidecar wäre wieder da — an einer anderen Ursache.
Nachgesehen: Die Zusage wird von `listen` **oder** `error` erfüllt, beide auf einem Loopback-Port;
davor stehen nur `stat`-Aufrufe und die Zertifikatserzeugung. Kein Befund, aber die eine Stelle,
an der die Bauart aus Abschnitt 3 eine Bedingung hat.

**R4 — Sicherheit, behoben und benennenswert:** Bis zu dieser Aufgabe konnte **jeder** Prozess auf
dem Rechner das Ende von Takt um bis zu fünf Minuten verzögern, ohne ein Geheimnis zu kennen — mit
einer TCP-Verbindung und einem halben Anfragekopf. Das ist nicht theoretisch: gemessen, zwanzig
Sekunden und weiter laufend. B-1.6 Punkt 3 gilt damit wieder ohne Fußnote.

**R5 — Die Vergleichsmarken der Welle stimmen nicht mehr, und zwar zu Recht.** `test` steht bei
991 statt 837 und `proof:all` bei 886 statt 879. Sechs der sieben zusätzlichen Prüfungen in
`proof:all` sind meine; alles Übrige stammt aus den parallel laufenden Aufgaben T-123 und T-127.
Der Orchestrator sollte die Marken nach dieser Welle neu setzen, sonst liest die nächste Aufgabe
fremde Arbeit als Abweichung.

---

## 8. Offene Fragen

1. **Soll ein Wächter dauerhaft rohe Steuerzeichen aus dem Produktivcode halten?** T-112-H2 (Test)
   und T-125-6 (Produktivcode) sind derselbe Fall zweimal, und beide sind einzeln behoben worden.
   Der Zustand, der sie nicht wiederkommen läßt, ist derselbe wie in T-125 Abschnitt 1.3: **gemessen
   statt bemerkt.** Eine Codepunktsuche über die versionierten Dateien ist zwanzig Zeilen und liefe
   in einer der bestehenden Ketten mit. Ich habe sie **nicht** gebaut, weil die Wahl des
   Nachweispfads eine Frage der Hoheit ist — `proof:callers` wäre der nächstgelegene, gehört aber
   in dieselbe Absprache wie die Modulregistrierung. **Vorschlag: als eigene kleine Aufgabe an
   domain-dev, mit der Ausnahmeliste für Bilddateien und die Berichte.**
2. **`headersTimeout` im Betrieb** (R2): heruntersetzen oder ausdrücklich hinnehmen? Das ist eine
   Abwägung zwischen Betriebsmitteln und langsamen Anfragen, keine, die ich allein treffen sollte.
3. **T-125-H7 ist zu, ohne daß es jemand gemeldet hätte.** Beide Berichte sind bei der letzten
   Messung frei (2.2); unit-tester hat `T-111` während T-127 nachgezogen. Der Orchestrator kann
   den Hinweis schließen — die Messung steht in 2.2, nicht die Annahme.
4. **Vergleichsmarken neu setzen** (R5).

---

## 9. Nächster Schritt

1. **security-checker: T-125-4 und T-125-6 nachmessen.** Für den ersten liegen drei Läufe vor
   (ohne Behebung 20 s und weiter laufend, nur mit Boden 2010 ms, vollständig 8 ms); für den
   zweiten die Textprobe gegen `/dev/null` und der Scan über alle versionierten Dateien. Danach
   ist von der Prüfung T-125 nichts mehr offen, was Code betrifft — H7 eingeschlossen (2.2).
2. **Code-Reviewer: `paging.ts` als Ganzes lesen, nicht über den Diff** (R1). Es ist das erste Mal,
   daß die Datei überhaupt lesbar ist.
3. **Über offene Frage 1 entscheiden.** Die beiden Fundstellen sind geschlossen; die Bauart, die
   sie erzeugt hat, ist es nicht.
