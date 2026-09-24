Aufgabe: T-015 — Musterseite und Designsystem auf die bestätigten Begriffe und Entscheidungen ziehen

Status: fertig

Artefakte:

Alles unter `apps/web/`. Außerhalb davon wurde nichts angefasst.

Neu:

```
apps/web/src/showcase/IntroSection.tsx      Einleitung ohne Vorwissen, oben auf der Seite
```

Geändert:

```
apps/web/design/DESIGNSYSTEM.md             Kopf, Abschnitt 2.4, 3.2, neuer 3.4, neuer 7, Regel 7
apps/web/README.md                          Einstieg, drei Schwerpunkte, Regel 7
apps/web/scripts/contrast-check.mjs         47 -> 62 Paare je Modus
apps/web/src/components/NoteField.tsx       Vermerk / Leistung, zwei neue Merkmale
apps/web/src/components/Timer.tsx           ReactivationNotice: Pools statt Spalte, Rueckweg erklaert
apps/web/src/components/Kanban.tsx          Erledigt-Kennzeichen auf jeder Karte, Zaehler im Spaltenkopf
apps/web/src/components/ExportStatus.tsx    PreviouslyExportedMark entfernt (Variante B)
apps/web/src/components/BookingTable.tsx    Spalte "Buchungsnotiz" -> "Leistung"
apps/web/src/components/Primitives.tsx      Card bekommt id und aria-labelledby
apps/web/src/showcase/Showcase.tsx          Einleitung, Navigationseintrag zur Entscheidungsstelle
apps/web/src/showcase/BoardSection.tsx      Spalte und Erledigt als zwei Dinge, I-05 bedienbar
apps/web/src/showcase/NotesSection.tsx      Abschnitt 6 umbenannt, eigene Graustufenprobe
apps/web/src/showcase/TimeSection.tsx       Rueckmeldung ohne Spaltenwechsel
apps/web/src/showcase/ExportStatusSection.tsx  "Zur Entscheidung" -> "Entschieden"
apps/web/src/showcase/ControlsSection.tsx   Begriffe
apps/web/src/showcase/DataSection.tsx       Begriffe
apps/web/src/showcase/FoundationsSection.tsx Begriffe
apps/web/src/showcase/InventorySection.tsx  Begriffe und Zustandslisten
apps/web/src/showcase/data.ts               Beispielkarten: alle vier Kombinationen
apps/web/src/styles/tokens.css              --note-billing-rail-stripe neu, --note-internal-rail dunkler
apps/web/src/styles/components.css          Randschiene gestreift, Marke am Label, Erledigt-Kennzeichen
apps/web/src/styles/showcase.css            Einleitung, Entscheidungskasten
.claude/team/reports/T-015-frontend-dev.md  dieser Bericht
```

**So sieht sich der Auftraggeber die Musterseite an:**

```bash
cd apps/web
pnpm install
pnpm dev
```

Danach `http://127.0.0.1:5173` im Browser öffnen. Keine Rust-Toolchain nötig (E-014, R-04).
Alternativ ohne Entwicklungsserver: `pnpm build && pnpm preview`, dann `http://127.0.0.1:4173`.

Prüfbefehle:

```bash
cd apps/web
pnpm typecheck     # tsc --noEmit, strict, kein any
pnpm build         # Typprüfung plus Produktionsbau
pnpm contrast      # 124 Farbpaare gegen WCAG 2.2 AA, Fehlercode bei Unterschreitung
pnpm contrast:md   # dasselbe als Markdown-Tabelle
```

Zusammenfassung:

