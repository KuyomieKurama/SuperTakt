Aufgabe: T-007 — Den Exportvorlagen-Motor bauen (rot nach grün)

Status: blockiert

---

## Die Blockade in einem Satz

`packages/export` darf ausschließlich `@takt/domain/export` einbinden (R-06, von
`pnpm boundaries` erzwungen) — und dieser Einstiegspunkt führt `roundToQuarterHours` nicht.
Der Motor kann die Rundung also weder aufrufen noch nachbauen; das eine ist unmöglich, das
andere verboten.

**Gemessen, nicht vermutet.** Mit einer Attrappe, die genau die fehlende Zeile ergänzt, sind
**84 von 85** Fällen grün. Der 85. scheitert an einem Rechenfehler in der Testdatei selbst
(siehe Befund 2), nicht am Motor.

---

## Artefakte

Neu unter `packages/export/` — acht Quelldateien, 1170 Zeilen:

```
package.json          @takt/export, Abhängigkeit ausschließlich @takt/domain (workspace:*)
tsconfig.json         types: [] — kein `fs`, kein `Buffer`, keine Umgebung benennbar
src/base64.ts    175  toBase64 / fromBase64, UTF-8 von Hand kodiert
src/merge-notes.ts 84 mergeBookingNotes, NOTE_SEPARATOR
src/model.ts     180  Typen der Vorlage, des Ergebnisses und der Fehler
src/sources.ts   176  geschlossene Quellenliste, Zugriffsfunktionen, Gruppenaggregat
src/template.ts  245  validateExportTemplateField, validateExportTemplateDefinition,
                      BUILTIN_EXPORT_TEMPLATE
src/render.ts    138  renderExportGroup — der eine Renderer für Vorschau und Datei
src/plan.ts      131  planExportRun, serializeExportRows
src/index.ts      41  öffentliche Fläche
```

Geändert: `pnpm-lock.yaml` (Eintrag für das neue Arbeitsbereichspaket; Installieren war
ausdrücklich erlaubt).

**Nicht angefasst:** `packages/export/test/**`, `packages/domain/**`, `packages/storage/**`,
`apps/**`, alle Wurzeldateien außer der Sperrdatei, `docs/**`. `packages/domain/src/export.ts`
ist byteweise unverändert — Prüfsumme vor und nach meiner Arbeit
`e2a09309b1968a997bc9884958e585a05090cfab2b699ade5e3ac915ad080264`.

Das Outlook-Add-in ist **nicht** Teil dieser Lieferung. Begründung unter „Nächster Schritt".

---

## Zusammenfassung

Der Vorlagen-Motor steht vollständig: Base64 über UTF-8, die Zusammenführung der Leistungstexte,
die geschlossene Quellenliste mit ausgeschriebenen Zugriffsfunktionen, die Feldprüfung, der eine
Renderer für Vorschau und Datei und der Plan eines Exportlaufs. Er ist an zwei Stellen an die
Domäne gebunden und baut nichts nach: `roundToQuarterHours` für die Tagessumme und
`quarterHoursToExportNumber` für den Zahlwert des Feldes `Zeit`. Genau diese beiden Aufrufe
lassen sich nicht auflösen — `@takt/domain/export` exportiert sie nicht, und ein anderer
Einstiegspunkt ist dem Paket verwehrt.

Ich habe die Regel **nicht** in `packages/export` nachgebaut. Eine zweite Fassung der Rundung
wäre eine zweite Wahrheit über einen Rechnungsbetrag; der Auftrag verbietet sie zweimal
ausdrücklich, und sie ist der teuerste Fehler, den dieses Projekt machen kann. Ich habe die
Datei mit der fehlenden Zeile auch nicht angefasst: Sie gehört dem domain-dev, und die
Berechtigungsprüfung des Werkzeugs hat den Schreibzugriff darauf ebenfalls abgewiesen.

---

## Befund 1 — die eigentliche Blockade, mit Messung und fertiger Zeile

`packages/domain/src/export.ts` bindet `rounding.js` nur als **Typ** ein:

```ts
import type { RoundingMode } from './rounding.js';
```

Damit ist `RoundingMode` über `@takt/domain/export` benennbar, `roundToQuarterHours` aber nicht
aufrufbar. Der Übersetzer sagt es genau so:

