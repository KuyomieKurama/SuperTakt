# T-338 — Augenschein über die Nacharbeit aus T-334

**Rolle:** visual-qa. **Bezug:** T-329 (eigener Vorbericht), T-334 (`.claude/team/reports/T-334-frontend-dev.md`),
T-330 (e2e-tester, A2-Verstöße), `docs/design/fensterfeste-flaechen.md`,
`docs/design/fensterfeste-flaechen-fluss.md`.

**Status:** Nacharbeit über eine offene Stelle — vier der fünf geprüften Flächen sind sauber
behoben, die fünfte (Kopfumbruch) ist eine hinnehmbare, sogar begrüßenswerte Änderung; die
Zusatzfrage zu R-3 beantworte ich mit **Nacharbeit nötig**, nicht mit „Meßsatz anpassen".

---

## 0. Aufbau, eigen und unabhängig

Eigener Wegwerfaufbau in einem Unterordner mit Aufgabennummer
(`.../scratchpad/t338-visual-qa/`), **nicht** T-334s Messverzeichnis als Quelle der Wahrheit
übernommen — nur seine Attrappe (`stub-api.mjs`, dieselbe erfundene Datenmenge: 60 Todos,
80 Buchungen, 12 Board-Spalten, 30 Exportgruppen, 40 Protokollzeilen, zwei Anhänge an jedem Todo)
als **Datenquelle** wiederverwendet, mit eigenem Port und eigenem Token (`18938` /
`messung-t338` statt `18912`/`messung-t334`) — geprüft und geurteilt wurde selbst, mit eigenem
Playwright-Treiber (`qa-run.mjs`, `qa-run2.mjs`, `qa-run3.mjs`, `qa-run4.mjs`), eigenen
Screenshots, eigenen Messungen im Browser.

- Attrappe: `127.0.0.1:18938`. Entwicklungsserver `apps/web`: `127.0.0.1:5321`
  (`VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN`, `--port 5321 --strictPort`, nicht der feste
  `5173`-Vorgabewert aus `vite.config.ts`).
- **`127.0.0.1:17843` und `:17844` wurden zu keinem Zeitpunkt gebunden.** `ss -ltn` vor dem Lauf:
  frei (kein Treffer auf 5321/18938 oder 17843/17844). Nach Abschluss: beide eigenen Prozesse
  über ihre PID gezielt beendet (`kill <pid>`, ermittelt über `ss -ltnp` an genau den beiden
  eigenen Ports — kein fremder Prozeß angefaßt), `ss -ltn` danach ohne Treffer auf 5321 und
  18938. Keine Waise zurückgelassen.
- Gestaltung/Dichte über `document.documentElement.setAttribute('data-design-theme'|'data-theme'|'data-density', …)`
  gesetzt, wie in T-329/T-334.
- Keine Datei unter `tests/**` oder `apps/**` angefaßt. Ein einziger kleiner Eingriff in die
  kopierte Attrappe: Portnummer, Token und `origin: "manual"` → `"user"` (gültiger Aufzählungswert;
  betraf nur ein Anzeigefeld, kein Fach-Ergebnis).

**Bekannter Nebenfund, kein Befund dieser Aufgabe:** Die React-Konsole meldet doppelte Schlüssel
(`todo-0|2026-09-13` u. ä.) auf dem Dashboard — ein Artefakt der wiederverwendeten Attrappe
(`ENTRIES`/`GROUPS` erzeugen bei diesem Datenumfang zufällig gleiche Todo/Tag-Kombinationen je
Tag), keine Eigenschaft der echten Fachlogik. Nicht weiterverfolgt.

---

## 1. Kanban-Kopf, 960 bis 1100 px — behoben, gemessen und im Bild bestätigt

Eigene Messung an 13 Breiten (1440 bis 831), `.screen__header`-Höhe / `.grow`-Breite /
`.screen__actions`-Breite / Sichtbarkeit von „Spalten verwalten":

