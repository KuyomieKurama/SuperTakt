# Takt — Designsystem

Stand: 2026-09-02. Ergebnis von Aufgabe T-006, nachgezogen in T-015 und T-018 auf die
bestätigten Begriffe und Entscheidungen. Vom Auftraggeber abgenommen.

Dieses Dokument ist zusammen mit `docs/spec.md` die verbindliche visuelle Referenz für alle
14 Ansichten. Ein Framer-Prototyp existiert nicht und wird nicht nachgereicht (E-013); damit ist
das hier Beschriebene die Referenz und nicht ein Zwischenstand bis zur Ankunft eines Prototyps.

Die lebende Fassung ist die Musterseite unter `apps/web`. Sie zeigt jeden Baustein in jedem
Zustand; die Einleitung oben auf der Seite erklärt sie ohne Vorwissen.

**Was T-015 geändert hat**

* Die beiden Textfelder heißen jetzt **Vermerk** und **Leistung** (E-016), nicht mehr
  „Persönliche Notiz“ und „Leistungsnotiz“. Die Gestaltungslösung dahinter ist geblieben und
  um zwei Merkmale verstärkt worden — Abschnitt 7.
* Der zurückgesetzte Exportstatus wird als dritter Etikettzustand gezeigt (Variante A). Die
  Gegenvariante ist aus dem Quelltext entfernt — Abschnitt 3.2.
* **Erledigt ist nicht die Kanban-Abschlussspalte.** Statusspalte und Erledigt-Kennzeichen sind
  zwei unabhängige Dinge; die Karte trägt beide getrennt — Abschnitt 3.4.

**Was T-018 geändert hat**

* **Der Exportstatus ist im Quelltext zweiwertig** (A-6.9, E-032). „Erneut offen“ bleibt als
  Darstellung, hängt aber an einem eigenen Merkmal und trägt einen eigenen Typ — Abschnitt 3.0
  und 3.1. Der Filter in der Buchungstabelle führt genau zwei Werte.
* **Die Exportvorschau gliedert nach Tagesgruppen** und lässt sich aufklappen (E-020, E-031,
  E-034) — Abschnitt 3.5.
* **Pool-Ansichten blenden erledigte Todos aus**, mit einem Schalter in der Filterleiste und
  einer je Ansicht gemerkten Wahl (E-039) — Abschnitt 3.6.
* **Begriffe nachgezogen** (E-029, E-030, E-041): „Time-Tracking-Ansicht“ heißt **Zeiterfassung**,
  „Ticket“ kommt nicht vor, und die fehlenden Beschriftungen für `time_entry.source` und
  `app_setting.theme` stehen jetzt in `src/lib/labels.ts` — Abschnitt 3.7.
* **Die Design-Token liegen in `packages/ui-tokens`** (T-008a, E-040). `base.css` bleibt in
  `apps/web`.

**Was T-020 geändert hat**

* **Die drei Zustände der Anwendungshülle haben eine Darstellung** — Startmeldung, Sperrmeldung
  und Datenordner-Hinweis. Sie lagen seit T-008b fertig in `shellState()` bereit und wurden von
  niemandem angezeigt; seit der Start ohne lesbaren Anmeldenamen abbricht, ist das der erste
  Zustand, den ein Anwender überhaupt sehen kann — Abschnitt 9.
* **Genau ein Zustand darf die Anwendung sperren**, und es ist der Ausfall des lokalen Dienstes.
  Neue Regel 9 in Abschnitt 11.
* Kein Token geändert, keine Typografie, kein Abstandsraster: Die neuen Flächen benutzen
  ausschließlich vorhandene semantische Token. Ihre 22 Kontrastpaare stehen in der Prüfliste.

**Was T-020b geändert hat**

* **Klartext und technischer Zusatz sind getrennt.** Die Hülle liefert beides einzeln; die
  Oberfläche zeigt den Zusatz unter „Für die Systembetreuung“ — Abschnitt 9.
* **Der Dienstausfall wird gemeldet**, nicht abgefragt (`SHELL_EVENTS.serviceExited`).
* **`apps/web` bezieht die Zustandsform aus `@takt/desktop`** statt sie nachzubauen. Reiner
  Typimport; im Bündel landet nichts aus `@tauri-apps/api`.

**Was T-065 geändert hat**

* **Der Farbmodus wird an genau einer Stelle eingestellt** — Einstellungen, Bereich
  „Darstellung“. Das zweite Auswahlfeld rechts oben in der Kopfleiste ist entfallen. Die
  Einstellung selbst ist unberührt: Sie liegt weiter in `app_setting.theme` (E-041), wird von
  `PreferencesContext` an das Wurzelelement geschrieben und übersteht den Neustart.
* **Die Kopfleiste trägt zwei Bereiche mit fester Rolle**: Suche links, Timer rechts. Der Timer
  sitzt in einem Fach fester Breite (`--app-header-timer-width`, 35rem). Gemessen bei 1280×820:
  Das Suchfeld ist 432px breit, ruhend wie laufend — vorher sprang es beim Timerstart von 512px
  auf 272px. Neue Regel 11.
* Kein Token geändert, keine Typografie: 376 Kontrastpaare, 0 durchgefallen.

```
pnpm install      # an der Wurzel des Arbeitsbereichs, nicht in apps/web
pnpm dev          # http://127.0.0.1:5173
pnpm --filter @takt/web contrast    # Kontrastnachweis, 376 Paare
```

---

## 1. Haltung

Takt soll wie ein professionelles B2B-SaaS-Produkt wirken: modern, reduziert, hochwertig,
informationsreich ohne Überladung (Abschnitt 15 der Spezifikation). Daraus folgen fünf
Entwurfsregeln, die alles Weitere erklären.

**Eine Markenfarbe, viele Signalfarben.** Es gibt genau ein Blau für Primäraktion, Auswahl und
Fokus. Alle anderen Farben sind reserviert: Bernstein, Grün und Rosé gehören dem Exportstatus,
Violett gehört dem laufenden Timer, Rosé zusätzlich der Gefahr. Wer eine Farbe frei verwenden
möchte, nimmt keine — er nimmt Abstand, Gewicht oder Position.

**Dichte vor Großzügigkeit, aber nicht auf Kosten der Lesbarkeit.** Takt ist eine
Desktop-Anwendung (A-13.9). Die Grundschriftgröße ist 14px statt der im Web üblichen 16px,
weil sonst eine Buchungsliste halb so viele Zeilen zeigt. Zeilenhöhen und Abstände sind dafür
großzügiger gewählt, als es bei 14px üblich wäre.

**Zustand steht nie allein in der Farbe.** Jeder Zustand, der eine Entscheidung des Benutzers
beeinflusst, trägt mindestens zwei voneinander unabhängige Merkmale. Das gilt für den
Exportstatus, für Auswahl, für Ablageziele beim Ziehen und für Fehler.

