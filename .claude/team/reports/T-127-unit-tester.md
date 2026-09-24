# T-127 — Die eine Wahrheit messen, und die unsichtbaren Zeichen in den eigenen Berichten

```
Aufgabe: T-127 — Die eine Wahrheit messen, und die unsichtbaren Zeichen in den eigenen Berichten
Status: fertig
```

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (komplett, insbesondere E-062 und E-063),
`.claude/team/reports/T-121-unit-tester.md` (eigene Fragen 2 und 3), `T-122-domain-dev.md`,
`T-125-security-checker.md` (Befund T-125-H7).

---

## Artefakte

| Datei | Was |
|---|---|
| `packages/domain/test/characters.test.ts` | **neu.** 25 Prüfungen (davon 6 `it.each` über eine 27-Zeilen-Randtabelle, macht 137 Einzelfälle) für `isForbiddenNameCharacter`, `hasForbiddenNameCharacter`, `hasHiddenCharacter`, `dropHiddenCharacters`, `visibleText`, dazu Sanitätsprüfungen an `FORBIDDEN_NAME_CHARACTERS`/`CONTROL_WHITESPACE`/`FORBIDDEN_NAME_CHARACTER_MESSAGE`/`HIDDEN_MARKER` |
| `packages/domain/test/enumeration.test.ts` | **neu.** 17 Prüfungen für `enumerateGerman`, `quoteName`, `enumerateNames` — null/ein/zwei/drei/vier Namen, leerer Name |
| `.claude/team/reports/T-111-unit-tester.md` | geändert: eine Stelle, rohes `U+0000` als `\u0000` geschrieben |
| `.claude/team/reports/T-121-unit-tester.md` | geändert: fünf Stellen, rohe `U+200D` (×3), `U+202E`, `U+061C`, `U+FFFD` (×2) als Escape-Folgen geschrieben |
| `.claude/team/reports/T-127-unit-tester.md` | dieser Bericht |

Nicht angefasst: jeglicher Produktivcode, alle anderen Berichte außer den beiden genannten
(geprüft, siehe Abschnitt 2 unten), `packages/export/**` (dort war nichts an dieser Aufgabe
offen, siehe Risiken).

---

## 1. Die Ränder der EINEN Zeichenklasse — `characters.ts` und `enumeration.ts`

### Warum überhaupt, obwohl die Zahl schon vorher gut aussah

Meine eigene Frage 2 aus T-121 war: 48,27 % Zeilenabdeckung auf `characters.ts`, keine eigene
Testdatei. Zum Start dieser Aufgabe stand die Datei über die vier Leser (`http/input.ts`,
`session-secret.ts`, `routes/addin/schema.ts`, `apps/outlook-addin/src/text/hidden.ts`, alle aus
T-122) längst bei 97,22 % Anweisungen / 96 % Zweigen — die Lücke aus dem ersten Bericht war
mittelbar geschlossen worden, bevor ich sie selbst füllen musste. Genau das ist der Punkt, den der
Auftrag macht: Eine hohe Zahl über vier Umwege ist nicht dasselbe wie eine Messung an der Quelle
selbst. Bis heute gab es unter `packages/domain/test/**` keine einzige Datei, die
`characters.ts`/`enumeration.ts` direkt importiert und ihre Ränder gegen die im Auftrag genannten
Codepunkte hält — jede bisherige Prüfung lief über einen Re-Export.

### Was gemessen wurde

`characters.test.ts` trägt eine Randtabelle mit 27 Codepunkten, je einer an jeder im Auftrag
genannten Grenze, und prüft sie gegen alle drei Behandlungen aus E-063:

