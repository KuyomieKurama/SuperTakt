Aufgabe: T-006 — Designsystem-Grundlage

Status: braucht Review — inhaltlich fertig, wartet auf die Abnahme durch den Auftraggeber (Tor vor Welle 2, E-013). Eine Entscheidung offen: Punkt 8 unter „Offene Fragen".

Artefakte:

Neu, alle unter `apps/web/`:

```
apps/web/
  README.md                          Wie die Musterseite gestartet wird, Befehle, Regeln
  package.json                       nur apps/web; Wurzel-package.json nicht angefasst
  tsconfig.json                      strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes
  vite.config.ts                     Server bindet nur auf 127.0.0.1
  index.html
  .gitignore
  pnpm-workspace.yaml                vorlaeufig, siehe „Offene Fragen" Punkt 4
  pnpm-lock.yaml                     vorlaeufig, dito
  design/DESIGNSYSTEM.md             Das Designsystem in Worten. Verbindliche Fassung.
  scripts/contrast-check.mjs         Kontrastmessung gegen tokens.css, Fehlercode bei Verstoss
  src/main.tsx
  src/styles/tokens.css              Farb-, Schrift-, Abstands-, Radien-, Schatten-, Bewegungstoken
  src/styles/base.css                Zuruecksetzen, Fokus, Bewegungsvorbehalt, Hilfsklassen
  src/styles/components.css          Alle Bausteine, kein einziger roher Farbwert
  src/styles/showcase.css            Geruest der Musterseite
  src/lib/cx.ts
  src/lib/theme.ts                   Theme-, Dichte- und Reduced-Motion-Haken
  src/components/Icon.tsx            32 Inline-SVG-Symbole, eine Familie
  src/components/Primitives.tsx      Knopf, Symbolknopf, Karte, Spinner, Skeleton,
                                     LoadingBlock, EmptyState, InlineMessage, Toolbar
  src/components/ExportStatus.tsx    Status-Etikett und Zustandspunkt, drei Zustaende
  src/components/Tag.tsx             Tag-Chip und Pfadanzeige
  src/components/TagTree.tsx         Baumansicht, WAI-ARIA-Muster „Tree View"
  src/components/BookingTable.tsx    Buchungstabelle mit Auswahl, Sortierung, Zeilenmenue
  src/components/Kanban.tsx          Spalte, Karte, Exportstand-Zusammenfassung
  src/components/Timer.tsx           Timer-Anzeige und Wiederaufnahme-Hinweis (I-05)
  src/components/NoteField.tsx       Die zwei Notiz-Feldarten (R-08)
  src/components/Menu.tsx            Auswahlliste und Kontextmenue
  src/components/ConfirmDialog.tsx   Bestaetigungsdialog mit Fokusfalle
  src/components/FilterBar.tsx       Filterleiste, Suchfeld, Auswahlliste
  src/showcase/Showcase.tsx          Musterseite: Kopfleiste, Navigation, neun Abschnitte
  src/showcase/Section.tsx
  src/showcase/FoundationsSection.tsx
  src/showcase/ExportStatusSection.tsx
  src/showcase/DataSection.tsx
  src/showcase/BoardSection.tsx
  src/showcase/TimeSection.tsx
  src/showcase/NotesSection.tsx
  src/showcase/TagsSection.tsx
  src/showcase/ControlsSection.tsx
  src/showcase/InventorySection.tsx
  src/showcase/data.ts               Erfundene Beispieldaten, keine echten Call-Nummern
  .claude/team/reports/T-006-frontend-dev.md   dieser Bericht
```

Ausserhalb von `apps/web` wurde nichts geaendert.

**So sieht sich der Auftraggeber die Musterseite an:**

```bash
cd apps/web
pnpm install
pnpm dev
```

Danach `http://127.0.0.1:5173` im Browser oeffnen. Es wird **keine Rust-Toolchain** gebraucht
(E-014, R-04) — das ist reines Vite plus React. Oben rechts stehen zwei Schalter:
*Hell / Dunkel / System* und *Normal / Kompakt*. In Abschnitt 2 gibt es zusaetzlich die
**Graustufenprobe**; sie zeigt mit einem Klick, dass die drei Exportzustaende auch ohne Farbe
unterscheidbar bleiben. Alles ist mit der Tastatur bedienbar; der erste Tabulator-Halt ist die
Sprungmarke „Zum Inhalt springen".

