# T-130 — Drei Flächen aus Welle L, die nur im Browser prüfbar sind

Aufgabe: T-130 — Drei Flächen aus Welle L, die nur im Browser prüfbar sind
Status: fertig
Rolle: e2e-tester
Stand: Branch `status-als-regelterm`, Basis `3f45d51`

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (insbesondere E-062, E-063), `reports/T-124-frontend-dev.md`
(Abschnitte 2–5, „Nächster Schritt" 1), `reports/T-120-e2e-tester.md`, `docs/spec.md`, `docs/testplan.md`.

---

## Artefakte

| Datei | Was |
|---|---|
| `tests/e2e/support/shell-shim.ts` | neu. Konfigurierbare Nachbildung von `__TAURI_INTERNALS__.invoke` für `takt_service_handshake` (echter Sitzungsnachweis dieses Testlaufs), `takt_os_user`, `takt_shell_state`, `takt_quit` (`resolve`/`hang`/`reject`) — für Dienstzustände, die im reinen Entwicklungsbetrieb sonst nie entstehen |
| `tests/e2e/support/db.ts` | neu. `overwriteTodoTitleDirectly(todoId, title)` — direkter `node:sqlite`-Zugriff auf die Testlauf-Datenbank, für den einen Fall, in dem die Tür selbst der Prüfgegenstand ist |
| `tests/e2e/support/bidi.ts` | neu. `rendersLeftToRight(locator)` — der Rangetest aus T-124 Abschnitt 5 Punkt 2 als wiederverwendbarer Baustein: misst je Zeichen die Bildschirmposition über `document.createRange()`, nicht nur, ob ein Element existiert |
| `tests/e2e/shell-quit-failure.spec.ts` | neu. O-AF: „Takt beenden" ohne Rückmeldung → nach `page.clock.fastForward('00:06')` steht `.quitfail` mit zwei Handlungsschritten, ohne „Systembetreuung" (F-15) |
| `tests/e2e/shell-username-lock.spec.ts` | neu. O-AJ: Windows-Name mit U+200F → `alertdialog`, Tab-Falle, kein Element trägt den Namen — geprüft für beide Startwege (`service_exit: null` und gesetzt) |
| `tests/e2e/foreign-title-display.spec.ts` | neu. O-AH: Titel mit U+202E (direkt in der Datenbank gesetzt, nicht über die Tür) erscheint als `Rechnung<U+FFFD>gnp.exe` in einem `<bdi>`, Rangetest bestätigt tatsächliche Leserichtung |
| `docs/testplan.md` | Abschnitt 23 angehängt: TP-SHELL-01, TP-SHELL-02, TP-BIDI-01, mit Nachweisblock |

Nicht angefasst: `packages/domain/**`, `apps/local-api/**`, `apps/web/**`, `apps/desktop/**`,
`apps/outlook-addin/**`, `packages/*/test/**`, `apps/*/test/**` — parallel sichtbar verändert von
domain-dev, frontend-dev und unit-tester (`git status` zeigt u. a. Änderungen an
`apps/web/src/components/Foreign.tsx`, `apps/local-api/src/http/input.ts`,
`apps/outlook-addin/test/text/hidden.test.ts`), keine dieser Dateien von mir berührt. Kein
`git commit`, kein `stash`, kein `checkout`, kein fremder Prozess beendet. Port 17843/17844 war vor
jedem Lauf frei (`ss -ltnp` geprüft).

---

## Zusammenfassung

Alle drei von frontend-dev in T-124 benannten Fälle sind jetzt als Playwright-Fälle vorhanden und
laufen grün. O-AF braucht eine Hüllen-Nachbildung mit einer `takt_quit`-Antwort, die nie auflöst,
und `page.clock.fastForward('00:06')` gegen die Fünfsekundenfrist — geprüft: zwei
Handlungsschritte, kein Verweis auf „Systembetreuung". O-AJ braucht dieselbe Nachbildung mit einem
erfundenen Benutzernamen, der U+200F trägt, einmal mit und einmal ohne `service_exit`, um beide von
außen erreichbaren Startwege abzudecken; geprüft: `alertdialog`, Tab-Falle mit `Tab`/`Shift+Tab`,
kein Element trägt den Namen. O-AH braucht einen Titel, der die Tür nicht passieren würde (`POST
/todos` weist U+202E mit 422 ab) — deshalb über einen sicheren Platzhalter angelegt und danach
direkt in der SQLite-Datei überschrieben; geprüft mit dem Rangetest aus T-124 Abschnitt 5 als
wiederverwendbarem Baustein, der die tatsächliche Bildschirmposition jedes Zeichens mißt statt nur
das Vorhandensein eines `<bdi>` festzustellen. Der volle Lauf steht bei **62/62** (Vergleichsmarke
58/58 nach `3f45d51`, vier neue Fälle: 1 O-AF + 2 O-AJ + 1 O-AH), zweifach reproduziert mit dem
Vorgabewert `pnpm test:e2e` (`retries: 1`).

---

## Annahmen

1. **Die Hüllen-Nachbildung liefert den echten Sitzungsnachweis dieses Testlaufs.** `shell-shim.ts`
   gibt bei `takt_service_handshake` `API_BASE_URL`/`TOKEN_HEADER`/`SESSION_SECRET` aus
   `support/session.ts` zurück, nicht erfundene Werte — damit läuft jede sonstige Anfrage (Todos,
   Zeitbuchungen) unverändert gegen den echten lokalen Dienst aus `services.ts`, und nur die drei
   Hüllenbefehle, um die es in T-130 geht, sind gesteuert. Eine vollständig erfundene
   Gegenstelle hätte den Rahmen der Aufgabe gesprengt (kein lokaler Dienst mehr, keine echten
   Todos) und wäre auch nicht mehr „im Browser, an der laufenden Anwendung" (E-062) gewesen.
2. **O-AJ prüft „beide Startwege" so weit, wie das ohne `apps/desktop` anzufassen reicht.**
   `readUserNameFinding()` (`apps/web/src/app/connection.ts`) stellt unabhängig vom
   Sidecar-Zustand immer dieselbe eine Frage (`osUser()`). Von der Oberfläche aus lässt sich
   deshalb nur unterscheiden, ob `service_exit` zum Zeitpunkt der Anzeige gesetzt ist oder nicht —
   das deckt beide in T-124 Abschnitt 2 beschriebenen Fälle in ihrer sichtbaren Wirkung ab
   (`ShellStatus.tsx` zeigt in beiden Fällen dieselbe Sperrmeldung mit Vorrang), aber **nicht**
   `handshake_line`/`explain_exit` in `sidecar.rs` selbst — die gehören nicht meiner Hoheit
   (`apps/desktop/**`) und sind laut T-124 Annahme 3/Risiko R1 ohnehin ein bekannter, noch offener
   Befund beim frontend-dev.
3. **O-AH: sicherer Platzhalter über die Tür, dann direkt in der Datenbank überschrieben.** Der
   Auftrag nennt „über die Datenbank oder das Add-in, nicht über die Tür" ausdrücklich als Weg.
   Ich habe die Datenbank gewählt (`node:sqlite`, dieselbe Bauart wie
   `packages/storage/src/sqlite/database.ts`, E-035) statt das Add-in zu bemühen, weil der
   Add-in-Weg eine zweite, komplexere Infrastruktur (Betreffzeilen-Erkennung, eigener
   Aufgabenbereich) für denselben Titel gebraucht hätte, ohne mehr über die geprüfte Sache (die
   Anzeige in der Todo-Liste) zu sagen.
4. **Der Titel `Rechnung<RLO>gnp.exe` trägt kein `E2E-`-Präfix.** Er ist der wörtliche Beleg aus
   dem Auftrag (T-124, „Nächster Schritt" 1) und bereits eine erfundene Fixtur — die klassische
   RLO-Tarnung, bei der eine `.exe` wie eine `.png` aussieht, kein echter Datei- oder Firmenname.
   Gefunden wird die Zeile trotzdem ohne Präfix, über die Teilzeichenkette „gnp.exe" in der Suche
   (`?q=gnp.exe`), die in keinem anderen Testtitel vorkommt. Der **Platzhalter**, mit dem das
   Todo über die Tür entsteht, trägt das Präfix (`E2E-Foreign-Platzhalter-<Zeitstempel>`).
5. **Kein rohes Richtungszeichen im Quelltext.** Sowohl in den drei neuen Spezifikationsdateien als
   auch in `docs/testplan.md` stehen U+202E/U+200F als Escape-Folgen (`'\u202e'`, `'\u200f'`) bzw.
   als Klammerbezeichnung (`<RLO>`, `<RLM>`) und nicht als rohes Zeichen — dieselbe Begründung wie
   in `packages/domain/src/characters.ts` selbst („Warum Codepunkte und kein regulärer Ausdruck",
   Punkt 2): ein rohes Richtungszeichen im Quelltext würde ausgerechnet die Zeile umdrehen, die es
   beschreibt. Beim ersten Schreiben sind mir zweimal (in einer Spezifikationsdatei, in
   `docs/testplan.md`) rohe Zeichen unterlaufen — bemerkt über eine gezielte Codepunktsuche und vor
   dem ersten Testlauf korrigiert.
6. **`rendersLeftToRight` als eigener, wiederverwendbarer Baustein statt Inline-Code je Testfall.**
   Nur ein Aufrufer heute (`foreign-title-display.spec.ts`), aber die Methode selbst (Rangetest
   über `document.createRange()`) ist die von T-124 vorgegebene Vorlage und dürfte bei künftigen
   O-AH-artigen Fällen wieder gebraucht werden.
7. **Neue TP-Kennungen `TP-SHELL-01`, `TP-SHELL-02`, `TP-BIDI-01`** — neue Präfixe statt Fortführung
   von `TP-SEC-*` (obwohl thematisch verwandt): `TP-SEC-*` bildet die 23 nummerierten Prüfungen aus
   `docs/bedrohungsmodell.md` Abschnitt 7 eins zu eins ab (Abschnitt 13, T-016) und ist keine offene
   Reihe für neue, artfremde Fälle.

---

## Risiken

1. **Ein `--retries=0`-Lauf zeigte einen einzelnen, transienten Fehlschlag in
   `toast-tab-order-scroll.spec.ts`** (T-120, nicht von dieser Aufgabe angefasst) — isoliert sofort
   danach erneut ausgeführt: 1/1. Das ist derselbe Nebenläufigkeitsbefund, den
   `playwright.config.ts` mit `retries: 1` bereits benennt und auffängt („Diese Maschine faehrt
   mehrere Team-Agenten gleichzeitig"). Der für den Vergleich maßgebliche Lauf mit dem
   Vorgabewert (`pnpm test:e2e`, `retries: 1`) war zweifach hintereinander grün bei 62/62. Ich
   melde den einzelnen `--retries=0`-Fehlschlag hier, statt ihn zu verschweigen, obwohl er nicht
   die Datei betrifft, die ich geändert habe.
2. **Während eines Laufs ein augenblicklicher, durch einen anderen Agenten verursachter
   Fehlstart des lokalen Dienstes beobachtet:** `packages/domain/src/characters.ts:187` enthielt
   für einen Augenblick ein rohes U+202E mitten in `export const HIDDEN_MARKER = …`
   (`SyntaxError [ERR_INVALID_TYPESCRIPT_SYNTAX]`) — sichtbar Zeichen einer parallel laufenden
   Bearbeitung durch domain-dev an genau dieser Datei. Ein Lauf unmittelbar danach war grün, die
   Datei stand zum Zeitpunkt des Nachlesens bereits korrekt da. Das ist **kein Befund dieser
   Aufgabe** (die Datei gehört nicht meiner Hoheit, ich habe nichts daran geändert), sondern eine
   Beobachtung aus gemeinsamer Testumgebung — hier gemeldet mit Datei und Zeile, wie vorgegeben,
   statt gedeutet.
3. **`shell-shim.ts` bildet nur die Momentaufnahme nach, die die Oberfläche von der Hülle sieht,
   nicht `apps/desktop` selbst.** Ein echter Fehler in `sidecar.rs` (z. B. `handshake_line` oder
   `explain_exit`, siehe T-124 Risiko R1) würde von diesen drei Testfällen nicht gefangen — sie
   prüfen `apps/web` gegen jede Kombination, die die Hülle liefern könnte, nicht die Hülle selbst.
   Das ist innerhalb meiner Hoheit (`tests/e2e/**`) die erreichbare Grenze.
4. **Sicherheit:** keine neue Angriffsfläche. Reine Testdatei-Änderungen, kein neues Geheimnis, kein
   neuer Netzwerkpfad. Der direkte Datenbankzugriff in `support/db.ts` schreibt ausschließlich in
   die Wegwerf-Datenbank dieses Testlaufs (`E2E_DATA_DIR`, nicht den echten Anwendungsdatenordner)
   und ausschließlich die eine Spalte `todo.title` einer zuvor selbst angelegten Zeile. Alle
   Testdaten erfunden, mit `E2E-`-Präfix — mit der einen begründeten Ausnahme (Annahme 4) für den
   wörtlichen Beleg aus dem Auftrag, der selbst schon erfunden ist. Keine echten Call-Nummern,
   keine echten Kundennamen, keine echten Benutzernamen.

---

## Offene Fragen

Keine an den Orchestrator.

---

## Nächster Schritt

1. Kein weiterer Bedarf aus dieser Aufgabe.
2. Falls domain-dev, frontend-dev oder unit-tester ihre parallel sichtbaren Änderungen nach diesem
   Bericht fortsetzen, ist ein Volllauf am Ende der Welle durch den Orchestrator sinnvoll — der
   hier gemeldete Stand (62/62, zweifach) ist der zum Ausführungszeitpunkt tatsächlich gemessene.
3. **Dokumentierer:** `docs/testplan.md` Abschnitt 23 ist bereit zur Aufnahme in die
   Gesamtdokumentation, keine offenen Punkte meinerseits.

---

## Nachweise

Alle Ausgaben in Dateien umgeleitet, Endstatus unmittelbar danach gelesen, keine Pipe.

| Befehl | Endstatus |
|---|---|
| `pnpm run typecheck:e2e` | 0 (mehrfach reproduziert) |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/shell-quit-failure.spec.ts --reporter=list --retries=0` | 1/1 |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/shell-username-lock.spec.ts --reporter=list --retries=0` | 2/2 |
| `pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/foreign-title-display.spec.ts --reporter=list --retries=0` | 1/1 |
| `pnpm run test:e2e --reporter=list --retries=0` (voller Lauf, ohne Wiederholung) | 62/62 einmal, 61/62 einmal (ein transienter, isoliert grüner Fehlschlag in `toast-tab-order-scroll.spec.ts`, siehe Risiko 1) |
| `pnpm test:e2e` (Vorgabewert, `retries: 1`) | **62/62**, zweifach reproduziert — Vergleichsmarke 58/58 nach `3f45d51` |

Port 17843/17844 war vor jedem Lauf frei (`ss -ltnp` geprüft); kein fremder Prozess beendet, kein
`git commit`, kein `git stash`, kein `git checkout`.