**Kein Netzabruf.** Takt läuft vollständig lokal (E-001). Es gibt deshalb keine Web-Schrift von
einem CDN, keine Icon-Bibliothek über das Netz und keine externen Bilder. Der Schriftstapel ist
der des Betriebssystems, die Symbole sind Inline-SVG im Quelltext.

**Bausteine kennen keine Fachlogik.** Kein Baustein rundet, rechnet oder kodiert. Dauer,
Exportwert, Datum und Base64 kommen fertig von außen. Das ist keine Bequemlichkeit, sondern die
Bedingung dafür, dass die Regeln aus E-008 und A-8.4 genau einmal existieren — in
`packages/domain` beziehungsweise `packages/export`.

---

## 2. Farbe

### 2.1 Aufbau

Zwei Ebenen in `src/styles/tokens.css`:

| Ebene | Präfix | Regel |
|---|---|---|
| Primitiv | `--takt-<rampe>-<stufe>` | Rohfarben. Sechs Rampen. In Bausteinen **nie** direkt verwenden. |
| Semantisch | `--bg-*`, `--text-*`, `--border-*`, `--accent-*`, `--danger-*`, `--status-*`, `--timer-*`, `--note-*`, `--info/-success/-warning-*`, `--focus-*` | Ausschließlich diese Ebene steht in `components.css`. |

Der helle Modus ist vollständig unter `:root` definiert. Der dunkle Modus definiert **nur die
semantische Ebene** neu — zweimal, einmal unter `@media (prefers-color-scheme: dark)` für die
Systemeinstellung und einmal unter `:root[data-theme="dark"]` für die ausdrückliche Wahl des
Benutzers. Die Primitiven bleiben in beiden Modi identisch.

Der dunkle Modus ist keine Invertierung. Die Farbtöne werden aufgehellt und entsättigt, weil
gesättigte Farben auf dunklem Grund flimmern.

### 2.2 Rampen

| Rampe | Aufgabe |
|---|---|
| `neutral` (14 Stufen) | Flächen, Text, Rahmen |
| `accent` (11 Stufen) | Primäraktion, Auswahl, Fokus, Verweise |
| `green` (10 Stufen) | Exportstatus „Exportiert“, Erfolg |
| `amber` (10 Stufen) | Exportstatus „Offen“, Warnung |
| `rose` (10 Stufen) | Exportstatus „Erneut offen“, destruktive Aktion |
| `violet` (10 Stufen) | ausschließlich laufender Timer |

Violett ist bewusst für den Timer reserviert. Ein laufender Timer und ein Exportstatus dürfen
nie dieselbe Farbe tragen, weil sie in derselben Zeile nebeneinanderstehen.

### 2.3 Rahmen: drei Sorten, zwei Anforderungen

WCAG 2.2 SC 1.4.11 verlangt 3:1 für „visuelle Information, die zur Erkennung von
Bedienelementen und ihren Zuständen nötig ist“ — nicht für dekorative Linien. Das System
trennt das deshalb ausdrücklich:

| Token | Aufgabe | Anforderung |
|---|---|---|
| `--border-subtle` | Trennlinie in Tabelle und Liste | keine, rein dekorativ |
| `--border-default` | Karten- und Panelumriss | keine, rein dekorativ |
| `--border-control` | Grenze eines Bedienelements | **3:1** gegen die Fläche darunter |
| `--border-strong` | Bedienelement unter dem Zeiger | **3:1** |

Ein Eingabefeld mit `--border-default` sähe moderner aus und wäre nicht barrierefrei. Der
Unterschied ist gering und gewollt.

### 2.4 Gemessene Kontraste

Die folgenden Werte sind **gemessen, nicht geschätzt**. Das Skript
`apps/web/scripts/contrast-check.mjs` liest `tokens.css`, löst `var()`-Verweise auf, legt
teiltransparente Farben über ihren Untergrund und berechnet das Verhältnis nach WCAG. Es endet
mit Fehlercode, sobald ein Paar seine Mindestanforderung verfehlt.

```
cd apps/web
pnpm contrast          # Klartext
pnpm contrast:md       # Markdown-Tabelle
```

Stand 2026-09-01: **124 Paare geprüft, 0 durchgefallen** (62 je Modus, davon 2 je Modus als
dekorativ ausgenommen). Gegenüber T-006 sind 15 Paare je Modus dazugekommen: die gestreifte
Randschiene des Leistungsfelds, die Marken vor beiden Beschriftungen, die drei Ausprägungen des
Erledigt-Kennzeichens und die Flächen der Einleitung.

Zwei Token mussten dafür nachgezogen werden, weil sie gemessen durchfielen:
`--note-internal-rail` von `#a8b2c3` auf `#7e8a9e` (2,13:1 → 3,49:1) und die Kontur des
Kennzeichens „Erledigt“ von `--success-border` auf `--success-fg` (1,50:1 → 6,50:1). Beide sind
Zustandsgrenzen nach SC 1.4.11 und keine Dekoration; sie zu senken wäre die falsche Antwort
gewesen.

Auszug heller Modus:

| Paar | Verhältnis | Mindestwert |
|---|---:|---:|
| `--text-primary` auf `--bg-surface` | 15,76:1 | 4,5:1 |
| `--text-secondary` auf `--bg-surface` | 8,39:1 | 4,5:1 |
| `--text-muted` auf `--bg-surface` | 5,64:1 | 4,5:1 |
| `--text-muted` auf `--bg-subtle` | 5,02:1 | 4,5:1 |
| `--text-on-accent` auf `--accent-bg` | 5,98:1 | 4,5:1 |
| `--text-on-solid` auf `--danger-bg` | 6,75:1 | 4,5:1 |
| `--status-open-fg` auf `--status-open-bg` | 7,50:1 | 4,5:1 |
| `--status-exported-fg` auf `--status-exported-bg` | 6,50:1 | 4,5:1 |
| `--status-reopened-fg` auf `--status-reopened-bg` | 8,10:1 | 4,5:1 |
| `--status-open-border` auf `--bg-surface` | 3,95:1 | 3,0:1 |
| `--status-reopened-border` auf `--bg-surface` | 3,62:1 | 3,0:1 |
| `--border-control` auf `--bg-surface` | 3,49:1 | 3,0:1 |
| `--border-control` auf `--bg-subtle` | 3,10:1 | 3,0:1 |
| `--focus-ring-color` auf `--bg-surface` | 5,98:1 | 3,0:1 |
| `--timer-running-fg` auf `--timer-running-bg` | 9,28:1 | 4,5:1 |
| `--note-billing-header-fg` auf `--note-billing-header-bg` | 9,56:1 | 4,5:1 |

