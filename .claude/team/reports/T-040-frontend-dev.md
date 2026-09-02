Aufgabe: T-040 — Die drei verbliebenen blockierenden Befunde aus T-025 (C-01 Exportprotokoll ohne
Ort, C-02 S-07 zeigt nicht was geschrieben wird, C-04 Wiederbeleben von S-01 und S-05 unerreichbar),
dazu die zwei Begriffsfehler C-17 und C-18 sowie die drei Nachträge aus T-039.

Status: fertig

---

Artefakte:

```
NEU
apps/web/src/app/exportAudit.ts                 266 — Protokollzeilen holen und zuordnen:
                                                Buchung, Todo und Lauf je Kennung einmal
apps/web/src/components/ExportAudit.tsx         184 — `ExportAuditEventBadge`, `ExportAuditList`
apps/web/src/components/ExportRowPanes.tsx      117 — die zweispaltige Exportzeile, geteilt von
                                                S-07 und S-14
apps/web/src/components/InfoDialog.tsx          106 — modaler Dialog, der nichts fragt
apps/web/src/screens/ExportAuditScreen.tsx      292 — S-07, Bereich „Protokoll"

GEÄNDERT
apps/web/src/api/endpoints.ts                   `listExportAudit` führt den Zeiger mit
apps/web/src/api/types.ts                       `unreachable`, `ExportDirectoryTrait`,
                                                `SettingsView.exportDirectoryTraits`
apps/web/src/app/App.tsx                        Route `exportAudit`
apps/web/src/app/Navigation.tsx                 Protokoll zählt zum Punkt „Export"
apps/web/src/app/router.ts                      `#/export/protokoll`
apps/web/src/app/StructureContext.tsx           `exportDirectoryTraits` durchgereicht
apps/web/src/components/ExportDirectoryField.tsx `ExportDirectoryTraitList`, `unreachable`
apps/web/src/components/ExportGroups.tsx        `renderRowDetail`
apps/web/src/components/Kanban.tsx              „Timer für ‚X' starten"
apps/web/src/components/Timer.tsx               „Timer starten", „der Timer läuft"
apps/web/src/screens/BookingDialogs.tsx         `BookingHistoryDialog`
apps/web/src/screens/BookingsScreen.tsx         Zeilenmenü „Verlauf dieser Buchung"
apps/web/src/screens/DashboardScreen.tsx        „Zuletzt bearbeitet" führt erledigte Todos mit
apps/web/src/screens/ExportScreen.tsx           Exportzeile je Gruppe, Protokollwege, Ordner-
                                                merkmale, `unreachable`, Begriffe