Alternativ ohne Entwicklungsserver: `pnpm build && pnpm preview`, dann
`http://127.0.0.1:4173`.

Zusammenfassung:

Es liegt ein vollstaendiges Designsystem vor: zweistufige Farbtoken mit vollstaendiger
Definition im hellen und Neudefinition im dunklen Modus, eine auf Tabellendichte ausgelegte
Schriftskala mit 14px Grundgroesse und 4px-Abstandsraster, definierte Interaktionszustaende und
ein Komponenteninventar ueber alle 14 Ansichten. Der Exportstatus ist als wichtigster Baustein
in drei Zustaenden umgesetzt — offen, exportiert und, aus E-012 folgend, erneut offen — die
sich in sechs voneinander unabhaengigen Merkmalen unterscheiden, von denen nur eines Farbe ist.
Die Kontraste sind nicht behauptet, sondern gemessen: `scripts/contrast-check.mjs` liest die
Token-Datei und prueft 94 Farbpaare gegen WCAG 2.2 AA; derzeit fallen null durch. Das
Verwechslungsrisiko aus R-08 ist geloest, indem Todo-Notiz und Buchungsnotiz zwei sichtbar
verschiedene Feldarten mit Randschiene, Kopfband und Fussnote sind statt zweier Beschriftungen.
Die Musterseite unter `apps/web` zeigt Token und Bausteine in allen Zustaenden — normal, unter
dem Zeiger, gedrueckt, fokussiert, deaktiviert, ladend, leer und fehlerhaft — und ist damit die
Abnahmegrundlage; `pnpm typecheck` und `pnpm build` laufen fehlerfrei, es gibt keinen
`any`-Typ.

Annahmen:

1. **Grundschriftgroesse 14px statt 16px.** Takt ist laut A-13.9 und Abschnitt 17 auf Desktop
   optimiert und zeigt viele Tabellen. 16px als Grundgroesse halbiert die sichtbaren Zeilen.
   Die Wurzelgroesse bleibt bei 16px, damit Browser-Zoom, `rem`-Rechnung und die
   Schriftgroesseneinstellung des Betriebssystems unveraendert funktionieren.
2. **Kein Netzabruf fuer Schrift und Symbole.** E-001 sagt „kein Cloud-Dienst, keine
   Telemetrie". Eine Google-Schrift vom CDN waere eine Netzverbindung bei jedem Start. Deshalb
   Systemschriftstapel (Segoe zuerst, weil Windows das Primaerziel ist) und 32 selbst
   gezeichnete Inline-SVG-Symbole statt einer Icon-Bibliothek.
3. **Ein dritter Anzeigezustand fuer den Exportstatus.** A-6.9 verlangt Zweiwertigkeit. Ich
   habe sie fachlich nicht angetastet: „Erneut offen" ist fuer den Exportmotor genauso offen
   wie „Offen". Es ist eine reine Anzeigeunterscheidung innerhalb von „offen", ohne die die
   Doppelabrechnung aus R-10 in der Oberflaeche unsichtbar waere.
4. **Rose fuer „Erneut offen" und fuer destruktive Aktionen.** Beide Bedeutungen sind
   „Vorsicht, das kostet Geld oder ist nicht rueckgaengig zu machen". Das Etikett bleibt durch
   Kontur plus Schraffur von einem gefuellten Gefahrenknopf unterscheidbar.
5. **Violett ausschliesslich fuer den laufenden Timer.** Ein laufender Timer und ein
   Exportstatus stehen in derselben Zeile nebeneinander; sie duerfen nie dieselbe Farbe tragen.
6. **Zwei Zeilendichten** (40px und 32px) statt einer. Buchungsliste und Einstellungsseite
   haben unterschiedliche Ansprueche. Umgeschaltet wird ueber `[data-density]`.
7. **Dekorative Rahmen sind von SC 1.4.11 ausgenommen** und werden im Pruefskript als `exempt`
   gefuehrt, statt die Anforderung zu senken. Fuer Bedienelementgrenzen gibt es ein eigenes
   Token `--border-control`, das die 3:1 tatsaechlich erreicht.
