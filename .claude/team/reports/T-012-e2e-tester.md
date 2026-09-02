Aufgabe: T-012 — End-zu-Ende-Tests
Status: teilweise

Artefakte:
- `tests/e2e/playwright.config.ts` (neu — eigene Ausführungskonfiguration mit `globalSetup`,
  solange der Wurzel-Rahmen `playwright.config.ts` noch keinen Startbefehl kennt; Aufruf:
  `pnpm exec playwright test -c tests/e2e/playwright.config.ts`)
- `tests/e2e/support/session.ts` (feste Werte: Port, Herkunft, erfundenes Sitzungsgeheimnis,
  Testkennung `t.beispiel`, Wegwerfverzeichnisse)
- `tests/e2e/support/services.ts` (startet den echten lokalen Dienst aus dem Quelltext mit
  echtem Handshake über `stdin` und die echte Oberfläche über Vite auf Port 5173 — kein
  Attrappen-Server, keine Musterdaten)
- `tests/e2e/support/global-setup.ts` (hängt `services.ts` in Playwright ein, liefert die
  Abbaufunktion zurück)
- `tests/e2e/support/api.ts` (dünner Zugang zum Dienst für Vorbereitung und Tatsachen, die die
  Oberfläche nicht in prüfbarer Form zeigt — z. B. `exportCount`)
- `tests/e2e/support/nav.ts` (Adressen aus `app/router.ts` wörtlich übernommen)
- `tests/e2e/export-end-to-end.spec.ts`
- `tests/e2e/note-separation.spec.ts`
- `tests/e2e/export-mixed-status-and-billing.spec.ts`
- `tests/e2e/todo-revival.spec.ts`
- `tests/e2e/tags-folders.spec.ts`
- `tests/fixtures/{todos,buchungen,tags,vorlagen,emails,exporte,texte}/` (Verzeichnisstruktur laut
  `docs/testplan.md` angelegt; noch ohne statische Dateien — meine Fälle erzeugen ihre Daten mit
  laufzeit-eindeutigen Markern über die API, genau wie der Testplan es für Zeitangaben empfiehlt.
  Kein Fall dieses Berichts hätte von einer statischen Fixture-Datei profitiert; sobald ein Fall
  eine feste goldene Datei braucht — etwa `exporte/erwartet-standardvorlage-happy-path.json` für
  einen künftigen byte-genauen Vergleich —, gehört sie hierhin.)
- dieser Bericht

**Zahlen, wie verlangt, getrennt:**

- **Fälle: 25** (siehe Tabelle unten — Einzelszenarien, nicht Playwright-`test()`-Blöcke; mehrere
  Szenarien teilen sich teils eine Datei)
- **Bestanden: 14**
- **Nicht gelaufen: 11**

Zusätzlich, technisch genauer: 12 Playwright-`test()`-Fälle in 5 Dateien, alle 12 grün im
letzten vollständigen Lauf (`12 passed (15.3s)`, keine Wiederholung nötig). Die 14 "bestanden"
oben verteilen sich auf diese 12 `test()`-Blöcke (manche decken mehr als ein benanntes Szenario
ab, etwa TP-EXPORT-01 zusammen mit dem TP-ROUND-07-Spotcheck und TP-B64-10 in einem Lauf).

---

## Vorbereitung

`pnpm exec playwright install chromium` war bereits ausgeführt (`~/.cache/ms-playwright` enthält
`chromium-1234` und `chromium_headless_shell-1234`). **Nichts für den Auftraggeber zu tun.**

Die Anwendung lässt sich ohne Tauri fahren, genau wie T-022 es vorgezeichnet hat: der lokale
Dienst aus dem Quelltext mit einem erfundenen Sitzungsgeheimnis über `stdin` (zwei Zeilen:
Geheimnis, dann `t.beispiel`), Vite mit `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN` auf Port 5173.
`services.ts` tut genau das und nichts, was die Oberfläche nicht auch von einer echten Hülle
bekäme. `XDG_DATA_HOME` zeigt auf `$TMPDIR/takt-e2e-data`, damit kein Lauf an
`~/.local/share/takt/` rührt.

