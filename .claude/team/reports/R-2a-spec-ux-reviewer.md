Aufgabe: R-2a — Wiedervorlage Spezifikation und Bedienkonzept (Qualitätstor, zweite Runde)

Status: **freigegeben** für Welle A bis C, mit zwei Auflagen und elf Befunden ohne Sperrwirkung.
Prüfstand `aca53df`, Prüfumfang `git diff 3240dcc..HEAD`, gelesen und nicht ausgeführt.

Artefakte: diese Datei. Sonst nichts angefaßt.

---

## Zusammenfassung

Alle fünf blockierenden Befunde aus R-2 sind erledigt, und zwar nicht abgedichtet, sondern
aufgelöst. `CARD_STAYS` ist an jeder Oberfläche verschwunden; an seine Stelle tritt kein zweiter
Beruhigungssatz, sondern eine Auskunft aus **einer** Quelle. Die vierzehn Sätze der Tabelle bei
T-093 stehen zeichengenau in `packages/domain/src/pool-movement.ts`, und alle fünf Flächen — Toast
beim Start, Toast beim Stopp, Toast bei der verwaisten Buchung, Ankündigung im Aufgabenbereich,
Bestätigung im Aufgabenbereich — rufen dieselbe Funktion mit derselben Bedeutung von Zeitform und
Anlaß. Die Hauptanwendung kennt `leaves` (B-2), reine Board-Spalten werden genannt (B-4), das
Regelformular hat für Ordner und Status Lade-, Fehler- und Bereitzustand (B-5), und die falsche
Ursachenbehauptung ist samt der stillen Kürzung bei zwölf verschwunden (B-3, B-3b). Auch die zehn
Sollte-Punkte und die vier Hinweise aus R-2 sind abgearbeitet, jeder an der Stelle, an der er
gemeldet war.

Was übrig ist, ist von anderer Art. Der gestrichene Satz lebt in **drei** Abschriften weiter, die
keine Oberfläche sind, aber gelesen werden: in der Schnittstellenbeschreibung der Add-in-Route, im
Domänentyp `TimerStartResult` und an `markDone` im SQLite-Adapter. `docs/architektur.md`
widerspricht sich seit R-2 unverändert selbst — Zeile 105 nennt den Satz falsch, Zeile 336 sagt ihn
noch einmal. Und an zwei Toasts der Hauptanwendung beginnt der Bewegungssatz mit „Es", ohne daß
über ihm ein Todo genannt wäre; das Add-in hat genau dieses Problem an beiden eigenen Flächen
gelöst, die Hauptanwendung an einer von dreien.

Der einzige neue Befund gegen WCAG 2.2 AA ist die Absage im Bestätigungsdialog: Sie erscheint, wird
aber nicht angesagt, und beim Ordner- und Tag-Dialog wechselt dabei weder Titel noch Knopf. Das ist
zugleich die Antwort auf die offene Frage 1 aus T-097.

D-1 und D-2 (`docs/benutzerhandbuch.md`) stehen unverändert falsch. Sie bleiben blockierend für die
Freigabe des Produkts, nicht für diese Runde: Der Dokumentierer arbeitet nach dem Qualitätstor, so
steht es in `CLAUDE.md`, und das Verhalten ist jetzt stabil genug, um beschrieben zu werden — siehe
Abschnitt 6.

---

## 1. Jeder Befund aus R-2 gegen den Stand

### 1.1 Die fünf blockierenden

**B-1 — `CARD_STAYS` an vier Flächen. Erledigt.**

Der Satz ist an keiner Oberfläche mehr zu finden. An seiner Stelle stehen Notizen, die ihn
begründet begraben: `apps/web/src/lib/labels.ts:192-215` und `apps/outlook-addin/src/duplicate/
reopen.ts:33-39`. Die vierte Zeile des Aufgabenbereichs (`aside`) ist mitsamt ihrem Feld gestrichen
(`reopen.ts:91-97`), der Typ `ReopenNotice.effects` ist auf genau drei Sätze festgeschrieben, und
`apps/outlook-addin/scripts/proof-addin.mjs:316-323` und `:906-918` halten beides als statische
Wache fest — geprüft wird jetzt gegen die Funktion, nicht gegen eine Abschrift.

Nach dem Wortlaut habe ich über den ganzen Baum gesucht. Er steht noch an fünf Stellen; zwei davon
sind Historie und richtig so (`docs/benutzerhandbuch.md` gehört zu D-2, die Nachweisskripte und die
Notizen zitieren ihn als das, was er war). Drei sind Befunde und stehen unten als W-1 bis W-3.

**B-2 — Hauptanwendung ohne `leaves`. Erledigt, und besser als vorgeschlagen.**

`poolsContaining` ist ersatzlos weg. `POST /timer/start`, `/timer/stop` und
`/timer/orphaned/resolve` liefern `poolMovement`; die Oberfläche bildet den Satz mit derselben
Funktion wie das Add-in (`apps/web/src/app/TimerContext.tsx:121-135`, `:320-323`;
`apps/web/src/components/Timer.tsx:210-211`). Die Rechnung liegt einmal in
`apps/local-api/src/usecases/pool-movement.ts` und vergleicht Regeln mit sich selbst statt Namen
mit Namen (`:211-226`) — genau der Vergleich, vor dem ich in R-2 gewarnt hatte, findet nicht statt.
Der „kleine" Weg aus R-2 ist gebaut, nicht der „sofortige".

**B-3 / B-3b — falsche Ursachenbehauptung, stille Kürzung. Erledigt.**

„Auf seine Tags paßt derzeit keine Poolregel" gibt es nicht mehr; der Satz der Domäne lautet „Auf
dieses Todo passt derzeit keine Regel …" (`pool-movement.ts:242-243`) und behauptet keine Ursache.
`slice(0, 12)` ist mit `poolsContaining` verschwunden.

**B-4 — reine Board-Spalten. Erledigt.**