- **abweisen** (`isForbiddenNameCharacter`, `hasForbiddenNameCharacter`): C0 (`U+0000`–`U+001F`,
  einschließlich des Steuer-Leerraums `U+0009`–`U+000D` — die Tür kennt hier keine Ausnahme), DEL
  (`U+007F`), C1 (`U+0080`–`U+009F`), die drei Marken `U+061C`/`U+200E`/`U+200F` mit ihren
  direkten Nachbarn `U+061B`/`U+061D`/`U+200B`–`U+200D`, die Einbettungen/Überschreibungen
  (`U+202A`–`U+202E`) und die Isolate (`U+2066`–`U+2069`), je mit einem Nachbarn davor und danach.
  Dazu das Familien-Emoji aus drei ZWJ (`\u{1f468}\u200d\u{1f469}\u200d\u{1f467}\u200d\u{1f466}`,
  wie im T-121-Bericht) als eigener Fall, der die Grenze nach unten festnagelt.
- **fallen lassen** (`dropHiddenCharacters`): dieselbe Randtabelle, mit der einen Nuance, dass der
  Steuer-Leerraum stehen bleibt, während jedes andere Zeichen der Klasse verschwindet; der
  RLO-Kernfall aus T-119 (`"Rechnung" + RLO + "gnp.exe"` → `"Rechnunggnp.exe"`); die Zusicherung,
  dass ein bereinigter Text `hasHiddenCharacter` danach nicht mehr auslöst.
- **sichtbar machen** (`visibleText`): dieselbe Randtabelle, Steuer-Leerraum wird zu genau einem
  Leerzeichen statt zur Marke, jedes andere Zeichen der Klasse zur Marke (`U+FFFD`), Längenerhalt
  über `[...text].length`, und die Gegenprobe, dass rechtsläufige Schrift (Arabisch, Hebräisch)
  unangetastet bleibt.

Zusätzlich drei Prüfungen, die die Tür selbst befragen statt eine Abschrift zu wiederholen
(E-063 Punkt 4): jeder Bereich aus `FORBIDDEN_NAME_CHARACTERS` ist an `from` und `to` selbst
geschlossen, kein Bereich ist vertauscht, und `CONTROL_WHITESPACE` liegt vollständig innerhalb
von `FORBIDDEN_NAME_CHARACTERS` — diese drei lesen die exportierten Listen direkt, statt ihre
Grenzen ein zweites Mal von Hand aufzuzählen.

`enumeration.test.ts` deckt `enumerateGerman`/`quoteName`/`enumerateNames` an den im Auftrag
genannten Rändern: null (leere Liste), ein, zwei, drei und — als Fortsetzung derselben Regel —
vier Namen, dazu was mit einem leeren Namen (`''`) geschieht: Er wird **nicht** übersprungen,
sondern als leeres Anführungszeichenpaar `„“` sichtbar aufgezählt. Eine eigene Prüfung hält fest,
dass eine leere Liste und eine Liste mit einem einzigen leeren Namen an `enumerateGerman` dasselbe
Ergebnis (`''`) ergeben — das ist genau die Zusicherung, vor der der Kommentar der Funktion warnt
("die Aufrufstelle fragt vorher, ob es überhaupt etwas aufzuzählen gibt").

### Was die Zahl NICHT bewegt hat, und warum das kein Fehlschlag ist

`characters.ts` bleibt bei 97,22/96/100/100, `enumeration.ts` bei 100/83,33/100/100 — exakt
dieselben Zahlen wie vor meinen 154 neuen Tests. Beide verbliebenen Lücken sind Zeilen, die auch
von den neuen, direkten Tests nicht erreicht werden, weil es echte defensive Totzweige sind:

- `characters.ts:242` — `hasHiddenCharacter`: `if (code === undefined) continue;`. `character` kommt
  aus `for (const character of value)`, ist also nie eine leere Zeichenkette; `codePointAt(0)`
  liefert für ein nicht-leeres Segment nie `undefined`. Das ist die einzige der vier Stellen, an
  der die Prüfung als **eigenständiges** `if` mit einem eigenen Zweig (`continue;`) steht, der
  Zweig läuft nie, und v8 listet ihn deshalb einzeln als unerreichte Zeile. Derselbe Aufbau steht
  noch dreimal in der Datei (Zeilen 221, 264, 297), dort aber als Teilausdruck einer
  `&&`/`||`-Verknüpfung ohne eigenen Anweisungszweig — die nie erreichte Verknüpfungsseite
  schlägt sich in der 96-statt-100-Prozent-Zweigquote nieder, aber nicht als eigene Zeile in der
  Liste "Uncovered Line #s".
