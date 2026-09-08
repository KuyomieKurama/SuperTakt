# T-161 — Sichtprüfung der Nacharbeit aus T-157

**Aufgabe:** T-161 — die fünf Meßpunkte aus dem T-157-Bericht im laufenden Browser prüfen.
**Status:** braucht Review — einer der fünf Punkte ist **nicht** behoben, entgegen der Zusage im
T-157-Bericht.

---

## Umgebung

Lokaler Dienst aus dem Quelltext (`node apps/local-api/src/index.ts`, Startgeheimnis über `stdin`,
`XDG_DATA_HOME` auf ein Wegwerfverzeichnis), Oberfläche über `pnpm exec vite --host 127.0.0.1
--port 5173 --strictPort` in `apps/web` mit `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN` (derselbe Weg
wie `tests/e2e/support/services.ts`), Musterseite unter `http://127.0.0.1:5173/designsystem.html`.
Browser: Chromium über `@playwright/test` (im Baum vorhanden), gesteuert über Wegwerf-Skripte
außerhalb des Repositorys (Scratchpad-Verzeichnis, nach dem Lauf gelöscht — kein Produktivcode,
keine Testdatei angelegt). Echte Fachdaten über die Oberfläche angelegt (drei Tags, ein Pool, ein
Todo — erfundene Testdaten, Präfix „QA-"/„QA "). Geprüft bei Desktop (1400×900) und bei 380×700 für
Punkt 5.

Bildschirmabzüge: `/tmp/claude-1000/-home-kerem-Projects-SuperTakt/d3889bde-0d14-402d-8839-a82d7cf9b8ea/scratchpad/T-161-qa/screens/`
(26 Dateien, Präfix je Meßpunkt: `P1`–`P5`, dazu `MP` für die Ursachenanalyse zu Punkt 2 und `AT`
für die Anhangbeschriftung).

---

## Die fünf Meßpunkte — Kurzfassung

| # | Meßpunkt | Ergebnis |
|---|---|---|
| 1 | `PoolFormDialog`, letzten Tag entfernen | **behoben** |
| 2 | Zeilenmenü → Escape (O-CY) | **nicht behoben** — widerspricht der Zusage in T-157 |
| 3 | Board, „Spalten des Boards", „Als Spalte aufnehmen" | **Anlaßfall existiert nicht mehr** — anders zu bewerten, siehe unten |
| 4 | Schließkreuz während `busy` | **behoben** |
| 5 | Musterseite bei 380 px | **behoben** |

---

## Punkt 1 — `PoolFormDialog`, letzten Tag entfernen — **behoben**

