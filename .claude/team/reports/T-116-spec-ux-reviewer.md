Aufgabe: T-116 — Wiedervorlage Spezifikation und Bedienkonzept, Welle E bis H

Status: **freigegeben** für Welle E bis H, mit drei Auflagen vor dem Dokumentierer und elf
Befunden ohne Sperrwirkung.
Prüfstand `71c6695` gegen `aca53df` (Commits `4d1da1c`, `3282322`, `4dd3171`, `71c6695`), gelesen
und nicht ausgeführt. Zeilennummern am Baum gemessen.

Artefakte: diese Datei. Sonst nichts angefaßt.

---

## Zusammenfassung

Alle fünfzehn Hinweise aus R-2a sind erledigt — dreizehn vollständig, zwei mit einem Rest, der
benannt und begründet ist (W-13 an zwei Stellen der Musterseite, W-10 an der Bildschirmgrenze).
W-11 und W-13 waren die beiden, die über mehrere Hoheiten liefen; beide sind durchgezogen: Der
Regelname kommt aus `details[].name` und wird an keiner Stelle mehr aus fremdem Text
herausgeschnitten, und „Regel über Tags" steht im Quelltext nur noch dort, wo es Geschichte ist.
Die vier neuen Wortlaute halte ich für richtig, einschließlich des Toast-Titels, der von E-060
Punkt 4 wörtlich abweicht — die Abweichung folgt der jüngeren Regel (W-5), und deshalb ist die
Entscheidung nachzuziehen und nicht der Code.

Die Ebenen-Ordnung aus T-110 ist die richtige Auflösung: Vorher war die Meldung mit der Maus
bedienbar und mit der Tastatur unerreichbar, das ist SC 2.1.1; jetzt ist sie für beide gleich
unerreichbar, solange ein Dialog steht, und danach unverändert da. Zwei Punkte bleiben, und beide
hat frontend-dev mir zu Recht überlassen: Die Bildschirmgrenze soll gebaut werden (Vorschlag 1+2
aus T-110, nicht 3), T-112-H3 nicht — jedenfalls nicht hier allein.

Neu gefunden habe ich sechs Dinge, die keine Welle bisher berührt hat. Das schwerste ist keine
Verletzung eines Erfolgskriteriums, sondern eine Ungleichheit: **Dieselbe Handlung „Zeit auf ein
erledigtes Todo buchen" hat je nach Weg zwei Ergebnisse.** Aus dem Aufgabenbereich hebt sie
„Erledigt" auf, in der Hauptanwendung nicht — und die Begründung, mit der die erste Fassung
seinerzeit gebaut wurde (Befund C-03), steht wörtlich in der Schnittstellenbeschreibung.

---

## 1. Die fünfzehn Hinweise aus R-2a gegen den Stand

