# T-208 — Ein Prüffall zu einer Berichtigung, die heute nichts ändert

**Rolle:** unit-tester **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `.claude/team/reports/T-193-unit-tester.md`, `.claude/team/reports/T-200-spec-ux-reviewer.md`
(Abschnitte 2.2 Z-51, 2.3 Z-52), `.claude/team/board.md` (Einträge O-HH, O-HY),
`apps/web/src/lib/touched.ts`, `apps/web/src/components/FormDialog.tsx#TextField`,
`apps/web/src/components/ConfirmDialog.tsx`, `apps/web/test/lib/touched.test.ts`,
`apps/web/test/screens/templatesScreenBeginCopy.test.ts` (Bauart-Vorbild), `vitest.config.ts`.

---

## Kurzfassung

```
Aufgabe: T-208 — O-HY, der Prüffall zur Berichtigung von touchedOnBlur (trim() auf der
         zweiten Hälfte von P-8)
Status: fertig
```

Zwei Prüfdateien. `touched.test.ts` (bestehende Datei, geändert) trägt jetzt Z-52: aus dem
einen, in sich widersprüchlichen fünften Fall („ein Leerzeichen ist eine Eingabe" mit
`edited = false` in den Daten) werden zwei — ein getipptes Leerzeichen (`edited = true`,
unverändert unter jeder Fassung) und ein vorbelegtes Leerzeichen (`edited = false`, der
einzige Fall, an dem die Berichtigung überhaupt einen Unterschied macht). Neu:
`touchedCallSiteNeutrality.test.ts` mißt die zweite Auftragshälfte — ob die Berichtigung an
ihren zwei tatsächlichen Aufrufstellen (`FormDialog.tsx#TextField`, `ConfirmDialog.tsx`)
verhaltensneutral ist. Ergebnis: An `ConfirmDialog.tsx` ist die Neutralität **strukturell
bewiesen** (der divergierende Eingabezustand ist in der Datei selbst unerreichbar); an
`TextField` ist sie **nicht aus `apps/web` allein beweisbar**, sondern hängt an einer
Invariante in `apps/local-api` (domain-dev-Hoheit) — kein Fehler, aber ein Befund, der unten
ausgeschrieben steht statt nur behauptet zu werden. Kein Produktivcode angefaßt; ein
zeitlich begrenzter, checksummenbelegter Rückbau von `touched.ts` (zweimal) diente nur der
Rot-Messung und ist exakt wiederhergestellt. Frontend-dev hat `touched.ts` während dieser
Messung zweimal weitergeschrieben (nur Kopfkommentar, nicht die Rechenzeile) — beide Stände
sind unten benannt.

---

## 1. Auftragslage und wie ich „zwei Orte" gelesen habe

`touchedOnBlur` wird im ganzen Bestand an **genau zwei** Stellen aufgerufen
(`grep -rn "touchedOnBlur(" apps/web/src` — kein drittes Ergebnis):

1. `FormDialog.tsx#TextField`, `handleBlur`: `if (touchedOnBlur(value, edited))
   onTouched?.();`
2. `ConfirmDialog.tsx`, `touchReason`: `if (touchedOnBlur(reason, reasonEdited))
   setReasonTouched(true);`

Der Auftrag nennt „TextField über onTouched" und „das Begründungsfeld des
Bestätigungsdialogs" als die zwei Orte — das sind genau diese zwei Aufrufstellen der
Funktion selbst, nicht die sieben Bildschirme, die `onTouched` weiter unten konsumieren
(`TagsScreen.tsx` dreimal, `PoolFormDialog.tsx`, `StatusSettings.tsx`, `TemplatesScreen.tsx`,
`Attachments.tsx` zweimal). Diese sieben kommen als **Befund**, nicht als eigener Prüffall,
in Abschnitt 3.3 vor — aus dem Grund, der dort steht.

---

## 2. `touched.test.ts` — Z-52, aus einem Fall werden zwei

### 2.1 Der Fehler im alten Fall 5, wörtlich