**Umgebungsbefund, der jeden Lauf betrifft:** Diese Maschine führt mehrere Team-Agenten
gleichzeitig aus (Builds, Mutationstests, weitere Playwright- und Prüfpfad-Läufe). Der Port des
Dienstes ist im Code fest verdrahtet (`DEFAULT_PORT`, B-1.5) — kein Ausweichen möglich, per
Absicht. Ein voller Lauf ist mir einmal mit `EADDRINUSE` nach 5 Versuchen fehlgeschlagen, weil ein
anderer Prozess den Port kurzzeitig belegte; eine Sekunde später war er frei. Ich habe die
Wiederholversuche in `services.ts` von 5 auf 8 angehoben und in `playwright.config.ts`
`retries: 1` sowie großzügigere Zeitgrenzen (`expect: 15s`, `timeout: 60s` statt 8s/45s) gesetzt.
Das ist keine Vertuschung von Unzuverlässigkeit der Anwendung: Jeder meiner 12 Fälle lief in
Einzelläufen zuverlässig grün; nur beim allerersten vollständigen Lauf aller Dateien zusammen
brauchte einer (TP-NOTE-01) einen zweiten Versuch, weil die Maschine zu diesem Zeitpunkt sichtbar
ausgelastet war. Playwright meldet einen solchen Fall ausdrücklich als „flaky", nicht als „passed"
— ich habe nichts daran geändert, um das zu verstecken.

---

## Die 25 Fälle im Einzelnen

