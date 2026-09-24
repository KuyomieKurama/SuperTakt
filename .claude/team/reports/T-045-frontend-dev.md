Aufgabe: T-045 — Der blockierende Befund aus dem Code-Review (`ExportScreen.tsx:365` verschluckt
den Fehlschlag der Gesamtvorschau; die Anzeige behauptet daraufhin „0 Exportzeilen" und der Lauf
bleibt auslösbar), die drei weiteren blanken `catch` mittleren Gewichts, sowie C-23, C-24 und C-25
aus der Nachprüfung T-042.

Status: fertig

---

Artefakte:

```
NEU
apps/web/src/components/DoneFlag.tsx              57 — das Erledigt-Kennzeichen an einer Zeile,
                                                  ein Baustein für S-01, S-02, S-03, S-05

GEÄNDERT
apps/web/src/app/dayGroup.ts                      `DayGroupInsight.previewProblem`; neu
                                                  `previewOpenEntries` mit drei Ausgängen
apps/web/src/app/TimerContext.tsx                 Kommaaufzählung, `CARD_STAYS`, Fehlschlag der
                                                  Pool-Abfrage benannt, Toast nach dem Stoppen
                                                  unterscheidet „kein Wert" von „nicht gefragt"
apps/web/src/components/Kanban.tsx                Wörter aus `DONE_FLAG_LABEL`
apps/web/src/components/Timer.tsx                 `joinGerman`, `CARD_STAYS`
apps/web/src/lib/format.ts                        `joinGerman`
apps/web/src/lib/labels.ts                        `DoneFlagState`, `DONE_FLAG_LABEL`,
                                                  `doneFlagState`, `CARD_STAYS`
apps/web/src/screens/BoardScreen.tsx              Ursache in zwei Fehlermeldungen
apps/web/src/screens/BookingDialogs.tsx           Rücksetzdialog: `previewProblem`, eigener
                                                  `catch`, Ursache in der Fehlermeldung
apps/web/src/screens/BookingsScreen.tsx           Sammel-Rücksetzung nennt, woran sie abbrach
apps/web/src/screens/DashboardScreen.tsx          `DoneFlag`, `previewOpenEntries`, Meldung mit
                                                  Wiederholung statt stiller Null
apps/web/src/screens/ExportAuditScreen.tsx        Kacheln nennen ihren Umfang, Zeile darunter
                                                  nennt die Wirkung des Filters
apps/web/src/screens/ExportScreen.tsx             `TotalsState`, Schaltfläche gesperrt,
                                                  Bestätigungsdialog an `ready` gebunden,
                                                  Wiederholung, „Buchungen dieses Laufs" sagt,
                                                  worüber der Filter wirkt
apps/web/src/screens/TagsScreen.tsx               Ursache in einer Fehlermeldung
apps/web/src/screens/TimeScreen.tsx               `DoneFlag`, `previewOpenEntries`, Grund unter
                                                  den Kacheln
apps/web/src/screens/TodoDetailScreen.tsx         dritter Anzeigezustand am Erledigt-Schalter,
                                                  `clearReactivated`, `previewOpenEntries`,
                                                  Ursachen in zwei Fehlermeldungen
apps/web/src/screens/TodoListScreen.tsx           `DoneFlag` in der Zeile, `clearReactivated`,
                                                  Ursache in der Fehlermeldung
apps/web/src/showcase/InventorySection.tsx        Inventareintrag „Erledigt-Kennzeichen"
apps/web/src/styles/app.css                       `.doneflag*` ersetzt `.pick-row__flag*` und
                                                  `.todo-row__flag`; `.export-summary__pending`,
                                                  `.export-summary__danger`,
                                                  `.done-switch__state`, `.auditcount__scope`
apps/web/scripts/contrast-check.mjs               1 neues Paar (316 → 318)
```

