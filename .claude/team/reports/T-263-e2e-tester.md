Aufgabe: T-263 — Der „Frist"-Prüffall misst Modulnamen statt gerenderten Text
Status: fertig

Artefakte:
- `tests/e2e/support/web-build-services.ts` (`distContainsRenderedText` hierher gezogen und auf
  String-Literal-Extraktion umgestellt; `startWebPreview` auf stdout-Marker-Bereitschaft und
  `killChildTree`/`taskkill /t /f` umgestellt; `stopChild` jetzt async)
- `tests/e2e/web-build-smoke.spec.ts` (lokale Kopie entfernt, Import aus `support/web-build-
  services.ts`; zwei neue Gegenprobe-`describe`-Blöcke; `expectNoRenderedText`-Hilfsfunktion mit
  benannter Fundstelle)
- `tests/e2e/support/services.ts` (`startWeb` auf dieselbe stdout-Marker-Bereitschaft umgestellt;
  `stopServices` auf `killShellChildTree` für den `web`-Kindprozess)
- `tests/fixtures/web-build-rendered-text/{ohne-verstoss,mit-verstoss}/assets/*.js`, `README.md`
  (neu — feste Vorlagen für die Gegenprobe, erfunden, keine Kundendaten)
- `docs/testplan.md` (zwei neue Absätze: Abschnitt 25 Mikrofall — Verengung auf gerenderten Text;
  Abschnitt 15 — Bereitschaftsprüfung `startWeb`/`startWebPreview` gehärtet)

Zusammenfassung:
`distContainsRenderedText` durchsucht seither nicht mehr den rohen Dateiinhalt, sondern
ausschließlich JS-String-Literale, und schließt darin Modulpfade/gehashte Bündeldateinamen aus
(`looksLikeModulePath`) — ein Bezeichner steht nie in Anführungszeichen, ein Importpfad ist zwar
quotiert, aber kein Oberflächentext. Zwei Gegenproben (Fixtures unter `tests/fixtures/web-build-
rendered-text/`) belegen beide Richtungen für alle drei verbotenen Wörter: Bezeichner/Importe/
Dateinamen lösen keinen Treffer aus, ein echtes JSX-Kind-Literal wird weiterhin erkannt und die
Fundstelle benannt. Zusätzlich, wie aufgetragen: `startWebPreview`s Bereitschaftsprüfung ist von
einer reinen `fetch`-Prüfung auf das eigene `stdout` des Kindprozesses umgestellt (die Zeile, die
`vite preview` nur bei tatsächlich geglücktem Binden schreibt) — ein reines Wettrennen gegen den
frühen Tod des eigenen Kindes (wie `spawnLocalApi`) erwies sich in der eigenen Gegenprobe als
unzureichend, siehe unten. Dabei gefunden und mitbehoben: `child.kill('SIGTERM')` beendet unter
Windows bei einem mit `shell: true` gestarteten Kind nur den `cmd.exe`-Wrapper, nicht den
eigentlichen `vite`/`vite preview`-Prozess (Enkelkind) — behoben über `taskkill /t /f`, an beiden
betroffenen Stellen (`web-build-services.ts#stopChild`, `services.ts#stopServices`, letzteres
betrifft die ganze Hauptreihe).

## 1. War der Fall vorher grün?

**Nein — schon am Vorzustand rot, aus einem anderen Grund als dem Umbau.** Gemessen, nicht
vermutet: `git stash push -u -- apps/web` (Snapshot vor dem Stash als Pfadsatz gesichert),
`pnpm --filter @takt/web build` gegen `HEAD` (vor dem laufenden `shared/ui`-Umbau), dann
`git stash pop` mit Pfadsatz-Vergleich als Vollständigkeitsbeleg (244/244 Pfade identisch, keine
Konfliktmarker, Stash-Liste danach leer).