| Nr | Stand | Beleg |
|---|---|---|
| W-1 OpenAPI Add-in-Buchungsroute | **erledigt** | `apps/local-api/openapi/takt-local-api.yaml:3050-3060` — der Satz ist nicht gestrichen, sondern als Irrtum kenntlich gemacht und richtiggestellt. Besser als verlangt |
| W-2 `TimerStartResult.doneCleared` | **erledigt** | `packages/domain/src/time-entry.ts:119` — „Bis T-101 stand hier …" |
| W-3 `markDone` im Adapter | **erledigt** | kein Vorkommen mehr in `packages/storage/src/sqlite/repo-todos.ts` |
| W-4 `docs/architektur.md:334-344` | **erledigt** | `:342-347`, mit Verweis auf die Stelle, die den Irrtum beschreibt. **Aber:** dieselbe Datei zählt an `:127-128` weiter „drei Vorgänge" — siehe B-8 |
| W-5 Stopp-/Orphan-Toast ohne Bezug | **erledigt** | `TimerContext.tsx:405` („Zeit gebucht auf „X“"), `:603`. Jedes „Es" hat wieder einen Bezug |
| W-6 zwei Nachbarknöpfe, zwei Verhalten | **erledigt** | `BoardScreen.tsx:452-459` — beide schließen den Dialog vor der Meldung |
| W-7 „Nicht abgerechnet" gegen „Abgerechnet" | **erledigt** | `labels.ts:454-455`, gezeigt an der **Lese**fläche über `poolRule.ts:321` und `RuleSummary.tsx:245-252`, im Formular unterdrückt (`PoolFormDialog.tsx:753`) |
| W-8 falsche Zusicherung „zwei Pools, ein Name" | **erledigt, dreifach** | `packages/domain/src/pool-movement.ts:76-87`; T-107 hat die dritte Stelle in der OpenAPI mitgenommen, die R-2a nicht kannte |
| W-9 `ReactivationNotice` nur auf der Musterseite | **erledigt** | Baustein, CSS und beide Musterstellen weg; die Musterseite zeigt jetzt den echten `ToastProvider` |
| W-10 Verdrängung schont den Rückweg | **erledigt im Kern, offen an der Bildschirmgrenze** | `ToastContext.tsx:130-138`. Siehe Abschnitt 3.2 und B-2 |
| W-11 `details[].name` | **erledigt, über zwei Hoheiten** | `packages/domain/src/kernel.ts` → `mappers.ts` (`poolReference`, einziger Bildungsort) → `apps/web/src/api/types.ts` → `errorText.ts:109-159`. Alle drei Sperren erben das Feld; kein Schnitt in `message` |
| W-12 `RefreshHint` auf allen Ansichten | **erledigt** | `screens/parts.tsx:37,50`; elf Ansichten tragen ihn |
| W-13 „Regel über Tags" | **erledigt bis auf zwei Stellen** | Restvorkommen nur noch als Geschichte (Migrationen 0009/0010, Testplan-Nachtrag) — **außer** `showcase/TagsSection.tsx:157` und `:194`, die „Poolregel" als **sichtbaren** Text führen. Siehe B-10 |
| W-14 Anzeigeort-Meldung | **erledigt** | `labels.ts:189-218`, ein Aufruf für Titel und Zeile, gerufen von `BoardScreen.tsx:235` und `TagsScreen.tsx:552`. Der Rückweg hat mit „Anzeigeort wiederhergestellt." ein eigenes Wort |
| W-15 OpenAPI „die Pools" | **erledigt** | Add-in-Bauteile auf „Regeln — Pools wie Board-Spalten" |

**Zu W-11 und W-13, der Frage aus dem Auftrag: keine Hoheit ist liegengeblieben.**
Bei W-11 hängt die Kette an fünf Dateien in drei Paketen und ist geschlossen; der Rückfall auf
`message` ist im Dateikopf von `errorText.ts:36-43` als Vertragsfall begründet und nicht als
stiller Notausgang. Bei W-13 hat domain-dev fünf Stellen mitgenommen, die R-2a gar nicht
aufgezählt hatte, und die Migrationen richtig als Geschichtsschreibung stehengelassen. Übrig sind
zwei Stellen sichtbaren Textes auf der Musterseite — die einzige Fläche, an der ein Reviewer nicht
nach dem Wort gesucht hatte, weil es dort in einem `description`-Attribut steht.

---

## 2. Die neuen Wortlaute

### 2.1 Der Toast nach „Erledigt" gegen E-060 Punkt 4

**Gebaut** (drei Flächen, zeichengleicher Titel):

```
S-02 TodoListScreen.tsx:206-221   „X“ ist erledigt.      + „Es verschwindet damit aus dieser
                                                            Liste, solange erledigte
                                                            ausgeblendet sind. Der Status bleibt
                                                            unverändert." + Bewegungssatz
                                                            + „Rückgängig“
S-03 TodoDetailScreen.tsx:157-164 „X“ ist erledigt.      + „Der Status bleibt unverändert —
                                                            Erledigt und Status sind zwei
                                                            getrennte Größen." + Bewegungssatz
S-04 BoardScreen.tsx:179-190      „X“ ist erledigt.      + „Tags und Status ändern sich dadurch
                                                            nicht." + Bewegungssatz
```

**E-060 Punkt 4 sagt:** „Die Sätze „Erledigt." und „Wieder offen." bleiben Titel; der
Bewegungssatz ist der Rumpf."

**Mein Urteil: der Code hat recht, die Entscheidung ist nachzuziehen.** E-060 Punkt 4 verweist für
die Form ausdrücklich auf E-058 Punkt 6 („wie beim Stopp"). Der Stopp trägt seit T-102 den
Todo-Namen im Titel, weil W-5 genau das verlangt hat: Der Bewegungssatz beginnt mit „Es", er kommt
zeichengleich aus `@takt/domain`, und ohne einen Bezug über ihm zeigt das „Es" auf nichts. Ein
Titel „Erledigt." wäre bei zwei gleichzeitig stehenden Meldungen wieder genau der Zustand, den
W-5 beseitigt hat. Der gebaute Titel ist außerdem an allen drei Flächen zeichengleich und paßt
zum Wiederaufnahme-Titel (`labels.ts:277`: „Timer gestartet. „X“ ist wieder offen.").

Die Entscheidung steht damit anders da als der Baum. Das ist die Auflage 1: E-060 Punkt 4 bekommt
einen Satz, sonst schreibt der Dokumentierer den Wortlaut der Entscheidung ins Handbuch und D-2
entsteht ein zweites Mal.

### 2.2 Der Toast nach der Buchung von Hand

**Gebaut** (`BookingDialogs.tsx:124-130`):

```
Titel : Zeit gebucht auf „X“.
Rumpf : Gebucht: 0:45 h.  [+ Bewegungssatz, wenn der Dienst einen liefert]
```

**Ist das Deutsch?** Ja, mit einer Einschränkung, die ich nicht zum Befund mache: „Gebucht: 0:45
h." ist eine Beschriftung mit Punkt, kein Satz, und steht vor zwei echten Sätzen. Das ist
stilistisch die schwächere Fassung — es ist aber **dieselbe** Fassung, die der Stopp seit T-097
führt (`TimerContext.tsx:391`, dieselbe Zeichenkette aus demselben Formatierer). Einheitlichkeit
schlägt hier Eleganz; wer es ändern will, ändert beide zugleich oder keines.

**Ist es dasselbe Muster wie nach dem Stopp?** In Titel, Rahmen und Bewegungssatz ja, buchstäblich.
In einem Punkt nicht: Der Stopp holt die Tagesgruppe und sagt „An diesem Tag sind für dieses Todo
… offen — das ergibt beim Export 0,25." und, wenn die Leistung fehlt, „aber noch nicht
abrechenbar." (`TimerContext.tsx:428-440`). Die Buchung von Hand sagt beides nicht. Der erste Teil
ist Geschmack und steht als O-Y beim Auftraggeber; der zweite ist es nicht — siehe B-4.

### 2.3 „Betroffen ist die Regel „Ost“." / „Betroffen sind die Regeln …"

`errorText.ts:147-159`. **Richtig, und genau die Fassung aus W-11.** Das Gattungswort steht einmal
vorn statt dreimal in der Aufzählung, es entscheidet der Satz und nicht der Eintrag
(`ruleList:109-116`), und die Aufzählungsform ist die von `listPools`. Der Rückfall ohne `name`
liefert Zeichen für Zeichen den T-097-Wortlaut. Die Anführungszeichen setzt die Oberfläche, weil
`name` keine mitbringt — das ist richtig so und im Kopf begründet.

Ein Rest bleibt und ist der einzige, den ich hier sehe: Die Aufzählungsform steht in `apps/web`
inzwischen **dreimal** und in der Domäne ein viertes Mal. Siehe B-11.

### 2.4 Die Anzeigeort-Meldung

`labels.ts:209-218`, gerufen von beiden Flächen. Die vier Wortlaute:

```
„Vom Board nehmen“      Spalte vom Board genommen.       „Ost“ — Pool. Die Regel bleibt …
  Rückgängig            Anzeigeort wiederhergestellt.    „Ost“ — Pool und Board. …
„Als Spalte aufnehmen“  Regel als Spalte aufgenommen.    „Ost“ — Pool und Board. …
  Rückgängig            Anzeigeort wiederhergestellt.    „Ost“ — Pool. …
```

W-14 ist damit erledigt: eine Fassung, ein Aufruf, und der Rückweg quittiert mit einem eigenen
Wort statt mit dem Titel der Handlung. Die Zeile sagt in beiden Fällen, was die Handlung **nicht**
tut — das ist der Ersatz für den Bestätigungsdialog, den E-059 gestrichen hat, und er trägt.

Was W-14 nicht mitgenommen hat: Die **Knopfbeschriftungen** sind weiterhin zwei
(`TagsScreen.tsx:647` „Auf das Board" gegen `BoardScreen.tsx:931` und `:1070` „Als Spalte
aufnehmen"). Siehe B-10.

---

## 3. Die Ebenen-Ordnung nach T-110

### 3.1 Der Tausch selbst — richtig, und aus dem richtigen Grund

`apps/web/src/styles/app.css:690-696`. Ich bestätige die Bewertung von T-110 in allen Punkten und
füge zwei hinzu, die dort nicht stehen.

**SC 2.1.1 (Tastatur) — vorher verletzt, jetzt erfüllt.** Der alte Zustand war nicht „eine Meldung
liegt über einem Dialog", sondern „ein Bedienelement ist mit der Maus erreichbar und mit der
Tastatur nicht": `keepTabInside` (`lib/focus.ts:42-58`) hält den Tabulator im Dialog, `.toast`
trug `pointer-events: auto` und lag auf 400. Genau das ist der Fehlerfall von SC 2.1.1, und er
bestand seit es beide Bausteine gibt. Die Überdeckung des Knopfes war nur die Seite davon, über
die ein Test stolpert. Jetzt sind Maus und Tastatur gleich: beide erreichen die Meldung nicht,
solange der Dialog steht.

**SC 2.2.1 — nicht berührt.** Eine Meldung mit Rückweg hat keine Frist (`ToastContext.tsx:185-189`
setzt den Zeitgeber nur, wenn `hasAction` falsch ist). Sie läuft hinter der Abdunklung also
**nicht** ab; sie steht danach unverändert da. Das ist die Antwort auf die zweite Hälfte der Frage
aus dem Auftrag.

**SC 1.4.3 im gedämpften Zustand — kein Befund.** `--bg-scrim` liegt bei 0,48 hell und 0,68 dunkel
(`packages/ui-tokens/tokens.css:119`, `:447`). Text hinter der Abdunklung erreicht dort kein AA.
Das ist zulässig: Die Ausnahme „inactive user interface component" greift, weil die Meldung durch
`pointer-events: none` **und** die Fokusschleife tatsächlich untätig ist. Wer das anders sähe,
müßte die Abdunklung selbst infrage stellen — T-110 hat recht.

**Zwei Ergänzungen.**

1. Die Untätigkeit ruht auf zwei ungleichen Riegeln. `pointer-events: none` ist eine Eigenschaft
   der Meldung; die Unerreichbarkeit für die Tastatur ist eine Eigenschaft des **Dialogs**
   (ein `onKeyDown` am Behälter). Die Knöpfe der Meldung bleiben im Tabulaturbaum des Dokuments
   und behalten ihren zugänglichen Namen. Das trägt heute, weil jeder Dialog mindestens ein
   fokussierbares Element hat — `keepTabInside` steigt bei einem Behälter ohne solches
   ausdrücklich aus und läßt den Fokus weiterwandern (`focus.ts:50`). Die saubere Fassung wäre
   `inert` auf `.toast-layer`, solange eine Abdunklung steht: ein Riegel statt zweier, und er
   nimmt Maus, Tastatur und Vorlesehilfe gleichzeitig. Hinweis, kein Befund gegen T-110.
2. **Es gibt genau eine Stelle, an der eine Meldung hinter der Abdunklung erst *entsteht*** —
   und die ist ein Befund, siehe B-1. An allen übrigen Stellen schließt die Aufrufstelle den
   Dialog im selben Zustandsschritt wie die Meldung (geprüft an `TagsScreen.tsx:485-488`,
   `BookingDialogs.tsx:141-144`, `ExportScreen.tsx:567-573`, `BoardScreen.tsx:452-459`,
   `TimerContext.tsx:587-608`).

**Und der Punkt, um den es eigentlich geht:** Der Fund von T-110 ist nicht die Ebene, sondern die
Meßart. Ein Fall, der zweimal grün lief, weil eine Meldung nach acht Sekunden von selbst geht, ist
kein instabiler Test — das ist der Fehler, der sich als Flackern tarnt. Daß dieselbe Messung an
den echten Stilblättern und am **gebauten** Stilblatt gefahren wurde, ist der Teil, den ich
festhalten möchte.

### 3.2 Die Bildschirmgrenze — bauen

**Meine Antwort: ja, und zwar Vorschlag 1 und 2 aus T-110, nicht 3.**

Der Befund ist gemessen und erreichbar: ab der siebten Meldung mit Rückweg (807 px Stapel bei
704 px Platz) verläßt die älteste das Fenster. `.toast-layer` ist `position: fixed`
(`app.css:615-621`); was oben hinausragt, läßt sich nicht hereinrollen. Erreichbar ist das durch
sieben Klicks auf „Erledigt" in der Todo-Liste — jeder erzeugt eine Meldung mit „Rückgängig",
und keine geht von selbst (`TodoListScreen.tsx:206-221`).

Was dabei bricht, ist nicht nur der Rückweg, sondern **SC 2.4.7 (Fokus sichtbar, AA)**: Der Knopf
bleibt tabulierbar, der Fokus landet außerhalb des sichtbaren Bereichs, und es gibt keine
Fokusanzeige zu sehen. Das ist der schärfere Beleg als SC 2.4.11, den T-110 nennt.

Zwei Auflagen an die Umsetzung, die im Vorschlag fehlen:

- Die Rollfläche braucht **kein** `tabindex="0"`. Jede Meldung trägt einen Schließknopf; wer
  hineintabuliert, rollt den Behälter von selbst mit. Ein `tabindex` an einer `aria-live`-Region
  schafft einen Halt, an dem nichts zu tun ist.
- Vorschlag 3 (`column-reverse`) scheidet aus: Er dreht Vorlese- und Tabulatorreihenfolge gegen
  die Leserichtung. Das wäre eine eigene Entscheidung, und sie wäre die falsche.

**Warum es trotzdem nicht blockiert.** „Erledigt" ist an drei Flächen umkehrbar, der Rückweg im
Toast ist dort Bequemlichkeit und nicht der einzige Weg. Auch bei „Vom Board nehmen" steht die
Gegenhandlung dauerhaft in der Regelliste (`TagsScreen.tsx:647`). Der Satz aus W-10 und aus
`ToastContext.tsx:102-107` — „seit E-059 ist der Rückweg der einzige Schutz" — ist genau
genommen zu stark; das gehört bei der Umsetzung im Kommentar richtiggestellt, sonst trägt der
nächste Umbau eine Begründung, die schon einmal überzogen war.

### 3.3 T-112-H3 — nicht hier, und nicht als Liste

**Ich schließe mich T-110 an: nicht gebaut, und das ist richtig.** Die vier Gründe tragen, und der
dritte ist der eigentliche: Dieselben Namen werden von `poolMovementSentence` in fremde Sätze
eingesetzt, an mehr Flächen als diesem Dialog. Eine Liste **hier** ergäbe zwei Darstellungen für
dieselbe Sache und ließe die Klasse offen.

Zur Sache selbst: Ein Regelname darf `“`, `„` und `,` tragen — `FORBIDDEN_IN_NAMES`
(`apps/local-api/src/http/input.ts:111`) weist nur Steuer- und Richtungszeichen ab, und das ist
richtig, weil „Meier, Schulz „Nord“" ein zulässiger Kundenname ist. Der Fund besteht also. Er
wiegt wenig: Wer Regeln anlegt, hat das Sitzungsgeheimnis, und der Getäuschte wäre er selbst.

**Falls er beauftragt wird**, ist die kleinere Fassung aus T-110 Abschnitt 4 die richtige (jeder
Name ein eigener hervorgehobener Knoten *innerhalb* des Satzes, Zeichenfolge unverändert) — und
sie gehört in **eine** Aufgabe zusammen mit `listPools`, sonst entsteht die Doppelung, die B-11
ohnehin schon beschreibt. Keine Freigabebedingung.

---

## 4. Deckung — jede Anforderungs-ID, die Welle E bis H berührt

| ID | Was in E–H daran geschah | gedeckt |
|---|---|---|
| A-2.4, I-03 | `PUT`/`DELETE /done` liefern `poolMovement`; Toast an drei Flächen | ja |
| A-2.5, I-05 | unverändert; Ansage weiter aus **einer** Stelle (`TimerContext.announceStart`), sechs Startpunkte über `timer.toggle` | ja |
| A-2.5 (zweiter Weg) | Buchung von Hand hebt „Erledigt" **nicht** auf, Add-in-Buchung schon | **nein — B-3** |
| A-3.2, A-3.4 | Bewegungssatz nennt Pools und Spalten beim Namen, eine Rechnung | ja |
| A-4.2, A-4.3 | Löschsperre nennt die Regeln über `details[].name` | ja |
| A-5.1, A-5.6 | Board unverändert; Regeldialog nach T-110 wieder bedienbar (TP-KANBAN-02) | ja |
| A-6.1, A-6.3, A-6.4 | `POST /time-entries` mit `poolMovement`, Toast dazu | ja |
| A-6.2 | `orphan_discarded` unterschieden statt gekürzt (O-R) | ja |
| A-6.5–A-6.7, A-13.5 | unverändert; Exportachse einer Regel trägt seit W-7 den Hilfssatz an der Lesefläche | ja |
| A-6.8 | unverändert; die Rückmeldung des Stopps beim Wechsel liegt jetzt hinter der Abdunklung | **halb — B-1** |
| A-7.2 gegen A-7.4 | `details[].name` und `poolMovement` tragen Regelnamen, keine Notizen; `boundaries` in jeder Welle grün; globale Suche trifft den Vermerk weiterhin nicht (`GlobalSearch.tsx:18-22`) | ja |
| A-7.3 | Leistung an der Buchung von Hand | ja, aber siehe B-4 |
| A-8.6, E-034 | Export-Vorschau kennzeichnet nicht exportierbare Gruppen und bietet das Nachtragen an (`TemplatePreview.tsx:504-531`) | ja |
| A-8.7, I-15 | `previewExportDraft` rendert den **ungespeicherten** Stand auf echten offenen Buchungen (`TemplatePreview.tsx:223`, E-051) | ja — damit ist C-19 geschlossen |
| A-9.3, A-9.5 | nicht berührt; die Regel liegt weiter beim Dienst (`TodoFormDialog.tsx:23-26`) | ja |
| A-10.3, A-10.4, A-10.9 | Add-in-Routen auf **eine** Form, `poolMovement` statt dreier Listen | ja |
| A-13.7, E-038 | nicht berührt | siehe Abschnitt 5, C-22 |
| Abschnitt 15 | `RefreshHint` auf allen elf Ansichten; Absage im Löschdialog wechselt Titel und Knöpfe | **halb — B-5, B-6** |
| Abschnitt 16 | Bewegungssatz an allen acht liefernden Vorgängen | ja, mit B-1 und B-7 |
| A-5.2, A-13.6, I-14 | unverändert **nicht** gedeckt: Die Spezifikation führt das Ziehen weiter als Vorgabe (`docs/spec.md:84`, `:257`, `:306`), E-054 hat es aufgehoben | beim Auftraggeber |
| A-3.5, A-3.6, A-5.7 | nicht nachgetragen | beim Auftraggeber |

**Zwei gebaute Fähigkeiten ohne Anforderungs-ID**, die mir in dieser Runde aufgefallen sind:

1. **Die Buchung aus dem Add-in hebt „Erledigt" auf** (`routes/addin/service.ts:689-690`). Sie
   ruht auf Befund C-03 und Aufgabe T-038, auf keiner Anforderung. A-2.5 spricht vom Starten der
   Zeiterfassung. Das gehört als Nachtrag in Abschnitt 10 oder 2 — und weil die Frage aus B-3
   ohnehin an den Auftraggeber geht, in denselben Zug.
2. `POST /time-entries` liefert `poolMovement`. Gedeckt durch E-061 Nachtrag; Entscheidungen sind
   eine zulässige Quelle. Kein Befund.

---

## 5. Die vierzehn aus T-025 (O-Q) — was inzwischen mitgelöst ist

Am Baum gemessen, nicht aus R-2a übernommen.

| Nr | Stand heute | Beleg |
|---|---|---|
| C-03 | erledigt (Welle A–C) | eine Quelle für den Bewegungssatz |
| C-12 Dashboard ohne Exportsummen | **erledigt — R-2a hat es zu Unrecht als offen geführt** | `DashboardScreen.tsx:156-165`, Kachel „Noch nicht exportiert" mit Buchungen, Exportzeilen und `formatQuarters`; der Kommentar datiert sie auf T-045, also vor R-2a |
| C-13 gerundeter Wert am Gruppenkopf | **erledigt** | `ExportScreen.tsx:815-820`, mit der Begründung, warum der alte Wert beim Nachrechnen stehenbleibt (E-031) |
| C-14 vier der acht I-10-Filter fehlen | **offen** | `BookingsScreen.tsx:304-337` führt Exportstatus, „nur schon einmal exportierte", Ab-/Bis-Tag und Todo. Kein Tag-, kein Pool-Filter |
| C-15 Vermerk ohne Rückfrage beim Verlassen | **halb** | `TodoDetailScreen.tsx:555-556` zeigt „Nicht gespeicherte Änderung"; eine Rückfrage beim Verlassen gibt es weiterhin nicht |
| C-16 Buchungszeilen in S-05 ohne Aktionen | **offen** | `TimeScreen.tsx:351-367` (`TodayRow`): Exportstatus, Zeitraum, Dauer, Leistung, Herkunft — kein Bearbeiten, kein Löschen, kein Weg zum Todo |
| C-17, C-20, C-23 | erledigt (vor R-2) | — |
| C-18 „Zielordner" für zwei Sachen | **erledigt** | `TagsScreen.tsx:404-412`, mit dem Befund im Kommentar; „Zielordner" heißt nur noch der Exportordner |
| C-19 Vorschau aus der gespeicherten statt der entworfenen Vorlage | **erledigt** | `endpoints.ts:644-648` / `TemplatePreview.tsx:223`, E-051 |
| C-21 keine Warnung vor einem Feld, das die Vorlage nicht füllen kann | **offen, entschärft** | Die Vorschau zeigt die gerenderte Zeile, der Benutzer sieht den leeren Wert — eine ausgesprochene Warnung gibt es nicht |
| C-22 globale Suche ohne Gruppierung nach Trefferart | **in der Sache erledigt** | `GlobalSearch.tsx:39-63`: Todos zuerst, dann Buchungen, jede Zeile mit eigener Kennzeichnung und Exportetikett. **Die Begründung aus E-038 ist entfallen**: Der Vermerk wird gar nicht durchsucht, also kann kein Treffer aus ihm stammen. Ich rate, den Punkt zu schließen statt ihn weiterzuschleppen |
| C-24 | erledigt (Welle A–C) | — |

**Damit sind von den vierzehn jetzt neun geschlossen** (C-03, C-12, C-13, C-17, C-18, C-19, C-20,
C-22, C-23), eine halb (C-15) und vier offen (C-14, C-16, C-21 sowie A-4.4 halb aus R-2). Mein Rat
aus R-2 und R-2a bleibt und wird durch diese Zählung eher gestützt: Die vier gehören in **eine**
Aufgabe, nicht in die Restspalte der nächsten Reviewrunde — sie sind jetzt so wenige, daß eine
Aufgabe sie faßt.

---

## 6. Sprache — abweichende Begriffe, gesammelt

| Sache | Fassung 1 | Fassung 2 | Wo |
|---|---|---|---|
| Regel auf das Board holen | „Als Spalte aufnehmen" | „Auf das Board" | `BoardScreen.tsx:931`, `:1070` gegen `TagsScreen.tsx:647` |
| Regel eines Pools | „Regel" (überall seit W-13) | „Poolregel" | `showcase/TagsSection.tsx:157`, `:194` — sichtbarer Text auf der abgenommenen Referenz |
| Zahl der Vorgänge mit Bewegung | „sieben" bzw. „drei" | acht | `openapi:4195` gegen die eigene Tabelle `:4199-4208`; `docs/architektur.md:127-128` gegen `:357-362` |
| Was sich bei „Erledigt" nicht ändert | „Der Status bleibt unverändert." | „Tags und Status ändern sich dadurch nicht." | `TodoListScreen.tsx:198` gegen `BoardScreen.tsx:178` — beide wahr, beide an derselben Handlung |

Die Gegenrichtung ist einheitlich („Vom Board nehmen" an beiden Flächen), ebenso die vier
Toast-Titel, die Exportstatus-Wörter aus E-059 und die vierzehn Bewegungssätze. Der Bestand ist
gut; das oben ist die vollständige Liste dessen, was ich gefunden habe.

---

## 7. Befunde

Keiner blockiert. Reihenfolge nach Gewicht.

### Wesentlich

```
A-6.8, Abschnitt 16   B-1   apps/web/src/app/TimerContext.tsx:550 gegen :556
     S-01/S-02/S-03/S-04, Dialog „Es läuft bereits ein Timer"
     Abweichung: `confirmSwitch` zeigt die Meldung des Stopps ("Zeit gebucht auf „X“." mit
     „Gebucht: …" und Bewegungssatz), während sein eigener Dialog noch offen steht:
     `performStop` meldet, danach folgt mit `await startTimer(...)` ein **Netzumlauf**, und
     erst dessen Antwort schließt den Dialog (`setConflict(null)`). Seit T-110 heißt das:
     Diese Meldung entsteht hinter der Abdunklung, ist dort abgedunkelt und untätig, ihre
     Achtsekundenfrist läuft, und sie liegt außerhalb des `aria-modal="true"` — Vorlesehilfen
     dürfen sie nach ARIA übergehen. Es ist die einzige Bestätigung dafür, daß die Zeit des
     verdrängten Timers gebucht wurde; A-6.8 macht das Verdrängen zu einer Handlung, die der
     Benutzer ausdrücklich bestätigt hat, also schuldet sie ihm eine Rückmeldung, die er
     lesen kann.
     Alle übrigen Aufrufstellen schließen den Dialog im selben Zustandsschritt wie die
     Meldung; diese ist die Ausnahme, und sie war es vor T-110 nur nicht sichtbar.
     Vorschlag: `setConflict(null)` **vor** `await startTimer(...)` ziehen. Der Preis ist,
     daß ein danach scheiternder Start seinen Fehler nicht mehr im Dialog zeigen kann —
     dann gehört er in eine Meldung („Gebucht, aber der neue Timer ließ sich nicht
     starten."), was die ehrlichere Auskunft ist: Der Stopp **ist** geschehen.
     Wer: frontend-dev.

SC 2.4.7, W-10       B-2   apps/web/src/app/ToastContext.tsx:130-138, styles/app.css:615-621
     Abweichung: Der Stapel hat keine Bildschirmgrenze. Ab der siebten Meldung mit Rückweg
     (gemessen 807 px bei 704 px Platz, T-110 Abschnitt 3) verläßt die älteste das Fenster;
     `position: fixed` läßt sie nicht hereinrollen. Ihr Knopf bleibt tabulierbar, der Fokus
     landet außerhalb des Sichtbaren, es gibt keine Fokusanzeige zu sehen. Erreichbar durch
     sieben Klicks auf „Erledigt" in der Todo-Liste.
     Vorschlag: T-110 Abschnitt 3, Punkte 1 und 2 — nicht Punkt 3. Kein `tabindex` an der
     Rollfläche (Begründung in Abschnitt 3.2). Bei der Gelegenheit den Satz „der einzige
     Schutz" in `:102-107` auf das Maß bringen, das er hat.
     Wer: frontend-dev.

A-2.5, C-03          B-3   apps/local-api/src/usecases/timer.ts:622-625 gegen
                           apps/local-api/src/routes/addin/service.ts:689-690
     Abweichung: Zeit auf ein erledigtes Todo zu buchen hat je nach Weg zwei Ergebnisse. Aus
     dem Aufgabenbereich hebt es „Erledigt" auf, in der Hauptanwendung („Zeit von Hand
     erfassen", `POST /time-entries`) nicht. Der Timerstart hebt es auf. Drei Wege, zwei
     Verhalten.
     Die Rechnung dahinter ist richtig gebaut — `closedEntryMovementStates` sagt lieber
     weniger als etwas Falsches, und T-107 hat den Widerspruch im Nachtrag zu E-061 selbst
     gemeldet und beantwortet bekommen (A). Der Befund ist nicht die Umsetzung, sondern daß
     die **Frage nie beim Auftraggeber war**: A-2.5 deckt nur den Timerstart, und die
     Aufhebung durch die Add-in-Buchung hat überhaupt keine Anforderungs-ID — sie ruht auf
     Befund C-03 aus T-025 und auf T-038. Genau diese Begründung steht heute in der
     Schnittstellenbeschreibung (`openapi/takt-local-api.yaml:3032-3037`: „sonst hätte
     dieselbe Handlung je nach Weg zwei Ergebnisse") — und beschreibt jetzt einen Zustand,
     den die Hauptanwendung herstellt.
     Vorschlag: dem Auftraggeber als eine Frage vorlegen („Soll das Nachtragen einer Zeit
     ein erledigtes Todo wieder öffnen?"), das Ergebnis als Nachtrag A-2.7 bzw. A-10.11 in
     die Spezifikation, und den Absatz in der OpenAPI in beiden Ausgängen nachziehen.
     Wer: Orchestrator (Frage), danach domain-dev.

E-034, A-8.6         B-4   apps/web/src/screens/BookingDialogs.tsx:124-130 und :181-188
     S-05 und S-03, Dialog „Zeit von Hand erfassen"
     Abweichung: Der Stopp-Dialog sagt ausdrücklich „Die Leistung darf leer bleiben. Dann ist
     die Buchung erfasst, aber die Tagesgruppe dieses Todos geht ohne Text nicht in den
     Export …" (`TimerContext.tsx:710-714`), und der Stopp-Toast warnt danach noch einmal
     („aber noch nicht abrechenbar.", `:428-433`). Die Buchung von Hand erzeugt dieselbe
     nicht exportierbare Tagesgruppe (E-034) und sagt weder das eine noch das andere. Sie ist
     der Weg, auf dem Zeit **nachgetragen** wird — also der, auf dem eine Leistung am
     ehesten vergessen wird.
     Das ist nicht O-Y. O-Y fragt nach dem gerundeten Exportwert und ist Geschmack; hier geht
     es um die Auskunft, daß die Gruppe so nicht in die Abrechnung geht.
     Vorschlag: den Hinweissatz des Stopp-Dialogs auch in den Buchungsdialog (eine Zeile,
     `dialog__hint`, derselbe Wortlaut). Die Warnung im Toast bleibt an O-Y hängen.
     Wer: frontend-dev.

SC 4.1.3             B-5   apps/web/src/components/ConfirmDialog.tsx:129-136
     S-08, Löschdialoge für Ordner, Tag und Status
     Abweichung: Unverändert seit R-2a Abschnitt 5.2. Die Absage des Dienstes landet in
     `consequence`, und das liegt in `aria-describedby` — eine Beschreibung wird nicht
     erneut vorgelesen, wenn sie sich ändert. T-102 hat die Hälfte behoben: Titel und beide
     Knopfnamen wechseln jetzt auch beim Ordner- und Tag-Dialog, und der Namenswechsel unter
     dem Fokus wird angesagt. Damit hört eine Vorlesehilfe „Erneut versuchen" — und kein
     Wort davon, **warum**. Der Satz mit den Regelnamen aus W-11, der eigens dafür gebaut
     wurde, kommt bei ihr nicht an.
     Vorschlag: `dialog__consequence` bekommt `role="status"`, wenn sie eine Absage trägt
     (nicht dauerhaft — sonst wird beim Öffnen die Vorwarnung angesagt). Der Baustein weiß
     das nicht selbst; eine Eigenschaft `consequenceIsStatus` oder ein zweites Feld
     `refusal` ist der kleinere Eingriff.
     Wer: frontend-dev.

Abschnitt 15         B-6   apps/web/src/screens/TodoListScreen.tsx:218
     Abweichung: `void clearTodoDone(todo.id).then(bump)` — der Rückweg aus „Erledigt" hat
     keinen `catch`. Scheitert er, geschieht nichts: keine Meldung, kein Etikett, kein
     Protokolleintrag; einen globalen Auffänger für abgewiesene Zusagen gibt es im Baum
     nicht (geprüft: kein `unhandledrejection`). Die Handlung zwei Zeilen darüber (`:176`)
     hat ihren `catch`, ebenso `undoReactivation` und `setPlacement`. Abschnitt 15 verlangt
     Fehlermeldungen ausdrücklich.
     Zusätzlich meldet dieser Rückweg als einziger der drei auch im **Erfolgsfall** nichts,
     während „Zurückgenommen." und „Anzeigeort wiederhergestellt." es tun.
     Vorschlag: `.then(bump).catch(...)` mit `toasts.failure` wie an :225, und eine
     Bestätigung wie an den beiden anderen Rückwegen.
     Wer: frontend-dev.

E-059, I-03          B-7   apps/web/src/screens/TodoListScreen.tsx:215-221 gegen
                           BoardScreen.tsx:179-190 und TodoDetailScreen.tsx:157-164
     Abweichung: Dieselbe Handlung, drei Flächen, zwei Schutzniveaus — „Erledigt" bietet in
     der Todo-Liste „Rückgängig" an, auf dem Board und in der Detailansicht nicht. Das ist
     buchstäblich der Befund, mit dem S-5 aus R-2 begonnen hat und den E-059 für „Vom Board
     nehmen" aufgelöst hat: Zwei Niveaus für eine Handlung lehren, daß eines davon keine
     Bedeutung hat.
     Vorschlag: den Rückweg an alle drei Flächen, mit derselben Fassung. Er kostet nichts —
     `markTodoDone`/`clearTodoDone` stehen an allen dreien schon nebeneinander, und die
     Bewegung dazu liefert die Antwort seit E-060 mit. (Die Gegenrichtung „Wieder offen"
     braucht ihn nicht: Sie ist selbst schon die Rücknahme.)
     Wer: frontend-dev.

E-013/E-024, A-13.6  B-8   apps/web/design/DESIGNSYSTEM.md:603 und :607-611
     Abweichung: Die abgenommene visuelle Referenz beschreibt eine Bedienung, die es seit
     E-054 nicht gibt: „Kanban | Strg+Pfeil links/rechts verschiebt die Karte; jede
     Verschiebung wird über `aria-live` angesagt" und, im Absatz zu SC 2.5.7, „Takt löst das
     doppelt — über „Verschieben nach …" im Kartenmenü und über Strg+Pfeil". Ziehen und
     Tastaturalternative sind mit E-054 entfallen (`Kanban.tsx:21`, `BoardScreen.tsx:88`).
     Doppelt unglücklich: Der Absatz warnt vor SC 2.5.7 an der einen Stelle, an der es
     **kein** Ziehen mehr gibt, und schweigt über die zwei, an denen es weiterhin eines gibt
     — Tag in Ordner (`TagTree.tsx:390`) und Feld in der Exportvorlage
     (`TemplateFields.tsx:315`). Beide haben ihre Alternative (Verschieben-Dialog bzw.
     Pfeilknöpfe `TemplateFields.tsx:423-431`), also stimmt die Umsetzung — nur die
     Referenz zeigt woandershin.
     Vorschlag: Zeile und Absatz auf die beiden verbliebenen Ziehflächen umschreiben, mit
     dem Verweis auf E-054 für die entfallene.
     Wer: frontend-dev. **Auflage 3 — vor dem Dokumentierer.**
```

### Hinweis

```
W-4-Klasse           B-9   docs/architektur.md:127-128, openapi/takt-local-api.yaml:4195
     „Drei Vorgänge liefern die Bewegung, nicht einer" bzw. „inzwischen sind es sieben" —
     es sind acht, und die OpenAPI zählt sie zwei Zeilen tiefer selbst richtig auf
     (`:4199-4208`). `docs/architektur.md` berichtigt sich 230 Zeilen später (`:357-362`)
     und widerspricht sich damit erneut auf dieselbe Weise wie in W-4.
     Dazu, gleicher Absatz: `openapi:4215-4218` begründet, `PATCH /time-entries/{id}` liefere
     keine Bewegung, weil es „einen Zeitraum oder eine Leistung" ändere. Es ändert auch
     `todoId` (`apps/local-api/src/routes/time.ts:66`), und dann bewegt es zwei Todos in
     entgegengesetzte Richtungen — das ist O-X, und die Begründung sollte darauf zeigen
     statt eine falsche zu geben (W-8-Muster: richtige Bauart, falscher Beleg).
     Wer: domain-dev. **Auflage 2 — vor dem Dokumentierer.**

Sprache             B-10   siehe Tabelle in Abschnitt 6
     „Auf das Board" gegen „Als Spalte aufnehmen"; „Poolregel" als sichtbarer Text auf der
     Musterseite (`showcase/TagsSection.tsx:157`, `:194`), obwohl E-058 Absatz 2 das Wort
     ersetzt hat und W-13 es überall sonst getilgt hat.
     Vorschlag: Knopf auf beiden Flächen „Als Spalte aufnehmen"; „Poolregel" → „Regel eines
     Pools" bzw. „Regelformular".
     Wer: frontend-dev.

Doppelung           B-11   packages/domain/src/pool-movement.ts:168-171,
                           apps/web/src/lib/format.ts:306-308,
                           apps/web/src/lib/errorText.ts:91-93,
                           apps/web/src/screens/TodoFormDialog.tsx:30-34
     Die deutsche Aufzählung „A", „A und B", „A, B und C" steht viermal, dreimal davon in
     `apps/web`. `enumerateGerman` und `joinGerman` sind Zeile für Zeile dieselbe Funktion in
     zwei Dateien desselben Pakets; `quoteList` ist zusätzlich die Anführungszeichen-Fassung
     von `listPools`. Genau diese Form ist schon einmal auseinandergelaufen — Befund C-24,
     „A und B und C".
     Das ist zugleich meine Antwort auf T-110 Offene Frage 1: **Ja, `listPools` ausführen.**
     Nicht wegen des Schadens (er wäre kosmetisch), sondern weil dieses Projekt fünf solche
     Doppelungen geschlossen hat und dies die sechste ist. Domain-dev exportiert, frontend-dev
     räumt die drei Fassungen ab; eine kleine Aufgabe über zwei Hoheiten.

Zugänglichkeit      B-12   apps/web/src/styles/app.css:690-696
     `pointer-events: none` nimmt der Meldung hinter der Abdunklung die Maus; die Tastatur
     nimmt ihr der Fokusgriff des Dialogs. Zwei ungleiche Riegel für eine Aussage. `inert`
     auf `.toast-layer`, solange eine Abdunklung steht, wäre einer statt zweier und nähme
     Maus, Tastatur und Vorlesehilfe zugleich. Kein Befund gegen T-110 — heute trägt die
     Fassung, weil jeder Dialog ein fokussierbares Element hat. Für die Weiterarbeit
     notiert, zusammen mit der Regel in Abschnitt 5.1 des Designsystems.
     Wer: frontend-dev, wenn B-2 ohnehin angefaßt wird.
```

---

## 8. Auflagen zur Freigabe

1. **E-060 Punkt 4 nachziehen** (Orchestrator, `decisions.md`). Der gebaute Titel lautet
   „„X“ ist erledigt." und nicht „Erledigt."; die Abweichung ist richtig (Abschnitt 2.1). Steht
   die Entscheidung unverändert da, schreibt der Dokumentierer ihren Wortlaut ins Handbuch —
   dieselbe Mechanik, aus der D-2 entstanden ist.
2. **B-9 vor dem Dokumentierer** (domain-dev). Zwei Zahlen und eine Begründung. Der
   Dokumentierer liest Architekturbeschreibung und OpenAPI; „drei Vorgänge" und „sieben" landen
   sonst im Handbuch.
3. **B-8 vor dem Dokumentierer** (frontend-dev). Das Designsystem beschreibt das Verschieben von
   Karten. Es ist die abgenommene Referenz; wer daraus schreibt, schreibt D-1 ein zweites Mal.

Alles Übrige ist Nacharbeit ohne Sperrwirkung. Meine Reihenfolge, wenn gefragt: B-1, B-2, B-4,
B-6, B-7, B-5, dann der Rest.

**D-1 und D-2 stehen unverändert** (`docs/benutzerhandbuch.md:119`, `:169-170`) und bleiben
blockierend für die Freigabe des Produkts, nicht für diese Runde — mit der Auflage aus R-2a
Abschnitt 6: beschreiben, nicht zitieren.

---

## 9. Rat zu den offenen Punkten

- **T-110 Frage 1 (`listPools` ausführen):** ja, siehe B-11.
- **T-110 Frage 2 (Bildschirmgrenze):** ja, bauen; Vorschlag 1+2, nicht 3. Siehe B-2.
- **T-110 Frage 3 (T-112-H3):** nein, hier nicht. Falls doch, die kleinere Fassung und in
  **einer** Aufgabe mit `poolMovementSentence`. Siehe Abschnitt 3.3.
- **T-108 Frage 3 (Wortlaut „Gebucht: …"):** gesehen und angenommen. Es ist derselbe Baustein wie
  beim Stopp; wer ihn ändert, ändert beide.
- **O-Y:** bitte zweiteilen. Der gerundete Exportwert im Toast der Buchung von Hand ist eine
  Frage an den Auftraggeber. Der Hinweis auf eine Tagesgruppe ohne Leistung ist es nicht — das
  ist B-4 und folgt aus E-034.
- **O-Q:** noch vier offene Befunde (C-14, C-16, C-21) plus A-4.4 halb. Eine Aufgabe, dann ist
  der Punkt weg.
- **O-X:** unverändert beim Auftraggeber; die Begründung in der OpenAPI ist trotzdem
  richtigzustellen (B-9).

---

## Urteil

**Freigegeben** für Welle E bis H, unter den drei Auflagen aus Abschnitt 8.

Kein blockierender Befund. Alle fünfzehn Hinweise aus R-2a sind abgearbeitet, und zwei davon
besser als verlangt: W-1 ist nicht gestrichen, sondern als Irrtum kenntlich gemacht, und W-8 ist
an einer dritten Stelle mitbehoben worden, die ich nicht gefunden hatte. Der eigentliche Gewinn
dieser Wellen ist aber T-110: Ein Fehler, der sich zwei Wiederholungen lang als Flackern getarnt
hat, ist an den echten und am gebauten Stilblatt gemessen, als Verletzung von SC 2.1.1 erkannt und
an der Ursache behoben worden — samt drei ausgeschriebenen Gegenvorschlägen und einer Regel für
die Weiterarbeit.

Was ich neu gefunden habe, liegt fast durchweg an derselben Stelle wie immer: nicht in einer
Funktion, sondern zwischen zweien. Ein Toast, der eine Netzrunde zu früh kommt. Dieselbe Handlung,
die an drei Flächen zwei Rückwege hat. Und dieselbe Buchung, die je nach Weg ein Todo wieder
öffnet oder nicht.
