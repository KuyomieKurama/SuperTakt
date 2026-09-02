Aufgabe: T-022 — Die Anwendung: Navigation, neun Ansichten, gegen den lebenden Dienst gefahren

Status: fertig

---

Artefakte:

Neu unter `apps/web/src/`:

```
api/types.ts              die Gestalt der Antworten — gegen die Umsetzung, nicht gegen die Beschreibung
api/client.ts             fetch, Umschlag, Fehlerform, Sitzungsgeheimnis; die einzige Stelle mit `fetch`
api/endpoints.ts          62 Operationen als je eine Funktion; kein Pfad steht zweimal

app/App.tsx               die Hülle: ShellStatus ganz oben, Kopfleiste, Navigation, Inhalt
app/connection.ts         Handschlag mit der Tauri-Hülle; `@takt/desktop/shell` dynamisch geladen
app/router.ts             Ankerroute, ohne Fremdbibliothek
app/useRoute.ts           die aktuelle Route
app/Navigation.tsx        Abschnitt 14 — der Punkt heißt „Zeiterfassung“ (E-030)
app/GlobalSearch.tsx      A-13.7, Kombinationsfeld mit Tastaturbedienung
app/TimerBar.tsx          der Timer in der Kopfleiste (A-13.4)
app/TimerContext.tsx      Timer, Stoppdialog, Rückfrage A-6.8, verwaiste Buchung E-036, I-05
app/StructureContext.tsx  Spalten, Tag-Baum, Pools, Einstellungen — einmal geladen
app/ToastContext.tsx      Rückmeldung für Abschnitt 16, eine Vorlesestelle
app/RefreshContext.tsx    ein Signal, dass sich Daten geändert haben
app/useAsync.ts           Laden, Warten, Scheitern — die drei Zustände aus Abschnitt 15
app/dayGroup.ts           was eine Tagesgruppe beim Export ergibt (E-020, E-034)
app/exportSummary.ts      Exportzustand je Todo für Liste und Board (A-13.5)

screens/DashboardScreen.tsx     S-01
screens/TodoListScreen.tsx      S-02
screens/TodoDetailScreen.tsx    S-03
screens/BoardScreen.tsx         S-04, samt Spaltenverwaltung
screens/TimeScreen.tsx          S-05
screens/BookingsScreen.tsx      S-06
screens/ExportScreen.tsx        S-07
screens/TagsScreen.tsx          S-08 und S-11
screens/SettingsScreen.tsx      S-09, S-10 und S-13
screens/TodoFormDialog.tsx      I-01, I-02
screens/BookingDialogs.tsx      Buchung anlegen/ändern, Exportstatus zurücksetzen (E-012)
screens/parts.tsx               Kopfzeile, Ladezustand, Fehlerzustand, Kennzahl

components/FormDialog.tsx       modaler Dialog mit Formular, Textfeld
lib/format.ts                   Darstellung von Werten, die woanders gerechnet wurden
styles/app.css                  Hülle, Navigation, neun Ansichten — 1 598 Zeilen, kein Farbwert
```

Geändert: `apps/web/src/main.tsx` (rendert `App` statt der Musterseite; die Musterseite liegt
unter `#/designsystem`), `apps/web/src/components/BookingTable.tsx` (der Exportwert je Buchung
ist entfernt — Befund B-20), `apps/web/src/components/ExportGroups.tsx` (eine
Entscheidungsnummer aus einem Oberflächentext), `apps/web/src/showcase/data.ts` (Folge von
B-20), `apps/web/scripts/contrast-check.mjs` (18 neue Paare).

Nicht angefasst: `apps/web/test/**`, `apps/desktop/**`, `apps/local-api/**`,
`apps/outlook-addin/**`, `packages/**`, alle Wurzeldateien, `docs/**`. Keine neue Abhängigkeit,
`pnpm-lock.yaml` unverändert von mir. Kein `git commit`.

Rund 10 500 Zeilen neu, davon etwa ein Drittel Kommentar.

---

Zusammenfassung:

Die Anwendung steht. **Neun Ansichten sind fertig** — Dashboard, Todo-Liste, Todo-Detailansicht,
Kanban, Zeiterfassung, Buchungsübersicht, Export, Tags und Pools, Einstellungen —, alle gegen den
laufenden Dienst gefahren und im Browser nachgesehen: neun Adressen, neun Überschriften, **kein
Fehlerband, keine Konsolenmeldung**. `ShellStatus` hängt ganz oben, vor Navigation und Inhalt,
genau wie T-020 es verlangt hat; die drei Zeilen aus jenem Bericht sind eingebaut, `onQuit` ruft
`quit()` direkt.

**Der Prüfpfad hat vier Abweichungen zwischen der OpenAPI-Beschreibung und dem laufenden Dienst
gefunden. Zwei davon hätten die Oberfläche stillschweigend kaputtgemacht.** Ich habe die
Antworten nicht gelesen, sondern gemessen: ein Wegwerfskript startet den echten Dienst, legt
Bestand an, fährt 30 Routen und druckt die Gestalt jeder Antwort aus. Ergebnis unter „Was die
Messung gefunden hat“.

**Ein Vorgang ist nicht gebaut, und das ist der einzige echte Rückstand: „nicht abrechnen“
(E-047).** Der Dienst kennt ihn nicht — es gibt keine Route dafür, weder in der Beschreibung noch
in der Umsetzung. Beschriftung, Dialogtext und Verhalten stehen unter „Offene Fragen“
ausgeschrieben; gebaut habe ich nichts, weil ich sonst einen Knopf ausliefern würde, der eine
404-Antwort erzeugt.

---

Was fertig ist, Ansicht für Ansicht

| Screen | Zustand | Was drin ist |
|---|---|---|
| S-01 Dashboard | fertig | Timer groß, heute erfasst, noch nicht exportiert **mit gerundetem Wert**, offene und erledigte Todos, zuletzt bearbeitet, Buchungen von heute, Warnung bei nicht exportierbaren Tagesgruppen |
| S-02 Todo-Liste | fertig | Suche, Spalten-, Pool- und Tag-Filter, „Erledigte einblenden“ (E-039) mit Zeile „N erledigte Todos ausgeblendet“ (B-19), Kontrollkästchen für I-03, Timer je Zeile (E-027), Exportzusammenfassung je Zeile, Zeilenmenü, Löschdialog |
| S-03 Todo-Detail | fertig | Erledigt-Schalter, Buchungen **nach Kalendertag gruppiert**, Exportstatus je Buchung, Tagesgruppe ohne Leistung gekennzeichnet, Vermerk mit Speicherzustand, erfasste und offene Zeit samt gerundetem Wert, Tags, Herkunft |
| S-04 Kanban | fertig | Drag & Drop, Tastaturalternative (Pfeiltasten), Live-Ansage „das Erledigt-Kennzeichen bleibt unverändert“, Spaltenkopf mit „davon erledigt“, Spaltenverwaltung (anlegen, umbenennen über Standard, sortieren, löschen), E-039 |
| S-05 Zeiterfassung | fertig | großer Timer, Todo-Wahl mit Suche, Zeit von Hand, heutige Buchungen, Tagessumme **und** gerundeter Exportwert, Hinweis auf Gruppen ohne Leistung |
| S-06 Buchungen | fertig | Filter über **genau zwei** Statuswerte, Einengung „nur schon einmal exportierte“ daneben, Zeitraum, Todo, Sortierung, Mehrfachauswahl, Sammelrücksetzung mit Pflichtbegründung, Kontextmenü |
| S-07 Export | fertig | Gliederung nach Tagesgruppen mit Aufklappen (E-031), gerundeter Wert **je Gruppe aus dem Dienst**, Ausschluss einzelner Buchungen mit sofortiger Neuberechnung, Kopfzeile „N Buchungen in M Exportzeilen · X h“, nicht exportierbare Gruppen mit Grund (E-034), geprüfter Ordnerzustand, Bestätigungsdialog, Ergebnis **mit ausgelassenen Gruppen**, letzte Läufe |
| S-08/S-11 Tags | fertig | Baum in einem Aufruf, beliebig tief, Auswahl mit Aktionsbereich, Tag und Ordner anlegen, umbenennen, verschieben (I-07, I-08 samt Zyklusfehler), löschen; Pools mit Regel aus Tags und Ordnern, `any`/`all`, Unterordner |
| S-09/S-10/S-13 Einstellungen | fertig | Exportordner **mit geprüftem Zustand**, Vorlage, Rundung, Darstellung, Standard-Tags, Add-in-Token (Zustand, Erzeugen mit Bestätigung, Klartext genau einmal), Sicherheitsmeldungen |
| S-12 Add-in | fremd | gehört dem integration-dev, nicht angefasst |
| S-14 Vorlageneditor | **nicht gebaut** | siehe „Nicht gebaut“ |

