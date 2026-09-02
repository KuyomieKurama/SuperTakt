# T-042 — Nachprüfung der vier blockierenden Befunde aus T-025

Aufgabe: T-042 — Nachprüfung von C-01 bis C-04, Durchgang durch die übrigen 19 Befunde, zwei
Rückgaben des frontend-dev, eine Entscheidungsfrage des integration-dev
Status: fertig
Artefakte: `.claude/team/reports/T-042-spec-ux-reviewer.md` (neu, einzige Datei)

Zusammenfassung: **Alle vier Blocker sind geschlossen, keiner ist verschoben.** C-01 hat zwei Orte
statt des einen, den ich vorgeschlagen hatte, und der zweite — „Verlauf dieser Buchung" — fragt den
Dienst mit `timeEntryId` statt eine geladene Seite zu filtern; das ist die Fassung, die auch bei
einem alten Vorgang noch antwortet, und sie ist besser als mein Vorschlag. C-02 benutzt **denselben**
Baustein wie S-14 und nicht eine zweite Fassung. C-03 hat das Kästchen nicht umgedreht, sondern
entfernt, und die Auflösung der Pools in den Dienst gezogen — damit ist die Auskunft vor der
Buchung dieselbe wie danach. C-04 ist an beiden Stellen erreichbar und trägt an beiden das
Kennzeichen „Erledigt aufgehoben". C-17 und C-18 sind geschlossen und sauber begründet.

Was **nicht** mitgeschlossen ist: von den 19 übrigen Befunden aus T-025 sind vier geschlossen
(C-17, C-18, C-19, dazu F-04 durch T-036), einer ist zur Hälfte geschlossen (C-05), einer ist
mildernd verändert, aber offen (C-08). Vierzehn stehen unverändert. Drei neue Befunde kommen dazu,
alle klein, einer davon ist ein Kettenbruch im neuen Protokoll (C-26).

**22 Befunde offen, davon 0 blockierend.**

Annahmen: siehe Abschnitt 9. Die wichtigste ist dieselbe wie beim letzten Mal und ich sage sie
genauso deutlich: **Ich hatte auch in dieser Sitzung keine Shell.** Mir standen Lesen, Suchen und
Dateimuster zur Verfügung, kein `Bash`. `pnpm dev` war nicht startbar, `127.0.0.1:5173` nicht
erreichbar. Was der Auftrag unter Punkt 5 nachgeholt haben wollte — die 19 Orte mit Exportstatus am
Bildschirm —, ist **erneut gegen den Quelltext geprüft und nicht gegen die laufende Anwendung**.
Für die drei Orte, die ich als nicht erfüllt gemeldet hatte, ist das ausreichend: Sie fehlen im
Quelltext, und was nicht gerendert wird, steht auch nicht auf einem Bildschirm. Für die zwei
teilweise erfüllten wäre der Augenschein das bessere Urteil gewesen; ich lasse sie deshalb
weiterhin auf „teilweise" und nicht auf „erfüllt".

Risiken: Der Übergang von erfasster Zeit zu abgerechnetem Geld — die Stelle, an der die drei
größten Lücken aus T-025 lagen — trägt jetzt. Das verbliebene Restrisiko liegt eine Ebene
darunter: Das Protokoll beantwortet „was ist mit dieser Buchung geschehen" vollständig und „welche
Buchungen waren in diesem Lauf" nur so weit, wie geladen wurde (C-26).

Offene Fragen: drei, siehe Abschnitt 10. F-01 und F-04 aus T-025 sind erledigt, F-02 und F-03
stehen weiter.

Nächster Schritt: C-23 und C-26 zuerst — beide sind klein und beide betreffen eine Kette, die
sonst an ihrer letzten Stelle bricht. Danach C-12 und C-14 wie vom frontend-dev vorgeschlagen.

---

## 0. Wie geprüft wurde

- Gelesen: `T-025-spec-ux-reviewer.md`, `T-040-frontend-dev.md`, `T-038-integration-dev.md`,
  `T-036-frontend-dev.md`, `decisions.md` (E-001 bis E-051, 51 Einträge, keine neue seit T-025).
- Nachgeprüft am Quelltext: `apps/web/src`, `apps/outlook-addin/src`,
  `apps/local-api/src/routes/addin`, `apps/local-api/openapi`, `apps/web/src/styles`.
- Belegt wird mit Anforderungs-IDs, Entscheidungen und den Befundnummern aus T-005/T-025. Neue
  Befunde setzen die Reihe fort: **C-24 bis C-26**.
- Nicht geprüft: alles Bildschirmabhängige. Siehe AN-01.

---

## 1. Die vier Blocker

### C-01 — Das Exportprotokoll hat einen Ort. **Geschlossen.**

Beleg: R-10, E-012, E-047, A-6.6, B-08.

| Was verlangt war | Wo es steht | Urteil |
|---|---|---|
| Ein Ort für `GET /export/audit` | `screens/ExportAuditScreen.tsx`, Route `#/export/protokoll`, dritter Reiter neben Export und Vorlagen (`ExportTabs`, `router.ts:65`, `App.tsx:281`) | ✓ |
| „Verlauf dieser Buchung" in S-06 und S-03 | `BookingsScreen.tsx:234`, `TodoDetailScreen.tsx:182`, jeweils **über** „Exportstatus zurücksetzen" | ✓ |
| Zeitpunkt, Art, Begründung, Lauf je Zeile | `ExportAudit.tsx:88-179` — Zeitpunkt, Vorgangsetikett, Statuswechsel, Buchung, Lauf, Begründung, Urheber | ✓ |
| Welche Buchungen waren in einem Lauf | `ExportScreen.tsx:840-847` „Buchungen dieses Laufs" → Protokoll mit vorgewähltem Lauf | **teilweise**, → C-26 |

Drei Dinge sind besser gelöst als von mir vorgeschlagen, und ich führe sie ausdrücklich nicht als
Abweichung (AN-03 aus T-025 gilt fort):

