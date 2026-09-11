# T-276 — Drei Stellen in meiner Hoheit behaupten die alte Lesart

Aufgabe: T-276 — Kommentarnachzug auf die geschärfte Fassung von A-18.11, plus Messung zum
Befund `lastRequestAt` im Arbeitsspeicher
Status: fertig
Rolle: domain-dev
Datum: 2026-09-11

---

## Artefakte

| Datei | Art der Änderung |
|---|---|
| `apps/local-api/src/main.ts` (Block vor `versionCheck.start()`) | Kommentar |
| `apps/local-api/src/features/version/source.ts` (an `VERSION_CHECK_MAX_BYTES`) | Kommentar |
| `apps/local-api/scripts/proof-access-entry.ts` (an `offlineReleaseSource`) | Kommentar |
| `.claude/team/reports/T-276-domain-dev.md` | dieser Bericht |

**Ausschließlich Kommentare.** Keine Zeile ausführbarer Code, keine Konstante, keine
Zeichenkette, die ein Prüffall mißt.

---

## 1. Die drei Stellen

### 1.1 `main.ts` — vor `versionCheck.start()`

Vorher standen zwei Sätze nebeneinander, die zusammen das Gegenteil des Bestands sagten:
„höchstens eine Anfrage je 24 Stunden" und „Ein Fehlschlag ist still und wird im selben Lauf
nicht wiederholt". Wer beides liest, schließt: nach dem ersten Fehlschlag nie wieder.

Jetzt getrennt: der 24-Stunden-Takt gilt **im Erfolgsfall**; der Fehlschlag ist still im Sinne
von „kein wiederholtes Nachfragen **im selben Prüflauf**", der gewöhnliche Takt bleibt unberührt,
der nächste Versuch folgt frühestens nach dem Mindestabstand von einer Stunde, und ein Fehlschlag
beendet die Prüfung **nicht** für die Laufzeit.

Die Zahlen stehen jetzt ausgeschrieben da, damit sie niemand mehr schätzt:
**1 Anfrage je 24 Stunden im Erfolgsfall, höchstens 24 je Kalendertag im ununterbrochenen
Fehlschlag** — ein Sechzigstel dessen, was GitHub nicht angemeldeten Aufrufern je Stunde und
Quelladresse zugesteht.

### 1.2 `source.ts` — der Kommentar an `VERSION_CHECK_MAX_BYTES`

Der Satz „Die Versionsprüfung stellte damit den Betrieb ein" ist ersatzlos falsch geworden und
gestrichen.

**Aber der Befund von T-145-3 bleibt richtig**, und ich habe ihn ausdrücklich stehengelassen,
nur auf die richtige Ursache umgestellt: Bei `too_large` bleibt die Prüfung dauerhaft ohne
Ergebnis, weil **die Antwort** zu groß ist und nicht, weil der Zeitgeber steht. Jeder weitere
Prüflauf liest dieselbe zu große Antwort und schreibt dieselbe Protokollzeile. „Unbekannt" sieht
von außen weiterhin aus wie „alles aktuell" — nur eben stündlich statt einmalig.

