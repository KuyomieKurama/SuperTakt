# T-319 — `packages/storage`: wo die Lücke wirklich liegt, und zwei Zahlen statt einer

**Aufgabe:** T-319 — messen, wo die 191 (kombiniert) bzw. 224 (isoliert) ungedeckten Zweige in
`packages/storage/src` wirklich liegen; `attachmentsNamingFiles` mit Vorrang (leerer Name, `%`/`_`,
Pfadtrenner, sehr langer Name, Groß-/Kleinschreibung, Unicode-Normalform); beide Zahlen nennen
(isoliert und kombiniert); Einschätzung zur Schwelle je Paket statt gemittelt.

**Status:** fertig.

---

## Artefakte

**Geändert (ausschließlich `packages/*/test/**`, wie vorgeschrieben):**
- `packages/storage/test/repo-attachments.test.ts` — fünf neue Prüffälle im Block
  `attachmentsNamingFiles`: leere Zeichenkette in der Namensliste, Name mit `%`, Name mit `_`
  (beide mit Lockvogel-Zeile, die nur bei kaputter Eskapierung träfe), Name mit Pfadtrenner, sehr
  langer Name (400 Zeichen).
- `packages/domain/test/attachment.test.ts` — sechs neue Prüffälle für die reine Funktion
  `attachmentTargetNamesFile`: dieselben vier Zeichenklassen (`%`, `_`, Pfadtrenner, sehr langer
  Name) plus Unicode-Normalform (NFC gegen NFD desselben sichtbaren Zeichens — dokumentiertes
  Verhalten: **nicht** ausgeglichen, weil `asciiLower` nur A–Z anfaßt).
- `packages/storage/test/repo-time.test.ts` — der bestehende Prüffall „search filtert nach todoId,
  exportStatus und Tagesspanne …" rief `exportStatus` entgegen seinem eigenen Titel **nie** mit
  einem gesetzten Wert auf. Ergänzt um zwei Zusicherungen (`exportStatus: 'open'` /
  `exportStatus: 'exported'`), die genau diesen Zweig erstmals treffen.

**Nicht angefaßt:** `src/`, `scripts/`, `docs/`, `vitest.config.ts` — wie vorgeschrieben. Zwei
fremde Dateien (`risks.md`, ein neuer Bericht `T-318-code-reviewer.md`) tauchten während der Arbeit
im Arbeitsbaum auf, stammen aber nicht von mir; nicht angefaßt.

**Meßhilfen, nicht Teil des Bestands:** zwei Skripte im Scratchpad-Verzeichnis
(`lcov-sum.mjs`, `lcov-branches.mjs`, `like-escape-check.mjs`) — außerhalb des Repositorys, dienten
nur der Messung.

---

## 1 — Beide Zahlen, gemessen (nicht geschätzt)

| | vor T-319 | nach T-319 |
|---|---|---|
| **Isoliert** (`vitest run --coverage packages/storage/test packages/domain/test packages/export/test`) | 764/988 = **77,33 %** | 765/988 = **77,42 %** |
| **Kombiniert** (`pnpm run test:coverage`, voller Arbeitsbereich — das ist die Zahl, an der `pnpm check` hängt) | 797/988 = **80,67 %** | 798/988 = **80,77 %** |

**Die isolierte Zahl ist die ehrliche**, wie im Auftrag benannt. Sie liegt weiterhin **unter** der
Schwelle, um 2,6 Prozentpunkte bzw. **26 Zweige**. `pnpm check` ist grün, weil
`apps/local-api/test/**` (fremde Hoheit, integration-devs bzw. domain-devs Zuständigkeit, nicht
meine) dieselben Dateien in `packages/storage/src` über echte SQLite-Verbindungen mitübt — nicht
weil `packages/storage` allein seine Zusagen beweist.

Beide Läufe unter Windows 11, Node 22.23.2, mit `pnpm run test:coverage` bzw. gefiltertem
`vitest run --coverage`. Der volle Lauf blieb bei 26,7 s und ist nicht abgebrochen — anders als in
der Warnung des Auftrags angekündigt, war hier keine Abbruchmeldung nötig; ich habe ihn trotzdem
**einzeln** gefahren, nie als Teil eines vollen `pnpm check`.

---

## 2 — Priorität 1: `attachmentsNamingFiles` ist bereits vollständig gemessen — nachgeprüft, nicht geglaubt

