# T-153 — Sichtprüfung der Dialoge nach Ark UI Stufe 1

**Aufgabe:** T-153 — die vier auf Ark UI umgestellten Dialoge (`FormDialog`, `ConfirmDialog`,
`InfoDialog`, `UpdateDialog`) und `DialogSurface` im laufenden Browser prüfen.
**Status:** braucht Review — zwei Befunde hoch, einer mittel, einer niedrig; siehe unten.

---

## Umgebung

Lokaler Dienst aus dem Quelltext (`node apps/local-api/src/index.ts`, Startgeheimnis über `stdin`,
`XDG_DATA_HOME` auf ein Wegwerfverzeichnis), Oberfläche über `pnpm exec vite --host 127.0.0.1
--port 5173 --strictPort` in `apps/web`, echte Fachdaten über die API angelegt (Tag, zwei Pools,
ein Todo — erfundene Testdaten, keine Kundendaten). Browser: Chromium über `@playwright/test`
(im Baum vorhanden), gesteuert über Wegwerf-Skripte außerhalb des Repositorys (`.qa-tmp/`, nach
dem Lauf gelöscht — kein Produktivcode, keine Testdatei angelegt). Geprüft wurde Desktop
(1400×900), eine schmale Breite (380×700) und beide Farbmodi/Dichten.

Da die Oberfläche ohne Tauri-Hülle lief (`readInstalledVersion()` liefert dann `null`), konnte der
`UpdateDialog` **nicht** über die echte Versionsprüfung ausgelöst werden — der im Auftrag genannte
Hinweis auf einen „mitten in der Sitzung“ erscheinenden Dialog ist mir nicht begegnet, weil ohne
Hülle gar keine `installed`-Fassung vorliegt und `decideUpdateNotice` dann stumm bleibt (A-18.11,
korrektes Verhalten). Geprüft habe ich `UpdateDialog` stattdessen über den echten Baustein auf der
Musterseite (Abschnitt 12, `UpdateNoticeSection.tsx`), der alle drei Zustände zeigt.

Bildschirmabzüge: `.claude/team/reports/T-153-screens/` (29 Dateien, `01`–`33`, thematisch
benannt).

---

## Die beiden benannten Kernprüfungen

**1. Escape in einer aufgeklappten Liste innerhalb eines Dialogs — funktioniert wie behauptet.**
Auf der Musterseite (Karte „Formulardialog“, Auswahlfeld „Feld der Vorlage“) geklappt: Klick öffnet
die Liste (`aria-expanded="true"`), ein Escape schließt **nur** die Liste
(`aria-expanded="false"`, Dialog bleibt `visible`), ein zweites Escape schließt danach den Dialog.
Screenshots `03`–`04`. Das ist genau das im T-152-Bericht erwartete Verhalten, empirisch bestätigt.
Der Fokus kehrt nach dem zweiten Escape korrekt auf den Auslöseknopf zurück (`05`).

**2. Der gefallene `recoverFocus` — ich konnte ihn nachstellen, und er ist tatsächlich gefallen,
nicht ersetzt.** In `PoolFormDialog` („QA Recover Focus Pool“ bearbeiten) den Entfernen-Knopf des
letzten Tags fokussiert und mit Eingabe ausgelöst: Der Knopf verschwindet, und `document.activeElement`
ist danach **`<body>`**, nicht das erste Formularfeld (Screenshot `23b`: kein Fokusring irgendwo im
Dialog sichtbar). Das widerspricht wörtlich der Zusicherung aus dem T-152-Bericht („Der Fokus darf
**nicht** auf `body` fallen; erwartet ist das erste Feld des Dialogs“). Reproduziert in zwei
unabhängigen Läufen. Die praktischen Folgen sind gemischt: **Escape schließt danach trotzdem**
(Ark behandelt Escape global auf `document` in der Erfassungsphase, unabhängig vom Fokus), und ein
anschließender **Tabulator landet ebenfalls wieder im Dialog** (auf „Dialog schließen“) — vermutlich
über denselben dokumentweiten Tab-Abfangmechanismus, den der T-152-Bericht für den `UpdateDialog`
als „Nachgelagerte Sicherung … `fallbackFocus`“ beschreibt. Das heißt: **keine Falle für Maus- oder
Tastaturbenutzer im Ergebnis**, aber die Zusicherung „Fokus fällt nicht auf `body`“ selbst ist
messbar falsch — für eine Vorlesehilfe ist der Sprung auf `<body>` ein hörbarer Kontextverlust
(sie liest den Dokumenttitel oder gar nichts an, statt im Formular zu bleiben), auch wenn Tastatur
und Escape danach wieder funktionieren.