- `enumeration.ts:53` — `enumerateGerman`, der `?? ''` an `parts[parts.length - 1]` im
  Drei-und-mehr-Zweig. Dort ist `parts.length > 1` bereits erzwungen, also ist der letzte Index
  immer belegt; der Fallback greift nur bei einem lückenhaften (sparse) Array.

Beide ließen sich nur mit einem konstruierten, unrealistischen Eingang erreichen (ein Objekt, das
`Symbol.iterator` fälscht, beziehungsweise ein Array mit einer Lücke am letzten Index). Ich habe
das **nicht** gebaut: Es hätte kein reales Verhalten geprüft, sondern nur die Zahl kosmetisch auf
100 gehoben. Das ist ein Befund, kein Testfehler — ich melde ihn hier, weil er dieselbe Bauart ist
wie die schon bekannten Totzweige an den drei anderen Stellen, nicht weil er den Auftrag verfehlt:
Alle im Auftrag genannten Ränder (C0/C1/DEL/Bidi/Marken, die drei erlaubten Nachbarn, das
Familien-Emoji, null/ein/zwei/drei Namen, der leere Name) sind gemessen und grün.

### Rot vor Grün

Da `characters.ts` und `enumeration.ts` bereits vollständig implementiert waren (T-122, vor
meinem Auftrag) und ich keinen Produktivcode schreiben darf, ist echtes TDD in der Reihenfolge
"Test vor Implementierung" hier nicht möglich — wie schon in T-121 protokolliert. Stattdessen: neun
Erwartungen an sechs Stellen bewusst umgekehrt, Lauf gemessen, dann zurückgestellt.

```
Vorher (bewusst falsch, sechs Stellen):
 characters.test.ts (137 Fälle | 6 fehlgeschlagen)
   × 'U+061C (ALM), die Marke selbst' -> forbidden: false
     AssertionError: expected true to be false
   × ein Name aus GENAU 'U+061C (ALM)...' -> forbidden: false
     AssertionError: expected true to be false
   × ein Familien-Emoji ... bleibt als Titel erlaubt
     AssertionError: expected false to be true
   × 'U+061C (ALM)...' bleibt erhalten (dropHiddenCharacters)
     AssertionError: expected 'VorNach' to be 'Vor\u061cNach'
   × der Steuer-Leerraum wird zu GENAU EINEM Leerzeichen, nicht zur Marke
     AssertionError: expected 'Störung Lüftung' to be 'Störung\ufffdLüftung'
   × 'U+061C (ALM)...' bleibt in der Anzeige unverändert (visibleText)
     AssertionError: expected '\ufffd' to be '\u061c'

 enumeration.test.ts (17 Fälle | 3 fehlgeschlagen)
   × drei Teile: ... kein Komma vor 'und'
     AssertionError: expected 'A, B und C' to be 'A und B und C'
   × ein leerer Name ergibt ein leeres Anführungszeichenpaar
     AssertionError: expected '„“' to be ''
   × null Namen (leere Liste) ergeben die leere Zeichenkette
     AssertionError: expected '' to be '„“'

 Test Files  2 failed (2)
      Tests  9 failed | 145 passed (154)

Danach (richtiggestellt):
 Test Files  2 passed (2)
      Tests  154 passed (154)
```

Die Escape-Schreibweise in den beiden Fehlermeldungen oben (`\u061c`, `\ufffd`) ist meine eigene
Übertragung für diesen Bericht, nicht die rohe Terminalausgabe — genau das Verfahren aus
Abschnitt 2, konsequent auch hier angewendet: Vitest hatte die Zeichen roh ausgegeben (im
Terminal sichtbar als die eigentlichen Glyphen von ALM und U+FFFD), und diese rohe Ausgabe landet
nirgends in einer Datei, die ich behalte oder zitiere.