`poolMovementNamer` ruft `unit.pools.list('all')` (`usecases/pool-movement.ts:150-152`), mit der
Begründung im Kopf der Datei. Der Add-in-Dienst benutzt denselben Anwendungsfall
(`apps/local-api/src/routes/addin/service.ts:291`, `:722`). `GET /addin/context` bleibt bei
`list()` (`service.ts:72`) — das ist E-058 Punkt 7 und richtig: Der Aufgabenbereich hat kein Board,
und reine Spalten erreichen ihn ausschließlich über den Bewegungssatz.

**B-5 — Lade- und Fehlerzustand im Regelformular. Erledigt.**

`apps/web/src/components/RulePickers.tsx:134-155` trennt lädt / Fehler mit Wiederholknopf /
bereit, und zwar für Ordner **und** Status; die falsche Behauptung „Es gibt noch keinen Ordner."
steht jetzt nur noch im Zustand `ready` (`:259`, `:331`). Die Hülle trägt `role="group"`,
`aria-labelledby` und `aria-busy` (`:149-153`) — damit ist zugleich die Hälfte von S-7 erledigt.
Der Spaltendialog hat seinen Ladezustand ebenfalls bekommen (`BoardScreen.tsx:951-965`), den R-2 in
der Zustandstabelle als fehlend geführt hatte.

### 1.2 Die zehn Sollte- und vier Hinweispunkte

| Nr | Stand | Beleg |
|---|---|---|
| S-1 Ausbuchungen zählen mit | erledigt | `labels.ts:351-352`, im Hilfssatz der Achse `PoolFormDialog.tsx:699` |
| S-2 „Regel über Tags" | erledigt an der Oberfläche | `labels.ts:384-397`, drei Fassungen; Restvorkommen siehe W-6 |
| S-3 Toast nach „Erledigt" | erledigt | `BoardScreen.tsx:172-180` nennt nur noch das Faktum |
| S-4 „Spalte" für `statusId` | erledigt | `TaskPane.tsx:640-645` |
| S-5 zwei Schutzniveaus | erledigt nach E-059 | `BoardScreen.tsx:208-236`, `TagsScreen.tsx:484-507` |
| S-6 Hilfssatz im `<label>` | erledigt | `RadioRow.tsx:125-144`, Spans als Geschwister |
| S-7 vier Bedienelemente, zwei Namen | erledigt | „Erforderliche/Ausgeschlossene Tags/Ordner", `PoolFormDialog.tsx:549`, `576`, `590`, `599` |
| S-8 Vorschau ohne Live-Region | erledigt | `PoolFormDialog.tsx:405-424`, mit 500-ms-Bremse und Warnband **vor** der Vorschau (`:705-713`) |
| S-9 Toast nach dem Speichern | erledigt | `PoolFormDialog.tsx:475-508`, aus `saved.resolved`, `tone: "warning"` |
| S-10 Musterseite | erledigt | `showcase/BoardSection.tsx:496-541`, Zeile „Spalte" und der zweigeteilte Absatz |
| H-1 Filterschalter | erledigt | `BoardScreen.tsx:302` |
| H-2 ungemessenes Farbpaar | erledigt, dreifach | `contrast-check.mjs:278-289`, Gruppe „Regelformular" |
| H-3 Begriffsbindung Statusachse | erledigt | `labels.ts:267-278`, eigene Konstante |
| H-4 doppelte O-Kennungen | erledigt | Board, O-M bis O-U |

### 1.3 Dokumentation

**D-1 / D-2 — offen, planmäßig.** `docs/benutzerhandbuch.md:121-128` beschreibt das Ziehen,
`:162-172` sagt „Die Kanban-Spalte ändert sich dabei nicht" und zitiert den gestrichenen Satz
wörtlich. Beim Dokumentierer, siehe Abschnitt 6.

**D-3 — nicht erledigt.** `docs/architektur.md:334-344`. Siehe W-4.

### 1.4 Deckungslücken

A-3.5, A-3.6 und A-5.7 sind nicht nachgetragen; A-5.2 (`docs/spec.md:84`), A-13.6 (`:257`) und
I-14 (`:306`) führen das Ziehen unverändert als Vorgabe. Das liegt beim Auftraggeber (Board, Zeile
191) und ist von hier aus nicht zu schließen. Es bleibt trotzdem, was es ist: `CLAUDE.md` verlangt
Deckung durch eine Anforderungs-ID, und vier gebaute Fähigkeiten haben keine. Wer nach dieser
Runde in `docs/spec.md` nachschlägt, findet die Regelachsen nicht und das Ziehen sehr wohl.

---

## 2. E-058 Punkt 4 an allen Flächen

### 2.1 Die vierzehn Sätze

Zeichenweise gegen die Tabelle im Board bei T-093 gehalten: `pool-movement.ts:237-282` gibt in
allen acht Fällen genau das aus, was dort steht, einschließlich `null` für „Buchung, nichts
bewegt". `listPools` (`:146-150`) setzt deutsche Anführungszeichen, kein Gattungswort und die Form
`„A“, „B“ und „C“`. Die beiden Sätze, die E-058 Punkt 4 ausdrücklich geändert hat, stimmen: „…
erscheint sonst nirgends" und „… in keinem Pool und in keiner Spalte". Keine Fläche hält eine
Abschrift; `errorText.ts:59-68` teilt bewußt die **Form** der Aufzählung und nicht die Funktion,
und sagt das auch (`:38-46`).

### 2.2 Die Flächen, und ob der Satz für sich verständlich ist