Ergebnis am Vorzustand: `grep -o 'Deadline' apps/web/dist/assets/TodoListScreen-*.js` → **2
Treffer**, beide aus `onDeadlineChange` (ein Requisitenname in `TodoListScreen`, nachgemessen mit
`node`-Skript, Kontext eingesehen: `onChange:t.onDeadlineChange` und
`onTagsChange:p,deadlineFilter:x,onDeadlineChange:L`). Kein einziges der drei verbotenen Wörter
stand dort je als Oberflächentext — die Zeile selbst zeigt korrekt `label:"Frist"`. Der alte, rein
substring-basierte Vergleich war also **schon vor jedem `shared/ui`-Umbau** rot, aus einem
Bezeichner, nicht aus dem neuen Bündelstück.

Am aktuellen (Nach-Umbau-)Bündel kommen zusätzlich die im Auftrag genannten Treffer dazu:
`DeadlineFlag-aJKJzlu8.js` als eigenes Bündelstück (seit dem Umbau, weil `shared/ui/DeadlineFlag
.tsx` jetzt von mehreren Merkmalen benutzt wird) plus Importe darauf in `BoardScreen-*.js`,
`TodoDetailScreen-*.js`, `index-*.js` (Vorlade-Liste) und `TodoListScreen-*.js` (das auch weiterhin
`onDeadlineChange` trägt) — insgesamt 5 Fundstellen statt 1, alle Bezeichner/Importe/Dateinamen,
keine davon Oberflächentext. Beide Zustände (vor und nach dem Umbau) sind jetzt gemessen:
`node`-Nachbau des neuen Siebs gegen beide `dist`-Verzeichnisse liefert `false` für alle drei
Wörter.

## 2. Weitere Prüffälle dieser Bauart?

**In `tests/e2e/**` nur diese beiden Fälle**, beide in `web-build-smoke.spec.ts`/`web-build-
services.ts`:

- `distContainsText(SHOWCASE_MARKER)` (TP-BUILD-05) — strukturell **derselben Bauart** (roher
  Substring-Vergleich über `apps/web/dist`), aber **nicht verwundbar**: `SHOWCASE_MARKER =
  'Abschnitte des Designsystems'` enthält Leerzeichen, die in keinem JS-Bezeichner, keinem
  Dateinamen und keiner Import-Angabe vorkommen können. Bewusst unverändert gelassen — eine
  Änderung ohne gemessenen Fund wäre unbegründet gewesen.
- `distContainsRenderedText` (Abschnitt 25 Mikrofall) — der behobene Fall, siehe oben.

Alle übrigen Text-Prüfungen in `tests/e2e/**` laufen entweder gegen die gerenderte Seite im
Browser (`page.getByText`, `page.getByRole(…, { name })`, `toContainText` — Playwright misst dort
die Zugänglichkeitsstruktur/den DOM, nicht die Bündeldatei, also strukturell immun gegen
Bezeichner-/Dateinamenskollisionen) oder gegen HTTP-Antworttexte/Konsolenmeldungen/stdout-Signale
(`outlook-addin-build.spec.ts`, `global-setup-outlook-build.ts`) — keine davon durchsucht eine
gebaute `.js`-Datei nach einem UI-Wort. Grep über `readFileSync|readdirSync|includes\(` in allen
Dateien mit `dist`-Bezug lieferte keine weitere Fundstelle.

**Außerhalb meiner Hoheit, nur gemeldet, nicht geändert:** `apps/web/scripts/proof-foreign.mjs`
misst fremden Text über eine Typmarke im Übersetzer (`ForeignText` u. a.), keine
Bündel-Textsuche — andere Bauart, nicht verwundbar. `apps/local-api/scripts/proof-route-policy.mjs`
vergleicht HTTP-Antworttexte gegen einen bekannten Vermerk, ebenfalls keine Bündel-Textsuche.
Beide gegengelesen, keine dritte Stelle mit derselben Schwäche gefunden.

## 3. `startWebPreview`-Fund — Gegenprobe zur Gegenprobe