| Breite | Kopfhöhe | `.grow` | `.screen__actions` | „Spalten verwalten" sichtbar | Kopf umgebrochen |
|---|---|---|---|---|---|
| 1440 | 95,8 | 340,7 | 785,3 | ja | nein |
| 1280 | 158,8 | 180,7 | 785,3 | ja | nein |
| 1200 | 129,8 | 902 | 785,3 | ja | ja |
| 1100 | 129,8 | 802 | 785,3 | ja | ja |
| 1087 | 129,8 | 789 | 785,3 | ja | ja |
| 1067 | 169,8 | 769 | 769 | ja | ja |
| 1040 | 169,8 | 742 | 742 | ja | ja |
| 1024 | 169,8 | 726 | 726 | ja | ja |
| 1000 | 169,8 | 702 | 702 | ja | ja |
| 992 | 169,8 | 694 | 694 | ja | ja |
| 960 | 169,8 | 662 | 662 | ja | ja |
| 900 | 186,3 | 602 | 602 | ja | ja |
| 831 | 129,8 | 789 | 785,3 | ja | ja |

`.grow` fällt **an keiner** der 13 Breiten auf 0 — der vorherige Zusammenbruch in
Ein-Wort-Zeilen (T-329 Befund V1) ist weg. Im Bild (`shots/board-1024x800.png`,
`shots/board-960x800.png`, `shots/board-900x800.png`, `shots/board-831x800.png`): Titel „Kanban"
steht immer vollständig, Erklärsatz bricht sauber in normale Zeilen, „Spalten verwalten" ist an
**jeder** geprüften Breite vollständig innerhalb des Fensters, nicht abgeschnitten — auch nicht
bei 960 px, wo T-334 den eigenen Zusatzbefund (89 px Überhang) meldet. **Behoben, bestätigt.**

**Eine Nuance, die T-334s eigene Tabelle nicht zeigt und die kein neuer Mangel ist:** Die
Kopfhöhe ist zwischen 1100 und 831 px **nicht** durchgehend 129,8 px, wie T-334s Stichprobe nahelegt.
Zwischen 1067 und 960 px steht der „Erledigte einblenden"-Umschalter über dem Knopf „Spalten
verwalten" (zwei eigene Zeilen **innerhalb** der Aktionsgruppe, Kopf 169,8 px hoch), bei 1087 px
und bei 831 px stehen beide nebeneinander (129,8 px) — bei 831 px, weil dort die Seitenleiste zur
Bandnavigation wird und dem Inhalt mehr Breite gibt. Bei 900 px bricht der Erklärtext des
Umschalters zusätzlich um (186,3 px). Alle vier Zustände sind im Bild sauber, lesbar, ohne
Übereinanderliegen — das ist kein Befund, nur eine Klarstellung: „129,8 px durchgehend" war
T-334s Stichprobe, nicht die volle Kurve.

---

## 2. Zeiterfassung bei 1000 × 700 — behoben

`.time-layout__main` (124,8–1986,5) und `.time-layout__side` (2002,5–5291) liegen **vollständig
hintereinander**, keine Überlappung (`verticalOverlapPx: 0`, vorher laut T-334 1578 px). Im Bild
(`shots/time-1000x700.png`): Suchfeld, Kacheln, Todo-Zeilen stehen sauber untereinander, kein
Text auf Text. Der Rahmen (`.app__main`) läuft dabei nicht (`648/648`) — R-2 „aus zwei
Laufbereichen wird einer" greift wie vorgesehen. **Behoben, bestätigt.**

---

## 3. Dashboard, Export, Protokoll, Einstellungen bei 1280 — behoben, Zahlen decken sich fast auf die Nachkommastelle mit T-334

| Fläche | eigene Messung | T-334 gemeldet |
|---|---|---|
| Dashboard, Karte „Timer" | 169,6 / 168 / 168 | 170 / 168 / 168 |
| Export, „Vorlage und Rundung" | 352,1 / 350 / 350 | 352 / 350 / 350 |
| Einstellungen „Daten", Karte 1 | 176 / 174 / 174 | 176 / 174 / 174 |
| Einstellungen „Daten", Karte 2 | 176 / 174 / 174 | 176 / 174 / 174 |
| Einstellungen „Daten", Karte 3 | 402,1 / 400 / 400 | 402 / 400 / 400 |
| Einstellungen „Daten", Laufbereich | 786 / 671 | 786 / 671 |