1. **AN-02 des frontend-dev ist richtig und mein Vorschlag war falsch.** Ich hatte „Lauf aufklappen
   über `getExportRun`" vorgeschlagen. `ExportRun.groups` ist in `api/types.ts:480-487` als „vom
   Dienst nicht geliefert" dokumentiert, nachgemessen. Eine aufklappbare Zeile hätte eine leere
   Liste gezeigt. Der Verweis ins Protokoll ist die ehrlichere Antwort.
2. **`InfoDialog` statt `ConfirmDialog`.** Ein Bestätigungsknopf verspricht eine Handlung. Der
   Dialog liest nur. `components/InfoDialog.tsx` hat trotzdem alles, was §15 und SC 2.4.3
   verlangen: `role="dialog"`, `aria-modal`, Fokus hinein und zurück zum Auslöser,
   Tabulatorschleife, Escape.
3. **AN-04.** Der Verlauf einer Buchung fragt mit `timeEntryId` statt eine geladene Seite zu
   filtern. Genau die älteren Zeilen, die eine Doppelabrechnung belegen, wären sonst verschluckt
   worden. Das ist die Stelle, an der R-10 hängt, und sie ist vollständig.

Die Zustände aus §15 für den neuen Bereich sind vollständig: Leerzustand („Noch kein Vorgang
protokolliert"), zweiter Leerzustand nach Filter mit „Weitere laden", Loading und Fehler über
`AsyncBoundary` mit Wiederholung, Hover (`app.css:1394`, `:1451`), aktiver Reiter über
`aria-current="page"`. Ein Bestätigungsdialog fehlt und **muss** fehlen — der Bereich schreibt
nichts. Das ist kein Befund gegen §15, sondern seine richtige Anwendung.

### C-02 — S-07 zeigt, was geschrieben wird. **Geschlossen.**

Beleg: A-8.4, A-8.6, A-8.9, A-7.2, B-14.

`components/ExportRowPanes.tsx` ist aus `TemplatePreview` herausgelöst und wird von S-14
(`TemplatePreview.tsx:541`) und S-07 (`ExportScreen.tsx:976`) benutzt. Nachgeprüft:

- Die Zuordnung Gruppe zu Zeile kommt aus derselben Antwort (`ExportScreen.tsx:429-437`,
  `totals.groups[i]` zu `totals.rows[i]`) und wird nicht in der Ansicht gebildet.
- Der Block rechnet nichts. `row` kommt aus `POST /export/preview`, also aus dem Renderer, der auch
  die Datei schreibt (R-17). Kein zweiter Kodierweg, keine zweite Rundung.
- Der Base64-Satz steht **am Feld** und nennt, wo der Klartext danebensteht — in S-07 mit eigenem
  Text („bei den Buchungen dieser Tagesgruppe"), in S-14 mit dem allgemeinen. Das ist derselbe
  Baustein mit einem Parameter und nicht zwei Texte.
- Vier eigene Zustände vor der Zeile (`ExportScreen.tsx:923-973`): abgewählt, keine Vorlage,
  Vorlage unlesbar, Vorlage wird gelesen. Bei einer blockierten Gruppe (E-034) bleibt der Block
  bewusst leer, weil der Grund schon am Gruppenkopf steht.

Nebenwirkung, die ich begrüße: `missingFieldNames` (`ExportRowPanes.tsx:112-117`) nennt die Felder,
die es nicht in die Zeile geschafft haben — „Der Schlüssel fehlt vollständig, er steht nicht leer
da." Das beantwortet ein Stück von C-21, siehe dort.

### C-03 — Das Add-in hebt „Erledigt" automatisch auf. **Geschlossen.**

Beleg: A-2.5, A-10.9, I-05, B-04.

- `apps/local-api/src/routes/addin/service.ts:341-364`: eine Transaktion, drei Wirkungen, ohne
  Bedingung. Scheitert das Aufheben, scheitert die ganze Buchung. Das ist die Fassung, die den
  Zustand „gebucht, aber weiterhin erledigt" nicht mehr entstehen lässt — nicht einmal für einen
  Augenblick.
- `schema.ts`: `reopenIfDone` entfernt. Ein Nachzügler, der es weiterhin schickt, bekommt 201 und
  die Aufhebung trotzdem; der Nachweispfad hält genau das fest
  (`proof-addin.mjs:1102-1109`). Ein 422 wäre hier falsch gewesen, und die Begründung dafür steht
  an Ort und Stelle.
- Die OpenAPI-Beschreibung ist nachgezogen (T-039). `reopenIfDone` kommt in
  `takt-local-api.yaml` nur noch als Rückblick vor, und `proof-openapi.mjs:417` riegelt das ab.
  Das war das Risiko, das der integration-dev selbst gemeldet hatte, und es ist zu.
- Die Pools werden im Dienst über `matchesPool` aus `@takt/domain` aufgelöst, nicht im Add-in
  nachgerechnet. Damit ist B-03 („Ableitung statt Zwischenspeicher") auch für den fünften
  Buchungsort erfüllt.
- Die Auskunft steht **vor** der Entscheidung: Kurzzeile in der Trefferliste
  (`DuplicateOffer.tsx:73`), volle Ankündigung über der Schaltfläche
  (`TaskPane.tsx:464-466`), dieselben drei Wirkungen danach (`TaskPane.tsx:578-584`) — beide aus
  `duplicate/reopen.ts`, also aus einer Quelle.

**AN-01 des integration-dev (kein Rückgängig im Add-in) nehme ich an.** Die Begründung ist
tragfähig: Ein Rückgängig verlangte `timeEntries.remove` und `todos.markDone` auf dem
**dauerhaften** Add-in-Token, also genau die Ausweitung, die T-034 zurückgebaut hat. Die Auskunft
vor der Entscheidung ist der richtige Ersatz, weil sie den Fehler verhindert, statt ihn heilbar zu
machen. Damit ist **B-04 vollständig geschlossen.**

**AN-05 (Pool-Aufzählung mit Komma)** und die offene Frage 3 des integration-dev beantworte ich in
Abschnitt 4.

### C-04 — I-05 ist von allen sechs Startpunkten erreichbar. **Geschlossen.**

Beleg: A-2.5, I-05, §12.

| Startpunkt | Stand | Nachweis |
|---|---|---|
| S-03 Detailansicht | ✓ | unverändert |
| S-04 Kanban-Karte | ✓ | `BoardScreen.tsx:85,168` |
| S-02 Todo-Liste | ✓ | `TodoListScreen.tsx:83,282` |
| **S-01 Dashboard** | ✓ **neu** | `DashboardScreen.tsx:68` ohne `onlyOpen`; Zeile trägt „Erledigt" bzw. „Erledigt aufgehoben" (`:238-248`) |
| **S-05 Zeiterfassung** | ✓ **neu** | `TimeScreen.tsx:67,163,211` — Schalter, Zahl der Ausgeblendeten, Weg aus dem Leerzustand |
| **S-12 Add-in** | ✓ **neu** | siehe C-03 |

**AN-07 des frontend-dev nehme ich an.** S-01 bekommt keinen Schalter, weil „Zuletzt bearbeitet"
keine Pool-Ansicht ist, sondern eine Chronik; E-039 regelt Pool-Ansichten. Ausgeblendet wird dort
nichts, gekennzeichnet alles. Das ist die richtige Lesart von E-039 und nicht ihre Umgehung.

Der Satz in S-05, den dieser Screen bis T-040 nicht einlösen konnte, ist jetzt eingelöst.

---

## 2. Die übrigen Befunde aus T-025 — nach Gewicht

### 2.1 Geschlossen (4)

| ID | Beleg | Nachweis |
|---|---|---|
| **C-17** Timer heißt Timer | E-030 | `Timer.tsx:80-88`, `Kanban.tsx:171-172` — „Timer für ‚X' starten/stoppen" auf allen fünf Screens. „Zeiterfassung starten" kommt in `apps/web/src` nicht mehr vor. Der frontend-dev hat zusätzlich `ReactivationNotice` gefunden, wo „die Zeiterfassung läuft" stand — das ist derselbe Fehler an einer Stelle, die ich übersehen hatte. |
| **C-18** Exportordner | T-005 §6, E-011 | „Zielordner" steht in `apps/web/src` nur noch **als Kommentar, der erklärt, warum es das Wort nicht mehr gibt** (`TagsScreen.tsx:344-349`). S-08 heißt jetzt „Ordner für dieses Tag" bzw. „Neuer übergeordneter Ordner" (`:351`), S-09 und S-07 durchgehend „Exportordner" (`SettingsScreen.tsx:184`, `ExportScreen.tsx:598`, `ExportDirectoryField.tsx:330,341`). |
| **C-19** S-07 nennt den Stand der Vorlage | A-8.7, E-051 | `ExportScreen.tsx:563,583-584`: „Gezeigt und geschrieben wird der **gespeicherte** Stand dieser Vorlage. Ein Entwurf, der im Vorlageneditor noch nicht gespeichert ist, wirkt hier nicht mit." Das ist mehr als der eine Satz, den ich vorgeschlagen hatte, und es sagt beides — gezeigt und geschrieben. |
| **F-04** Exportordner als Freitext | R-11, B-5.1 | Durch T-036 erledigt: `ExportDirectoryField.tsx:338-369` wählt im Dialog des Betriebssystems; das Textfeld bleibt als Rückfallweg, wenn keine Hülle da ist. Der Unterschied „abgebrochen" gegen „gibt es hier nicht" wird an der Aufrufstelle nicht verwischt. Die häufigste Ursache für „Ordner nicht da" ist damit weg. |

### 2.2 Halb geschlossen (2)

**C-05 — Bestätigungsdialog in S-07.** A-8.8, A-8.9, R-05, §15.
Geschlossen ist der schwierigere Teil: Beim **ersten** Lauf in einen neu gewählten Ordner trägt der
Dialog ein Kontrollkästchen mit Pfad und dem A-8.9-Satz (`ExportScreen.tsx:872-876`), und der
Base64-Hinweis steht zusätzlich in der Ansicht (T-036). Offen bleibt der **Wiederholungsfall**, und
das ist der Normalfall: `description` und `consequence` (`:867-871`) nennen Anzahl, Exportzeilen,
Stunden und die Sperre — nicht den Pfad, nicht den Dateinamen, nicht den Satz zu den lesbaren
Kundennotizen. Der Pfad liegt zwei Karten darüber auf dem Bildschirm (`:598`); im letzten
Augenblick vor dem Verlassen der Anwendung gehört er in den Dialog. Der Dateiname entsteht erst im
Dienst — den führe ich nicht mehr als Mangel, solange die Antwort ihn nicht vorher kennt.

**C-08 — Zyklus beim Verschieben eines Ordners.** A-4.6, B-06, I-08.
Verändert, nicht geschlossen: Der Dialog **sagt** jetzt, was gilt („Ein Ordner kann nicht unter
einen seiner eigenen Unterordner. Takt lehnt das ab, statt einen Zyklus anzulegen.",
`TagsScreen.tsx:325`). Die Auswahl filtert weiterhin nur den Ordner selbst (`:357`,
`folder.id !== selected.id`); die Nachfahren stehen unverändert zur Wahl. A-4.6 sagt „Die Anwendung
verhindert das beim Verschieben". Ankündigen und dann ablehnen ist besser als schweigen und
ablehnen — verhindert ist es nicht. Der Präfixvergleich auf `flatFolders` (`:697-701`) bleibt der
Vorschlag.

### 2.3 Unverändert offen (14)

Nach Gewicht, nicht nach Nummer.

| ID | Kern | Gewicht |
|---|---|---|
| **C-23** | „Erledigt aufgehoben" fehlt in S-02 und S-03 | **1** — siehe Abschnitt 3.1 |
| **C-12** | S-01: Zeit und Aufteilung an den Zeilen fehlen; laufender Timer sagt nirgends „offen"; keine Tag-Kachel | 2 — drei der 19 Orte, § 12 |
| **C-14** | S-06: vier der acht Filter aus I-10 fehlen (Tag, Pool, Call-Nummer, „hat Notiz") | 3 — Tag und Pool sind die beiden, mit denen A-3.3 und A-4.5 arbeiten |
| **C-20** | Windows-Benutzername und Speicherort der Datenbank nirgends | 4 — siehe Abschnitt 3.2 |
| **C-09** | Standard-Tags nicht vorbelegt, nicht entfernbar (`TodoFormDialog.tsx:23,182`; Add-in `TagPicker`) | 5 — hängt an F-02, Produktfrage |
| **C-11** | S-08: keine Suche, keine Todo-Zahl je Tag, kein Ziehen, kein Leerzustand für einen leeren Ordner | 6 — A-4.4 wörtlich |
| **C-06** | S-11: keine Trefferzahl je Pool, keine Live-Vorschau (`TagsScreen`: weder `poolIds` noch eine Zählung) | 7 |
| **C-16** | S-05: Buchungszeilen ohne Aktionen (`TimeScreen.tsx:342-358`), damit kein Hover-Zustand nach §15 | 8 |
| **C-13** | S-03: Gruppenkopf nennt „4 Buchungen · 1:05 h offen", nicht den gerundeten Wert (`TodoDetailScreen.tsx:331-338`) | 9 |
| **C-22** | Globale Suche gruppiert nicht nach Trefferart (`GlobalSearch.tsx:193`, ein `listbox`) | 10 — E-038 verlangt es wörtlich |
| **C-10** | S-10: kein Satz zu bestehenden Todos, kein Dialog beim Leeren (`SettingsScreen.tsx:370-374`) | 11 |
| **C-21** | S-07 warnt vor dem Klick nicht, wenn eine Vorlage ein verlangtes Feld nicht füllen kann | 12 — **gemildert**: die aufgeklappte Gruppe nennt das fehlende Feld jetzt (`ExportRowPanes.tsx:90-95`). Wer nicht aufklappt, sieht es weiterhin nicht |
| **C-15** | S-03: kein Dialog beim Verlassen mit ungespeichertem Vermerk (`noteDirty` ohne `beforeunload`, ohne Routenwächter) | 13 |
| **C-07** | Add-in: Vermerk und Leistung ohne die sechs Merkmale; `addin.css` kennt weiterhin kein `note--billing`/`note--internal` | 14 — von T-038 nicht berührt, war nicht beauftragt |

### 2.4 B-06, B-10, B-11 und die zwölf Stellen unter „Was fehlt"

- **B-06** → C-08, halb (siehe 2.2). **B-10** → C-09, offen. **B-11** → C-10, offen.
- Die zwölf Stellen aus T-025, Abschnitt 7: **R-10 (Protokoll) geschlossen**, **A-8.7
  (Vorlagenstand) geschlossen** über C-19, **A-8.7 (nicht füllbares Feld) gemildert**. Die übrigen
  neun — A-3.3, A-4.4, A-4.6, A-8.5, A-9.3, A-9.4, A-13.6, A-13.7, §12 — stehen unverändert.
- **B-08 und B-14 sind damit beide geschlossen.** Von meinen neun Auflagen aus T-005n sind jetzt
  **alle neun** geschlossen. Das war die Bedingung, die ich in T-025 vor die Abnahme gestellt habe.

---

## 3. Die zwei Rückgaben des frontend-dev

### 3.1 C-23 — ja, das läuft zusammen, und es ist jetzt dringender als vorher

Bestätigt am Quelltext: `TodoListScreen.tsx` reicht `timer` nur für `isRunningFor` und `toggle`
durch (`:352,354`), `TodoDetailScreen.tsx` ebenso (`:240,259,321`). Der Erledigt-Schalter in S-03
zeigt nach der Reaktivierung schlicht „Offen" (`:296`).

Der dritte Anzeigezustand steht jetzt auf **S-01, S-04 und S-05** und fehlt auf **S-02 und S-03**.
Das ist schlechter als der Zustand vor T-040, nicht besser — nicht weil etwas kaputtgegangen wäre,
sondern weil eine Uneinheitlichkeit schwerer wiegt als ein durchgängiges Fehlen. Ein Benutzer, der
den Timer aus der Todo-Liste startet, sieht in der Zeile daneben nichts und auf dem Dashboard das
Etikett. Er wird das für eine Bedeutung halten, weil eine Oberfläche, die an einer Stelle etwas
sagt und an der anderen schweigt, immer nach Bedeutung aussieht.

Dazu kommt: S-02 und S-03 sind nach E-027 und A-6.1 die beiden Ansichten, in denen am häufigsten
gestartet wird. Der Zustand liegt im Kontext bereit (`TimerContext.tsx:85,448`), der Baustein
existiert dreifach (Kanban-Karte, `pick-row__flag`, S-05). **C-23 bleibt offen und steht ab jetzt
an erster Stelle der nicht blockierenden Nacharbeit.**

### 3.2 Der Urheber in der Protokollzeile — nicht genug. Der frontend-dev hat recht.

Beleg: A-8.5, E-010, E-042.

Der Wert ist der richtige: `export_audit.actor` kommt aus `context.system.windowsUser()`
(`usecases/structure.ts:260,296`), also aus dem Kanal, den E-042 eigens abgesichert hat, und nicht
aus `USERNAME`. Dass er jetzt überhaupt irgendwo auf dem Bildschirm steht, ist ein Fortschritt.

Er erfüllt die Anforderung trotzdem nicht, aus drei Gründen, und der erste ist der, den der
frontend-dev nennt:

1. **Vor dem ersten Export ist das Protokoll leer.** Sein eigener Leerzustand sagt es: „Noch kein
   Vorgang protokolliert." Der Wert ist also genau dann unsichtbar, wenn die Frage gestellt wird —
   vor der ersten Datei, die unter diesem Namen zum Abrechnungstool geht. Eine Auskunft, die erst
   nach der Handlung erscheint, ist bei einer Handlung mit Geldfolge keine.
2. **Es ist nicht derselbe Satz.** Die Protokollzeile sagt „Ausgelöst von: X" — das ist der
   Urheber **dieses Vorgangs**, nicht die Antwort auf „unter welchem Namen rechne ich ab". Bei
   einer übernommenen Datenbank oder einem zweiten Benutzerkonto auf demselben Rechner stünden dort
   fremde Namen, und nichts sagt, welcher der eigene ist.
3. **Die zweite Hälfte von C-20 ist gar nicht berührt.** Der Speicherort der Datenbank (E-010,
   E-018) steht weiterhin nirgends. Er ist die Auskunft, die man braucht, wenn etwas gesichert oder
   umgezogen werden soll, und die einzige Stelle, an der ein Benutzer merkt, dass seine Kundendaten
   unter `%LOCALAPPDATA%` und nicht in einem Synchronisierungsordner liegen.

**Ein Hinweis für die Umsetzung, den ich in T-025 falsch hatte.** Ich hatte geschrieben, der Wert
liege bereits in der Antwort (`api/types.ts:479`). Das stimmt nur für `ExportRun.windowsUser`, also
für einen Lauf, den es vor dem ersten Export nicht gibt. `SettingsView` (`api/types.ts:589-603`)
trägt weder den Benutzernamen noch einen Pfad, und in `takt-local-api.yaml` gibt es keine Route,
die beides liefert. **C-20 ist damit keine reine Oberflächenarbeit mehr**, sondern braucht zuerst
eine Auskunft des Dienstes — ein Feld an `GET /settings` oder eine eigene kleine Route. Das gehört
an den domain-dev, bevor der frontend-dev „Diese Installation" bauen kann.

**Urteil: C-20 bleibt auf der Liste.** F-03 ist damit weiterhin offen, aber meine Empfehlung ist
unverändert und jetzt besser begründet: anzeigen, als reiner Anzeigewert, in S-09.

---

## 4. Die Frage des integration-dev: gelten die Sätze als „dasselbe"?

**Entscheidung: Wo derselbe Satz an beiden Stellen vorkommt, muss er zeichengleich sein. Wo die
Form auseinandergeht, weil ein Toast keine Liste ist, darf sie es.**

Verglichen wurden `apps/outlook-addin/src/duplicate/reopen.ts` und
`apps/web/src/app/TimerContext.tsx:249-261`.

| Aussage | Hauptanwendung | Add-in | Urteil |
|---|---|---|---|
| kein Pool trifft | „Auf seine Tags passt derzeit keine Poolregel, es erscheint also in keinem Pool." | zeichengleich (`poolSentence`, `past`) | ✓ **schon identisch** |
| ein Pool | „Es ist zurück in dem Pool „A"." | zeichengleich | ✓ |
| drei Pools | „…„A" und „B" und „C"." (`join(" und ")`) | „…„A", „B" und „C"." | **✗ zu ändern** |
| Karte bleibt | „Die Karte bleibt, wo sie ist." | „Die Karte bleibt, wo sie ist — die Spalte ändert sich dadurch nicht." | **✗ zu ändern** |
| drei Wirkungen einzeln | nein (Titel + ein Satz) | ja (drei Punkte) | ✓ Formunterschied, zulässig |

Begründung, warum ich in beiden Fällen **die Fassung des Add-ins** setze und nicht die der
Hauptanwendung:

- Die Aufzählung mit „und" zwischen jedem Paar ist bei drei Pools kein deutscher Satz mehr. Der
  integration-dev hat das selbst gemeldet (AN-05), und er hat recht. `join(" und ")` in
  `TimerContext.tsx:255` wird zur Aufzählung mit Komma und einem abschließenden „und".
- „— die Spalte ändert sich dadurch nicht" ist der Halbsatz, der E-023 aussprechbar macht. Die
  Kurzfassung aus T-005n setzt voraus, dass der Benutzer weiß, was „die Karte" mit „der Spalte" zu
  tun hat. Der längere Satz sagt es. In einem Toast ist er genauso lang wie der kurze plus die
  Rückfrage, die er erspart.

Das ist eine kleine Änderung in fremder Dateihoheit und deshalb als eigener Befund geführt: **C-24**.

**Offene Frage 3 des integration-dev — die Zeile „Zeit gebucht" nach dem Buchen:** angenommen wie
gebaut. Zweimal „15 Minuten sind gebucht" ist Text, den man zu überfliegen lernt, und die erste der
drei Wirkungen sagt es bereits. Kein Befund.

---

## 5. Die 19 Orte mit Exportstatus — Stand

Erneut gegen den Quelltext, unter dem Vorbehalt aus AN-01.

| # | Ort | T-025 | jetzt | Anmerkung |
|---|---|---|---|---|
| 1 | S-01 Kachel | ✓ | ✓ | |
| 2 | S-01 laufender Timer | ✗ | ✗ | `Timer.tsx` kennt kein „offen"-Etikett → C-12 |
| 3 | S-01 zuletzt bearbeitet | ✗ | ✗ | `pick-row` trägt jetzt das Erledigt-Kennzeichen, aber weiterhin keine Zeit und keine Aufteilung → C-12 |
| 4–9 | S-02, S-03, S-04, S-05, S-06 | ✓ | ✓ | |
| 8 | S-05 laufender Timer | ✗ | ✗ | wie 2 → C-12 |
| 10 | S-06 Aktionsleiste | teilweise | teilweise | unverändert |
| 11 | S-07 Auswahlliste | teilweise | teilweise | enthält per Aufbau nur offene, sagt es nicht als Überschrift |
| **12** | **S-07 Vorschau** | **✗** | **✓** | C-02 |
| 13 | S-07 Ergebnis | ✓ | ✓ | |
| **14** | **S-07 Export-Verlauf** | **✗** | **teilweise** | „Buchungen dieses Laufs" führt ins Protokoll; die Antwort ist so vollständig wie das Geladene → C-26 |
| 15–17 | S-14, S-12, Globale Suche | ✓ | ✓ | |
| 18 | Globale Navigation | ✓ | ✓ | das Protokoll zählt zum Punkt „Export" (`Navigation.tsx:60`) |
| 19 | Toast nach Statuswechsel | ✓ | ✓ | |

**13 erfüllt, 3 teilweise, 3 nicht.**

*Korrektur an mir selbst:* T-025 schrieb „14 von 19 erfüllt, 2 teilweise, 3 nicht". Das war
falsch addiert — die Tabelle dort führte fünf ✗ und zwei „teilweise", also 12 erfüllt. Der
tatsächliche Fortschritt seit T-025 ist damit **+1 erfüllt und +1 von ✗ auf teilweise**, nicht das,
was die alte Summe nahegelegt hätte. Die drei verbliebenen ✗ hängen alle an C-12, also an einer
einzigen Aufgabe.

---

## 6. Zustände und Begriffe

**Zustände (§15).** Die Matrix aus T-025 gilt unverändert; dazu kommt der neue Bereich:

| Screen | Empty | Loading | Hover | Aktiv | Fehler | Bestätigung |
|---|---|---|---|---|---|---|
| S-07 Protokoll | ✓✓ | ✓ | ✓ | ✓ | ✓ | entfällt begründet |

Offen bleiben die drei kleinen Lücken aus T-025: **C-10** (S-10 ohne Dialog beim Leeren),
**C-15** (S-03 ohne Rückfrage bei ungespeichertem Vermerk), **C-16** (S-05 ohne Zeilenaktionen und
damit ohne Hover-Zustand). Neu hinzu kommt nichts.

**Begriffe.** Beide Abweichungen aus T-025 sind weg (C-17, C-18). Ich habe die 14 Screens erneut
auf abweichende Bezeichnungen durchsucht und finde **keine neue**. Die Begriffe des neuen Bereichs
sind sauber eingefügt:

- „Exportprotokoll" als Bereichsname, „Vorgang" für das Ereignis, „Statuswechsel" für den
  gespeicherten Übergang. Das Vorgangsetikett benutzt die vier Erscheinungsbilder des Exportstatus,
  trägt aber die Beschriftung des Ereignisses und für Hilfsmittel „Vorgang:" statt „Exportstatus:"
  (`ExportAudit.tsx:55`). **AN-06 des frontend-dev nehme ich an** — das ist genau die Trennung, die
  E-032 und E-050 verlangen: zwei fachliche Werte im Protokoll, vier Erscheinungsbilder in der
  Anzeige, und kein Filter, der eine Buchung aus dem Export hält.
- Das Add-in benutzt „Erledigt-Kennzeichen", „Pool" und „Buchung" wie die Hauptanwendung. Die
  Formulierung „sofern du es nicht ausdrücklich wieder aktiv setzt" ist verschwunden — sie war
  nicht nur ein Begriffs-, sondern ein Sachfehler.

Eine Kleinigkeit ohne Befundgewicht: Das Add-in duzt („sofern du …" war die alte Stelle), die
Hauptanwendung siezt durchgehend. Nach T-038 ist im Add-in keine Anrede mehr übrig, die das noch
sichtbar macht. Ich führe es als Beobachtung, nicht als Befund — aber wer dort den nächsten Satz
schreibt, sollte siezen.

---

## 7. Befunde

Vier geschlossene Blocker stehen oben. Hier die offenen und die neuen.

```
C-24  E-023, A-2.5, I-05, T-005n   TimerContext.tsx:249-261 gegen duplicate/reopen.ts   NEU
      Abweichung: Dieselbe Aussage, zwei Fassungen. (1) Drei Pools ergeben in der
      Hauptanwendung „„A" und „B" und „C"", im Add-in „„A", „B" und „C"". (2) Der Satz zur
      Karte lautet in der Hauptanwendung „Die Karte bleibt, wo sie ist.", im Add-in „… — die
      Spalte ändert sich dadurch nicht." Der Fall „kein Pool trifft" ist bereits zeichengleich,
      also ist die Absicht da; sie ist nur nicht durchgezogen.
      Vorschlag: Die Fassung des Add-ins gewinnt in beiden Fällen (Begründung in Abschnitt 4).
      `join(" und ")` wird zur Kommaaufzählung mit abschließendem „und"; der Kartensatz bekommt
      den Halbsatz zur Spalte. Zwei Zeilen in `TimerContext.tsx`, Hoheit frontend-dev.

C-25  R-10, E-012   S-07 Bereich „Protokoll", ExportAuditScreen.tsx:236-253                NEU
      Abweichung: Die drei Kacheln zählen „Exportiert", „Zurückgesetzt" und „Nicht abgerechnet"
      über die **geladenen** Zeilen. Ihr Beschreibungstext erklärt den Vorgang („In eine Datei
      geschrieben."), nicht den Umfang. Die Zeile darüber sagt „40 Vorgänge geladen von 137" —
      das ist richtig und steht an der richtigen Stelle, aber eine Kachel mit einer Zahl liest
      sich als Gesamtzahl, und zwar besonders in einem Protokoll. Der Screen begründet an drei
      anderen Stellen ausführlich, warum eine stille Teilantwort hier der teuerste Irrtum wäre;
      an dieser einen Stelle tut er es selbst.
      Vorschlag: „von 40 geladenen" in den Detailtext jeder Kachel, oder die Kacheln fallen
      lassen, bis die Route eine Zählung je Ereignis liefert. Beides ist besser als eine Zahl,
      die man für eine Auswertung halten kann.

C-26  R-10, A-6.6, C-01 Teil 3   S-07 „Letzte Exportläufe" → Protokoll                     NEU
      Abweichung: Ein Kettenbruch, bei dem jedes Glied für sich stimmt. „Buchungen dieses
      Laufs" (ExportScreen.tsx:840) springt ins Protokoll mit vorgewähltem Lauf. Der Lauffilter
      wirkt aber über die geladenen Zeilen (AN-03), und eine Seite hält 40 Zeilen
      (exportAudit.ts:37). Ein einziger Export mit 41 Buchungen schiebt jeden älteren Lauf
      vollständig von der ersten Seite. Der Knopf landet dann auf einem Leerzustand — bei genau
      den Läufen, für die man ihn drückt, nämlich den älteren. Die Ansicht lügt nicht: Der
      Leerzustand sagt, dass der Filter über das Geladene wirkt, bietet „Weitere laden" an, und
      der Chip sagt „noch nicht geladen" statt „unbekannt". Das ist sorgfältig gemacht und
      rettet den Befund trotzdem nicht: Ort 14 der 19 bleibt eine halbe Antwort.
      Vorschlag: Die offene Frage 1 des frontend-dev ist zu bejahen. `GET /export/audit` bekommt
      `exportRunId` als Abfrageparameter, die Oberfläche reicht den Filter durch statt ihn zu
      rechnen. Ein Parameter und eine WHERE-Bedingung; danach ist Ort 14 erfüllt und C-01
      vollständig statt fast. Bis dahin gehört an den Knopf, was er leisten kann.
```

Unverändert offen und in T-025 im Wortlaut belegt: **C-05** (halb), **C-06**, **C-07**, **C-08**
(halb), **C-09**, **C-10**, **C-11**, **C-12**, **C-13**, **C-14**, **C-15**, **C-16**, **C-20**,
**C-21** (gemildert), **C-22**, **C-23**.

---

## 8. Was diese Nacharbeit gut gemacht hat

Kurz, weil es für die nächste Aufgabe zählt und nicht für die Abnahme:

- **Beide Bauenden haben meinen Vorschlag an genau der Stelle verworfen, an der er falsch war, und
  es begründet.** AN-02 (kein `getExportRun`) und AN-04 (Verlauf über `timeEntryId`) sind
  nachgemessen, nicht behauptet. Die Begründung steht im Quelltext, nicht nur im Bericht.
- **C-03 ist nicht die Variante geworden, die ich zuerst genannt hatte** („das Kästchen umdrehen"),
  sondern die zweite Hälfte meines eigenen Vorschlags zu Ende gedacht: kein Schalter, auch keiner
  mit der richtigen Vorgabe, weil ein Schalter die Einladung ist, die beiden Wege wieder
  auseinanderlaufen zu lassen. Das ist die bessere Lesart von A-2.5.
- **C-02 ist ein herausgelöster Baustein und keine zweite Fassung.** Bei einer Vorschau, die R-17
  gerade gegen zwei Renderer schützt, wäre eine zweite Darstellung derselbe Fehler eine Ebene
  höher.
- **Ein durchgefallenes Kontrastpaar wurde behoben und nicht ausgenommen** (`--border-control` auf
  `--bg-inset`, 2.83:1 im dunklen Modus, jetzt `--border-strong`). 316 Paare, 0 durchgefallen.

---

## 9. Annahmen

- **AN-01. Keine Shell, zum zweiten Mal.** Diese Sitzung hatte Lesen, Suchen und Dateimuster —
  kein `Bash`. Weder `pnpm dev` noch `pnpm test` noch ein Klick auf `127.0.0.1:5173` waren
  möglich. Punkt 5 des Auftrags ist damit **nicht** nachgeholt. Nicht geprüft sind: die
  Bildschirmwirkung von Hover und Fokus, das Verhalten des Protokolls bei leerer Datenlage, bei
  einem einzelnen Vorgang und bei einer gelöschten Buchung (der frontend-dev nennt genau diese drei
  selbst als ungesehen), das Aufklappen einer Tagesgruppe mit echten Vorschaudaten, und das
  Add-in in einer Outlook-Sitzung. Wer diesen Bericht liest, soll wissen: Er belegt, **was
  gebaut ist**, nicht **dass es sich bedienen lässt**.
- **AN-02.** Die Zahlen aus T-040 und T-038 — 545 Unit-Tests grün, 316 Kontrastpaare ohne
  Durchfaller, 80 Add-in-Prüfungen bestanden, `pnpm boundaries` ohne verletzte Schicht — habe ich
  als gemessen übernommen und nicht nachgerechnet. Sie belegen, was sie prüfen. Das Protokoll hat
  laut T-040 **keinen einzigen e2e-Fall**; die elf nicht gelaufenen Fälle aus T-012 sind weiterhin
  nicht gelaufen. Die Fläche, die dadurch ungeprüft bleibt, ist genau Abschnitt 5 dieses Berichts.
- **AN-03.** Wo eine Umsetzung von meinem Vorschlag abweicht und die Abweichung besser ist, führe
  ich sie nicht als Befund. Betrifft in dieser Runde: AN-02, AN-04 und AN-07 des frontend-dev,
  AN-01 des integration-dev, und den Verzicht auf eine zweite „Zeit gebucht"-Zeile im Add-in.
- **AN-04.** „Blockierend" heißt unverändert: vor der Abnahme zu schließen. Nach dieser Prüfung
  ist kein Befund mehr blockierend.

---

## 10. Offene Fragen an den Orchestrator

- **F-02, unverändert seit T-025, hängt an C-09.** Sollen Standard-Tags im Formular vorbelegt und
  entfernbar sein, oder bleibt es beim Ergänzen durch den Dienst? Das ist eine Produktfrage, keine
  Bauentscheidung, und sie ist seit T-025 nicht beantwortet worden. Solange sie offen ist, bleibt
  C-09 offen, und das ist in Ordnung — aber es sollte niemand glauben, es sei eine Aufgabe, die nur
  noch nicht drankam.
- **F-03, geschärft, hängt an C-20.** Soll der Windows-Benutzername sichtbar sein? Meine Antwort
  ist unverändert ja (Abschnitt 3.2). **Neu ist**, dass sie nicht mehr allein den frontend-dev
  betrifft: `SettingsView` trägt den Wert nicht, und es gibt keine Route, die ihn vor dem ersten
  Export liefert. Wird F-03 mit ja beantwortet, geht sie zuerst an den domain-dev.
- **F-05, neu, hängt an C-26.** `GET /export/audit` mit `exportRunId` — ja oder nein? Der
  frontend-dev hat es als offene Frage 1 gestellt, ich unterstütze es ausdrücklich. Es ist der
  Unterschied zwischen „Ort 14 ist erfüllt" und „Ort 14 ist eine halbe Antwort mit einem ehrlichen
  Hinweis". Wenn nein, gehört der Knopf „Buchungen dieses Laufs" umbenannt in etwas, das nicht
  mehr verspricht, als er hält.

Erledigt und aus der Liste: **F-01** (durch T-038 beantwortet — eine Buchung aus dem Add-in ist ein
Timerstart im Sinn von A-2.5, und zwar durch Handeln entschieden statt durch eine Entscheidung; das
gehört als Nachtrag in `decisions.md`, sonst steht die Begründung nur in einem Quelltextkommentar).
**F-04** (durch T-036 beantwortet, siehe 2.1).

---

## 11. Urteil

**freigegeben.**

Blockierend: **keine**. C-01, C-02, C-03 und C-04 sind geschlossen, jeder von ihnen an der Stelle,
an der er stand, und keiner durch Verschieben. Damit sind alle neun Auflagen aus T-005n
geschlossen, einschließlich B-08 und B-14, die ich ausdrücklich vor die Abnahme gestellt hatte.

### Was mit dieser Freigabe bewusst offen bleibt — für das Handbuch

Was hier steht, wird später in der Dokumentation stehen. Es ist keine Restliste, sondern eine
Zusage darüber, was die Anwendung nicht tut.

1. **Der dritte Anzeigezustand „Erledigt aufgehoben" steht auf drei von fünf Listenansichten**
   (S-01, S-04, S-05) und fehlt in S-02 und S-03 (C-23). Das Handbuch darf ihn nicht als
   durchgängiges Merkmal beschreiben. Erste Aufgabe der nächsten Welle.
2. **„Welche Buchungen waren in diesem Lauf" ist nur so weit beantwortet, wie das Protokoll geladen
   ist** (C-26). Vollständig beantwortet ist dagegen „was ist mit dieser Buchung geschehen" — über
   „Verlauf dieser Buchung" in S-06 und S-03, und dieser Weg fragt den Dienst gezielt. Das Handbuch
   soll den zweiten Weg als den verlässlichen nennen.
3. **Der Windows-Benutzername und der Speicherort der Datenbank stehen in keiner Einstellung**
   (C-20). Sichtbar ist der Benutzername nur als Urheber einer Protokollzeile, also erst nach dem
   ersten Vorgang. Wer wissen will, unter welchem Namen abgerechnet wird, muss einmal exportieren.
4. **Standard-Tags sind nicht vorbelegt und nicht entfernbar** (C-09). Sie werden vom Dienst
   ergänzt und in der Rückmeldung genannt. Wer ein Todo ohne ein Standard-Tag anlegen will, legt es
   an und bearbeitet es danach. Das ist eine Folge von F-02 und keine Lücke im Bau.
5. **Ein Ordner lässt sich unter seinen eigenen Nachfahren auswählen; der Dienst lehnt es ab**
   (C-08). Der Dialog kündigt es an. Die Daten sind sicher, die Bedienung ist es nicht.
6. **S-08 hat keine Suche und kein Ziehen** (C-11), **S-05 hat keine Zeilenaktionen** (C-16),
   **S-06 hat vier der acht Filter aus I-10** (C-14), **S-11 zeigt keine Trefferzahl** (C-06),
   **die globale Suche gruppiert nicht nach Trefferart** (C-22). Das sind fünf Anforderungen, die
   die Spezifikation stellt und die diese Fassung nicht erfüllt. Sie gehören so ins Handbuch —
   als „noch nicht", nicht als „nicht vorgesehen".
7. **Vermerk und Leistung stehen im Add-in ohne die sechs Merkmale** (C-07). Ausgerechnet dort, wo
   Text aus einer fremden E-Mail einfließt. Die Trennung trägt fachlich — der Dienst nimmt den
   Vermerk nicht in den Export —, aber sie ist im Add-in nicht sichtbar gemacht.
8. **Diese Freigabe ist gegen den Quelltext ausgesprochen, nicht gegen die laufende Anwendung**
   (AN-01). Zwei Berichte in Folge sagen dasselbe: `pnpm dev` stand mir nicht zur Verfügung. Das
   Protokoll hat keinen e2e-Fall, elf Fälle aus T-012 sind weiterhin nicht gelaufen. **Bevor
   ausgeliefert wird, gehört ein Durchgang am Bildschirm dazwischen** — die drei Fälle, die der
   frontend-dev in seiner offenen Frage 2 benennt, sind die richtigen ersten.

**Was ausdrücklich abgenommen ist:** S-14 vollständig (unverändert seit T-025). Der neue Bereich
„Protokoll" vollständig, einschließlich seiner sechs Zustände. Die Exportzeile in S-07 als geteilter
Baustein. I-05 an allen sechs Startpunkten, mit allen drei Wirkungen, in beiden Anwendungen. Die
Begriffe über alle 14 Screens und beide Anwendungen, ohne Abweichung. E-012, E-016, E-020, E-023,
E-025, E-026, E-028, E-030, E-031, E-032, E-034, E-036, E-039, E-047, E-049, E-050 und E-051 —
sechzehn Entscheidungen, jede an der Stelle umgesetzt, an die sie gehört, und an jeder dieser
Stellen steht im Quelltext, warum.