**Nicht gebaut, bewusst geschnitten:**

1. **S-14, der Editor für Exportvorlagen** (I-15). Die Routen stehen
   (`/export/templates`), die Ansicht wählt die Vorlage bereits aus und zeigt sie, aber der
   Editor für die Feldliste fehlt. Er ist die aufwendigste einzelne Fläche im ganzen Auftrag —
   Feldliste, Quellenpfade, Base64-Schalter, Live-Vorschau — und der Benutzer kommt ohne ihn
   aus, weil die mitgelieferte Standardvorlage exportiert. Vorschlag: eigene Aufgabe.
2. **„Nicht abrechnen“ (E-047).** Nicht geschnitten, sondern blockiert. Siehe offene Frage 1.
3. **Das Exportprotokoll als eigene Ansicht.** `GET /export/audit` ist verdrahtet und getippt,
   aber nur die letzten Läufe werden gezeigt, nicht das Protokoll der Statuswechsel. Klein;
   gehört zu S-07.

---

Was die Messung gefunden hat

Ich habe die Antworten des laufenden Dienstes ausgedruckt statt der Beschreibung zu glauben.
Vier Stellen weichen ab, **zwei davon hätten zur Laufzeit `undefined` ergeben und nicht einen
Übersetzungsfehler**:

1. **`GET /settings` liefert nicht `AppSettings`.** Es liefert
   `{ settings, exportDirectoryState, defaultTags }`. Gegen die Beschreibung gebaut hätte
   `settings.exportDirectory` überall `undefined` ergeben — der Export-Ansicht hätte gefehlt,
   dass ein Ordner gesetzt ist. **Der Gewinn ist größer als der Schaden:**
   `exportDirectoryState` ist der **jetzt** geprüfte Zustand (`ok`, `not_set`, `missing`,
   `not_writable`, `not_a_directory`). Die Oberfläche sagt damit „Der Ordner ist da, aber Takt
   darf nicht hineinschreiben“ statt „nicht gesetzt“ — genau die Unterscheidung, die R-11
   verlangt.
2. **`POST /todos` liefert nicht das Todo allein**, sondern `{ todo, addedDefaultTagIds }`. Auch
   hier ist die Umsetzung besser als die Beschreibung: Die Rückmeldung nennt jetzt die Tags, die
   der Dienst nach A-9.5 ergänzt hat — „Als Standard-Tag kam »Intern« hinzu“. Ein Tag, den der
   Benutzer nicht gewählt hat, gehört ausgesprochen.
3. **Die Abfrageparameter heißen anders als beschrieben.** Der Dienst liest `search`, `onlyOpen`,
   `onlyWithOpenEntries`, `fromDay`, `toDay`, `onlyPreviouslyExported`; die Beschreibung nennt
   `q`, `nurOffene`, `vonTag`, `bisTag`, `nurSchonEinmalExportiert`. Ein Filter mit falschem
   Namen wird stillschweigend ignoriert — die Liste zeigt dann mehr, als sie soll, und niemandem
   fällt es auf.
4. **`ExportRun.groups` gibt es nicht.** Die Beschreibung führt das Feld, die Antwort von
   `POST /export/runs` enthält es nicht (dafür ein undokumentiertes `templateSnapshot`). Die
   Zahl der geschriebenen Zeilen kommt deshalb aus der Vorschau, mit der derselbe Lauf ausgelöst
   wurde — dieselbe Rechnung (R-17), eine Sekunde früher. Sonst stünde im Ergebnis
   „0 Exportzeilen“.

Ebenfalls gemessen und **wie beschrieben**: `POST /timer/start` antwortet mit `200` und
`kind: "confirmation_required"` statt mit einem Fehler; `doneCleared` steht auf `true`, wenn der
Start ein erledigtes Todo wieder öffnet; `exportCount` steht nach dem Zurücksetzen auf 1;
`POST /export/runs` liefert `{ run, skipped }`; die Vorschau liefert `skipped`; `Notiz` in der
Zeile ist Base64.

---

Die beiden Punkte aus T-021

1. **Der Exportstatus ist zweiwertig, und er ist es überall geblieben.** Es gibt genau eine
   Stelle, an der aus zwei Werten drei Darstellungen werden: `exportDisplayState` aus T-018.
   Jeder Filter, jede Abfrage und jede Exportauswahl kennt `open` und `exported` und sonst
   nichts. Der Schalter „nur schon einmal exportierte“ in S-06 sitzt **neben** dem Statusfeld,
   nicht darin, und trägt die Beschriftung „Einengung innerhalb des Status, kein eigener
   Statuswert“. Der Auflagenfall aus B-21 — zurückgesetzte Buchung erscheint in der Auswahl —
   ist gemessen: `exportCount = 1`, `exportStatus = open`, und sie steht in der Exportvorschau.
2. **Die ausgelassenen Gruppen stehen in der Anzeige.** Nach einem Lauf zeigt ein eigener Block
   jede Gruppe mit Kalendertag, Buchungszahl, erfasster Zeit und einem Knopf „Leistung
   nachtragen“, der auf das betroffene Todo springt. Der Satz darüber sagt, was gilt: „Der
   übrige Export ist durchgelaufen; diese Gruppen sind **weiterhin offen** und erscheinen beim
   nächsten Mal wieder.“ Dieselben Gruppen sind schon **vor** dem Lauf sichtbar — in der Liste
   als nicht auswählbar mit Grund, auf dem Dashboard als Warnung, in der Todo-Detailansicht an
   der betroffenen Tagesgruppe und im Toast nach dem Stoppen des Timers.

---

E-031: wie die Rundung sichtbar wird

Die Export-Ansicht gliedert nach Tagesgruppen und lässt jede aufklappen. Der springende Punkt
ist, **woher der gerundete Wert kommt**: Für jede Gruppe wird `POST /export/preview` mit genau
ihren Buchungen gerufen. Die Vorschau benutzt denselben Plan wie der Lauf (R-17) — dieselbe
Rundung über die Tagessumme, dieselbe Prüfung auf fehlende Leistung. **Die Oberfläche rundet
nicht und rechnet nicht.**

Damit funktioniert der Nebeneffekt, den E-031 als eigentlichen Gewinn benennt: Wird in einer
aufgeklappten Gruppe eine Buchung abgewählt, rechnet der Dienst neu, und der Wert im Gruppenkopf
ändert sich sichtbar mit. Der alte Wert bleibt währenddessen stehen statt auf „…“ zu springen —
sonst wäre der Vergleich vorher/nachher gerade nicht möglich.

Die Kopfzeile zählt beides, wie B-22 es verlangt: **„7 Buchungen in 3 Exportzeilen · 2,25 h“.**
Die Zeilenzahl kommt aus der Vorschau, nicht aus meiner Gruppierung — weichen beide je
auseinander, fällt es genau dort auf.

---

Befund B-20 ist umgesetzt, und zwar im Designsystem

`BookingTable` zeigte je Buchung einen „Exportwert“. Seit E-020 gibt es den nicht mehr: Zehn,
zwanzig und fünf Minuten am selben Tag ergeben 0,75 und nicht dreimal 0,25. Die Spalte ist
entfernt, an ihrer Stelle steht die Begründung im Vertrag des Typs. Der gerundete Wert steht
jetzt an drei Stellen und nur dort, wo er hingehört: an der Tagesgruppe in S-07, an der Summe
über alle Tagesgruppen eines Todos in S-03, und im Toast nach dem Stoppen — „Gebucht: 0:05 h. An
diesem Tag sind für dieses Todo 0:35 h offen — das ergibt beim Export 0,75.“

