Aufgabe: T-094 — E-058 Absatz 3 in der Oberfläche, E-059

Status: fertig

Artefakte:

```
apps/web/src/api/types.ts              PoolMovement aus @takt/domain re-exportiert;
                                       StartTimerResult.started um poolMovement erweitert
apps/web/src/app/TimerContext.tsx      announceStart nimmt poolMovement entgegen und bildet
                                       den Satz über poolMovementSentence; CARD_STAYS,
                                       joinGerman und useStructure raus
apps/web/src/app/StructureContext.tsx  poolsContaining ersatzlos entfernt (Schnittstelle,
                                       Umsetzung, Aufzählung im useMemo)
apps/web/src/components/Timer.tsx      ReactivationNotice: poolNames → movement; Satz aus
                                       der Domäne statt aus zwei Zweigen plus CARD_STAYS
apps/web/src/lib/labels.ts             CARD_STAYS gelöscht (Notiz an seiner Stelle);
                                       POOL_EXPORT_LABEL nach E-059; Hinweis zur
                                       Ausbuchung nachgeschärft
apps/web/src/lib/poolRule.ts           EXPORT_TEXT gelöscht, die Vorschau nimmt
                                       POOL_EXPORT_LABEL; RuleAxis.exportState entfernt;
                                       tote completionSpoken/exportSpoken gelöscht
apps/web/src/components/RuleSummary.tsx Exportachse ohne ExportStatusBadge — Achsensymbol
                                       plus das Wort der Regel
apps/web/src/screens/TodoDetailScreen.tsx  Satz bei „Erledigt aufgehoben" ohne
                                       Regelauswertung; der Nachbarsatz ebenso
apps/web/src/screens/BoardScreen.tsx   S-3-Kommentar sagt jetzt, warum hier kein
                                       Bewegungssatz steht (Route liefert ihn nicht)
apps/web/src/api/endpoints.ts          „Verschiebt keine Karte" berichtigt; Notiz an
                                       listPoolTodos (kein Aufrufer mehr)
apps/web/src/lib/format.ts             joinGerman: wofür sie nicht mehr da ist
apps/web/src/showcase/TimeSection.tsx  vier Bewegungsfälle nebeneinander, aus der Funktion
                                       gebildet statt abgeschrieben
apps/web/src/showcase/BoardSection.tsx ReactivationNotice über PoolMovement; zwei
                                       Spaltenbehauptungen in Ansagen berichtigt
apps/web/src/showcase/RuleSection.tsx  E-059 erklärt, „Exportiert" → „Abgerechnet"
```