`pfad/screen` **hoch → behoben** `apps/web/src/screens/PoolFormDialog.tsx` (TagInput
„Erforderliche Tags").

Beobachtung: „QA Fokus Pool" bearbeiten, den Entfernen-Knopf des letzten (einzigen) Tags fokussiert
und mit Eingabe ausgelöst. `document.activeElement` ist danach das **erste Formularfeld** (Name,
`.field__input`), nicht `<body>`. Zweimal reproduziert (zwei unabhängige Läufe). Ein anschließendes
Escape schließt den Dialog normal.
Erwartung laut T-152/T-153: Der Fokus darf nicht auf `body` fallen, erwartet ist das erste Feld des
Dialogs. **Erfüllt.**
Screenshots: `P1-01-pool-edit-open.png`, `P1-02-after-last-tag-removed.png`,
`P1-03-after-escape.png`.

### Die Gegenprobe (wichtiger als die Behebung) — **greift nicht fehlerhaft**

Zwei unabhängige Proben, beide mit einer im Portal aufgeklappten Liste, während der Dialog offen
ist:

1. **TagInput-Liste („Tag suchen und hinzufügen")**: Liste geöffnet, 300 ms gewartet — Liste bleibt
   offen, Fokus bleibt im Eingabefeld (bei einer Kombobox verlässt der DOM-Fokus das Feld ohnehin
   nie; die Auswahl läuft über `aria-activedescendant`). Eine Auswahl per Maus aus der Liste hat
   danach normal funktioniert (Chip erscheint, Liste bleibt für die nächste Auswahl offen —
   `closeOnSelect={false}`). Screenshots: `P1-04-two-tags-present.png` (Achtung: bei geöffneter
   Liste scrollt der Dialog die Liste ins Sichtfeld, Titel/Chips sind dann oberhalb des
   Bildschirmausschnitts — kein Fehler, nur beim Lesen der Abzüge zu beachten),
   `P1-05-list-open-in-portal.png`, `P1-06-after-picking-from-list.png`.
2. **Select „Anzeigeort"** (echte Listbox — hier wandert der **tatsächliche DOM-Fokus** in den
   Portal-Inhalt, ein schärferer Test als die Kombobox): Liste geöffnet, Fokus wandert nach
   `.select__content` (bestätigt per `document.activeElement`), bleibt dort über 500 ms hinweg
   stabil, eine Auswahl per Pfeiltaste+Eingabe funktioniert normal, Fokus kehrt danach korrekt auf
   den Trigger zurück. Screenshot: `P1-07-select-open-in-portal.png`,
   `P1-08-after-select-pick.png`. (Eigene Probe `select-probe.mjs`, isoliert nachgestellt, um einen
   Vorlauf-Interferenzeffekt zwischen zwei gleichzeitig offenen Listen auszuschließen — siehe
   Annahmen.)

Fazit: Die Rückholung greift korrekt **nur**, wenn der Fokus tatsächlich ins Nichts fällt, und
lässt eine absichtlich geöffnete Liste im Portal in Ruhe — genau die Zusage aus T-157.

---

## Punkt 2 — Zeilenmenü → Escape (O-CY) — **nicht behoben**

`pfad/screen` **hoch → nicht behoben** `apps/web/src/screens/TodoListScreen.tsx` (Zeilenmenü
„Bearbeiten" und „Löschen"), Ursache in `apps/web/src/components/Menu.tsx`.

Beobachtung: Zeilenmenü von „QA Fokus Todo" geöffnet, „Bearbeiten" geklickt (Dialog öffnet mit
Fokus im Titelfeld — das funktioniert), mit Escape geschlossen: `document.activeElement` ist
danach **`<body>`**, nicht der Menü-Auslöser. **Identisch reproduziert** über „Löschen"
(Bestätigungsdialog). Beides in **zwei vollständigen Läufen** und zusätzlich neunmal in einer
isolierten Probe über eine volle Sekunde hinweg abgetastet (`t~0ms` bis `t~1000ms`) — durchgehend
`BODY`, keine Verzögerung, kein Nachziehen. Die Gegenprobe „Neues Todo" auf dem Dashboard (kein
Menü, ein gewöhnlicher Knopf) funktioniert weiterhin korrekt: Fokus kehrt zuverlässig auf den
Knopf zurück.
Erwartung laut T-157: Der Auslöser bekommt den Fokus vor der Aktion, dieselbe Reihenfolge wie bei
„Neues Todo". **Nicht erfüllt** — das beobachtete Verhalten ist **dasselbe wie vor T-157** (mein
eigener Befund aus T-153, unverändert).
Screenshots: `MP-01-menu-open.png`, `P2-02-edit-dialog-open.png` (Fokus korrekt im Titelfeld),
`P2-03-after-escape-edit.png`, `P2-04-confirm-delete-open.png`,
`P2-05-after-escape-delete.png` (beide `<body>`), `P2-06-after-escape-dashboard-new-todo.png`
(Gegenprobe: funktioniert).

### Warum — mit Beleg, nicht nur Vermutung

Über `focusin`/`focusout`-Mitschnitt auf `document` (Erfassungsphase) ergibt sich diese Folge
(`menu-probe2.mjs`, Zeitstempel `performance.now()` relativ zum Seitenaufruf):