| # | Fall | Bezug | Ergebnis | Datei |
|---|---|---|---|---|
| 1 | Export Ende-zu-Ende: mehrere offene Buchungen, Export ausführen, JSON prüfen (Struktur der Standardvorlage `Call`/`Zeit`/`Notiz`/`WindowsUser`, Rundung über die Tagessumme E-020, Base64 über UTF-8, `WindowsUser` gesetzt), danach zweiter Lauf ohne erneute Ausgabe | TP-EXPORT-01/02/03, TP-B64-10 | **bestanden** | `export-end-to-end.spec.ts` |
| 2 | Darin: 16-Minuten-Buchung isoliert, TP-ROUND-07-Unterscheidungsfall im echten Lauf sichtbar (0,50, nicht 0,25) | TP-ROUND-07-Spotcheck | **bestanden** | `export-end-to-end.spec.ts` |
| 3 | Notiz-Trennung: Vermerk ist strukturell nicht als Feldquelle wählbar — live in der Quellenauswahl von S-14 geprüft, nicht nur aus dem Quelltext gelesen | TP-NOTE-01 | **bestanden** | `note-separation.spec.ts` |
| 4 | Notiz-Trennung, Standardvorlage (base64): Vermerk-Marker erscheint nirgends — weder Klartext noch eigene Base64-Form —, weder in der S-14-Vorschau noch in der tatsächlichen Exportdatei; Leistungsmarker per Base64-Dekodierung des `Notiz`-Feldes nachgewiesen | TP-NOTE-02, TP-NOTE-03 | **bestanden** | `note-separation.spec.ts` |
| 5 | Notiz-Trennung, abweichende Vorlage (`roh`): dieselbe doppelte Suche, Leistung diesmal im Klartext in der Datei | TP-NOTE-02, TP-NOTE-03, R-06 | **bestanden** | `note-separation.spec.ts` |
| 6 | Notiz-Trennung, Vorlage mit allen zwölf erlaubten Quellenpfaden gleichzeitig: Vermerk-Marker erscheint auch hier nirgends | TP-NOTE-02, R-06 | **bestanden** | `note-separation.spec.ts` |
| 7 | Erledigtes Todo wiederbeleben, Startpunkt S-03 (Todo-Detailansicht): Timer starten hebt „Erledigt" auf, Statusspalte laut API unverändert | I-05, TP-TIMER-01/02, E-023 | **bestanden** | `todo-revival.spec.ts` |
| 8 | Startpunkt S-04 (Kanban-Karte): Kennzeichen wechselt zu „Erledigt aufgehoben", **die Karte bleibt in ihrer Spalte** (per API bestätigt) | I-05, TP-KANBAN-05/06-Geist, E-023 | **bestanden** | `todo-revival.spec.ts` |
| 9 | Startpunkt S-02 (Todo-Liste, Zeilenaktion, E-027): Zeile bleibt stehen, Kennzeichen fällt | I-05 | **bestanden** | `todo-revival.spec.ts` |
| 10 | Startpunkt S-01 (Dashboard) | I-05 | **nicht gelaufen** | — |
| 11 | Startpunkt S-05 (Zeiterfassung) | I-05 | **nicht gelaufen** | — |
| 12 | Startpunkt S-12 (Add-in) | I-05, A-10.9 | **nicht gelaufen** (kein Office.js-Host erreichbar, siehe unten) | — |
| 13 | Exportstatus an allen 19 aus T-005/T-016 benannten Orten, systematisch mit derselben Buchung abgeglichen | TP-EXPST-09 | **nicht gelaufen** als eigener, vollständiger Fall (siehe Begründung unten) | — |
| 14 | Gemischter Exportstatus in einer Tagesgruppe: eine von drei Buchungen aus dem Lauf ausgeschlossen, Gruppenwert rechnet sofort neu (0,50 → 0,25), nach dem Lauf sind genau zwei von drei exportiert, die verbliebene bildet allein ihre neue Tagesgruppe | Abschnitt 9a, E-020, E-031 | **bestanden** | `export-mixed-status-and-billing.spec.ts` |
| 15 | „Nicht abrechnen" (E-047): Status danach `exported`, **Zähler bleibt 0**, Buchung verschwindet aus der Exportauswahl, Protokoll führt den eigenen Ereignistyp `not_billed` | E-047 | **bestanden** | `export-mixed-status-and-billing.spec.ts` |
| 16 | Gesperrte Tagesgruppe (E-034): fehlt die Leistung, ist die Gruppe nicht exportierbar (Kontrollkästchen deaktiviert, Grund sichtbar), der übrige Export läuft trotzdem, die Gruppe bleibt offen | E-034 | **bestanden** | `export-mixed-status-and-billing.spec.ts` |
| 17 | T-020, Fall 1: Escape schließt die Sperrmeldung der Hülle nicht | T-020 | **nicht gelaufen** (siehe Begründung unten) | — |
| 18 | T-020, Fall 2: Tabulator verlässt die Sperrmeldung nicht | T-020 | **nicht gelaufen** | — |
| 19 | T-020, Fall 3: „Datenordner allein" erzeugt kein Fehlerband | T-020 | **nicht gelaufen** | — |
| 20 | Tag-Ordner vier Ebenen tief: anlegen, über die Oberfläche bis Ebene 4 (Ordner) bzw. 5 (Tag darin) navigieren | A-4.2 bis A-4.4 | **bestanden** | `tags-folders.spec.ts` |
| 21 | Zyklus wird abgelehnt: ein Ordner unter seinen eigenen Enkel bzw. unter sich selbst verschieben — `409 tag_folder_cycle`, direkt gegen den Dienst geprüft; ein regulärer Zug gelingt weiterhin | A-4.6 | **bestanden** | `tags-folders.spec.ts` |
| 22 | Zyklus-Ablehnung *im Verschieben-Dialog der Oberfläche* an einem Ordner mit Inhalt | A-4.6, I-08 | **nicht gelaufen wie geplant — durch einen Befund ersetzt** (siehe unten: solche Ordner lassen sich im Baum gar nicht auswählen) | `tags-folders.spec.ts` (Befund im Dateikopf dokumentiert) |
| 23 | Standard-Tags: neues Todo über die Oberfläche | A-9.5, I-01 | **nicht gelaufen** | — |
| 24 | Standard-Tags: neues Todo über das Add-in | A-9.5, A-10.9 | **nicht gelaufen** | — |
| 25 | Kanban mit echter Ziehbewegung (HTML5 Drag & Drop) zwischen Spalten; Statusspalten umkonfigurieren; Timer direkt von der Karte starten/stoppen | A-5.2, I-14, A-5.4 | **teilweise nicht gelaufen** — Timer-von-der-Karte ist in Fall 8 oben mitbelegt (Start und Stopp über die Karte); die eigentliche Ziehbewegung und die Spaltenverwaltung sind **nicht** gelaufen | `todo-revival.spec.ts` (nur der Timer-Teil) |

