# T-353 — Augenschein über das, was seit T-338 gebaut wurde

**Rolle:** visual-qa. **Stand:** 2026-09-13. **Bezug:** T-341-frontend-dev.md, T-348-frontend-dev.md,
T-344-ui-designer.md, `docs/design/fensterfeste-flaechen.md`.

## Aufbau, eigen und unabhängig

`ss -ltn` vor Beginn: `17843`, `17844`, `5173` frei — nicht angefaßt (T-352 hat 5173 diese Welle).
Eigener Vite-Entwicklungsserver auf `127.0.0.1:5391` (`npx vite --host 127.0.0.1 --port 5391
--strictPort`, cwd `apps/web`), `VITE_TAKT_BASE_URL=http://127.0.0.1:19999/api/v1` (dieser Port
wird **nie gebunden** — Playwright fängt jede Anfrage über `page.route('**/api/v1/**', …)` ab,
bevor sie das Netz erreicht; es läuft also gar kein zweiter Dienst). Erfundene Daten in
`fixtures.mjs`/`mock.mjs` (eigenes Wegwerfverzeichnis unter der Scratchpad-Vorgabe): 24 Todos,
5 Board-Spalten, ~20 Zeitbuchungen über 7 Tage, 2 Exportvorlagen. Eigener Playwright-Treiber
(`@playwright/test`, Chromium), `data-design-theme`/`data-density` über die gemockte
`GET /settings`-Antwort gesteuert — derselbe Weg wie in T-338/T-341/T-348.

`ss -ltn` nach Abschluß: `5391`, `17843`, `17844`, `5173` wieder frei. Kein fremder Prozeß berührt.

Geprüft: zwei Gestaltungen (`classic`, `dark-base`) × beide Dichten (`comfortable`, `compact`) für
die allgemeine Prüfung; zusätzlich `glass` für Punkt 5. Vier Fenstergrößen: 960×640, 1024×640,
1200×820, 1280×820.

---

## 1. Die drei Rahmenansichten — Sprungmarke: fühlt es sich richtig an?

Gemessen an `classic`/`comfortable` (repräsentativ, gegen `dark-base`/beide Dichten gegengeprüft,
keine Abweichung gefunden):

