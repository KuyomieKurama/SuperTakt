# T-172 -- Visual QA: O-EA (Fokusbehebung), O-DN (disabledReason), O-DL (Mitternacht)

**Aufgabe:** T-172 (Welle Y) -- drei Dinge nachsehen, die bisher abgeleitet und nicht gesehen wurden.
**Status:** freigegeben (fuer die drei gemessenen Punkte -- Umfang siehe unten)
**Datum:** 2026-09-05, Messfenster 18:46 bis 19:09 Uhr (CEST/Europe-Berlin)

---

## Umgebung und Methodik

Lokaler Dienst aus dem Quelltext (`node apps/local-api/src/index.ts`, Startgeheimnis ueber `stdin`,
`XDG_DATA_HOME` auf `/tmp/t172-qa/data`), Oberflaeche ueber `pnpm exec vite --host 127.0.0.1 --port
5173 --strictPort` mit `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN` -- derselbe Weg wie
`tests/e2e/support/services.ts` und wie T-161/T-162. Browser: Chromium ueber das im Baum
vorhandene `@playwright/test` (1400x900 fuer Desktop; kein separater schmaler Durchlauf, weil keiner
der drei Punkte layoutbezogen ist). Steuerskripte lagen ausschliesslich in `/tmp/t172-qa/`
(Scratchpad ausserhalb des Repositorys), keine Testdatei angelegt, kein Produktivcode veraendert.
Testdaten erfunden, Praefix `QA-`. Aufraeumen: alle Skripte und Bildschirmabzuege aus dem
Scratchpad geloescht; die SQLite-Testdatei selbst liess sich mit den mir erlaubten
Werkzeugen nicht rekursiv entfernen (nur nicht-rekursives `rm`/`rmdir` verfuegbar) -- sie liegt
weiterhin unter `/tmp/t172-qa/data/takt/takt.db`, enthaelt ausschliesslich die hier erfundenen
`QA-*`-Testdaten und ist kein Sicherheitsrisiko.

**Vorgabe des Auftrags: "Miss zuerst, was stillsteht."** Ich habe deshalb vor jeder Messung die
Aenderungszeit (`stat`) jeder betroffenen Quelldatei mit dem Start meines Dienstes (18:46:19) und
dem Zeitpunkt der jeweiligen Messung verglichen -- nicht geraten, sondern nachgesehen, weil
`apps/web` in dieser Welle gleichzeitig von frontend-dev (T-167) bearbeitet wird und mein
Vite-Entwicklungsserver jede Aenderung sofort per HMR in meine laufenden Browser-Sitzungen zieht:

| Datei | Letzte Aenderung | Vor meiner Messung? |
|---|---|---|
| `apps/web/src/components/Menu.tsx` (O-EA) | 18:04:38 | ja, 42 Min. vorher |
| `apps/web/src/components/DialogSurface.tsx` (O-EA) | 17:49:01 | ja, 57 Min. vorher |
| `apps/web/src/screens/StatusSettings.tsx` (O-DN) | Vortag 21:33 | ja, lange stabil |
| `apps/web/src/components/Primitives.tsx` (O-DN) | Vortag 20:59 | ja, lange stabil |
| `apps/web/src/components/FormDialog.tsx` (O-DA) | 18:54:59 | **ja, aber nur knapp** -- meine Messung lief 19:01:41, siehe unten |
| `apps/web/src/screens/TimeScreen.tsx` (O-DL) | 17:55:41 | ja |
| `apps/web/src/screens/TodoListScreen.tsx` (O-DL) | 14:25:02 | ja |
| `apps/web/src/screens/DashboardScreen.tsx` (O-DL) | 14:25:02 | ja |
| `apps/web/src/components/DeadlineFlag.tsx` (O-DL) | 02:32:47 | ja |
| `apps/web/src/components/Attachments.tsx` | 18:55:19 | **von mir nicht gepruefte Flaeche** |

Einzige Auffaelligkeit: `FormDialog.tsx` wurde waehrend meines Laufs um 18:54:59 Uhr einmal
gespeichert -- zwischen meiner O-EA-Messung (bis ca. 18:56) und meiner O-DN/O-DA-Messung (ab
18:58). Meine O-DA-Messung (19:01:41) lief **nach** dieser einen Aenderung und nicht dazwischen;
kein weiteres Speichern danach (mtime unveraendert bis zum Abschluss meines Laufs um 19:09). Das
Ergebnis unten ist also der aktuelle Stand, nicht ein ueberholter. `Attachments.tsx` wurde ebenfalls
einmal veraendert (18:55:19) -- genau die Flaeche, die der Auftrag als "in Bewegung" markiert hat.
Ich habe sie **nicht** angefasst und nichts daraus als Befund gewertet, wie vorgegeben.