```
t=685.7  focusin  DIV.menu               -- Menü öffnet, Fokus zuerst auf dem Menü-Inhalt
t=937.3  focusout DIV.menu   -> BUTTON.menu__trigger   -- unser Fix greift: Auslöser bekommt Fokus
t=937.5  focusin  BUTTON.menu__trigger   (aria-label „Menü für „QA Fokus Todo““)
t=992.6  focusout BUTTON.menu__trigger -> DIV.menu     -- ETWAS holt den Fokus zurück auf .menu
t=992.9  focusin  DIV.menu              (erneut)
t=997.2  focusout DIV.menu   -> null                   -- Fokus fällt ins Nichts (Menü verschwindet)
t=998.7  focusin  INPUT.field__input    -- Dialog öffnet jetzt erst, Titelfeld bekommt initialFocus
t=1029.1 focusout INPUT.field__input -> null           -- Escape: Titel verliert Fokus, niemand übernimmt
```

Die im T-157-Bericht beschriebene Behebung **greift tatsächlich** (Zeile 2–3: der Auslöser bekommt
korrekt den Fokus, **bevor** die Aktion läuft — genau wie beschrieben). Sie wird aber **danach**
von etwas anderem wieder rückgängig gemacht (Zeile 4: Fokus wandert von Trigger zurück auf `.menu`)
und geht dann verloren (Zeile 6: `relatedTarget: null`), **bevor** der Dialog überhaupt öffnet
(Zeile 7 kommt erst danach). Die Ark-Dialog-Fokusfalle merkt sich beim Scharfstellen also bereits
`<body>` als Rückkehrziel, nicht den Trigger — mit demselben Ergebnis wie vor T-157. Vermutung, mit
welchem Mechanismus `.menu` den Fokus zurückholt: das im T-157-Bericht selbst genannte
`focusTrigger` von `@zag-js/menu` (`queueMicrotask`) — nur dass es dabei offenbar auf das
Container-Element `.menu` statt auf `Ark.Trigger` zielt oder zwischenzeitlich das entfernte
Element trifft; das habe ich nicht bis in die Bibliothek zurückverfolgt (Zeitbudget), die Zeitreihe
oben genügt aber, um die Zusage zu widerlegen.

**Das ist meine wichtigste Zeile in diesem Bericht:** Punkt 2 gilt in T-157 als „anders behoben" —
er ist am Ende **gar nicht** behoben, mit demselben sichtbaren Fehlerbild wie in T-153 (O-CY).

Nicht geprüft (Zeitbudget): ob ein Menüeintrag **ohne** Dialogfolge (z. B. „Status: …" direkt
setzen) den Fokus jetzt versehentlich anders behandelt als vor T-157. Da der Fehler bereits **vor**
dem Öffnen eines Dialogs sichtbar ist (Zeile 4–6 der Zeitreihe oben, unabhängig davon ob danach ein
Dialog kommt), halte ich das für unwahrscheinlich, habe es aber nicht gemessen.

---

## Punkt 3 — Board, „Spalten des Boards", „Als Spalte aufnehmen" — **Anlaßfall existiert nicht mehr**

`pfad/screen` **niedrig (Information, kein Fehler)** `apps/web/src/screens/BoardScreen.tsx`.

Beobachtung: „Spalten verwalten" geöffnet, im Abschnitt „Vorhandene Pool-Regeln" bei „QA Fokus
Pool" auf „Als Spalte aufnehmen" geklickt (mit Tastatur, fokussiert + Eingabe). Ergebnis: Der
**gesamte Dialog schließt sofort**, ein Toast „Regel als Spalte aufgenommen." mit „Rückgängig"
erscheint, und der Fokus kehrt korrekt auf den äußeren Auslöser „Spalten verwalten" zurück (mit
sichtbarem Fokusring, Screenshot `P3-02-after-adopt.png`). Ein anschließendes Escape schließt
nichts mehr (der Dialog ist ja schon zu) und der Fokus bleibt auf der Seite, konkret auf dem
zuletzt aktiven Navigationslink (`P3-03-after-escape.png` — das ist die Nebenwirkung von Escape auf
einer normalen Seite ohne offenen Dialog, kein Befund). Die anschließende Tabulatorschleife
verlässt folgerichtig die (nicht mehr vorhandene) Dialogfläche und läuft durch die Seitennavigation
— auch das ist **kein Leck aus einem offenen Dialog**, weil schlicht keiner mehr offen ist.