8. **Beispieldaten sind erfunden.** Call-Nummern im Muster `CALL-2026-xxxx`, Kunden
   „Musterkunde Nord", „Beispiel GmbH", „Musterwerk AG". Keine echten Daten im Repository.

Risiken:

1. **Die Token liegen in `apps/web`, das Add-in braucht sie auch.** A-10.6 verlangt, dass sich
   das Outlook-Add-in optisch in die Hauptanwendung einfuegt; `apps/outlook-addin` gehoert aber
   dem integration-dev, der nicht aus `apps/web` importieren sollte. Ohne eine gemeinsame
   Ablage entsteht eine zweite, driftende Kopie der Farbwerte. Vorschlag unter „Offene Fragen"
   Punkt 1.
2. **Kein automatisierter Barrierefreiheitstest.** Die Zugaenglichkeit ist von Hand gebaut und
   nach Muster geprueft, aber nicht durch `axe` abgesichert. Empfehlung an unit-tester und
   e2e-tester: `@axe-core/playwright` auf der Musterseite und spaeter auf jeder Ansicht.
3. **Die 14 Ansichten sind noch nicht gebaut.** Es gibt keinen Router, keine Navigation, keine
   Datenanbindung. Das ist Welle 2 und faellt erst nach T-008 an. Die Musterseite ist eine
   Abnahmegrundlage, keine Anwendung.
4. **Ziehen und Ablegen ist bewusst minimal umgesetzt.** Die HTML5-Schnittstelle reicht fuer den
   Nachweis, nicht fuer ein komfortables Board (keine Einfuegemarke innerhalb einer Spalte, kein
   automatisches Scrollen). Fuer Welle 2 waere eine Bibliothek mit Tastaturunterstuetzung
   (`@dnd-kit`) zu bewerten — sie muss die Alternative aus SC 2.5.7 aber weiterhin selbst
   bereitstellen.
5. **Sicherheitshinweise.** Der Entwicklungs- und der Vorschauserver binden ausdruecklich nur
   auf `127.0.0.1` und sind nicht im Netz erreichbar. Es gibt keinen einzigen ausgehenden
   Netzaufruf: keine Web-Schrift, keine Icon-CDN, kein Bild, keine Telemetrie. Es liegen keine
   Zugangsdaten, keine Token und keine echten Kundendaten im Paket. Die Musterseite zeigt an
   keiner Stelle ein Add-in-Token (E-009, R-09); wenn S-13 das Token spaeter anzeigt, gilt:
   nur auf ausdrueckliche Anforderung, nie im Klartext im Ruhezustand der Oberflaeche.
6. **`--text-disabled` erreicht 3,10:1.** Das unterschreitet 4,5:1 und ist nach SC 1.4.3
   zulaessig, weil deaktivierte Bedienelemente ausgenommen sind. Sollte der UX-Reviewer das
   anders bewerten, ist der Wert eine Zeile in `tokens.css`.

Offene Fragen:

1. **Wohin gehoeren die Design-Token?** Sie liegen jetzt in `apps/web/src/styles/tokens.css`.
   Das Outlook-Add-in (A-10.6) und eine spaetere Tauri-Huelle brauchen dieselben Werte. Mein
   Vorschlag: In T-008 ein Paket `packages/ui-tokens` anlegen, das nur `tokens.css` und
   `base.css` enthaelt, und `apps/web` sowie `apps/outlook-addin` importieren daraus. Wer die
   Hoheit darueber bekommt, entscheidet der Orchestrator — ich habe es nicht selbst angelegt,
   weil `packages/**` nicht meine Datei-Hoheit ist.