Alle Bildschirmabzuege liegen unter `.claude/team/reports/T-172-screens/`.

---

## Punkt 1 -- O-EA: die Fokusbehebung unabhaengig nachgesehen

**Ergebnis: behoben, in allen sechs verlangten Faellen unabhaengig gemessen.** Das ist die dritte
Messung an dieser Stelle nach T-157 (behauptet: behoben) und T-161 (widerlegt: nicht behoben,
gemessen mit `focusin`/`focusout`-Mitschnitt). T-162 hat danach die tatsaechliche Ursache gefunden
(`focusMenu` aus `@zag-js/menu`, siehe dortiger Bericht) und mit `finalFocusEl`+`useLayoutEffect`
in `DialogSurface.tsx` sowie einer eigenen Rueckholung in `Menu.tsx` behoben. Meine Messung ist die
von T-162 selbst angeforderte zweite, unabhaengige Probe.

**Messmethode, fuer alle sechs Faelle gleich:** `document.activeElement` per
`page.evaluate` bei t+0/100/300/600/1000 ms (bzw. bis t+2000 ms bei den Faellen ohne Dialog) nach
dem schliessenden Ereignis, dazu `tagName`, `className`, `id` und -- entscheidend fuer den
**zugaenglichen Namen**, nicht nur "irgendetwas hat Fokus" -- das Attribut `aria-label` des
fokussierten Elements. Der Menue-Ausloeser traegt `aria-label="Menü für „<Todotitel>“"`; ich habe
bei jeder Probe geprueft, dass genau dieser Name mit dem Titel der bearbeiteten Zeile
uebereinstimmt, nicht irgendein Ausloeser.

### Fall A -- Zeilenmenue mit der Maus, "Bearbeiten", Escape

`document.activeElement` t+0/100/300/600/1000 ms: durchgehend `BUTTON.menu__trigger`,
`aria-label="Menü für „QA-A Maus-Weg“"`. Screenshots: `A-edit-mouse-01-menu-open.png`,
`A-edit-mouse-02-dialog-open.png` (Fokus korrekt im Titelfeld, waehrend der Dialog offen ist),
`A-edit-mouse-03-after-escape.png` (sichtbarer Fokusring auf dem Zeilenmenue-Knopf).

### Fall B -- Zeilenmenue mit der Maus, "Loeschen", Escape

Bestaetigungsdialog geoeffnet, mit Escape geschlossen. `document.activeElement` t+0 bis 1000 ms:
durchgehend `BUTTON.menu__trigger` mit korrektem Namen. Screenshots:
`B-delete-mouse-escape-01-confirm-open.png`, `B-delete-mouse-escape-02-after-escape.png`.

### Fall C -- Zeilenmenue mit der Maus, "Loeschen", Schluss ueber "Abbrechen"

Derselbe Dialog, diesmal per Klick auf "Abbrechen" statt Escape geschlossen (das war der zweite
vom Auftrag genannte Schliessweg). Ergebnis identisch: `BUTTON.menu__trigger`, korrekter Name,
durchgehend ueber die volle Sekunde. Screenshot: `C-delete-mouse-cancel-01-after-cancel.png`.

### Fall D -- Zeilenmenue mit der Tastatur, "Bearbeiten", **ohne Pause**

Das ist der Fall, an dem T-161 den Fehler nachgewiesen und T-162 die Ursache gefunden hat
("Pfeiltaste und Eingabe im selben Bild -- bei der Tastatur der Regelfall"). Ablauf ohne
`waitForTimeout` zwischen den Tasten: Ausloeser fokussiert -> `Enter` (oeffnet, markiert
"Oeffnen") -> `ArrowDown` (markiert "Bearbeiten") -> `Enter` (waehlt aus, Dialog oeffnet) -> nach
Bestaetigung, dass der Dialog offen ist, sofort `Escape`. `document.activeElement` t+0 bis 400 ms:
durchgehend `BUTTON.menu__trigger`, `aria-label="Menü für „QA-B Tastatur-Weg“"`. Screenshots:
`D-edit-keyboard-01-dialog-open.png`, `D-edit-keyboard-02-after-escape.png` (Fokusring auf dem
richtigen Zeilenknopf).

### Fall E -- Zeilenmenue mit der Tastatur, "Loeschen", ohne Pause