Die Musterseite trägt jetzt die bestätigten Begriffe: das Feld am Todo heißt **Vermerk**, das an
der Buchung **Leistung** (E-016), überall in Oberfläche, Designsystem und Quelltextkommentaren;
der Exportschlüssel bleibt `Notiz`. Weil „Leistung“ für sich allein zwar sagt, *was* im Feld
steht, aber nicht *wohin* es geht, ist die Gestaltung um zwei Merkmale verstärkt worden statt den
Namen zu verlängern: eine **gestreifte** Randschiene, die auch in Graustufen von der einfarbigen
des Vermerks unterscheidbar bleibt, und eine gefüllte **Marke unmittelbar vor der Beschriftung**,
die trägt, wenn das Kopfband nicht im Blickfeld ist. Abschnitt 6 hat dafür eine eigene
Graustufenprobe bekommen. Die Rückkehr-Spalte aus E-023 war zwischenzeitlich gebaut und ist nach
der Korrektur des Auftraggebers vollständig entfernt; an ihre Stelle tritt die schwierigere und
richtigere Aufgabe: Statusspalte und Erledigt-Kennzeichen sind zwei unabhängige Zustände, die
Kanban-Karte trägt beide getrennt und in allen vier Kombinationen. Die A/B-Frage ist aufgelöst —
Variante A ist gesetzt, Variante B samt Baustein `PreviouslyExportedMark` aus dem Quelltext
entfernt, die Stelle bleibt als dokumentierte Entscheidung auffindbar. Oben auf der Seite steht
eine Einleitung, die kein Vorwissen voraussetzt. `pnpm typecheck` und `pnpm build` laufen
fehlerfrei, es gibt keinen `any`-Typ, und die Kontraste sind neu gemessen: **124 Paare, 0
durchgefallen**.

**Gemessene Kontraste, Stand 2026-09-01**

`node scripts/contrast-check.mjs` → `0 von 124 Paaren durchgefallen.`
62 Paare je Modus, 2 je Modus als dekorativ ausgenommen (Trennlinie, Kartenumriss).
Gegenüber T-006 sind 15 Paare je Modus dazugekommen.

Zwei Token fielen bei der ersten Messung durch und wurden nachgezogen, statt die Anforderung zu
senken — beide sind Zustandsgrenzen nach SC 1.4.11, keine Dekoration:

| Token | vorher | jetzt | Verhältnis hell | Verhältnis dunkel |
|---|---|---|---:|---:|
| `--note-internal-rail` (Randschiene Vermerk) | `#a8b2c3` | `#7e8a9e` / dunkel `#6b80a5` | 2,13 → **3,49:1** | 2,40 → **4,31:1** |
| Kontur „Erledigt“-Kennzeichen | `--success-border` | `--success-fg` | 1,50 → **6,50:1** | 2,04 → **8,44:1** |

Neue Paare, alle bestanden (Auszug, heller Modus / dunkler Modus):

| Paar | hell | dunkel | Mindestwert |
|---|---:|---:|---:|
| `--note-billing-rail` auf Karte (heller Streifen) | 5,98:1 | 5,66:1 | 3,0 |
| `--note-billing-rail-stripe` auf Karte (dunkler Streifen) | 10,55:1 | 11,24:1 | 3,0 |
| `--text-on-accent` auf `--accent-bg` (Marke vor „Leistung“) | 5,98:1 | 6,26:1 | 4,5 |
| `--border-strong` auf `--note-internal-bg` (Marke vor „Vermerk“) | 5,30:1 | 6,06:1 | 3,0 |
| `--text-muted` auf `--note-internal-bg` (Symbol in der Marke) | 5,30:1 | 6,96:1 | 4,5 |
| `--success-fg` auf `--success-bg` (Kennzeichen Erledigt) | 5,89:1 | 7,50:1 | 4,5 |
| `--text-muted` auf `--bg-surface` (Kennzeichen Offen) | 5,64:1 | 6,74:1 | 4,5 |
| `--text-secondary` auf `--bg-inset` (Erledigt aufgehoben) | 6,81:1 | 10,25:1 | 4,5 |
| `--text-muted` auf `--timer-running-bg` (Fußnote im Hinweis) | 5,02:1 | 6,39:1 | 4,5 |