Auszug dunkler Modus:

| Paar | Verhältnis | Mindestwert |
|---|---:|---:|
| `--text-primary` auf `--bg-surface` | 14,64:1 | 4,5:1 |
| `--text-muted` auf `--bg-surface` | 6,74:1 | 4,5:1 |
| `--status-open-fg` auf `--status-open-bg` | 8,29:1 | 4,5:1 |
| `--status-exported-fg` auf `--status-exported-bg` | 9,35:1 | 4,5:1 |
| `--status-reopened-fg` auf `--status-reopened-bg` | 7,10:1 | 4,5:1 |
| `--border-control` auf `--bg-surface` | 3,80:1 | 3,0:1 |
| `--focus-ring-color` auf `--bg-surface` | 8,34:1 | 3,0:1 |

Die vollständige Tabelle beider Modi erzeugt `pnpm contrast:md`. Zwei bewusste Ausnahmen:
`--border-subtle` (1,23:1) und `--border-default` (1,46:1) sind dekorative Linien; SC 1.4.11 ist
auf sie nicht anwendbar. Sie sind im Skript als `exempt` markiert und werden mit ihrem
gemessenen Wert ausgewiesen, statt aus der Prüfung zu verschwinden.

`--text-disabled` erreicht 3,10:1 und liegt damit unter 4,5:1. Das ist zulässig: SC 1.4.3 nimmt
Text in deaktivierten Bedienelementen ausdrücklich aus. Deaktivierte Elemente tragen zusätzlich
`disabled` und einen veränderten Mauszeiger.

---

## 3. Exportstatus — der wichtigste Baustein

A-6.5 bis A-6.7 verlangen, dass eine Zeitbuchung eindeutig als „noch nicht exportiert“ oder
„bereits exportiert“ erkennbar ist, und zwar überall, nicht nur in der Export-Ansicht. E-012
erlaubt zusätzlich, den Exportstatus jeder einzelnen Buchung zurückzusetzen; R-10 nennt die
Doppelabrechnung als Folge.

### 3.0 Abbildung auf das Domänenmodell

`packages/domain` führt `TimeEntry.exportStatus` **zweiwertig** — `open` und `exported`, so wie
`time_entry.export_status` in der Datenbank — und zählt in `TimeEntry.exportCount`, wie oft die
Buchung schon in einem Exportlauf war. Daraus ergibt sich der Anzeigezustand ohne zusätzliches
Feld:

| Domäne | Anzeigezustand in `apps/web` |
|---|---|
| `exportStatus: 'exported'` | `"exported"` |
| `exportStatus: 'open'`, `exportCount === 0` | `"open"` |
| `exportStatus: 'open'`, `exportCount > 0` | `"reopened"` |

### 3.1 Zwei Werte, drei Darstellungen (E-032)

Das ist die wichtigste Unterscheidung des ganzen Dokuments, und die einzige, deren Missachtung
Geld kostet. **Der Exportstatus hat genau zwei Werte**, so wie A-6.9 es verlangt und E-032 es
festhält. Eine zurückgesetzte Buchung (E-012) ist danach wieder `open` — nicht „erneut offen“.

| Darstellung | Bedeutung | Fachlicher Status | Geht in den nächsten Export |
|---|---|---|---|
| „Offen“ | Noch nie übertragen. | `open` | ja |
| „Erneut offen“ | Zurückgesetzt. War schon einmal in einer Abrechnung. | `open` | **ja** |
| „Exportiert“ | Übertragen. Gesperrt, bis der Status zurückgesetzt wird (A-6.9). | `exported` | nein |

Die dritte Darstellung hängt deshalb **nicht am Status**, sondern an einem eigenen Merkmal:
`exportCount`. Im Quelltext tragen beide Begriffe verschiedene Typen, damit die Verwechslung
nicht durchrutscht:

```ts
// src/components/ExportStatus.tsx
export type ExportStatus = "open" | "exported";              // Filter, Abfragen, Exportauswahl
export type ExportDisplayState = ExportStatus | "reopened";  // ausschliesslich Darstellung
export function exportDisplayState(status: ExportStatus, exportCount: number): ExportDisplayState;
export function exportStatusOf(state: ExportDisplayState): ExportStatus;
```

**Verbindliche Regel.** Jeder Filter, jede Abfrage und jede Exportauswahl kennt genau zwei Werte
und greift auf `ExportStatus` zu. „Erneut offen“ ist nie ein Filterkriterium. Wer es zu einem
macht, lässt eine zurückgesetzte Buchung aus dem nächsten Export herausfallen — obwohl sie
absichtlich zurückgesetzt wurde, damit sie noch einmal abgerechnet wird. Dann steht R-10 auf dem
Kopf. Die Musterseite spricht das an drei Stellen aus: im Abschnitt „Exportstatus“, im Filter der
Buchungstabelle und in der Exportvorschau.

### 3.2 Sieben Unterscheidungsmerkmale, nur eines davon Farbe

| Merkmal | Offen | Exportiert | Erneut offen |
|---|---|---|---|
| Füllung des Etiketts | Kontur, helle Fläche | voll gefüllt, kräftig | Kontur mit Diagonalschraffur |
| Symbol | Kreis | Haken im Kreis | Pfeil zurück |
| Form des Zustandspunkts | Ring | gefüllte Scheibe | Raute |
| Beschriftung | „Offen“ | „Exportiert“ | „Erneut offen“ |
| Linke Randmarkierung der Zeile | bernsteinfarben | grün, Zeile zusätzlich getönt | rosé |
| Bearbeitbarkeit | ja | nein, gesperrt | ja, mit Warnung |
| Fachlicher Status | `open` | `exported` | `open` — **kein eigener Wert** |

Bernstein, Grün und Rosé sind für Deuteranopie die schwierigste Kombination überhaupt. Deshalb
tragen Form, Symbol und Beschriftung die Aussage; die Farbe verstärkt sie nur. Die Musterseite
hat dafür eine **Graustufenprobe** als Schalter — mit ihr lässt sich in einem Klick prüfen, dass
die Unterscheidung ohne Farbe bestehen bleibt.

**Entschieden.** Zur Wahl standen zwei Darstellungen des zurückgesetzten Falls: ein eigener
dritter Etikettzustand „Erneut offen“ (Variante A) oder das Etikett „Offen“ plus ein getrenntes
Zeichen „schon einmal exportiert“ (Variante B, Vorschlag aus T-005). Gesetzt ist **Variante A**,
weil der Fall Geld kostet (R-10) und in einer langen Liste sofort auffallen muss. Variante B und
ihr Baustein `PreviouslyExportedMark` sind aus dem Quelltext entfernt, damit keine zwei
Wahrheiten bleiben. Die Musterseite dokumentiert die Entscheidung in Abschnitt 2.