Der Vorlageneditor S-14 mit Vorschau ist **nicht** als eigener Fall in der Tabelle, weil er
durchgehend Werkzeug der Fälle 3 bis 6 war: drei zusätzliche Vorlagen live über die Oberfläche
angelegt (API) und ihre Vorschau tatsächlich im Browser aufgeklappt und gelesen, dazu die
Feldquellen-Auswahl im Editor selbst (Fall 3) — das deckt A-8.7 und R-17 (Vorschau und Datei
benutzen denselben Renderer) so gründlich ab, wie es dieser Auftrag verlangt. Nicht gelaufen ist
dagegen das manuelle Zusammenklicken einer Vorlage über den Editor selbst (Feldzeilen per Hand
hinzufügen, umbenennen, per Ziehen umsortieren) — meine drei Zusatzvorlagen sind per API entstanden
und wurden über die Oberfläche nur *betrachtet*, nicht *gebaut*.

---

## Warum die vier größten Lücken nicht gelaufen sind — keine Ausrede, eine Begründung

**Fall 13 (19 Orte).** Ich habe den Exportstatus an S-03 (Detailansicht, Fälle 7–9) und S-07
(Export-Ansicht, Fälle 1, 14, 16) inzident mitgeprüft — das sind 2 der 19. Für die übrigen 17
(Dashboard-Kacheln, Kanban-Kartenübersicht, S-06-Tabelle mit Filtern und Sammel-Zurücksetzung,
globale Suche, globale Navigation, Toast-Texte einzeln nachgewiesen) hätte ein eigener, robuster
Abgleichs-Testfall gebraucht, der dieselbe Buchung an jeder Stelle aufsucht und den dort
angezeigten Text mit dem tatsächlichen Status vergleicht. Das ist kein technisches Hindernis,
sondern schlicht Zeit, die in diesem Lauf zuerst in die nach Schaden priorisierten Fälle 1–3, 5–7
ging. Er gehört an die Spitze einer Folgeaufgabe.

**Fälle 17–19 (T-020).** Die drei Fälle betreffen Zustände der Tauri-Hülle selbst — die
Sperrmeldung nach `SHELL_EVENTS.serviceExited` und das Fehlerband bei einem Datenordner-Problem
ohne Token-Problem. `ShellStatus` bezieht diese Zustände über `@takt/desktop/shell`, das nur
existiert, wenn `isShellAvailable()` wahr ist — und das ist es nur innerhalb der echten
Tauri-Hülle (`tauri://localhost`). Mein Aufbau fährt bewusst *ohne* Hülle, genau wie T-022 es für
den e2e-tester vorgesehen hat (`developmentFallback()`); ohne Hülle meldet die Anwendung `no_shell`
und zeigt gar keinen der drei Zustände. Diese drei Fälle brauchen entweder einen laufenden
Tauri-Prozess im Testlauf (ein eigenes Vorhaben, vermutlich mit `tauri-driver` oder einem
WebDriver-fähigen Aufbau, den es in diesem Arbeitsbereich noch nicht gibt) oder einen
Test-Injektionspunkt für `ShellStatus`, den ich nicht anlegen darf (`apps/web/src/**` gehört nicht
mir). Ich melde sie als Befund statt sie wegzulassen: **ungeprüft, nicht bestanden.**