Die vollständige Tabelle liefert `pnpm contrast:md`. Die Werte oben sind aus dem Lauf abgelesen,
nicht geschätzt.

**Was im Einzelnen getan wurde**

1. **Begriffe nachgezogen.** `NoteField.tsx`, `NotesSection.tsx`, `DESIGNSYSTEM.md`, `README.md`,
   `BookingTable.tsx` (Spaltenkopf, Leerzelle, Typkommentar), `DataSection.tsx` (Suchplatzhalter,
   Tabellenbeschriftung), `ControlsSection.tsx`, `InventorySection.tsx`, `tokens.css` und
   `components.css` (Abschnittsüberschriften und Kommentare). Kein Vorkommen von
   „Leistungsnotiz“ oder „Persönliche Notiz“ ist übrig außer den zwei Stellen im Designsystem,
   die ausdrücklich die abgelöste Fassung nennen.

   Zur Prüffrage „trägt ‚Leistung‘ allein genug?“: **nein**, und der Name wurde trotzdem nicht
   verlängert. Verstärkt wurde stattdessen:
   * Randschiene des Leistungsfelds **gestreift** statt einfarbig (`repeating-linear-gradient`
     aus `--note-billing-rail` und dem neuen `--note-billing-rail-stripe`). Zwei 4px-Schienen,
     die sich nur im Farbton unterscheiden, sind in Graustufen und bei Deuteranopie praktisch
     gleich; gestreift gegen einfarbig ist es nicht.
   * **Marke vor der Beschriftung**: gefülltes Quadrat mit Pfeil nach außen (Leistung) gegen
     gestrichelte Kontur mit Schloss (Vermerk). Sie trägt, wenn das Kopfband außerhalb des
     Blickfelds liegt — schmaler Dialog, gescrollte Liste, Outlook-Add-in.
   * Kopfband schärfer: „Verlässt Takt · steht in der Abrechnung“ statt „Geht an die Abrechnung“.
   * Fußnote nennt jetzt den Empfänger: „… und steht dort auf der Rechnung des Kunden.“
   * Neue **Graustufenprobe in Abschnitt 6**, gleiches Bedienmuster wie in Abschnitt 2.

   Damit sind es sechs Unterscheidungsmerkmale statt fünf, von denen nur eines Farbe ist.