Der bis zu dieser Aufgabe stehende fünfte Fall hieß „ein Leerzeichen ist eine Eingabe, kein
leerer Wert" und setzte `edited = false`. Titel und Daten widersprechen sich: Der Titel
behauptet eine getippte Eingabe (das wäre `edited = true`), die Daten bauen ein
**vorbelegtes** Feld. Gemessen war damit nicht der behauptete Fall, sondern der einzige
Zustand, an dem die **alte** Fassung von `touchedOnBlur` (vor T-207) an ihrer schwächsten
Stelle unbemerkt blieb — genau der Befund aus T-200 Z-52.

### 2.2 Die zwei neuen Fälle

- **„ein getipptes Leerzeichen ist eine Eingabe"** (`" ", true`) → `true`. Unverändert unter
  jeder der vier im Dateikopf benannten Fassungen der Regel (die erste Hälfte trägt ihn
  allein, `trim()` wird nie gefragt).
- **„ein vorbelegtes Leerzeichen ist keine Eingabe"** (`" ", false`) → `false`. Der einzige
  der sechs Fälle dieser Datei, an dem die Berichtigung O-HY einen Unterschied macht.

### 2.3 Rot-vor-Grün, tatsächlich gefahren

`touched.ts` ist eine unversionierte Datei (`git status`: `??`) — keine committete
Vorfassung, gegen die sich diffen ließe. Statt dessen ein Mutationslauf mit Sicherung
vorher/nachher:

```
md5sum vorher (Stand nach Berichtigung, T-207)  = 72d4f103add8a4827cb7c12cd5274041
mutiert: return edited || value.trim().length > 0;
      → return edited || value.length > 0;
Lauf: 1 von 6 Fällen rot — genau "ein vorbelegtes Leerzeichen ist keine Eingabe"
      (expected true to be false), die anderen fünf bleiben grün.
restauriert, md5sum danach                       = 72d4f103add8a4827cb7c12cd5274041  ✓ identisch
```

Damit ist belegt, was der Dateikopf jetzt in Prosa behauptet: Von den sechs Fällen ist genau
einer berichtigungsempfindlich, alle anderen unverändert unter beiden Fassungen.

---

## 3. `touchedCallSiteNeutrality.test.ts` — die zweite Hälfte: verhaltensneutral wofür?

### 3.1 Bauart

Wie `templatesScreenBeginCopy.test.ts` (O-GR, T-193): ein echter Syntaxbaum (`typescript`)
statt eines Zeichenkettenvergleichs, weil die Behauptungen Aussagen über die **Struktur**
des Quelltexts sind (welche Bedingung neben welcher Zuweisung steht), nicht über
Laufzeitverhalten — `jsdom`/`@testing-library/react` fehlen weiterhin im Bestand (geprüft
wie in T-193, unverändert).

### 3.2 Aufrufstelle 1 — `TextField`: ein bloßer Durchreicher

Zwei Prüffälle stellen fest:

1. `handleBlur`s einziges `if`, das `touchedOnBlur` nennt, hat **keine** zusätzliche
   Bedingung (`touchedIf.expression` ist der nackte Aufruf, kein `&&`/`||`), **keinen**
   `else`-Zweig, und seine Folge ist wortgleich `onTouched?.();` — nichts sonst.
2. `edited` wird im ganzen Bauteil genau einmal auf `true` gesetzt, und zwar im selben
   `onChange`-Block, der auch `onChange(event.target.value)` — die Weiterleitung des neuen
   Werts an den Aufrufer — enthält.

**Folgerung, gemessen statt behauptet:** `TextField` filtert, dämpft oder verzögert nichts.
Was `touchedOnBlur` entscheidet, kommt unverändert bei `onTouched` an. Der in Abschnitt 2.3
belegte Umschlag (`true` → `false` für `(" ", false)`) erreicht diese Grenze **eins zu
eins** — das ist die beabsichtigte Wirkung von O-HY, kein eigener Befund dieser Datei.

