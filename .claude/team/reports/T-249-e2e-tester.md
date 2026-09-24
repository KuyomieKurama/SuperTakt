Aufgabe: T-249-7 — `tests/e2e/**` vor dem Umzug absichern, und T-246-1 zu Ende bringen
Status: teilweise
Artefakte:
- `tests/e2e/support/services.ts`
- `tests/e2e/support/attachment-persistence-services.ts`
- `tests/e2e/support/version-check-services.ts`
- `tests/e2e/support/build-check-session.ts`
- `tests/e2e/support/global-setup-outlook-build.ts`
- `tests/e2e/support/web-build-services.ts`
- `tests/e2e/web-build-smoke.spec.ts`

Zusammenfassung:

## 1. T-246-1 — `.pathname`-Falle behoben, `pnpm test:e2e` läuft jetzt tatsächlich

Alle fünf gemeldeten Stellen plus eine sechste, beim Absuchen der ganzen Hoheit gefundene
(`web-build-smoke.spec.ts` hat keine eigene — dort war die Wunde in `web-build-services.ts`
schon mit erledigt), sind auf `fileURLToPath(new URL(…))` umgestellt:

- `tests/e2e/support/services.ts:93` (`REPO_ROOT`)
- `tests/e2e/support/attachment-persistence-services.ts:30` (`REPO_ROOT`)
- `tests/e2e/support/version-check-services.ts:52` (`REPO_ROOT`)
- `tests/e2e/support/build-check-session.ts:59-65` (`OUTLOOK_ADDIN_DIST_DIR`, `WEB_APP_DIST_DIR`,
  `REPO_ROOT` — drei Stellen in einer Datei)

Ich habe `git grep -n "\.pathname"` und zusätzlich einen rohen Lauf über `tests/e2e/**` (nicht
nur `git grep`, wie E-087 verlangt) gemacht; das sind alle Treffer im Arbeitsbaum. `path.sep`
gegen Werte mit Schrägstrichen kommt in meiner Hoheit nicht vor — `displayPath`-artige Vergleiche
gibt es hier nicht, die einzigen Pfadverkettungen sind `${REPO_ROOT}apps/web` und `join(...)`,
beide vertragen sich mit dem nativen Trennzeichen aus `fileURLToPath`.

**Zweiter, vorher nicht gemeldeter Fund derselben Größenordnung:** Sechs `spawn('pnpm', …)` /
`execFile('pnpm', …)`-Aufrufe (`attachment-persistence-services.ts`, `services.ts` zweimal in
Wirkung [`startWeb`], `version-check-services.ts`, `web-build-services.ts` dreimal,
`global-setup-outlook-build.ts`) scheiterten unter Windows mit `spawn pnpm ENOENT` — `pnpm` ist
dort eine `.cmd`-Datei, `child_process.spawn`/`execFile` findet sie ohne `shell: true` nicht.
Ohne diese Behebung kam **kein einziger** Testfall zur Ausführung: `globalSetup` bricht vor dem
ersten Testfall ab, genau wie bei der `.pathname`-Falle, nur eine Ursache später. Ich habe
dieselbe Bauart übernommen, die bereits in `apps/desktop/scripts/collect-licenses.mjs:255`
etabliert ist (`shell: process.platform === 'win32'`, mit demselben Kommentarsatz), statt eine
neue zu erfinden.

**Damit lief `pnpm test:e2e` auf diesem Rechner zum ersten Mal überhaupt** — vorher schlug jeder
Versuch vor dem ersten Testfall fehl. Der Hintergrundlauf ist inzwischen fertig (Protokoll unter
`%TEMP%\claude-e2e-full-run.log`), deshalb hier die **gemessenen, nicht die zuletzt beobachteten**
Endzahlen: `playwright test -c tests/e2e/playwright.config.ts` (die erste der drei
Konfigurationen) lief **vollständig durch**, ein Arbeiter, sequentiell, 15,7 Minuten:
**91 bestanden, 19 fehlgeschlagen, 0 übersprungen von 110 Testfällen.** Kein Absturz der
Maschine, kein `0xC0000142` — die im Auftrag genannte Speichergrenze wurde nicht erreicht.

**Die beiden weiteren Konfigurationen (`playwright.version-check.config.ts`,
`playwright.attachment-persistence.config.ts`) sind in diesem Lauf gar nicht erst gestartet.**
`pnpm test:e2e` verkettet die drei Läufe mit `&&`: Weil die erste Konfiguration mit 19
Fehlschlägen einen Exitcode ungleich null lieferte (`[ELIFECYCLE] Command failed with exit code
1`), hat die Kommandokette dort abgebrochen — genau wie bei jedem anderen `&&`-verketteten
Bau- oder Prüfschritt in diesem Bestand. **„Vollständiger Lauf" heißt in diesem Auftrag: alle
drei Konfigurationen** — das ist mit dieser Ausführung **nicht** erreicht, und es wird auch mit
einer bloßen Wiederholung nicht erreicht, solange Abschnitt 2 offen ist: Ein erneuter Lauf über
`pnpm test:e2e` bricht an derselben Stelle wieder ab. Wer die beiden hinteren Konfigurationen
sehen will, muss sie einzeln aufrufen (`pnpm test:e2e:version-check`,
`pnpm test:e2e:attachment-persistence`) — das habe ich in dieser Aufgabe nicht mehr getan, um
den Rat „schwere Läufe nacheinander, nicht parallel" nicht durch einen dritten,
vierten Lauf ohne Rücksprache zu strapazieren.