Das ist zugleich der Grund, warum ich den **Meldesatz** `version_check_too_large` in
`version.ts` („liefert damit dauerhaft kein Ergebnis") **nicht** angefaßt habe: Er ist unter der
neuen Lesart unverändert wahr, und er ist eine gemessene Zeichenkette.

### 1.3 `proof-access-entry.ts`

Dieselbe Umstellung auf „Prüflauf", plus die Begründung, warum der Nachweislauf trotzdem genau
eine Abholung sieht: Der Boden ist eine Stunde, der Nachweislauf ist um Größenordnungen kürzer.
Und auch bei einem viel längeren Lauf ginge von dort nichts hinaus — die Abholfunktion kennt kein
Netz. Die beiden Zahlen (1/24 h, 24/Kalendertag) stehen auch hier.

### 1.4 Gegenprobe: was ich in meiner Hoheit sonst noch gesucht habe

`grep -rn "im selben Lauf\|zweiter Versuch\|stellte damit den Betrieb"` über
`apps/local-api`, `packages/domain`, `packages/storage`:

- `version.ts:35`, `:326`, `:334` — das sind **Zitate der alten Lesart**, die dort ausdrücklich
  als überholt benannt und korrigiert werden (T-273). Sie bleiben; sie behaupten nichts, sie
  erzählen.
- Treffer in `apps/local-api/test/**` und `packages/storage/test/**` — nicht meine Hoheit,
  gehen an unit-tester.

---

## 2. Die Messung: `lastRequestAt` im Arbeitsspeicher

### 2.1 Stimmt die Rechnung? — Ja, mit einer kleinen Korrektur nach unten

Gemessen auf diesem Rechner (Windows 11, Node v22.23.2), fünf Läufe: Kaltstart des Sidecars vom
`spawn` bis zur ersten beantworteten `/api/v1/health`-Anfrage.

| Lauf | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| ms | 474 | 452 | 471 | 527 | 562 |

n=5, min 452 ms, **Median 474 ms**, max 562 ms.

`VERSION_CHECK_START_DELAY_MS` = 10 000 ms. Der kürzeste Zyklus „starten, eine Anfrage
abholen, beenden" ist damit gemessen **10 474 ms**, also

> **3 600 000 / 10 474 ≈ 344 ausgehende Anfragen je Stunde.**

Die 360 des security-checkers sind die idealisierte Zahl (nur die 10 s); gemessen sind es 344.
Der Befund steht, und die Größenordnung ist die entscheidende: **344 gegen 24 je Tag** — Faktor
344 gemessen an der Stunde, Faktor 344 auch am Tag (8 256 gegen 24).

Die schärfere Weise, dieselbe Zahl zu lesen: **344/h ist das 5,7fache dessen, was GitHub nicht
angemeldeten Aufrufern überhaupt zugesteht** (60/h je Quelladresse). Der Boden aus A-V-11 ist
nicht nur unser eigenes Versprechen; er ist auch der Abstand zu einem 403.

### 2.2 Zwei Dinge, die die Rechnung eingrenzen — beide am Quelltext geprüft

**Erstens: parallel geht es nicht.** `server.listen` steht in `main.ts:417`, `versionCheck.start()`
in `main.ts:513`. `start()` läuft zwar **synchron** vor dem `EADDRINUSE`-Ereignis durch und stellt
den Zeitgeber auf 10 s — aber der Fehlerbehandler in `main.ts:394-415` ruft `process.exit(EXIT_BIND)`
innerhalb von Millisekunden, also lange vor Ablauf des Zeitgebers. Eine zweite gleichzeitige
Instanz sendet **nichts**. Der Weg zu 344/h ist damit ausschließlich der **sequentielle**: einer
nach dem anderen, jeder mit freiem Port.

**Zweitens: es gibt im Erzeugnis überhaupt keinen automatischen Neustart.** Ich habe die Hülle
gelesen (nur gelesen — sie gehört frontend-dev):

- `sidecar::start` hat **genau eine** Aufrufstelle: `apps/desktop/src-tauri/src/lib.rs:206`,
  innerhalb von `setup`.
- Der `invoke_handler` führt elf Befehle. **Keiner** startet den Dienst neu.
- `CommandEvent::Terminated` in `sidecar.rs` merkt den Grund (`note_exit`) und sendet
  `takt://dienst-beendet`. Es folgt **kein** erneuter `spawn`.
- Die Oberfläche zeigt daraufhin eine dauerhafte, nicht schließbare Sperre
  (`apps/web/src/app/ShellStatus.tsx:308`: „Der Zustand ändert sich bis zum Neustart").

**Also: Sidecar-Starts = Anwendungsstarts, 1:1.** Es gibt keinen zweiten Anlaß im ausgelieferten
Erzeugnis.

### 2.3 Wie oft startet er also in der Praxis?

| Anlaß | Starts | Ausgehende Anfragen |
|---|---|---|
| Normaler Benutzer, Anwendungsstart | 1–5 je Tag (menschengetaktet) | 1–5 je Tag |
| Absturz des Dienstes | Sperre, **kein** Neustart — der Benutzer muß von Hand | menschengetaktet |
| `pnpm desktop` / `tauri dev`, je Rust-Neubau | Dutzende je Entwicklertag | **echte** Anfragen (echte Abholfunktion) |
| `proof:access` | **9** Starts je Lauf (`startService()` in `proof-access.mjs`) | **0** — Offline-Attrappe |
| `test:coverage` | 0 Prozeßstarts (`compose()` startet den Prüfer nicht) | 0 |

Der einzige Ort, an dem heute schon regelmäßig mehr als eine Anfrage je Tag herausgeht, ist der
**Entwicklerrechner**. Auf dem Rechner des Benutzers braucht es einen Menschen, der die Anwendung
344mal in der Stunde startet — das ist kein Betriebsfall.

### 2.4 Wer die 344/h absichtlich erreichen kann — und warum ein Bestandswert ihn nicht aufhält

Ein Prozeß im Benutzerkonto (VG-3) kann die Sidecar-Binärdatei selbst starten: Sie liegt auf der
Platte, das Startgeheimnis erfindet der Startende selbst, und das Anwendungsdatenverzeichnis kommt
aus `LOCALAPPDATA` bzw. `XDG_DATA_HOME` (`scripts/proof-appdata.mjs:47-51`) und ist damit vom
Startenden bestimmbar. Schleife: starten, 10,5 s warten, eine Anfrage einsammeln, beenden. 344/h.

**Und genau dieser Prozeß kann eine gespeicherte Zeitmarke ebenso zurücksetzen** — er kommt mit
`sqlite3` an die Datei, das ist VG-3 im Bedrohungsmodell und war es schon vorher.

> **Der Bestandswert ist keine Abwehr gegen einen feindlichen lokalen Prozeß. Er ist die Abwehr
> gegen den Unfall.** Wer ihn als Sicherheitsbehebung von R-19 verkauft, verkauft die falsche
> Sache.

Der Unfall ist real genug: der Entwicklerrechner, eine künftige Neustartautomatik, die heute
niemand gebaut hat, ein Benutzer mit einem Startproblem, der zwanzigmal doppelklickt. Und der
Wert erfüllt dann dieselbe Regel wie der übersprungene Fassungswert, was der eigentliche Punkt
ist: **Zwei Werte derselben Fläche dürfen nicht zwei verschiedene Lebensdauern haben.**

### 2.5 Wo der Wert liegen müßte — Vorschlag, nicht gebaut

**Ort.** `app_setting.last_version_check_at`, neue Migration (die nächste freie Nummer wäre
**0022**; die Reihenfolge setzt der Orchestrator). Genau die Begründung, die Migration 0013 für
`skipped_version` schon ausgeschrieben hat: eine Einstellung wie jede andere, eine Zeile, ein
Typ, eine Migration (E-011). Eine Zustandsdatei neben der Datenbank wäre die zweite Art,
Einstellungen zu führen, und 0013 hat sie mit Begründung abgelehnt.

**Form.** `TEXT`, ISO-8601 in UTC mit `Z`, `NULL` = „noch nie gefragt". `CHECK` auf die Form per
`GLOB`, dieselbe Bauart wie der `due_date`-CHECK aus 0014 — zweite Wache, nicht erste.

**Sichtbarkeit: gar keine.** Der Wert darf **weder** in `GET /settings` **noch** in
`PATCH /settings` auftauchen. A-V-14 zählt aus, was den Dienst verläßt, und nennt „ein Zeitpunkt"
ausdrücklich als das, was **nicht** dazugehört. Ein „zuletzt geprüft" in der API wäre genau die
Fehlerfläche, die A-18.11 verbietet — und `skipped_version` ist hier das schlechte Vorbild, weil
es aus gutem Grund sichtbar ist (der Benutzer setzt es) und dieser Wert es aus gutem Grund nicht
sein darf (niemand setzt ihn).

**Naht.** Ein **optionaler** Port an `createVersionCheckerOptions`
(`readLastRequestAt()` / `writeLastRequestAt()`). Optional ist keine Bequemlichkeit: `compose()`
läuft ohne Datenbank (`composition.ts:163` — `database === null`, benutzt von `proof:openapi` und
`proof:route-policy`). Ohne Port bleibt das heutige Verhalten im Arbeitsspeicher, und damit
bleiben alle bestehenden Nachweise und Einheitentests unverändert gültig. Der Kommentar in
`composition.ts:194-196` („Sie hängt an keiner Datenbank") wäre dann nachzuziehen — sonst
entsteht die vierte Stelle derselben Art wie die drei aus diesem Auftrag.

**Zeitpunkt des Schreibens: vor dem `fetch`**, an genau derselben Stelle, an der heute
`lastRequestAt = options.now().getTime()` steht. Nicht danach. Sonst umgeht ein Absturz
**während** der Anfrage den Boden erneut — dasselbe Loch eine Ebene tiefer, und schwerer zu
sehen.

**Uhr.** Kein neuer Code nötig: Der `elapsed < 0`-Zweig in `run()` behandelt bereits die
zurückgesprungene Uhr, nimmt den Bezugspunkt neu und wartet den vollen Boden. Er deckt damit auch
den neuen Fall ab, den ein Bestandswert erst schafft — eine Datensicherung, die auf einem anderen
Rechner mit anderer Uhr eingespielt wird.

**Datensicherung.** `packages/storage/src/sqlite/repo-data-archive.ts:43` zählt die Spalten von
`app_setting` **ausdrücklich** auf. Eine neue Spalte, die dort fehlt, fällt beim Round-Trip
(A-20.4) still heraus. `skipped_version` steht dort; `last_version_check_at` müßte es auch.

**Was ich ausdrücklich nicht vorschlage:** den Startabstand von 10 s zu erhöhen. Das ist das
falsche Ende — es verlängert den Zyklus linear und ändert an der Größenordnung nichts, kostet
aber jeden ehrlichen Start Wartezeit.

---

## 3. Läufe

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | grün, alle acht Pakete plus Prüf- und E2E-Projekte |
| `pnpm proof:all` | **248 bestanden, 0 fehlgeschlagen**, Exit 0 |
| `pnpm --filter @takt/local-api proof:access` | **109 bestanden, 0 fehlgeschlagen**, Exit 0 |
| `pnpm test:coverage` | **88 Dateien / 1582 grün / 3 übersprungen / 0 rot**, Exit 0 |

Die Zahlen sind **zeichengleich** zum Stand vor diesem Auftrag. Das ist die Probe darauf, daß
hier wirklich nur Kommentare bewegt wurden.

Abdeckung unverändert: Statements 91,28 %, Branches 85,53 %, Functions 94,83 %, Lines 93,45 %.

**Ein Hinweis zum Ablauf:** Der erste `proof:all`-Lauf brach ab mit „Auf 127.0.0.1:17843 lauscht
bereits etwas". Das war keine Regression — der e2e-tester fuhr zur selben Zeit Playwright,
darunter `tests/e2e/support/version-check-entry.ts`, das denselben Port belegt. Nachgesehen mit
`Get-CimInstance Win32_Process`, abgewartet, wiederholt: grün. **Zwei Agenten in derselben Welle
teilen sich Port 17843**, auch wenn sie sich keine Datei teilen. Das gehört auf die Liste des
Orchestrators.

---

## Annahmen

1. **Der `too_large`-Meldesatz bleibt.** „Die Versionsprüfung liefert damit dauerhaft kein
   Ergebnis" ist unter der neuen Lesart weiterhin wahr — die Ursache ist die Antwort, nicht der
   Zeitgeber. Ich habe die **Begründung** im Kommentar umgestellt und den **Satz** unangetastet
   gelassen, weil er eine gemessene Zeichenkette ist.
2. **Die Zitate der alten Lesart in `version.ts` bleiben.** Sie stehen dort als das, was T-273
   korrigiert hat, nicht als Zusage.
3. Die 344/h sind auf **diesem** Rechner gemessen. Auf langsamerer Hardware sinkt die Zahl, auf
   schnellerer nähert sie sich den 360 des security-checkers an. Die Größenordnung ist stabil,
   weil die 10 s Startabstand dominieren.

---

## Risiken

- **R-19, neuer Punkt.** Die 344/h sind gemessen und stehen. Sie sind im ausgelieferten Erzeugnis
  nur **absichtlich** erreichbar (VG-3), nicht versehentlich, weil es keinen automatischen
  Neustart gibt. Wer diesen Satz künftig aufhebt — eine Neustartautomatik in `sidecar.rs` —,
  macht aus einem Angriff einen Betriebsfall. **Das ist der eigentliche Auftrag an die
  Entscheidung: nicht „bauen wir den Bestandswert", sondern „bauen wir ihn, bevor jemand den
  Neustart baut".**
- **Ein Bestandswert schließt VG-3 nicht.** Siehe 2.4. Wenn er kommt, gehört dieser Satz ins
  Bedrohungsmodell, sonst entsteht dort dieselbe Art falscher Zusage, die dieser Auftrag gerade
  aus drei Kommentaren entfernt hat.
- **Entwicklerrechner.** `pnpm desktop` startet den Sidecar bei jedem Rust-Neubau mit der
  **echten** Abholfunktion neu. Das sind heute schon Dutzende Anfragen je Entwicklertag an
  `api.github.com` von derselben Quelladresse. Kein Bruch von E-001 (die Adresse ist erlaubt),
  aber es ist die Fläche, auf der GitHubs 60/h zuerst erreicht wird. `proof:access` ist davon
  ausdrücklich **nicht** betroffen — die Attrappe ist genau dafür da.

---

## Offene Fragen an den Orchestrator

1. **F: Wandert `lastRequestAt` in den Bestand?** Vorschlag steht unter 2.5. Meine Empfehlung:
   **ja**, aber nicht als Sicherheitsbehebung, sondern als Gleichbehandlung mit
   `skipped_version` (A-18.10 / A-24.7) — und **vor** einer etwaigen Neustartautomatik.
2. **Migrationsnummer.** Wäre 0022. Die Reihenfolge der Migrationen ist deine Hoheit.
3. **`composition.ts:194-196`** behauptet „Sie hängt an keiner Datenbank". Fällt die Entscheidung
   für den Bestandswert, ist das die vierte Stelle derselben Art. Sie liegt in meiner Hoheit; ich
   ziehe sie **in demselben Auftrag** nach, in dem der Wert gebaut wird — nicht vorher.
4. **`repo-data-archive.ts:43`** (meine Hoheit) und die OpenAPI-Beschreibung (meine Hoheit) sind
   die zwei Stellen, an denen ein neuer Wert still danebengehen könnte. Beide sind im Vorschlag
   benannt.
5. **Port 17843 ist geteilte Infrastruktur zwischen Agenten**, auch wenn keine Datei geteilt wird.
   `proof:all`, `proof:access` und `pnpm test:e2e` schließen einander aus. Vorschlag: in einer
   Welle läuft höchstens einer davon, oder der Portbedarf steht im Auftrag.
6. **Test- und Papierstellen außerhalb meiner Hoheit**, die dieselbe alte Lesart tragen und in
   dieser Welle nachziehen müßten: `apps/local-api/test/version/checker.test.ts:10` („kein
   zweiter Versuch") — unit-tester.

---

## Nächster Schritt

Vorschlag: T-277 „Letzter Prüfzeitpunkt in den Bestand" als **ein** Auftrag, der Migration 0022,
den optionalen Port am Prüfer, den Kommentar in `composition.ts`, die Spaltenliste in
`repo-data-archive.ts` und den Satz im Bedrohungsmodell (security-checker) zusammen bewegt —
oder eine ausdrückliche Entscheidung „bleibt im Arbeitsspeicher", die dann **im Kommentar an
`lastRequestAt` steht**, mit der Zahl 344/h und dem Grund. Was nicht bleiben darf, ist der
heutige Zustand: ein Wert, der stillschweigend eine andere Lebensdauer hat als sein Nachbar
`skipped_version`, ohne daß irgendwo steht, warum.