Das ist eine Änderung an einer abgenommenen Fläche (E-024). Sie war fällig: Der abgenommene
Baustein zeigte eine Zahl, die es nicht gibt.

---

Zustände aus Abschnitt 15 und Rückmeldungen aus Abschnitt 16

Jede Ansicht hat **Ladezustand** (Platzhalterflächen mit `role="status"`, angesagt),
**Fehlerzustand** (deutscher Text des Dienstes unverändert, technischer Schlüssel daneben, immer
mit „Erneut versuchen“ — eine Fehlermeldung ohne Wiederherstellungsweg ist eine Sackgasse) und
**zwei Leerzustände**: „noch nichts da“ mit der Hauptaktion und „nichts passt zu diesen Filtern“
mit dem Rückweg. Der Unterschied ist wichtig — im ersten Fall soll der Benutzer etwas anlegen,
im zweiten den Filter zurücknehmen.

**Vier Zustände vor allem Inhalt:** Verbindungsaufbau, „Takt läuft in der Takt-Anwendung“ (ohne
Hülle gibt es kein Sitzungsgeheimnis, und der Dienst beantwortet ohne Nachweis nichts — auch
nicht die Frage, ob es ihn gibt), Verbindung fehlgeschlagen mit Wiederholung, und die drei
Hüllenzustände aus T-020.

**Bestätigungsdialoge** für jeden Vorgang, der etwas wegnimmt oder Geld betrifft: Todo löschen,
Buchung löschen, Spalte löschen, Tag/Ordner/Pool löschen, Exportstatus zurücksetzen (mit
Pflichtbegründung und Bestätigungshaken), Sammelrücksetzung, Export ausführen, neues
Add-in-Token. Jeder sagt, was **danach** anders ist, nicht nur was er tut.

**Rückmeldung nach jeder Handlung**, an einer Stelle gebaut, mit einer einzigen Vorlesestelle.
Meldungen mit Rückweg verschwinden nicht von selbst — „Rückgängig“ ist nutzlos, wenn es weg ist,
bevor man es gelesen hat.

---

I-05 an allen sechs Startpunkten

Der Timerstart auf einem erledigten Todo läuft überall durch denselben Weg (`TimerContext`), und
die Meldung sagt alle drei Wirkungen **und** die Nicht-Wirkung:

> „Timer gestartet. »Rechnungslauf prüfen« ist wieder offen. Es ist zurück in den Pools »Kunden
> Nord« und »Prio hoch«. Die Karte bleibt, wo sie ist.“ — mit „Rückgängig“.

Die Pools nennt **der Dienst**, nicht die Oberfläche: je Pool ein Aufruf von
`/pools/{id}/todos`. Die Regelauswertung liegt in `packages/domain`; sie hier nachzubauen hieße,
zwei Wahrheiten über dieselbe Zugehörigkeit zu führen, und die falsche fiele erst auf, wenn ein
Todo im falschen Pool auftaucht. Trifft keine Regel, wird auch das gesagt (B-12).

„Rückgängig“ stoppt den Timer, **verwirft die eben entstandene Buchung** und setzt „Erledigt“
wieder — das Verwerfen ist richtig, weil Sekunden nach E-008 als 0,25 Stunden abgerechnet würden.

Der Zustand „Erledigt aufgehoben“ steht in keiner Tabelle; im Datenmodell gibt es nur gesetzt
oder nicht gesetzt. Er wird deshalb für die Sitzung gemerkt und endet, sobald der Benutzer das
Kennzeichen selbst anfasst — so bleibt der Wechsel erklärt, ohne dass die Oberfläche einen
Datenwert erfindet.

---

Tastatur und Fokus, gemessen

Die Tabulatorreihe auf S-02, ausgedruckt aus dem Browser:

```
 1 a.skip-link      "Zum Inhalt springen"                    Fokusring: ja
 2 a.brand          "Takt"                                   Fokusring: ja
 3 input            globale Suche                            Ring am Rahmen (:focus-within)
 4 button           "Zeit erfassen"                          Fokusring: ja
 5 select           Darstellung                              Fokusring: ja
 6-14 a.nav__item   Dashboard … Designsystem                 Fokusring: ja
15 button           "Neues Todo"                             Fokusring: ja
16 input            Todos durchsuchen                        Ring am Rahmen (:focus-within)
17 select           "Alle Spalten"                           Fokusring: ja
18 select           "Alle Pools"                             Fokusring: ja
19 button           "Erledigte einblenden"                   Fokusring: ja
20 input            Kontrollkästchen der ersten Zeile        Fokusring: ja
21 a                Titel der ersten Zeile                   Fokusring: ja
22 button           "Timer für »Tastaturprobe« starten"      Fokusring: ja
```

Bei den beiden Suchfeldern liegt der Ring am umschließenden Rahmen (`:focus-within`) und nicht am
`input` selbst — sichtbar ist er, und er umschließt das ganze Bedienelement.

Ebenfalls gemessen: Ein Dialog nimmt den Fokus **auf sein erstes Eingabefeld**, nicht auf das
Schließkreuz; `Esc` schließt ihn; der Fokus kehrt auf den auslösenden Knopf zurück. Die
Sperrmeldung der Hülle bleibt davon ausgenommen — sie hat kein Schließkreuz und kein Escape, wie
T-020 es festgelegt hat.

Kanban ohne Ziehen: Pfeiltasten links und rechts verschieben die fokussierte Karte um eine
Spalte (SC 2.5.7).

---

Annahmen:

1. **`@takt/desktop/shell` wird dynamisch geladen.** Bis T-020 war es ein reiner Typimport, damit
   die Musterseite im Browser lief. Jetzt werden die Befehle gebraucht — also lädt
   `app/connection.ts` das Modul zur Laufzeit. Vite legt es in ein eigenes Stück (1,27 kB), das
   ein Browser ohne Hülle nie anfordert. `isShellAvailable()` bleibt die eine Stelle, die den
   Unterschied feststellt; nachgebaut habe ich sie nicht.
2. **Die Rückfrage aus A-6.8 läuft in zwei Schritten.** `POST /timer/start` nimmt kein
   `noteForRunning` entgegen — die Beschreibung nennt das Feld, `startSchema` in
   `routes/time.ts` kennt es nicht. Mit `stopRunning: true` würde der laufende Timer also **ohne
   Leistung** beendet, und eine Tagesgruppe ohne Leistung geht nach E-034 gar nicht in den
   Export. Deshalb: erst `POST /timer/stop` **mit** der Leistung, dann `POST /timer/start`. Der
   Preis ist die verlorene Unteilbarkeit; der Gegenwert ist, dass keine abrechenbare Zeit
   stillschweigend unbrauchbar wird. Nimmt der Dienst das Feld an, wird daraus wieder ein Aufruf.
3. **Formatierung ist Darstellung, nicht Fachlogik.** `lib/format.ts` macht aus Sekunden
   `1:07 h`, aus einem Zeitstempel `12.08.2026, 09:12` und aus einem Kalendertag einen
   Filterwert. Es rundet nicht, bildet keine Tagesgruppe, rechnet keine Dauer und kodiert nichts.
   Zwei Stellen sind grenzwertig und deshalb einzeln begründet: `formatQuarters` teilt einen
   bereits gerundeten Viertelstundenwert durch vier (dieselbe Umrechnung wie
   `quarterHoursToExportNumber`), und `calendarDayOf` bildet den Tag eines Zeitstempels
   (Entsprechung zu `toCalendarDay`). Beide erzeugen keinen Abrechnungswert. Sauberer wäre der
   Aufruf der Domänenfunktionen — siehe offene Frage 3.
4. **Der Leistungstext im eingeklappten Gruppenkopf wird in der Oberfläche verbunden.** Mit
   `"; "`, dem Trennzeichen aus E-026. Es ist reine Anzeige: In die Datei geht, was der Dienst
   zusammenführt, und die einzelnen Segmente stehen aufgeklappt sichtbar getrennt darunter
   (E-028, T-005n 4.2). Die Zeile der Vorschau taugt dafür nicht — ihr Feld `Notiz` ist Base64.