Wichtig zur Einordnung: Variante A ist eine Entscheidung über die **Darstellung**. Sie ändert
nichts an der Zweiwertigkeit aus Abschnitt 3.1 — im Gegenteil, sie ist der Grund, warum die
Trennung zwischen `ExportStatus` und `ExportDisplayState` im Quelltext überhaupt nötig ist.

### 3.3 Wo der Status erscheint — Regel für alle 14 Ansichten

1. Wo eine einzelne Buchung auftaucht, erscheint ihr Exportstatus als Etikett
   (`ExportStatusBadge`).
2. Wo für ein Etikett kein Platz ist, erscheint der Zustandspunkt (`ExportStatusMarker`).
3. Wo mehrere Buchungen zusammengefasst werden — Kanban-Karte, Todo-Zeile, Dashboard —
   erscheint die Zusammenfassung mit Zahl je Zustand (`ExportSummaryStrip`).
4. In Listen kommt zusätzlich die linke Randmarkierung der Zeile dazu, damit der Status beim
   Überfliegen auffällt, ohne dass das Auge die Statusspalte suchen muss.

Ein Etikett trägt immer den unsichtbaren Vorspann „Exportstatus: “ für Hilfsmittel, damit ein
Bildschirmleser nicht nur „Offen“ vorliest.

Der Zusatz hinter der Beschriftung beantwortet je Darstellung eine andere Frage: „Exportiert“
nennt das Datum, „Erneut offen“ nennt den **Exportzähler** („1× exportiert“), „Offen“ nennt
nichts. Der Zähler steht dort mit Absicht — er ist das Merkmal, an dem die Darstellung hängt
(Abschnitt 3.1), und nicht bloß ein weiteres Datum.

### 3.4 Erledigt ist kein Spaltenzustand

Die Statusspalten des Boards sind frei definierbar (A-5.4). Ein Kanban-Abschluss ist deshalb
**kein** Erledigt: Ein Todo kann in einer Spalte namens „Erledigt“ stehen und offen sein, und es
kann in „In Arbeit“ stehen und erledigt sein. Das Erledigt-Kennzeichen (A-2.4) hängt am Todo,
nicht an der Phase.

Für die Oberfläche folgt daraus eine Regel, die auf jeder Ansicht mit Karten oder Zeilen gilt:

**Das Erledigt-Kennzeichen steht immer ausdrücklich da, auch wenn es „Offen“ lautet.** Wäre es
nur im Zustand „erledigt“ sichtbar, müsste man es aus dem Spaltennamen erschließen — und genau
das ist der Fehler, den die Trennung verhindern soll. Die beiden Ausprägungen sind unterschiedlich
laut, damit ein volles Board keine Wand aus Etiketten wird:

| Zustand | Aussehen | Zweites Merkmal |
|---|---|---|
| offen | schmale Kontur, gedämpfte Schrift, Ring | — der leise Normalfall |
| erledigt | grün gefüllt, Kontur in Textstärke, Haken | Titel durchgestrichen |
| Erledigt aufgehoben (A-2.5) | gestrichelte Kontur, neutral, Rücklaufpfeil | Karte selbst gestrichelt umrandet |

Der dritte Fall bekommt bewusst **keine eigene Statusfarbe**: Bernstein, Grün und Rosé sind an den
Exportstatus vergeben, Violett an den laufenden Timer. Ein fünfter Farbcode käme dem Exportstatus
in derselben Zeile ins Gehege. Symbol und gestrichelte Kontur tragen hier die Aussage.

Der Spaltenkopf zählt zusätzlich, wie viele seiner Todos erledigt sind — die Mischung wird damit
schon vor dem Lesen der Karten sichtbar.

**Was der Timerstart auf einem erledigten Todo tut** (A-2.5, I-05): Er hebt das Kennzeichen auf,
und nur das. Das Todo erscheint dadurch wieder in seinen Pools, weil Pool-Ansichten erledigte
Todos ausblenden und die Poolzugehörigkeit aus den Tags abgeleitet ist (A-3.4). **Die Spalte
ändert sich nicht.** Der Hinweis danach (`ReactivationNotice`) sagt beides ausdrücklich — welche
Pools, und dass die Karte stehen bleibt — und bietet „Rückgängig“ an. Er nennt auch, warum
Rückgängig die eben entstandene Buchung verwirft: Wenige Sekunden stünden nach E-008 als
0,25 Stunden in der Abrechnung.

### 3.5 Die Exportvorschau gliedert nach Tagesgruppen (E-020, E-031, E-034)

Eine Zeile in der Exportdatei ist **ein Todo an einem Kalendertag**, nicht eine einzelne Buchung:
Alle noch offenen Buchungen desselben Todos am selben Tag werden addiert, und erst die Summe wird
aufgerundet (E-020). Maßgeblich ist der Tag des Timerstarts (E-025).

Deshalb wählt der Benutzer in S-07 **Gruppen** aus und nicht Buchungen — die Auswahl hat dieselbe
Gliederung wie die Datei. Wer sieben Buchungen anhakt und drei Zeilen bekommt, hat die wichtigste
Umformung des Vorgangs nicht gesehen, und A-8.6 ist dann nicht erfüllt.

Jede Gruppe zeigt Todo, Kalendertag, Call-Nummer, die zusammengeführte Leistung und die gerundete
Zeit. Sie lässt sich aufklappen; darunter stehen die einzelnen Buchungen mit ihrer
**ungerundeten** Dauer, ihrer Herkunft (Timer oder Von Hand) und ihrem eigenen Leistungstext.

**Der Kern der Sache:** Wird dort eine Buchung ausgeschlossen, ändert sich die gerundete Zeit der
Gruppe sofort sichtbar. Bei drei Buchungen mit 10, 20 und 5 Minuten fällt die Gruppe von 0,75 auf
0,25, wenn die mittlere herausfällt. Das versteht man in einer Sekunde und in keinem Handbuch.
Der Wert ist ein `<output>`, wird also bei jeder Änderung angesagt, und bekommt eine kurze
Hervorhebung, die unter `prefers-reduced-motion` entfällt.

Eine Tagesgruppe ohne Leistungstext ist nicht exportierbar (E-034). Sie wird als solche
gekennzeichnet, mit dem Grund, und ihr Auswahlkästchen ist gesperrt. Ihre gerundete Zeit steht
gedämpft daneben — sie wäre richtig, wird aber gerade nicht exportiert. Der Export der übrigen
Gruppen läuft trotzdem; die betroffene bleibt offen und erscheint beim nächsten Mal wieder. Die
fehlende Leistung lässt sich direkt in der aufgeklappten Gruppe nachtragen.