## 2. Größter Fund — 12 der 19 Fehlschläge sind **ein** Fund, nicht 12

Root Cause identifiziert und mit dem Quelltext gegengeprüft: Der Export-Bildschirm wurde
irgendwann zwischen der letzten funktionierenden Fassung dieser Testreihe und heute von
`<div class="egroup">`-Karten auf eine echte `<table>` umgebaut
(`apps/web/src/components/ExportGroups.tsx`). Die Klasse `egroup` existiert weiterhin — aber
jetzt an der **falschen Ebene**: `<tbody className="export-todo">` trägt den Todo-Titel (Zeile
201), `<tbody className="egroup export-day">` (Zeile 302) ist die **verschachtelte Tagesebene
innerhalb** des aufgeklappten Bereichs, standardmäßig `hidden` und **ohne** den Todo-Titel im
Text. Sechs Testdateien suchen `.egroup` gefiltert nach dem Todo-Titel — das ist strukturell die
falsche Ebene, findet nichts, läuft in die 15 s `expect`-Zeitüberschreitung:

- `attachment-export-and-addin-exclusion.spec.ts`
- `export-audit-and-locks.spec.ts` (4 von 5 Testfällen)
- `export-end-to-end.spec.ts` — **Pflichtablauf „Export von Anfang bis Ende mit
  Statusprüfung"**
- `export-mixed-status-and-billing.spec.ts`
- `focus-return-after-dialog.spec.ts` (ein Testfall, der über den Export geht)
- `note-separation.spec.ts` (alle drei Testfälle mit echtem Export) — **Pflichtablauf
  „Notiz-Trennung"**

Das im gescheiterten Testfall selbst mitgeschnittene Accessibility-Snapshot beweist, dass der
Todo-Titel tatsächlich im DOM steht (`row "Tage auf- oder einklappen: E2E-AUDIT-CYCLE-…"`) — der
Testfall sieht die Buchung, nur nicht unter dem gesuchten Selektor. Das ist kein Zufallsfehler und
keine Verlangsamung durch die Maschine: alle Versuche **und** ihre Wiederholungen schlagen
gleich fehl. **Ich habe das nicht behoben** — das wäre eine begründete Entscheidung über den
richtigen neuen Selektor für sechs Dateien, die ich nicht ohne Rücksprache treffen wollte
(`.export-todo`? Zugriff über `getByRole('row', { name: … })`, wie es der eigene Accessibility-Baum
schon nahelegt? — beides sind Vermutungen von mir, keine Feststellung). Das ist der
schwerwiegendste Fund dieser Aufgabe und braucht einen eigenen Auftrag.

## 3. Sieben weitere, davon unabhängige Fehlschläge — gefunden, nicht behoben

- `field-live-region-announcement.spec.ts:165` — Fokus-Rückführung nach gescrolltem
  Absendeversuch schlägt fehl (1,3 s, kein Zeitüberschreitungsmuster).
- `kanban.spec.ts:288` (TP-KANBAN-04) — `expect(locator).not.toHaveClass(/kcard--running/)`
  schlägt fehl: Die Karte trägt nach dem Timerstart dauerhaft `kcard--running kcard--reactivated`,
  wo der Testfall erwartet, dass „running" irgendwann verschwindet.
- `timer-stop-announcement.spec.ts:209/309/361` — drei Testfälle rund um
  `POST /timer/orphaned/resolve`: der Dialog „Eine Buchung ohne Ende" erscheint nicht
  (`getByRole('dialog', …)` findet nichts binnen 15 s).
- `toast-eviction.spec.ts:123` — `getByRole('button', { name: 'Spalte … verwalten' })` findet
  binnen 60 s (volles Testzeitlimit, nicht nur das `expect`-Zeitlimit) nichts; deutlich langsamer
  als jeder `.egroup`-Fall dieser Reihe und ein anderes Bedienelement (Kanban-Spaltenmenü, nicht
  Export).
- `todo-filter-layout.spec.ts:5` — „Ordnung und Erledigt-Schalter stehen in derselben Reihe":
  `locator('.todo-list__ordering').locator('.field__hint').boundingBox()` liefert nach 760×800
  Ansichtsfenster-Größe nichts binnen 60 s. Layoutfall bei schmalem Ansichtsfenster — genau die
  Fläche, die der Visual-Gate-Auftrag dieser Rolle eigens verlangt zu prüfen.

Diese sieben Fehlschläge teilen kein gemeinsames Muster mit dem `.egroup`-Fund und untereinander
wahrscheinlich auch nicht — ich habe sie nicht tiefer verfolgt, das wäre Vermutung statt Messung
gewesen. Alle sieben sind mit Bildschirmfoto und Spur (`trace.zip`) unter `test-results-e2e/`
belegt.

