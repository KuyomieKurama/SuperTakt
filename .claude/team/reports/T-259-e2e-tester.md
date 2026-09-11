Aufgabe: T-259 — Eine Zeile blockiert alle fünf Playwright-Konfigurationen
Status: fertig

Artefakte:
- `tests/e2e/support/version-check-entry.ts` (Zeile 67 — Pfad nachgezogen)
- Läufe (Protokolle als Beweismittel, nicht eingecheckt):
  `C:\Users\kyk\AppData\Local\Temp\claude\...\scratchpad\main-run-2.log`,
  `version-check-run.log`, `attachment-persistence-run.log`, `outlook-build-run.log`,
  `web-build-run.log`, `web-build-run2.log`

Zusammenfassung:
Die blockierende Zeile war beim Start meiner Arbeit bereits von domain-dev auf
`../../../apps/local-api/src/features/version/source.ts` nachgezogen — mein eigener,
unabhängig davon gefundener Fix traf zeichengleich denselben Pfad, es gab also keinen
Konflikt. Ich habe `tests/e2e/**` nach **weiteren** Pfaden abgesucht, die auf
`apps/local-api/src/…` oder `apps/web/src/…` zeigen (`Grep` über beide Baumhälften,
nicht nur `import`-Zeilen): Gefunden wurden zwei weitere feste Pfade in
`version-check-entry.ts:66` (`apps/local-api/src/main.ts`) und
`run-outlook-taskpane.mjs:42`/`global-setup-outlook-build.ts:6`
(`apps/local-api/src/taskpane/server.ts`) — beide zeigen auf Orte, die der Umbau **nicht**
verschoben hat (`taskpane/` liegt weiterhin direkt unter `src/`, nicht unter `features/`),
beide sind reguläre `.ts`-Importe und damit bereits durch `tsc` scharf: ein falscher Pfad
würde dort als `TS2307` rot, nicht still verschwinden. Alle übrigen 60+ Treffer für
`apps/web/src`/`apps/local-api/src` in `tests/e2e/**` sind Kopfkommentare (Verweise auf
Quelldateien zur Begründung), keine ausführbaren Pfade — ich habe das mit einem eigenen
Muster (`from ['"].*apps/(web|local-api)`) von den Prosa-Treffern getrennt und nur zwei
echte Fundstellen erhalten, beide unverändert gültig. Danach `pnpm run typecheck:e2e`
grün, dann alle fünf Konfigurationen einzeln gefahren, jede bis zum Ende gelesen.

Ergebnis, in drei Teilen:

**Erledigt (grün, gemessen): 115 von 124 Einzelfällen über fünf Konfigurationen.**
- `playwright.config.ts` (Hauptreihe): **104 von 110**, zwei vollständige Läufe. Der erste
  Lauf zeigte 46 rote Fälle mit `ECONNREFUSED 127.0.0.1:17843` ab Fall 44 — kein Befund,
  sondern dieselbe Bauart wie O-LJ (`board.md`): der lokale Dienst fiel mitten im Lauf weg,
  belegt durch `find apps/local-api/src -newermt "20 minutes ago"`, das zu diesem Zeitpunkt
  fünf gerade angefasste Dateien zeigte (domain-dev, Wellen 3/4, aktiv während des Laufs).
  Der zweite Lauf, mit ruhigem `apps/local-api/src`, lief sauber durch und endete bei genau
  104/110 — zeichengleich mit dem letzten bekannten Stand aus T-249.
- `playwright.version-check.config.ts`: **5 von 5**.
- `playwright.attachment-persistence.config.ts`: **2 von 2**.
- `playwright.outlook-build.config.ts`: **2 von 2**.
- `playwright.web-build.config.ts`: **2 von 5** sauber bestanden (TP-BUILD-02, die
  Gegenprobe von TP-BUILD-05 mit `TAKT_DESIGNSYSTEM=1`).

**Offen (rot, bekannt, unverändert seit T-249): 6.** Alle sechs bereits benannten Fälle,
kein neuer, keiner repariert:
- `kanban.spec.ts:288` (TP-KANBAN-04) — beide Versuche in diesem Lauf rot, unzuverlässig
  wie zuletzt gemessen.
- `note-separation.spec.ts:98` (TP-NOTE-02/03, Standardvorlage) — in der Hauptreihe rot,
  bekannt als „einzeln gefahren grün" (hier nicht erneut isoliert geprüft, kein Anlass).
- `timer-stop-announcement.spec.ts:209`, `:309`, `:361` — alle drei mit derselben
  Fehlerklasse wie zuletzt (`POST /timer/orphaned/resolve`, orphan-Erkennung).
- `toast-eviction.spec.ts:123` — rot mit rund einer Minute Laufzeit je Versuch, wie zuletzt
  beschrieben (angehaltene Uhr/Kanban-Ladefolge).

