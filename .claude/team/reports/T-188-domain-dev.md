# T-188 — Ein Wächter, der mit einem nachweislich blinden Ausdruck mißt, und fünf Sätze in zwei Paketen

**Rolle:** domain-dev **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`

**Aufgabe:** T-188 (Welle AB) — O-GO (A-A-40), O-GC, O-FT
**Status:** fertig — mit **einem absichtlich roten Prüfpunkt**, siehe Abschnitt 1.3

---

## Artefakte

| Datei | Art | Was |
|---|---|---|
| `apps/local-api/scripts/fetch-scan.mjs` | **neu** | Die Regel „hier geht etwas ins Netz" — einmal, für beide Läufe |
| `apps/local-api/scripts/proof-callers.mjs` | geändert | Abschnitt 1 und 7 messen mit der neuen Regel; Abschnitt 6 und 8 tragen je sechs Gegenproben |
| `apps/local-api/scripts/proof-release-safety.mjs` | geändert | holt Regel und Leser aus `fetch-scan.mjs` statt sie selbst zu führen |
| `packages/domain/src/call-number.ts` | geändert | neue Konstante `CALL_NUMBER_INPUT_MESSAGE` |
| `packages/storage/src/sqlite/repo-attachments.ts` | geändert | `imageCount()`: der unerreichbare Zweig fällt nicht, seine **Antwort** ändert sich |

Nicht angefaßt: `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`, `apps/web/**`,
alle Prüfordner. Kein `package.json`, keine Modulregistrierung, keine Migration.

---

## 1 — O-GO: der blinde Ausdruck (A-A-40)

### 1.1 Berichtigung zur Fundstelle

Der Auftrag nennt `apps/local-api/scripts/caller-scan.mjs:406` und `:707`. Dort steht der Ausdruck
**nicht**: `caller-scan.mjs` hat 467 Zeilen und kennt `fetch` überhaupt nicht — es ist der reine
Leser. Der Ausdruck stand in **`apps/local-api/scripts/proof-callers.mjs`**, und dort tatsächlich
auf `:406` und `:707`. `docs/bedrohungsmodell.md` A-A-40 nennt die Datei richtig
(„`proof:callers`"); die Verwechslung ist erst im Auftrag entstanden. Behoben ist die richtige
Datei.

### 1.2 Was gebaut wurde

**Eine Regel statt zwei.** `fetch-scan.mjs` führt jetzt `stripComments`, die benannten
Nicht-Ausgänge (`fetch: app.fetch`, `app.fetch`, `options.fetch`), `FETCH_WORD` und die Leser
darüber. `proof:release-safety` und `proof:callers` holen sie beide von dort. Das ist E-086
Punkt 1 wörtlich: nicht zwei gepflegte Listen, die irgendwann zufällig gleich sortiert sind.
Der Anlaß ist der Beleg dafür — dieselbe Regel stand zweimal, und die zweite Fassung war seit
T-146 die blinde geblieben, weil niemand sie mitgezogen hat.

**`stripComments` ist längen- und zeilentreu geworden.** Ein entfernter Kommentar hinterläßt jetzt
Leerzeichen und behält seine Zeilenumbrüche. Zwei Gründe: Ein Befund kann die **Zeile** nennen
(`ui/App.tsx:58` statt nur `ui/App.tsx`), und zwei Wortbestandteile verschmelzen nicht
(`a/*x*/b` wird `a     b`, nicht `ab`). Für `proof:release-safety` ändert das nichts — es fragt
nach Vorkommen, nicht nach Abständen; gemessen: 31 bestanden, 0 fehlgeschlagen, unverändert.

Der Kommentarschritt ist hier **nicht** Bequemlichkeit, sondern tragend: `App.tsx:7` nennt `fetch`
in einem Absatz *über* die Einspeisung. Ohne ihn meldete der Wächter Prosa, und der nächste, der
ihn liest, lockerte ihn genau dort, wo er richtig ist.

**Die zulässige Ausnahme ist eine Liste von Dateien, keine Ausnahme für eine Form.**
`WEB_FETCH_HOME` und `ADDIN_FETCH_HOME` stehen ausgeschrieben im Lauf. Eine Form-Ausnahme für
`window.fetch` machte den Ausdruck wieder so blind wie den, den er ersetzt — an *jeder* Stelle
statt an einer.

**Die Gegenproben, die es bis heute nicht gab.** Je sechs, in beiden Selbstprobenteilen
(Abschnitt 6 für die Oberfläche, Abschnitt 8 für den Aufgabenbereich), gebaut wie die
vorhandenen: echter Dateibestand im Arbeitsspeicher, eine eingesetzte Datei dazu, verlangt ist
genau **ein Zuwachs** gegen den unveränderten Lauf.

1. nacktes `fetch(`
2. `globalThis.fetch(` — die Lücke aus T-143 S-1
3. `window.fetch(` — die Schreibweise, die am Baum steht
4. `self.fetch(`
5. eine Zerlegung: `const { fetch: holen } = globalThis`
6. **die Umkehrung**: Prosa, `sec-fetch-site`, `fetch_context_not_allowed` und `options.fetch(`
   dürfen **nicht** anspringen

Dazu eine siebte Messung, einmal: `BLIND_FETCH_CALL` steht in `fetch-scan.mjs` als reiner
**Meßgegenstand** und wird nirgends mehr zum Urteilen benutzt. Der Lauf verlangt, daß er vier der
fünf Schreibweisen **nicht** sieht. Damit ist der Satz „dieser Ausdruck ist blind" eine Zahl in
einem Lauf und kein Absatz in einem Bericht — und wer ihn zurücksetzt, sieht sofort, warum es
nicht geht.

**Die Zuwachsmessung ist hier keine Förmlichkeit.** Der Grundstand des Aufgabenbereichs ist heute
**nicht leer** (siehe 1.3). Ein Wächter, der erst wieder proben darf, wenn alles grün ist, probt
nie dann, wenn es darauf ankommt.

**Gegenprobe der Gegenprobe (gemessen, nicht behauptet).** `FETCH_WORD` einmal auf den alten,
blinden Ausdruck zurückgesetzt: `proof:callers` fällt von **44/1** auf **37/8** — acht Proben rot,
vier je Aufrufer —, und der echte Fund an `App.tsx` wird dabei **grün**. Das ist die Blindheit
selbst, in einem Lauf sichtbar. Danach zurückgesetzt und beides erneut gemessen.

### 1.3 Der eine rote Punkt — Wortlaut, wie verlangt

```
  FEHL  `fetch` steht im Add-in nur in api/client.ts (31 Dateien durchgesehen) — ui/App.tsx:58 — fetch: window.fetch.bind(window),
```

`apps/outlook-addin/**` gehört integration-dev. Die Stelle ist **nicht** geändert und **keine**
Ausnahme eingebaut, wie beauftragt. Zur Einordnung, damit der Orchestrator entscheiden kann:

* **Fachlich ist es kein zweiter Weg zum Dienst.** `App.tsx:58` baut keine Anfrage; es reicht dem
  Port seine Abholfunktion (`createApiClient({ …, fetch: window.fetch.bind(window) })`). Jeder
  Aufruf geht danach durch `api/client.ts`. Die Zusage aus Abschnitt 1 — „eine Datei zu lesen
  genügt" — ist **nicht verletzt**.
* **Meßtechnisch ist es ein echter Fund.** Es ist ein Zugriff auf das globale `fetch` außerhalb
  der einen Datei, und er war für diesen Wächter seit jeher unsichtbar. Der Wächter sagt jetzt,
  was er sieht.
* **A-A-40 sieht dafür ausdrücklich eine benannte Ausnahme vor** („`options.fetch(` als Port in
  `api/client.ts` **und die Einspeisung in `apps/outlook-addin/src/ui/App.tsx`**"). Der Auftrag
  dieser Welle sagt das Gegenteil. Ich habe den Auftrag befolgt und melde den Widerspruch.
* **Zwei Wege, ihn aufzulösen** — beide gehören integration-dev, keiner mir:
  1. **`ui/App.tsx` in `ADDIN_FETCH_HOME` eintragen.** Eine Zeile in `proof-callers.mjs`, und
     genau das, was A-A-40 verlangt. Der Preis: Die Datei ist ab dann für diesen Wächter ganz
     stumm — ein *echter* zweiter Weg, der später dort entstünde, fiele nicht mehr auf.
  2. **Die Einspeisung wandert nach `api/client.ts`** — der Port setzt seine Vorgabe selbst
     (`fetch: options.fetch ?? window.fetch.bind(window)` oder gleichwertig), und `App.tsx`
     nennt `fetch` gar nicht mehr. Danach ist die Liste wieder einelementig, die Ausnahme
     entfällt, und die Zusage stimmt wörtlich. **Das ist der Weg, den ich empfehle**: Er nimmt
     dem Wächter nichts weg und macht die Aussage wahr, statt sie zu erlauben.

---

## 2 — O-GC: fünf Sätze, zwei Pakete

### 2.1 Was gebaut wurde

`packages/domain/src/call-number.ts` trägt jetzt:

```
CALL_NUMBER_INPUT_MESSAGE: Readonly<Record<CallNumberRejection, string>>
```

Ausgeführt über `export * from './call-number.ts'` in `packages/domain/src/index.ts` — **keine
gemeinsame Datei angefaßt**, der Export entsteht von selbst. Gemessen: `import
{ CALL_NUMBER_INPUT_MESSAGE } from '@takt/domain'` liefert die fünf Sätze.

**Umgestellt habe ich nichts.** Beide Aufrufstellen liegen außerhalb meiner Hoheit.

### 2.2 Welche zwei Aufrufstellen sie ersetzt

| Stelle | Eigentümer | Heute | Danach |
|---|---|---|---|
| `apps/outlook-addin/src/callnumber/labels.ts` — `INPUT_REJECTION_LABEL` (Ende der Datei) | integration-dev | eigene Tafel mit fünf Sätzen | `export { CALL_NUMBER_INPUT_MESSAGE as INPUT_REJECTION_LABEL } from '@takt/domain'` oder die einzige Lesestelle `ui/TaskPane.tsx:263` direkt auf die Domäne zeigen |
| `apps/local-api/src/routes/addin/index.ts` — `CALL_NUMBER_INPUT_TEXT` (`:167-174`) | integration-dev | eigene Tafel mit fünf Sätzen | Tafel streichen, `CALL_NUMBER_INPUT_MESSAGE` aus `@takt/domain` einführen |

Zwei Nebenarbeiten für dieselbe Welle, damit nichts Falsches stehenbleibt:

* Der Kopfabsatz von `labels.ts` sagt heute, die Datei enthalte „ausschließlich das, was die
  Domäne ausdrücklich nicht führt". Für `INPUT_REJECTION_LABEL` stimmt das ab der Umstellung
  nicht mehr. `REJECTION_LABEL`, `NO_CALL_NUMBER_FOUND` und `CALL_NUMBER_BY_HAND` bleiben dort
  richtig.
* `apps/local-api/src/routes/addin/index.ts:152-166` begründet, warum es **zwei** Tafeln gibt
  (`REJECTION_TEXT` gegen `CALL_NUMBER_INPUT_TEXT`). Die Begründung bleibt gültig; nur die
  zweite Tafel zieht um.

**Was ausdrücklich nicht umzieht:** `REJECTION_LABEL` und `NO_CALL_NUMBER_FOUND` im Add-in gegen
`REJECTION_TEXT` an der Tür. Die sagen mit Absicht Verschiedenes — dort geht es um einen Wert, den
das Add-in in einer E-Mail *gefunden und nicht übernommen* hat; diese Lage gibt es an der Tür
nicht.

### 2.3 Welche der zwei auseinandergelaufenen Fassungen die richtige ist

Nachgemessen: **drei zeichengleich** (`too_short`, `forbidden_characters`, `formula_start`),
**zwei auseinander**. Beide Male gilt die Fassung des **Add-ins**, und beide Male aus einer
geschriebenen Entscheidung, nicht aus Geschmack:

**`empty` → „Die Call-Nummer ist leer. Sie darf leer bleiben."**
Die Fassung der Tür lautete „Die Call-Nummer ist leer. Lassen Sie das Feld frei, wenn es keine
gibt." Sie fällt aus zwei Gründen:
1. Sie **redet den Benutzer an, wo es ohne geht**. E-080 Punkt 4 sagt „Die beste Anrede ist keine"
   — und führt als Beispiel ausgerechnet einen Call-Nummer-Satz an.
2. Sie **nennt ein Feld**. Ein Satz für beide Flächen darf nichts voraussetzen, was nur eine von
   ihnen hat: Die Tür hat kein Eingabefeld, sie hat einen Rumpf. „Lassen Sie das Feld frei" ist
   in einer 422-Antwort an einen beliebigen lokalen Prozeß eine Anweisung ins Leere.

Nebenbefund: An der Tür ist `empty` heute **unerreichbar** — dort wird nur geprüft, was
`normalizeCallNumber` nicht schon zu `null` gemacht hat. Der Schlüssel bleibt trotzdem, weil die
**Vollständigkeit** die Zusage ist: Nimmt die Domäne einen Ablehnungsgrund auf, bricht `tsc` ab,
statt daß ein Benutzer einen Ersatztext liest.

**`too_long` → mit dem Nachsatz „Länger findet die Duplikatsuche sie nicht wieder."**
Die Fassung der Tür war der Satz ohne Nachsatz. Der Nachsatz bleibt, weil E-078 Punkt 1 ihn
ausdrücklich schützt: Gestrichen wird, was doppelt dasteht oder erklärt, was man sieht — **nicht
gestrichen wird, was eine Folge benennt.** Und die Folge ist hier die teuerste im ganzen Vorhaben:
R-15, zwei Todos zum selben Kundenvorgang, Zeit auf zwei Rechnungen. Eine Schranke ohne ihren
Grund ist an einem Eingabefeld eine Schikane; hier ist der Grund zugleich die Begründung der
ganzen Regel.

### 2.4 E-087, gemessen am 2026-09-06

Ein Suchlauf je Wortlaut über `tests/**`, `apps/*/test/**`, `packages/*/test/**`:

| Wortlaut | Treffer in Prüfdateien |
|---|---|
| „Lassen Sie das Feld frei" | **0** |
| „Sie darf leer bleiben" | **0** |
| „Duplikatsuche sie nicht wieder" | **0** |
| „Erlaubt sind Buchstaben" | **0** |
| „nicht mit =, +, - oder @ beginnen" | **0** |
| „braucht mindestens" / „darf höchstens" | 0 in Prüfdateien (zwei Treffer in `docs/`, anderer Satz) |

Symbolisch: `INPUT_REJECTION_LABEL` wird genau einmal gelesen (`ui/TaskPane.tsx:263`),
`CALL_NUMBER_INPUT_TEXT` nur innerhalb seiner eigenen Datei. `proof-addin.mjs` prüft
`REJECTION_LABEL`, **nicht** die Eingabetafel. **Kein Prüffall nagelt einen dieser fünf Sätze
fest** — die Umstellung ist ein Handgriff ohne Prüffallschaden. Stand: 2026-09-06.

---

## 3 — O-FT: der unerreichbare Zweig

**Entscheidung: er fällt nicht. Er trägt etwas, das der Beweis übersieht — und zwar nicht seine
Erreichbarkeit, sondern seine Antwort.**

Der Beweis aus T-174 ist richtig: `SELECT COUNT(*)` liefert unter SQLite immer genau eine Zeile,
`row === undefined` kann mit dem echten Treiber nicht entstehen, und ein Prüffall dafür müßte den
Adapter durch eine Attrappe ersetzen, die etwas vorgibt, was die Datenbank nicht tut. Alles das
bleibt stehen.

Übersehen hat der Beweis, **welchen Wert der unmögliche Fall zurückgab**: `0`. Und `0` ist hier
nicht neutral. Diese Zahl ist der Widerspruchsriegel aus T-179 B-1:
`apps/local-api/src/usecases/image-sweep.ts:280` fragt sie **nur** in der Lage, in der
`knownImageTargets` keiner gefundenen Bilddatei einen Anhang zuordnen konnte. `total > 0` bricht
dann ab und schreibt eine Zeile; `total === 0` gibt den Lauf frei, und er löscht **jede gefundene
Datei** als Waise. Der Fallback beantwortete den Unmöglichkeitsfall also mit genau dem Wert, der
das Gegenteil dessen auslöst, wofür die Zahl gebaut wurde — stumm.

Die Regel dagegen steht seit langem eine Datei weiter, in
`packages/storage/src/sqlite/database.ts:311-317`: *„Ein stiller Rückfall auf `''` oder `0` wäre
hier besonders teuer."* `text`, `textOrNull` und `integer` werfen deshalb. `imageCount()` war die
eine Stelle, die es nicht tat. Sie tut es jetzt.

Den Zweig zu **streichen** ginge nur mit einer Zusicherung am Übersetzer (`.get()` ist
`SqlRow | undefined`), und die verschöbe dieselbe Annahme ungeprüft in die Laufzeit — dieselbe
Falle eine Ebene tiefer.

**Der Wurf ist harmlos und geprüft:** `sweepOrphanedImages` hat um alle fünf Schritte eine Klammer,
die ausdrücklich als Zusage an den Aufrufer dasteht („Dieser Lauf kann den Start nicht
verhindern"). Ein Wurf landet dort, erzeugt `attachment_image_sweep_unavailable` und faßt nichts
an. Aus einer stillen Löschung wird ein lauter, folgenloser Abbruch.

**Der zweite Zweig** — `if (created === null)` in `create()` (`:150`) — bleibt unverändert offen
und unberührt: Er ist älter als T-174, ist kein Rückfallwert, sondern gibt bereits einen
`storage_error` zurück, und sein Kommentar sagt das Richtige („wenn er je greift, ist das ein Fund
und keine leere Antwort"). Hier war nichts zu entscheiden.

**Deckung:** unverändert ein unbetretener Zweig, jetzt mit einer Antwort, die zum Kommentar paßt.
`pnpm run test:coverage` grün, Branches 85,39 %.

---

## Zusammenfassung

Die Regel „hier geht etwas ins Netz" stand zweimal, und die zweite Fassung war zeichengleich der
Ausdruck, den T-143 an der ersten schon als blind gemessen hatte; sie steht jetzt einmal in
`fetch-scan.mjs`, beide Läufe holen sie dort, und beide proben sie mit je fünf Schreibweisen und
einer Umkehrung gegen — die Blindheit des alten Ausdrucks ist dabei selbst zu einer Zahl im Lauf
geworden. Der verbesserte Lauf findet genau das, was der Auftrag vorhergesagt hat:
`ui/App.tsx:58`, und er bleibt dafür rot, statt eine Ausnahme zu bekommen. Die fünf Sätze der
Eingabetafel liegen als `CALL_NUMBER_INPUT_MESSAGE` in `packages/domain`, mit der Entscheidung,
daß bei beiden auseinandergelaufenen Sätzen die Fassung des Add-ins gilt — einmal wegen E-080
Punkt 4 (keine Anrede, kein Feld, das die Tür nicht hat), einmal wegen E-078 Punkt 1 (ein Satz,
der eine Folge benennt, fällt nicht). Und der als unerreichbar bewiesene Zweig in `imageCount()`
fällt nicht: Sein Beweis stimmt, aber seine Antwort war `0` — der eine Wert, der den
Widerspruchsriegel gegen das Löschen des ganzen Bildbestands öffnet.

## Annahmen

1. **Der Auftrag schlägt A-A-40 in der Frage der Ausnahme.** A-A-40 nennt die Einspeisung in
   `App.tsx` als zulässige, zu benennende Ausnahme; der Auftrag verbietet ausdrücklich, sie
   einzubauen. Ich bin dem Auftrag gefolgt und melde den Widerspruch mit beiden Auflösungswegen
   (1.3).
2. **`stripComments` durfte längentreu werden.** Sie ist Teil meiner Hoheit, kein Prüffall
   importiert sie, und `proof:release-safety` mißt unverändert 31/0. Ohne sie kann kein Befund
   eine Zeile nennen.
3. **Fünf Gegenproben statt der in A-A-40 genannten vier.** A-A-40 nennt fünf Schreibweisen und
   verlangt vier Proben; ich habe je Schreibweise eine gebaut und die Umkehrung dazu.
4. **Der Name `CALL_NUMBER_INPUT_MESSAGE`** ist an `DUE_DATE_MESSAGE` angelehnt (Einzahl, nach
   Schlüssel gelesen). Wer einen anderen will, sagt es vor der Umstellung — danach kostet er zwei
   Dateien mehr.
5. **`imageCount()` wirft, statt zu antworten.** Das ist die Antwort, die `database.ts` auf
   dieselbe Frage gibt, und der Aufrufer fängt sie nachweislich.

## Risiken

* **R-neu (klein, gemeldet statt behoben): `proof:callers` ist rot, bis integration-dev
  `App.tsx` oder die Ausnahmeliste anfaßt.** Kein Abflußweg — die CSP der Hülle und die des
  Aufgabenbereichs binden beide Seiten —, aber ein roter Nachweis in der Reihe, und rote
  Nachweise gewöhnt man sich an. **Die nächste Welle sollte ihn schließen**, nicht die
  übernächste.
* **Der `request(`-Ausdruck in Abschnitt 1 trägt dieselbe Bauart wie der behobene**
  (`/(?<![\w.])request\s*[<(]/`, `:451`). Er ist gegen `client.request(` oder
  `globalThis.request(` blind. Heute gemessen: kein solcher Aufruf im Baum. Er läßt sich **nicht**
  auf dieselbe Weise weiten — `request` ist ein gewöhnliches Wort, und eine Wortgrenzensuche
  meldete Prosa und Bezeichner. Wer ihn schärfen will, braucht dafür eine eigene Aufgabe und den
  Syntaxbaum, nicht einen Ausdruck. **Benannt, nicht behoben.**
* **`fetch-scan.mjs` ist jetzt eine gemeinsame Abhängigkeit zweier Nachweisläufe.** Das ist der
  Zweck, aber es heißt auch: Wer sie ändert, ändert beide. Beide Gegenprobenreihen messen das —
  eine Rücksetzung auf den blinden Ausdruck macht 8 Proben in `proof:callers` und 4 in
  `proof:release-safety` rot (gemessen).
* **Sicherheit:** Keine neue Adresse, kein neuer Netzweg, keine Änderung an einer Route, an einem
  Schema oder an einer Migration. Die Notiz-Trennung ist unberührt (`pnpm run boundaries` sagt es
  ausdrücklich). Die fünf neuen Sätze in der Domäne nennen **keinen** abgelehnten Wert — dieselbe
  Regel wie `DUE_DATE_MESSAGE`, weil der Wert aus einer fremden E-Mail stammen kann.

## Offene Fragen

1. **An den Orchestrator: `App.tsx` — Ausnahme oder Umbau?** (1.3) Empfehlung: Umbau, Weg 2 — die
   Einspeisung wandert in `api/client.ts`, danach stimmt die Zusage wörtlich und der Wächter
   verliert keine Datei. Aufwand für integration-dev: wenige Zeilen. Falls stattdessen Weg 1,
   genügt ein Eintrag in `ADDIN_FETCH_HOME` in `proof-callers.mjs` — den mache ich, sobald die
   Entscheidung steht.
2. **An den Orchestrator, für integration-dev: die Umstellung von O-GC.** Zwei Aufrufstellen,
   beide in 2.2 benannt, dazu die zwei Kopfabsätze. Kein Prüffall hängt an einem der fünf Sätze
   (2.4, gemessen 2026-09-06).
3. **An security-checker: A-A-40 gegen den Auftrag.** A-A-40 hält die Einspeisung in `App.tsx`
   für eine zu benennende Ausnahme. Nach Weg 2 gäbe es sie gar nicht mehr — dann wäre A-A-40 in
   dem Punkt gegenstandslos statt umgangen. Bitte um Zustimmung zu dieser Lesart oder um die
   Ausnahme.
4. **An unit-tester (nächste Welle):** `packages/domain/test/call-number.test.ts` hat für
   `CALL_NUMBER_INPUT_MESSAGE` noch keinen Fall. Sinnvoll wären zwei: Vollständigkeit über alle
   fünf `CallNumberRejection`, und daß kein Satz einen abgelehnten Wert einsetzt. Dazu einer für
   `imageCount()`, der die neue Antwort festhält — er müßte den Treiber attrappieren und ist
   deshalb bewußt **nicht** von mir verlangt; die Entscheidung darüber steht in Abschnitt 3.

## Nächster Schritt

Welle AC: integration-dev stellt die zwei Aufrufstellen auf `CALL_NUMBER_INPUT_MESSAGE` um und
holt die `fetch`-Einspeisung nach `api/client.ts`; danach ist `proof:callers` wieder 45/0 und
`labels.ts` um eine Tafel und einen falsch gewordenen Absatz leichter. Der Orchestrator fährt
`proof:all` nach der Welle auf einem Baum, an dem niemand mehr schreibt.

---

## Nachweise, gefahren am 2026-09-06

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0 Fehler** (8 Projekte, dazu `typecheck:test` und `typecheck:e2e`) |
| `pnpm test` | **1439 grün, 0 rot**, 72 Dateien (der Auftrag nannte 1435/2 — die zwei aus `undoDone.test.ts` sind inzwischen grün) |
| `pnpm run boundaries` | grün, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm run proof:callers` | **44 bestanden, 1 fehlgeschlagen** — der eine Fund aus 1.3, mit den 12 neuen Gegenproben und der Blindheitsmessung grün |
| `pnpm run proof:callers` mit zurückgesetztem Ausdruck | **37/8** — die Gegenproben beißen; danach zurückgesetzt |
| `pnpm run proof:release-safety` | **31 bestanden, 0 fehlgeschlagen** (unverändert nach dem Umzug der Regel) |
| `pnpm run proof:codepoints` | **45 bestanden, 0 fehlgeschlagen** |
| `pnpm run test:coverage` | grün, Branches 85,39 % (1310/1534) |

**Nicht gefahren:** `pnpm run proof:all` und alle portgebundenen Pfade — E-083 Punkt 3, feste
Portbindung, andere Agenten in derselben Welle. Betroffen wären davon höchstens `proof:access`
und `proof:addin-wiring`; keiner von beiden liest `fetch-scan.mjs`, `call-number.ts` oder
`imageCount()`. Ein Nachweis, der nicht lief, ist kein grüner Nachweis — der Orchestrator holt
sie nach.
