Aufgabe: T-274 — Der Prüffall hält die alte Lesart fest, die der Auftraggeber geändert hat

Status: fertig

Artefakte:

- `apps/local-api/test/version/checker.test.ts` (geändert — der `describe`-Block „A-18.11 — nach
  einem Fehlschlag gibt es KEINEN zweiten Versuch im selben Lauf" ist ersetzt durch „A-18.11 — ein
  Fehlschlag beendet den Prüflauf, nicht die Prüfung (T-273)" mit fünf Fällen)
- `.claude/team/reports/T-274-unit-tester.md` (dieser Bericht)

Zusammenfassung: Den fertigen Ersatz aus dem Bericht von domain-dev (T-273-domain-dev.md,
Abschnitt 5) geprüft und unverändert übernommen — er kam wie zugesagt ohne Umbau der Helfer
(`countingSource`, `waitUntil`, `silentLogger`, `checkers`) aus. Vor der Übernahme die geforderte
Gegenprobe selbst gefahren, nicht nur die des domain-dev gelesen: gegen den gebauten Stand grün
(13/13), danach `version.ts` **temporär** auf den alten Stand zurückgesetzt (die zwei von T-273
hinzugefügten `schedule(minIntervalMs);`-Zeilen im Fehlschlag- und im `catch`-Zweig entfernt, die
dritte im Rücksprung-Zweig unangetastet gelassen) und wieder gegen dieselben fünf Fälle gefahren:
vier von fünf fallen rot, darunter der vom Auftraggeber gemeldete Fall selbst
(„Fehlschlag, dann Erfolg im selben Prozeßlauf"). Danach `version.ts` byte-genau wiederhergestellt
(Prüfsumme vor und nach der Rückstellung identisch, `f0e0d6baf12c03efb77ec3b4ed051bc1`) und erneut
grün gemessen (13/13). `packages/*/test/**` und `apps/*/test/**` nach weiteren Prüffällen mit der
alten Lesart durchsucht — keine weiteren gefunden. `pnpm test:coverage` steht jetzt bei
88 Dateien/1582 grün/0 rot/3 übersprungen (1585), `pnpm typecheck` vollständig grün.

Annahmen:

1. Den Ersatzblock aus dem Bericht des domain-dev **wörtlich** übernommen, ohne eigene
   Umformulierung — er ist bereits an derselben Naht gebaut, an der die alte Lesart stand, und der
   Auftrag verlangt ausdrücklich die Gegenprobe an genau diesem Fall, nicht eine eigene
   Neufassung.
2. Für die geforderte Rot-Gegenprobe habe ich `version.ts` **temporär** verändert (zwei Zeilen
   entfernt), sofort danach exakt wiederhergestellt (Prüfsumme verglichen) und nichts davon
   committet oder liegen gelassen. Das ist eine Messung, kein Eingriff in fremde Hoheit — der
   Auftrag verlangt ausdrücklich „stell den alten Stand her und miß, daß dein Fall dort fällt".
3. Der fünfte Fall („stop() nach einem Fehlschlag plant nichts nach", A-V-12) bleibt in der
   Rot-Gegenprobe grün, auch am alten Stand — das ist richtig und kein Mangel: `stop()` plant in
   beiden Ständen nichts nach, weil `schedule()` `stopped` selbst prüft; dieser Fall mißt A-V-12,
   nicht die T-273-Änderung, und gehört trotzdem in denselben Block, weil er an derselben Naht
   hängt (Geschwister-Verhalten laut domain-dev-Bericht).
4. Über die eigene Hoheit hinaus (`docs/bedrohungsmodell.md`, `docs/testplan.md`) nichts
   angefaßt — das sind explizit fremde Zuständigkeiten (security-checker, e2e-tester) laut
   Auftrag und dem Bericht des domain-dev.

Risiken: keine neuen. Die Änderung ist ausschließlich eine Prüffallanpassung an eine bereits
gebaute und vom domain-dev nachgewiesene Verhaltensänderung; an Produktivcode wurde nichts
dauerhaft geändert. Die offenen Risiken R-273-1 bis R-273-3 aus dem domain-dev-Bericht bleiben
Sache des Orchestrators/domain-dev, nicht dieser Aufgabe.

Offene Fragen: keine.

Nächster Schritt: `docs/bedrohungsmodell.md` (Zeile 4071 A-V-11 samt Meßvorschrift, Zeile 4204
Beurteilung A-V-11) durch security-checker in derselben Welle berichtigen, wie im Auftrag
verlangt — sonst mißt dort weiterhin ein grüner Wächter die Zusage, die dieser Prüffall jetzt
korrekt widerlegt. Danach `pnpm check` in einem Zug fahren (Einzelläufe `typecheck` und
`test:coverage` sind hier bereits grün gemessen).