Der naheliegende erste Ausweg — dasselbe Wettrennen wie `spawnLocalApi`
(`Promise.race([ready, exitedEarly])`, `ready` weiterhin über `fetch`) — wurde **gebaut und dann
selbst als unzureichend gemessen**: Ein `node:http`-Server auf einem freien Port, `startWebPreview
(port)` dagegengestellt, sollte scheitern (der eigene `vite preview --strictPort` stirbt an
`EADDRINUSE`) — löste aber erfolgreich auf. Ursache, mit einem eigenen Probeskript nachgemessen:
`pnpm exec vite preview` läuft unter Windows über `cmd.exe` **und** `pnpm`s eigene Auflösung des
`vite`-Programms, bevor `vite` selbst überhaupt zu binden versucht — dieser Vorlauf dauert spürbar
länger als die erste `fetch`-Runde. Eine sofort antwortende fremde Gegenstelle gewinnt das
Wettrennen praktisch immer; das Wettrennen war real, aber strukturell zugunsten der falschen Seite
verzerrt.

Der tatsächliche Ausweg liest die Bereitschaft vom **eigenen `stdout`** des Kindes:
`vite`/`vite preview` schreibt bei tatsächlich geglücktem Binden `➜  Local:   http://127.0.0.1:
<port>/` (mit ANSI-Codes durchsetzt, `stripAnsi` entfernt sie vor dem Vergleich) — nachgemessen
mit und ohne belegten Port (letzteres schreibt `error when starting preview server: … Port … is
already in use` auf `stderr` und beendet sich, ohne die Zeile je zu schreiben). Diese Zeile kann
nur der eigene, wirklich gebundene Prozess schreiben. `startWeb` (`services.ts`, die Hauptreihe)
trägt denselben Fund und dieselbe Behebung — dieselbe `shell: true`/`fetch`-Bauart, ungeprüft bis
hierhin.

Dabei zusätzlich gefunden: Nach dem ersten (später verworfenen) Fix-Versuch blieb ein
`vite preview`-Prozess auf 5173 als Waise zurück und blockierte den nächsten Lauf —
`child.kill('SIGTERM')` trifft unter Windows bei `shell: true` nur den `cmd.exe`-Wrapper, nicht
das Enkelkind. Behoben über `taskkill /pid <pid> /t /f`, an beiden betroffenen Stellen
(`web-build-services.ts#stopChild`, `services.ts#stopServices`). Vermutlich die Ursache der in
`board.md` genannten „hängenden Prozesse auf 5173 und 17844" sowie der „esbuild-Dienstprozesse mit
lebenden Elternprozessen" aus T-259 — dort nur beobachtet, hier erstmals eine Ursache dafür
gemessen.

**Gegenprobe, zweifach, beide grün:**
1. `node:http`-Server besetzt einen Testport vor, `startWebPreview(port)` dagegengestellt → wirft
   jetzt tatsächlich (`/EADDRINUSE|beendet, bevor/`).
2. Derselbe Aufbau mit freiem Port → gelingt weiterhin, `fetch` bestätigt HTTP-Erreichbarkeit.

## Läufe (alle gemessen, Ports vor jedem Lauf per `netstat` gegengeprüft — `netstat`-Ausgabe unter
Windows in dieser Shell teils fehlkodiert, deshalb `grep -a` statt normalem `grep`)

- `pnpm run typecheck:e2e` — grün, nach jeder Änderungsrunde erneut gefahren.
- `pnpm exec playwright test -c tests/e2e/playwright.web-build.config.ts` — **9 von 9 bestanden**
  (letzter Lauf, 33,2 s), einschließlich beider neuer Gegenprobe-Abschnitte. Ports 5173/34173/34174
  nach dem Lauf nachweislich frei (kein Waisenprozess).