**Die Oberfläche rundet nicht.** Gerundete Zeit, zusammengeführte Leistung und der Grund einer
Sperre kommen fertig von außen. Auf der Musterseite liegt zu jeder möglichen Auswahl das fertige
Ergebnis als Beispieldatum in `showcase/data.ts`; in der Anwendung liefert es `packages/domain`.

### 3.6 Pool-Ansichten blenden erledigte Todos aus (E-023, E-039)

A-2.5 verlangt, dass ein Todo nach dem Timerstart wieder in seinem Pool landet. Das funktioniert
nur, wenn ein erledigtes Todo dort vorher nicht zu sehen war — sonst gäbe es nichts, wohin es
zurückkehren könnte. Erledigte Todos sind in Pool-Ansichten deshalb **ausgeblendet**.

Ausgeblendet ist aber kein Verstecken: Der Schalter dafür steht in der **Filterleiste** und nicht
in einem Menü, und solange er aus ist, trägt die Leiste einen entfernbaren Filterchip
„Erledigte Todos: ausgeblendet“. Ein Filter, der als Voreinstellung greift, muss sichtbar sein —
sonst sucht jemand ein Todo, das er selbst abgehakt hat, und findet den Grund nicht.

Die Wahl wird **je Ansicht** gemerkt, nicht global: Wer im Pool „Kunden“ nachsieht, was er letzte
Woche abgeschlossen hat, will deshalb nicht im Pool „Intern“ eine Wand aus erledigten Todos.

Das Kanban-Board ist keine Pool-Ansicht. Dort bleiben erledigte Todos stehen, weil eine Spalte
eine Phase ist und kein Pool (Abschnitt 3.4); der Spaltenkopf zählt sie zusätzlich.

### 3.7 Wert und Beschriftung (E-015, E-041)

Datenbank, Domäne und API führen ausschließlich den englischen Wert; auf dem Bildschirm steht die
deutsche Beschriftung. Die Zuordnung steht genau einmal in `src/lib/labels.ts` und wird in keiner
Ansicht neu getippt.

| Spalte | Wert | Beschriftung |
|---|---|---|
| `time_entry.export_status` | `open` | Offen |
| `time_entry.export_status` | `exported` | Exportiert |
| `time_entry.source` | `timer` | Timer |
| `time_entry.source` | `manual` | Von Hand |
| `app_setting.theme` | `system` | Systemvorgabe |
| `app_setting.theme` | `light` | Hell |
| `app_setting.theme` | `dark` | Dunkel |
| `app_setting.rounding_mode`, `export_run.rounding_mode` | `up` | aufwärts |
| `app_setting.rounding_mode`, `export_run.rounding_mode` | `nearest` | kaufmännisch |
| `export_audit.event` | `exported` | exportiert |
| `export_audit.event` | `reset` | zurückgesetzt |

Dazu die Wortwahl aus E-029 und E-030, die für alle Oberflächentexte gilt:

* **Todo** ist der Leitbegriff. „Ticket“ wird nicht verwendet.
* **Timer** ist das Bedienelement, das man startet und stoppt.
* **Zeiterfassung** ist der Bereich, der ihn enthält, und der Name des Navigationspunkts (S-05).
  „Time Tracking“, „Time-Tracking-Ansicht“ und „Time-Tracker“ werden nicht verwendet.

---

## 4. Schrift

Kein Netzabruf, also der Systemstapel. Primärziel ist Windows (der Windows-Benutzername ist Teil
des Exports, E-010), deshalb steht die Segoe-Familie vorn.

```
--font-sans: "Segoe UI Variable Text", "Segoe UI", Inter, -apple-system,
             BlinkMacSystemFont, "Noto Sans", Roboto, Ubuntu, Cantarell,
             system-ui, sans-serif;
--font-mono: "Cascadia Mono", "Cascadia Code", Consolas, "SF Mono",
             "JetBrains Mono", "Roboto Mono", "Ubuntu Mono", ui-monospace, monospace;
```

Der Monospace-Stapel trägt Call-Nummern, Timer-Werte und Tastenkürzel. Zusätzlich gilt in
Tabellen, Zeitangaben und Ausgabefeldern `font-variant-numeric: tabular-nums`, damit Ziffern
gleich breit sind und Spalten beim Aktualisieren nicht springen.

### 4.1 Skala

| Token | Größe | Zeilenhöhe | Verwendung |
|---|---:|---:|---|
| `--text-4xl` | 38px | 1,2 | große Timer-Anzeige (S-05) |
| `--text-3xl` | 30px | 1,2 | Kennzahl auf dem Dashboard (S-01) |
| `--text-2xl` | 24px | 1,2 | Seitentitel |
| `--text-xl` | 20px | 1,2 | Panelüberschrift |
| `--text-lg` | 18px | 1,35 | Kartenüberschrift |
| `--text-md` | 16px | 1,5 | Fließtext, Dialogtext |
| `--text-base` | 14px | 1,5 | **Standardtext der Oberfläche** |
| `--text-sm` | 13px | 1,35 | Tabellenzelle, Chip, dichte Liste |
| `--text-xs` | 12px | 1,35 | Hilfetext, Zeitstempel, Zähler |
| `--text-2xs` | 11px | 1,4 | Versalien-Etikett mit Sperrung `0.06em` |

11px wird ausschließlich für Versalien-Etiketten mit Sperrung verwendet — Spaltenüberschriften,
Kopfbänder, Bereichsmarken. Nie für Fließtext, nie für eine Angabe, die man lesen muss, um eine
Entscheidung zu treffen.

Die Wurzelgröße bleibt bei 16px (`html { font-size: 100% }`). Nur die Anwendung selbst arbeitet
mit 14px. Damit funktionieren Browser-Zoom, `rem`-Rechnung und die Schriftgrößeneinstellung des
Betriebssystems unverändert.

Gewichte: 400 Fließtext, 500 Etiketten und Bedienelemente, 600 Überschriften und Zahlen mit
Bedeutung, 700 nur die Wortmarke.

### 4.2 Abstände

Basis 4px. `--space-1` bis `--space-16`, keine Zwischenwerte.

| Ebene | Abstand |
|---|---|
| Symbol zu Text | `--space-1` (4) |
| innerhalb eines Bausteins | `--space-2` (8) |
| Zellinnenabstand dicht | `--space-3` (12) |
| Standardinnenabstand einer Karte | `--space-4` (16) |
| zwischen Bausteinen | `--space-6` (24) |
| zwischen Gruppen | `--space-8` (32) |
| zwischen Abschnitten | `--space-12` (48) |

Zeilenhöhe der Tabellen: `--row-height`, 40px normal und 32px in der Dichte „kompakt“
(`[data-density="compact"]` am Wurzelelement). Die Dichte ist umschaltbar, weil eine
Buchungsliste und eine Einstellungsseite unterschiedliche Ansprüche haben.

