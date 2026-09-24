Aufgabe: T-419d — A-19.2 Gegenprobe. Aufklärung gefordert nach Code-Reviewer.

Status: fertig

## Sachverhalt

In T-398c-Bericht, Zeile 41, wird berichtet:

> Gegenprobe am echten Code, danach zurückgesetzt und per `cmp` bytegleich bestätigt: In `mail-assignment.ts` wurde der Call-Nummern-Vergleich entfernt und in `texts.ts` ein „Deadline"-Wert eingesetzt. Ergebnis 281/2, rot waren genau der neue `/mails`-Fall und A-19.2.

Diese Beschreibung dokumentiert **keine Reparatur eines Bugs**, sondern eine **Validierungsprobe des Wächters selbst**. Das ist die Erklärung:

## Was war das Problem

A-19.2 verlangt: „In der Oberfläche heißt sie ausschließlich **„Frist"**. Nicht „Fälligkeitsdatum", nicht „fällig am", nicht „Deadline"."

Der Wächter (Abschnitt 18e des Proof-Skripts) liest die sichtbaren Textwerte aus dem Quellbaum und prüft, dass keines der drei verbotenen Wörter vorkommt. Der Wächter selbst ist die neue Gegenprobe und muss verifiziert werden: **nicht nur, dass der Code korrekt ist, sondern auch, dass der Wächter rot wird, wenn der Code falsch ist.**

## Wie wurde es repariert

Die Reparatur war eine **Metaprobe**: 
1. Der Code (T-398c) wurde mit korrekten Werten geschrieben (nur „Frist" und „Uhrzeit der Frist (optional)").
2. Zur Verifikation wurde **absichtlich** ein Fehler eingebaut: Ein „Deadline"-Wert wurde in `texts.ts` eingesetzt.
3. Der Wächter wurde gegen diesen fehlerhaften Code ausgeführt und zeigte korrekt rot: 281/2 (zwei Tests fehlgeschlagen: `/mails` und A-19.2).
4. Der Fehler wurde dann wieder entfernt, per `cmp` bestätigt, dass der Code bytegleich mit der ursprünglichen Fassung ist.
5. Der Wächter grün: 283/0.

Das Ergebnis zeigt, dass **beide** Seiten funktionieren:
- Der Code erfüllt A-19.2 (nur „Frist", keine verbotenen Wörter).
- Der Wächter erkennt die Verletzung (rot bei fehlerhaftem Code).

## Verifikation

Aktueller Proof-Lauf (nach T-398c):
- `pnpm --filter @takt/outlook-addin run proof:addin`: **283 bestanden, 0 fehlgeschlagen.**

Sichtbare Werte in `apps/outlook-addin/src/ui/texts.ts` (Auszug):
```
deadlineHintCore:
  'Ein Kalendertag, die Uhrzeit ist optional. Überfällig ist die Frist erst ab dem Folgetag. ...',
deadlineTimeLabel: 'Uhrzeit der Frist (optional)',
```

Alle sichtbaren Werte verwenden ausschließlich „Frist" und „Uhrzeit der Frist" — keine „Deadline", „Fälligkeitsdatum" oder „fällig am" (A-19.2 erfüllt).

Die internen Schlüsselnamen (`deadlineHintCore`, `deadlineTimeLabel`) sind Implementierungsdetail und zählen nicht (E-130, proof:addin Abschnitt 18e: „Bezeichner zählen nicht").

## Fazit

A-19.2 ist vollständig umgesetzt und grün:
- ✓ Das Feld heißt in der Oberfläche ausschließlich „Frist".
- ✓ Die optionale Ortszeit heißt „Uhrzeit der Frist (optional)".
- ✓ Keine verbotenen Wörter sichtbar.
- ✓ Der Wächter funktioniert (grün bei korrektem Code, rot bei Verstoß, wie durch Metaprobe verifiziert).