`apps/web/test/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `packages/**`, `tests/e2e/**`,
`docs/**` und die Wurzeldateien: **unangetastet**. `apps/desktop/src/**` lag in meiner Hoheit,
brauchte aber nichts. Kein `any`, keine Typzusicherung auf einen Fachwert, kein neues npm-Paket,
`pnpm-lock.yaml` unverändert. Gerechnet, gerundet und kodiert wird weiterhin nichts in der
Oberfläche.

---

Zusammenfassung:

**Der Blocker — eine Null, die „ich konnte nicht fragen" bedeutet, gibt es nicht mehr.** Aus
`ExportPreview | null` ist `TotalsState` mit vier Ausgängen geworden: `idle` (nichts ausgewählt,
die Null stimmt), `pending` (die Anfrage läuft, es steht noch keine Zahl fest), `ready` (die Zahlen
kommen aus derselben Rechnung wie die Datei, R-17) und `failed`. Drei Dinge hängen daran:

1. **„Export ausführen" ist nur bei `ready` freigegeben.** Das ist die eigentliche Maßnahme: Wer
   die Zeilenzahl nicht kennt, darf sie nicht in eine Datei schreiben, in der Arbeitszeit zu Geld
   wird. `doExport` bricht zusätzlich ab, wenn der Zustand nicht `ready` ist, und liest die
   geplante Zeilenzahl aus `totalsState.value` statt aus `totals?.rows.length ?? 0`.
2. **Der Bestätigungsdialog entsteht erst, wenn die Zahlen feststehen.** Er ist jetzt in
   `{totalsState.kind === "ready" ? … : null}` eingeschlossen und zieht Zeilenzahl und Stunden
   direkt aus dem `ready`-Wert. Damit ist das `?? 0`, das den Satz „0 Exportzeilen — Stunden"
   erzeugte, nicht abgemildert, sondern **verschwunden**: Es gibt keinen Rückfall mehr, sondern
   eine Bedingung. Verlässt die Vorschau `ready`, während der Dialog offen ist, wird `confirmOpen`
   in einem Effekt zurückgesetzt — sonst käme die Rückfrage nach dem nächsten geglückten Abruf von
   selbst wieder.
3. **Der Fehlschlag steht sichtbar da, mit einem Weg zurück.** Über der Zusammenfassung erscheint
   eine Fehlermeldung (`role="alert"`) mit der Ursache aus dem Dienst, dem Satz, warum die
   Schaltfläche gesperrt ist, und „Erneut versuchen"; sie zählt einen Versuchszähler hoch, der in
   den Abhängigkeiten des Effekts steht. Die Auswahl bleibt dabei erhalten. In der Zusammenfassung
   selbst steht statt „0 Exportzeilen" nichts über Zeilen, dafür „Zeilen und Stunden unbekannt —
   die Vorschau hat nicht geantwortet"; die große Stundenzahl zeigt „—", und daneben steht, was
   dieser Strich bedeutet. Beim Nachrechnen erscheint an derselben Stelle „Zeilen und Stunden
   werden gerechnet …" mit Ladeanzeiger. Eine gesperrte Schaltfläche ohne Grund daneben wäre eine
   Sackgasse gewesen.

**Die drei blanken `catch`.** Alle drei hatten dieselbe Bauart: Der Grund wurde verworfen, das
Ergebnis sah aus wie eine Antwort. In `app/dayGroup.ts` trägt `DayGroupInsight` jetzt
`previewProblem`; `quarters === null` **ohne** Meldung ist weiterhin eine Aussage der Domäne, mit
Meldung heißt es „nicht gefragt bekommen". `TimerContext` sagt nach dem Stoppen entsprechend „Zeit
gebucht — der Exportwert ließ sich nicht abfragen" statt zu schweigen, und der Rücksetzdialog in
`BookingDialogs` nennt es an der folgenreichsten Bestätigung des Produkts. Für S-01, S-03 und S-05
kam `previewOpenEntries` dazu — dieselbe Anfrage stand dreimal mit demselben stummen `catch` im
Baum, in S-03 sogar an einer vierten Stelle, die im Auftrag nicht genannt war. Die Kacheln sagen
jetzt „Was der Export daraus macht, ist gerade nicht abrufbar" statt „Noch nicht exportiert.", und
darunter steht der Grund. Wichtig dabei: An allen drei Orten fiel mit der Vorschau auch die Prüfung
auf **Tagesgruppen ohne Leistung** (E-034) aus — die Warnung blieb aus, nicht weil es keine gab,
sondern weil niemand gefragt hatte. Das steht jetzt ausdrücklich in der Meldung.

**C-23 — „Erledigt aufgehoben" steht in allen fünf Listenansichten.** Statt das Etikett ein
viertes und fünftes Mal zu tippen, gibt es `components/DoneFlag.tsx` und `DONE_FLAG_LABEL` in
`lib/labels.ts`. S-01, S-02 und S-05 benutzen den Baustein, die Kanban-Karte behält ihre Hülle
(eine Karte zeigt auch „Offen", weil man es sonst aus dem Spaltennamen raten müsste — E-023) und
nimmt die **Wörter** aus derselben Tabelle. In S-03 zeigt der Erledigt-Schalter nicht mehr schlicht
„Offen", sondern den dritten Zustand samt Etikett und einem Hinweis, der sagt, dass Takt das getan
hat und nicht der Benutzer. Nebenbei geschlossen: S-02 und S-03 haben den Anzeigezustand bisher
nicht beendet, wenn der Benutzer das Kennzeichen **selbst** anfasste — sie rufen jetzt
`clearReactivated` wie S-04.

**C-24 — die zwei Sätze sind zeichengleich.** `join(" und ")` ist `joinGerman` gewichen („A, B und
C"); die Funktion steht in `lib/format.ts` und ist zeichengleich mit `listPools` des Add-ins.
`CARD_STAYS` in `lib/labels.ts` trägt den Halbsatz zur Spalte und ist mit `CARD_STAYS` aus
`duplicate/reopen.ts` byteweise verglichen — identisch. Er wird an **beiden** Stellen der
Hauptanwendung benutzt: im Toast und in `ReactivationNotice`, wo bisher eine dritte Fassung stand
(„die **Status**spalte ändert sich dadurch nicht"). Die drei Aufzählungspunkte des Add-ins gegen
den Fließtext im Toast bleiben, wie vom Prüfer zugelassen.

**C-25 — die Kacheln sagen, worüber sie zählen.** Jede der drei trägt im Detailtext „Gezählt über
40 von 137 Vorgängen — ohne die noch nicht geladenen"; sind alle geladen, sagt sie „Gezählt über
alle 137 Vorgänge". Darunter steht der zweite Umfang, der ebenso leicht überlesen wird: Die Kacheln
zählen über alle geladenen Zeilen und **nicht** über den gesetzten Filter — sonst zeigte die Kachel
eines nicht gewählten Vorgangs eine Zahl, die in der Liste darunter nirgends vorkommt.

**C-26, soweit ohne Dienst möglich.** Der Knopf „Buchungen dieses Laufs" sagt jetzt über `title`,
was er leisten kann, und die Kartenbeschreibung „Letzte Exportläufe" nennt den Vorbehalt, bevor man
klickt. Der Befund selbst bleibt offen und wartet auf `GET /export/audit` mit `exportRunId`.

---

Annahmen:

- **AN-01. `pending` sperrt die Schaltfläche mit.** Der Auftrag verlangte den Riegel für den
  Fehlerfall. Ich habe ihn auf „wird gerade gerechnet" ausgedehnt, weil der Bestätigungsdialog
  sonst eine **veraltete** Zeilenzahl trüge — genau die aus der Auswahl, die der Benutzer eben
  geändert hat. Der Zustand dauert einen lokalen HTTP-Aufruf lang und sagt sich selbst an. Er
  entsteht nur nach einer Änderung der Auswahl, also nie, während die Schaltfläche den Fokus hat;
  ein Fokusverlust durch das Sperren kann daher nicht eintreten.

- **AN-02. Bei `pending` verliert die Zusammenfassung ihre Zahlen, die Gruppenwerte behalten ihre.**
  Das ist Absicht und kein Widerspruch: Der Vergleich vorher/nachher an der einzelnen Tagesgruppe
  ist der Sinn von E-031 und darf nicht springen; die Gesamtzahl dagegen ist die Zahl, mit der
  gleich geschrieben wird, und eine veraltete Gesamtzahl ist an dieser Stelle dieselbe Art
  Behauptung wie die Null.

- **AN-03. Ein Baustein statt fünf Kopien, aber die Kanban-Karte behält ihre Hülle.** Sie hat eine
  andere **Regel**, nicht nur andere Maße: Sie zeigt auch „Offen". Geteilt sind deshalb die Wörter,
  nicht das Markup. `.todo-row__flag` (S-02, graue Sprechblase ohne Symbol) und `.pick-row__flag`
  (S-01, S-05, Symbol und Statusfarbe) sind zu `.doneflag` zusammengefallen — S-02 sieht damit
  anders aus als vorher. Das ist gewollt: Zwei Darstellungen derselben Aussage waren die
  Uneinheitlichkeit, die der Prüfer schwerer gewichtet als ein durchgängiges Fehlen.

- **AN-04. Ein neues Kontrastpaar, gemessen statt behauptet.** Die Fehlermeldung in der
  Exportkopfzeile steht auf `--accent-bg-subtle`, wo bisher nur eine **Warnung** stand. Ich habe
  `--danger-text` auf `--accent-bg-subtle` in die Prüfliste aufgenommen statt die Farbe ungemessen
  zu benutzen: 6.11:1 hell, 6.06:1 dunkel, beide über 4.5:1. Deshalb steht in der Ausgabe unten
  **318** und nicht 316. Ein `--danger-fg` gibt es in den Token nicht; der Wert heißt
  `--danger-text`.

- **AN-05. Über den Auftrag hinaus: ein vierter gleichartiger `catch` und acht stumme
  Fehlermeldungen.** `TodoDetailScreen.tsx:123` hatte dieselbe Bauart wie die drei genannten und
  denselben Satz „Noch nicht exportiert."; ihn stehen zu lassen, hätte die Uneinheitlichkeit
  erzeugt, die C-23 gerade beseitigt. Dazu verwarfen sieben `toasts.failure(...)`-Aufrufe die
  Ursache und zeigten nur „Das Kennzeichen ließ sich nicht ändern" — sie reichen jetzt
  `errorMessage(cause)` als Rumpf durch. Die achte ist die Sammel-Rücksetzung in S-06: Sie meldete
  „3 von 7 Buchungen sind wieder offen" und verschwieg, **woran** sie abgebrochen war — die
  Auskunft, an der hängt, ob ein zweiter Versuch etwas ändert. Alles Fehlerzustände nach §15 und
  keine neuen Funktionen.

- **AN-06. Was an blanken `catch` stehen bleibt, bleibt mit Grund.** Durchgesehen habe ich alle:
  Die Nachschläge in `app/exportAudit.ts` dürfen einzeln fehlschlagen, weil die Protokollzeile
  dann selbst sagt, dass ihre Buchung nicht mehr auffindbar ist (AN-05 aus T-040). Der Fehlschlag
  von `getRunningTimer` wird an der Hülle sichtbar und nicht im Kontext, das Lebenszeichen (E-036)
  ist auf ein Intervall gedeckelt, und `GlobalSearch` hat bereits einen sichtbaren Fehlerzustand
  mit der wahrscheinlichen Ursache. Keiner dieser Fälle behauptet eine Zahl, die er nicht kennt —
  das war das Merkmal der vier, die geändert wurden.

- **AN-07. Der Fehlschlag der Pool-Abfrage nach der Wiederaufnahme bleibt nicht stumm, verhindert
  den Toast aber nicht.** Die drei Wirkungen aus A-2.5 sind eingetreten, gleich ob Takt die Pools
  nennen kann. Sie zu verschweigen, weil eine Nebenauskunft fehlt, wäre der teurere Fehler — das
  Kennzeichen ist dann trotzdem weg. Der Toast erscheint, der Pool-Satz lautet dann „In welchen
  Pools es jetzt erscheint, ließ sich gerade nicht abfragen — die Todo-Liste zeigt es."

---

Risiken:

- **Nicht am laufenden Dienst geprüft.** Getypt, gebaut, Kontrast gemessen, 556 Unit-Tests grün —
  aber ich hatte keinen Dienst, dem sich `POST /export/preview` gezielt abschalten ließe. Der
  gesperrte Zustand von „Export ausführen", die Meldung darüber und die Wiederholung sind im
  Quelltext als eigene Zustände ausgeschrieben und **nicht** auf dem Bildschirm gesehen. Das ist
  der e2e-Fall, den ich unten erbitte: Er ist billig, weil er nur eine fehlschlagende Route
  braucht, und er sichert genau den Weg, der zu Geld führt.

- **Der gesperrte Knopf ist nicht fokussierbar.** `disabled` nimmt ihn aus der Tabulatorfolge; wer
  mit der Tastatur oder einem Screenreader arbeitet, erfährt den Grund über die Fehlermeldung
  (`role="alert"`, kündigt sich beim Erscheinen selbst an) und nicht über den Knopf. Das ist die
  Bauart, die dieser Screen schon für den fehlenden Exportordner benutzt, und deshalb einheitlich —
  aber `aria-disabled` mit erhaltenem Fokus wäre die strengere Lesart von SC 3.3.1. Wenn der
  spec-ux-reviewer das anders sieht, ist es eine Zeile.

- **Zwei Ansagen für ein Ereignis.** Beim Fehlschlag melden sich die höfliche Zusammenfassung
  („Zeilen und Stunden unbekannt") und die dringliche Fehlermeldung (die Ursache) nacheinander. Ich
  halte das für richtig — kurz, dann ausführlich —, es ist aber messbar mehr Sprachausgabe als
  vorher.

- **S-02 sieht anders aus.** Das Erledigt-Etikett dort trägt jetzt Symbol und Statusfarbe statt
  einer grauen Sprechblase (AN-03). Wenn es je Referenzbilder für S-02 gibt, weichen sie an dieser
  Stelle ab.

- **`previewOpenEntries` bündelt drei Aufrufstellen.** Ändert jemand das Verhalten dort, ändert er
  es in S-01, S-03 und S-05 gleichzeitig. Das ist der Zweck; es ist trotzdem eine neue
  Kopplung zwischen drei Screens, die vorher keine hatten.

---

Offene Fragen:

1. **An den e2e-tester:** Ein Fall für den gesperrten Export fehlt. Der wichtigste: Vorschau
   antwortet nicht → „Export ausführen" ist gesperrt, die Fehlermeldung steht da, „Erneut
   versuchen" holt die Zahlen zurück, und die Auswahl ist danach unverändert. Ein zweiter wäre
   „Fehlschlag, während der Bestätigungsdialog offen ist" — der Dialog muss verschwinden und darf
   nicht von selbst wiederkommen.

2. **An den domain-dev, unverändert aus T-040:** `GET /export/audit` mit `exportRunId`. Solange er
   fehlt, sagt die Ansicht, worüber sie filtert (C-26); danach ziehe ich nach — es ist der Filter
   durchgereicht statt gerechnet, also weniger Code als jetzt.

3. **An den spec-ux-reviewer:** C-25 ist geschlossen, indem die Kacheln ihren Umfang nennen. Die
   zweite Möglichkeit aus deinem Vorschlag — die Kacheln fallen lassen, bis die Route eine Zählung
   je Ereignis liefert — habe ich nicht gewählt, weil die Zahlen über eine vollständig geladene
   Seite richtig sind und die Legende darüber sonst ohne Beispiel dastünde. Reicht dir das, oder
   soll eine Zählung je Ereignis an `GET /export/audit`?

4. **An den spec-ux-reviewer:** In S-03 endet der Anzeigezustand „Erledigt aufgehoben" jetzt auch
   dann, wenn der Benutzer den Haken selbst setzt — vorher tat das nur S-04. Ist „bis der Benutzer
   das Kennzeichen anfasst" die richtige Lesart, oder soll er die Sitzung überdauern, bis das Todo
   erneut erledigt **ist**?

---

Nächster Schritt:

**C-05** ist der kleinste Eingriff mit der größten Wirkung und liegt jetzt frei: Der
Bestätigungsdialog in S-07 ist gerade angefasst worden und hat den Pfad, den Dateinamen-Vorbehalt
und den A-8.9-Satz im Wiederholungsfall weiterhin nicht. Danach **C-12** und **C-14**, die am
meisten Fläche zurückgeben.

---

## Nachweis

```
pnpm typecheck    alle 8 Pakete: Done, 0 Fehler
pnpm contrast     0 von 318 Paaren durchgefallen
pnpm build        alle Pakete: Done
pnpm boundaries   Notiz-Trennung: alle Schichten unverletzt
pnpm test         34 Dateien, 556 Tests, alle grün
```

Zur Kontrastausgabe: **318 statt 316**, weil ein Paar dazugekommen ist und keines durchgefallen ist
(AN-04). Die beiden neuen Zeilen lauten wörtlich:

```
OK     6.11:1 (min 4.5:1)  --danger-text auf --accent-bg-subtle  — Fehlschlag der Gesamtvorschau in der Exportkopfzeile   [hell]
OK     6.06:1 (min 4.5:1)  --danger-text auf --accent-bg-subtle  — Fehlschlag der Gesamtvorschau in der Exportkopfzeile   [dunkel]
```

Zeichengleichheit maschinell geprüft (`CARD_STAYS` in `apps/web/src/lib/labels.ts` gegen
`apps/outlook-addin/src/duplicate/reopen.ts`): identisch. Die Aufzählung ergibt `„A“`,
`„A“ und „B“`, `„A“, „B“ und „C“` — dieselbe Ausgabe wie `listPools` des Add-ins.

---

## Was wo steht — für den Abgleich

| Befund | Ort auf dem Bildschirm | Datei |
|---|---|---|
| Blocker (1) | S-07 → „Export ausführen" gesperrt, solange die Vorschau fehlt | `screens/ExportScreen.tsx` |
| Blocker (2) | S-07 → Meldung über der Zusammenfassung, „Erneut versuchen" | dieselbe Datei |
| Blocker (3) | S-07 → Zusammenfassung sagt „unbekannt" bzw. „wird gerechnet" | dieselbe Datei |
| Blocker (4) | S-07 → Bestätigungsdialog entsteht nur bei bekannten Zahlen | dieselbe Datei |
| `catch` 1 | Toast nach dem Stoppen; Rücksetzdialog in S-06/S-03 | `app/dayGroup.ts`, `app/TimerContext.tsx`, `screens/BookingDialogs.tsx` |
| `catch` 2 | S-05 → Kachel „Noch offen" und Grund darunter | `screens/TimeScreen.tsx` |
| `catch` 3 | S-01 → Kachel „Noch nicht exportiert" und Meldung mit Wiederholung | `screens/DashboardScreen.tsx` |
| `catch` 4 (AN-05) | S-03 → Kachel „Noch offen" und Grund darunter | `screens/TodoDetailScreen.tsx` |
| Fehlermeldungen (AN-05) | acht Meldungen nennen jetzt die Ursache | `TodoList-`, `TodoDetail-`, `Board-`, `Tags-`, `BookingsScreen.tsx`, `BookingDialogs.tsx` |
| C-23 (1) | S-02 → Etikett in der Todo-Zeile | `screens/TodoListScreen.tsx`, `components/DoneFlag.tsx` |
| C-23 (2) | S-03 → Erledigt-Schalter zeigt den dritten Zustand | `screens/TodoDetailScreen.tsx` |
| C-23 (3) | S-01, S-05 auf denselben Baustein umgestellt | `Dashboard-`, `TimeScreen.tsx` |
| C-24 (1) | Toast nach der Wiederaufnahme: „„A“, „B“ und „C“" | `app/TimerContext.tsx`, `lib/format.ts` |
| C-24 (2) | derselbe Toast und `ReactivationNotice`: `CARD_STAYS` | `app/TimerContext.tsx`, `components/Timer.tsx`, `lib/labels.ts` |
| C-25 | S-07 → Protokoll → drei Kacheln und die Zeile darunter | `screens/ExportAuditScreen.tsx` |
| C-26 (Zwischenstand) | S-07 → „Letzte Exportläufe" → Knopf und Kartentext | `screens/ExportScreen.tsx` |