5. **Die Zusammenfassung des Exportzustands je Todo entsteht aus zwei Listen.** Der Dienst kennt
   keine Route, die je Todo zusammenfasst. Zwei Listen zu holen und nach Todo zu zählen ist
   Auswertung, keine Fachlogik. Es wird bis zu zehn Seiten je Status gelesen; darüber hinaus
   sind die Zahlen Untergrenzen, und das steht im Typ (`truncated`).
6. **Der Ansichtswechsel läuft über den Anker der Adresse.** Die Anwendung wird in der Hülle als
   Datei geladen; ein Verlauf über Pfade bräuchte einen Server, der Pfade auf `index.html`
   abbildet, und den gibt es dort nicht.
7. **Ein Entwicklungszugang, der im Auslieferungsbündel nicht existiert.** Ohne Hülle gibt es
   kein Sitzungsgeheimnis. `VITE_TAKT_BASE_URL` und `VITE_TAKT_TOKEN` wirken **nur** hinter
   `import.meta.env.DEV`; beim Bauen wird der Zweig durch `false` ersetzt und fällt weg. Damit
   ließ sich die Anwendung überhaupt gegen den echten Dienst fahren — und der e2e-tester kann es
   auch.
8. **Die Musterseite bleibt.** Sie liegt unter `#/designsystem` mit einem Rückweg. Sie ist die
   Referenz für das Designsystem und wird gebraucht, sobald der Prototyp vorliegt.

---

Risiken:

1. **Die Export-Ansicht ruft je Tagesgruppe eine Vorschau — und bei jedem Ausschluss erneut für
   alle.** Bei zwanzig Gruppen sind das zwanzig Anfragen je Klick. Auf einer Loopback-Adresse
   gegen SQLite ist das im Millisekundenbereich, aber die Transaktionen sind gereiht (T-021,
   Annahme 2): Ein gleichzeitig laufender Exportlauf ließe die Vorschauen warten. Sauber wäre,
   nur die betroffene Gruppe neu zu rechnen; sauberer noch, wenn `POST /export/preview` die
   Gruppenkennzahlen mitlieferte — siehe offene Frage 2.
2. **Die Listen sind gedeckelt.** Todo-Liste 100 je Seite mit Nachladen, Buchungen 200,
   Exportkandidaten bis 1 000, Todo-Titel für die Zuordnung 200. Wer mehr als 200 Todos hat,
   sieht in der Buchungsübersicht „Unbekanntes Todo“, weil der Titel nicht mitgeladen wurde. Das
   ist die unangenehmste dieser Grenzen; sie verschwindet, sobald die Buchungsliste den Titel
   mitliefert.
3. **Die Hülle meldet das Ende des Dienstes über ein Ereignis, und ich höre es nicht.** Das
   Abonnement bräuchte `@tauri-apps/api/event` in `apps/web`, und das ist keine Abhängigkeit
   dieses Pakets. Stattdessen wird alle 20 Sekunden nachgefragt. Der Zustand erscheint also bis
   zu 20 Sekunden zu spät — sichtbar wird er trotzdem, und jede Eingabe in der Zwischenzeit
   scheitert mit einer verständlichen Meldung. Es ist die offene Frage 1a aus T-020.
4. **Die mitgelieferten Statusspalten heißen „Backlog“, „In Progress“, „Waiting“, „Done“.** Sie
   kommen aus der Migration, nicht aus der Oberfläche, und sie sind frei umbenennbar (A-5.4).
   Trotzdem steht damit beim ersten Start eine englische Beschriftung auf einem deutschen
   Bildschirm. `packages/storage` gehört nicht mir.
5. **Der Kanban-Sortierschlüssel wird beim Ziehen nicht gesetzt.** Das Ablegen ändert die Spalte;
   die Reihenfolge **innerhalb** einer Spalte lässt sich nicht ziehen. `Todo.boardRank` ist im
   Vertrag da und `PATCH /todos/{id}` nimmt ihn entgegen, aber einen neuen Rang zwischen zwei
   vorhandenen zu bilden ist eine Ordnungsschlüssel-Rechnung, und die gehört nicht in die
   Oberfläche. A-5.2 ist damit halb erfüllt.
6. **Es gibt keinen Ordnerauswahldialog.** Der Exportordner wird als Pfad getippt. Ein
   Dateidialog käme aus der Hülle (`tauri-plugin-dialog`), und die Hülle gehört nicht mir. Der
   geprüfte Zustand daneben mildert das: Ein Tippfehler wird sofort als „nicht erreichbar“
   gemeldet, nicht erst beim Export.
7. **Kein automatischer Test dieser Oberfläche.** `apps/web/test/**` gehört dem e2e-tester. Was
   ich gemessen habe, steht in Wegwerfskripten und ist nicht wiederholbar eingecheckt. Die neun
   Ansichten sind einmal grün gefahren worden, nicht dauerhaft abgesichert.

---

Offene Fragen:

1. **An den Orchestrator und den domain-dev: „Nicht abrechnen“ (E-047) braucht eine Route.**
   Es gibt keine. `PUT /time-entries/{id}/export-status` kann den Status ausschließlich auf
   `open` setzen und weist `exported` mit `export_status_not_settable` ab — richtig so, denn der
   Weg nach `exported` führt über einen Exportlauf. E-047 verlangt aber genau diesen Übergang mit
   **eigenem Ereignistyp** im Protokoll, ohne Exportlauf.

   Was ich brauche, um es zu bauen — die Oberfläche steht sonst bereit:

   ```
   POST /api/v1/time-entries/{timeEntryId}/nicht-abrechnen
   Rumpf:    { "reason": "…" }      reason freiwillig, max. 512 Zeichen
   200:      TimeEntry              exportStatus danach 'exported', exportCount unverändert
   409:      already_exported       die Buchung ist bereits ausgebucht oder exportiert
   Protokoll: export_audit mit event = 'not_billed', export_run_id NULL
   ```

   Die Oberfläche dazu ist entschieden und wartet nur auf den Aufruf: Eintrag **„Nicht
   abrechnen“** im Zeilenmenü von S-06 und in der Buchungsliste von S-03, sichtbar nur bei
   offenen Buchungen. Bestätigungsdialog, Titel „Diese Zeit nicht abrechnen?“, Text: „Die Buchung
   wird als abgeschlossen geführt und geht in keinen Export mehr ein. Exportiert wird sie nicht —
   Sie rechnen diese Zeit einfach nicht ab.“ Freiwilliges Feld „Grund (optional)“, **keine**
   Pflichtbegründung. Der Vorgang heißt nirgends „als exportiert markieren“.

2. **An den domain-dev: `POST /export/preview` sollte die Gruppenkennzahlen mitliefern.**
   `previewExport` hat sie (`plan.groups`, parallel zu `plan.rows`), gibt aber nur `rows` und
   `skipped` heraus. Mit `groups: ExportGroupSummary[]` in der Antwort bräuchte S-07 **einen**
   Aufruf statt einen je Tagesgruppe, und die Gliederung käme vollständig aus der Domäne, statt
   dass die Oberfläche nach derselben Regel gruppiert. Das ist die einzige Stelle, an der ich
   eine Regel der Domäne (Kalendertag des Timerstarts, E-025) für die Anzeige nachbilde.

3. **An den Orchestrator: darf `apps/web` von `@takt/domain` abhängen?** Es ginge um zwei
   Funktionen — `quarterHoursToExportNumber` und `toCalendarDay` —, die ich heute in
   `lib/format.ts` nachbilde. Die Abhängigkeit wäre ein Arbeitsbereichsverweis und damit drei
   Zeilen in `pnpm-lock.yaml`, einer Wurzeldatei. Ich habe sie **nicht** angefasst und
   stattdessen begründet nachgebildet. Die Frage ist eine Grenzfrage und keine Umsetzungsfrage:
   Soll die Oberfläche die Domäne benennen dürfen?

4. **An den documenter und den spec-ux-reviewer: die OpenAPI-Beschreibung stimmt an vier Stellen
   nicht.** Aufgezählt oben. Sie ist die Grundlage, gegen die der e2e-tester und ein späterer
   zweiter Aufrufer bauen. Wer sie nachzieht, entscheidet auch, welche Seite recht behält — bei
   den Parameternamen wäre die deutsche Fassung aus der Beschreibung mit `CLAUDE.md` besser
   vereinbar als das englische `onlyOpen`, aber die Umsetzung ist da und die Beschreibung nicht.

