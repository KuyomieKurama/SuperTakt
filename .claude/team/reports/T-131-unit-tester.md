# T-131 — Eine Gleichheitsprüfung statt dreier Randtabellen

```
Aufgabe: T-131 — Eine Gleichheitsprüfung statt dreier Randtabellen
Status: fertig
```

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` komplett, insbesondere **E-063** alle fünf Punkte
(Punkt 5 ist der Auftrag), eigene Berichte `T-121-unit-tester.md` (Frage 3) und
`T-127-unit-tester.md` (Risiko 2, von mir selbst benannt), `T-123-integration-dev.md` (Muster und
Messung: Gegenprobe A, 163 grüne Verhaltensprüfungen bei einer zeichengleichen zweiten Fassung).

Stand vor der Arbeit: Branch `status-als-regelterm`, Commit `3f45d51`.

---

## 1. Ausgangslage — drei unabhängig geschriebene Abschriften

Vor dieser Aufgabe stand die vollständige Randtabelle der Zeichenklasse (C0, C1, DEL, die drei
Bidi-Bauarten, ihre erlaubten Nachbarn) an drei Stellen, jede für sich von Hand getippt:

| Datei | Rolle |
|---|---|
| `apps/local-api/test/http/input.test.ts` | die Tür (`titleSchema`/`nameSchema`) |
| `apps/outlook-addin/test/text/hidden.test.ts` | das Add-in (`dropHidden`/`hasHidden`/`visibleText`) |
| `packages/domain/test/characters.test.ts` | die Domäne selbst (seit T-127) |

Das ist dasselbe Muster, das die T-117/T-119-Regression im Produktivcode möglich gemacht hat, nur
eine Ebene tiefer, in den Tests: Erweitert die Domäne die Klasse, weiß eine Abschrift nichts davon,
bis jemand sie von Hand nachträgt — und bis dahin bleibt sie grün, weil sie den neuen Codepunkt
schlicht nie fragt.

## 2. Was gemacht wurde

Die Randtabelle bleibt an **einer** Stelle: `packages/domain/test/characters.test.ts` — **nicht
angefasst**, sie ist bereits die Quelle. Die beiden anderen Dateien wurden umgebaut, jede auf das,
was sie WIRKLICH prüfen muss und was nicht dieselbe Frage ist wie an den anderen beiden Stellen.

### `apps/local-api/test/http/input.test.ts` — die zod-Bindung

**Vorher:** 31 Tests, davon ~22 in fünf `describe`-Blöcken, die von Hand getippte Codepunkte
(`'\u061c'`, `'\u202e'`, …) gegen `titleSchema`/`nameSchema` hielten — eine Abschrift der Domänen-
Randtabelle.

**Nachher:** Die Randwerte werden zur LAUFZEIT aus `FORBIDDEN_NAME_CHARACTERS` und
`CONTROL_WHITESPACE` (`@takt/domain`) abgeleitet — für jeden Bereich beide Grenzen und ihre beiden
unmittelbaren Nachbarn (26 Codepunkte, Stand heute). Kein Codepunkt steht mehr als Literal in der
Datei. `it.each` hält `titleSchema` UND `nameSchema` gegen `isForbiddenNameCharacter` aus der
Domäne — pro Codepunkt ein eigener Testfall, damit ein Fehlschlag sofort zeigt, welcher Randwert
betroffen ist.

**Was das jetzt prüft, und warum das NICHT dieselbe Frage ist wie `characters.test.ts`:**
`characters.test.ts` fragt "ist die Klasse richtig" (welche Codepunkte gehören dazu). Diese Datei
fragt "wendet DIESE Tür GENAU diese Klasse an" — die **zod-Bindung**. Das ist ein Verhalten, kein
Wert: `titleSchema.safeParse(...)` läuft wirklich durch `.refine((value) =>
!hasForbiddenNameCharacter(value), …)`, nicht durch eine Behauptung. Ein Wächter, der
`withoutControlCharacters` entfernte oder durch eine eigene, unabhängige Prüfung ersetzte, würde
hier sofort auffallen — unabhängig davon, ob `characters.test.ts` weiterhin grün bleibt (das prüft
nur die Domäne, nicht, ob die Tür sie tatsächlich befragt).

**Was NICHT wegfällt (Auftrag Punkt 2):** genau das eben Beschriebene — die zod-Bindung — ist der
Gegenstand, der bleiben MUSS, und er ist nach dem Umbau strenger geprüft als vorher: Vorher wurden
9 handverlesene Randfälle gegen die Tür gehalten; jetzt sind es alle 26 aus der tatsächlichen
Domänenliste, für beide Schemas einzeln, und die Liste wächst automatisch mit, wenn die Domäne
wächst (siehe Gegenprobe unten).

Zusätzlich behalten, weil sie etwas anderes prüfen als die Randtabelle: die drei "gültige Namen"-
Tests (Umlaute, Emoji, Leerzeichen innen, Trimmen — allgemeines Schemaverhalten, keine
Randklassenfrage), der Familien-Emoji-Anwendungsfall (eine ECHTE mehrteilige ZWJ-Folge statt eines
Einzelzeichens — die Randtabelle bestätigt nur, dass U+200D für sich erlaubt ist, nicht dass ein
zusammengesetztes Emoji als Ganzes durchgeht), ein Wächter gegen eine leer oder alles erfassende
abgeleitete Liste (sonst wäre jeder Vergleich sinnlos grün) und die beiden Meldungstests (B-4.3
Punkt 5 — die Meldung ist fest und nennt den Wert nicht; das ist eine Eigenschaft der
Fehlerbehandlung, keine Randklassenfrage).

**Vorher/Nachher:** 31 → 59 Tests (die Zahl STEIGT, weil `it.each` jeden der 26 abgeleiteten
Codepunkte einzeln gegen beide Schemas hält, statt mehrere Codepunkte in einem `it`-Block zu
bündeln — siehe Abschnitt 5 zur Testzahl).

### `apps/outlook-addin/test/text/hidden.test.ts` — Gleichheit der Objekte

**Vorher:** 23 Tests, davon ~20 eine zweite, unabhängig geschriebene Randtabelle (dieselben
Codepunkte wie in `input.test.ts`, von Hand ein zweites Mal getippt) gegen `dropHidden`/
`hasHidden`/`visibleText`.

**Nachher:** Seit T-123 ist `hidden.ts` eine reine Wiederausfuhr aus `@takt/domain` — keine eigene
Implementierung mehr, kein Verhalten, das noch unabhängig verifiziert werden könnte. Ein
Verhaltensvergleich (dieselben Randwerte hier wie dort, beide grün) kann genau das nicht mehr
prüfen, was hier zählt: **ob es sich um dieselben Funktionsobjekte handelt**, nicht nur um gleich
aussehende. Die Datei prüft das jetzt über vier `toBe`-Vergleiche (nicht `toEqual`):

```ts
expect(dropHidden).toBe(dropHiddenCharacters);
expect(hasHidden).toBe(hasHiddenCharacter);
expect(visibleText).toBe(domainVisibleText);
expect(HIDDEN_MARKER).toBe(DOMAIN_HIDDEN_MARKER);
```

Dazu ein einziger, benannter Rauchtest (der RLO-Kernfall aus T-119), der über die ADD-IN-NAMEN
aufgerufen wird — er prüft, dass die Umleitung selbst funktioniert (kein Vertauschen der drei
Namen, z. B. `dropHidden`, das eigentlich an `hasHiddenCharacter` hinge). Das ist rechnerisch von
der Gleichheitsprüfung mitabgedeckt (`dropHidden` müsste dann `hasHiddenCharacter` SEIN, und
`toBe(dropHiddenCharacters)` würde das sofort verfehlen), bleibt aber als lesbares Beispiel stehen,
weil ein Leser sonst nirgends sieht, was diese drei Funktionen tun.

**Was das jetzt prüft, und warum das NICHT dieselbe Frage ist wie an den beiden anderen Stellen:**
`characters.test.ts` prüft die Klasse, `input.test.ts` prüft, dass die Tür sie WIRKLICH anwendet
(Verhalten). Diese Datei prüft, dass das Add-in KEINE eigene Anwendung hat, sondern buchstäblich
dieselbe Funktion — eine Frage der Herkunft, nicht des Verhaltens. Zwei Funktionen, die sich nur
gleich verhalten, können sich beim nächsten Mal verschieden verhalten (das ist exakt T-117/T-119
passiert); ein einziges Objekt kann das nicht.

**Vorher/Nachher:** 23 → 5 Tests.

## 3. Gegenprobe — zeigt, was vorher niemand konnte

Da mir Produktivcode nicht gehört (`packages/domain/**`, `apps/*/src/**` sind fremde Hoheit, und
ich rühre auch nicht probeweise daran, selbst mit Rückstellung — anders als T-123/T-127, die in
ihrer EIGENEN Hoheit experimentiert haben), habe ich beide Gegenproben vollständig AUSSERHALB des
Arbeitsbaums geführt: in
`/tmp/claude-1000/-home-kerem-Projects-SuperTakt/4f131c0f-ab80-4924-8b6b-4af64055e5b4/scratchpad/t131/`.
Die realen Dateien im Repository wurden dafür an keiner Stelle geschrieben — verifiziert über
`git status`/`git diff` vor und nach jedem Experiment (siehe Nachweis unten): außer meinen beiden
Zieldateien ist nichts von mir verändert.

### Gegenprobe A — Add-in: die alte, zeichengleiche Fassung (real, aus der Git-Historie)

Statt eine Fassung zu ERFINDEN, habe ich die ECHTE historische Fassung von `hidden.ts` genommen —
Commit `55ed731` (Welle J, nach T-119, vor T-123), git-verifiziert per `git show`. Diese Fassung
hat ihre EIGENE Kopie der Klasse (Regex-basiert) und ist zum heutigen Zeitpunkt zeichengleich mit
der Domäne — exakt die Fassung, die T-123s eigene Gegenprobe A probeweise wieder eingesetzt hatte.

Zwei Testdateien in `scratchpad/.../gegenprobe-addin/`, beide gegen diese mutierte Fassung:

- **ALT** (Verhalten, sechs Fälle nach dem alten Muster: ALM, LRM/RLM, Familien-Emoji, RLO-Kernfall,
  NUL/Isolat, C0-Leerraum) → **6/6 grün**. Die mutierte Fassung verhält sich exakt wie die Domäne,
  ein Verhaltensvergleich bemerkt nichts.
- **NEU** (Gleichheit der Objekte, drei Fälle: `dropHidden`/`hasHidden`/`visibleText` gegen die
  ECHTEN Domänenfunktionen) → **3/3 rot**:

```
AssertionError: expected [Function dropHidden] to be [Function dropHiddenCharacters]
AssertionError: expected [Function hasHidden] to be [Function hasHiddenCharacter]
AssertionError: expected [Function visibleText] to be [Function visibleText]
Test Files  1 failed | 1 passed (2)
     Tests  3 failed | 6 passed (9)
```

Das ist dieselbe Zahl, die T-123 in seinem eigenen Nachweis gefunden hat (dort: 163 grüne
Verhaltensprüfungen, hier: 6 von 6 des ALTEN Testmusters) — nur diesmal an meinen eigenen,
umgebauten Testdateien gemessen statt am integration-dev-Skript.

### Gegenprobe B — Tür: eine Domäne, die morgen um einen Bereich wächst

Zweites Experiment, andere Frage: nicht "gibt es eine zweite Fassung", sondern "bemerkt eine feste,
von Hand getippte Liste eine künftige Erweiterung der Klasse" (genau das, was bei T-117 an der
Add-in-Abschrift schiefging). Eine Hilfsdatei `future-characters.ts` liest die ECHTEN, unveränderten
`FORBIDDEN_NAME_CHARACTERS` und fügt EINEN erfundenen, hypothetischen Bereich hinzu (`U+2028`, frei
gewählt, keine echte Erweiterung). Gegen die ECHTE, unveränderte `titleSchema` (heute, ohne
`U+2028`):

- **ALT** (24 feste, von Hand getippte Codepunkte, genau die Werte, die früher in `input.test.ts`
  standen) → **24/24 grün** — die Liste fragt `U+2028` nie, weil sie geschrieben wurde, bevor es
  diesen (hypothetischen) Fall gab.
- **NEU** (Codepunkte aus `future-characters.ts` zur Laufzeit abgeleitet, 24 Fälle) → **23/24
  grün, 1 rot**, genau bei `U+2028`:

```
AssertionError: expected true to be false // Object.is equality
- Expected: false
+ Received: true
Test Files  1 failed | 1 passed (2)
     Tests  1 failed | 47 passed (48)
```

Das ist die zweite Eigenschaft des Umbaus: Nicht nur "keine zweite Fassung" (Gegenprobe A), sondern
"eine Erweiterung der Domäne wird SOFORT sichtbar, ohne dass jemand die Testdatei anfasst" — genau
die Lücke, an der T-117/T-119 vorbeigelaufen sind.

### Nichts im Repository verändert

Beide Experimente liefen ausschließlich gegen Dateien im Scratch-Verzeichnis; die einzigen
Importe zurück ins Repository waren LESENDE Importe der echten, unveränderten Produktivdateien
(`packages/domain/src/characters.ts`, `apps/local-api/src/http/input.ts`). `git status` vor und
nach beiden Experimenten zeigt ausschließlich meine beiden Zieldateien als geändert (siehe
Nachweis) — es gab nichts zurückzusetzen, weil nichts im Arbeitsbaum geschrieben wurde. Das ist
eine bewusste Abweichung vom `sha256sum -c`/`diff`-Verfahren aus T-127: Jenes Verfahren setzt
voraus, dass man in der eigenen Hoheit vorübergehend schreibt und danach zurückstellt: Produktivcode
gehört nicht zu meiner Hoheit, auch nicht vorübergehend, deshalb der Umweg über eine vollständig
externe Kopie. Das Ergebnis ist dasselbe: ein gemessener Unterschied zwischen altem und neuem
Testansatz, ohne dass am Ende irgendetwas im Repository anders dasteht als vorher.

## 4. Ein Zwischenfall während der Arbeit — nicht meiner

Während des zweiten Gegenprobe-Laufs schlug ein `vitest`-Transform einmalig mit
`Expected identifier but found "\u202e"` in `packages/domain/src/characters.ts:187` fehl. Das war
KEIN von mir verursachter Zustand: `git status`/`git diff` zu diesem Zeitpunkt zeigten, dass
domain-dev in derselben Welle parallel an genau dieser Datei arbeitet (T-128, ein Wächter gegen
rohe Steuerzeichen sowie die Konsolidierung der vier `codePointAt(0)`-Absicherungen zu
`codePointOf`, siehe `git diff` — nachvollzogen, nicht verändert). Der Fehlschlag war ein
transienter Lesezustand mitten in einem laufenden Schreibvorgang einer anderen Sitzung; ein
Wiederholungslauf Sekunden später war sauber (siehe Nachweis, Datei `08-...log`, zweiter Lauf).
Betroffen war ausschließlich mein Scratch-Experiment, kein Testlauf im Arbeitsbaum — `pnpm run
test`/`test:coverage` im Repository liefen davon unberührt grün (vorher UND nachher gemessen).
Ich melde das hier, wie im Auftrag verlangt, mit Zeile — nicht als Blockade, weil nichts, was mir
gehört, dadurch rot geblieben ist.

## 5. Testzahl — warum sie steigt statt sinkt

Der Auftrag erlaubt ein Sinken der Zahl mit Begründung; bei mir ist das Gegenteil eingetreten:

| Datei | vorher | nachher |
|---|---|---|
| `apps/local-api/test/http/input.test.ts` | 31 | 59 |
| `apps/outlook-addin/test/text/hidden.test.ts` | 23 | 5 |
| **Summe beider Dateien** | **54** | **64** |
| Gesamtsuite | 991 | 1001 |

Der Anstieg bei `input.test.ts` kommt von `it.each`: Die 26 aus der Domäne abgeleiteten Codepunkte
laufen jetzt EINZELN gegen `titleSchema` UND einzeln gegen `nameSchema` (52 Fälle), statt wie vorher
mehrere Codepunkte in Sammel-`it`-Blöcken zu bündeln (die alte Datei hatte 5 `describe`-Blöcke mit
oft mehreren `expect`s pro `it`). Das ist kein Mehr an geprüfter Aussage gegenüber vorher, sondern
mehr AUFLÖSUNG derselben Aussage — ein Fehlschlag zeigt jetzt sofort, welcher einzelne Randwert
betroffen ist, statt "einer von mehreren in diesem Block". Der Rückgang bei `hidden.test.ts` (23 →
5) ist der eigentliche Effekt des Auftrags: 20 Verhaltensfälle sind weg, weil sie dieselbe Aussage
wie in `characters.test.ts` nochmal trafen, ohne dass eine Behauptung dort etwas maß, was hier nicht
schon galt (`hidden.ts` hat seit T-123 kein eigenes Verhalten mehr zu prüfen). Nichts davon misst
weniger als vorher — die Randtabelle selbst ist unverändert vollständig in
`packages/domain/test/characters.test.ts` geprüft (137 Fälle, von mir nicht angefasst).

## 6. Nachweis

Alle Läufe am 2026-09-04, jeder in eine eigene Datei umgeleitet
(`/tmp/claude-1000/-home-kerem-Projects-SuperTakt/4f131c0f-ab80-4924-8b6b-4af64055e5b4/scratchpad/t131/`),
Endstatus über `echo $?` unmittelbar nach dem Befehl gelesen (keine Pipe).

| Befehl | Endstatus | Ergebnis | Datei |
|---|---|---|---|
| `pnpm run typecheck:test` (vor der Änderung) | **0** | sieben Konfigurationen | `00-...` |
| `pnpm run test:coverage` (vor der Änderung) | **0** | 58 Dateien, **991 Tests**, 91,32/84,91/94,29/93,95 % | `01-...` |
| `pnpm exec vitest run apps/local-api/test/http/input.test.ts` | **0** | 1 Datei, **59 Tests** | `02-...` |
| `pnpm exec vitest run apps/outlook-addin/test/text/hidden.test.ts` | **0** | 1 Datei, **5 Tests** | `03-...` |
| `pnpm run typecheck:test` (nach der Änderung) | **0** | unverändert grün | `04-...` |
| `pnpm run test:coverage` (nach der Änderung) | **0** | 58 Dateien, **1001 Tests**, 91,37/84,9/94,3/93,95 %, alle drei 80-%-Schwellen gehalten | `05-...` |
| `pnpm run test` (nach der Änderung) | **0** | 58 Dateien, 1001 Tests | `06-...` |
| Gegenprobe A (Add-in), ALT gegen mutierte Fassung | 0 (Datei) | **6/6 grün** | `07-...` |
| Gegenprobe A (Add-in), NEU gegen mutierte Fassung | 1 (Datei, erwartet) | **3/3 rot** | `07-...` |
| Gegenprobe B (Tür), ALT gegen künftige Domäne | 0 (Datei) | **24/24 grün** | `08-...` |
| Gegenprobe B (Tür), NEU gegen künftige Domäne | 1 (Datei, erwartet) | **23/24 grün, 1 rot bei U+2028** | `08-...` |
| Kontrolllauf beider Zieldateien nach den Gegenproben | **0** | 2 Dateien, 64 Tests | `09-...` |
| `pnpm run typecheck:test` (final) | **0** | unverändert grün | `10-...` |
| `pnpm run test:coverage` (final) | **0** | 58 Dateien, **1001 Tests**, 91,37/84,9/94,3/93,95 %, alle drei Schwellen gehalten | `11-...` |
| `git status`/`git diff` (Kontrolle) | — | ausschließlich meine beiden Zieldateien geändert, keine Rest-Artefakte im Repository | — |

Codepunkt-Scan (C0 ohne Tab/LF/CR, C1, DEL, Soft-Hyphen, ALM, ZWSP–RLM, LS/PS,
Einbettungen/Überschreibungen, Word-Joiner-Bereich, Isolate, BOM, `U+FFFD`) über beide geänderten
Dateien: **keine** rohen Treffer. `file` bestätigt beide als `Unicode text, UTF-8 text`, nicht
`data`.

**Eine eigene Anmerkung zur Werkzeugkette dieser Aufgabe, weil sie den Nachweis selbst betrifft:**
Beim ersten Entwurf beider Dateien sind mir Bidi-/Format-Zeichen (ZWJ, RLO) und ein echtes
Steuerzeichen (BEL) trotz Absicht, ausschließlich Escape-Folgen zu schreiben, mehrfach als ROHE
Zeichen in den Quelltext gerutscht — einmal wurde ein BEL beim Transport sogar spurlos entfernt,
statt als sichtbares Zeichen zu erscheinen, was den Fehler zunächst verschleiert hat. Jede
betroffene Stelle wurde über eine gezielte Python-Ersetzung (nicht über erneutes Eintippen)
korrigiert und durch einen vollständigen Codepunkt-Scan beider Dateien gegengeprüft, bis der Scan
leer blieb. Das ist derselbe Mechanismus, den T-127 in Abschnitt 2 seines Berichts beschreibt ("man
sieht dabei nichts, auch dann nicht, wenn man aktiv danach sucht") — hier nicht in einem Bericht,
sondern in Testquelltext, und deshalb mit derselben Konsequenz behoben: gemessen statt vertraut.

## 7. Annahmen

1. **Beide Gegenproben liefen vollständig außerhalb des Arbeitsbaums** (Abschnitt 3), statt
   probeweise Produktivcode zu verändern und danach zurückzustellen (wie T-123/T-127 in ihrer
   eigenen Hoheit). Begründung: Produktivcode gehört mir an keiner Stelle, auch nicht für Sekunden.
   Der Nachweiswert ist derselbe — ein gemessener, dokumentierter Unterschied zwischen altem und
   neuem Testverhalten —, nur ohne dass am Ende `sha256sum -c`/`diff` gegen eine zurückgestellte
   REPO-Datei nötig war, weil nie eine Repo-Datei geschrieben wurde.
2. **Für Gegenprobe A wurde die ECHTE historische Fassung aus Commit `55ed731` verwendet**, nicht
   eine neu erfundene Nachbildung — das ist näher an der tatsächlichen Regression als eine eigene
   Konstruktion und git-nachprüfbar.
3. **Für Gegenprobe B wurde ein FREI ERFUNDENER hypothetischer Bereich (`U+2028`) verwendet**, weil
   die reale Domäne heute keine bekannte offene Erweiterung hat, an der sich dasselbe zeigen ließe.
   Der Codepunkt selbst ist ohne fachliche Bedeutung für dieses Experiment und keine Behauptung
   über eine künftige echte Erweiterung.
4. **Der Familien-Emoji-Anwendungsfall und die drei Verhaltenstests der "gültigen Namen" in
   `input.test.ts` bleiben unverändert erhalten** (Abschnitt 2) — sie sind keine Randtabelle,
   sondern prüfen Schemaverhalten, das von der Ableitung aus der Domäne nicht erfasst wird.
5. **Der eine Rauchtest in `hidden.test.ts` ist rechnerisch redundant zur Gleichheitsprüfung**,
   bleibt aber als lesbares Beispiel stehen (Abschnitt 2) — das ist eine bewusste Entscheidung für
   Lesbarkeit, keine fachliche Notwendigkeit.

## 8. Risiken

1. **Sicherheit:** keine neue Fläche. Beide geänderten Dateien rufen ausschließlich bereits
   vorhandene, exportierte Funktionen auf; keine echten Call-Nummern, Kundennamen oder
   Zugangsdaten — alle Beispieltexte sind erfunden ("Rechnung…gnp.exe" wie in den Vorgängerberichten
   beschrieben, "Vertraulicher Titel", "Ost").
2. **Die abgeleitete Randwertliste in `input.test.ts` hängt an der Struktur von
   `FORBIDDEN_NAME_CHARACTERS`/`CONTROL_WHITESPACE` als Liste von `{from, to}`-Bereichen.** Ändert
   sich diese Struktur (nicht nur ihr Inhalt), müsste `boundaryCodePoints()` mitgehen — das ist
   dieselbe Abhängigkeit, die `characters.test.ts` selbst schon hat (`for (const range of
   FORBIDDEN_NAME_CHARACTERS)`), also kein neues Risiko, sondern dasselbe an einer zweiten Stelle.
3. **Der Zwischenfall aus Abschnitt 4** (transienter Parse-Fehler während domain-devs paralleler
   Arbeit an `characters.ts`) ist folgenlos geblieben, aber ein Beleg dafür, dass ein Lese-Import
   einer fremden, gerade in Bearbeitung befindlichen Datei in einer parallelen Welle vereinzelt
   scheitern kann. Für die eigentlichen Testdateien im Repository ist das ohne Bedeutung, weil
   Vitest sie im normalen Lauf konsistent liest (mehrfach gemessen, immer grün).

## 9. Offene Fragen

Keine an den Orchestrator.

## 10. Nächster Schritt

1. **Reviewer-Wiedervorlage:** Beide geänderten Dateien zusammen mit `characters.test.ts` (T-127)
   und `T-123-integration-dev.md` prüfen — sie hängen jetzt sichtbar aneinander (eine Randtabelle,
   zwei verschiedene Fragen an zwei verschiedenen Türen).
2. **Kein Folgeauftrag aus dieser Aufgabe heraus.** Die einzige verbliebene offene Frage aus T-121
   (Frage 3) und das Risiko aus T-127 (Risiko 2) sind mit diesem Umbau eingelöst.
