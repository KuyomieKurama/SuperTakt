Aufgabe: T-311 — TP-ANH-13 neu fassen, übrige Träger der überholten Zusage suchen, die zweite Naht von A-19.33 messen
Status: fertig
Artefakte:
- `tests/e2e/attachment-export-and-addin-exclusion.spec.ts` (TP-ANH-13 neu gefasst)
- `tests/e2e/addin-attachment-handoff-to-app.spec.ts` (neu — TP-ANH-23)
- `tests/e2e/support/api.ts` (erweitert: `addinBookOnTodo` nimmt zusätzliche Felder für den Schmuggeltest an, `AddinCreatedTodo`/`Attachment` um die seit Migration 0023 vorhandenen Felder ergänzt, neue Typen für den Anhangsumschlag)
- `docs/testplan.md` (TP-ANH-13 neu gefasst, neuer Unterabschnitt 25.4 mit TP-ANH-23, Zusammenfassungstabelle nachgezogen)

Zusammenfassung:
TP-ANH-13 maß bis heute die Abwesenheit, die A-19.19 seit E-108/T-304 nicht mehr zusagt, und war
damit — wie im Befund F-2 aus T-308 beschrieben — ein Wächter, der das Gegenteil des Bestands
behauptet. Er misst jetzt die Hälfte, die geblieben ist: An einem Todo, das vorher schon da war,
entsteht über das Add-in kein Anhang — geprüft an den beiden konkreten Stellen, an denen das
Add-in ein vorhandenes Todo im Rumpf überhaupt berührt (die Anlegetür mit einer mitgeschickten
fremden Kennung, die Buchungstür mit einem mitgeschickten Anhangsfeld), jeweils an der Wirkung
gemessen und mit einer Gegenprobe, dass der Anhang tatsächlich anderswo entstanden ist — sonst
wäre die Nullmessung aus dem falschen Grund richtig. Zusätzlich habe ich den fehlenden Prüffall
für die zweite Naht aus A-19.33 geschrieben (`TP-ANH-23`): Ein über das Add-in angelegtes Todo mit
drei übernommenen Anhängen wird in `apps/web` aufgeschlagen und real gerendert geprüft — genau
drei Zeilen (Untergrenze über die Menge, nicht „mindestens eine"), die Nachbau-Kennzeichnung an
der Zeile und im zugänglichen Namen, und ein 200-Zeichen-Anzeigename mit `.exe`-Endung, dessen
Sichtbarkeit ich zur Laufzeit gegen das echte DOM messe (Position des Elements gegen jeden
Vorfahren mit `overflow(-x): hidden`), nicht nur gegen den Quelltext wie `proof:clamp` es tut —
bei normaler Breite und bei 420 px, wo T-302 bisher nur von Hand gemessen hatte. Alle vier
Testfälle sind auf dieser Windows-Maschine tatsächlich gegen den echten lokalen Dienst gelaufen
(`pnpm exec playwright test -c tests/e2e/playwright.config.ts …`) und grün; dazu 18 weitere
`*ANH*`-Fälle im selben Lauf gegengeprüft, keine Regression.

Annahmen:
- Die neue Kennung `TP-ANH-23` statt `TP-ANH-21`: `TP-ANH-21` und `TP-ANH-22` sind bereits vergeben
  (`attachment-persistence-live.spec.ts` bzw. `attachment-open-commands.spec.ts`) — vor dem
  Schreiben nachgesehen, danach `TP-ANH-21` in meinem ersten Entwurf per `sed` auf `TP-ANH-23`
  korrigiert.
- Für den Schmuggeltest an der Anlegetür sende ich ein zusätzliches Feld `todoId` im Rumpf von
  `POST /addin/todos` — diese Route ist laut `createTodoSchema` (`z.object`, kein `.strict()`)
  gegenüber unbekannten Schlüsseln stumm; die Gegenprobe (Anhang entsteht wirklich, nur am neuen
  Todo) zeigt, dass die Nullmessung am vorhandenen Todo nicht aus einem 422 oder einem leeren
  Umschlag kommt.
- Für den Schmuggeltest an der Buchungstür (`POST /addin/todos/:todoId/time-entries`) benannte ich
  im Kommentar ausdrücklich, dass diese Route heute die **einzige** ist, die im Pfad eine
  Todo-Kennung entgegennimmt, dass die Oberfläche des Aufgabenbereichs sie aber seit F-21/E-100
  nicht mehr aufruft (`DuplicateOffer.tsx`, kein Aufrufer von `client.ts#book` mehr) — die Route
  selbst bleibt trotzdem eine reale Angriffsfläche unter `/addin` und gehört deshalb weiterhin
  geprüft, nicht weil die Oberfläche sie nutzt, sondern weil sie da ist.
- `TP-ANH-13` bleibt ausdrücklich ein Spotcheck, keine Menge: Er behauptet keine Untergrenze über
  „wie viele Türen wurden angefahren" — diese Untergrenze (neun Türen, neun zu) trägt weiterhin
  `proof:addin` Abschnitt 18f/`proof:route-policy` in fremder Hoheit. Das steht so im
  Dateikopf und im Testplan, damit niemand den E2E-Fall später für mehr hält, als er ist.
- Für die Sichtbarkeitsmessung in `TP-ANH-23` habe ich zwei Anläufe gebraucht (beide real gegen den
  laufenden Dienst gefahren, nicht nur gelesen): Der erste Ansatz („gibt es irgendwo im Baum einen
  Überlauf") schlug auf einen unbeteiligten Vorfahren (`.app__main`, echte, aber vom Anhangsnamen
  unabhängige vertikale Scrollbreite) an und wäre ein Fehlalarm gewesen. Der zweite Ansatz prüft
  die tatsächliche Bildschirmposition des Elements gegen den sichtbaren Ausschnitt jedes
  beschneidenden Vorfahren — und schlug beim ersten Lauf ebenfalls an, weil die Zeile schlicht noch
  nicht in den sichtbaren Bereich gescrollt war (dieselbe Lage wie bei einer menschlichen
  Sichtprüfung: erst hinscrollen, dann hinsehen). `scrollIntoViewIfNeeded()` vor der Messung behebt
  das; danach lief der Fall grün, auch in Kombination mit sechs weiteren Anhangsdateien im selben
  Durchlauf.

Risiken:
- Beim Absuchen nach übrigen Trägern der überholten Zusage („über das Add-in entstehen keine
  Anhänge") — über `git grep` **und** einen rohen Lauf über den Arbeitsbaum, Bauergebnisse
  (`apps/desktop/src-tauri/taskpane/`) ausgeschlossen, wie E-087 verlangt — habe ich **konkret
  falsche, nicht nur historisch erzählte** Fundstellen außerhalb meiner Hoheit gefunden. Ich habe
  sie nicht geändert (fremde Dateien), sondern lese sie hier auf, geordnet nach Hoheit:

  **CLAUDE.md** (Orchestrator, gemeinsame Datei):
  - Zeile 235: „Über das Add-in entstehen keine Anhänge. Strukturell, nicht per Voreinstellung."
    steht im Abschnitt „Frist und Anhänge" als geltende Regel — ohne den Vorbehalt aus E-108. Der
    spätere Abschnitt „Entschieden — der Widerspruch an A-19.19 ist aufgelöst" (Zeile 246 ff.)
    beschreibt den Stand vom 2026-09-10 (E-100) und ist damit selbst einen Tag hinter E-108
    zurück.

  **domain-dev** (`apps/local-api/**`):
  - `apps/local-api/src/app.ts:314-316`: „Anhängen darf er nicht — weder einen Verweis noch eine
    Datei noch ein Bild. Es gibt dafür keine Route mehr" — falsch, `POST /addin/todos` legt seit
    T-304 Anhänge an.
  - `apps/local-api/openapi/takt-local-api.yaml:145`: „kein Anhang irgendeiner Art (A-19.19, F-21)"
    in der Beschreibung der Add-in-Fläche.
  - `apps/local-api/openapi/takt-local-api.yaml:3471-3472`, unmittelbar an der Beschreibung von
    `POST /addin/todos` selbst: „Über diese Route entsteht weiterhin **kein Anhang** (A-19.19): Der
    Rumpf hat kein Anhangsfeld" — das ist die am stärksten irreführende Fundstelle, weil sie direkt
    an der Route steht, die das Gegenteil tut.
  - `apps/local-api/openapi/takt-local-api.yaml:4313-4315`: „kann überhaupt keinen Anhang anlegen,
    lesen oder löschen (A-19.19, F-21)" in der Beschreibung der Add-in-Token-Reichweite.

  **security-checker** (`docs/bedrohungsmodell.md`):
  - Zeile 9638, ein T-247-zeitlicher Eintrag: „`apps/web/src/features/todos/Attachments.tsx:82`
    sagen weiterhin richtig, daß über das Add-in keine Anhänge entstehen" — bereits in
    `.claude/team/reports/T-265-spec-ux-reviewer.md` (Z-09) als Befund benannt, nach meiner Suche
    aber weiterhin unverändert im Bestand. Der Rest von `bedrohungsmodell.md` (insbesondere A-A-21
    bei Zeile 4904) ist bereits sorgfältig auf E-108 nachgezogen — dieser eine ältere Eintrag ist
    stehen geblieben.

  **ux-designer/ui-designer** (`docs/design/**`):
  - `docs/design/textbestand-aufgabenbereich.md:938` und `:948`: „über das Add-in entstehen
    weiterhin keine Anhänge" — zweimal, in der Kopfnotiz zu einem Textbestand.

  **documenter** (`docs/**`):
  - `docs/benutzerhandbuch.md:157-159`: „Über das Outlook-Add-in entstehen keine Anhänge. Das ist
    keine vorübergehende Einschränkung, sondern Absicht … Es gibt dafür im Add-in keine
    Schaltfläche und keinen Weg."
  - `docs/glossar.md:139-140`: „Anhänge entstehen über das Add-in weiterhin nicht — A-19.19 bleibt
    unangetastet (E-074 Punkt 3)."
  - `docs/glossar.md:157-158`: „über das Outlook-Add-in entstehen keine Anhänge — strukturell,
    nicht per Voreinstellung (A-19.17, A-19.19)."
  - `docs/glossar.md:187` (Zeile „Anhang" der Begriffstabelle): „… über das Outlook-Add-in
    entstehen keine Anhänge."
  - `docs/glossar.md:193` (Zeile „Outlook-Add-in" der Begriffstabelle): der erste Halbsatz („es
    bietet dort weder eine Zeitbuchung noch einen Anhang an", bezogen auf den Duplikatfall) ist
    weiterhin richtig (A-10.9); der zweite („… über eine eigens dafür geschnittene, schmale
    Routengruppe … , die keine Anhangroute führt") ist falsch.

  Ich habe außerdem mehrere Stellen geprüft und **nicht** als Befund aufgenommen, weil sie den
  Stand bereits richtig als Geschichte erzählen (nicht als geltende Regel behaupten) —
  `apps/local-api/src/routes/addin/index.ts:288-292`, `service.ts` (mehrere Stellen),
  `apps/outlook-addin/scripts/proof-addin.mjs` (mehrere Stellen), `apps/outlook-addin/src/ui/
  DuplicateOffer.tsx`, `docs/spec.md`, `docs/bedrohungsmodell.md` A-A-21 bei Zeile 4904,
  `docs/design/addin-anhangsuebernahme-fluss.md` — diese sind entweder ausdrücklich als „bis
  T-247"/„bis gestern" markiert oder sprechen präzise über die verbliebene, engere Zusage
  („an einem vorhandenen Todo entsteht kein Anhang").
- Die Zusammenfassungstabelle am Ende von Abschnitt 25 in `docs/testplan.md` trug schon vor T-311
  den Satz „Kein einziger Fall dieses Abschnitts ist heute ausführbar" — das ist seit T-150 falsch
  (die meisten `TP-ANH-*`-Fälle laufen seit damals als echte, grüne Playwright-Fälle). Ich habe das
  benannt und die beiden von mir berührten Zeilen richtiggestellt, aber die Tabelle nicht insgesamt
  neu geschrieben — das liegt außerhalb dieses Auftrags und ist ein eigener, kleinerer Befund
  derselben Fehlerklasse, nur in der Rahmung statt im einzelnen Fall.
- Die Naht Office.js → Nutzlast bleibt in beiden neuen/geänderten Testdateien ausdrücklich als
  hinnehmbare Lücke benannt (kein echter Outlook-Host in dieser Umgebung) — dieselbe Grenze wie
  bisher in diesem Testplanabschnitt, nicht neu durch T-311 entstanden.

Offene Fragen:
- Soll ich (oder ein anderer e2e-Auftrag) die Zusammenfassungstabelle in Abschnitt 25 von
  `docs/testplan.md` insgesamt auf den Bau-Stand nachziehen, oder bleibt das ein separater Auftrag?
  Ich habe es als offenen, benannten Befund stehen lassen.
- Die zehn oben aufgeführten Fundstellen außerhalb meiner Hoheit brauchen je einen Auftrag an
  domain-dev (`app.ts`, `takt-local-api.yaml` — vier Stellen), security-checker
  (`bedrohungsmodell.md:9638`), ux-designer/ui-designer (`textbestand-aufgabenbereich.md` —
  zwei Stellen), documenter (`benutzerhandbuch.md`, `glossar.md` — vier Stellen) und den
  Orchestrator selbst (`CLAUDE.md:235` und der Abschnitt „Entschieden …" ab Zeile 246, der einen
  Tag hinter E-108 zurückliegt).

Nächster Schritt: Die zehn benannten Fundstellen als eigene, nach Hoheit sortierte Aufträge an die
jeweiligen Agenten geben — am besten in derselben Welle, da keine voneinander abhängt; danach die
Zusammenfassungstabelle in `docs/testplan.md` Abschnitt 25 als eigenen, kleinen Nachtrag einplanen.