2. **Formatierungsfunktionen fehlen — ich habe sie nicht nachgebaut.** Die Oberflaeche bekommt
   alle Zeiten und Zahlen als fertige Zeichenkette. Gebraucht werden, mit Besitzer zu klaeren
   (domain-dev, T-009, oder ein eigenes `packages/format`):

   | Funktion | Ergebnis | Anmerkung |
   |---|---|---|
   | `formatTimerDisplay(seconds)` | `"01:07:44"` | laufender und gestoppter Timer |
   | `formatTrackedDuration(minutes)` | `"1:07 h"` | tatsaechliche Dauer in Listen |
   | `formatBillableHours(minutes)` | `"1,25"` | **nach der Rundung aus E-008**, deutsches Dezimalkomma |
   | `formatPeriod(start, end)` | `"31.08.2026, 09:12–10:19"` | Zeitraum einer Buchung |
   | `formatDate(date)` | `"30.08.2026"` | Exportzeitpunkt am Statusetikett |

   Zusatzfrage: Soll der lokale Dienst die fertigen Zeichenketten mitliefern, oder liefert er
   Rohwerte und ein gemeinsames Paket formatiert? Ich empfehle Letzteres, damit das Add-in
   dieselbe Darstellung bekommt.

3. **Erledigt, kein Handlungsbedarf.** Ich hatte gefragt, ob das Datenmodell den dritten
   Anzeigezustand tragen kann. T-001 ist waehrend meiner Arbeit eingetroffen und beantwortet
   das: `Zeitbuchung.exportAnzahl` existiert, und der Kommentar dort nennt genau meinen Fall —
   `exportstatus === 'offen' && exportAnzahl > 0` ist der Zustand, den die Oberflaeche als
   „schon einmal exportiert" kennzeichnen muss. Abbildung in der Oberflaeche:

   | Domaene | `ExportState` in `apps/web` |
   |---|---|
   | `exportstatus: 'exportiert'` | `"exported"` |
   | `exportstatus: 'offen'`, `exportAnzahl === 0` | `"open"` |
   | `exportstatus: 'offen'`, `exportAnzahl > 0` | `"reopened"` |

   Ebenfalls aus T-001 uebernommen: `ZuruecksetzenAntrag.grund` ist ein Freitext, der ins
   Protokoll wandert. Der Bestaetigungsdialog hat dafuer jetzt ein Pflichtfeld
   „Begruendung — wird protokolliert"; ohne Eingabe bleibt der Bestaetigungsknopf gesperrt.

4. **Vorlaeufige pnpm-Dateien.** `apps/web/pnpm-workspace.yaml` und `apps/web/pnpm-lock.yaml`
   liegen nur dort, weil es an der Wurzel noch keinen Arbeitsbereich gibt. Die Workspace-Datei
   enthaelt ausschliesslich `allowBuilds: { esbuild: true }`; ohne diese Einstellung verweigert
   pnpm 11 den Bauschritt von esbuild und bricht jeden Befehl ab. In T-008 gehoert beides an
   die Wurzel, und die beiden Dateien unter `apps/web` sind zu loeschen.
   Benoetigte Abhaengigkeiten fuer die Wurzel-`package.json` beziehungsweise `apps/web`:
   `react ^19.2`, `react-dom ^19.2`, dev: `@types/react ^19.2`, `@types/react-dom ^19.2`,
   `@vitejs/plugin-react ^5.1`, `typescript ^5.9`, `vite ^7.1`. Installiert und geprueft sind
   react 19.2.8, vite 7.3.6, typescript 5.9.3.

5. **Gehoeren Farbmodus und Zeilendichte in die Einstellungen (S-09)?** Beide sind derzeit
   nur Sitzungszustand. Wenn sie dauerhaft sein sollen, braucht es zwei Felder in den
   Anwendungseinstellungen und damit einen Weg ueber den lokalen Dienst.

6. **Begriff fuer den dritten Zustand.** Ich verwende „Erneut offen". Bitte in das Glossar aus
   T-004 aufnehmen, damit Dokumentation, Oberflaeche und Tests denselben Begriff benutzen.
   Ebenso die Feldbezeichnungen „Leistungsnachweis dieser Buchung" (abrechnungsrelevant) und
   „Interne Notiz zum Todo" (bleibt in Takt).

7. **Deutsches Dezimalkomma in der Oberflaeche.** Ich zeige `1,25`, waehrend das JSON des
   Exports `1.25` als Zahl fuehrt (A-8.2). Bitte bestaetigen, dass das gewollt ist — es ist
   sprachlich richtig, koennte aber beim Abgleich mit der Exportdatei irritieren.