5. **An den Auftraggeber: Entscheidungsnummern stehen nicht mehr auf dem Bildschirm.** Ich habe
   Verweise wie „(E-034)“ und „(A-9.5)“ aus allen Oberflächentexten entfernt, auch aus einem
   abgenommenen Baustein (`ExportGroups.tsx`). Begründung: Abschnitt 17 verlangt, dass sich die
   Anwendung „wie ein tatsächlich entwickeltes professionelles Produkt anfühlt, nicht wie eine
   Demo“, und kein Produkt zitiert seine eigenen Entscheidungsnummern. Die Sätze selbst sind
   geblieben; in der Musterseite unter `#/designsystem` stehen die Nummern weiter, weil sie sich
   an das Team richtet. Falls das falsch ist, ist es eine Zeile je Stelle zurück.

6. **An den e2e-tester: die Anwendung ist ohne Tauri fahrbar.** `VITE_TAKT_BASE_URL` und
   `VITE_TAKT_TOKEN` setzen, den Dienst mit einem bekannten Startgeheimnis auf `stdin` starten,
   Vite auf **Port 5173** binden — eine andere Portnummer scheitert an der Herkunftsprüfung, und
   der Browser meldet das als „Der lokale Dienst antwortet nicht“. Genau so sind die neun
   Ansichten geprüft worden.

---

Nächster Schritt:

1. **Offene Frage 1 entscheiden und die Route bauen.** „Nicht abrechnen“ ist der einzige Vorgang
   aus der Aufgabenstellung, den es nicht gibt. Die Oberfläche dazu ist beschrieben und in einer
   Stunde eingesetzt.
2. **S-14, der Vorlageneditor**, als eigene Aufgabe. Reihenfolge nach Nutzen: Er kommt nach
   „Nicht abrechnen“ und vor allem Feinschliff, weil ohne ihn A-8.7 unerfüllt bleibt — die
   Exportstruktur ist konfigurierbar, aber nicht konfigurierbar **in der Anwendung**.
3. **Der e2e-tester kann fahren.** Die drei Fälle aus T-020 (Escape schließt die Sperrmeldung
   nicht, der Tabulator verlässt sie nicht, „Datenordner allein“ erzeugt kein Fehlerband) sind
   jetzt in einer echten Anwendung erreichbar. Dazu die Abnahmefälle aus T-005n: B-21 (nach dem
   Zurücksetzen steht die Buchung in S-07 wieder in der Auswahl), B-19 (die Zeile „N erledigte
   Todos ausgeblendet“), I-05 an allen sechs Startpunkten.
4. **Offene Frage 2 an den domain-dev** — sie macht S-07 schneller **und** richtiger.
5. **Die deutschen Standardspalten** (Risiko 4) — eine Zeile in der Migration, `packages/storage`.

---

## Anhang — `pnpm contrast`, wörtlich (230 Paare, 18 davon neu)

