# T-120 — Die neue Uhr im Meldungsstapel, zwei Fälle dazu

Aufgabe: T-120 — Die neue Uhr im Meldungsstapel, zwei Fälle dazu
Status: fertig

---

## Artefakte

| Datei | Was |
|---|---|
| `tests/e2e/toast-eviction.spec.ts` | geändert. `page.clock.install()`/`pauseAt(...)` vor `gotoBoard`, damit die Achtsekundenfrist den Fall nicht mehr entscheidet; zusätzlich der Fixture-Baustein für die vier aktionslosen Meldungen ausgetauscht (siehe Zusammenfassung) |
| `tests/e2e/timer-switch-scrim-toast.spec.ts` | neu. A-6.8/B-1: kein Bild mit `.scrim` und `.toast` gleichzeitig beim Timerwechsel, gemessen über `MutationObserver` + `page.exposeFunction` (E-062) |
| `tests/e2e/toast-tab-order-scroll.spec.ts` | neu. SC 2.4.7: siebenmal „Erledigt“, Tab bis zur ältesten Meldung, `boundingBox().y >= 0` |
| `tests/e2e/outlook-addin-build.spec.ts` | Kommentar an Zeile ~113 berichtigt (`<bdi class="mono">` statt `<span class="mono">`, seit T-119); Locator unverändert, sucht weiterhin über die Klasse |
| `tests/e2e/support/nav.ts` | `gotoTodos(page, query?)` — optionaler, rückwärtskompatibler Suchparameter, damit ein Fall die Todo-Liste auf seine eigenen Testdaten eingrenzen kann |
| `docs/testplan.md` | neuer Abschnitt „22. Nachtrag aus T-120“ mit TP-TOAST-01 (Nachtrag), TP-TIMER-12, TP-TOAST-02 und dem Kommentarbefund |

Nicht angefasst: `packages/domain/**`, `apps/local-api/**`, `apps/web/**`, `apps/*/test/**` — parallel sichtbar verändert von domain-dev/unit-tester (`git status`: u. a. `packages/domain/src/characters.ts`, `enumeration.ts`, `apps/local-api/src/http/input.ts`, `apps/web/test/app/**`), keine dieser Dateien von mir berührt.

---

## Zusammenfassung

Der vorgegebene rote Fall ist behoben und alle Fälle laufen grün: `pnpm run test:e2e` steht bei
**58/58** (Vergleichsmarke 56, davon einer rot; +2 neue Fälle, der bisher rote Fall grün). Die
Uhr in `toast-eviction.spec.ts` entscheidet nicht mehr mit — `page.clock.install()`/`pauseAt(...)`
frieren die Zeit ein, bevor die Meldungen ausgelöst werden, sodass ausschließlich `evict()`
geprüft wird. Beim Bauen und Ausführen sind dabei **zwei unabhängige, echte Funde** aufgetaucht,
die mit der Uhr selbst nichts zu tun haben, aber den Fall betreffen: Erstens hat B-7 aus T-118
(derselbe Rückweg auf allen drei „Erledigt“-Flächen) die ursprüngliche Fixture-Grundlage
entwertet — „Als erledigt markieren“ auf dem Board trägt inzwischen selbst ein `action`-Feld, die
vier gebrauchten aktionslosen Meldungen entstehen jetzt über die Gegenrichtung („Erledigt
zurücknehmen“ auf zuvor per API erledigten Todos) auf der Todo-Liste. Zweitens ist eine
angehaltene Uhr mit wiederholten Ark-UI-Menü-Popovers (Kartenmenü) unverträglich: deren
Schließ-Aufräumen hängt an einem `setTimeout`, das unter einer angehaltenen Uhr nie feuert, ein
zweites Popover trifft dann auf das nicht entfernte erste. Die zwei neuen Fälle (A-6.8/B-1,
SC 2.4.7) sind aus der laufenden Anwendung heraus gemessen, wie E-062 verlangt — kein Wert wird
angenommen, sondern über `MutationObserver`/`page.exposeFunction` bzw. echte Tabulaturtasten
und `boundingBox()` erhoben. Der Kommentarbefund an `outlook-addin-build.spec.ts:113` ist
korrigiert, ohne den Locator anzufassen.

---

## Annahmen

1. **Vorschlag 1 aus T-118 gewählt (`page.clock`), nicht die Ersatzlösung.** Frontend-dev hat
   beides zur Wahl gestellt. `page.clock.install()`/`pauseAt(...)` entkoppelt den Fall vollständig
   von der realen Wanduhrzeit — unabhängig davon, wie langsam die Maschine oder wie viele Agenten
   parallel laufen — und erhält die feste Reihenfolge im Stapel, die der bestehende Kommentar
   ausdrücklich verlangt („nacheinander … damit die Reihenfolge im Stapel feststeht“). Die
   Ersatzlösung („alle vier ohne Zwischenwarten“) hätte diese Reihenfolgen-Garantie geschwächt
   (parallele Netzumläufe können in anderer Reihenfolge antworten, als sie ausgelöst wurden) und
   wäre trotzdem keine vollständige Entkopplung von der Zeit gewesen.