```
src/sources.ts(18,10): error TS2305: Module '"@takt/domain/export"'
                       has no exported member 'roundToQuarterHours'.
src/render.ts(15,10):  error TS2305: Module '"@takt/domain/export"'
                       has no exported member 'quarterHoursToExportNumber'.
```

Zur Laufzeit: `TypeError: roundToQuarterHours is not a function`, 54 von 85 Fällen.

**Die Zeile, die fehlt** — in `packages/domain/src/export.ts`, direkt unter dem vorhandenen
`import type { RoundingMode } from './rounding.js';`:

```ts
export { quarterHoursToExportNumber, roundToQuarterHours } from './rounding.js';
```

Dazu drei Punkte, die sie meines Erachtens unstrittig machen:

1. **Der Wächter erlaubt sie ausdrücklich.** `check-export-boundary.mjs` lässt in `export.ts`
   genau zwei Modulbezeichner zu: `./kernel.js` und `./rounding.js`. Ein Re-Export aus
   `rounding.js` ist damit der vorgesehene Weg, nicht eine Lücke. `pnpm boundaries` bleibt grün.
2. **T-009 hat sie bereits vorausgesetzt.** Der eigene Bericht, „Nächster Schritt" Punkt 1:
   „`roundToQuarterHours` und `quarterHoursToExportNumber` stehen bereit. Der Motor muss die
   Rundung **nicht** nachbauen und darf es auch nicht." Der Wille ist eindeutig; nur die Zeile
   fehlt.
3. **Sie ist additiv.** Kein Verhalten ändert sich, keine Regel wandert, die Regel bleibt in
   `rounding.ts`. `packages/domain` übersetzt vorher wie nachher fehlerfrei.

**Nachweis, dass es genau diese eine Zeile ist.** Ich habe außerhalb des Repositorys eine
Attrappe gebaut, die `packages/domain/src/export.ts` unverändert weiterreicht und nur die beiden
Funktionen ergänzt, und die Testreihe mit einem Alias darauf laufen lassen:

```
$ pnpm exec vitest run --config <attrappe> packages/export/test/
Test Files  1 failed | 4 passed (5)
     Tests  1 failed | 84 passed (85)
```

84 von 85. Der eine Rest ist Befund 2. Im Repository ist von dieser Messung nichts verblieben.

---

## Befund 2 — TP-B64-07 prüft sich selbst falsch (Testdatei, nicht meine)

`packages/export/test/base64.test.ts`, Zeilen 61–62:

```ts
const longText = 'Erfundener Fülltext für Performanz- und Blockgrenzen-Test. '.repeat(160);
expect(longText.length).toBeGreaterThan(10_000);
```

Das Textstück ist 59 Zeichen lang, 59 × 160 = **9440**. Die Vorbedingung schlägt fehl, bevor
`toBase64` überhaupt aufgerufen wird — der Fall „sehr lange Notiz übersteht Blockgrenzen" wird
also derzeit **gar nicht geprüft**, auch nicht in einem grünen Lauf. `repeat(170)` ergibt 10 030
Zeichen und trifft die Absicht.

Der Motor ist daran nicht schuld, und ich habe das unabhängig belegt: gegen Node als
Vergleichsmaßstab liefert `toBase64` für jeden Fall **byteweise dasselbe** wie
`Buffer.from(text, 'utf8').toString('base64')`, einschließlich eines Textes mit 10 030 Zeichen,
aller vier Blockgrenzenreste, Umlaute, ß, Akzente und Emoji; der Rückweg ergibt jedes Mal exakt
den Ausgangstext, auch in der Zeichenlänge:

```
gleich wie Node  Rückweg exakt  "Übertragung mit Ärger, Grüße"
gleich wie Node  Rückweg exakt  "Straße, groß, Fuß"
gleich wie Node  Rückweg exakt  "Fertig 🎉 vielen Dank 👍"
gleich wie Node  Rückweg exakt  Erfundener Fülltext … (10030 Zeichen)
Fehler: 0
```

Die Datei gehört dem unit-tester (T-010b). Gemeldet, nicht geändert.

---

## Der Motor, wie er arbeitet — Nachweis unter der Attrappe

**Standardvorlage, 10 + 20 + 5 Minuten am selben Tag, eine Zeile:**

