# T-283 — Trägt die zweizeilige Kopfzeile der Kanban-Karte?

**Aufgabe:** T-283 — Urteil über die zweizeilige Kopfzeile der Kanban-Karte und ihre Rangfolge
**Status:** fertig (braucht Review)
**Rolle:** ui-designer
**Datum:** 2026-09-11
**Baum:** `main`, Stand nach PR #17 / T-281

## Artefakte

| Datei | Was |
|---|---|
| `docs/design/kartenkopf-board.md` | **neu** — das Urteil, die Rangfolge als Regel K-1, dazu K-2 bis K-4, Zustände, Responsives, Übergabe |
| `docs/design/traeger-und-zusage.md` | Regel **T-6 berichtigt** an der Stelle, die sie berichtigt (0.1), Folgesatz in 11.7.1 Punkt 2, Herleitung als **Nachtrag 15** samt Befund B-24 |

Kein Produktivcode, kein Oberflächentext, kein Token, keine Farbe. Keine Datei des ux-designers
berührt.

## Das Urteil

**Die zweizeilige Kopfzeile trägt. Die Frist zieht nicht um. Die Rangfolge bleibt Call-Nummer →
Erledigt-Kennzeichen → Frist — ab jetzt als Entscheidung und nicht als Gewachsenes.**

Das Argument von frontend-dev ist geprüft und **stimmt**: Die Todo-Zeile in S-02 trägt dieselben
drei Marken in **derselben Folge** und bricht seit jeher um (`TodoRow.tsx:72-93`,
`app.css:1541`). Die Karte war die einzige Fläche ohne diesen Umbruch. Das ist nachgesehen, nicht
übernommen.

Der Umbruch war darüber hinaus **nicht die bessere, sondern die einzige zulässige Wahl**: Eine
Kopfzeile, die nicht umbrechen darf, bricht bei vergrößerter Schrift SC 1.4.4, bei 400 % SC 1.4.10
und bei erhöhtem Textabstand SC 1.4.12 — jeweils durch Inhaltsverlust, und `overflow: hidden` an
der Spalte macht diesen Verlust unsichtbar. Kein Wert an Schriftgröße oder Spaltenbreite repariert
das; jede Zahl verschiebt nur die Schwelle.

## Die Rangfolge — die Frage, die nur hier zu beantworten war

Regel **K-1** mit vier Kriterien, die alle in dieselbe Richtung zeigen: Identität vor Zustand vor
Termin; konstant vor optional; schmal vor breit; unveränderlich vor täglich wechselnd. Die letzte
Marke ist die, die umbricht — und die Frist landet dadurch **unmittelbar über dem Titel**, also
näher an dem Ding, dessen Dringlichkeit sie angibt.