| Ansicht | Größe | Ziel (`#inhalt`) | Taste | überschuss vorher | bewegt |
|---|---|---|---|---|---|
| Kanban | alle vier | `.board` (`role=region`, „Kanban") | Pfeil rechts | 426–746 px waagerecht | **ja, ~40 px** |
| Einstellungen (Daten) | alle vier | `.settings-panel` (`role=region`, „Daten") | Bild-ab | 115–469 px senkrecht | **ja, 113–428 px** |
| Zeiterfassung | 1200×820, 1280×820 | „Todo wählen" (`role=region`) | Bild-ab | 758 px | ja, ~239 px |
| Zeiterfassung | 960×640, 1024×640 | „Todo wählen" | Bild-ab | 0 px | nein (kein Überschuss in diesem Datenstand — kein Befund) |

Das fühlt sich richtig an: Nach „Zum Inhalt springen" landet der Fokus unmittelbar in der Fläche,
die auch tatsächlich läuft, und die erste Taste bewegt sofort etwas — kein toter erster Tastendruck
mehr. Kanban und Einstellungen sind die beiden neuen Ziele aus T-348 und funktionieren in **jeder**
der vier Größen und in beiden geprüften Gestaltungen/Dichten identisch. Zeiterfassung war unverändert
und bleibt es.

**Kein Befund.** Die Zusage aus T-348 ist eingelöst und nicht nur behauptet.

---

## 2. Fokusring an `.board` und `.settings-panel`

Eigene erste Messung ergab scheinbar „oben abgeschnitten" an beiden Flächen und an allen vier
Größen — das war ein **Vorzeichenfehler im eigenen Meßaufbau** (bei `outline-offset: -4px` zieht
sich der Ring nach **innen**, nicht nach außen; `ringRect.top = rect.top + offset` statt
`rect.top - offset` gerechnet). Mit der berichtigten Rechnung und zusätzlich mit echtem
Tastaturfokus + Ausschnittsscreenshot bei 1024×640 nachgesehen:

- `.board`: Ring bei `rect.top + 4` bis `+6`, Rahmenkasten (`.screen__body--frame`) beginnt exakt an
  `rect.top` — der Ring liegt vollständig **innerhalb** der Fläche, `fitsInsideAncestor: true`.
  Im Bild (`ring-board-1024x640-zoom.png`) ist der Ring an allen vier Kanten der ersten Karte lückenlos
  sichtbar.
- `.settings-panel`: dieselbe Rechnung, dasselbe Ergebnis, `fitsInsideAncestor: true`. Im Bild
  (`ring-settings-1024x640-zoom.png`) liegt der Ring sauber um die Karte „SuperTakt-Datensicherung".

**Kein Befund.** Kein abgeschnittener Ring wie in T-336 — die in T-341 eingeführte Technik
(Polster + negativer Rand am Kopf/Leiste) trägt hier über dieselbe `outline-offset`-Regel auch ohne
eigenes Polster, weil `.board`/`.settings-panel` selbst die laufende Fläche sind und der Ring nach
innen zieht, nicht nach außen ragt.

---

## 3. Die Bereichsschiene ohne Zusatz — noch verständlich?

Gemessen (Höhe der Schiene, `clientHeight`/`scrollHeight`, Sichtbarkeit des Zusatzes):

| Fenster | Schienenhöhe | Zusatz (`display`) |
|---|---|---|
| 1280×820 | 577 px | `block` (sichtbar) |
| **1024×640** | **415 px** | `none` |
| 960×640 | 144 px (Band) | `none` (Band hat nie Zusatz) |

Zeichengleich mit T-348s Zahl (415 px). Im Bild (`rail-1024x640.png`): eine saubere, einspaltige
Liste aus Symbol + fettem Label — „Darstellung", „Timer", „Export", „Daten" (aktuell, blauer
Rahmen), „Standard-Tags", „Status", „Outlook-Add-in", „Arbeitsplatz" —, ohne Überlappung, ohne
abgeschnittenen Text, mit denselben Gruppentrennlinien wie bei 1280×820.

**Ja, verständlich.** Die acht Bezeichnungen sind für sich stehende, aus der übrigen Anwendung
bereits bekannte Substantive (kein Satz, der einen Kontext braucht); Symbol und aktueller Zustand
(`aria-current`, blauer Rahmen) bleiben erhalten. Der Verlust ist der des erklärenden Halbsatzes,
nicht der Orientierung. Kein Befund — bestätigt T-348s eigene Einschätzung mit unabhängigem Bild.

Bei 960×640 (Band, andere Ursache) ebenfalls verständlich: acht Einträge in einem umbrechenden
Band, „Export"/„Standard-Tags" durch eine Trennlinie von „Darstellung"/„Timer"/„Daten"/„Status"
abgesetzt — dieselbe Gruppierung wie in der Vertikalen, nur seitlich umbrochen.

---

## 4. Die Exporttabellen mit Halt

`GET /#/export`, Vorschau-Tab, 22 Buchungen in 14 Todo-Gruppen. Gemessen direkt an der Rolle/dem
Namen/dem Tabulatorhalt jeder `.table-wrap`-Fläche:

- Äußere Fläche (`export-todo-table`): `role="region"`, `tabindex="0"`,
  `aria-label="Export nach Todo, aufklappbar nach Tagen"` — Name deckt sich zeichengleich mit der
  `<caption>`. **Hat einen Halt.**
- Alle 14 geschachtelten Tagesflächen (`export-day-table`, je eine pro aufgeklappter Todo-Gruppe):
  `role=null`, `tabindex=null` — **kein** Halt, wie zugesagt (kein Halt je aufgeklappter Zeile).

Am Quelltext gegengelesen (`ExportGroups.tsx:255-257,354`): Die rechteste Spalte ist in beiden
Tabellen tatsächlich reiner Text (`{selected}` bzw. `<span class="visually-hidden">…</span>{quarters} h`)
— kein Knopf, kein Verweis. Mein erster automatischer Browsertest hatte hier durch eine zu weite
CSS-Auswahl (traf versehentlich auch verschachtelte Tabellen mit) fälschlich „doch fokussierbar"
gemeldet; das ist mein Meßfehler, am Quelltext widerlegt, kein Fund an der Anwendung.

Im Bild (`export-tables.png`): Kopfzeile mit Vorlage/Rundung/Ordner, Zusammenfassung („22 Buchungen
in 22 Exportzeilen … 5 Gruppen bleiben stehen — ohne Leistung kein Export"), darunter die Tabelle
mit Status/Call/Todo/Tage/Buchungen/Ausgewählte Tage — nichts abgeschnitten, nichts überlappt.

**Kein Befund.** `.board` als benannter Laufbereich ist gesondert unter Punkt 1/2 bestätigt.

---

## 5. Bestätigungsflächen — „vollständig sichtbar" und „fängt den Tastaturfokus"

Geprüft an derselben Fläche in drei Gestaltungen (`classic`, `dark-base`, `glass`): die
„Vorlage löschen?"-Rückfrage in `#/export/vorlagen` (`ConfirmDialog`, `dialog dialog--danger`),
1024×700, ausgelöst über den Löschen-Knopf einer nicht eingebauten Vorlage.

| Gestaltung | Rahmen vollständig im Fenster | Fokusfang (10× Tab) |
|---|---|---|
| classic | ja (`480×248` bei `(272,226)`, Fenster `1024×700`) | ja — Fokus zirkuliert ausschließlich zwischen „Vorlage löschen"/„Abbrechen" |
| dark-base | ja, identische Maße | ja |
| glass | ja, identische Maße | ja |

Beide von T-348 ausdrücklich **nicht** zugesicherten Teilsätze sind am gerenderten Bild bestätigt:
Der Dialog liegt in allen drei Fällen komplett innerhalb der Fensterfläche (kein Rand ragt heraus,
keine Bildlaufleiste am Dialog selbst nötig), und zehn aufeinanderfolgende Tab-Schritte verlassen
den Dialog in keinem Fall — der Fokus bleibt auf den zwei Knöpfen gefangen.

**Randnotiz, kein Befund:** In `glass` sieht die Dialogfläche selbst identisch zu `classic` aus
(deckungsgleiches Bild, opake weiße Karte) — nachgesehen in `theme-palettes.css`: Der
Glas-Hintergrund (`backdrop-filter`) ist bewußt nur an `.card, .filterbar, .app__sidebar,
.app__header` angeschlagen, nicht an `.dialog`. Das ist eine bestehende, im Code lesbare
Entscheidung (vermutlich Kontrast bei einer destruktiven Rückfrage) und keine neue Abweichung aus
T-341/T-348 — nicht Gegenstand dieser Aufgabe, nur der Vollständigkeit halber vermerkt.

**Kein Befund** an den beiden geprüften Teilsätzen, in allen drei Gestaltungen.

---

## 6. Der Kopfumbruch bei 1259 px

Fensterbreite in Einzelschritten 1258–1261 abgefahren, 1280×820 als Ausgangsgröße:

| Breite | Kopfhöhe | `.grow`-Breite | umgebrochen |
|---|---|---|---|
| 1258 | 137,8 | 960 | ja |
| 1259 | 137,8 | 961 | ja |
| **1260** | **187,8** | 160,7 | **nein** |
| 1261 | 187,8 | 161,7 | nein |

Zeichengleich mit T-341/T-344 (Kante bei 1259/1260, 50 px Höhenunterschied). Im Bild
(`kopf-1259.png` gegen `kopf-1260.png`): **Ja, an der Kante springt sichtbar etwas** — nicht nur die
Zahl, auch die Anordnung. Bei 1259 px stehen Titel+Erklärsatz **oben über die volle Breite**, darunter
in einer eigenen, ebenfalls vollen Zeile der Umschalter „Erledigte einblenden" + „Spalten verwalten".
Bei 1260 px rutscht dieselbe Aktionsgruppe **neben** den Titel, in eine rechtsbündige Zeile, während
der Erklärsatz jetzt nur noch ~161 px Breite bekommt und deshalb über fünf statt zwei Zeilen läuft —
in Summe ein höherer, optisch anders gegliederter Kopf, ausgelöst durch ein einziges Pixel
Fensterbreite.

Das ist **kein neuer Befund**: Der spec-ux-reviewer hat die Stelle bereits gesehen und mit der
Einschränkung „Regelgestalt einer von elf Ansichten" freigegeben, und T-344 hat die 50-px-Differenz
selbst schon beziffert. Ich bestätige am Bild, dass der Sprung real und for einen Benutzer, der sein
Fenster gerade an dieser Breite zieht, wahrnehmbar ist — beide Seiten der Kante sind für sich sauber
(nichts überlappt, nichts wird abgeschnitten), es ist ein Wechsel der Gliederung, kein Darstellungsfehler.
**Niedrig, bereits bekannt und akzeptiert — kein neuer Handlungsbedarf, nur die Bestätigung, dass die
Kante beim Ziehen tatsächlich sichtbar „ruckt" und nicht bloß eine Zahl auf dem Papier ist.**

---

## Befunde

Keine neuen hoch/mittel eingestuften Befunde gefunden. Ein niedriger, bereits bekannter und vom
spec-ux-reviewer akzeptierter Punkt wird am Bild bestätigt:

`apps/web/src/features/board/BoardScreen.tsx` (Kopf, Umbruchkante 1259/1260 px)  niedrig  Beim Ziehen
der Fensterbreite über exakt diese Kante wechselt die Kopfgliederung sichtbar (Aktionsleiste
springt von einer eigenen Vollbreiten-Zeile unter dem Titel in eine rechtsbündige Zeile daneben,
Kopf wird 50 px höher). Erwartung: bereits bekannt, vom spec-ux-reviewer als Regelgestalt einer von
elf Ansichten akzeptiert. Kein Fix verlangt; falls die Kante als störend empfunden wird, wäre eine
Zwischenstufe (z. B. Umbruch erst der Aktionsleiste, dann erst des Erklärsatzes) der nächste Schritt
— nicht Teil dieses Auftrags.

Zwei Meßfehler aus dem eigenen ersten Durchlauf sind **nicht** als Befund an der Anwendung zu
werten, hier nur der Vollständigkeit halber benannt, damit niemand sie später für einen echten Fund
hält: (1) ein Vorzeichenfehler bei der Berechnung der Fokusring-Geometrie (Punkt 2), berichtigt und
am Bild widerlegt; (2) eine zu weite CSS-Auswahl bei der Prüfung „rechteste Spalte fokussierbar"
(Punkt 4), am Quelltext widerlegt.

## Freigegeben

Alle sechs geprüften Punkte sind am gerenderten Bild bestätigt, keiner davon widerspricht den
Zusagen aus T-341/T-348/T-344. Die drei neuen/veränderten Flächen (Sprungmarke auf Inhaltshalt,
Fokusring an `.board`/`.settings-panel`, Bereichsschiene ohne Zusatz) verhalten sich in allen vier
Fenstergrößen und in den geprüften Gestaltungen/Dichten konsistent und **fühlen sich richtig an** —
kein toter erster Tastendruck, kein abgeschnittener Ring, keine unverständliche Schiene. Die beiden
von T-348 offen gelassenen Teilsätze von A-25.6 sind jetzt am Bild geprüft und bestanden, in drei
Gestaltungen einschließlich `glass`.

**freigegeben**

---

```
Aufgabe: T-353 — Augenschein über das, was seit T-338 gebaut wurde
Status: fertig
Artefakte: .claude/team/reports/T-353-visual-qa.md (keine Produktivdateien angefaßt).
  Eigener Meßaufbau unter der Scratchpad-Vorgabe (fixtures.mjs, mock.mjs, run.mjs, run2.mjs,
  run3.mjs, shots/*.png) — nicht Teil des Bestands, nicht committet.
Zusammenfassung: Alle sechs beauftragten Punkte am gerenderten Bild geprüft, mit eigenem
  Vite-Server (5391) und vollständig über Playwright-Routenabfangen gemockter API (kein zweiter
  Dienst gebunden). Sprungmarke: Kanban und Einstellungen bewegen sich bei jeder der vier
  Fenstergrößen sofort auf die erste Taste, in classic/dark-base × beide Dichten. Fokusring an
  `.board`/`.settings-panel`: nach Berichtigung eines eigenen Vorzeichenfehlers vollständig
  sichtbar, kein Abschneiden. Bereichsschiene ohne Zusatz (415 px bei 1024×640): am Bild weiterhin
  klar verständlich. Exporttabellen: äußere Fläche mit Halt/Rolle/Name, 14 geschachtelte
  Tagestabellen ohne — am Quelltext (`ExportGroups.tsx`) gegengelesen. Bestätigungsfläche
  („Vorlage löschen?"): in classic/dark-base/glass vollständig im Fenster und fängt den
  Tastaturfokus über zehn Tab-Schritte. Kopfumbruch bei 1259/1260 px: Sprung bestätigt, real und
  sichtbar, aber bereits bekannt und vom spec-ux-reviewer akzeptiert.
Annahmen: (1) Repräsentative Prüfung statt vollständiger Kreuzmenge — classic/comfortable für alle
  vier Größen × drei Ansichten, dark-base/beide Dichten stichprobenartig bei 1024×640 (der
  schärfsten Größe) gegengeprüft, keine Abweichung gefunden. (2) Zeiterfassung war nicht Gegenstand
  von T-348 und zeigt bei 960/1024×640 keinen Überschuss in meinem Datenstand — das ist eine
  Eigenschaft der erfundenen Datenmenge, kein geprüfter Fall dieser Aufgabe. (3) Die
  glass-Beobachtung zur Dialogfläche ist eine Randnotiz, kein Befund dieser Aufgabe.
Risiken: keine sicherheitsrelevanten. Zwei eigene Meßfehler im ersten Durchlauf (Vorzeichen bei der
  Ring-Geometrie, zu weite CSS-Auswahl bei der Spaltenprüfung) sind im Bericht offengelegt und
  jeweils durch eine zweite, korrigierte Messung bzw. den Quelltext widerlegt — nicht an die
  Anwendung weiterzureichen.
Offene Fragen: keine.
Nächster Schritt: Qualitätstor für T-341/T-344/T-348 kann aus visueller Sicht als erfüllt gelten;
  bereitsteht noch die Rückmeldung von e2e-tester (A9/AK-14 als Prüffälle, `.board` in
  `A8_RUN_AREA_SELECTORS`) und die Gegenlesung von `proof-surface.mjs` Regel G/H durch
  code-reviewer/security-checker (aus T-348 offene Fragen 2/3).
```