| Fläche | Aufruf | Rahmen darüber | Bezug für „Es" |
|---|---|---|---|
| Toast Timerstart | `TimerContext.tsx:323`, `'past'`, Anlaß aus `doneCleared` | Titel „Timer gestartet. „X“ ist wieder offen." | **ja** |
| Toast Stopp | `TimerContext.tsx:122`, `'past'`, `'booking'` | Titel „Zeit gebucht.", Rumpf „Gebucht: 45 min." | **nein** |
| Toast verwaiste Buchung | `TimerContext.tsx:595-601` | Titel „Buchung abgeschlossen." | **nein** |
| `.reactivation__body` | `Timer.tsx:210-211`, `'past'`, `'reopen'` | „**X** ist wieder offen." | ja (nur Musterseite, siehe W-9) |
| Add-in, Ankündigung Buchung | `TaskPane.tsx:705`, `'future'`, `'booking'` | Callout „Was sich dadurch ändert" | ja, ausdrücklich begründet (`:708-713`) |
| Add-in, Ankündigung Wiederöffnen | `reopen.ts:159-166`, `'future'`, `'reopen'` | Callout „Dieses Todo ist erledigt. …" | ja |
| Add-in, Bestätigung Buchung | `reopen.ts:145-148`, `'past'`, `'booking'` | Callout mit dem **Todo-Titel** (`TaskPane.tsx:806`) | ja |
| Add-in, Bestätigung Wiederöffnen | `reopen.ts:169-180`, `'past'`, `'reopen'` | Callout „Gebucht. „X“ ist wieder offen." | ja |

Sieben von neun tragen über dem Satz etwas, worauf sich sein „Es" beziehen kann. Zwei nicht, und
beide liegen in der Hauptanwendung. Das Add-in hat diese Frage an **beiden** eigenen Flächen
gestellt und beantwortet; der Kommentar an `TaskPane.tsx:708-713` schreibt die Begründung sogar
aus. T-097 meldet den Rest selbst als offenen Punkt (Annahme 2). Er ist ein Befund, siehe W-5, und
er ist nicht am Satz zu beheben, sondern am Rahmen.

### 2.3 „Spalte" oder „Pool" — und ist das ein Problem?

Nein, und ich rate ausdrücklich davon ab, das Gattungswort zurückzuholen. Vier Gründe:

1. **Das alte Wort war nicht ungenau, sondern falsch.** „in dem Pool „Ost“" schickte den Benutzer
   in die Pool-Liste, wenn „Ost" eine reine Board-Spalte war. Ein falscher Wegweiser ist schlechter
   als keiner.
2. **Der Name ist ein Schlüssel.** `packages/storage/migrations/0001_initial.up.sql:181` führt
   `ux_pool_name` als UNIQUE über `name COLLATE NOCASE`. Ein Name bezeichnet genau eine Regel; der
   Benutzer findet sie in „Regeln", und dort steht der Anzeigeort als Etikett neben dem Namen
   (`TagsScreen.tsx:542-545`). Die fehlende Auskunft ist einen Blick entfernt und nicht mehrdeutig.
3. **Die Funktion darf es nicht wissen.** Sie bekommt drei Namenslisten, keine Fläche, und ein
   Rateschritt darin wäre genau der Fehler, den E-058 abgeschafft hat.