Nicht angefaßt: `packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `tests/**`,
`docs/**`, `apps/desktop/**`, `apps/web/test/**`, alle `tsconfig*.json`.

---

## Zusammenfassung

`CARD_STAYS` und `poolsContaining` sind ersatzlos weg. Der Satz über die Poolbewegung kommt
jetzt an jeder Fläche der Hauptanwendung aus `poolMovementSentence` in `@takt/domain`, gefüttert
mit dem `poolMovement`, das `POST /timer/start` mitschickt; die Oberfläche hält keine Abschrift
und wertet keine Regel mehr aus. Der Anlaß wird aus `doneCleared` bestimmt, und bei `null` bleibt
die Fläche **ganz** weg statt mit `?? ""` gefüllt zu werden — dadurch ist nebenbei O-G erledigt:
Die erste Buchung auf einem offenen Todo meldet jetzt sichtbar, in welche Spalte sie das Todo
hebt. E-059 ist umgesetzt, und zwar bis in die Vorschau: Die zweite Fassung `EXPORT_TEXT` ist
gelöscht, Optionsknopf und Zusammenfassung sagen dieselben Wörter.

Gemessen mit Exitcode und ohne Pipe: `pnpm run typecheck` 0, `pnpm --filter @takt/web build` 0,
`pnpm --filter @takt/web build:designsystem` 0, `pnpm run contrast` 0 (0 von 432 durchgefallen),
`pnpm run boundaries` 0, `pnpm run test:e2e` 1 — 36 grün, ein Durchfaller in einem Fall des
e2e-testers aus dieser Welle (siehe Abschnitt 7).

---

## 1. Der Satz hat eine Quelle, und es ist nicht mehr diese

`TimerContext.announceStart` bekommt ein viertes Argument und stellt genau eine Frage:

```
const movementSentence =
  poolMovement === null
    ? null
    : poolMovementSentence(poolMovement, "past", doneCleared ? "reopen" : "booking");
```

Was dabei verschwunden ist, war nicht bloß uneinheitlich, sondern in drei Punkten falsch:

| Der alte Weg | Warum er nicht zu retten war |
|---|---|
| `poolsContaining` fragte je Pool `/pools/{id}/todos` | Er lief **nach** der Handlung. Der Zustand davor war weg, also war „erscheint neu" von „stand schon da" nicht zu unterscheiden — `enters` ist so grundsätzlich nicht zu bekommen. |
| Er kannte nur, was hinzukommt | Eine Spalte „nur Erledigte" verliert das Todo mit genau diesem Start. Davon stand kein Wort im Toast. |
| `CARD_STAYS` behauptete das Gegenteil | Seit E-055 fragt eine Regel nach „Erledigt" und nach dem Exportstatus. Ein Timerstart ändert beides. |

Angebunden ist **nur** `POST /timer/start`. Daß T-093 inzwischen auch `POST /timer/stop` und
`POST /timer/orphaned/resolve` mit `poolMovement` versorgt, habe ich gesehen und wie beauftragt
liegen gelassen; in `api/types.ts` steht kein Feld, das ich nicht anbinde. Das ist Welle C.

## 2. Wo der Satz jetzt steht — und wo bewußt keiner steht

| Fläche | Vorher | Jetzt |
|---|---|---|
| Toast, Start auf erledigtem Todo | Aufzählung + `CARD_STAYS` | `poolMovementSentence(…, 'past', 'reopen')`, dazu „Rückgängig" |
| Toast, Start auf offenem Todo | „Er läuft auf „X"." | derselbe Satz plus `…, 'past', 'booking'`, wenn es etwas zu sagen gibt (**O-G**) |
| `ReactivationNotice` | `poolNames` + `CARD_STAYS` | `movement: PoolMovement \| null` |
| `TodoDetailScreen`, „Erledigt aufgehoben" | „erscheint erneut in jedem Pool, dessen Regel auf seine Tags passt" + `CARD_STAYS` | „Das Todo ist wieder offen; welche Pools und Spalten das betrifft, hat die Meldung beim Start genannt." |
| Board-Toast nach „Erledigt" (S-3) | seit T-091 beim Faktum | **unverändert beim Faktum** — Begründung unten |

Der Rückweg „Rückgängig" hängt **nicht** am Poolsatz. Das Kennzeichen ist auch dann weg, wenn
über die Bewegung nichts zu berichten ist.

**`TodoDetailScreen`** rekonstruiert nichts. Diese Ansicht kennt den Zustand vor dem Start nicht;
jeder Versuch, die Bewegung nachträglich zu erzählen, wäre wieder die schlechtere zweite Auskunft.
Sie verweist deshalb auf die Meldung, die es zum richtigen Zeitpunkt gab. Den Nachbarsatz für den
Normalfall habe ich mitgenommen — er sagte ebenfalls „deren Regel auf seine Tags passt", und das
ist seit E-055 dieselbe halbe Wahrheit.

## 3. Der Board-Toast aus S-3 — was ich gemessen habe, statt zu raten

Die Auflage lautete „an dieselbe Quelle". Das geht an dieser Handlung heute **nicht**, und der
Grund steht als Kommentar im Quelltext:

`poolMovementSentence` braucht die drei Namenslisten, und die entstehen aus einem Zustandspaar
vor und nach der Handlung. Nur der Dienst hat beides. Er gibt es nach E-058 an den **Timer**-Routen
heraus; die beiden Erledigt-Routen `PUT` und `DELETE /todos/{todoId}/done` antworten mit dem Todo
und sonst nichts (nachgesehen in `openapi/takt-local-api.yaml:566` und in `api/endpoints.ts`).

Hier selbst zu rechnen wäre genau die zweite Fassung, die E-058 gerade abgeschafft hat — und sie
wäre schlechter: Nach dem Aufruf ist der Zustand davor weg. Der Toast bleibt deshalb beim Faktum
(„Tags und Status ändern sich dadurch nicht."), und die Lücke steht als offene Frage 1 unten.
Der Timerstart **auf** dem Board läuft über `TimerContext` und hat den Satz sehr wohl.

## 4. E-059 — bis in die Vorschau, nicht nur an den Optionsknopf

`POOL_EXPORT_LABEL.open` heißt „Noch nicht abgerechnet", `.exported` heißt „Abgerechnet". Der
Datenwert `export_state = 'open'` ist unberührt.

Damit war die Achse aber an **zwei** weiteren Stellen noch anders beschriftet, und beide standen
im selben Dialog wie der Optionsknopf:

1. **`EXPORT_TEXT` in `lib/poolRule.ts`** — „Mit offener Buchung" / „Mit exportierter Buchung".
   Gelöscht; `describeRule` nimmt jetzt `POOL_EXPORT_LABEL`. Der Grund, aus dem die alte Fassung
   „mindestens eine …" ausschrieb (der Exportstatus gehört der Buchung, E-032), ist nicht
   verloren — er steht im Hilfssatz **an** der Achse, also vor der Entscheidung statt in der
   Zusammenfassung danach.
2. **Das `ExportStatusBadge` in `RuleSummary`** — es brachte sein eigenes Wort mit, „Offen". Drei
   Zeilen unter dem Optionsknopf „Noch nicht abgerechnet" stand damit wieder genau das Wort, das
   E-059 von diesem Dialog verbannt. Die Achse zeichnet jetzt wie jede andere Textachse:
   Achsensymbol plus ihr Wort. Siehe Annahme 1.

Nachgemessen an der gebauten Musterseite: die Exportachse der Vorschau liest sich
`"EXPORTSTATUS\nNoch nicht abgerechnet"`.

**Der Widerspruch, den E-059 erbt, ist ausgesprochen statt überspielt:** Eine Buchung im
Anzeigezustand „Nicht abgerechnet" (E-047, E-050) steht in einer Spalte namens „Abgerechnet" —
beide Wörter sind richtig, weil das eine den Anzeigezustand meint und das andere den Wert
`export_state`, den beide teilen. `POOL_EXPORT_NOT_BILLED_HINT` sagt das jetzt wörtlich. Das
Etikett der **Buchung** habe ich nicht angefaßt: `EXPORT_STATUS_LABEL` und `EXPORT_STATE` bleiben
„Offen" / „Exportiert" / „Erneut offen" / „Nicht abgerechnet". E-059 spricht vom Exportstatus
einer **Spalte**; die 19 Flächen mit Buchungsetiketten wären eine eigene Entscheidung. Siehe
Risiko 2.

## 5. Musterseite — vier Sätze nebeneinander, keiner abgeschrieben

Abschnitt 6 zeigt die vier Fälle des Anlasses „Wiederöffnen" untereinander. Die Musterseite hält
dabei **die Eingabe** (drei Namenslisten, erfundene Namen) und nicht den erwarteten Wortlaut — eine
Seite, die den Satz abschreibt, prüft nur sich selbst. Aus der Anwendung heraus gemessen, hell und
dunkel, ohne Konsolenfehler:

```
Es ist zurück in „Intern“ und aus „Erledigt diese Woche“ verschwunden.
Es ist zurück in „Intern“ und „Ost“.
Es ist aus „Erledigt diese Woche“ verschwunden und erscheint sonst nirgends.
Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool und in keiner Spalte.
```

Das ist Zeile für Zeile die Spalte „Bericht (`past`)" der Wortlauttabelle aus dem Board — gemessen,
nicht behauptet, und ohne daß ich einen der Sätze irgendwo hinterlegt hätte.

Dazu: `showcase/TimeSection.tsx:122-123` ist ersetzt (der Absatz behauptete, der Satz sage
ausdrücklich, die Karte habe die Spalte nicht gewechselt); die `InlineMessage` „Wenn keine
Poolregel greift" ist zu einer Warnung geworden, die den entfallenen Kartensatz benennt. In
`BoardSection` haben zwei Ansagen für Vorlesehilfen dieselbe Behauptung getragen („die Regeln
treffen weiter zu", „in denselben Spalten wie zuvor") — beide berichtigt.

## 6. Was dabei sonst noch weg ist

- `RuleAxis.exportState` — nach Punkt 4 ohne Leser.
- `completionSpoken` und `exportSpoken` in `lib/poolRule.ts` — seit T-091 ohne Aufrufer, und
  `exportSpoken` war der letzte Leser von `EXPORT_TEXT`. Zwei ungenutzte Nebenwege zu einem Satz,
  den `ruleSpoken` bereits aus derselben Beschreibung bildet, sind kein Vorrat.
- Der Kommentar an `clearTodoDone` („Verschiebt keine Karte.") — derselbe Irrtum wie `CARD_STAYS`,
  nur in einer Zeile Dokumentation.
- `listPoolTodos` hat keinen Aufrufer mehr. Die Funktion bleibt als Abbildung der Route stehen
  (Weiterblätterweg einer Board-Spalte), mit einer Notiz, warum sie gerade niemand ruft.

## 7. Prüfläufe

| Lauf | Exitcode | Ergebnis |
|---|---|---|
| `pnpm run typecheck` | **0** | acht Pakete plus `typecheck:test` einschließlich des neuen `apps/web/tsconfig.test.json` |
| `pnpm --filter @takt/web build` | **0** | 365 Module |
| `pnpm --filter @takt/web build:designsystem` | **0** | siehe Anmerkung unten |
| `pnpm run contrast` | **0** | 0 von 432 durchgefallen |
| `pnpm run boundaries` | **0** | Notiz-Trennung unverletzt, 306 Dateien geprüft |
| `pnpm run test:e2e` | **1** | 36 grün, 1 rot |
| `pnpm exec vitest run apps/web/test` | 0 | 8 Fälle des unit-testers grün gegen meinen Stand |
| Musterseite hell und dunkel, headless gerendert | — | keine Konsolenfehler; Sätze und Exportachse ausgelesen |

**`pnpm run build:designsystem` gibt es an der Wurzel nicht** (`ERR_PNPM_NO_SCRIPT`). Das Skript
steht in `apps/web/package.json:11`; gelaufen ist `pnpm --filter @takt/web build:designsystem`.
Die Wurzel-`package.json` gehört dem Orchestrator, ich habe sie nicht angefaßt.

**Der rote End-to-End-Fall gehört nicht mir und ist nicht meiner:**
`tests/e2e/kanban.spec.ts:357` — „TP-KANBAN-06 … (E-057, **T-096**)", angelegt vom e2e-tester in
dieser Welle. Er scheitert an Zeile 417: Nachdem ein Tag in den vorher leeren Regelordner gelegt
wurde, erscheint die Karte nicht in der Spalte. Das ist Regelauflösung in Dienst und Board und
berührt keine Zeile aus T-094 — kein Wortlaut, keine Exportachse, kein Timer. Gemeldet, nicht
repariert (fremde Hoheit). `tests/e2e/tag-folder-rule-lock.spec.ts` lief in einem früheren Lauf
noch rot und ist inzwischen grün.

Ports 17843, 17844 und 5173 waren vor jedem Lauf frei; kein fremder Prozeß wurde beendet. Die
Musterseite lief auf 5199 und ist gestoppt, das Prüfskript dafür gelöscht.

---

Annahmen:

1. **Das Buchungsetikett verläßt die Regelvorschau** (Abschnitt 4, Punkt 2). Die Auflage
   „`RuleSummary` folgt E-059" ist anders nicht erfüllbar: Das Etikett kann sein Wort nicht
   wechseln, ohne das Wort der Buchung zu wechseln. Umkehrbar in einer Zeile, falls der
   UX-Reviewer die Farbfläche höher gewichtet als die Wortgleichheit — dann bräuchte
   `ExportStatusBadge` eine Beschriftung von außen, und das wäre wieder ein zweiter Weg.
2. **`describeRuleReach` war in der Auflage vermutlich `describeRule` gemeint.** In
   `describeRuleReach` steht kein Wort über den Exportstatus; die E-059-Wörter fließen über
   `describeRule` in die Vorschau. Beide stehen in `lib/poolRule.ts`, geändert habe ich das, was
   die Wörter führt.
3. **Zwei tote Funktionen mitgenommen** (`completionSpoken`, `exportSpoken`). Kein Aufrufer, kein
   Test — geprüft, auch gegen `apps/web/test/`.
4. **`PoolMovement` wird in `api/types.ts` unmittelbar aus `@takt/domain` bezogen**, nicht über
   `lib/labels.ts` wie die Aufzählungen daneben. `labels.ts` gibt es zum Beschriften; an drei
   Namenslisten ist nichts zu beschriften, und ein Umweg dorthin wäre die Einladung, den Satz doch
   noch einmal abzulegen.
5. **`doneCleared && poolMovement === null` behandle ich als „keine Fläche".** Der Dienst rechnet
   in diesem Fall immer, der Zweig sollte unerreichbar sein. Erfunden wird trotzdem nichts: Der
   Titel sagt weiterhin, daß das Todo wieder offen ist.

Risiken:

1. **Der Board-Toast nach „Erledigt" schweigt weiter über Spalten** (Abschnitt 3). Das ist
   dieselbe Lücke wie O-G, nur an der Handlung von Hand statt am Timer: Eine Spalte mit
   Erledigt-Achse gewinnt oder verliert die Karte mit genau diesem Klick, und niemand sagt es.
   Kein Wort davon ist falsch — es fehlt eines. Siehe offene Frage 1.
2. **Zwei Vokabulare für den Exportstatus, absichtlich.** Regelachse „Noch nicht abgerechnet" /
   „Abgerechnet" (E-059), Buchung „Offen" / „Exportiert" / „Erneut offen" / „Nicht abgerechnet"
   (E-032, E-050). Das ist so entschieden und in beiden Richtungen erklärt, aber es sind zwei
   Wörter für einen Datenwert, und der Buchungsfilter in Abschnitt 3 der Musterseite trägt
   weiterhin die alten. Ein Blick des UX-Reviewers wäre gut.
3. **Der Satz kommt aus einem Paket, das ein anderer Agent gerade geändert hat.** Gemessen habe
   ich gegen den Stand von T-093 nach dessen Abschluß, und er trifft die Board-Tabelle Wort für
   Wort. Ändert die Domäne den Wortlaut erneut, ändert sich die Oberfläche stillschweigend mit —
   das ist der Zweck, und es ist zugleich der Grund, warum `apps/web` **keinen** Prüffall auf den
   Wortlaut hält. Die Wortlautprüfung gehört in T-095.
4. **Sicherheit:** keine neue Angriffsfläche. `poolMovement` trägt Poolnamen, also Konfiguration
   des Benutzers, keine Kunden- oder Call-Daten; es geht in keinen Export (`boundaries` grün, die
   Notiz-Trennung ist unberührt). Eine Abfrage je Pool bei jedem Timerstart auf einem erledigten
   Todo entfällt ersatzlos. Alle Musterdaten sind erfunden.

Offene Fragen:

1. **An den Orchestrator, für Welle C:** Sollen `PUT` und `DELETE /todos/{todoId}/done` ebenfalls
   `poolMovement` liefern (Anlaß `'booking'` paßt nicht, es wäre ein dritter — `'done'`)? Die
   Begründung aus E-058 Punkt 6 gilt hier wörtlich: Wer am Timer eine Auskunft gibt und am
   Erledigt-Haken schweigt, sagt die halbe Wahrheit. Bis dahin steht der Toast beim Faktum, und
   das ist im Quelltext begründet.
2. **An den spec-ux-reviewer:** Trägt Annahme 1 (Exportachse ohne Buchungsetikett)? Ich sehe
   Wortgleichheit im selben Dialog höher als die Wiedererkennung der Farbfläche; SC 1.4.1 ist über
   Achsensymbol und Wort weiterhin erfüllt.
3. **An den Orchestrator:** `pnpm run build:designsystem` existiert an der Wurzel nicht. Soll es
   dorthin (`"build:designsystem": "pnpm --filter @takt/web build:designsystem"`)? Es wird in
   Aufträgen genannt, als gäbe es das Skript.

Nächster Schritt:

Welle C wie geplant: `POST /timer/stop` und `POST /timer/orphaned/resolve` in `TimerContext`
anbinden — `performStop` und `confirmOrphan` bekommen denselben Dreisatz wie `announceStart`, mit
Anlaß `'booking'` und derselben Regel „`null` heißt keine Fläche". Das sind zwei Stellen und keine
neue Bauform. Danach der e2e-Vergleich des Bewegungssatzes zwischen Hauptanwendung und
Aufgabenbereich; er kann jetzt an `.reactivation__body` und am Toast ansetzen, und beide Seiten
zeigen denselben Text aus derselben Funktion.
