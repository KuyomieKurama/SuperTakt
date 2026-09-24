Aufgabe: T-395 — Prüffälle, die vom Umbau in Welle 18a unabhängig sind (T-364 §6, Flattern, O-IJ)
Status: fertig

Artefakte:
- `apps/local-api/test/version/checker.test.ts` (geändert — vier neue Prüffälle zu A-A-124)
- `apps/web/test/lib/touched.test.ts` (geändert — ein neuer Prüffall zu O-IJ; die Datei bestand
  bereits, siehe „Annahmen")
- `packages/storage/test/repo-version-check.test.ts` (nicht geändert, mit Begründung)
- `.claude/team/reports/T-395-unit-tester.md` (dieser Bericht)

Zusammenfassung: Die vier A-A-124-Prüffälle aus T-364 §6 sind neu aus der Bedrohungsmodell-Zeile
und den Kommentaren zu `forgetStore`/`reportStoreFailure` abgeleitet (der T-364-Bericht selbst ist
nicht mehr im Bestand) und decken die Unterscheidung zwischen einem werfenden und einem stummen
Speicher ab; der Rot-Nachweis lief gegen eine Wegwerf-Nachbildung des alten Kontrollflusses, weil
das Sandbox-Berechtigungssystem eine direkte Mutation von `version.ts` verweigert hat. Der
Flatter-Lauf über 20 Wiederholungen war durchgehend grün. Der O-IJ-Fall schließt die in
`touchedCallSiteNeutrality.test.ts` offen gelassene Abhängigkeit von `nameSchema`, indem er
`touchedOnBlur` mit einem Wert prüft, den `nameSchema` nie zuließe.

Prüfung:
- `npx vitest run apps/local-api/test/version/checker.test.ts` — 28/28 grün (24 vorbestehend + 4 neu).
- Flattern: 20 aufeinanderfolgende Läufe derselben Datei (kein `--repeat` in Vitest 4, deshalb
  Bash-Schleife) — **20 von 20 grün**, jeder Lauf exakt „28 passed (28)"; Protokolle liegen unter
  `/tmp/claude-1000/.../scratchpad/flatter-run-{1..20}.log`.
- `npx vitest run apps/web/test/lib/touched.test.ts apps/web/test/shared/ui/touchedCallSiteNeutrality.test.ts`
  — 14/14 grün (7 + 7, vorher 6 + 7).
- `npx vitest run apps/local-api/test packages/storage/test apps/web/test` (die drei berührten
  Pakete zusammen) — 1108 grün, **3 rot, alle in `apps/local-api/test/routes/addin/service.test.ts`**
  (`TypeError: bookOnTodo is not a function`). Das ist kein Befund dieser Aufgabe: `git status`
  zeigt, daß `apps/local-api/src/routes/addin/service.ts` und mehrere Timer-/Datensicherungsdateien
  bereits unversioniert geändert sind — genau die parallele Welle (T-388 domain-dev), vor der der
  Auftrag ausdrücklich warnt („Fass keine Prüffälle zu Timer, Datensicherung oder Zeitbuchung an").
  Ich habe diese Datei nicht angefaßt und messe nicht gegen einen Zwischenstand; das ist ein Befund
  für den Orchestrator, keiner für mich.
- Rot-vor-Grün: siehe Abschnitt unten, keine Prüfdatei mutiert Produktivcode.
- Nicht geprüft: `pnpm check` als Ganzes (Auftrag begrenzt auf die drei genannten Prüfdateien;
  ein voller Lauf griffe in laufende Parallelarbeit).

--- T-364 §6 — die vier A-A-124-Prüffälle, hergeleitet ---

Der T-364-Bericht ist nicht mehr im Bestand (`.claude/team/reports/**` ist ungetrackt, siehe
`board.md` „Auffällig" nach Welle 17: „Berichte seit #19 gelöscht"). Die vier Fälle sind deshalb
aus zwei Quellen neu abgeleitet, wie im Auftrag verlangt:

1. `docs/bedrohungsmodell.md` A-A-124, wörtlich: „Ein abgelegter Speicher bleibt für die Laufzeit
   abgelegt — das gehört in den Satz daneben. Der Bestandswert ist danach veraltet, nicht fehlend;
   eine Datensicherung nach A-20 trägt einen Zeitpunkt, der beliebig alt sein kann, und sieht dabei
   gültig aus" (Rechte Spalte dort: „2 von 40 Schreibversuchen nach der ersten abgelaufenen Frist").
2. Die Kommentare in `apps/local-api/src/features/version/version.ts` bei `forgetStore` und
   `reportStoreFailure` (Zeilen 648–727, 608–646), die T-367s Umsetzung begründen: Seit T-367 sind
   die beiden Fehlschlaggründe eines `VersionCheckStorePort` — `threw` (der Speicher lehnt sofort
   ab) und `timeout` (er antwortet nie innerhalb `VERSION_CHECK_STORE_DEADLINE_MS`) — **nicht mehr
   gleich behandelt**. Vorher legten beide den Speicher dauerhaft ab; seither legt nur `timeout` ab,
   `threw` wird nur gemeldet, und der nächste Prüflauf versucht wieder zu schreiben.

Daraus die vier Fälle, alle in `checker.test.ts` (Begründung für „bzw." unten):

1. **Ein werfender Speicher bleibt im Einsatz** — drei Läufe, drei Schreibversuche, aber genau EINE
   Protokollzeile (`version_check_state_unwritable`). Das ist die eigentliche Neuerung von T-367;
   ein einzelner Wurf allein hätte auch die alte, vereinheitlichte Fassung nicht widerlegt.
2. **Ein stummer Speicher wird nach seiner Frist endgültig abgelegt** — vier ausgehende Anfragen,
   aber genau EIN Schreibversuch. Das ist die Gegenprobe: Nur dieser Grund darf die „bleibt für die
   Laufzeit abgelegt"-Eigenschaft aus A-A-124 zeigen.
3. **Wirft der Speicher zuerst und fällt danach still, teilen sich beide Gründe eine Zeile — und es
   ist die erste.** Genau der Satz aus dem Kommentar bei `reportStoreFailure": „Beide Gründe teilen
   sich die eine Zeile […] steht im Protokoll der erste der beiden Gründe und kein zweiter." Nach
   dem Wurf (Zeile 1, `unwritable`) folgt ein zweiter Versuch, der endgültig stumm bleibt und den
   Speicher ablegt — aber ohne eine zweite Zeile (`storeFailureLogged` steht schon).
4. **Der Bestandswert bleibt nach der endgültigen Ablage exakt auf dem letzten erfolgreichen Stand
   stehen** — über den echten `createVersionCheckStatePort`-Adapter (dieselbe Verdrahtung wie
   `composition.ts`, per `openStoreBackedDatabase()`), nicht über eine Attrappe. Zwei erfolgreiche
   Schreibungen, danach eine Stille, die endgültig ablegt; `lastCheckAt()` liefert nach weiteren drei
   Läufen exakt denselben Wert wie nach der zweiten Schreibung — veraltet, nicht `NULL`, sieht
   gültig aus. Das ist A-A-124 wörtlich genommen und nicht nur an der Meldung gemessen.

**Warum alle vier in `checker.test.ts` und keiner in `repo-version-check.test.ts`:** A-A-124 ist
eine Aussage über den Prüfer (`createVersionChecker`), nicht über den SQL-Adapter — die
Unterscheidung `threw` vs. `timeout` existiert nur in `version.ts`; der Adapter selbst kennt sie
nicht und hat kein Verhalten, das dort zu prüfen wäre. Fall 4 benutzt den echten Adapter zwar für
die DB-Seite, aber die eigentliche Zusicherung (die Ablage bleibt für die Laufzeit) entsteht wieder
im Prüfer — deshalb gehört er an dieselbe Naht wie die anderen drei. `repo-version-check.test.ts`
bleibt unverändert.

--- Rot vor Grün ---

Die im Bestand belegte Vorgehensweise für genau diesen Fall (T-368, `board.md` Welle 12: „Der rote
Stand ohne `git stash`: … je einmal kurzzeitig durch `git show HEAD:…` ersetzt und danach
byte-identisch zurückgeschrieben") wollte ich wiederholen: `version.ts` kurzzeitig auf die Zeile
`if (threw) forgetStore('threw');` zurückdrehen (die Fassung vor T-367, in der beide Gründe gleich
abgelegt hätten) und die vier neuen Prüffälle dagegen laufen lassen.

**Das hat die Sandbox verweigert** — der Bash-Aufruf (`sed -i` auf `version.ts`) wurde vom
Berechtigungs-Klassifizierer mit „Modify Shared Resources" abgelehnt, bevor eine einzige Zeile
geschrieben wurde (`md5sum` vor und nach dem Versuch ist identisch: `4bd6f4a7a3a43ae2a9fc192944242158`,
`git diff` zeigt keine Änderung an der Datei). Ich habe diese Verweigerung nicht umgangen, wie
angewiesen.

Stattdessen habe ich die betroffene Teilmenge der Logik (`remember`/`forgetStore`/
`reportStoreFailure`, rund 40 Zeilen) wortgleich in einer Wegwerfdatei nachgebaut
(`/tmp/claude-1000/.../scratchpad/aa124-harness.mjs`, dieselbe Bauart, mit der auch T-369 „den
alten Kontrollfluß … in einer Wegwerfdatei nachgebaut" hat) — parametrisiert über ein Kennzeichen
`dropOnThrow`, das zwischen der Fassung vor T-367 (`true`) und der heutigen (`false`) umschaltet.
Gegen dieselben vier Aussagen gefahren:

| Fall | vor T-367 (`dropOnThrow=true`) | seit T-367 / HEAD (`dropOnThrow=false`) |
|---|---|---|
| 1. werfender Speicher: ≥3 Schreibversuche | **ROT** (bleibt bei 1 Versuch) | GRÜN |
| 1. genau eine Zeile „unwritable" | GRÜN | GRÜN |
| 2. stummer Speicher: genau 1 Versuch | GRÜN | GRÜN |
| 2. genau eine Zeile „write_timeout" | GRÜN | GRÜN |
| 3. Wurf dann Stille: genau 2 Versuche | **ROT** (Speicher schon nach dem Wurf abgelegt → nur 1 Versuch) | GRÜN |
| 3. eine Zeile „unwritable", keine „write_timeout" | GRÜN | GRÜN |
| 4. genau 2 tatsächlich geschriebene Werte | GRÜN | GRÜN |
| 4. genau 3 Schreibversuche | GRÜN | GRÜN |

Fälle 1 und 3 sind die tatsächlichen Regressionsfänger — an ihrer Kernzusicherung (Zahl der
Schreibversuche) unterscheidet sich altes und neues Verhalten, und genau dort steht Rot vor Grün.
Fälle 2 und 4 messen eine Eigenschaft, die es schon vor T-367 gab (`timeout` legte immer ab); sie
bleiben unter beiden Fassungen grün und sind — wie T-368 das für seine eigenen Fälle C/D bzw.
C/F/H offen ausgewiesen hat — Dokumentation einer Invariante, kein Regressionsalarm. Das ist hier
genauso offen ausgewiesen und nicht als Rot-Nachweis mitgezählt.

--- O-IJ — `touchedOnBlur` schneidet selbst ---

`apps/web/test/lib/touched.test.ts` bestand bereits (sechs Fälle, aus O-GS/O-HY/T-207/T-208) — der
Auftrag nannte den Pfad „(neu)", die Datei war es nicht mehr; ich habe einen siebten Fall ergänzt
statt die Datei zu überschreiben, weil sie derselbe fachliche Gegenstand ist und ein zweiter Satz
Beschreibungen zu `touchedOnBlur` nur Verwirrung stiftete.

Der neue Fall schließt genau die Lücke, die `touchedCallSiteNeutrality.test.ts` selbst offen läßt
(Kopfkommentar dort, Abschnitt „TextField ist ein bloßer Durchreicher"): Ob die Stille an einem
leerraumhaltigen, unberührten Feld überhaupt eintritt, hängt an den sieben Aufrufstellen von
`TextField` davon ab, „ob irgendeine … dem Feld jemals einen Wert vorbelegt, der ausschließlich aus
Leerzeichen besteht — eine Eigenschaft, die außerhalb dieser Datei liegt (u. a. im Schema
`nameSchema` …)". Der neue Fall testet `touchedOnBlur` direkt mit `"\t\n  \t"` (Tabs und
Zeilenumbrüche, kein druckbares Zeichen) und `edited=false` — ein Wert, den `nameSchema`
(`z.string().trim().min(1)`) nie an einen Aufrufer liefern würde, ohne `nameSchema` zu importieren
oder aufzurufen. `touchedOnBlur` liefert `false`; die Gegenprobe mit der Fassung vor der
Berichtigung O-HY (`vorDerBerichtigungOHY`, bereits in der Datei definiert) liefert für denselben
Wert `true`. Damit ist gezeigt: Das Schneiden geschieht **in** `touchedOnBlur`, unabhängig davon,
was `nameSchema` zuläßt oder eines Tages ändert — genau die Aussage, die O-IJ verlangt hat.

Annahmen:
- „(neu)" im Auftrag für `touched.test.ts` gelesen als „neuer Prüffall", nicht als „neue Datei" —
  die Datei war bereits vorhanden und demselben Gegenstand gewidmet; eine zweite, parallele Datei
  hätte dieselbe Aussage doppelt und mit widersprüchlicher Numerierung geführt.
- Alle vier A-A-124-Fälle in `checker.test.ts` statt verteilt auf beide genannten Dateien
  (Begründung siehe oben) — der Auftrag ließ das mit „bzw." offen.
- Zeitkonstanten der vier neuen Prüffälle (15–20 ms Boden/Takt, 10–15 ms Speicherfrist) an den
  bereits im Bestand verwendeten Größenordnungen orientiert (z. B. Zeile 668–671 der Datei); der
  20-fache Flatter-Lauf bestätigt empirisch, daß sie nicht knapp sind.

Risiken:
- Kein Sicherheitsrisiko durch diese Änderung; reine Testdatei-Ergänzungen ohne neue Netzwerk-
  oder Dateisystemzugriffe.
- Die drei vorgefundenen roten Fälle in `apps/local-api/test/routes/addin/service.test.ts`
  (`bookOnTodo is not a function`) zeigen, daß die parallele Welle (T-388 domain-dev) derzeit eine
  Schnittstelle mitten im Umbau hat, gegen die andere, längst bestehende Prüffälle rot laufen. Das
  ist kein Befund dieser Aufgabe, gehört aber vor die nächste Freigaberunde.

Offene Fragen:
- Soll der harte Beweis gegen die alte A-A-124-Fassung (heute nur als Wegwerfdatei im Scratch-
  Verzeichnis, nicht versioniert) irgendwo im Bestand dauerhaft festgehalten werden, oder reicht
  dieser Bericht als Nachweis? Ich habe nichts unter `packages/*/test/**` dafür angelegt, um keine
  Kopie der Produktivlogik im Prüfbestand zu führen.
- Wer räumt `apps/local-api/test/routes/addin/service.test.ts` wieder grün — domain-dev im Rahmen
  von T-388, oder eine eigene Nacharbeit?

Nächster Schritt: Orchestrator informiert domain-dev/integration-dev über den roten Stand in
`service.test.ts` (T-388-Fläche); anschließend reguläre Freigaberunde über T-395 durch
code-reviewer/spec-ux-reviewer wie für die übrigen Wellen-18-Aufträge.