Navigations-Detail, das ich zunaechst falsch angenommen und dann korrigiert habe (siehe Annahmen):
`ArrowUp` wickelt in diesem Menue **nicht** vom ersten zum letzten Eintrag um -- 6x `ArrowDown` ohne
Pause fuehrt zuverlaessig zu "Loeschen" (Reihenfolge: Oeffnen, Bearbeiten, Status: In Progress,
Status: Waiting, Status: Done, Als erledigt markieren, Loeschen -- deaktivierte Eintraege wie
"Status: Backlog" bei aktuellem Status werden bei der Pfeiltastennavigation automatisch
uebersprungen). Nach `Enter` oeffnet der Bestaetigungsdialog, sofort `Escape` hinterher.
`document.activeElement` t+0 bis 400 ms: durchgehend `BUTTON.menu__trigger`, korrekter Name.
Screenshots: `E-delete-keyboard-01-confirm-open.png`, `E-delete-keyboard-02-after-escape.png`.

### Fall F -- ein Menueeintrag **ohne** Dialog (O-CY-3), Maus und Tastatur

- **Maus:** "Status: In Progress" angeklickt (kein Dialog, direkte Aktion). t+0 ms zeigt kurz
  `BODY` (das ist die von T-162 selbst dokumentierte Verzoegerung der Fokusfalle, kein Fehler), ab
  t+100 ms durchgehend bis t+2000 ms `BUTTON.menu__trigger` mit korrektem Namen. Screenshots:
  `F1-status-mouse-01-menu-open.png`, `F1-status-mouse-02-after.png`.
- **Tastatur, ohne Pause:** 3x `ArrowDown` (auf "Status: Waiting", ueberprueft ueber
  `[data-highlighted]` im offenen Menue, siehe `F2-status-keyboard-00-highlighted.png`), dann
  `Enter`. t+0 bis t+2000 ms: durchgehend `BUTTON.menu__trigger`, korrekter Name. Screenshot:
  `F2-status-keyboard-01-after.png` (Fokusring sichtbar, Toast "Status geaendert: Waiting.").

**Alle sechs verlangten Faelle bestehen.** Die T-157-Zusage, von T-161 widerlegt, haelt nach der
T-162-Behebung durchgehend -- unabhaengig von Maus/Tastatur, mit/ohne Pause, mit/ohne Dialog,
Escape/Abbrechen.

### Nebenbefund (nicht Teil des Auftrags, aber in derselben Flaeche gefunden)

`apps/web/src/screens/TodoListScreen.tsx`, Menueeintrag "Als erledigt markieren" **niedrig**
Beobachtung: Setzt man ein Todo per Menue auf erledigt, verschwindet dessen Zeile (und damit der
Menue-Ausloeser selbst) aus der Liste, weil "Erledigte einblenden" standardmaessig aus ist.
`document.activeElement` faellt dabei durchgehend auf `BODY` (t+0 bis t+2000 ms), siehe
`F3-done-toggle-row-vanishes-01-after.png`. Das ist **keine** Verletzung von O-CY-3: `Menu.tsx`
rettet den Fokus laut eigenem Kommentar nur, "wenn es den Ausloeser noch gibt" -- hier gibt es ihn
nicht mehr, die Regel greift also bewusst nicht. Ein Toast mit `aria-live` kuendigt das Ergebnis an
("„QA-D Frist Todo“ ist erledigt. ... Rückgängig", gemessen im Text der Live-Region) und bietet
"Rueckgaengig" an, sodass ein Vorlesehilfe-Benutzer nicht ganz ohne Rueckmeldung dasteht.
Erwartung: keine, da laut Bauplan korrekt. Kein Fix noetig -- ich nenne es nur, weil es beim ersten
Betrachten wie ein Rueckfall in O-CY-3 aussieht und das naechste Mal nicht neu untersucht werden
muss.

---

## Punkt 2 -- O-DN: erreicht eine Vorlesehilfe den `disabledReason` eines gesperrten Knopfes?

**Kein Bildschirmleseprogramm in dieser Umgebung verfuegbar** -- ich habe nach `orca` und `nvda`
gesucht (beides nicht installiert, kein Paketmanager mit Root-Rechten erreichbar) und keinen
Ersatz gefunden. Das ist eine echte Grenze: Ob ein konkretes Vorleseprogramm (NVDA, JAWS, VoiceOver,
Orca) den Wert tatsaechlich **ausspricht**, ist damit **nicht bewiesen** und kann es in dieser
Sitzung nicht sein. Gemessen habe ich stattdessen, was ohne Vorlesehilfe messbar ist: den
Chromium-Bedienungshilfen-Baum (per CDP, `Accessibility.getFullAXTree`) und die tatsaechliche
Tastatur-Erreichbarkeit -- also die zwei Voraussetzungen, ohne die keine Vorlesehilfe je etwas
ausspricht, mit der ausdruecklichen Einschraenkung, dass das Erfuellen dieser Voraussetzungen eine
Ansage **ermoeglicht**, nicht **garantiert**.

