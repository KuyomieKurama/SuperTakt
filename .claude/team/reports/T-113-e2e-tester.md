# T-113 — End-to-End für Buchung von Hand, Toast-Verdrängung, Regelnamen

Aufgabe: T-113 — End-to-End für Buchung von Hand, Toast-Verdrängung, Regelnamen
Status: fertig

---

## Artefakte

| Datei | Was |
|---|---|
| `tests/e2e/manual-booking-movement.spec.ts` | neu. Drei Fälle für `POST /time-entries` mit `poolMovement` (E-061 Nachtrag, O-V): erste Buchung mit Bewegung, Gegenprobe auf bereits offener Buchung (`null`), erledigtes Todo (kein Verlassen einer `completion: 'done'`-Spalte, „Erledigt" bleibt gesetzt) |
| `tests/e2e/toast-eviction.spec.ts` | neu. W-10: eine Meldung mit „Rückgängig" bleibt beim Verdrängen des Toast-Stapels stehen, die älteste ohne Aktion verschwindet, „Schließen" entfernt sie weiterhin |
| `tests/e2e/tag-folder-rule-lock.spec.ts` | geändert. Drei bestehende Wortlaut-Erwartungen (Ordner, Tag, Status — je eine Regel) auf die Fassung nach T-110 gestellt (`„Betroffen ist die Regel …“`); neuer Fall: ein Tag in zwei Regeln (`„Betroffen sind die Regeln … und …“`); Dateikopf um einen Nachtrags-Absatz ergänzt |
| `tests/e2e/support/api.ts` | geändert. `CreatedTimeEntryResult` (analog `TodoDoneResult`) und `createTimeEntryWithMovement` — Vertrag von `POST /time-entries` mit `poolMovement`, nach dem Muster der bestehenden Timer-/Done-Helfer |
| `docs/testplan.md` | neuer Abschnitt „21. Nachtrag aus T-113“ mit TP-EXPST-14, TP-TOAST-01, TP-TAG-15 sowie der Umstellung der drei TP-TAG-14-Wortlaute, nach dem Muster der Abschnitte 18–20 |

Nicht angefasst: `apps/web/src/**`, `apps/local-api/**`, `packages/**`, `apps/*/test/**`,
`docs/bedrohungsmodell.md` — dort arbeiteten frontend-dev, unit-tester und security-checker
sichtbar parallel (`git status` bestätigt: nur die oben genannten Dateien in meiner Hoheit
verändert).

---

## Zusammenfassung

Alle drei im Auftrag benannten Abläufe sind jetzt als End-to-End-Fälle vorhanden und laufen grün:
die Buchung von Hand mit Poolbewegung in drei Ausprägungen (erste Buchung, Gegenprobe ohne
Bewegung, erledigtes Todo ohne Verlassen der Erledigt-Spalte), die Toast-Verdrängung nach W-10
(Meldung mit Rückweg bleibt, älteste ohne Aktion weicht, „Schließen" wirkt weiterhin) und die
Regelnamen-Wortlaute nach T-110 (ein Gattungswort vorn, sowohl für eine als auch für zwei
Regeln). Alle drei Bereiche waren zum Zeitpunkt der Auftragserteilung durch parallele Wellen
(T-107/T-108 für Buchung und Toast, T-110 für die Regelnamen) bereits vollständig im Baum, sodass
kein Fall tatsächlich rot ausgeführt wurde — eine kurzzeitig widersprüchliche Zwischenfassung von
`errorText.ts` wurde nur am Quelltext beobachtet (kein ausgeführter Testlauf), bevor T-110 fertig
war. Der volle `pnpm run test:e2e` steht bei 56/56 (Vergleichsmarke 51/51 nach `4dd3171`, plus
fünf neue Fälle: drei aus `manual-booking-movement.spec.ts`, einer aus `toast-eviction.spec.ts`,
einer aus `tag-folder-rule-lock.spec.ts`).

---

## Annahmen

1. **Wortlaut-Umstellung auf alle drei Löschflächen ausgeweitet, nicht nur auf den Tag-Fall.**
   Der Auftrag nennt als Beispiel „Löschversuch eines Tags"; da Ordner, Tag und Status
   dieselbe Funktion (`errorMessageWithRules`) rufen und dieselbe Wortlautänderung nach T-110
   erfahren, hätte eine Umstellung nur des Tag-Falls zwei der drei Erwartungen in derselben
   Datei stillschweigend auf dem alten Wortlaut zurückgelassen — sie wären bei der nächsten
   Berührung ohne erkennbaren Grund rot geworden. Ich habe deshalb alle drei Einzel-Fälle
   (Ordner, Tag, Status) mit umgestellt und das im Dateikopf sowie in `docs/testplan.md`
   ausdrücklich begründet.
2. **`TP-TAG-14` selbst nicht umgeschrieben.** Nach dem in diesem Dokument etablierten Muster
   (ein „Nachtrag" ergänzt, er schreibt die historische Fassung nicht um — siehe Abschnitt 19,
   „Fünf rote Erwartungen …") steht die Wortlaut-Umstellung als Absatz unter dem neuen
   `TP-TAG-15`, nicht als Änderung an `TP-TAG-14`.
3. **Kein eigener „roter" Lauf gemeldet, weil keiner stattfand.** Die Aufgabenbeschreibung
   verlangt ausdrücklich, einen Fall mit Datei und Zeile als rot zu melden, falls der Baum noch
   auf dem alten Wortlaut steht. Bei jedem tatsächlich ausgeführten Playwright-Lauf (auch dem
   allerersten, direkt nach dem Schreiben der Testfälle) war T-110 bereits fertig im Baum, alle
   Läufe waren grün. Ich melde das wahrheitsgemäß als „bestanden", statt einen nicht
   stattgefundenen roten Lauf zu behaupten oder die einmalige Quelltext-Beobachtung eines
   Zwischenstands als Testergebnis auszugeben.
4. **Zwei getrennte Regeln für den W-10-Fall.** Eine einzelne Regel für sowohl den Rückweg-Toast
   („Vom Board nehmen") als auch die vier Karten hätte das Zurücknehmen der ersten Handlung die
   Karten der zweiten vom Board genommen. Zwei unabhängige Regeln vermeiden diese Kopplung, ohne
   den geprüften Mechanismus (Verdrängung im Toast-Stapel) zu verändern.
5. **`TP-TOAST-01` als neue Kennungsreihe.** Es gab keine bestehende TP-Kennung für
   Meldungsstapel-Verhalten (geprüft: keine `TP-TOAST-*`, `TP-MSG-*` o. Ä. im Dokument); eine neue
   Reihe war naheliegender als ein Fall unter einer thematisch nicht passenden Reihe
   (`TP-KANBAN-*`/`TP-EXPST-*`).
6. **`TP-EXPST-14` statt einer neuen Reihe für die Buchung von Hand.** Die bestehende Reihe
   `TP-EXPST-*` deckt bereits Zeitbuchung/Exportstatus samt Bewegungssatz (`TP-EXPST-12`/`-13`)
   ab; die Buchung von Hand mit Poolbewegung fügt sich als Fortsetzung ein.
7. **Die Traceability-Tabelle („Rückverfolgbarkeit") nicht angefasst.** Weder `TP-EXPST-13`
   noch `TP-TIMER-11` noch `TP-EXPST-12a` aus den Abschnitten 19/20 stehen dort — das etablierte
   Vorgehen lässt diese Tabelle bei einem Nachtrag unberührt, ich bin dem gefolgt.
8. **`localInputValue`/`isoNoMillis` als eigene, kleine Testhelfer in
   `manual-booking-movement.spec.ts`**, nicht aus `apps/web/src/lib/format.ts` importiert. Anders
   als `poolMovementSentence` (Fachlogik, die geteilt werden muss, um Abschreibfehler
   auszuschließen) ist die Umwandlung eines `Date` in ein `datetime-local`-Format kein
   Fachwissen; ein eigener, kleiner Helfer folgt demselben Muster wie `todayAt`/
   `localCalendarDay` in `calendar-day-boundary.spec.ts`.

---

## Risiken

1. **Sicherheit:** keine neue Angriffsfläche. Alle Testdaten tragen das `E2E-`-Präfix und sind
   erfunden; keine echten Call-Nummern, keine echten Namen. Die neuen Testfälle rufen
   ausschließlich bestehende Routen über die bestehende Oberfläche an.
2. **Zeitzonen-Annahme in `manual-booking-movement.spec.ts`:** Wie in `calendar-day-boundary.
   spec.ts` dokumentiert, geht die Datei davon aus, dass die ausführende Maschine in
   `Europe/Berlin` läuft (dasselbe `timezoneId` wie `playwright.config.ts` dem Browser vorgibt).
   Auf dieser Maschine bestätigt (`date` liefert `CEST`); eine andere Ausführungsumgebung mit
   abweichender lokaler Zeitzone müsste das nachziehen — derselbe, bereits bestehende Kompromiss
   wie in der genannten Datei.
3. **Parallele Wellen können die gemessenen Ergebnisse dieses Berichts durch spätere Änderungen
   an fremden Dateien wieder verschieben** (etwa eine erneute Überarbeitung von `errorText.ts`).
   Der hier gemeldete Stand ist der zum Zeitpunkt der Ausführung tatsächlich gemessene; ein
   zusammengesetzter Lauf nach Abschluss aller Wellen liegt laut Auftrag beim Orchestrator.
4. **`TP-TAG-15` hängt an der Reihenfolge zweier Pool-Anlagen** (`position`-Spalte, `MAX(position)
   + 1`). Das ist keine Testfall-Schwäche, sondern die tatsächliche, dokumentierte
   Sortierregel der Abfrage (`repo-tags.ts`); bei einer künftigen Änderung dieser Sortierung
   würde der Fall zu Recht rot.

---

## Offene Fragen

Keine an den Orchestrator.

---

## Nächster Schritt

1. **Orchestrator:** den zusammengesetzten Volllauf über alle Wellen (H) ist bereits mit dem
   vollen `pnpm run test:e2e` (56/56) erledigt, da T-107/T-108/T-110 zum Ausführungszeitpunkt
   bereits im Baum standen. Ein weiterer Lauf nach Abschluss aller noch offenen Wellenarbeiten
   (falls `errorText.ts` erneut angefasst wird) bleibt sinnvoll, ist aber keine Blockade mehr.
2. **unit-tester/documenter:** keine offenen Punkte aus diesem Auftrag.
3. **Falls `errorText.ts` erneut geändert wird:** `tests/e2e/tag-folder-rule-lock.spec.ts` (Zeilen
   174, 238, 265–303, 346) prüft den Wortlaut aus T-110 wörtlich und wird bei einer Rückkehr zum
   alten Satz zu Recht rot — kein weiterer Handlungsbedarf meinerseits, das ist die gewollte
   Eigenschaft dieses Testfalls.

---

## Befehle und Endstatus

| Befehl | Endstatus |
|---|---|
| `pnpm run typecheck:e2e` | 0 (zweifach) |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/manual-booking-movement.spec.ts` | 3/3 |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/toast-eviction.spec.ts` | 1/1 |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/tag-folder-rule-lock.spec.ts` | 5/5 (zweifach) |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/manual-booking-movement.spec.ts tests/e2e/toast-eviction.spec.ts` | 4/4 |
| `pnpm run test:e2e --reporter=list --retries=0` | **56/56**, 1,4 min (Vergleichsmarke 51/51 nach `4dd3171`) |

Port 17843/17844 war vor jedem Lauf frei (`ss -ltnp` geprüft); kein fremder Prozess beendet, kein
`git commit`/`stash`/`checkout`.