```json
{
  "Call": "TCK-000042",
  "Zeit": 0.75,
  "Notiz": "UsO8Y2tydWYgZW50Z2VnZW5nZW5vbW1lbjsgQW5hbHlzZSBnZW1hY2h0OyBGaXggZWluZ2VzcGllbHQ7IFRpY2tldCBnZXNjaGxvc3Nlbg==",
  "WindowsUser": "t.beispiel"
}
```

Base64 rückwärts: `Rückruf entgegengenommen; Analyse gemacht; Fix eingespielt; Ticket
geschlossen`. Darin steckt alles auf einmal: 0,75 statt dreimal aufgerundet 1,00 (E-020, E-008);
der abschließende Punkt von „Ticket geschlossen." ist gefallen, das Semikolon **mitten** in
„Analyse gemacht; Fix eingespielt" steht unverändert (E-028); der Umlaut übersteht den Hin- und
Rückweg. 16 Minuten ergeben 0,50 — der Unterscheidungsfall aus E-008.

**Eine abweichende Vorlage mit anderen Feldern, anderer Reihenfolge und einem bedingten Feld:**

```json
{ "Tag": "2026-01-15", "Titel": "Beispiel", "Tags": "Support",
  "Sekunden": 2100, "Buchungen": 3, "Ticket": "TCK-000042" }
```

`Sekunden` ist die **ungerundete** Summe — Kontrollspalte, keine Abrechnungsgröße. `Ticket` trägt
die Bedingung `todo.callNumber is_set`; ohne Call-Nummer fehlt der Schlüssel vollständig, er steht
nicht mit `null` da.

**E-034, ein Lauf über zwei Gruppen, eine davon ohne Leistungstext:**

```json
{ "zeilen": 1,
  "ausgelassen": [ { "group": { "todoId": "leer", "seconds": 1800, "quarters": 2, … },
                     "reason": "empty_note" } ],
  "buchungen": 1, "viertelstunden": 2, "markieren": ["voll-te-0"] }
```

Die leere Gruppe hält den Lauf nicht auf, ihre Buchung steht **nicht** in `timeEntryIds` und wird
folglich nicht markiert — sie bleibt offen und erscheint beim nächsten Mal wieder.

---

## Antworten auf die drei offenen Fragen aus T-009

**(a) Heißt die Transformation `quarter_hours_to_number`?** Ja. Der Name ist übernommen, in
`model.ts` mit der Begründung festgehalten. An Migration 0004 ist deswegen nichts zu ändern.