2. **`pauseAt(new Date(Date.now() + 2000))` statt `pauseAt(new Date())`.** Gemessen: Mit einem
   knapp am aktuellen Zeitpunkt liegenden Argument scheiterte `pauseAt` reproduzierbar mit
   `Cannot fast-forward to the past` — zwischen dem Node-seitigen `new Date()` und der
   tatsächlichen Ausführung im Browser vergeht Zeit, in der die seit `install()` normal
   mitlaufende Uhr bereits weiter ist. Ein Sicherheitsabstand behebt das; kein Fall dieser Datei
   liest eine absolute Uhrzeit, entscheidend ist nur, dass die Uhr danach weit vor den acht
   Sekunden aus `AUTO_DISMISS_MS` stillsteht.
3. **Die Fixture für die vier aktionslosen Meldungen umgebaut, nicht nur die Uhr.** Das war im
   Auftrag nicht ausdrücklich verlangt („Betroffen sind :84 … und die Schleife“), stellte sich
   beim tatsächlichen Ausführen aber als zwingend heraus (siehe Zusammenfassung, zwei Funde). Ich
   habe das als Teil desselben Falls behoben, weil sonst kein grüner Lauf möglich gewesen wäre,
   und beide Funde ausführlich im Dateikopf dokumentiert, statt sie stillschweigend zu
   übergehen.
4. **Zweite Board-Spalte für die vier Todos entfernt, Todo-Liste stattdessen.** Nach dem zweiten
   Fund (Ark-UI-Popover unter angehaltener Uhr) brauchten die vier Todos keine eigene
   Board-Sichtbarkeit mehr — das Kontrollkästchen der Todo-Liste ist ein natives Element ohne
   Popover-Abhängigkeit. Die Pool-/Tag-Anlage für diese vier Todos entfällt dadurch ersatzlos
   (weniger Fixture, gleiche geprüfte Sache).
5. **`.click()` statt `.check()`/`.uncheck()` auf den Kontrollkästchen.** Das Kästchen ist von
   React kontrolliert (`checked={done}` aus Serverdaten); sein sichtbarer Zustand wechselt erst
   nach dem `bump()`-Neuladen, nicht synchron mit dem Klick. `.check()`/`.uncheck()` prüfen den
   nativen Zustand unmittelbar nach dem Klick und scheitern deshalb an einem kontrollierten
   Element mit „Clicking the checkbox did not change its state“ — die anschließende Meldung ist
   die richtige Erfolgsprobe. Betrifft beide neuen/geänderten Dateien mit Kontrollkästchen.
6. **`gotoTodos` um einen optionalen Suchparameter erweitert**, statt in jedem Fall den ganzen
   Bestand im Tabulatur-Weg zu haben. Rückwärtskompatibel (`gotoTodos(page)` unverändert); der
   Parametername (`q`) ist wörtlich aus `TodoListScreen.tsx` übernommen. Beim ersten Versuch habe
   ich den Suchbegriff mit einem falschen Präfix zusammengesetzt (`E2E-Wechsel-${run}` traf die
   tatsächlichen Titel `E2E-Wechsel-A-${run}`/`-B-${run}` nicht als Teilzeichenkette) — beim Lauf
   bemerkt und auf den bloßen `run`-Zeitstempel vereinfacht.
7. **A-6.8/B-1 misst über `MutationObserver` + `page.exposeFunction`, nicht über ein
   programmatisches Rendering-Protokoll wie in T-118.** T-118 hat eine Wegwerf-Seite mit einem
   `useEffect` ohne Abhängigkeitsliste gebaut, um jede Zeichnung zu protokollieren — das ist bei
   einer Wegwerf-Seite möglich, aber nicht an der laufenden Anwendung, deren Quelltext nicht
   meiner Hoheit unterliegt. Ein `MutationObserver` misst dieselbe Sache (jede committete
   DOM-Änderung) von außen, ohne die Anwendung selbst zu ändern — das ist die für E-062 passende
   Fassung „im Browser, an der laufenden Anwendung“.
8. **SC 2.4.7 mit sieben statt zehn Meldungen** (T-118 maß zehn), wie im Auftrag vorgegeben.
   Sieben genügt, um über `MAX_TOASTS = 4` hinauszuwachsen und die Rollfläche zu benötigen.
9. **Neue TP-Kennungen `TP-TIMER-12` (Fortsetzung der Reihe aus Abschnitt 19) und `TP-TOAST-02`
   (Fortsetzung von `TP-TOAST-01` aus Abschnitt 21)**, keine neue Reihe — beide Fälle setzen
   thematisch bestehende Reihen fort. `TP-TOAST-01` selbst ist nicht umbenannt, sondern als
   Nachtrag ergänzt (etabliertes Muster in diesem Dokument, siehe Abschnitt 21).