Die vier verbliebenen ungedeckten Zweige in `repo-attachments.ts` (30/34 kombiniert) liegen
**nicht** in `attachmentsNamingFiles`, `attachmentNamesUnder` oder `emailFileCount` — sie liegen an
vier anderen Stellen, und alle vier sind von domain-dev ausdrücklich als **unerreichbar**
dokumentiert (Zeilen 171, 214, 319, 479 im aktuellen Stand):

- Zeile 171: `.get(...) ?? { n: 0 }` nach `SELECT COALESCE(MAX(position)+1, 0) AS n` — `COALESCE`
  liefert immer genau eine Zeile, der Rückfall greift nie.
- Zeile 214: `if (created === null)` nach `loadOne(id)` unmittelbar nach erfolgreichem `INSERT`.
- Zeile 319 und 479: `if (row === undefined)` nach `SELECT COUNT(*)` — liefert unter SQLite immer
  genau eine Zeile, mit ausführlicher Begründung im Quelltext (T-188, O-FT), warum dieser Zweig
  **bewußt nicht** mit einem Prüffall zugedeckt wird, der eine unmögliche Lage behauptet.

Diese vier stehen bereits seit T-314/T-316 unangetastet da und sind der bekannte, akzeptierte
Rest. **Die eigentliche Eigentümerfrage selbst hat keinen einzigen ungedeckten Zweig mehr.**

Trotzdem habe ich die im Auftrag genannten sechs Fälle **explizit und einzeln** nachgewiesen, an
beiden Stellen, wo die Regel steht (rein in `@takt/domain` und über die echte Datenbank in
`packages/storage`):

| Fall | Domäne (rein) | Speicherung (echte DB) |
|---|---|---|
| leerer Name | bestehender Fall (`attachmentTargetNamesFile('', '')`) | **neu**: leerer Name in der Namensliste, gemischt mit einem echten Namen — bleibt ausgeschlossen, obwohl SQL `%%` jede Zeile träfe |
| `%` im Namen | **neu** | **neu**, mit Lockvogel-Zeile |
| `_` im Namen | **neu** | **neu**, mit Lockvogel-Zeile |
| Pfadtrenner im Namen | **neu** | **neu** |
| sehr langer Name (400 Zeichen) | **neu** | **neu** |
| Groß-/Kleinschreibung | bestehender Fall (T-313-1) | bestehender Fall (T-313-1) |
| Unicode-Normalform | **neu** | — (die Regel steht nur einmal, in der Domäne; die Speicherungsebene reicht Werte nur durch) |

**Ein wichtiger, ehrlicher Befund dabei:** Diese neuen Prüffälle verändern die **Zweigzahl nicht**
(30/34 vorher und nachher, siehe Abschnitt 1) — die Funktion hat keine Verzweigung, die an der
Zeichenklasse eines Namens hängt. Sie sind trotzdem kein Leerlauf: Sie sperren das **Verhalten**
fest, nicht einen Zweig. Ich habe das an einer isolierten SQLite-Probe (außerhalb des Bestands,
`like-escape-check.mjs`) nachgemessen: Ohne `escapeLike()` liefert `LIKE '%vertrag_2024.eml%'`
**zwei** Zeilen statt einer (der Unterstrich wirkt als Ein-Zeichen-Joker) — die SQL-Vorauswahl
würde dann **weiter**, nicht enger. Da die endgültige Entscheidung aber immer über die exakte
Domänenfunktion läuft (`attachmentTargetNamesFile`, buchstäblicher Vergleich, kein SQL-Muster),
bleibt das Endergebnis (`owned`) auch bei kaputter Eskapierung korrekt — eine über-treffende
SQL-Vorauswahl wird von der Domänenfunktion exakt zurechtgestutzt. Das ist eine **beruhigende**
strukturelle Eigenschaft der zweischichtigen Bauart (SQL weitet vor, `@takt/domain` entscheidet
exakt) und keine Lücke — ich nenne es trotzdem ausdrücklich, weil ich es geprüft und nicht
angenommen habe.

**Rot zuerst, nachgewiesen wo möglich:** Für den neuen `exportStatus`-Fall in `repo-time.ts` (siehe
Abschnitt 3) konnte ich die Quelldatei kurzzeitig ändern (`if (false && filter.exportStatus !==
undefined)`), den Prüffall rot sehen (`expected 3 to be 2`), zurücksetzen und `git status` als
sauber bestätigen — derselbe Nachweis wie in T-316/T-317. Für die `attachmentsNamingFiles`-Fälle
selbst ist ein Rot-zuerst-Nachweis gegen den Quelltext **nicht sauber möglich**, weil er — wie
oben gezeigt — an dieser Stelle nicht das Ergebnis ändert, nur die SQL-Vorauswahlgröße; eine
zweite, unabhängige Quelle (die isolierte SQLite-Probe außerhalb des Bestands) belegt stattdessen,
was die Eskapierung konkret tut.