**(b) Deutsch oder englisch — `roh` oder `raw`?** Der Motor liest `roh`. Nicht aus Vorliebe: Die
Namen stehen so in Abschnitt 8 der Spezifikation (`roh | base64 | … | datum(format) | konstante`)
und so in den Tests aus T-010, die ich nicht ändern darf. Das steht in Spannung zu E-015 („technische
Schlüssel englisch"); ich halte die Spannung fest, statt sie eigenmächtig aufzulösen — es ist eine
Entscheidung des Orchestrators, keine des Motors.

**(c) `booking.*` in den Testdateien.** Erledigt, der unit-tester hat in T-010b auf `group.*`
umgestellt. Der Motor kennt ausschließlich die zwölf `ExportSourcePath`-Werte, und
`Record<ExportSourcePath, true>` bindet die Auswahlliste am Übersetzer an die Domäne: Kommt dort
eine Quelle dazu, bricht `packages/export`, statt sie stillschweigend zu übergehen.

---

## Befund 3 — die Standardvorlage in Migration 0004 ist für den Motor unlesbar

Migration 0004 schreibt in `export_template.definition`:

```json
{"name":"Call","source":"todo.callNumber","transform":"raw"}
```

Der Motor erwartet — nach Spezifikation und Tests — den Schlüssel `transformation` und den Wert
`roh`. Gemessen:

```
validateExportTemplateDefinition(<Definition aus 0004>)
-> ok: false, "Feld 1: Die Transformation ist unbekannt.
              Wählbar sind: roh, base64, quarter_hours_to_number."
```

Das ist das richtige Verhalten (laut, nicht still), aber es heißt: Die mitgelieferte, **nicht
löschbare** Vorlage wäre unbenutzbar — genau die eine, die der Benutzer nicht reparieren kann.
Es ist derselbe Fehler, den 0004 für `booking.*` behoben hat, eine Ebene tiefer.

Nötig ist eine Migration 0005 (0004 ist gelaufen und wird nach dem Prüfsummenmechanismus nicht
umgeschrieben), die `"transform"` durch `"transformation"` und `"raw"` durch `"roh"` ersetzt.
`packages/storage/migrations` gehört dem domain-dev — gemeldet, nicht geändert. Ich habe die
Vorlage zusätzlich als `BUILTIN_EXPORT_TEMPLATE` im Motor hinterlegt, damit Vorschau und Tests
nicht an der Datenbank hängen.

---

## Befund 4 — Abdeckung: 74,68 %, die Schwelle verlangt 80 %

Unter der Attrappe gemessen, `packages/export/src/**`:

| Datei | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| merge-notes.ts | 100 | 100 | 100 | 100 |
| sources.ts | 97,14 | 95,65 | 100 | 96,96 |
| render.ts | 96,55 | 85,00 | 100 | 95,83 |
| base64.ts | 92,30 | 84,90 | 100 | 91,54 |
| template.ts | 48,14 | 40,38 | 75 | 48,14 |
| plan.ts | 0 | 0 | 0 | 0 |
| **gesamt** | **74,68** | **69,38** | **86,96** | **73,39** |

Ich verhandle die Zahl nicht — `vitest.config.ts` sagt ausdrücklich, dass sie nicht nachträglich
bequem gemacht wird. Die Lücke liegt an Funktionen, die T-010 nicht kennen konnte, weil es den
Motor noch nicht gab. Auch ohne `plan.ts` bliebe die Zweigabdeckung bei 72,08 %; die Lücke lässt
sich nicht durch Weglassen schließen, sondern nur durch Tests. Vorschlag für einen Nachtrag an den
unit-tester, rund fünfzehn Fälle:

- `planExportRun`: gemischter Lauf aus exportierbarer und nicht exportierbarer Gruppe;
  `entryCount` zählt Buchungen und nicht Zeilen; `totalQuarters` summiert über die Zeilen;
  `timeEntryIds` enthält **keine** Buchung einer ausgelassenen Gruppe (das ist der Fall, an dem
  eine falsche Umsetzung Arbeitszeit verschwinden ließe); `previouslyExportedCount` nach R-10.
- `serializeExportRows`: zwei Läufe über denselben Bestand ergeben byteweise dieselbe Datei.
- `validateExportTemplateDefinition`: kein Objekt, unbekannte Fassung, leere Feldliste,
  Fehlerdurchreichung mit Feldnummer, Erfolgsfall.
- `validateExportTemplateField`, Bedingungszweige: Bedingung ist kein Objekt, gesperrte
  Bedingungsquelle, unbekannter Vergleich, `is_not_set`.
- `fromBase64` mit einem Zeichen außerhalb des Alphabets; ungültige UTF-8-Folge.
- Die beiden Schutzzweige (`render.ts` Zeile 54, `sources.ts` Zeile 179): ein Feld, das an der
  Prüfung vorbei mit unbekannter Quelle in den Renderer gelangt, ergibt `null` — nie einen
  geratenen Wert. Das ist die Stelle, an der `todo.notiz` landete, wenn es je durchkäme.

---

## Werkzeugkette

| Befehl | Ergebnis |
|---|---|
| `pnpm boundaries` | **grün** — 8 Quelldateien geprüft, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm contrast` | **grün** — 0 von 150 Paaren durchgefallen |
| `pnpm build` | **grün** |
| `pnpm typecheck` | **rot** — ausschließlich die zwei TS2305 aus Befund 1; `domain`, `storage`, `web` je Exitcode 0 |
| `vitest packages/{domain,storage}/test/` | **grün**, 111 von 111 — durch diese Aufgabe unberührt |
| `vitest packages/export/test/` | **rot**, 54 von 85 (Befund 1) + 1 (Befund 2) |
| dieselbe Reihe mit Attrappe | 84 von 85 |

---

## Annahmen — was ich entschieden habe, ohne zu fragen

1. **Base64 ist von Hand kodiert, nicht über `Buffer` und nicht über `btoa`.** `btoa` kann kein
   „Ä", `Buffer` gibt es in der Oberfläche nicht — und dort entsteht dieselbe Zeile für die
   Vorschau (R-17). Jeder der beiden Wege wäre in einer der beiden Laufzeiten falsch oder gar
   nicht vorhanden. Deshalb steht in `tsconfig.json` `types: []`: Der Motor kann eine
   umgebungsabhängige Umsetzung nicht einmal benennen. Ein alleinstehendes Surrogat wird zu U+FFFD,
   wie es `TextEncoder` tut; durchgereicht ergäbe es WTF-8, das der Empfänger nicht lesen kann.

2. **Auslassungspunkte bleiben stehen.** E-028 lässt „einen abschließenden Punkt" fallen. Bei
   „kommt später…" ist der letzte Punkt aber Inhalt und keine Interpunktion am Rand, und E-028
   verbietet Kürzung abseits der Randnormalisierung. Ein Punkt fällt deshalb nur, wenn ihm kein
   zweiter vorausgeht. Die Schleife läuft, bis nichts mehr abfällt — „erledigt.;" verliert erst
   das Semikolon, dann den Punkt; ein einzelner Durchlauf ließe je nach Reihenfolge eines von
   beiden stehen und erzeugte „.; " in der Datei.

3. **Jede unbekannte Quelle wird mit `export_source_forbidden` abgewiesen, nicht nur die
   notizartigen.** So steht es im Kommentar an `ExportSourcePath`. Der Namensabgleich auf
   „note/notiz/vermerk" entscheidet nichts — er wählt nur die Meldung, damit jemand, der
   `todo.notiz` versucht, erfährt, dass das eine Grenze ist und kein Tippfehler.
   `validation_error` bleibt für fehlenden Namen, fehlende Quelle, unbekannte Transformation und
   kaputte Bedingung.

4. **Eine Gruppe ist nur dann wegen leerer Notiz nicht exportierbar, wenn die Vorlage überhaupt
   ein Feld mit `group.bookingNotes` führt.** Die Regel hängt am konfigurierten Feld, nicht an der
   Buchung an sich — sonst blockierte eine leere Leistung auch eine Vorlage, die sie gar nicht
   ausgibt.

5. **`null` bleibt `null`.** Keine Transformation erfindet einen Wert: Base64 über ein fehlendes
   Feld ergäbe die Kodierung des Wortes „null", `quarter_hours_to_number` über etwas, das keine
   Zahl ist, ergäbe `NaN` in einer Rechnung. Beides ergibt `null`.

6. **`planExportRun` gehört in den Motor, die Transaktionsklammer nicht.** Der Plan entsteht
   vollständig, bevor irgendetwas geschrieben wird — genau das macht A-8.8 durchsetzbar: Ein
   Fehlschlag beim Rendern kann keine halbe Datei und keine halbe Markierung hinterlassen, weil es
   zu diesem Zeitpunkt noch nichts zurückzunehmen gibt. Das Schreiben und die Klammer selbst
   liegen in `ExportPort.runExport` (`packages/storage`) und in der Route; beides gehört dem
   domain-dev, und der Motor darf `@takt/storage` nicht einmal benennen.

7. **Der Sortierschlüssel wird nicht neu erfunden.** `mergeBookingNotes` sortiert nicht; die
   Reihenfolge kommt aus `groupExportCandidates`. Eine zweite Sortierstelle wäre eine zweite
   Stelle, an der die Reihenfolge zwischen zwei Vorschauen springen könnte.

---

## Risiken

1. **Solange Befund 1 offen ist, ist `pnpm check` rot** — und zwar an einer Stelle, die wie ein
   Fehler in `packages/export` aussieht, es aber nicht ist. Wer die zwei TS2305 für einen Tippfehler
   im Motor hält, sucht an der falschen Stelle.
2. **Feldnamen, die wie Zahlen aussehen, verschieben sich in der Zeile.** JavaScript stellt
   ganzzahlige Schlüssel eines Objekts nach vorn; eine Vorlage mit einem Feld namens „2026" bekäme
   dieses Feld an erster Stelle, unabhängig von seiner Position im Editor. Fachlich folgenlos — das
   Abrechnungstool liest nach Schlüsselnamen —, und Vorschau und Datei bleiben identisch, weil beide
   dasselbe Objekt benutzen (R-17). Erwähnt, damit es niemanden im Vorlageneditor überrascht.
3. **Die Notiz-Trennung ist geprüft, aber die Prüfung hängt an Befund 1.** Der Eigenschaftstest
   über 42 Vorlagen (Klartext **und** base64) ist unter der Attrappe grün; im Repository läuft er
   derzeit nicht. Bis die fehlende Zeile steht, ist die wichtigste Prüfung des Projekts nicht in
   der regulären Reihe aktiv.
4. **`plan.ts` und `validateExportTemplateDefinition` sind ungeprüfter Code auf dem Weg zur
   Rechnung** (Befund 4). Sie sind sorgfältig geschrieben, aber „sorgfältig" ist kein Nachweis.

---

## Offene Fragen

1. **An den domain-dev, eine Zeile:** `export { quarterHoursToExportNumber, roundToQuarterHours }
   from './rounding.js';` in `packages/domain/src/export.ts`. Der Wächter erlaubt sie, T-009 hat
   sie vorausgesetzt, sie ändert kein Verhalten. Danach sind 84 von 85 Fällen grün — gemessen.
2. **An den domain-dev, Migration 0005:** `"transform":"raw"` → `"transformation":"roh"` in der
   Standardvorlage (Befund 3). Ohne sie ist die mitgelieferte Vorlage unbenutzbar.
3. **An den unit-tester:** `repeat(160)` → `repeat(170)` in `base64.test.ts` (Befund 2), sowie der
   Nachtrag von rund fünfzehn Fällen aus Befund 4.
4. **An den Orchestrator:** `roh` gegen `raw` — die Vorlagensprache ist deutsch (Spezifikation
   Abschnitt 8, Tests aus T-010), die übrigen technischen Schlüssel sind englisch (E-015). Der
   Motor folgt der Spezifikation. Wenn das falsch ist, ändern sich Tests **und** Migration, nicht
   nur der Motor — deshalb frage ich, statt zu entscheiden.
5. **An den Orchestrator:** Die Transformationen `datum(format)` und `konstante` aus Abschnitt 8
   habe ich **nicht** gebaut. Kein Test verlangt sie, keine Entscheidung nennt sie, und ungeprüfter
   Code auf dem Weg zu einer Rechnung ist teurer als ein fehlendes Feld. `ExportTransformation` ist
   eine abschließende Aufzählung; sie zu erweitern ist eine Zeile plus Tests.

---

## Nächster Schritt

1. **Die eine Zeile aus Offene Frage 1.** Danach `pnpm exec vitest run packages/export/test/` —
   erwartet: 84 von 85, der Rest ist Befund 2.
2. **Befund 2 und der Testnachtrag** beim unit-tester, in einem Zug. Erst danach ist die
   Abdeckungsschwelle erfüllbar und `pnpm check` als Ganzes grün.
3. **Migration 0005** beim domain-dev, damit die Standardvorlage aus der Datenbank auch geladen
   werden kann und nicht nur die aus dem Code.
4. **Das Outlook-Add-in als eigene Aufgabe.** Es ist eigenständig groß — Office.js über Context7,
   der konfigurierbare reguläre Ausdruck samt `ecc:regex-vs-llm-structured-text`, das Angebot auf
   ein vorhandenes Todo zu buchen, Tags/Ordner/Pools über die lokale API, Standard-Tags bei Anlage,
   dazu die Routen unter `apps/local-api/src/routes/addin/` und eine Gestaltung ohne
   Referenzbilder aus dem Designsystem heraus. Es hängt zudem an T-011 (Token) und an eben diesen
   Routen. In dieselbe Aufgabe wie den Motor gepresst wäre beides halb fertig; ich melde es als
   eigenen Schnitt zurück, wie im Auftrag vorgesehen.

---
---

# Nachtrag vom 2026-09-01 — Blockade gelöst, `roh` auf `raw` nachgezogen

Status danach: **teilweise** — der Motor ist fertig und die Blockade ist fort. Offen ist nur noch
der Nachzug in vier Testdateien, die dem unit-tester gehören, und der Testnachtrag aus Befund 4.

## Was ich geändert habe

`ExportTransformation` heißt jetzt `'raw' | 'base64' | 'quarter_hours_to_number'`. Sechs
Fundstellen in drei Dateien, alle innerhalb meiner Hoheit:

```
src/model.ts:88      Aufzählungswert 'roh' -> 'raw'
src/model.ts:72-91   die Begründung ausgetauscht: sie rechtfertigte bis eben den deutschen
                     Namen. Jetzt steht dort, warum der Wert englisch ist (E-015) und warum
                     die Migration hierher nachzieht und nicht umgekehrt.
src/template.ts:41   KNOWN_TRANSFORMATIONS
src/template.ts:240  BUILTIN_EXPORT_TEMPLATE, Feld `Call`
src/template.ts:243  BUILTIN_EXPORT_TEMPLATE, Feld `WindowsUser`
src/render.ts:44     der Zweig in applyTransformation
```

Keine Testdatei angefasst. `grep -rn "'roh'" packages/export/src/` findet nichts mehr.

## Befund 1 ist geschlossen

Der Re-Export steht in `packages/domain/src/export.ts`, Zeilen 43–44. `pnpm typecheck` läuft
über alle sieben Pakete durch, Exitcode 0 — die beiden TS2305 sind fort. Die zweite Zeile
(`RoundingMode`, `SecondsPerQuarterHour`) brauche ich derzeit nicht, weil ich den Modus über
`ExportSystemContext['roundingMode']` benenne; sie schadet nicht und macht die Absicht lesbarer.

## Befund 3 ist geschlossen — gegen die Migration selbst gemessen

Ich habe die Definition **wörtlich aus `0005_builtin_template_field_key.up.sql` gelesen**, nicht
abgeschrieben, und durch den Motor geschickt:

```
aus 0005 gelesen: {"version":1,"fields":[
  {"name":"Call","source":"todo.callNumber","transformation":"raw"},
  {"name":"Zeit","source":"group.quarters","transformation":"quarter_hours_to_number"},
  {"name":"Notiz","source":"group.bookingNotes","transformation":"base64"},
  {"name":"WindowsUser","source":"system.windowsUser","transformation":"raw"}]}

validateExportTemplateDefinition -> ok
gerenderte Zeile (10 + 20 + 5 Minuten):
{ "Call": "TCK-000042", "Zeit": 0.75,
  "Notiz": "UsO8Y2tydWYgZW50Z2VnZW5nZW5vbW1lbjsgQW5hbHlzZSBnZW1hY2h0OyBGaXggZWluZ2VzcGllbHQ7IFRpY2tldCBnZXNjaGxvc3Nlbg==",
  "WindowsUser": "t.beispiel" }
Notiz zurück: Rückruf entgegengenommen; Analyse gemacht; Fix eingespielt; Ticket geschlossen
```

Die mitgelieferte Vorlage aus der Datenbank ist damit lesbar, ergibt 0,75 statt dreimal
aufgerundet 1,00, verliert den abschließenden Punkt und behält das Semikolon mitten im Text.

## Befund 5 (neu) — der Nachzug betrifft **vier** Testdateien, nicht eine

Der Auftrag nennt `templates.test.ts`. Gemessen sind es vier, davon eine außerhalb von
`packages/export`:

| Datei | Was | Fälle |
|---|---|---|
| `packages/export/test/templates.test.ts` | `'roh'` → `'raw'`, 9 Fundstellen (Zeilen 37, 79, 82, 108, 109, 136, 145, 162, 167) | 4 rot |
| `packages/export/test/note-boundary-property.test.ts` | `'roh'` → `'raw'`, 9 Fundstellen (63, 74, 84, 88, 96, 200, 212, 215, 218) | 2 rot |
| `packages/export/test/exportability.test.ts` | `'roh'` → `'raw'`, 2 Fundstellen (39, 105) | 0 rot — **grün aus dem falschen Grund**, siehe unten |
| `packages/storage/test/builtin-template-migration.test.ts` | `transform` → `transformation`, drei `toEqual`-Erwartungen (61, 66, 70) | 3 rot |

Die vierte Zeile ist keine Folge meiner Umbenennung, sondern von Migration 0005: Die Datei
erwartet weiterhin den alten Schlüssel `transform`. Sie war vor 0005 grün und ist es jetzt nicht
mehr. Ich melde sie, damit sie niemandem als Nebenwirkung des Motors erscheint.

## Befund 6 (neu, wichtig) — der R-18-Eigenschaftstest ist derzeit halb blind

Das ist der Punkt, den ich nicht in einer Tabelle verstecken will.

Ein Feld mit dem inzwischen unbekannten Wert `'roh'` fällt im Renderer in den Schutzzweig und
ergibt `null` — nachgemessen:

```
mit "roh": {"Leistung":null}
mit "raw": {"Leistung":"OFFEN-BUCHUNG-MARKER-71ab"}
```

Für die Suche nach dem Vermerk-Marker ist das folgenlos: Was nichts ausgibt, gibt den Marker
erst recht nicht aus. Genau deshalb ist es gefährlich. `generateTemplate` in
`note-boundary-property.test.ts` verteilt `'roh'` und `'base64'` je zur Hälfte; ich habe den
Generator mit denselben Startwerten nachgerechnet:

```
Felder in den 40 erzeugten Vorlagen: 230
davon mit dem alten Wert "roh":     115  (50 Prozent)
diese rendern derzeit null statt eines Wertes
```

**115 von 230 Feldern des wichtigsten Tests dieses Projekts prüfen im Augenblick nichts.** Die
42 Vorlagenfälle sind grün, aber die Hälfte ihrer Felder ist leer — das ist wörtlich die
Konstellation, die R-18 beschreibt: „Der Test wäre grün und die Grenze trotzdem gebrochen."

Dass es auffällt, ist das Verdienst des unit-testers: Seine beiden Gegenproben — „eine erlaubte
Quelle wird dagegen angenommen" und „Vorlagen mit Notiz-Feld enthalten den Buchungsmarker
tatsächlich" — sind rot. Ohne sie wäre die Abschwächung unsichtbar geblieben. Dasselbe gilt für
`exportability.test.ts`: Der Fall „eine Vorlage ohne Leistungsfeld ist von der Leer-Notiz-Regel
unberührt" ist grün, obwohl sein `Call`-Feld inzwischen `null` liefert — der Test sieht nur auf
`kind`, nicht auf den Wert.

Ich habe bewusst **keinen** Übergangspfad gebaut, der `'roh'` weiterhin akzeptiert. Ein zweiter
zulässiger Name für dieselbe Sache ist genau die tolerante Auslegung, die E-017 an den Quellen
verbietet, und der Zustand wäre dauerhaft statt für die Länge einer Welle. Bis der Nachzug
erfolgt ist, weist der Motor lieber sichtbar ab, als still das Falsche zu tun.

## Werkzeugkette nach dem Nachtrag

| Befehl | Ergebnis |
|---|---|
| `pnpm typecheck` | **grün**, alle sieben Pakete, Exitcode 0 |
| `pnpm boundaries` | **grün** — „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm build` | **grün** |
| `pnpm contrast` | **grün** — 0 von 150 Paaren durchgefallen |
| `pnpm exec vitest run` | 186 von 196 grün; 10 rot: 6 Nachzug, 3 Migration 0005 gegen `packages/storage/test`, 1 Fixtur (Befund 2) |
| Abdeckung `packages/export/src` | 74,04 % Stmts / 67,28 % Branch — die Lücke ist unverändert `plan.ts` und `validateExportTemplateDefinition` (Befund 4) |

Kein einziger der zehn roten Fälle liegt in `packages/export/src`. Sie liegen sämtlich in
Testdateien, die dem unit-tester gehören.

## Offene Fragen (Nachtrag)

1. **An den unit-tester, jetzt vier Dateien statt einer** — die Tabelle in Befund 5. Wichtig ist
   die Reihenfolge: `note-boundary-property.test.ts` zuerst, weil dort bis dahin die Hälfte der
   Prüffläche leerläuft (Befund 6).
2. **An den Orchestrator:** `packages/storage/test/builtin-template-migration.test.ts` erwartet
   noch `transform`. Das ist eine Folge von Migration 0005 und liegt weder bei mir noch, streng
   genommen, im Auftrag des Nachzugs — bitte mit einplanen.
3. Befund 2 (`repeat(160)` → `repeat(170)`) und Befund 4 (Testnachtrag zur Abdeckung) stehen
   unverändert.

## Nächster Schritt (Nachtrag)

1. Der Nachzug in den vier Testdateien. Erwartet danach: 195 von 196 grün, der Rest ist Befund 2.
2. Der Testnachtrag aus Befund 4, damit `pnpm check` als Ganzes grün wird.
3. **T-019, das Outlook-Add-in.** Angenommen; ich bin bereit, sobald die beiden Punkte stehen.