```
$ pnpm --filter @takt/web contrast

== Modus hell ==
OK    14.80:1 (min 4.5:1)  --text-primary auf --bg-canvas  — Standardtext auf Anwendungshintergrund
OK    15.76:1 (min 4.5:1)  --text-primary auf --bg-surface  — Standardtext auf Karte
OK    14.03:1 (min 4.5:1)  --text-primary auf --bg-subtle  — Tabellenkopf
OK    14.03:1 (min 4.5:1)  --text-primary auf --bg-hover  — Zeile unter dem Zeiger
OK    14.27:1 (min 4.5:1)  --text-primary auf --bg-selected  — ausgewaehlte Zeile
OK     8.39:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Sekundaertext
OK     5.64:1 (min 4.5:1)  --text-muted auf --bg-surface  — Hilfetext, Platzhalter
OK     5.30:1 (min 4.5:1)  --text-muted auf --bg-canvas  — Hilfetext auf Hintergrund
OK     5.02:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Spaltenueberschrift
OK     3.10:1 (min 3.0:1)  --text-disabled auf --bg-disabled  — deaktiviert, ausgenommen nach SC 1.4.3
OK     8.16:1 (min 4.5:1)  --text-link auf --bg-surface  — Verweis
OK     7.88:1 (min 4.5:1)  --text-secondary auf --bg-canvas  — Einleitungstext auf Hintergrund
OK     7.66:1 (min 4.5:1)  --accent-text auf --bg-canvas  — hervorgehobener Navigationseintrag
OK    14.27:1 (min 4.5:1)  --text-primary auf --accent-bg-subtle  — Text im Entscheidungskasten
OK     5.98:1 (min 4.5:1)  --text-on-accent auf --accent-bg  — Primaerknopf
OK     8.16:1 (min 4.5:1)  --text-on-accent auf --accent-bg-hover  — Primaerknopf unter dem Zeiger
OK    10.55:1 (min 4.5:1)  --text-on-accent auf --accent-bg-active  — Primaerknopf gedrueckt
OK     8.16:1 (min 4.5:1)  --accent-text auf --bg-surface  — Textknopf, aktiver Navigationseintrag
OK     7.39:1 (min 4.5:1)  --accent-text auf --accent-bg-subtle  — Textknopf auf Akzentflaeche
OK     6.75:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — destruktiver Knopf
OK     6.07:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Fehlertext im Hinweis
OK     6.75:1 (min 4.5:1)  --danger-text auf --bg-surface  — Fehlertext am Feld
OK     7.50:1 (min 4.5:1)  --status-open-fg auf --status-open-bg  — Etikett Offen
OK     3.95:1 (min 3.0:1)  --status-open-border auf --bg-surface  — Kontur Offen, SC 1.4.11
OK     5.80:1 (min 3.0:1)  --status-open-marker auf --bg-surface  — Zeilenmarker Offen
OK     6.50:1 (min 4.5:1)  --status-exported-fg auf --status-exported-bg  — Etikett Exportiert
OK     6.50:1 (min 3.0:1)  --status-exported-bg auf --bg-surface  — Flaeche Exportiert gegen Karte
OK     5.89:1 (min 3.0:1)  --status-exported-marker auf --status-exported-tint  — Marker auf getoenter Zeile
OK    14.27:1 (min 4.5:1)  --text-primary auf --status-exported-tint  — Zeilentext auf getoenter Zeile
OK     8.10:1 (min 4.5:1)  --status-reopened-fg auf --status-reopened-bg  — Etikett Erneut offen
OK     3.62:1 (min 3.0:1)  --status-reopened-border auf --bg-surface  — Kontur Erneut offen
OK     6.75:1 (min 3.0:1)  --status-reopened-marker auf --bg-surface  — Zeilenmarker Erneut offen
OK     9.28:1 (min 4.5:1)  --timer-running-fg auf --timer-running-bg  — laufender Timer
OK     5.34:1 (min 3.0:1)  --timer-running-pulse auf --timer-running-bg  — Pulspunkt
OK     5.02:1 (min 4.5:1)  --timer-idle-fg auf --timer-idle-bg  — Timer angehalten
OK     7.39:1 (min 4.5:1)  --info-fg auf --info-bg  — Information
OK     5.89:1 (min 4.5:1)  --success-fg auf --success-bg  — Erfolg
OK     7.50:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Warnung
OK     9.56:1 (min 4.5:1)  --note-billing-header-fg auf --note-billing-header-bg  — Kopfband Leistung
OK     5.98:1 (min 3.0:1)  --note-billing-rail auf --bg-surface  — Randschiene Leistung, heller Streifen
OK    10.55:1 (min 3.0:1)  --note-billing-rail-stripe auf --bg-surface  — Randschiene Leistung, dunkler Streifen
OK     7.47:1 (min 4.5:1)  --note-internal-header-fg auf --note-internal-header-bg  — Kopfband Vermerk
OK     3.49:1 (min 3.0:1)  --note-internal-rail auf --bg-surface  — Randschiene Vermerk
OK    14.80:1 (min 4.5:1)  --text-primary auf --note-internal-bg  — Text im Vermerkfeld
OK     5.98:1 (min 4.5:1)  --text-on-accent auf --accent-bg  — Marke vor der Beschriftung Leistung
OK     5.30:1 (min 3.0:1)  --border-strong auf --note-internal-bg  — Kontur der Marke vor Vermerk
OK     5.30:1 (min 4.5:1)  --text-muted auf --note-internal-bg  — Symbol in der Marke vor Vermerk
OK     5.89:1 (min 4.5:1)  --success-fg auf --success-bg  — Kennzeichen Erledigt
OK     6.50:1 (min 3.0:1)  --success-fg auf --bg-surface  — Kontur Kennzeichen Erledigt
OK     5.64:1 (min 4.5:1)  --text-muted auf --bg-surface  — Kennzeichen Offen
OK     6.81:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Kennzeichen Erledigt aufgehoben
OK     4.58:1 (min 3.0:1)  --border-strong auf --bg-inset  — gestrichelte Kontur Erledigt aufgehoben
OK     5.79:1 (min 4.5:1)  --success-fg auf --bg-subtle  — Zaehler erledigter Todos im Spaltenkopf
OK     5.02:1 (min 4.5:1)  --text-muted auf --timer-running-bg  — Fussnote im Wiederaufnahme-Hinweis
OK    14.27:1 (min 4.5:1)  --text-primary auf --bg-selected  — Titel einer ausgewaehlten Tagesgruppe
OK     7.60:1 (min 4.5:1)  --text-secondary auf --bg-selected  — zusammengefuehrte Leistung, ausgewaehlt
OK     5.11:1 (min 4.5:1)  --text-muted auf --bg-selected  — Kalendertag und Call, ausgewaehlt
OK    15.34:1 (min 4.5:1)  --text-primary auf --bg-surface-alt  — Zeitraum einer Einzelbuchung
OK     8.17:1 (min 4.5:1)  --text-secondary auf --bg-surface-alt  — Dauer und Leistung einer Einzelbuchung
OK     5.49:1 (min 4.5:1)  --text-muted auf --bg-surface-alt  — Herkunft einer Einzelbuchung
OK     5.02:1 (min 4.5:1)  --text-muted auf --bg-disabled  — ausgeschlossene Buchung, durchgestrichen
OK    14.54:1 (min 4.5:1)  --text-primary auf --warning-bg  — Titel einer nicht exportierbaren Gruppe
OK     5.20:1 (min 4.5:1)  --text-muted auf --warning-bg  — gedaempfte Zeit einer gesperrten Gruppe
OK     7.50:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Sperrgrund nach E-034
OK     5.11:1 (min 4.5:1)  --text-muted auf --accent-bg-subtle  — Zusatz unter der Beschriftung, Schalter ein
OK     5.98:1 (min 3.0:1)  --accent-bg auf --bg-surface  — Schienenfarbe des Schalters, SC 1.4.11
OK     8.16:1 (min 4.5:1)  --accent-text auf --bg-surface  — Haken im Knauf, Schalter ein
OK    14.17:1 (min 4.5:1)  --text-primary auf --danger-bg-subtle  — Ueberschrift und Meldungsliste der Startmeldung
OK     7.55:1 (min 4.5:1)  --text-secondary auf --danger-bg-subtle  — Erklaerung und Handlungsanweisung
OK     6.07:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Zwischenueberschrift Was Sie tun koennen
OK     6.75:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — Symbol der Startmeldung
OK     6.07:1 (min 3.0:1)  --danger-bg auf --danger-bg-subtle  — Randschiene der Startmeldung, SC 1.4.11
OK     3.13:1 (min 3.0:1)  --border-control auf --danger-bg-subtle  — Knopf Takt beenden in der Startmeldung, SC 1.4.11
OK     8.39:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Erklaerung und Schritte im Sperrdialog
OK     6.07:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Grund aus der Huelle im Sperrdialog
OK    12.79:1 (min 4.5:1)  --text-primary auf --bg-inset  — Schrittnummer im Sperrdialog
OK     5.02:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Beendigungscode in der Fusszeile
OK     6.75:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — Knopf Takt beenden im Sperrdialog
OK    14.54:1 (min 4.5:1)  --text-primary auf --warning-bg  — Ueberschrift des Datenordner-Hinweises
OK     7.74:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Befund der Huelle und Erklaerung
OK     7.50:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Zwischenueberschriften des Hinweises
OK     7.50:1 (min 4.5:1)  --warning-bg auf --warning-fg  — Symbol des Hinweises, gefuellte Flaeche
OK     5.20:1 (min 4.5:1)  --text-muted auf --warning-bg  — Fussnote Takt arbeitet weiter
OK     5.64:1 (min 4.5:1)  --text-muted auf --bg-surface  — Zusatz im Datenordner-Hinweis
OK     8.39:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Beschriftung Fuer die Systembetreuung
OK     5.02:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Zusatz im Sperrdialog
OK     7.47:1 (min 4.5:1)  --text-secondary auf --bg-subtle  — Beschriftung im Sperrdialog
OK     3.49:1 (min 3.0:1)  --border-control auf --bg-surface  — Randschiene des Zusatzes, SC 1.4.11
----   1.08:1 (min —)  --bg-surface auf --warning-bg  — Zusatzflaeche gegen Warnband, rein abgrenzend
OK     7.47:1 (min 4.5:1)  --text-secondary auf --bg-subtle  — Zaehler im Navigationseintrag, Kennzeichen in der Todo-Zeile
OK     5.11:1 (min 4.5:1)  --text-muted auf --bg-selected  — Zusatz im hervorgehobenen Suchtreffer
OK     6.50:1 (min 3.0:1)  --success-fg auf --bg-surface  — Farbschiene der Erfolgsmeldung, SC 1.4.11
OK     8.16:1 (min 3.0:1)  --info-fg auf --bg-surface  — Farbschiene der Hinweismeldung, SC 1.4.11
OK     8.13:1 (min 3.0:1)  --warning-fg auf --bg-surface  — Farbschiene der Warnmeldung, SC 1.4.11
OK    14.54:1 (min 4.5:1)  --text-primary auf --warning-bg  — Kennzahl auf getoenter Warnflaeche
OK     7.74:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Erlaeuterung auf getoenter Warnflaeche
OK     5.20:1 (min 4.5:1)  --text-muted auf --warning-bg  — Beschriftung der Kennzahl auf Warnflaeche
OK     7.60:1 (min 4.5:1)  --text-secondary auf --accent-bg-subtle  — Erlaeuterung auf Akzentflaeche
OK     5.11:1 (min 4.5:1)  --text-muted auf --accent-bg-subtle  — Beschriftung der Kennzahl auf Akzentflaeche
OK     7.36:1 (min 4.5:1)  --warning-fg auf --accent-bg-subtle  — Warnung in der Exportkopfzeile
OK     5.07:1 (min 4.5:1)  --text-muted auf --danger-bg-subtle  — technischer Schluessel in der Fehlermeldung
OK     6.75:1 (min 3.0:1)  --danger-text auf --bg-surface  — Kontur eines fehlerhaften Feldes, SC 1.4.11
----   1.44:1 (min —)  --warning-border auf --bg-surface  — Umrandung des Warnbands, rein abgrenzend
OK     5.98:1 (min 3.0:1)  --border-accent auf --bg-surface  — Kontur eines gewaehlten Bedienelements, SC 1.4.11
OK    14.04:1 (min 4.5:1)  --text-primary auf --timer-running-bg  — Zeile mit laufendem Timer
OK    10.41:1 (min 3.0:1)  --timer-running-fg auf --bg-surface  — Kontur der Zeile mit laufendem Timer, SC 1.4.11
----   1.53:1 (min —)  --accent-border-subtle auf --bg-surface  — Rahmen der Exportkopfzeile, rein abgrenzend
----   1.23:1 (min —)  --border-subtle auf --bg-surface  — Trennlinie, rein dekorativ
----   1.46:1 (min —)  --border-default auf --bg-surface  — Kartenumriss, rein dekorativ
OK     3.49:1 (min 3.0:1)  --border-control auf --bg-surface  — Grenze eines Bedienelements, SC 1.4.11
OK     3.10:1 (min 3.0:1)  --border-control auf --bg-subtle  — Bedienelement in der Werkzeugleiste
OK     5.64:1 (min 3.0:1)  --border-strong auf --bg-surface  — Bedienelement unter dem Zeiger
OK     5.98:1 (min 3.0:1)  --focus-ring-color auf --bg-surface  — Fokusring auf Karte
OK     5.62:1 (min 3.0:1)  --focus-ring-color auf --bg-canvas  — Fokusring auf Hintergrund
OK     5.33:1 (min 3.0:1)  --focus-ring-color auf --bg-subtle  — Fokusring in Werkzeugleiste

== Modus dunkel ==
OK    15.92:1 (min 4.5:1)  --text-primary auf --bg-canvas  — Standardtext auf Anwendungshintergrund
OK    14.64:1 (min 4.5:1)  --text-primary auf --bg-surface  — Standardtext auf Karte
OK    13.39:1 (min 4.5:1)  --text-primary auf --bg-subtle  — Tabellenkopf
OK    12.24:1 (min 4.5:1)  --text-primary auf --bg-hover  — Zeile unter dem Zeiger
OK    12.31:1 (min 4.5:1)  --text-primary auf --bg-selected  — ausgewaehlte Zeile
OK     9.76:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Sekundaertext
OK     6.74:1 (min 4.5:1)  --text-muted auf --bg-surface  — Hilfetext, Platzhalter
OK     7.33:1 (min 4.5:1)  --text-muted auf --bg-canvas  — Hilfetext auf Hintergrund
OK     6.16:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Spaltenueberschrift
OK     3.70:1 (min 3.0:1)  --text-disabled auf --bg-disabled  — deaktiviert, ausgenommen nach SC 1.4.3
OK     8.34:1 (min 4.5:1)  --text-link auf --bg-surface  — Verweis
OK    10.61:1 (min 4.5:1)  --text-secondary auf --bg-canvas  — Einleitungstext auf Hintergrund
OK     9.07:1 (min 4.5:1)  --accent-text auf --bg-canvas  — hervorgehobener Navigationseintrag
OK    12.31:1 (min 4.5:1)  --text-primary auf --accent-bg-subtle  — Text im Entscheidungskasten
OK     6.26:1 (min 4.5:1)  --text-on-accent auf --accent-bg  — Primaerknopf
OK     9.23:1 (min 4.5:1)  --text-on-accent auf --accent-bg-hover  — Primaerknopf unter dem Zeiger
OK    12.44:1 (min 4.5:1)  --text-on-accent auf --accent-bg-active  — Primaerknopf gedrueckt
OK     8.34:1 (min 4.5:1)  --accent-text auf --bg-surface  — Textknopf, aktiver Navigationseintrag
OK     7.01:1 (min 4.5:1)  --accent-text auf --accent-bg-subtle  — Textknopf auf Akzentflaeche
OK     7.98:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — destruktiver Knopf
OK     6.78:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Fehlertext im Hinweis
OK     7.21:1 (min 4.5:1)  --danger-text auf --bg-surface  — Fehlertext am Feld
OK     8.29:1 (min 4.5:1)  --status-open-fg auf --status-open-bg  — Etikett Offen
OK     4.89:1 (min 3.0:1)  --status-open-border auf --bg-surface  — Kontur Offen, SC 1.4.11
OK     6.62:1 (min 3.0:1)  --status-open-marker auf --bg-surface  — Zeilenmarker Offen
OK     9.35:1 (min 4.5:1)  --status-exported-fg auf --status-exported-bg  — Etikett Exportiert
OK     8.44:1 (min 3.0:1)  --status-exported-bg auf --bg-surface  — Flaeche Exportiert gegen Karte
OK     7.50:1 (min 3.0:1)  --status-exported-marker auf --status-exported-tint  — Marker auf getoenter Zeile
OK    13.01:1 (min 4.5:1)  --text-primary auf --status-exported-tint  — Zeilentext auf getoenter Zeile
OK     7.10:1 (min 4.5:1)  --status-reopened-fg auf --status-reopened-bg  — Etikett Erneut offen
OK     3.52:1 (min 3.0:1)  --status-reopened-border auf --bg-surface  — Kontur Erneut offen
OK     4.74:1 (min 3.0:1)  --status-reopened-marker auf --bg-surface  — Zeilenmarker Erneut offen
OK     9.88:1 (min 4.5:1)  --timer-running-fg auf --timer-running-bg  — laufender Timer
OK     6.66:1 (min 3.0:1)  --timer-running-pulse auf --timer-running-bg  — Pulspunkt
OK     6.16:1 (min 4.5:1)  --timer-idle-fg auf --timer-idle-bg  — Timer angehalten
OK     7.01:1 (min 4.5:1)  --info-fg auf --info-bg  — Information
OK     7.50:1 (min 4.5:1)  --success-fg auf --success-bg  — Erfolg
OK     8.29:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Warnung
OK     9.45:1 (min 4.5:1)  --note-billing-header-fg auf --note-billing-header-bg  — Kopfband Leistung
OK     5.66:1 (min 3.0:1)  --note-billing-rail auf --bg-surface  — Randschiene Leistung, heller Streifen
OK    11.24:1 (min 3.0:1)  --note-billing-rail-stripe auf --bg-surface  — Randschiene Leistung, dunkler Streifen
OK     8.92:1 (min 4.5:1)  --note-internal-header-fg auf --note-internal-header-bg  — Kopfband Vermerk
OK     4.31:1 (min 3.0:1)  --note-internal-rail auf --bg-surface  — Randschiene Vermerk
OK    15.11:1 (min 4.5:1)  --text-primary auf --note-internal-bg  — Text im Vermerkfeld
OK     6.26:1 (min 4.5:1)  --text-on-accent auf --accent-bg  — Marke vor der Beschriftung Leistung
OK     6.06:1 (min 3.0:1)  --border-strong auf --note-internal-bg  — Kontur der Marke vor Vermerk
OK     6.96:1 (min 4.5:1)  --text-muted auf --note-internal-bg  — Symbol in der Marke vor Vermerk
OK     7.50:1 (min 4.5:1)  --success-fg auf --success-bg  — Kennzeichen Erledigt
OK     8.44:1 (min 3.0:1)  --success-fg auf --bg-surface  — Kontur Kennzeichen Erledigt
OK     6.74:1 (min 4.5:1)  --text-muted auf --bg-surface  — Kennzeichen Offen
OK    10.25:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Kennzeichen Erledigt aufgehoben
OK     6.17:1 (min 3.0:1)  --border-strong auf --bg-inset  — gestrichelte Kontur Erledigt aufgehoben
OK     7.72:1 (min 4.5:1)  --success-fg auf --bg-subtle  — Zaehler erledigter Todos im Spaltenkopf
OK     6.39:1 (min 4.5:1)  --text-muted auf --timer-running-bg  — Fussnote im Wiederaufnahme-Hinweis
OK    12.31:1 (min 4.5:1)  --text-primary auf --bg-selected  — Titel einer ausgewaehlten Tagesgruppe
OK     8.21:1 (min 4.5:1)  --text-secondary auf --bg-selected  — zusammengefuehrte Leistung, ausgewaehlt
OK     5.67:1 (min 4.5:1)  --text-muted auf --bg-selected  — Kalendertag und Call, ausgewaehlt
OK    13.85:1 (min 4.5:1)  --text-primary auf --bg-surface-alt  — Zeitraum einer Einzelbuchung
OK     9.23:1 (min 4.5:1)  --text-secondary auf --bg-surface-alt  — Dauer und Leistung einer Einzelbuchung
OK     6.38:1 (min 4.5:1)  --text-muted auf --bg-surface-alt  — Herkunft einer Einzelbuchung
OK     6.16:1 (min 4.5:1)  --text-muted auf --bg-disabled  — ausgeschlossene Buchung, durchgestrichen
OK    13.34:1 (min 4.5:1)  --text-primary auf --warning-bg  — Titel einer nicht exportierbaren Gruppe
OK     6.14:1 (min 4.5:1)  --text-muted auf --warning-bg  — gedaempfte Zeit einer gesperrten Gruppe
OK     8.29:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Sperrgrund nach E-034
OK     5.67:1 (min 4.5:1)  --text-muted auf --accent-bg-subtle  — Zusatz unter der Beschriftung, Schalter ein
OK     5.66:1 (min 3.0:1)  --accent-bg auf --bg-surface  — Schienenfarbe des Schalters, SC 1.4.11
OK     8.34:1 (min 4.5:1)  --accent-text auf --bg-surface  — Haken im Knauf, Schalter ein
OK    13.78:1 (min 4.5:1)  --text-primary auf --danger-bg-subtle  — Ueberschrift und Meldungsliste der Startmeldung
OK     9.19:1 (min 4.5:1)  --text-secondary auf --danger-bg-subtle  — Erklaerung und Handlungsanweisung
OK     6.78:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Zwischenueberschrift Was Sie tun koennen
OK     7.98:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — Symbol der Startmeldung
OK     6.78:1 (min 3.0:1)  --danger-bg auf --danger-bg-subtle  — Randschiene der Startmeldung, SC 1.4.11
OK     3.58:1 (min 3.0:1)  --border-control auf --danger-bg-subtle  — Knopf Takt beenden in der Startmeldung, SC 1.4.11
OK     9.76:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Erklaerung und Schritte im Sperrdialog
OK     6.78:1 (min 4.5:1)  --danger-text auf --danger-bg-subtle  — Grund aus der Huelle im Sperrdialog
OK    15.38:1 (min 4.5:1)  --text-primary auf --bg-inset  — Schrittnummer im Sperrdialog
OK     6.16:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Beendigungscode in der Fusszeile
OK     7.98:1 (min 4.5:1)  --text-on-solid auf --danger-bg  — Knopf Takt beenden im Sperrdialog
OK    13.34:1 (min 4.5:1)  --text-primary auf --warning-bg  — Ueberschrift des Datenordner-Hinweises
OK     8.89:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Befund der Huelle und Erklaerung
OK     8.29:1 (min 4.5:1)  --warning-fg auf --warning-bg  — Zwischenueberschriften des Hinweises
OK     8.29:1 (min 4.5:1)  --warning-bg auf --warning-fg  — Symbol des Hinweises, gefuellte Flaeche
OK     6.14:1 (min 4.5:1)  --text-muted auf --warning-bg  — Fussnote Takt arbeitet weiter
OK     6.74:1 (min 4.5:1)  --text-muted auf --bg-surface  — Zusatz im Datenordner-Hinweis
OK     9.76:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Beschriftung Fuer die Systembetreuung
OK     6.16:1 (min 4.5:1)  --text-muted auf --bg-subtle  — Zusatz im Sperrdialog
OK     8.92:1 (min 4.5:1)  --text-secondary auf --bg-subtle  — Beschriftung im Sperrdialog
OK     3.80:1 (min 3.0:1)  --border-control auf --bg-surface  — Randschiene des Zusatzes, SC 1.4.11
----   1.09:1 (min —)  --bg-surface auf --warning-bg  — Zusatzflaeche gegen Warnband, rein abgrenzend
OK     8.92:1 (min 4.5:1)  --text-secondary auf --bg-subtle  — Zaehler im Navigationseintrag, Kennzeichen in der Todo-Zeile
OK     5.67:1 (min 4.5:1)  --text-muted auf --bg-selected  — Zusatz im hervorgehobenen Suchtreffer
OK     8.44:1 (min 3.0:1)  --success-fg auf --bg-surface  — Farbschiene der Erfolgsmeldung, SC 1.4.11
OK     8.34:1 (min 3.0:1)  --info-fg auf --bg-surface  — Farbschiene der Hinweismeldung, SC 1.4.11
OK     9.10:1 (min 3.0:1)  --warning-fg auf --bg-surface  — Farbschiene der Warnmeldung, SC 1.4.11
OK    13.34:1 (min 4.5:1)  --text-primary auf --warning-bg  — Kennzahl auf getoenter Warnflaeche
OK     8.89:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Erlaeuterung auf getoenter Warnflaeche
OK     6.14:1 (min 4.5:1)  --text-muted auf --warning-bg  — Beschriftung der Kennzahl auf Warnflaeche
OK     8.21:1 (min 4.5:1)  --text-secondary auf --accent-bg-subtle  — Erlaeuterung auf Akzentflaeche
OK     5.67:1 (min 4.5:1)  --text-muted auf --accent-bg-subtle  — Beschriftung der Kennzahl auf Akzentflaeche
OK     7.65:1 (min 4.5:1)  --warning-fg auf --accent-bg-subtle  — Warnung in der Exportkopfzeile
OK     6.35:1 (min 4.5:1)  --text-muted auf --danger-bg-subtle  — technischer Schluessel in der Fehlermeldung
OK     7.21:1 (min 3.0:1)  --danger-text auf --bg-surface  — Kontur eines fehlerhaften Feldes, SC 1.4.11
----   2.71:1 (min —)  --warning-border auf --bg-surface  — Umrandung des Warnbands, rein abgrenzend
OK     5.66:1 (min 3.0:1)  --border-accent auf --bg-surface  — Kontur eines gewaehlten Bedienelements, SC 1.4.11
OK    13.87:1 (min 4.5:1)  --text-primary auf --timer-running-bg  — Zeile mit laufendem Timer
OK    10.44:1 (min 3.0:1)  --timer-running-fg auf --bg-surface  — Kontur der Zeile mit laufendem Timer, SC 1.4.11
----   1.98:1 (min —)  --accent-border-subtle auf --bg-surface  — Rahmen der Exportkopfzeile, rein abgrenzend
----   1.22:1 (min —)  --border-subtle auf --bg-surface  — Trennlinie, rein dekorativ
----   1.57:1 (min —)  --border-default auf --bg-surface  — Kartenumriss, rein dekorativ
OK     3.80:1 (min 3.0:1)  --border-control auf --bg-surface  — Grenze eines Bedienelements, SC 1.4.11
OK     3.47:1 (min 3.0:1)  --border-control auf --bg-subtle  — Bedienelement in der Werkzeugleiste
OK     5.88:1 (min 3.0:1)  --border-strong auf --bg-surface  — Bedienelement unter dem Zeiger
OK     8.34:1 (min 3.0:1)  --focus-ring-color auf --bg-surface  — Fokusring auf Karte
OK     9.07:1 (min 3.0:1)  --focus-ring-color auf --bg-canvas  — Fokusring auf Hintergrund
OK     7.62:1 (min 3.0:1)  --focus-ring-color auf --bg-subtle  — Fokusring in Werkzeugleiste

0 von 230 Paaren durchgefallen.
```

