# T-142 — Die `TP-VER`-Fälle wirklich fahren, danach der Testplan für Frist und Anhänge

**Aufgabe:** T-142 — TP-VER im Browser, Testplan für Frist und Anhänge
**Rolle:** e2e-tester
**Status:** fertig
**Datum:** 2026-09-05

---

## Artefakte

**Neu**

| Datei | Was |
|---|---|
| `tests/e2e/support/github-releases-stub.ts` | Echte, im Testlauf umkonfigurierbare Nachbildung der GitHub-Releases-Antwort (`setRelease`/`setNoRelease`/`setHandler`), ein `http.createServer()`, aufzeichnend |
| `tests/e2e/support/version-check-entry.ts` | Eigener Einstiegspunkt des lokalen Dienstes für den Prüflauf: ruft `compose({ releaseSource })` aus `apps/local-api/src/composition.ts` unverändert, mit einer Abholfunktion, die nur die Adresse auf die Attrappe umleitet (E-066 Punkt 1, „die Naht ist die Abholfunktion, nicht die Zeichenkette"). Handschlag, Migration, Zehn-Sekunden-Takt der Versionsprüfung — alles unverändert wie in `main.ts`. Eigene, minimale Node-`http`→`Request`/`Response`-Brücke statt `@hono/node-server` (von `tests/e2e/**` aus nicht auflösbar, `pnpm-workspace.yaml` schließt `tests/**` aus) |
| `tests/e2e/support/version-check-services.ts` | Start/Stop/Neustart dieses Einstiegspunkts (dieselbe Robustheit wie `services.ts#startLocalApi`: acht Versuche mit Rückstand), eigenes Datenverzeichnis (übersteht einen Neustart innerhalb einer Testdatei), `waitForKnownVersionCheckState` (serverseitige Wartemarke, getrennt von der Oberfläche), eigener kleiner Vite-Start (bewusste Kopie, nicht `services.ts#startWeb` — Begründung im Dateikopf) |
| `tests/e2e/support/global-setup-version-check.ts` | Startet nur die Oberfläche; Dienst und Attrappe starten in der Spezifikationsdatei selbst, weil `TP-VER-11`/`-12` einen Neustart **innerhalb** eines Testfalls brauchen |
| `tests/e2e/playwright.version-check.config.ts` | Eigene Ausführungskonfiguration (`pnpm exec playwright test -c tests/e2e/playwright.version-check.config.ts`), großzügige Fristen (180 s je Fall) wegen des unveränderten Zehn-Sekunden-Takts der Versionsprüfung |
| `tests/e2e/version-check-live.spec.ts` | `TP-VER-10` bis `TP-VER-13` als eine zusammenhängende `test.describe.serial`-Erzählung (Begründung: `TP-VER-11`/`-12` setzen fort, was `TP-VER-10` offen lässt) |

**Geändert**

| Datei | Was |
|---|---|
| `tests/e2e/support/shell-shim.ts` | `takt_installed_version` und `takt_open_release` ergänzt (bis dahin unbekannt — T-139 Risiko 4). Jeder Aufruf von `takt_open_release` wird auf `window.__taktOpenReleaseCalls__` aufgezeichnet, nicht nur aufgelöst — das macht `TP-VER-13` messbar für den Fall, dass „Installieren" künftig mehr täte als öffnen (A-18.9) |
| `tests/e2e/playwright.config.ts` | `version-check-live.spec.ts` in `testIgnore` aufgenommen (derselbe Grund wie bei `web-build-smoke.spec.ts`: eigene Ausführungskonfiguration, derselbe Port) |
| `docs/testplan.md` | Abschnitt 25 angehängt: Plan für Frist und Anhänge vor dem Bau, 32 Fälle (`TP-FRIST-01` bis `-11`, `TP-ANH-01` bis `-20`, dazu ein Mikrofall zur Feldbezeichnung) |

---

## Zusammenfassung

Die vier bisher „geplant, nicht ausführbar" markierten `TP-VER`-Fälle laufen jetzt echt: Ein eigener
Einstiegspunkt (`version-check-entry.ts`) nutzt die von T-138 vorgesehene Naht
(`compose({ releaseSource })`) und zeigt auf eine echte, lokale GitHub-Attrappe statt auf das echte
GitHub — ohne A-18.3 zu verletzen, weil die Naht im selben Prozess liegt und von außen nicht
erreichbar ist. `shell-shim.ts` kennt jetzt `takt_installed_version`/`takt_open_release` und
zeichnet jeden Aufruf auf, statt ihn nur aufzulösen. Alle vier Fälle bestehen bei einem echten Lauf
(36,9 s), die vorher bestehenden 62 E2E-Fälle bestehen unverändert weiter (1,7 min) — die Änderung
an `shell-shim.ts` ist rein additiv geprüft. Zweiter Teil: der Testplan für Frist und Anhänge
(Abschnitt 19 der Spezifikation) ist als eigener Abschnitt 25 in `docs/testplan.md` abgelegt, 32
Fälle, jeder mit Anforderungs-ID, Vorbedingung, Schritt, Erwartung und Ebene — nichts davon gebaut,
keine `.spec.ts`-Datei angelegt, wie beauftragt.

---

## Annahmen

1. **Der Einstiegspunkt bindet keinen Aufgabenbereich (Port 17844 bleibt frei) und lässt Rechte-
   und Aufräumschritte aus main.ts weg.** Kein `TP-VER`-Fall braucht das; jeder zusätzliche Schritt
   wäre ein zusätzlicher, ungemessener Unterschied zum echten `main.ts`.
2. **Der Zehn-Sekunden-Takt der Versionsprüfung (`VERSION_CHECK_START_DELAY_MS`) bleibt
   unverändert.** `compose()` nimmt dafür keinen Parameter entgegen, und ihn zu verkürzen hieße,
   etwas anderes zu messen als das, was A-18.2 „beim Start" tatsächlich bedeutet — Preis: jeder
   Neustart in `TP-VER-11`/`-12` kostet real rund zehn bis zwölf Sekunden, die eigene
   Ausführungskonfiguration trägt dem mit großzügigen Fristen Rechnung.
3. **„Prüfung erneut auslösen" (Testplan-Wortlaut zu `TP-VER-12`) heißt: ein weiterer
   Prozess-Neustart.** E-069 kennt keinen manuellen „Jetzt prüfen"-Weg; ein Neustart ist der
   einzige Auslöser, den die Spezifikation vorsieht.
4. **`version-check-services.ts#startVersionCheckWeb` ist eine bewusste, kleine Kopie von
   `services.ts#startWeb`**, nicht eine Erweiterung der gemeinsamen Datei um einen `export`. Diese
   liegt zwar unter meiner eigenen Hoheit (`tests/e2e/support/**`), aber `services.ts` trägt 20
   andere Testdateien; eine Kopie hält das Risiko für diese Aufgabe vollständig in neuen Dateien.
5. **Testplan Abschnitt 25 erfindet Bezeichner** (`dueState`, `attachmentLabel`,
   `is_attachment_link`, `takt_open_attachment_link` u. a.) **als Annahmen, nicht als Zusagen** —
   ausdrücklich so benannt, damit ein späterer Bau sie übernehmen oder verwerfen kann, ohne dass
   der Plan etwas Falsches behauptet hätte.
6. **`TP-FRIST-09` (Zustand wird gerechnet, nicht gespeichert) lässt bewusst offen, ob Integration
   oder E2E die richtige Ebene ist** — das hängt daran, ob der künftige Bau den Zustand server-
   oder clientseitig berechnet, eine Entscheidung, die dieser Plan nicht treffen kann.

---

## Risiken

1. **Sicherheit — keine neue Fläche, aber eine neue Testinfrastruktur mit Netzzugriff.**
   `version-check-entry.ts` öffnet real eine ausgehende Verbindung (zur eigenen Attrappe, nicht zu
   echtem GitHub) — das ist beabsichtigt und bleibt vollständig innerhalb von `127.0.0.1`. Läuft
   dieser Einstiegspunkt versehentlich ohne `TAKT_E2E_GITHUB_STUB_URL`, bricht er kontrolliert mit
   einer Fehlermeldung ab, statt gegen das echte GitHub zu laufen — geprüft (das Fehlen der
   Variable wurde beim ersten Entwurf tatsächlich getroffen und hat genau so abgebrochen).
2. **`shell-shim.ts`s `takt_open_release`-Nachbildung führt keine Formprüfung der
   Fassungsbezeichnung durch** (anders als `release.rs`). Das ist Absicht — die Formprüfung ist
   bereits durch `cargo test` neben dem Befehl erschöpfend geprüft (T-139) — aber es bedeutet, dass
   `TP-VER-13` ausschließlich den Erfolgspfad zeigt, nicht den abgewiesenen. Kein Fall aus dem
   Auftrag verlangt Letzteres.
3. **`TP-ANH-15` bis `-20` im neuen Testplan-Abschnitt benennen eine echte Grenze:** Die
   tatsächliche Ablehnung durch `open`/`ShellExecuteW` selbst ist unter Linux nicht messbar
   (T-B08). Als Grenze benannt, nicht ausgelassen — mit dem Rust-Einheitentest neben dem künftigen
   Öffnen-Befehl als Ergänzung, wie `release.rs` es für die Versionsprüfung schon vormacht.
4. **`waitForKnownVersionCheckState` pollt alle 150 ms über bis zu 25 s.** Auf einer stark
   ausgelasteten Maschine (mehrere gleichzeitig laufende Agenten, wie im Auftrag benannt) kann das
   knapper werden; die Fristen in `playwright.version-check.config.ts` sind deshalb bewusst
   großzügig (180 s je Fall) und nicht knapp bemessen.

---

## Offene Fragen an den Orchestrator

1. **Kein Eintrag für `playwright.version-check.config.ts` in der Wurzel-`package.json`.** Wie bei
   `proof:shell-surface`/`proof:release-safety` zuvor (T-138/T-139) trage ich den Befehl hier ein,
   statt ihn zu erfinden: `pnpm exec playwright test -c tests/e2e/playwright.version-check.config.ts`.
   Ein Eintrag `test:e2e:version-check` in `package.json` liegt beim Orchestrator.
2. **`docs/bedrohungsmodell.md` Abschnitt 18** könnte durch die jetzt echt laufenden `TP-VER-10`
   bis `-13` einen Nachtrag brauchen (vorher „geplant", jetzt „gemessen") — das ist Sache von
   security-checker, nicht von mir; ich melde es nur, weil mein Lauf die Grundlage dafür liefert.

---

## Nächster Schritt

1. Wird Abschnitt 19 gebaut (domain-dev/frontend-dev/integration-dev), liegt der Testplan bereit —
   `docs/testplan.md` Abschnitt 25 kann dann eins zu eins in `.spec.ts`-Dateien überführt werden,
   genau wie T-138 es mit Abschnitt 24 getan hat.
2. Sobald F-18 (Abschalter der Versionsprüfung, E-068) beantwortet ist, bräuchte
   `version-check-live.spec.ts` möglicherweise einen fünften Fall dafür — heute nicht gebaut, also
   nicht geplant.

---

## Zahlen

| Wo | Vorher | Nachher | Belegt durch |
|---|---|---|---|
| `TP-VER`-Fälle wirklich gefahren (dieser Auftrag) | 0 von 26 im Browser lauffähig (T-137: „kein einziger Fall dieses Abschnitts ist heute ausführbar") | **4 von 4** browserpflichtige Fälle (`TP-VER-10` bis `-13`) grün | `pnpm exec playwright test -c tests/e2e/playwright.version-check.config.ts` → 4 passed (36,9s) |
| Bestehende E2E-Suite | 62/62 | **62/62**, unverändert | `pnpm run test:e2e` → 62 passed (1,7m) |
| E2E-Fälle insgesamt (dieses Verzeichnis) | 62 | **66** | beide Läufe oben |
| Frist/Anhänge-Testfälle im Plan | 0 | **32** (`TP-FRIST-01` bis `-11`, `TP-ANH-01` bis `-20`, 1 Mikrofall) | `docs/testplan.md` Abschnitt 25, keiner ausgeführt (kein Ziel) |

`pnpm run typecheck:e2e` — 0 Fehler.