2. **Rückkehr-Spalte gebaut und nach der Korrektur wieder entfernt.** Der ursprüngliche Auftrag
   nach E-023 war umgesetzt (Auswahlfeld in S-09, Spaltenrolle im Kopf, Fehlerzustand bei
   gelöschter Spalte, Spaltenwechsel beim Timerstart). Nach der Mitteilung „Erledigt ist nicht
   die Kanban-Abschlussspalte“ ist davon **nichts** übrig: kein `ColumnRole`, kein
   `returnColumnId`, kein `DEFAULT_RETURN_COLUMN_ID`, kein Einstellungsfeld, keine
   `settings-row`-Regeln im CSS. Nachgeprüft per Suche.

   An seine Stelle tritt die Trennung der beiden Zustände:
   * `KanbanCardData.done` ist dokumentiert als vom Spaltenstand unabhängig.
   * **Jede Karte trägt ihr Erledigt-Kennzeichen ausdrücklich**, auch wenn es „Offen“ lautet.
     Wäre es nur im Zustand „erledigt“ sichtbar, müsste man es aus dem Spaltennamen erschließen —
     genau der Fehler, den die Trennung verhindern soll. Der Normalfall flüstert (schmale Kontur,
     gedämpft, Ring), der auffällige Fall spricht (grün gefüllt, Haken, Titel durchgestrichen).
   * Dritte Ausprägung im selben Slot: **„Erledigt aufgehoben“** nach A-2.5 — gestrichelte
     Kontur, Rücklaufpfeil, dazu die Karte selbst gestrichelt umrandet. Bewusst **ohne eigene
     Statusfarbe**: Bernstein, Grün und Rosé gehören dem Exportstatus, Violett dem Timer; ein
     fünfter Farbcode käme dem Exportstatus in derselben Zeile ins Gehege.
   * Der **Spaltenkopf zählt**, wie viele seiner Todos erledigt sind — die Mischung wird sichtbar,
     bevor man die Karten liest. Der zugängliche Name der Spalte nennt sie mit.
   * Die Beispieldaten decken **alle vier Kombinationen** ab, darunter beide überraschenden:
     „Beispiel GmbH — Schnittstelle neu aufsetzen“ ist erledigt und steht in *In Arbeit*,
     „Rückmeldung zur Testumgebung abwarten“ ist offen und steht in *Erledigt*. Eine Tabelle im
     Abschnitt nennt alle vier mit dem Kartentitel, an dem sie zu sehen sind.
   * `moveCard` fasst das Kennzeichen **nicht** mehr an und sagt in der Live-Ansage ausdrücklich,
     dass es unverändert bleibt. Umgekehrt ändert „Als erledigt markieren“ (I-03, neu im
     Kartenmenü) die Spalte nicht.
   * `ReactivationNotice` nennt jetzt **alle** Pools (T-005 B-12), behandelt den Fall „kein Pool“
     ausdrücklich, sagt „Die Karte bleibt, wo sie ist“ und erklärt, warum „Rückgängig“ die eben
     entstandene Buchung verwirft — wenige Sekunden stünden nach E-008 als 0,25 Stunden in der
     Abrechnung.
   * Der ganze Klickpfad I-05 ist auf dem Board in Abschnitt 4 bedienbar, nicht nur beschrieben.

3. **A/B-Frage aufgelöst.** Variante A ist gesetzt. `PreviouslyExportedMark` und die zugehörigen
   CSS-Regeln sind gelöscht, damit keine zwei Wahrheiten bleiben. Die Stelle bleibt auffindbar:
   Karte `#zur-entscheidung` in Abschnitt 2, blau abgesetzt, mit Marke „Entschieden“, eigenem
   Eintrag in der Seitenleiste und einem Absatz, der in einem Satz sagt, worin sich A und B
   unterschieden, was gesetzt ist und warum. Auch das Designsystem hält das in 3.2 fest.

4. **Einleitung für den Einstieg ohne Vorwissen.** Neuer erster Abschnitt „Was Sie hier sehen“:
   was Takt ist, was diese Seite ist und was sie nicht ist, drei Schwerpunkte mit Sprungmarke
   (Abschnitt 2 Exportstatus mit Graustufenprobe, Abschnitt 4 Spalte gegen Erledigt, Abschnitt 6
   Vermerk und Leistung), wie man die Seite bedient (Tastatur, die zwei Schalter, was anklickbar
   ist) und ein Hinweis, dass alle Zahlen Beispiele sind — mit dem Vermerk, dass die gezeigten
   Exportwerte trotzdem der Regel aus E-008 folgen.

5. **Gerundete Werte geprüft.** Die Beispieldaten in `data.ts` stimmen gegen E-008 (aufwärts auf
   die nächste Viertelstunde, Minimum 0,25): 0:07 h → 0,25 · 0:45 h → 0,75 · 1:07 h → 1,25 ·
   2:36 h → 2,75. Gerechnet wurde nichts; das sind feste Zeichenketten, und die Einleitung sagt
   das auch so.

Annahmen:

1. **„Offen“ steht auf jeder Karte, nicht nur „Erledigt“.** Der Auftrag verlangt, dass ein
   Betrachter auf einen Blick sieht, welcher der beiden Zustände welcher ist. Das geht nur, wenn
   das Kennzeichen zweiwertig sichtbar ist — sonst bedeutet „kein Etikett“ mal „offen“ und mal
   „das Etikett ist bloß nicht da“. Der Preis ist ein zusätzliches Element je Karte; es ist
   deshalb bewusst leise gestaltet.