---

## Befunde

**`apps/web/src/screens/PoolFormDialog.tsx` (TagInput „Erforderliche Tags“) — hoch**
Beobachtung: Nach Entfernen des letzten Tags über den Chip-Knopf „Tag … entfernen“ (Tastatur:
fokussiert, Eingabe gedrückt) fällt der Fokus auf `<body>`, nicht auf das erste Formularfeld.
Zweimal reproduziert, Screenshots `22-poolform-open.png` und `23b-poolform-after-tag-removed.png`
(kein Fokusring irgendwo im Dialog sichtbar).
Erwartung laut T-152-Bericht: Der Fokus darf nicht auf `body` fallen, erwartet ist das erste Feld
des Dialogs — dieselbe Wahl wie beim Öffnen.
Konkreter Fix: Die `recoverFocus`-Mutationsbeobachtung der Ark-Fokusfalle greift hier nicht.
Vermutlich baut React beim Entfernen des letzten Tags die ganze Chip-Liste (`<ul>`) neu auf, statt
nur den einen `<button>` zu entfernen, wodurch `setupMutationObserver` das erwartete
`removedNodes`-Ereignis nicht am beobachteten Knoten sieht. Ersatzweise den Fall gezielt mit einem
eigenen Effekt abfangen, wie es `UpdateDialog` für seinen eigenen Sonderfall bereits tut (dort
funktioniert die Rückholung, weil sie nicht allein auf die Falle setzt). Praktische Folge ist
gemildert: Escape schließt danach trotzdem, ein folgender Tabulator landet wieder im Dialog (siehe
Abschnitt „Die beiden benannten Kernprüfungen“ oben) — der Fund betrifft die Zusicherung selbst und
den Bruch für Vorlesehilfen, nicht die Bedienbarkeit mit Maus/Tastatur.

**`apps/web/src/screens/TodoListScreen.tsx` (Zeilenmenü „Bearbeiten“) — hoch**
Beobachtung: Todo über das Zeilenmenü „Bearbeiten“ öffnen (Menü-Auslöser „Menü für „…““), Dialog
mit Escape schließen: Der Fokus kehrt nicht auf den Menü-Auslöser zurück, sondern fällt auf
`<body>` (Playwright-Messung, `document.activeElement` ist `BODY`).
Erwartung laut Auftrag: Fokus zurück auf das Element, das den Dialog geöffnet hat — hier der
Menü-Auslöser. Funktioniert im Vergleichsfall „Neues Todo“ auf dem Dashboard korrekt (Fokus kehrt
zuverlässig auf den Knopf zurück, Screenshot `20`), also ist es kein allgemeiner Fehler der
Fokus-Rückgabe, sondern spezifisch für den Weg über ein Ark-Menü.
Konkreter Fix: Vermutlich eine Wettlaufsituation zwischen der eigenen Fokus-Rückgabe des Ark-Menüs
(das seinen Auslöser beim Schließen selbst refokussiert) und der Dialog-Fokusfalle, die sich beim
Öffnen merkt, wohin sie später zurückkehren soll. Schließt das Menü seinen eigenen Fokuskreis erst
nach dem Öffnen des Dialogs oder in anderer Reihenfolge, sieht die Dialogfalle bereits `<body>` als
Ausgangspunkt und merkt sich diesen Ausgangspunkt statt des Menü-Auslösers. Prüfen, ob das Menü
seinen Fokus synchron oder per `setTimeout` zurückgibt, und ob `DialogSurface`/die Ark-Fokusfalle
das „zuletzt fokussierte Element“ zu früh einfriert (siehe auch T-152-Bericht, Risiko 1, zur
`setTimeout(…, 0)`-Fokusrückgabe).