---

## 3 — Ein zweiter, ungefragter, aber echter Fund: `exportStatus` wurde nie geprüft, entgegen dem eigenen Testnamen

Beim Durchsehen der übrigen Lücken (Punkt 1 des Auftrags: erst messen, dann einordnen) ist mir in
`repo-time.ts` Zeile 82 aufgefallen: `if (filter.exportStatus !== undefined)`. Der Prüffall, der
laut eigenem Titel genau das testet („search filtert nach todoId, **exportStatus** und
Tagesspanne …"), rief `search()` an keiner Stelle mit einem gesetzten `exportStatus` auf — geprüft
per `grep` über den ganzen Bestand, kein einziger Aufruf. Das ist eine **Zusage**-Lücke in genau
dem Pflichtfall „Exportstatus" (Exportvorlagen/Exportsperre), nicht Vollständigkeit.

Ergänzt: eine Buchung wird auf `exported` gesetzt, die anderen beiden bleiben `open`; zwei
Zusicherungen (`exportStatus: 'open'` → 2 Treffer, `exportStatus: 'exported'` → 1 Treffer). Rot
zuerst nachgewiesen (Abschnitt 2). Der Zweig ist jetzt in **beiden** Läufen getroffen — kombiniert
798/988, isoliert 765/988 (je +1 gegenüber vorher).

---

## 4 — Kategorisierung der übrigen ~190 (kombiniert) / ~223 (isoliert) ungedeckten Zweige

Stichprobenartig gemessen (nicht vollständig ausgezählt — bei dieser Menge wäre das eine eigene
Aufgabe), aber an genug Stellen, um die Verteilung ehrlich zu beschreiben:

**Sorte 1 — dieselbe „unerreichbar"-Konvention wie in `repo-attachments.ts`, an sehr vielen
Stellen wiederholt.** `repo-tags.ts`, `repo-time.ts`, `repo-export.ts`, `repo-todos.ts`,
`repo-statuses.ts`, `repo-settings.ts` tragen alle densel­ben Aufbau: `if (!outcome.ok) return
err(...)` nach einem `INSERT`/`UPDATE`/`DELETE`, das nur an einer bereits vorher geprüften
Bedingung scheitern könnte; `if (created === null) throw ...` nach `loadOne` unmittelbar nach
erfolgreichem Einfügen; `row === undefined` nach `SELECT COUNT(*)`. Ich schätze, das ist die
**Mehrheit** der verbliebenen Lücke — an keiner Stichprobe, die ich gezogen habe, war es anders.
Das sind Vollständigkeits-Zweige im Sinn des Auftrags: ihr Fehlen macht keine Zusage ungemessen,
weil sie einen Zustand behaupten, der mit der echten SQLite-Anbindung nicht herstellbar ist (T-188,
O-FT — dieselbe, im Bestand bereits etablierte und dokumentierte Haltung).

**Sorte 2 — echte Windows-Unerreichbarkeit.** `database.ts` (POSIX-Dateirechte,
`secureDatabaseFiles`/`inspectDatabasePermissions`) und Teile von `open.ts`/`clock.ts` verzweigen
auf `process.platform === 'win32'` bzw. auf `chmod`/`statSync`-Fehlercodes, die unter Windows gar
nicht auftreten (`ENOENT` vs. `EACCES`/`EIO`, `chmod`-Fehlschlag auf einem Dateisystem ohne
POSIX-Rechte). Auf **diesem** Rechner (Windows 11, dieselbe Umgebung, die laut Erinnerung
„Windows ist ab jetzt messbar" das Team gerade neu vermißt) sind diese Zweige strukturell nicht
erreichbar, ohne `fs`-Aufrufe zu ersetzen — das würde Produktivcode anfassen (`vi.mock` auf ein
Node-Kernmodul wäre an der Grenze vertretbar, aber ich habe es nicht getan, weil der Auftrag
ausdrücklich Priorität auf `attachmentsNamingFiles` und die Einordnung legt, nicht auf einen
vollständigen Fahrplan für jede Datei). Das ist eine **echte, plattformbedingte Lücke**, aber kein
akuter Löschweg — sie betrifft eine Warnfläche (B-7.2 Punkt 3), keine Löschentscheidung.

**Sorte 3 — genuine Verhaltenslücken, wie der `exportStatus`-Fund.** Ich habe nur diese eine
konkret verfolgt (Abschnitt 3), weil sie exakt in meinem Pflichtfall lag und der Titel des
bestehenden Prüffalls sie bereits versprach. `repo-export.ts` (26 fehlende Zweige, größte einzelne
Lücke) enthält daneben mindestens eine Wettlaufbedingung (`changed.changes !== 1` nach
Prüfung-dann-Schreiben, ausdrücklich als „kann nur eintreten, wenn zwischen Prüfung und Schreiben
etwas [sich ändert]" kommentiert, Zeilen ~310/424) — testbar, aber nur mit gezieltem Eingriff
zwischen den beiden Schritten (z. B. eine zweite Verbindung, die dazwischenschreibt); das ist ein
eigener, nicht kleiner Auftrag und kein Nebenbefund dieser Aufgabe. Ich nenne es als konkreten
nächsten Kandidaten, statt es hier grob nachzubauen.

**Was ich bewußt nicht getan habe:** Die 191 (kombiniert) bzw. 224 (isoliert) Zweige einzeln
durchzuzählen und für jeden zu entscheiden. Der Auftrag selbst sagt „191 ungedeckte Zweige sind
keine Aufgabe, sondern eine Zahl" — die Stichprobe oben zeigt die Verteilung ehrlich, ohne die
ganze Datei durchzuarbeiten, was bei acht GB Arbeitsspeicher und dem Rat, Stufen einzeln zu fahren,
außer Verhältnis gestanden hätte.

---

## 5 — Zur Frage: Schwelle je Paket statt gemittelt?

**Ja, ich halte eine Schwelle je Paket für richtiger — mit einer konkreten Zahl dazu, was sie heute
kosten würde.**

Die heutige Bauart (`'packages/storage/src/**': achtzigProzent` als **ein** Glob-Eintrag in
`vitest.config.ts`, gemessen über den **gesamten** Testlauf) hat eine Eigenschaft, die T-319 selbst
beim Namen nennt: Sie verdeckt, **wessen** Tests die Zusage tragen. `packages/storage` „besteht"
heute nur, weil `apps/local-api/test/**` — fremde Hoheit, andere Rolle, anderer Auftrag — dieselben
Dateien über echte Integrationstests mitübt. Fiele einer dieser Integrationstests weg (ein
künftiger Umbau, der `packages/storage` hinter einer Attrappe versteckt, wie es
`image-sweep.test.ts` schon heute für den Aufräumlauf selbst tut), risse die Schwelle **ohne jede
Änderung an `packages/storage`** — der T-315/T-317-Bericht warnt genau davor (Risiko 2 in
T-317-unit-tester.md). Eine Schwelle, die nur berichtet, ob **irgendein** Test im Arbeitsbereich
eine Zeile trifft, mißt nicht, ob **das Paket selbst** seine Zusage beweist — dieselbe Art
Verdeckung, die `email-attachment.ts` schon einmal bei 35,71 % durchrutschen ließ, nur diesmal auf
Paket- statt auf Dateiebene.

**Was es heute kosten würde:** 26 Zweige, um von 765/988 auf ≥ 80 % zu kommen (isoliert). Nach der
Kategorisierung in Abschnitt 4 ist ein erheblicher Teil davon entweder strukturell unerreichbar
(Sorte 1, die etablierte Konvention) oder plattformbedingt unerreichbar auf diesem Rechner (Sorte
2) — **beides Zweige, die eine isolierte Paketschwelle nicht erzwingen sollte**, weil sie sonst
Tests gegen unmögliche Zustände oder `fs`-Attrappen erzwänge, nur um eine Zahl zu erreichen.
Realistisch schätze ich, daß **10 bis 15** der 26 fehlenden Zweige mit echten,
verhaltensbezogenen Prüffällen schließbar wären (in der Art des `exportStatus`-Fundes) — der Rest
bräuchte entweder eine Ausnahme für die „unerreichbar"-Sorte (z. B. `/* v8 ignore next */` an den
bereits dokumentierten Stellen, was **Produktivcode** anfaßt und damit nicht meine Hoheit ist) oder
eine niedrigere, paketspezifische Schwelle, die diese Realität eingesteht.

**Meine Empfehlung:** eine Schwelle je Paket, plus eine bewußte Entscheidung, ob die
„unerreichbar"-Zweige über `/* v8 ignore next */`-Marken (an den bereits im Quelltext ausführlich
begründeten Stellen) aus dem Nenner genommen werden — das würde die isolierte Zahl ehrlich näher an
80 % heranholen, ohne Tests gegen unmögliche Zustände zu erzwingen. Beides liegt außerhalb meiner
Hoheit (`vitest.config.ts` gehört dir; die Ignore-Marken stünden in `src/`) — ich liefere die
Einschätzung, wie verlangt, und entscheide nichts davon selbst.

---

## Annahmen

1. **Kein Prüffall für die Sorte-1- und Sorte-2-Zweige geschrieben.** Sie behaupten Zustände, die
   entweder mit der echten SQLite-Anbindung nicht herstellbar sind (dieselbe, im Bestand bereits
   etablierte Haltung, T-188/O-FT) oder auf diesem Windows-Rechner nicht auftreten, ohne
   `fs`/`process.platform` zu ersetzen — letzteres hätte ich zwar innerhalb meiner Testdatei-Hoheit
   tun können (`vi.mock('node:fs', …)`), aber es hätte die Zeit des Auftrags auf eine einzelne Datei
   verengt, statt die Verteilung zu zeigen, um die gebeten wurde.
2. **`repo-export.ts`s Wettlaufbedingung nicht nachgebaut.** Sie ist real und testbar, aber ein
   eigener, nicht kleiner Auftrag (zweite Verbindung, gezielter Eingriff zwischen Prüfung und
   Schreiben) — ich nenne sie als Kandidaten statt sie hier grob zu simulieren.
3. **Rot-zuerst für `attachmentsNamingFiles`-Fälle über eine isolierte Probe außerhalb des
   Bestands**, nicht über eine Quelltextänderung — weil eine kaputte Eskapierung an dieser Stelle,
   wie gemessen, das **Ergebnis** nicht ändert (nur die SQL-Vorauswahlgröße), ein Rot also gar nicht
   entstünde. Für den `exportStatus`-Fund war die klassische Quelltextänderung-und-Rückbau-Probe
   dagegen sauber möglich und wurde gefahren.

## Risiken

1. **`packages/storage` isoliert bleibt unter der Schwelle** (77,42 %, 26 Zweige Luft nach oben).
   `pnpm check` ist grün, weil `apps/local-api` mitrechnet — Risiko unverändert seit T-315/T-317,
   jetzt mit einer Zahl dazu, was es kosten würde, es zu schließen.
2. **Die Windows-Lücke in `database.ts`/`open.ts` ist ungemessen**, seit die Werkzeugkette auf
   Windows lief — dieselbe Klasse Lücke wie in der Erinnerung „Prüfläufe schreiben unter Windows in
   den echten Bestand" beschrieben, hier aber auf Meßbarkeit statt auf Seiteneffekte bezogen: Diese
   Zweige waren wahrscheinlich **nie** in diesem Team gemessen, wenn immer auf Windows entwickelt
   wurde.
3. **`repo-export.ts`s Wettlaufbedingung ist ungetestet** und ist der einzige Fund in dieser Aufgabe,
   der eine echte Nebenläufigkeitsfrage berührt, nicht nur eine defensive Prüfung.

## Offene Fragen an den Orchestrator

1. Soll die Schwelle in `vitest.config.ts` auf „je Paket" umgestellt werden, und soll dabei die
   „unerreichbar"-Sorte über `/* v8 ignore next */`-Marken aus dem Nenner genommen werden? Beides
   liegt außerhalb meiner Hoheit.
2. Soll `repo-export.ts`s Wettlaufbedingung (Zeilen ~310/424, „kann nur eintreten, wenn zwischen
   Prüfung und Schreiben etwas sich ändert") ein eigener Prüfauftrag werden?
3. Soll ich die Windows-Unerreichbarkeit in `database.ts`/`open.ts` in einem eigenen, kleineren
   Auftrag mit `vi.mock('node:fs', …)` angehen (bliebe in meiner Hoheit, da nur `test/**` betroffen
   wäre), oder ist das zu knapp am Rand von „Produktivverhalten simulieren" und lieber
   domain-dev/security-checker vorbehalten?

## Nächster Schritt

Entscheidung zur Schwelle (Frage 1), danach ggf. ein gezielter Folgeauftrag für die 10–15 real
schließbaren Zweige (Sorte 3, in der Art des `exportStatus`-Fundes) statt eines pauschalen
„100 % oder Vollständigkeit"-Auftrags.