Die 18 neuen Paare stehen in der Gruppe **Anwendung** und decken die Flächen ab, die
mit dieser Aufgabe entstanden sind: Zähler in der Navigation, hervorgehobener Suchtreffer,
Farbschienen der vier Meldungsarten, Kennzahlen auf getönten Flächen, die Kontur eines
fehlerhaften Feldes, die Kontur eines gewählten Bedienelements und die Zeile mit laufendem Timer.

Drei davon sind beim ersten Lauf durchgefallen und **nicht durch eine Ausnahme, sondern durch
eine Änderung der Fläche** behoben worden — die Token gehören `packages/ui-tokens` und damit
nicht mir:

- `--danger-border` erreicht gegen die Kartenfläche nur 1,66:1 (hell) und 1,79:1 (dunkel). Die
  Kontur eines fehlerhaften Feldes trägt Zustand und fällt unter SC 1.4.11; sie ist jetzt
  `--danger-text` mit 6,75:1 beziehungsweise 7,21:1. Der Fehler hängt ohnehin nicht an der Farbe
  allein: `aria-invalid` und der Fehlertext unter dem Feld tragen ihn mit.
- `--timer-running-border` erreicht 1,64:1 und 1,83:1. Die Zeile mit laufendem Timer trägt
  Zustand; ihre Kontur ist jetzt `--timer-running-fg` mit 10,41:1 und 10,44:1. Zusätzlich trägt
  das Bedienelement den Zustand ohne Farbe: aus „Start“ wird „Stopp“, aus dem Dreieck werden zwei
  Balken.
- `--warning-border` erreicht 1,44:1 und 2,71:1. Hier ist die Umrandung als **rein abgrenzend**
  eingetragen und nicht die Fläche geändert: Das Warnband trägt seinen Zustand über die getönte
  Fläche, das Warndreieck und den Text; die Kante ist für die Erkennbarkeit nicht nötig. Das ist
  dieselbe Begründung, mit der T-020b die Zusatzfläche im Datenordner-Hinweis ausgenommen hat.