---

## Risiken

1. **A-6.8/B-1 ist nicht gegen den tatsächlichen alten (fehlerhaften) Code gegengeprüft.**
   `TimerContext.tsx` gehört frontend-dev; ich habe die alte Reihenfolge nicht probeweise
   wiederhergestellt, um den neuen Fall rot laufen zu sehen. Die Schlussfolgerung, dass der Fall
   den Fehler gefangen hätte, stützt sich auf die Quelltext- und Zeitablauf-Analyse aus
   `reports/T-118-frontend-dev.md` Abschnitt 2 (dort **empirisch** gemessen, mit Bild-für-Bild-
   Protokoll) und auf die Mechanik des `MutationObserver` (er sieht jede committete DOM-Änderung,
   also auch eine, bei der Scrim und Toast eine meßbare Zeitspanne lang gemeinsam bestehen).
2. **Zwei echte Funde außerhalb des engen Auftrags gemeldet und selbst behoben, statt sie nur zu
   melden.** Die Datei gehört meiner Hoheit (`tests/e2e/**`), und ohne die Behebung wäre kein
   grüner Lauf möglich gewesen; ich halte das für die richtige Grenze, dokumentiere aber beide
   Funde ausführlich im Dateikopf und hier, statt sie unerwähnt zu lassen.
3. **Faked-Clock-Umgebungen sind allgemein brüchig gegenüber Zeitgeber-abhängigen
   UI-Bausteinen.** Der Ark-UI-Popover-Fund ist vermutlich kein Einzelfall — jeder künftige Fall,
   der `page.clock` einsetzt **und** mehrfach ein Menü/Popover derselben Art öffnet, kann auf
   dasselbe Muster treffen. Notiert im Dateikopf von `toast-eviction.spec.ts`, keine Änderung an
   `apps/web/**` vorgenommen oder vorgeschlagen (das wäre eine Entscheidung über Bibliotheksverhalten,
   nicht meine Hoheit).
4. **Sicherheit:** keine. Reine Testdatei-Änderungen, keine neue Route, kein neues Geheimnis.
   Alle Testdaten mit `E2E-`-Präfix, erfunden — keine echten Call-Nummern, keine echten
   Kundennamen, keine echten Benutzernamen.
5. **Gemeinsame Testumgebung.** Während dieser Aufgabe liefen domain-dev und unit-tester sichtbar
   parallel (`packages/domain/src/characters.ts`/`enumeration.ts` neu, `apps/local-api/src/http/
   input.ts` geändert, `apps/web/test/app/**` neu) — `git status` bestätigt, dass keine dieser
   Dateien von mir angefasst wurde. Der volle Lauf war zum Zeitpunkt der Ausführung grün; ein
   späterer Lauf nach weiteren Änderungen an diesen Dateien liegt außerhalb meiner Kontrolle.

---

## Offene Fragen

Keine an den Orchestrator.

---

## Nächster Schritt

1. **Volllauf nach Abschluss aller Wellen** durch den Orchestrator, falls domain-dev/unit-tester
   ihre parallel sichtbaren Änderungen (Zeichenklasse, `apps/web/test/**`) nach diesem Bericht noch
   fortsetzen — der hier gemeldete Stand (58/58) ist der zum Ausführungszeitpunkt tatsächlich
   gemessene.
2. **Dokumentierer:** `docs/testplan.md` Abschnitt 22 ist bereit zur Aufnahme in die
   Gesamtdokumentation, keine offenen Punkte meinerseits.
3. Kein weiterer Bedarf aus dieser Aufgabe.

---

## Nachweise

Alle Ausgaben in Dateien umgeleitet, Endstatus unmittelbar danach gelesen, keine Pipe.

| Befehl | Endstatus |
|---|---|
| `pnpm run typecheck:e2e` | 0 (mehrfach reproduziert) |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/toast-eviction.spec.ts` | 1/1 |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/timer-switch-scrim-toast.spec.ts` | 1/1 |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/toast-tab-order-scroll.spec.ts` | 1/1 |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts` (alle drei zusammen) | 3/3, zweifach reproduziert |
| `pnpm exec playwright test -c tests/e2e/playwright.outlook-build.config.ts` | 2/2 |
| `pnpm run test:e2e --reporter=list --retries=0` | **58/58**, ~1,5 min (Vergleichsmarke 56, davon einer rot) |
| `pnpm run test:e2e` (zweiter, unveränderter Lauf) | **58/58** |

Port 17843/17844 war vor jedem Lauf frei (`ss -ltnp` geprüft); kein fremder Prozess beendet, kein
`git commit`, kein `git stash`, kein `git checkout`.