**`apps/web/src/components/FormDialog.tsx` (Schließkreuz während `busy`) — mittel**
Beobachtung: Während `busy=true` (Zustand „Wird gespeichert“) ist der Abbrechen-Knopf korrekt
`disabled` und Escape korrekt blockiert (`closeOnEscape={!busy}`), aber das Schließkreuz
(`Dialog.CloseTrigger` um `IconButton label="Dialog schließen"`) trägt kein `disabled={busy}` und
schließt den Dialog trotzdem per Klick — gemessen: Knopf meldet `disabled=false`, ein Klick
schließt den Dialog, obwohl er noch „arbeitet“.
Erwartung: Kein Weg soll einen laufenden Speichervorgang abbrechen können außer denen, die es
ausdrücklich dürfen — die beiden anderen Wege (Escape, Abbrechen) sind bewusst gesperrt.
Einordnung: Vorbestehend, keine Regression von T-152 — `git diff HEAD` zeigt, dass das
Schließkreuz auch vor der Ark-Umstellung ohne `disabled={busy}` auskam. Trotzdem meldenswert, weil
die Aufgabe ausdrücklich verlangt, den `busy`-Zustand vollständig zu prüfen, und der Weg über
Tastatur (Tab zum X, Eingabe/Leertaste) genauso funktioniert wie per Maus.
Konkreter Fix: `<Dialog.CloseTrigger asChild><IconButton … disabled={busy} /></Dialog.CloseTrigger>`
in `FormDialog.tsx`.

**`apps/web/src/styles/showcase.css:101-119` (Musterseite, schmale Breite) — niedrig**
Beobachtung: Bei schmaler Breite (getestet 380 px, Schwelle im Code `60rem`) bleibt `.sidenav`
`position: sticky` statt `static`, weil die unbedingte Regel `.sidenav { position: sticky; … }`
(Zeile 112) **nach** der Media-Query-Regel `.sidenav { position: static; }` (Zeile 107–109) im
Stylesheet steht und bei gleicher Spezifität gewinnt (bestätigt über `getComputedStyle`: Position
bleibt `sticky`, obwohl die Media Query aktiv ist). Folge: Die Seitenleiste überlagert bei
schmaler Breite den Inhalt und fängt Zeigerklicks ab.
Einordnung: Betrifft nur die Musterseite, nicht die eigentliche Anwendung, und ist unabhängig von
T-152 (diese Zeilen sind seit vor der Aufgabe unverändert) — hat mich aber bei der geforderten
Prüfung „kleinere Sichtfelder“ behindert; ich musste die Seitenleiste per injiziertem Stil
neutralisieren, um den Dialog selbst bei 380 px zu erreichen (Screenshots `14a`/`14b`).
Konkreter Fix: Die Media-Query-Regel für `.sidenav` nach der unbedingten Basisregel platzieren,
oder die Basisregel mit geringerer Spezifität (`:where(...)`) schreiben.

**Kein Befund, nur Beobachtung** — Escape schließt `UpdateDialog` auch während `busy`
(„Überspringen läuft“), obwohl alle drei Knöpfe sichtbar gesperrt sind: `DialogSurface` bekommt von
`UpdateDialog` kein `closeOnEscape`, also gilt die Voreinstellung `true`. Das weicht von
`FormDialog` ab (dort blockiert `closeOnEscape={!busy}` bewusst), ist inhaltlich aber unbedenklich:
Escape löst `onPostpone` aus, das nur „für diesen Lauf zurückstellen“ bedeutet und weder die
laufende Anfrage abbricht noch verfälscht. Ich nenne es trotzdem, weil die Prüfliste ausdrücklich
den `busy`-Zustand verlangt und die Inkonsistenz zwischen den beiden Dialogen (einer blockiert
Escape während `busy`, der andere nicht) beim nächsten Umbau leicht als Versehen missverstanden
werden könnte.

## Was ich sonst noch geprüft habe (bestanden)

**FormDialog, Musterseite, Zustand „Bedienbar“:**
- Fokus beim Öffnen: korrekt im Feld „Titel“, nicht auf dem Schließkreuz (`01`, `02`).
- Tab-Schleife vollständig gemessen (5 Stationen: Titel → Auswahlfeld → Abbrechen → Anlegen → X →
  wieder Titel) und Umschalt+Tab in Gegenrichtung — keine einzige Station außerhalb des Dialogs,
  SC 2.4.3 erfüllt.
- Klick auf die Abdunklung schließt nicht (`05`).

**„Pflichtfeld leer“:** Absenden-Knopf korrekt gesperrt; Escape schließt (busy=false, `06`).