**Fälle 23–24 (Standard-Tags).** Über die Oberfläche wäre der Fall günstig gewesen (Todo anlegen,
Toast „Als Standard-Tag kam … hinzu" prüfen) — er fehlt schlicht aus Zeitgründen, nicht aus einem
technischen Hindernis, und gehört in den nächsten Lauf. Über das Add-in ist er dagegen strukturell
außerhalb meiner Reichweite: `apps/outlook-addin` braucht einen Office.js-Wirt (Outlook oder den
Office-Add-in-Debugger), den dieser Prüfpfad nicht mitbringt; ein Playwright-Browser allein zeigt
die Aufgabenbereichs-Seite ohne den `Office`-globalen Namensraum, und der Taskpane-Code bricht
dann früh ab.

**Fall 25 (Drag & Drop, echt).** `KanbanCard`/`KanbanColumn` reagieren auf HTML5-`dragstart`/
`dragover`/`drop`-Ereignisse mit `DataTransfer`. Playwright kann das nachbilden
(`dispatchEvent` mit einem `DataTransfer`-Objekt aus dem Browserkontext), aber ich habe es in
diesem Lauf nicht mehr geschafft; die alternative Tastaturbedienung (Strg+Pfeil) habe ich ebenfalls
nicht geprüft, obwohl sie laut Quelltext existiert (SC 2.5.7).

---

## Ein echter Befund aus dieser Aufgabe (kein Testplan-Punkt, aber ein Produktfund)

**`apps/web/src/components/TagTree.tsx`, `onClick`/`onKeyDown` je Knoten:** Ein Baumknoten mit
Kindern (jeder Ordner, der Unterordner oder Tags enthält) reagiert auf Klick **und** auf Eingabe/
Leertaste **ausschließlich** mit Auf-/Zuklappen:

```
onClick={() => {
  if (row.hasChildren) toggle(row.node.id, !isOpen);
  else onSelect(row.node);
  ...
}}
```

Dieselbe Weiche steht im Tastaturpfad. Es gibt in der ganzen Datei (261 Zeilen) keine zweite
Interaktionsmöglichkeit. **Praktische Folge:** Ein Ordner, der bereits etwas enthält, lässt sich
über den Baum nicht auswählen — und ohne Auswahl bietet `TagsScreen` weder „Umbenennen" noch
„Verschieben" noch „Löschen" für ihn an. In meinem Testfall (vier verschachtelte Ordner) konnte ich
Ebene 1 bis 3 aus genau diesem Grund nicht für den Verschieben-Dialog auswählen; ich musste auf
einen eigens angelegten *leeren* Ordner ausweichen, um den Dialog überhaupt zu erreichen (Fall 20/
22 oben). Das trifft vermutlich jeden nicht-leeren Ordner im echten Betrieb — ein Anwender könnte
also keinen befüllten Ordner umbenennen, verschieben oder löschen, ohne ihn vorher komplett zu
leeren. Das ist mein wichtigster Einzelfund dieser Aufgabe und gehört vor T-024 (Code-Review)
behoben; ich habe nichts daran geändert, weil `apps/web/src/**` nicht meine Dateihoheit ist.

---

Annahmen:
- `pnpm exec playwright test -c tests/e2e/playwright.config.ts` ist der Aufruf, den ich benutzt
  habe, weil der Wurzel-Rahmen ausdrücklich noch keinen `webServer`/`globalSetup`-Eintrag hat
  ("ein geratener Startbefehl hier wäre ein stiller Fehlstart"). Meine eigene Konfiguration unter
  `tests/e2e/playwright.config.ts` liegt vollständig in meiner Dateihoheit und ändert nichts an der
  Wurzeldatei. Ob der Orchestrator beide zusammenführt (`globalSetup` in die Wurzel verschieben,
  `pnpm test:e2e` darauf zeigen lassen) oder beide bestehen lässt, ändert an keinem Testfall etwas.
- Sitzungsgeheimnis, Windows-Benutzer (`t.beispiel`) und alle Ports sind erfunden bzw. wörtlich aus
  dem Quelltext übernommen (nie geraten) — siehe `tests/e2e/support/session.ts`.
- Wo eine Vorbedingung eine zweite Zeitbuchung oder ein zweites Todo braucht, habe ich sie über die
  API erzeugt (`tests/e2e/support/api.ts`) und nur die eigentlich zu prüfende Handlung über die
  Oberfläche ausgeführt — dieselbe Praxis, die auch die eigenen Prüfpfade der Umsetzung
  (`apps/local-api/scripts/proof-*.mjs`) verwenden, und meines Erachtens noch „End-to-End" im Sinn
  des Auftrags: die Prüfung selbst läuft immer über den Browser gegen den echten Dienst.
- `retries: 1` in `tests/e2e/playwright.config.ts` fängt Verzögerung durch die gemeinsam genutzte
  Maschine ab; ein Fall, der erst beim zweiten Versuch grün wird, gilt in meinem Bericht als
  bestanden-aber-flaky, nicht stillschweigend als sauber grün — siehe Abschnitt „Vorbereitung".
- `tests/fixtures/**` enthält bewusst noch keine statischen Dateien (siehe Artefakte oben).

Risiken:
- **Die vier größten Lücken (19 Orte, T-020, Standard-Tags, Drag & Drop) sind ungeprüft, nicht nur
  knapp geprüft.** Insbesondere T-020 deckt einen Fall ab, der laut Auftrag „still bricht, wenn
  jemand die Filterung umgeht" — genau der Fall, den niemand bemerkt, bis ein Benutzer ihn auslöst.
- **Gemeinsam genutzte Maschine.** Jeder künftige Lauf kann erneut auf den belegten Port 17843
  treffen (fest verdrahtet, kein Ausweichen per Absicht) oder unter Last einzelne `expect`-Fristen
  reißen. Die jetzt großzügigeren Fristen und `retries: 1` mildern das, beseitigen es aber nicht.
- **Der TagTree-Befund** (oben) ist ungetestet in dem Sinn, dass ich ihn nicht als eigenen,
  fehlschlagenden Testfall festgehalten habe, der bei einer Behebung automatisch grün würde —
  ich habe stattdessen meinen eigenen Testfall daran vorbeigeführt. Das ist die richtige
  Reihenfolge für einen e2e-tester (kein Produktivcode, keine Unit-Tests), aber es bedeutet, dass
  dieser Befund nur in diesem Bericht steht und nicht durch einen roten Testlauf erzwungen wird.
- **Zeitliche Überschneidung mit laufender Arbeit an `apps/local-api` und `apps/web`.** Laut
  Rückmeldung des Orchestrators arbeiten security-checker und frontend-dev parallel an
  Nachweispflichten auf den Fachrouten bzw. an zwei neuen Routen und einem vierten Anzeigezustand
  „Nicht abgerechnet" (E-050). Mein letzter vollständiger Lauf (12 von 12 grün) fand *nach* dieser
  Rückmeldung statt, gegen den zu diesem Zeitpunkt ausgecheckten Stand. Keiner meiner Fälle prüft
  eine wörtliche Badge-Beschriftung für „nicht abgerechnet" (ich prüfe bei E-047 ausschließlich über
  die API: `exportStatus`, `exportCount`, Protokollereignis, sowie das Verschwinden aus der
  Export-Auswahl) — ein Wechsel von drei auf vier Anzeigezustände sollte diesen Fall deshalb nicht
  brechen. Ein erneuter Lauf nach Abschluss dieser Arbeiten bleibt trotzdem sinnvoll.

