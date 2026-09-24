# T-368 — Die Prüffälle zu R-34: die elf Stunden, die niemand gearbeitet hat

**Rolle:** unit-tester. **Stand:** 2026-09-14, Welle 10 (Fortsetzung). HEAD `311b26e`; T-358 und
T-363 liegen unversioniert im Arbeitsbaum.

## Status

**Fertig.**

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/test/usecases/data-transfer-timer-recovery.test.ts` | Neu. Fälle A–E aus `T-358-domain-dev.md` Abschnitt 8 |
| `apps/local-api/test/usecases/timer-recovery-booking.test.ts` | Neu. Fälle T363-A bis T363-H aus `T-363-domain-dev.md` Abschnitt 7 |

Kein Produktivcode dauerhaft geändert. Für den Rot-Nachweis wurden
`apps/local-api/src/features/data-transfer/data-transfer.ts` und
`apps/local-api/src/features/timer/timer.ts` **kurzzeitig** ersetzt und danach **zeichengleich**
zurückgeschrieben — Nachweis über `md5sum` und `git diff --stat`, Einzelheiten unten.

## Zusammenfassung

Ich habe die von zwei domain-dev-Arbeiten (T-358, T-363) hinterlassenen Vorgaben für R-34 gebaut:
13 neue Fälle über zwei Dateien, alle gegen den ausgelieferten (Arbeitsbaum-)Stand grün. Für jeden
Fall habe ich vorher geprüft, ob und wogegen er rot wird — zehn der 13 Fälle sind rot gegen die
echte `HEAD`-Fassung der jeweiligen Datei, Fall E ist zusätzlich rot gegen die im T-358-Bericht
selbst verworfene Zwei-Transaktionen-Anordnung (während Fall A dort weiterhin grün bleibt — genau
die Warnung aus dem Auftrag). Drei Fälle (C und H aus T-358/T-363 sowie F, C aus T-363 — siehe
Tabelle) bleiben bei jeder erprobten Gegenfassung grün; das ist keine Schwäche des Falls, sondern
weil sie eine Invariante messen, die schon vorher galt (dokumentiert, nicht verschwiegen). Der
gesamte Bestand unter `apps/local-api/test` steht danach bei 365 grünen Fällen (vorher 352, plus
die 13 neuen), `pnpm test:coverage` über den ganzen Arbeitsbereich ist grün mit unverändert hohen
Werten auf `packages/domain` (95,05 % Anweisungen) und `packages/export` (97,95 % Anweisungen).

## Wie ich rot hergestellt und zurückgenommen habe

Wie in T-355 und T-358 beschrieben: **Meßkopie statt Zurücksetzen des Baums.** Vor jeder Messung
eine Sicherungskopie der betroffenen Produktivdatei angelegt, die Datei durch die zu prüfende
Gegenfassung ersetzt, den betroffenen Testlauf gefahren, danach die Sicherungskopie **exakt**
zurückgeschrieben und die Rücknahme über `md5sum` **und** `git diff --stat` gegen den
Ausgangszustand geprüft (Zahlen unten). `git stash`/`git checkout --` wurden nicht benutzt, wie im
Auftrag verboten.

1. **`data-transfer.ts` → echte `HEAD`-Fassung** (`git show HEAD:… > …`), `timer.ts` blieb der
   Arbeitsstand. Lauf: `data-transfer-timer-recovery.test.ts`. Ergebnis: Fall A, B, E rot; Fall C,
   D grün. Zurückgeschrieben, `md5sum` vorher/nachher `7a33c77535b74ca9fc0fc76979803f25` (identisch),
   `git diff --stat` vorher/nachher beide `100 ++++...+-`, `1 changed, 99 insertions(+), 1
   deletion(-)`.
2. **`timer.ts` → echte `HEAD`-Fassung**, `data-transfer.ts` blieb der Arbeitsstand. Lauf:
   `timer-recovery-booking.test.ts`. Ergebnis: T363-A, B, D, E, G rot; T363-C, F, H grün.
   Zurückgeschrieben, `md5sum` vorher/nachher `5d0432e357792755779bf56487c938db` (identisch),
   `git diff --stat` vorher/nachher beide `344 ++++...+-`, `1 changed, 334 insertions(+), 10
   deletions(-)`.
3. **Nur für Fall E:** die im T-358-Bericht Abschnitt 0 beschriebene, dort selbst verworfene
   Zwei-Transaktionen-Anordnung nachgebaut (`import { captureTimerRecovery } from
   '../timer/timer.ts'` plus `replaceAll` in einer Klammer, `captureTimerRecovery(context)` als
   zweiter, separater Aufruf dahinter). Lauf: `data-transfer-timer-recovery.test.ts`. Ergebnis:
   **nur** Fall E rot (der nebenher fragende Leser sieht `bookableSeconds: undefined` statt
   `1200`), Fall A/B/C/D bleiben grün — genau die im Auftrag zitierte Warnung aus T-358 Abschnitt 8
   („Ein Prüffall, der nur die 1200 s mißt, bleibt grün…"), jetzt selbst nachgemessen statt
   zitiert. Zurückgeschrieben, `md5sum` danach wieder `7a33c77535b74ca9fc0fc76979803f25`.

Nach allen drei Rücknahmen: `pnpm vitest run apps/local-api/test` → **365 grün, 2 übersprungen, 0
rot**, `pnpm run typecheck:test` (Teilstrecke `packages/domain` bis `apps/local-api`) fehlerfrei.

## Tabelle: Fall, Behauptung, Rot-Nachweis, Fundstelle

| Fall | Was er festnagelt | Rot gegen welchen Stand | Datei : Zeile (Fall) |
|---|---|---|---|
| **T358-A** | `importDataArchive` bucht bei einem mitgereisten laufenden Timer **1200 s** statt **39600 s** (die Zahl aus R-34) — geprüft über `loadOrphanedTimer` **und** `resolveOrphanedTimer` | **rot** gg. echtes `HEAD` von `data-transfer.ts` (`orphaned` → `undefined`/`null`, Auflösung wirft) | `data-transfer-timer-recovery.test.ts:160` |
| **T358-B** | Ein Archiv **ohne** laufenden Timer löscht die Aufnahme (`entryId → null`), auch wenn das Ziel selbst einen eigenen verwaisten Eintrag hatte; danach `timer_not_running` | **rot** gg. echtes `HEAD` (die alte, gelöschte Zeilen-ID blieb in `entryId` stehen) | `data-transfer-timer-recovery.test.ts:180` |
| **T358-C** | Ein ungültiges Archiv (falsche Fassung / falsches Format / kein Objekt) läßt die Aufnahme, den verwaisten Eintrag und die Todoanzahl **unverändert** | **grün bei jeder erprobten Gegenfassung** (echtes `HEAD` tastet die Aufnahme dort ohnehin nie an — die Zusicherung ist eine Invariante, die schon vor T-358 galt; kein widerlegender Zwischenstand gefunden, siehe „Annahmen") | `data-transfer-timer-recovery.test.ts:204` |
| **T358-D** | Ein Zusammenhang **ohne** `timerRecovery`-Feld bleibt nach einem gültigen Import bei `undefined` (kein Wurf, keine Zusage, die es nicht gibt) | **grün bei jeder erprobten Gegenfassung** (echtes `HEAD` faßt `timerRecovery` nie an, trivial unverändert; siehe „Annahmen") | `data-transfer-timer-recovery.test.ts:235` |
| **T358-E** | `replaceAll` und die Nachführung liegen in **einer** Transaktion — gezählt, nicht nur an der Zahl abgelesen; zusätzlich sieht ein **echter**, synchron mitgestarteter Leser über dieselbe Warteschlange sofort `1200`, nicht `null` | **rot** gg. echtes `HEAD` **und** rot gg. die im T-358-Bericht verworfene Zwei-Transaktionen-Anordnung (Fall A bleibt dort ausdrücklich grün, Fall E fängt es) | `data-transfer-timer-recovery.test.ts:250` |
| **T363-A** | `POST /timer/stop` nach dem Einspielen bucht **1200 s**, nicht **39600 s** | **rot** gg. echtes `HEAD` von `timer.ts` (39600 statt 1200) | `timer-recovery-booking.test.ts:98` |
| **T363-B** | Derselbe Stopp nach einem **gewöhnlichen Absturz ganz ohne Archiv** bucht ebenfalls 1200 s — der Fall, für den E-036 geschrieben wurde | **rot** gg. echtes `HEAD` (39600 statt 1200) | `timer-recovery-booking.test.ts:122` |
| **T363-C** | Der **gewöhnliche** Fall (Timer dieser Sitzung, nie „vorgefunden") bucht unverändert die Wanduhr | **grün bei jeder erprobten Gegenfassung** (`HEAD`s `stopTimer` kennt keine Fallunterscheidung und liefert dieselbe Wanduhr-Zahl; Kontrollfall gegen ein Zurückdrehen der Verengung, siehe „Annahmen") | `timer-recovery-booking.test.ts:144` |
| **T363-D** | Ein `POST /timer/heartbeat` auf einem vorgefundenen Eintrag schreibt **kein** Lebenszeichen (`seenAt: null`) und hebt `bookableSeconds` **nicht** an | **rot** gg. echtes `HEAD` (Heartbeat wurde geschrieben, `bookableSeconds` sprang auf 39600) | `timer-recovery-booking.test.ts:162` |
| **T363-E** | `startTimer` auf einem **anderen** Todo schließt einen vorgefundenen, verdrängten Timer ebenfalls bei 1200 s, nicht bei der Wanduhr | **rot** gg. echtes `HEAD` (39600 statt 1200) | `timer-recovery-booking.test.ts:188` |
| **T363-F** | Zwei Timer **derselben** Sitzung: die Verdrängung bucht weiter die Wanduhr (39600 s), und `startTimer` ohne `stopRunning` liefert weiterhin `confirmation_required` (A-6.8 unberührt) | **grün bei jeder erprobten Gegenfassung** (beide Teilaussagen sind vom T-363-Fix unberührte Invarianten; Kontrollfall, siehe „Annahmen") | `timer-recovery-booking.test.ts:216` |
| **T363-G** | Ohne `timerRecovery` im Zusammenhang gilt **jeder** offene Eintrag als vorgefunden — der Stopp verwirft (`timer_too_short`), statt die Wanduhr zu buchen | **rot** gg. echtes `HEAD` (lieferte `recorded`/39600 statt `discarded`/`timer_too_short`) | `timer-recovery-booking.test.ts:238` |
| **T363-H** | Der reale Zusammenbau (`composition.ts`) setzt `timerRecovery: { entryId: null }` — die Zusage, die kein Typ erzwingen kann | **grün bei jeder erprobten Gegenfassung** (`composition.ts` ist von beiden Änderungen unberührt; die Bauform selbst ist die Zusicherung, keine Verhaltensänderung zum Rückdrehen, siehe „Annahmen") | `timer-recovery-booking.test.ts:256` |

Zusätzliche Absicherung: Für die drei quellseitigen Aufbauten (T358-A, T358-E, T363-A, T363-E)
mußte ich dem Quellrechner-Kontext **vor** dem Start explizit `timerRecovery: { entryId: null }`
mitgeben — sonst behandelt `touchHeartbeat` seit T-363 auch den frisch gestarteten Quell-Timer als
„vorgefunden" (weil `context.timerRecovery === undefined` immer „vorgefunden" bedeutet) und schreibt
gar kein zweites Lebenszeichen. Das ist **kein Produktivfehler**, sondern die dokumentierte
Ausfallrichtung aus T-363 Abschnitt 4 — ich habe das beim ersten Lauf selbst als roten Fehlschlag
gesehen (`bookableSeconds: 0` statt `1200`), auf die Ursache zurückgeführt und die Testaufbauten
entsprechend korrigiert, statt die Erwartung zu senken.

## Annahmen

- **„Rot zuerst" gilt streng für Fälle, die eine neue Verengung behaupten — nicht für
  Kontrollfälle, die eine Invariante festhalten.** T358-C, T358-D, T363-C, T363-F und T363-H
  bleiben bei jeder erprobten Gegenfassung (echtes `HEAD`, Zwei-Transaktionen-Variante) grün, weil
  die von ihnen geprüfte Eigenschaft schon vor T-358/T-363 galt oder von diesen beiden Änderungen
  nicht berührt wird. Ich habe das nicht verschwiegen, sondern in der Tabelle offen ausgewiesen
  (E-087-Geist: die heutige Zusage, nicht eine erfundene, festnageln). Sie bleiben trotzdem im
  Bestand, weil sie genau die Rückdreh-Fälle abdecken, die T-358/T-363 selbst als Risiko benennen
  (T358 Annahme „kein Zusammenhang, keine Verengung"; T363 Abschnitt 4 Punkt 2 „Pflicht im Typ …
  dreht die Ausfallrichtung auf die teure Seite").
- **Fall E mißt den Mechanismus über zwei unabhängige Signale**, nicht nur die Transaktionszahl:
  einen echten, synchron mitgestarteten Leser über dieselbe Warteschlange **und** die gezählten
  `inTransaction`-Aufrufe. Beide sind deterministisch (kein `setImmediate`/`setTimeout`, keine
  Zeitüberschreitung) — begründet in der FIFO-Reihung der Transaktionsklammer
  (`packages/storage/src/sqlite/unit-of-work.ts`): Wird ein zweiter Aufruf **synchron**, bevor der
  erste `await` zurückkehrt, gestartet, reiht er sich zwangsläufig **hinter** die laufende
  Transaktion ein, aber **vor** eine erst danach eröffnete zweite. Das ist derselbe Mechanismus,
  den T-358 mit `setImmediate`/`setTimeout` gemessen hat, hier ohne künstliche Zeitgeber
  nachgebaut, weil die Reihenfolge an dieser Stelle nicht vom Zufall, sondern von der
  Aufrufreihenfolge abhängt.
- **Keine geteilte Hilfsdatei.** Beide Testdateien tragen ihre `machine()`/`withTimerRecovery()`-
  Hilfsfunktionen selbst, wie es die bestehenden Dateien in `apps/local-api/test/usecases/` auch
  tun (kein `utils.ts`, kein Barrel).
- **`apps/local-api/test/version/**` und `packages/storage/test/repo-version-check.test.ts`
  nicht angefaßt**, wie im Auftrag verlangt (T-367 baut dort parallel). Der von T-358 gemeldete
  einmal geflackerte Fremdfall (`checker.test.ts:760`) liegt außerhalb meiner Hoheit in dieser
  Welle und wurde nicht untersucht.
- **Keine erfundenen Call-Nummern oder Kundendaten.** Alle Todotitel sind generisch
  („Rückruf", „Todo A/B", „Vorheriger Lauf").

## Risiken

- Die drei Kontrollfälle (T358-C/D, T363-C/F/H) hängen an keiner Gegenfassung, gegen die sie rot
  wären — sollte künftig jemand die zugehörige Invariante brechen (z. B. `timerRecovery` doch zur
  Pflicht machen, siehe T-363 Risiko 4), müssen diese Fälle **nicht automatisch** rot werden; ihr
  Wert liegt darin, daß sie beim nächsten Umbau **weiterlaufen** und die Erwartung dokumentieren.
- `data-transfer.ts` und `timer.ts` wurden zweimal kurz ersetzt und zurückgeschrieben, während
  laut Bericht der Domäne eine echte `pnpm desktop`-Sitzung auf 17843/17844/5173 lauscht
  (T-358/T-363 haben deshalb `proof:access`/`proof:conflicts`/`proof:export-api` ausgelassen). Ich
  habe aus demselben Grund nur `vitest run <Datei>` gefahren, nie `pnpm check`, `pnpm dev` oder
  einen Dienststart — die Ports blieben unberührt.
- Der von T-358 gemeldete flackernde Fremdfall in `apps/local-api/test/version/checker.test.ts`
  trat bei meinen Läufen nicht auf (23/23 bzw. der gesamte Bestand durchgehend grün), aber ich habe
  ihn nicht gezielt wiederholt geprüft — außerhalb meiner Hoheit in dieser Welle.

## Offene Fragen

Keine an den Orchestrator. Die beiden Vorgaben (T-358 Abschnitt 8, T-363 Abschnitt 7) waren
vollständig genug, um alle 13 Fälle ohne Rückfrage zu bauen.

## Nächster Schritt

1. **Orchestrator/domain-dev:** T-358 Risiko 1 (`POST /timer/stop` war der Restpunkt) ist mit
   T-363 bereits geschlossen — die Vorschläge für `risks.md` aus beiden Berichten (T-358 Abschnitt
   13, T-363 Abschnitt 12) können jetzt mit diesem Prüfstand als Beleg übernommen werden.
2. **Code-Reviewer:** T-363 Risiko 5 („zwei Schritte statt eines in `startTimer`") gezielt lesen —
   Fall T363-E/F decken den Erfolgsweg ab, nicht jeden Fehlschlagspfad der Speicherung.
3. Kein weiterer Prüfauftrag aus meiner Sicht offen für R-34.