**„Wird gespeichert“ (busy):** Escape blockiert, Klick auf Abdunklung blockiert, Abbrechen-Knopf
gesperrt (`07`) — bis auf den X-Knopf-Befund oben.

**„Dienst hat abgelehnt“ (error):** Fehlermeldung erscheint und ist sichtbar (`08`). Zusätzlich mit
einem **echten** langen Formular geprüft (nicht nur der zweifeldrigen Musterseiten-Demo): Im
Formular „Neuen Pool anlegen“ einen bereits vergebenen Namen eingegeben, ganz nach unten gescrollt
vor dem Absenden — nach der Absage des Dienstes lag die Fehlermeldung „Das hat nicht geklappt“
zuverlässig **innerhalb** des sichtbaren Dialogausschnitts, obwohl das Formular deutlich länger ist
als der Viewport (`24`). `scrollIntoView({block:"nearest"})` funktioniert wie zugesichert.

**Bestätigungsdialoge (Musterseite):** Rolle `alertdialog`, Fokus beim Öffnen auf dem ersten
bedienbaren Element (kein Schließkreuz vorhanden, Fokus fiel korrekt auf „Abbrechen“, `10`), Klick
auf Hintergrund schließt nicht, Escape schließt. Beim „Folgenreichen Dialog“ sperrt das
Kontrollkästchen den Bestätigen-Knopf zuverlässig (gesperrt vor Haken, frei danach, `10b`/`10c`).

**Farbmodi, Dichte, schmale Breite:** Dunkelmodus (`11b`, `12`) und Dunkel+Kompakt (`13`) zeigen
denselben Dialog korrekt eingefärbt, kein abgeschnittener Inhalt. Bei 380 px Breite bleibt der
Dialog benutzbar: Fußzeile vollständig im sichtbaren Bereich ohne Scrollen, Rumpf trägt
`overflow-y: auto` (`14b`). Ein Layoutfehler der Musterseite selbst (siehe Befund „niedrig“ oben)
musste dafür umgangen werden.

**Fokusrückgabe „Neues Todo“ (Dashboard):** Fokus beim Öffnen im Titelfeld, nach Escape zuverlässig
zurück auf den Knopf „Neues Todo“ (`20`) — funktioniert, im Unterschied zum Zeilenmenü-Fall oben.

**Dialogwechsel Board → „Spalten verwalten“ → „Neue Spalte anlegen“:** Der erste Dialog
(„Spalten des Boards“) verschwindet vollständig, der zweite („Neue Board-Spalte anlegen“) öffnet
mit Fokus im ersten Feld (`25`, `26`). Ein kurzer Fokus-Zwischenschritt ist messbar (drei
`focusin`-Ereignisse statt eines), landet aber nie außerhalb eines Dialogs — genau das in T-152
als „Risiko 2“ bereits benannte und akzeptierte Verhalten, hier bestätigt und ohne sichtbares
Flackern im Bildschirmabzug.

**UpdateDialog (Musterseite, alle drei Zustände):**
- „Neue Fassung liegt vor“: Fokus beim Öffnen auf dem Kasten selbst (`tabIndex="-1"`, kein Knopf),
  Umschalt+Tab als **erster** Tastendruck bleibt im Dialog (springt ans Ende der Schleife statt
  hinauszuführen), volle Tab-Schleife über vier Stationen ohne Leck, Klick auf Abdunklung schließt
  nicht (`31`).
- „Öffnen abgewiesen“: Fokus ebenfalls auf dem Kasten (`32`).
- „Überspringen läuft“ (busy): Alle drei Knöpfe sichtbar gesperrt („Installieren“ disabled,
  „Überspringen“ mit Ladeanzeige, „Später entscheiden“ disabled) und Fokus auf dem Kasten (`33`).
  Escape schließt trotzdem — siehe „Kein Befund“ oben.