### 3.3 Der eigentliche Befund: `TextField`s Unschädlichkeit ist nicht in `apps/web` beweisbar

Ob der Umschlag an `onTouched` je etwas **sichtbar** ändert, hängt daran, ob irgendeine der
sieben Aufrufstellen dem Feld einen Wert vorbelegt, der ausschließlich aus Leerraum besteht
und den niemand editiert hat. Das ist heute nicht der Fall (geprüft durch Lesen der
Quellen): `TagsScreen.tsx`/`PoolFormDialog.tsx`/`StatusSettings.tsx` belegen mit `""` oder
einem Namen aus dem Bestand vor, `TemplatesScreen.tsx` mit `` `Kopie von ${...}` ``,
`Attachments.tsx` mit `""` oder einem Pfad aus dem Dateiwähler des Betriebssystems. Die
Garantie „ein Name aus dem Bestand ist nie reiner Leerraum" liegt in `nameSchema` aus
`apps/local-api/src/http/input.ts` (`z.string().trim().min(1)`) — **domain-dev-Hoheit, ein
anderes Paket**, nicht in `FormDialog.tsx` und nicht innerhalb von `apps/web` beweisbar.

Das ist genau die Bauart, gegen die O-HY selbst gerichtet ist — „eine Regel darf für ihr
Schweigen nicht auf eine ferne Aufrufstelle angewiesen sein" —, nur eine Ebene höher: von
„jeder Aufrufer von `touchedOnBlur` muß `trim()` fragen" (behoben) zu „jede Werkquelle für
`value` muß Leerraum vorher abweisen" (nicht behoben, weil nicht Gegenstand dieser Aufgabe,
und nicht in `apps/web` behebbar). **Ich melde das als Befund, statt die Erwartung
anzupassen** (E-087): Es ist heute folgenlos, aber die Unschädlichkeit ist eine Annahme über
ein fremdes Paket, keine in `apps/web` geschlossene Eigenschaft. Kein Prüffall dieser Datei
behauptet etwas anderes.

### 3.4 Aufrufstelle 2 — `ConfirmDialog`: strukturell geschlossen, gemessen statt gelesen

Vier Prüffälle:

1. **Die rohe Formel divergiert.** `reasonMissing = reasonRequired && reasonTouched &&
   reason.trim() === ""` (wortgleich aus der Quelle übernommen), ausgewertet mit
   `reason = " "`, `reasonRequired = true`: unter der Fassung vor O-HY `true`, unter der
   Berichtigung `false`. Das ist ein echter mathematischer Umschlag — kein
   Rundungsfehler dieser Messung.
2. `setReason` wird in der ganzen Datei **genau zweimal** aufgerufen, und **beide Male** im
   selben Anweisungsblock wie `setReasonEdited`.
3. Der eine Aufruf mit dem Zeichenkettenwert `""` (Rücksetzen beim Schließen) steht im
   selben Block wie `setReasonEdited(false)`.
4. Der andere Aufruf (`event.target.value`, im `onChange`) steht im selben Block wie
   `setReasonEdited(true)` — und dieser Aufruf kommt in der Anweisungsreihenfolge **vor**
   oder **zugleich mit** der Änderung von `reason`, nie danach.

**Folgerung, strukturell bewiesen statt angenommen:** `reason` kann in `ConfirmDialog.tsx`
nur zwei Zustände einnehmen — `""` mit `reasonEdited = false` (nach Rücksetzen) oder einen
über `onChange` gesetzten Wert mit `reasonEdited = true` (danach trägt die erste Hälfte der
Regel ohnehin allein). Der divergierende Zustand `(reason = " ", reasonEdited = false)` aus
Fall 1 ist in dieser Datei **unerreichbar** — nicht heute zufällig, sondern solange diese
eine Kopplung besteht. Das ist der Unterschied zu Abschnitt 3.3: Hier ist der Beweis
**innerhalb einer Datei** geschlossen, dort hängt er an sieben fremden Dateien und einem
Schema in einem anderen Paket.