### 4.3 Radien und Erhebung

Radien: 3 / 4 / 6 / 8 / 12 / Pille. Schatten: fünf Stufen von `--shadow-xs` (Karte in Ruhe) bis
`--shadow-drag` (Karte am Zeiger, mit farbigem Ring). Im dunklen Modus sind die Schatten
kräftiger, weil Schatten auf dunklem Grund sonst nicht wirken.

---

## 5. Interaktionszustände

Für jeden Baustein sind dieselben Zustände in derselben Reihenfolge definiert:
normal, `:hover`, `:active`, `:focus-visible`, `[disabled]`, Fehler.

**Fokus.** `:focus-visible` erzeugt einen 2px-Ring in `--focus-ring-color` mit 2px Abstand. Der
Ring liegt außerhalb des Elements, damit ihn nichts verdeckt (SC 2.4.11 Focus Not Obscured). Auf
gefüllten Flächen kommt über die Klasse `on-solid` ein heller Gegenring dazu. `outline: none`
ohne Ersatz gibt es nirgends. Bei `prefers-contrast: more` wächst der Ring auf 3px.

**Klickfläche.** Symbolknöpfe sind mindestens 28×28px und erfüllen damit SC 2.5.8 (24×24) mit
Reserve. `--hit-target-min` hält den Mindestwert als Token fest.

**Bewegung.** 80 / 140 / 200 / 280ms mit `--ease-out` für Eintritte, `--ease-in` für Austritte.
`prefers-reduced-motion: reduce` setzt alle Übergänge und Animationen global auf 0,01ms.
Animiert werden nur `transform`, `opacity` und Farben.

**Deaktiviert gegen ladend.** Ein ladender Knopf behält die Farbe seiner Ausprägung und zeigt
einen Anzeiger; ein deaktivierter Knopf wird grau. „Arbeitet gerade“ und „geht nicht“ dürfen
nicht gleich aussehen.

**Rückmeldung.** Jede Interaktion aus Abschnitt 16 hat eine sichtbare Rückmeldung: sofortige
Zustandsänderung unter 100ms, Anzeiger ab etwa 300ms, Erfolgs- oder Fehlermeldung danach.
Fehlermeldungen tragen `role="alert"`, alles andere `aria-live="polite"`.

---

## 6. Tastatur und Hilfsmittel

| Bereich | Bedienung |
|---|---|
| Seite | Sprungmarke „Zum Inhalt springen“ als erstes fokussierbares Element |
| Menü und Kontextmenü | Pfeil auf/ab mit Umlauf, Pos1, Ende, Eingabe, Escape schließt und gibt den Fokus zurück, Tabulator schließt |
| Kontextmenü | zusätzlich über die Kontextmenü-Taste und Umschalt+F10, nicht nur über den rechten Mausklick |
| Baumansicht | genau ein Tabulator-Halt, darin Pfeiltasten, Pos1, Ende, `*` klappt alles auf |
| Dialog | Fokus springt hinein, Tabulator bleibt gefangen, Escape bricht ab, Fokus kehrt zum Auslöser zurück |
| Kanban | Strg+Pfeil links/rechts verschiebt die Karte; jede Verschiebung wird über `aria-live` angesagt |
| Tabelle | Sortierknöpfe mit `aria-sort`, Auswahlkästchen mit `indeterminate` für die Kopfzeile |
| Suchfeld | Escape leert das Feld |

**SC 2.5.7 Dragging Movements** ist die Anforderung, die beim Kanban-Board am leichtesten
übersehen wird: Für jede Ziehbewegung muss es eine Alternative mit einem einzelnen Zeigerdruck
geben. Takt löst das doppelt — über „Verschieben nach …“ im Kartenmenü und über Strg+Pfeil. Wer
später eine weitere Ziehbewegung einführt (Tag in Ordner ziehen, Feld in der Exportvorlage
sortieren), braucht dieselbe Alternative.

Symbole sind grundsätzlich `aria-hidden`. Die Bedeutung trägt der Text daneben oder ein
`aria-label` am Knopf. Es gibt keine Emoji und keine Rasterbilder.

---

## 7. Vermerk und Leistung — die zwei Feldarten (R-08, E-016)

Todo und Zeitbuchung tragen je ein Textfeld. In der Spezifikation heißen beide „Notiz“
(A-7.1, A-7.3). Nur eines geht in die Abrechnung. Das ist der wahrscheinlichste Bedienfehler des
Produkts, und er wird erst beim Kunden sichtbar.

**Die Namen sind gesetzt** (E-016, Entscheidung des Auftraggebers):

| Feld | Heißt in der Oberfläche | Geht in den Export |
|---|---|---|
| Textfeld am Todo (A-7.1) | **Vermerk** | nein |
| Textfeld der Zeitbuchung (A-7.3) | **Leistung** | ja |

Die beiden Wörter teilen keinen Wortstamm mehr. Frühere Vorschläge taten das noch: „Persönliche
Notiz“ gegen „Leistungsnotiz“ hinterlässt unter Zeitdruck beide Male nur „Notiz“. Der Schlüssel
in der Exportdatei bleibt `Notiz`, weil ihn das Abrechnungstool vorgibt (A-8.2) — Beschriftung
und Schlüssel dürfen auseinandergehen.

**Der Name allein reicht nicht.** „Leistung“ sagt, *was* im Feld steht, nicht *wohin* es geht.
Diese zweite Hälfte trägt die Gestaltung. Sechs Merkmale, von denen nur eines Farbe ist:

| Merkmal | `scope="billing"` — Leistung | `scope="internal"` — Vermerk |
|---|---|---|
| Randschiene links | 4px, **gestreift**, Akzentfarbe | 4px, einfarbig, Grau |
| Kopfband | „Verlässt Takt · steht in der Abrechnung“, Pfeil nach außen | „Bleibt in Takt“, Schloss |
| Marke vor der Beschriftung | gefülltes Quadrat mit Pfeil nach außen | gestrichelte Kontur mit Schloss |
| Schreibfläche | hell, wirkt wie ein Ausgabefeld | gedämpft, wirkt wie ein Notizzettel |
| Fußnote | nennt Empfänger und Zielfeld: „… steht dort auf der Rechnung des Kunden. Standardvorlage: Feld ‚Notiz‘.“ | „Bleibt in Takt. Wird nie exportiert — auch nicht über eine eigene Exportvorlage.“ |
| Ort | immer an einer Buchung | immer am Todo |

Zwei dieser Merkmale sind in T-015 dazugekommen und lösen jeweils einen konkreten Ausfall:

* **Die gestreifte Randschiene** trägt auch dann, wenn Farbe wegfällt. Zwei 4px-Schienen, die
  sich nur im Farbton unterscheiden, sind in Graustufen und bei Deuteranopie nahezu gleich.
  Gestreift gegen einfarbig ist es nicht. Die Musterseite hat dafür in Abschnitt 7 eine eigene
  **Graustufenprobe**.
* **Die Marke unmittelbar vor der Beschriftung** trägt auch dann, wenn das Kopfband nicht im
  Blickfeld ist — in einem schmalen Dialog, in einer gescrollten Liste, im Outlook-Add-in.

Gestaltung verhindert den Bedienfehler. Die **Umgehung** über eine eigene Exportvorlage verhindert
sie nicht — dafür sorgt der Vorlagen-Motor mit seiner geschlossenen Quellenliste, in der der
Vermerk gar nicht erst auftaucht (E-005, E-017, R-06). Beides ist nötig.

Ist eine Buchung bereits exportiert, wird das Leistungsfeld schreibgeschützt dargestellt:
gestrichelter Rand, „gesperrt“ im Kopfband und ein Hilfetext, der den Weg nennt („Zum Bearbeiten
zuerst den Exportstatus zurücksetzen“). Eine Sperre ohne Ausweg wäre eine Sackgasse.

---

## 8. Folgenreiche Aktionen

Der Bestätigungsdialog sagt, **was passiert**, nicht ob man sicher ist. Er hat drei Teile:
Beschreibung der Aktion, hervorgehobene Folge, Bestätigungsknopf in der Farbe der Aktion.

Für die folgenreichste Aktion des Produkts — das Zurücksetzen eines Exportstatus — kommt eine
ausdrückliche Bestätigung per Kontrollkästchen dazu:

> Ich weiß, dass diese Zeit dadurch ein zweites Mal abgerechnet werden kann.

Der Bestätigungsknopf bleibt gesperrt, bis das Kästchen gesetzt ist. Dieses Mittel wird sparsam
eingesetzt; wird es zur Gewohnheit, klickt es sich weg.

Dazu kommt ein Pflichtfeld „Begründung — wird protokolliert“. Es füllt
`ExportStatusResetRequest.reason` aus dem Domänenmodell, das unverändert in die Protokollzeile
wandert. Ohne Eingabe bleibt der Bestätigungsknopf gesperrt.

Beim Start des Timers auf einem erledigten Todo (A-2.5, I-05) fragt die Anwendung **nicht** —
die Spezifikation verlangt, dass „Erledigt“ automatisch aufgehoben wird. Sie sagt hinterher
genau, was passiert ist, nennt die Pools, in denen das Todo jetzt wieder erscheint, sagt
ausdrücklich, dass die Karte ihre Spalte behält, und bietet „Rückgängig“ an. Passt zu den Tags
keine Poolregel, nennt sie keinen Pool, sondern spricht das aus — eine Meldung, die einen Pool
erfindet, wäre schlimmer als keine.

---

## 9. Wenn Takt nicht vollständig startet (T-020)

Drei Zustände meldet die Anwendungshülle beim Start, und alle drei kann ein Anwender als Erstes
zu sehen bekommen — vor jedem Todo und vor jeder Buchung. Sie stammen aus `shellState()` in
`apps/desktop/src/shell.ts` und liegen dort als fertige deutsche Sätze vor; die Oberfläche
formuliert sie nicht neu, sie gibt ihnen einen Ort und einen Rahmen.

**Die Rangfolge steckt in der Form, nicht nur im Text.**

| Zustand | Quelle | Form | Ton | Schließbar | Ansage |
|---|---|---|---|---|---|
| Dienst beendet | `serviceExit`, gemeldet über `SHELL_EVENTS.serviceExited` | Sperrdialog über der ganzen Anwendung | Fehler | nein — Ausgang ist „Takt beenden“ | `role="alertdialog"`, Fokus im Dialog |
| Start unvollständig | `problems` | Band über der Ansicht, volle Breite | Fehler | nein | `role="alert"`, sofort |
| Datenordner | `directory.syncWarning` | dasselbe Band, andere Farbe und anderes Symbol | Warnung | nein | `role="status"`, höflich |
| Nichts aufgefallen | — | keine Anzeige | — | — | keine |

**Zwei Sätze für zwei Leser (T-020b).** Jeder der drei Zustände trägt einen Klartextsatz und
daneben einen technischen Zusatz — `directory.syncDetail` und `serviceExit.detail`. Der Klartext
sagt, was ist; der Zusatz ist das, was man an die Systembetreuung weitergibt. Er steht gedämpft,
beschriftet und unterhalb des Klartextes, nie an seiner Stelle.

Die Regel dahinter: **Kein technischer Bezeichner im ersten Satz, den ein Anwender liest.**
Portnummern, Dateiformate und Systemaufrufe gehören in den Zusatz. Zwei Rust-Tests halten das
fest — `die_warnung_spricht_klartext_und_der_zusatz_traegt_die_fachsprache` und
`der_klartext_traegt_keine_technischen_bezeichner`; sie fallen, sobald ein Fachbegriff zurück
nach vorn wandert.

**Warum keiner der drei schließbar ist.** Ein Zustand, der durch Wegklicken nicht aufhört zu
gelten, darf nicht durch Wegklicken verschwinden. Alle drei bestehen bis zum Neustart von Takt;
eine weggeklickte Meldung wäre genau dann weg, wenn der Benutzer sie an seine Systembetreuung
weitergeben will.

**Warum genau einer sperrt.** Ohne den lokalen Dienst schreibt Takt nichts mehr auf die Platte.
Das ist der einzige Zustand des Produkts, in dem Weiterarbeiten Datenverlust bedeutet — und
damit der einzige, in dem eine modale Sperre richtig ist. Der Dialog hat eine bedienbare
Schaltfläche, die den Zustand auflöst („Takt beenden“); ohne sie wäre er eine Tastaturfalle
(SC 2.1.2). Escape schließt ihn nicht.

**Drei Regeln, die daraus folgen:**

1. **Kein Wert aus `osUser()` gehört in eine dieser Meldungen.** Die Hülle prüft ausdrücklich,
   dass ihre Sätze den Benutzernamen nicht wiedergeben; eine Oberfläche, die ihn danebenschreibt,
   hebt das auf.
2. **Die Sätze der Hülle werden nicht zusammengefasst.** „Ein Fehler ist aufgetreten (Code 3)“
   nimmt dem Benutzer die einzige Auskunft, die er weitergeben kann. Der Rahmen ist von der
   Oberfläche, die Aufzählung ist es nicht.
3. **Die Ordnerwarnung stand in der Hülle zweimal** — in `directory.syncWarning` und zusätzlich
   in `problems`. Die zweite Ablage ist seit T-020b entfernt. `startupProblems()` filtert die
   Dopplung weiterhin: Ein Filter am Ziel kostet nichts, und er fängt den Fall, dass die Quelle
   sie zurückbringt.
