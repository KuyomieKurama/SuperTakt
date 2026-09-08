# T-166 — O-CI (Netzausgang der Hauptreihe) und E-077 (umgedrehte Vorgabe im Hüllen-Ersatz)

**Rolle:** e2e-tester **Datum:** 2026-09-05
**Gegenstand:** O-CI/O-CV (Hauptreihe greift nach `api.github.com`), E-077 (Vorgabe von
`installShellShim`s `installedVersion` kehrt sich um), Nachzug in `docs/testplan.md`.

---

## Status: fertig

---

## Artefakte

Geändert:
- `tests/e2e/support/services.ts` — `spawnLocalApi` startet `version-check-entry.ts` gegen eine
  lokale, dauerhaft stumme GitHub-Attrappe statt `apps/local-api/src/index.ts`; neue
  `ensureGithubStub()`/`stopGithubStub()`.
- `tests/e2e/support/version-check-entry.ts` — `appDataDir: paths.dir` ergänzt (fehlte; siehe
  Befund unten), Kopfkommentar auf die erweiterte Rolle nachgezogen.
- `tests/e2e/support/shell-shim.ts` — `takt_installed_version` liefert ohne Angabe jetzt
  `"9999.0.0"` statt `"0.0.0"`; neue exportierte Konstante `SAFE_INSTALLED_VERSION` zur
  Dokumentation (bewusst **nicht** im Funktionskörper referenziert — Begründung im Kommentar dort:
  Playwright serialisiert `installShellShim` für den Browser und verliert den Modulbereich).
- `tests/e2e/shell-quit-failure.spec.ts`, `tests/e2e/shell-username-lock.spec.ts`,
  `tests/e2e/attachment-open-commands.spec.ts` — die T-150-Bandage `installedVersion: '9999.0.0'`
  entfernt, da jetzt Vorgabe.
- `tests/e2e/version-check-live.spec.ts` — neuer, unabhängiger `describe`-Block mit eigenem
  Dienst/eigener Attrappe: Gegenprobe zu E-077 in Richtung „ohne Angabe kein Dialog, obwohl der
  Dienst tatsächlich eine neuere Fassung kennt".
- `tests/e2e/attachment-persistence-live.spec.ts` — `stopGithubStub()` im `afterAll` (räumt auf,
  was `startLocalApi`/`restartLocalApi` seit T-166 nebenbei mitstartet).
- `docs/testplan.md` — Nachtrag in Abschnitt 24, an der Stelle, an der T-137 die spätere Naht
  bereits als offene Frage benannt hatte.

---

## Zusammenfassung