**Ungemessen (nicht sauber gemessen, kein Urteil): 3 — alle in `web-build-smoke.spec.ts`**
(`TP-BUILD-01`, `TP-BUILD-05` ohne Variable, der Frist-Mikrofall). Zweimal identisch
reproduziert, zweiter Lauf nach bestätigt freiem Port 5173 gestartet. Ursache gefunden,
nicht vermutet: Ein direkter `curl http://127.0.0.1:5173/` **während** und **nach** beiden
Läufen lieferte nachweislich eine echte Vite-**Entwicklungsserver**-Antwort
(`/@react-refresh`, `/@vite/client` im Rumpf) — nicht das gebaute, statische Bündel, das
diese Konfiguration prüfen soll. Das gebaute `apps/web/dist/index.html` selbst ist dabei
nachweislich korrekt (keine Entwicklungsartefakte, Zeitstempel passend zum Lauf) — der Bau
ist also nicht das Problem. Der Fehler liegt an einer **fremden Gegenstelle auf Port 5173**,
die diese Maschine gerade woanders hält (`board.md`: „Diese Maschine faehrt mehrere
Team-Agenten gleichzeitig"; zwei esbuild-Dienstprozesse mit lebenden Elternprozessen,
gestartet 19:24 und 19:36, außerhalb meiner Läufe). Dazu ein zweiter, unabhängiger Befund
in meiner eigenen Hoheit: `tests/e2e/support/web-build-services.ts#startWebPreview()` prüft
nur, ob **irgendetwas** auf Port 5173 antwortet (`fetch(...).then(r => r.ok)`), nicht, ob es
der selbst gestartete `vite preview`-Kindprozess ist — anders als `services.ts#spawnLocalApi`,
das die Bereitschaftsprüfung ausdrücklich gegen den frühen Tod des eigenen Kindes wettrennen
lässt (`Promise.race([ready, exitedEarly])`). Ohne dieses Wettrennen bleibt die Prüfung blind
gegenüber genau dem Fall, der hier zweimal eingetreten ist: der eigene `vite preview
--strictPort`-Prozess scheitert am belegten Port, aber die Gesamtprüfung meldet trotzdem
„bereit", weil eine fremde Antwort genügt.

104 + 5 + 2 + 2 + 2 = 115 erledigt. 6 offen. 3 ungemessen. 115 + 6 + 3 = 124.

Wähler-Prüfung (Auftragspunkt 3): keine gefunden. Stichprobe über vier Klassennamen aus
verschiedenen Fällen (`.boot`, `.done-switch`, `.entry-row`, `.todo-row`) gegen den
aktuellen, umgebauten Baum (`apps/web/src/features/**`, `apps/web/src/styles/**`) — alle
vier bestehen unverändert fort. Kein Prüffall in `tests/e2e/**` verweist auf `screens/`,
`components/` oder `usecases/` als Pfad.

Annahmen:
- Die drei „ungemessenen" Fälle zähle ich **nicht** zu „offen": Ein Fehlschlag, dessen
  Ursache nachweislich außerhalb des geprüften Bündels liegt (fremde Gegenstelle auf einem
  geteilten Port), ist kein Urteil über den Bau. Das deckt sich mit der Auflage, ungemessen
  von offen zu trennen.
- Für `note-separation.spec.ts:98` habe ich den Einzellauf aus T-249 nicht wiederholt — der
  aktuelle Lauf zeigt dieselbe Fehlerklasse an derselben Stelle, eine erneute Isolierung hätte
  nichts Neues zur Frage „hat der Umbau etwas verschoben" beigetragen.
- Ich habe `startWebPreview()` **nicht** repariert, obwohl die Datei in meiner Hoheit liegt:
  Der Fund ist unabhängig vom Umbau (er bestand vor T-247/T-249 vermutlich schon), eine
  Behebung mitten in T-259 hätte den Auftrag verlassen, ohne zusätzlichen Erkenntnisgewinn
  für die hier verlangte Frage (blockiert die eine Zeile alle fünf Konfigurationen — nein,
  mehr nicht).

Risiken:
- `playwright.web-build.config.ts` bleibt auf dieser Maschine unzuverlässig, solange mehrere
  Agenten gleichzeitig Port 5173 beanspruchen können — nicht nur durch die 84-rote-Fälle-Falle
  aus `strictPort`, sondern jetzt zusätzlich durch den hier gefundenen, leiseren Fall (falsches
  Grün/Rot durch eine fremde, aber erreichbare Gegenstelle).
- Die sechs offenen Fälle sind unverändert gegenüber T-249 — keine Verschlechterung durch den
  Umbau, aber auch keine Besserung; sie bleiben ungedeckt, bis die dort vorgeschlagenen
  Folgeaufgaben (eigene Ausführungskonfiguration für die orphan-Fälle, Kanban-Ladefolge unter
  `page.clock`) aufgegriffen werden.

Offene Fragen:
- Soll `startWebPreview()` künftig dasselbe Wettrennen wie `spawnLocalApi` bekommen (gegen
  frühen Tod des eigenen Kindes), damit ein belegter Port 5173 als benannter Fehlschlag statt
  als stille Fehlmessung erscheint? Eine kleine, in sich geschlossene Änderung, aber außerhalb
  dieses Auftrags entstanden.

Nächster Schritt: `startWebPreview()` in einer eigenen, kleinen Folgeaufgabe härten (Wettrennen
gegen frühen Prozesstod, nach dem Muster von `spawnLocalApi`); `playwright.web-build.config.ts`
danach einmal auf ruhigem Port erneut fahren, um TP-BUILD-01/05/Frist-Mikrofall sauber zu
urteilen.