Alle Umkehrungen wurden aus derselben Kopie zurückgestellt, die vorher als Referenz gesichert war;
`diff` gegen die gesicherte Fassung bestätigt Bytegleichheit nach der Rückstellung.

### Keine rohen Zeichen im Testquelltext

Beide neuen Dateien sind ausschließlich über `String.fromCodePoint(...)` (eine kleine Hilfsfunktion
`c(codePoint)`), `\uXXXX`-Escapes oder die exportierte Konstante `HIDDEN_MARKER` gebaut — nirgends
ein rohes Steuer-, Bidi- oder Marken-Zeichen. Ein Codepunkt-Scan über beide Dateien (C0 ohne
Tab/LF/CR, C1, DEL, ALM, ZWSP–RLM, LS/PS, Einbettungen/Überschreibungen, Word-Joiner-Bereich,
Isolate) findet **keinen** Treffer außerhalb der newline-Zeichen der Datei selbst. Arabischer und
hebräischer Beispieltext (für den Rechtsläufig-Fall von `visibleText`) steht als gewöhnlicher
UTF-8-Text, wie schon in `hidden.test.ts` (T-121) — das ist normale, sichtbare Schrift und keine
verdeckte Wirkung, also nicht Gegenstand dieser Vorsicht. `file` bestätigt beide Dateien als
`JavaScript source, Unicode text, UTF-8 text`, nicht `data`.

---

## 2. T-125-H7 — die unsichtbaren Zeichen in den eigenen Berichten

Der security-checker hatte in T-125 vier Fundstellen genannt: `T-111-unit-tester.md:115` (rohes
`U+0000`) und `T-121-unit-tester.md:64, 221, 288` (rohe `U+200D`, `U+202E`, `U+061C`). Ich habe
alle vier korrigiert und danach, wie im Auftrag verlangt, **alle zwölf** eigenen Berichte
gescannt, nicht nur die beiden genannten.

Der zweite Durchlauf fand zwei weitere Stellen in `T-121-unit-tester.md` (Zeilen 176 und 225), die
der security-checker nicht gemeldet hatte, weil sie kein Zeichen aus `FORBIDDEN_NAME_CHARACTERS`
tragen: ein rohes `U+FFFD` (die Anzeigemarke selbst) in zwei zitierten Testausgaben. `U+FFFD` ist
kein unsichtbares oder steuerndes Zeichen — es ist ein gewöhnliches, sichtbares Zeichen und liegt
außerhalb der Klasse (das prüft jetzt auch `characters.test.ts`, Abschnitt 1) — aber `characters.ts`
selbst schreibt die Konstante als Escape-Folge (`'\ufffd'`), nicht als rohes Zeichen, und genau
diese Konsequenz habe ich auf die Berichte übertragen: Wo ein Bericht eine Testausgabe zitiert, die
das Zeichen enthielt, steht jetzt `\ufffd` statt der Glyphe. Das ist eine Entscheidung, die ich
selbst getroffen habe, ohne dass der Auftrag sie ausdrücklich verlangt (siehe Annahmen).

**Die neun behobenen Stellen im Einzelnen:**

| Datei | Zeile | Zeichen | Kontext |
|---|---|---|---|
| `T-111-unit-tester.md` | 115 | `U+0000` | Beispieltext `'VorNach'` — jetzt `'Vor\u0000Nach'` |
| `T-121-unit-tester.md` | 64 | `U+200D` (×3) | Familien-Emoji-Beispiel — jetzt durchgängig als `\u200d` geschrieben |
| `T-121-unit-tester.md` | 176 | `U+FFFD` | zitierte Testausgabe `'AB...'` — jetzt `'AB\ufffd'` |
| `T-121-unit-tester.md` | 221 | `U+202E`, `U+FFFD` | zitierte Testausgabe (`Expected`/`Received`) |
| `T-121-unit-tester.md` | 225 | `U+FFFD` | zitierte Testausgabe `"Vor...Nach"` |
| `T-121-unit-tester.md` | 288 | `U+061C` | Codebeispiel `ALM = "..."` |