apps/web/src/screens/parts.tsx                  dritter Bereichsreiter
apps/web/src/screens/SettingsScreen.tsx         Begriff, Ordnermerkmale
apps/web/src/screens/TagsScreen.tsx             „Zielordner" raus
apps/web/src/screens/TemplatePreview.tsx        benutzt `ExportRowPanes`
apps/web/src/screens/TimeScreen.tsx             „Erledigte einblenden", Kennzeichen in der Zeile
apps/web/src/screens/TodoDetailScreen.tsx       Zeilenmenü „Verlauf dieser Buchung"
apps/web/src/showcase/*                         Protokoll auf der Musterseite, drei neue
                                                Inventareinträge, Ordnermerkmale erklärt
apps/web/src/styles/app.css                     `auditlist`, `auditrow`, `auditlegend`,
                                                `bhistory`, `pick-row__flag`; `tprow` → `erow`
apps/web/src/styles/components.css              `egroup__rowhint`, `dirtraits`, `empty__action`
apps/web/scripts/contrast-check.mjs             17 neue Paare (282 → 316)
apps/desktop/src/shell.ts                       `style-src 'unsafe-inline'` als benannte Ausnahme
```

`apps/web/test/**`, `tests/e2e/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `packages/**`,
`docs/**` und die Wurzeldateien: **unangetastet**. Kein `any`, keine Typzusicherung auf einen
Fachwert. Kein neues npm-Paket, `pnpm-lock.yaml` unverändert.

---

Zusammenfassung:

**C-01 — das Exportprotokoll hat jetzt zwei Orte, und beide beantworten eine eigene Frage.**
`GET /export/audit` hatte eine Route, eine Client-Funktion und keinen Aufrufer. Jetzt gibt es
(1) **S-07, Bereich „Protokoll"** unter `#/export/protokoll`, als dritter Reiter neben Export und
Vorlagen — der Gesamtverlauf mit Zeitpunkt, Buchung, Vorgang, Statuswechsel, Lauf, Begründung und
Urheber, filterbar nach Vorgang und Lauf; und (2) **„Verlauf dieser Buchung"** im Zeilenmenü von
S-06 und S-03, ausdrücklich *über* „Exportstatus zurücksetzen", weil es die Frage beantwortet, die
davor steht. Der Dialog fragt `listExportAudit(entryId)` und ist der einzige der Anwendung, der
nichts schreibt — dafür `InfoDialog` statt eines Bestätigungsdialogs, dessen Knopf eine Handlung
verspräche, die es nicht gibt. Die Liste „Letzte Exportläufe" bekommt je Lauf „Buchungen dieses
Laufs", das ins Protokoll mit vorgewähltem Lauf springt.

**C-02 — S-07 zeigt, was geschrieben wird.** Jede aufgeklappte Tagesgruppe trägt jetzt denselben
zweispaltigen Block wie S-14: „So steht es in der Datei" gegen „Feld für Feld", mit Herkunft und
Umformung je Feld, dem Base64-Satz und dem Verweis auf den Klartext darunter. Es ist **derselbe
Baustein** — `ExportRowPanes`, aus `TemplatePreview` herausgelöst und von beiden Screens benutzt.
Eine zweite Fassung wäre genau der Fehler gewesen, gegen den R-17 die Vorschau schützt.

**C-04 — I-05 ist von allen sechs Startpunkten erreichbar.** S-05 hat denselben Schalter
„Erledigte einblenden" wie S-02 und S-04, samt Zahl der ausgeblendeten und dem Weg dorthin aus dem
Leerzustand; S-01 führt erledigte Todos in „Zuletzt bearbeitet" mit ihrem Kennzeichen. Beide Zeilen
zeigen nach dem Timerstart „Erledigt aufgehoben" aus `timer.reactivated`. Die Wirkung selbst —
Toast mit allen drei Folgen, einzeln genannten Pools, „Die Karte bleibt, wo sie ist" und einem
Rückgängig, das die Sekundenbuchung verwirft — war schon gebaut und ist unverändert.

**Die zwei Begriffsfehler.** „Zeiterfassung starten/stoppen" heißt überall „Timer für ‚X'
starten/stoppen"; dazu fiel auf, dass `ReactivationNotice` „die Zeiterfassung läuft" sagte — auch
das ist jetzt der Timer. „Zielordner" für den Exportordner ist verschwunden; in S-08 heißt das
Auswahlfeld je nach Fall „Ordner für dieses Tag" oder „Neuer übergeordneter Ordner".

**Die drei Nachträge aus T-039** sind mit hineingegangen: `exportDirectoryTraits` wird in S-07 und
S-09 gezeigt, `unreachable` hat einen eigenen Text, der zum Netzlaufwerk schickt statt zum
Neueintragen — und die leere Merkmalsliste sagt ausdrücklich „nichts belegt, das ist keine
Entwarnung" und nennt `Z:\` als den Fall, den der Dienst nicht sieht.

---

Annahmen:

- **AN-01. Ein eigener Bereich statt einer Karte.** Der Auftrag sagte „er gehört zu S-07". Ich habe
  ihn als dritten Reiter mit eigener Adresse gebaut und nicht als Karte unter der Auswahlliste: Das
  Protokoll beantwortet eine andere Frage als „was exportiere ich als Nächstes", es braucht eigene
  Filter und eine eigene Blätterung, und der Navigationspunkt „Export" versprach in seinem Hinweis
  ohnehin schon „Vorschau, Lauf und **Protokoll**". Als Karte hätte es die Ansicht, aus der
  exportiert wird, verlängert — und die soll auf den Lauf zulaufen.

- **AN-02. „Welche Buchungen waren in diesem Lauf" wird aus dem Protokoll beantwortet, nicht aus
  dem Lauf.** Der spec-ux-reviewer hatte vorgeschlagen, einen Lauf über `getExportRun` aufklappbar
  zu machen. **Das geht nicht:** `loadRun` in `packages/storage/src/sqlite/repo-export.ts:316`
  liest genau eine Zeile aus `export_run` und liefert keine Gruppen; `ExportRun.groups` ist bereits
  als „vom Dienst nicht geliefert" dokumentiert. Statt eine leere Liste zu zeigen, verweist die
  Laufzeile ins Protokoll, wo jede Zeile ihren Lauf nennt. Der Kommentar an der Stelle sagt, warum.

- **AN-03. Der Lauffilter im Protokoll wirkt über die geladenen Zeilen** und nicht über die Route
  — `GET /export/audit` filtert nur nach `timeEntryId`. Das steht **in der Ansicht**: Der
  Leerzustand nach einem Filter sagt es und bietet „Weitere laden" direkt an, und ein Lauf aus der
  Adresse, der noch nicht geladen ist, heißt im Chip „noch nicht geladen" und nicht „unbekannt".
  Eine stille Teilantwort wäre beim Protokoll der teuerste aller Irrtümer.

- **AN-04. Der Verlauf einer Buchung fragt den Dienst mit `timeEntryId`** statt das Gesamtprotokoll
  zu filtern. Ein Filter über eine geladene Seite hätte ausgerechnet die älteren Zeilen verschluckt
  — also die, die eine Doppelabrechnung belegen.

- **AN-05. Buchung und Todo werden je Kennung gezielt nachgeschlagen** (`getTimeEntry`, `getTodo`),
  nicht über eine Liste mit Obergrenze. Eine Liste der ersten zweihundert hätte bei einem älteren
  Eintrag still „Unbekanntes Todo" ergeben. Fehlschläge werden einzeln verschluckt: Eine
  Protokollzeile bleibt stehen, auch wenn ihre Buchung nicht mehr auffindbar ist — sie ist dann der
  Beleg, dass es sie gab, und die Zeile sagt das.

- **AN-06. Das Vorgangs-Etikett benutzt die vier Erscheinungsbilder des Exportstatus**, trägt aber
  die Beschriftung des **Ereignisses** und für Hilfsmittel „Vorgang:" statt „Exportstatus:". Der
  Statuswechsel daneben nennt die **zwei** fachlichen Werte (E-032) und nicht die vier
  Anzeigezustände: Das Protokoll hält den gespeicherten Wechsel fest, was daraus wurde, sagt der
  Ereignisname.

- **AN-07. S-01 bekommt keinen Schalter.** „Zuletzt bearbeitet" ist keine Pool-Ansicht, sondern
  eine Chronik; E-039 regelt Pool-Ansichten. Ausgeblendet wird dort nichts, gekennzeichnet alles.

- **AN-08. `.tprow*` heißt jetzt `.erow*`.** Die Klasse gehört seit T-040 nicht mehr einem Screen.
  Die e2e-Fälle greifen auf `.tpgroup__head`, `.tpreview`, `.egroup*` und `.eentry*` zu — auf
  `.tprow` **nicht**; nachgesehen, bevor umbenannt wurde.

- **AN-09. Der Grund für `style-src 'unsafe-inline'` steht in `apps/desktop/src/shell.ts`**, nicht
  in `tauri.conf.json`: Eine JSON-Datei trägt keine Kommentare, und `src-tauri/**` liegt außerhalb
  meiner Dateihoheit. Die Ausnahme benennt die drei Stellen, an denen `apps/web` Stile am Element
  setzt (Zeigerposition eines Kontextmenüs, Einrückung im Tag-Baum, Kantenlänge von Ladeanzeiger
  und Platzhalterfläche), sagt, dass `script-src` unberührt bleibt, und nennt die Bedingung, unter
  der sie fällt.

---

Risiken:

- **Der Verlauf einer Buchung kostet Anfragen.** Eine Protokollseite mit 40 Zeilen löst bis zu 40
  Buchungs- und 40 Todo-Abrufe aus, dazu einen je Lauf. Gegen einen Dienst auf derselben Maschine
  ist das vertretbar und es ist gemessen kein Fachrisiko — aber es ist die anfrageintensivste
  Ansicht der Anwendung. Fiele der Dienst je auf ein Netz, wäre hier zuerst etwas zu bündeln.

- **Der Lauffilter ist nur so vollständig wie das Geladene** (AN-03). Er sagt es; wer ihn
  trotzdem für vollständig hält, sieht zu wenige Zeilen. Eine Route, die nach `exportRunId`
  filtert, wäre die saubere Lösung — offene Frage 1.

- **Die Vorschau in S-07 zeigt jetzt kodierten Text auf dem Bildschirm.** Das ist beabsichtigt
  (A-8.4, A-8.9, C-02) und der Punkt der Sache: Ein Bruch der Notiz-Trennung fällt hier zuerst auf.
  Es heißt aber auch, dass ein Leistungstext in S-07 nun zweimal sichtbar ist — einmal kodiert,
  einmal im Klartext bei den Buchungen. Beides gehört dorthin; beides ist Text, der beim Kunden
  landet, und keiner davon ist der interne Vermerk.

- **Nicht am laufenden Dienst geprüft.** Getypt, gebaut, Kontrast gemessen, 545 Unit-Tests grün —
  aber ich hatte keinen Dienst mit echten Protokolldaten. Was die Ansicht bei einem leeren
  Protokoll, bei einem einzelnen Vorgang und bei einer gelöschten Buchung tut, ist im Quelltext als
  eigener Zustand ausgeschrieben und **nicht** auf dem Bildschirm gesehen. Ein e2e-Fall dafür wäre
  der nächste Schritt.

- **`exportDirectoryTraits` ist gegen die Beschreibung gebaut, nicht gegen eine gemessene
  Antwort.** Der domain-dev hat es in T-039 geliefert; ich lese defensiv mit `?? []`, damit ein
  älterer Dienststand nicht zu `undefined.map` führt. Sicherheitsrelevant ist das nicht: Eine
  fehlende Liste ergibt „nichts belegt", und genau dafür steht jetzt der Satz da, dass das keine
  Entwarnung ist.

---

Offene Fragen:

1. **An den Orchestrator und den domain-dev:** Soll `GET /export/audit` nach `exportRunId` filtern
   können? Damit wäre „welche Buchungen waren in diesem Lauf" vollständig beantwortbar statt nur
   über das Geladene (AN-02, AN-03). Es ist ein Abfrageparameter und eine `WHERE`-Bedingung; die
   Oberfläche würde denselben Screen benutzen und nur den Filter an den Dienst durchreichen.

2. **An den e2e-tester:** Das Protokoll hat keinen einzigen Fall. Die drei, die zählen: (a) Buchung
   exportieren, zurücksetzen, erneut exportieren — stehen die drei Zeilen in der richtigen
   Reihenfolge mit der Begründung dazwischen; (b) „Nicht abrechnen" ohne Grund — erscheint der
   Satz, dass das Feld freiwillig ist; (c) „Verlauf dieser Buchung" aus S-06 bei einer nie
   exportierten Buchung — erscheint der Leerzustand statt eines Fehlers.

3. **An den spec-ux-reviewer:** C-23 („Erledigt aufgehoben" fehlt in S-02 und S-03) habe ich
   **nicht** geschlossen — es stand nicht in dieser Aufgabe. In S-01 und S-05 steht das Etikett
   jetzt, weil ich dort ohnehin den Weg geöffnet habe. Damit ist der dritte Anzeigezustand auf drei
   von fünf Listenansichten; S-02 und S-03 fehlen weiterhin. Soll das mit C-23 zusammen laufen?

4. **An den Orchestrator:** Der Windows-Benutzername (C-20) steht jetzt an einer Stelle in der
   Oberfläche, ohne dass es Absicht war: Jede Protokollzeile nennt ihren Urheber. Das ist der Wert
   aus `export_audit.actor`, nicht der aus den Einstellungen — F-03 aus T-025 bleibt also offen,
   aber der Benutzer kann jetzt wenigstens sehen, unter welchem Namen seine eigenen Vorgänge
   protokolliert werden. Reicht das, oder bleibt „Diese Installation" in S-09 auf der Liste?

---

Nächster Schritt:

Die drei e2e-Fälle aus Frage 2 schreiben lassen — sie sind der Beleg, den dieser Bericht nicht
liefern kann. Danach die nicht blockierenden Befunde aus T-025 in dieser Reihenfolge: **C-12**
(Dashboard — Zeit und Aufteilung an den Zeilen, „offen"-Etikett am laufenden Timer) und **C-14**
(die vier fehlenden Filter in S-06, zuerst Tag und Pool) geben am meisten Fläche zurück; **C-05**
(Bestätigungsdialog in S-07 ohne Pfad, Dateiname und A-8.9-Satz) ist der kleinste Eingriff mit der
größten Wirkung, weil er den letzten Augenblick vor dem Verlassen der Anwendung betrifft.

---

## Nachweis

```
pnpm typecheck    alle 8 Pakete: Done, 0 Fehler
pnpm contrast     0 von 316 Paaren durchgefallen   (vorher 282; 17 Paare neu, davon
                  11 für das Protokoll, 4 für die Ordnermerkmale, 2 für die Auskunft
                  anstelle der Exportzeile)
pnpm build        alle Pakete: Done
pnpm boundaries   Notiz-Trennung: alle Schichten unverletzt
pnpm test         33 Dateien, 545 Tests, alle grün
```

Ein Paar ist beim ersten Lauf durchgefallen und wurde behoben statt ausgenommen:
`--border-control` auf `--bg-inset` liegt im dunklen Modus bei 2.83:1 und verfehlt SC 1.4.11. Die
gestrichelte Umrandung der Auskunft, die in S-07 anstelle der Exportzeile steht, trägt jetzt
`--border-strong` (4.58:1 hell, 6.17:1 dunkel). Der Grund steht als Kommentar an der Regel.

---

## Was wo steht — für den Abgleich

| Befund | Ort | Datei |
|---|---|---|
| C-01 (1) | S-07 → Reiter „Protokoll", `#/export/protokoll` | `screens/ExportAuditScreen.tsx` |
| C-01 (2) | S-06 und S-03 → Zeilenmenü „Verlauf dieser Buchung" | `screens/BookingDialogs.tsx` |
| C-01 (3) | S-07 → „Letzte Exportläufe" → „Buchungen dieses Laufs" | `screens/ExportScreen.tsx` |
| C-02 | S-07 → Tagesgruppe aufklappen | `components/ExportRowPanes.tsx` |
| C-04 (1) | S-05 → „Todo wählen" → „Erledigte einblenden" | `screens/TimeScreen.tsx` |
| C-04 (2) | S-01 → „Zuletzt bearbeitet" | `screens/DashboardScreen.tsx` |
| C-17 | Kanban-Karte, kleine Timeranzeige, Musterseite | `components/Timer.tsx`, `Kanban.tsx` |
| C-18 | S-07, S-08, S-09 | `ExportScreen.tsx`, `TagsScreen.tsx`, `SettingsScreen.tsx` |
| T-039/1 | S-07 und S-09 → Ordnermerkmale | `components/ExportDirectoryField.tsx` |
| T-039/2 | S-07 und S-09 → „antwortet nicht" | dieselbe Datei, `ExportScreen.tsx` |
| T-039/3 | S-07 und S-09 → „nichts belegt ist keine Entwarnung" | `ExportDirectoryTraitList` |
| CSP | benannte Ausnahme mit Grund und Auflösungsbedingung | `apps/desktop/src/shell.ts` |