4. **Der Ausfall des Dienstes wird gemeldet, nicht abgefragt.** `SHELL_EVENTS.serviceExited`
   trägt den Grund als Nutzlast. Eine Sperrmeldung, die auf den nächsten Abruf wartet, sperrt
   nichts — sie beschreibt hinterher, und dazwischen arbeitet der Benutzer weiter, ohne dass
   etwas gespeichert wird.

Lebend nachvollziehbar auf der Musterseite, Abschnitt 10: Jeder Zustand lässt sich einzeln und
in Kombination einschalten.

---

## 10. Komponenteninventar

Vollständig und aktuell auf der Musterseite, Abschnitt 11. Kurzfassung:

| Baustein | Datei | Vorkommen |
|---|---|---|
| Knopf, Symbolknopf, Karte, Leerzustand, Ladezustand, Meldung, Werkzeugleiste | `Primitives.tsx` | alle |
| Exportstatus-Etikett, Zustandspunkt | `ExportStatus.tsx` | S-01, S-02, S-03, S-04, S-05, S-06, S-07, S-12 |
| Tag-Chip, Pfadanzeige | `Tag.tsx` | S-02, S-03, S-04, S-08, S-10, S-11, S-12 |
| Baumansicht | `TagTree.tsx` | S-08, S-11, S-12 |
| Tabelle, Tabellenrahmen | `BookingTable.tsx` | S-03, S-06, S-07 |
| Tagesgruppenliste der Exportvorschau | `ExportGroups.tsx` | S-07 |
| Kanban-Spalte, Kanban-Karte, Exportstand-Zusammenfassung | `Kanban.tsx` | S-02, S-03, S-04 |
| Timer-Anzeige, Wiederaufnahme-Hinweis | `Timer.tsx` | global, S-01, S-03, S-04, S-05 |
| Vermerk- und Leistungsfeld | `NoteField.tsx` | S-03, S-05, S-06, S-12 |
| Menü, Kontextmenü | `Menu.tsx` | S-02, S-04, S-06, S-08 |
| Bestätigungsdialog | `ConfirmDialog.tsx` | S-03, S-04, S-06, S-07, S-08, S-09 |
| Filterleiste, Suchfeld, Auswahlliste, Filterschalter | `FilterBar.tsx` | global, S-02, S-06, S-07, S-09, S-14 |
| Startmeldung, Datenordner-Hinweis, Sperrmeldung | `ShellStatus.tsx` | global, vor jeder Ansicht |
| Fokusführung modaler Flächen (keine Darstellung) | `lib/focus.ts` | `ConfirmDialog.tsx`, `ShellStatus.tsx` |
| Wert zu Beschriftung (keine Darstellung) | `lib/labels.ts` | alle |
| Symbolsatz | `Icon.tsx` | alle |

Noch nicht gebaut, aber entworfen: Kennzahlkachel (S-01), Vorlagen-Editor (S-14),
Seitennavigation (global).

---

## 11. Grenzen und Regeln für die Weiterarbeit

1. **Keine rohen Farbwerte in Bausteinen.** `components.css` enthält keinen einzigen Hex-Wert.
   Wer eine neue Farbe braucht, legt zuerst ein semantisches Token an.
2. **Keine Fachlogik in `apps/web`.** Dauer, Exportwert, Datum und Base64 kommen als fertige
   Zeichenkette herein. Die benötigten Funktionen sind im Bericht zu T-006 unter „Offene Fragen“
   aufgeführt.
3. **Kein neues `any`.** `tsconfig.json` läuft mit `strict`, `noUncheckedIndexedAccess`,
   `exactOptionalPropertyTypes` und `verbatimModuleSyntax`.
4. **Kontrast wird gemessen, nicht behauptet.** Die Token liegen seit T-008a in
   `packages/ui-tokens/tokens.css` (E-040); `base.css` bleibt in `apps/web`. Wer ein Farbtoken
   ändert, ergänzt das Paar in `scripts/contrast-check.mjs` und lässt
   `pnpm --filter @takt/web contrast` laufen. Das Skript liest die Datei ohne Vite direkt vom
   Dateisystem — eine Zuordnung im Bündler hilft ihm nicht.
5. **Jede neue Ziehbewegung braucht eine Alternative** (SC 2.5.7).
6. **Jeder neue Zustand braucht ein zweites Merkmal neben der Farbe.**
7. **Der Exportstatus bleibt zweiwertig.** Ein Filter, eine Abfrage oder eine Exportauswahl mit
   drei Werten ist ein Fehler, kein Detail (Abschnitt 3.1, E-032).
8. **Deutsche Beschriftungen stehen in `lib/labels.ts`**, nicht in der Ansicht. Wer eine
   Zuordnung von Datenwert zu Beschriftung braucht, ergänzt sie dort — sonst laufen vierzehn
   Ansichten auseinander (Abschnitt 3.7, E-041).
9. **Nur ein einziger Zustand sperrt die Anwendung** — der Ausfall des lokalen Dienstes
   (Abschnitt 9). Wer eine zweite modale Sperre einführt, braucht dafür eine Entscheidung und
   ein Argument, das so schwer wiegt wie Datenverlust.
10. **Begriffe.** Das Feld am Todo heißt **Vermerk**, das an der Buchung **Leistung** (E-016);
   der Exportschlüssel bleibt `Notiz` (A-8.2). „Erledigt“ ist ein Kennzeichen am Todo und nicht
   die letzte Kanban-Spalte — kein Baustein darf aus einem Spaltennamen auf „erledigt“ schließen
   und keiner darf den Erledigt-Zustand aus der Spaltenzuordnung ableiten.
11. **Ein Bereich, dessen Inhalt sich von selbst ändert, bekommt seinen Platz vorher
   zugeteilt** — nicht im Betrieb von seinem Nachbarn. Der Kopf trägt aus diesem Grund eine feste
   **Höhe** (`--app-header-height`), das Fach des Timers eine feste **Breite**
   (`--app-header-timer-width`). Wer dazu eine Untergrenze braucht, setzt sie als feste Länge und
   niemals inhaltsabhängig; sonst hängt die Nachbarbreite doch wieder am Zustand — nur eine Ebene
   später und schwerer zu finden (T-065).
12. **Ein Bedienweg je Einstellung.** Dieselbe Einstellung an zwei Stellen bedienbar zu machen
   kostet zweimal Pflege und stiftet einmal Zweifel, welche der beiden gilt. Wenn ein zweiter
   Weg unvermeidlich ist, teilen sich beide **einen** Zustand — nie zwei (T-057, T-065).