Bezug: `docs/design/textbestand.md`, Eintrag **UM-04** -- der Umbau schlaegt vor, den pauschalen
Vorratstext ("Zwei Dinge, bevor Sie etwas aendern") aus `StatusSettings.tsx:372-385` zu streichen,
weil die zustandsgebundenen Fassungen (der Sperrgrund direkt an der Zeile, `:521-527`, und
`consequence` im Loeschdialog, `:425`) "bereits am richtigen Ort" stehen. Offene Frage 3 des
T-163-Berichts verlangt genau diese Messung, bevor gestrichen wird.

### Gemessen: Zeile "Backlog" (Standard-Status mit vier Todos), Einstellungen > Status

Screenshot der Ausgangslage: `S0-status-settings.png`. Ausschnitt des gesperrten Knopfes und
seines Begleittexts: `S1-locked-button.png`.

**1) Der Knopf selbst ist echtes `disabled`, nicht `aria-disabled`.**
`Primitives.tsx:51`: `disabled={disabled === true || loading}` -- ein natives Attribut. Gemessen
per `element.disabled === true`.

**2) Chromium haelt Name und Beschreibung im Bedienungshilfen-Baum trotzdem vor.**
CDP-`Accessibility.getFullAXTree`-Knoten des Knopfes:
```
role: "button"
name: "„Backlog“ löschen — derzeit nicht möglich"
description: "Das ist der Standard für neue Todos. Bestimmen Sie zuerst einen anderen zum
  Standard — sonst wäre nicht mehr festgelegt, was ein neues Todo bekommt. Hier stehen noch
  3 Todos. Takt hängt sie nicht von sich aus um; stellen Sie sie zuerst auf einen anderen Status.
  Diese 3 Todos anzeigen"
properties: disabled=true, describedby -> "status-block-...-000000000001"
ignored: false
```
Der Knoten ist also **nicht** aus dem Baum entfernt (anders als bei `display:none` oder
`aria-hidden`) und traegt seine Beschreibung. Das ist die Voraussetzung dafuer, dass ein
Bildschirmleseprogramm im **Browse-/virtuellen Cursor-Modus** (freies Ablaufen der Seite, nicht nur
Tab-Sprung von Bedienelement zu Bedienelement) ueberhaupt etwas zum Vorlesen haette.

**3) Ueber die Tastatur (Tabulator) ist der Knopf nachweislich unerreichbar.**
Gemessen: Fokus auf "Umbenennen" der Backlog-Zeile gesetzt, dann zweimal `Tab` gedrueckt:
```
vor Tab:        BUTTON "Umbenennen"
nach 1x Tab:    BUTTON "Diese 3 Todos anzeigen"   <- der Knopf IN der Begruendungsflaeche
nach 2x Tab:    BUTTON "„In Progress“ nach oben"  <- schon die NAECHSTE Zeile
```
Der gesperrte "Loeschen"-Knopf taucht in der Tabulatorreihenfolge **nicht auf** -- sie springt von
der Begruendungsflaeche direkt zur naechsten Zeile. Das ist keine Vermutung, sondern deckt sich
zeichengleich mit dem eigenen Kommentar in `CLAUDE.md`/`textbestand.md`: "gesperrte Knoepfe sind
nicht fokussierbar". Fuer jeden Benutzer, der ausschliesslich per Tabulator navigiert (viele
Bildschirmleseprogramm-Nutzer eingeschlossen, wenn sie durch Formulare springen statt die Seite
Zeile fuer Zeile abzulaufen), ist der `aria-describedby`-Inhalt des Knopfes damit **nicht
erreichbar** -- er wird nie fokussiert, also nie in dieser Eigenschaft angesagt.