**Der Mechanismus, wörtlich aus dem Auftrag bestätigt — und mir selbst passiert, nicht nur
beobachtet.** Der rote Testlauf für Abschnitt 1 erzeugte in seiner Terminalausgabe ein rohes ALM
und ein rohes `U+FFFD`; diese Ausgabe liegt in einer Datei im Arbeitsverzeichnis, nicht in einem
Bericht (bestätigt per Codepunktprüfung). Beim ERSTEN Entwurf DIESES Berichts ist mir dieselbe
Verbreitung trotzdem ein drittes Mal unterlaufen: An mehreren der oben zitierten Stellen stand
zunächst wieder das rohe Zeichen selbst statt der Escape-Folge (`\u061c`, `\ufffd`, `\u200d`) —
obwohl die Absicht von Anfang an war, ausschließlich Escape-Folgen zu schreiben. Ein
Codepunkt-Scan über den eigenen Entwurf hat das vor der Abgabe gefunden (18 Treffer, siehe unten);
alle sind seither durch die textliche Escape-Folge ersetzt. Das ist der beste Beleg für den Satz
aus dem Auftrag: Man sieht dabei nichts, auch dann nicht, wenn man aktiv danach sucht — genau
deshalb steht am Ende die Messung und nicht das Vertrauen in die eigene Absicht.

**Nachweis, nach der Korrektur:**

```
Codepunkt-Scan über alle zwölf *-unit-tester.md-Berichte
(C0 ohne Tab/LF/CR, C1, DEL, Soft-Hyphen, ALM, ZWSP-RLM, LS/PS,
 Einbettungen/Überschreibungen, Word-Joiner-Bereich, Isolate, BOM, U+FFFD):
TOTAL HITS: 0 über 12 Dateien

file <jede der zwölf *-unit-tester.md-Dateien>:
alle: "Unicode text, UTF-8 text" (keine als "data" erkannt)
```

`git diff` zeigt für beide geänderten Berichte ausschließlich die erwarteten Textzeilen, keine
Binärmarkierung, keine unbeabsichtigten Nebenänderungen (per `git diff --stat`: 2 bzw. 10 Zeilen
geändert, siehe Artefakttabelle).

---

## Annahmen

1. **`U+FFFD` in Berichten wird ebenfalls als Escape-Folge geschrieben, obwohl es kein
   unsichtbares/steuerndes Zeichen ist und daher nicht in T-125-H7 genannt war.** Ich habe das
   selbst entschieden, aus Konsistenz mit `characters.ts` (das die Konstante ebenfalls als
   `'\ufffd'` statt als rohes Zeichen schreibt) und weil ein Bericht, der die eine Marke roh
   zitiert, während er an anderer Stelle genau diese Marke als Beispiel für "roh vermeiden"
   anführt, in sich widersprüchlich wäre.
2. **Kein Produktivcode geändert, auch nicht die vier bereits bekannten Totzweige.** `characters.ts`
   trägt seit T-122 an vier Stellen dieselbe defensive `undefined`-Prüfung nach `codePointAt(0)`;
   `enumeration.ts` an einer Stelle die entsprechende `?? ''`-Absicherung. Alle fünf sind
   unerreichbar, ohne einen unrealistischen Eingang zu konstruieren (gefälschter Iterator bzw.
   lückenhaftes Array). Das ist ein Befund für den Orchestrator/domain-dev (siehe Risiken), nicht
   etwas, das ich durch einen künstlichen Test verdecke.