2. **„Erledigt aufgehoben“ bekommt keine eigene Farbe.** Neutral mit gestrichelter Kontur und
   Rücklaufpfeil. Begründung oben. Wenn der Zustand als zu unauffällig empfunden wird, ist die
   nächste Stufe nicht Farbe, sondern Gewicht.
3. **Der Zustand „Erledigt aufgehoben“ bleibt sichtbar**, bis der Benutzer das Kennzeichen selbst
   wieder setzt oder zurücknimmt. Eine Zeitgrenze wäre willkürlich; ohne den Hinweis rätselt
   später jemand, warum das Häkchen weg ist.
4. **Die Demospalte heißt weiter „Erledigt“.** Das ist der schärfste Beweis der neuen Regel: eine
   Karte in der Spalte „Erledigt“, die nicht erledigt ist. Der erklärende Text spricht das
   ausdrücklich an, damit es nicht als Fehler gelesen wird.
5. **`Card` hat einen `id`-Parameter bekommen**, damit die Entscheidungsstelle direkt verlinkbar
   ist; die Überschrift wird dabei über `aria-labelledby` mit der Karte verbunden.
6. **Ein Wechsel der Spalte wird in der Live-Ansage mit dem unveränderten Kennzeichen quittiert**
   („… Das Erledigt-Kennzeichen bleibt unverändert: offen.“). Das ist etwas gesprächiger als
   nötig, aber genau die Verwechslung, um die es geht.

Risiken:

1. **Die Zustandsmatrix aus T-005 ist an dieser Stelle überholt.** T-005 beschreibt in 3.1
   Schritt 6, dass die Karte beim Timerstart „die Abschlussspalte verlässt“, und nennt als
   typischen Bruch, dass sie „mit laufendem Timer in der Abschlussspalte stehen bleibt“. Nach der
   neuen Festlegung ist genau das richtig. Die Musterseite folgt der neuen Festlegung; T-005
   müsste an dieser Stelle nachgezogen werden, sonst prüft der e2e-Test gegen die alte Fassung.
   **Das ist der wichtigste Punkt dieses Berichts.**
2. **O-01 ist beantwortet, O-02 damit gegenstandslos, O-03 weiter offen.** Ob die Todo-Liste eine
   Timer-Aktion je Zeile anbietet, ist nicht entschieden; die Musterseite zeigt den Timer in der
   Zeile deshalb nicht.
3. **Kein automatisierter Barrierefreiheitstest.** Unverändert gegenüber T-006: von Hand gebaut
   und nach Muster geprüft, aber nicht durch `axe` abgesichert. Empfehlung an unit-tester und
   e2e-tester: `@axe-core/playwright` auf der Musterseite.
4. **Visuell nicht im Browser nachgesehen.** Typprüfung, Bau und Kontrastmessung laufen sauber,
   und die neuen Regeln folgen den vorhandenen Mustern; ein Blick auf die gerenderte Seite war in
   dieser Umgebung nicht möglich (der Vorschauserver ließ sich nicht starten). Beim ersten
   Aufruf bitte auf zwei Stellen achten: die gestreifte Randschiene am Leistungsfeld und die
   Ausrichtung des Kennzeichen-Etiketts im Kartenkopf.
5. **Ziehen und Ablegen bleibt minimal.** Unverändert: kein Einfügepunkt innerhalb einer Spalte,
   kein automatisches Scrollen. Die Alternative nach SC 2.5.7 ist vorhanden.
6. **Sicherheit.** Keine Änderung: kein ausgehender Netzaufruf, kein Token, keine echten
   Kundendaten, Entwicklungs- und Vorschauserver binden nur auf `127.0.0.1`.

Offene Fragen:

1. **Die fünf Formatierungsfunktionen fehlen weiter** und sind bewusst nicht nachgebaut. Sie
   gehören nach `packages/domain` beziehungsweise `packages/format` und sind in T-009 fällig:
   `formatTimerDisplay(seconds)` → `"01:07:44"`, `formatTrackedDuration(minutes)` → `"1:07 h"`,
   `formatBillableHours(minutes)` → `"1,25"` (nach E-008, deutsches Dezimalkomma),
   `formatPeriod(start, end)` → `"31.08.2026, 09:12–10:19"`, `formatDate(date)` → `"30.08.2026"`.
   Zusatzfrage unverändert: Liefert der lokale Dienst fertige Zeichenketten, oder Rohwerte und ein
   gemeinsames Paket formatiert? Ich empfehle Letzteres, damit das Add-in dieselbe Darstellung
   bekommt.
2. **Ausweichverhalten, wenn ein Kennzeichen und ein Spaltenname sich widersprechen — bewusst
   keines.** Die Oberfläche leitet nichts ab und schlägt nichts vor. Falls später doch eine
   Automatik gewünscht ist („beim Ziehen in Spalte X automatisch erledigt setzen“), wäre das eine
   Einstellung und eine neue Entscheidung, keine Nachbesserung hier.
3. **Wohin gehören die Design-Token?** Unverändert offen. Vorschlag bleibt: in T-008 ein Paket
   `packages/ui-tokens` mit `tokens.css` und `base.css`, aus dem `apps/web` und
   `apps/outlook-addin` beziehen (A-10.6). Ich habe es nicht angelegt, weil `packages/` nicht
   meine Dateihoheit ist.
4. **Vorläufige pnpm-Dateien.** `apps/web/pnpm-workspace.yaml` und `apps/web/pnpm-lock.yaml`
   gehören in T-008 an die Wurzel und sind hier zu löschen. Unverändert.
5. **Gehören Farbmodus und Zeilendichte in die Einstellungen (S-09)?** Beide sind weiterhin nur
   Sitzungszustand.
6. **Begriffe fürs Glossar (T-004).** Bitte aufnehmen: **Erneut offen** (dritter Anzeigezustand
   des Exportstatus), **Erledigt aufgehoben** (Kennzeichen nach A-2.5) und die Festlegung, dass
   **Statusspalte** und **Erledigt** nie synonym verwendet werden — „Abschlussspalte“ sollte als
   Begriff ganz verschwinden, weil es die Sache falsch benennt.
7. **Deutsches Dezimalkomma in der Oberfläche** (`1,25`) gegen `1.25` als Zahl im Export-JSON
   (A-8.2). Weiterhin unbestätigt.
8. **SC 2.5.7 gilt für jede künftige Ziehbewegung**: Tag in Ordner verschieben (I-07), Ordner
   verschachteln (I-08), Felder im Vorlageneditor sortieren (I-15). Bitte als Auflage in die
   jeweiligen Aufgaben aufnehmen.

Nächster Schritt:

Musterseite mit `cd apps/web && pnpm install && pnpm dev` öffnen und den Klickpfad in Abschnitt 4
einmal durchspielen: Abspielknopf auf der erledigten Karte „Beispiel GmbH — Schnittstelle neu
aufsetzen“ drücken, prüfen, dass die Karte ihre Spalte behält, dass das Kennzeichen auf „Erledigt
aufgehoben“ wechselt und dass der Hinweis darunter die Pools nennt und „Rückgängig“ anbietet.
Danach in Abschnitt 6 die Graustufenprobe drücken. Parallel bitte **Risiko 1** an den
spec-ux-reviewer geben: T-005 Abschnitt 3.1 beschreibt an zwei Stellen den Spaltenwechsel, der
jetzt ausdrücklich nicht mehr stattfindet, und der e2e-Test würde sonst gegen die alte Fassung
prüfen. Für Welle 2 bleiben die zwei Aufräumarbeiten aus T-006 offen: Token in ein gemeinsames
Paket (offene Frage 3) und pnpm-Dateien an die Wurzel (offene Frage 4).