- `pnpm exec playwright test -c tests/e2e/playwright.config.ts todo-revival.spec.ts` — **5 von 5**
  (Pflichtablauf „Erledigtes Todo wiederbeleben"), zur Absicherung von `services.ts#startWeb`.
- `pnpm exec playwright test -c tests/e2e/playwright.config.ts export-end-to-end.spec.ts
  note-separation.spec.ts kanban.spec.ts` — **9 von 10**, ein Fehlschlag
  (`kanban.spec.ts:288`, TP-KANBAN-04) — **bekannt, vorbestehend**, bereits in T-249/T-259 als
  unzuverlässig dokumentiert (angehaltene Uhr/Kanban-Ladefolge), unverändert durch diese Aufgabe.
  Export-Ende-zu-Ende und Notiz-Trennung (Pflichtabläufe 2 und 3) beide grün. Ports nach dem Lauf
  frei.
- Standalone-Nachbau des neuen Siebs (Node, außerhalb von Playwright) gegen `tests/fixtures/web-
  build-rendered-text/{ohne-verstoss,mit-verstoss}` und gegen das echte, aktuelle `apps/web/dist`
  — Ergebnisse wie oben beschrieben.

Annahmen:
- `distContainsText(SHOWCASE_MARKER)` bewusst unverändert — kein gemessener Fund, siehe Abschnitt 2.
- `services.ts#startWeb`/`stopServices` mitbehoben, obwohl der Auftrag nur `startWebPreview`
  nannte: gleiche Datei-Hoheit (`tests/e2e/support/**`), gleicher Fund, gleiche Ursache, und die
  Alternative (nur `web-build-services.ts` fixen) hätte die Hauptreihe — 110 Fälle, der größte
  Testblock — mit demselben, jetzt bekannten Fehler zurückgelassen. Mit zwei Playwright-Läufen
  gegen die Hauptreihe gegengelesen (s. o.), nicht die vollen 110 Fälle — Zeitabwägung, keine
  Deckungslücke in meiner eigenen Änderung: Die berührten Pfade (`startWeb`, `stopServices`) sind
  in jedem Lauf der Hauptreihe genau einmal aktiv (Start/Stopp), nicht pro Testfall verschieden.
- `stopChild` (`web-build-services.ts`) von `void` auf `Promise<void>` geändert — einziger
  Aufrufer war mein eigener neuer Testfall, angepasst (`await`).
- Fixtures mit Umlaut im Dateinamen (`FälligkeitsdatumBadge-h4sh01.js`) bewusst so gewählt, nicht
  transliteriert — das Ziel war, den Bezeichner *tatsächlich* die geprüfte Zeichenfolge tragen zu
  lassen, nicht eine ähnliche.
- Für „fällig am" gibt es in `ohne-verstoss/` keinen eigens konstruierten Bezeichner-Fund
  (dokumentiert in `tests/fixtures/web-build-rendered-text/README.md`): Ein Leerzeichen ist in
  keinem JS-Bezeichner und keinem Dateinamen gültig, die Bauart aus T-263 kann dort strukturell
  nicht auftreten. Die Negativkontrolle ist „kommt nirgends vor", die Positivkontrolle
  (`mit-verstoss/`) deckt trotzdem beide geforderten Richtungen ab.

Risiken:
- Der Fund zu `child.kill('SIGTERM')` unter `shell: true` betrifft vermutlich auch andere
  `spawn(…, { shell: true })`-Stellen außerhalb meiner Hoheit (z. B. `apps/desktop/scripts/**`) —
  nicht geprüft, nicht mein Verzeichnis.
- `kanban.spec.ts` TP-KANBAN-04 bleibt unzuverlässig (vorbestehend, siehe T-249/T-259) — nicht
  Gegenstand dieser Aufgabe.
- `taskkill /t /f` ist ein härterer Eingriff als `SIGTERM` (kein Abwarten auf sauberes Beenden).
  Für Testprozesse ohne eigenen Zustand zum Sichern (vite-Prozesse) angemessen; bei einer
  künftigen Wiederverwendung dieses Musters für zustandsbehaftete Prozesse wäre das zu prüfen.

Offene Fragen: keine.

Nächster Schritt: Falls gewünscht, dieselbe `taskkill /t /f`-Härtung für weitere
`shell: true`-Spawns in `tests/e2e/support/**` prüfen (z. B. `attachment-persistence-services.ts`,
`version-check-services.ts`, `global-setup-outlook-build.ts` — nicht durchgesehen, da außerhalb
des hier gemessenen Funds). Ein voller Lauf von `pnpm test:e2e` (alle drei Konfigurationen) wäre
die abschließende Bestätigung, dass die Hauptreihe mit dem gehärteten `startWeb` durchgehend so
viele Fälle besteht wie zuletzt (T-259: 104/110) — hier aus Zeitgründen nur mit drei Dateien
stichprobenartig statt vollständig gegengelesen.