4. **Die eine Stelle, an der es kostet, ist eine andere.** Der Satz ohne Treffer nennt beide
   Flächen („in keinem Pool und in keiner Spalte"), die übrigen dreizehn nennen keine. Wer den
   negativen Satz gelesen hat, weiß, daß es zwei Orte gibt — und erfährt bei den anderen nie,
   welcher gemeint ist. Das ist die schärfste Form der Frage, und sie ist trotzdem kein Fehler: Die
   Asymmetrie ist richtig, weil der negative Satz beide Orte ausschließen muß, sonst sucht der
   Benutzer auf dem einen weiter.

Falls der Orchestrator mehr will, ist der billige Weg **nicht** ein Wort im Satz, sondern ein Weg
am Rahmen: ein „Regeln ansehen" als Toast-Aktion. Ich empfehle es nicht — der Toast trägt im
Wiederöffnen-Fall bereits „Rückgängig", und zwei Aktionen in einer Meldung sind eine zu viel.

Eine Nebenbemerkung, die in beide Rechnungen gehört: Die Begründung „zwei Pools dürfen denselben
Namen tragen" steht in `pool-movement.ts:76-80` und in `usecases/pool-movement.ts:54-60` — und sie
ist sachlich falsch (Punkt 2 oben). Die Bauart, die darauf gestützt wird, ist trotzdem die
richtige. Siehe W-8.

---

## 3. E-059

### 3.1 „Noch nicht abgerechnet" / „Abgerechnet"

Vollständig durchgezogen. Die Wörter stehen einmal (`labels.ts:328-332`) und werden an jeder
Fläche von dort geholt, an der der Exportstatus **einer Regel** erscheint: Optionszeile im
Formular (`PoolFormDialog.tsx:685-700`), Zusammenfassung unter jedem Spaltenkopf
(`BoardScreen.tsx:540`), Zeile der Regelverwaltung (`TagsScreen.tsx:560`), Vorschau im Formular
(`PoolFormDialog.tsx:743`) und Musterseite (`showcase/RuleSection.tsx:365-376`). Alle vier
Anzeigeflächen gehen über `poolRule.ts:295-303`; `EXPORT_TEXT` als zweite Fassung ist gelöscht und
die Stelle mit einer Notiz besetzt (`poolRule.ts:189-204`). Der Wert im Datenmodell bleibt `open`.

Ein Nachbefund, den E-059 selbst erzeugt hat: Eine Buchung im Anzeigezustand **„Nicht
abgerechnet"** (E-050, `ExportStatus.tsx:141-148`) steht in der Spalte **„Abgerechnet"** und
gerade nicht in „Noch nicht abgerechnet". Zwei fast gleiche Wörter, entgegengesetzte Wirkung.
Ausgesprochen wird das genau einmal, im Hilfssatz der Optionszeile (`labels.ts:351-352`, gezeigt in
`PoolFormDialog.tsx:699`) — also dort, wo gewählt wird, und nicht dort, wo gelesen wird. Siehe W-7.

### 3.2 „Vom Board nehmen" ohne Dialog

Umgesetzt und an beiden Flächen gleich: kein `ConfirmDialog` mehr, dafür „Rückgängig" im Toast
(`BoardScreen.tsx:208-236` und `:275-281`, `TagsScreen.tsx:484-507`). Löschen einer Regel fragt
weiterhin (`TagsScreen.tsx:615-624`), Löschen eines Ordners, Tags und Status ebenso. Der Rückweg
ist sauber gebaut: `previous` wird **vor** dem Aufruf gelesen, sonst führte „Rückgängig" auf sich
selbst (`BoardScreen.tsx:203-210`).

Die drei Fragen, die der Auftrag stellt:

**Zeitfenster.** In Ordnung. Eine Meldung mit Rückweg wird nicht abgeräumt
(`ToastContext.tsx:122-126`), und die Begründung nennt SC 2.2.1 beim Namen. Der Rückweg bleibt
stehen, bis er benutzt oder geschlossen wird. Eine Grenze gibt es dennoch: Der Stapel hält vier
Meldungen (`ToastContext.tsx:87`), und die fünfte verdrängt die älteste — auch eine mit Rückweg.
Siehe W-10.

**Fokus.** Der Fokus wandert nicht in den Toast. Wer mit der Tastatur arbeitet, muß bis ans Ende
des Dokuments tabulieren, um „Rückgängig" zu erreichen. Das verletzt keinen Erfolgskriterium —
aber seit E-059 ist der Rückweg der **einzige** Schutz vor der Handlung, und er ist zugleich das am
schlechtesten erreichbare Bedienelement der Seite. Entschärft wird das dadurch, daß die Handlung an
einer bleibenden Fläche umkehrbar ist: „Auf das Board" steht in derselben Zeile der Regelliste
(`TagsScreen.tsx:588`), „Als Spalte aufnehmen" im Spaltendialog (`BoardScreen.tsx:1028`). Deshalb
kein Befund gegen E-059 selbst, aber siehe W-6.

**Bildschirmleser.** Der Toast liegt in einer höflichen Live-Region und wird angesagt
(`ToastContext.tsx:108`). Eine Ausnahme, und sie ist ein Befund: Wird die Handlung **aus dem
Dialog** „Spalten des Boards" ausgelöst, liegt der Toast außerhalb eines `aria-modal="true"` mit
Tabulatorschleife. Beim Entfernen wird der Dialog vorher geschlossen (`BoardScreen.tsx:420-423`),
beim Aufnehmen nicht (`:419`) — und dort trägt der Toast einen Rückweg, den niemand mit Tastatur
oder Vorlesehilfe erreicht. Siehe W-6.

---

## 4. T-094 Annahme 1 — Exportachse ohne `ExportStatusBadge`

**Die Annahme trägt. Ich bestätige sie ausdrücklich, und ich nehme meine eigene Einschätzung aus
R-2 zurück.**

In R-2 hatte ich unter A-6.7 gelobt, daß die Exportachse sich `ExportStatusBadge` borgt. Das war
eine Verwechslung von zwei Sachen, die gleich heißen: A-6.5 bis A-6.7 verlangen, daß der
Exportstatus **einer Buchung** überall sichtbar ist. Eine Regel hat keinen Exportstatus; sie
**fragt** nach dem ihrer Buchungen. Das Etikett am Spaltenkopf ließ sich lesen als „diese Spalte
ist exportiert" — der Kopf von `RuleSummary.tsx:46-63` schreibt genau das aus, und er hat recht.

Drei Prüfungen, alle bestanden:

1. **Wortgleichheit statt Wiedererkennung ist hier das stärkere Mittel.** Das Etikett brachte sein
   eigenes Wort mit („Offen"), und im Formular stand damit drei Zeilen unter dem Optionsknopf „Noch
   nicht abgerechnet" eine Vorschau, die etwas anderes sagte. Eine Wahl, zwei Wörter — genau der
   Fehler, den E-059 abschafft. Die Vorschau nimmt jetzt dieselbe Beschriftung wie der Knopf
   (`poolRule.ts:301`).
2. **SC 1.4.1 ist erfüllt, und zwar besser als vorher.** Die Achse trägt Symbol (`download`,
   `RuleSummary.tsx:113`), das Wort „Exportstatus" als Achsenbeschriftung und den Wert als Text
   (`:194-198`). Die Farbfläche ist neutral — `--text-secondary` auf `--bg-inset`,
   `components.css:3941-3952` —, also gibt es keine Bedeutung, die allein an Farbe hinge. Der
   Kommentar an `components.css:3919-3924` benennt den Maßstab. Das entfallene Etikett war das
   einzige farbtragende Element dieser Fläche; sein Wegfall **verringert** die Abhängigkeit von
   Farbe.
3. **Die Wiedererkennung geht nicht verloren, sie wechselt nur die Fläche.**
   `ExportStatusBadge` steht unverändert an jeder Buchung (`BookingTable.tsx:245`,
   `ExportGroups.tsx`, Detailansicht, Protokoll). Die 19 Orte aus A-6.5/A-6.7 sind Buchungsorte;
   keiner davon ist eine Regel.

Kein Befund. Die richtige Zusammenfassung dieser Entscheidung steht bereits im Quelltext und muß
nur stehenbleiben.

---

## 5. T-097 — Löschdialoge und die beiden offenen Fragen

### 5.1 Wortlaut und Konsistenz

Der Satz lautet „Betroffen ist Regel „Ost“." beziehungsweise „Betroffen sind Regel „Ost“, Regel
„Nord“ und Regel „Abrechnung“." (`errorText.ts:98-104`). Er ist an drei Dialogen derselbe: Ordner
und Tag über `TagsScreen.tsx:451`, Status über `StatusSettings.tsx:258-259`. Die Aufzählungsform
entspricht `listPools`. Gemessene Wortlaute liegen in T-097 vor.

Zur Lesbarkeit: „Betroffen sind Regel „Ost“, Regel „Nord“ und Regel „Abrechnung“." wiederholt das
Gattungswort dreimal und liest sich hölzern; „Betroffen sind die Regeln „Ost“, „Nord“ und
„Abrechnung“." wäre besseres Deutsch. Ich stimme der Annahme 1 aus T-097 trotzdem **zu**: Den
Namen aus fremdem Text herauszuschneiden, um ihn schöner zu setzen, bricht still, sobald der Dienst
seinen Wortlaut ändert. Wenn der Satz besser werden soll, muß der Dienst den Namen als eigenes
Feld liefern, nicht die Oberfläche ihn herausschneiden. Das ist ein Vorschlag an den domain-dev und
kein Befund gegen T-097 (W-11).

Sachlich richtig und gut ist der Nebenbefund, den T-097 mitbehoben hat: Der Satz „Zwischen dem
Zählen und dem Löschen ist offenbar ein Todo dazugekommen" entfällt genau dann, wenn der Dienst
Regeln genannt hat (`StatusSettings.tsx:422-434`). Er war für diesen Grund schlicht falsch.

### 5.2 Offene Frage 1 — Ordner-Löschdialog nach der Absage

**Bedienfehler, nicht hinnehmbar — aber kleiner Aufwand und mit einer Auflage an die Reihenfolge.**

`TagsScreen.tsx:413-431`: Nach der Absage steht in `consequence` die Meldung des Dienstes, während
der Titel weiter „Ordner löschen?" fragt und der Knopf weiter „Löschen" heißt. Der Dialog stellt
eine Frage, die bereits beantwortet ist, und bietet als Hauptaktion an, was gerade gescheitert ist.
`StatusSettings.tsx:401-436` macht es an derselben Stelle richtig und begründet es im Kommentar
darüber. Zwei Muster für denselben Vorgang lehren, daß eines davon keine Bedeutung hat — dieselbe
Begründung, mit der E-059 die zwei Schutzniveaus von „Vom Board nehmen" aufgelöst hat.

Schwerer wiegt der Teil, den T-097 nicht nennt: **Die Absage wird nicht angesagt.** `consequence`
liegt in `aria-describedby` (`ConfirmDialog.tsx:117`, `:129-136`) und ist keine Statusmeldung. Wer
mit einer Vorlesehilfe „Löschen" betätigt, hört nichts; der Dialog steht unverändert da. Das ist
SC 4.1.3 und gilt für **beide** Dialoge — `StatusSettings` ist nur deshalb halb gerettet, weil der
Knopf, auf dem der Fokus steht, seinen Namen wechselt und Vorlesehilfen das melden. Beim
Ordner-Dialog wechselt nichts.

Die Reihenfolge ist die Auflage: `tests/e2e/tag-folder-rule-lock.spec.ts` greift den Dialog **nach**
dem gescheiterten Versuch über `getByRole('alertdialog', { name: 'Ordner löschen?' })` ab. T-099
läuft gerade in derselben Datei. Zwei Agenten in derselben Welle daran erzeugen genau die Kollision,
die `CLAUDE.md` verbietet. Vorschlag: eine Aufgabe in der nächsten Welle, frontend-dev, und der
e2e-tester zieht den Selektor im selben Zug oder danach nach — Zuweisung durch den Orchestrator.

### 5.3 Offene Frage 3 — Ansage beim erneuten Laden

**Nein. Weder für `visibilitychange` noch als eigene Ansage für `revisit`.**

1. `visibilitychange` ist keine Handlung des Benutzers an dieser Anwendung. Wer aus Outlook
   zurückkommt, hat nicht „aktualisieren" gewählt; eine Ansage bei jedem Fensterwechsel ist
   Geräusch und nichts sonst. `useDataFreshness.ts:92-99` löst sie mehrmals je Sitzung aus.
2. `revisit` ist eine Handlung — aber die ehrliche Rückmeldung darauf lautet „hier ist die Ansicht,
   wie sie jetzt ist", und die steht bereits da. Eine Ansage „Ansicht aktualisiert" behauptet in
   den meisten Fällen ein Ereignis, das keines war.
3. Vor allem: Eine Rückmeldung, die es **nur** für Bildschirmleser gibt, ist keine Rückmeldung,
   sondern eine zweite Anwendung. Abschnitt 15 verlangt sichtbare Rückmeldung; die richtige Antwort
   ist deshalb nicht eine versteckte Ansage, sondern der bereits vorhandene sichtbare Zustand.
   `RefreshHint` (`screens/parts.tsx:130-136`) sagt „Wird aktualisiert …" und steht auf vier von elf
   Ansichten. Wenn hier etwas zu tun ist, dann das: den vorhandenen Zustand auf die übrigen
   Ansichten bringen. Siehe W-12.

---

## 6. Ist das Verhalten stabil genug für das Benutzerhandbuch?

**Ja, für beide Kapitel, mit einer Auflage an den Dokumentierer.**

Stabil ist: die Nicht-Existenz des Ziehens (E-054, seit drei Wellen unverändert), Spalte = Regel
mit fünf Bedingungen (E-055 samt Korrekturabsatz), die drei Wirkungen von I-05 und ihre Meldung
(E-058, eine Quelle, vierzehn festgeschriebene Sätze, Nachweispfad), die Wörter des Exportstatus
einer Regel (E-059) und „Vom Board nehmen" ohne Rückfrage (E-059).

Offen bleibt genau eines, und es ist beschreibbar statt blockierend: Der Toast nach dem
Umschalten von „Erledigt" schweigt über die Spalten (O-U). Das Handbuch kann das sagen, wie es ist.

**Auflage: der Wortlaut wird beschrieben, nicht zitiert.** `docs/benutzerhandbuch.md:169-170`
zitiert heute den gestrichenen Satz Zeichen für Zeichen. Ein Zitat wäre die **fünfte** Abschrift
eines Textes, dessen Zeichengleichheit `proof:addin` bewacht — und die einzige, die kein
Nachweispfad erreicht. Richtig ist: „Takt nennt, in welchen Pools und Spalten das Todo danach steht
und aus welchen es verschwindet, und bietet „Rückgängig" an." Der Text dafür steht fast wörtlich in
`BoardScreen.tsx:749-771` und in `labels.ts:384-397`.

---

## 7. Restpunkte S-xx / H-xx und C-xx (O-Q)

Mit Welle A bis C erledigt: alle zehn S-Punkte, alle vier H-Punkte (Tabelle in 1.2), dazu aus
T-025 **C-03** (dieselbe Handlung, zwei Auskünfte — jetzt buchstäblich eine Quelle) und **C-24**
(zwei Fassungen desselben Satzes). **C-17** (Timerknopf, `Timer.tsx:82-92`), **C-20**
(`WorkstationFacts` in `SettingsScreen`) und **C-23** (`doneFlagState` in S-02, S-03, S-05, S-01)
waren schon vorher geschlossen.

Unverändert offen und von Welle A bis C **nicht berührt**, weil außerhalb ihres Zuschnitts: C-12
(Dashboard ohne Exportsummen), C-13 (gerundeter Wert am Gruppenkopf), C-14 (vier der acht Filter
aus I-10 fehlen, darunter Tag und Pool), C-15 (Vermerk ohne Rückfrage beim Verlassen), C-16
(Buchungszeilen in S-05 ohne Aktionen), C-18 („Zielordner" für zwei Sachen), C-19 (Vorschau aus der
gespeicherten statt der entworfenen Vorlage), C-21 (keine Warnung vor einem Feld, das die Vorlage
nicht füllen kann), C-22 (globale Suche ohne Gruppierung nach Trefferart). Dazu aus R-2 unverändert
A-4.4 halb (`TagsScreen`-Ordnersuche ist da, die Hierarchie fehlt weiter) und A-13.6.

Mein Rat zu O-Q, unverändert seit R-2: Diese neun gehören in **eine** eigene Aufgabe mit eigener
Reihenfolge, nicht in die Restspalte einer Reviewrunde. Sie sind seit T-025 mitgeschleppt worden,
und jede Runde bestätigt sie neu, ohne daß sich etwas ändert.

---

## 8. Befunde

Keiner blockiert. Reihenfolge nach Gewicht.

### Wesentlich

```
W-1  E-058 Absatz 2, A-2.5   apps/local-api/openapi/takt-local-api.yaml:2961-2963
     „Was geschehen ist, sagt die Antwort … `doneCleared` und `poolNames`. Die Kanban-Spalte
     bleibt, wo sie ist (E-023) — Erledigt und Spalte sind zwei Achsen."
     Das ist die letzte lebende Abschrift des Satzes, den E-058 ersatzlos gestrichen hat, und
     sie steht ausgerechnet an der Add-in-Buchungsroute — dem Vorgang, für den E-056
     geschrieben wurde. `proof:addin` bewacht den Quelltext, nicht diese Datei. Die
     Timer-Start-Route ist an derselben Stelle bereits richtiggestellt (:1610-1622) und
     nennt den Grund; hier ist es unterblieben.
     Richtig wäre: derselbe Absatz wie an `/timer/start`, plus der Verweis auf
     `enteringPoolNames`/`leavingPoolNames`, die zwei Zeilen tiefer ohnehin beschrieben sind.
     Wer: domain-dev (die Datei außerhalb `routes/addin` ist seine Hoheit; Zuschnitt nach
     E-053 durch den Orchestrator bestätigen).

W-2  E-055, A-2.5   packages/domain/src/time-entry.ts:111-112
     An `TimerStartResult.doneCleared`: „Es gibt kein Feld für eine neue Spalte. Der Start hebt
     nur das Erledigt-Kennzeichen auf; die Karte bleibt, wo sie ist."
     Der erste Halbsatz stimmt, der zweite ist derselbe Irrtum wie B-1 — und er steht in der
     Domäne, drei Dateien neben `pool-movement.ts`, das ihn als falsch begräbt. Wer den Typ
     liest, um zu verstehen, was ein Start bewirkt, liest zuerst die falsche Fassung.
     Richtig wäre: „Der Start hebt nur das Erledigt-Kennzeichen auf. Ob die Karte dadurch eine
     Spalte wechselt, entscheidet die Regel (E-055); die Bewegung liefert `poolMovement` an der
     Route." Wer: domain-dev.

W-3  E-055   packages/storage/src/sqlite/repo-todos.ts:567
     „A-2.4 — Erledigt setzen. Die Kanban-Spalte bleibt, wo sie ist (E-023)." Dieselbe Sache
     an `markDone`, und hier zusätzlich in die andere Richtung falsch: Das **Setzen** von
     „Erledigt" bewegt eine Karte aus jeder Spalte mit `completion: 'open'` heraus. Genau
     dieser Fall ist O-U. Wer: domain-dev.

W-4  E-055, D-3 aus R-2   docs/architektur.md:334-344
     „Die Kanban-Spalte ist … eine Regel über Tags. Ein Timerstart … die Karte steht danach in
     denselben Spalten wie zuvor" und „erscheint ohne weiteren Schritt wieder in seinen Pools,
     weil es sie nie verlassen hat."
     Dieselbe Datei erklärt in :105-111 ausführlich, daß genau dieser Satz falsch war. Ein
     Dokument, das sich auf 230 Zeilen Abstand selbst widerspricht, ist schlechter als eines,
     das nur an einer Stelle irrt: Wer die zweite Stelle zuerst liest, hält die erste für
     überholt. Seit R-2 unverändert.
     Richtig wäre: „über Tags" streichen (fünf Bedingungen), den Satz über die gleichbleibenden
     Spalten durch die Bedingung ersetzen („solange keine Regel nach „Erledigt" oder dem
     Exportstatus fragt") und auf `poolMovement` verweisen.
     Wer: Zuweisung durch den Orchestrator — die Datei gehört nicht dem Dokumentierer.

W-5  E-058 Punkt 4, Abschnitt 16   apps/web/src/app/TimerContext.tsx:412/450 und :595-601
     Der Stopp-Toast liest sich „Zeit gebucht. — Gebucht: 45 min. Es steht jetzt in „Ost“."
     Über dem Satz steht kein Todo; „Es" hat keinen Bezug. Beim Wechsel nach A-6.8 stehen zwei
     Meldungen übereinander, die beide mit „Es" beginnen und **verschiedene** Todos meinen —
     die des verlassenen Todos nennt seinen Namen nirgends. Dasselbe beim Toast der verwaisten
     Buchung, wo zwischen Ereignis und Meldung ein Programmabsturz liegt.
     Das Add-in hat diese Frage an beiden eigenen Flächen gestellt und mit einem Rahmen
     beantwortet (TaskPane.tsx:708-713, :806). Die Hauptanwendung hat es nur beim Start getan.
     Richtig wäre der Rahmen, nicht der Satz: Titel „Zeit gebucht auf „X“." bzw. „Buchung auf
     „X“ abgeschlossen." Der Satz aus der Domäne bleibt unangetastet und damit zeichengleich.
     Wer: frontend-dev.

W-6  E-059, SC 2.1.1/4.1.2   apps/web/src/screens/BoardScreen.tsx:419 gegen :420-423
     Im Dialog „Spalten des Boards" schließt „Vom Board nehmen" den Dialog vor dem Toast,
     „Als Spalte aufnehmen" nicht. Zwei Nachbarknöpfe, zwei Verhalten — und der zweite legt
     seinen Rückweg in einen Toast, der außerhalb eines `aria-modal="true"` mit
     Tabulatorschleife liegt (`FormDialog.tsx:162-170`). Für Tastatur und Vorlesehilfe ist
     „Rückgängig" dort nicht vorhanden. Seit E-059 ist der Rückweg der einzige Schutz vor der
     Handlung.
     Richtig wäre eines von beiden, für beide Knöpfe gleich: entweder den Dialog in beiden
     Fällen schließen, oder im Dialog keine Meldung mit Rückweg zeigen und stattdessen die
     Zeile an Ort und Stelle umschalten — die Gegenhandlung steht dort ohnehin.
     Wer: frontend-dev.

W-7  E-059, E-047, E-050   apps/web/src/lib/labels.ts:328-352 gegen components/ExportStatus.tsx:141-148
     Eine Buchung heißt „Nicht abgerechnet", und das Todo, an dem sie hängt, steht deshalb in
     der Spalte „Abgerechnet" und nicht in „Noch nicht abgerechnet". Zwei fast gleiche Wörter
     mit entgegengesetzter Wirkung. Ausgesprochen wird der Widerspruch nur im Hilfssatz der
     Optionszeile — also beim Einrichten, nicht beim Lesen. Wer eine so benannte Spalte erbt
     oder nur ansieht, bekommt kein Wort.
     Richtig wäre der Satz an der Lesefläche, wo er hingehört: `RuleSummary` kann ihn an der
     Exportachse führen (als Zusatzzeile wie `rule-summary__unreachable`), wenn `exportState`
     auf `exported` steht. Nicht als Umbenennung — E-059 ist entschieden, und die Wörter des
     Auftraggebers stehen.
     Wer: frontend-dev, klein.
```

### Hinweis

```
W-8  Belegfehler   packages/domain/src/pool-movement.ts:76-80,
     apps/local-api/src/usecases/pool-movement.ts:54-60
     Beide begründen „Namen statt Kennungen" bzw. „Regeln statt Namen vergleichen" mit „Zwei
     Pools dürfen denselben Namen tragen". Sie dürfen nicht:
     packages/storage/migrations/0001_initial.up.sql:181 führt `ux_pool_name` als UNIQUE über
     `name COLLATE NOCASE`, und keine spätere Migration hebt das auf. Die Bauart bleibt
     richtig — sie ist nur aus einem anderen Grund richtig (ein Zustandsvergleich über zwei
     Abfragen kann `enters` grundsätzlich nicht liefern). Eine Begründung, die auf einer
     falschen Zusicherung steht, hält den nächsten Umbau nicht auf.
     Wer: domain-dev, zwei Kommentare.

W-9  Musterseite   apps/web/src/components/Timer.tsx:196 (`ReactivationNotice`)
     Der Baustein wird von keiner Ansicht der Anwendung mehr benutzt — nur von
     showcase/TimeSection.tsx:144,185 und showcase/BoardSection.tsx:373. In der Anwendung
     tragen den I-05-Fall der Toast und das Etikett „Erledigt aufgehoben" an der Zeile. Die
     Musterseite ist die abgenommene visuelle Referenz (E-013, E-024); sie zeigt damit eine
     Fläche, die es im Produkt nicht gibt.
     Entweder in S-03 einsetzen (die Detailansicht ist die naheliegende Fläche für I-05) oder
     auf der Musterseite als „nicht plaziert" kennzeichnen. Wer: frontend-dev.

W-10 SC 2.2.1, Randfall   apps/web/src/app/ToastContext.tsx:87
     `previous.slice(-3)` hält höchstens vier Meldungen; die fünfte verdrängt die älteste,
     auch eine mit „Rückgängig". Seit E-059 ist dieser Rückweg der einzige Schutz vor „Vom
     Board nehmen". Selten, aber still.
     Vorschlag: beim Verdrängen Meldungen mit Aktion überspringen. Wer: frontend-dev.

W-11 Vertragsschnitt   apps/web/src/lib/errorText.ts:98-104
     „Betroffen sind Regel „Ost“, Regel „Nord“ und Regel „Abrechnung“." — dreimal dasselbe
     Gattungswort. Besser wäre „die Regeln „Ost“, „Nord“ und „Abrechnung“", und das geht nur,
     wenn der Dienst den **Namen** als eigenes Feld liefert statt in `message`. Die Oberfläche
     soll ihn keinesfalls herausschneiden (Annahme 1 aus T-097 ist richtig).
     Vorschlag an den domain-dev: `details[].name` neben `field` und `message`. Kein Zwang.

W-12 Abschnitt 15   apps/web/src/screens/parts.tsx:130-136
     `RefreshHint` steht auf vier von elf Ansichten (Board, Buchungen, Exportprotokoll,
     Todo-Liste). Seit T-097 lädt jede Ansicht bei `visibilitychange` und beim erneuten
     Ansteuern nach — auf den übrigen sieben ändert sich der Inhalt also ohne jedes Zeichen.
     Das ist zugleich meine Antwort auf T-097 Frage 3: kein neuer Kanal für Bildschirmleser,
     sondern der vorhandene sichtbare Zustand überall. Wer: frontend-dev.

W-13 Sprache, Restvorkommen
     „Regel über Tags" außerhalb der Oberfläche: openapi/takt-local-api.yaml:912, :1085,
     :1271 · docs/datenmodell.md:84, :747, :1790 · docs/architektur.md:335 ·
     docs/testplan.md:21, :838 · packages/domain/src/board.ts:12, todo.ts:5, tag.ts:197 ·
     apps/local-api/src/usecases/board.ts:11 · apps/web/src/components/Kanban.tsx:144 ·
     apps/web/design/DESIGNSYSTEM.md:623 („keine Poolregel") ·
     openapi/takt-local-api.yaml:3030 („keine Poolregel").
     In den Migrationen 0009/0010 ist der Satz Geschichtsschreibung und bleibt richtig, wo er
     steht. `Kanban.tsx:144` und `DESIGNSYSTEM.md:623` gehören dem frontend-dev, die OpenAPI-
     und `docs/`-Stellen dem domain-dev bzw. der Zuweisung des Orchestrators; das Board führt
     „„Regel über Tags" in `docs/`" bereits beim Dokumentierer.

W-14 Sprache, Toastpaar   BoardScreen.tsx:218 gegen TagsScreen.tsx:492-493
     Dieselbe Handlung meldet sich zweimal verschieden: „Spalte vom Board genommen." mit
     „„Ost“ — Pool." (POOL_PLACEMENT_SHORT) gegen „Anzeigeort geändert." mit „„Ost“ —
     Anzeigeort: Nur in den Pools." (POOL_PLACEMENT_LABEL). Und der Rückweg quittiert auf dem
     Board mit „Anzeigeort wiederhergestellt.", in der Regelliste noch einmal mit „Anzeigeort
     geändert." — wer „Rückgängig" drückt, liest denselben Titel wie zuvor.
     Vorschlag: die Board-Fassung auf beiden Flächen. Wer: frontend-dev.

W-15 OpenAPI   takt-local-api.yaml:3023-3040, :3041-3059, :3060 ff.
     `poolNames`/`enteringPoolNames`/`leavingPoolNames` sind durchgehend als „die Pools"
     beschrieben. Seit T-090/T-092 rechnet dieselbe Route über `list('all')`, die Listen
     enthalten also auch reine Board-Spalten. Der Feldname bleibt (O-T), die Beschreibung
     sollte „Regeln — Pools wie Board-Spalten" sagen. Mit O-T zusammen zu erledigen.
```

---

## 9. Auflagen zur Freigabe

1. **W-1 bis W-3 vor dem Dokumentierer.** Drei Kommentare beziehungsweise Absätze. Der
   Dokumentierer liest die Schnittstellenbeschreibung; steht dort noch der gestrichene Satz,
   schreibt er ihn ins Handbuch zurück, und D-2 entsteht ein zweites Mal.
2. **D-1 und D-2 wie geplant.** Mit der Auflage aus Abschnitt 6: beschreiben, nicht zitieren.

Alles Übrige ist Nacharbeit ohne Sperrwirkung und gehört in eine Welle nach dem Tor. Meine
Reihenfolge, wenn gefragt: W-5 (zwei Toasts), 5.2 (Ordner-Dialog samt Ansage, mit dem e2e-tester
abgestimmt), W-6, W-7, dann der Rest.

---

## 10. Was ich dem Orchestrator zu den offenen Punkten rate

**O-U — liefern `PUT`/`DELETE /todos/{id}/done` ein `poolMovement`, und braucht es einen dritten
Anlaß?** Ja zum ersten, nein zum zweiten. Die beiden vorhandenen Anlässe beantworten die Frage
vollständig, weil sie nicht Routen bezeichnen, sondern zwei verschiedene Fragen an dieselben drei
Listen:

- `DELETE /done` — das Kennzeichen fällt. Das ist Zeichen für Zeichen der Fall des Timerstarts
  ohne den Timer: Das Todo war erledigt, es kehrt zurück, „wieder" ist wahr, und `appears` ist die
  richtige Liste. Anlaß `'reopen'`.
- `PUT /done` — das Kennzeichen wird gesetzt. Es gibt keine Vorgeschichte, „wieder" wäre erfunden,
  und eine Aufzählung von `appears` wäre lauter Unverändertes. Anlaß `'booking'`.

Der Wertname `'booking'` heißt dann an einer Stelle etwas, an der keine Buchung entsteht. Das ist
der Preis, und er ist der kleinere: Die Werte stehen in der Signatur, gegen die beide Oberflächen
und vierzehn Prüffälle gebaut sind. Ich rate zu einem Satz an `PoolMovementOccasion` statt zu einer
Umbenennung — „`'booking'` heißt: Bewegung ohne Vorgeschichte."

**O-K, O-E** — unverändert wie in R-2, Abschnitt 10. Nichts in Welle A bis C ändert die Lage.

---

## Urteil

**Freigegeben** für Welle A bis C, unter den zwei Auflagen aus Abschnitt 9.

Kein blockierender Befund. Die fünf blockierenden aus R-2 sind erledigt, und die Art, wie sie
erledigt sind, ist der eigentliche Fortschritt dieses Branches: Ein Satz, der an vier Flächen
zugleich falsch war, ist nicht viermal berichtigt, sondern einmal gestrichen und durch **eine**
Funktion ersetzt worden, die an fünf Flächen dieselbe Wahrheit sagt und deren vierzehn Wortlaute
zeichengenau gemessen werden. Dazu kommt eine Rechnung, die Regeln mit sich selbst vergleicht statt
Namen mit Namen, und drei statische Wachen, die die Rückkehr der zweiten Fassung verhindern. Das
ist der Maßstab, den ich in R-2 an anderer Stelle vermißt habe.

Was bleibt, sind Abschriften in Dateien, die niemand für eine Oberfläche hält — und die trotzdem
gelesen werden.