Grund, im Quelltext selbst dokumentiert (`BoardScreen.tsx`, Kommentar bei der Verdrahtung von
`onAdopt`/`onRemove`, um Zeile 509–523): **Seit T-102** schließen sowohl „Als Spalte aufnehmen" als
auch „Vom Board nehmen" den Dialog **vor** der Wirkung — ausdrücklich, um „Rückgängig" per Tastatur
und Vorlesehilfe erreichbar zu machen. Der im T-157-Bericht als Anlaßfall zitierte Zustand („der
Knopf verschwindet, weil die Regel danach oben unter den Spalten steht", Dialog bleibt dabei
**offen**) ist damit seit T-102 **strukturell nicht mehr herstellbar** über diesen Weg — die Regel
wandert nicht mehr sichtbar innerhalb eines offenen Dialogs von einer Liste in eine andere, der
ganze Dialog ist vorher schon weg.

Das beobachtete Verhalten ist korrekt und keine Nacharbeit wert. Es prüft aber **nicht** dieselbe
Mechanik wie Punkt 1 (Nachfahren-Entfernung in einem **offen bleibenden** Dialog) — dafür bleibt
Punkt 1 der einzige tatsächlich noch existierende Beleg im Produkt. Wer den historischen T-072-Fall
wörtlich nachstellen will, findet dafür aktuell keine Stelle mehr in der Oberfläche; ich habe nicht
gezielt nach einer Ersatzstelle gesucht (nicht Teil des Auftrags).

---

## Punkt 4 — Schließkreuz während `busy` — **behoben**

`pfad/screen` **mittel → behoben** `apps/web/src/components/FormDialog.tsx`.

Beobachtung: Netzwerkantwort auf das Anlegen eines Tags künstlich um 4 s verzögert (`page.route`),
danach in genau diesem `busy`-Fenster alle vier Wege geprüft:

- Klick auf das X: `disabled` (gemessen: `true`), Dialog bleibt offen.
- Escape: Dialog bleibt offen.
- Tabulator zum X + Eingabe: Dialog bleibt offen.
- Klick auf „Abbrechen": ebenfalls `disabled` (gemessen: `true`), Dialog bleibt offen.

Nach Ablauf der Verzögerung schließt der Dialog von selbst (Anfrage erfolgreich). Screenshots:
`P4-01-busy-state.png`, `P4-02-still-busy-after-attempts.png` (Ladeanzeige auf „Anlegen" sichtbar,
X sichtbar gesperrt, kein Fokusring, der auf einen erfolgreichen Klick hindeutet).
Erwartung laut T-153/T-157: Kein Weg schließt einen laufenden Speichervorgang außer den
ausdrücklich erlaubten (hier: keiner der vier). **Erfüllt.**

---

## Punkt 5 — Musterseite bei 380 px — **behoben**

`pfad/screen` **niedrig → behoben** `apps/web/src/styles/showcase.css`.

Beobachtung: Bei 380×700 ist `getComputedStyle(.sidenav).position === "static"` (gemessen). Die
`boundingBox` der Seitenleiste (`{x:16, y:180, width:348, height:654.5}`) zeigt normalen
Blockfluss (volle verfügbare Breite, keine Überlappung mit nachfolgendem Inhalt) statt der
vorherigen `sticky`-Überlagerung. Screenshot `P5-01-designsystem-380px.png`: Seitenleiste steht
**oberhalb** des Inhalts im normalen Fluss, keine Überlagerung, keine abgeschnittenen Inhalte.
Erwartung laut T-153: Die Ausnahme (`static` bei schmaler Breite) muss gegen die Grundregel
(`sticky`) gewinnen. **Erfüllt.**

