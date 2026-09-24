# T-121 — Die Ränder der neuen Zeichenklasse und die neuen reinen Funktionen

```
Aufgabe: T-121 — Die Ränder der neuen Zeichenklasse und die neuen reinen Funktionen
Status: fertig
```

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (komplett, insbesondere E-062 und E-063),
`.claude/team/reports/T-117-domain-dev.md` (Risiko R1), `T-118-frontend-dev.md`,
`T-119-integration-dev.md`, `T-111-unit-tester.md`.

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/test/http/input.test.ts` | Geändert. Kopfkommentar auf drei Bauarten der Bidi-Klasse nachgezogen; neue `describe`-Gruppe mit neun Fällen für die Ränder der Marken aus T-117 (`U+061B/U+061C/U+061D`, `U+200B`–`U+200F`, ZWJ-Familien-Emoji, `U+2010`), inklusive eines gemeinsamen Checks für `nameSchema` |
| `apps/web/test/app/undoDone.test.ts` | Neu. Acht Fälle für `undoDoneAction` (Beschriftung, Erfolg mit/ohne Bewegung, Anlass `'reopen'` vs. `'booking'`, drei Fehlschlagfälle für den vorher fehlenden `catch`, B-6) |
| `apps/outlook-addin/test/text/cut.test.ts` | Neu. Zehn Fälle für `cutToCharacterBoundary`, Kern: Gegenprobe `fromBase64(toBase64(t)) !== t` bei naivem `slice`, Nachweis, dass der Schnitt an der Zeichengrenze den Weg übersteht |
| `apps/outlook-addin/test/text/hidden.test.ts` | Neu. 23 Fälle für `hasHidden`/`dropHidden`/`visibleText`: der RLO-Kernfall aus T-119, dieselben Randwerte wie in `input.test.ts` (Marken, C0/C1, Einbettungen, Isolate), die eine bewusste Abweichung von der Tür (C0-Leerraum wird zu Leerzeichen, nicht zur Marke), rechtsläufige Schrift bleibt unangetastet |

Nicht angefasst: jeglicher Produktivcode, `packages/domain/**`, `apps/local-api/src/**`,
`apps/web/src/**`, `apps/outlook-addin/src/**`, gemeinsame Dateien.

---

## Zusammenfassung

Alle drei Aufträge sind umgesetzt: die Ränder der um drei Marken (ALM, LRM, RLM) gewachsenen
Zeichenklasse sind jetzt in `apps/local-api/test/http/input.test.ts` gemessen, einschließlich des
Falls, der die Grenze nach unten festnagelt (ein ZWJ-Familien-Emoji bleibt erlaubt). Für die drei
neuen reinen Funktionen aus T-118 und T-119 gibt es je eine Testdatei: `undoDone.test.ts` deckt
den vorher fehlenden `catch` und die Verwechslungsgefahr zwischen den Anlässen `'reopen'` und
`'booking'` ab; `cut.test.ts` weist den in T-119 gemessenen Kernbefund nach, dass eine halbierte
Ersatzstelle den Base64-Hin-und-Rückweg des Exports nicht übersteht, ein an der Zeichengrenze
gekürzter Wert dagegen schon; `hidden.test.ts` prüft, dass die Add-in-Klasse an denselben Rändern
liegt wie die Tür, und dass sie markiert statt streicht (E-063). Alle vier Dateien wurden vor der
endgültigen Fassung mit bewusst falschen Erwartungen rot gefahren und danach wieder grün gestellt
— der Nachweis steht unten je Datei. `pnpm typecheck:test` und `pnpm test` (mit Abdeckung) laufen
grün: 56 Testdateien, 837 Prüfungen (Vergleichsmarke 787, +50), 90,6 % Anweisungen / 83,92 %
Zweige / 93,78 % Funktionen / 93,1 % Zeilen gesamt, alle drei 80-Prozent-Schwellen
(`packages/domain/src`, `packages/storage/src`, `packages/export/src`) gehalten.

---

## 1. Die Ränder der Zeichenklasse (`apps/local-api/test/http/input.test.ts`)

### Was am Kopf falsch stand

Der Kopfkommentar sprach von „zwei Klassen … `U+202A`–`U+202E`, `U+2066`–`U+2069`" — das ist
seit T-117 unvollständig, es sind drei Bauarten (Einbettungen/Überschreibungen, Isolate, Marken).
Der Kommentar ist nachgezogen und benennt jetzt beide Ränder der Marken: `U+061C` steht allein
zwischen `U+061B` und `U+061D`, `U+200E`/`U+200F` stehen als Paar zwischen `U+200B`–`U+200D` und
`U+2010`.

### Die neuen neun Fälle

Eine neue `describe`-Gruppe direkt vor dem Meldungstest, nach demselben Muster wie die
bestehenden Randgruppen (letztes abgewiesenes und erstes wieder erlaubtes Zeichen):

- `U+061B` erlaubt, `U+061C` (ALM) abgewiesen, `U+061D` erlaubt.
- `U+200B`/`U+200C`/`U+200D` (ZWSP/ZWNJ/ZWJ) erlaubt — in einer Schleife über alle drei.
- **Ein ZWJ-Familien-Emoji** (`\u{1f468}\u200d\u{1f469}\u200d\u{1f467}\u200d\u{1f466}`) bleibt als
  Titel erlaubt — das ist der Fall, den der Auftrag ausdrücklich verlangt, weil er die Grenze nach
  unten festnagelt: Ein Wächter, der `U+200D` mitnähme, verböte nebenbei zusammengesetzte Emoji.
- `U+200E` (LRM) abgewiesen, `U+200F` (RLM) abgewiesen.
- `U+2010` erlaubt.
- `nameSchema` weist dieselben drei Marken ab wie `titleSchema` (gemeinsame Prüfung).

Die Zeichen stehen als `\uXXXX`-Escapes, wie seit T-111 (T-112-H2) — die Datei bleibt für Git und
Semgrep Text. `file` bestätigt `JavaScript source, Unicode text, UTF-8 text` (nicht `data`), und
ein Codepunkt-Scan über die ganze Datei findet keine rohen Exemplare der abgewiesenen Klasse
außerhalb der drei unveränderten, bereits vor dieser Aufgabe vorhandenen erlaubten Randzeichen
(`U+00A0`, `U+2029`, `U+202F` — nicht in meinem neuen Block, nicht angefasst).

### Rotnachweis

Bewusst falsche Erwartungen an drei Stellen (ALM sollte angenommen werden, LRM sollte angenommen
werden, das Familien-Emoji sollte abgewiesen werden), dann zurückgestellt:

```
Vorher (bewusst falsch):
 ❯ U+061C (ALM …), die Marke selbst, wird abgewiesen
   AssertionError: expected false to be true
 ❯ ein Familien-Emoji … bleibt als Titel erlaubt …
   AssertionError: expected true to be false
 ❯ U+200E (LRM), die erste der beiden Richtungsmarken, wird abgewiesen
   AssertionError: expected false to be true
 Test Files  1 failed (1)
      Tests  3 failed | 28 passed (31)

Danach (richtiggestellt):
 Test Files  1 passed (1)
      Tests  31 passed (31)
```

---

## 2. `undoDone.test.ts` — der vorher fehlende `catch` und der Anlass

`undoDoneAction` ist eine reine Funktion (kein Baum, kein Ereignis, keine Uhr — E-062): Sie baut
ein `ToastAction`-Objekt und ruft dabei zwei Attrappen auf (`clearTodoDone` über `vi.mock`,
`toasts` als handgebautes Objekt). `doneMovementSentence`/`withMovement` aus `lib/movement.ts`
laufen echt mit, wie in `test/lib/movement.test.ts` — kein hartkodierter Satz.

Acht Fälle in drei Gruppen:

- **Beschriftung** — „Rückgängig".
- **Erfolg** — `clearTodoDone` wird mit der Todo-Kennung aufgerufen, `afterwards()` läuft, die
  Meldung ist `tone: "info"` mit dem erwarteten Titel; ohne Bewegung bleibt der Rumpf ohne
  angehängten Satz; **mit** einer Bewegung hängt der Rumpf GENAU den Satz des Anlasses `'reopen'`
  an, nicht den von `'booking'` — mit Gegenprobe, dass sich die beiden Sätze bei derselben
  Bewegung tatsächlich unterscheiden (sonst bewiese eine zufällig richtige Fassung nichts über die
  Zuordnung, wie in `movement.test.ts` vorgemacht).
- **Fehlschlag (B-6)** — `afterwards()` läuft NICHT, `toasts.failure(...)` bekommt Titel und
  `errorMessage(cause)`; ein `Error` ohne Meldungstext ergibt den festen Auffangtext; ein
  Fehlschlag geht nie an `toasts.show`.

### Rotnachweis

Drei Assertions umgekehrt (afterwards() sollte bei Erfolg NICHT laufen; afterwards() sollte bei
Fehlschlag laufen; der Rumpf sollte den `'booking'`-Satz statt des `'reopen'`-Satzes tragen):

```
Vorher (bewusst falsch):
 ❯ ruft clearTodoDone … und lädt danach über afterwards() neu
   AssertionError: expected "vi.fn()" to be called +0 times, but got 1 times
 ❯ mit einer Bewegung hängt der Rumpf GENAU den Satz des Anlasses 'reopen' an …
   Expected: "…Es steht jetzt in „Ost" und ist aus „West" verschwunden."
   Received: "…Es ist zurück in „Ost" und aus „West" verschwunden."
 ❯ scheitert clearTodoDone, läuft afterwards() NICHT …
   AssertionError: expected "vi.fn()" to be called at least once
 Tests  3 failed | 5 passed (8)

Danach (richtiggestellt):
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

Die zweite Fehlermeldung zeigt genau den Fall, den der Auftrag meint: Bei derselben Bewegung
unterscheiden sich die Sätze von `'reopen'` und `'booking'` in genau einem Wort („zurück"/„steht
jetzt") — eine Verwechslung wäre still, weil beide Sätze wohlgeformt sind.

---

## 3. `cut.test.ts` — der Kern: eine halbierte Ersatzstelle übersteht Base64 nicht

`cutToCharacterBoundary` importiert zusätzlich `toBase64`/`fromBase64` aus
`packages/export/src/base64.ts` über einen relativen Dateipfad — genau wie
`apps/outlook-addin/scripts/proof-addin.mjs:156` es an derselben Stelle bereits tut, statt eine
Paketabhängigkeit zu behaupten, die `@takt/outlook-addin` nicht führt.

Zehn Fälle: unverändert unter/am Limit; ASCII-Kürzung ohne Verlust; ein Ersatzpaar, das GENAU in
der Mitte des Limits liegt, wird als Ganzes fallen gelassen (Ergebnis `limit - 1`); liegt das
Limit genau am Ende des Paares, bleibt es vollständig (Ergebnis `limit`, Gegenprobe über
`[...result]`, dass `for...of` genau drei Codepunkte liefert); das Ergebnis ist nie länger als
`limit` und höchstens eine Einheit kürzer, über eine Schleife durch alle Limits geprüft; Limit 0
stürzt nicht ab. Der Kern:

- **Gegenprobe:** der alte, naive `slice(0, n)` hinterlässt eine halbe Ersatzstelle, die
  `fromBase64(toBase64(...))` **verändert** — `expect(...).not.toBe(naive)`.
- **Die Behebung:** `cutToCharacterBoundary` an derselben Stelle übersteht denselben Weg
  unverändert — `expect(...).toBe(cut)`.
- Derselbe Nachweis mit einem Betreff aus 50 Emoji (T-119-Bericht Abschnitt 6), einmal mit
  geradem, einmal mit ungeradem Limit.

### Rotnachweis

Zwei Assertions umgekehrt (der gekürzte Wert sollte gleich dem naiven `slice`-Ergebnis sein statt
kürzer; der Base64-Weg sollte den gekürzten Wert angeblich verändern):

```
Vorher (bewusst falsch):
 ❯ fällt das Limit MITTEN in ein Ersatzpaar …
   AssertionError: expected 'AB' to be 'AB\ufffd'
 ❯ cutToCharacterBoundary an derselben Stelle übersteht den Hin- und Rückweg …
   AssertionError: expected 'AB' not to be 'AB'
 Tests  2 failed | 8 passed (10)

Danach (richtiggestellt):
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

---

## 4. `hidden.test.ts` — dieselbe Klasse wie an der Tür, markieren statt streichen

23 Fälle. Der Kernfall aus T-119 zuerst: `Rechnung` + RLO + `gnp.exe` — `hasHidden` erkennt es,
`visibleText` ersetzt das RLO durch `HIDDEN_MARKER` (`U+FFFD`) statt die Zeile umzudrehen, und die
so entstandene Anzeige löst `hasHidden` nicht mehr aus. `dropHidden` nimmt dasselbe Zeichen
ersatzlos heraus (für einen Titelvorschlag).

**"Die Klasse muss dieselbe sein wie an der Tür"** ist wörtlich gemessen: dieselben Randwerte wie
in `input.test.ts` (`U+061B`/`U+061C`/`U+061D`, `U+200B`–`U+200D`, ein ZWJ-Familien-Emoji,
`U+200E`/`U+200F`, `U+2010`, dazu C0/C1, Einbettungen/Überschreibungen, Isolate), jeweils gegen
alle drei Funktionen geprüft. Das ist unabhängig von, und kein Ersatz für, Abschnitt 17 in
`proof-addin.mjs` (der die Tür selbst befragt statt eine Liste abzuschreiben — genau der Fehler,
an dem T-119 die alte Fassung von Abschnitt 16 gemessen hat); es ist eine zweite, unabhängig
geschriebene Randmessung mit denselben Werten, damit eine künftige Abweichung an zwei Stellen
sichtbar wird statt an einer.

**Die eine bewusste Abweichung von der Tür** ist eigens ausgestellt, damit sie nicht als Lücke
missverstanden wird: `U+0009`–`U+000D` (Tab, LF, VT, FF, CR) lösen `hasHidden` NICHT aus,
`dropHidden` lässt sie stehen, `visibleText` macht daraus genau ein Leerzeichen statt der Marke.
Die Ränder dieser Ausnahme (`U+0008` davor, `U+000E` danach) sind wieder die Marke.

**Rechtsläufige Schrift bleibt unangetastet** (E-063): ein erfundener Beispieltext auf Arabisch
und Hebräisch löst nichts aus und kommt durch alle drei Funktionen unverändert zurück.

### Rotnachweis

Drei Assertions umgekehrt (ALM sollte keine Wirkung haben; das RLO-Beispiel sollte von
`visibleText` unverändert gelassen werden; der C0-Leerraum sollte zur Marke statt zum Leerzeichen
werden):

```
Vorher (bewusst falsch):
 ❯ visibleText ersetzt das RLO durch die Marke …
   Expected: "Rechnung\u202egnp.exe"   Received: "Rechnung\ufffdgnp.exe"
 ❯ U+061C (ALM), die Marke selbst: erkannt, gestrichen, markiert …
   expected true to be false
 ❯ visibleText macht aus dem C0-Leerraum GENAU EIN Leerzeichen, keine Marke
   Expected: "Vor\ufffdNach"   Received: "Vor Nach"
 Tests  3 failed | 20 passed (23)

Danach (richtiggestellt):
 Test Files  1 passed (1)
      Tests  23 passed (23)
```

---

## Was ich liegen lasse (E-062)

Alle vier Dateien prüfen ausschließlich reine Funktionen — kein Baum, kein Ereignis, keine Uhr.
Konkret NICHT geprüft, mit Begründung:

- **Kein Baustein rendert etwas.** `undoDoneAction` gibt ein `ToastAction`-Objekt zurück; ob der
  `ToastProvider` daraus tatsächlich eine sichtbare Meldung mit bedienbarem „Rückgängig"-Knopf
  macht, ist Sache des e2e-testers (wie schon bei `ToastContext.evict()` in T-111/E-062).
- **Kein Aufgabenbereich wird gerendert.** Ob `<Foreign>` (`<bdi>` + `visibleText`) im Add-in
  tatsächlich verhindert, dass ein RLO die Anzeige umdreht, lässt sich nur im Browser sehen (T-119
  hat das selbst so gemessen, mit einer Wegwerfseite). Ich prüfe nur die reine Funktion
  `visibleText`, die dahinter steckt.
- **Kein Netzumlauf.** `clearTodoDone` ist in `undoDone.test.ts` eine Attrappe (`vi.mock`); ob der
  lokale Dienst tatsächlich mit `poolMovement: null` oder einer Bewegung antwortet, ist Sache der
  Anwendungsfall-Tests in `apps/local-api/test/usecases/**` (bereits vorhanden, T-111).
- **Keine Zeit.** Keine der vier Dateien braucht `setTimeout`, `page.clock` oder Ähnliches.

Nichts davon habe ich abgeschwächt oder einen Testrahmen dafür gefordert — nach E-062 gehört das
dem e2e-tester.

---

## Annahmen

1. **Rotnachweis über bewusst falsche Erwartungen, nicht über fehlenden Produktivcode.** Alle vier
   Dateien testen bereits fertig implementierten Code (T-117, T-118, T-119 haben ihn geschrieben,
   bevor ich meinen Auftrag bekam). Echtes TDD (Test vor Implementierung) ist hier nicht möglich,
   ohne Produktivcode zu schreiben — das ist mir verboten. Ich habe deshalb wie T-111 bewusst
   falsche Erwartungen eingebaut, den roten Lauf gemessen und protokolliert, und danach die
   richtige Erwartung wiederhergestellt. Jede Datei ist so mindestens einmal nachweislich rot
   gewesen, bevor sie grün war.
2. **Die Zeichenklasse ist während der Aufgabe nach `packages/domain/src/characters.ts`
   umgezogen** (domain-dev, parallel). `apps/local-api/src/http/input.ts` exportiert
   `titleSchema`/`nameSchema` weiterhin unverändert nach außen — mein Test prüft die öffentliche
   Schnittstelle, nicht den internen Ort der Regel, und blieb während des ganzen Umzugs grün
   (mehrfach gemessen). Nichts ist mir dadurch rot gelaufen; siehe Risiken für die neue,
   noch ungetestete Datei.
3. **`hidden.test.ts` misst dieselben Randwerte wie `input.test.ts` UNABHÄNGIG**, nicht über einen
   gemeinsamen Import der Zeichenklasse. Ein Import von `apps/local-api/src/http/input.ts` in
   einen Add-in-Test wäre genau die Paketgrenze, die T-119 ausdrücklich nicht verletzen wollte
   (`@takt/local-api` gehört nicht in die Abhängigkeitsliste des Add-ins, auch nicht nur für
   Tests) — stattdessen stehen dieselben Werte als eigene Konstanten in beiden Dateien. Das ist
   schwächer als eine echte Gleichheitsprüfung (wie sie `proof-addin.mjs` Abschnitt 17 gegen die
   Tür selbst führt), aber es hält dieselbe Behauptung an einer zweiten, unabhängig geschriebenen
   Stelle fest.
4. **Für `cut.test.ts` wurde ein relativer Dateipfad zu `packages/export/src/base64.ts` gewählt**,
   kein `vi.mock` und keine neue Abhängigkeit — genau der Weg, den `proof-addin.mjs:156` an
   derselben Stelle bereits geht. Eine Attrappe von `toBase64`/`fromBase64` hätte den eigentlichen
   Nachweis (der Wert übersteht die ECHTE Kodierung) unmöglich gemacht.
5. **Escape-Folgen statt roher Zeichen, konsequent für alle vier Dateien** (T-112-H2). Beim
   Schreiben von `hidden.test.ts` ist mir zunächst genau der Fehler unterlaufen, den T-111 beheben
   musste: rohe unsichtbare/Bidi-Zeichen im Quelltext (die Datei war zwischenzeitlich laut `file`
   `data`, nicht Text). Behoben über eine Neufassung mit benannten Konstanten
   (`ALM = "\u061c"` usw.); ein Codepunkt-Scan über die fertige Datei findet keine rohen Exemplare
   der gefährlichen Klasse mehr. Normale Schrift (Umlaute, Arabisch, Hebräisch, Emoji) steht als
   `\uXXXX`-Escape in Zeichenketten, die deutschen Kommentare selbst in normalem UTF-8 — das
   Ergebnis ist etwas strenger escaped als der Codebase-Stil an manchen Stellen, aber sicher
   nachweisbar text- und diff-fähig.
6. **`apps/outlook-addin/test/**` ist neu** (T-119 hatte festgestellt, dass es diesen Ordner noch
   nicht gibt). Ich habe keine `tsconfig.test.json` und keinen `vitest`/`package.json`-Eintrag für
   `@takt/outlook-addin` angelegt — das wären `tsconfig*.json`/`package.json`, beides
   Orchestrator-Hoheit. Die Tests laufen trotzdem unter `pnpm test`, weil die Wurzel-
   `vitest.config.ts` bereits `apps/*/test/**` einschließt; siehe Risiken für die
   Typprüfungslücke.

---

## Risiken

1. **`apps/outlook-addin/test/**` hat keine eigene `tsconfig.test.json` und ist deshalb NICHT Teil
   von `pnpm typecheck:test`.** Die Datei existiert für `@takt/local-api`, `@takt/web` und die
   anderen Pakete, aber nicht für `@takt/outlook-addin` — das ist eine `tsconfig*.json` und gehört
   dem Orchestrator. `pnpm test` (Vitest, esbuild-transpiliert) läuft trotzdem grün und prüft
   Verhalten vollständig; nur die statische Typprüfung dieser beiden neuen Dateien läuft nicht
   automatisch mit. Ich habe sie deshalb selbst mit einem eigenständigen `tsc --noEmit`-Aufruf
   gegen dieselben Schalter wie `tsconfig.base.json` geprüft (keine Fehler) — das ist **nicht**
   Teil des offiziellen Nachweises, nur meine eigene Absicherung. Vorschlag: eine
   `tsconfig.test.json` für `apps/outlook-addin` nach demselben Muster wie
   `apps/local-api/tsconfig.test.json`, plus Eintrag in `typecheck:test` — beides
   Orchestrator-Hoheit.
2. **`packages/domain/src/characters.ts` liegt bei 48,27 % Anweisungen / 42,1 % Zweigen** (aus dem
   Gesamtlauf), deutlich unter der 80-Prozent-Schwelle für einzelne Dateien — die
   Schwellenprüfung in `vitest.config.ts` rechnet aber pro Glob (`packages/domain/src/**`)
   aggregiert und nicht je Datei, und das Aggregat liegt bei 86,19 % Anweisungen / 84,68 % Zweigen,
   also über 80 %; `pnpm test:coverage` endet mit Status 0. `characters.ts` ist neu von domain-dev
   in dieser Welle angelegt worden (nicht Teil meines Auftrags, kein Bericht dazu vorhanden) und
   hat keine eigene Testdatei unter `packages/domain/test/**`. Das ist eine Lücke, die ich nicht
   gefüllt habe, weil sie außerhalb des Auftragstextes lag und ich ohne einen Bericht dazu die
   Regeln der Funktion nicht kenne, statt sie zu erfinden.
3. **Keine neue Sicherheitsfläche.** Alle vier Dateien rufen ausschließlich bereits vorhandene,
   exportierte Funktionen auf. Keine echten Call-Nummern, Kundennamen oder Zugangsdaten — alle
   Namen, Todo-Titel und Beispieltexte sind erfunden (Kesselwartung, Ost/West wie in
   `movement.test.ts`, „Rechnung…gnp.exe" als beschriebene Angriffsform aus dem T-119-Bericht,
   keine echte Datei).
4. **`hidden.test.ts` ist stellenweise strenger escaped als der übrige Codebase-Stil** (Annahme 5)
   — ein Review könnte das als Bruch mit der Konvention lesen, die normale Umlaute/Emoji roh im
   Quelltext hält. Ich habe mich bewusst für mehr statt weniger Vorsicht entschieden, weil genau
   diese Datei die gefährlichen Zeichen zum Thema hat.

---

## Offene Fragen

1. **Soll `apps/outlook-addin` eine eigene `tsconfig.test.json` bekommen und in `typecheck:test`
   aufgenommen werden?** (Risiko 1.) Ohne das bleibt die statische Typprüfung der neuen Tests
   außerhalb des offiziellen Nachweispfads, obwohl das Verhalten über `pnpm test` vollständig
   geprüft ist.
2. **Wer testet `packages/domain/src/characters.ts` und `enumeration.ts`?** (Risiko 2.) Beide sind
   neu und ohne eigene Testdatei unter `packages/domain/test/**`. Das gehört in meine Hoheit,
   aber ohne einen Bericht von domain-dev zu den Regeln dieser Dateien wollte ich sie nicht selbst
   erfinden.
3. **Die zweite Randmessung in `hidden.test.ts` ist kein Ersatz für eine echte
   Gleichheitsprüfung** (Annahme 3) — falls die Zeichenklasse künftig an einer dritten Stelle
   landet (z. B. wenn `characters.ts` aus `@takt/domain` auch dem Add-in zugänglich gemacht wird,
   siehe T-119-Bericht offene Frage 1), sollte diese Datei durch eine echte Gleichheitsprüfung
   gegen die geteilte Quelle ersetzt werden, statt Werte doppelt zu pflegen.

---

## Nächster Schritt

1. **Orchestrator:** Offene Frage 1 entscheiden (`tsconfig.test.json` für `apps/outlook-addin`);
   danach ist der Nachweispfad für diese beiden neuen Testdateien vollständig automatisiert.
2. **domain-dev:** Kurzer Bericht zu `characters.ts`/`enumeration.ts` (Regeln, Randfälle), damit
   ich die fehlende Testabdeckung dort nachziehen kann, statt sie zu raten.
3. **Reviewer-Wiedervorlage:** Die vier Dateien zusammen mit T-117/T-118/T-119 prüfen — sie hängen
   an denselben Verträgen (Zeichenklasse, `poolMovement`-Anlässe, Base64-Rundweg).

---

## Nachweis

Alle Läufe am 2026-09-04, jeder in eine eigene Datei umgeleitet, Endstatus über `echo $?`
unmittelbar nach dem Befehl gelesen (keine Pipe).

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm run typecheck:test` | **0** | sechs Testkonfigurationen (deckt `apps/outlook-addin/test/**` nicht ab, siehe Risiko 1) |
| `pnpm run typecheck` | **0** | acht Pakete, `typecheck:test`, `typecheck:e2e` |
| `pnpm run test` | **0** | 56 Testdateien, **837 Prüfungen** (Vergleichsmarke 787, +50: 9 in `input.test.ts`, 8 in `undoDone.test.ts`, 10 in `cut.test.ts`, 23 in `hidden.test.ts`) |
| `pnpm run test:coverage` | **0** | 90,6 % Anweisungen / 83,92 % Zweige / 93,78 % Funktionen / 93,1 % Zeilen gesamt; alle drei Schwellen (`packages/domain/src`, `packages/storage/src`, `packages/export/src`, je 80 %) gehalten |

Zusätzlich, außerhalb des offiziellen Nachweises (Risiko 1): `npx tsc --noEmit` mit denselben
Schaltern wie `tsconfig.base.json` gegen `apps/outlook-addin/test/text/{hidden,cut}.test.ts` —
Endstatus **0**, keine Fehler.

Vier isolierte Rot-vor-Grün-Nachweise (siehe Abschnitte 1–4 oben), je mit bewusst falscher
Erwartung, gemessenem Fehlschlag und anschließender Richtigstellung. Kein `git commit`, kein
`stash`, kein `checkout`, kein fremder Prozess beendet. Ports 17843/17844 nicht belegt — alle vier
Testdateien laufen ohne Netzumlauf, ausschließlich gegen reine Funktionen und Attrappen.