Unabhängig mit eigenem Aufbau reproduziert — das ist die stärkste Art von Bestätigung, die eine
Zahl bekommen kann. Im Bild (`shots/dashboard-1280x820.png`, `shots/export-1280x820.png`,
`shots/exportaudit-1280x820.png`, `shots/settings-daten-1280x820.png`): jede Karte zeigt ihren
vollständigen Inhalt — die Timer-Karte mit Anzeige und „Starten"-Knopf, die drei Daten-Karten mit
Text und Knöpfen, die Legende des Protokolls mit allen drei Ereignisdefinitionen.

**Besonders geprüft: der Base64-Hinweis.** Er steht jetzt vollständig und lesbar da: „Die
Exportdatei enthält lesbare Kundennotizen. Base64 ist eine Kodierung, keine Verschlüsselung — wer
die Datei öffnen kann, kann sie lesen." — zwei Zeilen, mit Schloss-Symbol, volle Kartenbreite,
nicht abgeschnitten (`shots/export-1280x820.png`). Vorher war die Karte 67 px hoch und der Satz
unerreichbar; das ist genau die von der Spezifikation (B-6.1 Punkt 1) verlangte Sichtbarkeit „in
der Ansicht, nicht in einem Hilfetext" — jetzt eingelöst. **Behoben, bestätigt.**

---

## 4. Rückfrage vor dem Öffnen einer Datei, `glass` und `liquid-glass` — behoben

`.scrim` liegt in **allen drei** geprüften Gestaltungen (klassisch, glass, liquid-glass) bei
`(0,0)` mit `1280 × 820` — deckungsgleich mit dem Fenster, nicht mit einer Karte. Nach einem
Rollversuch am dahinterliegenden Laufbereich bleibt die Position **identisch** (`(0,0)`,
`1280 × 820`) — das Portal rollt nicht mit, wie zugesagt.

Im Bild (`shots/attach-dialog-glass.png`): Titel „Diese Datei wird geöffnet", Dateiname
`angebot-messung.pdf`, vollständiger Pfad `/home/messung/unterlagen/angebot-messung.pdf`, Endung
`pdf`, beide Knöpfe „Abbrechen"/„Öffnen" **vollständig im Fenster**, nicht abgeschnitten — vorher
war „Öffnen" laut T-334 außerhalb des sichtbaren Bereichs (644 × 298 bei (265,364)). **Behoben,
bestätigt**, auch im dunklen Glas-Thema mit `backdrop-filter` auf den Karten dahinter.

---

## 5. Kopfumbruch unterhalb ~1067 px — Verbesserung, kein Befund

T-334 gibt diese Frage ausdrücklich an mich ab: Ist das Wandern der Aktionen unter den Titel eine
Verbesserung, ein hinnehmbarer Preis oder ein Befund?