---

## Zusätzliche Beobachtung — Anhangbeschriftung ohne Titel (O-CR, für spec-ux-reviewer)

`pfad/screen` **mittel (Anschauungsmaterial für O-DH, kein eigenständiger Fehler)**
`apps/web/src/components/Attachments.tsx`.

Ein Todo mit drei Verweisen ohne Titel angelegt: zwei auf denselben Wirt
(`beispiel.example/ordner/erste-seite` und `.../zweite-seite?ticket=4711`), einer auf einen
anderen Wirt. Ergebnis (Screenshot `AT-01-attachment-list-same-host.png`): Die fette,
prominente erste Zeile zeigt für **beide** Verweise auf `beispiel.example` denselben Text
„beispiel.example" — optisch nicht unterscheidbar. Die zweite, kleinere, gedämpfte Zeile zeigt
weiterhin die volle Adresse und unterscheidet die beiden korrekt.
Beobachtung: Wer die Liste überfliegt (also genau die fette Zeile liest, wofür sie da ist), sieht
zwei identisch benannte Einträge und muss zum Unterscheiden die kleine Zeile darunter mitlesen —
bei einer Liste mit mehreren Anhängen zum selben Ticketsystem (der von T-157 selbst genannte
Regelfall) ist das der Normalfall, nicht der Ausnahmefall.
Das ist kein Fehler gegen eine Spezifikation, sondern **genau die Anschauung**, die T-157s offene
Frage 1 an spec-ux-reviewer verlangt hat. Meine Einschätzung, als Material und nicht als Urteil:
Der längere Vorschlag aus T-157 (`beispiel.example/ordner/erste-seite`) wäre hier informativer,
ohne dass ich beurteilen kann, ob das an jeder Stelle mit begrenztem Platz noch passt (`truncate`
ist bereits gesetzt).

---

## Nicht nachstellbar in dieser Sitzung

**O-CO, Fristzustände über Mitternacht** (Dashboard-Kacheln und Todo-Liste): nicht mit gestellter
Uhr geprüft. Playwrights Uhr-Emulation (`page.clock`) hätte für die **Client-Seite** funktioniert
(`useToday()` hängt an `window.setTimeout`/`Date`), der Fristfilter der Todo-Liste wird aber **vom
Dienst** gegen dessen echte Systemuhr gerechnet (T-157-Bericht, Abschnitt 6) — eine überzeugende
Prüfung hätte also entweder eine gestellte Systemuhr für den laufenden `local-api`-Prozess gebraucht
oder eine reine Bestätigung des Nachfeuerns der Abfrage ohne geänderten Serverbefund. Angesichts des
bereits deutlich überzogenen Zeit-/Kostenrahmens dieser Sitzung habe ich das zugunsten der fünf
verbindlichen Meßpunkte zurückgestellt. **Nicht gemessen**, nicht „bestanden".

---

## Annahmen

1. Die Behauptung „Fokus 300 ms nach Öffnen des Select bleibt im Portal-Inhalt" wurde **isoliert**
   nachgestellt (eigenes Skript, frischer Dialogaufruf), nachdem eine erste Messung im
   Gesamtdurchlauf widersprüchlich aussah (Liste schien nach 300 ms schon wieder zu). Ursache war
   ein Testartefakt: Die TagInput-Liste war zu diesem Zeitpunkt noch offen (`closeOnSelect=false`),
   und der Klick auf den Select-Auslöser schloss zunächst nur diese benachbarte Liste. Mit einem
   Escape dazwischen (schließt laut Ebenenverwaltung nur die oberste Ebene) verhielt sich der Select
   sauber und stabil. Ich nenne das ausdrücklich, weil es fast als sechster Befund in den Bericht
   gegangen wäre und es nicht ist — reines Testartefakt meinerseits, keine App-Eigenschaft.