Gemessen (nicht vermutet): Die Hauptreihe startete den lokalen Dienst bislang unverändert über
`apps/local-api/src/index.ts`, also mit der echten Versionsprüfung — ein `--import`-Netzmitschnitt
über `globalThis.fetch` zeigt den Aufruf an `https://api.github.com/…/releases/latest` zuverlässig
zehn Sekunden nach dem Start, und ein Playwright-Lauf dieser Reihe dauert immer länger als das.
Behoben, indem `spawnLocalApi` dieselbe Naht benutzt, die T-142 für die eigene Versionsprüfungs-Reihe
gebaut hat (`version-check-entry.ts` + lokale Attrappe), mit einer stummen `404`-Vorgabe für die
gesamte Laufzeit. Bei der Umstellung fiel ein zweiter, älterer Fehler auf: `version-check-entry.ts`
übergab `compose()` nie ein `appDataDir`, wodurch jeder Bildanhang mit `write_failed` scheiterte —
für T-142 folgenlos (keine Anhänge dort), für die Hauptreihe zunächst ein rotes
`attachment-crud.spec.ts`, das ich zuerst fälschlich für einen Ausläufer der gleichzeitig laufenden
Fokusarbeit (T-162) hielt, bis die Fehlermeldung selbst („Das Bild konnte nicht abgelegt werden.")
auf die wahre Ursache zeigte. Für E-077 wurde die Vorgabe umgedreht und mit einer echten Gegenprobe
in beide Richtungen belegt, einschließlich einer negativen Kontrolle, die zeigt, dass der neue
Prüffall bei der alten Vorgabe tatsächlich rot wird.

---

## Messprotokoll

### 1. O-CI — welche Läufe griffen hinaus, und wie das gemessen wurde

**Vorher, direkt am unveränderten Code (`apps/local-api/src/index.ts`, derselbe Weg wie das
damalige `services.ts`):** Handschlag über `stdin` offen gehalten, `--import` mit einem Modul, das
`globalThis.fetch` durch eine protokollierende Hülle ersetzt, 16 Sekunden gewartet.

```
{"message":"Takt lauscht auf 127.0.0.1:17843."}
EGRESS-SPY fetch-call url=https://api.github.com/repos/KuyomieKurama/SuperTakt/releases/latest
{"message":"Die Verbindung zur Anwendung ist beendet. Der lokale Dienst hält an."}
```

Die Anfrage feuert zuverlässig zwischen der zehnten und der sechzehnten Sekunde
(`VERSION_CHECK_START_DELAY_MS`), unabhängig davon, ob irgendein Testfall danach fragt. Betroffen
waren darüber alle drei Aufrufer von `services.ts#spawnLocalApi`: die Hauptreihe selbst,
`web-build-smoke.spec.ts` (eigene Ausführungskonfiguration, aber derselbe Code) und
`attachment-persistence-live.spec.ts` (startet/restartet über dieselbe Funktion).

**Nachher, nach der Umstellung auf `version-check-entry.ts` + `ensureGithubStub()`:** derselbe
Mitschnitt über zwei Spec-Dateien, 16,1 s Gesamtlaufzeit (`note-separation.spec.ts`,
`tag-input.spec.ts`, 9 Testfälle):

```
42 EGRESS-SPY-Zeilen, alle url=http://127.0.0.1:17843/… oder http://127.0.0.1:5173
0 Treffer für "github" im gesamten Protokoll
```

**Gegenprobe mit gesperrtem statt nur mitgeschriebenem Ausgang** (Aufgabenstellung: „indem du den
Ausgang sperrst oder die Anfragen mitschreibst" — hier beides): `NODE_OPTIONS="--import=…"` mit
einem Modul, das jeden `fetch` außerhalb `127.0.0.1`/`localhost` sofort mit einem Fehler ablehnt,
statt still zu scheitern, über die **komplette** Hauptreihe (`playwright.config.ts`, 86 Fälle):

```
86 passed (1.9m)
0 Treffer für "EGRESS-BLOCKED"
```

Ein grüner Lauf unter aktiver Sperre ist damit ein echter Nachweis, kein zufälliges Ergebnis eines
Mitschnitts, der nichts beobachtet hätte. Die drei Konfigurationen sind jetzt sauber getrennt: Die
Hauptreihe, die Bauergebnis-Reihen und die Neustart-Reihe kennen kein Netz außerhalb
`127.0.0.1`; die einzige Reihe mit einer echten (lokalen, aber eigens dafür gebauten) Attrappe für
GitHub bleibt `playwright.version-check.config.ts`.

**Nebenfund, während der Umstellung gemessen (nicht vom Netzausgang, sondern von der
Wiederverwendung des Testeinstiegs):** `version-check-entry.ts` (T-142) reichte `compose()` nie ein
`appDataDir` durch — für die vier `TP-VER`-Fälle ohne Wirkung, weil keiner von ihnen einen Anhang
anlegt. Sobald `spawnLocalApi` denselben Einstieg für die **gesamte** Hauptreihe einsetzte, schlug
jedes Ablegen eines Bildanhangs mit `422 write_failed` fehl (`createAttachmentBlobPort(null, …)`,
`composition.ts`). Erster Verdacht war die im Auftrag ausdrücklich benannte, gleichzeitig laufende
Fokusarbeit an `TodoListScreen`/`DialogSurface` (`attachment-crud.spec.ts` blieb an einem
`toBeHidden()` auf dem Anhangsdialog hängen) — verworfen, sobald die tatsächliche Fehlermeldung
sichtbar wurde (`Das Bild konnte nicht abgelegt werden.`, aus `usecases/attachments.ts`, nicht aus
einer Fokusfalle). Behoben mit `appDataDir: paths.dir` (derselbe Wert, den `main.ts` an beiden
Aufrufstellen übergibt). Danach beide betroffenen Läufe erneut geprüft und grün:
`test:e2e:attachment-persistence` (1/1) und `attachment-crud.spec.ts` einzeln (1/1).

### 2. E-077 — Gegenprobe in beide Richtungen

**(a) Mit ausdrücklich gesetzter älterer Fassung erscheint der Dialog.** Bereits durch `TP-VER-10`
gedeckt: `INSTALLED_VERSION = '1.0.0'`, Attrappe meldet `9.9.9`, der Dialog zeigt beide Werte
(`expectDialogFacts`). Lief grün als Teil des Fünfer-Laufs unten.

**(b) Ohne Angabe erscheint er nicht, obwohl der Dienst tatsächlich eine neuere Fassung kennt.**
Neuer, eigenständiger `describe`-Block in `version-check-live.spec.ts` mit eigenem Dienst und
eigener Attrappe (nicht in der bestehenden `describe.serial`-Kette, um deren Fassungsfolge nicht zu
stören): Attrappe meldet `9.9.9`, `waitForKnownVersionCheckState` bestätigt vorab ausdrücklich
`state: "known"` — die Vorbedingung, ohne die der Fall nichts messen würde. `installShellShim` wird
**ohne** `installedVersion` eingerichtet.

Erster Versuch war ein Eigenfehler und kein Beleg: `expect(dialog).toBeHidden()` unmittelbar nach
`page.goto()` ist immer wahr, bevor `useUpdateNotice` überhaupt geladen hat — genau die in der
Aufgabenstellung benannte Falle. Korrigiert durch explizites Warten auf die tatsächliche Antwort von
`GET /version-check` (`page.waitForResponse`) und zwei `requestAnimationFrame`-Umläufe, damit Reacts
Zustandsaktualisierung im DOM angekommen ist, bevor geprüft wird.

**Negativkontrolle, mit derselben Testdatei, nur der Vorgabe kurzzeitig auf den alten Wert
zurückgesetzt** (`"0.0.0"` statt `"9999.0.0"` in `shell-shim.ts`, danach zurückgesetzt):

```
Vorgabe "0.0.0": Error: expect(locator).toBeHidden() failed — Received: visible   → 1 failed
Vorgabe "9999.0.0" (Stand nach der Umkehr): 5 passed (48.0s)
```

Damit ist belegt, dass der neue Fall tatsächlich unterscheidet und nicht zufällig immer grün ist.
`shell-quit-failure.spec.ts` und `shell-username-lock.spec.ts` — die beiden von T-150 benannten,
vorher zeitabhängig gefährdeten Dateien — laufen nach Entfernen ihrer Bandage-Zeile weiterhin grün,
allerdings inzwischen aus zwei voneinander unabhängigen Gründen gleichzeitig: der neuen, sicheren
Vorgabe **und** der O-CI-Behebung (die Hauptreihe kennt jetzt ohnehin keine reale, jemals „bekannte"
Fassung mehr). Die diskriminierende Gegenprobe für die Vorgabe selbst liegt deshalb bewusst in
`version-check-live.spec.ts`, der einzigen Reihe mit echter Kontrolle über den Prüfzustand.

### 3. Vollständiger Nachweis (`pnpm test:e2e`)

```
playwright test -c tests/e2e/playwright.config.ts                        86 passed (2.1m)
playwright test -c tests/e2e/playwright.version-check.config.ts           5 passed (47.9s)
playwright test -c tests/e2e/playwright.attachment-persistence.config.ts  1 passed (2.5s)
────────────────────────────────────────────────────────────────────────────────────────
Gesamt: 92 Fälle, 92 bestanden, 0 fehlgeschlagen. Exitcode 0.
```

Zusätzlich, wie gefordert, die Hauptreihe **ohne Netz** (Ausgang aktiv gesperrt, nicht nur
beobachtet): 86 Fälle, 86 bestanden, 0 Sperrtreffer.

Kein Fall aus der gleichzeitig laufenden Fokusarbeit (T-162, `TodoListScreen`/`DialogSurface`) blieb
am Ende rot — der einzige Kandidat dafür (`attachment-crud.spec.ts`) hatte eine andere, hier selbst
verursachte und behobene Ursache (siehe oben). Es gibt für diese Welle also **keine** als „fremd"
zu meldenden roten Fälle.

---

## Annahmen

- `SAFE_INSTALLED_VERSION = "9999.0.0"` übernimmt denselben Wert, den T-150 bereits dreifach als
  Bandage eingesetzt hatte — kein neu erfundener Platzhalter.
- Die GitHub-Attrappe der Hauptreihe bleibt für die gesamte Prozesslaufzeit auf ihrer Vorgabe
  (`404`, „keine Veröffentlichung") stehen; kein Fall der Hauptreihe braucht eine andere Antwort,
  und keiner stellt sie um — würde das nötig, gehörte der Fall in die eigene Versionsprüfungs-Reihe.
- Die Gegenprobe zu E-077 Richtung (b) liegt in `version-check-live.spec.ts`, nicht in einer der
  beiden von T-150 genannten Dateien, weil nur dort der Prüfzustand tatsächlich auf „bekannt und
  neuer" gebracht werden kann — ein Fall in der Hauptreihe könnte das nach der O-CI-Behebung gar
  nicht mehr zeigen, ohne selbst wieder eine Naht ins Netz zu bauen.
- `docs/testplan.md` bekam einen Nachtrag an der Stelle, die T-137 für genau diese Naht offen
  gelassen hatte (Abschnitt 24, Punkt 2 der „zweiten Lücke") — keine Neufassung der TP-VER-Fälle
  selbst, da keiner von ihnen durch O-CI oder E-077 inhaltlich falsch wird.

## Risiken

- `version-check-entry.ts` trägt jetzt zwei Rollen (T-142s eigene Reihe **und** die Hauptreihe).
  Der Kopfkommentar ist nachgezogen; eine künftige Änderung an diesem Einstiegspunkt sollte gegen
  **beide** Verwendungen gemessen werden, nicht nur gegen `TP-VER-*`. Der `appDataDir`-Fund zeigt,
  wie leicht das übersehen wird.
- `ensureGithubStub()` ist ein Prozess-weites Singleton in `services.ts`. Ein künftiger Aufrufer,
  der `startLocalApi`/`restartLocalApi` **ohne** `stopServices` benutzt (wie
  `attachment-persistence-live.spec.ts` es bereits tut), muss selbst an `stopGithubStub()` denken —
  jetzt exportiert und im einzigen bekannten Fall bereits nachgezogen, aber kein Mechanismus
  erzwingt das für künftige Dateien.
- Keine Sicherheitsbefunde. Die Attrappe läuft ausschließlich auf `127.0.0.1`, dieselbe Grenze wie
  der lokale Dienst selbst.

## Offene Fragen

Keine an den Orchestrator. `docs/testplan.md` Abschnitt 24 enthält weiterhin die ältere,
zeilenweise „künftige Aufgabe"-Markierung aus der Planungswelle (T-137) für einzelne `TP-VER-*`
-Zeilen — das ist eine allgemeine Auffrischung des gesamten Abschnitts (ähnlich der Nachträge zu
Abschnitt 25) und keine Folge von O-CI oder E-077; ich habe sie bewusst nicht mit angefasst, um
nicht über den Auftrag dieser Welle hinauszugehen.

## Nächster Schritt

Code-Review über `tests/e2e/support/services.ts` und `version-check-entry.ts` (Naht jetzt
doppelt genutzt), danach Freigabe der Welle. Ein allgemeiner Nachtrag zu Abschnitt 24 im Testplan
(Ausführungsstand seit T-138/T-142 statt „Kein Fall wurde ausgeführt") wäre eine sinnvolle, aber
eigene Aufgabe — analog zu T-150s Nachtrag in Abschnitt 25.