3. **Vier statt drei Namen bei `enumerateGerman`/`enumerateNames`** zusätzlich zum verlangten
   null/ein/zwei/drei — eine einzeilige Fortsetzung derselben Regel, keine neue Behauptung.
4. **Rotnachweis über bewusst falsche Erwartungen**, wie schon in T-121 begründet: Beide
   Quelldateien waren vor meinem Auftrag fertig implementiert (T-122); "Test vor Implementierung"
   ist mir durch die Hoheitsgrenze verwehrt. Vor jeder Umkehrung wurde eine Referenzkopie der
   grünen Fassung gesichert; nach dem roten Lauf wurde exakt diese Kopie zurückgespielt und die
   Bytegleichheit mit `diff` bestätigt.
5. **Frage 3 aus T-121 (doppelte Randmessung durch echte Gleichheitsprüfung ersetzen) nicht
   angefasst** — wie im Auftrag ausdrücklich verlangt, weil integration-dev die Nachweisabschnitte
   in T-123 umbaut.

---

## Risiken

1. **Fünf unerreichbare defensive Zweige in der EINEN Zeichenklasse und der Aufzählung**
   (`characters.ts:221,242,264,297`, `enumeration.ts:53`). Fachlich harmlos — sie können nur mit
   einem konstruierten, nicht-string-konformen Eingang bzw. einem lückenhaften Array ausgelöst
   werden — aber sie sind der Grund, warum `packages/domain/src` die 80-Prozent-Schwelle bei
   Zweigen im Aggregat komfortabel, bei einzelnen Dateien aber nie ganz auf 100 erreicht. Kein
   Testfehler, aber eine Beobachtung, die dem domain-dev gehört, falls er die defensiven Prüfungen
   vereinfachen möchte (z. B. `character.codePointAt(0)!` ohne `undefined`-Fallabsicherung, da der
   Fall über `for...of` nie eintritt).
2. **Die Randtabelle in `characters.test.ts` ist eine DRITTE unabhängig geschriebene Fassung**
   derselben Grenzen, neben `apps/local-api/test/http/input.test.ts` und
   `apps/outlook-addin/test/text/hidden.test.ts` (beide aus T-121). Alle drei importieren jetzt
   zwar dieselbe Quelle (`@takt/domain` bzw. deren Re-Exporte), aber die Randwerte selbst stehen
   dreimal als eigene Konstanten, nicht einmal geteilt und dreimal gelesen — das ist dieselbe
   Einschränkung wie in T-121, Annahme 3/offene Frage 3, jetzt auf drei statt zwei Stellen
   erweitert. Bewusst nicht behoben (siehe Annahme 5).
3. **Kein Sicherheitsrisiko aus den neuen Testdateien.** Beide rufen ausschließlich bereits
   vorhandene, exportierte Funktionen auf, keine echten Call-Nummern, Kundennamen oder
   Zugangsdaten — Beispielnamen sind erfunden (Ost, Nord, Abrechnung, Kesselwartung, wie in
   bestehenden Tests), Beispieltexte auf Arabisch/Hebräisch sind erfundene, generische Sätze ohne
   Bezug zu echten Daten.
4. **`packages/export` nicht angefasst** — für diese Aufgabe war dort nichts offen; die
   80-Prozent-Schwelle dort war schon vor meiner Änderung gehalten (97,95/92,85/100/97,82 %) und
   bleibt es unverändert.

---

## Offene Fragen

Keine an den Orchestrator. Die einzige aus T-121 verbliebene (Frage 3, doppelte Randmessung) ist
ausdrücklich nicht Teil dieser Aufgabe und bleibt für die nächste Welle nach T-123 offen.

---

## Nächster Schritt

1. **domain-dev, optional:** die fünf defensiven Totzweige aus Risiko 1 ansehen — nicht dringend,
   da fachlich folgenlos, aber sie sind der einzige Grund, warum `characters.ts`/`enumeration.ts`
   nie einzeln auf 100 % Zweigabdeckung kommen.