**Antwort: Verbesserung.** Im Vergleich zum vorherigen Zustand (Titel auf „K" gequetscht, Erklärsatz
in zwanzig Ein-Wort-Zeilen, Knopf „Spalten verwalten" bei 960 px unsichtbar) ist ein Kopf, der bei
960–1067 px in zwei oder drei geordnete Zeilen umbricht und dabei **jederzeit vollständig lesbar
und bedienbar** bleibt, eindeutig besser — nicht nur „kein Rückschritt". Die Umbruchstufen selbst
(einzeilig → Aktionsgruppe umgebrochen → Erklärtext des Umschalters zusätzlich umgebrochen) sind
im Bild sauber und ohne Übereinanderliegen. Einziger kosmetischer Wermutstropfen: Die Kopfhöhe
springt nicht monoton mit der Fensterbreite (1200 px: 129,8; 1067 px: 169,8; 831 px wieder 129,8,
weil dort die Seitenleiste zum Band wird und Platz freigibt) — das fällt nur beim Durchfahren aller
Breiten auf, nicht im Alltag, und ist **niedrig**, kein Freigabehindernis.

---

## 6. Die offene Frage — R-3-Rückfall oder kaputtes Layout?

**Kurz: beide Messungen stimmen, aber sie messen zwei verschiedene Dinge — und nur eine davon ist
harmlos.**

### 6.1 Nachgestellt: die zehn A2-Verstöße aus T-330

Mit der eigenen Attrappe (andere Datenmenge als der e2e-Vorrat, gleiche Bauform der Ansichten)
an denselben drei Größen:

| Größe | Ansicht | `.app__main` Höhe (scroll/klient) | Verstoß |
|---|---|---|---|
| 960×640 | board | 588/588 | **keiner** — hier hat T-334s V1-Behebung offenbar mitgewirkt |
| 831×640 | todos | 420/415 | ja, 5 px |
| 831×640 | board | 415/415 | keiner |
| 640×480 | board | 342/255 | ja, 87 px |
| 640×480 | todos | 529/255 | ja, 274 px — **zeichengleich mit T-330s eigener Zahl** |
| 640×480 | bookings | 476/255 | ja, 221 px — **zeichengleich mit T-330** |
| 640×480 | exportAudit | 363/255 | ja, 108 px — **zeichengleich mit T-330** |
| 640×480 | todo (Detail) | 255/255 | keiner (bei mir, mit eigenem Todo) |

Die **exakte Übereinstimmung** dreier Zahlen mit T-330s ganz anderem Datenvorrat (todos 274,
bookings 221, exportAudit 108) ist selbst ein Befund: Sie zeigt, dass die Überschreitung **nicht**
von der Menge der Todos/Buchungen abhängt, sondern **ausschließlich vom festen Kopf** — Titel,
Filterleiste mit ihren Feldern (Status/Pool/Tags/Frist/Ordnung), Umschalter. Das ist genau die
Fehlerfamilie von Befund V1, nur an anderen Ansichten und noch nicht behoben.

### 6.2 Im Bild: geordnet, aber zur falschen Zeit

`shots/r3-todos-640x480.png`: Bei 640×480 füllt der feste Kopf der Todo-Liste (Bandnavigation,
Suchfeld/Timer-Zeile, Titel, **fünf Filterfelder in eigenen Zeilen**, Umschalter) das gesamte
Fenster — **keine einzige Todo-Zeile ist ohne Rollen sichtbar.** `shots/r3-todos-640x480-scrolled-end.png`
zeigt: Nach dem Rollen ans Ende ist die erste Todo-Zeile erreichbar, nichts überlappt, kein Text
liegt auf Text, die globale Kopfzeile (Marke, Bandnavigation) bleibt stehen (sie liegt außerhalb
von `.app__main`). Dasselbe Bild bei `shots/r3-board-640x480.png` /
`-scrolled-end.png`: geordnet, ein Bildlauf, nichts überlappt, aber wieder ist beim Öffnen der
Ansicht **keine einzige Karte** ohne Rollen zu sehen.

**Das ist in der Anschauung nicht „kaputt" im Sinn von übereinanderliegendem Text oder zwei
Bildlaufleisten** — es ist ein einziger, sauberer Bildlauf, der Kopf wandert mit hinaus, wie
R-3 es beschreibt. Aber: Diese fünf Ansichten (todos, board bei 640×480, bookings, exportAudit,
todos bei 831×640 knapp) liegen **innerhalb** des Bereichs, den `docs/design/fensterfeste-flaechen.md`
Abschnitt 7.1 ausdrücklich als „getragen, ohne Abstriche" (ab 960×640) beziehungsweise „getragen im
Browserbetrieb" (bis 640×480) führt — und Abschnitt 9, Zusicherung A2, sagt wörtlich: „Gilt nur im
getragenen Bereich" — das heißt, **innerhalb** dieses Bereichs soll der Rahmen **nichts** zu laufen
haben. Der Vergleich mit 1280×480 (**gleiche** Höhe, aber breit) ist der Beleg: Dort meldet T-330
**keinen einzigen** A2-Verstoß. Nur wenn die **Breite** ebenfalls unter etwa 960–1090 px fällt,
zwingt die umbrechende Filterleiste den Kopf über die verfügbare Höhe hinaus. Die Ursache ist also
**breitenbedingt**, nicht höhenbedingt — R-3 ist aber als Regel für ein **niedriges Fenster**
formuliert (Abschnitt 7.2: „Wird das Fenster so niedrig …"), nicht für ein schmales. Ein
Rückfallmechanismus, der eigentlich für zu wenig **Höhe** gedacht ist, wird hier durch zu wenig
**Breite** ausgelöst — dieselbe Ursache wie bei V1, nur an einer anderen Stelle (Filterleisten von
Todos/Buchungen/Protokoll statt Kanban-Kopf) und noch nicht behoben.

### 6.3 T-334s eigener Fall (Einstellungen, 1024×640) ist ein anderer, harmloserer Fall

Nachgemessen (`shots/r3-settings-1024x640-full.png`): Hier überläuft **nicht** `.app__main`
(588/588, **kein** A2-Verstoß), sondern eine Ebene tiefer: `.screen__body--frame` selbst
(577/515, 62 px in meinem Aufbau — T-334 maß 86 px mit anderen Daten, gleiches Prinzip) nimmt den
Überschuss der acht-teiligen Bereichsschiene auf, weil es selbst `overflow-y: auto` trägt. Der
**Laufbereich** (`.settings-panel`, 960/491) läuft davon unberührt weiter wie immer — das ist sein
normaler Zustand, keine Fallback-Erscheinung.

Im Bild: Die Bereichsschiene wird unten abgeschnitten (der achte Eintrag „Arbeitsplatz" ist nicht
zu sehen, nur „Outlook-Add-in" ist zur Hälfte sichtbar), und der Bereichsinhalt zeigt zwei volle
Karten plus den Rand einer dritten. **Das ist ein anderer Mechanismus als bei todos/board/bookings/
exportAudit** — hier bleibt `.app__main` sauber, und der Rückfall bleibt lokal auf die
Einstellungen-Fläche beschränkt, genau wie T-322 4.11 es für die Bereichsschiene vorsieht.
Funktional bleibt „Arbeitsplatz" über Tab-Fokus erreichbar (der Browser rollt ein fokussiertes
Element automatisch in Sicht, auch über verschachtelte Bildlaufkästen hinweg); über das Mausrad
allein ist es nur erreichbar, wenn der Zeiger über der schmalen Schiene selbst steht — steht er
über dem breiteren Bereichsinhalt daneben, fängt dessen eigenes `overscroll-behavior: contain`
das Rad ab, bevor es den Rahmen erreicht (nicht selbst gemessen, aus dem Quelltext gefolgert;
**niedrig**, eigener Befund, nicht Gegenstand dieser Frage).

**T-334s Einschätzung „das ist R-3, und das ist richtig" trifft für diesen einen Fall zu** — er
verletzt A2 nicht, bleibt lokal, nichts wird unerreichbar. Sie beantwortet aber **nicht** die Frage
für die zehn e2e-Verstöße: Die sind ein anderer, allgemeinerer Fall, bei dem tatsächlich der
**Rahmen** (`.app__main`) und nicht nur eine innere Fläche überläuft, und zwar an einer Stelle
(960–640 px Breite), an der die Spezifikation ausdrücklich **keinen** Rückfall verspricht.

### 6.4 Antwort auf die Frage

**Für Einstellungen bei 1024×640: geordneter Rückfall, kein Befund** — Ausnahme siehe 6.3 (niedrig,
Mausrad-Erreichbarkeit des letzten Schienen-Eintrags), nicht sicherheitsrelevant.

**Für die zehn e2e-Verstöße (board, todos, bookings, exportAudit bei 960–640 px Breite): kein
Rückfall im Sinn von R-3, sondern ein noch nicht behobenes Kopfumbruch-Problem derselben
Fehlerfamilie wie V1** — die Bildschirme selbst sehen dabei nicht zerstört aus (ein sauberer
Bildlauf, kein Übereinanderliegen), aber sie widersprechen der eigenen Zusage der
Spezifikation, dass der Rahmen im „getragenen" Bereich (960×640 bis 640×480) **nichts** zu laufen
hat. Der e2e-Meßsatz mißt hier richtig; er sollte **nicht** gelockert werden. Die Filterleisten von
Todos, Buchungen und Protokoll (und der Board-Kopf bei genau 640×480) brauchen dieselbe Behandlung,
die der Kanban-Kopf in T-334 bekommen hat — vermutlich `flex-wrap` an der Filterleiste selbst statt
am äußeren `.screen__headline`, aber das root-caust nicht ich; das ist Sache von frontend-dev.

---

## 7. Zusammenfassung der Befunde

`apps/web/src/features/todos/TodoListScreen.tsx` (Filterleiste)  hoch  Bei 960–640 px Breite
zwingt die vertikal umbrechende Filterleiste (Status/Pool/Tags/Frist/Ordnung je eigene Zeile) den
festen Kopf über die verfügbare Rahmenhöhe, wodurch `.app__main` selbst zu laufen beginnt
(A2-Verstoß, exakt reproduziert: 274 px bei 640×480, 5 px bei 831×640). Erwartung: `.app__main`
läuft im „getragenen" Bereich (960×640 bis 640×480) laut Spezifikation Abschnitt 7.1/9 nicht.
Konkreter Fix: dieselbe Behandlung wie am Kanban-Kopf (T-334, Abschnitt 3) — der Filterleiste
selbst erlauben zu schrumpfen/umzubrechen, bevor der gesamte Kopf über die Rahmenhöhe wächst.

`apps/web/src/features/bookings/BookingsScreen.tsx` (Filterleiste)  hoch  Dieselbe Ursache,
221 px Überlauf bei 640×480 (exakt wie von T-330 gemessen, unabhängig vom Datenvorrat). Erwartung
und Fix wie oben.

`apps/web/src/features/export/ExportAuditScreen.tsx` (Filterleiste „Vorgang"/„Exportlauf")  hoch
108 px Überlauf bei 640×480 (exakt wie T-330). Erwartung und Fix wie oben.

`apps/web/src/features/board/BoardScreen.tsx` (Kopf, verbleibender Fall bei genau 640×480)  mittel
87 px Überlauf bei 640×480, obwohl der 960–1100-px-Bereich (Abschnitt 1) jetzt sauber ist — der
Kopf selbst braucht bei dieser einen Randgröße noch etwas mehr Nachgeben. Erwartung: kein
A2-Verstoß im getragenen Bereich. Fix: dieselbe Prüfung wie oben, nur für die kleinste getragene
Größe nachgezogen.

`apps/web/src/features/settings/SettingsScreen.tsx` (`.settings-rail` im inneren Rückfall)
niedrig  Bei sehr niedrigem Fenster (z. B. 1024×640) ist der achte Schienen-Eintrag
(„Arbeitsplatz") über das Mausrad nur erreichbar, wenn der Zeiger über der schmalen Schiene selbst
steht — über dem breiteren Bereichsinhalt fängt dessen `overscroll-behavior: contain` das Rad vorher
ab (aus dem Quelltext gefolgert, nicht mit der Maus nachgestellt). Erwartung: jeder Schienen-Eintrag
ist ohne Zielsuche mit der Maus erreichbar. Fix: Tab-Erreichbarkeit bleibt (nicht dringlich), aber
ein Hinweis an frontend-dev/ux-designer, ob die Schiene bei sehr niedrigem Fenster ihren eigenen,
kleinen Bildlauf bekommen soll statt sich den des Rahmens zu teilen.

Alle fünf ursprünglich beauftragten Punkte (Kanban-Kopf, Zeiterfassung, Dashboard/Export/Protokoll/
Einstellungen bei 1280, Rückfragedialog in glass/liquid-glass) sind **behoben und bestätigt**, drei
davon mit Zahlen, die praktisch deckungsgleich mit T-334s eigenen Messungen sind. Der Kopfumbruch
unterhalb ~1067 px ist eine Verbesserung. Die offene R-3-Frage zerfällt in zwei Antworten: der von
T-334 selbst genannte Fall (Einstellungen) ist ein harmloser, lokaler Rückfall; die zehn
e2e-Verstöße sind ein noch offener, echter Befund derselben Fehlerfamilie wie V1, an anderen
Ansichten.

---

## Freigegeben / Nacharbeit

**Nacharbeit.** Nicht wegen der fünf beauftragten Punkte — die sind sauber behoben —, sondern wegen
der vier neuen, hoch/mittel eingestuften Befunde an den Filterleisten von Todos, Buchungen,
Exportprotokoll und dem verbleibenden Board-Fall bei 640×480, die derselben Fehlerfamilie wie das
ursprüngliche Kanban-Problem (V1) angehören und dieselbe Behandlung brauchen. Der e2e-Meßsatz
(`tests/e2e/viewport-fit.spec.ts`) mißt dabei richtig und sollte nicht gelockert werden.

---

## Artefakte

Alle unter
`/tmp/claude-1000/-home-kerem-Projects-SuperTakt/e8adbe75-1e8b-4885-8205-a616c521a478/scratchpad/t338-visual-qa/`
(Wegwerfverzeichnis, nicht Teil des Bestands, nicht committet):

- `stub-api.mjs` — von T-334 übernommene, minimal angepasste Attrappe (Port, Token,
  `origin`-Wert).
- `qa-run.mjs`, `qa-run2.mjs`, `qa-run3.mjs`, `qa-run4.mjs` — eigene Playwright-Treiber.
- `results-part1.json`, `results-part2.json` — Rohmessungen.
- `shots/*.png` — rund 35 Aufnahmen: Kanban-Kopf an 9 Breiten, Zeiterfassung 1000×700, Dashboard/
  Export/Protokoll/Einstellungen bei 1280, Rückfragedialog in drei Gestaltungen (vorher/nach
  Rollversuch), sechs R-3-Fälle bei 960×640/831×640/640×480 (jeweils vorher und ans Ende gerollt),
  Einstellungen bei 1024×640.

Keine Datei außerhalb dieses Wegwerfverzeichnisses und dieses Berichts wurde angefaßt. Beide
eigenen Prozesse (Web-Entwicklungsserver 5321, Attrappe 18938) sauber beendet, `ss -ltn` danach
ohne Treffer.

---

```
Aufgabe: T-338 — Augenschein über die Nacharbeit aus T-334
Status: braucht Review (Nacharbeit an anderer Stelle nötig, nicht an den fünf beauftragten Punkten)
Artefakte: .claude/team/reports/T-338-visual-qa.md; Meßaufbau/Screenshots im Wegwerfverzeichnis
  (siehe Abschnitt „Artefakte" oben), nicht committet
Zusammenfassung: Alle fünf beauftragten Flächen aus T-334 sind im eigenen, unabhängigen Aufbau
  bestätigt behoben — Kanban-Kopf zerfällt bei keiner Breite zwischen 831 und 1440 px mehr,
  „Spalten verwalten" ist überall sichtbar; Zeiterfassung bei 1000×700 überlagert sich nicht mehr;
  Dashboard/Export/Protokoll/Einstellungen bei 1280 zeigen ihre Karten vollständig, mit Zahlen fast
  deckungsgleich zu T-334s eigenen; der Base64-Hinweis ist wieder lesbar; die Rückfrage vor dem
  Öffnen liegt in glass und liquid-glass fensterfest bei (0,0), rollt nicht mit. Der Kopfumbruch
  unterhalb ~1067 px ist eine Verbesserung. Die offene Frage zu R-3 zerfällt in zwei Antworten:
  T-334s eigener Fall (Einstellungen bei 1024×640) ist ein harmloser, lokaler Rückfall ohne
  A2-Verstoß; die zehn e2e-Verstöße bei 960–640 px Breite (board, todos, bookings, exportAudit)
  sind dagegen ein echter, noch offener Befund derselben Fehlerfamilie wie das ursprüngliche
  Kanban-Problem — reproduziert mit eigenem Datenvorrat, teils zahlengleich mit T-330s Messung, was
  zeigt, dass die feste Filterleiste und nicht die Datenmenge die Ursache ist.
Annahmen: Attrappe von T-334 übernommen (Port/Token/ein Enum-Wert angepaßt) statt neu geschrieben —
  spart Zeit, bindet die Aussagekraft an dieselbe Datengrundlage, die T-334 schon für die fünf
  beauftragten Punkte benutzt hat. Der Kopfumbruch (Punkt 5) wird als Verbesserung eingestuft, nicht
  als Befund — das ist eine gestalterische Bewertung, die ui-designer bestätigen oder zurücknehmen
  kann.
Risiken: Keine sicherheitsrelevanten Funde. Der A2-Befund an vier Ansichten betrifft nur Optik und
  Bedienbarkeit im schmalen Fenster, keine Daten- oder Exportkorrektheit.
Offene Fragen: Root-Cause und Fix der Filterleisten-Umbrüche (Todos/Buchungen/Protokoll) sind
  Sache von frontend-dev, nicht von mir gemessen bis auf die Stelle. Ob die Einstellungen-Schiene
  bei sehr niedrigem Fenster einen eigenen kleinen Bildlauf bekommen soll (niedrig), ist eine Frage
  an ui-designer.
Nächster Schritt: Ein neuer, enger Auftrag an frontend-dev für die vier neuen Befunde (Todos,
  Buchungen, Exportprotokoll, Board-Randfall 640×480), mit demselben Meßsatz (`viewport-fit.spec.ts`,
  A2) als Abnahme — danach erneuter, kurzer Augenschein nur über diese vier Flächen.
```