2. Für Punkt 3 habe ich mich entschieden, den **Quelltext** als Beleg für „Anlaßfall existiert
   nicht mehr" heranzuziehen (Kommentar bei `onAdopt`/`onRemove`, referenziert T-102), statt nach
   einer Ersatzstelle in der Oberfläche zu suchen, die denselben Nachfahren-Fall reproduziert. Punkt
   1 deckt dieselbe Mechanik bereits direkt ab.
3. Testdaten ausschließlich mit `QA`-Präfix angelegt, im Wegwerf-`XDG_DATA_HOME` dieser Sitzung,
   nicht im echten Anwendungsdatenverzeichnis.
4. `.gitignore`/Produktivcode wurden zu keinem Zeitpunkt angefasst; alle Skripte lagen im
   Scratchpad-Verzeichnis außerhalb des Repositorys und sind nach Abschluss gelöscht (siehe unten).

## Risiken

1. **Punkt 2 ist sicherheitlich folgenlos**, aber ein echter Barrierefreiheits-Regressionsfall:
   Tastatur- und Vorlesehilfe-Benutzer verlieren nach jedem Escape aus einem über das Zeilenmenü
   geöffneten Dialog ihren Ort und landen ungefragt am Dokumentanfang — für „Bearbeiten" **und**
   „Löschen", also für den häufigsten Weg durch die Todo-Liste.
2. Keine neue Netzwerkadresse, keine Änderung an CSP oder Exportformat, kein Zugriff, der vorher
   nicht möglich war — an keinem der fünf Punkte oder der Zusatzbeobachtung.
3. Die O-CO-Prüfung fehlt vollständig für diese Welle; sollte in einer der nächsten Wellen
   nachgeholt werden, bevor T-152/T-153/T-157 als vollständig abgenommen gelten.

## Offene Fragen

1. **An frontend-dev/Orchestrator:** Punkt 2 braucht eine neue Nacharbeit. Aus der Zeitreihe oben
   sieht es so aus, als würde das Menü **nach** unserem `focusTriggerFirst()`-Aufruf noch einmal
   selbst am Fokus drehen (Zeile 4 der Reihe: `.menu` bekommt den Fokus zurück). Ein möglicher Weg:
   der Rückgabewert/die Reihenfolge in `@zag-js/menu`s eigenem Schließvorgang genauer verfolgen, ob
   `stopClosingKeys`/`exclude` hier tatsächlich greift, oder ob ein zweiter, späterer
   `focus()`-Aufruf (des Menüs selbst, nicht unserer) das Ziel `.menu` statt `Ark.Trigger` trifft.
2. **An spec-ux-reviewer:** Die Anhangbeschriftung (Zusatzbeobachtung oben) als Anschauung für
   O-DH — Entscheidung liegt bei Ihnen, siehe T-157 offene Frage 1.
3. **An den Orchestrator:** Soll O-CO (Mitternacht) in dieser Welle noch mit gestellter Systemuhr
   des `local-api`-Prozesses nachgeholt werden, oder reicht die Code-Ableitung aus T-157 als
   Freigabegrundlage für diesen Teilbefund?

## Nächster Schritt

**Nacharbeit** an Punkt 2 (O-CY) durch frontend-dev, diesmal mit Playwright verfügbar (der Fund
ist im Browser reproduzierbar und mit einer Ereigniszeitreihe belegt, siehe oben) — die Zusage aus
T-157 hält der Sichtprüfung nicht stand. Punkte 1, 4 und 5 sind abgenommen. Punkt 3 braucht keine
weitere Arbeit (der Anlaßfall existiert nicht mehr), sollte aber im nächsten decisions.md-Eintrag
zu E-076/O-CX nicht mehr als offener Prüfpunkt geführt werden. Erneute Sichtprüfung von Punkt 2,
sobald eine neue Behebung vorliegt.

**Nacharbeit**