8. **Widerspruch zu T-005 bei der Darstellung des zurueckgesetzten Exportstatus — bitte
   entscheiden.** T-005 haelt fest: „Das Zusatzkennzeichen aus E-012 ist ein eigenes, deutlich
   anderes Zeichen neben dem Badge, kein dritter Zustand desselben Badges." Ich hatte
   unabhaengig davon einen dritten Etikettzustand gebaut. Beide Varianten erfuellen A-6.7 und
   SC 1.4.1; ich habe **beide gebaut** und auf der Musterseite in Abschnitt 2 unter „Zur
   Entscheidung" nebeneinandergestellt, damit der Auftraggeber sie vergleichen kann:

   * **Variante A (T-006):** ein Etikett „Erneut offen" mit Schraffur, Ruecklaufpfeil und
     Rautenpunkt. Ein Blick, ein Element, schwerer zu uebersehen. Einwand von T-005: kann einen
     dritten Fachzustand suggerieren.
   * **Variante B (T-005):** Etikett „Offen" plus getrenntes Zeichen „schon einmal exportiert".
     Haelt die Zweiwertigkeit aus A-6.9 auch optisch sauber. Einwand: zwei Elemente statt einem,
     mehr Breite in dichten Tabellen, leichter zu ueberlesen.

   Meine Empfehlung ist Variante A, weil der Fall aus R-10 Geld kostet und in einer Liste mit
   dreissig Zeilen auffallen muss. Die Umstellung kostet in beide Richtungen wenige Zeilen. Der
   Verlierer wird danach aus dem Quelltext entfernt, damit keine zwei Wahrheiten bleiben.

9. **Begriffe aus T-005 uebernommen.** Die Notizfelder heissen jetzt „Leistungsnotiz" und
   „Persoenliche Notiz" mit den dort formulierten Hilfetexten, statt meiner urspruenglichen
   Bezeichnungen. Die Gestaltung — Randschiene, Kopfband, unterschiedliche Schreibflaeche —
   bleibt und erfuellt genau die Forderung aus T-005 Abschnitt 5 Punkt 3.

10. **`packages/domain` verwendet deutsche Bezeichner** (`Zeitbuchung`, `Exportstatus`,
    `RundeAufViertelstunden`), waehrend CLAUDE.md „Bezeichner im Code auf Englisch" vorgibt und
    `apps/web` sich daran haelt (`ExportState`, `BookingRowData`). An der Grenze zwischen beiden
    entsteht sonst ein Uebersetzungsschicht-Flickenteppich. Das ist keine Frage an mich, sondern
    eine Entscheidung fuer den Orchestrator — ich habe meine Seite nicht angepasst, weil
    CLAUDE.md eindeutig ist.

11. **WCAG 2.2 SC 2.5.7 gilt fuer jede kuenftige Ziehbewegung.** Beim Kanban ist die Alternative
   umgesetzt. Sie fehlt noch dort, wo spaeter ebenfalls gezogen wird: Tag in Ordner verschieben
   (I-07), Ordner verschachteln (I-08) und Felder im Vorlageneditor sortieren (I-15, S-14).
   Bitte als Auflage in die jeweiligen Aufgaben aufnehmen.

Naechster Schritt:

Der Auftraggeber startet die Musterseite mit `cd apps/web && pnpm install && pnpm dev` und geht
die neun Abschnitte durch; besonders Abschnitt 2 (Exportstatus, einschliesslich
Graustufenprobe) und Abschnitt 6 (die zwei Notizfelder), weil dort die beiden inhaltlich
riskantesten Entscheidungen sichtbar werden. Die Zustandsmatrix aus T-005 ist inzwischen da und mit dem
Komponenteninventar in Abschnitt 9 abgeglichen; die einzige offene Abweichung ist Punkt 8
(zwei Varianten fuer den zurueckgesetzten Exportstatus) und braucht eine Entscheidung, keine
Nacharbeit. Nach der Abnahme ist T-008 frei — dabei bitte
Punkt 1 (Token in ein gemeinsames Paket) und Punkt 4 (pnpm-Dateien an die Wurzel) mit
erledigen, weil beides sonst zwei Wochen spaeter teurer wird.