---

## 4. Zeitliche Lage — gegen welchen Stand gemessen wurde

Anders als angekündigt lief frontend-dev der Messung **voraus**: Beim ersten `pnpm test`
dieser Aufgabe war `touched.ts` bereits berichtigt (`return edited || value.trim().length >
0;`), und der alte, unveränderte fünfte Fall aus T-193 war deshalb bereits **rot**
(`expected false to be true`) — das ist der Beleg, nicht der Fehler, den der Auftrag
ausdrücklich zuläßt, nur in die andere Richtung als erwartet.

Während der Arbeit an dieser Aufgabe hat frontend-dev `touched.ts` **zweimal**
weitergeschrieben — beide Male nur der Kopfkommentar, nie die Rechenzeile:

| Zeitpunkt | `md5sum` | Rechenzeile | Kopfkommentar |
|---|---|---|---|
| vor Beginn (mein erster `Read`) | — (nicht mitgeschnitten) | `edited \|\| value.length > 0` (unberichtigt) | Nachtrag T-186, keine Berichtigung |
| beim ersten `pnpm test` / Rot-vor-Grün für 2.3 | `72d4f103…` | `edited \|\| value.trim().length > 0` | Berichtigung mit Begründung, erste Fassung |
| aktueller Stand (Abschluß dieser Aufgabe) | `5772408a…` | unverändert | Begründung um den in 3.3 unabhängig gemessenen Punkt ergänzt (Verweis auf `nameSchema`, explizite Nennung aller neun Vorbelegungsquellen) |

Beide Rot-vor-Grün-Läufe (Abschnitt 2.3 und die zwei Prüffälle in Abschnitt 3.2/3.4, Fall 1)
liefen gegen den **mittleren** Stand (`72d4f103…`) und wurden nach jedem Mutationslauf exakt
dorthin zurückgestellt (Prüfsumme belegt). Der **aktuelle** Stand (`5772408a…`) unterscheidet
sich nur im Kommentar — alle 13 Fälle beider Dateien laufen dagegen unverändert grün (letzter
`pnpm test` dieser Aufgabe lief gegen `5772408a…`).

Bemerkenswert: Frontend-devs zweite Kommentarfassung benennt inzwischen unabhängig densel­ben
Punkt wie Abschnitt 3.3 dieses Berichts (`nameSchema`, alle neun Vorbelegungsquellen) — eine
Konvergenz, keine Abstimmung; Agenten sprechen in diesem Projekt nicht miteinander.

---

## 5. Die fünf Fälle aus T-193 — nachgesehen, nicht nur behauptet (Bonus, „wenn Zeit bleibt")

Alle vier unveränderten Fälle (1–4) tragen weiterhin `wieVorT186(...)` bzw. zusätzlich
`ersteT186Fassung(...)` als ausführbare Modelle, keine Prosa-Behauptung. Nachgesehen:

- Fall 1 (`"", false` → `false`): `wieVorT186` liefert `true` — unverändert richtig, dieser
  Fall ist unabhängig von O-HY (leere Zeichenkette, `trim()` ändert nichts an `""`).
- Fall 2 (`"Kunden Nord", true` → `true`): unverändert, `trim()` einer nicht-leeren
  Zeichenkette ändert an `.length > 0` nichts.
- Fall 3 (`"", true` → `true`, mit `ersteT186Fassung`): unverändert, dieselbe Begründung.
- Fall 4 (`"Kunden Nord", false` → `true`): unverändert, dieselbe Begründung wie Fall 2.

Keine der vier „vor T-186 grün?"-Angaben ist durch die Berichtigung O-HY falsch geworden —
`trim()` wirkt sich nur auf Zeichenketten aus, die ausschließlich aus Leerraum bestehen, und
keiner der vier Fälle verwendet eine solche. Der einzige Fall, den die Berichtigung betraf
(der alte Fall 5), ist in Abschnitt 2 dieses Berichts bereits behandelt und aufgeteilt. Die
Angaben sind damit nachgezogen, nicht nur übernommen.