Die naheliegende Gegenvariante „Frist zuerst" ist geprüft und **abgelehnt**, mit vier Gründen; der
tragende: Dringlichkeit trägt hier die Lautstärke (sechs Merkmale nach T-144), nicht der Platz.
Eine voll gefüllte rote Marke in der oberen linken Ecke jeder überfälligen Karte ist genau die
„Wand aus Etiketten", gegen die T-144 Abschnitt 8.2 Auflage 3 geschrieben ist — Buchstabe gehalten,
Zweck verfehlt. Zweite Gegenvariante („Kennzeichen zuerst") ebenfalls geprüft und abgelehnt.

Die vier Zusagen aus T-144 Abschnitt 8.2 sind **einzeln** nachgesehen und alle unberührt; eine von
ihnen („immer das absolute Datum") war vor T-281 sogar nur behauptet und ist jetzt erst eingelöst,
weil der Spaltenrand das Datum vorher abschnitt.

## Bestätigt, was frontend-dev als Annahme markiert hat

Die Zeilenlücke `--space-1` gegen `--space-2` ist **richtig und rechenbar**: `.kcard__main` stapelt
mit 8 px; wäre die Zeilenlücke innerhalb der Kopfzeile ebenfalls 8 px, stünde die zweite Zeile so
weit von der ersten wie vom Titel, und der Block löste sich auf. Als Regel K-2 festgehalten.

## Übergabe an frontend-dev — nichts zu bauen, ein Satz zu schreiben

Ein Kommentarsatz an `.kcard__top`, der die **Reihenfolge** begründet (Wortlaut liegt im Papier,
Abschnitt 9.1). Der bestehende Kommentar erklärt vollständig, warum umgebrochen wird, und nicht,
warum in dieser Folge — das ist die Stelle, an der der nächste Durchgang „aus Dringlichkeit" die
Frist nach vorn zieht. Dazu fünf Sperren (kein Kürzen, keine feste Höhe, kein `order`, Innenlücke
kleiner als die Stapellücke, Faltung der Marke nicht ausbauen).

An unit-tester: ein Satz auf die **Baumreihenfolge** der drei Marken — K-1 ist ohne Prüfsatz nur
ein Kommentar. An e2e-tester: der von T-281 vorgeschlagene Fall ist aus meiner Sicht der richtige;
**keine** Prüfsätze auf Pixelhöhen (41 px ist ein Stand, keine Zusage).

## Annahmen

1. **Ich habe das Board nicht gesehen.** Alle Höhen und Breiten sind entweder übernommene Messungen
   aus T-281 oder eigene Rechnungen am Kastenmodell (rund 190 px Kopfzeilenbreite bei 272 px
   Spalte), und beides steht im Papier so gekennzeichnet (E-087).
2. **Neues Papier statt Nachtrag.** Weder `traeger-und-zusage.md` noch `textabbau-gestalt.md` hat
   einen Abschnitt über die Karte; ein Nachtrag hätte an nichts angeknüpft.
3. **Die T-6-Berichtigung habe ich mitgenommen**, ohne zu fragen. Sie ist eine Regel in meinem
   eigenen Papier, T-281 hat sie widerlegt, und Regel T-7 verlangt die Berichtigung an der Stelle,
   die sie berichtigt — nicht in der nächsten Welle.

## Risiken

* **K-1 ist eine Entscheidung ohne Wächter.** Bis der Einheitentest auf die Baumreihenfolge steht,
  hält sie nur ein Kommentar. Die Umsortierung „aus Dringlichkeit" ist der wahrscheinlichste
  künftige Eingriff an dieser Fläche.
* **Der unabhängige Abnahmeblick fehlt weiterhin** (`visual-qa` nicht verfügbar). Mein Urteil hängt
  an Regeln und Rechnungen, nicht an einem Eindruck. Das ist bei einer Gestaltfrage eine echte
  Grenze und steht als B-3 im Papier.
* **Die übrige Karte hat weiterhin kein Gestaltpapier** (B-1). Gedeckt ist ab jetzt die Kopfzeile,
  nicht Titel, Tags, Fuß oder Status.

## Befunde

* **B-1 — Die Aufgabenstellung war in einem Punkt falsch:** `docs/design/**` beschreibt die
  Kopfzeile **nirgends**, weder einzeilig noch anders. Gesucht über den Wortlaut in allen sechs
  Dateien des Ordners **und** in `apps/web/design/DESIGNSYSTEM.md`. Die einzige Erwähnung der
  Kanban-Karte dort ist eine Zeile über Rahmen und Schatten (`supertakt-layout.md:43`). Die
  Einzeiligkeit war eine stillschweigende Annahme in einer CSS-Regel — deshalb konnte sie so lange
  stehen, ohne je geprüft worden zu sein. Es gab also nichts „nachzuziehen"; es gab etwas
  **anzulegen**.
* **B-2 — Die Gestaltung `clear` ist nicht mehr wählbar, ihre Maßtoken wirken trotzdem
  kurzzeitig.** `themePresets.ts:33-36` bildet sie auf `classic` ab; der frühe Startskript
  (`apps/web/public/startup-appearance.js:10`) übernimmt den Wert aus dem Zwischenspeicher aber
  gegen eine **Form** und nicht gegen die Liste. Ein Alteintrag setzt `data-design-theme="clear"`
  bis zum Hochlauf der Anwendung — mit `--text-2xs: 0.75rem` und `--sidebar-width: 13.5rem`. Die
  20. gemessene Gestaltung in T-281 war damit **kein** toter Fall. Ob der Block aufgeräumt oder der
  Startskript gehärtet wird, ist keine Gestaltungsfrage.
* **B-24 (in `traeger-und-zusage.md` 15) — meine eigene Regel T-6 war zu weit.** Sie sagte „Maße
  hängen an keinem Themenblock, dort genügt ein Thema" und meinte den **Farbmodus**; Takt hat aber
  zwei getrennte Achsen, und auf der zweiten liegt ein Block, der Maße setzt. T-281 hat den Preis
  gemessen: 308 gegen 324 px Umbruchschwelle, derselbe Bestand, dieselbe Engine. Berichtigt.

## Offene Fragen an den Orchestrator

1. **Gehört die übrige Kanban-Karte in ein Papier?** B-1 reicht über die Kopfzeile hinaus. Ich habe
   den Auftrag nicht überdehnt.
2. **Soll K-1 bis K-4 in `apps/web/design/DESIGNSYSTEM.md` gespiegelt werden?** Fremde Hoheit; ich
   halte einen Zeiger für richtig und die Verdopplung des Wortlauts für falsch.
3. **B-2:** `clear`-Block aufräumen, Startskript gegen die Liste prüfen, oder stehen lassen?

## Nächster Schritt

1. **frontend-dev:** der Kommentarsatz aus Abschnitt 9.1 — eine Aufgabe von einer Zeile, ohne
   Vorlage bei einem Prüfer.
2. **unit-tester:** ein Satz auf die Baumreihenfolge der drei Marken in `.kcard__top`.
3. **e2e-tester:** der Fall aus T-281, unverändert übernommen.
4. Danach Review durch Code-Reviewer und spec-ux-reviewer; `visual-qa` bleibt offen, solange das
   Werkzeug fehlt.