**4) Der Begleittext daneben ist dagegen uneingeschraenkt erreichbar.**
`getComputedStyle` auf `#status-block-...`: `display: flex`, `visibility: visible`, kein
`aria-hidden`. Es ist gewoehnlicher, sichtbarer Fliesstext (ein `<p>`/`<ul>` in
`status-admin__blocked`), der im DOM **vor** dem gesperrten Knopf steht -- jede Vorlesehilfe, die
die Seite linear abliest (der uebliche Weg, Absaetze zu lesen), begegnet ihm unabhaengig davon, ob
der Knopf je Fokus bekommt. Und: **innerhalb** derselben Begruendungsflaeche sitzt mit "Diese 3
Todos anzeigen" ein echtes, per Tab erreichbares Element (siehe Messung 3) -- ein Tab-Nutzer landet
also in genau dieser Zone, auch wenn er den Sperrgrund nicht als "Beschreibung eines Knopfes"
serviert bekommt, sondern als eigenstaendigen, lesbaren Absatz davor.

**5) Vergleichsfall im selben Bestand: `Menu.tsx` benutzt fuer denselben Zweck `aria-disabled`.**
Gesperrte Menuepunkte (`Ark.Item disabled`) bekommen `aria-disabled="true"` und **kein** natives
`disabled` -- sie bleiben laut Bausteinkommentar ausdruecklich "lesbar" und werden bei der
Pfeiltastennavigation zwar uebersprungen (selbst gemessen in Punkt 1, Fall E), aber nicht aus dem
Baum genommen. Das ist die dritte vom Auftrag genannte Bauart ("aria-disabled mit abgefangenem
Klick") -- sie existiert im Projekt bereits, nur nicht an dieser Stelle.

### Antwort auf die Frage aus T-163

**Nein, der `disabledReason`-Inhalt am gesperrten Knopf selbst erreicht einen
Tastatur-/Tab-navigierenden Benutzer nicht** -- das ist gemessen, nicht abgeleitet, und deckt sich
mit der im Textbestand selbst schon geaeusserten Vermutung. **Was ihn heute tatsaechlich
erreicht, ist der sichtbare Begruendungstext daneben** (`status-admin__blocked`), der unabhaengig
vom Fokuszustand des Knopfes im normalen Lesefluss steht. Fuer UM-04 heisst das konkret:

`apps/web/src/screens/StatusSettings.tsx:568-596` (die Begruendungsflaeche) **mittel, an
ux-designer/spec-ux-reviewer, kein Fehler im gebauten Zustand** Beobachtung: UM-04 setzt voraus,
dass die zustandsgebundenen Fassungen "bereits am richtigen Ort stehen" und tauschbar sind, sobald
der Vorratskasten faellt. Gemessen zeigt sich: Das stimmt nur, **weil** der Sperrgrund heute als
sichtbarer Fliesstext neben dem Knopf steht -- nicht weil der Knopf selbst ihn traegt. Erwartung:
Der Umbau darf diesen sichtbaren Begruendungstext nicht zugunsten einer reinen
Knopf-Beschreibung (`aria-describedby` an einem weiterhin nativ `disabled`en Knopf) ersetzen, sonst
verschwindet die einzige heute nachweislich erreichbare Quelle fuer genau die Benutzergruppe, fuer
die UM-04 gedacht ist. Konkreter Fix/Empfehlung: In der UM-04-Umsetzung ausdruecklich festhalten,
dass der sichtbare Begleittext bestehen bleibt (Traeger ist er selbst, nicht der Knopf) -- das
deckt sich mit dem, was heute schon gebaut ist, es muss also nichts *repariert*, nur *nicht
versehentlich entfernt* werden.

---

## Punkt 2b -- O-DA: die neue Live-Region in `TextField`, unabhaengig gemessen

Anlass: "Neues Todo" mit einem Titel aus lauter Leerzeichen -- die Meldung soll entstehen, waehrend
der Dialog schon steht. T-162 behauptet: Region liegt dauerhaft im Baum, dieselbe Knotenkennung
ueber drei Zustaende. Ich habe das mit einer **eigenen, unabhaengigen Methode** nachgemessen, nicht
mit T-162s eigenen Werten: einem selbst gesetzten `data-qa-marker`-Attribut auf dem Live-Region-Knoten,
das nur ueberlebt, wenn React denselben DOM-Knoten wiederverwendet statt ihn neu zu erzeugen.

Ablauf: Dialog "Neues Todo" geoeffnet (`T1-new-todo-dialog-open.png`), Marke `same-node-check-172`
auf `.field__live` gesetzt, Titel auf drei Leerzeichen gefuellt, "Anlegen" geklickt.

```
Vor der Meldung:      role=alert, Text leer, Hoehe 0px, keine Marke noch nicht relevant
Nach "Anlegen":        role=alert, Text "Ohne Titel lässt sich ein Todo nicht wiederfinden.",
                       Marke NOCH VORHANDEN (data-qa-marker=same-node-check-172)
                       aria-invalid=true, aria-describedby=_r_5_-error, Klasse field__input--invalid
Nach Korrektur (Titel eingegeben): Text wieder leer, Marke WEITERHIN VORHANDEN
```
Screenshot der Meldung: `T2-after-submit-blank-title.png`.

Das bestaetigt T-162s Kernaussage (dieselbe Region entsteht nicht mit ihrem Inhalt, sondern wird nur
befuellt) mit einer eigenen Messmethode und einem eigenen Zeitpunkt (19:01:41, sieben Minuten nach
der letzten Aenderung an `FormDialog.tsx`, siehe Umgebungsabschnitt oben). **Wichtige Einschraenkung,
identisch zu Punkt 2:** Ohne Vorlesehilfe kann ich nicht pruefen, ob die Meldung tatsaechlich
**angesagt** und nicht nur im Baum **beschrieben** wird. Was ich zusaetzlich zu T-162 messen konnte
und was fuer die Ansage-Frage relevant ist: `role="alert"` ist die ARIA-Rolle, die von sich aus
(ohne zusaetzliches `aria-live`) als "assertive" Live-Region gilt -- das ist die richtige Bauart fuer
eine Ansage, aber die Bauart allein beweist die tatsaechliche Aussprache durch ein konkretes
Programm nicht, siehe Punkt 2.

`apps/web/src/components/FormDialog.tsx` **niedrig, informativ, kein Fehler**
Beobachtung: Meine Messung bestaetigt T-162 unabhaengig; keine Abweichung gefunden. Erwartung:
keine Aenderung noetig. Kein Fix.

---

## Punkt 3 -- O-DL: das Neuzeichnen ueber Mitternacht, jetzt tatsaechlich gesehen

**Das ist der Punkt, den T-161 ausdruecklich nicht nachstellen konnte** ("Nicht nachstellbar in
dieser Sitzung ... Nicht gemessen, nicht 'bestanden'."). Ich konnte den Tageswechsel nachstellen --
mit Playwright's `page.clock`-API (seit Playwright 1.45 verfuegbar, hier 1.62), die sowohl `Date`
als auch `setTimeout` im Browser faelscht. Das trifft genau den Mechanismus von `useToday()`
(`apps/web/src/app/useToday.ts`): Ein `setTimeout` auf die naechste Mitternacht, gestellt aus
`Date.now()`.

### Aufbau

`page.clock.install({ time: new Date('2026-09-05T23:59:00+02:00').getTime() })` **vor** jeder
Navigation, danach `page.clock.fastForward('00:10:00')` (zehn Minuten vorspulen, ohne echte
Wartezeit) -- das ueberquert die Mitternachtsgrenze zuverlaessig und loest den in `useToday()`
gestellten Zeitgeber tatsaechlich aus. Ein Todo mit `dueDate: "2026-09-05"` (dem echten heutigen
Tag) angelegt, dazu eine Zeitbuchung an diesem Tag.

### Fall M1/M2 -- `TodoListScreen.tsx`, Zeilen-Marke (`DeadlineFlag`)

Vor dem (gefaelschten) Mitternacht: Marke zeigt "Heute fällig 05.09.2026" (Bernstein-Farbe,
`M1-vor-mitternacht.png`). Nach `fastForward` ueber Mitternacht, **ohne jedes Neuladen der Seite**:
dieselbe Zeile zeigt jetzt "Überfällig 05.09.2026" (Rot, `alert-triangle`-Symbol,
`M2-nach-mitternacht.png`). Das ist exakt der von O-CO/O-DG beschriebene Mechanismus in Aktion:
`useToday()` feuert den gestellten Zeitgeber, `DeadlineFlag` bekommt ein neues `today` gereicht,
`deadlineState()` klassifiziert neu.

### Fall M3 -- die Grenze des Client-seitigen Fixes (bestaetigt T-161s eigene Einschraenkung)

Nach demselben gefaelschten Mitternachtsuebergang habe ich den **Fristfilter** "Ueberfaellig"
gewaehlt (das geht als `dueStates` an den **Dienst**, der laut Kommentar in `TodoListScreen.tsx:185`
gegen **seine eigene, echte** Systemuhr rechnet). Ergebnis: **0 Todos**, das QA-Todo taucht **nicht**
auf (`M3-filter-ueberfaellig-nach-browser-mitternacht.png`). Das ist **kein Fehler**, sondern die
exakte Bestaetigung dessen, was T-161 vermutet und nicht pruefen konnte: "Der Fristfilter der
Todo-Liste wird aber vom Dienst gegen dessen echte Systemuhr gerechnet." Der von O-CO/O-DG behobene
Teil ist die **Zeilen-Marke** (client-seitig, jetzt bewiesen richtig); die **serverseitige**
Filterklassifikation folgt zu Recht der echten Uhr des Dienstprozesses und laesst sich ohne
gestellte Systemuhr des `local-api`-Prozesses selbst nicht gefaehlt pruefen -- das war nie Teil
dessen, was O-CO/O-DG beheben sollten (die Kommentare in `TodoListScreen.tsx:182-195` sagen das
selbst: die Zeilen-Marken haengen an `today`, aber "Der Fristfilter geht als dueStates an den
Dienst").

### Fall M4/M5 -- `TimeScreen.tsx` (O-DG)

Vor Mitternacht: Kachel "Erfasst 0:30 h / 1 Buchung", "Buchungen von heute" zeigt die Buchung
(`M4-timescreen-vor.png`). Nach `fastForward`, ohne Neuladen: "Erfasst 0:00 h / 0 Buchungen",
"Heute noch nichts erfasst" (`M5-timescreen-nach.png`). Bestaetigt O-DG (`useToday()` statt dem
eingefrorenen `useMemo`) direkt im Browser -- der von T-157 benannte und von T-162 behobene
Fund ist jetzt **gesehen**, nicht nur gelesen.

### Fall M6/M7 -- `DashboardScreen.tsx` (die zweite Stelle aus O-CO)

Dieselbe Pruefung auf dem Dashboard: Kachel "Heute erfasst" faellt von "0:30 h / 1 Buchung" auf
"0:00 h / 0 Buchungen", "Buchungen von heute" von der Buchungszeile auf "Heute noch nichts erfasst"
-- ohne Neuladen (`M6-dashboard-vor.png`, `M7-dashboard-nach.png`). Die Kachel "Noch nicht
exportiert" (haengt nicht an "heute") bleibt unveraendert, wie erwartet. Fuer die
Dashboard-eigene "Ueberfaellig"-Zahl (`overdueCount`, `DashboardScreen.tsx` Zeile ~109, ebenfalls
`dueStates: ["overdue"]` gegen den Dienst) gilt dieselbe Grenze wie in Fall M3 -- ich habe sie
nicht separat nachgemessen, weil derselbe Mechanismus bereits in M3 direkt am selben Endpunkt
belegt ist.

### Ergebnis

`apps/web/src/screens/TodoListScreen.tsx`, `TimeScreen.tsx`, `DashboardScreen.tsx` **-> behoben,
jetzt gesehen statt nur abgeleitet** Beobachtung: Alle drei client-seitig gerechneten Stellen
zeichnen beim (gestellten) Tageswechsel ohne Neuladen neu. Erwartung laut T-154/O-CO/O-DG: erfuellt.
Kein Fix noetig. Einzige Grenze (kein Fehler, sondern Architektur): serverseitig klassifizierte
Werte (`dueStates`-Filter, `overdueCount`) folgen der echten Systemuhr des `local-api`-Prozesses und
lassen sich mit einer gefaelschten Browser-Uhr allein nicht ueberpruefen -- das war nie ihr
Zustaendigkeitsbereich.

---

## Zusammenfassung der Befunde

| # | Ort | Schwere | Kurzfassung |
|---|---|---|---|
| 1 | `TodoListScreen.tsx` "Als erledigt markieren" faellt auf `BODY` | niedrig | erwartetes Verhalten (Ausloeser existiert nicht mehr), Toast kompensiert; kein Fix |
| 2 | `StatusSettings.tsx` Begruendungsflaeche | mittel, an ux-designer | Traeger fuer UM-04 ist der sichtbare Text, nicht der Knopf -- beim Umbau nicht entfernen |
| 3 | `FormDialog.tsx` Live-Region | niedrig, informativ | T-162 unabhaengig bestaetigt, keine Abweichung |
| 4 | `TodoListScreen.tsx`/`TimeScreen.tsx`/`DashboardScreen.tsx` Mitternacht | -- | behoben und jetzt gesehen, keine Abweichung |

Kein Befund verlangt Nacharbeit von frontend-dev. Die einzige offene Handlungsempfehlung richtet
sich an ux-designer/spec-ux-reviewer fuer die Ausformulierung von UM-04 (Punkt 2 oben).

---

## Annahmen

1. **Fall E (O-EA):** Ich bin zunaechst faelschlich davon ausgegangen, `ArrowUp` wickle vom ersten
   zum letzten Menueeintrag um. Gemessen (per `[data-highlighted]`) stimmt das in diesem Menue
   nicht -- `ArrowUp` auf dem ersten Eintrag bleibt auf dem ersten Eintrag stehen. Ich habe das
   korrigiert und bin stattdessen 6x `ArrowDown` gegangen (siehe Fall E), mit demselben
   "ohne Pause"-Grundsatz. Ich nenne das, weil ein erster automatisierter Versuch dadurch versehentlich
   "Öffnen" ausloeste (Navigation statt Loeschdialog) und ins Leere lief -- kein App-Fehler, ein
   Skriptfehler meinerseits.
2. **O-DN/O-DA:** Ohne verfuegbares Bildschirmleseprogramm sind meine Aussagen auf das beschraenkt,
   was der Chromium-Bedienungshilfen-Baum und die Tastatur-Erreichbarkeit hergeben. Ich habe das an
   beiden Stellen ausdruecklich als Grenze benannt, wie im Auftrag verlangt, statt eine Ansage zu
   behaupten, die ich nicht gemessen habe.
3. **Testdaten:** ausschliesslich mit `QA-`-Praefix, im Wegwerf-`XDG_DATA_HOME` dieser Sitzung, nicht
   im echten Anwendungsdatenverzeichnis.
4. **Die Anhangflaeche** (`Attachments.tsx`, die Rueckfrage vor dem Oeffnen, `attachment.rs`) habe
   ich nicht angefasst und nicht geprueft -- laut Auftrag in Bewegung (frontend-dev, T-167), meine
   Zustaendigkeit war auf die drei benannten Punkte begrenzt.
5. Reste im Scratchpad (`/tmp/t172-qa/data/takt/takt.db` und zwei Zertifikatsdateien) liessen sich mit
   den mir erlaubten, nicht-rekursiven Loeschbefehlen nicht entfernen; sie enthalten ausschliesslich
   die hier erfundenen `QA-*`-Testdaten.

## Risiken

1. Keine neue Netzadresse, keine Aenderung an CSP, Exportformat oder Fachlogik -- an keinem der
   gemessenen Punkte.
2. Punkt 2 (O-DN) ist eine Messung, kein Freibrief: Sie beantwortet die Frage aus T-163 fuer den
   **heutigen, gebauten Zustand**. Sollte UM-04 in einer spaeteren Welle so umgesetzt werden, dass die
   sichtbare Begruendungsflaeche entfernt oder durch eine reine Knopf-Beschreibung ersetzt wird, muss
   diese Messung wiederholt werden -- das Ergebnis waere dann voraussichtlich anders.
3. Ohne echtes Bildschirmleseprogramm bleibt fuer O-DN und O-DA ein Rest Unsicherheit ueber die
   tatsaechliche Aussprache bestehen, der nur mit einem echten Vorleseprogramm (NVDA/JAWS unter
   Windows, wo Takt tatsaechlich laeuft; Orca ist fuer eine Windows-Anwendung ohnehin nicht das
   massgebliche Programm) endgueltig zu schliessen ist.

## Offene Fragen

1. **An ux-designer/spec-ux-reviewer:** Bei der Ausformulierung von UM-04 ausdruecklich festhalten,
   dass die sichtbare Begruendungsflaeche (`status-admin__blocked`) der tatsaechliche Traeger des
   Sperrgrunds fuer Tastaturnutzer ist und bestehen bleiben muss -- nicht der `disabled`-Knopf selbst.
2. **An den Orchestrator:** Sollte vor einer Freigabe von T-152/T-153/T-157/T-162 in der Summe ein
   Testlauf mit echtem Bildschirmleseprogramm (z. B. NVDA in einer Windows-Testumgebung, da Takt eine
   Windows-Zielanwendung ist) eingeplant werden? Diese Sitzung konnte das nicht leisten.
3. **An e2e-tester (T-170), falls noch nicht gedeckt:** Der Mitternachts-Mechanismus (Fall M1/M2/M4/M5/M6/M7
   oben) laesst sich mit `page.clock` genauso in einer fest eingecheckten `tests/e2e`-Reihe abbilden --
   ich habe dafuer keine Datei angelegt (ausserhalb meiner Hoheit), aber der Ablauf oben ist direkt
   uebertragbar.

## Naechster Schritt

Keine Nacharbeit an Code noetig. Empfehlung: Punkt 2 (Begleittext als Traeger von UM-04) an
ux-designer/spec-ux-reviewer weiterreichen, bevor der Vorratskasten in `StatusSettings.tsx`
tatsaechlich gestrichen wird. O-EA, O-DA und O-DL koennen als gesehen und bestanden aus dem Board
genommen werden.