---

## 6. Nachweise

| Lauf | Vorher (Stand bei Auftragsbeginn) | Nachher |
|---|---|---|
| `pnpm test` | 76 Dateien, **1455 grün, 1 rot** (der alte, durch O-HY überholte Fall 5 aus T-193 — fremd verursacht, s. Abschnitt 4) | **77 Dateien, 1464 grün, 0 rot** (+1 Datei, +8 Fälle: 6−5=+1 eigen in `touched.test.ts`, +7 eigen neu in `touchedCallSiteNeutrality.test.ts`) |
| `pnpm typecheck` | 0 | **0** (unverändert, alle Pakete inkl. `typecheck:test`, `typecheck:e2e`) |
| Rot-vor-Grün, `touched.test.ts` Fall „vorbelegtes Leerzeichen" | — | 1/6 rot gegen mutierte Vorfassung, 5/6 grün; nach Wiederherstellung `md5sum` identisch (`72d4f103…`) |
| Rot-vor-Grün, `touchedCallSiteNeutrality.test.ts` | — | 2/7 rot gegen dieselbe mutierte Vorfassung (die zwei rechnenden Fälle aus 3.2/3.4), 5/7 unverändert grün (die fünf rein strukturellen Fälle — sie hängen nicht an `touched.ts`); nach Wiederherstellung `md5sum` identisch |
| `git status` nach beiden Rückbauten | — | `touched.ts` nach jedem Rückbau exakt auf dem vor dem Rückbau bestehenden Stand; kein Produktivcode im endgültigen Diff dieser Aufgabe |

`pnpm run proof:all` **nicht gefahren** (E-083 Punkt 3, ausdrücklich untersagt für diese
Aufgabe).

**Abdeckung `packages/domain`/`packages/export`:** von dieser Aufgabe nicht berührt (beide
Prüfdateien liegen unter `apps/web/test/**`, die Definition-of-Done-Schwelle gilt laut
`vitest.config.ts` ausdrücklich nur für `packages/domain`, `packages/storage`,
`packages/export`).

---

## 7. Artefakte

**Neu:**

```
apps/web/test/components/touchedCallSiteNeutrality.test.ts   O-HY, sieben Fälle, Abschnitt 3
```

**Geändert (nur meine Hoheit, `apps/*/test/**`):**

```
apps/web/test/lib/touched.test.ts   Z-52 umgesetzt, Fall 5 in zwei aufgeteilt, dritte
                                     Referenzfassung `vorDerBerichtigungOHY` ergänzt,
                                     Kopfkommentar entsprechend erweitert
```

**Nicht angefaßt:** jeder Produktivcode. Belegt durch `git status` (nach beiden temporären
Rückbau-Läufen unverändert gegenüber dem jeweils zuletzt gültigen Stand von `touched.ts`)
und durch `md5sum`-Vergleiche vor/nach jedem der zwei temporären Rückbauten.

**Beobachtet, nicht angefaßt:** `apps/web/test/app/undoDone.test.ts` steht bei Abschluß
dieser Aufgabe als `M` in `git status`, mit einer Änderung, die nichts mit O-HY zu tun hat
(ein neues Feld `dueDate` in einem Testobjekt, ein gekürzter Meldungstext). Ich habe diese
Datei zu keinem Zeitpunkt geöffnet oder geschrieben — die Änderung stammt aus einer anderen,
mir unbekannten, parallel laufenden Aufgabe in derselben Hoheit. Erwähnt zur Vollständigkeit
des `git status`-Bilds, nicht als eigenes Artefakt.

---

## 8. Annahmen

1. **„Zwei Orte" = die zwei tatsächlichen Aufrufstellen von `touchedOnBlur`**, nicht die
   sieben Bildschirme, die `onTouched` weiter konsumieren (Abschnitt 1). Die sieben kommen
   als Befund (Abschnitt 3.3), nicht als eigener Prüffall — eine gerenderte Messung an ihnen
   bräuchte `jsdom`/`@testing-library/react` (fehlt, wie schon in T-193 festgestellt).