Offene Fragen:
- Soll ich `tests/e2e/playwright.config.ts` mit dem Wurzel-Rahmen zusammenführen (der dann ein
  `globalSetup` bekäme), oder bleiben beide Dateien nebeneinander bestehen?
- Ist eine Folgeaufgabe für die vier größten Lücken vorgesehen — insbesondere die drei T-020-Fälle,
  die einen laufenden Tauri-Prozess im Testlauf brauchen (`tauri-driver` oder vergleichbar)? Ohne
  eine solche Infrastruktur bleiben sie bei jedem künftigen e2e-Lauf ungeprüft, nicht nur bei
  diesem.
- Wer nimmt den TagTree-Befund (nicht-leere Ordner nicht auswählbar) auf — direkt an frontend-dev,
  oder über T-024 (Code-Review)?

Nächster Schritt: Die vier größten Lücken in dieser Reihenfolge schließen: (1) TP-EXPST-09 über
alle 19 Orte, weil er den größten noch ungeprüften Abschnitt des Testplans betrifft; (2) echte
HTML5-Drag-&-Drop-Interaktion plus Tastaturweg im Kanban; (3) Standard-Tags über die Oberfläche
(günstig, nur Zeitmangel); (4) mit dem Orchestrator klären, ob/wie die drei T-020-Fälle ohne echte
Tauri-Hülle prüfbar gemacht werden sollen, bevor ich sie ein weiteres Mal als „nicht gelaufen"
melde. Parallel: den TagTree-Befund an frontend-dev zurückspiegeln.