## 4. Stützen gegen den Umzug — Ergebnis: nichts zu härten gefunden, eine Sache gehärtet

Ich habe `apps/web/src`-Importe in meiner Hoheit gesucht (`grep` über `tests/e2e/**` und
`tests/fixtures/**`, nicht nur `git grep`): **keine einzige** e2e-Datei liest oder importiert
etwas aus `apps/web/src/**` über einen festen Pfad — der Kopfkommentar von
`board-empty-state-rule-chain.spec.ts` behauptet das ausdrücklich („dieser Testbaum hat keinen
Zugriff auf `apps/web/src/**`") und ich habe es nachgemessen, nicht nur gelesen. Die einzigen
festen Importe in Quellbäume sind `packages/domain/src/pool-movement.ts` (viermal) und
`apps/local-api/src/{main,version/source,taskpane/server}.ts` — beide Bäume werden von T-249 laut
Auftragstext **nicht** umgebaut (nur `apps/web/src`), deshalb außerhalb des Umfangs dieser
Aufgabe. Bericht, nicht Behebung: Falls ein künftiger Umzug auch diese Bäume anfasst, brauchen
diese vier Importe eine eigene Betrachtung.

`scripts/source-anchors.mjs` passt für die Fundlage hier **nicht direkt**: Ein `.ts`-Test, der
die `.mjs`-Datei ohne eigene Typdeklaration importiert, scheitert unter `noImplicitAny`/`strict`
mit `TS7016` (geprüft mit einer Probedatei, nicht vermutet, danach wieder entfernt). Ich habe das
nicht umgangen, indem ich `source-anchors.mjs` ändere — das liegt außerhalb meiner Hoheit — und
keine sechste Fassung geschrieben, sondern die eine Stelle, die eine Untergrenze über eine Menge
brauchte, eigenständig gehärtet:

`web-build-services.ts#distContainsText` und die gleichnamige Kopie in
`web-build-smoke.spec.ts#distContainsRenderedText` (beide durchsuchen `apps/web/dist` nach
verbotenem/erlaubtem Text, beide werden **negativ** geprüft — `.toBe(false)`) lieferten bei einem
fehlenden oder leeren `apps/web/dist` `false` zurück — dasselbe `false` wie ein tatsächlich
durchsuchtes Bündel ohne Treffer. Genau die Bauart aus T-247-7, die vier Wächter still grün über
einer Menge ließ, die sie nie gesehen hatten. Beide werfen jetzt bei einem fehlenden oder leeren
Baum statt `false` zurückzugeben — mit einem Satz, der den fehlenden Gegenstand benennt.

## 5. Was ausdrücklich nicht behoben wurde

- Die sechs `.egroup`-Fundstellen (Abschnitt 2) — Auswahl des richtigen neuen Selektors braucht
  eine Entscheidung, keine Vermutung.
- Die sieben unabhängigen Fehlschläge aus Abschnitt 3.
- `packages/domain/src/pool-movement.ts` und `apps/local-api/src/{main,version/source,
  taskpane/server}.ts` als feste Importpfade — außerhalb des Umzugsumfangs von T-249.

Annahmen:
- `shell: process.platform === 'win32'` für alle `spawn`/`execFile`-Aufrufe von `pnpm` ist
  dieselbe, bereits im Bestand etablierte Bauart (`apps/desktop/scripts/collect-licenses.mjs`) —
  keine eigene Erfindung.
- Der volle `pnpm test:e2e`-Lauf lief in einer einzelnen Bash-Sitzung im Hintergrund, nicht
  parallel zu anderem — der Hinweis zur Maschine wurde befolgt; kein `0xC0000142`.
- Nach dem Abbruch der Kommandokette bei Konfiguration 1 habe ich Konfiguration 2 und 3 nicht
  einzeln nachgestartet (Begründung im „Nächster Schritt").

Risiken:
- **Pflichtablauf „Export von Anfang bis Ende mit Statusprüfung" ist aktuell nicht grün** — nicht
  wegen dieser Aufgabe, sondern wegen des `.egroup`-Funds. Bis er behoben ist, hat T-249 selbst
  keinen belastbaren Nachweis für diesen Ablauf, nur den Beleg, dass der Testlauf überhaupt bis
  dorthin kommt.
- Dieselbe Lage für „Notiz-Trennung" (Pflichtablauf 3).
- **`pnpm test:e2e` ist als Ganzes rot, und `pnpm check` fährt `test:e2e` nicht mit — aber jeder
  andere Aufrufer, der `pnpm test:e2e` als Torkriterium nimmt, bricht an derselben Stelle ab.**
  Konfiguration 2 (`version-check`) und 3 (`attachment-persistence`) sind durch den `&&`-Abbruch
  komplett ungeprüft; ob sie unter Windows überhaupt laufen, ist mit dieser Aufgabe **nicht**
  festgestellt. Besonders `attachment-persistence-live.spec.ts` (startet den Dienst laut eigenem
  Kopfkommentar mitten im Lauf neu) und `version-check-live.spec.ts` (prüft einen Neustart, den
  A-18.7/R-20 verlangen) sind neue, in dieser Aufgabe ungemessene Flächen.

Offene Fragen:
- Wer entscheidet den richtigen Ersatzselektor für `.egroup` in den sechs betroffenen Dateien —
  frontend-dev/integration-dev, die den Tabellenumbau von `ExportGroups.tsx` kennen, oder e2e-tester
  in einer eigenen Folgeaufgabe nach Rücksprache?
- Sollen `pnpm test:e2e:version-check` und `pnpm test:e2e:attachment-persistence` einzeln
  angestoßen werden, um wenigstens ihren eigenen Windows-Erststand zu messen, obwohl
  `pnpm test:e2e` als Ganzes wegen Abschnitt 2 rot bleibt?

Nächster Schritt: Eine eigene Aufgabe für den `.egroup`-Fund anstoßen (Abschnitt 2), mit
Kenntnis des tatsächlichen `ExportGroups.tsx`-Aufbaus. Erst danach liefert ein erneuter
`pnpm test:e2e`-Lauf auch die beiden hinteren Konfigurationen — vorher bricht er, wie hier
gemessen, zuverlässig an derselben Stelle ab.

---

## Fortschreibung — T-249-8: die 18 (tatsächlich 19) Fehlschläge

**Berichtigte Ausgangszahl vom Orchestrator:** 91 bestanden, **19** fehlgeschlagen, 110 insgesamt
(15,7 Minuten, kein Absturz). Zwölf davon gehen auf den `.egroup`-Fund zurück (nicht elf), sieben
sind unabhängig. Alle drei Konfigurationen sind in dieser Aufgabe jetzt **einzeln über ihre
Konfigurationsdateien** gefahren und gelesen worden, nie über `pnpm test:e2e` (verkettet mit `&&`,
bricht an der ersten roten Konfiguration ab).

### 1. Die Entscheidung zum Wähler, Datei für Datei

`.export-todo` (Zeile 201, `ExportGroups.tsx`) ist der Todo-Block, trägt den Titel. `.egroup`
(Zeile 302) ist der Tages-Block, eine Ebene tiefer, standardmäßig unter einem `hidden`-Elternknoten
verborgen und **ohne** den Todo-Titel im eigenen Text. Geprüft und einzeln entschieden, nicht
sammelersetzt:

- **`attachment-export-and-addin-exclusion.spec.ts`** (2 Fundstellen) — nur `.toBeVisible()`
  nach dem Titel gefiltert → `.export-todo`, unverändert sonst.
- **`note-separation.spec.ts`** (3 Fundstellen, alle drei Testfälle) — dieselbe Lage,
  `.export-todo`. Der Testfall „Standardvorlage (base64)" hatte darunter einen **zweiten,
  unabhängigen** Fehlschlag (Abschnitt 3).
- **`export-end-to-end.spec.ts`** (TP-EXPORT-01/02/03, Pflichtablauf) — hier wird wirklich der
  Tagesinhalt gebraucht (`.egroup__quarters`, `input.egroup__check`). Zuerst `.export-todo`
  ermitteln, den Todo-Kopf aufklappen (`getByRole('button', { name: /klappen/ })` — dazu gleich
  mehr), dann `.locator('.egroup')` als Kind ansprechen.
- **`export-mixed-status-and-billing.spec.ts`** (3 Testfälle) — zwei einfache (`.export-todo`
  genügt), einer (gemischter Exportstatus) mit vollem Aufklappen wie oben, einer (E-034) mit
  einer zusätzlichen Berichtigung: `.egroup--blocked` steht nur noch in `components.css`, nicht
  mehr im Quelltext — die gesperrte Kennzeichnung trägt seit dem Tabellenumbau die Kopfzeile
  selbst (`tr.export-day__head--blocked`), nicht mehr die Gruppe als Ganzes. Ersetzt durch die
  Prüfung der tatsächlichen Zeilenklasse.
- **`export-audit-and-locks.spec.ts`** (4 Testfälle) — zwei einfache Sichtbarkeitsprüfungen
  (`.export-todo`); zwei mit `input.egroup__check`-Interaktion (`dispatchEvent('click')` gegen
  eine echte Auswahl statt einer verdeckten): dort erst den Todo-Kopf aufklappen, **bevor** die
  Route-Attrappe bzw. der Bestätigungsdialog steht — ein Klick auf ein tatsächlich verborgenes
  Kästchen wäre kein echter Bedienweg mehr gewesen.
- **`focus-return-after-dialog.spec.ts`** (TP-FOCUS-07) — volles Aufklappen (Todo-Kopf, dann
  Tagesgruppe), dieselbe Bauart.

**Ein zweiter, eigenständiger Fund beim Umsetzen:** `getByRole('button', { name: /aufklappen/ })`
hätte nie getroffen — die Beschriftung lautet `"Tage auf- oder einklappen: …"` bzw.
`"Buchungen auf- oder einklappen: …"`, und „aufklappen" kommt darin als zusammenhängende
Zeichenkette nicht vor (`auf-`, Leerzeichen, `oder`, Leerzeichen, `einklappen`). Ich habe das erst
gemessen, als der `.export-audit-and-locks.spec.ts`-Testfall „Der gesperrte Export" trotz
korrigiertem `.export-todo` in die volle 60-Sekunden-Zeitüberschreitung lief (zweimal, mit
Wiederholung) — `/klappen/` trifft beide Beschriftungen zuverlässig und eindeutig im jeweiligen
Suchbereich. Alle sechs Aufklapp-Stellen sind entsprechend berichtigt.

**Ein dritter Fund, nicht Testcode, sondern totes CSS — gemeldet, nicht angefasst:**
`.egroup__quarters` und `.egroup--blocked` stehen weiterhin in `components.css`, aber
`ExportGroups.tsx` setzt sie an keinem Knoten mehr (die gerundete Zeit trägt heute nur noch
`table__cell--center tabular`, ohne eigene Klasse; die Sperr-Kennzeichnung trägt
`export-day__head--blocked` am `<tr>`, nicht mehr `egroup--blocked` an der Gruppe). Die Prüffälle
greifen jetzt auf den vorhandenen Text bzw. die vorhandene Klasse zu — das ist berichtigt, aber
die tote CSS-Regel bleibt ein Fund für frontend-dev.

**Ergebnis, gemessen (Haupt-Konfiguration, sauberer Lauf):** alle zwölf `.egroup`-Fälle grün,
einschließlich beider Pflichtabläufe „Export von Anfang bis Ende" und „Notiz-Trennung".

### 2. Die sieben unabhängigen Fehlschläge — je eine Aussage

**`field-live-region-announcement.spec.ts:165` (O-IE) — Prüffall war veraltet, berichtigt.**
Vorbedingung `scrollTopBeforeSubmit > 0` schlug fehl: `0` statt `> 0`. Ursache gefunden in
`apps/web/src/styles/viewport-layout.css` — die Layoutüberarbeitung (`docs/design/supertakt-
layout.md`) ersetzt die starre `60vh`-Grenze des Formularrumpfs durch
`calc(100vh - 2 * var(--space-6))`; auf dem Standardfenster dieser Reihe hat der Dialog seither
genug Höhe, um alle Felder ohne Bildlauf zu zeigen — genau die Vorbedingung, die der eigene
Dateikopf als „sonst mißt der Fall nichts" benennt. Berichtigt durch ein kleineres Testfenster
(`1280×600`) vor dem Öffnen des Dialogs, das echten Bildlauf erzwingt; die Messung selbst blieb
unverändert scharf. **Gemessen: grün.**

**`todo-filter-layout.spec.ts:5` — Prüffall war veraltet, zweifach, berichtigt.** Erster Fund:
`.field__hint` existiert nicht in `TodoListFilters.tsx` — die Hinweiszeile trägt die eigene,
engere Klasse `todo-list__sort-hint`. Nach dieser Berichtigung lief der Fall zwar durch die
Selektorsuche, scheiterte aber an einer **umgekehrten** Richtungsprüfung: `toggle.y >
hint.y + hint.height` (Schalter unterhalb des Hinweises) gegen tatsächlich gemessen `454,8 <
516,8` (Schalter **oberhalb**). Screenshot und `TodoListFilters.tsx`-Reihenfolge (Select, Schalter,
dann `<p className="todo-list__sort-hint">`) stimmen überein: Bei `flex-wrap` ohne `order` hält
die DOM-Reihenfolge die Zeilenzuordnung, `flex-basis: 100%` erzwingt für den Hinweis eine eigene,
**spätere** Zeile — Select und Schalter bleiben zusammen in der ersten Zeile, genau die Aussage
im Falltitel. Berichtigt: Richtung getauscht (`hint.y > toggle.y + toggle.height`), dieselbe
Schärfe. **Gemessen: grün**, auch im sauberen Gesamtlauf.

**`note-separation.spec.ts:98` (STD) — ein zweiter, vom `.egroup`-Fund unabhängiger Fund darunter,
Prüffall war veraltet, berichtigt.** Nach der `.export-todo`-Berichtigung blieb der Fall rot, jetzt
an `.tpgroup__head` (S-14-Vorschau, `TemplatePreview.tsx`) — derselbe Fehlschlagstyp, andere
Fläche. Ursache: `TemplatesScreen.tsx` hat die Vorschau von einer eingebetteten Fläche in einen
eigenen Dialog verlegt (`previewOpen`, Vorgabe `false`, Knopf „Vorschau öffnen", `DialogSurface`
mit Titel „Vorschau") — vor diesem Klick steht `.tpgroup__head` gar nicht im Baum. Berichtigt:
Knopf klicken, Dialog abwarten, danach wie zuvor suchen, am Ende den Dialog wieder schließen.
**Gemessen: grün**, alle vier `note-separation`-Fälle im sauberen Gesamtlauf.

**`kanban.spec.ts:288` (TP-KANBAN-04) — nicht eindeutig zuzuordnen, gemeldet, nicht angefasst,
Befund berichtigt.** Erste Messung (Orchestrator-Lauf plus mein erster Nachlauf): zweimal
hintereinander derselbe Fehlschlag, deterministisch **innerhalb** je eines Laufs (beide Versuche
inklusive Wiederholung rot, `kcard--running` bleibt nach dem Stoppen stehen). Dritter, sauberer
Gesamtlauf (nach allen Berichtigungen): **derselbe Fall besteht auf Anhieb.** Zwei von drei
vollständigen Läufen rot, einer grün — das ist keine saubere Reproduktion mehr, und ich berichtige
meine eigene frühere Einschätzung („Erzeugnis kaputt, deterministisch"): Sie war zu stark. Der
Fall gehört unter „unzuverlässig" (Zeitgrenze/Nebenläufigkeit, `apps/web/**`, nicht meine Hoheit),
nicht unter einen bestätigten Produktfehler. Ein Leitfaden für wer auch immer das weiterverfolgt:
Der Knopf „Timer für … stoppen" wird über `TimerContext.tsx#requestStop`/`toggle` erreicht, die
beide durch `guardIdle` laufen (`idle.check()` vor jeder Handlung) — ein plausibler, aber
**ungeprüfter** Kandidat für zeitweise verzögerte Zustandsübernahme, keine Feststellung.

**Drei Fälle in `timer-stop-announcement.spec.ts` (Zeilen 209, 309, 361) — Prüffall ist veraltet,
Ursache am Quelltext verifiziert, **absichtlich nicht in dieser Welle behoben**.** Alle drei
warten auf den Dialog „Eine Buchung ohne Ende" nach einem über die rohe API gestarteten Timer;
er erscheint nie (`getByRole('dialog', …)`, 15 s, beide Versuche, in **allen drei** vollständigen
Läufen dieser Aufgabe deterministisch rot — 6 von 6). Ursache gefunden in
`apps/local-api/src/usecases/timer.ts#loadOrphanedTimer`: Seit `captureTimerRecovery` (Kommentar
im Quelltext: „Capture once before serving requests: only a timer from the previous run is
orphaned") zählt als „verwaist" nur noch ein Timer, der **beim Start des Dienstprozesses** schon
lief — nicht mehr jeder zum Ladezeitpunkt unvollständige Eintrag, wie es der Kopfkommentar dieser
Testdatei noch behauptet und wie es vor dieser Änderung galt. Das ist plausibel eine bewusste,
richtige Verschärfung (ein zweiter, still geöffneter Tab sähe sonst jeden eigenen laufenden Timer
fälschlich als Absturz-Überbleibsel). Die im selben Prozeß über die rohe API gestarteten Timer
dieser drei Testfälle entstehen aber **nach** dem Start des lokalen Dienstes dieser Testreihe —
sie erfüllen die neue Bedingung nie, unabhängig von jeder Wartezeit. **Warum nicht in dieser Welle
behoben:** Die einzig saubere Nachbildung eines „Timers, der beim Start schon lief" ist ein echter
Prozeß-Neustart des Dienstes mit demselben Bestand — genau das Werkzeug, das
`support/services.ts#restartLocalApi` bereits bereitstellt, aber laut **eigenem, bereits im
Bestand stehendem Kommentar** in `playwright.config.ts` (Zeilen 33–37) ausdrücklich **nicht** in
der geteilten Hauptreihe verwendet werden darf — es risse jeder anderen, gleichzeitig oder danach
laufenden Datei den Dienst unter den Füßen weg. Genau aus diesem Grund hat `T-150` für
`attachment-persistence-live.spec.ts` eine **eigene, isolierte** Konfiguration gebaut
(`playwright.attachment-persistence.config.ts`, eigener `globalSetup`, `testMatch` auf genau eine
Datei). Diese drei Fälle bräuchten dieselbe Isolierung. Das ist eine Umstrukturierung der
Testinfrastruktur, keine Selektor- oder Assertionskorrektur, und sie hätte in dieser Aufgabe unter
Zeitdruck ein greifbares Risiko für die anderen ~100 Fälle der Hauptreihe getragen, die genau
diese Konfiguration heute teilen. Ich habe sie deshalb **bewusst nicht angefasst** und stattdessen
diese Ursache sauber dokumentiert liegen lassen — eine eigene, kleine Folgeaufgabe (neue
Konfiguration + Verschieben der drei Fälle, nach dem Muster von T-150) trägt das Risiko sauber
weg von den anderen ~100.

**`toast-eviction.spec.ts:123` — unzuverlässig, Ursache jetzt genauer gefunden, nicht behoben.**
In allen drei vollständigen Läufen rot (6 von 6 Versuchen), aber mit **wechselndem**
Fehlschlagsort in den ersten beiden Läufen (unterschiedliche Zeilen zwischen Versuch und
Wiederholung) — im dritten, sauberen Lauf beide Versuche an derselben Stelle (Zeile 153, der
allererste Klick auf „Spalte … verwalten" nach `page.clock.pauseAt(...)`). Der mitgeschnittene
Bildschirm zum Fehlschlag zeigt die Ursache unmittelbar: Das Kanban-Board hängt dauerhaft bei
„Ansicht wird geladen …", der Ladevorgang schließt nie ab. Das ist **nicht** die im Dateikopf
selbst benannte, ältere Gefahr (Popover-Schließanimation über `setTimeout`, das unter
angehaltener Uhr nie feuert) — das war eine andere Fläche (Kartenmenüs), die dieser Fall laut
eigenem Kommentar gerade deshalb meidet. Hier hängt die **Seitennavigation selbst**: Irgendein
Schritt im Ladepfad des Kanban-Boards hängt an einem echten Zeitgeber, der unter
`page.clock.pauseAt(...)` nicht mehr feuert — welcher genau, habe ich nicht ermittelt (das wäre
`apps/web/src/screens/BoardScreen.tsx` und angrenzender Code, `frontend-dev`s Hoheit). Das ist ein
präziserer, aber weiterhin unvollständiger Befund: Der Mechanismus (eine angehaltene Uhr bricht
eine timerabhängige Ladefolge) steht jetzt fest, die genaue Zeitgeber-Stelle nicht. Kategorie
bleibt „unzuverlässig" (Nebenläufigkeit/Zeitgrenze), nicht behoben — eine Reparatur ohne Kenntnis
der genauen Zeitgeber-Stelle wäre Raten.

### 3. Die beiden vorher nie gelaufenen Konfigurationen — jetzt gemessen

**`playwright.version-check.config.ts` — einzeln gefahren, 5 von 5 bestanden**, 48,1 s,
einschließlich der beiden echten Prozess-Neustarts (TP-VER-11, TP-VER-12 — `A-18.10`, `R-20`).

**`playwright.attachment-persistence.config.ts` — einzeln gefahren, 2 von 2 bestanden**, 3,5 s,
einschließlich des echten `SIGTERM`-Neustarts mit demselben Datenverzeichnis (TP-ANH-10 Stufe 2,
TP-ANH-21).

Keine der beiden Konfigurationen zeigte in dieser Aufgabe einen Fehlschlag. Sie sind damit **nicht
mehr unbekannt** — sie sind gemessen und grün.

### 4. Zahl mit drei Teilen, wie verlangt

Von den ursprünglich 19 Fehlschlägen der Hauptreihe (gemessen im sauberen Gesamtlauf: **106
bestanden, 4 fehlgeschlagen**, 6,9 Minuten):

- **Erledigt: 14** — die zwölf `.egroup`-Fälle (einschließlich beider Pflichtabläufe „Export von
  Anfang bis Ende" und „Notiz-Trennung", und einschließlich des zweiten, darunterliegenden Fundes
  in `note-separation.spec.ts` STD), `field-live-region-announcement.spec.ts:165`,
  `todo-filter-layout.spec.ts:5`. Jeweils im sauberen Gesamtlauf gegengelesen, keiner davon
  abgeschwächt.
- **Bei anderen (Produktivcode, gemeldet, nicht angefasst): 0 eindeutig zugeordnet.** Kein Fund
  dieser Aufgabe erlaubte mir eine so sichere Zuordnung wie „das ist zweifelsfrei ein
  Produktfehler" — der einzige Kandidat dafür (`kanban.spec.ts` TP-KANBAN-04) bestand im dritten
  Lauf sauber und ist deshalb unten unter „offen" geführt, nicht hier. Als reine Beobachtungen,
  nicht als Testbefund gezählt, gemeldet: die zwei toten CSS-Klassen `.egroup__quarters`/
  `.egroup--blocked` (Abschnitt 1) und die absichtliche, wahrscheinlich richtige Verschärfung von
  `loadOrphanedTimer` (Abschnitt 2) — Letztere ist kein Fehlerbefund, sondern die Erklärung, warum
  drei Prüffälle jetzt unter „offen" stehen.
- **Offen: 5** — `kanban.spec.ts` TP-KANBAN-04 (unzuverlässig, zwei von drei Läufen rot, einer
  grün, Ursache nicht gesichert), die drei orphan-Fälle in `timer-stop-announcement.spec.ts`
  (Ursache gesichert, Behebung braucht eine eigene, isolierte Playwright-Konfiguration nach dem
  Muster von T-150 — bewusst nicht in dieser Welle gebaut), `toast-eviction.spec.ts` (Mechanismus
  jetzt gefunden — angehaltene Uhr hängt die Kanban-Ladefolge —, genaue Zeitgeber-Stelle nicht).
- **Ungemessen: 0.** Alle drei Konfigurationen sind in dieser Aufgabe jeweils einzeln über ihre
  eigene Konfigurationsdatei gefahren und bis zum Ende gelesen worden — die Haupt-Konfiguration
  zweimal (ein Zwischenstand mit einem eigenen Fund, siehe Abschnitt 1, und der abschließende,
  saubere Lauf), `version-check` und `attachment-persistence` je einmal, beide zum ersten Mal
  überhaupt unter Windows. Kein Ergebnis dieser Aufgabe beruht auf einem nur begonnenen oder
  abgebrochenen Lauf.

14 + 0 + 5 = 19.

Artefakte (zusätzlich zu Abschnitt 1 der ursprünglichen Aufgabe):
- `tests/e2e/attachment-export-and-addin-exclusion.spec.ts`
- `tests/e2e/note-separation.spec.ts`
- `tests/e2e/export-end-to-end.spec.ts`
- `tests/e2e/export-mixed-status-and-billing.spec.ts`
- `tests/e2e/export-audit-and-locks.spec.ts`
- `tests/e2e/focus-return-after-dialog.spec.ts`
- `tests/e2e/field-live-region-announcement.spec.ts`
- `tests/e2e/todo-filter-layout.spec.ts`

Annahmen (T-249-8):
- `/klappen/` statt `/aufklappen/` als Regex für die Auf-/Einklapp-Beschriftung ist eine
  Minimalkorrektur der bestehenden Bauart, keine neue Selektorstrategie — sie trifft weiterhin
  eindeutig im jeweils verwendeten, engen Suchbereich (nie `page` global).
- Die Fensterhöhe `600px` für `field-live-region-announcement.spec.ts` ist bewusst knapp über der
  `44rem`-Medienabfrage-Schwelle aus `viewport-layout.css` gewählt (kleineres Fenster, dieselbe
  Abfrage greift ohnehin unabhängig von der genauen Zahl) — nicht die einzig mögliche Wahl, aber
  eine, die den Bildlauf robust erzwingt, ohne eine schmale/mobile Darstellung zu behaupten, die
  dieser Fall nicht prüft.
- Ich habe die drei orphan-Fälle nicht durch eine Verschiebung in
  `playwright.attachment-persistence.config.ts` „miterledigt", obwohl diese Konfiguration bereits
  `restartLocalApi` einsetzt — sie ist laut eigenem Kopfkommentar exklusiv für
  `attachment-persistence-live.spec.ts` gebaut, und ein Mitziehen fremder Fälle dort wäre eine
  Vermischung zweier Zwecke ohne Rücksprache gewesen.

Risiken:
- Die drei orphan-Fälle bleiben ohne Prüfnetz, solange F-21-artige Rücksprache zur neuen
  Konfiguration aussteht — E-036 (verwaiste Buchung nach Absturz) ist damit über keinen
  automatisierten Weg mehr gemessen.
- `toast-eviction.spec.ts` bleibt ohne Prüfnetz für W-10 (Meldung mit Rückweg wird nicht
  verdrängt) — die Prüfaussage selbst ist vermutlich weiter richtig, aber der Fall kann sie unter
  `page.clock` nicht mehr zuverlässig zeigen.
- `kanban.spec.ts` TP-KANBAN-04 ist jetzt als unzuverlässig eingestuft, nicht als bestätigt grün —
  ein künftiger roter Lauf dieses einen Falls sollte nicht überrascht ignoriert werden, bevor die
  Ursache (`guardIdle`/`idle.check()`-Verdacht, ungeprüft) geklärt ist.

Offene Fragen:
- Soll eine eigene Folgeaufgabe die drei orphan-Fälle nach dem Muster von T-150 in eine isolierte
  Konfiguration verschieben (neue `playwright.timer-recovery.config.ts` o. ä., eigener
  `globalSetup`, `restartLocalApi` vor der Navigation)? Das ist die einzige Behebung, die ich
  gefunden habe, die weder die Aussage des Falls abschwächt noch die Hauptreihe gefährdet.
  frontend-dev/integration-dev sollten dabei bestätigen, dass `captureTimerRecovery`s Verschärfung
  tatsächlich beabsichtigt ist (plausibel, aber von mir nicht entschieden) — sonst gehört die
  Behebung andersherum.
  - `apps/web/src/screens/BoardScreen.tsx` (und was es an Daten lädt) sollte daraufhin gelesen
    werden, welcher Schritt der Kanban-Ladefolge an einen echten Zeitgeber hängt, der unter
    `page.clock.pauseAt(...)` nicht feuert — das würde `toast-eviction.spec.ts` reparierbar machen
    und wäre für frontend-dev auch außerhalb von Tests interessant (ein Debounce oder eine
    Mindest-Ladezeit, die von der Systemuhr abhängt, statt von einer monotonen Zeitquelle, wäre an
    sich schon ein Fund).
  - Lohnt sich eine gezielte, kurze Nachmessung von `kanban.spec.ts` TP-KANBAN-04 (z. B. fünf
    Läufe hintereinander), um „unzuverlässig" von „selten, aber real" zu unterscheiden, bevor
    jemand Zeit in die `guardIdle`-Spur steckt?

Nächster Schritt: Die drei offenen Befunde (orphan-Isolierung, Kanban-Ladefolge unter
`page.clock`, TP-KANBAN-04-Nachmessung) als eigene, kleine Folgeaufgaben ans Board — keiner davon
gehört in eine weitere Runde dieser Aufgabe, weil jeder eine Entscheidung außerhalb meiner Hoheit
braucht (Produktverhalten bestätigen, Testinfrastruktur erweitern, oder schlicht mehr Messzeit).