2. **Nach T-123 (integration-dev):** T-121s offene Frage 3 aufgreifen — die jetzt DREI
   unabhängigen Randtabellen (Tür, Add-in, Domäne direkt) durch eine echte Gleichheitsprüfung
   gegen die eine Quelle ersetzen, sobald die Nachweisabschnitte dort umgebaut sind.
3. **Reviewer-Wiedervorlage:** `characters.test.ts`/`enumeration.test.ts` zusammen mit T-122
   prüfen — sie hängen an derselben Klasse und denselben Verträgen (E-063).

---

## Nachweis

Alle Läufe am 2026-09-04, jeder in eine eigene Datei umgeleitet, Endstatus über `echo $?`
unmittelbar nach dem Befehl gelesen (keine Pipe).

**Vorher** (Ausgangsstand, vor den beiden neuen Testdateien):

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm run test:coverage` | **0** | 56 Dateien, 837 Prüfungen; **`characters.ts` 97,22/96/100/100 %** (Zeile 242 offen), **`enumeration.ts` 100/83,33/100/100 %** (Zeile 53 offen); Gesamt 91,32/84,91/94,29/93,95 % (Anweisungen/Zweige/Funktionen/Zeilen); alle drei Schwellen gehalten |

**Nachher:**

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm run typecheck:test` | **0** | sieben Testkonfigurationen, unverändert grün |
| `pnpm run test` | **0** | **58 Testdateien** (56 + 2 neue), **991 Prüfungen** (837 + 154: 137 in `characters.test.ts`, 17 in `enumeration.test.ts`) |
| `pnpm run test:coverage` | **0** | 58 Dateien, 991 Prüfungen; **`characters.ts` 97,22/96/100/100 %** (unverändert — die Ränder waren durch die vier Leser aus T-122 bereits mittelbar gedeckt, jetzt zusätzlich direkt an der Quelle nachgewiesen), **`enumeration.ts` 100/83,33/100/100 %** (unverändert, siehe Abschnitt 1 zu den beiden verbliebenen Totzweigen); Gesamt unverändert 91,32/84,91/94,29/93,95 %; alle drei 80-Prozent-Schwellen (`packages/domain/src`, `packages/storage/src`, `packages/export/src`) weiterhin gehalten |

**Vergleichsmarke aus dem Auftrag (nach Welle K, 837 Tests/56 Dateien, 90,6/83,92/93,78/93,1 %):**
Meine eigene Vorher-Messung zeigt bei identischer Test-/Dateizahl (837/56) leicht andere Prozente
(91,32/84,91/94,29/93,95 %) — das ist keine Diskrepanz meiner Messung, sondern der Stand
zwischen Welle K und dem Start dieser Aufgabe: `packages/storage/src/sqlite/paging.ts` wurde
zwischenzeitlich (T-125-6, domain-dev) geändert, ohne die Testzahl zu verändern, und verschiebt
dadurch die prozentuale Abdeckung geringfügig. Beide Zahlenpaare sind an ihrem jeweiligen
Zeitpunkt korrekt gemessen.

Zwei isolierte Rot-vor-Grün-Nachweise (Abschnitt 1), je mit sechs bzw. drei bewusst falschen
Erwartungen, gemessenem Fehlschlag (9 von 154 Prüfungen rot) und anschließender Rückstellung auf
eine vorher gesicherte, byte-identisch verifizierte Fassung.

Codepunkt-Scan über beide neuen Testdateien und über alle zwölf `*-unit-tester.md`-Berichte:
keine rohen Treffer aus der gefährlichen Klasse, `file` bestätigt Text statt Binärdaten für alle
betroffenen Dateien.

Kein `git commit`, kein `stash`, kein `checkout`, kein fremder Prozess beendet. Kein lokaler
Dienst gestartet — alle Prüfungen dieser Aufgabe laufen ausschließlich gegen reine Funktionen,
kein Netzumlauf, Ports 17843/17844 nicht berührt.