2. **Der Fund in Abschnitt 3.3 ist eine Meldung, keine Korrektur.** Ich habe weder
   `touched.ts` noch `FormDialog.tsx` noch `nameSchema` angefaßt — außerhalb meiner Hoheit
   und außerhalb des Auftrags dieser Aufgabe.
3. **Der alte Fall 5 aus T-193 ist ersetzt, nicht daneben stehengelassen.** Sein Name behauptete
   etwas, das seine Daten nicht bauten (Z-52) — ihn zu behalten hieße, eine falsche Angabe im
   Bestand zu belassen, obwohl die Berichtigung sie sichtbar gemacht hat.
4. **Kein neuer Prüffall für die in Abschnitt 3.4 gezogene Folgerung selbst** (ein
   `it.todo` oder eine Wiederholung als eigener Fall wäre eine bloße Paraphrase der drei
   strukturellen Fälle davor gewesen — siehe Kommentar am Ende der `describe`-Gruppe).

---

## 9. Risiken

1. **Der Befund aus Abschnitt 3.3 ist real, aber heute folgenlos.** Sollte künftig eine
   achte Aufrufstelle von `TextField` (oder eine Änderung an einer der sieben heutigen)
   einen Wert vorbelegen, der reiner Leerraum sein kann, ohne daß `nameSchema` oder eine
   gleichwertige Schranke davorsteht, entstünde die stillschweigend fehlende Meldung genau
   dort — und kein Prüffall in `apps/web` würde das heute fangen, weil die Garantie in
   `apps/local-api` liegt.
2. **`touched.ts` wurde während der Messung zweimal weitergeschrieben** (Abschnitt 4). Die
   Rechenzeile blieb beide Male unverändert; ein dritter, mir nicht bekannter Zwischenstand
   mit geänderter Logik wäre möglich gewesen, ist aber durch den letzten `pnpm test`-Lauf
   dieser Aufgabe (gegen `5772408a…`, alle 1464 Fälle grün) ausgeschlossen.
3. **Kein `jsdom`/`@testing-library/react` im Bestand** — unverändert seit T-193, betrifft
   auch diese Aufgabe: Die sieben Aufrufstellen von `onTouched` lassen sich nicht gerendert
   messen, nur strukturell (Abschnitt 3.3) und durch Lesen der Quelle.

---

## 10. Offene Fragen

1. **An den Orchestrator / spec-ux-reviewer:** Verdient der Befund aus Abschnitt 3.3 (die
   Unschädlichkeit von `TextField`s Vorbelegung hängt an `nameSchema` in einem anderen
   Paket) einen eigenen Board-Eintrag, oder gilt er mit dem heutigen Stand von `touched.ts`
   (Abschnitt 4, zweite Kommentarfassung nennt densel­ben Punkt bereits) als ausreichend
   dokumentiert und damit erledigt?
2. **An den Orchestrator, zur Kenntnis:** `apps/web/test/app/undoDone.test.ts` ist bei
   Abschluß dieser Aufgabe verändert, ohne daß ich es angefaßt habe (Abschnitt 7,
   „Beobachtet, nicht angefaßt") — falls das nicht aus einer bekannten Aufgabe dieser Welle
   stammt, könnte es ein Hinweis auf einen zweiten, unabgestimmten Schreibzugriff auf dieselbe
   Hoheit sein.

---

## 11. Nächster Schritt

1. **Orchestrator:** Frage 1 aus Abschnitt 10 entscheiden.
2. **e2e-tester (zur Kenntnis, kein Auftrag von mir):** Eine gerenderte Messung der sieben
   `onTouched`-Aufrufstellen (tippen, verlassen, Meldung ansagen) bleibt die einzige Art,
   Abschnitt 3.3 über den heutigen strukturellen Befund hinaus laufend abzusichern — dieselbe
   Lücke, die T-193 für die vier Live-Regionen bereits benannt hat.