**Nicht nachgestellt (ehrlich offen):**
- Der Übergang **Vorwarnung → Absage des Dienstes** in `ConfirmDialog` (zwei verschiedene Kästen zu
  verschiedenen Zeitpunkten) ließ sich mit vertretbarem Aufwand nicht **live** auslösen: Die
  Musterseite zeigt dafür keine Demo (nur `AttachmentOpenDialog` hat eine `refusal`-Demo, und der
  ist ausdrücklich nicht Teil dieser Aufgabe), und in der echten Anwendung bräuchte es einen
  gezielt herbeigeführten Dienstfehler zwischen Bestätigung und Antwort. Ich habe den Code
  gegengelesen (`ConfirmDialog.tsx`: `refusal` ersetzt `consequence` an derselben Stelle, liegt in
  einem eigenen `role="status"`, der unverändert von T-152 übernommen wurde) und halte das
  Verhalten für unverändert plausibel, aber **ungesehen im Browser**.
- Der **live** Übergang „ein Knopf wird `disabled`, während er den Fokus trägt“ im `UpdateDialog`
  selbst (der ursprünglich gemessene Fall) ließ sich über die statische Musterseiten-Demo nicht
  auslösen, weil dort bei jedem Klick eine neue Dialoginstanz mit bereits gesetztem `busy`
  entsteht, statt eine bestehende von `busy=false` auf `busy=true` zu heben, während „Überspringen“
  den Fokus trägt. Ohne Tauri-Hülle ließ sich das auch nicht über die echte Anwendung erzwingen.
  Ich halte den *Endzustand* (siehe „Überspringen läuft“ oben) für korrekt geprüft, den *Übergang*
  aber für ungesehen.

---

## Annahmen

- Ich habe für Testdaten ausschließlich erfundene Namen benutzt (`QA…`-Präfix) und sie nicht
  entfernt — sie liegen im Wegwerf-`XDG_DATA_HOME` dieser Sitzung, nicht im echten Anwendungsdatenverzeichnis.
- Da `AttachmentOpenDialog` laut Auftrag ausdrücklich nicht betroffen ist, habe ich ihn nicht
  geprüft, auch nicht am Rand (Deadline-Musterseite zeigt ihn, ich habe die Karte nicht geöffnet).
- Den Fund zum X-Knopf während `busy` habe ich per `git diff HEAD` gegen den unveränderten
  Alt-Zustand von `FormDialog.tsx` abgeglichen, um zu belegen, dass er **nicht** durch T-152
  eingeführt wurde, sondern vorbestand — trotzdem melde ich ihn, weil die Aufgabe ausdrücklich
  verlangt, den `busy`-Zustand vollständig zu prüfen.

## Risiken

- Der `body`-Fokus-Befund (PoolFormDialog) und der Zeilenmenü-Befund sehen nach derselben
  Ursachenfamilie aus (ein Element verschwindet oder ein weiterer Ark-Baustein — Menü — schließt
  gleichzeitig), lassen sich aber nicht ohne Weiteres auf denselben Bug zurückführen; beide sollten
  einzeln nachgestellt werden, bevor an einer gemeinsamen Ursache gearbeitet wird.
- Sicherheitsrelevant ist an keinem der Funde etwas: Keine neue Netzwerkadresse, keine Änderung an
  CSP oder Exportformat, kein Zugriff, der vorher nicht möglich war (der X-Knopf-Fund erlaubt
  lediglich ein früheres Abbrechen eines Sichtbaren-Dialogs, keinen Zugriff auf zusätzliche Daten).

## Offene Fragen an den Orchestrator

1. Sollen die beiden Fokus-Rückgabe-Befunde (PoolFormDialog-Tagentfernung, Zeilenmenü-Bearbeiten)
   als **ein** Nacharbeitspaket an frontend-dev gehen, oder getrennt, da unterschiedliche
   Auslösewege (Mutationsbeobachtung vs. Menü-Dialog-Wettlauf)?
2. Ist der X-Knopf-Fund (busy, FormDialog) für diese Welle relevant, obwohl er nicht durch T-152
   verursacht wurde — oder für eine spätere, allgemeine Aufräumwelle vormerken?
3. Der Sidenav-Fund auf der Musterseite: eigene Kleinstaufgabe für frontend-dev, oder Sammelposten?

## Nächster Schritt

Vorschlag: frontend-dev bekommt die drei Befunde mit den Reproduktionsschritten oben (insbesondere
die beiden Fokus-Rückgabe-Fälle mit hoher Einstufung) für die nächste Welle; danach erneute
Sichtprüfung derselben beiden Stellen, bevor T-152/T-153 als abgenommen gelten. Bis dahin:

**Nacharbeit**
